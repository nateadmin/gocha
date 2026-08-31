<?php

namespace Tests\Feature;

use App\Models\User;
use App\Support\AccountChannel;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class AuthPhoneOtpTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        config([
            'gocha.firebase.web_api_key' => 'test-firebase-key',
            'gocha.firebase.project_id' => 'gocha-test',
            'gocha.firebase.auth_domain' => 'gocha-test.firebaseapp.com',
            'gocha.firebase.app_id' => '1:1:web:test',
        ]);
    }

    public function test_meta_reports_phone_sign_in_when_firebase_is_configured(): void
    {
        $this->getJson('/api/meta')
            ->assertOk()
            ->assertJsonPath('account.phoneSignInEnabled', true)
            ->assertJsonPath('auth.phoneSignInEnabled', true)
            ->assertJsonPath('auth.firebase.projectId', 'gocha-test');
    }

    public function test_phone_signup_requires_recaptcha(): void
    {
        $this->postJson('/api/auth/otp/request', [
            'channel' => AccountChannel::PHONE,
            'identifier' => '+15551234567',
            'mode' => 'signup',
        ])
            ->assertStatus(422)
            ->assertJsonPath('code', 'RECAPTCHA_REQUIRED');
    }

    public function test_phone_signup_request_sends_firebase_sms(): void
    {
        Http::fake([
            'https://identitytoolkit.googleapis.com/v1/accounts:sendVerificationCode*' => Http::response([
                'sessionInfo' => 'sess-signup',
            ], 200),
        ]);

        $this->postJson('/api/auth/otp/request', [
            'channel' => AccountChannel::PHONE,
            'identifier' => '15551234567',
            'mode' => 'signup',
            'recaptchaToken' => 'test-recaptcha',
        ])
            ->assertOk()
            ->assertJsonPath('message', 'A verification code has been sent to your phone.');

        $this->assertDatabaseCount('login_otps', 1);
        $this->assertDatabaseHas('login_otps', [
            'channel' => AccountChannel::PHONE,
            'identifier' => '+15551234567',
        ]);
    }

    public function test_phone_signup_verify_creates_user_without_email(): void
    {
        Http::fake([
            'https://identitytoolkit.googleapis.com/v1/accounts:sendVerificationCode*' => Http::response([
                'sessionInfo' => 'sess-signup',
            ], 200),
            'https://identitytoolkit.googleapis.com/v1/accounts:signInWithPhoneNumber*' => Http::response([
                'phoneNumber' => '+15551239999',
            ], 200),
        ]);

        $this->postJson('/api/auth/otp/request', [
            'channel' => AccountChannel::PHONE,
            'identifier' => '+15551239999',
            'mode' => 'signup',
            'recaptchaToken' => 'test-recaptcha',
        ])->assertOk();

        $this->postJson('/api/auth/otp/verify', [
            'channel' => AccountChannel::PHONE,
            'identifier' => '+15551239999',
            'code' => '123456',
            'mode' => 'signup',
        ])
            ->assertOk()
            ->assertJsonPath('user.phone', '+15551239999')
            ->assertJsonPath('user.email', null)
            ->assertJsonPath('user.phoneVerified', true)
            ->assertJsonPath('user.emailVerified', false)
            ->assertJsonPath('user.primaryLoginChannel', AccountChannel::PHONE)
            ->assertJsonPath('user.needsOnboarding', true);

        $this->assertDatabaseHas('users', [
            'phone' => '+15551239999',
            'email' => null,
            'primary_login_channel' => AccountChannel::PHONE,
        ]);
    }

    public function test_phone_signin_rejects_unknown_number(): void
    {
        $this->postJson('/api/auth/otp/request', [
            'channel' => AccountChannel::PHONE,
            'identifier' => '+15550000000',
            'mode' => 'signin',
            'recaptchaToken' => 'test-recaptcha',
        ])
            ->assertStatus(422)
            ->assertJsonPath('code', 'PHONE_NOT_FOUND');
    }

    public function test_phone_signin_rejects_unverified_number(): void
    {
        User::factory()->create([
            'email' => 'has-phone@example.com',
            'phone' => '+15551112222',
            'phone_verified_at' => null,
        ]);

        $this->postJson('/api/auth/otp/request', [
            'channel' => AccountChannel::PHONE,
            'identifier' => '+15551112222',
            'mode' => 'signin',
            'recaptchaToken' => 'test-recaptcha',
        ])
            ->assertStatus(422)
            ->assertJsonPath('code', 'PHONE_NOT_FOUND');
    }

    public function test_phone_user_can_link_email_and_keep_phone_primary(): void
    {
        $user = User::factory()->phonePrimary('+15553334444')->create();

        $this->actingAs($user)->postJson('/api/auth/otp/request', [
            'channel' => AccountChannel::EMAIL,
            'identifier' => 'linked@example.com',
            'mode' => 'link',
        ])->assertOk();

        $code = '654321';
        \App\Models\LoginOtp::query()
            ->where('channel', AccountChannel::EMAIL)
            ->where('identifier', 'linked@example.com')
            ->update(['code_hash' => \Illuminate\Support\Facades\Hash::make($code)]);

        $this->actingAs($user)->postJson('/api/auth/otp/verify', [
            'channel' => AccountChannel::EMAIL,
            'identifier' => 'linked@example.com',
            'code' => $code,
            'mode' => 'link',
        ])
            ->assertOk()
            ->assertJsonPath('user.email', 'linked@example.com')
            ->assertJsonPath('user.emailVerified', true)
            ->assertJsonPath('user.phone', '+15553334444')
            ->assertJsonPath('user.primaryLoginChannel', AccountChannel::PHONE);

        $this->assertDatabaseMissing('users', [
            'id' => $user->id,
            'email' => null,
        ]);
    }

    public function test_email_user_can_link_verified_phone(): void
    {
        $user = User::factory()->create(['email' => 'owner@example.com']);

        Http::fake([
            'https://identitytoolkit.googleapis.com/v1/accounts:sendVerificationCode*' => Http::response([
                'sessionInfo' => 'sess-link',
            ], 200),
            'https://identitytoolkit.googleapis.com/v1/accounts:signInWithPhoneNumber*' => Http::response([
                'phoneNumber' => '+15556667777',
            ], 200),
        ]);

        $this->actingAs($user)->postJson('/api/auth/otp/request', [
            'channel' => AccountChannel::PHONE,
            'identifier' => '+15556667777',
            'mode' => 'link',
            'recaptchaToken' => 'test-recaptcha',
        ])->assertOk();

        $this->actingAs($user)->postJson('/api/auth/otp/verify', [
            'channel' => AccountChannel::PHONE,
            'identifier' => '+15556667777',
            'code' => '111111',
            'mode' => 'link',
        ])
            ->assertOk()
            ->assertJsonPath('user.phone', '+15556667777')
            ->assertJsonPath('user.phoneVerified', true)
            ->assertJsonPath('user.email', 'owner@example.com')
            ->assertJsonPath('user.primaryLoginChannel', 'email');
    }

    public function test_link_rejects_identifier_owned_by_another_account(): void
    {
        User::factory()->create(['email' => 'taken@example.com']);
        $user = User::factory()->phonePrimary('+15558889999')->create();

        $this->actingAs($user)->postJson('/api/auth/otp/request', [
            'channel' => AccountChannel::EMAIL,
            'identifier' => 'taken@example.com',
            'mode' => 'link',
        ])
            ->assertStatus(422)
            ->assertJsonPath('code', 'EMAIL_ALREADY_REGISTERED');
    }

    public function test_link_requires_authentication(): void
    {
        $this->postJson('/api/auth/otp/request', [
            'channel' => AccountChannel::EMAIL,
            'identifier' => 'new@example.com',
            'mode' => 'link',
        ])
            ->assertStatus(401);
    }
}
