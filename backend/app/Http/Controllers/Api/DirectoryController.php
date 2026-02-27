<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Agency;
use App\Models\GeneralContact;
use App\Support\Validation\AppLimits;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Schema;
use Illuminate\Http\Client\PendingRequest;

class DirectoryController extends Controller
{
    private function cloudinaryConfig(): array
    {
        $cloudName = trim((string) (env('CLOUDINARY_CLOUD_NAME') ?: env('NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME')));
        $apiKey = trim((string) env('CLOUDINARY_API_KEY'));
        $apiSecret = trim((string) env('CLOUDINARY_API_SECRET'));
        $verifySsl = filter_var(env('CLOUDINARY_VERIFY_SSL', true), FILTER_VALIDATE_BOOL, FILTER_NULL_ON_FAILURE);

        return [
            'cloud_name' => $cloudName,
            'api_key' => $apiKey,
            'api_secret' => $apiSecret,
            'verify_ssl' => $verifySsl !== false,
        ];
    }

    private function cloudinaryHttpClient(string $apiKey, string $apiSecret, bool $verifySsl): PendingRequest
    {
        return Http::withBasicAuth($apiKey, $apiSecret)->withOptions([
            'verify' => $verifySsl,
        ]);
    }

    public function index()
    {
        $agencies = Agency::with(['contacts', 'processes'])->get();

        $hasLegacyTable = Schema::hasTable('government_contributions_processes');
        $legacyHasAgencyId = $hasLegacyTable && Schema::hasColumn('government_contributions_processes', 'agency_id');

        $rows = $agencies->map(function (Agency $agency) use ($hasLegacyTable, $legacyHasAgencyId) {
            $payload = $agency->toArray();
            $currentProcesses = collect($payload['processes'] ?? []);

            if ($currentProcesses->isNotEmpty() || !$hasLegacyTable) {
                return $payload;
            }

            $legacyQuery = DB::table('government_contributions_processes')
                ->orderBy('step_number')
                ->orderBy('id');

            if ($legacyHasAgencyId) {
                $legacyQuery->where('agency_id', $agency->id);
            } else {
                $code = strtolower((string) $agency->code);
                $legacyLabels = match ($code) {
                    'sss' => ['sss'],
                    'philhealth' => ['philhealth'],
                    'pagibig' => ['pag-ibig', 'pagibig'],
                    'tin' => ['bir (tin)', 'tin (bir)', 'bir'],
                    default => [strtolower((string) $agency->name), strtolower((string) $agency->full_name)],
                };

                $legacyQuery->where(function ($query) use ($legacyLabels) {
                    foreach ($legacyLabels as $label) {
                        $trimmed = trim((string) $label);
                        if ($trimmed === '') {
                            continue;
                        }
                        $query->orWhereRaw('LOWER(government_contribution_type) = ?', [$trimmed]);
                    }
                });
            }

            $legacyRows = $legacyQuery->get([
                'id',
                'process_type',
                'process',
                'step_number',
                'created_at',
                'updated_at',
            ]);

            $payload['processes'] = $legacyRows->map(fn($row) => [
                'id' => (int) $row->id,
                'agency_id' => (int) $agency->id,
                'process_type' => (string) ($row->process_type ?? ''),
                'process' => (string) ($row->process ?? ''),
                'step_number' => (int) ($row->step_number ?? 0),
                'created_at' => $row->created_at,
                'updated_at' => $row->updated_at,
            ])->values()->all();

            return $payload;
        })->values();

        return response()->json(['data' => $rows]);
    }

