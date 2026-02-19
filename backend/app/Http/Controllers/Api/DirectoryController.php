<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Agency;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class DirectoryController extends Controller
{
    public function index()
    {
        $agencies = Agency::with(['contacts', 'processes'])->get();
        return response()->json(['data' => $agencies]);
    }

    public function update(Request $request, $code)
    {
        $agency = Agency::where('code', $code)->firstOrFail();

        $validated = $request->validate([
            'name' => 'required|string',
            'full_name' => 'nullable|string',
            'summary' => 'nullable|string',
            'contacts' => 'array',
            'processes' => 'array',
        ]);

        $agency->update([
            'name' => $validated['name'],
            'full_name' => $validated['full_name'],
            'summary' => $validated['summary'],
        ]);

        // Sync contacts
        if ($request->has('contacts')) {
            // Delete existing
            $agency->contacts()->delete();
            // Create new
            foreach ($request->contacts as $contact) {
                // Ensure agency_id is not manually set, as we use relationship
                $agency->contacts()->create([
                    'type' => $contact['type'],
                    'label' => $contact['label'] ?? null,
                    'value' => $contact['value'],
                    'sort_order' => $contact['sort_order'] ?? 0,
                ]);
            }
        }

        // Sync processes
        if ($request->has('processes')) {
            $agency->processes()->delete();
            foreach ($request->processes as $process) {
                $agency->processes()->create([
                    'process_type' => $process['process_type'],
                    'process' => $process['process'],
                    'step_number' => $process['step_number'] ?? 0,
                ]);
            }
        }

        return response()->json(['data' => $agency->load(['contacts', 'processes'])]);
    }

    public function updateImage(Request $request, $code)
    {
        $agency = Agency::where('code', $code)->firstOrFail();

        $validated = $request->validate([
            'image_url' => 'required|url',
            'image_public_id' => 'nullable|string',
        ]);

        $agency->update([
            'image_url' => $validated['image_url'],
            'image_public_id' => $validated['image_public_id'],
        ]);

        return response()->json(['data' => $agency]);
    }

    public function listCloudinaryImages(Request $request)
    {
        // Try getting from config first, then env
        $cloudName = env('NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME');
        $apiKey = env('CLOUDINARY_API_KEY');
        $apiSecret = env('CLOUDINARY_API_SECRET');

        if (!$cloudName || !$apiKey || !$apiSecret) {
            return response()->json(['message' => 'Cloudinary credentials not configured'], 500);
        }

        $prefix = $request->query('prefix', '');
        $maxResults = $request->query('max_results', 30);

        try {
            $response = Http::withBasicAuth($apiKey, $apiSecret)
                ->get("https://api.cloudinary.com/v1_1/{$cloudName}/resources/image", [
                    'type' => 'upload',
                    'prefix' => $prefix,
                    'max_results' => $maxResults,
                ]);

            if ($response->failed()) {
                Log::error('Cloudinary API Error', ['body' => $response->body()]);
                return response()->json(['message' => 'Failed to fetch images from Cloudinary'], $response->status());
            }

            return response()->json(['data' => $response->json()['resources'] ?? []]);
        } catch (\Exception $e) {
            Log::error('Cloudinary Exception', ['message' => $e->getMessage()]);
            return response()->json(['message' => 'Internal Server Error'], 500);
        }
    }
}
