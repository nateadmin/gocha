<?php

namespace App\Services\Chat;

use App\Exceptions\GroupPostException;
use App\Models\Conversation;
use App\Models\ConversationParticipant;
use App\Models\Message;
use App\Models\MessageResponse;
use App\Models\User;
use App\Support\MessageType;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class GroupPostService
{
    public const RSVP_CHOICES = ['going', 'maybe', 'cant'];

    public const LOCATION_KINDS = ['pickup', 'meetup', 'ship'];

    /**
     * @param  array<string, mixed>  $input
     */
    public function create(Conversation $conversation, User $sender, array $input, ?UploadedFile $image = null): Message
    {
        $type = (string) ($input['type'] ?? '');
        if (! MessageType::isInteractive($type)) {
            throw ValidationException::withMessages([
                'type' => ['That post type is not supported.'],
            ]);
        }

        if (! $conversation->isGroup()) {
            throw new GroupPostException(
                'GROUP_ONLY',
                'Offers, polls, and RSVPs can be posted in groups.',
                422,
            );
        }

        $metadata = match ($type) {
            MessageType::OFFER => $this->offerMetadata($input, $sender, $image),
            MessageType::POLL => $this->pollMetadata($input),
            MessageType::RSVP => $this->rsvpMetadata($input),
            default => throw ValidationException::withMessages([
                'type' => ['That post type is not supported.'],
            ]),
        };

        $body = match ($type) {
            MessageType::OFFER => (string) $metadata['offer']['title'],
            MessageType::POLL => (string) $metadata['poll']['question'],
            MessageType::RSVP => (string) $metadata['rsvp']['title'],
            default => '',
        };

        return DB::transaction(function () use ($conversation, $sender, $type, $body, $metadata) {
            $message = Message::query()->create([
                'conversation_id' => $conversation->id,
                'sender_user_id' => $sender->id,
                'type' => $type,
                'body' => $body,
                'metadata' => $metadata,
            ]);

            $conversation->forceFill([
                'last_message_body' => $this->previewLabel($type, $body),
                'last_message_at' => $message->created_at,
                'last_message_sender_user_id' => $sender->id,
            ])->save();

            ConversationParticipant::query()
                ->where('conversation_id', $conversation->id)
                ->where('user_id', '!=', $sender->id)
                ->increment('unread_count');

            ConversationParticipant::query()
                ->where('conversation_id', $conversation->id)
                ->where('user_id', $sender->id)
                ->update([
                    'last_read_at' => $message->created_at,
                    'unread_count' => 0,
                ]);

            return $message->fresh(['responses.user', 'sender']);
        });
    }

    /**
     * @param  array{action: string, choice?: string|null}  $input
     */
    public function act(Conversation $conversation, Message $message, User $actor, array $input): Message
    {
        if ((int) $message->conversation_id !== (int) $conversation->id) {
            throw new GroupPostException('NOT_FOUND', 'Message not found in this conversation.', 404);
        }

        if (! MessageType::isInteractive((string) $message->type)) {
            throw new GroupPostException('NOT_INTERACTIVE', 'This message cannot be claimed or voted on.', 422);
        }

        $action = (string) $input['action'];

        return DB::transaction(function () use ($message, $actor, $action, $input) {
            $locked = Message::query()->whereKey($message->id)->lockForUpdate()->firstOrFail();
            $locked->load(['responses.user', 'sender']);

            match ($action) {
                'claim' => $this->claim($locked, $actor),
                'unclaim' => $this->unclaim($locked, $actor),
                'taken' => $this->markTaken($locked, $actor),
                'release' => $this->release($locked, $actor),
                'vote' => $this->vote($locked, $actor, (string) ($input['choice'] ?? '')),
                'close' => $this->close($locked, $actor),
                default => throw ValidationException::withMessages([
                    'action' => ['That action is not supported.'],
                ]),
            };

            return $locked->fresh(['responses.user', 'sender']);
        });
    }

    /**
     * @return array<string, mixed>
     */
    public function payload(Message $message, User $viewer): array
    {
        $message->loadMissing(['responses.user', 'sender']);

        return match ($message->type) {
            MessageType::OFFER => ['offer' => $this->offerPayload($message, $viewer)],
            MessageType::POLL => ['poll' => $this->pollPayload($message, $viewer)],
            MessageType::RSVP => ['rsvp' => $this->rsvpPayload($message, $viewer)],
            default => [],
        };
    }

    /**
     * @param  array<string, mixed>  $input
     * @return array<string, mixed>
     */
    private function offerMetadata(array $input, User $sender, ?UploadedFile $image): array
    {
        $title = trim((string) ($input['title'] ?? ''));
        if ($title === '') {
            throw ValidationException::withMessages([
                'title' => ['Title is required.'],
            ]);
        }

        $locationKind = (string) ($input['locationKind'] ?? 'pickup');
        if (! in_array($locationKind, self::LOCATION_KINDS, true)) {
            $locationKind = 'pickup';
        }

        $imagePath = null;
        if ($image) {
            $imagePath = $image->store('conversation-posts/'.$sender->id, 'public');
        }

        return [
            'offer' => [
                'title' => Str::limit($title, 120, ''),
                'description' => Str::limit(trim((string) ($input['description'] ?? '')), 500, ''),
                'location' => Str::limit(trim((string) ($input['location'] ?? '')), 120, ''),
                'locationKind' => $locationKind,
                'imagePath' => $imagePath,
                'quantity' => 1,
                'status' => 'available',
                'closedByPoster' => false,
            ],
        ];
    }

    /**
     * @param  array<string, mixed>  $input
     * @return array<string, mixed>
     */
    private function pollMetadata(array $input): array
    {
        $question = trim((string) ($input['question'] ?? ''));
        if ($question === '') {
            throw ValidationException::withMessages([
                'question' => ['Question is required.'],
            ]);
        }

        $kind = (string) ($input['kind'] ?? 'vote');
        if (! in_array($kind, ['vote', 'multi'], true)) {
            $kind = 'vote';
        }

        $rawOptions = $input['options'] ?? [];
        if (! is_array($rawOptions)) {
            $rawOptions = [];
        }

        $options = [];
        foreach ($rawOptions as $option) {
            $text = trim(is_string($option) ? $option : (string) ($option['text'] ?? ''));
            if ($text === '') {
                continue;
            }
            $options[] = [
                'id' => 'o'.(count($options) + 1),
                'text' => Str::limit($text, 80, ''),
            ];
        }

        if (count($options) < 2) {
            throw ValidationException::withMessages([
                'options' => ['Add at least two options.'],
            ]);
        }

        if (count($options) > 12) {
            $options = array_slice($options, 0, 12);
        }

        return [
            'poll' => [
                'kind' => $kind,
                'question' => Str::limit($question, 200, ''),
                'anonymous' => (bool) ($input['anonymous'] ?? false),
                'closed' => false,
                'options' => $options,
            ],
        ];
    }

    /**
     * @param  array<string, mixed>  $input
     * @return array<string, mixed>
     */
    private function rsvpMetadata(array $input): array
    {
        $title = trim((string) ($input['title'] ?? ''));
        if ($title === '') {
            throw ValidationException::withMessages([
                'title' => ['Title is required.'],
            ]);
        }

        return [
            'rsvp' => [
                'title' => Str::limit($title, 120, ''),
                'when' => Str::limit(trim((string) ($input['when'] ?? '')), 80, ''),
                'where' => Str::limit(trim((string) ($input['where'] ?? '')), 120, ''),
                'closed' => false,
            ],
        ];
    }

    private function claim(Message $message, User $actor): void
    {
        $this->assertType($message, MessageType::OFFER);
        $offer = $this->offerState($message);
        if ($offer['status'] === 'taken' || $offer['closedByPoster']) {
            $existing = $message->responses->first(
                fn (MessageResponse $row) => (int) $row->user_id === (int) $actor->id && $row->choice === 'claim',
            );
            if ($existing) {
                return;
            }
            throw new GroupPostException('ALREADY_TAKEN', 'This item is already taken.');
        }

        MessageResponse::query()->firstOrCreate([
            'message_id' => $message->id,
            'user_id' => $actor->id,
            'choice' => 'claim',
        ]);

        $this->syncOfferStatus($message);
    }

    private function unclaim(Message $message, User $actor): void
    {
        $this->assertType($message, MessageType::OFFER);
        $isPoster = (int) $message->sender_user_id === (int) $actor->id;

        $query = MessageResponse::query()
            ->where('message_id', $message->id)
            ->where('choice', 'claim');

        if (! $isPoster) {
            $query->where('user_id', $actor->id);
        }

        $deleted = $query->delete();
        if ($deleted === 0 && ! $isPoster) {
            throw new GroupPostException('NOT_CLAIMER', 'You have not claimed this item.', 422);
        }

        $meta = is_array($message->metadata) ? $message->metadata : [];
        $offer = is_array($meta['offer'] ?? null) ? $meta['offer'] : [];
        $offer['closedByPoster'] = false;
        $offer['status'] = 'available';
        $meta['offer'] = $offer;
        $message->forceFill(['metadata' => $meta])->save();
        $message->unsetRelation('responses');
        $this->syncOfferStatus($message);
    }

    private function markTaken(Message $message, User $actor): void
    {
        $this->assertType($message, MessageType::OFFER);
        if ((int) $message->sender_user_id !== (int) $actor->id) {
            throw new GroupPostException('FORBIDDEN', 'Only the poster can mark this taken.', 403);
        }

        $meta = is_array($message->metadata) ? $message->metadata : [];
        $offer = is_array($meta['offer'] ?? null) ? $meta['offer'] : [];
        $offer['status'] = 'taken';
        $offer['closedByPoster'] = true;
        $meta['offer'] = $offer;
        $message->forceFill(['metadata' => $meta])->save();
    }

    private function release(Message $message, User $actor): void
    {
        $this->assertType($message, MessageType::OFFER);
        if ((int) $message->sender_user_id !== (int) $actor->id) {
            throw new GroupPostException('FORBIDDEN', 'Only the poster can release this item.', 403);
        }

        MessageResponse::query()
            ->where('message_id', $message->id)
            ->where('choice', 'claim')
            ->delete();

        $meta = is_array($message->metadata) ? $message->metadata : [];
        $offer = is_array($meta['offer'] ?? null) ? $meta['offer'] : [];
        $offer['status'] = 'available';
        $offer['closedByPoster'] = false;
        $meta['offer'] = $offer;
        $message->forceFill(['metadata' => $meta])->save();
        $message->unsetRelation('responses');
    }

    private function vote(Message $message, User $actor, string $choice): void
    {
        $choice = trim($choice);
        if ($message->type === MessageType::RSVP) {
            $this->voteRsvp($message, $actor, $choice);

            return;
        }

        $this->assertType($message, MessageType::POLL);
        $poll = $this->pollState($message);
        if ($poll['closed']) {
            throw new GroupPostException('CLOSED', 'This poll is closed.', 422);
        }

        $optionIds = array_map(fn (array $option) => $option['id'], $poll['options']);
        if (! in_array($choice, $optionIds, true)) {
            throw ValidationException::withMessages([
                'choice' => ['That option is not on this poll.'],
            ]);
        }

        $existing = MessageResponse::query()
            ->where('message_id', $message->id)
            ->where('user_id', $actor->id)
            ->where('choice', $choice)
            ->first();

        if ($existing) {
            $existing->delete();

            return;
        }

        if ($poll['kind'] !== 'multi') {
            MessageResponse::query()
                ->where('message_id', $message->id)
                ->where('user_id', $actor->id)
                ->delete();
        }

        MessageResponse::query()->create([
            'message_id' => $message->id,
            'user_id' => $actor->id,
            'choice' => $choice,
        ]);
    }

    private function voteRsvp(Message $message, User $actor, string $choice): void
    {
        $rsvp = $this->rsvpState($message);
        if ($rsvp['closed']) {
            throw new GroupPostException('CLOSED', 'This RSVP is closed.', 422);
        }

        if (! in_array($choice, self::RSVP_CHOICES, true)) {
            throw ValidationException::withMessages([
                'choice' => ['Choose going, maybe, or cant.'],
            ]);
        }

        $existing = MessageResponse::query()
            ->where('message_id', $message->id)
            ->where('user_id', $actor->id)
            ->where('choice', $choice)
            ->first();

        if ($existing) {
            $existing->delete();

            return;
        }

        MessageResponse::query()
            ->where('message_id', $message->id)
            ->where('user_id', $actor->id)
            ->delete();

        MessageResponse::query()->create([
            'message_id' => $message->id,
            'user_id' => $actor->id,
            'choice' => $choice,
        ]);
    }

    private function close(Message $message, User $actor): void
    {
        if ((int) $message->sender_user_id !== (int) $actor->id) {
            throw new GroupPostException('FORBIDDEN', 'Only the poster can close this.', 403);
        }

        $meta = is_array($message->metadata) ? $message->metadata : [];
        if ($message->type === MessageType::POLL) {
            $poll = is_array($meta['poll'] ?? null) ? $meta['poll'] : [];
            $poll['closed'] = true;
            $meta['poll'] = $poll;
        } elseif ($message->type === MessageType::RSVP) {
            $rsvp = is_array($meta['rsvp'] ?? null) ? $meta['rsvp'] : [];
            $rsvp['closed'] = true;
            $meta['rsvp'] = $rsvp;
        } else {
            throw new GroupPostException('NOT_INTERACTIVE', 'This post cannot be closed.', 422);
        }

        $message->forceFill(['metadata' => $meta])->save();
    }

    private function syncOfferStatus(Message $message): void
    {
        $message->load('responses');
        $claims = $message->responses->where('choice', 'claim')->count();
        $meta = is_array($message->metadata) ? $message->metadata : [];
        $offer = is_array($meta['offer'] ?? null) ? $meta['offer'] : [];
        $quantity = max(1, (int) ($offer['quantity'] ?? 1));
        $closed = (bool) ($offer['closedByPoster'] ?? false);
        $offer['status'] = ($closed || $claims >= $quantity) ? 'taken' : 'available';
        $meta['offer'] = $offer;
        $message->forceFill(['metadata' => $meta])->save();
    }

    /**
     * @return array<string, mixed>
     */
    private function offerPayload(Message $message, User $viewer): array
    {
        $offer = $this->offerState($message);
        $claims = $message->responses->where('choice', 'claim')->values();
        $claimer = $claims->first();
        $myClaimed = $claims->contains(fn (MessageResponse $row) => (int) $row->user_id === (int) $viewer->id);
        $imagePath = is_string($offer['imagePath'] ?? null) ? $offer['imagePath'] : null;

        return [
            'title' => (string) ($offer['title'] ?? $message->body),
            'description' => (string) ($offer['description'] ?? ''),
            'location' => (string) ($offer['location'] ?? ''),
            'locationKind' => (string) ($offer['locationKind'] ?? 'pickup'),
            'imageUrl' => $imagePath ? Storage::disk('public')->url($imagePath) : null,
            'status' => (string) ($offer['status'] ?? 'available'),
            'quantity' => max(1, (int) ($offer['quantity'] ?? 1)),
            'claimedCount' => $claims->count(),
            'claimedByUserId' => $claimer?->user_id,
            'claimedByName' => $claimer?->user?->chatDisplayName(),
            'myClaimed' => $myClaimed,
            'canClaim' => ($offer['status'] ?? 'available') === 'available' && ! $myClaimed,
            'canMarkTaken' => (int) $message->sender_user_id === (int) $viewer->id
                && ($offer['status'] ?? 'available') === 'available',
            'canRelease' => (int) $message->sender_user_id === (int) $viewer->id
                && ($offer['status'] ?? 'available') === 'taken',
            'canUnclaim' => $myClaimed && ($offer['status'] ?? 'available') === 'taken',
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function pollPayload(Message $message, User $viewer): array
    {
        $poll = $this->pollState($message);
        $responses = $message->responses;
        $mine = $responses
            ->where('user_id', $viewer->id)
            ->pluck('choice')
            ->values()
            ->all();
        $anonymous = (bool) $poll['anonymous'];

        $options = [];
        foreach ($poll['options'] as $option) {
            $voters = $responses->where('choice', $option['id']);
            $options[] = [
                'id' => $option['id'],
                'text' => $option['text'],
                'count' => $voters->count(),
                'selected' => in_array($option['id'], $mine, true),
                'voters' => $anonymous
                    ? []
                    : $voters->map(fn (MessageResponse $row) => [
                        'userId' => (int) $row->user_id,
                        'name' => $row->user?->chatDisplayName() ?? 'Gocha user',
                    ])->values()->all(),
            ];
        }

        return [
            'kind' => $poll['kind'],
            'question' => $poll['question'],
            'anonymous' => $anonymous,
            'closed' => (bool) $poll['closed'],
            'options' => $options,
            'totalVotes' => $responses->count(),
            'myChoices' => $mine,
            'canClose' => (int) $message->sender_user_id === (int) $viewer->id && ! $poll['closed'],
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function rsvpPayload(Message $message, User $viewer): array
    {
        $rsvp = $this->rsvpState($message);
        $responses = $message->responses;
        $mine = $responses->first(fn (MessageResponse $row) => (int) $row->user_id === (int) $viewer->id);

        $counts = [];
        $voters = [];
        foreach (self::RSVP_CHOICES as $choice) {
            $rows = $responses->where('choice', $choice);
            $counts[$choice] = $rows->count();
            $voters[$choice] = $rows->map(fn (MessageResponse $row) => [
                'userId' => (int) $row->user_id,
                'name' => $row->user?->chatDisplayName() ?? 'Gocha user',
            ])->values()->all();
        }

        return [
            'title' => $rsvp['title'],
            'when' => $rsvp['when'],
            'where' => $rsvp['where'],
            'closed' => (bool) $rsvp['closed'],
            'counts' => $counts,
            'voters' => $voters,
            'myChoice' => $mine?->choice,
            'canClose' => (int) $message->sender_user_id === (int) $viewer->id && ! $rsvp['closed'],
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function offerState(Message $message): array
    {
        $meta = is_array($message->metadata) ? $message->metadata : [];

        return is_array($meta['offer'] ?? null) ? $meta['offer'] : [];
    }

    /**
     * @return array{kind: string, question: string, anonymous: bool, closed: bool, options: list<array{id: string, text: string}>}
     */
    private function pollState(Message $message): array
    {
        $meta = is_array($message->metadata) ? $message->metadata : [];
        $poll = is_array($meta['poll'] ?? null) ? $meta['poll'] : [];
        $options = [];
        foreach ($poll['options'] ?? [] as $option) {
            if (! is_array($option) || ! isset($option['id'], $option['text'])) {
                continue;
            }
            $options[] = ['id' => (string) $option['id'], 'text' => (string) $option['text']];
        }

        return [
            'kind' => (string) ($poll['kind'] ?? 'vote'),
            'question' => (string) ($poll['question'] ?? $message->body),
            'anonymous' => (bool) ($poll['anonymous'] ?? false),
            'closed' => (bool) ($poll['closed'] ?? false),
            'options' => $options,
        ];
    }

    /**
     * @return array{title: string, when: string, where: string, closed: bool}
     */
    private function rsvpState(Message $message): array
    {
        $meta = is_array($message->metadata) ? $message->metadata : [];
        $rsvp = is_array($meta['rsvp'] ?? null) ? $meta['rsvp'] : [];

        return [
            'title' => (string) ($rsvp['title'] ?? $message->body),
            'when' => (string) ($rsvp['when'] ?? ''),
            'where' => (string) ($rsvp['where'] ?? ''),
            'closed' => (bool) ($rsvp['closed'] ?? false),
        ];
    }

    private function assertType(Message $message, string $type): void
    {
        if ($message->type !== $type) {
            throw new GroupPostException('WRONG_TYPE', 'This action does not apply to that post.', 422);
        }
    }

    private function previewLabel(string $type, string $body): string
    {
        $prefix = match ($type) {
            MessageType::OFFER => 'Offer',
            MessageType::POLL => 'Poll',
            MessageType::RSVP => 'RSVP',
            default => 'Post',
        };

        return $body !== '' ? $prefix.': '.$body : $prefix;
    }
}
