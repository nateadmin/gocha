<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('profile_cards', function (Blueprint $table) {
            $table->string('slug', 48)->nullable()->after('title');
        });

        $used = [];
        $cards = DB::table('profile_cards')->orderBy('id')->get(['id', 'user_id', 'type']);
        foreach ($cards as $card) {
            $user = DB::table('users')->where('id', $card->user_id)->first();
            $base = $this->slugBase($user?->username, (int) $card->user_id, (string) $card->type);
            $slug = $base;
            $n = 2;
            while (isset($used[$slug])) {
                $slug = $base.'-'.$n;
                $n++;
            }
            $used[$slug] = true;
            DB::table('profile_cards')->where('id', $card->id)->update(['slug' => $slug]);
        }

        Schema::table('profile_cards', function (Blueprint $table) {
            $table->unique('slug');
        });
    }

    public function down(): void
    {
        Schema::table('profile_cards', function (Blueprint $table) {
            $table->dropUnique(['slug']);
            $table->dropColumn('slug');
        });
    }

    private function slugBase(?string $username, int $userId, string $type): string
    {
        $prefix = strtolower(trim((string) $username));
        $prefix = preg_replace('/[^a-z0-9]+/', '-', $prefix) ?: '';
        $prefix = trim($prefix, '-');
        if ($prefix === '') {
            $prefix = 'u'.$userId;
        }
        $type = preg_replace('/[^a-z0-9]+/', '-', strtolower($type)) ?: 'card';
        $base = substr($prefix.'-'.$type, 0, 48);

        return trim($base, '-') ?: 'card';
    }
};
