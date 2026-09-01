<?php

namespace App\Services\Places;

use Illuminate\Http\Client\PendingRequest;
use Illuminate\Support\Facades\Http;
use RuntimeException;

class GooglePlacesClient
{
    public function apiKey(): ?string
    {
        $key = config('gocha.google_places_api_key');

        return is_string($key) && trim($key) !== '' ? $key : null;
    }

    public function http(): PendingRequest
    {
        return Http::timeout(12)
            ->connectTimeout(5)
            ->withOptions(['force_ip_resolve' => 'v4']);
    }

    /**
     * @return list<array{placeId: string, description: string, mainText: string, secondaryText: string}>
     */
    public function autocomplete(string $query, ?string $sessionToken = null, string $type = 'address'): array
    {
        $key = $this->requireKey();
        $params = [
            'input' => $query,
            'types' => $type === 'geocode' ? 'geocode' : 'address',
            'key' => $key,
        ];
        if ($sessionToken) {
            $params['sessiontoken'] = $sessionToken;
        }

        $response = $this->http()->get('https://maps.googleapis.com/maps/api/place/autocomplete/json', $params);
        if (! $response->ok()) {
            throw new RuntimeException('Google Places autocomplete failed.');
        }

        $status = (string) ($response->json('status') ?? '');
        if (in_array($status, ['ZERO_RESULTS', 'INVALID_REQUEST'], true)) {
            return [];
        }
        if ($status !== 'OK') {
            throw new RuntimeException('Google Places autocomplete was denied.');
        }

        return collect($response->json('predictions') ?? [])
            ->take(8)
            ->map(fn (array $prediction) => [
                'placeId' => (string) ($prediction['place_id'] ?? ''),
                'description' => (string) ($prediction['description'] ?? ''),
                'mainText' => (string) ($prediction['structured_formatting']['main_text'] ?? $prediction['description'] ?? ''),
                'secondaryText' => (string) ($prediction['structured_formatting']['secondary_text'] ?? ''),
            ])
            ->filter(fn (array $row) => $row['placeId'] !== '' && $row['description'] !== '')
            ->values()
            ->all();
    }

    /**
     * @return array{
     *   placeId: string,
     *   formattedAddress: string,
     *   city: string|null,
     *   state: string|null,
     *   latitude: float|null,
     *   longitude: float|null
     * }
     */
    public function details(string $placeId, ?string $sessionToken = null): array
    {
        $key = $this->requireKey();
        $params = [
            'place_id' => $placeId,
            'fields' => 'place_id,formatted_address,address_component,geometry',
            'key' => $key,
        ];
        if ($sessionToken) {
            $params['sessiontoken'] = $sessionToken;
        }

        $response = $this->http()->get('https://maps.googleapis.com/maps/api/place/details/json', $params);
        if (! $response->ok() || ($response->json('status') ?? '') !== 'OK') {
            throw new RuntimeException('Google Places details failed.');
        }

        $result = $response->json('result') ?? [];
        $components = $result['address_components'] ?? [];

        return [
            'placeId' => (string) ($result['place_id'] ?? $placeId),
            'formattedAddress' => (string) ($result['formatted_address'] ?? ''),
            'city' => $this->component($components, ['locality', 'sublocality', 'postal_town', 'administrative_area_level_2']),
            'state' => $this->component($components, ['administrative_area_level_1'], short: true),
            'latitude' => isset($result['geometry']['location']['lat']) ? (float) $result['geometry']['location']['lat'] : null,
            'longitude' => isset($result['geometry']['location']['lng']) ? (float) $result['geometry']['location']['lng'] : null,
        ];
    }

    /**
     * @param  list<array<string, mixed>>  $components
     * @param  list<string>  $types
     */
    private function component(array $components, array $types, bool $short = false): ?string
    {
        foreach ($types as $wanted) {
            foreach ($components as $component) {
                $have = $component['types'] ?? [];
                if (! in_array($wanted, $have, true)) {
                    continue;
                }
                $value = $short
                    ? ($component['short_name'] ?? $component['long_name'] ?? null)
                    : ($component['long_name'] ?? $component['short_name'] ?? null);
                if (is_string($value) && trim($value) !== '') {
                    return trim($value);
                }
            }
        }

        return null;
    }

    private function requireKey(): string
    {
        $key = $this->apiKey();
        if (! $key) {
            throw new RuntimeException('Google Places API is not configured.');
        }

        return $key;
    }
}
