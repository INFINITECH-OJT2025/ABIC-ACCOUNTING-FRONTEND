<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

use App\Models\Hierarchy;

class HierarchyController extends Controller
{
    public function index()
    {
        $hierarchies = Hierarchy::with(['position', 'department'])->get();
        return response()->json($hierarchies);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'position_id' => 'nullable|exists:positions,id',
            'position_name' => 'nullable|string|max:255',
            'department_id' => 'nullable|exists:departments,id',
            'parent_id' => 'nullable|exists:hierarchies,id',
            'child_ids' => 'nullable|array',
            'child_ids.*' => 'exists:hierarchies,id',
            'child_position_ids' => 'nullable|array',
            'child_position_ids.*' => 'exists:positions,id'
        ]);

        $positionId = $validated['position_id'] ?? null;

        // If position_name is provided, find or create the position
        if (!empty($validated['position_name'])) {
            $position = \App\Models\Position::firstOrCreate(
                ['name' => $validated['position_name']],
                [
                    'is_custom' => true,
                    'department_id' => $validated['department_id']
                ]
            );

            // Ensure department sync
            if ($position->department_id != $validated['department_id']) {
                $position->update(['department_id' => $validated['department_id']]);
            }

            $positionId = $position->id;
        }

        if (!$positionId) {
            return response()->json(['message' => 'The position_id or position_name field is required.'], 422);
        }

        $hierarchy = Hierarchy::create([
            'position_id' => $positionId,
            'department_id' => $validated['department_id'],
            'parent_id' => $validated['parent_id']
        ]);

        // Update existing hierarchy records to point to this new parent
        if (!empty($validated['child_ids'])) {
            Hierarchy::whereIn('id', $validated['child_ids'])
                ->update(['parent_id' => $hierarchy->id]);
        }

        // Create new hierarchy records for positions that weren't in hierarchy yet
        if (!empty($validated['child_position_ids'])) {
            foreach ($validated['child_position_ids'] as $posId) {
                Hierarchy::create([
                    'position_id' => $posId,
                    'department_id' => $hierarchy->department_id,
                    'parent_id' => $hierarchy->id
                ]);
            }
        }

        return response()->json($hierarchy->load(['position', 'department']), 201);
    }

    public function destroy($id)
    {
        $hierarchy = Hierarchy::findOrFail($id);
        $hierarchy->delete();
        return response()->json(null, 204);
    }
}
