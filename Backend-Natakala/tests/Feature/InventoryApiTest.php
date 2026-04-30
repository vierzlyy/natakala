<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\Product;
use App\Models\Supplier;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class InventoryApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_documents_endpoint_requires_authentication(): void
    {
        $this->getJson('/api/documents')->assertUnauthorized();
    }

    public function test_product_can_store_putaway_location_fields(): void
    {
        $user = User::factory()->create();
        $category = Category::query()->create([
            'name' => 'Atasan',
            'description' => 'Produk atasan',
        ]);
        $supplier = Supplier::query()->create([
            'name' => 'PT Textile Makmur',
            'contact' => 'Budi',
            'address' => 'Bandung',
            'email' => 'supplier@example.test',
            'phone' => '081234567890',
        ]);

        $response = $this->actingAs($user, 'sanctum')->postJson('/api/products', [
            'sku' => 'NK-TS-001',
            'name' => 'T-Shirt Cotton Premium',
            'category_id' => $category->id,
            'supplier_id' => $supplier->id,
            'size' => 'L',
            'color' => 'Black',
            'storage_zone' => 'Zona A',
            'storage_aisle' => 'Aisle 01',
            'storage_rack' => 'Rak A1',
            'storage_bin' => 'Bin L-01',
            'purchase_price' => 85000,
            'selling_price' => 145000,
            'initial_stock' => 10,
            'minimum_stock' => 5,
            'barcode' => '899100000001',
        ]);

        $response
            ->assertCreated()
            ->assertJsonPath('data.storage_location', 'Zona A / Aisle 01 / Rak A1 / Bin L-01');

        $this->assertDatabaseHas('products', [
            'sku' => 'NK-TS-001',
            'storage_zone' => 'Zona A',
            'storage_aisle' => 'Aisle 01',
            'storage_rack' => 'Rak A1',
            'storage_bin' => 'Bin L-01',
        ]);
    }

    public function test_inbound_qc_only_increases_stock_by_accepted_quantity_and_creates_documents(): void
    {
        $user = User::factory()->create();
        $category = Category::query()->create([
            'name' => 'Atasan',
            'description' => 'Produk atasan',
        ]);
        $supplier = Supplier::query()->create([
            'name' => 'PT Textile Makmur',
            'contact' => 'Budi',
            'address' => 'Bandung',
            'email' => 'textile@example.test',
            'phone' => '081234567891',
        ]);
        $product = Product::query()->create([
            'sku' => 'NK-TS-002',
            'name' => 'T-Shirt Cotton',
            'category_id' => $category->id,
            'supplier_id' => $supplier->id,
            'size' => 'M',
            'color' => 'White',
            'purchase_price' => 80000,
            'selling_price' => 140000,
            'stock' => 10,
            'initial_stock' => 10,
            'minimum_stock' => 5,
            'barcode' => '899100000002',
        ]);

        $response = $this->actingAs($user, 'sanctum')->postJson('/api/transactions-in', [
            'supplier_id' => $supplier->id,
            'date' => now()->toDateString(),
            'notes' => 'PO-TEST-001',
            'items' => [
                [
                    'product_id' => $product->id,
                    'quantity' => 5,
                    'accepted_quantity' => 3,
                    'rejected_quantity' => 2,
                    'purchase_price' => 80000,
                    'qc_status' => 'Sebagian Reject',
                    'qc_note' => 'Ada noda pada dua pcs',
                ],
            ],
        ]);

        $response
            ->assertCreated()
            ->assertJsonPath('data.total_items', 5)
            ->assertJsonPath('data.accepted_items', 3)
            ->assertJsonPath('data.rejected_items', 2)
            ->assertJsonPath('data.total_amount', 240000);

        $this->assertDatabaseHas('products', [
            'id' => $product->id,
            'stock' => 13,
        ]);

        $this->assertDatabaseHas('transaction_in_items', [
            'product_id' => $product->id,
            'quantity' => 5,
            'accepted_quantity' => 3,
            'rejected_quantity' => 2,
            'qc_status' => 'Sebagian Reject',
        ]);

        $this->assertDatabaseHas('digital_documents', [
            'document_type' => 'GRN',
            'accepted_items' => 3,
            'rejected_items' => 2,
        ]);
        $this->assertDatabaseHas('digital_documents', ['document_type' => 'SURAT_JALAN']);
        $this->assertDatabaseHas('digital_documents', ['document_type' => 'FAKTUR']);
        $this->assertDatabaseCount('digital_documents', 3);

        $documents = $this->actingAs($user, 'sanctum')->getJson('/api/documents');

        $documents
            ->assertOk()
            ->assertJsonPath('data.total', 3)
            ->assertJsonPath('data.data.0.accepted_items', 3);
    }

    public function test_inbound_rejects_invalid_qc_totals(): void
    {
        $user = User::factory()->create();
        $category = Category::query()->create(['name' => 'Bawahan']);
        $supplier = Supplier::query()->create(['name' => 'CV Mode Nusantara']);
        $product = Product::query()->create([
            'sku' => 'NK-PT-001',
            'name' => 'Celana Chino',
            'category_id' => $category->id,
            'supplier_id' => $supplier->id,
            'purchase_price' => 120000,
            'selling_price' => 220000,
            'stock' => 4,
            'initial_stock' => 4,
            'minimum_stock' => 2,
            'barcode' => '899100000003',
        ]);

        $this->actingAs($user, 'sanctum')->postJson('/api/transactions-in', [
            'supplier_id' => $supplier->id,
            'items' => [
                [
                    'product_id' => $product->id,
                    'quantity' => 5,
                    'accepted_quantity' => 4,
                    'rejected_quantity' => 2,
                    'purchase_price' => 120000,
                ],
            ],
        ])->assertUnprocessable();
    }
}
