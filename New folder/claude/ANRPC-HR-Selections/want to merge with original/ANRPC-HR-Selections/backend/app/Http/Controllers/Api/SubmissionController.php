<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;
use Illuminate\Contracts\Encryption\DecryptException;
use Symfony\Component\HttpFoundation\BinaryFileResponse;

class SubmissionController extends Controller
{
    /**
     * Get the authenticated employee number from the login token.
     */
    private function getEmployeeEmpn(Request $request): ?int
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
                !is_array($payload) ||
                empty($payload['empn']) ||
                empty($payload['expires_at']) ||
                (int) $payload['expires_at'] < now()->timestamp
            ) {
                return null;
            }

            return (int) $payload['empn'];

        } catch (DecryptException $e) {
            return null;
        }
    }

    /**
     * Return active criteria and file types.
     */
    public function options(Request $request)
    {
        if (!$this->getEmployeeEmpn($request)) {
            return response()->json([
                'success' => false,
                'message' => 'برجاء تسجيل الدخول مرة أخرى.',
            ], 401);
        }

        $criteria = DB::table('Criteria')
            ->where('IsActive', 1)
            ->orderBy('SortOrder')
            ->get([
                'Id',
                'NameAr',
            ]);

        $fileTypes = DB::table('FileTypes')
            ->where('IsActive', 1)
            ->orderBy('SortOrder')
            ->get([
                'Id',
                'NameAr',
            ]);

        $contest = DB::table('ContestSettings')
            ->where('IsActive', 1)
            ->orderByDesc('Id')
            ->first([
                'Id',
                'ContestName',
                'OpenDate',
                'DeadlineDate',
                'IsActive',
            ]);

        return response()->json([
            'success' => true,
            'criteria' => $criteria,
            'file_types' => $fileTypes,
            'contest' => $contest,
        ]);
    }

    /**
     * Save a new employee submission and its attachments.
     */
    public function store(Request $request)
    {
        // 1. Authenticate employee
        $empn = $this->getEmployeeEmpn($request);

        if (!$empn) {
            return response()->json([
                'success' => false,
                'message' => 'انتهت جلسة الدخول. برجاء تسجيل الدخول مرة أخرى.',
            ], 401);
        }

        // 2. Retrieve employee from T_MAST
        $employee = DB::table('dbo.T_MAST')
            ->where('empn', $empn)
            ->select([
                'empn',
                'code_edara',
            ])
            ->first();

        if (!$employee) {
            return response()->json([
                'success' => false,
                'message' => 'بيانات الموظف غير موجودة.',
            ], 404);
        }

        // 3. Validate fields and uploaded files
        $validator = Validator::make($request->all(), [
            'title' => ['required', 'string', 'max:300'],
            'submission_type' => ['required', 'integer', 'in:1,2'],
            'location' => ['nullable', 'string', 'max:200'],

            'team_members' => [
                'nullable',
                'required_if:submission_type,2',
                'string',
            ],

            'challenge' => ['required', 'string'],
            'efforts' => ['required', 'string'],
            'results' => ['required', 'string'],
            'impact' => ['required', 'string'],
            'inspiration' => ['nullable', 'string'],

            'criteria' => ['required', 'array', 'min:1'],
            'criteria.*' => ['required', 'integer', 'distinct'],

            'files' => ['required', 'array', 'min:1'],
            'files.*.file_type_id' => ['required', 'integer'],
            'files.*.file' => [
                'required',
                'file',
                'mimes:pdf,doc,docx,jpg,jpeg,png',
                'max:20480',
            ],
        ], [
            'title.required' => 'برجاء إدخال عنوان القصة.',
            'submission_type.required' => 'برجاء اختيار نوع الترشيح.',
            'team_members.required_if' => 'برجاء إدخال أعضاء الفريق.',
            'challenge.required' => 'برجاء إدخال طبيعة التحدي.',
            'efforts.required' => 'برجاء إدخال الجهود والحل المطبق.',
            'results.required' => 'برجاء إدخال النتائج بالأرقام.',
            'impact.required' => 'برجاء إدخال الأثر.',
            'criteria.required' => 'برجاء اختيار معايير الترشيح.',
            'criteria.min' => 'يجب اختيار معيار واحد على الأقل.',
            'files.required' => 'برجاء إرفاق ملف واحد على الأقل.',
            'files.min' => 'يجب إرفاق ملف واحد على الأقل.',
            'files.*.file_type_id.required' => 'برجاء تحديد نوع كل مرفق.',
            'files.*.file.required' => 'يوجد مرفق لم يتم اختياره.',
            'files.*.file.mimes' => 'المسموح PDF وWord والصور فقط.',
            'files.*.file.max' => 'الحد الأقصى لحجم الملف 20 ميجابايت.',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'برجاء مراجعة البيانات المدخلة.',
                'errors' => $validator->errors(),
            ], 422);
        }

        // 4. Check active contest and its dates
        $contest = DB::table('ContestSettings')
            ->where('IsActive', 1)
            ->orderByDesc('Id')
            ->first();

        if (!$contest) {
            return response()->json([
                'success' => false,
                'message' => 'لا توجد مسابقة نشطة حالياً.',
            ], 403);
        }

        if (now()->lt($contest->OpenDate)) {
            return response()->json([
                'success' => false,
                'message' => 'لم يبدأ التقديم بعد.',
            ], 403);
        }

        if (now()->gt($contest->DeadlineDate)) {
            return response()->json([
                'success' => false,
                'message' => 'انتهى موعد استقبال المشاركات.',
            ], 403);
        }

        // 5. Validate selected criteria against database
        $criteriaIds = array_map(
            'intval',
            $request->input('criteria')
        );

        $validCriteriaCount = DB::table('Criteria')
            ->where('IsActive', 1)
            ->whereIn('Id', $criteriaIds)
            ->count();

        if ($validCriteriaCount !== count($criteriaIds)) {
            return response()->json([
                'success' => false,
                'message' => 'يوجد معيار غير صحيح أو غير نشط.',
            ], 422);
        }

        // 6. Validate attachment types against database
        $fileItems = $request->input('files');

        $fileTypeIds = collect($fileItems)
            ->pluck('file_type_id')
            ->map(fn ($id) => (int) $id)
            ->unique()
            ->values()
            ->all();

        $validFileTypesCount = DB::table('FileTypes')
            ->where('IsActive', 1)
            ->whereIn('Id', $fileTypeIds)
            ->count();

        if ($validFileTypesCount !== count($fileTypeIds)) {
            return response()->json([
                'success' => false,
                'message' => 'يوجد نوع مرفق غير صحيح أو غير نشط.',
            ], 422);
        }

        // 7. Get active storage configuration
        $storage = DB::table('FileStorageSettings')
            ->where('IsActive', 1)
            ->orderByDesc('Id')
            ->first();

        if (!$storage || empty($storage->BasePath)) {
            return response()->json([
                'success' => false,
                'message' => 'مسار حفظ الملفات غير مضبوط في إعدادات النظام.',
            ], 500);
        }

        $basePath = rtrim($storage->BasePath, '\\/');

        // Create main folder if it does not exist
        if (!File::isDirectory($basePath)) {
            File::makeDirectory($basePath, 0755, true);
        }

        if (!File::isWritable($basePath)) {
            return response()->json([
                'success' => false,
                'message' => 'لا توجد صلاحية كتابة في مجلد المستندات.',
            ], 500);
        }

        // Employee folder: Documents/empn
        $employeeFolder = $basePath . DIRECTORY_SEPARATOR . $empn;

        if (!File::isDirectory($employeeFolder)) {
            File::makeDirectory($employeeFolder, 0755, true);
        }

        if (!File::isWritable($employeeFolder)) {
            return response()->json([
                'success' => false,
                'message' => 'لا توجد صلاحية كتابة في مجلد الموظف.',
            ], 500);
        }

        $savedPaths = [];

        try {
            $submissionId = DB::transaction(function () use (
                $request,
                $employee,
                $empn,
                $criteriaIds,
                $storage,
                $employeeFolder,
                &$savedPaths
            ) {
                $now = now();

                // 8. Insert submission
                $submissionId = DB::table('Submissions')->insertGetId([
                    'empn' => $empn,
                    'code_edara' => $employee->code_edara,
                    'Title' => $request->input('title'),
                    'SubmissionType' => (int) $request->input('submission_type'),
                    'Location' => $request->input('location'),
                    'TeamMembers' => $request->input('team_members'),
                    'Challenge' => $request->input('challenge'),
                    'Efforts' => $request->input('efforts'),
                    'Results' => $request->input('results'),
                    'Impact' => $request->input('impact'),
                    'Inspiration' => $request->input('inspiration'),
                    'CreatedAt' => $now,
                    'UpdatedAt' => $now,
                ], 'Id');

                // 9. Insert selected criteria
                $criteriaRows = [];

                foreach ($criteriaIds as $criterionId) {
                    $criteriaRows[] = [
                        'SubmissionId' => $submissionId,
                        'CriterionId' => $criterionId,
                    ];
                }

                DB::table('SubmissionCriteria')->insert($criteriaRows);

                // 10. Save each uploaded file
                foreach ($request->input('files') as $index => $fileItem) {
                    $uploadedFile = $request->file("files.$index.file");

                    if (!$uploadedFile || !$uploadedFile->isValid()) {
                        throw new \RuntimeException(
                            'تعذر قراءة أحد الملفات المرفقة.'
                        );
                    }

                    $fileTypeId = (int) $fileItem['file_type_id'];

                    $originalName = $uploadedFile->getClientOriginalName();
                    $extension = strtolower(
                        $uploadedFile->getClientOriginalExtension()
                    );

                    $storedName = Str::uuid()->toString() . '.' . $extension;

                    $fileSize = $uploadedFile->getSize();

                    $uploadedFile->move($employeeFolder, $storedName);

                    $absolutePath = $employeeFolder
                        . DIRECTORY_SEPARATOR
                        . $storedName;

                    $savedPaths[] = $absolutePath;

                    $relativePath = $empn . '/' . $storedName;

                    DB::table('SubmissionFiles')->insert([
                        'SubmissionId' => $submissionId,
                        'FileTypeId' => $fileTypeId,
                        'StorageId' => $storage->Id,
                        'OriginalFileName' => $originalName,
                        'StoredFileName' => $storedName,
                        'RelativePath' => $relativePath,
                        'FileSizeBytes' => $fileSize,
                        'UploadedAt' => $now,
                    ]);
                }

                return $submissionId;
            });

            return response()->json([
                'success' => true,
                'message' => 'تم حفظ المشاركة ورفع المرفقات بنجاح.',
                'submission_id' => $submissionId,
            ], 201);

        } catch (\Throwable $e) {
            // Delete files if database transaction fails
            foreach ($savedPaths as $path) {
                if (File::exists($path)) {
                    File::delete($path);
                }
            }

            report($e);

            return response()->json([
                'success' => false,
                'message' => 'حدث خطأ أثناء حفظ المشاركة.',
            ], 500);
        }
    }



