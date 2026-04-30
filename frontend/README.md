# NataKala Frontend

Frontend admin untuk proyek `NataKala - E-Inventory Toko/Gudang Pakaian`.

## Instalasi

```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

Build production:

```bash
cd frontend
npm run build
npm run preview
```

## Stack

- React.js
- React Router DOM
- Axios
- Tailwind CSS
- Recharts
- React Hot Toast

## Contoh `.env`

```env
VITE_API_BASE_URL=http://127.0.0.1:8000
VITE_ENABLE_MOCK_API=false
VITE_ENABLE_LOCAL_LOGIN=false
VITE_LOCAL_ADMIN_EMAIL=admin@natakala.test
VITE_LOCAL_ADMIN_PASSWORD=password123
```

Nilai di atas akan dipakai sebagai `baseURL` Axios menjadi `http://127.0.0.1:8000/api`.
Jika backend belum siap, Anda tetap bisa login lokal memakai kredensial pada `VITE_LOCAL_ADMIN_EMAIL` dan `VITE_LOCAL_ADMIN_PASSWORD`.
Default aplikasi memakai backend Laravel asli di `VITE_API_BASE_URL`. Mock backend berbasis `localStorage` hanya aktif jika `VITE_ENABLE_MOCK_API=true`.

## Endpoint Laravel yang Dipakai

- `POST /api/login`
- `POST /api/logout`
- `GET /api/user`
- `GET /api/dashboard`
- `GET /api/products`
- `POST /api/products`
- `GET /api/products/{id}`
- `PUT /api/products/{id}`
- `DELETE /api/products/{id}`
- `GET /api/suppliers`
- `POST /api/suppliers`
- `PUT /api/suppliers/{id}`
- `DELETE /api/suppliers/{id}`
- `GET /api/categories`
- `POST /api/categories`
- `PUT /api/categories/{id}`
- `DELETE /api/categories/{id}`
- `GET /api/transactions-in`
- `POST /api/transactions-in`
- `GET /api/transactions-out`
- `POST /api/transactions-out`
- `GET /api/stock-opname`
- `POST /api/stock-opname/start`
- `POST /api/stock-opname/{id}/scan`
- `POST /api/stock-opname/{id}/adjust`
- `GET /api/reports/stock`
- `GET /api/reports/transactions-in`
- `GET /api/reports/transactions-out`
- `GET /api/reports/best-seller`
- `GET /api/reports/inventory-value`
- `GET /api/reports/opname`
- `GET /api/reports/export/pdf`
- `GET /api/reports/export/excel`
- `GET /api/settings`
- `PUT /api/settings`

Opsional jika backend tersedia:

- `POST /api/settings/backup`
- `POST /api/settings/restore`

## Contoh Response API

### Login

```json
{
  "token": "1|laravel_sanctum_token",
  "user": {
    "id": 1,
    "name": "Admin NataKala",
    "email": "admin@natakala.test",
    "role": "admin"
  }
}
```

### User

```json
{
  "id": 1,
  "name": "Admin NataKala",
  "email": "admin@natakala.test",
  "role": "admin"
}
```

### Dashboard

```json
{
  "data": {
    "summary": {
      "total_products": 240,
      "total_stock": 1930,
      "inventory_value": 278500000,
      "low_stock": 12,
      "out_of_stock": 4,
      "currency": "IDR"
    },
    "best_seller": {
      "name": "Kemeja Linen Oversize",
      "total_sold": 184
    },
    "transaction_chart": [
      { "label": "Sen", "in": 30, "out": 18 },
      { "label": "Sel", "in": 42, "out": 26 }
    ],
    "low_stock_products": [
      {
        "id": 1,
        "sku": "NK-SH-001",
        "name": "Shirt Basic",
        "stock": 2,
        "minimum_stock": 5,
        "supplier_name": "CV Mode Nusantara"
      }
    ]
  }
}
```

### Produk List

```json
{
  "data": {
    "data": [
      {
        "id": 1,
        "sku": "NK-TS-001",
        "name": "T-Shirt Cotton Premium",
        "category_id": 2,
        "category_name": "Atasan",
        "size": "L",
        "color": "Black",
        "purchase_price": 85000,
        "selling_price": 145000,
        "supplier_id": 3,
        "supplier_name": "PT Textile Makmur",
        "stock": 20,
        "minimum_stock": 5,
        "barcode": "8991234567890",
        "image_url": "http://127.0.0.1:8000/storage/products/shirt.jpg"
      }
    ],
    "current_page": 1,
    "last_page": 4,
    "total": 34
  }
}
```

### Detail Produk

```json
{
  "data": {
    "id": 1,
    "sku": "NK-TS-001",
    "name": "T-Shirt Cotton Premium",
    "category_id": 2,
    "category_name": "Atasan",
    "supplier_id": 3,
    "supplier_name": "PT Textile Makmur",
    "size": "L",
    "color": "Black",
    "purchase_price": 85000,
    "selling_price": 145000,
    "stock": 20,
    "minimum_stock": 5,
    "barcode": "8991234567890",
    "image_url": "http://127.0.0.1:8000/storage/products/shirt.jpg"
  }
}
```

### Supplier / Kategori

```json
{
  "data": [
    {
      "id": 1,
      "name": "PT Textile Makmur",
      "contact": "Budi",
      "address": "Bandung",
      "email": "sales@textile.test",
      "phone": "08123456789"
    }
  ]
}
```

```json
{
  "data": [
    {
      "id": 1,
      "name": "Atasan",
      "description": "Kategori pakaian bagian atas"
    }
  ]
}
```

### Barang Masuk / Keluar

```json
{
  "data": [
    {
      "id": 1,
      "transaction_no": "IN-20260424-001",
      "supplier_name": "PT Textile Makmur",
      "date": "2026-04-24",
      "total_items": 15,
      "total_amount": 2400000
    }
  ]
}
```

```json
{
  "data": [
    {
      "id": 1,
      "transaction_no": "OUT-20260424-001",
      "date": "2026-04-24",
      "total_items": 6,
      "method_summary": "Penjualan",
      "notes": "Order marketplace"
    }
  ]
}
```

### Stock Opname

```json
{
  "data": [
    {
      "id": 1,
      "session_no": "OPN-20260424-001",
      "status": "open",
      "created_at": "2026-04-24 09:00:00",
      "items": [
        {
          "barcode": "8991234567890",
          "product_name": "T-Shirt Cotton Premium",
          "system_stock": 20,
          "physical_stock": 18,
          "difference": -2,
          "reason": "Barang display"
        }
      ]
    }
  ]
}
```

### Report

```json
{
  "data": {
    "summary": {
      "total_records": 18,
      "period": "2026-04"
    },
    "chart": [
      { "label": "Minggu 1", "value": 40 },
      { "label": "Minggu 2", "value": 55 }
    ],
    "data": [
      {
        "label": "Kemeja Linen Oversize",
        "value": 184
      }
    ]
  }
}
```

### Settings

```json
{
  "data": {
    "minimum_stock": 5,
    "barcode_format": "CODE128",
    "currency": "IDR",
    "sizes": ["S", "M", "L", "XL"]
  }
}
```

## Catatan Integrasi

- Token disimpan pada `localStorage` dengan key `natakala_token`.
- Interceptor Axios otomatis menambahkan `Authorization: Bearer <token>`.
- Jika API mengembalikan `401`, frontend akan membersihkan token dan redirect ke `/login`.
- Untuk upload gambar produk, frontend mengirim `multipart/form-data`.
- Untuk update produk multipart, frontend memakai pola Laravel `POST /products/{id}?_method=PUT`.
