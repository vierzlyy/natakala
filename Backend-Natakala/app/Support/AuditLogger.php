<?php

namespace App\Support;

use App\Models\AuditLog;

class AuditLogger
{
    public static function write($actor, string $action, string $entityType, $entityId, ?string $entityLabel, string $description, array $meta = []): void
    {
        AuditLog::query()->create([
            'actor_name' => $actor?->name ?? 'System',
            'action' => $action,
            'entity_type' => $entityType,
            'entity_id' => $entityId,
            'entity_label' => $entityLabel,
            'description' => $description,
            'meta' => $meta !== [] ? $meta : null,
        ]);
    }
}