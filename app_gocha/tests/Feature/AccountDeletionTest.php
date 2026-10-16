<?php

namespace Tests\Feature;

use App\Models\Conversation;
use App\Models\Message;
use App\Models\StatusItem;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class AccountDeletionTest extends TestCase
{
    use RefreshDatabase;

    public function test_deleting_account_removes_user_tokens_and_content(): void
    {
        Storage::fake('public');
        Storage::disk('public')->put('avatars/me.png', 'x');

        $alice = User::factory()->create(['avatar_path' => 'avatars/me.png']);
        $bob = User::factory()->create();
        $token = $alice->createToken('device:test', ['account:access'])->plainTextToken;

        $conversationId = $this->actingAs($alice)->postJson('/api/conversations', [
            'participantUserId' => $bob->id,
        ])->json('conversation.id');
        $this->actingAs($alice)->postJson("/api/conversations/{$conversationId}/messages", [
            'text' => 'hello',
        ])->assertCreated();

        $this->actingAs($alice)->postJson('/api/account/delete', ['confirm' => 'DELETE'])
            ->assertOk();

        $this->assertDatabaseMissing('users', ['id' => $alice->id]);
        $this->assertDatabaseMissing('personal_access_tokens', ['tokenable_id' => $alice->id]);
        $this->assertSame(0, Message::query()->where('sender_user_id', $alice->id)->count());
        $this->assertSame(0, StatusItem::query()->where('user_id', $alice->id)->count());
        Storage::disk('public')->assertMissing('avatars/me.png');

        // The other person keeps their account and the conversation row.
        $this->assertDatabaseHas('users', ['id' => $bob->id]);
        $this->assertNotNull(Conversation::query()->find($conversationId));

        // The old device token no longer authenticates.
        $this->app['auth']->forgetGuards();
        $this->withHeader('Authorization', 'Bearer '.$token)
            ->getJson('/api/me')
            ->assertUnauthorized();
    }

    public function test_deletion_requires_explicit_confirmation(): void
    {
        $alice = User::factory()->create();

        $this->actingAs($alice)->postJson('/api/account/delete', [])
            ->assertStatus(422);
        $this->actingAs($alice)->postJson('/api/account/delete', ['confirm' => 'yes'])
            ->assertStatus(422);

        $this->assertDatabaseHas('users', ['id' => $alice->id]);
    }

    public function test_deletion_requires_sign_in(): void
    {
        $this->postJson('/api/account/delete', ['confirm' => 'DELETE'])
            ->assertUnauthorized();
    }
}
