<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Department;
use App\Models\DepartmentChecklistTemplate;
use App\Models\DepartmentChecklistTemplateTask;
use Illuminate\Http\Request;

class DepartmentChecklistTemplateController extends Controller
{
    /**
     * GET /api/department-checklist-templates?checklist_type=ONBOARDING
     * Returns all templates (optionally filtered by type) with their tasks.
     */
    public function index(Request $request)
    {
        try {
            $query = DepartmentChecklistTemplate::with(['department', 'tasks' => function ($q) {
                $q->where('is_active', true)->orderBy('sort_order');
            }]);

            if ($request->filled('checklist_type')) {
                $query->where('checklist_type', strtoupper($request->checklist_type));
            }

            $templates = $query->get();

            $data = $templates->map(fn($t) => $this->transform($t));

            return response()->json(['data' => $data]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error fetching templates: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * PUT /api/department-checklist-templates
     * Upserts a template for a department + checklist_type and replaces its tasks.
     *
     * Body:
     *   department_id  integer  required
     *   checklist_type string   required (ONBOARDING | CLEARANCE)
     *   tasks          array    required  [{task, sort_order, is_active}]
     */
    public function upsert(Request $request)
    {
        $validated = $request->validate([
            'department_id'  => 'required|integer|exists:departments,id',
            'checklist_type' => 'required|string|in:ONBOARDING,CLEARANCE',
            'tasks'          => 'required|array',
            'tasks.*.task'       => 'required|string|max:500',
            'tasks.*.sort_order' => 'nullable|integer',
            'tasks.*.is_active'  => 'nullable|boolean',
        ]);

        try {
            // Find or create the template record
            $template = DepartmentChecklistTemplate::firstOrCreate(
                [
                    'department_id'  => $validated['department_id'],
                    'checklist_type' => $validated['checklist_type'],
                ],
                ['updated_by' => null]
            );

            $template->touch(); // update updated_at on every save

            // Replace all tasks for this template
            $template->tasks()->delete();

            foreach ($validated['tasks'] as $index => $taskData) {
                DepartmentChecklistTemplateTask::create([
                    'template_id' => $template->id,
                    'task'        => $taskData['task'],
                    'sort_order'  => $taskData['sort_order'] ?? ($index + 1),
                    'is_active'   => $taskData['is_active'] ?? true,
                ]);
            }

            // Reload with fresh tasks
            $template->load(['department', 'tasks' => function ($q) {
                $q->where('is_active', true)->orderBy('sort_order');
            }]);

            return response()->json([
                'success' => true,
                'message' => 'Template saved successfully',
                'data'    => $this->transform($template),
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error saving template: ' . $e->getMessage(),
            ], 500);
        }
    }

    private function transform(DepartmentChecklistTemplate $template): array
    {
        return [
            'id'             => $template->id,
            'department_id'  => $template->department_id,
            'department_name'=> $template->department?->name ?? '',
            'checklist_type' => $template->checklist_type,
            'updated_at'     => $template->updated_at,
            'tasks'          => $template->tasks->map(fn($t) => [
                'id'         => $t->id,
                'task'       => $t->task,
                'sort_order' => $t->sort_order,
                'is_active'  => $t->is_active,
            ])->values()->all(),
        ];
    }
}
