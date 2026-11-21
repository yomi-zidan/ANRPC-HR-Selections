<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Facades\Validator;

class HRAuthController extends Controller
{
    public function login(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'username' => ['required', 'string', 'max:100'],
            'password' => ['required', 'string', 'max:255'],
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'من فضلك أدخلي اسم المستخدم وكلمة المرور.',
                'errors' => $validator->errors(),
            ], 422);
        }

        $user = DB::table('dbo.T_HRUsers')
            ->where('Username', $request->username)
            ->first();

        if (!$user || !Hash::check($request->password, $user->PasswordHash)) {
            return response()->json([
                'success' => false,
                'message' => 'اسم المستخدم أو كلمة المرور غير صحيحة.',
            ], 401);
        }

        $token = Crypt::encryptString(json_encode([
            'id_user' => $user->id_user,
            'empn' => $user->empn,
            'expires_at' => now()->addHours(8)->timestamp,
        ]));

        return response()->json([
            'success' => true,
            'message' => 'تم تسجيل الدخول بنجاح.',
            'token' => $token,
            'user' => [
                'id_user' => $user->id_user,
                'empn' => $user->empn,
                'username' => $user->Username,
                'full_name' => $user->FullName,
            ],
        ]);
    }
}
