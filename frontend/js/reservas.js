// Lógica de la página de reserva
import { 
    initSupabase, getBarberos, getBarbero, getServicios,
    getHorariosDisponibles, registrarCliente, crearTurno,
    getCurrentCliente, formatFecha, formatHora
} from './supabase-client.js';

// Estado de la reserva
const ReservaState = {
    pasoActual: 1,
    barberoSeleccionado: null,
    servicioSeleccionado: null,
    fechaSeleccionada: null,
    horaSeleccionada: null,
    cliente: null,
    horariosDisponibles: []
};

// Inicializar página de reserva
async function inicializarReserva() {
    console.log('📅 Inicializando página de reserva...');
    
    try {
        // 1. Inicializar Supabase
        const supabase = initSupabase();
        if (!supabase) {
            mostrarError('No se pudo conectar con el sistema');
            return;
        }

        // 2. Obtener cliente actual (si existe)
        ReservaState.cliente = getCurrentCliente();
        if (ReservaState.cliente) {
            document.getElementById('nombre-cliente').value = ReservaState.cliente.nombre;
            document.getElementById('telefono-cliente').value = ReservaState.cliente.telefono;
        }

        // 3. Cargar barberos
        await cargarBarberosParaReserva();

        // 4. Cargar servicios
        await cargarServiciosParaReserva();

        // 5. Configurar fecha mínima (mañana)
        const fechaInput = document.getElementById('fecha-reserva');
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        fechaInput.min = tomorrow.toISOString().split('T')[0];
        
        // Fecha máxima (30 días)
        const maxDate = new Date();
        maxDate.setDate(maxDate.getDate() + 30);
        fechaInput.max = maxDate.toISOString().split('T')[0];

        // 6. Escuchar cambios de fecha
        fechaInput.addEventListener('change', async function() {
            await cargarHorariosParaFecha(this.value);
        });

        // 7. Verificar si hay parámetro de barbero en URL
        const urlParams = new URLSearchParams(window.location.search);
        const barberoId = urlParams.get('barbero');
        if (barberoId) {
            await seleccionarBarberoPorId(barberoId);
        }

        console.log('✅ Página de reserva lista');

    } catch (error) {
        console.error('❌ Error al inicializar reserva:', error);
        mostrarError('Error al cargar los datos de reserva');
    }
}

// Cargar barberos para selección
async function cargarBarberosParaReserva() {
    const container = document.getElementById('barberos-lista');
    container.innerHTML = '<div class="loading"><i class="fas fa-spinner fa-spin"></i> Cargando barberos...</div>';

    const { data: barberos, error } = await getBarberos();
    
    if (error) {
        container.innerHTML = `<div class="mensaje-error">Error: ${error.message}</div>`;
        return;
    }

    if (!barberos || barberos.length === 0) {
        container.innerHTML = '<p>No hay barberos disponibles en este momento</p>';
        return;
    }

    container.innerHTML = barberos.map(barbero => `
        <div class="item-seleccionable" data-id="${barbero.id}" onclick="seleccionarBarbero('${barbero.id}')">
            <img src="${barbero.foto_url || 'assets/images/default-barber.jpg'}" 
                 alt="${barbero.nombre}"
                 onerror="this.src='assets/images/default-barber.jpg'">
            <h4>${barbero.nombre}</h4>
            <p>${barbero.especialidad || 'Barbero profesional'}</p>
            <p><small>${barbero.descripcion || ''}</small></p>
        </div>
    `).join('');
}

// Cargar servicios para selección
async function cargarServiciosParaReserva() {
    const container = document.getElementById('servicios-lista');
    container.innerHTML = '';

    const { data: servicios, error } = await getServicios();
    
    if (error) {
        console.error('Error cargando servicios:', error);
        return;
    }

    if (!servicios || servicios.length === 0) {
        container.innerHTML = '<p>No hay servicios disponibles</p>';
        return;
    }

    container.innerHTML = servicios.map(servicio => `
        <div class="item-seleccionable" data-id="${servicio.id}" onclick="seleccionarServicio('${servicio.id}')">
            <h4>${servicio.nombre}</h4>
            <p>${servicio.descripcion || ''}</p>
            <div style="margin-top: 10px;">
                <span style="font-size: 1.3rem; font-weight: bold; color: #d4af37;">
                    $${servicio.precio}
                </span>
                <span style="margin-left: 10px; color: #666;">
                    <i class="far fa-clock"></i> ${servicio.duracion_min} min
                </span>
            </div>
        </div>
    `).join('');
}

