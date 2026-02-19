<?php

use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\DB;
use App\Models\Agency;
use App\Models\AgencyProcess;

Route::get('/migrate-processes', function () {
    $oldProcesses = DB::table('government_contributions_processes')->get();
    $count = 0;
    $errors = [];

    foreach ($oldProcesses as $old) {
        $agency = Agency::where('name', $old->government_contribution_type)
            ->orWhere('code', strtolower($old->government_contribution_type))
            ->orWhere('full_name', $old->government_contribution_type) 
            ->first();

        if ($agency) {
            AgencyProcess::firstOrCreate(
                [
                    'agency_id' => $agency->id,
                    'process' => $old->process,
                ],
                [
                    'process_type' => $old->process_type,
                    'step_number' => $old->step_number
                ]
            );
            $count++;
        } else {
            $errors[] = "Agency not found for: {$old->government_contribution_type}";
        }
    }

    return response()->json([
        'migrated_count' => $count,
        'errors' => $errors
    ]);
});
