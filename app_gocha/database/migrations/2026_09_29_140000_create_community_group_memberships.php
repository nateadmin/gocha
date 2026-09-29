<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('community_groups', function (Blueprint $table) {
            $table->foreignId('conversation_id')
                ->nullable()
                ->after('owner_user_id')
                ->constrained('conversations')
                ->nullOnDelete();
        });

        Schema::create('community_group_memberships', function (Blueprint $table) {
            $table->id();
            $table->foreignId('community_group_id')->constrained('community_groups')->cascadeOnDelete();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->string('status', 16);
            $table->string('role', 16)->default('member');
            $table->timestamp('requested_at')->nullable();
            $table->timestamp('decided_at')->nullable();
            $table->timestamps();

            $table->unique(['community_group_id', 'user_id']);
            $table->index(['community_group_id', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('community_group_memberships');

        Schema::table('community_groups', function (Blueprint $table) {
            $table->dropConstrainedForeignId('conversation_id');
        });
    }
};
