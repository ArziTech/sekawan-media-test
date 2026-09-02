<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Region;
use App\Models\RentalCompany;
use Illuminate\Http\JsonResponse;

class RegionController extends Controller
{
    public function index(): JsonResponse
    {
        $regions = Region::withCount(['vehicles', 'drivers'])->get();
        $rentalCompanies = RentalCompany::withCount('vehicles')->get();

        return response()->json([
            'success' => true,
            'data' => [
                'regions' => $regions,
                'rental_companies' => $rentalCompanies,
            ],
        ]);
    }
}
