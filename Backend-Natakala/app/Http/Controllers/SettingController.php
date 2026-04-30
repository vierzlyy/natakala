<?php

namespace App\Http\Controllers;

use App\Models\SystemSetting;
use App\Support\AuditLogger;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\StreamedResponse;

class SettingController extends Controller
{
    public function show(): JsonResponse
    {
        return response()->json([
            'data' => $this->settings(),
        ]);
    }

    public function update(Request $request): JsonResponse
    {
        $data = $request->validate([
            'minimum_stock' => ['nullable', 'integer', 'min:0'],
            'barcode_format' => ['nullable', 'string', 'max:100'],
            'currency' => ['nullable', 'string', 'max:20'],
            'sizes' => ['nullable', 'array'],
        ]);

        $settings = $this->settings();
        $before = $settings->only(['minimum_stock', 'barcode_format', 'currency', 'sizes']);

        $settings->update([
            'minimum_stock' => $data['minimum_stock'] ?? $settings->minimum_stock,
            'barcode_format' => $data['barcode_format'] ?? $settings->barcode_format,
            'currency' => $data['currency'] ?? $settings->currency,
            'sizes' => $data['sizes'] ?? $settings->sizes,
        ]);

        AuditLogger::write(
            $request->user(),
            'settings_updated',
            'settings',
            $settings->id,
            'System Settings',
            'Pengaturan sistem diperbarui.',
            [
                'before' => $before,
                'after' => $settings->only(['minimum_stock', 'barcode_format', 'currency', 'sizes']),
            ],
        );

        return response()->json(['data' => $settings]);
    }

    public function backup(Request $request): StreamedResponse
    {
        $settings = $this->settings();

        AuditLogger::write(
            $request->user(),
            'settings_backup_exported',
            'settings',
            $settings->id,
            'System Settings',
            'Backup pengaturan diunduh.',
        );

        return response()->streamDownload(function () use ($settings): void {
            echo json_encode(['settings' => $settings], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
        }, 'natakala-settings-backup.json', [
            'Content-Type' => 'application/json; charset=UTF-8',
        ]);
    }

    public function restore(Request $request): JsonResponse
    {
        $request->validate([
            'file' => ['required', 'file', 'mimes:json,txt'],
        ]);

        $content = json_decode($request->file('file')->get(), true);
        if (!is_array($content) || !isset($content['settings'])) {
            return response()->json(['message' => 'File backup tidak valid.'], 422);
        }

        $settings = $this->settings();
        $before = $settings->only(['minimum_stock', 'barcode_format', 'currency', 'sizes']);

        $settings->update([
            'minimum_stock' => $content['settings']['minimum_stock'] ?? 5,
            'barcode_format' => $content['settings']['barcode_format'] ?? 'CODE128',
            'currency' => $content['settings']['currency'] ?? 'IDR',
            'sizes' => $content['settings']['sizes'] ?? ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'Allsize', 'Bigsize'],
        ]);

        AuditLogger::write(
            $request->user(),
            'settings_restored',
            'settings',
            $settings->id,
            'System Settings',
            'Pengaturan sistem dipulihkan dari file backup.',
            [
                'before' => $before,
                'after' => $settings->only(['minimum_stock', 'barcode_format', 'currency', 'sizes']),
            ],
        );

        return response()->json([
            'message' => 'Pengaturan berhasil dipulihkan.',
            'data' => $settings,
        ]);
    }

    private function settings(): SystemSetting
    {
        return SystemSetting::query()->firstOrCreate([], [
            'minimum_stock' => 5,
            'barcode_format' => 'CODE128',
            'currency' => 'IDR',
            'sizes' => ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'Allsize', 'Bigsize'],
        ]);
    }
}