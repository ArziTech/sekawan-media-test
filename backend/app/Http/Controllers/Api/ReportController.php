<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Booking;
use App\Services\ActivityLogger;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Style\Alignment;
use PhpOffice\PhpSpreadsheet\Style\Border;
use PhpOffice\PhpSpreadsheet\Style\Fill;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;
use Symfony\Component\HttpFoundation\StreamedResponse;

class ReportController extends Controller
{
    private function buildReportQuery(Request $request)
    {
        $query = Booking::with([
            'originRegion',
            'destinationRegion',
            'vehicle.rentalCompany',
            'driver',
            'createdBy',
            'approvals.approver',
            'fuelLogs'
        ])->latest('start_date');

        if ($request->filled('start_date') && $request->filled('end_date')) {
            $query->whereDate('start_date', '>=', $request->start_date)
                  ->whereDate('start_date', '<=', $request->end_date);
        }

        // Scope to approver's region if not admin
        $user = $request->user();
        if ($user && !$user->isAdmin() && $user->region_id) {
            $query->where(function ($q) use ($user) {
                $q->where('region_id', $user->region_id)
                  ->orWhere('destination_region_id', $user->region_id);
            });
        }

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

        if ($request->filled('ownership_type')) {
            $query->whereHas('vehicle', function ($q) use ($request) {
                $q->where('ownership_type', $request->ownership_type);
            });
        }

        return $query;
    }

    public function bookings(Request $request): JsonResponse
    {
        $query = $this->buildReportQuery($request);
        $bookings = $query->get();

        // Calculate summary metrics
        $totalBookings = $bookings->count();
        $totalFuelLiters = $bookings->sum(fn($b) => $b->fuelLogs->sum('liters'));
        $totalFuelCost = $bookings->sum(fn($b) => $b->fuelLogs->sum('total_cost'));

        return response()->json([
            'success' => true,
            'data' => [
                'bookings' => $bookings,
                'summary' => [
                    'total_bookings' => $totalBookings,
                    'total_fuel_liters' => (float) $totalFuelLiters,
                    'total_fuel_cost' => (float) $totalFuelCost,
                ],
            ],
        ]);
    }

    public function exportExcel(Request $request)
    {
        $query = $this->buildReportQuery($request);
        $bookings = $query->get();

        ActivityLogger::log(
            $request->user()?->id,
            'export_report',
            'reports',
            "Mengekspor laporan periodik pemesanan kendaraan (" . count($bookings) . " data)"
        );

        $spreadsheet = new Spreadsheet();
        $sheet = $spreadsheet->getActiveSheet();
        $sheet->setTitle('Laporan Pemesanan Kendaraan');

        // Title Header
        $sheet->setCellValue('A1', 'LAPORAN PERIODIK PEMESANAN & MONITORING KENDARAAN TAMBANG');
        $sheet->mergeCells('A1:U1');
        $sheet->getStyle('A1')->getFont()->setBold(true)->setSize(14)->setColor(new \PhpOffice\PhpSpreadsheet\Style\Color('0F172A'));
        $sheet->getStyle('A1')->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);