// Seleccionar barbero
window.seleccionarBarbero = async function(barberoId) {
    try {
        // Obtener datos del barbero
        const { data: barbero, error } = await getBarbero(barberoId);
        if (error) throw error;

        // Actualizar estado
        ReservaState.barberoSeleccionado = barbero;

        // Actualizar UI
        document.querySelectorAll('#barberos-lista .item-seleccionable').forEach(item => {
            if (item.dataset.id === barberoId) {
                item.classList.add('seleccionado');
            } else {
                item.classList.remove('seleccionado');
            }
        });

        // Habilitar botón siguiente
        document.querySelector('#paso-1 .btn-siguiente').disabled = false;

        console.log('✅ Barbero seleccionado:', barbero.nombre);

    } catch (error) {
        console.error('Error seleccionando barbero:', error);
        alert('Error al seleccionar barbero: ' + error.message);
    }
};

// Seleccionar servicio
window.seleccionarServicio = async function(servicioId) {
    const { data: servicios } = await getServicios();
    const servicio = servicios.find(s => s.id === servicioId);
    
    if (!servicio) return;

    ReservaState.servicioSeleccionado = servicio;

    // Actualizar UI
    document.querySelectorAll('#servicios-lista .item-seleccionable').forEach(item => {
        if (item.dataset.id === servicioId) {
            item.classList.add('seleccionado');
        } else {
            item.classList.remove('seleccionado');
        }
    });

    // Habilitar botón siguiente
    document.querySelector('#paso-2 .btn-siguiente').disabled = false;

    console.log('✅ Servicio seleccionado:', servicio.nombre);
};

// Cargar horarios para una fecha específica
async function cargarHorariosParaFecha(fecha) {
    if (!ReservaState.barberoSeleccionado) {
        mostrarError('Primero selecciona un barbero');
        return;
    }

    const container = document.getElementById('horas-container');
    container.innerHTML = '<div class="loading"><i class="fas fa-spinner fa-spin"></i> Cargando horarios...</div>';

    try {
        const { data: horarios, error } = await getHorariosDisponibles(
            ReservaState.barberoSeleccionado.id, 
            fecha
        );

        if (error) throw error;

        ReservaState.horariosDisponibles = horarios || [];
        ReservaState.fechaSeleccionada = fecha;
        ReservaState.horaSeleccionada = null;

        if (!horarios || horarios.length === 0) {
            container.innerHTML = `
                <div class="mensaje-error">
                    <p>No hay horarios disponibles para esta fecha</p>
                    <p>Por favor selecciona otra fecha</p>
                </div>
            `;
            document.querySelector('#paso-3 .btn-siguiente').disabled = true;
            return;
        }

        // Agrupar horarios por hora
        const horariosPorHora = {};
        horarios.forEach(horario => {
            const hora = horario.hora.substring(0, 5);
            if (!horariosPorHora[hora]) {
                horariosPorHora[hora] = [];
            }
            horariosPorHora[hora].push(horario);
        });

        container.innerHTML = `
            <h3>Horarios disponibles para ${formatFecha(fecha)}</h3>
            <div class="horas-grid">
                ${Object.keys(horariosPorHora).map(hora => `
                    <button class="hora-btn disponible" 
                            onclick="seleccionarHora('${hora}')">
                        ${hora}
                    </button>
                `).join('')}
            </div>
        `;

        // Deshabilitar botón hasta seleccionar hora
        document.querySelector('#paso-3 .btn-siguiente').disabled = true;

    } catch (error) {
        console.error('Error cargando horarios:', error);
        container.innerHTML = `
            <div class="mensaje-error">
                Error al cargar horarios: ${error.message}
            </div>
        `;
    }
}

