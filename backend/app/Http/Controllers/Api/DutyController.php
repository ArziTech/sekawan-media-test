<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Booking;
use App\Models\Driver;
use App\Models\Vehicle;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DutyController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        $isRegionalApprover = !$user->isAdmin() && !empty($user->region_id);
        $userRegionId = $user->region_id;

        $search = $request->input('search');
        $originRegionId = $request->input('origin_region_id');
        $destinationRegionId = $request->input('destination_region_id');

        // Base booking query with relations
        $bookingBaseQuery = Booking::with([
            'vehicle.rentalCompany',
            'driver.region',
            'originRegion',
            'destinationRegion',
            'approvals.approver',
            'fuelLogs',
        ]);

        if ($isRegionalApprover) {
            $bookingBaseQuery->where(function ($q) use ($userRegionId) {
                $q->where('region_id', $userRegionId)
                  ->orWhere('destination_region_id', $userRegionId);
            });
        }

        if ($originRegionId) {
            $bookingBaseQuery->where('region_id', $originRegionId);
        }

        if ($destinationRegionId) {
            $bookingBaseQuery->where('destination_region_id', $destinationRegionId);
        }

        if ($search) {
            $bookingBaseQuery->where(function ($q) use ($search) {
                $q->where('booking_code', 'like', "%{$search}%")
                  ->orWhere('requester_name', 'like', "%{$search}%")
                  ->orWhere('requester_department', 'like', "%{$search}%")
                  ->orWhere('purpose', 'like', "%{$search}%")
                  ->orWhereHas('vehicle', function ($vq) use ($search) {
                      $vq->where('name', 'like', "%{$search}%")
                         ->orWhere('license_plate', 'like', "%{$search}%");
                  })
                  ->orWhereHas('driver', function ($dq) use ($search) {
                      $dq->where('name', 'like', "%{$search}%")
                         ->orWhere('license_number', 'like', "%{$search}%")
                         ->orWhere('phone', 'like', "%{$search}%");
                  });
            });
        }

        // 1. Active Duties (In Progress / In Use)
        $activeDutiesQuery = clone $bookingBaseQuery;
        $activeDuties = $activeDutiesQuery
            ->where('status', 'in_use')
            ->orderBy('start_date', 'asc')
            ->get();

        // 2. Scheduled Duties (Approved, Ready to start)
        $scheduledDutiesQuery = clone $bookingBaseQuery;
        $scheduledDuties = $scheduledDutiesQuery
            ->where('status', 'approved')
            ->orderBy('start_date', 'asc')
            ->get();

        // 3. Completed Today
        $completedTodayQuery = clone $bookingBaseQuery;
        $completedToday = $completedTodayQuery
            ->where('status', 'completed')
            ->whereDate('updated_at', Carbon::today())
            ->orderBy('updated_at', 'desc')
            ->get();

        // 4. Standby Drivers
        $driversQuery = Driver::with(['region'])
            ->where('status', 'available');

        if ($isRegionalApprover) {
            $driversQuery->where('region_id', $userRegionId);
        }

        if ($originRegionId) {
            $driversQuery->where('region_id', $originRegionId);
        }

        if ($search) {
            $driversQuery->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('license_number', 'like', "%{$search}%")
                  ->orWhere('phone', 'like', "%{$search}%");
            });
        }

        $standbyDrivers = $driversQuery->orderBy('name', 'asc')->get();

        // 5. Aggregate KPI Stats
        $totalActiveDuties = Booking::where('status', 'in_use')
            ->when($isRegionalApprover, function ($q) use ($userRegionId) {
                $q->where(function ($sub) use ($userRegionId) {
                    $sub->where('region_id', $userRegionId)->orWhere('destination_region_id', $userRegionId);
                });
            })
            ->count();

        $totalScheduled = Booking::where('status', 'approved')
            ->when($isRegionalApprover, function ($q) use ($userRegionId) {
                $q->where(function ($sub) use ($userRegionId) {
                    $sub->where('region_id', $userRegionId)->orWhere('destination_region_id', $userRegionId);
                });
            })
            ->count();

        $totalStandbyDrivers = Driver::where('status', 'available')
            ->when($isRegionalApprover, fn($q) => $q->where('region_id', $userRegionId))
            ->count();

        $totalOnDutyDrivers = Driver::where('status', 'on_duty')
            ->when($isRegionalApprover, fn($q) => $q->where('region_id', $userRegionId))
            ->count();

        $totalActiveVehicles = Vehicle::where('status', 'in_use')
            ->when($isRegionalApprover, fn($q) => $q->where('region_id', $userRegionId))
            ->count();

        return response()->json([
            'success' => true,
            'data' => [
                'stats' => [
                    'active_duties' => $totalActiveDuties,
                    'scheduled' => $totalScheduled,
                    'standby_drivers' => $totalStandbyDrivers,
                    'on_duty_drivers' => $totalOnDutyDrivers,
                    'active_vehicles' => $totalActiveVehicles,
                ],
                'active_duties' => $activeDuties,
                'scheduled_duties' => $scheduledDuties,
                'standby_drivers' => $standbyDrivers,
                'completed_today' => $completedToday,
            ],
        ]);
    }
}
