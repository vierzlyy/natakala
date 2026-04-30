<?php

namespace App\Http\Controllers;

use App\Models\Product;
use App\Models\StockOpnameSession;
use App\Models\TransactionIn;
use App\Models\TransactionOut;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Symfony\Component\HttpFoundation\StreamedResponse;

class ReportController extends Controller
{
    public function stock(Request $request): JsonResponse
    {
        $items = Product::query()->with(['category', 'supplier'])->get()->map(fn (Product $product) => [
            'sku' => $product->sku,
            'name' => $product->name,
            'category_name' => $product->category?->name,
            'stock' => $product->stock,
            'minimum_stock' => $product->minimum_stock,
            'supplier_name' => $product->supplier?->name,
        ])->values();

        return response()->json(['data' => $this->payload($items)]);
    }

    public function transactionsIn(Request $request): JsonResponse
    {
        $transactions = $this->applyPeriod(TransactionIn::query()->with('items.product'), $request)->get();

        $items = $transactions->flatMap(function (TransactionIn $transaction) {
            return $transaction->items->map(function ($item) use ($transaction) {
                return [
                    'transaction_no' => $transaction->transaction_no,
                    'date' => optional($transaction->date)->toDateString(),
                    'sku' => $item->product?->sku ?? '-',
                    'product_name' => $item->product?->name ?? '-',
                    'color' => $item->product?->color ?? '-',
                    'total_items' => $item->quantity,
                    'total_amount' => $item->quantity * $item->purchase_price,
                ];
            });
        })->values();

        return response()->json(['data' => $this->payload($items)]);
    }

    public function transactionsOut(Request $request): JsonResponse
    {
        $transactions = $this->applyPeriod(TransactionOut::query()->with('items.product'), $request)->get();

        $items = $transactions->flatMap(function (TransactionOut $transaction) {
            return $transaction->items->map(function ($item) use ($transaction) {
                return [
                    'transaction_no' => $transaction->transaction_no,
                    'date' => optional($transaction->date)->toDateString(),
                    'sku' => $item->product?->sku ?? '-',
                    'product_name' => $item->product?->name ?? '-',
                    'color' => $item->product?->color ?? '-',
                    'total_items' => $item->quantity,
                    'method' => $transaction->method_summary ?? '-',
                ];
            });
        })->values();

        return response()->json(['data' => $this->payload($items)]);
    }

    public function bestSeller(Request $request): JsonResponse
    {
        $items = Product::query()->orderByDesc('sold_count')->get()->map(fn (Product $product) => [
            'sku' => $product->sku,
            'name' => $product->name,
            'sold_count' => $product->sold_count,
        ])->values();

        return response()->json(['data' => $this->payload($items)]);
    }

    public function inventoryValue(Request $request): JsonResponse
    {
        $items = Product::query()->get()->map(fn (Product $product) => [
            'sku' => $product->sku,
            'name' => $product->name,
            'stock' => $product->stock,
            'purchase_price' => $product->purchase_price,
            'inventory_value' => $product->stock * $product->purchase_price,
        ])->values();

        return response()->json(['data' => $this->payload($items)]);
    }

    public function mutasi(Request $request): JsonResponse
    {
        $items = Product::query()->get()->map(function (Product $product) {
            $inQty = DB::table('transaction_in_items')
                ->where('product_id', $product->id)
                ->sum('quantity');

            $outQty = DB::table('transaction_out_items')
                ->where('product_id', $product->id)
                ->sum('quantity');

            return [
                'sku' => $product->sku,
                'name' => $product->name,
                'size' => $product->size,
                'color' => $product->color,
                'initial_stock' => $product->initial_stock,
                'incoming_qty' => (int) $inQty,
                'outgoing_qty' => (int) $outQty,
                'final_stock' => $product->stock,
            ];
        })->values();

        return response()->json(['data' => $this->payload($items)]);
    }

    public function opname(Request $request): JsonResponse
    {
        $items = $this->applyPeriod(StockOpnameSession::query(), $request, 'created_at')
            ->latest()
            ->get()
            ->map(fn (StockOpnameSession $session) => [
                'session_no' => $session->session_no,
                'status' => $session->status,
                'date' => optional($session->created_at)->toDateTimeString(),
                'total_scanned' => (int) ($session->total_scanned ?? 0),
                'matched' => (int) ($session->matched ?? 0),
                'discrepancy' => (int) ($session->discrepancy ?? 0),
            ])->values();

        return response()->json(['data' => $this->payload($items)]);
    }

