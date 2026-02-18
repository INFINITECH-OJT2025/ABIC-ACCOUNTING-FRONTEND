<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Agency;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\DB;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class DirectoryController extends Controller
{
    private const DEFAULT_NAMES = [
        'philhealth' => 'PhilHealth',
        'sss' => 'SSS',
        'pagibig' => 'Pag-IBIG',
        'tin' => 'BIR (TIN)',
    ];

    public function index(): JsonResponse
    {
        $agencies = Agency::with([
            'contacts' => fn ($query) => $query->orderBy('sort_order')->orderBy('id'),
            'processes' => fn ($query) => $query
                ->orderByRaw("CASE LOWER(process_type) WHEN 'adding' THEN 1 WHEN 'removing' THEN 2 ELSE 3 END")
                ->orderBy('step_number')
                ->orderBy('id'),
        ])->orderBy('name')->get();

        return response()->json([
            'data' => $agencies,
        ]);
    }

    public function update(Request $request, string $code): JsonResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'full_name' => ['nullable', 'string', 'max:255'],
            'summary' => ['nullable', 'string'],
            'contacts' => ['required', 'array'],
            'contacts.*.id' => ['nullable', 'integer'],
            'contacts.*.type' => ['required', 'string', 'max:100'],
            'contacts.*.label' => ['nullable', 'string', 'max:255'],
            'contacts.*.value' => ['required', 'string', 'max:2000'],
            'contacts.*.sort_order' => ['nullable', 'integer', 'min:0'],
            'processes' => ['required', 'array'],
            'processes.*.id' => ['nullable', 'integer'],
            'processes.*.process_type' => ['required', 'string', Rule::in(['Adding', 'Removing'])],
            'processes.*.process' => ['required', 'string', 'max:2000'],
            'processes.*.step_number' => ['nullable', 'integer', 'min:1'],
        ]);

        $normalizedCode = strtolower(trim($code));
        $agency = Agency::where('code', $normalizedCode)->first();
        if (!$agency) {
            return response()->json([
                'message' => "Agency with code '{$code}' was not found.",
            ], 404);
        }

        DB::transaction(function () use ($agency, $validated) {
            $agency->update([
                'name' => $validated['name'],
                'full_name' => $validated['full_name'] ?? null,
                'summary' => $validated['summary'] ?? null,
            ]);

            $existingContactIds = $agency->contacts()->pluck('id')->all();
            $keptContactIds = [];
            foreach ($validated['contacts'] as $index => $contact) {
                $data = [
                    'type' => trim((string) $contact['type']),
                    'label' => isset($contact['label']) ? trim((string) $contact['label']) : null,
                    'value' => trim((string) $contact['value']),
                    'sort_order' => $contact['sort_order'] ?? ($index + 1),
                ];

                $contactId = isset($contact['id']) ? (int) $contact['id'] : null;
                if ($contactId && in_array($contactId, $existingContactIds, true)) {
                    $agency->contacts()->where('id', $contactId)->update($data);
                    $keptContactIds[] = $contactId;
                } else {
                    $created = $agency->contacts()->create($data);
                    $keptContactIds[] = $created->id;
                }
            }
            if (empty($keptContactIds)) {
                $agency->contacts()->delete();
            } else {
                $agency->contacts()->whereNotIn('id', $keptContactIds)->delete();
            }

            $existingProcessIds = $agency->processes()->pluck('id')->all();
            $keptProcessIds = [];
            foreach ($validated['processes'] as $index => $process) {
                $data = [
                    'government_contribution_type' => $agency->name,
                    'process_type' => ucfirst(strtolower((string) $process['process_type'])),
                    'process' => trim((string) $process['process']),
                    'step_number' => $process['step_number'] ?? ($index + 1),
                ];

                $processId = isset($process['id']) ? (int) $process['id'] : null;
                if ($processId && in_array($processId, $existingProcessIds, true)) {
                    $agency->processes()->where('id', $processId)->update($data);
                    $keptProcessIds[] = $processId;
                } else {
                    $created = $agency->processes()->create($data);
                    $keptProcessIds[] = $created->id;
                }
            }
            if (empty($keptProcessIds)) {
                $agency->processes()->delete();
            } else {
                $agency->processes()->whereNotIn('id', $keptProcessIds)->delete();
            }
        });

        $updatedAgency = Agency::with([
            'contacts' => fn ($query) => $query->orderBy('sort_order')->orderBy('id'),
            'processes' => fn ($query) => $query
                ->orderByRaw("CASE LOWER(process_type) WHEN 'adding' THEN 1 WHEN 'removing' THEN 2 ELSE 3 END")
                ->orderBy('step_number')
                ->orderBy('id'),
        ])->find($agency->id);

        return response()->json([
            'message' => 'Directory agency updated successfully.',
            'data' => $updatedAgency,
        ]);
    }

    public function updateImage(Request $request, string $code): JsonResponse
    {
        $validated = $request->validate([
            'image_url' => ['required', 'url', 'max:2048'],
            'image_public_id' => ['nullable', 'string', 'max:255'],
            'format' => ['nullable', 'string', Rule::in(['jpg', 'jpeg', 'png', 'gif', 'webp', 'heic', 'heif'])],
            'bytes' => ['nullable', 'integer', 'min:1', 'max:20971520'],
        ]);

        $normalizedCode = strtolower(trim($code));
        if (!array_key_exists($normalizedCode, self::DEFAULT_NAMES)) {
            return response()->json([
                'message' => "Unsupported agency code '{$code}'.",
            ], 422);
        }

        $agency = Agency::firstOrCreate(
            ['code' => $normalizedCode],
            ['name' => self::DEFAULT_NAMES[$normalizedCode] ?? strtoupper($normalizedCode)]
        );

        $agency->update([
            'image_url' => $validated['image_url'],
            'image_public_id' => $validated['image_public_id'] ?? $agency->image_public_id,
        ]);

        return response()->json([
            'message' => 'Agency image updated successfully.',
            'data' => $agency->fresh(['contacts', 'processes']),
        ]);
    }

    public function cloudinaryImages(Request $request): JsonResponse
    {
        $cloudName = config('services.cloudinary.cloud_name');
        $apiKey = config('services.cloudinary.api_key');
        $apiSecret = config('services.cloudinary.api_secret');
        $verifySsl = filter_var(config('services.cloudinary.verify_ssl', true), FILTER_VALIDATE_BOOL);

        if (!$cloudName || !$apiKey || !$apiSecret) {
            return response()->json([
                'message' => 'Cloudinary credentials are missing on backend environment.',
            ], 422);
        }

        $prefix = trim((string) $request->query('prefix', 'directory/'));
        $maxResults = min(max((int) $request->query('max_results', 30), 1), 100);

        $response = Http::withOptions(['verify' => $verifySsl])->withBasicAuth($apiKey, $apiSecret)->get(
            "https://api.cloudinary.com/v1_1/{$cloudName}/resources/image/upload",
            [
                'prefix' => $prefix,
                'max_results' => $maxResults,
                'direction' => 'desc',
            ]
        );

        if (!$response->ok()) {
            return response()->json([
                'message' => 'Failed to fetch images from Cloudinary.',
                'details' => $response->json(),
            ], $response->status());
        }

        $resources = collect($response->json('resources', []))
            ->map(function (array $item) {
                return [
                    'public_id' => $item['public_id'] ?? null,
                    'secure_url' => $item['secure_url'] ?? null,
                    'format' => $item['format'] ?? null,
                    'bytes' => $item['bytes'] ?? null,
                    'width' => $item['width'] ?? null,
                    'height' => $item['height'] ?? null,
                    'created_at' => $item['created_at'] ?? null,
                ];
            })
            ->values();

        return response()->json([
            'data' => $resources,
        ]);
    }

    public function deleteCloudinaryImage(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'public_id' => ['required', 'string', 'max:255'],
        ]);

        $cloudName = config('services.cloudinary.cloud_name');
        $apiKey = config('services.cloudinary.api_key');
        $apiSecret = config('services.cloudinary.api_secret');
        $verifySsl = filter_var(config('services.cloudinary.verify_ssl', true), FILTER_VALIDATE_BOOL);

        if (!$cloudName || !$apiKey || !$apiSecret) {
            return response()->json([
                'message' => 'Cloudinary credentials are missing on backend environment.',
            ], 422);
        }

        $query = http_build_query([
            'public_ids[]' => $validated['public_id'],
        ]);

        $response = Http::withOptions(['verify' => $verifySsl])
            ->withBasicAuth($apiKey, $apiSecret)
            ->delete("https://api.cloudinary.com/v1_1/{$cloudName}/resources/image/upload?{$query}");

        if (!$response->ok()) {
            $errorBody = $response->json();
            $detailsMessage = '';
            if (is_array($errorBody)) {
                $detailsMessage = $errorBody['error']['message'] ?? $errorBody['message'] ?? '';
            }
            return response()->json([
                'message' => $detailsMessage
                    ? "Failed to delete image from Cloudinary: {$detailsMessage}"
                    : 'Failed to delete image from Cloudinary.',
                'details' => $errorBody,
            ], $response->status());
        }

        return response()->json([
            'message' => 'Image deleted from Cloudinary successfully.',
            'data' => $response->json(),
        ]);
    }
}
