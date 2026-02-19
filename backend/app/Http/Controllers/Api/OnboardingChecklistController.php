<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

class OnboardingChecklistController extends Controller
{
    public function store(Request $request)
    {
        $validated = $request->validate([
            'employee_name' => 'required|string|max:255',
            'position' => 'required|string|max:255',
            'department' => 'required|string|max:255',
            'start_date' => 'required|date',
            'tasks' => 'required|array',
            'status' => 'required|string|max:255',
        ]);

        try {
            $checklist = \App\Models\OnboardingChecklist::create($validated);
            return response()->json([
                'success' => true,
                'message' => 'Onboarding checklist saved successfully',
                'data' => $checklist
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error saving checklist: ' . $e->getMessage()
            ], 500);
        }
    }
}
