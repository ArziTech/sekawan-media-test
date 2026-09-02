<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Region extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'type',
        'code',
        'address',
    ];

    public function vehicles(): HasMany
    {
        return $this->hasMany(Vehicle::class);
    }

    public function drivers(): HasMany
    {
        return $this->hasMany(Driver::class);
    }

    public function users(): HasMany
    {
        return $this->hasMany(User::class);
    }

    public function originBookings(): HasMany
    {
        return $this->hasMany(Booking::class, 'region_id');
    }

    public function destinationBookings(): HasMany
    {
        return $this->hasMany(Booking::class, 'destination_region_id');
    }
}
