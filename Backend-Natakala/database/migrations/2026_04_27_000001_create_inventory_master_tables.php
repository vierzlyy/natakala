<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('categories', function (Blueprint $table): void {
            $table->id();
            $table->string('name')->unique();
            $table->text('description')->nullable();
            $table->timestamps();
        });

        Schema::create('suppliers', function (Blueprint $table): void {
            $table->id();
            $table->string('name')->unique();
            $table->string('contact')->nullable();
            $table->text('address')->nullable();
            $table->string('email')->nullable()->unique();
            $table->string('phone', 100)->nullable();
            $table->timestamps();
        });

        Schema::create('products', function (Blueprint $table): void {
            $table->id();
            $table->string('sku')->unique();
            $table->string('name');
            $table->foreignId('category_id')->constrained()->restrictOnDelete();
            $table->string('size', 50)->nullable();
            $table->string('color', 100)->nullable();
            $table->string('storage_zone', 100)->nullable()->index();
            $table->string('storage_aisle', 100)->nullable()->index();
            $table->string('storage_rack', 100)->nullable()->index();
            $table->string('storage_bin', 100)->nullable()->index();
            $table->unsignedBigInteger('purchase_price')->default(0);
            $table->unsignedBigInteger('selling_price')->default(0);
            $table->foreignId('supplier_id')->constrained()->restrictOnDelete();
            $table->integer('stock')->default(0);
            $table->integer('initial_stock')->default(0);
            $table->integer('minimum_stock')->default(5);
            $table->string('barcode')->unique();
            $table->string('image_path')->nullable();
            $table->unsignedInteger('sold_count')->default(0);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('products');
        Schema::dropIfExists('suppliers');
        Schema::dropIfExists('categories');
    }
};
