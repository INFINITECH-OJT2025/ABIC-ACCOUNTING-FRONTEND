<?php

use App\Http\Controllers\Api\EmployeeController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::get('/user', function (Request $request) {
    return $request->user();
})->middleware('auth:sanctum');

// Employee API Routes
Route::apiResource('employees', EmployeeController::class);

// Authentication routes
Route::post('/employees/login', [EmployeeController::class, 'login']);
Route::post('/employees/change-password', [EmployeeController::class, 'changePassword']);
Route::get('/employees-profile', [EmployeeController::class, 'getProfile']);

