<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('status_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('type', 16);
            $table->text('body')->nullable();
            $table->string('media_path')->nullable();
            $table->string('background_color', 16)->nullable();
            $table->unsignedInteger('duration_ms')->default(5000);
            $table->timestamp('expires_at');
            $table->timestamps();

            $table->index(['user_id', 'expires_at']);
            $table->index('expires_at');
        });

        Schema::create('status_views', function (Blueprint $table) {
            $table->id();
            $table->foreignId('status_item_id')->constrained('status_items')->cascadeOnDelete();
            $table->foreignId('viewer_user_id')->constrained('users')->cascadeOnDelete();
            $table->timestamp('viewed_at');
            $table->timestamps();

            $table->unique(['status_item_id', 'viewer_user_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('status_views');
        Schema::dropIfExists('status_items');
    }
};
