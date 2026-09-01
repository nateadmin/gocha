<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\StatusItem;
use App\Models\User;
use App\Services\Status\StatusService;
use App\Support\StatusType;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class StatusController extends Controller
{
    public function __construct(private readonly StatusService $statuses) {}

    public function index(Request $request): JsonResponse
    {
        return response()->json($this->statuses->feed($request->user()));
    }

    public function showUser(Request $request, User $user): JsonResponse
    {
        $viewer = $request->user();
        $items = $this->statuses->itemsForUser($user, $viewer);

        return response()->json([
            'userId' => $user->id,
            'displayName' => $user->chatDisplayName(),
            'avatarUrl' => $user->avatarUrl(),
            'items' => $items,
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'text' => ['required', 'string', 'max:700'],
            'backgroundColor' => ['sometimes', 'nullable', 'string', Rule::in(StatusType::backgrounds())],
        ]);

        $item = $this->statuses->createText(
            $request->user(),
            trim($validated['text']),
            $validated['backgroundColor'] ?? null,
        );

        return response()->json([
            'item' => $item->toViewerPayload($request->user(), true),
        ], 201);
    }

    public function storeMedia(Request $request): JsonResponse
    {
        $isVideo = $request->input('type') === StatusType::VIDEO;
        $validated = $request->validate([
            'type' => ['required', 'string', Rule::in([StatusType::IMAGE, StatusType::VIDEO])],
            'text' => ['sometimes', 'nullable', 'string', 'max:700'],
            'durationMs' => ['sometimes', 'nullable', 'integer', 'min:1000', 'max:'.StatusType::VIDEO_MAX_MS],
            'media' => [
                'required',
                'file',
                $isVideo ? 'mimetypes:video/mp4,video/quicktime,video/webm' : 'image',
                $isVideo ? 'max:20480' : 'max:8192',
            ],
        ]);

        $item = $this->statuses->createMedia(
            $request->user(),
            $validated['media'],
            $validated['type'],
            isset($validated['text']) ? trim((string) $validated['text']) : null,
            isset($validated['durationMs']) ? (int) $validated['durationMs'] : null,
        );

        return response()->json([
            'item' => $item->fresh()->toViewerPayload($request->user(), true),
        ], 201);
    }

    public function view(Request $request, StatusItem $statusItem): JsonResponse
    {
        $this->statuses->markViewed($statusItem, $request->user());

        return response()->json(['ok' => true]);
    }

    public function viewers(Request $request, StatusItem $statusItem): JsonResponse
    {
        return response()->json([
            'viewers' => $this->statuses->viewers($statusItem, $request->user()),
        ]);
    }

    public function update(Request $request, StatusItem $statusItem): JsonResponse
    {
        $hasFile = $request->hasFile('media');
        $isVideo = $request->input('type') === StatusType::VIDEO;
        $validated = $request->validate([
            'type' => ['sometimes', 'string', Rule::in(StatusType::all())],
            'text' => ['sometimes', 'nullable', 'string', 'max:700'],
            'backgroundColor' => ['sometimes', 'nullable', 'string', Rule::in(StatusType::backgrounds())],
            'durationMs' => ['sometimes', 'nullable', 'integer', 'min:1000', 'max:'.StatusType::VIDEO_MAX_MS],
            'media' => $hasFile
                ? [
                    'required',
                    'file',
                    $isVideo ? 'mimetypes:video/mp4,video/quicktime,video/webm' : 'image',
                    $isVideo ? 'max:20480' : 'max:8192',
                ]
                : ['sometimes'],
        ]);

        $item = $this->statuses->update(
            $statusItem,
            $request->user(),
            $validated,
            $hasFile ? $request->file('media') : null,
        );

        return response()->json([
            'item' => $item->toViewerPayload($request->user(), true),
        ]);
    }

    public function destroy(Request $request, StatusItem $statusItem): JsonResponse
    {
        $this->statuses->delete($statusItem, $request->user());

        return response()->json(['ok' => true]);
    }
}
