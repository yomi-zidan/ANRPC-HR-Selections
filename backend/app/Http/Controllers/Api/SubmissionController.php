<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;
use Illuminate\Contracts\Encryption\DecryptException;
use Symfony\Component\HttpFoundation\Response;

class SubmissionController extends Controller
{
    /*
    |--------------------------------------------------------------------------
    | Authentication
    |--------------------------------------------------------------------------
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

    private function unauthorizedResponse()
    {
        return response()->json([
            'success' => false,
            'message' => 'انتهت جلسة الدخول. برجاء تسجيل الدخول مرة أخرى.',
        ], 401);
    }

    /*
    |--------------------------------------------------------------------------
    | Submission Ownership
    |--------------------------------------------------------------------------
    */

    private function findEmployeeSubmission(int $id, int $empn)
    {
        return DB::table('Submissions')
            ->where('Id', $id)
            ->where('empn', $empn)
            ->first();
    }

    /*
    |--------------------------------------------------------------------------
    | Contest Deadline
    |--------------------------------------------------------------------------
    */

    private function getEditableContest()
    {
        $contest = DB::table('ContestSettings')
            ->where('IsActive', 1)
            ->orderByDesc('Id')
            ->first();

        if (!$contest) {
            return [
                'allowed' => false,
                'message' => 'لا توجد مسابقة نشطة حالياً.',
            ];
        }

        if (now()->gte($contest->DeadlineDate)) {
            return [
                'allowed' => false,
                'message' => 'انتهى موعد التعديل والحذف.',
            ];
        }

        return [
            'allowed' => true,
            'contest' => $contest,
        ];
    }

    /*
    |--------------------------------------------------------------------------
    | File Storage Helpers
    |--------------------------------------------------------------------------
    */

    private function getActiveStorage()
    {
        return DB::table('FileStorageSettings')
            ->where('IsActive', 1)
            ->orderByDesc('Id')
            ->first();
    }

    private function resolveStoredFilePath(
        string $basePath,
        string $relativePath
    ): ?string {

        $baseRealPath = realpath($basePath);

        if (!$baseRealPath) {
            return null;
        }

        // Normalize separators.
        $relativePath = str_replace(
            ['/', '\\'],
            DIRECTORY_SEPARATOR,
            $relativePath
        );

        // Reject absolute paths and traversal.
        if (
            str_starts_with($relativePath, DIRECTORY_SEPARATOR) ||
            preg_match('/^[A-Za-z]:/', $relativePath)
        ) {
            return null;
        }

        $segments = explode(DIRECTORY_SEPARATOR, $relativePath);

        if (in_array('..', $segments, true)) {
            return null;
        }

        $fullPath = realpath(
            $baseRealPath . DIRECTORY_SEPARATOR . $relativePath
        );

        if (!$fullPath || !File::isFile($fullPath)) {
            return null;
        }

        $normalizedBase = rtrim(
            str_replace('\\', '/', $baseRealPath),
            '/'
        ) . '/';

        $normalizedFile = str_replace('\\', '/', $fullPath);

        if (stripos($normalizedFile, $normalizedBase) !== 0) {
            return null;
        }

        return $fullPath;
    }

    private function saveUploadedFile(
        $uploadedFile,
        int $empn,
        int $submissionId,
        int $fileTypeId,
        $storage,
        string $employeeFolder
    ): string {

        if (!$uploadedFile || !$uploadedFile->isValid()) {
            throw new \RuntimeException(
                'تعذر قراءة أحد الملفات المرفقة.'
            );
        }

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

        $relativePath = $empn . '/' . $storedName;

        DB::table('SubmissionFiles')->insert([
            'SubmissionId' => $submissionId,
            'FileTypeId' => $fileTypeId,
            'StorageId' => $storage->Id,
            'OriginalFileName' => $originalName,
            'StoredFileName' => $storedName,
            'RelativePath' => $relativePath,
            'FileSizeBytes' => $fileSize,
            'UploadedAt' => now(),
        ]);

        return $absolutePath;
    }

