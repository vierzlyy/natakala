<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class TransactionIn extends Model
{
    use HasFactory;

    protected $fillable = [
        'transaction_no',
        'supplier_id',
        'date',
        'notes',
        'inbound_status',
        'total_items',
        'accepted_items',
        'rejected_items',
        'total_amount',
    ];

    protected function casts(): array
    {
        return [
            'date' => 'date',
            'total_items' => 'integer',
            'accepted_items' => 'integer',
            'rejected_items' => 'integer',
            'total_amount' => 'integer',
        ];
    }

    public function supplier(): BelongsTo
    {
        return $this->belongsTo(Supplier::class);
    }

    public function items(): HasMany
    {
        return $this->hasMany(TransactionInItem::class);
    }

    public function documents(): HasMany
    {
        return $this->hasMany(DigitalDocument::class);
    }
}
