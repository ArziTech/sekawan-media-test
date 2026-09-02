<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\FuelLog;
use App\Models\Vehicle;
use App\Services\ActivityLogger;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class FuelLogController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = FuelLog::with(['vehicle.region', 'booking', 'createdBy'])->latest('log_date');

        if ($request->filled('vehicle_id')) {
            $query->where('vehicle_id', $request->vehicle_id);
        }

        if ($request->filled('start_date') && $request->filled('end_date')) {
            $query->whereDate('log_date', '>=', $request->start_date)
                  ->whereDate('log_date', '<=', $request->end_date);
        }

        $logs = $query->paginate(20);

        return response()->json([
            'success' => true,
            'data' => $logs,
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'vehicle_id' => 'required|exists:vehicles,id',
            'booking_id' => 'nullable|exists:bookings,id',
            'log_date' => 'required|date',
            'liters' => 'required|numeric|min:0.1',
            'cost_per_liter' => 'required|numeric|min:100',
            'odometer_reading' => 'required|integer|min:0',
            'fuel_type' => 'required|string|max:100',
            'receipt_no' => 'nullable|string|max:100',
            'notes' => 'nullable|string',
        ]);

        $totalCost = $validated['liters'] * $validated['cost_per_liter'];

        $fuelLog = FuelLog::create([
            'vehicle_id' => $validated['vehicle_id'],
            'booking_id' => $validated['booking_id'] ?? null,
            'log_date' => $validated['log_date'],
            'liters' => $validated['liters'],
            'cost_per_liter' => $validated['cost_per_liter'],
            'total_cost' => $totalCost,
            'odometer_reading' => $validated['odometer_reading'],
            'fuel_type' => $validated['fuel_type'],
            'receipt_no' => $validated['receipt_no'] ?? null,
            'notes' => $validated['notes'] ?? null,
            'created_by_user_id' => $request->user()->id,
        ]);

        // Update vehicle odometer if higher
        $vehicle = Vehicle::find($validated['vehicle_id']);
        if ($vehicle && $validated['odometer_reading'] > $vehicle->current_odometer) {
            $vehicle->update(['current_odometer' => $validated['odometer_reading']]);
        }

        ActivityLogger::log(
            $request->user()->id,
            'add_fuel',
            'fuel',
            "Mencatat pengisian BBM {$validated['liters']} L ({$validated['fuel_type']}) untuk {$vehicle->name} senilai Rp " . number_format($totalCost, 0, ',', '.'),
            $validated
        );

        return response()->json([
            'success' => true,
            'message' => 'Catatan konsumsi BBM berhasil disimpan.',
            'data' => $fuelLog->load(['vehicle', 'booking']),
        ], 201);
    }
}
