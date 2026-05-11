<?php

namespace App\Http\Controllers;

use App\Models\SystemSetting;
use App\Support\AuditLogger;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Symfony\Component\HttpFoundation\StreamedResponse;

class SettingController extends Controller
{
    private const DELETE_SCOPES = [
        'all_inventory' => [
            'label' => 'Semua data inventaris',
            'tables' => [
                'digital_documents',
                'transaction_in_items',
                'transaction_ins',
                'transaction_out_items',
                'transaction_outs',
                'stock_opname_items',
                'stock_opname_sessions',
                'stock_histories',
                'products',
                'suppliers',
                'categories',
                'audit_logs',
            ],
        ],
        'transactions' => [
            'label' => 'Semua transaksi dan histori stok',
            'tables' => [
                'digital_documents',
                'transaction_in_items',
                'transaction_ins',
                'transaction_out_items',
                'transaction_outs',
                'stock_histories',
            ],
        ],
        'transactions_in' => [
            'label' => 'Barang masuk',
            'tables' => [
                'digital_documents',
                'transaction_in_items',
                'transaction_ins',
            ],
        ],
        'transactions_out' => [
            'label' => 'Barang keluar',
            'tables' => [
                'transaction_out_items',
                'transaction_outs',
            ],
        ],
        'stock_opname' => [
            'label' => 'Stock opname',
            'tables' => [
                'stock_opname_items',
                'stock_opname_sessions',
            ],
        ],
        'documents' => [
            'label' => 'Dokumen digital',
            'tables' => [
                'digital_documents',
            ],
        ],
    ];

    private const BACKUP_TABLES = [
        'system_settings',
        'categories',
        'suppliers',
        'products',
        'transaction_ins',
        'transaction_in_items',
        'transaction_outs',
        'transaction_out_items',
        'stock_histories',
        'digital_documents',
        'stock_opname_sessions',
        'stock_opname_items',
        'audit_logs',
    ];

    public function show(): JsonResponse
    {
        return response()->json([
            'data' => $this->settings(),
        ]);
    }

    public function update(Request $request): JsonResponse
    {
        $data = $request->validate([
            'minimum_stock' => ['nullable', 'integer', 'min:0'],
            'barcode_format' => ['nullable', 'string', 'max:100'],
            'currency' => ['nullable', 'string', 'max:20'],
            'sizes' => ['nullable', 'array'],
        ]);

        $settings = $this->settings();
        $before = $settings->only(['minimum_stock', 'barcode_format', 'currency', 'sizes']);

        $settings->update([
            'minimum_stock' => $data['minimum_stock'] ?? $settings->minimum_stock,
            'barcode_format' => $data['barcode_format'] ?? $settings->barcode_format,
            'currency' => $data['currency'] ?? $settings->currency,
            'sizes' => $data['sizes'] ?? $settings->sizes,
        ]);

        AuditLogger::write(
            $request->user(),
            'settings_updated',
            'settings',
            $settings->id,
            'System Settings',
            'Pengaturan sistem diperbarui.',
            [
                'before' => $before,
                'after' => $settings->only(['minimum_stock', 'barcode_format', 'currency', 'sizes']),
            ],
        );

        return response()->json(['data' => $settings]);
    }

