<?php

use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return response()->json([
        'service' => 'gocha-api',
        'message' => 'Mobile-first API shell. Branding and product routes ship later.',
        'apiHealth' => url('/api/health'),
        'apiVersion' => url('/api/version'),
        'plannedHostname' => config('gocha.planned_hostname'),
    ]);
});
