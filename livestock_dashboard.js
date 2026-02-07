// Dashboard de Precios Pecuarios - Con Regiones Norte/Jalisco/Sur
function renderLivestockPrices() {
    // Cargar precios si no están cargados
    if (!livestockPricesState.lastUpdate) {
        loadLivestockPrices();
    }

    const { regiones, feed, comparacion, lastUpdate, loading } = livestockPricesState;

    return `
        <div style="max-width: 80rem; margin: 0 auto; padding-bottom: 4rem;">
            <!-- Header -->
            <div style="background: white; border-bottom: 1px solid #e5e5e5; padding: 1.5rem 2rem; display: flex; align-items: center; gap: 1rem;">
                <button onclick="closeTool()" style="background: none; border: none; cursor: pointer; padding: 0.5rem;">
                    <i data-lucide="arrow-left" style="width: 20px; height: 20px;"></i>
                </button>
                <div style="flex: 1;">
                    <h2 style="font-size: 1.25rem; font-weight: 600; margin: 0;">Dashboard de Precios Pecuarios</h2>
                    <p style="color: #a3a3a3; font-size: 0.875rem; margin: 0.25rem 0 0 0;">Precios del SNIIM por Región - Secretaría de Economía México</p>
                </div>
                <button onclick="loadLivestockPrices()" class="btn-primary" style="display: flex; align-items: center; gap: 0.5rem;">
                    <i data-lucide="refresh-cw" style="width: 16px; height: 16px;"></i>
                    Actualizar
                </button>
            </div>

            <div style="padding: 2rem;">
                ${loading ? `
                    <div style="text-align: center; padding: 4rem; color: #a3a3a3;">
                        <i data-lucide="loader" style="width: 48px; height: 48px; animation: spin 1s linear infinite;"></i>
                        <p style="margin-top: 1rem;">Cargando precios de las regiones...</p>
                    </div>
                ` : `
                    <!-- Última actualización -->
                    ${lastUpdate ? `
                        <div style="background: #fafafa; border: 1px solid #e5e5e5; border-radius: 0.5rem; padding: 1rem; margin-bottom: 2rem; display: flex; align-items: center; gap: 0.5rem;">
                            <i data-lucide="clock" style="width: 16px; height: 16px; color: #737373;"></i>
                            <span style="color: #737373; font-size: 0.875rem;">Última actualización: ${new Date(lastUpdate).toLocaleString('es-MX')}</span>
                        </div>
                    ` : ''}

                    <!-- Comparación rápida -->
                    ${comparacion ? `
                        <div style="background: linear-gradient(135deg, #1e3a5f 0%, #2d5a87 100%); border-radius: 1rem; padding: 1.5rem; margin-bottom: 2rem; color: white;">
                            <h4 style="margin: 0 0 1rem 0; font-size: 0.875rem; text-transform: uppercase; opacity: 0.8;">Comparación de Precios Bovinos</h4>
                            <div style="display: flex; gap: 2rem; flex-wrap: wrap;">
                                <div>
                                    <span style="font-size: 0.75rem; opacity: 0.7;">Norte vs Sur</span>
                                    <div style="font-size: 1.5rem; font-weight: 700;">${comparacion.norte_vs_sur_pct > 0 ? '+' : ''}${comparacion.norte_vs_sur_pct}%</div>
                                </div>
                                <div>
                                    <span style="font-size: 0.75rem; opacity: 0.7;">Jalisco vs Sur</span>
                                    <div style="font-size: 1.5rem; font-weight: 700;">${comparacion.jalisco_vs_sur_pct > 0 ? '+' : ''}${comparacion.jalisco_vs_sur_pct}%</div>
                                </div>
                                <div>
                                    <span style="font-size: 0.75rem; opacity: 0.7;">Región más cara</span>
                                    <div style="font-size: 1rem; font-weight: 600; text-transform: capitalize;">${comparacion.region_mas_cara}</div>
                                </div>
                            </div>
                        </div>
                    ` : ''}

                    <!-- Precios de Ganado por Región -->
                    <h3 style="font-size: 1.125rem; font-weight: 600; margin-bottom: 0.5rem; display: flex; align-items: center; gap: 0.5rem;">
                        <i data-lucide="beef" style="width: 20px; height: 20px;"></i>
                        Precios de Ganado en Pie por Región
                    </h3>
                    <p style="color: #737373; font-size: 0.875rem; margin-bottom: 1.5rem;">Precios por kilogramo de animal vivo</p>
                    
                    <!-- Regiones Grid -->
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 1.5rem; margin-bottom: 3rem;">
                        ${regiones ? Object.entries(regiones).map(([key, region]) => `
                            <div style="background: white; border: 1px solid ${region.especial ? '#fbbf24' : '#e5e5e5'}; border-radius: 1rem; overflow: hidden; ${region.especial ? 'box-shadow: 0 0 0 2px rgba(251, 191, 36, 0.2);' : ''}">
                                <!-- Region Header -->
                                <div style="background: ${key === 'norte' ? 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)' : key === 'jalisco' ? 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)' : 'linear-gradient(135deg, #059669 0%, #047857 100%)'}; color: white; padding: 1rem 1.25rem;">
                                    <div style="display: flex; align-items: center; gap: 0.5rem;">
                                        <span style="font-size: 1.25rem;">${region.icono || '📍'}</span>
                                        <div>
                                            <h4 style="margin: 0; font-weight: 600;">${region.nombre}</h4>
                                            <p style="margin: 0.25rem 0 0 0; font-size: 0.75rem; opacity: 0.9;">${region.estados}</p>
                                        </div>
                                    </div>
                                </div>
                                
                                <!-- Livestock Prices -->
                                <div style="padding: 1rem;">
                                    ${Object.entries(region.livestock).map(([animalKey, animal]) => `
                                        <div style="display: flex; justify-content: space-between; align-items: center; padding: 0.75rem 0; border-bottom: 1px solid #f5f5f5;">
                                            <div>
                                                <span style="font-weight: 500;">${animal.nombre}</span>
                                                <div style="font-size: 0.75rem; color: #a3a3a3;">${animal.fuente}</div>
                                            </div>
                                            <div style="text-align: right;">
                                                <div style="font-size: 1.25rem; font-weight: 700;">$${animal.precio.toFixed(2)}</div>
                                                <div style="font-size: 0.75rem; color: #a3a3a3;">${animal.unidad}</div>
                                            </div>
                                        </div>
                                    `).join('')}
                                </div>
                            </div>
                        `).join('') : '<p style="color: #a3a3a3;">No hay datos de regiones disponibles</p>'}
                    </div>

                    <!-- Precios de Alimentos -->
                    <h3 style="font-size: 1.125rem; font-weight: 600; margin-bottom: 1rem; display: flex; align-items: center; gap: 0.5rem;">
                        <i data-lucide="wheat" style="width: 20px; height: 20px;"></i>
                        Precios de Alimentos para Ganado
                    </h3>
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem;">
                        ${feed ? Object.entries(feed).map(([key, data]) => `
                            <div style="background: white; border: 1px solid #e5e5e5; border-radius: 1rem; padding: 1.25rem;">
                                <h4 style="font-weight: 500; margin: 0 0 0.75rem 0;">${data.nombre}</h4>
                                <div style="font-size: 1.5rem; font-weight: 700; margin-bottom: 0.25rem;">
                                    $${data.precio.toLocaleString('es-MX')}
                                </div>
                                <div style="color: #a3a3a3; font-size: 0.875rem;">
                                    ${data.unidad}
                                </div>
                            </div>
                        `).join('') : ''}
                    </div>

                    <!-- Nota informativa -->
                    <div style="background: #fffbeb; border: 1px solid #fde68a; border-radius: 0.5rem; padding: 1rem; margin-top: 2rem;">
                        <div style="display: flex; gap: 0.75rem;">
                            <i data-lucide="info" style="width: 20px; height: 20px; color: #f59e0b; flex-shrink: 0;"></i>
                            <div style="font-size: 0.875rem; color: #92400e;">
                                <strong>Fuente de datos:</strong> Sistema Nacional de Información e Integración de Mercados (SNIIM) - Secretaría de Economía de México.
                                <br><br>
                                <strong>Regiones:</strong> Norte (Chihuahua, Sonora, N.L., Coahuila, Durango) | Jalisco (R.M. Guadalajara) | Sur (Veracruz, Chiapas, Yucatán, Oaxaca)
                                <br><br>
                                <a href="http://www.economia-sniim.gob.mx" target="_blank" style="color: #f59e0b; text-decoration: underline;">Visitar SNIIM →</a>
                            </div>
                        </div>
                    </div>
                `}
            </div>
        </div>
    `;
}

