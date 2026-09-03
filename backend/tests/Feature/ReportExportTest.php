<?php

namespace Tests\Feature;

use App\Models\User;
use Tests\TestCase;

class ReportExportTest extends TestCase
{
    public function test_export_excel_returns_valid_spreadsheet_response(): void
    {
        $response = $this->get('/api/reports/export/excel');

        $response->assertStatus(200);
        $response->assertHeader('content-type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        $this->assertStringContainsString('attachment; filename="Laporan_Pemesanan_Kendaraan_', $response->headers->get('content-disposition'));
    }

    public function test_export_excel_with_date_and_status_filters(): void
    {
        $response = $this->get('/api/reports/export/excel?status=completed&vehicle_type=passenger');

        $response->assertStatus(200);
        $response->assertHeader('content-type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    }
}
