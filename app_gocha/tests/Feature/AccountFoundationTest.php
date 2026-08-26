<?php

namespace Tests\Feature;

use App\Models\BusinessListing;
use App\Models\User;
use App\Support\AccountChannel;
use App\Support\BusinessListingStatus;
use App\Support\ProfileMode;
use App\Support\VerificationStatus;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AccountFoundationTest extends TestCase
{
    use RefreshDatabase;

    public function test_phone_signup_request_is_not_available_yet(): void
    {
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
            'category' => 'Food',
            'description' => 'Late night slices',
            'address' => '12 Main St',
            'website' => 'https://neon-pizza.example',
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
