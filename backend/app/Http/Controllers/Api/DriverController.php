<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Driver;
use App\Services\ActivityLogger;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DriverController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Driver::with('region')->latest();

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
                  ->orWhere('phone', 'like', "%{$search}%")
                  ->orWhere('license_number', 'like', "%{$search}%");
            });
        }

        return response()->json([
            'success' => true,
            'data' => $query->get(),
        ]);
    }

    public function available(Request $request): JsonResponse
    {
        $query = Driver::with('region')->where('status', 'available');

        if ($request->filled('region_id')) {
            $query->where('region_id', $request->region_id);
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
            'phone' => 'required|string|max:50',
            'license_number' => 'nullable|string|max:100',
            'region_id' => 'required|exists:regions,id',
            'status' => 'nullable|in:available,on_duty,off',
        ]);

        $driver = Driver::create($validated);

        ActivityLogger::log(
            $request->user()->id,
            'create_driver',
            'drivers',
            "Menambahkan driver baru: {$driver->name}",
            $validated
        );

        return response()->json([
            'success' => true,
            'message' => 'Driver berhasil ditambahkan.',
            'data' => $driver->load('region'),
        ], 201);
    }

    public function update(Request $request, $id): JsonResponse
    {
        $driver = Driver::findOrFail($id);

        $validated = $request->validate([
            'name' => 'sometimes|required|string|max:255',
            'phone' => 'sometimes|required|string|max:50',
            'license_number' => 'nullable|string|max:100',
            'region_id' => 'sometimes|required|exists:regions,id',
            'status' => 'sometimes|required|in:available,on_duty,off',
        ]);

        $driver->update($validated);

        ActivityLogger::log(
            $request->user()->id,
            'update_driver',
            'drivers',
            "Memperbarui data driver {$driver->name}",
            $validated
        );

        return response()->json([
            'success' => true,
            'message' => 'Data driver berhasil diperbarui.',
            'data' => $driver->load('region'),
        ]);
    }

    public function destroy(Request $request, $id): JsonResponse
    {
        $driver = Driver::findOrFail($id);
        $name = $driver->name;

        $driver->delete();

        ActivityLogger::log(
            $request->user()->id,
            'delete_driver',
            'drivers',
            "Menghapus data driver {$name}"
        );

        return response()->json([
            'success' => true,
            'message' => 'Driver berhasil dihapus.',
        ]);
    }
}
