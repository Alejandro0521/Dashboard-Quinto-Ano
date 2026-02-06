#!/usr/bin/env python3
"""
Debug script - Guardar HTML de SNIIM para análisis
"""

import requests

url = "http://www.economia-sniim.gob.mx/SNIIM-Pecuarios-Nacionales/MenPec.asp?var=Bov"

print(f"Descargando: {url}\n")

response = requests.get(url, timeout=15)

if response.status_code == 200:
    with open('sniim_bovinos.html', 'w', encoding='utf-8') as f:
        f.write(response.text)
    
    print(f"✓ HTML guardado en sniim_bovinos.html")
    print(f"  Tamaño: {len(response.text)} caracteres")
    print(f"\nPrimeros 500 caracteres:")
    print("=" * 50)
    print(response.text[:500])
else:
    print(f"✗ Error: {response.status_code}")
