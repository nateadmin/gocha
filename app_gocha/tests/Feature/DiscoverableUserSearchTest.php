<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class DiscoverableUserSearchTest extends TestCase
{
    use RefreshDatabase;

    public function test_user_search_endpoint_requires_exact_name_or_at_username(): void
    {
        User::factory()->create([
            'name' => 'Visible Neo',
            'username' => 'visible_neo',
            'discoverable' => true,
            'onboarding_completed_at' => now(),
        ]);

        User::factory()->create([
            'name' => 'Hidden Neo',
            'discoverable' => false,
            'onboarding_completed_at' => now(),
        ]);

        $user = User::factory()->create();

        $this->actingAs($user)->getJson('/api/users/search?q=Neo')
            ->assertOk()
            ->assertJsonCount(0, 'results');

        $this->actingAs($user)->getJson('/api/users/search?q='.urlencode('Visible Neo'))
            ->assertOk()
            ->assertJsonCount(1, 'results')
            ->assertJsonPath('results.0.displayName', 'Visible Neo');

        $this->actingAs($user)->getJson('/api/users/search?q=@visible_neo')
            ->assertOk()
            ->assertJsonCount(1, 'results')
            ->assertJsonPath('results.0.username', 'visible_neo');
    }
}
