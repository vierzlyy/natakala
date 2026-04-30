<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <title>{{ $title }}</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            margin: 32px;
            color: #2B2B2B;
            font-size: 12px;
        }
        h1 {
            margin-bottom: 8px;
            font-size: 20px;
        }
        p {
            margin-top: 0;
            color: #6B6B6B;
        }
        .summary {
            display: flex;
            gap: 12px;
            margin: 20px 0;
        }
        .summary-card {
            border: 1px solid #D6D3CE;
            border-radius: 12px;
            padding: 12px 16px;
            min-width: 180px;
            background: #F8F6F2;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 20px;
        }
        th,
        td {
            border: 1px solid #D6D3CE;
            padding: 8px 10px;
            text-align: left;
            vertical-align: top;
            font-size: 11px;
        }
        th {
            background: #EDEAE5;
        }
        .footer {
            margin-top: 28px;
            color: #6B6B6B;
            font-size: 13px;
        }
    </style>
</head>
<body>
    <h1>NataKala - {{ $title }}</h1>
    <p>Generated at {{ $generatedAt }}</p>

    <div class="summary">
        <div class="summary-card">
            <strong>Total Records</strong>
            <div>{{ $summary['total_records'] ?? 0 }}</div>
        </div>
        <div class="summary-card">
            <strong>Total Items</strong>
            <div>{{ $summary['total_items'] ?? 0 }}</div>
        </div>
    </div>

    @if (count($rows))
        <table>
            <thead>
                <tr>
                    @foreach (array_keys($rows[0]) as $header)
                        <th>{{ strtolower($header) === 'sku' ? 'SKU' : str($header)->replace('_', ' ')->title() }}</th>
                    @endforeach
                </tr>
            </thead>
            <tbody>
                @foreach ($rows as $row)
                    <tr>
                        @foreach ($row as $value)
                            <td>
                                @if (is_array($value))
                                    {{ json_encode($value, JSON_UNESCAPED_UNICODE) }}
                                @else
                                    {{ $value }}
                                @endif
                            </td>
                        @endforeach
                    </tr>
                @endforeach
            </tbody>
        </table>
    @else
        <p>Tidak ada data untuk periode ini.</p>
    @endif

    <div class="footer">
        NataKala - E-Inventory Toko/Gudang Pakaian
    </div>
</body>
</html>