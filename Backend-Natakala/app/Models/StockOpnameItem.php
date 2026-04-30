<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class StockOpnameItem extends Model
{
    use HasFactory;

    protected $fillable = [
        'session_id',
        'product_id',
        'barcode',
        'system_stock',
        'physical_stock',
        'difference',
        'reason',
    ];

    protected function casts(): array
    {
        return [
            'system_stock' => 'integer',
            'physical_stock' => 'integer',
            'difference' => 'integer',
        ];
    }

    public function session(): BelongsTo
    {
        return $this->belongsTo(StockOpnameSession::class, 'session_id');
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }
}