public function index(Request $request): JsonResponse
{
    $empn = $this->getEmployeeEmpn($request);

    if (!$empn) {
        return response()->json([
            'success' => false,
            'message' => 'انتهت جلسة الدخول. برجاء تسجيل الدخول مرة أخرى.',
        ], 401);
    }

    $submissions = DB::table('Submissions')
        ->where('empn', $empn)
        ->orderByDesc('CreatedAt')
        ->get();

    $submissionIds = $submissions->pluck('Id')->all();

    $files = empty($submissionIds)
        ? collect()
        : DB::table('SubmissionFiles')
            ->join(
                'FileTypes',
                'SubmissionFiles.FileTypeId',
                '=',
                'FileTypes.Id'
            )
            ->whereIn('SubmissionFiles.SubmissionId', $submissionIds)
            ->select([
                'SubmissionFiles.Id',
                'SubmissionFiles.SubmissionId',
                'SubmissionFiles.OriginalFileName',
                'SubmissionFiles.FileTypeId',
                'FileTypes.NameAr as FileTypeName',
            ])
            ->get()
            ->groupBy('SubmissionId');

    $criteria = empty($submissionIds)
        ? collect()
        : DB::table('SubmissionCriteria')
            ->join(
                'Criteria',
                'SubmissionCriteria.CriterionId',
                '=',
                'Criteria.Id'
            )
            ->whereIn('SubmissionCriteria.SubmissionId', $submissionIds)
            ->select([
                'SubmissionCriteria.SubmissionId',
                'Criteria.NameAr',
            ])
            ->get()
            ->groupBy('SubmissionId');

    $result = $submissions->map(function ($submission) use ($files, $criteria) {
        return [
            'id' => $submission->Id,
            'title' => $submission->Title,
            'submission_type' => $submission->SubmissionType,
            'location' => $submission->Location,
            'created_at' => $submission->CreatedAt,
            'updated_at' => $submission->UpdatedAt,
            'files' => $files->get($submission->Id, collect())->values(),
            'criteria' => $criteria->get($submission->Id, collect())->values(),
        ];
    });

    return response()->json([
        'success' => true,
        'submissions' => $result,
        'total' => $result->count(),
    ]);
}

