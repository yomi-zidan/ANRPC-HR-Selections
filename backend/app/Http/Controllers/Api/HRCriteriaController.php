<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Crypt;
use Throwable;

class HRCriteriaController extends Controller
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

        $criteria = DB::table('dbo.Criteria')
            ->orderBy('SortOrder')
            ->orderBy('Id')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $criteria
        ]);
    }

    public function store(Request $request)
    {
        if (!$this->authenticated($request)) {
            return response()->json([
                'success' => false,
                'message' => 'غير مصرح بالدخول'
            ], 401);
        }

        $validated = $request->validate([
            'NameAr' => 'required|string|max:200',
            'SortOrder' => 'nullable|integer|min:0',
            'IsActive' => 'nullable|boolean',
        ]);

        $id = DB::table('dbo.Criteria')->max('Id') + 1;

        DB::table('dbo.Criteria')->insert([
            'Id' => $id,
            'NameAr' => $validated['NameAr'],
            'SortOrder' => $validated['SortOrder'] ?? $id,
            'IsActive' => $validated['IsActive'] ?? true,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'تمت إضافة المعيار بنجاح'
        ]);
    }

    public function update(Request $request, $id)
    {
        if (!$this->authenticated($request)) {
            return response()->json([
                'success' => false,
                'message' => 'غير مصرح بالدخول'
            ], 401);
        }

        $validated = $request->validate([
            'NameAr' => 'required|string|max:200',
            'SortOrder' => 'required|integer|min:0',
            'IsActive' => 'required|boolean',
        ]);

        $updated = DB::table('dbo.Criteria')
            ->where('Id', $id)
            ->update($validated);

        if (!$updated && !DB::table('dbo.Criteria')->where('Id', $id)->exists()) {
            return response()->json([
                'success' => false,
                'message' => 'المعيار غير موجود'
            ], 404);
        }

        return response()->json([
            'success' => true,
            'message' => 'تم تحديث المعيار بنجاح'
        ]);
    }
}
