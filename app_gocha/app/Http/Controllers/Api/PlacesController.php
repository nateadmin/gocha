<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\Places\GooglePlacesClient;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use RuntimeException;

class PlacesController extends Controller
{
    public function __construct(private readonly GooglePlacesClient $places) {}

    public function autocomplete(Request $request): JsonResponse
    {
        $this->assertConfigured();

        $validated = $request->validate([
            'query' => ['required', 'string', 'min:2', 'max:200'],
            'sessionToken' => ['sometimes', 'nullable', 'string', 'max:128'],
            'type' => ['sometimes', 'string', Rule::in(['address', 'geocode'])],
        ]);

        try {
            $predictions = $this->places->autocomplete(
                trim($validated['query']),
                $validated['sessionToken'] ?? null,
                $validated['type'] ?? 'address',
            );
        } catch (RuntimeException $e) {
            abort(502, $e->getMessage());
        }

        return response()->json(['predictions' => $predictions]);
    }

    public function details(Request $request): JsonResponse
    {
        $this->assertConfigured();

        $validated = $request->validate([
            'placeId' => ['required', 'string', 'max:256'],
            'sessionToken' => ['sometimes', 'nullable', 'string', 'max:128'],
        ]);

        try {
            $place = $this->places->details(
                $validated['placeId'],
                $validated['sessionToken'] ?? null,
            );
        } catch (RuntimeException $e) {
            abort(502, $e->getMessage());
        }

        if ($place['formattedAddress'] === '') {
            abort(422, 'That Google place has no street address.');
        }

        return response()->json(['place' => $place]);
    }

    private function assertConfigured(): void
    {
        if (! $this->places->apiKey()) {
            abort(503, 'Google Places is not configured.');
        }
    }
}
