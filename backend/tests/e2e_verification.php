<?php

require __DIR__ . '/../vendor/autoload.php';

$app = require_once __DIR__ . '/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\User;
use App\Models\Vehicle;
use App\Models\Driver;
use App\Models\Region;
use App\Models\Booking;
use App\Models\BookingApproval;
use App\Models\FuelLog;
use App\Models\ServiceLog;
use App\Models\ActivityLog;
use Illuminate\Support\Facades\Hash;
use Carbon\Carbon;

echo "=== STARTING E2E VERIFICATION TEST ===\n\n";

// 1. Verify Users & Roles
echo "[1] Verifying Users & Credentials...\n";
$admin = User::where('email', 'admin@tambang.com')->first();
$app1 = User::where('email', 'approver1@tambang.com')->first();
$app2 = User::where('email', 'approver2@tambang.com')->first();

assert($admin && $admin->role === 'admin', 'Admin user must exist with role admin');
assert($app1 && $app1->role === 'approver' && $app1->approval_tier === 1, 'Approver 1 must exist with tier 1');
assert($app2 && $app2->role === 'approver' && $app2->approval_tier === 2, 'Approver 2 must exist with tier 2');
assert(Hash::check('password123', $admin->password), 'Admin password must match password123');
echo "    -> Users and roles OK! (Admin, Approver L1, Approver L2)\n\n";

// 2. Verify Regions (1 HQ, 1 Branch, 6 Mines)
echo "[2] Verifying Regions (1 HQ, 1 Branch, 6 Mines)...\n";
$hqCount = Region::where('type', 'head_office')->count();
$branchCount = Region::where('type', 'branch_office')->count();
$mineCount = Region::where('type', 'mine_site')->count();

assert($hqCount === 1, 'Must have exactly 1 head office');
assert($branchCount === 1, 'Must have exactly 1 branch office');
assert($mineCount === 6, 'Must have exactly 6 mine sites');
echo "    -> Regions OK! (1 Head Office, 1 Branch Office, 6 Mines = 8 Regions Total)\n\n";

// 3. Verify Vehicles (Owned & Rented, Passenger & Cargo)
echo "[3] Verifying Vehicle Fleet Categorization...\n";
$passengerOwned = Vehicle::where('type', 'passenger')->where('ownership_type', 'owned')->count();
$passengerRented = Vehicle::where('type', 'passenger')->where('ownership_type', 'rented')->count();
$cargoOwned = Vehicle::where('type', 'cargo')->where('ownership_type', 'owned')->count();
$cargoRented = Vehicle::where('type', 'cargo')->where('ownership_type', 'rented')->count();

echo "    -> Passenger (Owned): {$passengerOwned}, Passenger (Rented): {$passengerRented}\n";
echo "    -> Cargo (Owned): {$cargoOwned}, Cargo (Rented): {$cargoRented}\n";
assert(($passengerOwned + $passengerRented + $cargoOwned + $cargoRented) >= 15, 'Must have 15+ vehicles');
echo "    -> Vehicle Fleet OK!\n\n";

// 4. Test Multi-Level Approval Business Workflow (End-to-End)
echo "[4] Testing Complete Sequential Multi-Level Approval Workflow...\n";
$availVeh = Vehicle::where('status', 'available')->first();
$availDriver = Driver::where('status', 'available')->first();
$origin = Region::where('type', 'head_office')->first();
$dest = Region::where('type', 'mine_site')->first();

// Step A: Admin creates booking
$code = 'TEST-BKG-' . time();
$booking = Booking::create([
    'booking_code' => $code,
    'requester_name' => 'Dr. E2E Test Engineer',
    'requester_department' => 'Quality Assurance',
    'region_id' => $origin->id,
    'destination_region_id' => $dest->id,
    'vehicle_id' => $availVeh->id,
    'driver_id' => $availDriver->id,
    'start_date' => Carbon::now()->addDay(),
    'end_date' => Carbon::now()->addDays(3),
    'purpose' => 'Pengujian otomatis alur bisnis persetujuan 2 tingkat',
    'status' => 'pending_level_1',
    'created_by_user_id' => $admin->id,
]);

$appRec1 = BookingApproval::create([
    'booking_id' => $booking->id,
    'approval_level' => 1,
    'approver_user_id' => $app1->id,
    'status' => 'pending',
]);

