<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Str;
use Throwable;

class HRSubmissionController extends Controller
{
    private function getHRUserId(Request $request): ?int
    {
        $token = $request->bearerToken();

        if (!$token) {
            return null;
        }

        try {
            $payload = json_decode(
                Crypt::decryptString($token),
                true
            );

            if (
                empty($payload['id_user']) ||
                empty($payload['expires_at']) ||
                $payload['expires_at'] < now()->timestamp
            ) {
                return null;
            }

            return (int) $payload['id_user'];
        } catch (Throwable $e) {
            return null;
        }
    }

    // =========================================
    // Get submission details
    // =========================================
    public function show(Request $request, int $id)
    {
        if (!$this->getHRUserId($request)) {
            return response()->json([
                'success' => false,
                'message' => 'يجب تسجيل الدخول بحساب HR.',
            ], 401);
        }

        $submission = DB::table('dbo.Submissions as S')
            ->join('dbo.T_MAST as M', 'S.empn', '=', 'M.empn')
            ->leftJoin(
                'dbo.T_Edarat as E',
                'S.code_edara',
                '=',
                'E.edara_code'
            )
            ->where('S.Id', $id)
            ->select([
                'S.Id',
                'S.empn',
                'S.code_edara',
                'S.Title',
                'S.SubmissionType',
                'S.Location',
                'S.TeamMembers',
                'S.Challenge',
                'S.Efforts',
                'S.Results',
                'S.Impact',
                'S.Inspiration',
                'S.CreatedAt',
                'M.ename as EmployeeName',
                'E.edara_text as DepartmentName',
            ])
            ->first();

        if (!$submission) {
            return response()->json([
                'success' => false,
                'message' => 'المشاركة غير موجودة.',
            ], 404);
        }

        $criteria = DB::table('dbo.SubmissionCriteria as SC')
            ->join(
                'dbo.Criteria as C',
                'SC.CriterionId',
                '=',
                'C.Id'
            )
            ->where('SC.SubmissionId', $id)
            ->orderBy('C.SortOrder')
            ->select([
                'C.Id',
                'C.NameAr',
            ])
            ->get();

        $files = DB::table('dbo.SubmissionFiles as F')
            ->leftJoin(
                'dbo.FileTypes as FT',
                'F.FileTypeId',
                '=',
                'FT.Id'
            )
            ->where('F.SubmissionId', $id)
            ->select([
                'F.Id',
                'F.OriginalFileName',
                'F.FileTypeId',
                'FT.NameAr as FileTypeName',
                'F.FileSizeBytes',
                'F.UploadedAt',
            ])
            ->get()
            ->map(function ($file) {
                return [
                    'id' => $file->Id,
                    'name' => $file->OriginalFileName,
                    'type_id' => $file->FileTypeId,
                    'type_name' => $file->FileTypeName,
                    'size' => $file->FileSizeBytes,
                    'uploaded_at' => $file->UploadedAt,
                    'url' => url(
                        '/api/hr/submission-files/' . $file->Id
                    ),
                ];
            });

        $reviewerId = $this->getHRUserId($request);

        $review = DB::table('dbo.Reviews')
            ->where('SubmissionId', $id)
            ->where('ReviewerId', $reviewerId)
            ->select('Stars', 'Notes')
            ->first();

        return response()->json([
            'success' => true,
            'submission' => [
                'id' => $submission->Id,
                'empn' => $submission->empn,
                'employee_name' => $submission->EmployeeName,
                'department_id' => $submission->code_edara,
                'department_name' => $submission->DepartmentName,
                'title' => $submission->Title,
                'submission_type' => $submission->SubmissionType,
                'submission_type_name' =>
                    $submission->SubmissionType == 1 ? 'فردي' : 'فريق',
                'location' => $submission->Location,
                'team_members' => $submission->TeamMembers,
                'challenge' => $submission->Challenge,
                'efforts' => $submission->Efforts,
                'results' => $submission->Results,
                'impact' => $submission->Impact,
                'inspiration' => $submission->Inspiration,
                'created_at' => $submission->CreatedAt,
                'criteria' => $criteria,
                'files' => $files,
                'my_review' => $review,
            ],
        ]);
    }

