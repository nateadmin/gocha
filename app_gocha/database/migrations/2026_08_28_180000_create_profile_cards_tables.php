<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('profile_cards', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('type', 20);
            $table->string('title', 80);
            $table->string('headline', 160)->nullable();
            $table->string('photo_path')->nullable();
            $table->string('visibility', 20)->default('request');
            $table->json('body')->nullable();
            $table->timestamps();

            $table->index(['user_id', 'visibility']);
        });

        Schema::create('profile_card_accesses', function (Blueprint $table) {
            $table->id();
            $table->foreignId('profile_card_id')->constrained()->cascadeOnDelete();
            $table->foreignId('viewer_user_id')->constrained('users')->cascadeOnDelete();
            $table->string('status', 20);
            $table->timestamp('requested_at')->nullable();
            $table->timestamp('decided_at')->nullable();
            $table->timestamps();

            $table->unique(['profile_card_id', 'viewer_user_id']);
            $table->index(['viewer_user_id', 'status']);
            $table->index(['profile_card_id', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('profile_card_accesses');
        Schema::dropIfExists('profile_cards');
    }
};