/**
 * Return a submission's full details to its owning employee.
 */
public function show(Request $request, int $id): JsonResponse
{
    $empn = $this->getEmployeeEmpn($request);

    if (!$empn) {
        return response()->json([
            'success' => false,
            'message' => 'انتهت جلسة الدخول. برجاء تسجيل الدخول مرة أخرى.',
        ], 401);
    }

    $submission = DB::table('dbo.Submissions as S')
        ->leftJoin('dbo.T_Edarat as E', 'S.code_edara', '=', 'E.edara_code')
        ->where('S.Id', $id)
        ->where('S.empn', $empn)
        ->select([
            'S.Id as id',
            'S.empn',
            'S.code_edara as department_id',
            'E.edara_text as department_name',
            'S.Title as title',
            'S.SubmissionType as submission_type',
            'S.Location as location',
            'S.TeamMembers as team_members',
            'S.Challenge as challenge',
            'S.Efforts as efforts',
            'S.Results as results',
            'S.Impact as impact',
            'S.Inspiration as inspiration',
            'S.CreatedAt as created_at',
            'S.UpdatedAt as updated_at',
        ])
        ->first();

    if (!$submission) {
        return response()->json([
            'success' => false,
            'message' => 'المشاركة غير موجودة.',
        ], 404);
    }

    $submission->criteria = DB::table('dbo.SubmissionCriteria as SC')
        ->join('dbo.Criteria as C', 'SC.CriterionId', '=', 'C.Id')
        ->where('SC.SubmissionId', $id)
        ->orderBy('C.SortOrder')
        ->select([
            'C.Id as id',
            'C.NameAr as name',
        ])
        ->get();

    $submission->files = DB::table('dbo.SubmissionFiles as F')
        ->leftJoin('dbo.FileTypes as FT', 'F.FileTypeId', '=', 'FT.Id')
        ->where('F.SubmissionId', $id)
        ->orderBy('F.UploadedAt')
        ->select([
            'F.Id as id',
            'F.OriginalFileName as name',
            'FT.NameAr as type_name',
            'F.FileSizeBytes as size',
            'F.UploadedAt as uploaded_at',
        ])
        ->get();

    return response()->json([
        'success' => true,
        'submission' => $submission,
    ]);
}

