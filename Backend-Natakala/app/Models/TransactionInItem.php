<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TransactionInItem extends Model
{
    use HasFactory;

    protected $fillable = [
        'transaction_in_id',
        'product_id',
        'quantity',
        'accepted_quantity',
        'rejected_quantity',
        'purchase_price',
        'qc_status',
        'qc_note',
    ];

    protected function casts(): array
    {
        return [
            'quantity' => 'integer',
            'accepted_quantity' => 'integer',
            'rejected_quantity' => 'integer',
            'purchase_price' => 'integer',
        ];
    }

    public function transaction(): BelongsTo
    {
        return $this->belongsTo(TransactionIn::class, 'transaction_in_id');
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }
}
