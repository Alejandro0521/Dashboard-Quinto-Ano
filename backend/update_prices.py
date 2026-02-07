#!/usr/bin/env python3
"""
Script para actualizar precios y guardarlos en JSON
Ejecutado por GitHub Actions
"""

import json
import os
from datetime import datetime
from scraper import SNIIMRegionalScraper

def main():
    print("🔄 Iniciando actualización de precios...")
    
    # Crear directorio data si no existe
    data_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'data')
    os.makedirs(data_dir, exist_ok=True)
    
    # Ejecutar scraper
    scraper = SNIIMRegionalScraper()
    prices = scraper.get_all_prices()
    
    # Guardar en JSON
    output_path = os.path.join(data_dir, 'prices.json')
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(prices, f, ensure_ascii=False, indent=2)
    
    print(f"✅ Precios guardados en {output_path}")
    print(f"📅 Timestamp: {prices.get('timestamp', 'N/A')}")

if __name__ == '__main__':
    main()
