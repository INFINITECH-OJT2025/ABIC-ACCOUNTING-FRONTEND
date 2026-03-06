<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ClearanceChecklist;
use Illuminate\Http\Request;

class ClearanceChecklistController extends Controller
{
    public function index()
    {
        $checklists = ClearanceChecklist::orderBy('created_at', 'desc')->get();
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
            'resignationDate' => 'required|date|after_or_equal:startDate',
            'lastDay' => 'required|date|after_or_equal:resignationDate',
            'tasks' => 'nullable|array|max:200',
            'status' => 'nullable|string|in:PENDING,DONE',
        ], [
            'name.required' => 'Employee name is required.',
            'position.required' => 'Position is required.',
            'department.required' => 'Department is required.',
            'startDate.required' => 'Start date is required.',
            'resignationDate.after_or_equal' => 'Resignation date cannot be earlier than start date.',
            'lastDay.after_or_equal' => 'Last day cannot be earlier than resignation date.',
            'status.in' => 'Status must be either PENDING or DONE.',
        ]);

        try {
            $data = [
                'employee_name' => $validated['name'],
                'position' => $validated['position'],
                'department' => $validated['department'],
                'start_date' => $validated['startDate'],
                'resignation_date' => $validated['resignationDate'],
                'last_day' => $validated['lastDay'],
                'tasks' => $validated['tasks'] ?? [],
                'status' => $validated['status'] ?? 'PENDING',
            ];

            $checklist = ClearanceChecklist::create($data);
            
            $response = $this->transform($checklist);

            return response()->json([
                'success' => true,
                'message' => 'Clearance checklist saved successfully',
                'data' => $response
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error saving clearance checklist: ' . $e->getMessage()
            ], 500);
        }
    }

    public function update(Request $request, $id)
    {
        $checklist = ClearanceChecklist::find($id);

        if (!$checklist) {
            return response()->json(['message' => 'Checklist not found'], 404);
        }

        $validated = $request->validate([
            'name' => 'sometimes|string|min:2|max:255',
            'position' => 'sometimes|string|min:2|max:255',
            'department' => 'sometimes|string|min:2|max:255',
            'startDate' => 'sometimes|date',
            'resignationDate' => 'sometimes|date',
            'lastDay' => 'sometimes|date',
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
            if (isset($validated['resignationDate'])) $data['resignation_date'] = $validated['resignationDate'];
            if (isset($validated['lastDay'])) $data['last_day'] = $validated['lastDay'];
            if (isset($validated['tasks'])) $data['tasks'] = $validated['tasks'];
            if (isset($validated['status'])) $data['status'] = $validated['status'];

            $checklist->update($data);

            $response = $this->transform($checklist);

            return response()->json([
                'success' => true,
                'message' => 'Clearance checklist updated successfully',
                'data' => $response
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error updating clearance checklist: ' . $e->getMessage()
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
            'startDate' => $checklist->start_date ? $checklist->start_date->format('Y-m-d') : null,
            'resignationDate' => $checklist->resignation_date ? $checklist->resignation_date->format('Y-m-d') : null,
            'lastDay' => $checklist->last_day ? $checklist->last_day->format('Y-m-d') : null,
            'tasks' => $checklist->tasks,
            'status' => $checklist->status,
            'updated_at' => $checklist->updated_at,
            'created_at' => $checklist->created_at,
        ];
    }
}
