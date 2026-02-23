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
            'tasks' => 'required|array',
            'tasks.*.task' => 'required|string',
            'tasks.*.sort_order' => 'nullable|integer|min:0',
            'tasks.*.is_active' => 'nullable|boolean',
        ]);

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
