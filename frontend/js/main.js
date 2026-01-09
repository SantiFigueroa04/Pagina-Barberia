// main.js - VERSIÓN CORREGIDA
import { initSupabase, getBarberos, getServicios } from './supabase-client.js';

// Estado
const AppState = {
    barberos: [],
    servicios: []
};

// Inicializar
async function inicializarApp() {
    console.log('🚀 Inicializando app...');
    
    try {
        // 1. Inicializar Supabase
        const supabase = initSupabase();
        if (!supabase) {
            mostrarError('Error de conexión');
            return;
        }

        // 2. Cargar datos
        await cargarBarberos();
        await cargarServicios();
        
        console.log('✅ App inicializada');
        
    } catch (error) {
        console.error('❌ Error:', error);
        mostrarError('Error al cargar los datos');
    }
}

// Cargar barberos
async function cargarBarberos() {
    const container = document.getElementById('barberos-container');
    if (!container) return;
    
    container.innerHTML = '<p>Cargando barberos...</p>';
    
    const { data: barberos, error } = await getBarberos();
    
    if (error) {
        container.innerHTML = `<p class="error">Error: ${error}</p>`;
        return;
    }
    
    AppState.barberos = barberos || [];
    
    if (barberos.length === 0) {
        container.innerHTML = '<p>No hay barberos disponibles</p>';
        return;
    }
    
    container.innerHTML = barberos.map(barbero => `
        <div class="barbero-card">
            <img src="${barbero.foto_url || 'https://images.unsplash.com/photo-1567894340315-735d7c361db0?w=400&h=400&fit=crop'}" 
                 alt="${barbero.especialidad}"
                 class="barbero-img">
            <div class="barbero-info">
                <h3>${barbero.especialidad}</h3>
                <p class="especialidad">${barbero.descripcion || 'Barbero profesional'}</p>
                <p class="calificacion">⭐ ${barbero.calificacion || '5.0'}</p>
                <a href="reservar.html" class="btn btn-primary">
                    <i class="fas fa-calendar-plus"></i> Reservar
                </a>
            </div>
        </div>
    `).join('');
}

// Cargar servicios
async function cargarServicios() {
    const container = document.getElementById('servicios-container');
    if (!container) return;
    
    const { data: servicios, error } = await getServicios();
    
    if (error) {
        console.error('Error servicios:', error);
        return;
    }
    
    AppState.servicios = servicios || [];
    
    if (!servicios || servicios.length === 0) {
        container.innerHTML = '<p>No hay servicios disponibles</p>';
        return;
    }
    
    container.innerHTML = servicios.map(servicio => `
        <div class="servicio-card">
            <h4>${servicio.nombre}</h4>
            <p class="descripcion">${servicio.descripcion || ''}</p>
            <div class="servicio-detalles">
                <span class="precio">$${servicio.precio}</span>
                <span class="duracion"><i class="far fa-clock"></i> ${servicio.duracion_min} min</span>
            </div>
        </div>
    `).join('');
}

// Mostrar error
function mostrarError(mensaje) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.innerHTML = `
        <div style="background: #f8d7da; color: #721c24; padding: 15px; margin: 20px; border-radius: 5px;">
            <i class="fas fa-exclamation-circle"></i> ${mensaje}
        </div>
    `;
    document.body.prepend(errorDiv);
}

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', inicializarApp);

// Hacer disponible globalmente
window.App = {
    state: AppState,
    cargarBarberos,
    cargarServicios
};