// Función para cargar precios del backend
window.loadLivestockPrices = async () => {
    livestockPricesState.loading = true;
    renderView();

    try {
        // Primero intentar cargar del JSON en GitHub Pages (actualizado automáticamente)
        const githubUrl = 'https://alejandro0521.github.io/Dashboard-Quinto-Ano/data/prices.json';
        let response = await fetch(githubUrl).catch(() => null);

        // Si no funciona GitHub Pages, intentar servidor local
        if (!response || !response.ok) {
            response = await fetch('http://localhost:5001/api/prices').catch(() => null);
        }

        let data;
        if (response && response.ok) {
            const result = await response.json();
            // Si viene de la API local, los datos están en result.data
            data = result.data || result;
        } else {
            // Fallback: datos estáticos con 3 regiones
            data = {
                regiones: {
                    norte: {
                        nombre: 'Región Norte',
                        icono: '🌵',
                        estados: 'Chihuahua, Sonora, Nuevo León, Coahuila, Durango',
                        livestock: {
                            bovino: { precio: 78.50, unidad: 'MXN/kg', nombre: 'Ganado Bovino', fuente: 'Base SNIIM' },
                            porcino: { precio: 38.50, unidad: 'MXN/kg', nombre: 'Ganado Porcino', fuente: 'Base SNIIM' },
                            ovino: { precio: 58.00, unidad: 'MXN/kg', nombre: 'Ganado Ovino', fuente: 'Base SNIIM' },
                            pollo: { precio: 31.00, unidad: 'MXN/kg', nombre: 'Pollo', fuente: 'Base SNIIM' },
                        }
                    },
                    jalisco: {
                        nombre: 'Jalisco',
                        icono: '🏛️',
                        estados: 'Región Metropolitana de Guadalajara',
                        especial: true,
                        livestock: {
                            bovino: { precio: 75.00, unidad: 'MXN/kg', nombre: 'Ganado Bovino', fuente: 'Base SNIIM' },
                            porcino: { precio: 37.50, unidad: 'MXN/kg', nombre: 'Ganado Porcino', fuente: 'Base SNIIM' },
                            ovino: { precio: 56.50, unidad: 'MXN/kg', nombre: 'Ganado Ovino', fuente: 'Base SNIIM' },
                            pollo: { precio: 30.00, unidad: 'MXN/kg', nombre: 'Pollo', fuente: 'Base SNIIM' },
                        }
                    },
                    sur: {
                        nombre: 'Región Sur',
                        icono: '🌴',
                        estados: 'Veracruz, Chiapas, Yucatán, Oaxaca',
                        livestock: {
                            bovino: { precio: 72.00, unidad: 'MXN/kg', nombre: 'Ganado Bovino', fuente: 'Base SNIIM' },
                            porcino: { precio: 36.00, unidad: 'MXN/kg', nombre: 'Ganado Porcino', fuente: 'Base SNIIM' },
                            ovino: { precio: 55.00, unidad: 'MXN/kg', nombre: 'Ganado Ovino', fuente: 'Base SNIIM' },
                            pollo: { precio: 29.00, unidad: 'MXN/kg', nombre: 'Pollo', fuente: 'Base SNIIM' },
                        }
                    }
                },
                feed: {
                    maiz: { precio: 4800, unidad: 'MXN/ton', nombre: 'Maíz' },
                    sorgo: { precio: 4200, unidad: 'MXN/ton', nombre: 'Sorgo' },
                    soya: { precio: 8500, unidad: 'MXN/ton', nombre: 'Pasta de Soya' },
                    alfalfa: { precio: 3800, unidad: 'MXN/ton', nombre: 'Alfalfa' },
                },
                comparacion: {
                    norte_vs_sur_pct: 9.0,
                    jalisco_vs_sur_pct: 4.2,
                    norte_vs_jalisco_pct: 4.7,
                    region_mas_cara: 'norte',
                    region_mas_barata: 'sur'
                },
                timestamp: new Date().toISOString()
            };
        }

        livestockPricesState.regiones = data.regiones;
        livestockPricesState.feed = data.feed;
        livestockPricesState.comparacion = data.comparacion;
        livestockPricesState.lastUpdate = data.timestamp;
        livestockPricesState.loading = false;

        renderView();

    } catch (error) {
        console.error('Error cargando precios:', error);
        livestockPricesState.loading = false;
        renderView();
    }
};
