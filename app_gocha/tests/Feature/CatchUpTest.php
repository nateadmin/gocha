<?php

namespace Tests\Feature;

use App\Models\CatchUpBrief;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class CatchUpTest extends TestCase
{
    use RefreshDatabase;

    public function test_job_writes_viewer_briefs_from_messages_and_get_returns_only_viewer_data(): void
    {
        Http::fake([
            'https://api.openai.com/v1/chat/completions' => Http::response($this->openaiPayload([
                'summary' => 'Alice asked about Friday dinner.',
                'attention' => ['Reply about Friday dinner'],
                'plans' => [['when' => 'Friday', 'what' => 'dinner']],
                'priority' => 'high',
            ]), 200),
        ]);

        $alice = User::factory()->create(['name' => 'Alice Example']);
        $bob = User::factory()->create(['name' => 'Bob Example']);
        $conversationId = $this->startConversation($alice, $bob);
        $this->actingAs($alice)->postJson("/api/conversations/{$conversationId}/messages", [
            'text' => 'Are we still on for Friday dinner?',
        ])->assertCreated();

        $this->artisan('gocha:catch-up-generate')->assertSuccessful();

        $this->assertDatabaseCount('catch_up_briefs', 2);
        $this->assertDatabaseHas('pipeline_heartbeats', [
            'lock_domain' => 'catch-up-generate',
        ]);

        $alicePayload = $this->actingAs($alice)->getJson('/api/catch-up')
            ->assertOk()
            ->assertJsonPath('conversations.0.id', $conversationId)
            ->assertJsonPath('conversations.0.name', 'Bob Example')
            ->assertJsonPath('conversations.0.summary', 'Alice asked about Friday dinner.')
            ->assertJsonPath('conversations.0.priority', 'High')
            ->assertJsonPath('attention.0.text', 'Reply about Friday dinner')
            ->json();

        $this->assertStringContainsString('Friday', $alicePayload['conversations'][0]['plans'][0]);

        $this->actingAs($bob)->getJson('/api/catch-up')
            ->assertOk()
            ->assertJsonPath('conversations.0.name', 'Alice Example')
            ->assertJsonMissing(['name' => 'Bob Example']);

        Http::assertSent(function ($request) {
            $body = $request->data();

            return $request->url() === 'https://api.openai.com/v1/chat/completions'
                && ($body['model'] ?? null) === 'gpt-4o-mini'
                && str_contains((string) data_get($body, 'messages.1.content'), 'Are we still on for Friday dinner?')
                && ! str_contains(json_encode($body), 'test-openai-key');
        });
    }

    public function test_empty_conversations_are_skipped(): void
    {
        Http::fake();

        $alice = User::factory()->create();
        $bob = User::factory()->create();
        $this->startConversation($alice, $bob);

        $this->artisan('gocha:catch-up-generate')->assertSuccessful();

        $this->assertDatabaseCount('catch_up_briefs', 0);
        Http::assertNothingSent();

        $this->actingAs($alice)->getJson('/api/catch-up')
            ->assertOk()
            ->assertJsonPath('briefing', '')
            ->assertJsonPath('conversations', [])
            ->assertJsonPath('attention', []);
    }

    public function test_invalid_model_json_is_rejected(): void
    {
        Http::fake([
            'https://api.openai.com/v1/chat/completions' => Http::response([
                'choices' => [
                    ['message' => ['content' => '{"summary":"ok","extra":true}']],
                ],
            ], 200),
        ]);

        $alice = User::factory()->create();
        $bob = User::factory()->create();
        $conversationId = $this->startConversation($alice, $bob);
        $this->actingAs($alice)->postJson("/api/conversations/{$conversationId}/messages", [
            'text' => 'Hello',
        ])->assertCreated();

        $this->artisan('gocha:catch-up-generate')->assertSuccessful();

        $this->assertDatabaseCount('catch_up_briefs', 0);
    }

    public function test_job_skips_conversation_when_source_message_is_unchanged(): void
    {
        $alice = User::factory()->create();
        $bob = User::factory()->create();
        $conversationId = $this->startConversation($alice, $bob);
        $this->actingAs($alice)->postJson("/api/conversations/{$conversationId}/messages", [
            'text' => 'First note',
        ])->assertCreated();

        Http::fake([
            'https://api.openai.com/v1/chat/completions' => Http::response($this->openaiPayload([
                'summary' => 'First note recap.',
                'attention' => [],
                'plans' => [],
                'priority' => 'low',
            ]), 200),
        ]);

        $this->artisan('gocha:catch-up-generate')->assertSuccessful();
        Http::assertSentCount(2);

        Http::fake([
            'https://api.openai.com/v1/chat/completions' => Http::response($this->openaiPayload([
                'summary' => 'Should not write.',
                'attention' => [],
                'plans' => [],
                'priority' => 'high',
            ]), 200),
        ]);

        $this->artisan('gocha:catch-up-generate')->assertSuccessful();
        Http::assertNothingSent();
        $this->assertSame('First note recap.', CatchUpBrief::query()->first()->summary);
    }

    public function test_catch_up_requires_auth(): void
    {
        $this->getJson('/api/catch-up')->assertUnauthorized();
    }

    /**
     * @param  array<string, mixed>  $payload
     * @return array<string, mixed>
     */
    private function openaiPayload(array $payload): array
    {
        return [
            'choices' => [
                ['message' => ['content' => json_encode($payload)]],
            ],
        ];
    }

    private function startConversation(User $alice, User $bob): int
    {
        return (int) $this->actingAs($alice)->postJson('/api/conversations', [
            'participantUserId' => $bob->id,
        ])->json('conversation.id');
    }
}
