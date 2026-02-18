<?php

use App\Http\Controllers\Api\EmployeeController;
use App\Http\Controllers\Api\EmployeeAdditionalFieldController;
use App\Http\Controllers\Api\PositionController;
use App\Http\Controllers\Api\DepartmentController;
use App\Http\Controllers\Api\ActivityLogController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::get('/user', function (Request $request) {
    return $request->user();
})->middleware('auth:sanctum');

// Employee API Routes
Route::apiResource('employees', EmployeeController::class);

// Positions API Routes
Route::apiResource('positions', PositionController::class);
Route::post('/positions/bulk', [PositionController::class, 'bulkCreate']);

// Departments API Routes
Route::apiResource('departments', DepartmentController::class);
Route::post('/departments/bulk', [DepartmentController::class, 'bulkCreate']);

// Authentication routes
Route::post('/employees/login', [EmployeeController::class, 'login']);
Route::post('/employees/change-password', [EmployeeController::class, 'changePassword']);
Route::get('/employees-profile', [EmployeeController::class, 'getProfile']);

// Onboarding routes
Route::post('/employees/{id}/onboard', [EmployeeController::class, 'onboard']);

// Termination routes
Route::post('/employees/{id}/terminate', [EmployeeController::class, 'terminate']);
Route::post('/employees/{id}/rehire', [EmployeeController::class, 'rehire']);
Route::get('/terminations', [EmployeeController::class, 'getTerminations']);

// Additional Fields API Routes
Route::get('/employee-additional-fields', [EmployeeAdditionalFieldController::class, 'index']);
Route::post('/employee-additional-fields', [EmployeeAdditionalFieldController::class, 'store']);
Route::delete('/employee-additional-fields/{id}', [EmployeeAdditionalFieldController::class, 'destroy']);
Route::get('/employees/{id}/additional-values', [EmployeeAdditionalFieldController::class, 'getEmployeeValues']);
Route::post('/employees/{id}/additional-values', [EmployeeAdditionalFieldController::class, 'saveEmployeeValues']);

// Activity Log API Routes
Route::get('/activity-logs', [ActivityLogController::class, 'index']);
Route::get('/activity-logs/stats', [ActivityLogController::class, 'stats']);
Route::get('/activity-logs/{id}', [ActivityLogController::class, 'show']);
