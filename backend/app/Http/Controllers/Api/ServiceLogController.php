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
            'status' => 'required|in:scheduled,in_progress,completed,cancelled',
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
            } elseif ($validated['status'] === 'cancelled') {
                if ($vehicle->status === 'in_service') {
                    $vehicleUpdates['status'] = 'available';
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
            'data' => $serviceLog->load(['vehicle.region', 'createdBy']),
        ], 201);
    }

    public function updateStatus($id, Request $request): JsonResponse
    {
        $validated = $request->validate([
            'status' => 'required|in:scheduled,in_progress,completed,cancelled',
            'cost' => 'nullable|numeric|min:0',
            'odometer_at_service' => 'nullable|integer|min:0',
            'next_service_date' => 'nullable|date',
            'next_service_odometer' => 'nullable|integer',
            'notes' => 'nullable|string',
        ]);

        $serviceLog = ServiceLog::with('vehicle')->findOrFail($id);
        $oldStatus = $serviceLog->status;
        $newStatus = $validated['status'];

        $updateData = ['status' => $newStatus];
        if (isset($validated['cost'])) {
            $updateData['cost'] = $validated['cost'];
        }
        if (isset($validated['odometer_at_service'])) {
            $updateData['odometer_at_service'] = $validated['odometer_at_service'];
        }
        if (isset($validated['next_service_date'])) {
            $updateData['next_service_date'] = $validated['next_service_date'];
        }
        if (isset($validated['next_service_odometer'])) {
            $updateData['next_service_odometer'] = $validated['next_service_odometer'];
        }
        if (isset($validated['notes'])) {
            $updateData['notes'] = $validated['notes'];
        }

        $serviceLog->update($updateData);

        $vehicle = $serviceLog->vehicle;
        if ($vehicle) {
            $vehicleUpdates = [];
            if ($newStatus === 'in_progress') {
                $vehicleUpdates['status'] = 'in_service';
            } elseif (in_array($newStatus, ['completed', 'cancelled'])) {
                if ($vehicle->status === 'in_service') {
                    $vehicleUpdates['status'] = 'available';
                }
                if ($newStatus === 'completed') {
                    $vehicleUpdates['last_service_date'] = $serviceLog->service_date;
                    if (!empty($serviceLog->next_service_date)) {
                        $vehicleUpdates['next_service_date'] = $serviceLog->next_service_date;
                    }
                    if (!empty($serviceLog->next_service_odometer)) {
                        $vehicleUpdates['next_service_odometer'] = $serviceLog->next_service_odometer;
                    }
                }
            }

            if (!empty($validated['odometer_at_service']) && $validated['odometer_at_service'] > $vehicle->current_odometer) {
                $vehicleUpdates['current_odometer'] = $validated['odometer_at_service'];
            }

            if (!empty($vehicleUpdates)) {
                $vehicle->update($vehicleUpdates);
            }
        }

        ActivityLogger::log(
            $request->user()->id,
            'update_service_status',
            'service',
            "Memperbarui status servis {$serviceLog->workshop_name} ({$vehicle->name}) dari {$oldStatus} menjadi {$newStatus}",
            [
                'service_log_id' => $serviceLog->id,
                'old_status' => $oldStatus,
                'new_status' => $newStatus,
            ]
        );

        $statusLabels = [
            'scheduled' => 'Terjadwal',
            'in_progress' => 'Sedang Dikerjakan',
            'completed' => 'Selesai',
            'cancelled' => 'Dibatalkan',
        ];

        return response()->json([
            'success' => true,
            'message' => "Status servis armada berhasil diperbarui menjadi {$statusLabels[$newStatus]}.",
            'data' => $serviceLog->fresh(['vehicle.region', 'createdBy']),
        ]);
    }
}
