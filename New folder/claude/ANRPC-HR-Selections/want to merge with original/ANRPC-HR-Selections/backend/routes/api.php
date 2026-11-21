<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\EmployeeAuthController;
use App\Http\Controllers\Api\HRAuthController;
use App\Http\Controllers\Api\SubmissionController;
use App\Http\Controllers\Api\HRDashboardController;
use App\Http\Controllers\Api\HRSubmissionController;
use App\Http\Controllers\Api\HRManagementController;
use App\Http\Controllers\Api\HRCriteriaController;
use App\Http\Controllers\Api\HRSettingsController;



Route::get('/test', function () {
    return response()->json([
        'success' => true,
        'message' => 'ANRPC HR Selections API is working',
        'database' => 'ANRPC_HRSelections',
    ]);
});

// Employee login
Route::post('/employee/login', [
    EmployeeAuthController::class,
    'login',
]);

// HR Authentication
Route::post('/hr/login', [
    HRAuthController::class,
    'login',
]);

// Employee submission options
Route::get('/employee/submission-options', [
    SubmissionController::class,
    'options',
]);

// Save new employee submission
Route::post('/employee/submissions', [
    SubmissionController::class,
    'store',
]);

Route::get('/employee/submissions', [
    SubmissionController::class,
    'index',
]);

Route::get('/employee/submissions/{id}', [
    SubmissionController::class,
    'show',
]);

Route::get('/employee/submission-files/{fileId}', [
    SubmissionController::class,
    'file',
]);


// HR Dashboard
Route::get('/hr/dashboard', [
    HRDashboardController::class,
    'index',
]);


Route::get('/hr/departments/{departmentId}/participants', [
    HRDashboardController::class,
    'participants',
]);


// HR submission details
Route::get('/hr/submissions/{id}', [
    HRSubmissionController::class,
    'show',
]);

// Save or update evaluation
Route::post('/hr/submissions/{id}/evaluate', [
    HRSubmissionController::class,
    'evaluate',
]);

// Preview submission attachment
Route::get('/hr/submission-files/{fileId}', [
    HRSubmissionController::class,
    'file',
]);


// HR submissions management
Route::get('/hr/submissions', [
    HRManagementController::class,
    'submissions',
]);

// HR ranking
Route::get('/hr/ranking', [
    HRManagementController::class,
    'ranking',
]);

// HR Criteria
Route::get('/hr/criteria', [HRCriteriaController::class, 'index']);
Route::post('/hr/criteria', [HRCriteriaController::class, 'store']);
Route::put('/hr/criteria/{id}', [HRCriteriaController::class, 'update']);

// HR Settings
Route::get('/hr/settings', [HRSettingsController::class, 'index']);
Route::put('/hr/settings/contest', [HRSettingsController::class, 'updateContest']);
Route::put('/hr/settings/storage/{id}', [HRSettingsController::class, 'updateStorage']);
