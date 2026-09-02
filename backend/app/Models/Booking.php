<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Booking extends Model
{
    use HasFactory;

    protected $fillable = [
        'booking_code',
        'requester_name',
        'requester_department',
        'region_id',
        'destination_region_id',
        'vehicle_id',
        'driver_id',
        'start_date',
        'end_date',
        'purpose',
        'status',
        'start_odometer',
        'end_odometer',
        'created_by_user_id',
    ];

    protected $casts = [
        'start_date' => 'datetime',
        'end_date' => 'datetime',
        'start_odometer' => 'integer',
        'end_odometer' => 'integer',
    ];

    public function originRegion(): BelongsTo
    {
        return $this->belongsTo(Region::class, 'region_id');
    }

    public function destinationRegion(): BelongsTo
    {
        return $this->belongsTo(Region::class, 'destination_region_id');
    }

    public function vehicle(): BelongsTo
    {
        return $this->belongsTo(Vehicle::class);
    }

    public function driver(): BelongsTo
    {
        return $this->belongsTo(Driver::class);
    }

    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by_user_id');
    }

    public function approvals(): HasMany
    {
        return $this->hasMany(BookingApproval::class)->orderBy('approval_level', 'asc');
    }

    public function level1Approval()
    {
        return $this->hasOne(BookingApproval::class)->where('approval_level', 1);
    }

    public function level2Approval()
    {
        return $this->hasOne(BookingApproval::class)->where('approval_level', 2);
    }

    public function fuelLogs(): HasMany
    {
        return $this->hasMany(FuelLog::class);
    }
}
