<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\DepartmentChecklistTemplate;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class DepartmentChecklistTemplateController extends Controller
{
    public function index(Request $request)
    {
        $validated = $request->validate([
            'checklist_type' => 'required|string|in:ONBOARDING,CLEARANCE',
            'department_id' => 'nullable|integer|exists:departments,id',
        ], [
            'checklist_type.required' => 'Please specify which checklist to load (ONBOARDING or CLEARANCE).',
            'checklist_type.in' => 'Checklist type must be either ONBOARDING or CLEARANCE.',
            'department_id.integer' => 'Department selection is invalid.',
            'department_id.exists' => 'The selected department does not exist anymore.',
        ]);

        $query = DepartmentChecklistTemplate::query()
            ->with(['department:id,name', 'tasks'])
            ->where('checklist_type', $validated['checklist_type']);

        if (isset($validated['department_id'])) {
            $query->where('department_id', $validated['department_id']);
        }

        $rows = $query->orderBy('updated_at', 'desc')->get();

        $data = $rows->map(fn ($template) => $this->transform($template));

        return response()->json(['data' => $data]);
    }

    public function upsert(Request $request)
    {
        $validated = $request->validate([
            'department_id' => 'required|integer|exists:departments,id',
            'checklist_type' => 'required|string|in:ONBOARDING,CLEARANCE',
            'tasks' => 'required|array|min:1|max:200',
            'tasks.*.task' => 'required|string|min:2|max:500',
            'tasks.*.sort_order' => 'nullable|integer|min:1|max:10000',
            'tasks.*.is_active' => 'nullable|boolean',
        ], [
            'department_id.required' => 'Please choose a department before saving.',
            'department_id.exists' => 'The selected department is no longer available. Please refresh and try again.',
            'checklist_type.required' => 'Checklist type is required.',
            'checklist_type.in' => 'Checklist type must be either ONBOARDING or CLEARANCE.',
            'tasks.required' => 'Please add at least one checklist task before saving.',
            'tasks.array' => 'Checklist tasks must be sent as a list.',
            'tasks.min' => 'Please add at least one checklist task before saving.',
            'tasks.max' => 'You can save up to 200 tasks per checklist template.',
            'tasks.*.task.required' => 'Each task row must include a task description.',
            'tasks.*.task.min' => 'Each task must be at least 2 characters long.',
            'tasks.*.task.max' => 'Each task must be 500 characters or less.',
            'tasks.*.sort_order.integer' => 'Task order values must be whole numbers.',
            'tasks.*.sort_order.min' => 'Task order must start at 1.',
            'tasks.*.sort_order.max' => 'Task order is too large.',
        ]);

        $normalizedTasks = collect($validated['tasks'] ?? [])
            ->map(fn ($row) => mb_strtolower(trim((string) ($row['task'] ?? ''))))
            ->filter(fn ($task) => $task !== '');

        if ($normalizedTasks->duplicates()->isNotEmpty()) {
            return response()->json([
                'success' => false,
                'message' => 'Some tasks are duplicated. Please keep each task name unique.',
                'errors' => [
                    'tasks' => ['Some tasks are duplicated. Please keep each task name unique.'],
                ],
            ], 422);
        }

        $template = DB::transaction(function () use ($validated) {
            $template = DepartmentChecklistTemplate::query()->updateOrCreate(
                [
                    'department_id' => $validated['department_id'],
                    'checklist_type' => $validated['checklist_type'],
                ],
                [
                    'updated_by' => null,
                ]
            );

            $template->tasks()->delete();

            foreach ($validated['tasks'] as $index => $row) {
                $task = trim((string) ($row['task'] ?? ''));
                if ($task === '') {
                    continue;
                }

                $template->tasks()->create([
                    'task' => $task,
                    'sort_order' => isset($row['sort_order']) ? (int) $row['sort_order'] : ($index + 1),
                    'is_active' => array_key_exists('is_active', $row) ? (bool) $row['is_active'] : true,
                ]);
            }

            return $template->load(['department:id,name', 'tasks']);
        });

        return response()->json([
            'success' => true,
            'message' => 'Department checklist template updated successfully',
            'data' => $this->transform($template),
        ]);
    }

    private function transform(DepartmentChecklistTemplate $template): array
    {
        return [
            'id' => $template->id,
            'department_id' => $template->department_id,
            'department_name' => $template->department?->name,
            'checklist_type' => $template->checklist_type,
            'updated_at' => $template->updated_at,
            'created_at' => $template->created_at,
            'tasks' => $template->tasks->map(fn ($task) => [
                'id' => $task->id,
                'task' => $task->task,
                'sort_order' => $task->sort_order,
                'is_active' => (bool) $task->is_active,
            ])->values(),
        ];
    }
}