    public function exportPdf(Request $request): StreamedResponse
    {
        $report = $this->resolve($request);
        $title = $this->reportTitle($request->input('type'));

        $html = view('exports.report', [
            'title' => $title,
            'summary' => $report['summary'] ?? [],
            'rows' => $report['data'] ?? [],
            'generatedAt' => now()->format('Y-m-d H:i:s'),
        ])->render();

        return response()->streamDownload(function () use ($html): void {
            echo $html;
        }, 'laporan-'.str($request->input('type', 'report'))->kebab().'.html', [
            'Content-Type' => 'text/html; charset=UTF-8',
        ]);
    }

    public function exportExcel(Request $request): StreamedResponse
    {
        $report = $this->resolve($request);
        $rows = collect($report['data'] ?? []);
        $headers = $rows->first() ? array_keys($rows->first()) : [];

        return response()->streamDownload(function () use ($headers, $rows): void {
            $handle = fopen('php://output', 'w');
            if ($headers !== []) {
                fputcsv($handle, $headers);
                foreach ($rows as $row) {
                    fputcsv($handle, array_map(fn ($value) => is_array($value) ? json_encode($value) : $value, $row));
                }
            }
            fclose($handle);
        }, 'laporan-'.str($request->input('type', 'report'))->kebab().'.csv', [
            'Content-Type' => 'text/csv; charset=UTF-8',
        ]);
    }

    private function resolve(Request $request): array
    {
        return match ($request->input('type')) {
            'transactionsIn' => $this->transactionsIn($request)->getData(true)['data'],
            'transactionsOut' => $this->transactionsOut($request)->getData(true)['data'],
            'bestSeller' => $this->bestSeller($request)->getData(true)['data'],
            'inventoryValue' => $this->inventoryValue($request)->getData(true)['data'],
            'mutasi' => $this->mutasi($request)->getData(true)['data'],
            'opname' => $this->opname($request)->getData(true)['data'],
            default => $this->stock($request)->getData(true)['data'],
        };
    }

    private function payload($items): array
    {
        return [
            'summary' => [
                'total_records' => $items->count(),
                'total_items' => (int) $items->sum('total_items'),
            ],
            'chart' => $items->take(6)->map(function (array $item) {
                return [
                    'label' => $item['name'] ?? $item['transaction_no'] ?? $item['session_no'] ?? 'Item',
                    'value' => $item['stock'] ?? $item['sold_count'] ?? $item['inventory_value'] ?? $item['total_items'] ?? $item['discrepancy'] ?? $item['final_stock'] ?? 0,
                ];
            })->values(),
            'data' => $items,
        ];
    }

    private function applyPeriod($query, Request $request, string $column = 'date')
    {
        $period = $request->input('period');

        if ($period === 'today') {
            return $query->whereDate($column, now()->toDateString());
        }

        if ($period === 'week') {
            return $query->whereDate($column, '>=', now()->subDays(6)->toDateString());
        }

        if ($period === 'month') {
            return $query->whereMonth($column, now()->month)->whereYear($column, now()->year);
        }

        if ($period === 'last_month') {
            return $query->whereMonth($column, now()->subMonthNoOverflow()->month)->whereYear($column, now()->subMonthNoOverflow()->year);
        }

        if ($request->filled('start_date') && $request->filled('end_date')) {
            return $query->whereBetween($column, [$request->input('start_date'), $request->input('end_date')]);
        }

        return $query;
    }

    private function reportTitle(?string $type): string
    {
        return match ($type) {
            'transactionsIn' => 'Laporan Barang Masuk',
            'transactionsOut' => 'Laporan Barang Keluar',
            'bestSeller' => 'Laporan Produk Terlaris',
            'inventoryValue' => 'Laporan Nilai Inventaris',
            'mutasi' => 'Laporan Mutasi Stok',
            'opname' => 'Laporan Stock Opname',
            default => 'Laporan Stok',
        };
    }
}