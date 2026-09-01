<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class PlacesAutocompleteTest extends TestCase
{
    use RefreshDatabase;

    public function test_places_require_auth(): void
    {
        $this->getJson('/api/places/autocomplete?query=130+Avenue')
            ->assertUnauthorized();
        $this->postJson('/api/places/details', ['placeId' => 'ChIJ'])
            ->assertUnauthorized();
    }

    public function test_places_return_503_when_key_missing(): void
    {
        config(['gocha.google_places_api_key' => null]);
        $user = User::factory()->create();

        $this->actingAs($user)->getJson('/api/places/autocomplete?query=130+Avenue')
            ->assertStatus(503);
    }

    public function test_autocomplete_returns_google_predictions(): void
    {
        config(['gocha.google_places_api_key' => 'test-places-key']);
        $user = User::factory()->create();

        Http::fake([
            'maps.googleapis.com/maps/api/place/autocomplete/*' => Http::response([
                'status' => 'OK',
                'predictions' => [
                    [
                        'place_id' => 'ChIJ130avef',
                        'description' => '130 Avenue F, New York, NY, USA',
                        'structured_formatting' => [
                            'main_text' => '130 Avenue F',
                            'secondary_text' => 'New York, NY, USA',
                        ],
                    ],
                ],
            ], 200),
        ]);

        $this->actingAs($user)->getJson('/api/places/autocomplete?query=130+Avenue')
            ->assertOk()
            ->assertJsonPath('predictions.0.placeId', 'ChIJ130avef')
            ->assertJsonPath('predictions.0.mainText', '130 Avenue F');
    }

    public function test_details_return_formatted_address_and_coordinates(): void
    {
        config(['gocha.google_places_api_key' => 'test-places-key']);
        $user = User::factory()->create();

        Http::fake([
            'maps.googleapis.com/maps/api/place/details/*' => Http::response([
                'status' => 'OK',
                'result' => [
                    'place_id' => 'ChIJ130avef',
                    'formatted_address' => '130 Avenue F, New York, NY 10009, USA',
                    'geometry' => ['location' => ['lat' => 40.723, 'lng' => -73.978]],
                    'address_components' => [
                        ['long_name' => 'New York', 'short_name' => 'NYC', 'types' => ['locality']],
                        ['long_name' => 'New York', 'short_name' => 'NY', 'types' => ['administrative_area_level_1']],
                    ],
                ],
            ], 200),
        ]);

        $this->actingAs($user)->postJson('/api/places/details', [
            'placeId' => 'ChIJ130avef',
            'sessionToken' => 'sess-1',
        ])
            ->assertOk()
            ->assertJsonPath('place.formattedAddress', '130 Avenue F, New York, NY 10009, USA')
            ->assertJsonPath('place.city', 'New York')
            ->assertJsonPath('place.state', 'NY')
            ->assertJsonPath('place.latitude', 40.723);
    }

    public function test_around_me_group_requires_selected_google_place(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user)->postJson('/api/groups', [
            'name' => 'Typed Only',
            'privacy' => 'public',
            'show_in_around_me' => true,
            'address' => '130 Avenue F',
        ])->assertStatus(422)
            ->assertJsonValidationErrors(['google_place_id']);
    }

    public function test_listing_address_requires_selected_google_place(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user)->postJson('/api/businesses', [
            'name' => 'Free Text Pizza',
            'address' => '12 Main St',
            'submit' => false,
        ])->assertStatus(422)
            ->assertJsonValidationErrors(['google_place_id']);
    }
}