    public function backup(Request $request): StreamedResponse
    {
        $data = $request->validate([
            'scope' => ['nullable', 'in:all,month'],
            'month' => ['nullable', 'integer', 'between:1,12'],
            'year' => ['nullable', 'integer', 'between:2000,2100'],
        ]);
        $scope = $data['scope'] ?? 'all';
        $month = (int) ($data['month'] ?? now()->month);
        $year = (int) ($data['year'] ?? now()->year);
        $settings = $this->settings();
        $tables = $this->backupTables($scope, $year, $month);

        AuditLogger::write(
            $request->user(),
            'settings_backup_exported',
            'settings',
            $settings->id,
            'System Settings',
            $scope === 'month'
                ? "Backup database inventaris periode {$year}-".str_pad((string) $month, 2, '0', STR_PAD_LEFT).' diunduh.'
                : 'Backup database inventaris diunduh.',
        );

        $filename = $scope === 'month'
            ? 'natakala-database-backup-'.$year.'-'.str_pad((string) $month, 2, '0', STR_PAD_LEFT).'.json'
            : 'natakala-database-backup.json';

        return response()->streamDownload(function () use ($tables, $scope, $year, $month): void {
            echo json_encode([
                'version' => 2,
                'scope' => $scope,
                'period' => $scope === 'month'
                    ? ['year' => $year, 'month' => $month]
                    : null,
                'exported_at' => now()->toDateTimeString(),
                'tables' => $tables,
            ], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
        }, $filename, [
            'Content-Type' => 'application/json; charset=UTF-8',
        ]);
    }

    public function restore(Request $request): JsonResponse
    {
        $request->validate([
            'file' => ['required', 'file', 'mimes:json,txt'],
        ]);

        $content = json_decode($request->file('file')->get(), true);
        if (!is_array($content) || (!isset($content['tables']) && !isset($content['settings']))) {
            return response()->json(['message' => 'File backup tidak valid.'], 422);
        }

        $settings = $this->settings();
        $before = $settings->only(['minimum_stock', 'barcode_format', 'currency', 'sizes']);

        if (isset($content['tables']) && is_array($content['tables'])) {
            DB::transaction(function () use ($content): void {
                foreach (self::BACKUP_TABLES as $table) {
                    $rows = $content['tables'][$table] ?? [];
                    if (!is_array($rows) || count($rows) === 0) {
                        continue;
                    }

                    $columns = Schema::getColumnListing($table);
                    foreach (array_chunk($rows, 250) as $chunk) {
                        $normalizedRows = collect($chunk)
                            ->map(fn ($row) => $this->normalizeBackupRow($table, $row, $columns))
                            ->filter()
                            ->values()
                            ->all();

                        if (count($normalizedRows) > 0) {
                            $this->mergeBackupRows($table, $normalizedRows);
                        }
                    }

                    $this->resetTableSequence($table);
                }
            });

            $settings = $this->settings();
        } else {
            $settings->update([
                'minimum_stock' => $content['settings']['minimum_stock'] ?? 5,
                'barcode_format' => $content['settings']['barcode_format'] ?? 'CODE128',
                'currency' => $content['settings']['currency'] ?? 'IDR',
                'sizes' => $content['settings']['sizes'] ?? ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'Allsize', 'Bigsize'],
            ]);
        }

        AuditLogger::write(
            $request->user(),
            'settings_restored',
            'settings',
            $settings->id,
            'System Settings',
            isset($content['tables'])
                ? 'Database inventaris dipulihkan dari file backup.'
                : 'Pengaturan sistem dipulihkan dari file backup.',
            [
                'before' => $before,
                'after' => $settings->only(['minimum_stock', 'barcode_format', 'currency', 'sizes']),
                'restored_tables' => isset($content['tables']) ? array_keys($content['tables']) : ['system_settings'],
            ],
        );

        return response()->json([
            'message' => isset($content['tables'])
                ? 'Database inventaris berhasil dipulihkan.'
                : 'Pengaturan berhasil dipulihkan.',
            'data' => $settings,
        ]);
    }

    public function deleteData(Request $request): JsonResponse
    {
        $data = $request->validate([
            'scope' => ['required', 'string', 'in:'.implode(',', array_keys(self::DELETE_SCOPES))],
            'month' => ['required', 'integer', 'between:1,12'],
            'year' => ['required', 'integer', 'between:2000,2100'],
            'confirmation' => ['required', 'string', 'in:HAPUS'],
        ]);

        $scope = $data['scope'];
        $month = (int) $data['month'];
        $year = (int) $data['year'];
        $definition = self::DELETE_SCOPES[$scope];
        $beforeCounts = $this->monthlyDeleteCounts($scope, $year, $month);

        DB::transaction(function () use ($scope, $year, $month): void {
            $this->deleteMonthlyData($scope, $year, $month);
        });

        AuditLogger::write(
            $request->user(),
            'data_deleted',
            'settings',
            $this->settings()->id,
            'System Settings',
            'Data dihapus dari dashboard penghapusan data.',
            [
                'scope' => $scope,
                'scope_label' => $definition['label'],
                'period' => ['year' => $year, 'month' => $month],
                'before_counts' => $beforeCounts,
            ],
        );

        return response()->json([
            'message' => 'Data berhasil dihapus.',
            'data' => [
                'scope' => $scope,
                'scope_label' => $definition['label'],
                'period' => ['year' => $year, 'month' => $month],
                'deleted_counts' => $beforeCounts,
            ],
        ]);
    }

