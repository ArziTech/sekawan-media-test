<?php

namespace Database\Seeders;

use App\Models\ActivityLog;
use App\Models\Booking;
use App\Models\BookingApproval;
use App\Models\Driver;
use App\Models\FuelLog;
use App\Models\Region;
use App\Models\RentalCompany;
use App\Models\ServiceLog;
use App\Models\User;
use App\Models\Vehicle;
use Carbon\Carbon;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // 1. Regions: 1 Head Office, 1 Branch Office, 6 Mines
        $headOffice = Region::create([
            'name' => 'Kantor Pusat Jakarta',
            'type' => 'head_office',
            'code' => 'HQ-JKT',
            'address' => 'Gedung Menara Tambang Lt. 18, Jakarta Selatan',
        ]);

        $branchOffice = Region::create([
            'name' => 'Kantor Cabang Kendari',
            'type' => 'branch_office',
            'code' => 'BC-KDR',
            'address' => 'Jl. Bypass Kendari No. 88, Sulawesi Tenggara',
        ]);

        $mines = [
            Region::create([
                'name' => 'Tambang A (Pomalaa)',
                'type' => 'mine_site',
                'code' => 'MINE-PML',
                'address' => 'Kawasan Industri Nikel Pomalaa, Kolaka, Sulawesi Tenggara',
            ]),
            Region::create([
                'name' => 'Tambang B (Morowali)',
                'type' => 'mine_site',
                'code' => 'MINE-MRW',
                'address' => 'Kawasan Industri IMIP, Bahodopi, Morowali, Sulawesi Tengah',
            ]),
            Region::create([
                'name' => 'Tambang C (Konawe)',
                'type' => 'mine_site',
                'code' => 'MINE-KNW',
                'address' => 'Kawasan Industri Morosi, Konawe, Sulawesi Tenggara',
            ]),
            Region::create([
                'name' => 'Tambang D (Kolaka)',
                'type' => 'mine_site',
                'code' => 'MINE-KLK',
                'address' => 'Blok Nikel Kolaka Utara, Sulawesi Tenggara',
            ]),
            Region::create([
                'name' => 'Tambang E (Halmahera)',
                'type' => 'mine_site',
                'code' => 'MINE-HLM',
                'address' => 'Kawasan Teluk Weda, Halmahera Tengah, Maluku Utara',
            ]),
            Region::create([
                'name' => 'Tambang F (Sorowako)',
                'type' => 'mine_site',
                'code' => 'MINE-SRW',
                'address' => 'Blok Tambang Nikel Danau Matano, Sorowako, Sulawesi Selatan',
            ]),
        ];

        // 2. Rental Companies
        $rental1 = RentalCompany::create([
            'name' => 'PT Rental Mandiri Trans',
            'contact_person' => 'Bambang Wijaya',
            'phone' => '0812-3456-7890',
            'email' => 'contact@rentalmandiri.co.id',
            'address' => 'Jl. Pelabuhan Niaga No. 12, Kendari',
        ]);

        $rental2 = RentalCompany::create([
            'name' => 'PT Trans Tambang Nusantara',
            'contact_person' => 'Siti Rahmawati',
            'phone' => '0813-8899-0011',
            'email' => 'sales@transtambang.co.id',
            'address' => 'Jl. Trans Sulawesi KM 45, Morowali',
        ]);

        // 3. Users: Admin & Approvers
        $adminUser = User::create([
            'name' => 'Admin Pool Kendaraan',
            'email' => 'admin@tambang.com',
            'password' => Hash::make('password123'),
            'role' => 'admin',
            'position' => 'Koordinator Pool & Logistik Armada',
            'region_id' => $headOffice->id,
        ]);

        $approverL1 = User::create([
            'name' => 'Bambang Sutrisno, S.T.',
            'email' => 'approver1@tambang.com',
            'password' => Hash::make('password123'),
            'role' => 'approver',
            'approval_tier' => 1,
            'position' => 'Supervisor Operasional Lapangan (Level 1)',
            'region_id' => $branchOffice->id,
        ]);

        $approverL2 = User::create([
            'name' => 'Ir. Hartono Gunawan, M.M.',
            'email' => 'approver2@tambang.com',
            'password' => Hash::make('password123'),
            'role' => 'approver',
            'approval_tier' => 2,
            'position' => 'Kepala Pool & GM Operasional Tambang (Level 2)',
            'region_id' => $headOffice->id,
        ]);

        $approverSite1 = User::create([
            'name' => 'Rahmat Hidayat, M.T.',
            'email' => 'approver1.site@tambang.com',
            'password' => Hash::make('password123'),
            'role' => 'approver',
            'approval_tier' => 1,
            'position' => 'Site Manager Tambang Pomalaa (Level 1)',
            'region_id' => $mines[0]->id,
        ]);

        // 4. Drivers
        $drivers = [
            Driver::create(['name' => 'Budi Santoso', 'phone' => '0812-1111-2222', 'license_number' => 'SIM-BII-887102', 'region_id' => $headOffice->id, 'status' => 'available']),
            Driver::create(['name' => 'Ahmad Hidayat', 'phone' => '0812-3333-4444', 'license_number' => 'SIM-BII-774910', 'region_id' => $mines[0]->id, 'status' => 'available']),
            Driver::create(['name' => 'Joko Prasetyo', 'phone' => '0813-5555-6666', 'license_number' => 'SIM-A-992811', 'region_id' => $mines[1]->id, 'status' => 'on_duty']),
            Driver::create(['name' => 'Rian Pratama', 'phone' => '0813-7777-8888', 'license_number' => 'SIM-BII-662914', 'region_id' => $mines[2]->id, 'status' => 'available']),
            Driver::create(['name' => 'Dedi Kurniawan', 'phone' => '0812-9999-0000', 'license_number' => 'SIM-A-553812', 'region_id' => $mines[3]->id, 'status' => 'available']),
            Driver::create(['name' => 'Hendra Saputra', 'phone' => '0811-2233-4455', 'license_number' => 'SIM-BII-441928', 'region_id' => $mines[4]->id, 'status' => 'on_duty']),
            Driver::create(['name' => 'Agus Salim', 'phone' => '0811-6677-8899', 'license_number' => 'SIM-A-338291', 'region_id' => $mines[5]->id, 'status' => 'available']),
            Driver::create(['name' => 'Wahyu Triyono', 'phone' => '0812-4455-6677', 'license_number' => 'SIM-BII-227189', 'region_id' => $branchOffice->id, 'status' => 'available']),
        ];

        // 5. Vehicles (Owned & Rented, Passenger & Cargo)
        $vehicles = [
            // Milik Perusahaan - Angkutan Orang
            Vehicle::create([
                'name' => 'Toyota Hilux Double Cabin 4x4 V',
                'license_plate' => 'B 9101 NKL',
                'type' => 'passenger',
                'ownership_type' => 'owned',
                'region_id' => $headOffice->id,
                'status' => 'available',
                'fuel_type' => 'Solar Dexlite',
                'current_odometer' => 45200,
                'last_service_date' => Carbon::now()->subMonths(2),
                'next_service_date' => Carbon::now()->addMonths(4),
                'next_service_odometer' => 50000,
            ]),
            Vehicle::create([
                'name' => 'Toyota Fortuner 4x4 2.8 GR Sport',
                'license_plate' => 'B 9102 NKL',
                'type' => 'passenger',
                'ownership_type' => 'owned',
                'region_id' => $branchOffice->id,
                'status' => 'in_use',
                'fuel_type' => 'Pertamina Dex',
                'current_odometer' => 32450,
                'last_service_date' => Carbon::now()->subMonth(),
                'next_service_date' => Carbon::now()->addMonths(5),
                'next_service_odometer' => 40000,
            ]),
            Vehicle::create([
                'name' => 'Mitsubishi Triton Ultimate 4x4',
                'license_plate' => 'DT 7001 AB',
                'type' => 'passenger',
                'ownership_type' => 'owned',
                'region_id' => $mines[0]->id,
                'status' => 'available',
                'fuel_type' => 'Solar Dexlite',
                'current_odometer' => 58100,
                'last_service_date' => Carbon::now()->subMonths(3),
                'next_service_date' => Carbon::now()->addMonth(),
                'next_service_odometer' => 60000,
            ]),
            Vehicle::create([
                'name' => 'Toyota HiAce Premio Commuter 12-Seat',
                'license_plate' => 'B 9103 NKL',
                'type' => 'passenger',
                'ownership_type' => 'owned',
                'region_id' => $branchOffice->id,
                'status' => 'available',
                'fuel_type' => 'Solar Dexlite',
                'current_odometer' => 28900,
                'last_service_date' => Carbon::now()->subMonths(1),
                'next_service_date' => Carbon::now()->addMonths(3),
                'next_service_odometer' => 35000,
            ]),
            Vehicle::create([
                'name' => 'Isuzu D-Max Rodeo 4x4 Double Cab',
                'license_plate' => 'DT 7002 AB',
                'type' => 'passenger',
                'ownership_type' => 'owned',
                'region_id' => $mines[1]->id,
                'status' => 'available',
                'fuel_type' => 'Biosolar',
                'current_odometer' => 72400,
                'last_service_date' => Carbon::now()->subMonths(4),
                'next_service_date' => Carbon::now()->addWeeks(2),
                'next_service_odometer' => 75000,
            ]),
            Vehicle::create([
                'name' => 'Ford Ranger Wildtrak 4x4 Bi-Turbo',
                'license_plate' => 'DT 7003 AB',
                'type' => 'passenger',
                'ownership_type' => 'owned',
                'region_id' => $mines[2]->id,
                'status' => 'in_service',
                'fuel_type' => 'Pertamina Dex',
                'current_odometer' => 61200,
                'last_service_date' => Carbon::now()->subDays(3),
                'next_service_date' => Carbon::now()->addMonths(6),
                'next_service_odometer' => 70000,
            ]),

            // Milik Perusahaan - Angkutan Barang
            Vehicle::create([
                'name' => 'Mitsubishi Fuso Fighter FN62F Dump Truck 6x4',
                'license_plate' => 'DT 8001 AB',
                'type' => 'cargo',
                'ownership_type' => 'owned',
                'region_id' => $mines[0]->id,
                'status' => 'available',
                'fuel_type' => 'Biosolar Industri',
                'current_odometer' => 112400,
                'last_service_date' => Carbon::now()->subMonths(2),
                'next_service_date' => Carbon::now()->addMonth(),
                'next_service_odometer' => 120000,
            ]),
            Vehicle::create([
                'name' => 'Hino 500 FM 260 JD Mining Dump Truck',
                'license_plate' => 'DT 8002 AB',
                'type' => 'cargo',
                'ownership_type' => 'owned',
                'region_id' => $mines[1]->id,
                'status' => 'in_use',
                'fuel_type' => 'Biosolar Industri',
                'current_odometer' => 98500,
                'last_service_date' => Carbon::now()->subMonths(1),
                'next_service_date' => Carbon::now()->addMonths(2),
                'next_service_odometer' => 105000,
            ]),
            Vehicle::create([
                'name' => 'Isuzu Giga FVM 34 U Heavy Cargo Flatbed',
                'license_plate' => 'DT 8003 AB',
                'type' => 'cargo',
                'ownership_type' => 'owned',
                'region_id' => $mines[3]->id,
                'status' => 'available',
                'fuel_type' => 'Biosolar Industri',
                'current_odometer' => 84200,
                'last_service_date' => Carbon::now()->subMonths(3),
                'next_service_date' => Carbon::now()->addMonths(3),
                'next_service_odometer' => 90000,
            ]),
            Vehicle::create([
                'name' => 'UD Trucks Quester CWE 280 Dump Truck 6x4',
                'license_plate' => 'DT 8004 AB',
                'type' => 'cargo',
                'ownership_type' => 'owned',
                'region_id' => $mines[4]->id,
                'status' => 'available',
                'fuel_type' => 'Biosolar Industri',
                'current_odometer' => 104500,
                'last_service_date' => Carbon::now()->subMonths(2),
                'next_service_date' => Carbon::now()->addMonths(4),
                'next_service_odometer' => 115000,
            ]),

            // Sewa - Angkutan Orang
            Vehicle::create([
                'name' => 'Mitsubishi Pajero Sport 4x4 Dakar',
                'license_plate' => 'B 9201 RNT',
                'type' => 'passenger',
                'ownership_type' => 'rented',
                'rental_company_id' => $rental1->id,
                'region_id' => $headOffice->id,
                'status' => 'available',
                'fuel_type' => 'Pertamina Dex',
                'current_odometer' => 19800,
                'last_service_date' => Carbon::now()->subMonth(),
                'next_service_date' => Carbon::now()->addMonths(5),
                'next_service_odometer' => 30000,
            ]),
            Vehicle::create([
                'name' => 'Toyota Land Cruiser Prado TX-L 4x4',
                'license_plate' => 'B 9202 RNT',
                'type' => 'passenger',
                'ownership_type' => 'rented',
                'rental_company_id' => $rental1->id,
                'region_id' => $mines[0]->id,
                'status' => 'available',
                'fuel_type' => 'Pertamina Dex',
                'current_odometer' => 24300,
                'last_service_date' => Carbon::now()->subMonths(2),
                'next_service_date' => Carbon::now()->addMonths(4),
                'next_service_odometer' => 35000,
            ]),
            Vehicle::create([
                'name' => 'Isuzu MU-X 4x4 Ultimate SUV',
                'license_plate' => 'DT 7101 RNT',
                'type' => 'passenger',
                'ownership_type' => 'rented',
                'rental_company_id' => $rental2->id,
                'region_id' => $mines[4]->id,
                'status' => 'available',
                'fuel_type' => 'Solar Dexlite',
                'current_odometer' => 31200,
                'last_service_date' => Carbon::now()->subMonths(3),
                'next_service_date' => Carbon::now()->addMonths(2),
                'next_service_odometer' => 40000,
            ]),

            // Sewa - Angkutan Barang
            Vehicle::create([
                'name' => 'Scania P360 Heavy Mining Dump Truck 6x4',
                'license_plate' => 'DT 8101 RNT',
                'type' => 'cargo',
                'ownership_type' => 'rented',
                'rental_company_id' => $rental2->id,
                'region_id' => $mines[4]->id,
                'status' => 'in_use',
                'fuel_type' => 'Biosolar Industri',
                'current_odometer' => 67900,
                'last_service_date' => Carbon::now()->subMonth(),
                'next_service_date' => Carbon::now()->addMonths(3),
                'next_service_odometer' => 75000,
            ]),
            Vehicle::create([
                'name' => 'Mercedes-Benz Axor 2528 C Mining Dump',
                'license_plate' => 'DT 8102 RNT',
                'type' => 'cargo',
                'ownership_type' => 'rented',
                'rental_company_id' => $rental2->id,
                'region_id' => $mines[5]->id,
                'status' => 'available',
                'fuel_type' => 'Biosolar Industri',
                'current_odometer' => 52300,
                'last_service_date' => Carbon::now()->subMonths(2),
                'next_service_date' => Carbon::now()->addMonths(4),
                'next_service_odometer' => 60000,
            ]),
            Vehicle::create([
                'name' => 'Hino Ranger FM 260 Ti Dump Truck',
                'license_plate' => 'DT 8103 RNT',
                'type' => 'cargo',
                'ownership_type' => 'rented',
                'rental_company_id' => $rental1->id,
                'region_id' => $mines[2]->id,
                'status' => 'available',
                'fuel_type' => 'Biosolar Industri',
                'current_odometer' => 78400,
                'last_service_date' => Carbon::now()->subMonths(1),
                'next_service_date' => Carbon::now()->addMonths(3),
                'next_service_odometer' => 85000,
            ]),
        ];

        // 6. Sample Bookings & Multi-level Approvals
        // Booking 1: Pending Level 1
        $bkg1 = Booking::create([
            'booking_code' => 'BKG-202609-0001',
            'requester_name' => 'Hendri Prasetya',
            'requester_department' => 'Eksplorasi Geologi',
            'region_id' => $headOffice->id,
            'destination_region_id' => $mines[0]->id,
            'vehicle_id' => $vehicles[0]->id,
            'driver_id' => $drivers[0]->id,
            'start_date' => Carbon::now()->addDays(2)->setHour(8)->setMinute(0),
            'end_date' => Carbon::now()->addDays(5)->setHour(17)->setMinute(0),
            'purpose' => 'Survei lokasi pengambilan sampel inti bor nikel blok Pomalaa',
            'status' => 'pending_level_1',
            'created_by_user_id' => $adminUser->id,
        ]);
        BookingApproval::create(['booking_id' => $bkg1->id, 'approval_level' => 1, 'approver_user_id' => $approverL1->id, 'status' => 'pending']);
        BookingApproval::create(['booking_id' => $bkg1->id, 'approval_level' => 2, 'approver_user_id' => $approverL2->id, 'status' => 'pending']);

        // Booking 2: Pending Level 2 (Level 1 approved)
        $bkg2 = Booking::create([
            'booking_code' => 'BKG-202609-0002',
            'requester_name' => 'Dewi Anggraini',
            'requester_department' => 'K3 & Lingkungan Hidup (HSE)',
            'region_id' => $branchOffice->id,
            'destination_region_id' => $mines[1]->id,
            'vehicle_id' => $vehicles[3]->id,
            'driver_id' => $drivers[7]->id,
            'start_date' => Carbon::now()->addDays(1)->setHour(9)->setMinute(0),
            'end_date' => Carbon::now()->addDays(3)->setHour(16)->setMinute(0),
            'purpose' => 'Audit kepatuhan AMDAL dan keselamatan kerja triwulan III',
            'status' => 'pending_level_2',
            'created_by_user_id' => $adminUser->id,
        ]);
        BookingApproval::create([
            'booking_id' => $bkg2->id,
            'approval_level' => 1,
            'approver_user_id' => $approverL1->id,
            'status' => 'approved',
            'notes' => 'Disetujui. Tim HSE dipersilakan berangkat sesuai jadwal.',
            'action_date' => Carbon::now()->subHours(4),
        ]);
        BookingApproval::create(['booking_id' => $bkg2->id, 'approval_level' => 2, 'approver_user_id' => $approverL2->id, 'status' => 'pending']);

        // Booking 3: Approved (Both Level 1 & Level 2 approved, ready to depart)
        $bkg3 = Booking::create([
            'booking_code' => 'BKG-202609-0003',
            'requester_name' => 'Farhan Maulana',
            'requester_department' => 'Maintenance & Engineering',
            'region_id' => $mines[0]->id,
            'destination_region_id' => $mines[2]->id,
            'vehicle_id' => $vehicles[2]->id,
            'driver_id' => $drivers[1]->id,
            'start_date' => Carbon::now()->addHours(6),
            'end_date' => Carbon::now()->addDays(2),
            'purpose' => 'Pengiriman komponen genset cadangan dan inspeksi turbin',
            'status' => 'approved',
            'created_by_user_id' => $adminUser->id,
        ]);
        BookingApproval::create([
            'booking_id' => $bkg3->id,
            'approval_level' => 1,
            'approver_user_id' => $approverSite1->id,
            'status' => 'approved',
            'notes' => 'Peralatan genset sudah siap diangkut.',
            'action_date' => Carbon::now()->subHours(8),
        ]);
        BookingApproval::create([
            'booking_id' => $bkg3->id,
            'approval_level' => 2,
            'approver_user_id' => $approverL2->id,
            'status' => 'approved',
            'notes' => 'Otorisasi final disetujui. Harap utamakan safety berkendara.',
            'action_date' => Carbon::now()->subHours(2),
        ]);

        // Booking 4: In Use
        $bkg4 = Booking::create([
            'booking_code' => 'BKG-202609-0004',
            'requester_name' => 'Dr. Gunawan Wibowo',
            'requester_department' => 'Operasional Smelter',
            'region_id' => $branchOffice->id,
            'destination_region_id' => $mines[1]->id,
            'vehicle_id' => $vehicles[1]->id,
            'driver_id' => $drivers[2]->id,
            'start_date' => Carbon::now()->subHours(5),
            'end_date' => Carbon::now()->addDays(1),
            'purpose' => 'Kunjungan koordinasi tim teknis pengolahan nikel kadar tinggi',
            'status' => 'in_use',
            'start_odometer' => 32300,
            'created_by_user_id' => $adminUser->id,
        ]);
        BookingApproval::create(['booking_id' => $bkg4->id, 'approval_level' => 1, 'approver_user_id' => $approverL1->id, 'status' => 'approved', 'notes' => 'Disetujui', 'action_date' => Carbon::now()->subHours(12)]);
        BookingApproval::create(['booking_id' => $bkg4->id, 'approval_level' => 2, 'approver_user_id' => $approverL2->id, 'status' => 'approved', 'notes' => 'Disetujui. Mobil diberangkatkan.', 'action_date' => Carbon::now()->subHours(6)]);

        // Booking 5: Completed 1
        $bkg5 = Booking::create([
            'booking_code' => 'BKG-202608-0089',
            'requester_name' => 'Teguh Prakoso',
            'requester_department' => 'Logistik Bahan Tambang',
            'region_id' => $mines[0]->id,
            'destination_region_id' => $mines[3]->id,
            'vehicle_id' => $vehicles[6]->id,
            'driver_id' => $drivers[1]->id,
            'start_date' => Carbon::now()->subDays(6)->setHour(8),
            'end_date' => Carbon::now()->subDays(4)->setHour(18),
            'purpose' => 'Mobilisasi 25 ton bijih nikel sampel uji kadar lab Kolaka',
            'status' => 'completed',
            'start_odometer' => 111800,
            'end_odometer' => 112400,
            'created_by_user_id' => $adminUser->id,
        ]);
        BookingApproval::create(['booking_id' => $bkg5->id, 'approval_level' => 1, 'approver_user_id' => $approverSite1->id, 'status' => 'approved', 'notes' => 'ACC', 'action_date' => Carbon::now()->subDays(7)]);
        BookingApproval::create(['booking_id' => $bkg5->id, 'approval_level' => 2, 'approver_user_id' => $approverL2->id, 'status' => 'approved', 'notes' => 'Disetujui', 'action_date' => Carbon::now()->subDays(7)]);

        // Booking 6: Completed 2
        $bkg6 = Booking::create([
            'booking_code' => 'BKG-202608-0092',
            'requester_name' => 'Arif Budiman',
            'requester_department' => 'Security & Pengamanan Obyek Vital',
            'region_id' => $headOffice->id,
            'destination_region_id' => $branchOffice->id,
            'vehicle_id' => $vehicles[0]->id,
            'driver_id' => $drivers[0]->id,
            'start_date' => Carbon::now()->subDays(3)->setHour(7),
            'end_date' => Carbon::now()->subDays(1)->setHour(20),
            'purpose' => 'Patroli berkala dan pergantian personil pos jaga tapal batas tambang',
            'status' => 'completed',
            'start_odometer' => 44650,
            'end_odometer' => 45200,
            'created_by_user_id' => $adminUser->id,
        ]);
        BookingApproval::create(['booking_id' => $bkg6->id, 'approval_level' => 1, 'approver_user_id' => $approverL1->id, 'status' => 'approved', 'notes' => 'Disetujui', 'action_date' => Carbon::now()->subDays(4)]);
        BookingApproval::create(['booking_id' => $bkg6->id, 'approval_level' => 2, 'approver_user_id' => $approverL2->id, 'status' => 'approved', 'notes' => 'ACC Operasional', 'action_date' => Carbon::now()->subDays(4)]);

        // Booking 7: Rejected
        $bkg7 = Booking::create([
            'booking_code' => 'BKG-202608-0095',
            'requester_name' => 'Kevin Sanjaya',
            'requester_department' => 'Public Relations',
            'region_id' => $headOffice->id,
            'destination_region_id' => $mines[5]->id,
            'vehicle_id' => $vehicles[10]->id,
            'driver_id' => $drivers[0]->id,
            'start_date' => Carbon::now()->subDays(2),
            'end_date' => Carbon::now()->subDays(1),
            'purpose' => 'Dokumentasi video profil eksternal',
            'status' => 'rejected',
            'created_by_user_id' => $adminUser->id,
        ]);
        BookingApproval::create([
            'booking_id' => $bkg7->id,
            'approval_level' => 1,
            'approver_user_id' => $approverL1->id,
            'status' => 'rejected',
            'notes' => 'Ditolak: Jadwal berbenturan dengan agenda kunjungan inspeksi kementerian ESDM.',
            'action_date' => Carbon::now()->subDays(2),
        ]);
        BookingApproval::create(['booking_id' => $bkg7->id, 'approval_level' => 2, 'approver_user_id' => $approverL2->id, 'status' => 'pending']);

        // 7. Fuel Logs
        FuelLog::create([
            'vehicle_id' => $vehicles[6]->id,
            'booking_id' => $bkg5->id,
            'log_date' => Carbon::now()->subDays(5),
            'liters' => 185.50,
            'cost_per_liter' => 16500,
            'total_cost' => 185.50 * 16500,
            'odometer_reading' => 112100,
            'fuel_type' => 'Biosolar Industri',
            'receipt_no' => 'SPBU-PML-88129',
            'notes' => 'Pengisian BBM rute Pomalaa - Kolaka PP',
            'created_by_user_id' => $adminUser->id,
        ]);

        FuelLog::create([
            'vehicle_id' => $vehicles[0]->id,
            'booking_id' => $bkg6->id,
            'log_date' => Carbon::now()->subDays(2),
            'liters' => 65.00,
            'cost_per_liter' => 17200,
            'total_cost' => 65.00 * 17200,
            'odometer_reading' => 45050,
            'fuel_type' => 'Solar Dexlite',
            'receipt_no' => 'SPBU-KDR-33102',
            'notes' => 'Pengisian full tank patroli tapal batas',
            'created_by_user_id' => $adminUser->id,
        ]);

        FuelLog::create([
            'vehicle_id' => $vehicles[1]->id,
            'booking_id' => $bkg4->id,
            'log_date' => Carbon::now()->subHours(4),
            'liters' => 70.00,
            'cost_per_liter' => 18500,
            'total_cost' => 70.00 * 18500,
            'odometer_reading' => 32400,
            'fuel_type' => 'Pertamina Dex',
            'receipt_no' => 'SPBU-MRW-77190',
            'notes' => 'Pengisian awal keberangkatan tim smelter',
            'created_by_user_id' => $adminUser->id,
        ]);

        // Extra Fuel records for trend charts
        FuelLog::create([
            'vehicle_id' => $vehicles[7]->id,
            'booking_id' => null,
            'log_date' => Carbon::now()->subWeeks(2),
            'liters' => 220.00,
            'cost_per_liter' => 16500,
            'total_cost' => 220.00 * 16500,
            'odometer_reading' => 97800,
            'fuel_type' => 'Biosolar Industri',
            'receipt_no' => 'SPBU-IND-11029',
            'notes' => 'Operasional hauling rutin pit 2',
            'created_by_user_id' => $adminUser->id,
        ]);

        FuelLog::create([
            'vehicle_id' => $vehicles[9]->id,
            'booking_id' => null,
            'log_date' => Carbon::now()->subWeeks(3),
            'liters' => 195.00,
            'cost_per_liter' => 16500,
            'total_cost' => 195.00 * 16500,
            'odometer_reading' => 103900,
            'fuel_type' => 'Biosolar Industri',
            'receipt_no' => 'SPBU-IND-09821',
            'notes' => 'Operasional logistik tambang Halmahera',
            'created_by_user_id' => $adminUser->id,
        ]);

        // 8. Service Logs
        ServiceLog::create([
            'vehicle_id' => $vehicles[5]->id,
            'service_date' => Carbon::now()->subDays(3),
            'service_type' => 'repair',
            'cost' => 4850000,
            'workshop_name' => 'Bengkel Resmi Auto2000 Kendari',
            'odometer_at_service' => 61200,
            'next_service_date' => Carbon::now()->addMonths(6),
            'next_service_odometer' => 70000,
            'status' => 'in_progress',
            'notes' => 'Penggantian shockbreaker depan 4x4 dan kalibrasi sistem turbo',
            'created_by_user_id' => $adminUser->id,
        ]);

        ServiceLog::create([
            'vehicle_id' => $vehicles[0]->id,
            'service_date' => Carbon::now()->subMonths(2),
            'service_type' => 'routine',
            'cost' => 1650000,
            'workshop_name' => 'Bengkel Sentral Pool HQ',
            'odometer_at_service' => 40000,
            'next_service_date' => Carbon::now()->addMonths(4),
            'next_service_odometer' => 50000,
            'status' => 'completed',
            'notes' => 'Ganti oli mesin sintetis, filter oli, filter solar, dan rotasi ban',
            'created_by_user_id' => $adminUser->id,
        ]);

        ServiceLog::create([
            'vehicle_id' => $vehicles[7]->id,
            'service_date' => Carbon::now()->addWeeks(2),
            'service_type' => 'routine',
            'cost' => 3500000,
            'workshop_name' => 'Bengkel Alat Berat Morowali Mandiri',
            'odometer_at_service' => 98500,
            'next_service_date' => Carbon::now()->addMonths(3),
            'next_service_odometer' => 105000,
            'status' => 'scheduled',
            'notes' => 'Jadwal servis berkala 100.000 KM Dump Truck Hino 500',
            'created_by_user_id' => $adminUser->id,
        ]);

        // 9. Activity Logs
        ActivityLog::create([
            'user_id' => $adminUser->id,
            'action' => 'create_booking',
            'module' => 'bookings',
            'description' => 'Membuat pemesanan BKG-202609-0001 (Toyota Hilux) dengan Approver L1 (Bambang Sutrisno) dan L2 (Ir. Hartono Gunawan)',
            'ip_address' => '127.0.0.1',
            'user_agent' => 'Mozilla/5.0 (X11; Linux x86_64)',
            'payload' => ['booking_code' => 'BKG-202609-0001', 'vehicle' => 'Toyota Hilux Double Cabin 4x4 V', 'requester' => 'Hendri Prasetya'],
            'created_at' => Carbon::now()->subHours(10),
        ]);

        ActivityLog::create([
            'user_id' => $approverL1->id,
            'action' => 'approve_level_1',
            'module' => 'approvals',
            'description' => 'Menyetujui pemesanan BKG-202609-0002 (Toyota HiAce) pada persetujuan Level 1',
            'ip_address' => '127.0.0.1',
            'user_agent' => 'Mozilla/5.0 (X11; Linux x86_64)',
            'payload' => ['booking_code' => 'BKG-202609-0002', 'approval_level' => 1, 'notes' => 'Disetujui. Tim HSE dipersilakan berangkat sesuai jadwal.'],
            'created_at' => Carbon::now()->subHours(4),
        ]);

        ActivityLog::create([
            'user_id' => $approverL2->id,
            'action' => 'approve_level_2',
            'module' => 'approvals',
            'description' => 'Memberikan persetujuan final Level 2 untuk pemesanan BKG-202609-0003 (Mitsubishi Triton)',
            'ip_address' => '127.0.0.1',
            'user_agent' => 'Mozilla/5.0 (X11; Linux x86_64)',
            'payload' => ['booking_code' => 'BKG-202609-0003', 'approval_level' => 2, 'notes' => 'Otorisasi final disetujui.'],
            'created_at' => Carbon::now()->subHours(2),
        ]);
    }
}
