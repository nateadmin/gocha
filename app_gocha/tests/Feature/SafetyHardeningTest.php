<?php

namespace Tests\Feature;

use App\Models\CommunityGroup;
use App\Models\CommunityGroupMembership;
use App\Models\ContentReport;
use App\Models\Conversation;
use App\Models\ConversationParticipant;
use App\Models\Message;
use App\Models\User;
use App\Support\CommunityGroupMembershipStatus;
use App\Support\ConversationType;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Blocks must stop contact on every path, and reports, deletion and the word
 * filter must behave safely (App Store guideline 1.2 and 5.1.1(v)).
 */
class SafetyHardeningTest extends TestCase
{
    use RefreshDatabase;

    private function startDm(User $from, User $to): int
    {
        return (int) $this->actingAs($from)->postJson('/api/conversations', [
            'participantUserId' => $to->id,
        ])->json('conversation.id');
    }

    private function block(User $blocker, User $blocked): void
    {
        $this->actingAs($blocker)->postJson('/api/blocks', ['userId' => $blocked->id])->assertOk();
    }

    public function test_new_group_leaves_out_people_blocked_either_way(): void
    {
        $alice = User::factory()->create();
        $harasser = User::factory()->create();
        $carol = User::factory()->create();
        $this->block($alice, $harasser);

        $conversationId = $this->actingAs($harasser)->postJson('/api/conversations', [
            'type' => 'group',
            'name' => 'Friends',
            'participantUserIds' => [$alice->id, $carol->id],
        ])->assertCreated()->json('conversation.id');

        $this->assertDatabaseMissing('conversation_participants', [
            'conversation_id' => $conversationId,
            'user_id' => $alice->id,
        ]);
        $this->assertDatabaseHas('conversation_participants', [
            'conversation_id' => $conversationId,
            'user_id' => $carol->id,
        ]);
    }

    public function test_blocked_user_cannot_be_added_to_a_broadcast_or_reached_through_one(): void
    {
        $alice = User::factory()->create();
        $harasser = User::factory()->create();
        $carol = User::factory()->create();

        $broadcastId = $this->actingAs($harasser)->postJson('/api/conversations', [
            'type' => 'broadcast',
            'name' => 'News',
            'participantUserIds' => [$alice->id, $carol->id],
        ])->assertCreated()->json('conversation.id');

        $this->block($alice, $harasser);

        $this->actingAs($harasser)->postJson("/api/conversations/{$broadcastId}/participants", [
            'userId' => $alice->id,
        ])->assertForbidden()->assertJsonPath('code', 'USER_BLOCKED');

        $this->actingAs($harasser)->postJson("/api/conversations/{$broadcastId}/messages", [
            'text' => 'hello everyone',
        ])->assertCreated();

        // Carol gets her copy; Alice, who blocked the sender, gets nothing.
        $this->assertTrue(Message::query()->where('body', 'hello everyone')
            ->whereIn('conversation_id', ConversationParticipant::query()->where('user_id', $carol->id)->select('conversation_id'))
            ->where('conversation_id', '!=', $broadcastId)->exists());
        $this->assertFalse(Message::query()->where('body', 'hello everyone')
            ->whereIn('conversation_id', ConversationParticipant::query()->where('user_id', $alice->id)->select('conversation_id'))
            ->where('conversation_id', '!=', $broadcastId)->exists());

        $dave = User::factory()->create();
        $this->block($dave, $harasser);
        $this->actingAs($harasser)->postJson("/api/conversations/{$broadcastId}/participants", [
            'userId' => $dave->id,
        ])->assertForbidden()->assertJsonPath('code', 'USER_BLOCKED');
    }

