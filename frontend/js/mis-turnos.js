// Página "Mis Turnos" para clientes
import { 
    initSupabase, getTurnosCliente, cancelarTurno,
    getCurrentCliente, formatFecha, formatHora
} from './supabase-client.js';

// Estado de la página
const MisTurnosState = {
    cliente: null,
    turnos: [],
    telefonoBuscado: '',
    cargando: false
};

// Inicializar página
async function inicializarMisTurnos() {
    console.log('📋 Inicializando página Mis Turnos...');
    
    try {
        // 1. Inicializar Supabase
        const supabase = initSupabase();
        if (!supabase) {
            mostrarError('No se pudo conectar con el sistema');
            return;
        }

        // 2. Verificar si hay cliente en localStorage
        const clienteStorage = getCurrentCliente();
        if (clienteStorage) {
            // Auto-buscar turnos del cliente
            MisTurnosState.cliente = clienteStorage;
            document.getElementById('telefono-busqueda').value = clienteStorage.telefono;
            await buscarTurnosPorTelefono(clienteStorage.telefono);
        }

        // 3. Configurar event listeners
        configurarEventListeners();

        console.log('✅ Página Mis Turnos lista');

    } catch (error) {
        console.error('❌ Error al inicializar:', error);
        mostrarError('Error al cargar la página');
    }
}

// Configurar event listeners
function configurarEventListeners() {
    // Buscar turnos
    document.getElementById('buscarBtn').addEventListener('click', async function() {
        const telefono = document.getElementById('telefono-busqueda').value.trim();
        if (!telefono) {
            alert('Por favor ingresa tu número de teléfono');
            return;
        }
        
        await buscarTurnosPorTelefono(telefono);
    });

    // Buscar al presionar Enter
    document.getElementById('telefono-busqueda').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            document.getElementById('buscarBtn').click();
        }
    });

    // Limpiar búsqueda
    document.getElementById('limpiarBtn').addEventListener('click', function() {
        document.getElementById('telefono-busqueda').value = '';
        resetearResultados();
    });

    // Cerrar modal
    document.querySelector('.close-modal').addEventListener('click', cerrarModal);
    document.getElementById('detalleTurnoModal').addEventListener('click', function(e) {
        if (e.target === this) {
            cerrarModal();
        }
    });
}

// Buscar turnos por teléfono
async function buscarTurnosPorTelefono(telefono) {
    MisTurnosState.cargando = true;
    MisTurnosState.telefonoBuscado = telefono;
    
    // Mostrar loading
    document.getElementById('resultados-container').innerHTML = `
        <div class="loading-container">
            <div class="spinner"></div>
            <p>Buscando tus turnos...</p>
        </div>
    `;

    try {
        // NOTA: En una implementación real, aquí buscarías al cliente por teléfono
        // y luego sus turnos. Por ahora simularemos algunos datos.
        
        // Simular datos de cliente
        MisTurnosState.cliente = {
            id: 'cliente-' + Date.now(),
            nombre: 'Cliente Ejemplo',
            telefono: telefono
        };

        // Mostrar info del cliente
        mostrarInfoCliente();

        // Obtener turnos (simulados por ahora)
        // En producción usarías: getTurnosCliente(clienteId)
        MisTurnosState.turnos = await obtenerTurnosSimulados();
        
        // Actualizar resultados
        actualizarResultados();
        
        // Actualizar estadísticas
        actualizarEstadisticasCliente();

    } catch (error) {
        console.error('Error buscando turnos:', error);
        mostrarMensaje('Error al buscar turnos. Por favor intenta de nuevo.', 'error');
        resetearResultados();
    } finally {
        MisTurnosState.cargando = false;
    }
}

// Obtener turnos simulados (para demostración)
async function obtenerTurnosSimulados() {
    // Simular delay de red
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const hoy = new Date();
    const turnos = [
        {
            id: 'turno-001',
            cliente_id: MisTurnosState.cliente.id,
            barbero_id: 'barbero-1',
            servicio_id: 'servicio-1',
            fecha: hoy.toISOString().split('T')[0],
            hora: '10:00:00',
            estado: 'pendiente',
            notas: 'Corte regular',
            creado_en: new Date().toISOString(),
            barberos: {
                nombre: 'Carlos Rodríguez',
                especialidad: 'Corte clásico'
            },
            servicios: {
                nombre: 'Corte de Cabello',
                precio: 25.00,
                duracion_min: 30
            }
        },
        {
            id: 'turno-002',
            cliente_id: MisTurnosState.cliente.id,
            barbero_id: 'barbero-2',
            servicio_id: 'servicio-3',
            fecha: new Date(hoy.getTime() + 86400000).toISOString().split('T')[0], // Mañana
            hora: '15:00:00',
            estado: 'confirmado',
            notas: '',
            creado_en: new Date(Date.now() - 86400000).toISOString(), // Ayer
            barberos: {
                nombre: 'María González',
                especialidad: 'Estilista femenino'
            },
            servicios: {
                nombre: 'Corte + Barba',
                precio: 40.00,
                duracion_min: 60
            }
        },
        {
            id: 'turno-003',
            cliente_id: MisTurnosState.cliente.id,
            barbero_id: 'barbero-1',
            servicio_id: 'servicio-2',
            fecha: new Date(hoy.getTime() - 86400000).toISOString().split('T')[0], // Ayer
            hora: '11:00:00',
            estado: 'completado',
            notas: 'Muy buen servicio',
            creado_en: new Date(Date.now() - 172800000).toISOString(), // Hace 2 días
            barberos: {
                nombre: 'Carlos Rodríguez',
                especialidad: 'Corte clásico'
            },
            servicios: {
                nombre: 'Afeitado Tradicional',
                precio: 30.00,
                duracion_min: 45
            }
        }
    ];
    
    return turnos;
}

