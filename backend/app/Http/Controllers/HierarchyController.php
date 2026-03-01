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
            'position_id' => 'required|exists:positions,id',
            'department_id' => 'nullable|exists:departments,id',
            'parent_id' => 'nullable|exists:hierarchies,id',
            'role' => 'nullable|string'
        ]);

        $hierarchy = Hierarchy::create($validated);

        return response()->json($hierarchy->load(['position', 'department']), 201);
    }

    public function destroy($id)
    {
        $hierarchy = Hierarchy::findOrFail($id);
        $hierarchy->delete();
        return response()->json(null, 204);
    }
}
