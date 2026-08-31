<?php

namespace Tests\Feature;

use App\Models\BusinessListing;
use App\Models\User;
use App\Support\AccountChannel;
use App\Support\BusinessListingStatus;
use App\Support\ProfileMode;
use App\Support\VerificationStatus;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class AccountFoundationTest extends TestCase
{
    use RefreshDatabase;

    public function test_phone_signup_request_is_blocked_when_firebase_is_not_configured(): void
    {
        config([
            'gocha.firebase.web_api_key' => null,
            'gocha.firebase.project_id' => null,
        ]);

        $this->postJson('/api/auth/otp/request', [
            'channel' => AccountChannel::PHONE,
            'identifier' => '+15551234567',
            'mode' => 'signup',
        ])
            ->assertStatus(422)
            ->assertJsonPath('code', 'SMS_NOT_CONFIGURED');
    }

    public function test_user_can_submit_business_listing_for_review(): void
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)->postJson('/api/businesses', [
            'name' => 'Neon Pizza',
            'category' => 'food',
            'description' => 'Late night slices',
            'address' => '12 Main St',
            'website' => 'https://neon-pizza.example',
            'submit' => true,
        ]);

        $response
            ->assertCreated()
            ->assertJsonPath('listing.status', BusinessListingStatus::PENDING_REVIEW)
            ->assertJsonPath('listing.chatUserId', $user->id);

        $this->assertDatabaseHas('business_listings', [
            'name' => 'Neon Pizza',
            'owner_user_id' => $user->id,
            'status' => BusinessListingStatus::PENDING_REVIEW,
        ]);
    }

    public function test_user_can_save_business_listing_as_draft(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user)->postJson('/api/businesses', [
            'name' => 'Draft Cafe',
            'category' => 'food',
            'submit' => false,
        ])
            ->assertCreated()
            ->assertJsonPath('listing.status', BusinessListingStatus::DRAFT);

        $this->assertDatabaseHas('business_listings', [
            'name' => 'Draft Cafe',
            'status' => BusinessListingStatus::DRAFT,
        ]);
    }

    public function test_owner_can_unpublish_and_resubmit_listing(): void
    {
        $user = User::factory()->create();
        $listing = BusinessListing::query()->create([
            'owner_user_id' => $user->id,
            'submitted_by_user_id' => $user->id,
            'slug' => 'live-cafe',
            'name' => 'Live Cafe',
            'status' => BusinessListingStatus::APPROVED,
            'submitted_at' => now(),
        ]);

        $this->actingAs($user)
            ->postJson("/api/businesses/mine/{$listing->id}/unpublish")
            ->assertOk()
            ->assertJsonPath('listing.status', BusinessListingStatus::UNPUBLISHED);

        $this->actingAs($user)
            ->postJson("/api/businesses/mine/{$listing->id}/submit")
            ->assertOk()
            ->assertJsonPath('listing.status', BusinessListingStatus::PENDING_REVIEW);
    }

    public function test_google_import_parses_maps_url(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user)->postJson('/api/businesses/import-google', [
            'url' => 'https://www.google.com/maps/place/Neon+Pizza/@40.7,-74.0,17z',
        ])
            ->assertOk()
            ->assertJsonPath('import.name', 'Neon Pizza');
    }

    public function test_google_import_unwraps_consent_continue_url(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user)->postJson('/api/businesses/import-google', [
            'url' => 'https://consent.google.com/ml?continue='.rawurlencode('https://www.google.com/maps/place/Ohkie/@40.7,-74.0,17z').'&gl=DE',
        ])
            ->assertOk()
            ->assertJsonPath('import.name', 'Ohkie');
    }

    public function test_google_import_enriches_from_places_api_when_key_is_set(): void
    {
        config(['gocha.google_places_api_key' => 'test-places-key']);

        Http::fake([
            'https://maps.googleapis.com/maps/api/place/findplacefromtext/json*' => Http::response([
                'status' => 'OK',
                'candidates' => [[
                    'place_id' => 'ChIJtestplace',
                    'name' => 'Neon Pizza Shop',
                    'formatted_address' => '142 Mulberry St, New York, NY',
                    'types' => ['restaurant'],
                ]],
            ], 200),
            'https://maps.googleapis.com/maps/api/place/details/json*' => Http::response([
                'status' => 'OK',
                'result' => [
                    'name' => 'Neon Pizza Shop',
                    'formatted_address' => '142 Mulberry St, New York, NY',
                    'website' => 'https://neon.pizza',
                    'types' => ['restaurant'],
                    'editorial_summary' => ['overview' => 'Wood-fired pizza.'],
                ],
            ], 200),
        ]);

        $user = User::factory()->create();

        $this->actingAs($user)->postJson('/api/businesses/import-google', [
            'url' => 'https://www.google.com/maps/place/Neon+Pizza/@40.7,-74.0,17z',
        ])
            ->assertOk()
            ->assertJsonPath('import.source', 'places_api')
            ->assertJsonPath('import.name', 'Neon Pizza Shop')
            ->assertJsonPath('import.address', '142 Mulberry St, New York, NY')
            ->assertJsonPath('import.website', 'https://neon.pizza')
            ->assertJsonPath('import.googlePlaceId', 'ChIJtestplace')
            ->assertJsonPath('import.category', 'restaurant')
            ->assertJsonPath('import.description', 'Wood-fired pizza.');
    }

    public function test_google_import_keeps_find_place_fields_when_details_fail(): void
    {
        config(['gocha.google_places_api_key' => 'test-places-key']);

        Http::fake([
            'https://maps.googleapis.com/maps/api/place/findplacefromtext/json*' => Http::response([
                'status' => 'OK',
                'candidates' => [[
                    'place_id' => 'ChIJfallback',
                    'name' => 'Neon Pizza Shop',
                    'formatted_address' => '142 Mulberry St, New York, NY',
                    'types' => ['point_of_interest', 'establishment', 'restaurant'],
                ]],
            ], 200),
            'https://maps.googleapis.com/maps/api/place/details/json*' => Http::response([
                'status' => 'REQUEST_DENIED',
                'error_message' => 'denied',
            ], 200),
        ]);

        $user = User::factory()->create();

        $this->actingAs($user)->postJson('/api/businesses/import-google', [
            'url' => 'https://www.google.com/maps/place/Neon+Pizza/@40.7,-74.0,17z',
        ])
            ->assertOk()
            ->assertJsonPath('import.source', 'places_api')
            ->assertJsonPath('import.name', 'Neon Pizza Shop')
            ->assertJsonPath('import.address', '142 Mulberry St, New York, NY')
            ->assertJsonPath('import.category', 'restaurant');
    }

    public function test_google_import_downloads_photos_as_logo_and_cover(): void
    {
        config(['gocha.google_places_api_key' => 'test-places-key']);
        \Illuminate\Support\Facades\Storage::fake('public');

        Http::fake([
            'https://maps.googleapis.com/maps/api/place/findplacefromtext/json*' => Http::response([
                'status' => 'OK',
                'candidates' => [[
                    'place_id' => 'ChIJphotos',
                    'name' => 'Neon Pizza Shop',
                    'formatted_address' => '142 Mulberry St, New York, NY',
                    'types' => ['restaurant'],
                ]],
            ], 200),
            'https://maps.googleapis.com/maps/api/place/details/json*' => Http::response([
                'status' => 'OK',
                'result' => [
                    'name' => 'Neon Pizza Shop',
                    'formatted_address' => '142 Mulberry St, New York, NY',
                    'website' => 'https://neon.pizza',
                    'types' => ['restaurant'],
                    'photos' => [
                        ['photo_reference' => 'logo-ref'],
                        ['photo_reference' => 'cover-ref'],
                    ],
                ],
            ], 200),
            'https://maps.googleapis.com/maps/api/place/photo*' => Http::response('fake-image', 200, [
                'Content-Type' => 'image/jpeg',
            ]),
        ]);

        $user = User::factory()->create();

        $payload = $this->actingAs($user)->postJson('/api/businesses/import-google', [
            'url' => 'https://www.google.com/maps/place/Neon+Pizza/@40.7,-74.0,17z',
        ])
            ->assertOk()
            ->assertJsonPath('import.source', 'places_api')
            ->assertJsonPath('import.website', 'https://neon.pizza')
            ->json('import');

        $this->assertNotEmpty($payload['logoPhotoPath']);
        $this->assertNotEmpty($payload['coverPhotoPath']);
        $this->assertNotEmpty($payload['logoPhotoUrl']);
        $this->assertStringStartsWith('business-imports/', $payload['logoPhotoPath']);
    }

    public function test_owner_can_list_their_business_listings(): void
    {
        $user = User::factory()->create();
        BusinessListing::query()->create([
            'owner_user_id' => $user->id,
            'submitted_by_user_id' => $user->id,
            'slug' => 'mine-cafe',
            'name' => 'Mine Cafe',
            'status' => BusinessListingStatus::DRAFT,
        ]);

        $this->actingAs($user)->getJson('/api/businesses/mine')
            ->assertOk()
            ->assertJsonPath('listings.0.name', 'Mine Cafe')
            ->assertJsonPath('listings.0.status', BusinessListingStatus::DRAFT);
    }

    public function test_user_can_set_unique_username(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user)->postJson('/api/profile/username', [
            'username' => 'neon_user',
        ])
            ->assertOk()
            ->assertJsonPath('user.username', 'neon_user');
    }

    public function test_public_group_with_location_appears_in_discover(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user)->postJson('/api/groups', [
            'name' => 'Shore Runners',
            'privacy' => 'public',
            'show_in_around_me' => true,
            'address' => '123 Ocean Ave',
        ])->assertCreated();

        $this->getJson('/api/groups/discover')
            ->assertOk()
            ->assertJsonCount(1, 'groups')
            ->assertJsonPath('groups.0.name', 'Shore Runners');
    }

    public function test_around_me_group_requires_address_when_enabled(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user)->postJson('/api/groups', [
            'name' => 'No Address Group',
            'privacy' => 'public',
            'show_in_around_me' => true,
        ])->assertStatus(422)
            ->assertJsonValidationErrors(['address']);
    }

    public function test_private_group_is_hidden_from_discover(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user)->postJson('/api/groups', [
            'name' => 'Secret Club',
            'privacy' => 'private',
            'city' => 'Asbury Park',
            'state' => 'NJ',
        ])->assertCreated();

        $this->getJson('/api/groups/discover')
            ->assertOk()
            ->assertJsonCount(0, 'groups');
    }

    public function test_admin_can_approve_business_listing(): void
    {
        $admin = User::factory()->create(['is_admin' => true]);
        $owner = User::factory()->create();
        $listing = BusinessListing::query()->create([
            'owner_user_id' => $owner->id,
            'submitted_by_user_id' => $owner->id,
            'slug' => 'neon-pizza',
            'name' => 'Neon Pizza',
            'status' => BusinessListingStatus::PENDING_REVIEW,
            'submitted_at' => now(),
        ]);

        $this->actingAs($admin)
            ->postJson("/api/admin/business-listings/{$listing->id}/approve")
            ->assertOk()
            ->assertJsonPath('listing.status', BusinessListingStatus::APPROVED);

        $this->assertDatabaseHas('business_listings', [
            'id' => $listing->id,
            'status' => BusinessListingStatus::APPROVED,
        ]);
    }

    public function test_approved_business_listings_are_public(): void
    {
        $owner = User::factory()->create();
        BusinessListing::query()->create([
            'owner_user_id' => $owner->id,
            'submitted_by_user_id' => $owner->id,
            'slug' => 'live-biz',
            'name' => 'Live Biz',
            'status' => BusinessListingStatus::APPROVED,
            'chat_enabled' => true,
        ]);

        $this->getJson('/api/businesses')
            ->assertOk()
            ->assertJsonCount(1, 'listings')
            ->assertJsonPath('listings.0.chatUserId', $owner->id);
    }

    public function test_user_can_switch_profile_mode_to_business(): void
    {
        $user = User::factory()->create();
        $listing = BusinessListing::query()->create([
            'owner_user_id' => $user->id,
            'submitted_by_user_id' => $user->id,
            'slug' => 'my-biz',
            'name' => 'My Biz',
            'status' => BusinessListingStatus::APPROVED,
            'verification_status' => VerificationStatus::VERIFIED,
            'verified_at' => now(),
        ]);

        $this->actingAs($user)->postJson('/api/profile/mode', [
            'profileMode' => ProfileMode::BUSINESS,
            'activeBusinessListingId' => $listing->id,
            'businessChatName' => 'My Biz Official',
            'businessChatWebsite' => 'https://my-biz.example',
        ])
            ->assertOk()
            ->assertJsonPath('user.profileMode', ProfileMode::BUSINESS)
            ->assertJsonPath('user.chatDisplayName', 'My Biz Official')
            ->assertJsonPath('user.effectiveVerificationStatus', VerificationStatus::VERIFIED);
    }

    public function test_contact_email_cannot_duplicate_another_account(): void
    {
        User::factory()->create(['email' => 'taken@example.com']);
        $user = User::factory()->create(['email' => 'owner@example.com']);

        $this->actingAs($user)->postJson('/api/profile/contact', [
            'email' => 'taken@example.com',
        ])
            ->assertStatus(422)
            ->assertJsonValidationErrors(['email']);
    }

    public function test_verify_returns_device_token_for_multi_account(): void
    {
        $email = 'multi@example.com';
        $code = '123456';

        \App\Models\LoginOtp::query()->create([
            'channel' => 'email',
            'identifier' => $email,
            'code_hash' => bcrypt($code),
            'attempts' => 0,
            'expires_at' => now()->addMinutes(10),
        ]);

        $this->postJson('/api/auth/otp/verify', [
            'email' => $email,
            'code' => $code,
            'mode' => 'signup',
        ])
            ->assertOk()
            ->assertJsonStructure(['user', 'deviceToken', 'account']);
    }
}