// Mostrar información del cliente
function mostrarInfoCliente() {
    const container = document.getElementById('cliente-info');
    container.style.display = 'block';
    container.innerHTML = `
        <div style="background: #e8f5e9; padding: 15px; border-radius: 5px; border-left: 4px solid #4caf50;">
            <h4><i class="fas fa-user-check"></i> ¡Hola, ${MisTurnosState.cliente.nombre}!</h4>
            <p>Teléfono: ${MisTurnosState.cliente.telefono}</p>
            <p><small>Se encontraron ${MisTurnosState.turnos.length} turnos registrados</small></p>
        </div>
    `;
}

// Actualizar resultados
function actualizarResultados() {
    const container = document.getElementById('resultados-container');
    
    if (MisTurnosState.turnos.length === 0) {
        container.innerHTML = `
            <div class="no-resultados">
                <div style="text-align: center; padding: 50px;">
                    <i class="far fa-calendar-times" style="font-size: 4rem; color: #ccc; margin-bottom: 20px;"></i>
                    <h3>No hay turnos registrados</h3>
                    <p>No se encontraron turnos para el teléfono ${MisTurnosState.telefonoBuscado}</p>
                    <a href="reservar.html" class="btn btn-primary" style="margin-top: 20px;">
                        <i class="fas fa-calendar-plus"></i> Reservar mi primer turno
                    </a>
                </div>
            </div>
        `;
        return;
    }

    // Separar turnos por estado
    const turnosPendientes = MisTurnosState.turnos.filter(t => t.estado === 'pendiente');
    const turnosConfirmados = MisTurnosState.turnos.filter(t => t.estado === 'confirmado');
    const turnosCompletados = MisTurnosState.turnos.filter(t => t.estado === 'completado');
    const turnosCancelados = MisTurnosState.turnos.filter(t => t.estado === 'cancelado');

    container.innerHTML = '';

    // Turnos Pendientes
    if (turnosPendientes.length > 0) {
        container.innerHTML += `
            <div class="turnos-categoria">
                <h3><i class="fas fa-clock" style="color: #ffc107;"></i> Turnos Pendientes</h3>
                <p>Esperando confirmación del barbero</p>
                <div class="turnos-grid">
                    ${turnosPendientes.map(turno => crearCardTurno(turno)).join('')}
                </div>
            </div>
        `;
    }

    // Turnos Confirmados
    if (turnosConfirmados.length > 0) {
        container.innerHTML += `
            <div class="turnos-categoria">
                <h3><i class="fas fa-calendar-check" style="color: #28a745;"></i> Turnos Confirmados</h3>
                <p>¡Listos para asistir!</p>
                <div class="turnos-grid">
                    ${turnosConfirmados.map(turno => crearCardTurno(turno)).join('')}
                </div>
            </div>
        `;
    }

    // Turnos Completados
    if (turnosCompletados.length > 0) {
        container.innerHTML += `
            <div class="turnos-categoria">
                <h3><i class="fas fa-check-double" style="color: #17a2b8;"></i> Turnos Completados</h3>
                <p>Historial de tus visitas</p>
                <div class="turnos-grid">
                    ${turnosCompletados.map(turno => crearCardTurno(turno)).join('')}
                </div>
            </div>
        `;
    }

    // Turnos Cancelados
    if (turnosCancelados.length > 0) {
        container.innerHTML += `
            <div class="turnos-categoria">
                <h3><i class="fas fa-times-circle" style="color: #dc3545;"></i> Turnos Cancelados</h3>
                <div class="turnos-grid">
                    ${turnosCancelados.map(turno => crearCardTurno(turno)).join('')}
                </div>
            </div>
        `;
    }

    // Mostrar sección de estadísticas
    document.getElementById('stats-cliente').style.display = 'block';
}

