<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Vehicle;
use App\Services\ActivityLogger;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class VehicleController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Vehicle::with(['region', 'rentalCompany'])->latest();

        if ($request->filled('type')) {
            $query->where('type', $request->type);
        }

        if ($request->filled('ownership_type')) {
            $query->where('ownership_type', $request->ownership_type);
        }

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        if ($request->filled('region_id')) {
            $query->where('region_id', $request->region_id);
        }

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('license_plate', 'like', "%{$search}%");
            });
        }

        $vehicles = $query->get();

        return response()->json([
            'success' => true,
            'data' => $vehicles,
        ]);
    }

    public function available(Request $request): JsonResponse
    {
        $query = Vehicle::with(['region', 'rentalCompany'])->where('status', 'available');

        if ($request->filled('region_id')) {
            $query->where('region_id', $request->region_id);
        }

        if ($request->filled('type')) {
            $query->where('type', $request->type);
        }

        return response()->json([
            'success' => true,
            'data' => $query->get(),
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'license_plate' => 'required|string|max:50|unique:vehicles,license_plate',
            'type' => 'required|in:passenger,cargo',
            'ownership_type' => 'required|in:owned,rented',
            'rental_company_id' => 'nullable|required_if:ownership_type,rented|exists:rental_companies,id',
            'region_id' => 'required|exists:regions,id',
            'fuel_type' => 'required|string|max:100',
            'current_odometer' => 'nullable|integer|min:0',
        ]);

        $vehicle = Vehicle::create($validated);

        ActivityLogger::log(
            $request->user()->id,
            'create_vehicle',
            'vehicles',
            "Menambahkan armada baru: {$vehicle->name} ({$vehicle->license_plate})",
            $validated
        );

        return response()->json([
            'success' => true,
            'message' => 'Kendaraan berhasil ditambahkan.',
            'data' => $vehicle->load(['region', 'rentalCompany']),
        ], 201);
    }

    public function show($id): JsonResponse
    {
        $vehicle = Vehicle::with([
            'region',
            'rentalCompany',
            'bookings' => fn($q) => $q->with(['originRegion', 'destinationRegion', 'driver', 'createdBy'])->latest(),
            'fuelLogs' => fn($q) => $q->with(['booking.driver', 'createdBy'])->latest('log_date'),
            'serviceLogs' => fn($q) => $q->with('createdBy')->latest('service_date'),
        ])->findOrFail($id);

        $stats = [
            'total_trips' => $vehicle->bookings->count(),
            'completed_trips' => $vehicle->bookings->where('status', 'completed')->count(),
            'active_trips' => $vehicle->bookings->where('status', 'in_use')->count(),
            'total_fuel_liters' => (float) $vehicle->fuelLogs->sum('liters'),
            'total_fuel_cost' => (float) $vehicle->fuelLogs->sum('total_cost'),
            'total_service_cost' => (float) $vehicle->serviceLogs->where('status', 'completed')->sum('cost'),
            'completed_services' => $vehicle->serviceLogs->where('status', 'completed')->count(),
            'active_services' => $vehicle->serviceLogs->where('status', 'in_progress')->count(),
            'scheduled_services' => $vehicle->serviceLogs->where('status', 'scheduled')->count(),
        ];

        return response()->json([
            'success' => true,
            'data' => array_merge($vehicle->toArray(), [
                'stats' => $stats,
            ]),
        ]);
    }

    public function update(Request $request, $id): JsonResponse
    {
        $vehicle = Vehicle::findOrFail($id);

        $validated = $request->validate([
            'name' => 'sometimes|required|string|max:255',
            'license_plate' => 'sometimes|required|string|max:50|unique:vehicles,license_plate,' . $vehicle->id,
            'type' => 'sometimes|required|in:passenger,cargo',
            'ownership_type' => 'sometimes|required|in:owned,rented',
            'rental_company_id' => 'nullable|exists:rental_companies,id',
            'region_id' => 'sometimes|required|exists:regions,id',
            'status' => 'sometimes|required|in:available,in_use,in_service',
            'fuel_type' => 'sometimes|required|string|max:100',
            'current_odometer' => 'nullable|integer|min:0',
        ]);

        $vehicle->update($validated);

        ActivityLogger::log(
            $request->user()->id,
            'update_vehicle',
            'vehicles',
            "Memperbarui data kendaraan {$vehicle->name} ({$vehicle->license_plate})",
            $validated
        );

        return response()->json([
            'success' => true,
            'message' => 'Data kendaraan berhasil diperbarui.',
            'data' => $vehicle->load(['region', 'rentalCompany']),
        ]);
    }

    public function destroy(Request $request, $id): JsonResponse
    {
        $vehicle = Vehicle::findOrFail($id);
        $name = $vehicle->name;
        $plate = $vehicle->license_plate;

        $vehicle->delete();

        ActivityLogger::log(
            $request->user()->id,
            'delete_vehicle',
            'vehicles',
            "Menghapus data kendaraan {$name} ({$plate})"
        );

        return response()->json([
            'success' => true,
            'message' => 'Kendaraan berhasil dihapus.',
        ]);
    }
}
