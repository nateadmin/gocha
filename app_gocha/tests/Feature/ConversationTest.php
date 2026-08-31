<?php

namespace Tests\Feature;

use App\Models\User;
use App\Services\Auth\DeviceTokenService;
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
            ->assertJsonPath('messages.0.isOutgoing', false)
            ->assertJsonPath('messages.0.senderUserId', $alice->id);
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

    public function test_inbox_unread_summarizes_hidden_account_mail(): void
    {
        $alice = User::factory()->create();
        $bob = User::factory()->create();

        $conversationId = $this->actingAs($alice)->postJson('/api/conversations', [
            'participantUserId' => $bob->id,
        ])->json('conversation.id');

        $this->actingAs($alice)->getJson('/api/inbox/unread')
            ->assertOk()
            ->assertJsonPath('hasUnread', false)
            ->assertJsonPath('unreadMessages', 0);

        $this->actingAs($alice)->postJson("/api/conversations/{$conversationId}/messages", [
            'text' => 'Ping',
        ])->assertCreated();

        $this->actingAs($bob)->getJson('/api/inbox/unread')
            ->assertOk()
            ->assertJsonPath('hasUnread', true)
            ->assertJsonPath('unreadMessages', 1)
            ->assertJsonPath('unreadConversations', 1);

        $this->actingAs($alice)->getJson('/api/inbox/unread')
            ->assertOk()
            ->assertJsonPath('hasUnread', false);
    }

    public function test_inbox_unread_requires_auth(): void
    {
        $this->getJson('/api/inbox/unread')->assertUnauthorized();
    }

    public function test_inbox_unread_accepts_device_bearer_without_session(): void
    {
        $alice = User::factory()->create();
        $bob = User::factory()->create();
        $conversationId = $this->actingAs($alice)->postJson('/api/conversations', [
            'participantUserId' => $bob->id,
        ])->json('conversation.id');
        $this->actingAs($alice)->postJson("/api/conversations/{$conversationId}/messages", [
            'text' => 'Ping',
        ]);

        $this->app['auth']->forgetGuards();
        $bobToken = app(DeviceTokenService::class)->issue($bob)->plainTextToken;

        $this->withHeader('Authorization', 'Bearer '.$bobToken)
            ->getJson('/api/inbox/unread')
            ->assertOk()
            ->assertJsonPath('hasUnread', true)
            ->assertJsonPath('unreadMessages', 1);
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

    public function test_conversation_list_shows_you_prefix_for_outgoing_last_message(): void
    {
        $alice = User::factory()->create();
        $bob = User::factory()->create();

        $conversationId = $this->actingAs($alice)->postJson('/api/conversations', [
            'participantUserId' => $bob->id,
        ])->json('conversation.id');

        $this->actingAs($alice)->postJson("/api/conversations/{$conversationId}/messages", [
            'text' => 'Hi Bob',
        ])->assertCreated();

        $this->actingAs($alice)->getJson('/api/conversations')
            ->assertOk()
            ->assertJsonPath('conversations.0.preview', 'You: Hi Bob');

        $this->actingAs($bob)->getJson('/api/conversations')
            ->assertOk()
            ->assertJsonPath('conversations.0.preview', 'Hi Bob');
    }

    public function test_outgoing_message_status_is_sent_until_recipient_sees_then_reads_it(): void
    {
        $alice = User::factory()->create();
        $bob = User::factory()->create();

        $conversationId = $this->actingAs($alice)->postJson('/api/conversations', [
            'participantUserId' => $bob->id,
        ])->json('conversation.id');

        $this->actingAs($alice)->postJson("/api/conversations/{$conversationId}/messages", [
            'text' => 'Receipts',
        ])->assertCreated()
            ->assertJsonPath('message.status', 'sent');

        $this->actingAs($alice)->getJson('/api/conversations')->assertOk();
        $this->actingAs($alice)->getJson("/api/conversations/{$conversationId}/messages")
            ->assertOk()
            ->assertJsonPath('messages.0.status', 'sent');

        $this->actingAs($bob)->getJson('/api/conversations')->assertOk();

        $this->actingAs($alice)->getJson("/api/conversations/{$conversationId}/messages")
            ->assertOk()
            ->assertJsonPath('messages.0.status', 'delivered');

        $this->actingAs($bob)->postJson("/api/conversations/{$conversationId}/read")
            ->assertOk();

        $this->actingAs($alice)->getJson("/api/conversations/{$conversationId}/messages")
            ->assertOk()
            ->assertJsonPath('messages.0.status', 'read');
    }

    public function test_fetching_messages_as_recipient_marks_them_delivered(): void
    {
        $alice = User::factory()->create();
        $bob = User::factory()->create();

        $conversationId = $this->actingAs($alice)->postJson('/api/conversations', [
            'participantUserId' => $bob->id,
        ])->json('conversation.id');

        $this->actingAs($alice)->postJson("/api/conversations/{$conversationId}/messages", [
            'text' => 'Direct open',
        ])->assertCreated();

        $this->actingAs($bob)->getJson("/api/conversations/{$conversationId}/messages")
            ->assertOk();

        $this->actingAs($alice)->getJson("/api/conversations/{$conversationId}/messages")
            ->assertOk()
            ->assertJsonPath('messages.0.status', 'delivered');
    }
}
