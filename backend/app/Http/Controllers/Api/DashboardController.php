<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Booking;
use App\Models\FuelLog;
use App\Models\Region;
use App\Models\ServiceLog;
use App\Models\Vehicle;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class DashboardController extends Controller
{
    public function stats(Request $request): JsonResponse
    {
        $now = Carbon::now();
        $startOfMonth = $now->copy()->startOfMonth();

        // 1. Booking KPIs
        $totalBookings = Booking::count();
        $pendingApprovals = Booking::whereIn('status', ['pending_level_1', 'pending_level_2'])->count();
        $activeTrips = Booking::where('status', 'in_use')->count();
        $completedTrips = Booking::where('status', 'completed')->count();

        // 2. Fleet KPIs
        $totalVehicles = Vehicle::count();
        $availableVehicles = Vehicle::where('status', 'available')->count();
        $inUseVehicles = Vehicle::where('status', 'in_use')->count();
        $inServiceVehicles = Vehicle::where('status', 'in_service')->count();

        $ownedVehicles = Vehicle::where('ownership_type', 'owned')->count();
        $rentedVehicles = Vehicle::where('ownership_type', 'rented')->count();

        $passengerVehicles = Vehicle::where('type', 'passenger')->count();
        $cargoVehicles = Vehicle::where('type', 'cargo')->count();

        // 3. Fuel KPIs (Current Month)
        $monthlyFuelLiters = FuelLog::where('log_date', '>=', $startOfMonth)->sum('liters');
        $monthlyFuelCost = FuelLog::where('log_date', '>=', $startOfMonth)->sum('total_cost');

        // Total all-time fuel
        $totalFuelLiters = FuelLog::sum('liters');
        $totalFuelCost = FuelLog::sum('total_cost');

        return response()->json([
            'success' => true,
            'data' => [
                'bookings' => [
                    'total' => $totalBookings,
                    'pending_approval' => $pendingApprovals,
                    'active_trips' => $activeTrips,
                    'completed_trips' => $completedTrips,
                ],
                'fleet' => [
                    'total' => $totalVehicles,
                    'available' => $availableVehicles,
                    'in_use' => $inUseVehicles,
                    'in_service' => $inServiceVehicles,
                    'owned' => $ownedVehicles,
                    'rented' => $rentedVehicles,
                    'passenger' => $passengerVehicles,
                    'cargo' => $cargoVehicles,
                ],
                'fuel' => [
                    'monthly_liters' => (float) $monthlyFuelLiters,
                    'monthly_cost' => (float) $monthlyFuelCost,
                    'total_liters' => (float) $totalFuelLiters,
                    'total_cost' => (float) $totalFuelCost,
                ],
            ],
        ]);
    }

    public function charts(Request $request): JsonResponse
    {
        // 1. Vehicle Usage Frequency by Month (Last 6 Months)
        $months = [];
        $usageData = [];
        for ($i = 5; $i >= 0; $i--) {
            $month = Carbon::now()->subMonths($i);
            $monthLabel = $month->translatedFormat('M Y');
            $months[] = $monthLabel;

            $count = Booking::whereYear('start_date', $month->year)
                ->whereMonth('start_date', $month->month)
                ->count();
            $usageData[] = $count;
        }

        // 2. Vehicle Usage by Specific Vehicle (Top 8 most used)
        $topVehicles = Vehicle::withCount('bookings')
            ->orderBy('bookings_count', 'desc')
            ->limit(8)
            ->get()
            ->map(fn($v) => [
                'name' => $v->name . ' (' . $v->license_plate . ')',
                'count' => $v->bookings_count,
            ]);

        // 3. Fleet Distribution (Passenger vs Cargo & Owned vs Rented)
        $fleetDistribution = [
            'passenger_owned' => Vehicle::where('type', 'passenger')->where('ownership_type', 'owned')->count(),
            'passenger_rented' => Vehicle::where('type', 'passenger')->where('ownership_type', 'rented')->count(),
            'cargo_owned' => Vehicle::where('type', 'cargo')->where('ownership_type', 'owned')->count(),
            'cargo_rented' => Vehicle::where('type', 'cargo')->where('ownership_type', 'rented')->count(),
        ];

        // 4. Fuel Consumption & Cost per Month (Last 6 Months)
        $fuelLitersData = [];
        $fuelCostData = [];
        for ($i = 5; $i >= 0; $i--) {
            $month = Carbon::now()->subMonths($i);
            $liters = FuelLog::whereYear('log_date', $month->year)
                ->whereMonth('log_date', $month->month)
                ->sum('liters');
            $cost = FuelLog::whereYear('log_date', $month->year)
                ->whereMonth('log_date', $month->month)
                ->sum('total_cost');

            $fuelLitersData[] = (float) $liters;
            $fuelCostData[] = (float) round($cost / 1000000, 2); // in Millions IDR
        }

        // 5. Booking Status Breakdown
        $statusBreakdown = [
            'pending_level_1' => Booking::where('status', 'pending_level_1')->count(),
            'pending_level_2' => Booking::where('status', 'pending_level_2')->count(),
            'approved' => Booking::where('status', 'approved')->count(),
            'in_use' => Booking::where('status', 'in_use')->count(),
            'completed' => Booking::where('status', 'completed')->count(),
            'rejected' => Booking::where('status', 'rejected')->count(),
        ];

        return response()->json([
            'success' => true,
            'data' => [
                'usage_trend' => [
                    'labels' => $months,
                    'datasets' => [
                        [
                            'label' => 'Jumlah Pemesanan',
                            'data' => $usageData,
                        ]
                    ]
                ],
                'top_vehicles' => $topVehicles,
                'fleet_distribution' => $fleetDistribution,
                'fuel_trend' => [
                    'labels' => $months,
                    'liters' => $fuelLitersData,
                    'cost_millions' => $fuelCostData,
                ],
                'status_breakdown' => $statusBreakdown,
            ],
        ]);
    }

    public function recent(Request $request): JsonResponse
    {
        $recentBookings = Booking::with([
            'vehicle',
            'driver',
            'originRegion',
            'destinationRegion',
            'approvals.approver'
        ])->latest()->limit(5)->get();

        $upcomingServices = ServiceLog::with('vehicle.region')
            ->whereIn('status', ['scheduled', 'in_progress'])
            ->orderBy('service_date', 'asc')
            ->limit(5)
            ->get();

        return response()->json([
            'success' => true,
            'data' => [
                'recent_bookings' => $recentBookings,
                'upcoming_services' => $upcomingServices,
            ],
        ]);
    }
}
