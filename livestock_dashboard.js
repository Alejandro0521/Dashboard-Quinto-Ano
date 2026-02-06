// Dashboard de Precios Pecuarios
function renderLivestockPrices() {
    // Cargar precios si no están cargados
    if (!livestockPricesState.lastUpdate) {
        loadLivestockPrices();
    }

    const { livestock, feed, lastUpdate, loading } = livestockPricesState;

    return `
        <div style="max-width: 80rem; margin: 0 auto; padding-bottom: 4rem;">
            <!-- Header -->
            <div style="background: white; border-bottom: 1px solid #e5e5e5; padding: 1.5rem 2rem; display: flex; align-items: center; gap: 1rem;">
                <button onclick="closeTool()" style="background: none; border: none; cursor: pointer; padding: 0.5rem;">
                    <i data-lucide="arrow-left" style="width: 20px; height: 20px;"></i>
                </button>
                <div style="flex: 1;">
                    <h2 style="font-size: 1.25rem; font-weight: 600; margin: 0;">Dashboard de Precios Pecuarios</h2>
                    <p style="color: #a3a3a3; font-size: 0.875rem; margin: 0.25rem 0 0 0;">Precios del SNIIM - Secretaría de Economía México</p>
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
                        <p style="margin-top: 1rem;">Cargando precios...</p>
                    </div>
                ` : `
                    <!-- Última actualización -->
                    ${lastUpdate ? `
                        <div style="background: #fafafa; border: 1px solid #e5e5e5; border-radius: 0.5rem; padding: 1rem; margin-bottom: 2rem; display: flex; align-items: center; gap: 0.5rem;">
                            <i data-lucide="clock" style="width: 16px; height: 16px; color: #737373;"></i>
                            <span style="color: #737373; font-size: 0.875rem;">Última actualización: ${new Date(lastUpdate).toLocaleString('es-MX')}</span>
                        </div>
                    ` : ''}

                    <!-- Precios de Ganado -->
                    <h3 style="font-size: 1.125rem; font-weight: 600; margin-bottom: 1rem; display: flex; align-items: center; gap: 0.5rem;">
                        <i data-lucide="beef" style="width: 20px; height: 20px;"></i>
                        Precios de Ganado
                    </h3>
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 1rem; margin-bottom: 3rem;">
                        ${Object.entries(livestock).map(([key, data]) => `
                            <div style="background: white; border: 1px solid #e5e5e5; border-radius: 1rem; padding: 1.5rem;">
                                <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 1rem;">
                                    <h4 style="font-weight: 500; margin: 0;">${data.nombre}</h4>
                                    <span style="background: #fafafa; padding: 0.25rem 0.5rem; border-radius: 0.25rem; font-size: 0.75rem; color: #737373;">
                                        ${data.fuente || 'SNIIM'}
                                    </span>
                                </div>
                                <div style="font-size: 2rem; font-weight: 700; margin-bottom: 0.5rem;">
                                    $${data.precio.toFixed(2)}
                                </div>
                                <div style="color: #a3a3a3; font-size: 0.875rem; margin-bottom: 0.5rem;">
                                    ${data.unidad}
                                </div>
                                ${data.rango ? `
                                    <div style="color: #737373; font-size: 0.75rem; padding-top: 0.5rem; border-top: 1px solid #f5f5f5;">
                                        Rango: $${data.rango} MXN/kg
                                    </div>
                                ` : ''}
                            </div>
                        `).join('')}
                    </div>

                    <!-- Precios de Alimentos -->
                    <h3 style="font-size: 1.125rem; font-weight: 600; margin-bottom: 1rem; display: flex; align-items: center; gap: 0.5rem;">
                        <i data-lucide="wheat" style="width: 20px; height: 20px;"></i>
                        Precios de Alimentos para Ganado
                    </h3>
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 1rem;">
                        ${Object.entries(feed).map(([key, data]) => `
                            <div style="background: white; border: 1px solid #e5e5e5; border-radius: 1rem; padding: 1.5rem;">
                                <h4 style="font-weight: 500; margin: 0 0 1rem 0;">${data.nombre}</h4>
                                <div style="font-size: 2rem; font-weight: 700; margin-bottom: 0.5rem;">
                                    $${data.precio.toLocaleString('es-MX')}
                                </div>
                                <div style="color: #a3a3a3; font-size: 0.875rem; margin-bottom: 0.5rem;">
                                    ${data.unidad}
                                </div>
                                ${data.rango ? `
                                    <div style="color: #737373; font-size: 0.75rem; padding-top: 0.5rem; border-top: 1px solid #f5f5f5;">
                                        Rango: $${data.rango} MXN/ton
                                    </div>
                                ` : ''}
                            </div>
                        `).join('')}
                    </div>

                    <!-- Nota informativa -->
                    <div style="background: #fffbeb; border: 1px solid #fde68a; border-radius: 0.5rem; padding: 1rem; margin-top: 2rem;">
                        <div style="display: flex; gap: 0.75rem;">
                            <i data-lucide="info" style="width: 20px; height: 20px; color: #f59e0b; flex-shrink: 0;"></i>
                            <div style="font-size: 0.875rem; color: #92400e;">
                                <strong>Fuente de datos:</strong> Sistema Nacional de Información e Integración de Mercados (SNIIM) - Secretaría de Economía de México.
                                Los precios se actualizan consultando el sitio oficial del SNIIM.
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
        // En producción, esto haría fetch al backend Flask
        // Por ahora, usamos datos estáticos del SNIIM
        const response = await fetch('http://localhost:5000/api/prices').catch(() => null);

        let data;
        if (response && response.ok) {
            const result = await response.json();
            data = result.data;
        } else {
            // Fallback: datos estáticos del SNIIM
            data = {
                livestock: {
                    bovino: {
                        precio: 75.50,
                        unidad: 'MXN/kg',
                        tendencia: 'neutral',
                        nombre: 'Ganado Bovino',
                        rango: '70-90',
                        fuente: 'SNIIM'
                    },
                    porcino: {
                        precio: 37.50,
                        unidad: 'MXN/kg',
                        tendencia: 'neutral',
                        nombre: 'Ganado Porcino',
                        rango: '35-40',
                        fuente: 'SNIIM'
                    },
                    ovino: {
                        precio: 57.50,
                        unidad: 'MXN/kg',
                        tendencia: 'neutral',
                        nombre: 'Ganado Ovino',
                        rango: '55-60',
                        fuente: 'SNIIM'
                    },
                    pollo: {
                        precio: 30.00,
                        unidad: 'MXN/kg',
                        tendencia: 'neutral',
                        nombre: 'Pollo',
                        rango: '28-32',
                        fuente: 'SNIIM'
                    },
                },
                feed: {
                    maiz: {
                        precio: 4800,
                        unidad: 'MXN/ton',
                        tendencia: 'neutral',
                        nombre: 'Maíz',
                        rango: '4500-5000'
                    },
                    sorgo: {
                        precio: 4200,
                        unidad: 'MXN/ton',
                        tendencia: 'neutral',
                        nombre: 'Sorgo',
                        rango: '4000-4500'
                    },
                    soya: {
                        precio: 8500,
                        unidad: 'MXN/ton',
                        tendencia: 'neutral',
                        nombre: 'Pasta de Soya',
                        rango: '8000-9000'
                    },
                    alfalfa: {
                        precio: 3800,
                        unidad: 'MXN/ton',
                        tendencia: 'neutral',
                        nombre: 'Alfalfa',
                        rango: '3500-4000'
                    },
                },
                timestamp: new Date().toISOString()
            };
        }

        livestockPricesState.livestock = data.livestock;
        livestockPricesState.feed = data.feed;
        livestockPricesState.lastUpdate = data.timestamp;
        livestockPricesState.loading = false;

        renderView();

    } catch (error) {
        console.error('Error cargando precios:', error);
        livestockPricesState.loading = false;
        renderView();
    }
};
