<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Product extends Model
{
    use HasFactory;

    protected $fillable = [
        'sku',
        'name',
        'category_id',
        'size',
        'color',
        'storage_zone',
        'storage_aisle',
        'storage_rack',
        'storage_bin',
        'purchase_price',
        'selling_price',
        'supplier_id',
        'stock',
        'initial_stock',
        'minimum_stock',
        'barcode',
        'image_path',
        'sold_count',
    ];

    protected function casts(): array
    {
        return [
            'purchase_price' => 'integer',
            'selling_price' => 'integer',
            'stock' => 'integer',
            'initial_stock' => 'integer',
            'minimum_stock' => 'integer',
            'sold_count' => 'integer',
        ];
    }

    public function category(): BelongsTo
    {
        return $this->belongsTo(Category::class);
    }

    public function supplier(): BelongsTo
    {
        return $this->belongsTo(Supplier::class);
    }

    public function stockHistories(): HasMany
    {
        return $this->hasMany(StockHistory::class);
    }
}
