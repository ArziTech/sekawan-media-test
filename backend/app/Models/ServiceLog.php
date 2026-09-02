<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ServiceLog extends Model
{
    use HasFactory;

    protected $fillable = [
        'vehicle_id',
        'service_date',
        'service_type',
        'cost',
        'workshop_name',
        'odometer_at_service',
        'next_service_date',
        'next_service_odometer',
        'status',
        'notes',
        'created_by_user_id',
    ];

    protected $casts = [
        'service_date' => 'date',
        'next_service_date' => 'date',
        'cost' => 'decimal:2',
        'odometer_at_service' => 'integer',
        'next_service_odometer' => 'integer',
    ];

    public function vehicle(): BelongsTo
    {
        return $this->belongsTo(Vehicle::class);
    }

    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by_user_id');
    }
}
