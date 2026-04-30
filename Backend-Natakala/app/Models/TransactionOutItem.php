<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TransactionOutItem extends Model
{
    use HasFactory;

    protected $fillable = ['transaction_out_id', 'product_id', 'quantity', 'method'];

    protected function casts(): array
    {
        return [
            'quantity' => 'integer',
        ];
    }

    public function transaction(): BelongsTo
    {
        return $this->belongsTo(TransactionOut::class, 'transaction_out_id');
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }
}
