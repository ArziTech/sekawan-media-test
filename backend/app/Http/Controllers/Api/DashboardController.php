<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Booking;
use App\Models\Driver;
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

    public function regionalOverview(Request $request): JsonResponse
    {
        $now = Carbon::now();
        $startOfMonth = $now->copy()->startOfMonth();

        $regions = Region::withCount([
            'vehicles',
            'drivers',
            'originBookings as total_origin_bookings',
            'destinationBookings as total_destination_bookings',
            'originBookings as active_outgoing' => function ($query) {
                $query->where('status', 'in_use');
            },
            'destinationBookings as active_incoming' => function ($query) {
                $query->where('status', 'in_use');
            },
        ])->get();

        $regionsData = $regions->map(function ($region) use ($startOfMonth) {
            $vehicleIds = Vehicle::where('region_id', $region->id)->pluck('id');

            $availableVehicles = Vehicle::where('region_id', $region->id)->where('status', 'available')->count();
            $inUseVehicles = Vehicle::where('region_id', $region->id)->where('status', 'in_use')->count();
            $inServiceVehicles = Vehicle::where('region_id', $region->id)->where('status', 'in_service')->count();

            $availableDrivers = Driver::where('region_id', $region->id)->where('status', 'available')->count();
            $onDutyDrivers = Driver::where('region_id', $region->id)->where('status', 'on_duty')->count();

            $monthlyFuelLiters = FuelLog::whereIn('vehicle_id', $vehicleIds)
                ->where('log_date', '>=', $startOfMonth)
                ->sum('liters');
            $monthlyFuelCost = FuelLog::whereIn('vehicle_id', $vehicleIds)
                ->where('log_date', '>=', $startOfMonth)
                ->sum('total_cost');

            return [
                'id' => $region->id,
                'name' => $region->name,
                'type' => $region->type,
                'code' => $region->code,
                'address' => $region->address,
                'fleet' => [
                    'total' => $region->vehicles_count,
                    'available' => $availableVehicles,
                    'in_use' => $inUseVehicles,
                    'in_service' => $inServiceVehicles,
                ],
                'drivers' => [
                    'total' => $region->drivers_count,
                    'available' => $availableDrivers,
                    'on_duty' => $onDutyDrivers,
                ],
                'trips' => [
                    'active_outgoing' => $region->active_outgoing,
                    'active_incoming' => $region->active_incoming,
                    'total_origin' => $region->total_origin_bookings,
                    'total_destination' => $region->total_destination_bookings,
                ],
                'fuel' => [
                    'monthly_liters' => (float) $monthlyFuelLiters,
                    'monthly_cost' => (float) $monthlyFuelCost,
                ],
            ];
        });

        $chartLabels = $regionsData->pluck('name')->toArray();
        $chartFleetCounts = $regionsData->pluck('fleet.total')->toArray();
        $chartTripCounts = $regionsData->pluck('trips.total_origin')->toArray();
        $chartFuelCosts = $regionsData->map(fn($r) => (float) round($r['fuel']['monthly_cost'] / 1000000, 2))->toArray();

        return response()->json([
            'success' => true,
            'data' => [
                'regions' => $regionsData,
                'comparison_chart' => [
                    'labels' => $chartLabels,
                    'fleet_counts' => $chartFleetCounts,
                    'trip_counts' => $chartTripCounts,
                    'fuel_cost_millions' => $chartFuelCosts,
                ],
            ],
        ]);
    }

    public function regionalDetail(Request $request, $id): JsonResponse
    {
        $now = Carbon::now();
        $startOfMonth = $now->copy()->startOfMonth();

        $region = Region::findOrFail($id);

        $vehicles = Vehicle::with(['rentalCompany'])
            ->where('region_id', $region->id)
            ->get();

        $drivers = Driver::where('region_id', $region->id)->get();

        $activeOutgoing = Booking::with(['vehicle', 'driver', 'destinationRegion', 'approvals.approver'])
            ->where('region_id', $region->id)
            ->whereIn('status', ['pending_level_1', 'pending_level_2', 'approved', 'in_use'])
            ->latest()
            ->get();

        $activeIncoming = Booking::with(['vehicle', 'driver', 'originRegion', 'approvals.approver'])
            ->where('destination_region_id', $region->id)
            ->whereIn('status', ['in_use', 'approved'])
            ->latest()
            ->get();

        $recentCompleted = Booking::with(['vehicle', 'driver', 'originRegion', 'destinationRegion'])
            ->where(function ($q) use ($region) {
                $q->where('region_id', $region->id)
                  ->orWhere('destination_region_id', $region->id);
            })
            ->where('status', 'completed')
            ->latest()
            ->limit(10)
            ->get();

        $vehicleIds = $vehicles->pluck('id');
        $fuelLogs = FuelLog::with('vehicle')
            ->whereIn('vehicle_id', $vehicleIds)
            ->latest('log_date')
            ->limit(10)
            ->get();

        $serviceLogs = ServiceLog::with('vehicle')
            ->whereIn('vehicle_id', $vehicleIds)
            ->orderBy('service_date', 'desc')
            ->limit(10)
            ->get();

        $monthlyFuelLiters = FuelLog::whereIn('vehicle_id', $vehicleIds)
            ->where('log_date', '>=', $startOfMonth)
            ->sum('liters');
        $monthlyFuelCost = FuelLog::whereIn('vehicle_id', $vehicleIds)
            ->where('log_date', '>=', $startOfMonth)
            ->sum('total_cost');

        $topDestinations = Booking::where('region_id', $region->id)
            ->select('destination_region_id', DB::raw('count(*) as total'))
            ->groupBy('destination_region_id')
            ->with('destinationRegion')
            ->orderBy('total', 'desc')
            ->get()
            ->map(fn($item) => [
                'destination_name' => $item->destinationRegion?->name ?? 'N/A',
                'destination_code' => $item->destinationRegion?->code ?? 'N/A',
                'total_trips' => $item->total,
            ]);

        return response()->json([
            'success' => true,
            'data' => [
                'region' => $region,
                'stats' => [
                    'vehicles_total' => $vehicles->count(),
                    'vehicles_available' => $vehicles->where('status', 'available')->count(),
                    'vehicles_in_use' => $vehicles->where('status', 'in_use')->count(),
                    'vehicles_in_service' => $vehicles->where('status', 'in_service')->count(),
                    'passenger_count' => $vehicles->where('type', 'passenger')->count(),
                    'cargo_count' => $vehicles->where('type', 'cargo')->count(),
                    'owned_count' => $vehicles->where('ownership_type', 'owned')->count(),
                    'rented_count' => $vehicles->where('ownership_type', 'rented')->count(),
                    'drivers_total' => $drivers->count(),
                    'drivers_available' => $drivers->where('status', 'available')->count(),
                    'drivers_on_duty' => $drivers->where('status', 'on_duty')->count(),
                    'active_outgoing_count' => $activeOutgoing->count(),
                    'active_incoming_count' => $activeIncoming->count(),
                    'monthly_fuel_liters' => (float) $monthlyFuelLiters,
                    'monthly_fuel_cost' => (float) $monthlyFuelCost,
                ],
                'vehicles' => $vehicles,
                'drivers' => $drivers,
                'active_outgoing' => $activeOutgoing,
                'active_incoming' => $activeIncoming,
                'recent_completed' => $recentCompleted,
                'fuel_logs' => $fuelLogs,
                'service_logs' => $serviceLogs,
                'top_destinations' => $topDestinations,
            ],
        ]);
    }
}
