<?php

namespace App\Http\Controllers;

use App\Models\Product;
use App\Models\StockHistory;
use App\Models\TransactionIn;
use App\Models\TransactionInItem;
use App\Support\AuditLogger;
use App\Support\InboundDocumentFactory;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class TransactionInController extends Controller
{
    public function index(): JsonResponse
    {
        return response()->json([
            'data' => TransactionIn::query()
                ->with(['supplier', 'items.product'])
                ->latest()
                ->get()
                ->map(fn (TransactionIn $transaction) => $this->transform($transaction)),
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'supplier_id' => ['required', 'exists:suppliers,id'],
            'date' => ['nullable', 'date'],
            'inbound_status' => ['nullable', 'string'],
            'notes' => ['nullable', 'string'],
            'items' => ['required', 'array', 'min:1'],
            'items.*.product_id' => ['required', 'exists:products,id'],
            'items.*.quantity' => ['required', 'integer', 'min:1'],
            'items.*.purchase_price' => ['required', 'integer', 'min:0'],
            'items.*.condition_status' => ['nullable', 'string'],
            'items.*.condition_note' => ['nullable', 'string'],
        ]);

        $actor = $request->user();
        $productsById = Product::query()
            ->whereIn('id', collect($data['items'])->pluck('product_id')->unique()->values())
            ->get()
            ->keyBy('id');

        $hasDifferentSupplier = collect($data['items'])->contains(function (array $item) use ($data, $productsById): bool {
            $product = $productsById->get($item['product_id']);

            return !$product || (string) $product->supplier_id !== (string) $data['supplier_id'];
        });

        if ($hasDifferentSupplier) {
            throw ValidationException::withMessages([
                'items' => ['Semua produk barang masuk harus berasal dari supplier yang sama dengan supplier transaksi.'],
            ]);
        }

        $transaction = DB::transaction(function () use ($data, $actor, $productsById) {
            $transaction = TransactionIn::query()->create([
                'transaction_no' => 'IN-'.now()->format('YmdHis'),
                'supplier_id' => $data['supplier_id'],
                'date' => $data['date'] ?? now()->toDateString(),
                'inbound_status' => $data['inbound_status'] ?? 'Barang Baru',
                'notes' => $data['notes'] ?? null,
                'total_items' => collect($data['items'])->sum('quantity'),
                'total_amount' => collect($data['items'])->sum(fn (array $item) => $item['quantity'] * $item['purchase_price']),
            ]);

            foreach ($data['items'] as $item) {
                TransactionInItem::query()->create([
                    'transaction_in_id' => $transaction->id,
                    'product_id' => $item['product_id'],
                    'quantity' => $item['quantity'],
                    'purchase_price' => $item['purchase_price'],
                    'qc_status' => $item['condition_status'] ?? 'Lulus QC',
                    'qc_note' => $item['condition_note'] ?? null,
                ]);

                $product = $productsById->get($item['product_id']);
                $before = $product->stock;
                $product->increment('stock', $item['quantity']);
                $product->update(['initial_stock' => $product->fresh()->stock]);

                StockHistory::query()->create([
                    'product_id' => $product->id,
                    'date' => now(),
                    'type' => 'stock_in',
                    'quantity' => $item['quantity'],
                    'before_stock' => $before,
                    'after_stock' => $product->fresh()->stock,
                    'reference' => $transaction->transaction_no,
                    'note' => 'Barang masuk dari transaksi restock.',
                ]);
            }

            AuditLogger::write(
                $actor,
                'transaction_in_created',
                'transaction_in',
                $transaction->id,
                $transaction->transaction_no,
                'Transaksi barang masuk dibuat.',
                [
                    'total_items' => $transaction->total_items,
                    'total_amount' => $transaction->total_amount,
                ],
            );

            InboundDocumentFactory::createForTransaction($transaction);

            return $transaction->fresh(['supplier', 'items.product']);
        });

        return response()->json([
            'data' => $this->transform($transaction),
        ], 201);
    }

    public function destroy(Request $request, TransactionIn $transaction): JsonResponse
    {
        $actor = $request->user();

        DB::transaction(function () use ($transaction, $actor) {
            foreach ($transaction->items as $item) {
                $product = $item->product;
                if ($product) {
                    $before = $product->stock;
                    $product->decrement('stock', $item->quantity);
                    $product->update(['initial_stock' => $product->fresh()->stock]);

                    StockHistory::query()->create([
                        'product_id' => $product->id,
                        'date' => now(),
                        'type' => 'stock_out',
                        'quantity' => -$item->quantity,
                        'before_stock' => $before,
                        'after_stock' => $product->fresh()->stock,
                        'reference' => $transaction->transaction_no,
                        'note' => 'Pembatalan transaksi barang masuk.',
                    ]);
                }
            }

            $transaction->documents()->delete();
            $transaction->items()->delete();
            $transaction->delete();

            AuditLogger::write(
                $actor,
                'transaction_in_deleted',
                'transaction_in',
                $transaction->id,
                $transaction->transaction_no,
                'Transaksi barang masuk dihapus.',
            );
        });

        return response()->json(null, 204);
    }

    private function transform(TransactionIn $transaction): array
    {
        return [
            'id' => $transaction->id,
            'transaction_no' => $transaction->transaction_no,
            'supplier_id' => $transaction->supplier_id,
            'supplier_name' => $transaction->supplier?->name,
            'date' => optional($transaction->date)->toDateString(),
            'inbound_status' => $transaction->inbound_status,
            'notes' => $transaction->notes,
            'total_items' => $transaction->total_items,
            'total_amount' => $transaction->total_amount,
            'items' => $transaction->items->map(fn (TransactionInItem $item) => [
                'id' => $item->id,
                'product_id' => $item->product_id,
                'product_name' => $item->product?->name,
                'sku' => $item->product?->sku,
                'barcode' => $item->product?->barcode,
                'color' => $item->product?->color,
                'product_color' => $item->product?->color,
                'size' => $item->product?->size,
                'product_size' => $item->product?->size,
                'quantity' => $item->quantity,
                'accepted_quantity' => $item->accepted_quantity,
                'rejected_quantity' => $item->rejected_quantity,
                'purchase_price' => $item->purchase_price,
                'subtotal' => $item->quantity * $item->purchase_price,
                'condition_status' => $item->qc_status,
                'condition' => $item->qc_status,
                'condition_note' => $item->qc_note,
            ])->values(),
        ];
    }
}
