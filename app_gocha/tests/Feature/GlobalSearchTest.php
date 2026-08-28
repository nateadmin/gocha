<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class GlobalSearchTest extends TestCase
{
    use RefreshDatabase;

    public function test_global_search_returns_contacts_messages_and_discoverable_people(): void
    {
        $alice = User::factory()->create(['display_name' => 'Alice Searcher']);
        $bob = User::factory()->create([
            'display_name' => 'Bob Contact',
            'email' => 'bob.contact@example.com',
            'discoverable' => true,
        ]);
        $carol = User::factory()->create([
            'display_name' => 'Carol Discover',
            'phone' => '+15551234567',
            'discoverable' => true,
        ]);
        User::factory()->create([
            'display_name' => 'Hidden Dana',
            'email' => 'dana.hidden@example.com',
            'discoverable' => false,
        ]);

        $conversationId = $this->actingAs($alice)->postJson('/api/conversations', [
            'participantUserId' => $bob->id,
        ])->json('conversation.id');

        $this->actingAs($alice)->postJson("/api/conversations/{$conversationId}/messages", [
            'text' => 'Need the quarterly report today',
        ]);

        $response = $this->actingAs($alice)->getJson('/api/search?q=quarterly');

        $response
            ->assertOk()
            ->assertJsonCount(1, 'messages')
            ->assertJsonPath('messages.0.text', 'Need the quarterly report today')
            ->assertJsonPath('messages.0.conversationId', $conversationId);

        $contactSearch = $this->actingAs($alice)->getJson('/api/search?q=bob.contact');
        $contactSearch
            ->assertOk()
            ->assertJsonCount(1, 'contacts')
            ->assertJsonPath('contacts.0.userId', $bob->id);

        $peopleSearch = $this->actingAs($alice)->getJson('/api/search?q=Carol');
        $peopleSearch
            ->assertOk()
            ->assertJsonCount(1, 'people')
            ->assertJsonPath('people.0.displayName', 'Carol Discover');

        $phoneSearch = $this->actingAs($alice)->getJson('/api/search?q=555123');
        $phoneSearch
            ->assertOk()
            ->assertJsonPath('people.0.displayName', 'Carol Discover');
    }
}
