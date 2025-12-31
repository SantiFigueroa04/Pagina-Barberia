// Lógica de login para barberos
import { initSupabase, loginBarbero } from './supabase-client.js';

// Inicializar login
async function inicializarLogin() {
    console.log('🔐 Inicializando login para barberos...');
    
    try {
        // Inicializar Supabase
        const supabase = initSupabase();
        if (!supabase) {
            mostrarError('No se pudo conectar con el sistema');
            return;
        }

        // Configurar formulario
        const form = document.getElementById('login-form');
        const messageDiv = document.getElementById('login-message');

        form.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const email = document.getElementById('email').value.trim();
            const password = document.getElementById('password').value.trim();

            // Validar
            if (!email || !password) {
                mostrarMensaje('Por favor completa todos los campos', 'error');
                return;
            }

            // Mostrar loading
            const submitBtn = form.querySelector('button[type="submit"]');
            const originalText = submitBtn.innerHTML;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Verificando...';
            submitBtn.disabled = true;

            try {
                // Intentar login
                const result = await loginBarbero(email, password);
                
                if (result.success) {
                    mostrarMensaje('¡Acceso exitoso! Redirigiendo...', 'success');
                    
                    // Guardar sesión
                    localStorage.setItem('barbero_session', JSON.stringify({
                        user: result.user,
                        session: result.session,
                        timestamp: new Date().toISOString()
                    }));

                    // Redirigir al panel después de 1 segundo
                    setTimeout(() => {
                        window.location.href = 'panel-barbero.html';
                    }, 1000);

                } else {
                    mostrarMensaje(`Error: ${result.error}`, 'error');
                    submitBtn.innerHTML = originalText;
                    submitBtn.disabled = false;
                }

            } catch (error) {
                console.error('Error en login:', error);
                mostrarMensaje('Error inesperado. Por favor intenta de nuevo.', 'error');
                submitBtn.innerHTML = originalText;
                submitBtn.disabled = false;
            }
        });

        // Verificar si ya hay sesión activa
        verificarSesionActiva();

    } catch (error) {
        console.error('Error inicializando login:', error);
        mostrarError('Error al cargar el sistema de login');
    }
}

// Verificar si hay sesión activa
function verificarSesionActiva() {
    const sessionData = localStorage.getItem('barbero_session');
    if (sessionData) {
        try {
            const session = JSON.parse(sessionData);
            const timestamp = new Date(session.timestamp);
            const now = new Date();
            const diffHours = (now - timestamp) / (1000 * 60 * 60);

            // Si la sesión tiene menos de 24 horas, redirigir automáticamente
            if (diffHours < 24) {
                console.log('Sesión activa encontrada, redirigiendo...');
                window.location.href = 'panel-barbero.html';
            } else {
                // Sesión expirada, eliminar
                localStorage.removeItem('barbero_session');
            }
        } catch (error) {
            localStorage.removeItem('barbero_session');
        }
    }
}

// Mostrar mensaje en el formulario
function mostrarMensaje(texto, tipo = 'info') {
    const messageDiv = document.getElementById('login-message');
    
    messageDiv.innerHTML = `
        <div class="mensaje ${tipo}">
            ${tipo === 'error' ? '<i class="fas fa-exclamation-circle"></i>' : ''}
            ${tipo === 'success' ? '<i class="fas fa-check-circle"></i>' : ''}
            ${texto}
        </div>
    `;

    // Auto-ocultar mensajes de éxito después de 5 segundos
    if (tipo === 'success') {
        setTimeout(() => {
            messageDiv.innerHTML = '';
        }, 5000);
    }
}

// Mostrar error crítico
function mostrarError(mensaje) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-critico';
    errorDiv.innerHTML = `
        <div style="background: #dc3545; color: white; padding: 20px; margin: 20px; border-radius: 5px; text-align: center;">
            <i class="fas fa-exclamation-triangle"></i> ${mensaje}
        </div>
    `;
    
    document.querySelector('.login-container').prepend(errorDiv);
}

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', inicializarLogin);