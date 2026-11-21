<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Facades\DB;
use Throwable;

class HRDashboardController extends Controller
{
    private function getHRUserId(Request $request): ?int
    {
        $token = $request->bearerToken();

        if (!$token) {
            return null;
        }

        try {
            $payload = json_decode(Crypt::decryptString($token), true);

            if (
                !is_array($payload) ||
                empty($payload['id_user']) ||
                empty($payload['expires_at']) ||
                (int) $payload['expires_at'] < now()->timestamp
            ) {
                return null;
            }

            return (int) $payload['id_user'];
        } catch (Throwable $exception) {
            return null;
        }
    }

    public function index(Request $request): JsonResponse
    {
        if (!$this->getHRUserId($request)) {
            return response()->json([
                'success' => false,
                'message' => 'يجب تسجيل الدخول بحساب HR.',
            ], 401);
        }

        // إجمالي القصص المقدمة
        $totalSubmissions = DB::table('dbo.Submissions')->count();

        // عدد القصص التي تم تقييمها مرة واحدة على الأقل
        $evaluatedSubmissions = DB::table('dbo.Reviews')
            ->distinct()
            ->count('SubmissionId');

        $pendingSubmissions = max(0, $totalSubmissions - $evaluatedSubmissions);
        $averageRating = round((float) (DB::table('dbo.Reviews')->avg('Stars') ?? 0), 2);

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
                'COUNT(DISTINCT S.Id) AS submissions_count'
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

        $reviewCounts = DB::table('dbo.Reviews')
            ->select('SubmissionId')
            ->selectRaw('COUNT(*) AS review_count')
            ->groupBy('SubmissionId');

        $recentSubmissions = DB::table('dbo.Submissions as S')
            ->join('dbo.T_MAST as M', 'S.empn', '=', 'M.empn')
            ->leftJoin('dbo.T_Edarat as E', 'S.code_edara', '=', 'E.edara_code')
            ->leftJoinSub(
                $reviewCounts,
                'R',
                function ($join) {
                    $join->on('S.Id', '=', 'R.SubmissionId');
                }
            )
            ->select([
                'S.Id as id',
                'S.Title as title',
                'M.ename as employee_name',
                'E.edara_text as department_name',
                'S.SubmissionType as submission_type',
                'S.CreatedAt as created_at',
            ])
            ->selectRaw('COALESCE(R.review_count, 0) AS review_count')
            ->orderByDesc('S.CreatedAt')
            ->limit(6)
            ->get();

        // عدد الإدارات التي لديها مشاركات فعلية
        $totalDepartments = $departments->count();

        return response()->json([
            'success' => true,
            'data' => [
                'total_submissions' => $totalSubmissions,
                'evaluated_submissions' => $evaluatedSubmissions,
                'pending_submissions' => $pendingSubmissions,
                'total_departments' => $totalDepartments,
                'average_rating' => $averageRating,
                'departments' => $departments,
                'recent_submissions' => $recentSubmissions,
            ],
        ]);
    }






public function participants(Request $request, int $departmentId): JsonResponse
{
    if (!$this->getHRUserId($request)) {
        return response()->json([
            'success' => false,
            'message' => 'يجب تسجيل الدخول بحساب HR.',
        ], 401);
    }

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
