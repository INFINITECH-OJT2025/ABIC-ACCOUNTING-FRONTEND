<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ClearanceChecklist;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

class ClearanceChecklistController extends Controller
{
    private function parseTasks($tasks): array
    {
        if (is_array($tasks)) {
            return $tasks;
        }

        if (is_string($tasks)) {
            $decoded = json_decode($tasks, true);
            return is_array($decoded) ? $decoded : [];
        }

        return [];
    }

    private function completionPercentage(array $tasks): int
    {
        if (count($tasks) === 0) {
            return 0;
        }

        $done = collect($tasks)->filter(function ($task) {
            return strtoupper((string) ($task['status'] ?? '')) === 'DONE';
        })->count();

        return (int) round(($done / count($tasks)) * 100);
    }

    private function formatChecklist(ClearanceChecklist $checklist): array
    {
        $tasks = $this->parseTasks($checklist->tasks);
        $completion = $this->completionPercentage($tasks);

        return [
            'id' => (string) $checklist->id,
            'name' => $checklist->employee_name,
            'position' => $checklist->position,
            'department' => $checklist->department,
            'startDate' => optional($checklist->start_date)->format('Y-m-d') ?? $checklist->start_date,
            'resignationDate' => optional($checklist->resignation_date)->format('Y-m-d') ?? $checklist->resignation_date,
            'lastDay' => optional($checklist->last_day)->format('Y-m-d') ?? $checklist->last_day,
            'tasks' => $tasks,
            'status' => $checklist->status,
            'completionPercentage' => $completion,
            'createdAt' => optional($checklist->created_at)->toISOString(),
            'updatedAt' => optional($checklist->updated_at)->toISOString(),
        ];
    }

    private function validatePayload(Request $request, bool $partial = false): array
    {
        $rules = [
            'name' => 'sometimes|string|max:255',
            'employee_name' => 'sometimes|string|max:255',
            'position' => 'sometimes|nullable|string|max:255',
            'department' => 'sometimes|nullable|string|max:255',
            'startDate' => 'sometimes|date',
            'start_date' => 'sometimes|date',
            'resignationDate' => 'sometimes|date',
            'resignation_date' => 'sometimes|date',
            'lastDay' => 'sometimes|date',
            'last_day' => 'sometimes|date',
            'tasks' => ($partial ? 'sometimes|' : 'required|') . 'array',
            'tasks.*.id' => 'sometimes',
            'tasks.*.task' => 'required|string|max:1000',
            'tasks.*.status' => 'required|string|in:DONE,PENDING',
            'tasks.*.date' => 'sometimes|nullable|date',
            'status' => 'sometimes|nullable|string|max:255',
        ];

        $validated = $request->validate($rules);

        $employeeName = $validated['name'] ?? $validated['employee_name'] ?? null;
        $startDate = $validated['startDate'] ?? $validated['start_date'] ?? null;
        $resignationDate = $validated['resignationDate'] ?? $validated['resignation_date'] ?? null;
        $lastDay = $validated['lastDay'] ?? $validated['last_day'] ?? null;
        $tasks = array_key_exists('tasks', $validated) ? $this->parseTasks($validated['tasks']) : null;

        if (!$partial && is_null($employeeName)) {
            throw ValidationException::withMessages([
                'name' => ['The name field is required.'],
            ]);
        }

        if (!$partial && is_null($startDate)) {
            throw ValidationException::withMessages([
                'startDate' => ['The startDate field is required.'],
            ]);
        }

        if (!$partial && is_null($resignationDate)) {
            throw ValidationException::withMessages([
                'resignationDate' => ['The resignationDate field is required.'],
            ]);
        }

        if (!$partial && is_null($lastDay)) {
            throw ValidationException::withMessages([
                'lastDay' => ['The lastDay field is required.'],
            ]);
        }

        $payload = [];
        if (!is_null($employeeName)) {
            $payload['employee_name'] = $employeeName;
        }
        if (array_key_exists('position', $validated)) {
            $payload['position'] = $validated['position'];
        }
        if (array_key_exists('department', $validated)) {
            $payload['department'] = $validated['department'];
        }
        if (!is_null($startDate)) {
            $payload['start_date'] = $startDate;
        }
        if (!is_null($resignationDate)) {
            $payload['resignation_date'] = $resignationDate;
        }
        if (!is_null($lastDay)) {
            $payload['last_day'] = $lastDay;
        }
        if (!is_null($tasks)) {
            $payload['tasks'] = $tasks;
        }
        if (array_key_exists('status', $validated) && !is_null($validated['status'])) {
            $payload['status'] = $validated['status'];
        } elseif (!is_null($tasks)) {
            $payload['status'] = $this->completionPercentage($tasks) === 100 ? 'DONE' : 'PENDING';
        }

        return $payload;
    }

    public function index()
    {
        $checklists = ClearanceChecklist::all();

        return response()->json([
            'success' => true,
            'message' => 'Clearance checklists retrieved successfully',
            'data' => $checklists->map(fn ($checklist) => $this->formatChecklist($checklist))->values(),
        ], 200);
    }

    public function store(Request $request)
    {
        try {
            $payload = $this->validatePayload($request);
            $clearanceChecklist = ClearanceChecklist::create($payload);

            return response()->json([
                'success' => true,
                'message' => 'Clearance checklist created successfully',
                'data' => $this->formatChecklist($clearanceChecklist),
            ], 201);
        } catch (ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $e->errors(),
            ], 422);
        }
    }

    public function show($id)
    {
        $checklist = ClearanceChecklist::find($id);
        if (!$checklist) {
            return response()->json([
                'success' => false,
                'message' => 'Clearance checklist not found',
            ], 404);
        }

        return response()->json([
            'success' => true,
            'message' => 'Clearance checklist retrieved successfully',
            'data' => $this->formatChecklist($checklist),
        ], 200);
    }

    public function update(Request $request, $id)
    {
        $checklist = ClearanceChecklist::find($id);
        if (!$checklist) {
            return response()->json([
                'success' => false,
                'message' => 'Clearance checklist not found',
            ], 404);
        }

        try {
            $payload = $this->validatePayload($request, true);
            $checklist->update($payload);

            return response()->json([
                'success' => true,
                'message' => 'Clearance checklist updated successfully',
                'data' => $this->formatChecklist($checklist->fresh()),
            ], 200);
        } catch (ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $e->errors(),
            ], 422);
        }
    }

    public function destroy($id)
    {
        $checklist = ClearanceChecklist::find($id);
        if (!$checklist) {
            return response()->json([
                'success' => false,
                'message' => 'Clearance checklist not found',
            ], 404);
        }

        $checklist->delete();

        return response()->json([
            'success' => true,
            'message' => 'Clearance checklist deleted successfully',
        ], 200);
    }
}
