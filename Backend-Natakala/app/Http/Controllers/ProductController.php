<?php

namespace App\Http\Controllers;

use App\Models\AuditLog;
use App\Models\Product;
use App\Models\StockHistory;
use App\Support\AuditLogger;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;

class ProductController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Product::query()->with(['category', 'supplier']);

        if ($search = trim((string) $request->input('search'))) {
            $query->where(function ($builder) use ($search): void {
                $builder
                    ->where('name', 'like', "%{$search}%")
                    ->orWhere('sku', 'like', "%{$search}%")
                    ->orWhere('barcode', 'like', "%{$search}%");
            });
        }

        if ($request->filled('category_id')) {
            $query->where('category_id', $request->integer('category_id'));
        }

        if ($request->filled('supplier_id')) {
            $query->where('supplier_id', $request->integer('supplier_id'));
        }

        if ($size = trim((string) $request->input('size'))) {
            $query->where('size', 'like', "%{$size}%");
        }

        $products = $query->latest()->paginate((int) $request->input('per_page', 10));

        return response()->json([
            'data' => [
                'current_page' => $products->currentPage(),
                'last_page' => $products->lastPage(),
                'total' => $products->total(),
                'data' => $products->getCollection()->map(fn (Product $product) => $this->transform($product)),
            ],
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'sku' => ['required', 'string', 'max:255', 'unique:products,sku'],
            'name' => ['required', 'string', 'max:255'],
            'category_id' => ['required', 'exists:categories,id'],
            'size' => ['nullable', 'string', 'max:50'],
            'color' => ['nullable', 'string', 'max:100'],
            'storage_zone' => ['nullable', 'string', 'max:100'],
            'storage_aisle' => ['nullable', 'string', 'max:100'],
            'storage_rack' => ['nullable', 'string', 'max:100'],
            'storage_bin' => ['nullable', 'string', 'max:100'],
            'purchase_price' => ['required', 'integer', 'min:0'],
            'selling_price' => ['required', 'integer', 'min:0', 'gte:purchase_price'],
            'supplier_id' => ['required', 'exists:suppliers,id'],
            'initial_stock' => ['required', 'integer', 'min:0'],
            'minimum_stock' => ['nullable', 'integer', 'min:0'],
            'barcode' => ['required', 'string', 'max:255', 'unique:products,barcode'],
            'image' => ['nullable', 'image', 'max:2048'],
        ]);

        $actor = $request->user();

        $product = DB::transaction(function () use ($request, $data, $actor) {
            if ($request->hasFile('image')) {
                $data['image_path'] = $request->file('image')->store('products', 'public');
            }

            $data['stock'] = $data['initial_stock'];
            $data['minimum_stock'] = $data['minimum_stock'] ?? 5;
            $data['sold_count'] = 0;

            $product = Product::query()->create($data);

            StockHistory::query()->create([
                'product_id' => $product->id,
                'date' => now(),
                'type' => 'initial_stock',
                'quantity' => $product->stock,
                'before_stock' => 0,
                'after_stock' => $product->stock,
                'reference' => 'INIT-'.$product->sku,
                'note' => 'Stok awal produk dibuat.',
            ]);

            AuditLogger::write(
                $actor,
                'product_created',
                'product',
                $product->id,
                $product->name,
                'Produk baru ditambahkan.',
                [
                    'sku' => $product->sku,
                    'barcode' => $product->barcode,
                    'stock' => $product->stock,
                ],
            );

            return $product->load(['category', 'supplier']);
        });

        return response()->json(['data' => $this->transform($product)], 201);
    }

    public function show(Product $product): JsonResponse
    {
        return response()->json([
            'data' => $this->transform($product->load(['category', 'supplier'])),
        ]);
    }

    public function update(Request $request, Product $product): JsonResponse
    {
        $data = $request->validate([
            'sku' => ['required', 'string', 'max:255', Rule::unique('products', 'sku')->ignore($product->id)],
            'name' => ['required', 'string', 'max:255'],
            'category_id' => ['required', 'exists:categories,id'],
            'size' => ['nullable', 'string', 'max:50'],
            'color' => ['nullable', 'string', 'max:100'],
            'storage_zone' => ['nullable', 'string', 'max:100'],
            'storage_aisle' => ['nullable', 'string', 'max:100'],
            'storage_rack' => ['nullable', 'string', 'max:100'],
            'storage_bin' => ['nullable', 'string', 'max:100'],
            'purchase_price' => ['required', 'integer', 'min:0'],
            'selling_price' => ['required', 'integer', 'min:0', 'gte:purchase_price'],
            'supplier_id' => ['required', 'exists:suppliers,id'],
            'initial_stock' => ['required', 'integer', 'min:0'],
            'minimum_stock' => ['nullable', 'integer', 'min:0'],
            'barcode' => ['required', 'string', 'max:255', Rule::unique('products', 'barcode')->ignore($product->id)],
            'image' => ['nullable', 'image', 'max:2048'],
        ]);

        $actor = $request->user();

        $updated = DB::transaction(function () use ($request, $product, $data, $actor) {
            $before = $product->only([
                'sku',
                'name',
                'category_id',
                'supplier_id',
                'size',
                'color',
                'storage_zone',
                'storage_aisle',
                'storage_rack',
                'storage_bin',
                'purchase_price',
                'selling_price',
                'stock',
                'initial_stock',
                'minimum_stock',
                'barcode',
            ]);

            $beforeStock = $product->stock;

            if ($request->hasFile('image')) {
                if ($product->image_path) {
                    Storage::disk('public')->delete($product->image_path);
                }

                $data['image_path'] = $request->file('image')->store('products', 'public');
            }

            $data['stock'] = $data['initial_stock'];
            $product->update($data);

            if ($beforeStock !== $product->stock) {
                StockHistory::query()->create([
                    'product_id' => $product->id,
                    'date' => now(),
                    'type' => 'manual_adjustment',
                    'quantity' => $product->stock - $beforeStock,
                    'before_stock' => $beforeStock,
                    'after_stock' => $product->stock,
                    'reference' => 'EDIT-'.$product->sku,
                    'note' => 'Stok diperbarui dari form produk.',
                ]);
            }

            AuditLogger::write(
                $actor,
                'product_updated',
                'product',
                $product->id,
                $product->name,
                'Produk diperbarui.',
                [
                    'before' => $before,
                    'after' => $product->only([
                        'sku',
                        'name',
                        'category_id',
                        'supplier_id',
                        'size',
                        'color',
                        'storage_zone',
                        'storage_aisle',
                        'storage_rack',
                        'storage_bin',
                        'purchase_price',
                        'selling_price',
                        'stock',
                        'initial_stock',
                        'minimum_stock',
                        'barcode',
                    ]),
                ],
            );

            return $product->fresh(['category', 'supplier']);
        });

        return response()->json(['data' => $this->transform($updated)]);
    }

    public function destroy(Request $request, Product $product): JsonResponse
    {
        AuditLogger::write(
            $request->user(),
            'product_deleted',
            'product',
            $product->id,
            $product->name,
            'Produk dihapus.',
            [
                'sku' => $product->sku,
                'barcode' => $product->barcode,
            ],
        );

        if ($product->image_path) {
            Storage::disk('public')->delete($product->image_path);
        }

        $product->delete();

        return response()->json(['message' => 'Produk berhasil dihapus.']);
    }

    public function history(Product $product): JsonResponse
    {
        $stockHistory = StockHistory::query()
            ->where('product_id', $product->id)
            ->latest('date')
            ->get()
            ->map(fn (StockHistory $item) => [
                'id' => $item->id,
                'date' => optional($item->date)->toDateTimeString(),
                'type' => $item->type,
                'quantity' => $item->quantity,
                'before_stock' => $item->before_stock,
                'after_stock' => $item->after_stock,
                'reference' => $item->reference,
                'note' => $item->note,
            ]);

        $auditTrail = AuditLog::query()
            ->where('entity_type', 'product')
            ->where('entity_id', $product->id)
            ->latest()
            ->get()
            ->map(fn (AuditLog $log) => [
                'id' => $log->id,
                'actor_name' => $log->actor_name,
                'action' => $log->action,
                'description' => $log->description,
                'meta' => $log->meta,
                'created_at' => optional($log->created_at)->toDateTimeString(),
            ]);

        return response()->json([
            'data' => [
                'stock_history' => $stockHistory,
                'audit_trail' => $auditTrail,
            ],
        ]);
    }

    private function transform(Product $product): array
    {
        $imageUrl = $product->image_path
            ? request()->getSchemeAndHttpHost().'/storage/'.ltrim($product->image_path, '/')
            : null;

        return [
            'id' => $product->id,
            'sku' => $product->sku,
            'name' => $product->name,
            'category_id' => $product->category_id,
            'category_name' => $product->category?->name,
            'size' => $product->size,
            'color' => $product->color,
            'purchase_price' => $product->purchase_price,
            'selling_price' => $product->selling_price,
            'supplier_id' => $product->supplier_id,
            'supplier_name' => $product->supplier?->name,
            'storage_zone' => $product->storage_zone,
            'storage_aisle' => $product->storage_aisle,
            'storage_rack' => $product->storage_rack,
            'storage_bin' => $product->storage_bin,
            'storage_location' => collect([
                $product->storage_zone,
                $product->storage_aisle,
                $product->storage_rack,
                $product->storage_bin,
            ])->filter()->implode(' / '),
            'stock' => $product->stock,
            'initial_stock' => $product->initial_stock,
            'minimum_stock' => $product->minimum_stock,
            'barcode' => $product->barcode,
            'image_path' => $product->image_path,
            'image_url' => $imageUrl,
            'sold_count' => $product->sold_count,
        ];
    }
}
