<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Tests\TestCase;

class ChatTypingTest extends TestCase
{
    use RefreshDatabase;

    public function test_participant_can_publish_and_read_typing_state(): void
    {
        $alice = User::factory()->create(['name' => 'Alice Example']);
        $bob = User::factory()->create(['name' => 'Bob Example']);

        $conversationId = $this->actingAs($alice)->postJson('/api/conversations', [
            'participantUserId' => $bob->id,
        ])->json('conversation.id');

        $this->actingAs($bob)->postJson("/api/conversations/{$conversationId}/typing", [
            'typing' => true,
        ])->assertOk();

        $this->actingAs($alice)->getJson("/api/conversations/{$conversationId}/typing")
            ->assertOk()
            ->assertJsonPath('typing.0.userId', $bob->id)
            ->assertJsonPath('typing.0.name', $bob->chatDisplayName());

        $this->actingAs($bob)->postJson("/api/conversations/{$conversationId}/typing", [
            'typing' => false,
        ])->assertOk();

        $this->actingAs($alice)->getJson("/api/conversations/{$conversationId}/typing")
            ->assertOk()
            ->assertJsonPath('typing', []);
    }

    public function test_typing_requires_auth_and_participation(): void
    {
        $alice = User::factory()->create();
        $bob = User::factory()->create();
        $carol = User::factory()->create();

        $conversationId = $this->actingAs($alice)->postJson('/api/conversations', [
            'participantUserId' => $bob->id,
        ])->json('conversation.id');

        $this->postJson("/api/conversations/{$conversationId}/typing", [
            'typing' => true,
        ])->assertUnauthorized();

        $this->actingAs($carol)->postJson("/api/conversations/{$conversationId}/typing", [
            'typing' => true,
        ])->assertForbidden();
    }

    public function test_typing_expires_from_cache(): void
    {
        $alice = User::factory()->create();
        $bob = User::factory()->create();

        $conversationId = $this->actingAs($alice)->postJson('/api/conversations', [
            'participantUserId' => $bob->id,
        ])->json('conversation.id');

        $this->actingAs($bob)->postJson("/api/conversations/{$conversationId}/typing", [
            'typing' => true,
        ])->assertOk();

        Cache::forget('chat:typing:'.$conversationId.':'.$bob->id);

        $this->actingAs($alice)->getJson("/api/conversations/{$conversationId}/typing")
            ->assertOk()
            ->assertJsonPath('typing', []);
    }
}
