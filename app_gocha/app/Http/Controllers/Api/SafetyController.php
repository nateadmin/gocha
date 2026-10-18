<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ContentReport;
use App\Models\ConversationParticipant;
use App\Models\Message;
use App\Models\StatusItem;
use App\Models\User;
use App\Models\UserBlock;
use App\Services\Alerts\SuperAdminAlerter;
use App\Services\Status\StatusService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

/**
 * Block and report (App Store guideline 1.2 for user-generated content).
 */
class SafetyController extends Controller
{
    public function __construct(
        private readonly SuperAdminAlerter $alerts,
        private readonly StatusService $statuses,
    ) {}

    public function blocks(Request $request): JsonResponse
    {
        $blocks = UserBlock::query()
            ->where('blocker_user_id', $request->user()->id)
            ->with('blocked')
            ->orderByDesc('id')
            ->get()
            ->filter(fn (UserBlock $block) => $block->blocked !== null)
            ->map(fn (UserBlock $block) => [
                'userId' => $block->blocked->id,
                'displayName' => $block->blocked->publicDisplayName(),
                'username' => $block->blocked->username,
                'avatarUrl' => $block->blocked->avatarUrl(),
            ])
            ->values();

        return response()->json(['blocks' => $blocks]);
    }

    public function block(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'userId' => ['required', 'integer', 'exists:users,id'],
        ]);

        $user = $request->user();
        $targetId = (int) $validated['userId'];

        if ($targetId === $user->id) {
            return response()->json([
                'code' => 'INVALID_BLOCK',
                'message' => 'You cannot block yourself.',
            ], 422);
        }

        UserBlock::query()->firstOrCreate([
            'blocker_user_id' => $user->id,
            'blocked_user_id' => $targetId,
        ]);

        return response()->json(['blocked' => true, 'userId' => $targetId]);
    }

    public function unblock(Request $request, User $user): JsonResponse
    {
        UserBlock::query()
            ->where('blocker_user_id', $request->user()->id)
            ->where('blocked_user_id', $user->id)
            ->delete();

        return response()->json(['blocked' => false, 'userId' => $user->id]);
    }

    public function report(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'reason' => ['required', 'string', Rule::in(ContentReport::REASONS)],
            'details' => ['nullable', 'string', 'max:1000'],
            'userId' => ['nullable', 'integer', 'exists:users,id'],
            'messageId' => ['nullable', 'integer', 'exists:messages,id'],
            'conversationId' => ['nullable', 'integer', 'exists:conversations,id'],
            'statusItemId' => ['nullable', 'integer', 'exists:status_items,id'],
        ]);

        $reporter = $request->user();
        $reportedUserId = isset($validated['userId']) ? (int) $validated['userId'] : null;
        $conversationId = isset($validated['conversationId']) ? (int) $validated['conversationId'] : null;
        $excerpt = null;
        $messageId = null;
        $statusItemId = null;

        if (isset($validated['messageId'])) {
            $message = Message::query()->find((int) $validated['messageId']);
            // A user may only report messages from conversations they belong to.
            if (! $message || ! $this->isParticipant($reporter->id, (int) $message->conversation_id)) {
                return response()->json([
                    'code' => 'REPORT_NOT_ALLOWED',
                    'message' => 'You can only report messages in your own conversations.',
                ], 403);
            }
            $messageId = $message->id;
            $conversationId = (int) $message->conversation_id;
            // A message report is always about the person who sent it.
            $reportedUserId = (int) $message->sender_user_id;
            $excerpt = Str::limit((string) $message->body, 1000);
        } elseif (isset($validated['statusItemId'])) {
            $status = StatusItem::query()->with('user')->find((int) $validated['statusItemId']);
            if (! $status || ! $status->user || ! $this->statuses->canView($reporter, $status->user)) {
                return response()->json([
                    'code' => 'REPORT_NOT_ALLOWED',
                    'message' => 'You can only report statuses you can see.',
                ], 403);
            }
            $statusItemId = $status->id;
            $reportedUserId = (int) $status->user_id;
            $excerpt = Str::limit((string) ($status->body ?? $status->media_path ?? ''), 1000);
        } elseif ($conversationId !== null && ! $this->isParticipant($reporter->id, $conversationId)) {
            return response()->json([
                'code' => 'REPORT_NOT_ALLOWED',
                'message' => 'You can only report your own conversations.',
            ], 403);
        }

        if ($reportedUserId === null && $conversationId === null) {
            return response()->json([
                'code' => 'REPORT_TARGET_REQUIRED',
                'message' => 'Choose a person, message, or conversation to report.',
            ], 422);
        }

        if ($reportedUserId === $reporter->id) {
            return response()->json([
                'code' => 'INVALID_REPORT',
                'message' => 'You cannot report yourself.',
            ], 422);
        }

        $target = [
            'reporter_user_id' => $reporter->id,
            'reported_user_id' => $reportedUserId,
            'conversation_id' => $conversationId,
            'message_id' => $messageId,
            'status_item_id' => $statusItemId,
        ];

        // Repeat taps on the same thing reuse the open report and send no new alert.
        $existing = ContentReport::query()
            ->where($target)
            ->where('status', ContentReport::STATUS_OPEN)
            ->first();
        if ($existing) {
            return response()->json([
                'report' => ['id' => $existing->id, 'status' => $existing->status],
                'message' => 'Thanks. Our team reviews reports within 24 hours.',
            ]);
        }

        $report = ContentReport::query()->create($target + [
            'reason' => $validated['reason'],
            'details' => $validated['details'] ?? null,
            'message_excerpt' => $excerpt,
            'status' => ContentReport::STATUS_OPEN,
        ]);

        // Moderators must see reports quickly; Apple expects action within 24
        // hours. The email goes out after the response so it never slows the app.
        $alerts = $this->alerts;
        $reportId = $report->id;
        $reason = $report->reason;
        app()->terminating(function () use ($alerts, $reportId, $reason) {
            $alerts->send(
                'safety',
                'content-report',
                'New '.$reason.' report #'.$reportId.' needs review within 24 hours.',
            );
        });

        return response()->json([
            'report' => ['id' => $report->id, 'status' => $report->status],
            'message' => 'Thanks. Our team reviews reports within 24 hours.',
        ], 201);
    }

    public function adminReports(Request $request): JsonResponse
    {
        $status = $request->query('status', ContentReport::STATUS_OPEN);

        $reports = ContentReport::query()
            ->when($status !== 'all', fn ($query) => $query->where('status', $status))
            ->with(['reporter', 'reportedUser'])
            ->orderByDesc('id')
            ->limit(200)
            ->get()
            ->map(fn (ContentReport $report) => $report->toAdminPayload())
            ->values();

        return response()->json(['reports' => $reports]);
    }

    public function resolveReport(Request $request, ContentReport $contentReport): JsonResponse
    {
        $contentReport->forceFill([
            'status' => ContentReport::STATUS_RESOLVED,
            'resolved_by_user_id' => $request->user()->id,
            'resolved_at' => now(),
        ])->save();

        return response()->json(['report' => $contentReport->fresh(['reporter', 'reportedUser'])->toAdminPayload()]);
    }

    private function isParticipant(int $userId, int $conversationId): bool
    {
        return ConversationParticipant::query()
            ->where('conversation_id', $conversationId)
            ->where('user_id', $userId)
            ->exists();
    }
}
