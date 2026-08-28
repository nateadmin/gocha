<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\RateLimiter;
use Tests\TestCase;

class OtpRateLimitTest extends TestCase
{
    use RefreshDatabase;

    public function test_otp_request_during_resend_cooldown_does_not_consume_rate_limit(): void
    {
        User::factory()->create(['email' => 'member@example.com']);

        $this->postJson('/api/auth/otp/request', [
            'email' => 'member@example.com',
            'mode' => 'signin',
        ])->assertOk();

        for ($attempt = 0; $attempt < 6; $attempt++) {
            $this->postJson('/api/auth/otp/request', [
                'email' => 'member@example.com',
                'mode' => 'signin',
            ])->assertOk();
        }
    }

    public function test_rate_limited_otp_response_includes_retry_after_seconds(): void
    {
        for ($i = 0; $i < 40; $i++) {
            User::factory()->create(['email' => "user{$i}@example.com"]);
        }

        for ($i = 0; $i < 40; $i++) {
            $this->postJson('/api/auth/otp/request', [
                'email' => "user{$i}@example.com",
                'mode' => 'signin',
            ])->assertOk();
        }

        User::factory()->create(['email' => 'blocked@example.com']);

        $this->postJson('/api/auth/otp/request', [
            'email' => 'blocked@example.com',
            'mode' => 'signin',
        ])
            ->assertStatus(429)
            ->assertJsonPath('code', 'RATE_LIMITED')
            ->assertJsonStructure(['retryAfterSeconds']);
    }
}
