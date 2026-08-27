<?php

use App\Http\Controllers\Api\Admin\AdminBusinessListingController;
use App\Http\Controllers\Api\Admin\AdminVerificationController;
use App\Http\Controllers\Api\AuthOtpController;
use App\Http\Controllers\Api\BusinessListingController;
use App\Http\Controllers\Api\HealthController;
use App\Http\Controllers\Api\ProfileController;
use App\Http\Controllers\Api\VerificationController;
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
        'account' => [
            'channels' => ['email', 'phone'],
            'phoneSignInEnabled' => false,
            'multiAccount' => true,
        ],
    ]);
});

Route::get('/businesses', [BusinessListingController::class, 'index']);
Route::get('/businesses/industries', [BusinessListingController::class, 'industries']);
Route::get('/businesses/{slug}', [BusinessListingController::class, 'show']);

Route::prefix('auth/otp')->group(function () {
    Route::post('/request', [AuthOtpController::class, 'request'])
        ->middleware('throttle:otp-request');
    Route::post('/verify', [AuthOtpController::class, 'verify'])
        ->middleware('throttle:otp-verify');
});

Route::middleware('auth:sanctum')->group(function () {
    Route::get('/me', [ProfileController::class, 'me']);
    Route::post('/profile/onboarding', [ProfileController::class, 'completeOnboarding']);
    Route::post('/profile/contact', [ProfileController::class, 'updateContact']);
    Route::post('/profile/mode', [ProfileController::class, 'updateProfileMode']);
    Route::post('/profile/avatar', [ProfileController::class, 'uploadAvatar']);
    Route::get('/users/search', [ProfileController::class, 'search']);
    Route::post('/auth/logout', [AuthOtpController::class, 'logout']);

    Route::get('/businesses/mine', [BusinessListingController::class, 'mine']);
    Route::post('/businesses/import-google', [BusinessListingController::class, 'importGoogle']);
    Route::post('/businesses', [BusinessListingController::class, 'store']);
    Route::put('/businesses/mine/{businessListing}', [BusinessListingController::class, 'update']);
    Route::post('/businesses/mine/{businessListing}/draft', [BusinessListingController::class, 'saveDraft']);
    Route::post('/businesses/mine/{businessListing}/submit', [BusinessListingController::class, 'submit']);
    Route::post('/businesses/mine/{businessListing}/unpublish', [BusinessListingController::class, 'unpublish']);
    Route::post('/businesses/mine/{businessListing}/cover', [BusinessListingController::class, 'uploadCover']);
    Route::post('/businesses/mine/{businessListing}/sync-reviews', [BusinessListingController::class, 'syncReviews']);
    Route::delete('/businesses/mine/{businessListing}', [BusinessListingController::class, 'destroy']);

    Route::get('/verifications/mine', [VerificationController::class, 'mine']);
    Route::post('/verifications/user', [VerificationController::class, 'submitUserIdentity']);
    Route::post('/verifications/business/{businessListing}', [VerificationController::class, 'submitBusinessListing']);

    Route::prefix('admin')->middleware('admin')->group(function () {
        Route::get('/business-listings', [AdminBusinessListingController::class, 'index']);
        Route::post('/business-listings/{businessListing}/approve', [AdminBusinessListingController::class, 'approve']);
        Route::post('/business-listings/{businessListing}/reject', [AdminBusinessListingController::class, 'reject']);

        Route::get('/verifications', [AdminVerificationController::class, 'index']);
        Route::post('/verifications/{verificationSubmission}/approve', [AdminVerificationController::class, 'approve']);
        Route::post('/verifications/{verificationSubmission}/reject', [AdminVerificationController::class, 'reject']);
    });
});
