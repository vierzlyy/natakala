<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class StockOpnameSession extends Model
{
    use HasFactory;

    protected $fillable = [
        'session_no',
        'status',
        'created_by',
        'finalized_at',
        'total_scanned',
        'matched',
        'discrepancy',
    ];

    protected function casts(): array
    {
        return [
            'finalized_at' => 'datetime',
            'total_scanned' => 'integer',
            'matched' => 'integer',
            'discrepancy' => 'integer',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function items(): HasMany
    {
        return $this->hasMany(StockOpnameItem::class, 'session_id');
    }
}
