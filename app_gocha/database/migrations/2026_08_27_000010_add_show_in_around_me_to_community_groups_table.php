<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('community_groups', function (Blueprint $table) {
            $table->boolean('show_in_around_me')->default(false)->after('state');
        });
    }

    public function down(): void
    {
        Schema::table('community_groups', function (Blueprint $table) {
            $table->dropColumn('show_in_around_me');
        });
    }
};
