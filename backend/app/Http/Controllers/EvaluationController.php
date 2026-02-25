<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\Evaluation;
use Illuminate\Http\Request;

class EvaluationController extends Controller
{
    public function index()
    {
        $evaluations = Evaluation::all();
        return response()->json([
            'success' => true,
            'data' => $evaluations
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'employee_id' => 'required|string',
            'score_1' => 'nullable|integer',
            'remarks_1' => 'nullable|string',
            'score_2' => 'nullable|integer',
            'remarks_2' => 'nullable|string',
        ]);

        $evaluation = Evaluation::updateOrCreate(
            ['employee_id' => $validated['employee_id']],
            $validated
        );

        return response()->json([
            'success' => true,
            'data' => $evaluation,
            'message' => 'Evaluation updated successfully'
        ]);
    }
}
