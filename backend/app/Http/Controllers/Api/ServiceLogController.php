<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ServiceLog;
use App\Models\Vehicle;
use App\Services\ActivityLogger;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ServiceLogController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = ServiceLog::with(['vehicle.region', 'createdBy'])->latest('service_date');

        if ($request->filled('vehicle_id')) {
            $query->where('vehicle_id', $request->vehicle_id);
        }

        if ($request->filled('status')) {
            $query->where('status', $request->status);
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
            'service_date' => 'required|date',
            'service_type' => 'required|in:routine,repair,overhaul',
            'cost' => 'nullable|numeric|min:0',
            'workshop_name' => 'required|string|max:255',
            'odometer_at_service' => 'required|integer|min:0',
            'next_service_date' => 'nullable|date|after:service_date',
            'next_service_odometer' => 'nullable|integer|gte:odometer_at_service',
            'status' => 'required|in:scheduled,in_progress,completed',
            'notes' => 'nullable|string',
        ]);

        $serviceLog = ServiceLog::create([
            'vehicle_id' => $validated['vehicle_id'],
            'service_date' => $validated['service_date'],
            'service_type' => $validated['service_type'],
            'cost' => $validated['cost'] ?? 0,
            'workshop_name' => $validated['workshop_name'],
            'odometer_at_service' => $validated['odometer_at_service'],
            'next_service_date' => $validated['next_service_date'] ?? null,
            'next_service_odometer' => $validated['next_service_odometer'] ?? null,
            'status' => $validated['status'],
            'notes' => $validated['notes'] ?? null,
            'created_by_user_id' => $request->user()->id,
        ]);

        $vehicle = Vehicle::find($validated['vehicle_id']);
        if ($vehicle) {
            $vehicleUpdates = [];
            if ($validated['status'] === 'in_progress') {
                $vehicleUpdates['status'] = 'in_service';
            } elseif ($validated['status'] === 'completed') {
                $vehicleUpdates['status'] = 'available';
                $vehicleUpdates['last_service_date'] = $validated['service_date'];
                if (!empty($validated['next_service_date'])) {
                    $vehicleUpdates['next_service_date'] = $validated['next_service_date'];
                }
                if (!empty($validated['next_service_odometer'])) {
                    $vehicleUpdates['next_service_odometer'] = $validated['next_service_odometer'];
                }
            }
            if ($validated['odometer_at_service'] > $vehicle->current_odometer) {
                $vehicleUpdates['current_odometer'] = $validated['odometer_at_service'];
            }
            if (!empty($vehicleUpdates)) {
                $vehicle->update($vehicleUpdates);
            }
        }

        ActivityLogger::log(
            $request->user()->id,
            'add_service',
            'service',
            "Mencatat jadwal/riwayat servis {$validated['service_type']} ({$validated['status']}) untuk {$vehicle->name}",
            $validated
        );

        return response()->json([
            'success' => true,
            'message' => 'Catatan servis kendaraan berhasil disimpan.',
            'data' => $serviceLog->load('vehicle'),
        ], 201);
    }
}
