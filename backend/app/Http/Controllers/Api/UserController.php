<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Services\ActivityLogger;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;

class UserController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = User::with('region')->latest();

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%")
                  ->orWhere('position', 'like', "%{$search}%");
            });
        }

        if ($request->filled('role')) {
            $query->where('role', $request->role);
        }

        if ($request->filled('approval_tier')) {
            $query->where('approval_tier', $request->approval_tier);
        }

        if ($request->filled('region_id')) {
            $query->where('region_id', $request->region_id);
        }

        $perPage = $request->input('per_page', 15);
        $users = $query->paginate($perPage);

        return response()->json([
            'success' => true,
            'data' => $users,
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|max:255|unique:users,email',
            'password' => 'required|string|min:6',
            'role' => 'required|in:admin,approver',
            'approval_tier' => 'nullable|required_if:role,approver|in:1,2',
            'position' => 'nullable|string|max:255',
            'region_id' => 'required|exists:regions,id',
        ]);

        $user = User::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'password' => Hash::make($validated['password']),
            'role' => $validated['role'],
            'approval_tier' => $validated['role'] === 'approver' ? (int) $validated['approval_tier'] : null,
            'position' => $validated['position'] ?? null,
            'region_id' => $validated['region_id'],
        ]);

        ActivityLogger::log(
            $request->user()->id,
            'create_user',
            'users',
            "Menambahkan user baru: {$user->name} ({$user->email}) sebagai " . ($user->role === 'admin' ? 'Admin' : "Penyetujui Level {$user->approval_tier}"),
            ['user_id' => $user->id, 'email' => $user->email, 'role' => $user->role]
        );

        return response()->json([
            'success' => true,
            'message' => 'Pengguna baru berhasil ditambahkan.',
            'data' => $user->load('region'),
        ], 201);
    }

    public function show($id): JsonResponse
    {
        $user = User::with('region')->findOrFail($id);

        return response()->json([
            'success' => true,
            'data' => $user,
        ]);
    }

    public function update(Request $request, $id): JsonResponse
    {
        $user = User::findOrFail($id);

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => ['required', 'email', 'max:255', Rule::unique('users', 'email')->ignore($user->id)],
            'password' => 'nullable|string|min:6',
            'role' => 'required|in:admin,approver',
            'approval_tier' => 'nullable|required_if:role,approver|in:1,2',
            'position' => 'nullable|string|max:255',
            'region_id' => 'required|exists:regions,id',
        ]);

        $updateData = [
            'name' => $validated['name'],
            'email' => $validated['email'],
            'role' => $validated['role'],
            'approval_tier' => $validated['role'] === 'approver' ? (int) $validated['approval_tier'] : null,
            'position' => $validated['position'] ?? null,
            'region_id' => $validated['region_id'],
        ];

        if (!empty($validated['password'])) {
            $updateData['password'] = Hash::make($validated['password']);
        }

        $user->update($updateData);

        ActivityLogger::log(
            $request->user()->id,
            'update_user',
            'users',
            "Memperbarui data pengguna: {$user->name} ({$user->email})",
            ['user_id' => $user->id, 'email' => $user->email, 'role' => $user->role]
        );

        return response()->json([
            'success' => true,
            'message' => 'Data pengguna berhasil diperbarui.',
            'data' => $user->fresh('region'),
        ]);
    }

    public function destroy(Request $request, $id): JsonResponse
    {
        $user = User::findOrFail($id);

        if ($request->user()->id === $user->id) {
            return response()->json([
                'success' => false,
                'message' => 'Anda tidak dapat menghapus akun Anda sendiri yang sedang aktif.',
            ], 400);
        }

        $hasApprovals = $user->approvals()->whereHas('booking', function ($q) {
            $q->whereIn('status', ['pending_level_1', 'pending_level_2', 'approved', 'in_use']);
        })->exists();

        if ($hasApprovals) {
            return response()->json([
                'success' => false,
                'message' => 'Pengguna ini tidak dapat dihapus karena memiliki transaksi persetujuan pemesanan aktif.',
            ], 400);
        }

        $userName = $user->name;
        $userEmail = $user->email;
        $user->delete();

        ActivityLogger::log(
            $request->user()->id,
            'delete_user',
            'users',
            "Menghapus pengguna: {$userName} ({$userEmail})",
            ['deleted_user_id' => $id, 'email' => $userEmail]
        );

        return response()->json([
            'success' => true,
            'message' => "Pengguna {$userName} berhasil dihapus.",
        ]);
    }
}
