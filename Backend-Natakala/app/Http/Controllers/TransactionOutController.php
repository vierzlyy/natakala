<?php

namespace App\Http\Controllers;

use App\Models\Product;
use App\Models\StockHistory;
use App\Models\TransactionOut;
use App\Models\TransactionOutItem;
use App\Support\AuditLogger;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class TransactionOutController extends Controller
{
    public function index(): JsonResponse
    {
        return response()->json([
            'data' => TransactionOut::query()
                ->with('items.product')
                ->latest()
                ->get()
                ->map(fn (TransactionOut $transaction) => $this->transform($transaction)),
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'date' => ['nullable', 'date'],
            'notes' => ['nullable', 'string'],
            'items' => ['required', 'array', 'min:1'],
            'items.*.product_id' => ['required', 'exists:products,id'],
            'items.*.quantity' => ['required', 'integer', 'min:1'],
            'items.*.method' => ['required', 'string'],
        ]);

        foreach ($data['items'] as $item) {
            $product = Product::query()->findOrFail($item['product_id']);
            if ($item['quantity'] > $product->stock) {
                throw ValidationException::withMessages([
                    'items' => ["Stok produk {$product->name} tidak mencukupi."],
                ]);
            }
        }

        $actor = $request->user();

        $transaction = DB::transaction(function () use ($data, $actor) {
            $transaction = TransactionOut::query()->create([
                'transaction_no' => 'OUT-'.now()->format('YmdHis'),
                'date' => $data['date'] ?? now()->toDateString(),
                'notes' => $data['notes'] ?? null,
                'total_items' => collect($data['items'])->sum('quantity'),
                'method_summary' => collect($data['items'])->pluck('method')->unique()->implode(', '),
            ]);

            foreach ($data['items'] as $item) {
                TransactionOutItem::query()->create([
                    'transaction_out_id' => $transaction->id,
                    'product_id' => $item['product_id'],
                    'quantity' => $item['quantity'],
                    'method' => $item['method'],
                ]);

                $product = Product::query()->findOrFail($item['product_id']);
                $before = $product->stock;
                $product->decrement('stock', $item['quantity']);
                $product->increment('sold_count', $item['quantity']);

                StockHistory::query()->create([
                    'product_id' => $product->id,
                    'date' => now(),
                    'type' => 'stock_out',
                    'quantity' => -$item['quantity'],
                    'before_stock' => $before,
                    'after_stock' => $product->fresh()->stock,
                    'reference' => $transaction->transaction_no,
                    'note' => 'Barang keluar ('.$item['method'].').',
                ]);
            }

            AuditLogger::write(
                $actor,
                'transaction_out_created',
                'transaction_out',
                $transaction->id,
                $transaction->transaction_no,
                'Transaksi barang keluar dibuat.',
                [
                    'total_items' => $transaction->total_items,
                    'methods' => $transaction->method_summary,
                ],
            );

            return $transaction->fresh('items.product');
        });

        return response()->json([
            'data' => $this->transform($transaction),
        ], 201);
    }

    public function destroy(Request $request, TransactionOut $transaction): JsonResponse
    {
        $actor = $request->user();

        DB::transaction(function () use ($transaction, $actor) {
            foreach ($transaction->items as $item) {
                $product = $item->product;
                if ($product) {
                    $before = $product->stock;
                    $product->increment('stock', $item->quantity);
                    $product->decrement('sold_count', $item->quantity);

                    StockHistory::query()->create([
                        'product_id' => $product->id,
                        'date' => now(),
                        'type' => 'stock_in',
                        'quantity' => $item->quantity,
                        'before_stock' => $before,
                        'after_stock' => $product->fresh()->stock,
                        'reference' => $transaction->transaction_no,
                        'note' => 'Pembatalan transaksi barang keluar.',
                    ]);
                }
            }

            $transaction->items()->delete();
            $transaction->delete();

            AuditLogger::write(
                $actor,
                'transaction_out_deleted',
                'transaction_out',
                $transaction->id,
                $transaction->transaction_no,
                'Transaksi barang keluar dihapus.',
            );
        });

        return response()->json(null, 204);
    }

    private function transform(TransactionOut $transaction): array
    {
        return [
            'id' => $transaction->id,
            'transaction_no' => $transaction->transaction_no,
            'date' => optional($transaction->date)->toDateString(),
            'notes' => $transaction->notes,
            'total_items' => $transaction->total_items,
            'method_summary' => $transaction->method_summary,
            'items' => $transaction->items->map(fn (TransactionOutItem $item) => [
                'id' => $item->id,
                'product_id' => $item->product_id,
                'product_name' => $item->product?->name,
                'sku' => $item->product?->sku,
                'barcode' => $item->product?->barcode,
                'color' => $item->product?->color,
                'product_color' => $item->product?->color,
                'colour' => $item->product?->color,
                'variant_color' => $item->product?->color,
                'size' => $item->product?->size,
                'product_size' => $item->product?->size,
                'variant_size' => $item->product?->size,
                'quantity' => $item->quantity,
                'method' => $item->method,
            ])->values(),
        ];
    }
}
