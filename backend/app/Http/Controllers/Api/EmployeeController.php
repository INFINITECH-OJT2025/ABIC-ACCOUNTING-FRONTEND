<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Employee;
use App\Models\Resigned;
use App\Models\Termination;
use App\Services\ActivityLogService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;
use Illuminate\Support\Str;

class EmployeeController extends Controller
{
    protected $activityLogService;

    public function __construct(ActivityLogService $activityLogService)
    {
        $this->activityLogService = $activityLogService;
    }
    /**
     * Display a listing of all employees.
     */
    public function index()
    {
        return response()->json([
            'success' => true,
            'data' => Employee::all()
        ]);
    }

    /**
     * Check if email exists
     */
    public function checkEmail(Request $request)
    {
        $email = $request->query('email');

        if (!$email) {
            return response()->json([
                'success' => false,
                'message' => 'Email parameter is required'
            ], 400);
        }

        $exists = Employee::where('email', $email)->exists();

        return response()->json([
            'success' => true,
            'exists' => $exists
        ]);
    }

    /**
     * Check if name combination exists
     */
    public function checkName(Request $request)
    {
        $firstName = $request->query('first_name');
        $lastName = $request->query('last_name');

        if (!$firstName || !$lastName) {
            return response()->json([
                'success' => false,
                'message' => 'Both first_name and last_name are required'
            ], 400);
        }

        $exists = Employee::where('first_name', 'like', $firstName)
            ->where('last_name', 'like', $lastName)
            ->exists();

        return response()->json([
            'success' => true,
            'exists' => $exists
        ]);
    }

