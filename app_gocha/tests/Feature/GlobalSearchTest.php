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
        $alice = User::factory()->create(['name' => 'Alice Searcher']);
        $bob = User::factory()->create([
            'name' => 'Bob Contact',
            'email' => 'bob.contact@example.com',
            'discoverable' => true,
        ]);
        $carol = User::factory()->create([
            'name' => 'Carol Discover',
            'phone' => '+15551234567',
            'discoverable' => true,
        ]);
        User::factory()->create([
            'name' => 'Hidden Dana',
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

        $this->actingAs($alice)->getJson('/api/search?q=Carol')
            ->assertOk()
            ->assertJsonCount(0, 'people');

        $peopleSearch = $this->actingAs($alice)->getJson('/api/search?q='.urlencode('Carol Discover'));
        $peopleSearch
            ->assertOk()
            ->assertJsonCount(1, 'people')
            ->assertJsonPath('people.0.displayName', 'Carol Discover');

        $this->actingAs($alice)->getJson('/api/search?q=555123')
            ->assertOk()
            ->assertJsonCount(0, 'people');
    }

    public function test_discoverable_user_requires_exact_full_name(): void
    {
        $searcher = User::factory()->create();
        User::factory()->create([
            'name' => 'giggly goo',
            'discoverable' => true,
        ]);

        $this->actingAs($searcher)->getJson('/api/search?q=Giggly')
            ->assertOk()
            ->assertJsonCount(0, 'people');

        $this->actingAs($searcher)->getJson('/api/search?q='.urlencode('giggly goo'))
            ->assertOk()
            ->assertJsonCount(1, 'people')
            ->assertJsonPath('people.0.displayName', 'giggly goo');
    }

    public function test_discoverable_user_can_be_found_by_exact_username_with_at_prefix(): void
    {
        $searcher = User::factory()->create();
        User::factory()->create([
            'name' => 'Hidden From Partial',
            'username' => 'gigglygoo',
            'discoverable' => true,
        ]);

        $this->actingAs($searcher)->getJson('/api/search?q=giggly')
            ->assertOk()
            ->assertJsonCount(0, 'people');

        $this->actingAs($searcher)->getJson('/api/search?q=@gigglygoo')
            ->assertOk()
            ->assertJsonCount(1, 'people')
            ->assertJsonPath('people.0.username', 'gigglygoo');
    }
}
