<?php

namespace Tests\Feature;

use App\Models\AccountLink;
use App\Models\LoginOtp;
use App\Models\User;
use App\Services\Auth\DeviceTokenService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class AccountLinkTest extends TestCase
{
    use RefreshDatabase;

    public function test_link_is_bidirectional_and_survives_signing_in_as_the_other_user(): void
    {
        $alice = User::factory()->create(['email' => 'alice@example.com', 'name' => 'Alice']);
        $bob = User::factory()->create(['email' => 'bob@example.com', 'name' => 'Bob']);
        $aliceToken = app(DeviceTokenService::class)->issue($alice)->plainTextToken;

        $this->actingAs($bob)
            ->postJson('/api/accounts/link', ['counterpartDeviceToken' => $aliceToken])
            ->assertOk()
            ->assertJsonPath('accounts.0.id', $alice->id);

        $this->assertDatabaseCount('account_links', 1);

        $this->actingAs($alice)
            ->getJson('/api/accounts/linked')
            ->assertOk()
            ->assertJsonPath('accounts.0.id', $bob->id)
            ->assertJsonPath('accounts.0.displayName', 'Bob');
    }

    public function test_unlink_removes_the_pair_for_both_accounts(): void
    {
        $alice = User::factory()->create();
        $bob = User::factory()->create();
        $aliceToken = app(DeviceTokenService::class)->issue($alice)->plainTextToken;

        $this->actingAs($bob)->postJson('/api/accounts/link', [
            'counterpartDeviceToken' => $aliceToken,
        ])->assertOk();

        $this->actingAs($alice)
            ->postJson('/api/accounts/unlink', ['userId' => $bob->id])
            ->assertOk()
            ->assertJsonPath('accounts', []);

        $this->assertDatabaseCount('account_links', 0);

        $this->actingAs($bob)
            ->getJson('/api/accounts/linked')
            ->assertOk()
            ->assertJsonPath('accounts', []);
    }

    public function test_switch_by_user_id_requires_a_link(): void
    {
        $alice = User::factory()->create();
        $bob = User::factory()->create();

        $this->actingAs($alice)
            ->postJson('/api/auth/switch', ['userId' => $bob->id])
            ->assertForbidden()
            ->assertJsonPath('code', 'ACCOUNT_NOT_LINKED');

        AccountLink::query()->create([
            'user_id_low' => min($alice->id, $bob->id),
            'user_id_high' => max($alice->id, $bob->id),
        ]);

        $this->actingAs($alice)
            ->postJson('/api/auth/switch', ['userId' => $bob->id])
            ->assertOk()
            ->assertJsonPath('user.id', $bob->id);

        $this->assertSame($bob->id, auth('web')->id());
    }

    public function test_device_token_switch_persists_a_two_way_link(): void
    {
        $alice = User::factory()->create();
        $bob = User::factory()->create();
        $bobToken = app(DeviceTokenService::class)->issue($bob)->plainTextToken;

        $this->actingAs($alice)
            ->postJson('/api/auth/switch', ['deviceToken' => $bobToken])
            ->assertOk()
            ->assertJsonPath('user.id', $bob->id);

        $this->assertTrue(
            AccountLink::query()
                ->where('user_id_low', min($alice->id, $bob->id))
                ->where('user_id_high', max($alice->id, $bob->id))
                ->exists()
        );
    }

    public function test_otp_verify_links_the_current_session_account(): void
    {
        $alice = User::factory()->create(['email' => 'alice-link@example.com']);
        $bob = User::factory()->create(['email' => 'bob-link@example.com']);
        $code = '424242';

        LoginOtp::query()->create([
            'channel' => 'email',
            'identifier' => $bob->email,
            'code_hash' => Hash::make($code),
            'attempts' => 0,
            'expires_at' => now()->addMinutes(10),
        ]);

        $this->actingAs($alice)
            ->withHeaders([
                'Origin' => 'http://localhost',
                'Referer' => 'http://localhost',
            ])
            ->postJson('/api/auth/otp/verify', [
                'email' => $bob->email,
                'code' => $code,
                'mode' => 'signin',
                'linkCurrentAccount' => true,
            ])
            ->assertOk()
            ->assertJsonPath('user.id', $bob->id);

        $this->assertTrue(
            AccountLink::query()
                ->where('user_id_low', min($alice->id, $bob->id))
                ->where('user_id_high', max($alice->id, $bob->id))
                ->exists()
        );
        $this->assertSame($bob->id, auth('web')->id());

        $this->actingAs($bob)
            ->getJson('/api/accounts/linked')
            ->assertOk()
            ->assertJsonPath('accounts.0.id', $alice->id);
    }

    public function test_otp_verify_link_flag_requires_an_existing_session(): void
    {
        $bob = User::factory()->create(['email' => 'bob-nolink@example.com']);
        $code = '111111';

        LoginOtp::query()->create([
            'channel' => 'email',
            'identifier' => $bob->email,
            'code_hash' => Hash::make($code),
            'attempts' => 0,
            'expires_at' => now()->addMinutes(10),
        ]);

        $this->postJson('/api/auth/otp/verify', [
            'email' => $bob->email,
            'code' => $code,
            'mode' => 'signin',
            'linkCurrentAccount' => true,
        ])
            ->assertUnauthorized()
            ->assertJsonPath('code', 'UNAUTHENTICATED');

        $this->assertDatabaseCount('account_links', 0);
    }

    public function test_cannot_link_an_account_to_itself(): void
    {
        $alice = User::factory()->create();
        $token = app(DeviceTokenService::class)->issue($alice)->plainTextToken;

        $this->actingAs($alice)
            ->postJson('/api/accounts/link', ['counterpartDeviceToken' => $token])
            ->assertStatus(422)
            ->assertJsonPath('code', 'CANNOT_LINK_SELF');
    }
}
