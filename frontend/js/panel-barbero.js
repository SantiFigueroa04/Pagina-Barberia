// Panel del Barbero - Lógica completa
import { 
    initSupabase, getBarbero, getTurnosBarbero, cambiarEstadoTurno,
    formatFecha, formatHora, getCurrentCliente 
} from './supabase-client.js';

// Estado global del panel
const PanelState = {
    barbero: null,
    turnos: [],
    horarios: [],
    estadisticas: {},
    fechaSeleccionada: new Date().toISOString().split('T')[0],
    filtros: {
        estado: '',
        fecha: ''
    },
    charts: {}
};

// Inicializar panel
async function inicializarPanel() {
    console.log('👔 Inicializando panel del barbero...');
    
    try {
        // 1. Verificar autenticación
        const sessionData = localStorage.getItem('barbero_session');
        if (!sessionData) {
            window.location.href = 'login-barbero.html';
            return;
        }

        // 2. Inicializar Supabase
        const supabase = initSupabase();
        if (!supabase) {
            mostrarError('No se pudo conectar con el sistema');
            return;
        }

        // 3. Obtener información del barbero (simulada por ahora)
        // En una implementación real, obtendrías esto de la tabla perfiles
        PanelState.barbero = {
            id: 'barbero-id-temporal',
            nombre: 'Juan Pérez',
            email: 'juan@barberia.com',
            telefono: '1122334455',
            especialidad: 'Corte clásico y barba',
            descripcion: 'Especialista en cortes tradicionales con más de 10 años de experiencia.'
        };

        // 4. Cargar datos iniciales
        await Promise.all([
            cargarInformacionBarbero(),
            cargarTurnosDelDia(),
            cargarEstadisticas(),
            configurarUI()
        ]);

        // 5. Configurar event listeners
        configurarEventListeners();

        console.log('✅ Panel del barbero inicializado');

    } catch (error) {
        console.error('❌ Error al inicializar panel:', error);
        mostrarError('Error al cargar el panel. Por favor, recarga la página.');
    }
}

// Cargar información del barbero en la UI
async function cargarInformacionBarbero() {
    // Actualizar sidebar y header
    document.getElementById('barbero-nombre').textContent = PanelState.barbero.nombre;
    document.getElementById('header-nombre').textContent = PanelState.barbero.nombre;
    document.getElementById('header-email').textContent = PanelState.barbero.email;
    
    // Llenar formulario de perfil
    document.getElementById('profileNombre').value = PanelState.barbero.nombre;
    document.getElementById('profileEmail').value = PanelState.barbero.email;
    document.getElementById('profileTelefono').value = PanelState.barbero.telefono;
    document.getElementById('profileEspecialidad').value = PanelState.barbero.especialidad;
    document.getElementById('profileDescripcion').value = PanelState.barbero.descripcion;
}

// Cargar turnos del día
async function cargarTurnosDelDia() {
    try {
        // Obtener turnos para hoy
        const { data: turnos, error } = await getTurnosBarbero(
            PanelState.barbero.id, 
            PanelState.fechaSeleccionada
        );

        if (error) throw error;

        PanelState.turnos = turnos || [];
        
        // Actualizar estadísticas rápidas
        actualizarEstadisticasRapidas();
        
        // Actualizar tabla de próximos turnos
        actualizarTablaProximosTurnos();
        
        // Actualizar tabla de todos los turnos
        actualizarTablaTodosTurnos();

    } catch (error) {
        console.error('Error cargando turnos:', error);
        mostrarMensaje('Error al cargar los turnos', 'error');
    }
}

