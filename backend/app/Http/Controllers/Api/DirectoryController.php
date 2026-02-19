<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Agency;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Schema;

class DirectoryController extends Controller
{
    public function index()
    {
        $hasContactsTable = Schema::hasTable('agency_contacts');
        $hasProcessesTable = Schema::hasTable('agency_processes');

        $query = Agency::query();
        if ($hasContactsTable) {
            $query->with('contacts');
        }
        if ($hasProcessesTable) {
            $query->with('processes');
        }

        $agencies = $query->get();
        $legacyProcessesByCode = $this->getLegacyProcessesByCode();

        $data = $agencies->map(function (Agency $agency) use ($legacyProcessesByCode, $hasContactsTable, $hasProcessesTable) {
            $row = $agency->toArray();
            $code = $this->normalizeAgencyCode($agency->code);

            $contacts = $hasContactsTable ? ($row['contacts'] ?? []) : [];
            $processes = $hasProcessesTable ? ($row['processes'] ?? []) : [];

            // Backward compatibility: if new agency_processes is empty, use legacy table data.
            if (empty($processes) && isset($legacyProcessesByCode[$code])) {
                $processes = $legacyProcessesByCode[$code];
            }

            $row['contacts'] = $contacts;
            $row['processes'] = $processes;

            return $row;
        })->values();

        return response()->json(['data' => $data]);
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

        return response()->json(['data' => $agency->load(['contacts', 'processes'])]);
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
        $verifySsl = filter_var(env('CLOUDINARY_VERIFY_SSL', true), FILTER_VALIDATE_BOOL, FILTER_NULL_ON_FAILURE);
        if ($verifySsl === null) {
            $verifySsl = true;
        }

        try {
            $http = Http::withBasicAuth($apiKey, $apiSecret);
            if (!$verifySsl) {
                $http = $http->withoutVerifying();
            }

            $response = $http
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

        $verifySsl = filter_var(env('CLOUDINARY_VERIFY_SSL', true), FILTER_VALIDATE_BOOL, FILTER_NULL_ON_FAILURE);
        if ($verifySsl === null) {
            $verifySsl = true;
        }

        try {
            $http = Http::asForm()->withBasicAuth($apiKey, $apiSecret);
            if (!$verifySsl) {
                $http = $http->withoutVerifying();
            }

            $response = $http->post("https://api.cloudinary.com/v1_1/{$cloudName}/image/destroy", [
                'public_id' => $validated['public_id'],
                'invalidate' => 'true',
            ]);

            if ($response->failed()) {
                Log::error('Cloudinary Delete API Error', ['body' => $response->body()]);
                return response()->json(['message' => 'Failed to delete image from Cloudinary'], $response->status());
            }

            return response()->json(['data' => $response->json()]);
        } catch (\Exception $e) {
            Log::error('Cloudinary Delete Exception', ['message' => $e->getMessage()]);
            return response()->json(['message' => 'Internal Server Error'], 500);
        }
    }

    private function normalizeAgencyCode(string $value): string
    {
        $normalized = strtolower(trim($value));
        $normalized = str_replace([' ', '-', '_'], '', $normalized);
        $normalized = str_replace(['(', ')'], '', $normalized);

        if (str_contains($normalized, 'philhealth')) {
            return 'philhealth';
        }
        if ($normalized === 'sss' || str_contains($normalized, 'socialsecurity')) {
            return 'sss';
        }
        if (str_contains($normalized, 'pagibig') || str_contains($normalized, 'hdmf')) {
            return 'pagibig';
        }
        if (str_contains($normalized, 'bir') || str_contains($normalized, 'tin')) {
            return 'tin';
        }

        return strtolower(trim($value));
    }

    private function getLegacyProcessesByCode(): array
    {
        if (!Schema::hasTable('government_contributions_processes')) {
            return [];
        }

        $rows = DB::table('government_contributions_processes')
            ->select([
                'id',
                'government_contribution_type',
                'process_type',
                'process',
                'step_number',
                'created_at',
                'updated_at',
            ])
            ->orderBy('government_contribution_type')
            ->orderBy('process_type')
            ->orderBy('step_number')
            ->get();

        $mapped = [];
        foreach ($rows as $row) {
            $code = $this->normalizeAgencyCode((string) ($row->government_contribution_type ?? ''));
            if (!isset($mapped[$code])) {
                $mapped[$code] = [];
            }
            $mapped[$code][] = [
                'id' => $row->id,
                'process_type' => $row->process_type,
                'process' => $row->process,
                'step_number' => $row->step_number,
                'created_at' => $row->created_at,
                'updated_at' => $row->updated_at,
            ];
        }

        return $mapped;
    }
}
