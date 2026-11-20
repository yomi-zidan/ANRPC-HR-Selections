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


// API Test
Route::get('/test', function () {
    return response()->json([
        'success' => true,
        'message' => 'ANRPC HR Selections API is working',
        'database' => 'ANRPC_HRSelections',
    ]);
});


// ==========================================
// Employee Authentication
// ==========================================

Route::post('/employee/login', [
    EmployeeAuthController::class,
    'login',
]);


// ==========================================
// Employee Submissions
// ==========================================

// Submission options
Route::get('/employee/submission-options', [
    SubmissionController::class,
    'options',
]);

// Create new submission
Route::post('/employee/submissions', [
    SubmissionController::class,
    'store',
]);
Route::get(
    '/employee/submissions/{id}',
    [SubmissionController::class, 'show']
);

// List logged-in employee submissions
Route::get('/employee/submissions', [
    SubmissionController::class,
    'index',
]);

// Get one submission for editing
Route::get('/employee/submissions/{id}/edit', [
    SubmissionController::class,
    'showForEdit',
]);

// Update employee submission
Route::put('/employee/submissions/{id}', [
    SubmissionController::class,
    'update',
]);

// Delete complete submission
Route::delete('/employee/submissions/{id}', [
    SubmissionController::class,
    'destroy',
]);

// Delete one attachment
Route::delete('/employee/submission-files/{fileId}', [
    SubmissionController::class,
    'deleteFile',
]);

// Preview employee attachment
Route::get('/employee/submission-files/{fileId}/preview', [
    SubmissionController::class,
    'previewFile',
]);


// ==========================================
// HR Authentication
// ==========================================

Route::post('/hr/login', [
    HRAuthController::class,
    'login',
]);


// ==========================================
// HR Dashboard
// ==========================================

Route::get('/hr/dashboard', [
    HRDashboardController::class,
    'index',
]);

Route::get('/hr/departments/{departmentId}/participants', [
    HRDashboardController::class,
    'participants',
]);


// ==========================================
// HR Submissions
// ==========================================

// Submission details
Route::get('/hr/submissions/{id}', [
    HRSubmissionController::class,
    'show',
]);

// Save or update evaluation
Route::post('/hr/submissions/{id}/evaluate', [
    HRSubmissionController::class,
    'evaluate',
]);

// Preview HR attachment
Route::get('/hr/submission-files/{fileId}', [
    HRSubmissionController::class,
    'file',
]);


// ==========================================
// HR Submissions Management
// ==========================================

Route::get('/hr/submissions', [
    HRManagementController::class,
    'submissions',
]);

// HR ranking
Route::get('/hr/ranking', [
    HRManagementController::class,
    'ranking',
]);


// ==========================================
// HR Criteria
// ==========================================

Route::get('/hr/criteria', [
    HRCriteriaController::class,
    'index',
]);

Route::post('/hr/criteria', [
    HRCriteriaController::class,
    'store',
]);

Route::put('/hr/criteria/{id}', [
    HRCriteriaController::class,
    'update',
]);


// ==========================================
// HR Settings
// ==========================================

Route::get('/hr/settings', [
    HRSettingsController::class,
    'index',
]);

Route::put('/hr/settings/contest', [
    HRSettingsController::class,
    'updateContest',
]);

Route::put('/hr/settings/storage/{id}', [
    HRSettingsController::class,
    'updateStorage',
]);
