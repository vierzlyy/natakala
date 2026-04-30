<?php

namespace App\Support;

use App\Models\DigitalDocument;
use App\Models\TransactionIn;

class InboundDocumentFactory
{
    public static function ensureForTransaction(TransactionIn $transaction): void
    {
        foreach (['GRN', 'SURAT_JALAN', 'FAKTUR'] as $type) {
            DigitalDocument::query()->firstOrCreate(
                [
                    'transaction_in_id' => $transaction->id,
                    'document_type' => $type,
                ],
                self::payload($transaction->loadMissing(['supplier', 'items.product']), $type),
            );
        }
    }

    public static function createForTransaction(TransactionIn $transaction): void
    {
        foreach (['GRN', 'SURAT_JALAN', 'FAKTUR'] as $type) {
            DigitalDocument::query()->updateOrCreate(
                [
                    'transaction_in_id' => $transaction->id,
                    'document_type' => $type,
                ],
                self::payload($transaction->loadMissing(['supplier', 'items.product']), $type),
            );
        }
    }

    private static function payload(TransactionIn $transaction, string $type): array
    {
        $items = $transaction->items->map(fn ($item): array => [
            'sku' => $item->product?->sku ?? '-',
            'product_name' => $item->product?->name ?? '-',
            'quantity' => (int) $item->quantity,
            'accepted_quantity' => (int) ($item->accepted_quantity ?? $item->quantity),
            'rejected_quantity' => (int) ($item->rejected_quantity ?? 0),
            'purchase_price' => (int) $item->purchase_price,
            'qc_status' => $item->qc_status ?? 'Lulus QC',
            'qc_note' => $item->qc_note,
        ])->values();

        $token = str_replace('IN-', '', $transaction->transaction_no);
        $prefix = self::prefix($type);

        return [
            'document_no' => "{$prefix}-{$token}",
            'title' => self::title($type),
            'transaction_no' => $transaction->transaction_no,
            'supplier_name' => $transaction->supplier?->name,
            'date' => optional($transaction->date)->toDateString(),
            'status' => self::status($type),
            'reference_no' => "{$prefix}-{$token}",
            'notes' => self::notes($type),
            'total_items' => (int) $items->sum('quantity'),
            'accepted_items' => (int) $items->sum('accepted_quantity'),
            'rejected_items' => (int) $items->sum('rejected_quantity'),
            'total_amount' => $type === 'SURAT_JALAN'
                ? 0
                : (int) $items->sum(fn (array $item) => $item['accepted_quantity'] * $item['purchase_price']),
            'items' => $items->all(),
        ];
    }

    private static function prefix(string $type): string
    {
        return match ($type) {
            'SURAT_JALAN' => 'SJ',
            'FAKTUR' => 'INV',
            default => 'GRN',
        };
    }

    private static function title(string $type): string
    {
        return match ($type) {
            'SURAT_JALAN' => 'Surat Jalan Supplier',
            'FAKTUR' => 'Faktur Pembelian',
            default => 'Nota Intern / Goods Receipt Note',
        };
    }

    private static function status(string $type): string
    {
        return match ($type) {
            'SURAT_JALAN' => 'Diterima',
            'FAKTUR' => 'Tercatat',
            default => 'Selesai',
        };
    }

    private static function notes(string $type): string
    {
        return match ($type) {
            'SURAT_JALAN' => 'Dokumen pengantar barang dari supplier.',
            'FAKTUR' => 'Faktur pembelian berdasarkan barang yang lulus QC.',
            default => 'Nota penerimaan barang dan hasil pemeriksaan QC.',
        };
    }
}
