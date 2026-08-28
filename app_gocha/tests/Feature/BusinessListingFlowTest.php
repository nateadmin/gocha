<?php

namespace Tests\Feature;

use App\Models\User;
use App\Support\BusinessListingStatus;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class BusinessListingFlowTest extends TestCase
{
    use RefreshDatabase;

    public function test_draft_save_accepts_website_without_protocol(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user)->postJson('/api/businesses', [
            'name' => 'Acme Web Studio',
            'category' => 'web_development',
            'website' => 'acme.dev',
            'submit' => false,
        ])
            ->assertCreated()
            ->assertJsonPath('listing.status', BusinessListingStatus::DRAFT)
            ->assertJsonPath('listing.website', 'https://acme.dev');
    }

    public function test_existing_draft_can_be_updated_via_draft_endpoint(): void
    {
        $user = User::factory()->create();

        $create = $this->actingAs($user)->postJson('/api/businesses', [
            'name' => 'Initial Draft',
            'submit' => false,
        ])->assertCreated();

        $listingId = $create->json('listing.id');

        $this->actingAs($user)->postJson("/api/businesses/mine/{$listingId}/draft", [
            'name' => 'Updated Draft',
            'category' => 'technology',
        ])
            ->assertOk()
            ->assertJsonPath('listing.name', 'Updated Draft')
            ->assertJsonPath('listing.category', 'technology')
            ->assertJsonPath('listing.status', BusinessListingStatus::DRAFT);
    }

    public function test_authenticated_user_can_issue_device_token(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user)->postJson('/api/auth/device-token')
            ->assertOk()
            ->assertJsonStructure(['deviceToken', 'account']);
    }
}
