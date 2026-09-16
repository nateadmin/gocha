<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class GochaAiTest extends TestCase
{
    use RefreshDatabase;

    public function test_chat_returns_assistant_reply(): void
    {
        Http::fake([
            'https://api.openai.com/v1/chat/completions' => Http::response([
                'choices' => [
                    ['message' => ['content' => 'Here are three dinner ideas for tonight.']],
                ],
            ], 200),
        ]);

        $user = User::factory()->create(['name' => 'Alice Example']);

        $this->actingAs($user)->postJson('/api/gocha-ai/chat', [
            'message' => 'What should I cook tonight?',
            'history' => [
                ['role' => 'assistant', 'content' => 'Hi. I am Gocha AI.'],
            ],
        ])
            ->assertOk()
            ->assertJsonPath('reply', 'Here are three dinner ideas for tonight.');

        Http::assertSent(function ($request) {
            $body = $request->data();

            return $request->url() === 'https://api.openai.com/v1/chat/completions'
                && ($body['model'] ?? null) === 'gpt-4o-mini'
                && ! isset($body['response_format'])
                && str_contains((string) data_get($body, 'messages.0.content'), 'Gocha AI')
                && str_contains((string) data_get($body, 'messages.2.content'), 'What should I cook tonight?');
        });
    }

    public function test_chat_requires_auth(): void
    {
        $this->postJson('/api/gocha-ai/chat', [
            'message' => 'Hello',
        ])->assertUnauthorized();
    }

    public function test_chat_validates_message(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user)->postJson('/api/gocha-ai/chat', [
            'message' => '',
        ])->assertStatus(422);
    }
}
