<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class SystemSetting extends Model
{
    use HasFactory;

    protected $fillable = ['minimum_stock', 'barcode_format', 'currency', 'sizes'];

    protected function casts(): array
    {
        return [
            'minimum_stock' => 'integer',
            'sizes' => 'array',
        ];
    }
}
