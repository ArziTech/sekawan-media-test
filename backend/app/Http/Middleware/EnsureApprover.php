<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureApprover
{
    public function handle(Request $request, Closure $next): Response
    {
        if (!$request->user() || (!$request->user()->isApprover() && !$request->user()->isAdmin())) {
            return response()->json([
                'success' => false,
                'message' => 'Akses ditolak: Anda harus memiliki hak akses Penyetujui (Approver).'
            ], 403);
        }

        return $next($request);
    }
}
