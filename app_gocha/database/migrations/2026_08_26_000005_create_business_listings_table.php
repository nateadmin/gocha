<?php

use App\Support\BusinessListingStatus;
use App\Support\VerificationStatus;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('business_listings', function (Blueprint $table) {
            $table->id();
            $table->foreignId('owner_user_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('submitted_by_user_id')->constrained('users')->cascadeOnDelete();
            $table->string('slug')->unique();
            $table->string('name');
            $table->string('category', 80)->nullable();
            $table->text('description')->nullable();
            $table->string('address', 255)->nullable();
            $table->string('website', 255)->nullable();
            $table->string('status', 32)->default(BusinessListingStatus::PENDING_REVIEW);
            $table->string('verification_status', 32)->default(VerificationStatus::NONE);
            $table->timestamp('verified_at')->nullable();
            $table->timestamp('submitted_at')->nullable();
            $table->timestamp('reviewed_at')->nullable();
            $table->foreignId('reviewed_by_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->text('rejection_reason')->nullable();
            $table->boolean('chat_enabled')->default(true);
            $table->timestamps();

            $table->index(['status', 'created_at']);
            $table->index('owner_user_id');
        });

        Schema::table('users', function (Blueprint $table) {
            $table->foreign('active_business_listing_id')
                ->references('id')
                ->on('business_listings')
                ->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropForeign(['active_business_listing_id']);
        });

        Schema::dropIfExists('business_listings');
    }
};
