<?php

use App\Support\AccountChannel;
use App\Support\ProfileMode;
use App\Support\VerificationStatus;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->timestamp('phone_verified_at')->nullable()->after('email_verified_at');
            $table->string('primary_login_channel', 16)->default(AccountChannel::EMAIL)->after('phone_verified_at');
            $table->boolean('is_admin')->default(false)->after('primary_login_channel');
            $table->string('user_verification_status', 32)->default(VerificationStatus::NONE)->after('is_admin');
            $table->timestamp('user_verified_at')->nullable()->after('user_verification_status');
            $table->string('profile_mode', 16)->default(ProfileMode::PERSONAL)->after('user_verified_at');
            $table->unsignedBigInteger('active_business_listing_id')->nullable()->after('profile_mode');
            $table->string('business_chat_name', 120)->nullable()->after('active_business_listing_id');
            $table->string('business_chat_website', 255)->nullable()->after('business_chat_name');
        });

        Schema::table('users', function (Blueprint $table) {
            $table->unique('phone');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropUnique(['phone']);
            $table->dropColumn([
                'phone_verified_at',
                'primary_login_channel',
                'is_admin',
                'user_verification_status',
                'user_verified_at',
                'profile_mode',
                'active_business_listing_id',
                'business_chat_name',
                'business_chat_website',
            ]);
        });
    }
};
