<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('login_otps', function (Blueprint $table) {
            $table->string('channel', 16)->default('email')->after('id');
            $table->string('identifier', 255)->after('channel');
        });

        DB::table('login_otps')->update([
            'identifier' => DB::raw('email'),
            'channel' => 'email',
        ]);

        Schema::table('login_otps', function (Blueprint $table) {
            $table->dropIndex(['email']);
            $table->dropColumn('email');
            $table->index(['channel', 'identifier']);
        });
    }

    public function down(): void
    {
        Schema::table('login_otps', function (Blueprint $table) {
            $table->string('email')->after('id');
        });

        DB::table('login_otps')->update([
            'email' => DB::raw('identifier'),
        ]);

        Schema::table('login_otps', function (Blueprint $table) {
            $table->dropIndex(['channel', 'identifier']);
            $table->dropColumn(['channel', 'identifier']);
            $table->string('email')->nullable(false)->change();
        });
    }
};
