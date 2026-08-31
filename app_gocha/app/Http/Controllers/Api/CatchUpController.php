<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\CatchUpBrief;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CatchUpController extends Controller
{
    public function show(Request $request): JsonResponse
    {
        $user = $request->user();
        $briefs = CatchUpBrief::query()
            ->where('user_id', $user->id)
            ->with(['conversation.participants', 'conversation.participantRows'])
            ->get();

        $attention = [];
        $conversations = [];
        $latestGenerated = null;

        foreach ($briefs as $brief) {
            $conversation = $brief->conversation;
            if (! $conversation) {
                continue;
            }

            if ($brief->generated_at && ($latestGenerated === null || $brief->generated_at->gt($latestGenerated))) {
                $latestGenerated = $brief->generated_at;
            }

            $other = $conversation->otherParticipant($user);
            $displayName = $other?->chatDisplayName() ?? 'Conversation';
            $participantRow = $conversation->participantRows
                ->firstWhere('user_id', $user->id);
            $unread = (int) ($participantRow?->unread_count ?? 0);
            $priority = $this->displayPriority($brief->priority);

            foreach (array_values($brief->attention ?? []) as $index => $text) {
                if (! is_string($text) || trim($text) === '') {
                    continue;
                }
                $attention[] = [
                    'id' => $brief->id.':'.$index,
                    'conversationId' => $conversation->id,
                    'tone' => $brief->priority === 'high' ? 'critical' : 'warning',
                    'text' => $text,
                ];
            }

            $conversations[] = [
                'id' => $conversation->id,
                'name' => $displayName,
                'avatarUrl' => $other?->avatarUrl(),
                'avatarLabel' => $this->avatarLabel($displayName),
                'unreadCount' => $unread,
                'priority' => $priority,
                'summary' => $brief->summary,
                'plans' => $this->formatPlans($brief->plans ?? []),
            ];
        }

        usort($conversations, function (array $left, array $right): int {
            $rank = ['High' => 0, 'Medium' => 1, 'Low' => 2];
            $priorityCmp = ($rank[$left['priority']] ?? 9) <=> ($rank[$right['priority']] ?? 9);
            if ($priorityCmp !== 0) {
                return $priorityCmp;
            }

            $unreadCmp = $right['unreadCount'] <=> $left['unreadCount'];
            if ($unreadCmp !== 0) {
                return $unreadCmp;
            }

            return strcasecmp($left['name'], $right['name']);
        });

        return response()->json([
            'briefing' => $this->briefingText($attention, $conversations),
            'generatedAt' => $latestGenerated?->toIso8601String(),
            'attention' => $attention,
            'conversations' => array_values($conversations),
        ]);
    }

    /**
     * @param  array<int, array<string, mixed>>  $attention
     * @param  array<int, array<string, mixed>>  $conversations
     */
    private function briefingText(array $attention, array $conversations): string
    {
        if ($attention !== []) {
            $texts = array_map(fn (array $item) => $item['text'], array_slice($attention, 0, 3));

            return implode(' ', $texts);
        }

        $high = array_values(array_filter(
            $conversations,
            fn (array $item) => $item['priority'] === 'High',
        ));
        if ($high !== []) {
            return 'You have conversations that need a reply.';
        }

        if ($conversations !== []) {
            return "You're caught up.";
        }

        return '';
    }

    /**
     * @param  array<int, mixed>  $plans
     * @return array<int, string>
     */
    private function formatPlans(array $plans): array
    {
        $out = [];
        foreach ($plans as $plan) {
            if (is_string($plan) && trim($plan) !== '') {
                $out[] = $plan;
                continue;
            }
            if (! is_array($plan)) {
                continue;
            }
            $when = trim((string) ($plan['when'] ?? ''));
            $what = trim((string) ($plan['what'] ?? ''));
            if ($what === '') {
                continue;
            }
            $out[] = $when !== '' ? $when.': '.$what : $what;
        }

        return $out;
    }

    private function displayPriority(string $priority): string
    {
        return match (strtolower($priority)) {
            'high' => 'High',
            'medium' => 'Medium',
            default => 'Low',
        };
    }

    private function avatarLabel(string $name): string
    {
        $parts = preg_split('/\s+/', trim($name)) ?: [];
        $initials = '';
        foreach (array_slice($parts, 0, 2) as $part) {
            $initials .= strtoupper(substr($part, 0, 1));
        }

        return $initials !== '' ? $initials : 'G';
    }
}