// Crear card para un turno
function crearCardTurno(turno) {
    const esPasado = new Date(turno.fecha + 'T' + turno.hora) < new Date();
    const puedeCancelar = !esPasado && (turno.estado === 'pendiente' || turno.estado === 'confirmado');
    
    return `
        <div class="turno-card ${turno.estado} ${esPasado ? 'pasado' : ''}" data-id="${turno.id}">
            <div class="turno-header">
                <span class="turno-estado estado-${turno.estado}">${turno.estado}</span>
                <span class="turno-id">#${turno.id.substring(0, 8)}</span>
            </div>
            
            <div class="turno-body">
                <div class="turno-info">
                    <h4>${turno.servicios.nombre}</h4>
                    <p><i class="fas fa-user-tie"></i> ${turno.barberos.nombre}</p>
                    <p><i class="fas fa-calendar-day"></i> ${formatFecha(turno.fecha)}</p>
                    <p><i class="fas fa-clock"></i> ${formatHora(turno.hora)}</p>
                    <p><i class="fas fa-money-bill-wave"></i> $${turno.servicios.precio}</p>
                </div>
                
                <div class="turno-actions">
                    <button class="btn btn-sm btn-outline" onclick="verDetalles('${turno.id}')">
                        <i class="fas fa-eye"></i> Detalles
                    </button>
                    
                    ${puedeCancelar ? `
                        <button class="btn btn-sm btn-danger" onclick="cancelarTurnoCliente('${turno.id}')">
                            <i class="fas fa-times"></i> Cancelar
                        </button>
                    ` : ''}
                    
                    ${turno.estado === 'completado' ? `
                        <button class="btn btn-sm btn-success" onclick="calificarTurno('${turno.id}')">
                            <i class="fas fa-star"></i> Calificar
                        </button>
                    ` : ''}
                </div>
            </div>
            
            ${turno.notas ? `
                <div class="turno-notas">
                    <p><strong>Notas:</strong> ${turno.notas}</p>
                </div>
            ` : ''}
        </div>
    `;
}

// Ver detalles de un turno
window.verDetalles = function(turnoId) {
    const turno = MisTurnosState.turnos.find(t => t.id === turnoId);
    if (!turno) return;

    const modal = document.getElementById('detalleTurnoModal');
    const modalBody = document.getElementById('detalleTurnoBody');

    const esPasado = new Date(turno.fecha + 'T' + turno.hora) < new Date();
    const puedeCancelar = !esPasado && (turno.estado === 'pendiente' || turno.estado === 'confirmado');

    modalBody.innerHTML = `
        <div class="turno-detalles-modal">
            <div class="detalle-item">
                <strong>Estado:</strong>
                <span class="estado-badge estado-${turno.estado}">${turno.estado}</span>
            </div>
            
            <div class="detalle-item">
                <strong>Código:</strong>
                <span>${turno.id}</span>
            </div>
            
            <div class="detalle-item">
                <strong>Cliente:</strong>
                <span>${MisTurnosState.cliente.nombre}</span>
            </div>
            
            <div class="detalle-item">
                <strong>Teléfono:</strong>
                <span>${MisTurnosState.cliente.telefono}</span>
            </div>
            
            <div class="detalle-item">
                <strong>Barbero:</strong>
                <span>${turno.barberos.nombre}</span>
            </div>
            
            <div class="detalle-item">
                <strong>Especialidad:</strong>
                <span>${turno.barberos.especialidad}</span>
            </div>
            
            <div class="detalle-item">
                <strong>Servicio:</strong>
                <span>${turno.servicios.nombre}</span>
            </div>
            
            <div class="detalle-item">
                <strong>Precio:</strong>
                <span>$${turno.servicios.precio}</span>
            </div>
            
            <div class="detalle-item">
                <strong>Duración:</strong>
                <span>${turno.servicios.duracion_min} minutos</span>
            </div>
            
            <div class="detalle-item">
                <strong>Fecha:</strong>
                <span>${formatFecha(turno.fecha)}</span>
            </div>
            
            <div class="detalle-item">
                <strong>Hora:</strong>
                <span>${formatHora(turno.hora)}</span>
            </div>
            
            <div class="detalle-item">
                <strong>Reservado el:</strong>
                <span>${new Date(turno.creado_en).toLocaleString('es-ES')}</span>
            </div>
            
            ${turno.notas ? `
                <div class="detalle-item">
                    <strong>Notas:</strong>
                    <p>${turno.notas}</p>
                </div>
            ` : ''}
            
            <div class="modal-actions" style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
                <div style="display: flex; gap: 10px; justify-content: center;">
                    ${puedeCancelar ? `
                        <button class="btn btn-danger" onclick="cancelarTurnoCliente('${turnoId}'); cerrarModal()">
                            <i class="fas fa-times"></i> Cancelar Turno
                        </button>
                    ` : ''}
                    
                    <button class="btn btn-secondary" onclick="cerrarModal()">
                        <i class="fas fa-times"></i> Cerrar
                    </button>
                </div>
            </div>
        </div>
    `;

    modal.style.display = 'block';
};

