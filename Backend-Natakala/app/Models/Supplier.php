<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Supplier extends Model
{
    use HasFactory;

    protected $fillable = ['name', 'contact', 'address', 'email', 'phone'];

    public function products(): HasMany
    {
        return $this->hasMany(Product::class);
    }

    public function transactionsIn(): HasMany
    {
        return $this->hasMany(TransactionIn::class);
    }
}
