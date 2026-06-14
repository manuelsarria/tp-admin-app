#!/usr/bin/env python3
"""
Extrae los movimientos reales del Excel de contabilidad y genera
scripts/personal-finance-seed.json (catálogos + entries) para importar al
módulo Finanzas Personales.

Uso:
    pip3 install openpyxl
    python3 scripts/extract-finance-from-excel.py "/ruta/al/contabilidad_shippy_trackingpty_empresa.xlsx"

Si no pasas ruta, usa la de Dropbox por defecto.
"""
import sys, json, datetime
import openpyxl

DEFAULT_PATH = "/Users/manuelle/Library/CloudStorage/Dropbox/ADMIN TRACKING/contabilidad_shippy_trackingpty_empresa.xlsx"

# Deben coincidir con DEFAULT_* en src/lib/finance.ts
DEFAULT_UNITS = ['Shippy', 'TrackingPTY', 'CNC', 'Salario Personal', 'Dividendos Empresa', 'Contenedores Valdai', 'Ventas Adicionales', 'Otro']
DEFAULT_CATEGORIES = ['Venta servicio', 'Flete', 'Comida', 'Combustible', 'Transporte', 'Salario', 'Comisión', 'Dividendos', 'Proveedor', 'Aduana', 'Bodega', 'Servicios (luz/agua/internet)', 'Software / Suscripciones', 'Mantenimiento', 'Bancos / Comisiones', 'Impuestos', 'Marketing', 'Otro']
DEFAULT_METHODS = ['Efectivo', 'Transferencia', 'ACH', 'Yappy', 'Tarjeta', 'Cheque', 'Otro']

STATUS = {'pagado': 'PAGADO', 'pendiente': 'PENDIENTE', 'parcial': 'PARCIAL', 'anulado': 'ANULADO'}


def cap(s):
    s = (s or '').strip()
    return s[:1].upper() + s[1:] if s else s


def main():
    path = sys.argv[1] if len(sys.argv) > 1 else DEFAULT_PATH
    wb = openpyxl.load_workbook(path, data_only=True, read_only=True)
    ws = wb['Registro Diario']
    rows = list(ws.iter_rows(values_only=True))
    data = rows[3:]  # encabezados en índice 2, datos desde el 3

    entries, skipped = [], 0
    for r in data:
        r = list(r) + [None] * (16 - len(r))
        fecha, _, _, _, unidad, tipo, categoria, subcat, metodo, estado, cliente, ref, desc, monto, comp, obs = r[:16]
        if fecha is None:
            continue
        if cliente and 'ejemplo' in str(cliente).lower():
            skipped += 1; continue
        try:
            amt = abs(float(monto))
        except (TypeError, ValueError):
            skipped += 1; continue
        if amt == 0:
            skipped += 1; continue
        if isinstance(fecha, datetime.datetime):
            diso = fecha.isoformat()
        elif isinstance(fecha, datetime.date):
            diso = datetime.datetime(fecha.year, fecha.month, fecha.day).isoformat()
        else:
            skipped += 1; continue
        t = 'INGRESO' if str(tipo).strip().lower() == 'ingreso' else 'EGRESO'
        st = STATUS.get(str(estado).strip().lower(), 'PAGADO') if estado else 'PAGADO'
        entries.append({
            'date': diso,
            'unit': str(unidad).strip() if unidad else 'Otro',
            'type': t,
            'category': cap(str(categoria)) if categoria else 'Otro',
            'subcategory': str(subcat).strip() if subcat else None,
            'method': str(metodo).strip() if metodo else None,
            'status': st,
            'counterparty': str(cliente).strip() if cliente else None,
            'reference': str(ref).strip() if ref else None,
            'description': str(desc).strip() if desc else None,
            'amount': amt,
            'notes': str(obs).strip() if obs else None,
        })

    def merge(defaults, present):
        out = list(defaults)
        for v in present:
            if v and v not in out:
                out.append(v)
        return out

    catalog = {
        'unit': merge(DEFAULT_UNITS, {e['unit'] for e in entries}),
        'category': merge(DEFAULT_CATEGORIES, {e['category'] for e in entries}),
        'method': merge(DEFAULT_METHODS, {e['method'] for e in entries if e['method']}),
    }

    with open('scripts/personal-finance-seed.json', 'w', encoding='utf-8') as f:
        json.dump({'catalog': catalog, 'entries': entries}, f, ensure_ascii=False, indent=2)

    from collections import Counter
    print(f"Entries importables: {len(entries)} | descartadas (ejemplos/$0): {skipped}")
    print("Por tipo:", dict(Counter(e['type'] for e in entries)))
    print("Por unidad:", dict(Counter(e['unit'] for e in entries)))
    print("Total $:", round(sum(e['amount'] for e in entries), 2))
    print("-> scripts/personal-finance-seed.json generado")


if __name__ == '__main__':
    main()
