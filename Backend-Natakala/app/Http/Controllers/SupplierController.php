<?php

namespace App\Http\Controllers;

use App\Models\Supplier;
use App\Support\AuditLogger;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class SupplierController extends Controller
{
    public function index(): JsonResponse
    {
        return response()->json([
            'data' => Supplier::query()->latest()->get(),
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:255', 'unique:suppliers,name'],
            'contact' => ['nullable', 'string', 'max:255'],
            'address' => ['nullable', 'string'],
            'email' => ['nullable', 'email', 'max:255', 'unique:suppliers,email'],
            'phone' => ['nullable', 'string', 'max:100'],
        ]);

        $supplier = Supplier::query()->create($data);

        AuditLogger::write(
            $request->user(),
            'supplier_created',
            'supplier',
            $supplier->id,
            $supplier->name,
            'Supplier baru ditambahkan.',
            $supplier->only(['contact', 'address', 'email', 'phone']),
        );

        return response()->json(['data' => $supplier], 201);
    }

    public function update(Request $request, Supplier $supplier): JsonResponse
    {
        $before = $supplier->only(['name', 'contact', 'address', 'email', 'phone']);

        $data = $request->validate([
            'name' => ['required', 'string', 'max:255', Rule::unique('suppliers', 'name')->ignore($supplier->id)],
            'contact' => ['nullable', 'string', 'max:255'],
            'address' => ['nullable', 'string'],
            'email' => ['nullable', 'email', 'max:255', Rule::unique('suppliers', 'email')->ignore($supplier->id)],
            'phone' => ['nullable', 'string', 'max:100'],
        ]);

        $supplier->update($data);

        AuditLogger::write(
            $request->user(),
            'supplier_updated',
            'supplier',
            $supplier->id,
            $supplier->name,
            'Supplier diperbarui.',
            [
                'before' => $before,
                'after' => $supplier->only(['name', 'contact', 'address', 'email', 'phone']),
            ],
        );

        return response()->json(['data' => $supplier]);
    }

    public function destroy(Request $request, Supplier $supplier): JsonResponse
    {
        if ($supplier->products()->exists()) {
            return response()->json(['message' => 'Supplier masih digunakan oleh produk dan tidak bisa dihapus.'], 422);
        }

        AuditLogger::write(
            $request->user(),
            'supplier_deleted',
            'supplier',
            $supplier->id,
            $supplier->name,
            'Supplier dihapus.',
        );

        $supplier->delete();

        return response()->json(['message' => 'Supplier berhasil dihapus.']);
    }
}