    private function prepareEmployeeFolder(int $empn, $storage)
    {
        if (!$storage || empty($storage->BasePath)) {
            throw new \RuntimeException(
                'مسار حفظ الملفات غير مضبوط في إعدادات النظام.'
            );
        }

        $basePath = rtrim($storage->BasePath, '\\/');

        if (!File::isDirectory($basePath)) {
            File::makeDirectory($basePath, 0755, true);
        }

        if (!File::isWritable($basePath)) {
            throw new \RuntimeException(
                'لا توجد صلاحية كتابة في مجلد المستندات.'
            );
        }

        $employeeFolder = $basePath
            . DIRECTORY_SEPARATOR
            . $empn;

        if (!File::isDirectory($employeeFolder)) {
            File::makeDirectory($employeeFolder, 0755, true);
        }

        if (!File::isWritable($employeeFolder)) {
            throw new \RuntimeException(
                'لا توجد صلاحية كتابة في مجلد الموظف.'
            );
        }

        return $employeeFolder;
    }

    /*
    |--------------------------------------------------------------------------
    | Options
    |--------------------------------------------------------------------------
    */

    public function options(Request $request)
    {
        if (!$this->getEmployeeEmpn($request)) {
            return $this->unauthorizedResponse();
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

    /*
    |--------------------------------------------------------------------------
    | Create Submission
    |--------------------------------------------------------------------------
    */

    public function store(Request $request)
    {
        $empn = $this->getEmployeeEmpn($request);

        if (!$empn) {
            return $this->unauthorizedResponse();
        }

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

        if (now()->gte($contest->DeadlineDate)) {
            return response()->json([
                'success' => false,
                'message' => 'انتهى موعد استقبال المشاركات.',
            ], 403);
        }

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

        $fileItems = $request->input('files');

        $fileTypeIds = collect($fileItems)
            ->pluck('file_type_id')
            ->map(fn ($value) => (int) $value)
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

        $storage = $this->getActiveStorage();

        try {
            $employeeFolder = $this->prepareEmployeeFolder(
                $empn,
                $storage
            );
        } catch (\Throwable $e) {
            report($e);

            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
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

                $criteriaRows = [];

                foreach ($criteriaIds as $criterionId) {
                    $criteriaRows[] = [
                        'SubmissionId' => $submissionId,
                        'CriterionId' => $criterionId,
                    ];
                }

                DB::table('SubmissionCriteria')->insert($criteriaRows);

                foreach ($request->input('files') as $index => $fileItem) {
                    $uploadedFile = $request->file("files.$index.file");

                    $path = $this->saveUploadedFile(
                        $uploadedFile,
                        $empn,
                        $submissionId,
                        (int) $fileItem['file_type_id'],
                        $storage,
                        $employeeFolder
                    );

                    $savedPaths[] = $path;
                }

                return $submissionId;
            });

            return response()->json([
                'success' => true,
                'message' => 'تم حفظ المشاركة ورفع المرفقات بنجاح.',
                'submission_id' => $submissionId,
            ], 201);

        } catch (\Throwable $e) {
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

    /*
    |--------------------------------------------------------------------------
    | Employee Submissions List
    |--------------------------------------------------------------------------
    */

    public function index(Request $request)
    {
        $empn = $this->getEmployeeEmpn($request);

        if (!$empn) {
            return $this->unauthorizedResponse();
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

        $result = $submissions->map(function ($submission) use (
            $files,
            $criteria
        ) {
            return [
                'id' => $submission->Id,
                'title' => $submission->Title,
                'submission_type' => $submission->SubmissionType,
                'location' => $submission->Location,
                'created_at' => $submission->CreatedAt,
                'updated_at' => $submission->UpdatedAt,
                'files' => $files->get(
                    $submission->Id,
                    collect()
                )->values(),
                'criteria' => $criteria->get(
                    $submission->Id,
                    collect()
                )->values(),
            ];
        });

        return response()->json([
            'success' => true,
            'submissions' => $result,
            'total' => $result->count(),
        ]);
    }

    /*
    |--------------------------------------------------------------------------
    | Get Submission for Editing
    |--------------------------------------------------------------------------
    */


public function show(Request $request, int $id)
{
    $empn = $this->getEmployeeEmpn($request);

    if (!$empn) {
        return $this->unauthorizedResponse();
    }

    // التأكد أن المشاركة تخص الموظف الحالي
    $submission = $this->findEmployeeSubmission($id, $empn);

    if (!$submission) {
        return response()->json([
            'success' => false,
            'message' => 'المشاركة غير موجودة أو لا تملك صلاحية الوصول إليها.',
        ], 404);
    }

    // بيانات الموظف
    $employee = DB::table('T_MAST')
        ->leftJoin(
            'T_Edarat',
            'T_MAST.code_edara',
            '=',
            'T_Edarat.edara_code'
        )
        ->where('T_MAST.empn', $empn)
        ->select([
            'T_MAST.empn',
            'T_MAST.ename',
            'T_MAST.code_wazifa',
            'T_MAST.code_edara',
            'T_Edarat.edara_text',
        ])
        ->first();

    // معايير المشاركة
    $criteria = DB::table('SubmissionCriteria')
        ->join(
            'Criteria',
            'SubmissionCriteria.CriterionId',
            '=',
            'Criteria.Id'
        )
        ->where('SubmissionCriteria.SubmissionId', $id)
        ->orderBy('Criteria.SortOrder')
        ->get([
            'Criteria.Id',
            'Criteria.NameAr',
        ]);

    // المرفقات
    $files = DB::table('SubmissionFiles')
        ->join(
            'FileTypes',
            'SubmissionFiles.FileTypeId',
            '=',
            'FileTypes.Id'
        )
        ->where('SubmissionFiles.SubmissionId', $id)
        ->orderBy('SubmissionFiles.Id')
        ->get([
            'SubmissionFiles.Id',
            'SubmissionFiles.FileTypeId',
            'SubmissionFiles.OriginalFileName',
            'SubmissionFiles.FileSizeBytes',
            'SubmissionFiles.UploadedAt',
            'FileTypes.NameAr as FileTypeName',
        ]);

    // الموعد النهائي وحالة السماح بالتعديل
    $contest = DB::table('ContestSettings')
        ->where('IsActive', 1)
        ->orderByDesc('Id')
        ->first();

    $deadline = $contest?->DeadlineDate;

    $editable = $contest
        && now()->lt($contest->DeadlineDate);

    return response()->json([
        'success' => true,

        'submission' => [
            'id' => $submission->Id,
            'title' => $submission->Title,
            'submission_type' => $submission->SubmissionType,
            'location' => $submission->Location,
            'team_members' => $submission->TeamMembers,
            'challenge' => $submission->Challenge,
            'efforts' => $submission->Efforts,
            'results' => $submission->Results,
            'impact' => $submission->Impact,
            'inspiration' => $submission->Inspiration,
            'created_at' => $submission->CreatedAt,
            'updated_at' => $submission->UpdatedAt,
        ],

        'employee' => $employee,

        'criteria' => $criteria,

        'files' => $files,

        'deadline' => $deadline,

        'editable' => (bool) $editable,
    ]);
}


    public function showForEdit(Request $request, int $id)
    {
        $empn = $this->getEmployeeEmpn($request);

        if (!$empn) {
            return $this->unauthorizedResponse();
        }

        $contestCheck = $this->getEditableContest();

        if (!$contestCheck['allowed']) {
            return response()->json([
                'success' => false,
                'message' => $contestCheck['message'],
                'editable' => false,
            ], 403);
        }

        $submission = $this->findEmployeeSubmission($id, $empn);

        if (!$submission) {
            return response()->json([
                'success' => false,
                'message' => 'المشاركة غير موجودة أو لا تملك صلاحية الوصول إليها.',
            ], 404);
        }

        $criteria = DB::table('SubmissionCriteria')
            ->where('SubmissionId', $id)
            ->pluck('CriterionId')
            ->map(fn ($value) => (int) $value)
            ->values();

        $files = DB::table('SubmissionFiles')
            ->join(
                'FileTypes',
                'SubmissionFiles.FileTypeId',
                '=',
                'FileTypes.Id'
            )
            ->where('SubmissionFiles.SubmissionId', $id)
            ->select([
                'SubmissionFiles.Id',
                'SubmissionFiles.FileTypeId',
                'SubmissionFiles.OriginalFileName',
                'SubmissionFiles.FileSizeBytes',
                'SubmissionFiles.UploadedAt',
                'FileTypes.NameAr as FileTypeName',
            ])
            ->get();

        $criteriaOptions = DB::table('Criteria')
            ->where('IsActive', 1)
            ->orderBy('SortOrder')
            ->get(['Id', 'NameAr']);

        $fileTypes = DB::table('FileTypes')
            ->where('IsActive', 1)
            ->orderBy('SortOrder')
            ->get(['Id', 'NameAr']);

        return response()->json([
            'success' => true,
            'editable' => true,

            'submission' => [
                'id' => $submission->Id,
                'title' => $submission->Title,
                'submission_type' => $submission->SubmissionType,
                'location' => $submission->Location,
                'team_members' => $submission->TeamMembers,
                'challenge' => $submission->Challenge,
                'efforts' => $submission->Efforts,
                'results' => $submission->Results,
                'impact' => $submission->Impact,
                'inspiration' => $submission->Inspiration,
            ],

            'criteria' => $criteria,
            'criteria_options' => $criteriaOptions,
            'files' => $files,
            'file_types' => $fileTypes,
            'deadline' => $contestCheck['contest']->DeadlineDate,
        ]);
    }

    /*
    |--------------------------------------------------------------------------
    | Update Submission
    |--------------------------------------------------------------------------
    */

    public function update(Request $request, int $id)
    {
        $empn = $this->getEmployeeEmpn($request);

        if (!$empn) {
            return $this->unauthorizedResponse();
        }

        $contestCheck = $this->getEditableContest();

        if (!$contestCheck['allowed']) {
            return response()->json([
                'success' => false,
                'message' => $contestCheck['message'],
            ], 403);
        }

        $submission = $this->findEmployeeSubmission($id, $empn);

        if (!$submission) {
            return response()->json([
                'success' => false,
                'message' => 'المشاركة غير موجودة أو لا تملك صلاحية تعديلها.',
            ], 404);
        }

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

            'files' => ['nullable', 'array'],
            'files.*.file_type_id' => ['required', 'integer'],
            'files.*.file' => [
                'required',
                'file',
                'mimes:pdf,doc,docx,jpg,jpeg,png',
                'max:20480',
            ],
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'برجاء مراجعة البيانات المدخلة.',
                'errors' => $validator->errors(),
            ], 422);
        }

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

        $newFiles = $request->file('files', []);

        if (!is_array($newFiles)) {
            $newFiles = [];
        }

        $fileItems = $request->input('files', []);

        $fileTypeIds = collect($fileItems)
            ->pluck('file_type_id')
            ->filter()
            ->map(fn ($value) => (int) $value)
            ->unique()
            ->values()
            ->all();

        if (count($fileTypeIds) > 0) {
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
        }

        $storage = null;
        $employeeFolder = null;

        if (count($newFiles) > 0) {
            $storage = $this->getActiveStorage();

            try {
                $employeeFolder = $this->prepareEmployeeFolder(
                    $empn,
                    $storage
                );
            } catch (\Throwable $e) {
                report($e);

                return response()->json([
                    'success' => false,
                    'message' => $e->getMessage(),
                ], 500);
            }
        }

        $savedPaths = [];

        try {
            DB::transaction(function () use (
                $request,
                $id,
                $empn,
                $criteriaIds,
                $newFiles,
                $fileItems,
                $storage,
                $employeeFolder,
                &$savedPaths
            ) {
                $lockedSubmission = DB::table('Submissions')
                    ->where('Id', $id)
                    ->where('empn', $empn)
                    ->lockForUpdate()
                    ->first();

                if (!$lockedSubmission) {
                    throw new \RuntimeException(
                        'المشاركة غير موجودة أو لا تملك صلاحية تعديلها.'
                    );
                }

                $contest = DB::table('ContestSettings')
                    ->where('IsActive', 1)
                    ->orderByDesc('Id')
                    ->first();

                if (!$contest || now()->gte($contest->DeadlineDate)) {
                    throw new \RuntimeException(
                        'انتهى موعد التعديل.'
                    );
                }

                $now = now();

                DB::table('Submissions')
                    ->where('Id', $id)
                    ->where('empn', $empn)
                    ->update([
                        'Title' => $request->input('title'),
                        'SubmissionType' => (int) $request->input('submission_type'),
                        'Location' => $request->input('location'),
                        'TeamMembers' => $request->input('team_members'),
                        'Challenge' => $request->input('challenge'),
                        'Efforts' => $request->input('efforts'),
                        'Results' => $request->input('results'),
                        'Impact' => $request->input('impact'),
                        'Inspiration' => $request->input('inspiration'),
                        'UpdatedAt' => $now,
                    ]);

                DB::table('SubmissionCriteria')
                    ->where('SubmissionId', $id)
                    ->delete();

                $criteriaRows = [];

                foreach ($criteriaIds as $criterionId) {
                    $criteriaRows[] = [
                        'SubmissionId' => $id,
                        'CriterionId' => $criterionId,
                    ];
                }

                DB::table('SubmissionCriteria')->insert($criteriaRows);

                foreach ($newFiles as $index => $uploadedFile) {
                    $fileTypeId = (int) $fileItems[$index]['file_type_id'];

                    $path = $this->saveUploadedFile(
                        $uploadedFile,
                        $empn,
                        $id,
                        $fileTypeId,
                        $storage,
                        $employeeFolder
                    );

                    $savedPaths[] = $path;
                }
            });

            return response()->json([
                'success' => true,
                'message' => 'تم تعديل المشاركة بنجاح.',
            ]);

        } catch (\Throwable $e) {
            foreach ($savedPaths as $path) {
                if (File::exists($path)) {
                    File::delete($path);
                }
            }

            report($e);

            $message = $e->getMessage();

            $status = str_contains($message, 'انتهى موعد التعديل')
                ? 403
                : (
                    str_contains($message, 'لا تملك صلاحية')
                    ? 404
                    : 500
                );

            return response()->json([
                'success' => false,
                'message' => $status === 500
                    ? 'حدث خطأ أثناء تعديل المشاركة.'
                    : $message,
            ], $status);
        }
    }

