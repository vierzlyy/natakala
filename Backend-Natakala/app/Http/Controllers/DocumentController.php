<?php

namespace App\Http\Controllers;

use App\Models\DigitalDocument;
use App\Models\TransactionIn;
use App\Support\InboundDocumentFactory;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DocumentController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $this->ensureExistingInboundDocuments();

        $query = DigitalDocument::query()->latest();

        if ($request->filled('document_type')) {
            $query->where('document_type', $request->string('document_type')->toString());
        }

        if ($request->filled('status')) {
            $query->where('status', $request->string('status')->toString());
        }

        if ($search = trim((string) $request->input('search'))) {
            $query->where(function ($builder) use ($search): void {
                $builder
                    ->where('document_no', 'like', "%{$search}%")
                    ->orWhere('transaction_no', 'like', "%{$search}%")
                    ->orWhere('supplier_name', 'like', "%{$search}%")
                    ->orWhere('reference_no', 'like', "%{$search}%");
            });
        }

        $documents = $query->paginate((int) $request->input('per_page', 12));

        return response()->json([
            'data' => [
                'current_page' => $documents->currentPage(),
                'last_page' => $documents->lastPage(),
                'total' => $documents->total(),
                'data' => $documents->getCollection()->map(fn (DigitalDocument $document) => $this->transform($document)),
            ],
        ]);
    }

    public function show(DigitalDocument $document): JsonResponse
    {
        return response()->json([
            'data' => $this->transform($document),
        ]);
    }

    private function ensureExistingInboundDocuments(): void
    {
        TransactionIn::query()
            ->whereDoesntHave('documents')
            ->with(['supplier', 'items.product'])
            ->get()
            ->each(fn (TransactionIn $transaction) => InboundDocumentFactory::createForTransaction($transaction));
    }

    private function transform(DigitalDocument $document): array
    {
        return [
            'id' => $document->id,
            'document_no' => $document->document_no,
            'document_type' => $document->document_type,
            'title' => $document->title,
            'transaction_in_id' => $document->transaction_in_id,
            'transaction_no' => $document->transaction_no,
            'supplier_name' => $document->supplier_name,
            'date' => optional($document->date)->toDateString(),
            'status' => $document->status,
            'reference_no' => $document->reference_no,
            'notes' => $document->notes,
            'total_items' => $document->total_items,
            'accepted_items' => $document->accepted_items,
            'rejected_items' => $document->rejected_items,
            'total_amount' => $document->total_amount,
            'items' => $document->items ?: [],
        ];
    }
}