// Seleccionar hora
window.seleccionarHora = function(hora) {
    ReservaState.horaSeleccionada = hora;

    // Actualizar UI
    document.querySelectorAll('.hora-btn').forEach(btn => {
        if (btn.textContent.trim() === hora) {
            btn.classList.add('seleccionado');
        } else {
            btn.classList.remove('seleccionado');
        }
    });

    // Habilitar botón siguiente
    document.querySelector('#paso-3 .btn-siguiente').disabled = false;

    console.log('✅ Hora seleccionada:', hora);
};

// Navegación entre pasos
window.siguientePaso = function() {
    if (ReservaState.pasoActual >= 5) return;

    // Validaciones antes de avanzar
    if (ReservaState.pasoActual === 1 && !ReservaState.barberoSeleccionado) {
        alert('Por favor selecciona un barbero');
        return;
    }
    if (ReservaState.pasoActual === 2 && !ReservaState.servicioSeleccionado) {
        alert('Por favor selecciona un servicio');
        return;
    }
    if (ReservaState.pasoActual === 3 && (!ReservaState.fechaSeleccionada || !ReservaState.horaSeleccionada)) {
        alert('Por favor selecciona fecha y hora');
        return;
    }

    // Si vamos al paso 4, actualizar resumen
    if (ReservaState.pasoActual === 3) {
        actualizarResumenReserva();
    }

    // Cambiar paso
    ReservaState.pasoActual++;
    actualizarPasosUI();
};

window.anteriorPaso = function() {
    if (ReservaState.pasoActual <= 1) return;
    ReservaState.pasoActual--;
    actualizarPasosUI();
};

// Actualizar UI de los pasos
function actualizarPasosUI() {
    // Actualizar indicadores de pasos
    document.querySelectorAll('.paso-item').forEach((item, index) => {
        const pasoNum = index + 1;
        
        item.classList.remove('active', 'completed');
        
        if (pasoNum < ReservaState.pasoActual) {
            item.classList.add('completed');
        } else if (pasoNum === ReservaState.pasoActual) {
            item.classList.add('active');
        }
    });

    // Mostrar/ocultar contenido de pasos
    document.querySelectorAll('.paso-contenido').forEach((contenido, index) => {
        const pasoNum = index + 1;
        if (pasoNum === ReservaState.pasoActual) {
            contenido.classList.add('active');
        } else {
            contenido.classList.remove('active');
        }
    });

    // Scroll al inicio del contenido
    document.querySelector('.reserva-contenido').scrollTop = 0;
}

// Actualizar resumen de reserva
function actualizarResumenReserva() {
    const container = document.getElementById('resumen-reserva');
    
    const total = ReservaState.servicioSeleccionado ? 
        ReservaState.servicioSeleccionado.precio : 0;
    
    container.innerHTML = `
        <div class="resumen-item">
            <span>Barbero:</span>
            <span>${ReservaState.barberoSeleccionado.nombre}</span>
        </div>
        <div class="resumen-item">
            <span>Servicio:</span>
            <span>${ReservaState.servicioSeleccionado.nombre}</span>
        </div>
        <div class="resumen-item">
            <span>Duración:</span>
            <span>${ReservaState.servicioSeleccionado.duracion_min} minutos</span>
        </div>
        <div class="resumen-item">
            <span>Fecha:</span>
            <span>${formatFecha(ReservaState.fechaSeleccionada)}</span>
        </div>
        <div class="resumen-item">
            <span>Hora:</span>
            <span>${ReservaState.horaSeleccionada}</span>
        </div>
        <div class="resumen-item" style="border-top: 2px solid #ddd; padding-top: 15px;">
            <span><strong>Total:</strong></span>
            <span><strong>$${total}</strong></span>
        </div>
    `;
}

