<?php

use App\Http\Controllers\Api\AuthOtpController;
use App\Http\Controllers\Api\HealthController;
use App\Http\Controllers\Api\ProfileController;
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
        'auth' => [
            'otpRequest' => url('/api/auth/otp/request'),
            'otpVerify' => url('/api/auth/otp/verify'),
            'me' => url('/api/me'),
        ],
    ]);
});

Route::prefix('auth/otp')->group(function () {
    Route::post('/request', [AuthOtpController::class, 'request'])
        ->middleware('throttle:otp-request');
    Route::post('/verify', [AuthOtpController::class, 'verify'])
        ->middleware('throttle:otp-verify');
});

Route::middleware('auth:sanctum')->group(function () {
    Route::get('/me', [ProfileController::class, 'me']);
    Route::post('/profile/onboarding', [ProfileController::class, 'completeOnboarding']);
    Route::post('/profile/avatar', [ProfileController::class, 'uploadAvatar']);
    Route::get('/users/search', [ProfileController::class, 'search']);
    Route::post('/auth/logout', [AuthOtpController::class, 'logout']);
});
