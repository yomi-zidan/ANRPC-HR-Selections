<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use Throwable;

class HRAccountController extends Controller
{
    private function authenticatedUserId(Request $request): ?int
    {
        $token = $request->bearerToken();
        if (!$token) {
            return null;
        }

        try {
            $payload = json_decode(Crypt::decryptString($token), true);
            if (!is_array($payload) || empty($payload['id_user']) || empty($payload['expires_at']) || (int) $payload['expires_at'] < now()->timestamp) {
                return null;
            }
            return (int) $payload['id_user'];
        } catch (Throwable $exception) {
            return null;
        }
    }

    public function employees(Request $request): JsonResponse
    {
        if (!$this->authenticatedUserId($request)) {
            return response()->json(['success' => false, 'message' => 'يجب تسجيل الدخول بحساب HR.'], 401);
        }

        $validator = Validator::make($request->query(), ['empn' => ['required', 'integer', 'min:1']]);
        if ($validator->fails()) {
            return response()->json(['success' => false, 'message' => 'رقم القيد غير صحيح.', 'errors' => $validator->errors()], 422);
        }

        $employee = DB::table('dbo.T_MAST as M')
            ->leftJoin('dbo.T_Edarat as E', 'M.code_edara', '=', 'E.edara_code')
            ->where('M.empn', (int) $request->query('empn'))
            ->select(['M.empn', 'M.ename', 'M.nwazifa', 'M.code_wazifa', 'E.edara_text'])
            ->first();

        if (!$employee) {
            return response()->json(['success' => false, 'message' => 'رقم القيد غير صحيح أو غير مسجل.'], 404);
        }

        return response()->json(['success' => true, 'employee' => $employee]);
    }

    public function index(Request $request): JsonResponse
    {
        if (!$this->authenticatedUserId($request)) {
            return response()->json(['success' => false, 'message' => 'يجب تسجيل الدخول بحساب HR.'], 401);
        }

        $users = DB::table('dbo.T_HRUsers')
            ->select(['id_user', 'empn', 'Username', 'FullName'])
            ->orderBy('FullName')
            ->get();

        return response()->json(['success' => true, 'users' => $users]);
    }

    public function store(Request $request): JsonResponse
    {
        if (!$this->authenticatedUserId($request)) {
            return response()->json(['success' => false, 'message' => 'يجب تسجيل الدخول بحساب HR.'], 401);
        }

        $validator = Validator::make($request->all(), [
            'empn' => ['required', 'integer', 'min:1'],
            'username' => ['required', 'string', 'min:3', 'max:50'],
            'password' => ['required', 'string', 'min:8', 'max:255', 'confirmed'],
        ], [
            'empn.required' => 'برجاء إدخال رقم القيد.',
            'username.required' => 'برجاء إدخال اسم المستخدم.',
            'username.min' => 'اسم المستخدم يجب ألا يقل عن 3 أحرف.',
            'password.required' => 'برجاء إدخال كلمة المرور.',
            'password.min' => 'كلمة المرور يجب ألا تقل عن 8 أحرف.',
            'password.confirmed' => 'تأكيد كلمة المرور غير مطابق.',
        ]);

        if ($validator->fails()) {
            return response()->json(['success' => false, 'message' => 'برجاء مراجعة البيانات المدخلة.', 'errors' => $validator->errors()], 422);
        }

        $values = $validator->validated();
        $employee = DB::table('dbo.T_MAST')->where('empn', (int) $values['empn'])->first(['empn', 'ename']);
        if (!$employee) {
            return response()->json(['success' => false, 'message' => 'رقم القيد غير صحيح أو غير مسجل.'], 422);
        }

        $username = trim($values['username']);
        if (DB::table('dbo.T_HRUsers')->where('Username', $username)->exists()) {
            return response()->json(['success' => false, 'message' => 'اسم المستخدم مستخدم بالفعل.'], 422);
        }

        if (DB::table('dbo.T_HRUsers')->where('empn', (int) $values['empn'])->exists()) {
            return response()->json(['success' => false, 'message' => 'يوجد حساب HR مسجل بالفعل لرقم القيد هذا.'], 422);
        }

        $id = DB::table('dbo.T_HRUsers')->insertGetId([
            'empn' => (int) $employee->empn,
            'Username' => $username,
            'PasswordHash' => Hash::make($values['password']),
            'FullName' => $employee->ename,
        ], 'id_user');

        return response()->json([
            'success' => true,
            'message' => 'تم إنشاء حساب HR بنجاح.',
            'user' => ['id_user' => $id, 'empn' => $employee->empn, 'Username' => $username, 'FullName' => $employee->ename],
        ], 201);
    }

    public function updatePassword(Request $request): JsonResponse
    {
        $userId = $this->authenticatedUserId($request);
        if (!$userId) {
            return response()->json(['success' => false, 'message' => 'يجب تسجيل الدخول بحساب HR.'], 401);
        }

        $validator = Validator::make($request->all(), [
            'current_password' => ['required', 'string', 'max:255'],
            'password' => ['required', 'string', 'min:8', 'max:255', 'confirmed'],
        ], [
            'current_password.required' => 'أدخلي كلمة المرور الحالية.',
            'password.required' => 'أدخلي كلمة المرور الجديدة.',
            'password.min' => 'كلمة المرور الجديدة يجب ألا تقل عن 8 أحرف.',
            'password.confirmed' => 'تأكيد كلمة المرور غير مطابق.',
        ]);

        if ($validator->fails()) {
            return response()->json(['success' => false, 'message' => 'برجاء مراجعة البيانات المدخلة.', 'errors' => $validator->errors()], 422);
        }

        $user = DB::table('dbo.T_HRUsers')->where('id_user', $userId)->first(['PasswordHash']);
        if (!$user || !Hash::check($request->input('current_password'), $user->PasswordHash)) {
            return response()->json(['success' => false, 'message' => 'كلمة المرور الحالية غير صحيحة.'], 422);
        }

        DB::table('dbo.T_HRUsers')->where('id_user', $userId)->update([
            'PasswordHash' => Hash::make($request->input('password')),
        ]);

        return response()->json(['success' => true, 'message' => 'تم تغيير كلمة المرور بنجاح.']);
    }
}
