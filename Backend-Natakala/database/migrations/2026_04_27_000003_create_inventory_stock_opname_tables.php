<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('stock_opname_sessions', function (Blueprint $table): void {
            $table->id();
            $table->string('session_no')->unique();
            $table->string('status')->default('open')->index();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('finalized_at')->nullable();
            $table->unsignedInteger('total_scanned')->default(0);
            $table->unsignedInteger('matched')->default(0);
            $table->unsignedInteger('discrepancy')->default(0);
            $table->timestamps();
        });

        Schema::create('stock_opname_items', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('session_id')->constrained('stock_opname_sessions')->cascadeOnDelete();
            $table->foreignId('product_id')->constrained()->restrictOnDelete();
            $table->string('barcode')->index();
            $table->integer('system_stock')->default(0);
            $table->integer('physical_stock')->default(0);
            $table->integer('difference')->default(0);
            $table->text('reason')->nullable();
            $table->timestamps();

            $table->unique(['session_id', 'product_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('stock_opname_items');
        Schema::dropIfExists('stock_opname_sessions');
    }
};