    // =========================================
    // Save or update HR evaluation
    // =========================================
    public function evaluate(Request $request, int $id)
    {
        $reviewerId = $this->getHRUserId($request);

        if (!$reviewerId) {
            return response()->json([
                'success' => false,
                'message' => 'انتهت الجلسة أو يجب تسجيل الدخول بحساب HR.',
            ], 401);
        }

        $validator = Validator::make($request->all(), [
            'stars' => ['required', 'integer', 'between:1,5'],
            'notes' => ['nullable', 'string', 'max:4000'],
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'تأكدي من اختيار التقييم.',
                'errors' => $validator->errors(),
            ], 422);
        }

        $exists = DB::table('dbo.Submissions')
            ->where('Id', $id)
            ->exists();

        if (!$exists) {
            return response()->json([
                'success' => false,
                'message' => 'المشاركة غير موجودة.',
            ], 404);
        }

        $existingReview = DB::table('dbo.Reviews')
            ->where('SubmissionId', $id)
            ->where('ReviewerId', $reviewerId)
            ->first();

        if ($existingReview) {
            DB::table('dbo.Reviews')
                ->where('SubmissionId', $id)
                ->where('ReviewerId', $reviewerId)
                ->update([
                    'Stars' => $request->stars,
                    'Notes' => $request->notes,
                    'UpdatedAt' => now(),
                ]);
        } else {
            DB::table('dbo.Reviews')->insert([
                'SubmissionId' => $id,
                'ReviewerId' => $reviewerId,
                'Stars' => $request->stars,
                'Notes' => $request->notes,
                'CreatedAt' => now(),
                'UpdatedAt' => now(),
            ]);
        }

        return response()->json([
            'success' => true,
            'message' => 'تم حفظ التقييم بنجاح.',
        ]);
    }

    // =========================================
    // Preview / download submission attachment
    // =========================================
    public function file(Request $request, int $fileId)
    {
        if (!$this->getHRUserId($request)) {
            return response()->json([
                'success' => false,
                'message' => 'يجب تسجيل الدخول بحساب HR.',
            ], 401);
        }

        $file = DB::table('dbo.SubmissionFiles as F')
            ->join(
                'dbo.FileStorageSettings as FS',
                'F.StorageId',
                '=',
                'FS.Id'
            )
            ->where('F.Id', $fileId)
            ->where('FS.IsActive', 1)
            ->select([
                'F.RelativePath',
                'F.OriginalFileName',
                'FS.BasePath',
            ])
            ->first();

        if (!$file) {
            return response()->json([
                'success' => false,
                'message' => 'المرفق غير موجود.',
            ], 404);
        }

        $relativePath = str_replace(
            ['/', '\\'],
            DIRECTORY_SEPARATOR,
            $file->RelativePath
        );

        // منع الوصول إلى ملفات خارج مجلد التخزين
        if (
            Str::contains($relativePath, '..') ||
            Str::startsWith($relativePath, DIRECTORY_SEPARATOR)
        ) {
            return response()->json([
                'success' => false,
                'message' => 'مسار الملف غير صالح.',
            ], 400);
        }

        $basePath = rtrim(
            $file->BasePath,
            '/\\'
        );

        $fullPath = $basePath . DIRECTORY_SEPARATOR . $relativePath;

        if (!File::exists($fullPath)) {
            return response()->json([
                'success' => false,
                'message' => 'الملف غير موجود على خادم التخزين.',
            ], 404);
        }

        return response()->file($fullPath, [
            'Content-Disposition' =>
                'inline; filename="' .
                rawurlencode($file->OriginalFileName) .
                '"',
        ]);
    }
}
