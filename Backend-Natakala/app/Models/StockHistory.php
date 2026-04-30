<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class StockHistory extends Model
{
    use HasFactory;

    protected $fillable = [
        'product_id',
        'date',
        'type',
        'quantity',
        'before_stock',
        'after_stock',
        'reference',
        'note',
    ];

    protected function casts(): array
    {
        return [
            'date' => 'datetime',
            'quantity' => 'integer',
            'before_stock' => 'integer',
            'after_stock' => 'integer',
        ];
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }
}
