<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        DB::table('users')
            ->whereNotNull('display_name')
            ->where('display_name', '!=', '')
            ->update([
                'name' => DB::raw('display_name'),
            ]);

        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn('display_name');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('display_name')->nullable()->after('name');
        });

        DB::table('users')->update([
            'display_name' => DB::raw('name'),
        ]);
    }
};