    public function test_statuses_are_hidden_both_ways_after_a_block(): void
    {
        $alice = User::factory()->create();
        $bob = User::factory()->create();
        $this->startDm($alice, $bob);
        $this->actingAs($alice)->postJson('/api/statuses', ['text' => 'my day'])->assertSuccessful();
        $this->actingAs($bob)->postJson('/api/statuses', ['text' => 'his day'])->assertSuccessful();

        $this->actingAs($bob)->getJson("/api/statuses/users/{$alice->id}")->assertOk();

        $this->block($alice, $bob);

        $this->actingAs($bob)->getJson("/api/statuses/users/{$alice->id}")->assertForbidden();
        $this->actingAs($alice)->getJson("/api/statuses/users/{$bob->id}")->assertForbidden();
        $this->assertCount(0, $this->actingAs($bob)->getJson('/api/statuses')->json('recent') ?? []);
    }

    public function test_group_preview_never_shows_a_blocked_senders_text(): void
    {
        $alice = User::factory()->create();
        $harasser = User::factory()->create();
        $carol = User::factory()->create();
        $groupId = $this->actingAs($carol)->postJson('/api/conversations', [
            'type' => 'group',
            'name' => 'Club',
            'participantUserIds' => [$alice->id, $harasser->id],
        ])->json('conversation.id');
        $this->actingAs($carol)->postJson("/api/conversations/{$groupId}/messages", ['text' => 'welcome'])->assertCreated();
        $this->block($alice, $harasser);
        $this->actingAs($harasser)->postJson("/api/conversations/{$groupId}/messages", ['text' => 'nasty words'])->assertCreated();

        $group = collect($this->actingAs($alice)->getJson('/api/conversations')->json('conversations'))
            ->firstWhere('id', $groupId);
        $this->assertSame('welcome', $group['preview']);
        $this->assertSame(0, $group['unreadCount'] - 1); // only Carol's message counts
        $this->assertNull($group['isBlocked']);
    }

    public function test_global_search_hides_blocked_people_and_their_messages(): void
    {
        $alice = User::factory()->create();
        $bob = User::factory()->create(['name' => 'Bob Pineapple', 'username' => 'bobpine', 'discoverable' => true]);
        $dave = User::factory()->create(['name' => 'Dave Pineapple', 'username' => 'davepine', 'discoverable' => true]);
        $conversationId = $this->startDm($alice, $bob);
        $this->actingAs($bob)->postJson("/api/conversations/{$conversationId}/messages", [
            'text' => 'pineapple pizza tonight?',
        ])->assertCreated();

        $before = $this->actingAs($alice)->getJson('/api/search?q=pineapple')->assertOk();
        $this->assertCount(1, $before->json('contacts'));
        $this->assertCount(1, $before->json('messages'));
        $this->assertCount(1, $before->json('people'));

        $this->block($alice, $bob);
        $this->block($dave, $alice);

        $after = $this->actingAs($alice)->getJson('/api/search?q=pineapple')->assertOk();
        $this->assertCount(0, $after->json('contacts'));
        $this->assertCount(0, $after->json('messages'));
        $this->assertCount(0, $after->json('people'));
    }

    public function test_message_report_always_targets_the_sender(): void
    {
        $alice = User::factory()->create();
        $bob = User::factory()->create();
        $innocent = User::factory()->create();
        $conversationId = $this->startDm($alice, $bob);
        $messageId = $this->actingAs($bob)->postJson("/api/conversations/{$conversationId}/messages", [
            'text' => 'spam spam',
        ])->json('message.id');

        $this->actingAs($alice)->postJson('/api/reports', [
            'reason' => 'spam',
            'messageId' => $messageId,
            'userId' => $innocent->id,
        ])->assertCreated();

        $this->assertSame($bob->id, (int) ContentReport::query()->value('reported_user_id'));
    }

    public function test_repeated_reports_reuse_the_open_report(): void
    {
        $alice = User::factory()->create();
        $bob = User::factory()->create();

        $first = $this->actingAs($alice)->postJson('/api/reports', ['reason' => 'spam', 'userId' => $bob->id])
            ->assertCreated()->json('report.id');
        $second = $this->actingAs($alice)->postJson('/api/reports', ['reason' => 'spam', 'userId' => $bob->id])
            ->assertOk()->json('report.id');

        $this->assertSame($first, $second);
        $this->assertSame(1, ContentReport::query()->count());
    }