    /*
    |--------------------------------------------------------------------------
    | Delete One Attachment
    |--------------------------------------------------------------------------
    */

    public function deleteFile(Request $request, int $fileId)
    {
        $empn = $this->getEmployeeEmpn($request);

        if (!$empn) {
            return $this->unauthorizedResponse();
        }

        $contestCheck = $this->getEditableContest();

        if (!$contestCheck['allowed']) {
            return response()->json([
                'success' => false,
                'message' => $contestCheck['message'],
            ], 403);
        }

        $file = DB::table('SubmissionFiles')
            ->join(
                'Submissions',
                'SubmissionFiles.SubmissionId',
                '=',
                'Submissions.Id'
            )
            ->where('SubmissionFiles.Id', $fileId)
            ->where('Submissions.empn', $empn)
            ->select([
                'SubmissionFiles.Id',
                'SubmissionFiles.SubmissionId',
                'SubmissionFiles.StorageId',
                'SubmissionFiles.RelativePath',
            ])
            ->first();

        if (!$file) {
            return response()->json([
                'success' => false,
                'message' => 'المرفق غير موجود أو لا تملك صلاحية حذفه.',
            ], 404);
        }

        $storage = DB::table('FileStorageSettings')
            ->where('Id', $file->StorageId)
            ->first();

        if (!$storage || empty($storage->BasePath)) {
            return response()->json([
                'success' => false,
                'message' => 'تعذر تحديد مسار المرفق.',
            ], 500);
        }

        $absolutePath = $this->resolveStoredFilePath(
            $storage->BasePath,
            $file->RelativePath
        );

        if (!$absolutePath) {
            return response()->json([
                'success' => false,
                'message' => 'تعذر الوصول إلى ملف المرفق بأمان.',
            ], 500);
        }

        try {
            DB::transaction(function () use (
                $file,
                $fileId,
                $empn
            ) {
                $submission = DB::table('Submissions')
                    ->where('Id', $file->SubmissionId)
                    ->where('empn', $empn)
                    ->lockForUpdate()
                    ->first();

                if (!$submission) {
                    throw new \RuntimeException(
                        'المشاركة غير موجودة أو لا تملك صلاحية الوصول إليها.'
                    );
                }

                $contest = DB::table('ContestSettings')
                    ->where('IsActive', 1)
                    ->orderByDesc('Id')
                    ->first();

                if (!$contest || now()->gte($contest->DeadlineDate)) {
                    throw new \RuntimeException(
                        'انتهى موعد التعديل.'
                    );
                }

                DB::table('SubmissionFiles')
                    ->where('Id', $fileId)
                    ->where('SubmissionId', $file->SubmissionId)
                    ->delete();

                DB::table('Submissions')
                    ->where('Id', $file->SubmissionId)
                    ->update([
                        'UpdatedAt' => now(),
                    ]);
            });

            if (File::exists($absolutePath)) {
                File::delete($absolutePath);
            }

            return response()->json([
                'success' => true,
                'message' => 'تم حذف المرفق بنجاح.',
            ]);

        } catch (\Throwable $e) {
            report($e);

            $message = $e->getMessage();

            $status = str_contains($message, 'انتهى موعد التعديل')
                ? 403
                : 422;

            return response()->json([
                'success' => false,
                'message' => $message,
            ], $status);
        }
    }

