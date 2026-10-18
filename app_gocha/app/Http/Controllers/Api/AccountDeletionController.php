<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\Auth\AccountDeletionService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class AccountDeletionController extends Controller
{
    public function __construct(private readonly AccountDeletionService $deletion) {}

    /** Permanently deletes the signed-in account (App Store guideline 5.1.1(v)). */
    public function destroy(Request $request): JsonResponse
    {
        $request->validate([
            'confirm' => ['required', 'string', 'in:DELETE'],
        ]);

        $user = $request->user();

        // End the web session first: logout() saves a fresh remember token on
        // the user, which would re-insert the row if it ran after the delete.
        Auth::guard('web')->logout();
        if ($request->hasSession()) {
            $request->session()->invalidate();
            $request->session()->regenerateToken();
        }

        $this->deletion->delete($user);

        return response()->json([
            'message' => 'Your account has been deleted.',
        ]);
    }
}
