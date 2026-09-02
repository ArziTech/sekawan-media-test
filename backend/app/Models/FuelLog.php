<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class FuelLog extends Model
{
    use HasFactory;

    protected $fillable = [
        'vehicle_id',
        'booking_id',
        'log_date',
        'liters',
        'cost_per_liter',
        'total_cost',
        'odometer_reading',
        'fuel_type',
        'receipt_no',
        'notes',
        'created_by_user_id',
    ];

    protected $casts = [
        'log_date' => 'date',
        'liters' => 'decimal:2',
        'cost_per_liter' => 'decimal:2',
        'total_cost' => 'decimal:2',
        'odometer_reading' => 'integer',
    ];

    public function vehicle(): BelongsTo
    {
        return $this->belongsTo(Vehicle::class);
    }

    public function booking(): BelongsTo
    {
        return $this->belongsTo(Booking::class);
    }

    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by_user_id');
    }
}
