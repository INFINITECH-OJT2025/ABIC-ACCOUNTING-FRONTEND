<?php

namespace App\Http\Controllers\Api;

use App\Models\OnboardingChecklist;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

class OnboardingChecklistController extends Controller
{
    public function generateChecklist(Request $request)
    {
        $validatedData = $request->validate([
            'employee_name' => 'required|string|max:255',
            'position' => 'nullable|string|max:255',
            'department' => 'nullable|string|max:255',
            'start_date' => 'required|date',
            'tasks' => 'required|json',
            'status' => 'required|string|max:255'
        ]);

        $onboardingChecklist = OnboardingChecklist::create($validatedData);

        return response()->json([
            'success' => true,
            'message' => 'Onboarding checklist created successfully',
            'data' => $onboardingChecklist
        ], 201);
    }

    public function index()
    {
        $checklists = OnboardingChecklist::all();
        return response()->json([
            'success' => true,
            'message' => 'Onboarding checklists retrieved successfully',
            'data' => $checklists
        ], 200);
    }

    public function getOnboardingChecklist($id)
    {
        $checklist = OnboardingChecklist::find($id);
        if (!$checklist) {
            return response()->json(['message' => 'Onboarding checklist not found'], 404);
        }
        return response()->json([
            'success' => true,
            'message' => 'Onboarding checklist retrieved successfully',
            'data' => $checklist
        ], 200);
    }

    public function updateOnboardingChecklist(Request $request, $id)
    {
        $checklist = OnboardingChecklist::find($id);
        if (!$checklist) {
            return response()->json(['message' => 'Onboarding checklist not found'], 404);
        }

        $validatedData = $request->validate([
            'employee_name' => 'sometimes|required|string|max:255',
            'position' => 'sometimes|nullable|string|max:255',
            'department' => 'sometimes|nullable|string|max:255',
            'start_date' => 'sometimes|required|date',
            'tasks' => 'sometimes|required|json',
            'status' => 'sometimes|required|string|max:255'
        ]);

        $checklist->update($validatedData);

        return response()->json([
            'success' => true,
            'message' => 'Onboarding checklist updated successfully',
            'data' => $checklist
        ], 200);
    }

}
