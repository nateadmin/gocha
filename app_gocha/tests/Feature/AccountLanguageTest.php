<?php

namespace Tests\Feature;

use App\Models\LoginOtp;
use App\Models\User;
use App\Support\AccountChannel;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class AccountLanguageTest extends TestCase
{
    use RefreshDatabase;

    public function test_meta_lists_supported_languages(): void
    {
        $this->getJson('/api/meta')
            ->assertOk()
            ->assertJsonPath('defaultLanguage', 'en')
            ->assertJsonFragment(['code' => 'en', 'name' => 'English'])
            ->assertJsonFragment(['code' => 'he', 'nativeName' => 'עברית']);
    }

    public function test_signup_defaults_english_for_us_country(): void
    {
        $this->signupEmail('us@example.com', [
            'country' => 'US',
        ])->assertOk()
            ->assertJsonPath('user.language', 'en');

        $this->assertDatabaseHas('users', [
            'email' => 'us@example.com',
            'language' => 'en',
        ]);
    }

    public function test_signup_defaults_hebrew_for_israel_country(): void
    {
        $this->signupEmail('israel@example.com', [
            'country' => 'IL',
        ])->assertOk()
            ->assertJsonPath('user.language', 'he');
    }

    public function test_signup_uses_explicit_language_over_country(): void
    {
        $this->signupEmail('switch@example.com', [
            'language' => 'es',
            'country' => 'IL',
        ])->assertOk()
            ->assertJsonPath('user.language', 'es');
    }

    public function test_signup_uses_ip_country_when_client_sends_none(): void
    {
        $this->withHeaders([
            'Origin' => 'http://localhost',
            'Referer' => 'http://localhost',
            'CF-IPCountry' => 'IL',
        ])->postJson('/api/auth/otp/verify', $this->otpPayload('ip@example.com'))
            ->assertOk()
            ->assertJsonPath('user.language', 'he');
    }

    public function test_phone_signup_defaults_hebrew_for_israel_number(): void
    {
        config([
            'gocha.firebase.web_api_key' => 'test-firebase-key',
            'gocha.firebase.project_id' => 'gocha-test',
            'gocha.firebase.auth_domain' => 'gocha-test.firebaseapp.com',
            'gocha.firebase.app_id' => '1:1:web:test',
        ]);

        Http::fake([
            'https://identitytoolkit.googleapis.com/v1/accounts:lookup*' => Http::response([
                'users' => [['phoneNumber' => '+972501234567']],
            ], 200),
        ]);

        $this->postJson('/api/auth/otp/request', [
            'channel' => AccountChannel::PHONE,
            'identifier' => '+972501234567',
            'mode' => 'signup',
        ])->assertOk();

        $this->postJson('/api/auth/otp/verify', [
            'channel' => AccountChannel::PHONE,
            'identifier' => '+972501234567',
            'code' => '123456',
            'mode' => 'signup',
            'firebaseIdToken' => 'test-id-token',
        ])
            ->assertOk()
            ->assertJsonPath('user.phone', '+972501234567')
            ->assertJsonPath('user.language', 'he');
    }

    public function test_profile_language_can_be_switched(): void
    {
        $user = User::factory()->create(['language' => 'en']);

        $this->actingAs($user)->postJson('/api/profile/language', [
            'language' => 'he',
        ])
            ->assertOk()
            ->assertJsonPath('user.language', 'he');

        $this->assertDatabaseHas('users', [
            'id' => $user->id,
            'language' => 'he',
        ]);
    }

    public function test_profile_language_rejects_unknown_code(): void
    {
        $user = User::factory()->create(['language' => 'en']);

        $this->actingAs($user)->postJson('/api/profile/language', [
            'language' => 'xx',
        ])
            ->assertStatus(422)
            ->assertJsonPath('code', 'INVALID_LANGUAGE');
    }

    public function test_me_includes_language(): void
    {
        $user = User::factory()->create(['language' => 'he']);

        $this->actingAs($user)->getJson('/api/me')
            ->assertOk()
            ->assertJsonPath('user.language', 'he');
    }

    /**
     * @param  array<string, string>  $extra
     */
    private function signupEmail(string $email, array $extra = []): \Illuminate\Testing\TestResponse
    {
        return $this
            ->withHeaders([
                'Origin' => 'http://localhost',
                'Referer' => 'http://localhost',
            ])
            ->postJson('/api/auth/otp/verify', array_merge($this->otpPayload($email), $extra));
    }

    /**
     * @return array<string, string>
     */
    private function otpPayload(string $email): array
    {
        $code = '123456';
        LoginOtp::query()->create([
            'channel' => 'email',
            'identifier' => $email,
            'code_hash' => Hash::make($code),
            'attempts' => 0,
            'expires_at' => now()->addMinutes(10),
        ]);

        return [
            'email' => $email,
            'code' => $code,
            'mode' => 'signup',
        ];
    }
}