    /*
    |--------------------------------------------------------------------------
    | Preview Attachment
    |--------------------------------------------------------------------------
    */

    public function previewFile(Request $request, int $fileId)
    {
        $empn = $this->getEmployeeEmpn($request);

        if (!$empn) {
            return $this->unauthorizedResponse();
        }

        // Only files belonging to this employee's submissions.
        $file = DB::table('SubmissionFiles')
            ->join(
                'Submissions',
                'SubmissionFiles.SubmissionId',
                '=',
                'Submissions.Id'
            )
            ->where('SubmissionFiles.Id', $fileId)
            ->where('Submissions.empn', $empn)
            ->select([
                'SubmissionFiles.Id',
                'SubmissionFiles.OriginalFileName',
                'SubmissionFiles.StoredFileName',
                'SubmissionFiles.RelativePath',
                'SubmissionFiles.StorageId',
            ])
            ->first();

        if (!$file) {
            return response()->json([
                'success' => false,
                'message' => 'المرفق غير موجود أو لا تملك صلاحية عرضه.',
            ], 404);
        }

        $storage = DB::table('FileStorageSettings')
            ->where('Id', $file->StorageId)
            ->first();

        if (!$storage || empty($storage->BasePath)) {
            return response()->json([
                'success' => false,
                'message' => 'تعذر تحديد مسار المرفق.',
            ], 500);
        }

        $absolutePath = $this->resolveStoredFilePath(
            $storage->BasePath,
            $file->RelativePath
        );

        if (!$absolutePath) {
            return response()->json([
                'success' => false,
                'message' => 'الملف غير موجود على الخادم.',
            ], 404);
        }

        $extension = strtolower(
            pathinfo($file->OriginalFileName, PATHINFO_EXTENSION)
        );

        $mimeTypes = [
            'pdf' => 'application/pdf',
            'jpg' => 'image/jpeg',
            'jpeg' => 'image/jpeg',
            'png' => 'image/png',
            'doc' => 'application/msword',
            'docx' => 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        ];

        $mimeType = $mimeTypes[$extension] ?? 'application/octet-stream';

        return response()->file($absolutePath, [
            'Content-Type' => $mimeType,
            'Content-Disposition' => 'inline; filename="' .
                rawurlencode($file->OriginalFileName) . '"',
            'X-Content-Type-Options' => 'nosniff',
            'Cache-Control' => 'private, no-store, max-age=0',
        ]);
    }

