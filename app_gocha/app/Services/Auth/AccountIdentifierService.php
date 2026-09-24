<?php

namespace App\Services\Auth;

use App\Support\AccountChannel;
use Illuminate\Support\Str;

class AccountIdentifierService
{
    public function normalize(string $channel, string $identifier): string
    {
        $channel = Str::lower(trim($channel));
        $identifier = trim($identifier);

        if ($channel === AccountChannel::EMAIL) {
            return Str::lower($identifier);
        }

        if ($channel === AccountChannel::PHONE) {
            return $this->normalizePhone($identifier);
        }

        throw new \InvalidArgumentException('Unsupported account channel.');
    }

    public function normalizePhone(string $phone): string
    {
        $digits = preg_replace('/\D+/', '', $phone) ?? '';

        if ($digits === '') {
            throw new \InvalidArgumentException('Phone number is required.');
        }

        if (strlen($digits) < 8 || strlen($digits) > 15) {
            throw new \InvalidArgumentException('Enter a valid phone number.');
        }

        return '+'.$digits;
    }

    /**
     * @return list<string>
     */
    public function phoneLookupCandidates(string $normalized): array
    {
        $digits = ltrim($normalized, '+');
        $candidates = ['+'.$digits];

        if (strlen($digits) === 10) {
            $candidates[] = '+1'.$digits;
        }

        if (strlen($digits) === 11 && str_starts_with($digits, '1')) {
            $candidates[] = '+'.substr($digits, 1);
        }

        return array_values(array_unique($candidates));
    }

    public function channelFromLegacyEmail(?string $email): array
    {
        return [
            'channel' => AccountChannel::EMAIL,
            'identifier' => $this->normalize(AccountChannel::EMAIL, $email ?? ''),
        ];
    }
}
