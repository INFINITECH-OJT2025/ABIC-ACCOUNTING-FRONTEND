<?php

use App\Http\Controllers\Api\EmployeeController;
use App\Http\Controllers\Api\PositionController;
use App\Http\Controllers\Api\DepartmentController;
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
Route::get('/terminations', [EmployeeController::class, 'getTerminations']);