    /*
    |--------------------------------------------------------------------------
    | Delete Complete Submission
    |--------------------------------------------------------------------------
    */

    public function destroy(Request $request, int $id)
    {
        $empn = $this->getEmployeeEmpn($request);

        if (!$empn) {
            return $this->unauthorizedResponse();
        }

        $contestCheck = $this->getEditableContest();

        if (!$contestCheck['allowed']) {
            return response()->json([
                'success' => false,
                'message' => $contestCheck['message'],
            ], 403);
        }

        $submission = $this->findEmployeeSubmission($id, $empn);

        if (!$submission) {
            return response()->json([
                'success' => false,
                'message' => 'المشاركة غير موجودة أو لا تملك صلاحية حذفها.',
            ], 404);
        }

        $files = DB::table('SubmissionFiles')
            ->where('SubmissionId', $id)
            ->get([
                'Id',
                'StorageId',
                'RelativePath',
            ]);

        $pathsToDelete = [];

        foreach ($files as $file) {
            $storage = DB::table('FileStorageSettings')
                ->where('Id', $file->StorageId)
                ->first();

            if (!$storage || empty($storage->BasePath)) {
                return response()->json([
                    'success' => false,
                    'message' => 'تعذر تحديد مسار أحد المرفقات. لم يتم حذف المشاركة.',
                ], 500);
            }

            $absolutePath = $this->resolveStoredFilePath(
                $storage->BasePath,
                $file->RelativePath
            );

            if (!$absolutePath) {
                return response()->json([
                    'success' => false,
                    'message' => 'تعذر الوصول إلى أحد المرفقات بأمان. لم يتم حذف المشاركة.',
                ], 500);
            }

            $pathsToDelete[] = $absolutePath;
        }

        try {
            DB::transaction(function () use ($id, $empn) {
                $lockedSubmission = DB::table('Submissions')
                    ->where('Id', $id)
                    ->where('empn', $empn)
                    ->lockForUpdate()
                    ->first();

                if (!$lockedSubmission) {
                    throw new \RuntimeException(
                        'المشاركة غير موجودة أو لا تملك صلاحية حذفها.'
                    );
                }

                $contest = DB::table('ContestSettings')
                    ->where('IsActive', 1)
                    ->orderByDesc('Id')
                    ->first();

                if (!$contest || now()->gte($contest->DeadlineDate)) {
                    throw new \RuntimeException(
                        'انتهى موعد الحذف.'
                    );
                }

                // Preserve all committee reviews.
                $hasReviews = DB::table('Reviews')
                    ->where('SubmissionId', $id)
                    ->exists();

                if ($hasReviews) {
                    throw new \RuntimeException(
                        'لا يمكن حذف المشاركة لأنها تحتوي على تقييمات من اللجنة.'
                    );
                }

                DB::table('SubmissionCriteria')
                    ->where('SubmissionId', $id)
                    ->delete();

                DB::table('SubmissionFiles')
                    ->where('SubmissionId', $id)
                    ->delete();

                DB::table('Submissions')
                    ->where('Id', $id)
                    ->where('empn', $empn)
                    ->delete();
            });

            foreach ($pathsToDelete as $path) {
                if (File::exists($path)) {
                    File::delete($path);
                }
            }

            return response()->json([
                'success' => true,
                'message' => 'تم حذف المشاركة ومرفقاتها بنجاح.',
            ]);

        } catch (\Throwable $e) {
            report($e);

            $message = $e->getMessage();

            $status = str_contains($message, 'انتهى موعد الحذف')
                ? 403
                : (
                    str_contains($message, 'تقييمات من اللجنة')
                    ? 422
                    : 404
                );

            return response()->json([
                'success' => false,
                'message' => $message,
            ], $status);
        }
    }
}
