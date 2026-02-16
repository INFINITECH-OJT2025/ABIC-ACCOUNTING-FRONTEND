<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Position;
use App\Services\ActivityLogService;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

class PositionController extends Controller
{
    protected $activityLogService;

    public function __construct(ActivityLogService $activityLogService)
    {
        $this->activityLogService = $activityLogService;
    }
    /**
     * Display a listing of all positions.
     */
    public function index()
    {
        $positions = Position::orderBy('is_custom', 'asc')->orderBy('name', 'asc')->get();

        return response()->json([
            'success' => true,
            'data' => $positions
        ]);
    }

    /**
     * Store a newly created position in database.
     */
    public function store(Request $request)
    {
        try {
            $validated = $request->validate([
                'name' => 'required|string|max:255|unique:positions',
            ]);

            $position = Position::create([
                'name' => $validated['name'],
                'is_custom' => true
            ]);

            // Log activity
            $this->activityLogService->logPositionAction('created', $position, null, $request);

            return response()->json([
                'success' => true,
                'message' => 'Position created successfully',
                'data' => $position
            ], 201);
        } catch (ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $e->errors()
            ], 422);
        }
    }

    /**
     * Display the specified position.
     */
    public function show(Position $position)
    {
        return response()->json([
            'success' => true,
            'data' => $position
        ]);
    }

    /**
     * Update the specified position in database.
     */
    public function update(Request $request, Position $position)
    {
        try {
            $validated = $request->validate([
                'name' => 'sometimes|string|max:255|unique:positions,name,' . $position->id,
            ]);

            $position->update($validated);

            // Log activity
            $this->activityLogService->logPositionAction('updated', $position, null, $request);

            return response()->json([
                'success' => true,
                'message' => 'Position updated successfully',
                'data' => $position
            ]);
        } catch (ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $e->errors()
            ], 422);
        }
    }

    /**
     * Remove the specified position from database.
     */
    public function destroy(Request $request, Position $position)
    {
        // Only allow deletion of custom positions
        if ($position->is_custom) {
            // Log activity before deletion
            $this->activityLogService->logPositionAction('deleted', $position, null, $request);

            $position->delete();

            return response()->json([
                'success' => true,
                'message' => 'Position deleted successfully'
            ]);
        }

        return response()->json([
            'success' => false,
            'message' => 'Cannot delete default positions'
        ], 403);
    }

    /**
     * Bulk create positions
     */
    public function bulkCreate(Request $request)
    {
        try {
            $validated = $request->validate([
                'positions' => 'required|array',
                'positions.*' => 'required|string|max:255'
            ]);

            $created = [];
            foreach ($validated['positions'] as $positionName) {
                $position = Position::firstOrCreate(
                    ['name' => $positionName],
                    ['is_custom' => true]
                );
                $created[] = $position;

                // Log activity for each created position
                if ($position->wasRecentlyCreated) {
                    $this->activityLogService->logPositionAction('created', $position, null, $request);
                }
            }

            return response()->json([
                'success' => true,
                'message' => 'Positions created successfully',
                'data' => $created
            ], 201);
        } catch (ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $e->errors()
            ], 422);
        }
    }
}
