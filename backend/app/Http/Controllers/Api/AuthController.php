<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Services\ActivityLogger;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    public function login(Request $request): JsonResponse
    {
        $request->validate([
            'email' => 'required|email',
            'password' => 'required|string',
        ]);

        $user = User::with('region')->where('email', $request->email)->first();

        if (!$user || !Hash::check($request->password, $user->password)) {
            throw ValidationException::withMessages([
                'email' => ['Kredensial email atau password yang dimasukkan salah.'],
            ]);
        }

        // Revoke old tokens if necessary and create a new token
        $token = $user->createToken('auth-token')->plainTextToken;

        ActivityLogger::log(
            $user->id,
            'login',
            'auth',
            "Pengguna {$user->name} ({$user->role}) berhasil masuk ke sistem.",
            ['email' => $user->email, 'role' => $user->role]
        );

        return response()->json([
            'success' => true,
            'message' => 'Login berhasil.',
            'data' => [
                'token' => $token,
                'user' => $user,
            ],
        ]);
    }

    public function me(Request $request): JsonResponse
    {
        $user = User::with('region')->find($request->user()->id);

        return response()->json([
            'success' => true,
            'data' => $user,
        ]);
    }

    public function logout(Request $request): JsonResponse
    {
        $user = $request->user();

        ActivityLogger::log(
            $user->id,
            'logout',
            'auth',
            "Pengguna {$user->name} keluar dari sistem."
        );

        $user->currentAccessToken()->delete();

        return response()->json([
            'success' => true,
            'message' => 'Logout berhasil.',
        ]);
    }

    public function demoUsers(): JsonResponse
    {
        $users = User::with('region')
            ->select('id', 'name', 'email', 'role', 'approval_tier', 'position', 'region_id')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $users,
        ]);
    }
}