        $periodText = 'Periode: ' . ($request->filled('start_date') ? $request->start_date : 'Semua') . ' s/d ' . ($request->filled('end_date') ? $request->end_date : 'Sekarang');
        $sheet->setCellValue('A2', $periodText . ' | Dicetak: ' . Carbon::now()->format('d-m-Y H:i:s'));
        $sheet->mergeCells('A2:U2');
        $sheet->getStyle('A2')->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);

        // Column Headers
        $headers = [
            'No',
            'Kode Booking',
            'Tgl Mulai',
            'Tgl Selesai',
            'Nama Pemohon',
            'Departemen',
            'Lokasi Asal',
            'Lokasi Tujuan',
            'Kendaraan',
            'No. Plat',
            'Tipe',
            'Kepemilikan',
            'Nama Driver',
            'Status Booking',
            'Approver L1',
            'Status L1',
            'Catatan L1',
            'Approver L2',
            'Status L2',
            'Catatan L2',
            'Total BBM (Liter)',
            'Biaya BBM (Rp)',
        ];

        $headerRow = 4;
        $colIndex = 1;
        foreach ($headers as $header) {
            $sheet->setCellValueByColumnAndRow($colIndex, $headerRow, $header);
            $colIndex++;
        }

        // Style Table Header
        $headerRange = 'A4:V4';
        $sheet->getStyle($headerRange)->getFont()->setBold(true)->setColor(new \PhpOffice\PhpSpreadsheet\Style\Color('FFFFFF'));
        $sheet->getStyle($headerRange)->getFill()->setFillType(Fill::FILL_SOLID)->getStartColor()->setARGB('1E293B');
        $sheet->getStyle($headerRange)->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);

        // Data Rows
        $row = 5;
        $no = 1;
        foreach ($bookings as $b) {
            $l1 = $b->approvals->where('approval_level', 1)->first();
            $l2 = $b->approvals->where('approval_level', 2)->first();
            $liters = $b->fuelLogs->sum('liters');
            $cost = $b->fuelLogs->sum('total_cost');

            $sheet->setCellValue("A{$row}", $no++);
            $sheet->setCellValue("B{$row}", $b->booking_code);
            $sheet->setCellValue("C{$row}", Carbon::parse($b->start_date)->format('Y-m-d H:i'));
            $sheet->setCellValue("D{$row}", Carbon::parse($b->end_date)->format('Y-m-d H:i'));
            $sheet->setCellValue("E{$row}", $b->requester_name);
            $sheet->setCellValue("F{$row}", $b->requester_department);
            $sheet->setCellValue("G{$row}", $b->originRegion?->name);
            $sheet->setCellValue("H{$row}", $b->destinationRegion?->name);
            $sheet->setCellValue("I{$row}", $b->vehicle?->name);
            $sheet->setCellValue("J{$row}", $b->vehicle?->license_plate);
            $sheet->setCellValue("K{$row}", $b->vehicle?->type === 'passenger' ? 'Angkutan Orang' : 'Angkutan Barang');
            $sheet->setCellValue("L{$row}", $b->vehicle?->ownership_type === 'owned' ? 'Milik Sendiri' : 'Sewa (' . ($b->vehicle?->rentalCompany?->name ?? 'Vendor') . ')');
            $sheet->setCellValue("M{$row}", $b->driver?->name);
            $sheet->setCellValue("N{$row}", strtoupper(str_replace('_', ' ', $b->status)));
            $sheet->setCellValue("O{$row}", $l1?->approver?->name ?? '-');
            $sheet->setCellValue("P{$row}", strtoupper($l1?->status ?? '-'));
            $sheet->setCellValue("Q{$row}", $l1?->notes ?? '-');
            $sheet->setCellValue("R{$row}", $l2?->approver?->name ?? '-');
            $sheet->setCellValue("S{$row}", strtoupper($l2?->status ?? '-'));
            $sheet->setCellValue("T{$row}", $l2?->notes ?? '-');
            $sheet->setCellValue("U{$row}", $liters);
            $sheet->setCellValue("V{$row}", $cost);

            // Format numbers
            $sheet->getStyle("U{$row}")->getNumberFormat()->setFormatCode('#,##0.00');
            $sheet->getStyle("V{$row}")->getNumberFormat()->setFormatCode('#,##0');

            $row++;
        }

        // Summary Row
        $sheet->setCellValue("A{$row}", 'TOTAL');
        $sheet->mergeCells("A{$row}:T{$row}");
        $sheet->getStyle("A{$row}:T{$row}")->getFont()->setBold(true);
        $sheet->getStyle("A{$row}:T{$row}")->getAlignment()->setHorizontal(Alignment::HORIZONTAL_RIGHT);
        
        $prevRow = $row - 1;
        if ($prevRow >= 5) {
            $sheet->setCellValue("U{$row}", "=SUM(U5:U{$prevRow})");
            $sheet->setCellValue("V{$row}", "=SUM(V5:V{$prevRow})");
        } else {
            $sheet->setCellValue("U{$row}", 0);
            $sheet->setCellValue("V{$row}", 0);
        }
        $sheet->getStyle("U{$row}:V{$row}")->getFont()->setBold(true);
        $sheet->getStyle("U{$row}")->getNumberFormat()->setFormatCode('#,##0.00');
        $sheet->getStyle("V{$row}")->getNumberFormat()->setFormatCode('#,##0');

        $sheet->getStyle("A4:V{$row}")->getBorders()->getAllBorders()->setBorderStyle(Border::BORDER_THIN);

        // Auto-fit column widths
        foreach (range('A', 'V') as $col) {
            $sheet->getColumnDimension($col)->setAutoSize(true);
        }

        $filename = 'Laporan_Pemesanan_Kendaraan_' . Carbon::now()->format('Ymd_His') . '.xlsx';

        return new StreamedResponse(
            function () use ($spreadsheet) {
                $writer = new Xlsx($spreadsheet);
                $writer->save('php://output');
            },
            200,
            [
                'Content-Type' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                'Content-Disposition' => 'attachment; filename="' . $filename . '"',
                'Cache-Control' => 'max-age=0',
            ]
        );
    }
}
