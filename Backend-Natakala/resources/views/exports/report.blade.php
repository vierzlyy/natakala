<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <title>{{ $title }}</title>
    <style>
        * {
            box-sizing: border-box;
        }
        body {
            font-family: Arial, "Segoe UI", sans-serif;
            margin: 0;
            padding: 20px;
            background: #F1F3F6;
            color: #111827;
            font-size: 12px;
            line-height: 1.45;
        }
        .sheet {
            max-width: 1120px;
            margin: 0 auto;
            background: #FFFFFF;
            border: 1px solid #C8CED8;
        }
        .brand-strip {
            height: 7px;
            background: linear-gradient(90deg, #111827 0 34%, #9A6A38 34% 100%);
        }
        .content {
            padding: 28px 32px 26px;
        }
        .header {
            display: grid;
            grid-template-columns: minmax(0, 1fr) 240px;
            gap: 24px;
            align-items: start;
            border-bottom: 3px solid #111827;
            padding-bottom: 18px;
        }
        .masthead {
            display: flex;
            align-items: center;
            gap: 12px;
        }
        .monogram {
            display: flex;
            width: 44px;
            height: 44px;
            align-items: center;
            justify-content: center;
            border: 2px solid #111827;
            background: #F8F1E8;
            color: #111827;
            font-size: 16px;
            font-weight: 900;
        }
        .brand-name {
            font-size: 12px;
            font-weight: 900;
            letter-spacing: .16em;
            text-transform: uppercase;
        }
        .brand-meta {
            margin-top: 3px;
            color: #5F6673;
            font-size: 10px;
            letter-spacing: .06em;
            text-transform: uppercase;
        }
        h1 {
            margin: 18px 0 8px;
            font-size: 27px;
            line-height: 1.12;
            text-transform: uppercase;
        }
        p {
            margin: 0;
            color: #5F6673;
        }
        .meta {
            border: 1px solid #CFD4DC;
        }
        .meta-title {
            background: #111827;
            color: #FFFFFF;
            padding: 8px 10px;
            font-size: 10px;
            font-weight: 900;
            letter-spacing: .1em;
            text-transform: uppercase;
        }
        .meta-value {
            padding: 10px;
            font-size: 13px;
            font-weight: 800;
        }
        .summary {
            display: grid;
            grid-template-columns: repeat(4, minmax(0, 1fr));
            border-top: 1px solid #CFD4DC;
            border-left: 1px solid #CFD4DC;
            margin: 0 0 16px;
        }
        .summary-card {
            border-right: 1px solid #CFD4DC;
            border-bottom: 1px solid #CFD4DC;
            padding: 12px 13px;
            background: #FFFFFF;
        }
        .summary-card strong {
            display: block;
            color: #5F6673;
            font-size: 9px;
            letter-spacing: .08em;
            text-transform: uppercase;
        }
        .summary-card div {
            margin-top: 7px;
            font-size: 19px;
            font-weight: 900;
        }
        .section-title {
            margin: 22px 0 10px;
            font-size: 11px;
            font-weight: 900;
            letter-spacing: .12em;
            text-transform: uppercase;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            border: 1px solid #CFD4DC;
        }
        th,
        td {
            border: 1px solid #E5E7EB;
            padding: 8px;
            text-align: left;
            vertical-align: top;
            font-size: 11px;
        }
        th {
            border-color: #CFD4DC;
            background: #E7EAF0;
            color: #111827;
            font-size: 9px;
            font-weight: 900;
            letter-spacing: .08em;
            text-transform: uppercase;
        }
        .footer {
            margin-top: 28px;
            border-top: 1px solid #CFD4DC;
            padding-top: 12px;
            color: #5F6673;
            font-size: 10px;
            display: flex;
            justify-content: space-between;
            gap: 18px;
        }
        .footer strong {
            color: #111827;
            letter-spacing: .08em;
            text-transform: uppercase;
        }
        @media print {
            @page {
                size: A4 landscape;
                margin: 12mm;
            }
            body {
                padding: 0;
                background: #FFFFFF;
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
            }
            .sheet {
                border: 0;
            }
            .content {
                padding: 0;
            }
            .brand-strip {
                height: 5px;
                margin-bottom: 16px;
            }
        }
    </style>
</head>
<body>
    <div class="sheet">
        <div class="brand-strip"></div>
        <div class="content">
            <div class="header">
                <div>
                    <div class="masthead">
                        <div class="monogram">NK</div>
                        <div>
                            <div class="brand-name">NataKala E-Inventory</div>
                            <div class="brand-meta">Inventory Report Document</div>
                        </div>
                    </div>
                    <h1>{{ $title }}</h1>
                    <p>Dokumen laporan inventaris NataKala sebagai arsip operasional.</p>
                </div>
                <div class="meta">
                    <div class="meta-title">Tanggal Export</div>
                    <div class="meta-value">{{ $generatedAt }}</div>
                </div>
            </div>

            <div class="section-title">Ringkasan Laporan</div>
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

            <div class="section-title">Data Laporan</div>
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
                <span><strong>NataKala</strong> E-Inventory</span>
                <span>Dokumen laporan ini dibuat otomatis oleh sistem sebagai arsip operasional.</span>
            </div>
        </div>
    </div>
</body>
</html>
