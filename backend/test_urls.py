#!/usr/bin/env python3
"""
Test script para encontrar las URLs correctas del SNIIM
"""

import requests
from bs4 import BeautifulSoup

# URLs a probar
test_urls = [
    "http://www.economia-sniim.gob.mx/nuevo/",
    "https://www.economia-sniim.gob.mx/nuevo/",
    "http://www.economia-sniim.gob.mx",
    "https://www.economia-sniim.gob.mx",
]

print("🔍 Probando URLs del SNIIM...\n")

for url in test_urls:
    try:
        print(f"Probando: {url}")
        response = requests.get(url, timeout=10, allow_redirects=True)
        print(f"  Status: {response.status_code}")
        print(f"  URL final: {response.url}")
        
        if response.status_code == 200:
            soup = BeautifulSoup(response.content, 'html.parser')
            # Buscar enlaces a secciones pecuarias
            links = soup.find_all('a', href=True)
            pecuario_links = [link for link in links if 'pecuario' in link['href'].lower() or 'bovino' in link['href'].lower()]
            
            if pecuario_links:
                print(f"  ✓ Enlaces pecuarios encontrados:")
                for link in pecuario_links[:5]:
                    print(f"    - {link.get_text().strip()}: {link['href']}")
        print()
        
    except Exception as e:
        print(f"  ✗ Error: {e}\n")

print("\n✓ Test completado")
