<?php

use App\Http\Controllers\Api\HealthController;
use App\Http\Controllers\Api\VersionController;
use Illuminate\Support\Facades\Route;

Route::get('/health', [HealthController::class, 'show']);
Route::get('/version', [VersionController::class, 'show']);
