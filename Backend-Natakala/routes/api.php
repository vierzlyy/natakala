<?php

use App\Http\Controllers\AuditTrailController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\CategoryController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\DocumentController;
use App\Http\Controllers\ProductController;
use App\Http\Controllers\ReportController;
use App\Http\Controllers\SettingController;
use App\Http\Controllers\StockOpnameController;
use App\Http\Controllers\SupplierController;
use App\Http\Controllers\TransactionInController;
use App\Http\Controllers\TransactionOutController;
use Illuminate\Support\Facades\Route;

Route::post('/login', [AuthController::class, 'login']);

Route::middleware('auth:sanctum')->group(function (): void {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/user', [AuthController::class, 'user']);

    Route::get('/dashboard', DashboardController::class);

    Route::get('/products/{product}/history', [ProductController::class, 'history']);
    Route::apiResource('products', ProductController::class);
    Route::apiResource('suppliers', SupplierController::class)->except(['show']);
    Route::apiResource('categories', CategoryController::class)->except(['show']);

    Route::get('/transactions-in', [TransactionInController::class, 'index']);
    Route::post('/transactions-in', [TransactionInController::class, 'store']);
    Route::delete('/transactions-in/{transaction}', [TransactionInController::class, 'destroy']);
    Route::get('/transactions-out', [TransactionOutController::class, 'index']);
    Route::post('/transactions-out', [TransactionOutController::class, 'store']);
    Route::delete('/transactions-out/{transaction}', [TransactionOutController::class, 'destroy']);

    Route::get('/documents', [DocumentController::class, 'index']);
    Route::get('/documents/{document}', [DocumentController::class, 'show']);

    Route::get('/stock-opname', [StockOpnameController::class, 'index']);
    Route::post('/stock-opname/start', [StockOpnameController::class, 'start']);
    Route::post('/stock-opname/{session}/scan', [StockOpnameController::class, 'scan']);
    Route::post('/stock-opname/{session}/adjust', [StockOpnameController::class, 'adjust']);
    Route::post('/stock-opname/{session}/pause', [StockOpnameController::class, 'pause']);
    Route::post('/stock-opname/{session}/resume', [StockOpnameController::class, 'resume']);
    Route::post('/stock-opname/{session}/finalize', [StockOpnameController::class, 'finalizeSession']);

    Route::get('/reports/stock', [ReportController::class, 'stock']);
    Route::get('/reports/transactions-in', [ReportController::class, 'transactionsIn']);
    Route::get('/reports/transactions-out', [ReportController::class, 'transactionsOut']);
    Route::get('/reports/best-seller', [ReportController::class, 'bestSeller']);
    Route::get('/reports/inventory-value', [ReportController::class, 'inventoryValue']);
    Route::get('/reports/opname', [ReportController::class, 'opname']);
    Route::get('/reports/export/pdf', [ReportController::class, 'exportPdf']);
    Route::get('/reports/export/excel', [ReportController::class, 'exportExcel']);

    Route::get('/audit-trail', [AuditTrailController::class, 'index']);

    Route::get('/settings', [SettingController::class, 'show']);
    Route::put('/settings', [SettingController::class, 'update']);
    Route::post('/settings/backup', [SettingController::class, 'backup']);
    Route::post('/settings/restore', [SettingController::class, 'restore']);
});
