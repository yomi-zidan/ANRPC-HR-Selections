<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Crypt;
use Throwable;

class HRManagementController extends Controller
{
    private function authenticated(Request $request): bool
    {
        $token = $request->bearerToken();

        if (!$token) {
            return false;
        }

        try {
            $payload = json_decode(Crypt::decryptString($token), true);

            return !empty($payload['id_user'])
                && !empty($payload['expires_at'])
                && $payload['expires_at'] >= now()->timestamp;
        } catch (Throwable $e) {
            return false;
        }
    }

    // All submissions with search and filters
    public function submissions(Request $request)
    {
        if (!$this->authenticated($request)) {
            return response()->json([
                'success' => false,
                'message' => 'يجب تسجيل الدخول بحساب HR.',
            ], 401);
        }

        $query = DB::table('dbo.Submissions as S')
            ->join('dbo.T_MAST as M', 'S.empn', '=', 'M.empn')
            ->leftJoin('dbo.T_Edarat as E', 'S.code_edara', '=', 'E.edara_code')
            ->leftJoinSub(
                DB::table('dbo.Reviews')
                    ->select('SubmissionId')
                    ->selectRaw('COUNT(*) AS review_count')
                    ->selectRaw('AVG(CAST(Stars AS DECIMAL(10,2))) AS average_rating')
                    ->groupBy('SubmissionId'),
                'R',
                fn ($join) => $join->on('S.Id', '=', 'R.SubmissionId')
            )
            ->select([
                'S.Id as id',
                'S.empn',
                'M.ename as employee_name',
                'S.Title as title',
                'S.code_edara as department_id',
                'E.edara_text as department_name',
                'S.SubmissionType as submission_type',
                'S.Location as location',
                'S.CreatedAt as created_at',
            ])
            ->selectRaw('COALESCE(R.review_count, 0) AS review_count')
            ->selectRaw('COALESCE(R.average_rating, 0) AS average_rating');

        if ($request->filled('department')) {
            $query->where('S.code_edara', $request->integer('department'));
        }

        if ($request->filled('type')) {
            $query->where('S.SubmissionType', $request->integer('type'));
        }

        if ($request->filled('evaluation')) {
            if ($request->evaluation === 'evaluated') {
                $query->whereNotNull('R.review_count');
            } elseif ($request->evaluation === 'pending') {
                $query->whereNull('R.review_count');
            }
        }

        if ($request->filled('search')) {
            $search = trim($request->search);

            $query->where(function ($q) use ($search) {
                $q->where('M.ename', 'like', "%{$search}%")
                    ->orWhere('S.Title', 'like', "%{$search}%")
                    ->orWhere('S.empn', 'like', "%{$search}%");
            });
        }

        $submissions = $query
            ->orderByDesc('S.CreatedAt')
            ->get()
            ->map(function ($item) {
                $item->submission_type_name =
                    (int) $item->submission_type === 1 ? 'فردي' : 'فريق';

                $item->evaluation_status =
                    (int) $item->review_count > 0 ? 'تم التقييم' : 'بانتظار التقييم';

                return $item;
            });

        $departments = DB::table('dbo.T_Edarat as E')
            ->whereExists(function ($q) {
                $q->select(DB::raw(1))
                    ->from('dbo.Submissions as S')
                    ->whereColumn('S.code_edara', 'E.edara_code');
            })
            ->select([
                'E.edara_code as id',
                'E.edara_text as name',
            ])
            ->orderBy('E.edara_text')
            ->get();

        return response()->json([
            'success' => true,
            'data' => [
                'submissions' => $submissions,
                'departments' => $departments,
                'total' => $submissions->count(),
            ],
        ]);
    }

    // Ranking employees and departments
    public function ranking(Request $request)
    {
        if (!$this->authenticated($request)) {
            return response()->json([
                'success' => false,
                'message' => 'يجب تسجيل الدخول بحساب HR.',
            ], 401);
        }

        // First calculate one average for each submission
        $submissionRatings = DB::table('dbo.Reviews')
            ->select('SubmissionId')
            ->selectRaw('AVG(CAST(Stars AS DECIMAL(10,2))) AS submission_average')
            ->groupBy('SubmissionId');

        // Then calculate employee average from their evaluated submissions
        $employeeRanking = DB::table('dbo.Submissions as S')
            ->joinSub(
                $submissionRatings,
                'SR',
                fn ($join) => $join->on('S.Id', '=', 'SR.SubmissionId')
            )
            ->join('dbo.T_MAST as M', 'S.empn', '=', 'M.empn')
            ->leftJoin('dbo.T_Edarat as E', 'S.code_edara', '=', 'E.edara_code')
            ->select([
                'S.empn',
                'M.ename as employee_name',
                'E.edara_text as department_name',
            ])
            ->selectRaw('COUNT(DISTINCT S.Id) AS evaluated_submissions')
            ->selectRaw('AVG(SR.submission_average) AS average_rating')
            ->groupBy('S.empn', 'M.ename', 'E.edara_text')
            ->orderByDesc('average_rating')
            ->orderBy('M.ename')
            ->get();

        // Department ranking: average of submission averages
        $departmentRanking = DB::table('dbo.Submissions as S')
            ->joinSub(
                $submissionRatings,
                'SR',
                fn ($join) => $join->on('S.Id', '=', 'SR.SubmissionId')
            )
            ->join('dbo.T_Edarat as E', 'S.code_edara', '=', 'E.edara_code')
            ->select([
                'E.edara_code as department_id',
                'E.edara_text as department_name',
            ])
            ->selectRaw('COUNT(DISTINCT S.Id) AS evaluated_submissions')
            ->selectRaw('AVG(SR.submission_average) AS average_rating')
            ->groupBy('E.edara_code', 'E.edara_text')
            ->orderByDesc('average_rating')
            ->orderBy('E.edara_text')
            ->get();

        return response()->json([
            'success' => true,
            'data' => [
                'employees' => $employeeRanking,
                'departments' => $departmentRanking,
            ],
        ]);
    }
}
