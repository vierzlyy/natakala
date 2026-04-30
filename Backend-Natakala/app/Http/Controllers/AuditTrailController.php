<?php

namespace App\Http\Controllers;

use App\Models\AuditLog;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AuditTrailController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = AuditLog::query()->latest();

        if ($search = trim((string) $request->input('search'))) {
            $query->where(function ($builder) use ($search): void {
                $builder
                    ->where('entity_label', 'like', "%{$search}%")
                    ->orWhere('description', 'like', "%{$search}%")
                    ->orWhere('action', 'like', "%{$search}%");
            });
        }

        if ($request->filled('entity_type')) {
            $query->where('entity_type', $request->input('entity_type'));
        }

        $logs = $query->paginate((int) $request->input('per_page', 15));

        return response()->json([
            'data' => [
                'current_page' => $logs->currentPage(),
                'last_page' => $logs->lastPage(),
                'total' => $logs->total(),
                'data' => collect($logs->items())->map(fn (AuditLog $log) => [
                    'id' => $log->id,
                    'actor_name' => $log->actor_name,
                    'action' => $log->action,
                    'entity_type' => $log->entity_type,
                    'entity_id' => $log->entity_id,
                    'entity_label' => $log->entity_label,
                    'description' => $log->description,
                    'meta' => $log->meta,
                    'created_at' => optional($log->created_at)->toDateTimeString(),
                ])->values(),
            ],
        ]);
    }
}