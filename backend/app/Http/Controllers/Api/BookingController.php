<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Booking;
use App\Models\BookingApproval;
use App\Models\Driver;
use App\Models\FuelLog;
use App\Models\User;
use App\Models\Vehicle;
use App\Services\ActivityLogger;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class BookingController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();

        $query = Booking::with([
            'originRegion',
            'destinationRegion',
            'vehicle.rentalCompany',
            'driver',
            'createdBy',
            'approvals.approver',
            'fuelLogs'
        ])->latest();

        // If user is Approver, strictly restrict to bookings within their assigned branch / region
        if (!$user->isAdmin() && $user->region_id) {
            $query->where(function ($q) use ($user) {
                $q->where('region_id', $user->region_id)
                  ->orWhere('destination_region_id', $user->region_id);
            });
        }

        // Filters
        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        if ($request->filled('region_id')) {
            $query->where(function ($q) use ($request) {
                $q->where('region_id', $request->region_id)
                  ->orWhere('destination_region_id', $request->region_id);
            });
        }

        if ($request->filled('vehicle_type')) {
            $query->whereHas('vehicle', function ($q) use ($request) {
                $q->where('type', $request->vehicle_type);
            });
        }

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('booking_code', 'like', "%{$search}%")
                  ->orWhere('requester_name', 'like', "%{$search}%")
                  ->orWhere('requester_department', 'like', "%{$search}%")
                  ->orWhere('purpose', 'like', "%{$search}%")
                  ->orWhereHas('vehicle', function ($v) use ($search) {
                      $v->where('name', 'like', "%{$search}%")
                        ->orWhere('license_plate', 'like', "%{$search}%");
                  })
                  ->orWhereHas('driver', function ($d) use ($search) {
                      $d->where('name', 'like', "%{$search}%");
                  });
            });
        }

        if ($request->filled('start_date') && $request->filled('end_date')) {
            $query->whereDate('start_date', '>=', $request->start_date)
                  ->whereDate('start_date', '<=', $request->end_date);
        }

        $perPage = $request->input('per_page', 15);
        $bookings = $query->paginate($perPage);

        return response()->json([
            'success' => true,
            'data' => $bookings,
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'requester_name' => 'required|string|max:255',
            'requester_department' => 'required|string|max:255',
            'region_id' => 'required|exists:regions,id',
            'destination_region_id' => 'required|exists:regions,id',
            'vehicle_id' => 'required|exists:vehicles,id',
            'driver_id' => 'required|exists:drivers,id',
            'start_date' => 'required|date|after_or_equal:today',
            'end_date' => 'required|date|after:start_date',
            'purpose' => 'required|string',
            'approver_level_1_id' => 'required|exists:users,id',
            'approver_level_2_id' => 'required|exists:users,id',
        ]);

        // Check vehicle availability
        $vehicle = Vehicle::findOrFail($validated['vehicle_id']);
        if ($vehicle->status === 'in_service') {
            throw ValidationException::withMessages([
                'vehicle_id' => ['Kendaraan yang dipilih sedang dalam perbaikan / servis.'],
            ]);
        }

        // Check driver availability
        $driver = Driver::findOrFail($validated['driver_id']);
        if ($driver->status === 'off') {
            throw ValidationException::withMessages([
                'driver_id' => ['Supir yang dipilih sedang tidak bertugas (off).'],
            ]);
        }

        // Ensure approver 1 and approver 2 are different
        if ($validated['approver_level_1_id'] === $validated['approver_level_2_id']) {
            throw ValidationException::withMessages([
                'approver_level_2_id' => ['Penyetujui Level 1 dan Level 2 tidak boleh orang yang sama.'],
            ]);
        }

        $booking = DB::transaction(function () use ($validated, $request, $vehicle, $driver) {
            // Generate unique Booking Code: BKG-YYYYMM-XXXX
            $prefix = 'BKG-' . Carbon::now()->format('Ym') . '-';
            $count = Booking::where('booking_code', 'like', $prefix . '%')->count() + 1;
            $code = $prefix . str_pad($count, 4, '0', STR_PAD_LEFT);

            $newBooking = Booking::create([
                'booking_code' => $code,
                'requester_name' => $validated['requester_name'],
                'requester_department' => $validated['requester_department'],
                'region_id' => $validated['region_id'],
                'destination_region_id' => $validated['destination_region_id'],
                'vehicle_id' => $validated['vehicle_id'],
                'driver_id' => $validated['driver_id'],
                'start_date' => $validated['start_date'],
                'end_date' => $validated['end_date'],
                'purpose' => $validated['purpose'],
                'status' => 'pending_level_1',
                'created_by_user_id' => $request->user()->id,
            ]);

            // Create Approval Level 1 record
            BookingApproval::create([
                'booking_id' => $newBooking->id,
                'approval_level' => 1,
                'approver_user_id' => $validated['approver_level_1_id'],
                'status' => 'pending',
            ]);

            // Create Approval Level 2 record
            BookingApproval::create([
                'booking_id' => $newBooking->id,
                'approval_level' => 2,
                'approver_user_id' => $validated['approver_level_2_id'],
                'status' => 'pending',
            ]);

            ActivityLogger::log(
                $request->user()->id,
                'create_booking',
                'bookings',
                "Membuat pemesanan baru {$newBooking->booking_code} untuk {$newBooking->requester_name} ({$vehicle->name})",
                [
                    'booking_id' => $newBooking->id,
                    'booking_code' => $newBooking->booking_code,
                    'vehicle' => $vehicle->name,
                    'driver' => $driver->name,
                    'approver_1' => User::find($validated['approver_level_1_id'])?->name,
                    'approver_2' => User::find($validated['approver_level_2_id'])?->name,
                ]
            );

            return $newBooking;
        });

        return response()->json([
            'success' => true,
            'message' => 'Pemesanan kendaraan berhasil dibuat dan menunggu persetujuan Level 1.',
            'data' => $booking->load(['originRegion', 'destinationRegion', 'vehicle', 'driver', 'approvals.approver']),
        ], 201);
    }

    public function show($id, Request $request): JsonResponse
    {
        $user = $request->user();

        $booking = Booking::with([
            'originRegion',
            'destinationRegion',
            'vehicle.rentalCompany',
            'driver',
            'createdBy',
            'approvals.approver',
            'fuelLogs'
        ])->findOrFail($id);

        if (!$user->isAdmin() && $user->region_id) {
            $isAssignedApprover = $booking->approvals->contains('approver_user_id', $user->id);
            $isRegional = $booking->region_id === $user->region_id || $booking->destination_region_id === $user->region_id;

            if (!$isAssignedApprover && !$isRegional) {
                return response()->json([
                    'success' => false,
                    'message' => 'Anda tidak memiliki hak akses untuk melihat rincian pemesanan di luar wilayah cabang tugas Anda.',
                ], 403);
            }
        }

        return response()->json([
            'success' => true,
            'data' => $booking,
        ]);
    }

    public function startTrip($id, Request $request): JsonResponse
    {
        $booking = Booking::with(['vehicle', 'driver'])->findOrFail($id);

        if ($booking->status !== 'approved') {
            return response()->json([
                'success' => false,
                'message' => 'Perjalanan hanya dapat dimulai untuk pemesanan yang telah disetujui sepenuhnya (status: approved).',
            ], 400);
        }

        $request->validate([
            'start_odometer' => 'nullable|integer|min:0',
        ]);

        DB::transaction(function () use ($booking, $request) {
            $startOdo = $request->start_odometer ?? $booking->vehicle->current_odometer;

            $booking->update([
                'status' => 'in_use',
                'start_odometer' => $startOdo,
            ]);

            $booking->vehicle->update([
                'status' => 'in_use',
            ]);

            $booking->driver->update([
                'status' => 'on_duty',
            ]);

            ActivityLogger::log(
                $request->user()->id,
                'start_trip',
                'bookings',
                "Memulai perjalanan untuk pemesanan {$booking->booking_code} (Odometer: {$startOdo} km)",
                ['booking_code' => $booking->booking_code, 'start_odometer' => $startOdo]
            );
        });

        return response()->json([
            'success' => true,
            'message' => 'Perjalanan telah dimulai. Status armada dan driver diperbarui menjadi Sedang Digunakan.',
            'data' => $booking->fresh(['vehicle', 'driver', 'approvals.approver']),
        ]);
    }

    public function completeTrip($id, Request $request): JsonResponse
    {
        $booking = Booking::with(['vehicle', 'driver', 'originRegion', 'destinationRegion'])->findOrFail($id);

        if ($booking->status !== 'in_use') {
            return response()->json([
                'success' => false,
                'message' => 'Hanya pemesanan yang sedang berjalan (status: in_use) yang dapat diselesaikan.',
            ], 400);
        }

        $request->validate([
            'end_odometer' => 'required|integer|gte:' . ($booking->start_odometer ?? 0),
            'has_fuel_refill' => 'nullable|boolean',
            'liters' => 'required_if:has_fuel_refill,true|nullable|numeric|gt:0',
            'cost_per_liter' => 'required_if:has_fuel_refill,true|nullable|numeric|gt:0',
            'fuel_type' => 'nullable|string',
            'gas_station_receipt' => 'nullable|string',
            'fuel_notes' => 'nullable|string',
        ]);

        $fuelLogCreated = null;

        DB::transaction(function () use ($booking, $request, &$fuelLogCreated) {
            $endOdo = (int) $request->end_odometer;

            $booking->update([
                'status' => 'completed',
                'end_odometer' => $endOdo,
            ]);

            $booking->vehicle->update([
                'status' => 'available',
                'current_odometer' => $endOdo,
            ]);

            if ($booking->driver) {
                $booking->driver->update([
                    'status' => 'available',
                ]);
            }

            // Optional integrated fuel refill logging
            if ($request->boolean('has_fuel_refill') && $request->filled('liters') && $request->filled('cost_per_liter')) {
                $liters = (float) $request->liters;
                $costPerLiter = (float) $request->cost_per_liter;
                $totalCost = round($liters * $costPerLiter, 2);

                $fuelLogCreated = FuelLog::create([
                    'vehicle_id' => $booking->vehicle_id,
                    'booking_id' => $booking->id,
                    'log_date' => Carbon::now()->toDateString(),
                    'liters' => $liters,
                    'cost_per_liter' => $costPerLiter,
                    'total_cost' => $totalCost,
                    'odometer_reading' => $endOdo,
                    'fuel_type' => $request->fuel_type ?: ($booking->vehicle->fuel_type ?: 'Solar Dexlite'),
                    'receipt_no' => $request->gas_station_receipt,
                    'notes' => $request->fuel_notes ?: "Pengisian BBM saat penyelesaian perjalanan {$booking->booking_code} ({$booking->originRegion?->name} -> {$booking->destinationRegion?->name})",
                    'created_by_user_id' => $request->user()->id,
                ]);

                ActivityLogger::log(
                    $request->user()->id,
                    'create_fuel_log',
                    'fuel_logs',
                    "Pencatatan konsumsi BBM otomatis saat penyelesaian trip {$booking->booking_code} ({$liters} L - Rp " . number_format($totalCost, 0, ',', '.') . ")",
                    [
                        'fuel_log_id' => $fuelLogCreated->id,
                        'booking_code' => $booking->booking_code,
                        'liters' => $liters,
                        'total_cost' => $totalCost,
                    ]
                );
            }

            ActivityLogger::log(
                $request->user()->id,
                'complete_trip',
                'bookings',
                "Menyelesaikan pemakaian kendaraan untuk pemesanan {$booking->booking_code} (Odometer Akhir: {$endOdo} km)",
                ['booking_code' => $booking->booking_code, 'end_odometer' => $endOdo]
            );
        });

        return response()->json([
            'success' => true,
            'message' => 'Pemakaian kendaraan berhasil diselesaikan. Status armada dan driver kembali Tersedia.' . ($fuelLogCreated ? ' Log pengisian BBM juga berhasil dicatat.' : ''),
            'data' => $booking->fresh(['vehicle', 'driver', 'approvals.approver', 'fuelLogs']),
        ]);
    }

    public function cancel($id, Request $request): JsonResponse
    {
        $booking = Booking::with(['vehicle', 'driver'])->findOrFail($id);

        if (in_array($booking->status, ['completed', 'cancelled'])) {
            return response()->json([
                'success' => false,
                'message' => 'Pemesanan ini tidak dapat dibatalkan.',
            ], 400);
        }

        DB::transaction(function () use ($booking, $request) {
            $booking->update(['status' => 'cancelled']);

            if ($booking->vehicle->status === 'in_use') {
                $booking->vehicle->update(['status' => 'available']);
            }

            if ($booking->driver->status === 'on_duty') {
                $booking->driver->update(['status' => 'available']);
            }

            ActivityLogger::log(
                $request->user()->id,
                'cancel_booking',
                'bookings',
                "Membatalkan pemesanan kendaraan {$booking->booking_code}",
                ['booking_code' => $booking->booking_code]
            );
        });

        return response()->json([
            'success' => true,
            'message' => 'Pemesanan berhasil dibatalkan.',
            'data' => $booking->fresh(),
        ]);
    }
}
