<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class BookingApproval extends Model
{
    use HasFactory;

    protected $fillable = [
        'booking_id',
        'approval_level',
        'approver_user_id',
        'status',
        'notes',
        'action_date',
    ];

    protected $casts = [
        'approval_level' => 'integer',
        'action_date' => 'datetime',
    ];

    public function booking(): BelongsTo
    {
        return $this->belongsTo(Booking::class);
    }

    public function approver(): BelongsTo
    {
        return $this->belongsTo(User::class, 'approver_user_id');
    }
}
