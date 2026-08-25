<?php

namespace App\Exceptions;

use App\Support\CorrelationId;
use Illuminate\Foundation\Exceptions\Handler as ExceptionHandler;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Throwable;

class Handler extends ExceptionHandler
{
    /**
     * The list of the inputs that are never flashed to the session on validation exceptions.
     *
     * @var array<int, string>
     */
    protected $dontFlash = [
        'current_password',
        'password',
        'password_confirmation',
    ];

    /**
     * Register the exception handling callbacks for the application.
     */
    public function register(): void
    {
        $this->reportable(function (Throwable $e) {
            //
        });
    }

    public function render($request, Throwable $e)
    {
        if ($request->is('api/*') || $request->expectsJson()) {
            return $this->renderJson($request, $e);
        }

        return parent::render($request, $e);
    }

    private function renderJson(Request $request, Throwable $e): JsonResponse
    {
        $status = method_exists($e, 'getStatusCode') ? $e->getStatusCode() : 500;
        $code = match ($status) {
            401 => 'UNAUTHENTICATED',
            403 => 'FORBIDDEN',
            404 => 'NOT_FOUND',
            409 => 'CONFLICT',
            429 => 'RATE_LIMITED',
            default => $status >= 500 ? 'INTERNAL' : 'BAD_REQUEST',
        };

        $message = match ($status) {
            404 => 'The requested API route was not found.',
            429 => 'Too many requests. Wait and try again.',
            default => $status >= 500
                ? 'The server could not complete the request. Retry or contact support with the correlation id.'
                : 'The request could not be completed. Check the input and try again.',
        };

        return response()->json([
            'code' => $code,
            'message' => $message,
            'correlationId' => CorrelationId::current(),
            'retryable' => $status >= 500 || $status === 429,
            'timestamp' => now()->toIso8601String(),
        ], $status);
    }
}