    private function settings(): SystemSetting
    {
        return SystemSetting::query()->firstOrCreate([], [
            'minimum_stock' => 5,
            'barcode_format' => 'CODE128',
            'currency' => 'IDR',
            'sizes' => ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'Allsize', 'Bigsize'],
        ]);
    }

    private function resetTableSequence(string $table): void
    {
        DB::statement("
            SELECT setval(
                pg_get_serial_sequence('{$table}', 'id'),
                COALESCE((SELECT MAX(id) FROM {$table}), 1),
                (SELECT COUNT(*) FROM {$table}) > 0
            )
        ");
    }

    private function backupTables(string $scope, int $year, int $month)
    {
        if ($scope !== 'month') {
            return collect(self::BACKUP_TABLES)
                ->mapWithKeys(fn (string $table) => [$table => $this->tableRows($table)]);
        }

        $transactionInIds = DB::table('transaction_ins')
            ->whereYear('date', $year)
            ->whereMonth('date', $month)
            ->pluck('id');
        $transactionOutIds = DB::table('transaction_outs')
            ->whereYear('date', $year)
            ->whereMonth('date', $month)
            ->pluck('id');
        $stockOpnameSessionIds = DB::table('stock_opname_sessions')
            ->whereYear('created_at', $year)
            ->whereMonth('created_at', $month)
            ->pluck('id');

        return collect([
            'system_settings' => $this->tableRows('system_settings'),
            'categories' => $this->tableRows('categories'),
            'suppliers' => $this->tableRows('suppliers'),
            'products' => $this->tableRows('products'),
            'transaction_ins' => $this->tableRows('transaction_ins', fn ($query) => $query->whereIn('id', $transactionInIds)),
            'transaction_in_items' => $this->tableRows('transaction_in_items', fn ($query) => $query->whereIn('transaction_in_id', $transactionInIds)),
            'transaction_outs' => $this->tableRows('transaction_outs', fn ($query) => $query->whereIn('id', $transactionOutIds)),
            'transaction_out_items' => $this->tableRows('transaction_out_items', fn ($query) => $query->whereIn('transaction_out_id', $transactionOutIds)),
            'stock_histories' => $this->tableRows('stock_histories', fn ($query) => $query->whereYear('date', $year)->whereMonth('date', $month)),
            'digital_documents' => $this->tableRows('digital_documents', fn ($query) => $query->whereYear('date', $year)->whereMonth('date', $month)),
            'stock_opname_sessions' => $this->tableRows('stock_opname_sessions', fn ($query) => $query->whereIn('id', $stockOpnameSessionIds)),
            'stock_opname_items' => $this->tableRows('stock_opname_items', fn ($query) => $query->whereIn('session_id', $stockOpnameSessionIds)),
            'audit_logs' => $this->tableRows('audit_logs', fn ($query) => $query->whereYear('created_at', $year)->whereMonth('created_at', $month)),
        ]);
    }

    private function tableRows(string $table, ?callable $filter = null)
    {
        $query = DB::table($table)->orderBy('id');

        if ($filter) {
            $filter($query);
        }

        return $query
            ->get()
            ->map(fn ($row) => (array) $row)
            ->values();
    }

    private function monthlyDeleteCounts(string $scope, int $year, int $month)
    {
        $transactionInIds = $this->monthlyIds('transaction_ins', 'date', $year, $month);
        $transactionOutIds = $this->monthlyIds('transaction_outs', 'date', $year, $month);
        $stockOpnameSessionIds = $this->monthlyIds('stock_opname_sessions', 'created_at', $year, $month);

        $counts = collect();

        if (in_array($scope, ['all_inventory', 'transactions', 'transactions_in'], true)) {
            $counts['transaction_ins'] = $transactionInIds->count();
            $counts['transaction_in_items'] = DB::table('transaction_in_items')->whereIn('transaction_in_id', $transactionInIds)->count();
        }

        if (in_array($scope, ['all_inventory', 'transactions', 'transactions_out'], true)) {
            $counts['transaction_outs'] = $transactionOutIds->count();
            $counts['transaction_out_items'] = DB::table('transaction_out_items')->whereIn('transaction_out_id', $transactionOutIds)->count();
        }

        if (in_array($scope, ['all_inventory', 'transactions', 'transactions_in', 'documents'], true)) {
            $counts['digital_documents'] = DB::table('digital_documents')
                ->where(function ($query) use ($year, $month, $transactionInIds): void {
                    $query
                        ->whereIn('transaction_in_id', $transactionInIds)
                        ->orWhere(fn ($dateQuery) => $dateQuery->whereYear('date', $year)->whereMonth('date', $month));
                })
                ->count();
        }

        if (in_array($scope, ['all_inventory', 'stock_opname'], true)) {
            $counts['stock_opname_sessions'] = $stockOpnameSessionIds->count();
            $counts['stock_opname_items'] = DB::table('stock_opname_items')->whereIn('session_id', $stockOpnameSessionIds)->count();
        }

        if (in_array($scope, ['all_inventory', 'transactions', 'transactions_in', 'transactions_out', 'stock_opname'], true)) {
            $counts['stock_histories'] = DB::table('stock_histories')
                ->whereYear('date', $year)
                ->whereMonth('date', $month)
                ->when($scope === 'transactions_in', fn ($query) => $query->where('reference', 'like', 'IN-%'))
                ->when($scope === 'transactions_out', fn ($query) => $query->where('reference', 'like', 'OUT-%'))
                ->when($scope === 'stock_opname', fn ($query) => $query->where('type', 'stock_opname_adjustment'))
                ->count();
        }

        if (in_array($scope, ['all_inventory', 'audit_logs'], true)) {
            $counts['audit_logs'] = DB::table('audit_logs')
                ->whereYear('created_at', $year)
                ->whereMonth('created_at', $month)
                ->count();
        }

        return $counts;
    }

    private function deleteMonthlyData(string $scope, int $year, int $month): void
    {
        $transactionInIds = $this->monthlyIds('transaction_ins', 'date', $year, $month);
        $transactionOutIds = $this->monthlyIds('transaction_outs', 'date', $year, $month);
        $stockOpnameSessionIds = $this->monthlyIds('stock_opname_sessions', 'created_at', $year, $month);

        if (in_array($scope, ['all_inventory', 'transactions', 'transactions_in', 'documents'], true)) {
            DB::table('digital_documents')
                ->where(function ($query) use ($year, $month, $transactionInIds): void {
                    $query
                        ->whereIn('transaction_in_id', $transactionInIds)
                        ->orWhere(fn ($dateQuery) => $dateQuery->whereYear('date', $year)->whereMonth('date', $month));
                })
                ->delete();
        }

        if (in_array($scope, ['all_inventory', 'transactions', 'transactions_in'], true)) {
            DB::table('transaction_in_items')->whereIn('transaction_in_id', $transactionInIds)->delete();
            DB::table('transaction_ins')->whereIn('id', $transactionInIds)->delete();
        }

        if (in_array($scope, ['all_inventory', 'transactions', 'transactions_out'], true)) {
            DB::table('transaction_out_items')->whereIn('transaction_out_id', $transactionOutIds)->delete();
            DB::table('transaction_outs')->whereIn('id', $transactionOutIds)->delete();
        }

        if (in_array($scope, ['all_inventory', 'stock_opname'], true)) {
            DB::table('stock_opname_items')->whereIn('session_id', $stockOpnameSessionIds)->delete();
            DB::table('stock_opname_sessions')->whereIn('id', $stockOpnameSessionIds)->delete();
        }

        if (in_array($scope, ['all_inventory', 'transactions', 'transactions_in', 'transactions_out', 'stock_opname'], true)) {
            DB::table('stock_histories')
                ->whereYear('date', $year)
                ->whereMonth('date', $month)
                ->when($scope === 'transactions_in', fn ($query) => $query->where('reference', 'like', 'IN-%'))
                ->when($scope === 'transactions_out', fn ($query) => $query->where('reference', 'like', 'OUT-%'))
                ->when($scope === 'stock_opname', fn ($query) => $query->where('type', 'stock_opname_adjustment'))
                ->delete();
        }

        if (in_array($scope, ['all_inventory', 'audit_logs'], true)) {
            DB::table('audit_logs')
                ->whereYear('created_at', $year)
                ->whereMonth('created_at', $month)
                ->delete();
        }
    }

    private function monthlyIds(string $table, string $column, int $year, int $month)
    {
        return DB::table($table)
            ->whereYear($column, $year)
            ->whereMonth($column, $month)
            ->pluck('id');
    }

    private function mergeBackupRows(string $table, array $rows): void
    {
        $firstRow = $rows[0] ?? [];
        $columns = array_keys($firstRow);
        $updateColumns = array_values(array_diff($columns, ['id']));

        if (in_array('id', $columns, true)) {
            DB::table($table)->upsert($rows, ['id'], $updateColumns);
            return;
        }

        DB::table($table)->insert($rows);
    }

    private function normalizeBackupRow(string $table, mixed $row, array $columns): ?array
    {
        $data = (array) $row;

        if ($table === 'stock_opname_sessions') {
            $data = $this->normalizeStockOpnameSessionRow($data);
        }

        if ($table === 'stock_opname_items') {
            $data = $this->normalizeStockOpnameItemRow($data);
            if ($data === null) {
                return null;
            }
        }

        return collect($columns)
            ->mapWithKeys(function (string $column) use ($data): array {
                $value = $data[$column] ?? null;

                if (is_array($value) || is_object($value)) {
                    $value = json_encode($value, JSON_UNESCAPED_UNICODE);
                }

                return [$column => $value];
            })
            ->all();
    }

    private function normalizeStockOpnameSessionRow(array $data): array
    {
        if (empty($data['session_no'])) {
            $date = $data['created_at'] ?? $data['date'] ?? now()->toDateString();
            $compactDate = preg_replace('/\D/', '', substr((string) $date, 0, 10)) ?: now()->format('Ymd');
            $data['session_no'] = 'OPN-'.$compactDate.'-'.str_pad((string) ($data['id'] ?? 1), 3, '0', STR_PAD_LEFT);
        }

        $status = strtolower(trim((string) ($data['status'] ?? 'open')));
        $data['status'] = match ($status) {
            'selesai', 'done', 'finished', 'finish', 'complete', 'completed' => 'closed',
            'aktif', 'active', 'dibuka' => 'open',
            'dijeda', 'pause' => 'paused',
            'review', 'menunggu penyesuaian' => 'review',
            default => in_array($status, ['open', 'paused', 'review', 'closed'], true) ? $status : 'open',
        };

        $data['total_scanned'] = $data['total_scanned'] ?? 0;
        $data['matched'] = $data['matched'] ?? 0;
        $data['discrepancy'] = $data['discrepancy'] ?? 0;

        return $data;
    }

    private function normalizeStockOpnameItemRow(array $data): ?array
    {
        $data['session_id'] = $data['session_id']
            ?? $data['stock_opname_session_id']
            ?? $data['opname_session_id']
            ?? null;

        if (empty($data['session_id'])) {
            $itemDate = $data['created_at'] ?? $data['date'] ?? null;
            $datePrefix = $itemDate ? substr((string) $itemDate, 0, 10) : null;

            $session = DB::table('stock_opname_sessions')
                ->when($datePrefix, fn ($query) => $query->whereDate('created_at', $datePrefix))
                ->orderByDesc('id')
                ->first();

            $data['session_id'] = $session?->id;
        }

        if (empty($data['session_id'])) {
            $data['session_id'] = DB::table('stock_opname_sessions')->orderByDesc('id')->value('id');
        }

        $data['product_id'] = $data['product_id'] ?? $data['productId'] ?? null;

        if (empty($data['session_id']) || empty($data['product_id'])) {
            return null;
        }

        if (empty($data['barcode'])) {
            $data['barcode'] = DB::table('products')->where('id', $data['product_id'])->value('barcode');
        }

        if (empty($data['barcode'])) {
            $data['barcode'] = 'UNKNOWN-'.$data['product_id'];
        }

        $data['system_stock'] = $data['system_stock'] ?? 0;
        $data['physical_stock'] = $data['physical_stock'] ?? 0;
        $data['difference'] = $data['difference'] ?? ((int) $data['physical_stock'] - (int) $data['system_stock']);

        return $data;
    }
}