// Cancelar turno (para clientes)
window.cancelarTurnoCliente = async function(turnoId) {
    const turno = MisTurnosState.turnos.find(t => t.id === turnoId);
    if (!turno) return;

    if (!confirm('¿Estás seguro de que quieres cancelar este turno?')) {
        return;
    }

    try {
        // En producción usarías: await cancelarTurno(turnoId);
        // Por ahora simulamos la cancelación
        
        // Actualizar estado local
        const index = MisTurnosState.turnos.findIndex(t => t.id === turnoId);
        if (index !== -1) {
            MisTurnosState.turnos[index].estado = 'cancelado';
        }

        // Actualizar UI
        actualizarResultados();
        actualizarEstadisticasCliente();

        mostrarMensaje('Turno cancelado correctamente', 'success');

    } catch (error) {
        console.error('Error cancelando turno:', error);
        mostrarMensaje('Error al cancelar el turno', 'error');
    }
};

// Calificar turno (simulado)
window.calificarTurno = function(turnoId) {
    const calificacion = prompt('Califica este turno del 1 al 5 estrellas:');
    if (calificacion && calificacion >= 1 && calificacion <= 5) {
        mostrarMensaje(`¡Gracias por tu calificación de ${calificacion} estrellas!`, 'success');
    }
};

// Actualizar estadísticas del cliente
function actualizarEstadisticasCliente() {
    const totalTurnos = MisTurnosState.turnos.length;
    const turnosPendientes = MisTurnosState.turnos.filter(t => t.estado === 'pendiente').length;
    const turnosCompletados = MisTurnosState.turnos.filter(t => t.estado === 'completado').length;
    
    // Encontrar barbero favorito
    const barberoCount = {};
    MisTurnosState.turnos.forEach(turno => {
        if (turno.barberos && turno.barberos.nombre) {
            barberoCount[turno.barberos.nombre] = (barberoCount[turno.barberos.nombre] || 0) + 1;
        }
    });
    
    let barberoFavorito = '-';
    let maxVisitas = 0;
    for (const [barbero, count] of Object.entries(barberoCount)) {
        if (count > maxVisitas) {
            maxVisitas = count;
            barberoFavorito = barbero.split(' ')[0]; // Solo el primer nombre
        }
    }

    document.getElementById('total-turnos').textContent = totalTurnos;
    document.getElementById('turnos-pendientes-cliente').textContent = turnosPendientes;
    document.getElementById('turnos-completados').textContent = turnosCompletados;
    document.getElementById('barbero-favorito').textContent = barberoFavorito;
}

// Resetear resultados
function resetearResultados() {
    MisTurnosState.cliente = null;
    MisTurnosState.turnos = [];
    MisTurnosState.telefonoBuscado = '';
    
    document.getElementById('cliente-info').style.display = 'none';
    document.getElementById('stats-cliente').style.display = 'none';
    document.getElementById('resultados-container').innerHTML = `
        <div class="estado-inicial">
            <div style="text-align: center; padding: 50px;">
                <i class="fas fa-calendar-alt" style="font-size: 4rem; color: #ccc; margin-bottom: 20px;"></i>
                <h3>Busca tus turnos</h3>
                <p>Ingresa tu número de teléfono para ver todas tus reservas</p>
            </div>
        </div>
    `;
}

// Cerrar modal
function cerrarModal() {
    document.getElementById('detalleTurnoModal').style.display = 'none';
}

// Mostrar mensaje
function mostrarMensaje(texto, tipo = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${tipo}`;
    toast.innerHTML = `
        <div style="position: fixed; top: 20px; right: 20px; background: ${tipo === 'error' ? '#dc3545' : '#28a745'}; 
             color: white; padding: 15px 20px; border-radius: 5px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); z-index: 1000;">
            <i class="fas fa-${tipo === 'error' ? 'exclamation-circle' : 'check-circle'}"></i> ${texto}
        </div>
    `;
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.remove();
    }, 3000);
}

// Mostrar error
function mostrarError(mensaje) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-critico';
    errorDiv.innerHTML = `
        <div style="position: fixed; top: 0; left: 0; right: 0; background: #dc3545; color: white; 
             padding: 20px; text-align: center; z-index: 9999;">
            <i class="fas fa-exclamation-triangle"></i> ${mensaje}
        </div>
    `;
    
    document.body.prepend(errorDiv);
}

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', inicializarMisTurnos);