<?php

namespace App\Services\Business;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;

class GoogleBusinessImportService
{
  /**
   * @return array{
   *   name: string|null,
   *   address: string|null,
   *   website: string|null,
   *   category: string|null,
   *   description: string|null,
   *   googleBusinessUrl: string,
   *   googlePlaceId: string|null,
   *   noPhysicalAddress: bool,
   *   source: string
   * }
   */
  public function importFromUrl(string $url): array
  {
    $trimmed = trim($url);
    if ($trimmed === '') {
      throw new \InvalidArgumentException('Google Business link is required.');
    }

    $resolved = $this->resolveUrl($trimmed);
    $heuristic = $this->parseFromUrl($resolved);

    $apiKey = config('gocha.google_places_api_key');
    if ($apiKey && ($heuristic['name'] || $heuristic['googlePlaceId'])) {
      $places = $this->enrichWithPlacesApi($heuristic, $apiKey);
      if ($places !== null) {
        return $places;
      }
    }

    return array_merge($heuristic, [
      'source' => 'url_parse',
    ]);
  }

  /**
   * @return array<int, array<string, mixed>>
   */
  public function fetchReviews(string $googlePlaceId, ?string $apiKey = null): array
  {
    $apiKey ??= config('gocha.google_places_api_key');
    if (! $apiKey) {
      return [];
    }

    $response = Http::timeout(12)->get('https://maps.googleapis.com/maps/api/place/details/json', [
      'place_id' => $googlePlaceId,
      'fields' => 'reviews,rating,user_ratings_total',
      'key' => $apiKey,
    ]);

    if (! $response->ok()) {
      return [];
    }

    $reviews = $response->json('result.reviews') ?? [];

    return collect($reviews)
      ->take(5)
      ->map(fn (array $review) => [
        'author' => $review['author_name'] ?? 'Reviewer',
        'rating' => $review['rating'] ?? null,
        'text' => $review['text'] ?? '',
        'relativeTime' => $review['relative_time_description'] ?? null,
      ])
      ->values()
      ->all();
  }

  private function resolveUrl(string $url): string
  {
    if (! Str::startsWith($url, ['http://', 'https://'])) {
      $url = 'https://'.$url;
    }

    if (! preg_match('/maps\.app\.goo\.gl|goo\.gl\/maps/i', $url)) {
      return $url;
    }

    try {
      $response = Http::timeout(8)
        ->withOptions(['allow_redirects' => true])
        ->get($url);

      $final = $response->effectiveUri()?->__toString();
      if ($final) {
        return $final;
      }
    } catch (\Throwable) {
      // Fall back to the original URL.
    }

    return $url;
  }

  /**
   * @return array{
   *   name: string|null,
   *   address: string|null,
   *   website: string|null,
   *   category: string|null,
   *   description: string|null,
   *   googleBusinessUrl: string,
   *   googlePlaceId: string|null,
   *   noPhysicalAddress: bool
   * }
   */
  private function parseFromUrl(string $url): array
  {
    $name = null;
    $address = null;
    $placeId = null;

    if (preg_match('#/place/([^/]+)#', $url, $match)) {
      $segment = $match[1];
      if (str_contains($segment, '@')) {
        $segment = explode('@', $segment, 2)[0];
      }
      $name = $this->decodePathSegment($segment);
    }

    if (preg_match('/[?&]q=([^&]+)/', $url, $match)) {
      $query = urldecode(str_replace('+', ' ', $match[1]));
      if (! $name) {
        $name = $query;
      } elseif (! $address) {
        $address = $query;
      }
    }

    if (preg_match('/place_id:([a-zA-Z0-9_-]+)/', $url, $match)) {
      $placeId = $match[1];
    }

    if (preg_match('/[?&]query_place_id=([a-zA-Z0-9_-]+)/', $url, $match)) {
      $placeId = $match[1];
    }

    return [
      'name' => $name,
      'address' => $address,
      'website' => null,
      'category' => $this->guessCategory($name ?? ''),
      'description' => null,
      'googleBusinessUrl' => $url,
      'googlePlaceId' => $placeId,
      'noPhysicalAddress' => false,
    ];
  }

