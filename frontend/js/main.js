// Lógica principal de la página de inicio
import { initSupabase, getBarberos, getServicios, getCurrentCliente } from './supabase-client.js';

// Estado global
const AppState = {
    cliente: null,
    barberos: [],
    servicios: [],
    inicializado: false
};

// Inicializar aplicación
async function inicializarApp() {
    console.log('🚀 Iniciando aplicación de barbería...');
    
    try {
        // 1. Inicializar Supabase
        const supabase = initSupabase();
        if (!supabase) {
            mostrarError('No se pudo conectar con la base de datos');
            return;
        }
        
        // 2. Obtener cliente actual (si existe)
        AppState.cliente = getCurrentCliente();
        
        // 3. Cargar barberos y servicios
        await Promise.all([cargarBarberos(), cargarServicios()]);
        
        AppState.inicializado = true;
        console.log('✅ Aplicación inicializada correctamente');
        
    } catch (error) {
        console.error('❌ Error al inicializar:', error);
        mostrarError('Error al cargar los datos. Por favor, recarga la página.');
    }
}

// Cargar barberos
async function cargarBarberos() {
    const container = document.getElementById('barberos-container');
    if (!container) return;
    
    container.innerHTML = '<div class="loading">Cargando barberos...</div>';
    
    const { data: barberos, error } = await getBarberos();
    
    if (error) {
        container.innerHTML = `<div class="error">Error: ${error.message}</div>`;
        return;
    }
    
    if (!barberos || barberos.length === 0) {
        container.innerHTML = '<p>No hay barberos disponibles en este momento</p>';
        return;
    }
    
    AppState.barberos = barberos;
    
    container.innerHTML = barberos.map(barbero => `
        <div class="barbero-card">
            <img src="${barbero.foto_url || 'assets/images/default-barber.jpg'}" 
                 alt="${barbero.nombre}" 
                 class="barbero-img"
                 onerror="this.src='assets/images/default-barber.jpg'">
            <div class="barbero-info">
                <h3>${barbero.nombre}</h3>
                <p class="especialidad">${barbero.especialidad || 'Barbero profesional'}</p>
                <p class="descripcion">${barbero.descripcion || 'Especialista en cortes clásicos y modernos'}</p>
                <a href="reservar.html?barbero=${barbero.id}" class="btn btn-primary">
                    <i class="fas fa-calendar-plus"></i> Reservar con ${barbero.nombre.split(' ')[0]}
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
        console.error('Error cargando servicios:', error);
        return;
    }
    
    if (!servicios || servicios.length === 0) {
        container.innerHTML = '<p>No hay servicios disponibles</p>';
        return;
    }
    
    AppState.servicios = servicios;
    
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
        <div style="background: #f8d7da; color: #721c24; padding: 15px; border-radius: 5px; margin: 20px; text-align: center;">
            <i class="fas fa-exclamation-circle"></i> ${mensaje}
        </div>
    `;
    
    // Insertar al inicio del body
    document.body.prepend(errorDiv);
}

// Actualizar información del cliente en la UI
function actualizarInfoCliente() {
    const clienteInfo = document.getElementById('cliente-info');
    if (clienteInfo && AppState.cliente) {
        clienteInfo.innerHTML = `
            <p><i class="fas fa-user-check"></i> Bienvenido de nuevo, ${AppState.cliente.nombre}</p>
            <p><small>Tu teléfono: ${AppState.cliente.telefono}</small></p>
        `;
    }
}

// Navegación suave para anchor links
document.addEventListener('DOMContentLoaded', function() {
    // Inicializar app
    inicializarApp();
    
    // Smooth scroll para anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            if (targetId === '#') return;
            
            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                window.scrollTo({
                    top: targetElement.offsetTop - 80,
                    behavior: 'smooth'
                });
            }
        });
    });
    
    // Menú responsive
    const menuToggle = document.querySelector('.menu-toggle');
    const mainNav = document.querySelector('.main-nav');
    
    if (menuToggle) {
        menuToggle.addEventListener('click', function() {
            mainNav.classList.toggle('active');
        });
    }
});

// Hacer funciones disponibles globalmente si es necesario
window.App = {
    state: AppState,
    inicializarApp,
    cargarBarberos,
    cargarServicios
};

console.log('✅ main.js cargado');