/**
 * Stream an attachment only when it belongs to the authenticated employee.
 */
public function file(Request $request, int $fileId): JsonResponse|BinaryFileResponse
{
    $empn = $this->getEmployeeEmpn($request);

    if (!$empn) {
        return response()->json([
            'success' => false,
            'message' => 'انتهت جلسة الدخول. برجاء تسجيل الدخول مرة أخرى.',
        ], 401);
    }

    $file = DB::table('dbo.SubmissionFiles as F')
        ->join('dbo.Submissions as S', 'F.SubmissionId', '=', 'S.Id')
        ->join('dbo.FileStorageSettings as FS', 'F.StorageId', '=', 'FS.Id')
        ->where('F.Id', $fileId)
        ->where('S.empn', $empn)
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

    $basePath = realpath($file->BasePath);
    if (!$basePath || !is_dir($basePath)) {
        return response()->json([
            'success' => false,
            'message' => 'مجلد تخزين الملفات غير موجود.',
        ], 404);
    }

    $relativePath = str_replace(['/', '\\'], DIRECTORY_SEPARATOR, $file->RelativePath);
    if (
        $relativePath === '' ||
        str_contains($relativePath, '..') ||
        str_starts_with($relativePath, DIRECTORY_SEPARATOR)
    ) {
        return response()->json([
            'success' => false,
            'message' => 'مسار الملف غير صالح.',
        ], 400);
    }

    $fullPath = realpath($basePath . DIRECTORY_SEPARATOR . $relativePath);
    $normalizedBase = rtrim($basePath, DIRECTORY_SEPARATOR) . DIRECTORY_SEPARATOR;

    if (
        !$fullPath ||
        !is_file($fullPath) ||
        !str_starts_with(strtolower($fullPath), strtolower($normalizedBase))
    ) {
        return response()->json([
            'success' => false,
            'message' => 'الملف غير موجود أو مساره غير صالح.',
        ], 404);
    }

    return response()->file($fullPath, [
        'Content-Type' => File::mimeType($fullPath) ?: 'application/octet-stream',
        'Content-Disposition' => 'inline',
        'X-Content-Type-Options' => 'nosniff',
        'Cache-Control' => 'private, no-store, no-cache, must-revalidate',
    ]);
}

}