// Actualizar estadísticas rápidas
function actualizarEstadisticasRapidas() {
    const hoy = PanelState.fechaSeleccionada;
    const turnosHoy = PanelState.turnos.filter(t => t.fecha === hoy);
    const turnosPendientes = PanelState.turnos.filter(t => t.estado === 'pendiente');
    
    // Calcular ingresos del mes (simulado)
    const ingresosMes = PanelState.turnos
        .filter(t => t.estado === 'completado')
        .reduce((sum, t) => sum + (t.servicios?.precio || 0), 0);

    // Actualizar UI
    document.getElementById('turnos-hoy').textContent = turnosHoy.length;
    document.getElementById('turnos-pendientes').textContent = turnosPendientes.length;
    document.getElementById('ingresos-mes').textContent = `$${ingresosMes}`;
    document.getElementById('calificacion').textContent = '4.8'; // Simulado
}

// Actualizar tabla de próximos turnos
function actualizarTablaProximosTurnos() {
    const tbody = document.querySelector('#proximos-turnos tbody');
    const turnosProximos = PanelState.turnos
        .filter(t => t.estado === 'pendiente' || t.estado === 'confirmado')
        .sort((a, b) => new Date(a.fecha + 'T' + a.hora) - new Date(b.fecha + 'T' + b.hora))
        .slice(0, 10); // Mostrar solo los próximos 10

    if (turnosProximos.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6" style="text-align: center; padding: 30px;">
                    <i class="far fa-calendar-times" style="font-size: 2rem; color: #ccc; margin-bottom: 10px; display: block;"></i>
                    <p>No hay turnos próximos</p>
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = turnosProximos.map(turno => `
        <tr data-id="${turno.id}">
            <td>
                <strong>${turno.clientes?.nombre || 'Cliente'}</strong>
                <br>
                <small>${turno.clientes?.telefono || 'Sin teléfono'}</small>
            </td>
            <td>${turno.servicios?.nombre || 'Servicio'}</td>
            <td>${formatFecha(turno.fecha)}</td>
            <td><strong>${formatHora(turno.hora)}</strong></td>
            <td>
                <span class="estado-badge estado-${turno.estado}">
                    ${turno.estado}
                </span>
            </td>
            <td>
                <div class="acciones-turno">
                    ${turno.estado === 'pendiente' ? `
                        <button class="btn-icon btn-confirmar" onclick="cambiarEstado('${turno.id}', 'confirmado')" 
                                title="Confirmar turno">
                            <i class="fas fa-check"></i>
                        </button>
                    ` : ''}
                    
                    ${turno.estado !== 'cancelado' && turno.estado !== 'completado' ? `
                        <button class="btn-icon btn-cancelar" onclick="cambiarEstado('${turno.id}', 'cancelado')"
                                title="Cancelar turno">
                            <i class="fas fa-times"></i>
                        </button>
                    ` : ''}
                    
                    ${turno.estado === 'confirmado' ? `
                        <button class="btn-icon btn-completar" onclick="cambiarEstado('${turno.id}', 'completado')"
                                title="Marcar como completado">
                            <i class="fas fa-check-double"></i>
                        </button>
                    ` : ''}
                    
                    <button class="btn-icon" onclick="verDetallesTurno('${turno.id}')"
                            title="Ver detalles">
                        <i class="fas fa-eye"></i>
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
}

// Actualizar tabla de todos los turnos
function actualizarTablaTodosTurnos() {
    const tbody = document.querySelector('#todos-turnos tbody');
    
    // Aplicar filtros
    let turnosFiltrados = [...PanelState.turnos];
    
    if (PanelState.filtros.estado) {
        turnosFiltrados = turnosFiltrados.filter(t => t.estado === PanelState.filtros.estado);
    }
    
    if (PanelState.filtros.fecha) {
        turnosFiltrados = turnosFiltrados.filter(t => t.fecha === PanelState.filtros.fecha);
    }
    
    // Ordenar por fecha más reciente primero
    turnosFiltrados.sort((a, b) => new Date(b.fecha + 'T' + b.hora) - new Date(a.fecha + 'T' + a.hora));

    if (turnosFiltrados.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="8" style="text-align: center; padding: 30px;">
                    <i class="far fa-calendar-times" style="font-size: 2rem; color: #ccc; margin-bottom: 10px; display: block;"></i>
                    <p>No hay turnos con los filtros seleccionados</p>
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = turnosFiltrados.map(turno => `
        <tr data-id="${turno.id}">
            <td><small>${turno.id.substring(0, 8)}</small></td>
            <td>
                <strong>${turno.clientes?.nombre || 'Cliente'}</strong>
                <br>
                <small>${turno.notas || 'Sin notas'}</small>
            </td>
            <td>${turno.clientes?.telefono || '--'}</td>
            <td>${turno.servicios?.nombre || 'Servicio'}</td>
            <td>${formatFecha(turno.fecha)}</td>
            <td><strong>${formatHora(turno.hora)}</strong></td>
            <td>
                <span class="estado-badge estado-${turno.estado}">
                    ${turno.estado}
                </span>
            </td>
            <td>
                <div class="acciones-turno">
                    ${turno.estado === 'pendiente' ? `
                        <button class="btn-icon btn-confirmar" onclick="cambiarEstado('${turno.id}', 'confirmado')">
                            <i class="fas fa-check"></i>
                        </button>
                    ` : ''}
                    
                    ${turno.estado !== 'cancelado' && turno.estado !== 'completado' ? `
                        <button class="btn-icon btn-cancelar" onclick="cambiarEstado('${turno.id}', 'cancelado')">
                            <i class="fas fa-times"></i>
                        </button>
                    ` : ''}
                    
                    <button class="btn-icon" onclick="verDetallesTurno('${turno.id}')">
                        <i class="fas fa-eye"></i>
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
}

// Cambiar estado de un turno
window.cambiarEstado = async function(turnoId, nuevoEstado) {
    if (!confirm(`¿Estás seguro de cambiar el estado a "${nuevoEstado}"?`)) {
        return;
    }

    try {
        const { data: turno, error } = await cambiarEstadoTurno(turnoId, nuevoEstado);
        
        if (error) throw error;

        // Actualizar estado local
        const index = PanelState.turnos.findIndex(t => t.id === turnoId);
        if (index !== -1) {
            PanelState.turnos[index].estado = nuevoEstado;
        }

        // Actualizar UI
        actualizarEstadisticasRapidas();
        actualizarTablaProximosTurnos();
        actualizarTablaTodosTurnos();

        mostrarMensaje(`Turno ${nuevoEstado} correctamente`, 'success');

    } catch (error) {
        console.error('Error cambiando estado:', error);
        mostrarMensaje(`Error: ${error.message}`, 'error');
    }
};

// Ver detalles de un turno
window.verDetallesTurno = async function(turnoId) {
    const turno = PanelState.turnos.find(t => t.id === turnoId);
    if (!turno) return;

    const modal = document.getElementById('turnoModal');
    const modalBody = document.getElementById('modalBody');

    modalBody.innerHTML = `
        <div class="turno-detalles">
            <div class="detalle-item">
                <strong>Cliente:</strong>
                <span>${turno.clientes?.nombre || 'No especificado'}</span>
            </div>
            <div class="detalle-item">
                <strong>Teléfono:</strong>
                <span>${turno.clientes?.telefono || 'No especificado'}</span>
            </div>
            <div class="detalle-item">
                <strong>Servicio:</strong>
                <span>${turno.servicios?.nombre || 'No especificado'}</span>
            </div>
            <div class="detalle-item">
                <strong>Precio:</strong>
                <span>$${turno.servicios?.precio || '0'}</span>
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
                <strong>Estado:</strong>
                <span class="estado-badge estado-${turno.estado}">${turno.estado}</span>
            </div>
            <div class="detalle-item">
                <strong>Notas:</strong>
                <p>${turno.notas || 'Sin notas adicionales'}</p>
            </div>
            <div class="detalle-item">
                <strong>Reservado el:</strong>
                <span>${new Date(turno.creado_en).toLocaleString('es-ES')}</span>
            </div>
        </div>
        
        <div class="modal-actions" style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #eee;">
            <h4>Acciones</h4>
            <div style="display: flex; gap: 10px; margin-top: 10px;">
                ${turno.estado === 'pendiente' ? `
                    <button class="btn btn-success" onclick="cambiarEstado('${turnoId}', 'confirmado'); cerrarModal()">
                        <i class="fas fa-check"></i> Confirmar
                    </button>
                ` : ''}
                
                ${turno.estado !== 'cancelado' && turno.estado !== 'completado' ? `
                    <button class="btn btn-danger" onclick="cambiarEstado('${turnoId}', 'cancelado'); cerrarModal()">
                        <i class="fas fa-times"></i> Cancelar
                    </button>
                ` : ''}
                
                ${turno.estado === 'confirmado' ? `
                    <button class="btn btn-primary" onclick="cambiarEstado('${turnoId}', 'completado'); cerrarModal()">
                        <i class="fas fa-check-double"></i> Completar
                    </button>
                ` : ''}
                
                <button class="btn btn-secondary" onclick="cerrarModal()">
                    <i class="fas fa-times"></i> Cerrar
                </button>
            </div>
        </div>
    `;

    modal.style.display = 'block';
};

// Cerrar modal
function cerrarModal() {
    document.getElementById('turnoModal').style.display = 'none';
}

// Cargar estadísticas
async function cargarEstadisticas() {
    // Simular estadísticas por ahora
    PanelState.estadisticas = {
        totalTurnos: PanelState.turnos.length,
        ocupacion: '75%',
        clientesUnicos: 45,
        promedioDuracion: 45
    };

    // Actualizar UI
    document.getElementById('stats-total-turnos').textContent = PanelState.estadisticas.totalTurnos;
    document.getElementById('stats-ocupacion').textContent = PanelState.estadisticas.ocupacion;
    document.getElementById('stats-clientes-unicos').textContent = PanelState.estadisticas.clientesUnicos;
    document.getElementById('stats-promedio-duracion').textContent = PanelState.estadisticas.promedioDuracion;

    // Inicializar gráficos
    inicializarGraficos();
}

// Inicializar gráficos
function inicializarGraficos() {
    // Gráfico de estados
    const ctxEstados = document.getElementById('chartEstados');
    if (ctxEstados) {
        const estadosCount = {
            pendiente: PanelState.turnos.filter(t => t.estado === 'pendiente').length,
            confirmado: PanelState.turnos.filter(t => t.estado === 'confirmado').length,
            completado: PanelState.turnos.filter(t => t.estado === 'completado').length,
            cancelado: PanelState.turnos.filter(t => t.estado === 'cancelado').length
        };

        PanelState.charts.estados = new Chart(ctxEstados, {
            type: 'doughnut',
            data: {
                labels: ['Pendientes', 'Confirmados', 'Completados', 'Cancelados'],
                datasets: [{
                    data: [estadosCount.pendiente, estadosCount.confirmado, estadosCount.completado, estadosCount.cancelado],
                    backgroundColor: [
                        '#ffc107',
                        '#28a745',
                        '#17a2b8',
                        '#dc3545'
                    ]
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        position: 'bottom'
                    }
                }
            }
        });
    }

    // Gráfico de ingresos (simulado)
    const ctxIngresos = document.getElementById('chartIngresos');
    if (ctxIngresos) {
        PanelState.charts.ingresos = new Chart(ctxIngresos, {
            type: 'line',
            data: {
                labels: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun'],
                datasets: [{
                    label: 'Ingresos ($)',
                    data: [1200, 1900, 3000, 5000, 2000, 3000],
                    borderColor: '#d4af37',
                    backgroundColor: 'rgba(212, 175, 55, 0.1)',
                    fill: true
                }]
            },
            options: {
                responsive: true,
                scales: {
                    y: {
                        beginAtZero: true
                    }
                }
            }
        });
    }
}

// Configurar UI
function configurarUI() {
    // Date picker
    flatpickr("#datePicker", {
        dateFormat: "Y-m-d",
        defaultDate: PanelState.fechaSeleccionada,
        onChange: function(selectedDates, dateStr) {
            PanelState.fechaSeleccionada = dateStr;
            cargarTurnosDelDia();
        }
    });

    // Navegación entre secciones
    document.querySelectorAll('.sidebar-nav a').forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Actualizar active class
            document.querySelectorAll('.sidebar-nav a').forEach(l => l.classList.remove('active'));
            this.classList.add('active');
            
            // Mostrar sección correspondiente
            const sectionId = this.getAttribute('data-section');
            document.querySelectorAll('.content-section').forEach(section => {
                section.classList.remove('active');
            });
            document.getElementById(sectionId).classList.add('active');
        });
    });

    // Botón de hoy
    document.getElementById('todayBtn').addEventListener('click', function() {
        const today = new Date().toISOString().split('T')[0];
        document.getElementById('datePicker').value = today;
        PanelState.fechaSeleccionada = today;
        cargarTurnosDelDia();
    });

    // Botón de refrescar
    document.getElementById('refreshTurnos').addEventListener('click', cargarTurnosDelDia);

    // Filtros
    document.getElementById('filterEstado').addEventListener('change', function() {
        PanelState.filtros.estado = this.value;
        actualizarTablaTodosTurnos();
    });

    document.getElementById('filterFecha').addEventListener('change', function() {
        PanelState.filtros.fecha = this.value;
        actualizarTablaTodosTurnos();
    });

    document.getElementById('filterBtn').addEventListener('click', function() {
        // Reset filters
        PanelState.filtros.estado = '';
        PanelState.filtros.fecha = '';
        document.getElementById('filterEstado').value = '';
        document.getElementById('filterFecha').value = '';
        actualizarTablaTodosTurnos();
    });

    // Botón de logout
    document.getElementById('logoutBtn').addEventListener('click', function() {
        if (confirm('¿Estás seguro de que quieres cerrar sesión?')) {
            localStorage.removeItem('barbero_session');
            window.location.href = 'login-barbero.html';
        }
    });

    // Toggle sidebar en móvil
    document.getElementById('menuToggle').addEventListener('click', function() {
        document.getElementById('sidebar').classList.toggle('active');
    });

    // Cerrar modal al hacer click fuera
    document.querySelector('.modal').addEventListener('click', function(e) {
        if (e.target === this) {
            cerrarModal();
        }
    });

    document.querySelector('.close-modal').addEventListener('click', cerrarModal);
}

