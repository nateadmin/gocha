<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class ConsentTest extends TestCase
{
    use RefreshDatabase;

    public function test_new_users_have_not_accepted_terms_or_ai(): void
    {
        $alice = User::factory()->create();

        $this->actingAs($alice)->getJson('/api/me')
            ->assertOk()
            ->assertJsonPath('user.termsAccepted', false)
            ->assertJsonPath('user.aiFeaturesEnabled', false)
            ->assertJsonPath('user.aiConsentDecided', false);
    }

    public function test_accepting_terms(): void
    {
        $alice = User::factory()->create();

        $this->actingAs($alice)->postJson('/api/profile/accept-terms', ['accepted' => false])
            ->assertStatus(422);

        $this->actingAs($alice)->postJson('/api/profile/accept-terms', ['accepted' => true])
            ->assertOk()
            ->assertJsonPath('user.termsAccepted', true);
    }

    public function test_ai_consent_can_be_given_and_withdrawn(): void
    {
        $alice = User::factory()->create();

        $this->actingAs($alice)->postJson('/api/profile/ai-consent', ['enabled' => true])
            ->assertOk()
            ->assertJsonPath('user.aiFeaturesEnabled', true)
            ->assertJsonPath('user.aiConsentDecided', true);

        $this->actingAs($alice)->postJson('/api/profile/ai-consent', ['enabled' => false])
            ->assertOk()
            ->assertJsonPath('user.aiFeaturesEnabled', false)
            ->assertJsonPath('user.aiConsentDecided', true);
    }

    public function test_messages_are_not_sent_to_openai_without_both_users_consent(): void
    {
        Http::fake([
            'https://api.openai.com/v1/chat/completions' => Http::response([
                'choices' => [['message' => ['content' => json_encode(['source' => 'he', 'text' => 'Hello'])]]],
            ], 200),
        ]);

        // The sender never opted in, so the reader sees the original text.
        $alice = User::factory()->create(['language' => 'he']);
        $bob = User::factory()->aiEnabled()->create(['language' => 'en']);

        $conversationId = $this->actingAs($alice)->postJson('/api/conversations', [
            'participantUserId' => $bob->id,
        ])->json('conversation.id');
        $this->actingAs($alice)->postJson("/api/conversations/{$conversationId}/messages", [
            'text' => 'שלום מה נשמע',
        ])->assertCreated();

        $this->actingAs($bob)->getJson("/api/conversations/{$conversationId}/messages")
            ->assertOk()
            ->assertJsonPath('messages.0.text', 'שלום מה נשמע')
            ->assertJsonPath('messages.0.isTranslated', false);

        Http::assertNothingSent();
    }

    public function test_catch_up_skips_users_without_ai_consent(): void
    {
        Http::fake();

        $alice = User::factory()->create();
        $bob = User::factory()->create();
        $conversationId = $this->actingAs($alice)->postJson('/api/conversations', [
            'participantUserId' => $bob->id,
        ])->json('conversation.id');
        $this->actingAs($alice)->postJson("/api/conversations/{$conversationId}/messages", [
            'text' => 'Are we still on for Friday?',
        ])->assertCreated();

        $this->artisan('gocha:catch-up-generate')->assertSuccessful();

        $this->assertDatabaseCount('catch_up_briefs', 0);
        Http::assertNothingSent();
    }

    public function test_catch_up_is_empty_and_flagged_when_ai_is_off(): void
    {
        $alice = User::factory()->create();

        $this->actingAs($alice)->getJson('/api/catch-up')
            ->assertOk()
            ->assertJsonPath('aiFeaturesEnabled', false)
            ->assertJsonCount(0, 'conversations');
    }

    public function test_gocha_ai_requires_ai_consent(): void
    {
        $alice = User::factory()->create();

        $this->actingAs($alice)->postJson('/api/gocha-ai/chat', ['message' => 'hello'])
            ->assertForbidden()
            ->assertJsonPath('code', 'AI_CONSENT_REQUIRED');
    }
}
