<?php

use App\Http\Controllers\Api\HealthController;
use App\Http\Controllers\Api\VersionController;
use Illuminate\Support\Facades\Route;

Route::get('/health', [HealthController::class, 'show']);
Route::get('/version', [VersionController::class, 'show']);

Route::get('/meta', function () {
    return response()->json([
        'service' => 'gocha-api',
        'message' => 'Mobile-first API. Web shell is served at the site root.',
        'apiHealth' => url('/api/health'),
        'apiVersion' => url('/api/version'),
        'plannedHostname' => config('gocha.planned_hostname'),
    ]);
});
