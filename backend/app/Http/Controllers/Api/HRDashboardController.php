<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

class HRDashboardController extends Controller
{
    public function index(): JsonResponse
    {
        // إجمالي القصص المقدمة
        $totalSubmissions = DB::table('dbo.Submissions')->count();

        // عدد القصص التي تم تقييمها مرة واحدة على الأقل
        $evaluatedSubmissions = DB::table('dbo.Reviews')
            ->distinct()
            ->count('SubmissionId');

        // متوسط تقييم كل قصة، في حالة وجود أكثر من مراجع
        $submissionRatings = DB::table('dbo.Reviews')
            ->select('SubmissionId')
            ->selectRaw(
                'AVG(CAST(Stars AS DECIMAL(10,2))) AS average_rating'
            )
            ->groupBy('SubmissionId');

        // متوسط تقييم القصص داخل كل إدارة
        $departmentRatings = DB::table('dbo.Submissions as RS')
            ->joinSub(
                $submissionRatings,
                'SR',
                function ($join) {
                    $join->on('RS.Id', '=', 'SR.SubmissionId');
                }
            )
            ->select('RS.code_edara')
            ->selectRaw('AVG(SR.average_rating) AS average_rating')
            ->groupBy('RS.code_edara');

        // الإدارات التي لديها مشاركات فقط
        $departments = DB::table('dbo.T_Edarat as E')
            ->join(
                'dbo.Submissions as S',
                'E.edara_code',
                '=',
                'S.code_edara'
            )
            ->leftJoinSub(
                $departmentRatings,
                'DR',
                function ($join) {
                    $join->on('E.edara_code', '=', 'DR.code_edara');
                }
            )
            ->select([
                'E.edara_code as id',
                'E.edara_text as name',
            ])
            ->selectRaw(
                'COUNT(DISTINCT S.empn) AS participants_count'
            )
            ->selectRaw(
                'CAST(COALESCE(DR.average_rating, 0) AS DECIMAL(10,2)) AS average_rating'
            )
            ->groupBy(
                'E.edara_code',
                'E.edara_text',
                'DR.average_rating'
            )
            ->orderBy('E.edara_text')
            ->get();

        // عدد الإدارات التي لديها مشاركات فعلية
        $totalDepartments = $departments->count();

        return response()->json([
            'success' => true,
            'data' => [
                'total_submissions' => $totalSubmissions,
                'evaluated_submissions' => $evaluatedSubmissions,
                'total_departments' => $totalDepartments,
                'departments' => $departments,
            ],
        ]);
    }






public function participants($departmentId): JsonResponse
{
    $rows = DB::table('dbo.Submissions as S')
        ->join('dbo.T_MAST as M', 'S.empn', '=', 'M.empn')
        ->where('S.code_edara', $departmentId)
        ->select([
            'S.Id as submission_id',
            'S.empn',
            'M.ename as employee_name',
            'S.Title as title',
            'S.SubmissionType as submission_type',
            'S.Location as location',
            'S.CreatedAt as created_at',
        ])
        ->orderBy('M.ename')
        ->orderByDesc('S.CreatedAt')
        ->get();

    // تجميع القصص حسب الموظف حتى يظهر كل موظف مرة واحدة
    $participants = $rows
        ->groupBy('empn')
        ->map(function ($employeeSubmissions) {
            $first = $employeeSubmissions->first();

            return [
                'empn' => $first->empn,
                'employee_name' => $first->employee_name,
                'submissions_count' => $employeeSubmissions->count(),
                'submissions' => $employeeSubmissions->map(function ($item) {
                    return [
                        'id' => $item->submission_id,
                        'title' => $item->title,
                        'submission_type' => $item->submission_type,
                        'location' => $item->location,
                        'created_at' => $item->created_at,
                    ];
                })->values(),
            ];
        })
        ->values();

    $department = DB::table('dbo.T_Edarat')
        ->where('edara_code', $departmentId)
        ->select('edara_code', 'edara_text')
        ->first();

    if (!$department) {
        return response()->json([
            'success' => false,
            'message' => 'الإدارة غير موجودة.',
        ], 404);
    }

    return response()->json([
        'success' => true,
        'department' => [
            'id' => $department->edara_code,
            'name' => $department->edara_text,
        ],
        'participants' => $participants,
        'total' => $participants->count(),
    ]);
}

}