    public function update(Request $request, $code)
    {
        $agency = Agency::where('code', $code)->first();
        if (!$agency) {
            return response()->json(['message' => 'Agency record not found.'], 404);
        }

        $forbiddenTextRule = function (string $fieldLabel) {
            return function ($attribute, $value, $fail) use ($fieldLabel): void {
                if (preg_match(AppLimits::FORBIDDEN_TEXT_REGEX, (string) $value)) {
                    $fail($fieldLabel . ' contains unsupported special characters (' . AppLimits::FORBIDDEN_TEXT_LABEL . ').');
                }
            };
        };

        $validated = $request->validate([
            'name' => [
                'required',
                'string',
                'min:' . AppLimits::DIRECTORY_AGENCY_NAME_APP_MIN,
                'max:' . AppLimits::DIRECTORY_AGENCY_NAME_APP_MAX,
                $forbiddenTextRule('Agency name'),
            ],
            'full_name' => [
                'nullable',
                'string',
                'max:' . AppLimits::DIRECTORY_FULL_NAME_APP_MAX,
                $forbiddenTextRule('Full name'),
            ],
            'summary' => [
                'nullable',
                'string',
                'max:' . AppLimits::DIRECTORY_SUMMARY_APP_MAX,
                $forbiddenTextRule('Summary'),
            ],
            'contacts' => 'nullable|array|max:200',
            'contacts.*.type' => [
                'required',
                'string',
                'max:' . AppLimits::DIRECTORY_CONTACT_TYPE_APP_MAX,
                $forbiddenTextRule('Contact type'),
            ],
            'contacts.*.label' => [
                'nullable',
                'string',
                'max:' . AppLimits::DIRECTORY_CONTACT_LABEL_APP_MAX,
                $forbiddenTextRule('Contact label'),
            ],
            'contacts.*.value' => [
                'required',
                'string',
                'min:' . AppLimits::DIRECTORY_CONTACT_VALUE_APP_MIN,
                'max:' . AppLimits::DIRECTORY_CONTACT_VALUE_APP_MAX,
                $forbiddenTextRule('Contact value'),
            ],
            'contacts.*.sort_order' => 'nullable|integer|min:1|max:10000',
            'processes' => 'nullable|array|max:500',
            'processes.*.process_type' => 'required|string|in:Adding,Removing',
            'processes.*.process' => [
                'required',
                'string',
                'min:' . AppLimits::DIRECTORY_PROCESS_TEXT_APP_MIN,
                'max:' . AppLimits::DIRECTORY_PROCESS_TEXT_APP_MAX,
                $forbiddenTextRule('Process text'),
            ],
            'processes.*.step_number' => 'nullable|integer|min:1|max:10000',
        ], [
            'name.required' => 'Agency name is required.',
            'name.min' => 'Agency name must be at least ' . AppLimits::DIRECTORY_AGENCY_NAME_APP_MIN . ' characters long.',
            'name.not_regex' => 'Agency name contains unsupported special characters (' . AppLimits::FORBIDDEN_TEXT_LABEL . ').',
            'contacts.*.type.required' => 'Each contact row needs a contact type.',
            'contacts.*.value.required' => 'Each contact row needs a contact value.',
            'processes.*.process_type.in' => 'Process type must be either Adding or Removing.',
            'processes.*.process.required' => 'Each process row needs a step description.',
            'contacts.*.type.not_regex' => 'Contact type contains unsupported special characters (' . AppLimits::FORBIDDEN_TEXT_LABEL . ').',
            'contacts.*.label.not_regex' => 'Contact label contains unsupported special characters (' . AppLimits::FORBIDDEN_TEXT_LABEL . ').',
            'contacts.*.value.not_regex' => 'Contact value contains unsupported special characters (' . AppLimits::FORBIDDEN_TEXT_LABEL . ').',
            'processes.*.process.not_regex' => 'Process text contains unsupported special characters (' . AppLimits::FORBIDDEN_TEXT_LABEL . ').',
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
        $agency = Agency::where('code', $code)->first();
        if (!$agency) {
            return response()->json(['message' => 'Agency record not found.'], 404);
        }

        $validated = $request->validate([
            'image_url' => 'required|url|max:2048',
            'image_public_id' => 'nullable|string|max:255',
            'format' => 'nullable|string|in:jpg,jpeg,png,gif,webp,heic,heif',
            'bytes' => 'nullable|integer|min:1|max:20971520',
        ], [
            'image_url.required' => 'Image URL is required.',
            'image_url.url' => 'Image URL must be a valid link.',
            'format.in' => 'Only JPG, PNG, GIF, WebP, HEIC, and HEIF images are allowed.',
            'bytes.max' => 'Image size must be 20MB or less.',
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
        $forbiddenTextRule = function (string $fieldLabel) {
            return function ($attribute, $value, $fail) use ($fieldLabel): void {
                if (preg_match(AppLimits::FORBIDDEN_TEXT_REGEX, (string) $value)) {
                    $fail($fieldLabel . ' contains unsupported special characters (' . AppLimits::FORBIDDEN_TEXT_LABEL . ').');
                }
            };
        };

        $validated = $request->validate([
            'contacts' => 'required|array|min:1|max:500',
            'contacts.*.id' => 'nullable|integer|exists:general_contacts,id',
            'contacts.*.type' => [
                'nullable',
                'string',
                'max:' . AppLimits::DIRECTORY_CONTACT_TYPE_APP_MAX,
                $forbiddenTextRule('Contact type'),
            ],
            'contacts.*.label' => [
                'nullable',
                'string',
                'max:' . AppLimits::DIRECTORY_CONTACT_LABEL_APP_MAX,
                $forbiddenTextRule('Contact label'),
            ],
            'contacts.*.value' => [
                'required',
                'string',
                'min:' . AppLimits::DIRECTORY_GENERAL_VALUE_APP_MIN,
                'max:' . AppLimits::DIRECTORY_GENERAL_VALUE_APP_MAX,
                $forbiddenTextRule('Contact value'),
            ],
            'contacts.*.establishment_name' => [
                'required',
                'string',
                'min:' . AppLimits::DIRECTORY_GENERAL_ESTABLISHMENT_APP_MIN,
                'max:' . AppLimits::DIRECTORY_GENERAL_ESTABLISHMENT_APP_MAX,
                $forbiddenTextRule('Establishment name'),
            ],
            'contacts.*.services' => [
                'nullable',
                'string',
                'max:' . AppLimits::DIRECTORY_GENERAL_SERVICES_APP_MAX,
                $forbiddenTextRule('Services'),
            ],
            'contacts.*.contact_person' => [
                'nullable',
                'string',
                'max:' . AppLimits::DIRECTORY_GENERAL_CONTACT_PERSON_APP_MAX,
                $forbiddenTextRule('Contact person'),
            ],
            'contacts.*.sort_order' => 'nullable|integer|min:1|max:10000',
            'contacts.*.avatar_url' => 'nullable|url|max:2048',
            'contacts.*.avatar_public_id' => 'nullable|string|max:255',
        ], [
            'contacts.required' => 'Please provide at least one general contact entry.',
            'contacts.min' => 'Please provide at least one general contact entry.',
            'contacts.*.establishment_name.required' => 'Each row needs an establishment name.',
            'contacts.*.value.required' => 'Each row needs a contact value.',
            'contacts.*.avatar_url.url' => 'Avatar URL must be a valid link.',
        ]);

        $contacts = $validated['contacts'] ?? [];

        DB::transaction(function () use ($contacts): void {
            $incomingIds = collect($contacts)
                ->pluck('id')
                ->filter(fn ($id) => $id !== null)
                ->map(fn ($id) => (int) $id)
                ->values();

            if ($incomingIds->isEmpty()) {
                GeneralContact::query()->delete();
            } else {
                GeneralContact::query()
                    ->whereNotIn('id', $incomingIds)
                    ->delete();
            }

            foreach ($contacts as $index => $contact) {
                $payload = [
                    'type' => trim((string) ($contact['type'] ?? 'phone')) ?: 'phone',
                    'label' => isset($contact['label']) && trim((string) $contact['label']) !== ''
                        ? trim((string) $contact['label'])
                        : null,
                    'establishment_name' => trim((string) ($contact['establishment_name'] ?? '')),
                    'services' => isset($contact['services']) && trim((string) $contact['services']) !== ''
                        ? trim((string) $contact['services'])
                        : null,
                    'contact_person' => isset($contact['contact_person']) && trim((string) $contact['contact_person']) !== ''
                        ? trim((string) $contact['contact_person'])
                        : null,
                    'value' => trim((string) ($contact['value'] ?? '')),
                    'avatar_url' => isset($contact['avatar_url']) && trim((string) $contact['avatar_url']) !== ''
                        ? trim((string) $contact['avatar_url'])
                        : null,
                    'avatar_public_id' => isset($contact['avatar_public_id']) && trim((string) $contact['avatar_public_id']) !== ''
                        ? trim((string) $contact['avatar_public_id'])
                        : null,
                    'sort_order' => isset($contact['sort_order']) ? (int) $contact['sort_order'] : ($index + 1),
                ];

                if (isset($contact['id'])) {
                    $existing = GeneralContact::query()->find((int) $contact['id']);
                    if ($existing) {
                        $existing->update($payload);
                        continue;
                    }
                }

                GeneralContact::query()->create($payload);
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
        $config = $this->cloudinaryConfig();
        $cloudName = $config['cloud_name'];
        $apiKey = $config['api_key'];
        $apiSecret = $config['api_secret'];
        $verifySsl = $config['verify_ssl'];

        if (!$cloudName || !$apiKey || !$apiSecret) {
            return response()->json(['message' => 'Cloudinary credentials not configured'], 500);
        }

        $prefix = $request->query('prefix', '');
        $maxResults = (int) $request->query('max_results', 30);
        $maxResults = max(1, min($maxResults, 100));

        try {
            $response = $this->cloudinaryHttpClient($apiKey, $apiSecret, $verifySsl)
                ->get("https://api.cloudinary.com/v1_1/{$cloudName}/resources/image", [
                    'type' => 'upload',
                    'prefix' => $prefix,
                    'max_results' => $maxResults,
                ]);

            if ($response->failed()) {
                Log::error('Cloudinary API Error', [
                    'status' => $response->status(),
                    'body' => $response->body(),
                ]);
                return response()->json([
                    'message' => 'Failed to fetch images from Cloudinary',
                    'details' => $response->json()['error']['message'] ?? null,
                ], $response->status());
            }

            return response()->json(['data' => $response->json()['resources'] ?? []]);
        } catch (\Exception $e) {
            Log::error('Cloudinary Exception', ['message' => $e->getMessage()]);
            return response()->json([
                'message' => 'Internal Server Error',
                'details' => $e->getMessage(),
            ], 500);
        }
    }

    public function deleteCloudinaryImage(Request $request)
    {
        $validated = $request->validate([
            'public_id' => 'required|string|max:255',
        ], [
            'public_id.required' => 'Cloudinary image ID is required for deletion.',
        ]);

        $config = $this->cloudinaryConfig();
        $cloudName = $config['cloud_name'];
        $apiKey = $config['api_key'];
        $apiSecret = $config['api_secret'];
        $verifySsl = $config['verify_ssl'];

        if (!$cloudName || !$apiKey || !$apiSecret) {
            return response()->json(['message' => 'Cloudinary credentials not configured'], 500);
        }

        $publicId = $validated['public_id'];
        $timestamp = time();
        $signature = sha1("public_id={$publicId}&timestamp={$timestamp}{$apiSecret}");

        try {
            $response = Http::asForm()->withOptions([
                'verify' => $verifySsl,
            ])
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
            GeneralContact::where('avatar_public_id', $publicId)->update([
                'avatar_url' => null,
                'avatar_public_id' => null,
            ]);

            return response()->json(['message' => 'Image deleted successfully']);
        } catch (\Exception $e) {
            Log::error('Cloudinary Delete Exception', ['message' => $e->getMessage()]);
            return response()->json([
                'message' => 'Internal Server Error',
                'details' => $e->getMessage(),
            ], 500);
        }
    }

}
