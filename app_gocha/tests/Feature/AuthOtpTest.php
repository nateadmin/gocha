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

    public function test_otp_request_returns_anti_enumeration_message(): void
    {
        $response = $this->postJson('/api/auth/otp/request', [
            'email' => 'new@example.com',
        ]);

        $response
            ->assertOk()
            ->assertJsonPath('message', 'If your email is registered, a code has been sent.');
    }

    public function test_otp_verify_creates_user_and_session(): void
    {
        $email = 'signin@example.com';
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
            ]);

        $response
            ->assertOk()
            ->assertJsonPath('user.email', $email)
            ->assertJsonPath('user.needsOnboarding', true);

        $this->assertDatabaseHas('users', ['email' => $email]);
        $this->assertAuthenticated();
    }

    public function test_closed_membership_blocks_unknown_email_otp_send(): void
    {
        config(['gocha.auth.closed_membership' => true]);

        $this->postJson('/api/auth/otp/request', [
            'email' => 'unknown@example.com',
        ])->assertOk();

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
