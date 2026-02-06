#!/usr/bin/env python3
"""
Flask API Server para precios pecuarios del SNIIM
"""

from flask import Flask, jsonify
from flask_cors import CORS
from scraper import SNIIMScraper
import threading
import time
from datetime import datetime

app = Flask(__name__)
CORS(app)  # Permitir peticiones desde el frontend

# Cache de precios
price_cache = {
    'data': None,
    'last_update': None
}

# Instancia del scraper
scraper = SNIIMScraper()

# Lock para thread-safety
cache_lock = threading.Lock()

def update_prices():
    """
    Actualiza los precios en el cache
    """
    global price_cache
    
    while True:
        try:
            print(f"\n[{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}] Actualizando precios...")
            
            prices = scraper.get_all_prices()
            
            with cache_lock:
                price_cache['data'] = prices
                price_cache['last_update'] = datetime.now().isoformat()
            
            print("✓ Precios actualizados correctamente")
            
        except Exception as e:
            print(f"✗ Error actualizando precios: {e}")
        
        # Esperar 5 minutos antes de la siguiente actualización
        # (SNIIM se actualiza diariamente, no necesitamos consultar tan seguido)
        time.sleep(300)  # 5 minutos

@app.route('/api/prices', methods=['GET'])
def get_prices():
    """
    Endpoint para obtener precios actuales
    """
    with cache_lock:
        if price_cache['data'] is None:
            # Primera vez, obtener precios inmediatamente
            price_cache['data'] = scraper.get_all_prices()
            price_cache['last_update'] = datetime.now().isoformat()
        
        return jsonify({
            'success': True,
            'data': price_cache['data'],
            'cache_updated': price_cache['last_update']
        })

@app.route('/api/health', methods=['GET'])
def health_check():
    """
    Endpoint de salud del servidor
    """
    return jsonify({
        'status': 'ok',
        'timestamp': datetime.now().isoformat(),
        'cache_status': 'loaded' if price_cache['data'] else 'empty'
    })

if __name__ == '__main__':
    # Iniciar thread de actualización automática
    update_thread = threading.Thread(target=update_prices, daemon=True)
    update_thread.start()
    
    print("\n🚀 Servidor de precios SNIIM iniciado")
    print("📡 API disponible en: http://localhost:5000")
    print("🔄 Actualización automática cada 5 minutos\n")
    
    # Iniciar servidor Flask
    app.run(host='0.0.0.0', port=5000, debug=False)
