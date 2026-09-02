<?php

use App\Http\Controllers\Api\ActivityLogController;
use App\Http\Controllers\Api\ApprovalController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\BookingController;
use App\Http\Controllers\Api\DashboardController;
use App\Http\Controllers\Api\DriverController;
use App\Http\Controllers\Api\FuelLogController;
use App\Http\Controllers\Api\RegionController;
use App\Http\Controllers\Api\ReportController;
use App\Http\Controllers\Api\ServiceLogController;
use App\Http\Controllers\Api\VehicleController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
*/

// Public Authentication & Demo Endpoints
Route::prefix('auth')->group(function () {
    Route::post('/login', [AuthController::class, 'login']);
    Route::get('/demo-users', [AuthController::class, 'demoUsers']);
});

// Excel Export (Accessible via direct download link or token)
Route::get('/reports/export/excel', [ReportController::class, 'exportExcel']);

// Protected API Routes
Route::middleware('auth:sanctum')->group(function () {
    // User Profile & Logout
    Route::prefix('auth')->group(function () {
        Route::get('/me', [AuthController::class, 'me']);
        Route::post('/logout', [AuthController::class, 'logout']);
    });

    // Dashboard Analytics
    Route::prefix('dashboard')->group(function () {
        Route::get('/stats', [DashboardController::class, 'stats']);
        Route::get('/charts', [DashboardController::class, 'charts']);
        Route::get('/recent', [DashboardController::class, 'recent']);
    });

    // Master Regions & Rental Companies
    Route::get('/regions', [RegionController::class, 'index']);

    // Bookings & Workflow
    Route::get('/bookings', [BookingController::class, 'index']);
    Route::post('/bookings', [BookingController::class, 'store']);
    Route::get('/bookings/{id}', [BookingController::class, 'show']);
    Route::post('/bookings/{id}/start-trip', [BookingController::class, 'startTrip']);
    Route::post('/bookings/{id}/complete-trip', [BookingController::class, 'completeTrip']);
    Route::post('/bookings/{id}/cancel', [BookingController::class, 'cancel']);

    // Multi-Level Approvals Portal
    Route::prefix('approvals')->group(function () {
        Route::get('/pending', [ApprovalController::class, 'pending']);
        Route::get('/history', [ApprovalController::class, 'history']);
        Route::post('/{id}/action', [ApprovalController::class, 'action']);
    });

    // Master Vehicles
    Route::get('/vehicles/available', [VehicleController::class, 'available']);
    Route::apiResource('/vehicles', VehicleController::class);

    // Master Drivers
    Route::get('/drivers/available', [DriverController::class, 'available']);
    Route::apiResource('/drivers', DriverController::class);

    // Fuel Consumption Logs
    Route::get('/fuel-logs', [FuelLogController::class, 'index']);
    Route::post('/fuel-logs', [FuelLogController::class, 'store']);

    // Maintenance & Service Schedules
    Route::get('/service-logs', [ServiceLogController::class, 'index']);
    Route::post('/service-logs', [ServiceLogController::class, 'store']);

    // Periodic Reports
    Route::get('/reports/bookings', [ReportController::class, 'bookings']);

    // Audit Trail / Activity Logs
    Route::get('/activity-logs', [ActivityLogController::class, 'index']);
});
