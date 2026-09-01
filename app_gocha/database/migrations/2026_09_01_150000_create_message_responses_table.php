<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('message_responses', function (Blueprint $table) {
            $table->id();
            $table->foreignId('message_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('choice', 40);
            $table->timestamps();

            $table->unique(['message_id', 'user_id', 'choice']);
            $table->index(['message_id', 'choice']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('message_responses');
    }
};
