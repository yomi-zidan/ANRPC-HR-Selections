<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Crypt;

class EmployeeAuthController extends Controller
{
    public function login(Request $request)
    {
        $validator = validator($request->all(), [
            'empn' => ['required', 'integer'],
            'national_id' => ['required', 'string', 'size:14'],
        ], [
            'empn.required' => 'برجاء إدخال رقم القيد.',
            'national_id.required' => 'برجاء إدخال الرقم القومي.',
            'national_id.size' => 'الرقم القومي يجب أن يتكون من 14 رقمًا.',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'برجاء مراجعة البيانات المدخلة.',
                'errors' => $validator->errors(),
            ], 422);
        }

        $employee = DB::table('dbo.T_MAST as M')
            ->leftJoin(
                'dbo.T_Edarat as E',
                'M.code_edara',
                '=',
                'E.edara_code'
            )
            ->where('M.empn', $request->empn)
            ->where('M.ID_NO', $request->national_id)
            ->select([
                'M.empn',
                'M.ename',
                'M.code_edara',
                'E.edara_text',
                'M.code_wazifa',
                'M.nwazifa',
                'M.e_mail',
                'M.internal_phone',
                'M.mobile_no',
            ])
            ->first();

        if (!$employee) {
            return response()->json([
                'success' => false,
                'message' => 'رقم القيد أو الرقم القومي غير صحيح.',
            ], 401);
        }

        $token = Crypt::encryptString(
            json_encode([
                'empn' => $employee->empn,
                'expires_at' => now()->addHours(8)->timestamp,
            ])
        );

        return response()->json([
            'success' => true,
            'message' => 'تم تسجيل الدخول بنجاح',
            'token' => $token,
            'employee' => [
                'empn' => $employee->empn,
                'ename' => $employee->ename,
                'code_edara' => $employee->code_edara,
                'edara_text' => $employee->edara_text,
                'code_wazifa' => $employee->code_wazifa,
                'nwazifa' => $employee->nwazifa,
                'e_mail' => $employee->e_mail,
                'internal_phone' => $employee->internal_phone,
                'mobile_no' => $employee->mobile_no,
            ],
        ]);
    }
}
