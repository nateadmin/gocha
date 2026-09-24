<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('account_links', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id_low')->constrained('users')->cascadeOnDelete();
            $table->foreignId('user_id_high')->constrained('users')->cascadeOnDelete();
            $table->timestamps();

            $table->unique(['user_id_low', 'user_id_high']);
            $table->index('user_id_high');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('account_links');
    }
};