    /**
     * Store a newly created employee in database.
     */
    public function store(Request $request)
    {
        try {
            $validated = $request->validate([
                'first_name' => 'required|string|max:255',
                'last_name' => 'required|string|max:255',
                'email' => 'required|string|email|max:255|unique:employees',
            ]);

            $employee = Employee::create([
                'first_name' => $validated['first_name'],
                'last_name' => $validated['last_name'],
                'email' => $validated['email'],
                'status' => 'pending', // Default status
            ]);

            // Log activity
            $this->activityLogService->logEmployeeCreated($employee, null, $request);

            return response()->json([
                'success' => true,
                'message' => 'Employee created successfully.',
                'data' => $employee
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
     * Display the specified employee.
     */
    public function show(Employee $employee)
    {
        return response()->json([
            'success' => true,
            'data' => $employee
        ]);
    }

    /**
     * Update the specified employee in database.
     */
    public function update(Request $request, Employee $employee)
    {
        try {
            $validated = $request->validate([
                'first_name' => 'sometimes|nullable|string|max:255',
                'last_name' => 'sometimes|nullable|string|max:255',
                'email' => 'sometimes|nullable|string|email|max:255|unique:employees,email,' . $employee->id,
                'position' => 'sometimes|nullable|string|max:255',
                'date_hired' => 'sometimes|nullable|date',
                'middle_name' => 'sometimes|nullable|string|max:255',
                'suffix' => 'sometimes|nullable|string|max:255',
                'birthday' => 'sometimes|nullable|date',
                'birthplace' => 'sometimes|nullable|string|max:255',
                'civil_status' => 'sometimes|nullable|string|max:255',
                'gender' => 'sometimes|nullable|string|max:255',
                'sss_number' => 'sometimes|nullable|string|max:255',
                'philhealth_number' => 'sometimes|nullable|string|max:255',
                'pagibig_number' => 'sometimes|nullable|string|max:255',
                'tin_number' => 'sometimes|nullable|string|max:255',
                'mlast_name' => 'sometimes|nullable|string|max:255',
                'mfirst_name' => 'sometimes|nullable|string|max:255',
                'mmiddle_name' => 'sometimes|nullable|string|max:255',
                'msuffix' => 'sometimes|nullable|string|max:255',
                'flast_name' => 'sometimes|nullable|string|max:255',
                'ffirst_name' => 'sometimes|nullable|string|max:255',
                'fmiddle_name' => 'sometimes|nullable|string|max:255',
                'fsuffix' => 'sometimes|nullable|string|max:255',
                'mobile_number' => 'sometimes|nullable|string|max:255',
                'house_number' => 'sometimes|nullable|string|max:255',
                'street' => 'sometimes|nullable|string|max:255',
                'village' => 'sometimes|nullable|string|max:255',
                'subdivision' => 'sometimes|nullable|string|max:255',
                'barangay' => 'sometimes|nullable|string|max:255',
                'region' => 'sometimes|nullable|string|max:255',
                'province' => 'sometimes|nullable|string|max:255',
                'city_municipality' => 'sometimes|nullable|string|max:255',
                'zip_code' => 'sometimes|nullable|string|max:255',
                'perm_house_number' => 'sometimes|nullable|string|max:255',
                'perm_street' => 'sometimes|nullable|string|max:255',
                'perm_village' => 'sometimes|nullable|string|max:255',
                'perm_subdivision' => 'sometimes|nullable|string|max:255',
                'perm_barangay' => 'sometimes|nullable|string|max:255',
                'perm_city_municipality' => 'sometimes|nullable|string|max:255',
                'perm_province' => 'sometimes|nullable|string|max:255',
                'perm_region' => 'sometimes|nullable|string|max:255',
                'perm_zip_code' => 'sometimes|nullable|string|max:255',
                'email_address' => 'sometimes|nullable|string|max:255',
                'password' => 'sometimes|nullable|string|min:6',
                'status' => 'sometimes|in:pending,employed,terminated,resigned',
            ]);

            if (isset($validated['password'])) {
                $validated['password'] = Hash::make($validated['password']);
            }

            // Track changes for activity log
            $changes = array_diff_key($validated, array_flip(['password']));

            $employee->update($validated);

            // Log activity
            $this->activityLogService->logEmployeeUpdated($employee, $changes, null, $request);

            return response()->json([
                'success' => true,
                'message' => 'Employee updated successfully',
                'data' => $employee
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
     * Remove the specified employee from database.
     */
    public function destroy(Request $request, Employee $employee)
    {
        // Log activity before deletion
        $this->activityLogService->logEmployeeDeleted($employee, null, $request);

        $employee->delete();

        return response()->json([
            'success' => true,
            'message' => 'Employee deleted successfully'
        ]);
    }


    /**
     * Onboard employee with additional details
     */
    public function onboard(Request $request, $id)
    {
        try {
            $validated = $request->validate([
                'position' => 'required|string|max:255',
                'department' => 'required|string|max:255',
                'onboarding_date' => 'required|date',
                'email_assigned' => 'sometimes|nullable|string|email|max:255',
                'access_level' => 'sometimes|nullable|string|max:255',
                'equipment_issued' => 'sometimes|nullable|string',
                'training_completed' => 'sometimes|boolean',
                'onboarding_notes' => 'sometimes|nullable|string',
            ]);

            $employee = Employee::find($id);

            if (!$employee) {
                return response()->json([
                    'success' => false,
                    'message' => 'Employee not found'
                ], 404);
            }

            $employee->update($validated);

            // Log activity
            $this->activityLogService->logEmployeeOnboarded($employee, null, $request);

            return response()->json([
                'success' => true,
                'message' => 'Employee onboarded successfully',
                'data' => $employee
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
     * Terminate employee with reason
     */
    public function terminate(Request $request, $id)
    {
        try {
            $validated = $request->validate([
                'termination_date' => 'required|date',
                'reason' => 'required|string|min:10|max:1000',
                'notes' => 'sometimes|nullable|string|max:1000',
                'status' => 'sometimes|in:pending,completed,cancelled,resigned',
                'exit_type' => 'sometimes|in:terminate,resigned',
            ]);

            $employee = Employee::find($id);

            if (!$employee) {
                return response()->json([
                    'success' => false,
                    'message' => 'Employee not found'
                ], 404);
            }

            $exitType = $validated['exit_type'] ?? 'terminate';

            if ($exitType === 'resigned') {
                $resigned = Resigned::create([
                    'employee_id' => $employee->id,
                    'resignation_date' => $validated['termination_date'],
                    'reason' => $validated['reason'],
                    'notes' => $validated['notes'] ?? null,
                    'status' => 'completed',
                ]);

                // Keep employee as non-active using existing status semantics.
                $employee->update(['status' => 'terminated']);
                $this->activityLogService->logEmployeeResigned($employee, $resigned, null, $request);

                return response()->json([
                    'success' => true,
                    'message' => 'Employee resigned successfully',
                    'data' => $resigned
                ]);
            }

            // Create termination record
            $termination = Termination::create([
                'employee_id' => $employee->id,
                'termination_date' => $validated['termination_date'],
                'reason' => $validated['reason'],
                'notes' => $validated['notes'] ?? null,
                'status' => $validated['status'] ?? 'completed',
            ]);

            // Update employee status to terminated
            $employee->update(['status' => 'terminated']);

            // Log activity
            $this->activityLogService->logEmployeeTerminated($employee, $termination, null, $request);

            return response()->json([
                'success' => true,
                'message' => 'Employee terminated successfully',
                'data' => $termination
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
     * Get all terminations
     */
    public function getTerminations()
    {
        try {
            $terminations = Termination::with('employee')->get();

            return response()->json([
                'success' => true,
                'data' => $terminations
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch terminations',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get all resigned records
     */
    public function getResigned()
    {
        try {
            $resigned = Resigned::with('employee')->get();

            return response()->json([
                'success' => true,
                'data' => $resigned
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch resigned records',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Re-hire / Restore terminated employee
     */
    public function rehire(Request $request, $id)
    {
        try {
            $employee = Employee::find($id);

            if (!$employee) {
                return response()->json([
                    'success' => false,
                    'message' => 'Employee not found'
                ], 404);
            }

            if (!in_array($employee->status, ['terminated', 'resigned'], true)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Employee is not terminated or resigned'
                ], 400);
            }

            // Update employee status back to employed
            $employee->update(['status' => 'employed']);

            $currentId = $employee->id;
            $rehiredAt = $request->input('rehired_at') ? Carbon::parse($request->input('rehired_at')) : now();
            $rehireYear = $rehiredAt->format('y');
            $idParts = explode('-', $currentId);

            if (count($idParts) === 2) {
                $idYear = $idParts[0];
                $idSequence = $idParts[1];

                if ($idYear !== $rehireYear) {
                    $newId = "{$rehireYear}-{$idSequence}";

                    // Update the ID using raw DB to bypass Eloquent PK issues
                    DB::table('employees')->where('id', $currentId)->update(['id' => $newId]);

                    // Refresh the employee model with the new ID
                    $employee = Employee::find($newId);
                }
            }

            // Update the termination records for this employee to 'cancelled' and set rehired_at
            Termination::where('employee_id', $employee->id)
                ->where('status', 'completed')
                ->latest()
                ->first()
                    ?->update([
                    'status' => 'cancelled',
                    'rehired_at' => $rehiredAt
                ]);

            Resigned::where('employee_id', $employee->id)
                ->where('status', 'completed')
                ->latest()
                ->first()
                    ?->update([
                    'status' => 'cancelled',
                    'rehired_at' => $rehiredAt
                ]);

            // Log activity
            $this->activityLogService->logEmployeeRehired($employee, null, $request);

            return response()->json([
                'success' => true,
                'message' => 'Employee re-hired successfully',
                'data' => $employee
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to re-hire employee',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
