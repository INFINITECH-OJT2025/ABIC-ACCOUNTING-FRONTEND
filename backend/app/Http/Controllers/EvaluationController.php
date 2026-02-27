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
            'status' => 'nullable|string',
        ]);

        // Calculate overall status if not provided (Prefer "Regularized" or "Probee" as per user request)
        if (!isset($validated['status'])) {
            $isScore2Passed = isset($validated['score_2']) && $validated['score_2'] >= 31;

            if ($isScore2Passed) {
                $validated['status'] = 'Regular';
            } else {
                $validated['status'] = 'Probee';
            }
        }

        $evaluation = Evaluation::updateOrCreate(
            ['employee_id' => $validated['employee_id']],
            $validated
        );

        // Update employee regularization date only (Stop updating status)
        $employee = \App\Models\Employee::find($validated['employee_id']);
        if ($employee) {
            $hiredDate = \Carbon\Carbon::parse($employee->date_hired);

            // Standard regularization is 6 months from hire date
            $regularizationDate = $hiredDate->copy()->addMonths(6);

            $isScore1Passed = isset($validated['score_1']) && $validated['score_1'] >= 31;
            $isScore2Passed = isset($validated['score_2']) && $validated['score_2'] >= 31;

            // If neither passed, let's extend regularization by 3 months
            if (isset($validated['score_1']) && isset($validated['score_2'])) {
                if (!$isScore1Passed && !$isScore2Passed) {
                    $regularizationDate = $hiredDate->copy()->addMonths(9); // Extended
                }
            }

            $employee->regularization_date = $regularizationDate->format('Y-m-d');
            $employee->save();
        }

        return response()->json([
            'success' => true,
            'data' => $evaluation,
            'message' => 'Evaluation updated and employee milestones adjusted'
        ]);
    }
}
