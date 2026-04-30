<?php

namespace App\Http\Controllers;

use App\Models\Category;
use App\Support\AuditLogger;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class CategoryController extends Controller
{
    public function index(): JsonResponse
    {
        return response()->json([
            'data' => Category::query()->latest()->get(),
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:255', 'unique:categories,name'],
            'description' => ['nullable', 'string'],
        ]);

        $category = Category::query()->create($data);

        AuditLogger::write(
            $request->user(),
            'category_created',
            'category',
            $category->id,
            $category->name,
            'Kategori baru ditambahkan.',
            ['description' => $category->description],
        );

        return response()->json(['data' => $category], 201);
    }

    public function update(Request $request, Category $category): JsonResponse
    {
        $before = $category->only(['name', 'description']);

        $data = $request->validate([
            'name' => ['required', 'string', 'max:255', Rule::unique('categories', 'name')->ignore($category->id)],
            'description' => ['nullable', 'string'],
        ]);

        $category->update($data);

        AuditLogger::write(
            $request->user(),
            'category_updated',
            'category',
            $category->id,
            $category->name,
            'Kategori diperbarui.',
            [
                'before' => $before,
                'after' => $category->only(['name', 'description']),
            ],
        );

        return response()->json(['data' => $category]);
    }

    public function destroy(Request $request, Category $category): JsonResponse
    {
        if ($category->products()->exists()) {
            return response()->json(['message' => 'Kategori masih digunakan oleh produk dan tidak bisa dihapus.'], 422);
        }

        AuditLogger::write(
            $request->user(),
            'category_deleted',
            'category',
            $category->id,
            $category->name,
            'Kategori dihapus.',
        );

        $category->delete();

        return response()->json(['message' => 'Kategori berhasil dihapus.']);
    }
}