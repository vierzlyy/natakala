<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('transaction_ins', function (Blueprint $table): void {
            $table->id();
            $table->string('transaction_no')->unique();
            $table->foreignId('supplier_id')->constrained()->restrictOnDelete();
            $table->date('date')->index();
            $table->text('notes')->nullable();
            $table->unsignedInteger('total_items')->default(0);
            $table->unsignedInteger('accepted_items')->default(0);
            $table->unsignedInteger('rejected_items')->default(0);
            $table->unsignedBigInteger('total_amount')->default(0);
            $table->timestamps();
        });

        Schema::create('transaction_in_items', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('transaction_in_id')->constrained('transaction_ins')->cascadeOnDelete();
            $table->foreignId('product_id')->constrained()->restrictOnDelete();
            $table->unsignedInteger('quantity');
            $table->unsignedInteger('accepted_quantity')->default(0);
            $table->unsignedInteger('rejected_quantity')->default(0);
            $table->unsignedBigInteger('purchase_price')->default(0);
            $table->string('qc_status', 100)->default('Lulus QC');
            $table->text('qc_note')->nullable();
            $table->timestamps();
        });

        Schema::create('transaction_outs', function (Blueprint $table): void {
            $table->id();
            $table->string('transaction_no')->unique();
            $table->date('date')->index();
            $table->text('notes')->nullable();
            $table->unsignedInteger('total_items')->default(0);
            $table->string('method_summary')->nullable();
            $table->timestamps();
        });

        Schema::create('transaction_out_items', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('transaction_out_id')->constrained('transaction_outs')->cascadeOnDelete();
            $table->foreignId('product_id')->constrained()->restrictOnDelete();
            $table->unsignedInteger('quantity');
            $table->string('method');
            $table->timestamps();
        });

        Schema::create('digital_documents', function (Blueprint $table): void {
            $table->id();
            $table->string('document_no')->unique();
            $table->string('document_type', 50)->index();
            $table->string('title');
            $table->foreignId('transaction_in_id')->nullable()->constrained('transaction_ins')->nullOnDelete();
            $table->string('transaction_no')->nullable()->index();
            $table->string('supplier_name')->nullable();
            $table->date('date')->nullable()->index();
            $table->string('status', 100)->default('Draft')->index();
            $table->string('reference_no')->nullable();
            $table->text('notes')->nullable();
            $table->unsignedInteger('total_items')->default(0);
            $table->unsignedInteger('accepted_items')->default(0);
            $table->unsignedInteger('rejected_items')->default(0);
            $table->unsignedBigInteger('total_amount')->default(0);
            $table->json('items')->nullable();
            $table->timestamps();

            $table->unique(['transaction_in_id', 'document_type']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('digital_documents');
        Schema::dropIfExists('transaction_out_items');
        Schema::dropIfExists('transaction_outs');
        Schema::dropIfExists('transaction_in_items');
        Schema::dropIfExists('transaction_ins');
    }
};
