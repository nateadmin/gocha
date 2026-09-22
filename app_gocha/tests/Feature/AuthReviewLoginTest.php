<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AuthReviewLoginTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        config([
            'gocha.review_login.email' => 'google-review@gocha.ai',
            'gocha.review_login.password' => 'GochaReview2026!',
            'gocha.review_login.name' => 'Google Review',
        ]);
    }

    public function test_review_login_is_disabled_without_config(): void
    {
        config([
            'gocha.review_login.email' => null,
            'gocha.review_login.password' => null,
        ]);

        $this->postJson('/api/auth/review/login', [
            'email' => 'google-review@gocha.ai',
            'password' => 'GochaReview2026!',
        ])->assertNotFound()
            ->assertJsonPath('code', 'REVIEW_LOGIN_DISABLED');
    }

    public function test_review_login_rejects_wrong_password(): void
    {
        $this->postJson('/api/auth/review/login', [
            'email' => 'google-review@gocha.ai',
            'password' => 'wrong-password',
        ])->assertUnauthorized()
            ->assertJsonPath('code', 'INVALID_CREDENTIALS');
    }

    public function test_review_login_creates_user_and_returns_session(): void
    {
        $response = $this
            ->withHeaders([
                'Origin' => 'http://localhost',
                'Referer' => 'http://localhost',
            ])
            ->postJson('/api/auth/review/login', [
                'email' => 'google-review@gocha.ai',
                'password' => 'GochaReview2026!',
            ]);

        $response
            ->assertOk()
            ->assertJsonPath('user.email', 'google-review@gocha.ai')
            ->assertJsonPath('user.needsOnboarding', false)
            ->assertJsonStructure(['deviceToken', 'account']);

        $this->assertDatabaseHas('users', [
            'email' => 'google-review@gocha.ai',
        ]);

        $user = User::query()->where('email', 'google-review@gocha.ai')->first();
        $this->assertNotNull($user?->email_verified_at);
        $this->assertNotNull($user?->onboarding_completed_at);
    }

    public function test_meta_exposes_review_login_enabled_flag(): void
    {
        $this->getJson('/api/meta')
            ->assertOk()
            ->assertJsonPath('auth.reviewLoginEnabled', true)
            ->assertJsonPath('auth.reviewLoginEmail', 'google-review@gocha.ai');
    }
}
