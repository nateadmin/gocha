<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('community_groups', function (Blueprint $table) {
            $table->id();
            $table->foreignId('owner_user_id')->constrained('users')->cascadeOnDelete();
            $table->string('name', 120);
            $table->text('description')->nullable();
            $table->string('privacy', 16)->default('private');
            $table->string('address', 255)->nullable();
            $table->string('city', 80)->nullable();
            $table->string('state', 80)->nullable();
            $table->string('avatar_label', 4)->nullable();
            $table->string('avatar_color', 16)->nullable();
            $table->unsignedInteger('member_count')->default(1);
            $table->timestamps();

            $table->index(['privacy', 'city', 'state']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('community_groups');
    }
};
