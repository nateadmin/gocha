<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\GochaAi\GochaAiChatService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use RuntimeException;
use Throwable;

class GochaAiController extends Controller
{
    public function __construct(private readonly GochaAiChatService $chat)
    {
    }

    public function chat(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'message' => ['required', 'string', 'max:4000'],
            'history' => ['sometimes', 'array', 'max:20'],
            'history.*.role' => ['required_with:history', 'in:user,assistant'],
            'history.*.content' => ['required_with:history', 'string', 'max:4000'],
        ]);

        $correlationId = 'gocha-ai-'.Str::uuid()->toString();

        try {
            $reply = $this->chat->reply(
                $request->user(),
                $validated['message'],
                $validated['history'] ?? [],
            );
        } catch (RuntimeException $e) {
            return response()->json([
                'code' => 'GOCHA_AI_FAILED',
                'message' => $e->getMessage(),
                'correlationId' => $correlationId,
            ], 422);
        } catch (Throwable) {
            return response()->json([
                'code' => 'GOCHA_AI_UNAVAILABLE',
                'message' => 'Gocha AI is unavailable right now.',
                'correlationId' => $correlationId,
                'retryable' => true,
            ], 503);
        }

        return response()->json([
            'reply' => $reply,
            'correlationId' => $correlationId,
        ]);
    }
}
