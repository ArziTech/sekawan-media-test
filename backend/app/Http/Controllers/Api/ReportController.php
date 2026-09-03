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
        $sheet->setTitle('Laporan Pemesanan');

        // Set default font to Calibri 10pt
        $spreadsheet->getDefaultStyle()->getFont()->setName('Calibri')->setSize(10);

        // 1. Title Banner (Row 1)
        $sheet->setCellValue('A1', 'PT SEKAWAN MEDIA MINING — LAPORAN PEMESANAN & MONITORING KENDARAAN TAMBANG');
        $sheet->mergeCells('A1:V1');
        $sheet->getRowDimension(1)->setRowHeight(32);
        $sheet->getStyle('A1:V1')->applyFromArray([
            'font' => [
                'bold' => true,
                'size' => 13,
                'color' => ['argb' => 'FFFFFFFF'],
            ],
            'alignment' => [
                'horizontal' => Alignment::HORIZONTAL_CENTER,
                'vertical'   => Alignment::VERTICAL_CENTER,
            ],
            'fill' => [
                'fillType'   => Fill::FILL_SOLID,
                'startColor' => ['argb' => 'FF1E293B'], // Slate-800
            ],
        ]);

        // 2. Meta / Filter Info Banner (Row 2)
        $periodStart = $request->filled('start_date') ? Carbon::parse($request->start_date)->format('d/m/Y') : 'Semua Tanggal';
        $periodEnd = $request->filled('end_date') ? Carbon::parse($request->end_date)->format('d/m/Y') : 'Sekarang';
        $metaText = "Periode: {$periodStart} s/d {$periodEnd}   |   Dicetak pada: " . Carbon::now()->format('d/m/Y H:i:s') . " WIB   |   Total Data: " . count($bookings) . " Transaksi";
        
        $sheet->setCellValue('A2', $metaText);
        $sheet->mergeCells('A2:V2');
        $sheet->getRowDimension(2)->setRowHeight(20);
        $sheet->getStyle('A2:V2')->applyFromArray([
            'font' => [
                'italic' => true,
                'size' => 9.5,
                'color' => ['argb' => 'FF475569'], // Slate-600
            ],
            'alignment' => [
                'horizontal' => Alignment::HORIZONTAL_CENTER,
                'vertical'   => Alignment::VERTICAL_CENTER,
            ],
            'fill' => [
                'fillType'   => Fill::FILL_SOLID,
                'startColor' => ['argb' => 'FFF1F5F9'], // Slate-100
            ],
        ]);

        // Row 3 Spacing
        $sheet->getRowDimension(3)->setRowHeight(8);

        // 3. Table Column Headers (Row 4)
        $headers = [
            'A' => 'No',
            'B' => 'Kode Booking',
            'C' => 'Tgl Mulai',
            'D' => 'Tgl Selesai',
            'E' => 'Nama Pemohon',
            'F' => 'Departemen',
            'G' => 'Lokasi Asal',
            'H' => 'Lokasi Tujuan',
            'I' => 'Kendaraan',
            'J' => 'No. Plat',
            'K' => 'Tipe Armada',
            'L' => 'Kepemilikan',
            'M' => 'Nama Driver',
            'N' => 'Status Booking',
            'O' => 'Penyetujui L1',
            'P' => 'Status L1',
            'Q' => 'Catatan L1',
            'R' => 'Penyetujui L2',
            'S' => 'Status L2',
            'T' => 'Catatan L2',
            'U' => 'Total BBM (Liter)',
            'V' => 'Biaya BBM (Rp)',
        ];

        foreach ($headers as $col => $headerTitle) {
            $sheet->setCellValue("{$col}4", $headerTitle);
        }

        $sheet->getRowDimension(4)->setRowHeight(26);
        $sheet->getStyle('A4:V4')->applyFromArray([
            'font' => [
                'bold' => true,
                'size' => 10,
                'color' => ['argb' => 'FFFFFFFF'],
            ],
            'alignment' => [
                'horizontal' => Alignment::HORIZONTAL_CENTER,
                'vertical'   => Alignment::VERTICAL_CENTER,
                'wrapText'   => true,
            ],
            'fill' => [
                'fillType'   => Fill::FILL_SOLID,
                'startColor' => ['argb' => 'FF1E3A8A'], // Navy Blue (Blue-900)
            ],
        ]);

        // Status Label Maps (Localized)
        $statusLabels = [
            'pending_level_1' => 'Menunggu Persetujuan L1',
            'pending_level_2' => 'Menunggu Persetujuan L2',
            'approved'        => 'Disetujui',
            'in_use'          => 'Sedang Digunakan',
            'completed'       => 'Selesai',
            'rejected'        => 'Ditolak',
            'cancelled'       => 'Dibatalkan',
        ];

        $approvalLabels = [
            'approved' => 'Disetujui',
            'rejected' => 'Ditolak',
            'pending'  => 'Menunggu',
        ];

        // 4. Data Rows (Row 5 onwards)
        $row = 5;
        $no = 1;
        foreach ($bookings as $b) {
            $l1 = $b->approvals->where('approval_level', 1)->first();
            $l2 = $b->approvals->where('approval_level', 2)->first();
            $liters = (float) $b->fuelLogs->sum('liters');
            $cost = (float) $b->fuelLogs->sum('total_cost');

            $sheet->setCellValue("A{$row}", $no++);
            $sheet->setCellValue("B{$row}", $b->booking_code);
            $sheet->setCellValue("C{$row}", Carbon::parse($b->start_date)->format('d/m/Y H:i'));
            $sheet->setCellValue("D{$row}", Carbon::parse($b->end_date)->format('d/m/Y H:i'));
            $sheet->setCellValue("E{$row}", $b->requester_name);
            $sheet->setCellValue("F{$row}", $b->requester_department);
            $sheet->setCellValue("G{$row}", $b->originRegion?->name ?? '-');
            $sheet->setCellValue("H{$row}", $b->destinationRegion?->name ?? '-');
            $sheet->setCellValue("I{$row}", $b->vehicle?->name ?? '-');
            $sheet->setCellValue("J{$row}", $b->vehicle?->license_plate ?? '-');
            $sheet->setCellValue("K{$row}", $b->vehicle?->type === 'passenger' ? 'Angkutan Orang' : ($b->vehicle?->type === 'cargo' ? 'Angkutan Barang' : '-'));
            $sheet->setCellValue("L{$row}", $b->vehicle?->ownership_type === 'owned' ? 'Milik Sendiri' : 'Sewa (' . ($b->vehicle?->rentalCompany?->name ?? 'Vendor') . ')');
            $sheet->setCellValue("M{$row}", $b->driver?->name ?? '-');
            $sheet->setCellValue("N{$row}", $statusLabels[$b->status] ?? ucfirst(str_replace('_', ' ', $b->status)));
            $sheet->setCellValue("O{$row}", $l1?->approver?->name ?? '-');
            $sheet->setCellValue("P{$row}", $approvalLabels[$l1?->status ?? ''] ?? ($l1?->status ? ucfirst($l1->status) : '-'));
            $sheet->setCellValue("Q{$row}", $l1?->notes ?? '-');
            $sheet->setCellValue("R{$row}", $l2?->approver?->name ?? '-');
            $sheet->setCellValue("S{$row}", $approvalLabels[$l2?->status ?? ''] ?? ($l2?->status ? ucfirst($l2->status) : '-'));
            $sheet->setCellValue("T{$row}", $l2?->notes ?? '-');
            $sheet->setCellValue("U{$row}", $liters);
            $sheet->setCellValue("V{$row}", $cost);

            $sheet->getRowDimension($row)->setRowHeight(20);

            // Alignments per column group
            $sheet->getStyle("A{$row}:D{$row}")->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER)->setVertical(Alignment::VERTICAL_CENTER);
            $sheet->getStyle("E{$row}:I{$row}")->getAlignment()->setHorizontal(Alignment::HORIZONTAL_LEFT)->setVertical(Alignment::VERTICAL_CENTER);
            $sheet->getStyle("J{$row}:L{$row}")->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER)->setVertical(Alignment::VERTICAL_CENTER);
            $sheet->getStyle("M{$row}")->getAlignment()->setHorizontal(Alignment::HORIZONTAL_LEFT)->setVertical(Alignment::VERTICAL_CENTER);
            $sheet->getStyle("N{$row}")->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER)->setVertical(Alignment::VERTICAL_CENTER);
            $sheet->getStyle("O{$row}")->getAlignment()->setHorizontal(Alignment::HORIZONTAL_LEFT)->setVertical(Alignment::VERTICAL_CENTER);
            $sheet->getStyle("P{$row}")->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER)->setVertical(Alignment::VERTICAL_CENTER);
            $sheet->getStyle("Q{$row}:R{$row}")->getAlignment()->setHorizontal(Alignment::HORIZONTAL_LEFT)->setVertical(Alignment::VERTICAL_CENTER);
            $sheet->getStyle("S{$row}")->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER)->setVertical(Alignment::VERTICAL_CENTER);
            $sheet->getStyle("T{$row}")->getAlignment()->setHorizontal(Alignment::HORIZONTAL_LEFT)->setVertical(Alignment::VERTICAL_CENTER);
            $sheet->getStyle("U{$row}:V{$row}")->getAlignment()->setHorizontal(Alignment::HORIZONTAL_RIGHT)->setVertical(Alignment::VERTICAL_CENTER);

            // Number formatting
            $sheet->getStyle("U{$row}")->getNumberFormat()->setFormatCode('#,##0.00');
            $sheet->getStyle("V{$row}")->getNumberFormat()->setFormatCode('#,##0');

            // Zebra striping (even row light tint)
            if ($row % 2 === 0) {
                $sheet->getStyle("A{$row}:V{$row}")->getFill()->setFillType(Fill::FILL_SOLID)->getStartColor()->setARGB('FFF8FAFC');
            }

            $row++;
        }

        // 5. Summary / Total Row
        $sheet->setCellValue("A{$row}", 'TOTAL KESELURUHAN');
        $sheet->mergeCells("A{$row}:T{$row}");
        $sheet->getRowDimension($row)->setRowHeight(24);
        
        $sheet->getStyle("A{$row}:T{$row}")->applyFromArray([
            'font' => ['bold' => true, 'size' => 10],
            'alignment' => [
                'horizontal' => Alignment::HORIZONTAL_RIGHT,
                'vertical'   => Alignment::VERTICAL_CENTER,
            ],
            'fill' => [
                'fillType'   => Fill::FILL_SOLID,
                'startColor' => ['argb' => 'FFE2E8F0'], // Slate-200
            ],
        ]);

        $prevRow = $row - 1;
        if ($prevRow >= 5) {
            $sheet->setCellValue("U{$row}", "=SUM(U5:U{$prevRow})");
            $sheet->setCellValue("V{$row}", "=SUM(V5:V{$prevRow})");
        } else {
            $sheet->setCellValue("U{$row}", 0);
            $sheet->setCellValue("V{$row}", 0);
        }

        $sheet->getStyle("U{$row}:V{$row}")->applyFromArray([
            'font' => ['bold' => true, 'size' => 10],
            'alignment' => [
                'horizontal' => Alignment::HORIZONTAL_RIGHT,
                'vertical'   => Alignment::VERTICAL_CENTER,
            ],
            'fill' => [
                'fillType'   => Fill::FILL_SOLID,
                'startColor' => ['argb' => 'FFE2E8F0'], // Slate-200
            ],
        ]);
        $sheet->getStyle("U{$row}")->getNumberFormat()->setFormatCode('#,##0.00');
        $sheet->getStyle("V{$row}")->getNumberFormat()->setFormatCode('#,##0');

        // 6. Borders for Table (Header through Total Row)
        $sheet->getStyle("A4:V{$row}")->applyFromArray([
            'borders' => [
                'allBorders' => [
                    'borderStyle' => Border::BORDER_THIN,
                    'color' => ['argb' => 'FFCBD5E1'], // Light slate border
                ],
            ],
        ]);

        // Heavy bottom double border for total row
        $sheet->getStyle("A{$row}:V{$row}")->applyFromArray([
            'borders' => [
                'bottom' => [
                    'borderStyle' => Border::BORDER_DOUBLE,
                    'color' => ['argb' => 'FF64748B'],
                ],
                'top' => [
                    'borderStyle' => Border::BORDER_THIN,
                    'color' => ['argb' => 'FF64748B'],
                ],
            ],
        ]);

        // 7. Column Widths (Optimal padding for clear readability)
        $columnWidths = [
            'A' => 6,   // No
            'B' => 18,  // Kode Booking
            'C' => 18,  // Tgl Mulai
            'D' => 18,  // Tgl Selesai
            'E' => 24,  // Nama Pemohon
            'F' => 22,  // Departemen
            'G' => 22,  // Lokasi Asal
            'H' => 22,  // Lokasi Tujuan
            'I' => 24,  // Kendaraan
            'J' => 16,  // No. Plat
            'K' => 18,  // Tipe Armada
            'L' => 20,  // Kepemilikan
            'M' => 20,  // Nama Driver
            'N' => 25,  // Status Booking
            'O' => 22,  // Approver L1
            'P' => 16,  // Status L1
            'Q' => 28,  // Catatan L1
            'R' => 22,  // Approver L2
            'S' => 16,  // Status L2
            'T' => 28,  // Catatan L2
            'U' => 20,  // Total BBM (Liter)
            'V' => 22,  // Biaya BBM (Rp)
        ];

        foreach ($columnWidths as $col => $width) {
            $sheet->getColumnDimension($col)->setWidth($width);
        }

        // 8. Freeze Pane & AutoFilter
        $sheet->freezePane('A5');
        $sheet->setAutoFilter("A4:V{$prevRow}");

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
