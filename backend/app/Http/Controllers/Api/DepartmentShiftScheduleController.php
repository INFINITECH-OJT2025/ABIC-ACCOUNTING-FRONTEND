<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\DepartmentShiftSchedule;
use Illuminate\Http\Request;

class DepartmentShiftScheduleController extends Controller
{
    /**
     * Return all shift schedules, optionally filtered by department name.
     *
     * GET /api/department-shift-schedules
     * GET /api/department-shift-schedules?department=Accounting
     */
    public function index(Request $request)
    {
        $query = DepartmentShiftSchedule::query();

        if ($request->filled('department')) {
            $query->where('department', $request->input('department'));
        }

        return response()->json([
            'success' => true,
            'data'    => $query->orderBy('department')->get(),
        ]);
    }
}