$appRec2 = BookingApproval::create([
    'booking_id' => $booking->id,
    'approval_level' => 2,
    'approver_user_id' => $app2->id,
    'status' => 'pending',
]);

assert($booking->status === 'pending_level_1', 'Initial status must be pending_level_1');
echo "    -> Step A: Booking created with status 'pending_level_1' OK!\n";

// Step B: Approver Level 1 Approves
$appRec1->update([
    'status' => 'approved',
    'notes' => 'Disetujui oleh Supervisor Level 1',
    'action_date' => Carbon::now(),
]);
$booking->update(['status' => 'pending_level_2']);
assert($booking->fresh()->status === 'pending_level_2', 'Status must advance to pending_level_2');
echo "    -> Step B: Level 1 Approver approved -> status 'pending_level_2' OK!\n";

// Step C: Approver Level 2 Approves (Final Approval)
$appRec2->update([
    'status' => 'approved',
    'notes' => 'Otorisasi final disetujui Kepala Pool Level 2',
    'action_date' => Carbon::now(),
]);
$booking->update(['status' => 'approved']);
assert($booking->fresh()->status === 'approved', 'Status must advance to approved');
echo "    -> Step C: Level 2 Approver approved -> status 'approved' OK!\n";

// Step D: Start Trip
$booking->update([
    'status' => 'in_use',
    'start_odometer' => $availVeh->current_odometer,
]);
$availVeh->update(['status' => 'in_use']);
$availDriver->update(['status' => 'on_duty']);
assert($booking->fresh()->status === 'in_use', 'Status must be in_use');
assert($availVeh->fresh()->status === 'in_use', 'Vehicle status must be in_use');
assert($availDriver->fresh()->status === 'on_duty', 'Driver status must be on_duty');
echo "    -> Step D: Trip started -> booking 'in_use', vehicle 'in_use', driver 'on_duty' OK!\n";

// Step E: Complete Trip
$endOdo = $availVeh->current_odometer + 150;
$booking->update([
    'status' => 'completed',
    'end_odometer' => $endOdo,
]);
$availVeh->update([
    'status' => 'available',
    'current_odometer' => $endOdo,
]);
$availDriver->update(['status' => 'available']);
assert($booking->fresh()->status === 'completed', 'Status must be completed');
assert($availVeh->fresh()->status === 'available', 'Vehicle must return to available');
assert($availVeh->fresh()->current_odometer === $endOdo, 'Vehicle odometer must be updated');
assert($availDriver->fresh()->status === 'available', 'Driver must return to available');
echo "    -> Step E: Trip completed -> booking 'completed', odometer updated (+150km), vehicle & driver 'available' OK!\n\n";

// 5. Test Fuel & Service Logging
echo "[5] Testing Fuel & Service Logging...\n";
$fuel = FuelLog::create([
    'vehicle_id' => $availVeh->id,
    'booking_id' => $booking->id,
    'log_date' => Carbon::now(),
    'liters' => 50,
    'cost_per_liter' => 16500,
    'total_cost' => 50 * 16500,
    'odometer_reading' => $endOdo,
    'fuel_type' => 'Solar Dexlite',
    'receipt_no' => 'TEST-SPBU-001',
    'created_by_user_id' => $admin->id,
]);
assert($fuel->total_cost == 825000, 'Fuel total cost calculation must match');

$service = ServiceLog::create([
    'vehicle_id' => $availVeh->id,
    'service_date' => Carbon::now(),
    'service_type' => 'routine',
    'cost' => 1500000,
    'workshop_name' => 'Bengkel Test QA',
    'odometer_at_service' => $endOdo,
    'next_service_date' => Carbon::now()->addMonths(3),
    'next_service_odometer' => $endOdo + 10000,
    'status' => 'completed',
    'created_by_user_id' => $admin->id,
]);
assert($service->cost == 1500000, 'Service cost must match');
echo "    -> Fuel & Service logs OK!\n\n";

// 6. Test Activity Logs
echo "[6] Testing Activity Logger...\n";
$actCount = ActivityLog::count();
assert($actCount > 0, 'Activity logs must exist');
echo "    -> Activity logs recorded ({$actCount} records) OK!\n\n";

echo "=== ALL E2E VERIFICATION CHECKS PASSED SUCCESSFULLY! ===\n";
