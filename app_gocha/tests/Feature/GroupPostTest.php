<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class GroupPostTest extends TestCase
{
    use RefreshDatabase;

    public function test_member_can_claim_an_offer_and_it_becomes_taken(): void
    {
        [$alice, $bob, $carol, $conversationId] = $this->group();

        $create = $this->actingAs($alice)->postJson("/api/conversations/{$conversationId}/messages", [
            'type' => 'offer',
            'title' => 'Free accent chair',
            'description' => 'Great condition. Must go today.',
            'location' => 'Woodmere',
            'locationKind' => 'pickup',
        ])->assertCreated()
            ->assertJsonPath('message.type', 'offer')
            ->assertJsonPath('message.post.offer.title', 'Free accent chair')
            ->assertJsonPath('message.post.offer.status', 'available')
            ->assertJsonPath('message.post.offer.canMarkTaken', true)
            ->assertJsonPath('message.senderName', $alice->name);

        $messageId = $create->json('message.id');

        $this->actingAs($bob)->postJson("/api/conversations/{$conversationId}/messages/{$messageId}/act", [
            'action' => 'claim',
        ])->assertOk()
            ->assertJsonPath('message.post.offer.status', 'taken')
            ->assertJsonPath('message.post.offer.myClaimed', true)
            ->assertJsonPath('message.post.offer.claimedByUserId', $bob->id);

        $this->actingAs($carol)->postJson("/api/conversations/{$conversationId}/messages/{$messageId}/act", [
            'action' => 'claim',
        ])->assertStatus(409)
            ->assertJsonPath('code', 'ALREADY_TAKEN');

        $this->actingAs($bob)->getJson("/api/conversations/{$conversationId}/messages")
            ->assertOk()
            ->assertJsonPath('messages.0.post.offer.status', 'taken')
            ->assertJsonPath('messages.0.post.offer.claimedByName', $bob->name);
    }

    public function test_poster_can_mark_taken_and_release(): void
    {
        [$alice, $bob, , $conversationId] = $this->group();

        $messageId = $this->actingAs($alice)->postJson("/api/conversations/{$conversationId}/messages", [
            'type' => 'offer',
            'title' => 'Couch',
        ])->json('message.id');

        $this->actingAs($bob)->postJson("/api/conversations/{$conversationId}/messages/{$messageId}/act", [
            'action' => 'taken',
        ])->assertStatus(403);

        $this->actingAs($alice)->postJson("/api/conversations/{$conversationId}/messages/{$messageId}/act", [
            'action' => 'taken',
        ])->assertOk()
            ->assertJsonPath('message.post.offer.status', 'taken')
            ->assertJsonPath('message.post.offer.canRelease', true);

        $this->actingAs($alice)->postJson("/api/conversations/{$conversationId}/messages/{$messageId}/act", [
            'action' => 'taken',
        ])->assertOk()
            ->assertJsonPath('message.post.offer.status', 'taken');

        $this->actingAs($alice)->postJson("/api/conversations/{$conversationId}/messages/{$messageId}/act", [
            'action' => 'release',
        ])->assertOk()
            ->assertJsonPath('message.post.offer.status', 'available');
    }

    public function test_offer_is_rejected_in_a_direct_chat(): void
    {
        $alice = User::factory()->create();
        $bob = User::factory()->create();
        $conversationId = $this->actingAs($alice)->postJson('/api/conversations', [
            'participantUserId' => $bob->id,
        ])->json('conversation.id');

        $this->actingAs($alice)->postJson("/api/conversations/{$conversationId}/messages", [
            'type' => 'offer',
            'title' => 'Lamp',
        ])->assertStatus(422)
            ->assertJsonPath('code', 'GROUP_ONLY');
    }

    public function test_poll_vote_is_single_choice_and_can_be_changed(): void
    {
        [$alice, $bob, , $conversationId] = $this->group();

        $messageId = $this->actingAs($alice)->postJson("/api/conversations/{$conversationId}/messages", [
            'type' => 'poll',
            'question' => 'Picnic day?',
            'kind' => 'vote',
            'options' => ['Saturday', 'Sunday'],
        ])->assertCreated()
            ->assertJsonPath('message.type', 'poll')
            ->assertJsonPath('message.post.poll.options.0.text', 'Saturday')
            ->json('message.id');

        $this->actingAs($bob)->postJson("/api/conversations/{$conversationId}/messages/{$messageId}/act", [
            'action' => 'vote',
            'choice' => 'o1',
        ])->assertOk()
            ->assertJsonPath('message.post.poll.options.0.count', 1)
            ->assertJsonPath('message.post.poll.options.0.selected', true)
            ->assertJsonPath('message.post.poll.options.1.count', 0);

        $this->actingAs($bob)->postJson("/api/conversations/{$conversationId}/messages/{$messageId}/act", [
            'action' => 'vote',
            'choice' => 'o2',
        ])->assertOk()
            ->assertJsonPath('message.post.poll.options.0.count', 0)
            ->assertJsonPath('message.post.poll.options.1.count', 1)
            ->assertJsonPath('message.post.poll.myChoices.0', 'o2');

        $this->actingAs($bob)->postJson("/api/conversations/{$conversationId}/messages/{$messageId}/act", [
            'action' => 'vote',
            'choice' => 'o2',
        ])->assertOk()
            ->assertJsonPath('message.post.poll.totalVotes', 0);
    }

    public function test_multi_poll_allows_two_choices(): void
    {
        [$alice, $bob, , $conversationId] = $this->group();

        $messageId = $this->actingAs($alice)->postJson("/api/conversations/{$conversationId}/messages", [
            'type' => 'poll',
            'question' => 'Food',
            'kind' => 'multi',
            'options' => ['Pizza', 'Salad', 'Tacos'],
        ])->json('message.id');

        $this->actingAs($bob)->postJson("/api/conversations/{$conversationId}/messages/{$messageId}/act", [
            'action' => 'vote',
            'choice' => 'o1',
        ])->assertOk();

        $this->actingAs($bob)->postJson("/api/conversations/{$conversationId}/messages/{$messageId}/act", [
            'action' => 'vote',
            'choice' => 'o3',
        ])->assertOk()
            ->assertJsonPath('message.post.poll.options.0.selected', true)
            ->assertJsonPath('message.post.poll.options.2.selected', true)
            ->assertJsonPath('message.post.poll.totalVotes', 2);
    }

    public function test_rsvp_tracks_going_maybe_and_cant(): void
    {
        [$alice, $bob, $carol, $conversationId] = $this->group();

        $messageId = $this->actingAs($alice)->postJson("/api/conversations/{$conversationId}/messages", [
            'type' => 'rsvp',
            'title' => 'Block party',
            'when' => 'Sat 4pm',
            'where' => 'Cedar Park',
        ])->assertCreated()
            ->assertJsonPath('message.post.rsvp.title', 'Block party')
            ->json('message.id');

        $this->actingAs($bob)->postJson("/api/conversations/{$conversationId}/messages/{$messageId}/act", [
            'action' => 'vote',
            'choice' => 'going',
        ])->assertOk()
            ->assertJsonPath('message.post.rsvp.counts.going', 1)
            ->assertJsonPath('message.post.rsvp.myChoice', 'going');

        $this->actingAs($carol)->postJson("/api/conversations/{$conversationId}/messages/{$messageId}/act", [
            'action' => 'vote',
            'choice' => 'maybe',
        ])->assertOk()
            ->assertJsonPath('message.post.rsvp.counts.maybe', 1);

        $this->actingAs($bob)->postJson("/api/conversations/{$conversationId}/messages/{$messageId}/act", [
            'action' => 'vote',
            'choice' => 'cant',
        ])->assertOk()
            ->assertJsonPath('message.post.rsvp.counts.going', 0)
            ->assertJsonPath('message.post.rsvp.counts.cant', 1);
    }

    public function test_outsider_cannot_act_on_a_group_post(): void
    {
        [$alice, , , $conversationId] = $this->group();
        $outsider = User::factory()->create();

        $messageId = $this->actingAs($alice)->postJson("/api/conversations/{$conversationId}/messages", [
            'type' => 'poll',
            'question' => 'Closed group',
            'options' => ['Yes', 'No'],
        ])->json('message.id');

        $this->actingAs($outsider)->postJson("/api/conversations/{$conversationId}/messages/{$messageId}/act", [
            'action' => 'vote',
            'choice' => 'o1',
        ])->assertForbidden();
    }

    public function test_offer_requires_a_title(): void
    {
        [$alice, , , $conversationId] = $this->group();

        $this->actingAs($alice)->postJson("/api/conversations/{$conversationId}/messages", [
            'type' => 'offer',
            'title' => '  ',
        ])->assertStatus(422);
    }

    /**
     * @return array{0: User, 1: User, 2: User, 3: int}
     */
    private function group(): array
    {
        $alice = User::factory()->create(['name' => 'Sarah M.']);
        $bob = User::factory()->create(['name' => 'Bob Claim']);
        $carol = User::factory()->create(['name' => 'Carol Late']);

        $conversationId = (int) $this->actingAs($alice)->postJson('/api/conversations', [
            'type' => 'group',
            'name' => 'Five Towns Giveaways',
            'participantUserIds' => [$bob->id, $carol->id],
        ])->json('conversation.id');

        return [$alice, $bob, $carol, $conversationId];
    }
}
