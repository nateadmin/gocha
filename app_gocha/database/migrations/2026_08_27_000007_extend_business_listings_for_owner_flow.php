<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('business_listings', function (Blueprint $table) {
            $table->boolean('no_physical_address')->default(false)->after('address');
            $table->string('cover_photo_path', 512)->nullable()->after('website');
            $table->string('google_business_url', 512)->nullable()->after('cover_photo_path');
            $table->string('google_place_id', 128)->nullable()->after('google_business_url');
            $table->json('google_reviews')->nullable()->after('google_place_id');
            $table->timestamp('google_reviews_synced_at')->nullable()->after('google_reviews');
        });
    }

    public function down(): void
    {
        Schema::table('business_listings', function (Blueprint $table) {
            $table->dropColumn([
                'no_physical_address',
                'cover_photo_path',
                'google_business_url',
                'google_place_id',
                'google_reviews',
                'google_reviews_synced_at',
            ]);
        });
    }
};
