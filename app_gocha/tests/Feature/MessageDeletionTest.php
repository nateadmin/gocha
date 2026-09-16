<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class MessageDeletionTest extends TestCase
{
    use RefreshDatabase;

    public function test_delete_for_me_hides_message_from_deleter_only(): void
    {
        $alice = User::factory()->create();
        $bob = User::factory()->create();

        $conversationId = $this->actingAs($alice)->postJson('/api/conversations', [
            'participantUserId' => $bob->id,
        ])->json('conversation.id');

        $messageId = $this->actingAs($alice)->postJson("/api/conversations/{$conversationId}/messages", [
            'text' => 'Delete me locally',
        ])->json('message.id');

        $this->actingAs($alice)->postJson("/api/conversations/{$conversationId}/messages/{$messageId}/delete", [
            'scope' => 'me',
        ])->assertOk();

        $this->actingAs($alice)->getJson("/api/conversations/{$conversationId}/messages")
            ->assertOk()
            ->assertJsonCount(0, 'messages');

        $this->actingAs($bob)->getJson("/api/conversations/{$conversationId}/messages")
            ->assertOk()
            ->assertJsonCount(1, 'messages')
            ->assertJsonPath('messages.0.text', 'Delete me locally');
    }

    public function test_delete_for_everyone_removes_message_for_all_participants(): void
    {
        $alice = User::factory()->create();
        $bob = User::factory()->create();

        $conversationId = $this->actingAs($alice)->postJson('/api/conversations', [
            'participantUserId' => $bob->id,
        ])->json('conversation.id');

        $messageId = $this->actingAs($alice)->postJson("/api/conversations/{$conversationId}/messages", [
            'text' => 'Gone for everyone',
        ])->json('message.id');

        $this->actingAs($alice)->postJson("/api/conversations/{$conversationId}/messages/{$messageId}/delete", [
            'scope' => 'everyone',
        ])->assertOk();

        $this->actingAs($alice)->getJson("/api/conversations/{$conversationId}/messages")
            ->assertOk()
            ->assertJsonCount(0, 'messages');

        $this->actingAs($bob)->getJson("/api/conversations/{$conversationId}/messages")
            ->assertOk()
            ->assertJsonCount(0, 'messages');
    }

    public function test_non_sender_cannot_delete_for_everyone(): void
    {
        $alice = User::factory()->create();
        $bob = User::factory()->create();

        $conversationId = $this->actingAs($alice)->postJson('/api/conversations', [
            'participantUserId' => $bob->id,
        ])->json('conversation.id');

        $messageId = $this->actingAs($alice)->postJson("/api/conversations/{$conversationId}/messages", [
            'text' => 'Alice wrote this',
        ])->json('message.id');

        $this->actingAs($bob)->postJson("/api/conversations/{$conversationId}/messages/{$messageId}/delete", [
            'scope' => 'everyone',
        ])->assertForbidden();

        $this->actingAs($bob)->postJson("/api/conversations/{$conversationId}/messages/{$messageId}/delete", [
            'scope' => 'me',
        ])->assertOk();
    }

    public function test_delete_requires_auth(): void
    {
        $alice = User::factory()->create();
        $bob = User::factory()->create();

        $conversationId = $this->actingAs($alice)->postJson('/api/conversations', [
            'participantUserId' => $bob->id,
        ])->json('conversation.id');

        $messageId = $this->actingAs($alice)->postJson("/api/conversations/{$conversationId}/messages", [
            'text' => 'Protected',
        ])->json('message.id');

        $this->postJson("/api/conversations/{$conversationId}/messages/{$messageId}/delete", [
            'scope' => 'me',
        ])->assertUnauthorized();
    }
}
