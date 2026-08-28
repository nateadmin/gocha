<?php

namespace Tests\Feature;

use App\Models\User;
use App\Support\ProfileCardAccessStatus;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ProfileCardTest extends TestCase
{
    use RefreshDatabase;

    public function test_owner_can_create_and_list_a_card(): void
    {
        $alice = User::factory()->create();

        $this->actingAs($alice)->postJson('/api/profile-cards', [
            'type' => 'professional',
            'headline' => 'Product lead',
            'body' => ['company' => 'Gocha', 'role' => 'Lead'],
        ])->assertCreated()
            ->assertJsonPath('card.type', 'professional')
            ->assertJsonPath('card.title', 'Professional')
            ->assertJsonPath('card.visibility', 'request')
            ->assertJsonPath('card.body.company', 'Gocha');

        $slug = $this->actingAs($alice)->getJson('/api/profile-cards')
            ->assertOk()
            ->assertJsonCount(1, 'cards')
            ->json('cards.0.slug');

        $this->assertNotEmpty($slug);
    }

    public function test_public_share_page_is_visible_without_auth(): void
    {
        $alice = User::factory()->create(['username' => 'alice']);

        $slug = $this->actingAs($alice)->postJson('/api/profile-cards', [
            'type' => 'professional',
            'visibility' => 'private',
            'headline' => 'Product lead',
            'body' => ['company' => 'Gocha', 'role' => 'Lead'],
        ])->json('card.slug');

        $this->assertSame('alice-professional', $slug);

        $this->app['auth']->forgetGuards();

        $this->getJson("/api/c/{$slug}")
            ->assertOk()
            ->assertJsonPath('card.slug', 'alice-professional')
            ->assertJsonPath('card.headline', 'Product lead')
            ->assertJsonPath('card.body.company', 'Gocha')
            ->assertJsonPath('card.owner.displayName', $alice->name)
            ->assertJsonPath('card.viewerIsOwner', false);

        $this->getJson('/api/c/missing-card')->assertNotFound();
    }

    public function test_owner_can_customize_share_slug(): void
    {
        $alice = User::factory()->create(['username' => 'alice']);
        $bob = User::factory()->create(['username' => 'bob']);

        $cardId = $this->actingAs($alice)->postJson('/api/profile-cards', [
            'type' => 'match',
        ])->json('card.id');

        $this->actingAs($alice)->putJson("/api/profile-cards/{$cardId}", [
            'slug' => 'Alice Dating!!',
        ])->assertOk()
            ->assertJsonPath('card.slug', 'alice-dating');

        $this->actingAs($bob)->postJson('/api/profile-cards', [
            'type' => 'custom',
            'slug' => 'alice-dating',
        ])->assertUnprocessable();
    }

    public function test_owner_payload_marks_viewer_as_owner_on_share_page(): void
    {
        $alice = User::factory()->create(['username' => 'nate']);

        $slug = $this->actingAs($alice)->postJson('/api/profile-cards', [
            'type' => 'custom',
            'title' => 'Personal',
        ])->json('card.slug');

        $this->actingAs($alice)->getJson("/api/c/{$slug}")
            ->assertOk()
            ->assertJsonPath('card.viewerIsOwner', true)
            ->assertJsonPath('card.slug', 'nate-custom');
    }

    public function test_public_card_detail_is_visible_without_a_request(): void
    {
        $alice = User::factory()->create();
        $bob = User::factory()->create();

        $cardId = $this->actingAs($alice)->postJson('/api/profile-cards', [
            'type' => 'professional',
            'visibility' => 'public',
            'body' => ['company' => 'Gocha'],
        ])->json('card.id');

        $this->actingAs($bob)->getJson("/api/users/{$alice->id}/profile-cards")
            ->assertOk()
            ->assertJsonPath('cards.0.canView', true);

        $this->actingAs($bob)->getJson("/api/profile-cards/{$cardId}")
            ->assertOk()
            ->assertJsonPath('card.body.company', 'Gocha');
    }

    public function test_request_only_card_hides_detail_until_approved(): void
    {
        $alice = User::factory()->create();
        $bob = User::factory()->create();

        $cardId = $this->actingAs($alice)->postJson('/api/profile-cards', [
            'type' => 'match',
            'visibility' => 'request',
            'body' => ['about' => 'Secret bio'],
        ])->json('card.id');

        $this->actingAs($bob)->getJson("/api/users/{$alice->id}/profile-cards")
            ->assertOk()
            ->assertJsonPath('cards.0.canView', false)
            ->assertJsonPath('cards.0.headline', null);

        $this->actingAs($bob)->getJson("/api/profile-cards/{$cardId}")
            ->assertForbidden();

        $this->actingAs($bob)->postJson("/api/profile-cards/{$cardId}/request")
            ->assertSuccessful()
            ->assertJsonPath('access.status', 'pending');

        $requestId = $this->actingAs($alice)->getJson('/api/profile-cards/requests')
            ->assertOk()
            ->assertJsonCount(1, 'requests')
            ->json('requests.0.id');

        $this->actingAs($alice)->postJson("/api/profile-cards/accesses/{$requestId}/approve")
            ->assertOk()
            ->assertJsonPath('access.status', ProfileCardAccessStatus::APPROVED);

        $this->actingAs($bob)->getJson("/api/profile-cards/{$cardId}")
            ->assertOk()
            ->assertJsonPath('card.body.about', 'Secret bio');
    }

    public function test_private_card_is_hidden_until_owner_grants_access(): void
    {
        $alice = User::factory()->create();
        $bob = User::factory()->create();

        $cardId = $this->actingAs($alice)->postJson('/api/profile-cards', [
            'type' => 'custom',
            'title' => 'Investor deck',
            'visibility' => 'private',
        ])->json('card.id');

        $this->actingAs($bob)->getJson("/api/users/{$alice->id}/profile-cards")
            ->assertOk()
            ->assertJsonCount(0, 'cards');

        $this->actingAs($bob)->postJson("/api/profile-cards/{$cardId}/request")
            ->assertForbidden();

        $this->actingAs($alice)->postJson("/api/profile-cards/{$cardId}/grant", [
            'userId' => $bob->id,
        ])->assertOk()
            ->assertJsonPath('access.status', 'approved');

        $this->actingAs($bob)->getJson("/api/users/{$alice->id}/profile-cards")
            ->assertOk()
            ->assertJsonCount(1, 'cards')
            ->assertJsonPath('cards.0.canView', true);
    }

    public function test_owner_can_update_and_delete_a_card(): void
    {
        $alice = User::factory()->create();
        $bob = User::factory()->create();

        $cardId = $this->actingAs($alice)->postJson('/api/profile-cards', [
            'type' => 'custom',
            'title' => 'Draft',
        ])->json('card.id');

        $this->actingAs($bob)->putJson("/api/profile-cards/{$cardId}", [
            'title' => 'Hijack',
        ])->assertForbidden();

        $this->actingAs($alice)->putJson("/api/profile-cards/{$cardId}", [
            'title' => 'Live card',
            'visibility' => 'public',
        ])->assertOk()
            ->assertJsonPath('card.title', 'Live card');

        $this->actingAs($alice)->deleteJson("/api/profile-cards/{$cardId}")
            ->assertOk();

        $this->actingAs($alice)->getJson('/api/profile-cards')
            ->assertJsonCount(0, 'cards');
    }

    public function test_access_request_is_idempotent_while_pending(): void
    {
        $alice = User::factory()->create();
        $bob = User::factory()->create();

        $cardId = $this->actingAs($alice)->postJson('/api/profile-cards', [
            'type' => 'professional',
            'visibility' => 'request',
        ])->json('card.id');

        $this->actingAs($bob)->postJson("/api/profile-cards/{$cardId}/request")->assertSuccessful();
        $this->actingAs($bob)->postJson("/api/profile-cards/{$cardId}/request")->assertSuccessful();

        $this->assertDatabaseCount('profile_card_accesses', 1);
    }
}
