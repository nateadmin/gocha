<?php

namespace Tests\Feature;

use App\Models\LoginOtp;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class AuthOtpTest extends TestCase
{
    use RefreshDatabase;

    public function test_signup_request_sends_code_for_new_email(): void
    {
        $response = $this->postJson('/api/auth/otp/request', [
            'email' => 'new@example.com',
            'mode' => 'signup',
        ]);

        $response
            ->assertOk()
            ->assertJsonPath('message', 'A verification code has been sent to your email.');

        $this->assertDatabaseCount('login_otps', 1);
    }

    public function test_signin_request_rejects_unknown_email(): void
    {
        $response = $this->postJson('/api/auth/otp/request', [
            'email' => 'unknown@example.com',
            'mode' => 'signin',
        ]);

        $response
            ->assertStatus(422)
            ->assertJsonPath('code', 'EMAIL_NOT_FOUND');

        $this->assertDatabaseCount('login_otps', 0);
    }

    public function test_signup_request_rejects_existing_email(): void
    {
        User::factory()->create(['email' => 'exists@example.com']);

        $response = $this->postJson('/api/auth/otp/request', [
            'email' => 'exists@example.com',
            'mode' => 'signup',
        ]);

        $response
            ->assertStatus(422)
            ->assertJsonPath('code', 'EMAIL_ALREADY_REGISTERED');

        $this->assertDatabaseCount('login_otps', 0);
    }

    public function test_signin_request_sends_code_for_existing_user(): void
    {
        User::factory()->create(['email' => 'member@example.com']);

        $this->postJson('/api/auth/otp/request', [
            'email' => 'member@example.com',
            'mode' => 'signin',
        ])
            ->assertOk()
            ->assertJsonPath('message', 'A sign-in code has been sent to your email.');

        $this->assertDatabaseCount('login_otps', 1);
    }

    public function test_signup_verify_creates_user_and_session(): void
    {
        $email = 'signup@example.com';
        $code = '123456';

        LoginOtp::query()->create([
            'email' => $email,
            'code_hash' => Hash::make($code),
            'attempts' => 0,
            'expires_at' => now()->addMinutes(10),
        ]);

        $response = $this
            ->withHeaders([
                'Origin' => 'http://localhost',
                'Referer' => 'http://localhost',
            ])
            ->postJson('/api/auth/otp/verify', [
                'email' => $email,
                'code' => $code,
                'mode' => 'signup',
            ]);

        $response
            ->assertOk()
            ->assertJsonPath('user.email', $email)
            ->assertJsonPath('user.needsOnboarding', true);

        $this->assertDatabaseHas('users', ['email' => $email]);
        $this->assertAuthenticated();
    }

    public function test_signin_verify_requires_existing_user(): void
    {
        $email = 'signin@example.com';
        $code = '123456';

        LoginOtp::query()->create([
            'email' => $email,
            'code_hash' => Hash::make($code),
            'attempts' => 0,
            'expires_at' => now()->addMinutes(10),
        ]);

        $this
            ->withHeaders([
                'Origin' => 'http://localhost',
                'Referer' => 'http://localhost',
            ])
            ->postJson('/api/auth/otp/verify', [
                'email' => $email,
                'code' => $code,
                'mode' => 'signin',
            ])
            ->assertStatus(422)
            ->assertJsonPath('code', 'EMAIL_NOT_FOUND');
    }

    public function test_closed_membership_blocks_signup(): void
    {
        config(['gocha.auth.closed_membership' => true]);

        $this->postJson('/api/auth/otp/request', [
            'email' => 'unknown@example.com',
            'mode' => 'signup',
        ])
            ->assertStatus(422)
            ->assertJsonPath('code', 'SIGNUP_CLOSED');

        $this->assertDatabaseCount('login_otps', 0);
    }

    public function test_onboarding_completes_profile(): void
    {
        $user = User::factory()->create([
            'email' => 'profile@example.com',
            'onboarding_completed_at' => null,
        ]);

        $response = $this->actingAs($user)->postJson('/api/profile/onboarding', [
            'displayName' => 'Neon Rider',
            'status' => 'Online',
            'bio' => 'Building Gotcha.',
            'phone' => '+15551234567',
            'discoverable' => true,
        ]);

        $response
            ->assertOk()
            ->assertJsonPath('user.displayName', 'Neon Rider')
            ->assertJsonPath('user.discoverable', true)
            ->assertJsonPath('user.needsOnboarding', false);
    }

    public function test_search_returns_only_discoverable_users(): void
    {
        User::factory()->create([
            'display_name' => 'Visible Neo',
            'email' => 'visible@example.com',
            'discoverable' => true,
            'onboarding_completed_at' => now(),
        ]);

        User::factory()->create([
            'display_name' => 'Hidden Neo',
            'email' => 'hidden@example.com',
            'discoverable' => false,
            'onboarding_completed_at' => now(),
        ]);

        $user = User::factory()->create();
        $response = $this->actingAs($user)->getJson('/api/users/search?q=Neo');

        $response
            ->assertOk()
            ->assertJsonCount(1, 'results')
            ->assertJsonPath('results.0.displayName', 'Visible Neo');
    }
}