    public function test_statuses_can_be_reported_only_by_people_who_can_see_them(): void
    {
        $alice = User::factory()->create();
        $bob = User::factory()->create();
        $stranger = User::factory()->create();
        $this->startDm($alice, $bob);
        $statusId = $this->actingAs($bob)->postJson('/api/statuses', ['text' => 'offensive'])->json('item.id');

        $this->actingAs($stranger)->postJson('/api/reports', ['reason' => 'hate', 'statusItemId' => $statusId])
            ->assertForbidden();
        $this->actingAs($alice)->postJson('/api/reports', ['reason' => 'hate', 'statusItemId' => $statusId])
            ->assertCreated();

        $report = ContentReport::query()->firstOrFail();
        $this->assertSame($bob->id, (int) $report->reported_user_id);
        $this->assertSame((int) $statusId, (int) $report->status_item_id);
    }

    public function test_deleting_a_group_owner_hands_the_group_to_a_member(): void
    {
        $owner = User::factory()->create();
        $member = User::factory()->create();
        $conversation = Conversation::query()->create([
            'type' => ConversationType::GROUP,
            'name' => 'Runners',
            'created_by_user_id' => $owner->id,
        ]);
        $group = CommunityGroup::query()->create([
            'owner_user_id' => $owner->id,
            'conversation_id' => $conversation->id,
            'name' => 'Runners',
            'privacy' => 'public',
            'avatar_label' => 'R',
            'avatar_color' => '#1B00D8',
            'member_count' => 2,
        ]);
        foreach ([[$owner, 'owner'], [$member, 'member']] as [$user, $role]) {
            CommunityGroupMembership::query()->create([
                'community_group_id' => $group->id,
                'user_id' => $user->id,
                'status' => CommunityGroupMembershipStatus::APPROVED,
                'role' => $role,
                'decided_at' => now(),
            ]);
        }

        $this->actingAs($owner)->postJson('/api/account/delete', ['confirm' => 'DELETE'])->assertOk();

        $group->refresh();
        $this->assertSame($member->id, (int) $group->owner_user_id);
        $this->assertSame(1, (int) $group->member_count);
        $this->assertSame($member->id, (int) $conversation->fresh()->created_by_user_id);
    }

    public function test_deleting_an_account_clears_its_last_message_from_other_chat_lists(): void
    {
        $alice = User::factory()->create();
        $bob = User::factory()->create();
        $conversationId = $this->startDm($alice, $bob);
        $this->actingAs($bob)->postJson("/api/conversations/{$conversationId}/messages", ['text' => 'hi alice'])->assertCreated();
        $this->actingAs($alice)->postJson("/api/conversations/{$conversationId}/messages", ['text' => 'my secret'])->assertCreated();

        $this->actingAs($alice)->postJson('/api/account/delete', ['confirm' => 'DELETE'])->assertOk();

        $conversation = Conversation::query()->findOrFail($conversationId);
        $this->assertSame('hi alice', $conversation->last_message_body);
        $this->assertSame($bob->id, (int) $conversation->last_message_sender_user_id);
    }

    public function test_filter_keeps_links_and_innocent_words(): void
    {
        $alice = User::factory()->create();
        $bob = User::factory()->create();
        $conversationId = $this->startDm($alice, $bob);

        $this->actingAs($alice)->postJson("/api/conversations/{$conversationId}/messages", [
            'text' => 'see https://example.com/shit-happens and the retard de train',
        ])->assertCreated()
            ->assertJsonPath('message.text', 'see https://example.com/shit-happens and the retard de train');
    }

    public function test_filter_masks_group_names_and_profile_text(): void
    {
        $alice = User::factory()->create();

        $this->actingAs($alice)->postJson('/api/conversations', [
            'type' => 'group',
            'name' => 'shit club',
        ])->assertCreated()->assertJsonPath('conversation.name', '**** club');

        $alice->forceFill(['bio' => 'total bullshit'])->save();
        $this->assertSame('total ********', $alice->fresh()->bio);
    }
}
