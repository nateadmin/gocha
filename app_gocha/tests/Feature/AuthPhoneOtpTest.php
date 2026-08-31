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

    public function test_phone_signup_request_does_not_need_recaptcha_on_the_server(): void
    {
        $this->postJson('/api/auth/otp/request', [
            'channel' => AccountChannel::PHONE,
            'identifier' => '15551234567',
            'mode' => 'signup',
        ])
            ->assertOk()
            ->assertJsonPath('message', 'A verification code has been sent to your phone.');

        $this->assertDatabaseHas('login_otps', [
            'channel' => AccountChannel::PHONE,
            'identifier' => '+15551234567',
        ]);
    }

    public function test_phone_signup_verify_creates_user_without_email(): void
    {
        Http::fake([
            'https://identitytoolkit.googleapis.com/v1/accounts:lookup*' => Http::response([
                'users' => [['phoneNumber' => '+15551239999']],
            ], 200),
        ]);

        $this->postJson('/api/auth/otp/request', [
            'channel' => AccountChannel::PHONE,
            'identifier' => '+15551239999',
            'mode' => 'signup',
        ])->assertOk();

        $this->postJson('/api/auth/otp/verify', [
            'channel' => AccountChannel::PHONE,
            'identifier' => '+15551239999',
            'code' => '123456',
            'mode' => 'signup',
            'firebaseIdToken' => 'test-id-token',
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

    public function test_phone_verify_rejects_token_for_a_different_number(): void
    {
        Http::fake([
            'https://identitytoolkit.googleapis.com/v1/accounts:lookup*' => Http::response([
                'users' => [['phoneNumber' => '+15550001111']],
            ], 200),
        ]);

        $this->postJson('/api/auth/otp/request', [
            'channel' => AccountChannel::PHONE,
            'identifier' => '+15551239999',
            'mode' => 'signup',
        ])->assertOk();

        $this->postJson('/api/auth/otp/verify', [
            'channel' => AccountChannel::PHONE,
            'identifier' => '+15551239999',
            'code' => '123456',
            'mode' => 'signup',
            'firebaseIdToken' => 'test-id-token',
        ])
            ->assertStatus(422)
            ->assertJsonPath('code', 'OTP_INVALID');
    }

    public function test_phone_signin_rejects_unknown_number(): void
    {
        $this->postJson('/api/auth/otp/request', [
            'channel' => AccountChannel::PHONE,
            'identifier' => '+15550000000',
            'mode' => 'signin',
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
            'https://identitytoolkit.googleapis.com/v1/accounts:lookup*' => Http::response([
                'users' => [['phoneNumber' => '+15556667777']],
            ], 200),
        ]);

        $this->actingAs($user)->postJson('/api/auth/otp/request', [
            'channel' => AccountChannel::PHONE,
            'identifier' => '+15556667777',
            'mode' => 'link',
        ])->assertOk();

        $this->actingAs($user)->postJson('/api/auth/otp/verify', [
            'channel' => AccountChannel::PHONE,
            'identifier' => '+15556667777',
            'code' => '111111',
            'mode' => 'link',
            'firebaseIdToken' => 'test-id-token',
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
