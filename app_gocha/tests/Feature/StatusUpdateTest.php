<?php

namespace Tests\Feature;

use App\Models\StatusItem;
use App\Models\User;
use App\Support\StatusType;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class StatusUpdateTest extends TestCase
{
    use RefreshDatabase;

    public function test_user_can_post_text_status_that_expires_in_24_hours(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user)->postJson('/api/statuses', [
            'text' => 'Good morning Gocha',
            'backgroundColor' => '#1B00D8',
        ])
            ->assertCreated()
            ->assertJsonPath('item.type', 'text')
            ->assertJsonPath('item.text', 'Good morning Gocha')
            ->assertJsonPath('item.viewed', true);

        $item = StatusItem::query()->first();
        $this->assertNotNull($item);
        $this->assertTrue($item->expires_at->greaterThan(now()->addHours(23)));
        $this->assertTrue($item->expires_at->lessThanOrEqualTo(now()->addHours(24)->addMinute()));
    }

    public function test_contact_can_view_status_and_stranger_cannot(): void
    {
        $alice = User::factory()->create(['name' => 'Alice']);
        $bob = User::factory()->create(['name' => 'Bob']);
        $carol = User::factory()->create(['name' => 'Carol']);
        $this->startConversation($alice, $bob);

        $this->actingAs($alice)->postJson('/api/statuses', [
            'text' => 'Hello contacts',
        ])->assertCreated();

        $this->actingAs($bob)->getJson("/api/statuses/users/{$alice->id}")
            ->assertOk()
            ->assertJsonCount(1, 'items')
            ->assertJsonPath('items.0.text', 'Hello contacts')
            ->assertJsonPath('items.0.viewed', false);

        $this->actingAs($carol)->getJson("/api/statuses/users/{$alice->id}")
            ->assertForbidden();
    }

    public function test_feed_lists_own_and_contact_updates(): void
    {
        $alice = User::factory()->create();
        $bob = User::factory()->create();
        $this->startConversation($alice, $bob);

        $this->actingAs($alice)->postJson('/api/statuses', ['text' => 'Mine'])->assertCreated();
        $this->actingAs($bob)->postJson('/api/statuses', ['text' => 'Bobs'])->assertCreated();

        $feed = $this->actingAs($alice)->getJson('/api/statuses')
            ->assertOk()
            ->assertJsonPath('mine.itemCount', 1)
            ->assertJsonPath('recent.0.userId', $bob->id)
            ->assertJsonPath('recent.0.unseenCount', 1)
            ->json();

        $this->assertSame('Mine', $feed['mine']['items'][0]['text']);
        $this->assertSame('Bobs', $feed['recent'][0]['items'][0]['text']);
    }

    public function test_view_is_recorded_once_and_owner_can_see_viewers(): void
    {
        $alice = User::factory()->create();
        $bob = User::factory()->create();
        $this->startConversation($alice, $bob);

        $itemId = $this->actingAs($alice)->postJson('/api/statuses', [
            'text' => 'Seen?',
        ])->json('item.id');

        $this->actingAs($bob)->postJson("/api/statuses/{$itemId}/view")->assertOk();
        $this->actingAs($bob)->postJson("/api/statuses/{$itemId}/view")->assertOk();

        $this->assertDatabaseCount('status_views', 1);

        $this->actingAs($alice)->getJson("/api/statuses/{$itemId}/viewers")
            ->assertOk()
            ->assertJsonCount(1, 'viewers')
            ->assertJsonPath('viewers.0.userId', $bob->id);

        $this->actingAs($bob)->getJson("/api/statuses/{$itemId}/viewers")
            ->assertForbidden();
    }

    public function test_expired_status_is_hidden_and_pruned(): void
    {
        Storage::fake('public');
        $user = User::factory()->create();
        $item = StatusItem::query()->create([
            'user_id' => $user->id,
            'type' => StatusType::TEXT,
            'body' => 'Old',
            'background_color' => '#1B00D8',
            'duration_ms' => 5000,
            'expires_at' => now()->subMinute(),
        ]);

        $this->actingAs($user)->getJson('/api/statuses')
            ->assertOk()
            ->assertJsonPath('mine.itemCount', 0);

        $this->artisan('gocha:status-prune')->assertSuccessful();
        $this->assertDatabaseMissing('status_items', ['id' => $item->id]);
    }

    public function test_owner_can_edit_status(): void
    {
        $alice = User::factory()->create();
        $bob = User::factory()->create();
        $this->startConversation($alice, $bob);

        $itemId = $this->actingAs($alice)->postJson('/api/statuses', [
            'text' => 'Draft',
            'backgroundColor' => '#1B00D8',
        ])->json('item.id');

        $this->actingAs($bob)->patchJson("/api/statuses/{$itemId}", [
            'text' => 'Hijack',
        ])->assertForbidden();

        $this->actingAs($alice)->patchJson("/api/statuses/{$itemId}", [
            'text' => 'Updated hello',
            'backgroundColor' => '#00734a',
        ])
            ->assertOk()
            ->assertJsonPath('item.text', 'Updated hello')
            ->assertJsonPath('item.backgroundColor', '#00734a');

        $this->actingAs($alice)->patchJson("/api/statuses/{$itemId}", [
            'text' => '   ',
        ])->assertStatus(422);
    }

    public function test_owner_can_delete_status(): void
    {
        $alice = User::factory()->create();
        $bob = User::factory()->create();
        $this->startConversation($alice, $bob);

        $itemId = $this->actingAs($alice)->postJson('/api/statuses', [
            'text' => 'Delete me',
        ])->json('item.id');

        $this->actingAs($bob)->deleteJson("/api/statuses/{$itemId}")
            ->assertForbidden();

        $this->actingAs($alice)->deleteJson("/api/statuses/{$itemId}")
            ->assertOk();

        $this->assertDatabaseMissing('status_items', ['id' => $itemId]);
    }

    public function test_image_status_can_be_uploaded(): void
    {
        Storage::fake('public');
        $user = User::factory()->create();
        $png = base64_decode('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==');

        $this->actingAs($user)->post('/api/statuses/media', [
            'type' => 'image',
            'text' => 'Sunset',
            'media' => UploadedFile::fake()->createWithContent('status.png', $png),
        ])
            ->assertCreated()
            ->assertJsonPath('item.type', 'image')
            ->assertJsonPath('item.text', 'Sunset');

        $path = StatusItem::query()->first()?->media_path;
        $this->assertNotNull($path);
        Storage::disk('public')->assertExists($path);
    }

    public function test_conversation_list_includes_status_rings(): void
    {
        $alice = User::factory()->create();
        $bob = User::factory()->create();
        $this->startConversation($alice, $bob);
        $this->actingAs($bob)->postJson('/api/statuses', ['text' => 'Ring'])->assertCreated();

        $this->actingAs($alice)->getJson('/api/conversations')
            ->assertOk()
            ->assertJsonPath('conversations.0.hasStatus', true)
            ->assertJsonPath('conversations.0.statusUnseen', true);
    }

    public function test_statuses_require_auth(): void
    {
        $this->getJson('/api/statuses')->assertUnauthorized();
        $this->patchJson('/api/statuses/1', [
            'text' => 'Nope',
        ])->assertUnauthorized();
    }

    public function test_owner_can_replace_status_media(): void
    {
        Storage::fake('public');
        $user = User::factory()->create();
        $png = base64_decode('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==');

        $itemId = $this->actingAs($user)->post('/api/statuses/media', [
            'type' => 'image',
            'text' => 'First',
            'media' => UploadedFile::fake()->createWithContent('first.png', $png),
        ])->json('item.id');

        $originalPath = StatusItem::query()->findOrFail($itemId)->media_path;

        $this->actingAs($user)->post("/api/statuses/{$itemId}", [
            'type' => 'image',
            'text' => 'Second',
            'media' => UploadedFile::fake()->createWithContent('second.png', $png),
        ])
            ->assertOk()
            ->assertJsonPath('item.text', 'Second');

        $fresh = StatusItem::query()->findOrFail($itemId);
        $this->assertNotSame($originalPath, $fresh->media_path);
        Storage::disk('public')->assertExists($fresh->media_path);
        Storage::disk('public')->assertMissing($originalPath);
    }

    private function startConversation(User $alice, User $bob): int
    {
        return (int) $this->actingAs($alice)->postJson('/api/conversations', [
            'participantUserId' => $bob->id,
        ])->json('conversation.id');
    }
}
