<?php

namespace Tests\Feature;

use App\Models\User;
use App\Services\Auth\DeviceTokenService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\PersonalAccessToken;
use Tests\TestCase;

class AuthSessionSwitchTest extends TestCase
{
    use RefreshDatabase;

    public function test_switch_logs_the_session_in_as_the_token_owner(): void
    {
        $alice = User::factory()->create();
        $bob = User::factory()->create();
        $bobToken = app(DeviceTokenService::class)->issue($bob)->plainTextToken;

        // The browser session currently belongs to Alice.
        $this->actingAs($alice);

        $this->postJson('/api/auth/switch', ['deviceToken' => $bobToken])
            ->assertOk()
            ->assertJsonPath('user.id', $bob->id)
            ->assertJsonPath('account.id', $bob->id);

        $this->assertSame($bob->id, auth('web')->id());
    }

    public function test_messages_sent_after_switch_are_attributed_to_the_new_user(): void
    {
        $alice = User::factory()->create();
        $bob = User::factory()->create();
        $bobToken = app(DeviceTokenService::class)->issue($bob)->plainTextToken;

        $conversationId = $this->actingAs($alice)->postJson('/api/conversations', [
            'participantUserId' => $bob->id,
        ])->json('conversation.id');

        $rotatedToken = $this->postJson('/api/auth/switch', ['deviceToken' => $bobToken])
            ->assertOk()
            ->json('deviceToken');

        // Drop the actingAs override so the next request authenticates the
        // way a real client does after switching (with the rotated token).
        $this->app['auth']->forgetGuards();

        $this->withHeader('Authorization', 'Bearer '.$rotatedToken)
            ->postJson("/api/conversations/{$conversationId}/messages", [
                'text' => 'From Bob',
            ])->assertCreated()
            ->assertJsonPath('message.senderUserId', $bob->id)
            ->assertJsonPath('message.isOutgoing', true);
    }

    public function test_switch_rotates_the_device_token(): void
    {
        $bob = User::factory()->create();
        $bobToken = app(DeviceTokenService::class)->issue($bob)->plainTextToken;

        $response = $this->postJson('/api/auth/switch', ['deviceToken' => $bobToken])
            ->assertOk();

        $newToken = $response->json('deviceToken');
        $this->assertNotSame($bobToken, $newToken);
        $this->assertNull(PersonalAccessToken::findToken($bobToken));
        $this->assertNotNull(PersonalAccessToken::findToken($newToken));
    }

    public function test_switch_rejects_unknown_and_non_device_tokens(): void
    {
        $this->postJson('/api/auth/switch', ['deviceToken' => 'not-a-real-token'])
            ->assertUnauthorized()
            ->assertJsonPath('code', 'INVALID_DEVICE_TOKEN');

        $bob = User::factory()->create();
        $plainToken = $bob->createToken('test')->plainTextToken;

        $this->postJson('/api/auth/switch', ['deviceToken' => $plainToken])
            ->assertUnauthorized()
            ->assertJsonPath('code', 'INVALID_DEVICE_TOKEN');
    }
}
