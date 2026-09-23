<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AuthLogoutTest extends TestCase
{
    use RefreshDatabase;

    public function test_logout_clears_the_web_session(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user)->getJson('/api/me')->assertOk();

        $this
            ->withHeaders([
                'Origin' => 'http://localhost',
                'Referer' => 'http://localhost',
            ])
            ->actingAs($user)
            ->postJson('/api/auth/logout')
            ->assertOk()
            ->assertJsonPath('message', 'Signed out.');

        $this->app['auth']->forgetGuards();

        $this->getJson('/api/me')->assertUnauthorized();
    }

    public function test_clear_session_endpoint_clears_web_session(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user)->getJson('/api/me')->assertOk();

        $this
            ->withHeaders([
                'Origin' => 'http://localhost',
                'Referer' => 'http://localhost',
            ])
            ->getJson('/api/auth/clear-session')
            ->assertOk()
            ->assertJsonPath('message', 'Session cleared.');

        $this->app['auth']->forgetGuards();

        $this->getJson('/api/me')->assertUnauthorized();
    }

    public function test_logout_works_without_prior_guard_check(): void
    {
        $user = User::factory()->create();

        $this
            ->withHeaders([
                'Origin' => 'http://localhost',
                'Referer' => 'http://localhost',
            ])
            ->actingAs($user)
            ->postJson('/api/auth/logout')
            ->assertOk();

        $this->app['auth']->forgetGuards();

        $this->getJson('/api/me')->assertUnauthorized();
    }
}