// Mostrar mensaje
function mostrarMensaje(texto, tipo = 'info') {
    // Crear toast message
    const toast = document.createElement('div');
    toast.className = `toast toast-${tipo}`;
    toast.innerHTML = `
        <div style="position: fixed; top: 20px; right: 20px; background: ${tipo === 'error' ? '#dc3545' : '#28a745'}; 
             color: white; padding: 15px 20px; border-radius: 5px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); z-index: 1000;">
            <i class="fas fa-${tipo === 'error' ? 'exclamation-circle' : 'check-circle'}"></i> ${texto}
        </div>
    `;
    
    document.body.appendChild(toast);
    
    // Auto-remover después de 3 segundos
    setTimeout(() => {
        toast.remove();
    }, 3000);
}

// Mostrar error crítico
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

// Actualizar última sincronización
function actualizarUltimaSincronizacion() {
    const ahora = new Date();
    document.getElementById('lastSync').textContent = 
        `Última sincronización: ${ahora.toLocaleTimeString('es-ES')}`;
}

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', function() {
    inicializarPanel();
    
    // Actualizar hora cada minuto
    setInterval(actualizarUltimaSincronizacion, 60000);
    actualizarUltimaSincronizacion();
});

// Exportar funciones globales
window.PanelManager = {
    state: PanelState,
    cargarTurnosDelDia,
    cambiarEstado: window.cambiarEstado,
    verDetallesTurno: window.verDetallesTurno
};