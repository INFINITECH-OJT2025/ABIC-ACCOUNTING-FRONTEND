<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Employee;
use App\Models\Termination;
use App\Mail\EmployeeWelcome;
use App\Services\ActivityLogService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Illuminate\Validation\ValidationException;
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

            // Generate a random password
            $password = Str::random(12);
            $hashedPassword = Hash::make($password);

            $employee = Employee::create([
                'first_name' => $validated['first_name'],
                'last_name' => $validated['last_name'],
                'email' => $validated['email'],
                'password' => $hashedPassword,
                'status' => 'pending', // Default status
            ]);

            // Send welcome email with password
            try {
                Mail::to($employee->email)->send(new EmployeeWelcome($employee, $password));
            } catch (\Exception $e) {
                // Log email error but don't fail the creation
                \Log::error('Failed to send welcome email: ' . $e->getMessage());
            }

            // Log activity
            $this->activityLogService->logEmployeeCreated($employee, null, $request);

            return response()->json([
                'success' => true,
                'message' => 'Employee created successfully. Welcome email sent to ' . $employee->email,
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
                'email_address' => 'sometimes|nullable|string|max:255',
                'password' => 'sometimes|nullable|string|min:6',
                'status' => 'sometimes|in:pending,approved,terminated',
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
     * Employee login
     */
    public function login(Request $request)
    {
        try {
            $validated = $request->validate([
                'email' => 'required|string|email',
                'password' => 'required|string',
            ]);

            $employee = Employee::where('email', $validated['email'])->first();

            if (!$employee || !Hash::check($validated['password'], $employee->password)) {
                // Log failed login attempt
                if ($employee) {
                    $this->activityLogService->logLogin($employee, false, $request);
                }

                return response()->json([
                    'success' => false,
                    'message' => 'Invalid email or password'
                ], 401);
            }

            // Log successful login
            $this->activityLogService->logLogin($employee, true, $request);

            // Generate a token (simple session token)
            $token = Str::random(80);

            return response()->json([
                'success' => true,
                'message' => 'Login successful',
                'data' => [
                    'employee' => $employee,
                    'token' => $token
                ]
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
     * Change password
     */
    public function changePassword(Request $request)
    {
        try {
            $validated = $request->validate([
                'email' => 'required|string|email',
                'old_password' => 'required|string',
                'new_password' => 'required|string|min:6',
                'new_password_confirmation' => 'required|string|same:new_password',
            ]);

            $employee = Employee::where('email', $validated['email'])->first();

            if (!$employee) {
                return response()->json([
                    'success' => false,
                    'message' => 'Employee not found'
                ], 404);
            }

            if (!Hash::check($validated['old_password'], $employee->password)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Current password is incorrect'
                ], 401);
            }

            $employee->update([
                'password' => Hash::make($validated['new_password'])
            ]);

            // Log activity
            $this->activityLogService->logPasswordChange($employee, null, $request);

            return response()->json([
                'success' => true,
                'message' => 'Password changed successfully',
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
     * Get employee profile
     */
    public function getProfile(Request $request)
    {
        try {
            $validated = $request->validate([
                'email' => 'required|string|email',
            ]);

            $employee = Employee::where('email', $validated['email'])->first();

            if (!$employee) {
                return response()->json([
                    'success' => false,
                    'message' => 'Employee not found'
                ], 404);
            }

            return response()->json([
                'success' => true,
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
                'status' => 'sometimes|in:pending,completed,cancelled',
            ]);

            $employee = Employee::find($id);

            if (!$employee) {
                return response()->json([
                    'success' => false,
                    'message' => 'Employee not found'
                ], 404);
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
}
