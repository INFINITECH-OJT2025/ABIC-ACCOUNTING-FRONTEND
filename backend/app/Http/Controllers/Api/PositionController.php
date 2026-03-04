<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Hierarchy;
use Illuminate\Http\Request;

class PositionController extends Controller
{
    /**
     * Compatibility layer: return hierarchies as positions
     */
    public function index()
    {
        $positions = Hierarchy::with('department')->orderBy('is_custom', 'asc')->orderBy('name', 'asc')->get();

        return response()->json([
            'success' => true,
            'data' => $positions
        ]);
    }

    public function show($id)
    {
        $position = Hierarchy::with('department')->findOrFail($id);
        
        return response()->json([
            'success' => true,
            'data' => $position
        ]);
    }

    // Other methods remain as stubs or proxy to Hierarchy logic
    public function store(Request $request)
    {
        return app(HierarchyController::class)->store($request);
    }
}
