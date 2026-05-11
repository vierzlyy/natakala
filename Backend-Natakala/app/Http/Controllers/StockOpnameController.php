<?php

namespace App\Http\Controllers;

use App\Models\Product;
use App\Models\StockHistory;
use App\Models\StockOpnameItem;
use App\Models\StockOpnameSession;
use App\Support\AuditLogger;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class StockOpnameController extends Controller
{
    public function index(): JsonResponse
    {
        return response()->json([
            'data' => StockOpnameSession::query()
                ->with(['items.product'])
                ->latest()
                ->get()
                ->map(fn (StockOpnameSession $session) => $this->transform($session)),
        ]);
    }

    public function start(Request $request): JsonResponse
    {
        if (StockOpnameSession::query()->whereIn('status', ['open', 'paused', 'review'])->exists()) {
            return response()->json(['message' => 'Masih ada sesi stock opname aktif yang belum diselesaikan.'], 422);
        }

        $session = StockOpnameSession::query()->create([
            'session_no' => 'OPN-'.now()->format('Ymd').'-'.str_pad((string) (StockOpnameSession::query()->count() + 1), 3, '0', STR_PAD_LEFT),
            'status' => 'open',
            'created_by' => $request->user()?->id,
            'total_scanned' => 0,
            'matched' => 0,
            'discrepancy' => 0,
        ]);

        AuditLogger::write(
            $request->user(),
            'stock_opname_started',
            'stock_opname',
            $session->id,
            $session->session_no,
            'Sesi stock opname baru dimulai.',
        );

        return response()->json(['data' => $this->transform($session->load(['items.product']))], 201);
    }

    public function scan(Request $request, StockOpnameSession $session): JsonResponse
    {
        if ($session->status !== 'open') {
            return response()->json(['message' => 'Sesi stock opname tidak dapat menerima item baru pada status saat ini.'], 422);
        }

        $data = $request->validate([
            'barcode' => ['required', 'string'],
            'physical_stock' => ['required', 'integer', 'min:0'],
            'reason' => ['nullable', 'string'],
        ]);

        $product = Product::query()
            ->where('barcode', $data['barcode'])
            ->orWhere('sku', $data['barcode'])
            ->first();

        if (!$product) {
            throw ValidationException::withMessages([
                'barcode' => ['Produk dengan barcode atau SKU tersebut tidak ditemukan.'],
            ]);
        }

        if ($session->items()->where('product_id', $product->id)->exists()) {
            return response()->json(['message' => 'Produk ini sudah tercatat dalam sesi stock opname yang sama.'], 422);
        }

        StockOpnameItem::query()->create([
            'session_id' => $session->id,
            'product_id' => $product->id,
            'barcode' => $product->barcode,
            'system_stock' => $product->stock,
            'physical_stock' => $data['physical_stock'],
            'difference' => $data['physical_stock'] - $product->stock,
            'reason' => $data['reason'] ?? null,
        ]);

        $this->refreshSummary($session);

        AuditLogger::write(
            $request->user(),
            'stock_opname_item_added',
            'stock_opname',
            $session->id,
            $session->session_no,
            'Item stock opname ditambahkan.',
            [
                'product_id' => $product->id,
                'product_name' => $product->name,
                'system_stock' => $product->stock,
                'physical_stock' => $data['physical_stock'],
            ],
        );

        return response()->json(['data' => $this->transform($session->fresh(['items.product']))]);
    }

    public function adjust(Request $request, StockOpnameSession $session): JsonResponse
    {
        if ($session->status === 'closed') {
            return response()->json(['message' => 'Sesi stock opname ini sudah ditutup.'], 422);
        }

        if (!$session->items()->exists()) {
            return response()->json(['message' => 'Belum ada item opname yang bisa disesuaikan.'], 422);
        }

        DB::transaction(function () use ($session, $request): void {
            $session->load('items.product');

            foreach ($session->items as $item) {
                $product = $item->product;
                if (!$product) {
                    continue;
                }

                $before = $product->stock;
                $product->update([
                    'stock' => $item->physical_stock,
                    'initial_stock' => $item->physical_stock,
                ]);

                StockHistory::query()->create([
                    'product_id' => $product->id,
                    'date' => now(),
                    'type' => 'stock_opname_adjustment',
                    'quantity' => $item->physical_stock - $before,
                    'before_stock' => $before,
                    'after_stock' => $item->physical_stock,
                    'reference' => $session->session_no,
                    'note' => $item->reason ?: 'Penyesuaian dari stock opname.',
                ]);
            }

            $session->update([
                'status' => 'closed',
                'finalized_at' => now(),
            ]);

            AuditLogger::write(
                $request->user(),
                'stock_opname_adjusted',
                'stock_opname',
                $session->id,
                $session->session_no,
                'Penyesuaian stock opname diterapkan ke stok produk.',
                [
                    'summary' => [
                        'total_scanned' => $session->total_scanned,
                        'matched' => $session->matched,
                        'discrepancy' => $session->discrepancy,
                    ],
                ],
            );
        });

        return response()->json(['data' => $this->transform($session->fresh(['items.product']))]);
    }

    private function refreshSummary(StockOpnameSession $session): void
    {
        $session->load('items');
        $session->update([
            'total_scanned' => $session->items->count(),
            'matched' => $session->items->where('difference', 0)->count(),
            'discrepancy' => $session->items->where('difference', '!=', 0)->count(),
        ]);
    }

    private function transform(StockOpnameSession $session): array
    {
        return [
            'id' => $session->id,
            'session_no' => $session->session_no,
            'status' => $session->status,
            'created_at' => optional($session->created_at)->toDateTimeString(),
            'finalized_at' => optional($session->finalized_at)->toDateTimeString(),
            'summary' => [
                'total_scanned' => (int) ($session->total_scanned ?? 0),
                'matched' => (int) ($session->matched ?? 0),
                'discrepancy' => (int) ($session->discrepancy ?? 0),
            ],
            'items' => $session->items->map(fn (StockOpnameItem $item) => [
                'barcode' => $item->barcode,
                'product_id' => $item->product_id,
                'product_name' => $item->product?->name,
                'system_stock' => $item->system_stock,
                'physical_stock' => $item->physical_stock,
                'difference' => $item->difference,
                'reason' => $item->reason,
            ])->values(),
        ];
    }
}
