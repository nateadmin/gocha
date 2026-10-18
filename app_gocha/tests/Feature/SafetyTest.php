<?php

namespace Tests\Feature;

use App\Models\ContentReport;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class SafetyTest extends TestCase
{
    use RefreshDatabase;

    private function startDm(User $from, User $to): int
    {
        return (int) $this->actingAs($from)->postJson('/api/conversations', [
            'participantUserId' => $to->id,
        ])->json('conversation.id');
    }

    public function test_blocked_users_cannot_message_each_other_either_way(): void
    {
        $alice = User::factory()->create();
        $bob = User::factory()->create();
        $conversationId = $this->startDm($alice, $bob);

        $this->actingAs($alice)->postJson('/api/blocks', ['userId' => $bob->id])
            ->assertOk()
            ->assertJsonPath('blocked', true);

        $this->actingAs($bob)->postJson("/api/conversations/{$conversationId}/messages", ['text' => 'hi'])
            ->assertForbidden()
            ->assertJsonPath('code', 'USER_BLOCKED');
        $this->actingAs($alice)->postJson("/api/conversations/{$conversationId}/messages", ['text' => 'hi'])
            ->assertForbidden();

        $this->actingAs($alice)->getJson('/api/conversations')
            ->assertOk()
            ->assertJsonPath('conversations.0.isBlocked', true);
        $this->actingAs($alice)->getJson('/api/blocks')
            ->assertOk()
            ->assertJsonPath('blocks.0.userId', $bob->id);
    }

    public function test_blocked_user_cannot_start_a_new_conversation(): void
    {
        $alice = User::factory()->create();
        $bob = User::factory()->create();

        $this->actingAs($alice)->postJson('/api/blocks', ['userId' => $bob->id])->assertOk();

        $this->actingAs($bob)->postJson('/api/conversations', ['participantUserId' => $alice->id])
            ->assertForbidden()
            ->assertJsonPath('code', 'USER_BLOCKED');
    }

    public function test_unblock_restores_messaging(): void
    {
        $alice = User::factory()->create();
        $bob = User::factory()->create();
        $conversationId = $this->startDm($alice, $bob);

        $this->actingAs($alice)->postJson('/api/blocks', ['userId' => $bob->id])->assertOk();
        $this->actingAs($alice)->deleteJson("/api/blocks/{$bob->id}")
            ->assertOk()
            ->assertJsonPath('blocked', false);

        $this->actingAs($bob)->postJson("/api/conversations/{$conversationId}/messages", ['text' => 'hi again'])
            ->assertCreated();
    }

    public function test_cannot_block_yourself(): void
    {
        $alice = User::factory()->create();

        $this->actingAs($alice)->postJson('/api/blocks', ['userId' => $alice->id])
            ->assertStatus(422);
    }

    public function test_reporting_a_message_stores_evidence(): void
    {
        $alice = User::factory()->create();
        $bob = User::factory()->create();
        $conversationId = $this->startDm($alice, $bob);
        $messageId = $this->actingAs($bob)->postJson("/api/conversations/{$conversationId}/messages", [
            'text' => 'buy cheap pills now',
        ])->json('message.id');

        $this->actingAs($alice)->postJson('/api/reports', [
            'reason' => 'spam',
            'messageId' => $messageId,
            'details' => 'unsolicited',
        ])->assertCreated();

        $report = ContentReport::query()->firstOrFail();
        $this->assertSame($alice->id, (int) $report->reporter_user_id);
        $this->assertSame($bob->id, (int) $report->reported_user_id);
        $this->assertSame('buy cheap pills now', $report->message_excerpt);
        $this->assertSame(ContentReport::STATUS_OPEN, $report->status);
    }

    public function test_cannot_report_a_message_from_someone_elses_conversation(): void
    {
        $alice = User::factory()->create();
        $bob = User::factory()->create();
        $mallory = User::factory()->create();
        $conversationId = $this->startDm($alice, $bob);
        $messageId = $this->actingAs($bob)->postJson("/api/conversations/{$conversationId}/messages", [
            'text' => 'private',
        ])->json('message.id');

        $this->actingAs($mallory)->postJson('/api/reports', [
            'reason' => 'spam',
            'messageId' => $messageId,
        ])->assertForbidden();

        $this->assertSame(0, ContentReport::query()->count());
    }

    public function test_reporting_a_user_and_admin_resolving_it(): void
    {
        $alice = User::factory()->create();
        $bob = User::factory()->create();
        $admin = User::factory()->create(['is_admin' => true]);

        $reportId = $this->actingAs($alice)->postJson('/api/reports', [
            'reason' => 'harassment',
            'userId' => $bob->id,
        ])->assertCreated()->json('report.id');

        $this->actingAs($alice)->getJson('/api/admin/reports')->assertForbidden();

        $this->actingAs($admin)->getJson('/api/admin/reports')
            ->assertOk()
            ->assertJsonPath('reports.0.id', $reportId)
            ->assertJsonPath('reports.0.reportedUser.id', $bob->id);

        $this->actingAs($admin)->postJson("/api/admin/reports/{$reportId}/resolve")
            ->assertOk()
            ->assertJsonPath('report.status', 'resolved');
    }

    public function test_report_rejects_unknown_reason_and_missing_target(): void
    {
        $alice = User::factory()->create();

        $this->actingAs($alice)->postJson('/api/reports', ['reason' => 'nope', 'userId' => $alice->id])
            ->assertStatus(422);
        $this->actingAs($alice)->postJson('/api/reports', ['reason' => 'spam'])
            ->assertStatus(422);
    }

    public function test_blocked_users_are_hidden_from_search(): void
    {
        $alice = User::factory()->create();
        $bob = User::factory()->create(['username' => 'bobsearchable', 'discoverable' => true]);

        $this->actingAs($alice)->getJson('/api/users/search?q=bobsearch')
            ->assertOk()
            ->assertJsonCount(1, 'results');

        $this->actingAs($bob)->postJson('/api/blocks', ['userId' => $alice->id])->assertOk();

        $this->actingAs($alice)->getJson('/api/users/search?q=bobsearch')
            ->assertOk()
            ->assertJsonCount(0, 'results');
    }

    public function test_objectionable_words_are_masked_in_messages(): void
    {
        $alice = User::factory()->create();
        $bob = User::factory()->create();
        $conversationId = $this->startDm($alice, $bob);

        $this->actingAs($alice)->postJson("/api/conversations/{$conversationId}/messages", [
            'text' => 'what the fuck, this class is shit',
        ])->assertCreated()
            ->assertJsonPath('message.text', 'what the ****, this class is ****');
    }
}
