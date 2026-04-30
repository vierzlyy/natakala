<?php

require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

\App\Models\TransactionIn::with(['supplier', 'items.product'])->get()->each(function ($t) {
    \App\Support\InboundDocumentFactory::createForTransaction($t);
});

echo "Documents generated successfully!\n";
