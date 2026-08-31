<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class MessageTranslationTest extends TestCase
{
    use RefreshDatabase;

    public function test_english_incoming_message_is_not_translated_for_english_viewer(): void
    {
        Http::fake();

        [$alice, $bob, $conversationId] = $this->pair();

        $this->actingAs($alice)->postJson("/api/conversations/{$conversationId}/messages", [
            'text' => 'Hey Bob',
        ])->assertCreated();

        $this->actingAs($bob)->getJson("/api/conversations/{$conversationId}/messages")
            ->assertOk()
            ->assertJsonPath('messages.0.text', 'Hey Bob')
            ->assertJsonPath('messages.0.originalText', 'Hey Bob')
            ->assertJsonPath('messages.0.isTranslated', false);

        Http::assertNothingSent();
    }

    public function test_outgoing_message_stays_in_the_original_language(): void
    {
        Http::fake();

        $alice = User::factory()->create(['language' => 'en']);
        $bob = User::factory()->create(['language' => 'he']);
        $conversationId = $this->startConversation($alice, $bob);

        $this->actingAs($alice)->postJson("/api/conversations/{$conversationId}/messages", [
            'text' => 'Hello from Alice',
        ])
            ->assertCreated()
            ->assertJsonPath('message.text', 'Hello from Alice')
            ->assertJsonPath('message.isOutgoing', true)
            ->assertJsonPath('message.isTranslated', false);

        Http::assertNothingSent();
    }

    public function test_incoming_hebrew_is_translated_for_english_viewer_with_original(): void
    {
        Http::fake([
            'https://api.openai.com/v1/chat/completions' => Http::response($this->openaiPayload([
                'source' => 'he',
                'text' => 'Hello what is going on',
            ]), 200),
        ]);

        $alice = User::factory()->create(['language' => 'he']);
        $bob = User::factory()->create(['language' => 'en']);
        $conversationId = $this->startConversation($alice, $bob);

        $this->actingAs($alice)->postJson("/api/conversations/{$conversationId}/messages", [
            'text' => 'שלום מה נשמע',
        ])->assertCreated();

        $this->actingAs($bob)->getJson("/api/conversations/{$conversationId}/messages")
            ->assertOk()
            ->assertJsonPath('messages.0.text', 'Hello what is going on')
            ->assertJsonPath('messages.0.originalText', 'שלום מה נשמע')
            ->assertJsonPath('messages.0.isTranslated', true)
            ->assertJsonPath('messages.0.sourceLanguage', 'he')
            ->assertJsonPath('messages.0.isOutgoing', false);

        $this->actingAs($bob)->getJson("/api/conversations/{$conversationId}/messages")
            ->assertOk()
            ->assertJsonPath('messages.0.text', 'Hello what is going on')
            ->assertJsonPath('messages.0.isTranslated', true);

        Http::assertSentCount(1);
    }

    public function test_same_language_hebrew_viewer_skips_openai(): void
    {
        Http::fake();

        $alice = User::factory()->create(['language' => 'he']);
        $bob = User::factory()->create(['language' => 'he']);
        $conversationId = $this->startConversation($alice, $bob);

        $this->actingAs($alice)->postJson("/api/conversations/{$conversationId}/messages", [
            'text' => 'שלום מה נשמע',
        ])->assertCreated();

        $this->actingAs($bob)->getJson("/api/conversations/{$conversationId}/messages")
            ->assertOk()
            ->assertJsonPath('messages.0.text', 'שלום מה נשמע')
            ->assertJsonPath('messages.0.isTranslated', false)
            ->assertJsonPath('messages.0.sourceLanguage', 'he');

        Http::assertNothingSent();
    }

    public function test_translation_failure_returns_original_without_signing_out(): void
    {
        Http::fake([
            'https://api.openai.com/v1/chat/completions' => Http::response(['error' => 'nope'], 500),
        ]);

        $alice = User::factory()->create(['language' => 'he']);
        $bob = User::factory()->create(['language' => 'en']);
        $conversationId = $this->startConversation($alice, $bob);

        $this->actingAs($alice)->postJson("/api/conversations/{$conversationId}/messages", [
            'text' => 'שלום מה נשמע',
        ])->assertCreated();

        $this->actingAs($bob)->getJson("/api/conversations/{$conversationId}/messages")
            ->assertOk()
            ->assertJsonPath('messages.0.text', 'שלום מה נשמע')
            ->assertJsonPath('messages.0.isTranslated', false);

        $this->actingAs($bob)->getJson('/api/me')
            ->assertOk()
            ->assertJsonPath('user.id', $bob->id);
    }

    /**
     * @return array{0: User, 1: User, 2: int}
     */
    private function pair(): array
    {
        $alice = User::factory()->create(['language' => 'en']);
        $bob = User::factory()->create(['language' => 'en']);

        return [$alice, $bob, $this->startConversation($alice, $bob)];
    }

    private function startConversation(User $alice, User $bob): int
    {
        return (int) $this->actingAs($alice)->postJson('/api/conversations', [
            'participantUserId' => $bob->id,
        ])->json('conversation.id');
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
}
