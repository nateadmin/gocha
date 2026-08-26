<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('display_name')->nullable()->after('name');
            $table->string('status', 160)->nullable()->after('display_name');
            $table->text('bio')->nullable()->after('status');
            $table->string('phone', 32)->nullable()->after('bio');
            $table->string('avatar_path')->nullable()->after('phone');
            $table->boolean('discoverable')->default(false)->after('avatar_path');
            $table->timestamp('onboarding_completed_at')->nullable()->after('discoverable');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn([
                'display_name',
                'status',
                'bio',
                'phone',
                'avatar_path',
                'discoverable',
                'onboarding_completed_at',
            ]);
        });
    }
};
