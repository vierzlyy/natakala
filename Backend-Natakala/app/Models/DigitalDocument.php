<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class DigitalDocument extends Model
{
    use HasFactory;

    protected $fillable = [
        'document_no',
        'document_type',
        'title',
        'transaction_in_id',
        'transaction_no',
        'supplier_name',
        'date',
        'status',
        'reference_no',
        'notes',
        'total_items',
        'accepted_items',
        'rejected_items',
        'total_amount',
        'items',
    ];

    protected function casts(): array
    {
        return [
            'date' => 'date',
            'total_items' => 'integer',
            'accepted_items' => 'integer',
            'rejected_items' => 'integer',
            'total_amount' => 'integer',
            'items' => 'array',
        ];
    }

    public function transactionIn(): BelongsTo
    {
        return $this->belongsTo(TransactionIn::class);
    }
}
