<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class TransactionOut extends Model
{
    use HasFactory;

    protected $fillable = ['transaction_no', 'date', 'notes', 'total_items', 'method_summary'];

    protected function casts(): array
    {
        return [
            'date' => 'date',
            'total_items' => 'integer',
        ];
    }

    public function items(): HasMany
    {
        return $this->hasMany(TransactionOutItem::class);
    }
}
