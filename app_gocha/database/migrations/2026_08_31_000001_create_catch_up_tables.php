<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('catch_up_briefs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('conversation_id')->constrained()->cascadeOnDelete();
            $table->text('summary');
            $table->json('attention');
            $table->json('plans');
            $table->string('priority', 16);
            $table->unsignedBigInteger('source_message_id')->nullable();
            $table->timestamp('source_created_at')->nullable();
            $table->timestamp('generated_at');
            $table->timestamps();

            $table->unique(['user_id', 'conversation_id']);
            $table->index(['user_id', 'priority']);
        });

        Schema::create('pipeline_heartbeats', function (Blueprint $table) {
            $table->id();
            $table->string('lock_domain', 64)->unique();
            $table->timestamp('completed_at')->nullable();
            $table->unsignedInteger('row_count')->default(0);
            $table->string('correlation_id', 64)->nullable();
            $table->unsignedInteger('skip_streak')->default(0);
            $table->timestamp('last_skip_at')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('catch_up_briefs');
        Schema::dropIfExists('pipeline_heartbeats');
    }
};
