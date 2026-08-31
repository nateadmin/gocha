<?php

namespace App\Services\Business;

use Illuminate\Http\Client\PendingRequest;
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

    $response = $this->placesHttp()->get('https://maps.googleapis.com/maps/api/place/details/json', [
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
        ->connectTimeout(5)
        ->withOptions(['allow_redirects' => true, 'force_ip_resolve' => 'v4'])
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
      $search = $this->placesHttp()->get('https://maps.googleapis.com/maps/api/place/findplacefromtext/json', [
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

    $details = $this->placesHttp()->get('https://maps.googleapis.com/maps/api/place/details/json', [
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

  private function placesHttp(): PendingRequest
  {
    return Http::timeout(12)
      ->connectTimeout(5)
      ->withOptions(['force_ip_resolve' => 'v4']);
  }

  private function decodePathSegment(string $segment): string
  {
    return trim(str_replace('+', ' ', urldecode($segment)));
  }

  private function guessCategory(string $name): ?string
  {
    $lower = Str::lower($name);
    $map = [
      'web dev' => 'web_development',
      'website' => 'web_development',
      'software' => 'software',
      'tech' => 'technology',
      'technology' => 'technology',
      'it ' => 'it_services',
      'cyber' => 'cybersecurity',
      'saas' => 'saas',
      'cloud' => 'cloud_computing',
      'data' => 'data_analytics',
      'ai ' => 'ai_machine_learning',
      'app dev' => 'mobile_app_development',
      'mobile app' => 'mobile_app_development',
      'pizza' => 'restaurant',
      'cafe' => 'cafe',
      'coffee' => 'cafe',
      'restaurant' => 'restaurant',
      'bar' => 'bar_nightlife',
      'brewery' => 'brewery_winery',
      'winery' => 'brewery_winery',
      'bakery' => 'bakery',
      'pharmacy' => 'pharmacy',
      'grocery' => 'groceries',
      'market' => 'groceries',
      'salon' => 'salon_barbershop',
      'barber' => 'salon_barbershop',
      'gym' => 'fitness',
      'hotel' => 'hotel_lodging',
      'motel' => 'hotel_lodging',
      'law' => 'legal',
      'attorney' => 'legal',
      'account' => 'accounting',
      'insurance' => 'finance_insurance',
      'bank' => 'finance_insurance',
      'marketing' => 'marketing_advertising',
      'design' => 'design_creative',
      'photo' => 'photography_video',
      'plumb' => 'plumbing',
      'electric' => 'electrical',
      'hvac' => 'hvac',
      'roof' => 'roofing',
      'landscap' => 'landscaping',
      'clean' => 'cleaning_services',
      'daycare' => 'childcare',
      'school' => 'education',
      'university' => 'education',
      'college' => 'education',
      'vet' => 'veterinary',
      'dental' => 'dental',
      'dentist' => 'dental',
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
      'restaurant' => 'restaurant',
      'cafe' => 'cafe',
      'bakery' => 'bakery',
      'bar' => 'bar_nightlife',
      'night_club' => 'bar_nightlife',
      'meal_delivery' => 'delivery_courier',
      'meal_takeaway' => 'restaurant',
      'pharmacy' => 'pharmacy',
      'drugstore' => 'pharmacy',
      'supermarket' => 'groceries',
      'grocery_or_supermarket' => 'groceries',
      'convenience_store' => 'convenience_store',
      'store' => 'retail',
      'shopping_mall' => 'retail',
      'clothing_store' => 'fashion_apparel',
      'shoe_store' => 'fashion_apparel',
      'jewelry_store' => 'jewelry',
      'electronics_store' => 'electronics',
      'furniture_store' => 'furniture',
      'home_goods_store' => 'furniture',
      'hardware_store' => 'hardware',
      'book_store' => 'bookstore',
      'florist' => 'florist',
      'pet_store' => 'pet_services',
      'beauty_salon' => 'salon_barbershop',
      'hair_care' => 'salon_barbershop',
      'spa' => 'spa_massage',
      'gym' => 'fitness',
      'lodging' => 'hotel_lodging',
      'hospital' => 'healthcare',
      'doctor' => 'healthcare',
      'dentist' => 'dental',
      'veterinary_care' => 'veterinary',
      'physiotherapist' => 'healthcare',
      'school' => 'education',
      'university' => 'education',
      'lawyer' => 'legal',
      'accounting' => 'accounting',
      'insurance_agency' => 'finance_insurance',
      'finance' => 'finance_insurance',
      'bank' => 'finance_insurance',
      'real_estate_agency' => 'real_estate',
      'general_contractor' => 'construction',
      'plumber' => 'plumbing',
      'electrician' => 'electrical',
      'roofing_contractor' => 'roofing',
      'moving_company' => 'storage_moving',
      'storage' => 'storage_moving',
      'travel_agency' => 'travel_agency',
      'car_dealer' => 'car_dealer',
      'car_repair' => 'auto_repair',
      'car_rental' => 'car_rental',
      'gas_station' => 'automotive',
      'movie_theater' => 'entertainment',
      'amusement_park' => 'amusement_attractions',
      'art_gallery' => 'art_gallery',
      'church' => 'religious',
      'local_government_office' => 'government',
      'police' => 'government',
      'fire_station' => 'government',
      'post_office' => 'government',
      'laundry' => 'cleaning_services',
      'locksmith' => 'security_services',
      'parking' => 'logistics_transportation',
      'transit_station' => 'logistics_transportation',
      'airport' => 'airline_aviation',
      'primary_school' => 'education',
      'secondary_school' => 'education',
      'library' => 'education',
      'stadium' => 'sports_recreation',
      'bowling_alley' => 'entertainment',
      'casino' => 'entertainment',
      'tourist_attraction' => 'outdoor_adventure',
      'campground' => 'outdoor_adventure',
      'rv_park' => 'outdoor_adventure',
      'zoo' => 'amusement_attractions',
      'aquarium' => 'amusement_attractions',
      'museum' => 'entertainment',
      'painter' => 'construction',
      'landscaper' => 'landscaping',
      'food' => 'food',
    ];

    return $map[$type] ?? 'services';
  }
}
