<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Booking;
use App\Models\BookingApproval;
use App\Services\ActivityLogger;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class ApprovalController extends Controller
{
    public function pending(Request $request): JsonResponse
    {
        $user = $request->user();

        $query = Booking::with([
            'originRegion',
            'destinationRegion',
            'vehicle',
            'driver',
            'createdBy',
            'approvals.approver'
        ])->latest();

        if ($user->isAdmin()) {
            // Admin can see all pending bookings
            $query->whereIn('status', ['pending_level_1', 'pending_level_2']);
        } else {
            // Approver only sees bookings waiting for their specific level
            $query->where(function ($q) use ($user) {
                $q->where(function ($sub) use ($user) {
                    $sub->where('status', 'pending_level_1')
                        ->whereHas('approvals', function ($app) use ($user) {
                            $app->where('approval_level', 1)
                                ->where('approver_user_id', $user->id)
                                ->where('status', 'pending');
                        });
                })->orWhere(function ($sub) use ($user) {
                    $sub->where('status', 'pending_level_2')
                        ->whereHas('approvals', function ($app) use ($user) {
                            $app->where('approval_level', 2)
                                ->where('approver_user_id', $user->id)
                                ->where('status', 'pending');
                        });
                });
            });
        }

        $pendingBookings = $query->get();

        return response()->json([
            'success' => true,
            'data' => $pendingBookings,
        ]);
    }

    public function history(Request $request): JsonResponse
    {
        $user = $request->user();

        $query = BookingApproval::with([
            'booking.originRegion',
            'booking.destinationRegion',
            'booking.vehicle',
            'booking.driver',
            'booking.createdBy'
        ])->where('status', '!=', 'pending')->latest('action_date');

        if (!$user->isAdmin()) {
            $query->where('approver_user_id', $user->id);
        }

        $approvals = $query->paginate(15);

        return response()->json([
            'success' => true,
            'data' => $approvals,
        ]);
    }

    public function action($bookingId, Request $request): JsonResponse
    {
        $validated = $request->validate([
            'action' => 'required|in:approve,reject',
            'notes' => 'nullable|string|max:1000',
        ]);

        $user = $request->user();
        $booking = Booking::with(['approvals', 'vehicle', 'driver'])->findOrFail($bookingId);

        if ($user->isAdmin()) {
            return response()->json([
                'success' => false,
                'message' => 'Admin tidak memiliki otorisasi untuk menyetujui atau menolak pemesanan. Admin hanya dapat membatalkan pemesanan.',
            ], 403);
        }

        if (in_array($booking->status, ['approved', 'completed', 'rejected', 'cancelled', 'in_use'])) {
            return response()->json([
                'success' => false,
                'message' => "Pemesanan ini sudah tidak dalam tahap persetujuan (Status: {$booking->status}).",
            ], 400);
        }

        // Determine which approval level is being actioned
        $targetApproval = null;
        if ($booking->status === 'pending_level_1') {
            $targetApproval = $booking->approvals->where('approval_level', 1)->first();
            if ($targetApproval->approver_user_id !== $user->id) {
                return response()->json([
                    'success' => false,
                    'message' => 'Anda tidak memiliki hak untuk menyetujui pemesanan ini pada Level 1.',
                ], 403);
            }
        } elseif ($booking->status === 'pending_level_2') {
            $l1 = $booking->approvals->where('approval_level', 1)->first();
            if (!$l1 || $l1->status !== 'approved') {
                return response()->json([
                    'success' => false,
                    'message' => 'Persetujuan Level 1 belum disetujui. Alur persetujuan harus berurutan.',
                ], 400);
            }

            $targetApproval = $booking->approvals->where('approval_level', 2)->first();
            if ($targetApproval->approver_user_id !== $user->id) {
                return response()->json([
                    'success' => false,
                    'message' => 'Anda tidak memiliki hak untuk menyetujui pemesanan ini pada Level 2.',
                ], 403);
            }
        } else {
            return response()->json([
                'success' => false,
                'message' => 'Status pemesanan tidak valid untuk dilakukan persetujuan.',
            ], 400);
        }

        if (!$targetApproval) {
            return response()->json([
                'success' => false,
                'message' => 'Data persetujuan tidak ditemukan.',
            ], 404);
        }

        $action = $validated['action'];
        $notes = $validated['notes'] ?? ($action === 'approve' ? 'Disetujui' : 'Ditolak');

        DB::transaction(function () use ($booking, $targetApproval, $action, $notes, $user) {
            $now = Carbon::now();

            if ($action === 'approve') {
                $targetApproval->update([
                    'status' => 'approved',
                    'notes' => $notes,
                    'action_date' => $now,
                ]);

                if ($targetApproval->approval_level === 1) {
                    // Move to Level 2
                    $booking->update(['status' => 'pending_level_2']);
                    $logAction = 'approve_level_1';
                    $desc = "Penyetujui Level 1 ({$user->name}) menyetujui pemesanan {$booking->booking_code}";
                } else {
                    // Fully Approved!
                    $booking->update(['status' => 'approved']);
                    $logAction = 'approve_level_2';
                    $desc = "Penyetujui Level 2 ({$user->name}) memberikan persetujuan final untuk pemesanan {$booking->booking_code}";
                }
            } else {
                // Reject
                $targetApproval->update([
                    'status' => 'rejected',
                    'notes' => $notes,
                    'action_date' => $now,
                ]);

                $booking->update(['status' => 'rejected']);
                $logAction = 'reject_booking';
                $desc = "Pemesanan {$booking->booking_code} ditolak oleh {$user->name} pada Level {$targetApproval->approval_level}. Alasan: {$notes}";
            }

            ActivityLogger::log(
                $user->id,
                $logAction,
                'approvals',
                $desc,
                [
                    'booking_id' => $booking->id,
                    'booking_code' => $booking->booking_code,
                    'approval_level' => $targetApproval->approval_level,
                    'action' => $action,
                    'notes' => $notes,
                ]
            );
        });

        $message = $action === 'approve'
            ? ($targetApproval->approval_level === 1 ? 'Persetujuan Level 1 berhasil. Pemesanan diteruskan ke Level 2.' : 'Persetujuan final Level 2 berhasil. Pemesanan telah disetujui sepenuhnya.')
            : 'Pemesanan berhasil ditolak.';

        return response()->json([
            'success' => true,
            'message' => $message,
            'data' => $booking->fresh(['approvals.approver', 'vehicle', 'driver']),
        ]);
    }
}
