<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->timestamp('terms_accepted_at')->nullable();
            $table->boolean('ai_features_enabled')->default(false);
            $table->timestamp('ai_consent_decided_at')->nullable();
        });

        Schema::create('user_blocks', function (Blueprint $table) {
            $table->id();
            $table->foreignId('blocker_user_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('blocked_user_id')->constrained('users')->cascadeOnDelete();
            $table->timestamps();

            $table->unique(['blocker_user_id', 'blocked_user_id']);
            $table->index('blocked_user_id');
        });

        // Reports outlive the accounts involved so moderators keep the evidence.
        Schema::create('content_reports', function (Blueprint $table) {
            $table->id();
            $table->foreignId('reporter_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('reported_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('conversation_id')->nullable()->constrained('conversations')->nullOnDelete();
            $table->foreignId('message_id')->nullable()->constrained('messages')->nullOnDelete();
            $table->foreignId('status_item_id')->nullable()->constrained('status_items')->nullOnDelete();
            $table->string('reason', 32);
            $table->text('details')->nullable();
            $table->text('message_excerpt')->nullable();
            $table->string('status', 16)->default('open');
            $table->foreignId('resolved_by_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('resolved_at')->nullable();
            $table->timestamps();

            $table->index(['status', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('content_reports');
        Schema::dropIfExists('user_blocks');

        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['terms_accepted_at', 'ai_features_enabled', 'ai_consent_decided_at']);
        });
    }
};
