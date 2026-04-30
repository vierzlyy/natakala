<?php

namespace Database\Seeders;

use App\Models\Category;
use App\Models\Product;
use App\Models\Supplier;
use App\Models\SystemSetting;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        User::query()->updateOrCreate(
            ['email' => 'admin@natakala.test'],
            [
                'name' => 'Admin NataKala',
                'password' => Hash::make('password123'),
                'role' => 'admin',
            ],
        );

        SystemSetting::query()->updateOrCreate(
            ['id' => 1],
            [
                'minimum_stock' => 5,
                'barcode_format' => 'CODE128',
                'currency' => 'IDR',
                'sizes' => ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'Allsize', 'Bigsize'],
            ],
        );

        $atasan = Category::query()->updateOrCreate(['name' => 'Atasan'], ['description' => 'Kemeja, kaos, blouse, dan sejenisnya']);
        $bawahan = Category::query()->updateOrCreate(['name' => 'Bawahan'], ['description' => 'Celana, rok, dan bawahan lainnya']);
        $outerwear = Category::query()->updateOrCreate(['name' => 'Outerwear'], ['description' => 'Jaket, cardigan, hoodie, dan layer luar']);

        $supplierA = Supplier::query()->updateOrCreate(
            ['name' => 'PT Textile Makmur'],
            ['contact' => 'Budi Santoso', 'address' => 'Bandung, Jawa Barat', 'email' => 'sales@textilemakmur.test', 'phone' => '081234567890'],
        );

        $supplierB = Supplier::query()->updateOrCreate(
            ['name' => 'CV Mode Nusantara'],
            ['contact' => 'Nita Wardani', 'address' => 'Solo, Jawa Tengah', 'email' => 'hello@modenusantara.test', 'phone' => '082112223334'],
        );

        Product::query()->updateOrCreate(
            ['sku' => 'NK-TS-001'],
            [
                'name' => 'T-Shirt Cotton Premium',
                'category_id' => $atasan->id,
                'size' => 'Allsize',
                'color' => 'Black',
                'purchase_price' => 85000,
                'selling_price' => 145000,
                'supplier_id' => $supplierA->id,
                'stock' => 20,
                'initial_stock' => 20,
                'minimum_stock' => 5,
                'barcode' => '899100000001',
                'sold_count' => 34,
            ],
        );

        Product::query()->updateOrCreate(
            ['sku' => 'NK-SH-002'],
            [
                'name' => 'Kemeja Linen Oversize',
                'category_id' => $atasan->id,
                'size' => 'Bigsize',
                'color' => 'Beige',
                'purchase_price' => 120000,
                'selling_price' => 219000,
                'supplier_id' => $supplierB->id,
                'stock' => 4,
                'initial_stock' => 8,
                'minimum_stock' => 5,
                'barcode' => '899100000002',
                'sold_count' => 72,
            ],
        );
    }
}
