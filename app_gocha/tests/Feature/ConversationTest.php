<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ConversationTest extends TestCase
{
    use RefreshDatabase;

    public function test_user_can_start_direct_conversation_and_send_message(): void
    {
        $alice = User::factory()->create(['discoverable' => true]);
        $bob = User::factory()->create(['discoverable' => true]);

        $create = $this->actingAs($alice)->postJson('/api/conversations', [
            'participantUserId' => $bob->id,
        ])->assertCreated()
            ->assertJsonPath('conversation.otherUserId', $bob->id);

        $conversationId = $create->json('conversation.id');

        $this->actingAs($alice)->postJson("/api/conversations/{$conversationId}/messages", [
            'text' => 'Hey Bob',
        ])->assertCreated()
            ->assertJsonPath('message.text', 'Hey Bob')
            ->assertJsonPath('message.isOutgoing', true);

        $this->actingAs($bob)->getJson('/api/conversations')
            ->assertOk()
            ->assertJsonCount(1, 'conversations')
            ->assertJsonPath('conversations.0.unreadCount', 1);

        $this->actingAs($bob)->getJson("/api/conversations/{$conversationId}/messages")
            ->assertOk()
            ->assertJsonCount(1, 'messages')
            ->assertJsonPath('messages.0.isOutgoing', false);
    }

    public function test_start_conversation_is_idempotent_for_same_pair(): void
    {
        $alice = User::factory()->create();
        $bob = User::factory()->create();

        $first = $this->actingAs($alice)->postJson('/api/conversations', [
            'participantUserId' => $bob->id,
        ])->assertCreated();

        $second = $this->actingAs($alice)->postJson('/api/conversations', [
            'participantUserId' => $bob->id,
        ])->assertOk();

        $this->assertSame($first->json('conversation.id'), $second->json('conversation.id'));
        $this->assertDatabaseCount('conversations', 1);
    }

    public function test_mark_read_clears_unread_count(): void
    {
        $alice = User::factory()->create();
        $bob = User::factory()->create();

        $conversationId = $this->actingAs($alice)->postJson('/api/conversations', [
            'participantUserId' => $bob->id,
        ])->json('conversation.id');

        $this->actingAs($alice)->postJson("/api/conversations/{$conversationId}/messages", [
            'text' => 'Ping',
        ]);

        $this->actingAs($bob)->postJson("/api/conversations/{$conversationId}/read")
            ->assertOk();

        $this->actingAs($bob)->getJson('/api/conversations')
            ->assertJsonPath('conversations.0.unreadCount', 0);
    }
}
