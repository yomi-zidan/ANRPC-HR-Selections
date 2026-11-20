<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Crypt;
use Throwable;

class HRSettingsController extends Controller
{
    private function authenticated(Request $request): bool
    {
        try {
            $token = $request->bearerToken();

            if (!$token) return false;

            $data = json_decode(Crypt::decryptString($token), true);

            return !empty($data['id_user'])
                && !empty($data['expires_at'])
                && $data['expires_at'] >= time();
        } catch (Throwable $e) {
            return false;
        }
    }

    public function index(Request $request)
    {
        if (!$this->authenticated($request)) {
            return response()->json([
                'success' => false,
                'message' => 'غير مصرح بالدخول'
            ], 401);
        }

        $contest = DB::table('dbo.ContestSettings')
            ->orderByDesc('Id')
            ->first();

        $storage = DB::table('dbo.FileStorageSettings')
            ->orderBy('Id')
            ->get();

        return response()->json([
            'success' => true,
            'data' => [
                'contest' => $contest,
                'storage' => $storage,
            ]
        ]);
    }

    public function updateContest(Request $request)
    {
        if (!$this->authenticated($request)) {
            return response()->json([
                'success' => false,
                'message' => 'غير مصرح بالدخول'
            ], 401);
        }

        $validated = $request->validate([
            'Id' => 'required|integer',
            'ContestName' => 'required|string|max:200',
            'OpenDate' => 'required|date',
            'DeadlineDate' => 'required|date|after_or_equal:OpenDate',
            'IsActive' => 'required|boolean',
        ]);

        $exists = DB::table('dbo.ContestSettings')
            ->where('Id', $validated['Id'])
            ->exists();

        if (!$exists) {
            return response()->json([
                'success' => false,
                'message' => 'إعدادات المسابقة غير موجودة'
            ], 404);
        }

        DB::table('dbo.ContestSettings')
            ->where('Id', $validated['Id'])
            ->update([
                'ContestName' => $validated['ContestName'],
                'OpenDate' => $validated['OpenDate'],
                'DeadlineDate' => $validated['DeadlineDate'],
                'IsActive' => $validated['IsActive'],
                'UpdatedAt' => now(),
            ]);

        return response()->json([
            'success' => true,
            'message' => 'تم حفظ إعدادات المسابقة'
        ]);
    }

    public function updateStorage(Request $request, $id)
    {
        if (!$this->authenticated($request)) {
            return response()->json([
                'success' => false,
                'message' => 'غير مصرح بالدخول'
            ], 401);
        }

        $validated = $request->validate([
            'Name' => 'required|string|max:50',
            'BasePath' => 'required|string|max:500',
            'IsActive' => 'required|boolean',
        ]);

        $updated = DB::table('dbo.FileStorageSettings')
            ->where('Id', $id)
            ->update($validated);

        if (!$updated && !DB::table('dbo.FileStorageSettings')->where('Id', $id)->exists()) {
            return response()->json([
                'success' => false,
                'message' => 'مسار التخزين غير موجود'
            ], 404);
        }

        return response()->json([
            'success' => true,
            'message' => 'تم تحديث إعدادات التخزين'
        ]);
    }
}
