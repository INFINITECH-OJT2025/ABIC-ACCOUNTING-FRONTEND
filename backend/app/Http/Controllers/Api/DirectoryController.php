<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Agency;
use App\Models\GeneralContact;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
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

    public function listGeneralContacts()
    {
        $contacts = GeneralContact::query()
            ->orderBy('sort_order')
            ->orderBy('id')
            ->get();

        return response()->json(['data' => $contacts]);
    }

    public function updateGeneralContacts(Request $request)
    {
        $validated = $request->validate([
            'contacts' => 'required|array',
            'contacts.*.type' => 'required|string',
            'contacts.*.label' => 'nullable|string',
            'contacts.*.value' => 'required|string',
            'contacts.*.sort_order' => 'nullable|integer|min:0',
        ]);

        $contacts = $validated['contacts'] ?? [];

        DB::transaction(function () use ($contacts): void {
            GeneralContact::query()->delete();

            foreach ($contacts as $index => $contact) {
                GeneralContact::query()->create([
                    'type' => trim((string) ($contact['type'] ?? '')),
                    'label' => isset($contact['label']) && trim((string) $contact['label']) !== ''
                        ? trim((string) $contact['label'])
                        : null,
                    'value' => trim((string) ($contact['value'] ?? '')),
                    'sort_order' => isset($contact['sort_order']) ? (int) $contact['sort_order'] : ($index + 1),
                ]);
            }
        });

        $updated = GeneralContact::query()
            ->orderBy('sort_order')
            ->orderBy('id')
            ->get();

        return response()->json(['data' => $updated]);
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
            $response = Http::withoutVerifying()
                ->withBasicAuth($apiKey, $apiSecret)
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

    public function deleteCloudinaryImage(Request $request)
    {
        $validated = $request->validate([
            'public_id' => 'required|string',
        ]);

        $cloudName = env('NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME');
        $apiKey = env('CLOUDINARY_API_KEY');
        $apiSecret = env('CLOUDINARY_API_SECRET');

        if (!$cloudName || !$apiKey || !$apiSecret) {
            return response()->json(['message' => 'Cloudinary credentials not configured'], 500);
        }

        $publicId = $validated['public_id'];
        $timestamp = time();
        $signature = sha1("public_id={$publicId}&timestamp={$timestamp}{$apiSecret}");

        try {
            $response = Http::withoutVerifying()
                ->asForm()
                ->post("https://api.cloudinary.com/v1_1/{$cloudName}/image/destroy", [
                    'public_id' => $publicId,
                    'timestamp' => $timestamp,
                    'api_key' => $apiKey,
                    'signature' => $signature,
                ]);

            if ($response->failed()) {
                Log::error('Cloudinary Delete API Error', ['body' => $response->body()]);
                return response()->json(['message' => 'Failed to delete image from Cloudinary'], $response->status());
            }

            $result = $response->json();
            if (($result['result'] ?? null) !== 'ok') {
                Log::warning('Cloudinary Delete Unexpected Result', ['response' => $result]);
                return response()->json(['message' => 'Image deletion was not confirmed by Cloudinary'], 400);
            }

            Agency::where('image_public_id', $publicId)->update([
                'image_url' => null,
                'image_public_id' => null,
            ]);

            return response()->json(['message' => 'Image deleted successfully']);
        } catch (\Exception $e) {
            Log::error('Cloudinary Delete Exception', ['message' => $e->getMessage()]);
            return response()->json(['message' => 'Internal Server Error'], 500);
        }
    }
}
