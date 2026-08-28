<?php

namespace App\Exceptions;

use App\Support\CorrelationId;
use Illuminate\Auth\AuthenticationException;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Foundation\Exceptions\Handler as ExceptionHandler;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Session\TokenMismatchException;
use Illuminate\Validation\ValidationException;
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
        'code',
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
        if ($e instanceof OtpRequestException) {
            return response()->json([
                'code' => $e->errorCode,
                'message' => $e->getMessage(),
                'correlationId' => CorrelationId::current(),
                'retryable' => false,
                'timestamp' => now()->toIso8601String(),
            ], 422);
        }

        if ($e instanceof OtpVerificationException) {
            return response()->json([
                'code' => $e->errorCode,
                'message' => $e->getMessage(),
                'correlationId' => CorrelationId::current(),
                'retryable' => true,
                'timestamp' => now()->toIso8601String(),
            ], 422);
        }

        if ($e instanceof AuthenticationException) {
            return response()->json([
                'code' => 'UNAUTHENTICATED',
                'message' => 'Sign in required.',
                'correlationId' => CorrelationId::current(),
                'retryable' => false,
                'timestamp' => now()->toIso8601String(),
            ], 401);
        }

        if ($e instanceof AuthorizationException) {
            return response()->json([
                'code' => 'FORBIDDEN',
                'message' => 'You do not have permission to perform this action.',
                'correlationId' => CorrelationId::current(),
                'retryable' => false,
                'timestamp' => now()->toIso8601String(),
            ], 403);
        }

        if ($e instanceof ValidationException) {
            return response()->json([
                'code' => 'VALIDATION_ERROR',
                'message' => $e->getMessage(),
                'errors' => $e->errors(),
                'correlationId' => CorrelationId::current(),
                'retryable' => false,
                'timestamp' => now()->toIso8601String(),
            ], 422);
        }

        if ($e instanceof TokenMismatchException) {
            return response()->json([
                'code' => 'CSRF_MISMATCH',
                'message' => 'Your session expired. Refresh the page and sign in again.',
                'correlationId' => CorrelationId::current(),
                'retryable' => true,
                'timestamp' => now()->toIso8601String(),
            ], 419);
        }

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
            401 => 'Sign in required.',
            404 => 'The requested API route was not found.',
            429 => 'Too many requests. Wait and try again.',
            default => $status >= 500
                ? 'The server could not complete the request. Retry or contact support with the correlation id.'
                : 'The request could not be completed. Check the input and try again.',
        };

        if ($status >= 500) {
            report($e);
        }

        return response()->json([
            'code' => $code,
            'message' => $message,
            'correlationId' => CorrelationId::current(),
            'retryable' => $status >= 500 || $status === 429,
            'timestamp' => now()->toIso8601String(),
        ], $status);
    }
}
