<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class ChatImageMessageTest extends TestCase
{
    use RefreshDatabase;

    public function test_user_can_send_image_message_with_optional_caption(): void
    {
        Storage::fake('public');

        $alice = User::factory()->create();
        $bob = User::factory()->create();

        $conversationId = $this->actingAs($alice)->postJson('/api/conversations', [
            'participantUserId' => $bob->id,
        ])->json('conversation.id');

        $image = UploadedFile::fake()->image('paste.png', 640, 480);

        $response = $this->actingAs($alice)->post("/api/conversations/{$conversationId}/messages", [
            'type' => 'image',
            'text' => 'Look at this',
            'image' => $image,
        ])->assertCreated()
            ->assertJsonPath('message.type', 'image')
            ->assertJsonPath('message.text', 'Look at this')
            ->assertJsonPath('message.isOutgoing', true)
            ->assertJsonPath('message.fileName', 'paste.png');

        $mediaUrl = $response->json('message.mediaUrl');
        $this->assertNotNull($mediaUrl);

        $this->actingAs($bob)->getJson("/api/conversations/{$conversationId}/messages")
            ->assertOk()
            ->assertJsonPath('messages.0.type', 'image')
            ->assertJsonPath('messages.0.text', 'Look at this')
            ->assertJsonPath('messages.0.isOutgoing', false)
            ->assertJsonPath('messages.0.mediaUrl', $mediaUrl);
    }
}
