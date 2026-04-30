<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('transaction_ins', function (Blueprint $table) {
            $table->string('inbound_status')->default('Barang Baru')->after('date');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('transaction_ins', function (Blueprint $table) {
            $table->dropColumn('inbound_status');
        });
    }
};
