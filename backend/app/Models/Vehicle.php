<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Vehicle extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'license_plate',
        'type',
        'ownership_type',
        'rental_company_id',
        'region_id',
        'status',
        'fuel_type',
        'current_odometer',
        'last_service_date',
        'next_service_date',
        'next_service_odometer',
    ];

    protected $casts = [
        'last_service_date' => 'date',
        'next_service_date' => 'date',
        'current_odometer' => 'integer',
        'next_service_odometer' => 'integer',
    ];

    public function region(): BelongsTo
    {
        return $this->belongsTo(Region::class);
    }

    public function rentalCompany(): BelongsTo
    {
        return $this->belongsTo(RentalCompany::class);
    }

    public function bookings(): HasMany
    {
        return $this->hasMany(Booking::class);
    }

    public function fuelLogs(): HasMany
    {
        return $this->hasMany(FuelLog::class);
    }

    public function serviceLogs(): HasMany
    {
        return $this->hasMany(ServiceLog::class);
    }

    public function isAvailable(): bool
    {
        return $this->status === 'available';
    }
}
