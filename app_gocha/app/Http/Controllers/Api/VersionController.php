<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Support\CorrelationId;
use Illuminate\Http\JsonResponse;

class VersionController extends Controller
{
    public function show(): JsonResponse
    {
        $version = config('app.build_sha') ?: 'dev';

        return response()->json([
            'service' => 'gocha-api',
            'version' => $version,
            'correlationId' => CorrelationId::current(),
            'timestamp' => now()->toIso8601String(),
        ]);
    }
}
