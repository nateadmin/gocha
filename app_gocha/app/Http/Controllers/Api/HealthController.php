<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Support\CorrelationId;
use Illuminate\Http\JsonResponse;

class HealthController extends Controller
{
    public function show(): JsonResponse
    {
        return response()->json([
            'status' => 'ok',
            'service' => 'gocha-api',
            'correlationId' => CorrelationId::current(),
            'timestamp' => now()->toIso8601String(),
        ]);
    }
}