// Confirmar reserva
window.confirmarReserva = async function() {
    const nombre = document.getElementById('nombre-cliente').value.trim();
    const telefono = document.getElementById('telefono-cliente').value.trim();
    const notas = document.getElementById('notas-cliente').value.trim();

    // Validar datos
    if (!nombre || !telefono) {
        alert('Por favor ingresa tu nombre y teléfono');
        return;
    }

    if (!ReservaState.barberoSeleccionado || !ReservaState.servicioSeleccionado || 
        !ReservaState.fechaSeleccionada || !ReservaState.horaSeleccionada) {
        alert('Faltan datos de la reserva. Por favor completa todos los pasos.');
        return;
    }

    // Mostrar loading
    const btnConfirmar = document.getElementById('btn-confirmar');
    const originalText = btnConfirmar.innerHTML;
    btnConfirmar.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Procesando...';
    btnConfirmar.disabled = true;

    try {
        // Registrar cliente (si no existe o datos diferentes)
        let cliente = ReservaState.cliente;
        if (!cliente || cliente.nombre !== nombre || cliente.telefono !== telefono) {
            const registro = await registrarCliente(nombre, telefono);
            if (!registro.success) {
                throw new Error(registro.error);
            }
            cliente = registro.cliente;
            ReservaState.cliente = cliente;
        }

        // Crear turno
        const turnoData = {
            cliente_id: cliente.id,
            barbero_id: ReservaState.barberoSeleccionado.id,
            servicio_id: ReservaState.servicioSeleccionado.id,
            fecha: ReservaState.fechaSeleccionada,
            hora: ReservaState.horaSeleccionada + ':00', // Formato completo HH:MM:SS
            estado: 'pendiente',
            notas: notas || ''
        };

        const { data: turno, error } = await crearTurno(turnoData);
        
        if (error) throw error;

        // Mostrar mensaje de éxito
        ReservaState.pasoActual = 5;
        actualizarPasosUI();

        document.getElementById('mensaje-exito').innerHTML = `
            <div style="text-align: center; padding: 40px;">
                <div style="font-size: 4rem; color: #28a745; margin-bottom: 20px;">
                    <i class="fas fa-check-circle"></i>
                </div>
                <h2 style="color: #28a745;">¡Reserva Confirmada!</h2>
                <p style="font-size: 1.2rem; margin: 20px 0;">
                    Tu turno ha sido agendado exitosamente
                </p>
                <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 30px 0; text-align: left;">
                    <h3>Detalles de tu reserva:</h3>
                    <p><strong>Código:</strong> ${turno.id.substring(0, 8).toUpperCase()}</p>
                    <p><strong>Barbero:</strong> ${ReservaState.barberoSeleccionado.nombre}</p>
                    <p><strong>Servicio:</strong> ${ReservaState.servicioSeleccionado.nombre}</p>
                    <p><strong>Fecha:</strong> ${formatFecha(ReservaState.fechaSeleccionada)}</p>
                    <p><strong>Hora:</strong> ${ReservaState.horaSeleccionada}</p>
                    <p><strong>Estado:</strong> Pendiente de confirmación</p>
                </div>
                <p style="color: #666;">
                    <i class="fas fa-info-circle"></i> 
                    Te llamaremos al ${telefono} para confirmar tu turno.
                </p>
            </div>
        `;

        console.log('✅ Turno creado exitosamente:', turno);

    } catch (error) {
        console.error('❌ Error confirmando reserva:', error);
        
        // Restaurar botón
        btnConfirmar.innerHTML = originalText;
        btnConfirmar.disabled = false;
        
        // Mostrar error
        alert(`Error al confirmar reserva: ${error.message}\n\nPor favor intenta de nuevo.`);
    }
};

// Seleccionar barbero por ID (desde URL)
async function seleccionarBarberoPorId(barberoId) {
    try {
        const { data: barbero, error } = await getBarbero(barberoId);
        if (error) throw error;

        await seleccionarBarbero(barberoId);
        
        // Avanzar automáticamente al siguiente paso después de un delay
        setTimeout(() => {
            siguientePaso();
        }, 500);

    } catch (error) {
        console.error('Error cargando barbero desde URL:', error);
    }
}

// Mostrar error
function mostrarError(mensaje) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'mensaje-error';
    errorDiv.innerHTML = `
        <div style="margin: 20px; text-align: center;">
            <i class="fas fa-exclamation-triangle"></i> ${mensaje}
        </div>
    `;
    
    document.querySelector('.reserva-contenido').prepend(errorDiv);
}

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', inicializarReserva);

// Exportar funciones necesarias
window.ReservaManager = {
    state: ReservaState,
    siguientePaso,
    anteriorPaso,
    seleccionarBarbero: window.seleccionarBarbero,
    seleccionarServicio: window.seleccionarServicio,
    seleccionarHora: window.seleccionarHora,
    confirmarReserva: window.confirmarReserva
};