<?php

namespace Tests\Feature;

use App\Models\CommunityGroup;
use App\Models\CommunityGroupMembership;
use App\Models\Conversation;
use App\Models\ConversationParticipant;
use App\Models\User;
use App\Support\CommunityGroupMembershipStatus;
use App\Support\ConversationType;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CommunityGroupJoinTest extends TestCase
{
    use RefreshDatabase;

    public function test_user_can_request_to_join_a_public_around_me_group(): void
    {
        $owner = User::factory()->create();
        $joiner = User::factory()->create(['name' => 'Jordan Shore']);
        $group = $this->createDiscoverableGroup($owner);

        $this->actingAs($joiner)
            ->postJson("/api/groups/{$group->id}/join-requests")
            ->assertCreated()
            ->assertJsonPath('request.status', CommunityGroupMembershipStatus::PENDING)
            ->assertJsonPath('group.membershipStatus', 'pending');

        $this->actingAs($joiner)
            ->getJson('/api/groups/discover')
            ->assertOk()
            ->assertJsonPath('groups.0.membershipStatus', 'pending');

        $this->actingAs($owner)
            ->getJson("/api/groups/{$group->id}/join-requests")
            ->assertOk()
            ->assertJsonCount(1, 'requests')
            ->assertJsonPath('requests.0.user.displayName', 'Jordan Shore');
    }

    public function test_owner_can_approve_a_join_request_and_add_the_member_to_the_group_chat(): void
    {
        $owner = User::factory()->create();
        $joiner = User::factory()->create();
        $conversation = Conversation::query()->create([
            'type' => ConversationType::GROUP,
            'name' => 'Shore Runners',
            'created_by_user_id' => $owner->id,
        ]);
        ConversationParticipant::query()->create([
            'conversation_id' => $conversation->id,
            'user_id' => $owner->id,
        ]);
        $group = $this->createDiscoverableGroup($owner, $conversation->id);

        $requestId = $this->actingAs($joiner)
            ->postJson("/api/groups/{$group->id}/join-requests")
            ->assertCreated()
            ->json('request.id');

        $this->actingAs($owner)
            ->postJson("/api/groups/{$group->id}/join-requests/{$requestId}/approve")
            ->assertOk()
            ->assertJsonPath('request.status', CommunityGroupMembershipStatus::APPROVED)
            ->assertJsonPath('group.membershipStatus', 'owner')
            ->assertJsonPath('group.memberCount', 2)
            ->assertJsonPath('group.pendingRequestCount', 0);

        $this->assertDatabaseHas('conversation_participants', [
            'conversation_id' => $conversation->id,
            'user_id' => $joiner->id,
        ]);

        $this->actingAs($joiner)
            ->getJson('/api/groups/discover')
            ->assertJsonPath('groups.0.membershipStatus', 'member');
    }

    public function test_owner_can_decline_a_join_request(): void
    {
        $owner = User::factory()->create();
        $joiner = User::factory()->create();
        $group = $this->createDiscoverableGroup($owner);

        $requestId = $this->actingAs($joiner)
            ->postJson("/api/groups/{$group->id}/join-requests")
            ->json('request.id');

        $this->actingAs($owner)
            ->postJson("/api/groups/{$group->id}/join-requests/{$requestId}/decline")
            ->assertOk()
            ->assertJsonPath('request.status', CommunityGroupMembershipStatus::DECLINED);

        $this->actingAs($joiner)
            ->getJson('/api/groups/discover')
            ->assertJsonPath('groups.0.membershipStatus', 'none');
    }

    public function test_owner_cannot_request_to_join_their_own_group(): void
    {
        $owner = User::factory()->create();
        $group = $this->createDiscoverableGroup($owner);

        $this->actingAs($owner)
            ->postJson("/api/groups/{$group->id}/join-requests")
            ->assertStatus(422)
            ->assertJsonValidationErrors(['group']);
    }

    public function test_private_group_rejects_join_requests(): void
    {
        $owner = User::factory()->create();
        $joiner = User::factory()->create();
        $group = CommunityGroup::query()->create([
            'owner_user_id' => $owner->id,
            'name' => 'Secret Club',
            'privacy' => 'private',
            'member_count' => 1,
        ]);

        $this->actingAs($joiner)
            ->postJson("/api/groups/{$group->id}/join-requests")
            ->assertForbidden();
    }

    public function test_non_owner_cannot_approve_a_join_request(): void
    {
        $owner = User::factory()->create();
        $joiner = User::factory()->create();
        $stranger = User::factory()->create();
        $group = $this->createDiscoverableGroup($owner);

        $requestId = $this->actingAs($joiner)
            ->postJson("/api/groups/{$group->id}/join-requests")
            ->json('request.id');

        $this->actingAs($stranger)
            ->postJson("/api/groups/{$group->id}/join-requests/{$requestId}/approve")
            ->assertForbidden();
    }

    public function test_creating_a_group_records_the_owner_as_a_member(): void
    {
        $owner = User::factory()->create();

        $groupId = $this->actingAs($owner)->postJson('/api/groups', [
            'name' => 'Shore Runners',
            'privacy' => 'public',
            'show_in_around_me' => true,
            'address' => '123 Ocean Ave',
            'google_place_id' => 'ChIJocean',
            'city' => 'Asbury Park',
            'state' => 'NJ',
        ])->assertCreated()->json('group.id');

        $this->assertDatabaseHas('community_group_memberships', [
            'community_group_id' => $groupId,
            'user_id' => $owner->id,
            'status' => CommunityGroupMembershipStatus::APPROVED,
            'role' => 'owner',
        ]);
    }

    private function createDiscoverableGroup(User $owner, ?int $conversationId = null): CommunityGroup
    {
        $group = CommunityGroup::query()->create([
            'owner_user_id' => $owner->id,
            'conversation_id' => $conversationId,
            'name' => 'Shore Runners',
            'description' => 'Morning miles',
            'privacy' => 'public',
            'address' => '123 Ocean Ave',
            'city' => 'Asbury Park',
            'state' => 'NJ',
            'google_place_id' => 'ChIJocean',
            'latitude' => 40.2204,
            'longitude' => -74.0121,
            'show_in_around_me' => true,
            'avatar_label' => 'SR',
            'avatar_color' => '#1B00D8',
            'member_count' => 1,
        ]);

        CommunityGroupMembership::query()->create([
            'community_group_id' => $group->id,
            'user_id' => $owner->id,
            'status' => CommunityGroupMembershipStatus::APPROVED,
            'role' => 'owner',
            'requested_at' => now(),
            'decided_at' => now(),
        ]);

        return $group;
    }
}