  /**
   * @param array{
   *   name: string|null,
   *   address: string|null,
   *   website: string|null,
   *   category: string|null,
   *   description: string|null,
   *   googleBusinessUrl: string,
   *   googlePlaceId: string|null,
   *   noPhysicalAddress: bool
   * } $heuristic
   */
  private function enrichWithPlacesApi(array $heuristic, string $apiKey): ?array
  {
    $placeId = $heuristic['googlePlaceId'];

    if (! $placeId && $heuristic['name']) {
      $search = Http::timeout(12)->get('https://maps.googleapis.com/maps/api/place/findplacefromtext/json', [
        'input' => $heuristic['name'],
        'inputtype' => 'textquery',
        'fields' => 'place_id,name,formatted_address,website,types',
        'key' => $apiKey,
      ]);

      if ($search->ok()) {
        $candidate = $search->json('candidates.0');
        if ($candidate) {
          $placeId = $candidate['place_id'] ?? null;
          $heuristic['name'] = $candidate['name'] ?? $heuristic['name'];
          $heuristic['address'] = $candidate['formatted_address'] ?? $heuristic['address'];
          $heuristic['website'] = $candidate['website'] ?? $heuristic['website'];
          if (! empty($candidate['types'][0])) {
            $heuristic['category'] = $this->mapGoogleType($candidate['types'][0]);
          }
        }
      }
    }

    if (! $placeId) {
      return null;
    }

    $details = Http::timeout(12)->get('https://maps.googleapis.com/maps/api/place/details/json', [
      'place_id' => $placeId,
      'fields' => 'name,formatted_address,website,types,editorial_summary',
      'key' => $apiKey,
    ]);

    if (! $details->ok()) {
      return null;
    }

    $result = $details->json('result') ?? [];

    return [
      'name' => $result['name'] ?? $heuristic['name'],
      'address' => $result['formatted_address'] ?? $heuristic['address'],
      'website' => $result['website'] ?? $heuristic['website'],
      'category' => ! empty($result['types'][0])
        ? $this->mapGoogleType($result['types'][0])
        : $heuristic['category'],
      'description' => $result['editorial_summary']['overview'] ?? $heuristic['description'],
      'googleBusinessUrl' => $heuristic['googleBusinessUrl'],
      'googlePlaceId' => $placeId,
      'noPhysicalAddress' => empty($result['formatted_address']),
      'source' => 'places_api',
    ];
  }

  private function decodePathSegment(string $segment): string
  {
    return trim(str_replace('+', ' ', urldecode($segment)));
  }

  private function guessCategory(string $name): ?string
  {
    $lower = Str::lower($name);
    $map = [
      'pizza' => 'food',
      'cafe' => 'food',
      'coffee' => 'food',
      'restaurant' => 'food',
      'pharmacy' => 'pharmacy',
      'grocery' => 'groceries',
      'market' => 'groceries',
      'salon' => 'beauty',
      'gym' => 'fitness',
      'hotel' => 'hospitality',
    ];

    foreach ($map as $needle => $category) {
      if (str_contains($lower, $needle)) {
        return $category;
      }
    }

    return null;
  }

  private function mapGoogleType(string $type): string
  {
    $map = [
      'restaurant' => 'food',
      'cafe' => 'food',
      'bakery' => 'food',
      'bar' => 'food',
      'pharmacy' => 'pharmacy',
      'supermarket' => 'groceries',
      'grocery_or_supermarket' => 'groceries',
      'store' => 'shop',
      'shopping_mall' => 'shop',
      'beauty_salon' => 'beauty',
      'hair_care' => 'beauty',
      'gym' => 'fitness',
      'lodging' => 'hospitality',
      'hospital' => 'healthcare',
      'doctor' => 'healthcare',
      'school' => 'education',
      'real_estate_agency' => 'real_estate',
      'car_dealer' => 'automotive',
      'car_repair' => 'automotive',
    ];

    return $map[$type] ?? 'services';
  }
}
