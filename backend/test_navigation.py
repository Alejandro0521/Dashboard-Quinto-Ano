#!/usr/bin/env python3
"""
Test para navegar a la página de ganado en pie
"""

import requests
from bs4 import BeautifulSoup

base_url = "http://www.economia-sniim.gob.mx/SNIIM-Pecuarios-Nacionales"

# URL para ganado bovino en pie
url = f"{base_url}/SelPie.asp?var=Bov"

print(f"Accediendo a: {url}\n")

response = requests.get(url, timeout=15)

if response.status_code == 200:
    print(f"✓ Página cargada ({len(response.text)} caracteres)")
    
    # Guardar para análisis
    with open('ganado_en_pie.html', 'w', encoding='utf-8') as f:
        f.write(response.text)
    
    print("✓ HTML guardado en ganado_en_pie.html")
    
    # Buscar formularios y campos
    soup = BeautifulSoup(response.content, 'html.parser')
    forms = soup.find_all('form')
    selects = soup.find_all('select')
    
    print(f"\nFormularios encontrados: {len(forms)}")
    print(f"Selectores encontrados: {len(selects)}")
    
    if selects:
        for i, select in enumerate(selects):
            print(f"\nSelector {i+1}:")
            print(f"  Name: {select.get('name', 'N/A')}")
            options = select.find_all('option')
            print(f"  Opciones: {len(options)}")
            if options:
                for opt in options[:5]:  # Primeras 5
                    print(f"    - {opt.get_text().strip()}")
else:
    print(f"✗ Error: {response.status_code}")
