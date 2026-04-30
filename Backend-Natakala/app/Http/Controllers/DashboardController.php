<?php

namespace App\Http\Controllers;

use App\Models\Product;
use App\Models\TransactionIn;
use App\Models\TransactionOut;
use Illuminate\Http\JsonResponse;

class DashboardController extends Controller
{
    public function __invoke(): JsonResponse
    {
        $products = Product::query()->with(['category', 'supplier'])->get();
        $lowStock = $products->filter(fn (Product $product) => $product->stock > 0 && $product->stock <= $product->minimum_stock)->values();

        return response()->json([
            'data' => [
                'summary' => [
                    'total_products' => $products->count(),
                    'total_stock' => $products->sum('stock'),
                    'inventory_value' => $products->sum(fn (Product $product) => $product->stock * $product->purchase_price),
                    'low_stock' => $lowStock->count(),
                    'out_of_stock' => $products->where('stock', '<=', 0)->count(),
                    'currency' => 'IDR',
                ],
                'best_seller' => optional($products->sortByDesc('sold_count')->first(), function (Product $product) {
                    return [
                        'name' => $product->name,
                        'total_sold' => $product->sold_count,
                    ];
                }),
                'transaction_chart' => collect(range(6, 0))->map(function (int $daysAgo) {
                    $date = now()->subDays($daysAgo)->toDateString();

                    return [
                        'label' => now()->subDays($daysAgo)->locale('id')->translatedFormat('D'),
                        'in' => (int) TransactionIn::query()->whereDate('date', $date)->sum('accepted_items'),
                        'out' => (int) TransactionOut::query()->whereDate('date', $date)->sum('total_items'),
                    ];
                })->values(),
                'low_stock_products' => $lowStock->map(fn (Product $product) => [
                    'id' => $product->id,
                    'sku' => $product->sku,
                    'name' => $product->name,
                    'category_name' => $product->category?->name,
                    'supplier_name' => $product->supplier?->name,
                    'storage_location' => $this->storageLocation($product),
                    'stock' => $product->stock,
                    'minimum_stock' => $product->minimum_stock,
                ]),
            ],
        ]);
    }

    private function storageLocation(Product $product): string
    {
        return collect([
            $product->storage_zone,
            $product->storage_aisle,
            $product->storage_rack,
            $product->storage_bin,
        ])->filter()->implode(' / ') ?: '-';
    }
}
