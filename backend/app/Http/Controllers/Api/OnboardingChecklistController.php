<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\OnboardingChecklist;
use Illuminate\Http\Request;

class OnboardingChecklistController extends Controller
{
    public function index()
    {
        $checklists = OnboardingChecklist::orderBy('created_at', 'desc')->get();
        $data = $checklists->map(function ($checklist) {
            return $this->transform($checklist);
        });
        return response()->json(['data' => $data]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|min:2|max:255',
            'position' => 'required|string|min:2|max:255',
            'department' => 'required|string|min:2|max:255',
            'startDate' => 'required|date',
            'tasks' => 'nullable|array|max:200',
            'status' => 'nullable|string|in:PENDING,DONE',
        ], [
            'name.required' => 'Employee name is required.',
            'position.required' => 'Position is required.',
            'department.required' => 'Department is required.',
            'startDate.required' => 'Start date is required.',
            'status.in' => 'Status must be either PENDING or DONE.',
        ]);

        try {
            // Map frontend keys to backend database columns if necessary
            // The frontend sends camelCase (startDate), but model uses snake_case in migration?
            // Let's check the migration for column names.
            // Migration 2026_02_16_054833_create_onboarding_checklists_table.php defines:
            // employee_name, position, department, start_date, tasks, status
            
            // The frontend sends 'name', 'position', 'department', 'startDate', 'tasks'.
            
            $data = [
                'employee_name' => $validated['name'],
                'position' => $validated['position'],
                'department' => $validated['department'],
                'start_date' => $validated['startDate'],
                'tasks' => $validated['tasks'] ?? [],
                'status' => $validated['status'] ?? 'PENDING',
            ];

            $checklist = OnboardingChecklist::create($data);
            
            // Transform back to frontend format
            $response = $this->transform($checklist);

            return response()->json([
                'success' => true,
                'message' => 'Onboarding checklist saved successfully',
                'data' => $response
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error saving checklist: ' . $e->getMessage()
            ], 500);
        }
    }

    public function update(Request $request, $id)
    {
        $checklist = OnboardingChecklist::find($id);

        if (!$checklist) {
            return response()->json(['message' => 'Checklist not found'], 404);
        }

        $validated = $request->validate([
            'name' => 'sometimes|string|min:2|max:255',
            'position' => 'sometimes|string|min:2|max:255',
            'department' => 'sometimes|string|min:2|max:255',
            'startDate' => 'sometimes|date',
            'tasks' => 'sometimes|array|max:200',
            'status' => 'sometimes|string|in:PENDING,DONE',
        ], [
            'status.in' => 'Status must be either PENDING or DONE.',
        ]);

        try {
            $data = [];
            if (isset($validated['name'])) $data['employee_name'] = $validated['name'];
            if (isset($validated['position'])) $data['position'] = $validated['position'];
            if (isset($validated['department'])) $data['department'] = $validated['department'];
            if (isset($validated['startDate'])) $data['start_date'] = $validated['startDate'];
            if (isset($validated['tasks'])) $data['tasks'] = $validated['tasks'];
            if (isset($validated['status'])) $data['status'] = $validated['status'];

            $checklist->update($data);

            $response = $this->transform($checklist);

            return response()->json([
                'success' => true,
                'message' => 'Onboarding checklist updated successfully',
                'data' => $response
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error updating checklist: ' . $e->getMessage()
            ], 500);
        }
    }

    private function transform($checklist)
    {
        return [
            'id' => $checklist->id,
            'name' => $checklist->employee_name,
            'position' => $checklist->position,
            'department' => $checklist->department,
            'startDate' => $checklist->start_date,
            'tasks' => $checklist->tasks,
            'status' => $checklist->status,
            'updated_at' => $checklist->updated_at,
            'created_at' => $checklist->created_at,
        ];
    }
}
