// supabase-client.js - Cliente completo para sistema de barbería
import { createClient } from '@supabase/supabase-js';
import { CONFIG } from './config.js';

let supabase = null;

// ========== INICIALIZACIÓN ==========
export function initSupabase() {
    if (!supabase) {
        supabase = createClient(CONFIG.SUPABASE.URL, CONFIG.SUPABASE.KEY);
        console.log('🚀 Supabase inicializado con:', CONFIG.SUPABASE.URL);
    }
    return supabase;
}

export function getSupabase() {
    if (!supabase) return initSupabase();
    return supabase;
}

// ========== TEST CONEXIÓN ==========
export async function testConnection() {
    try {
        const client = getSupabase();
        const { data, error } = await client
            .from('servicios')
            .select('*')
            .limit(1);
        
        if (error) {
            console.error('❌ Error de conexión:', error);
            return { success: false, error: error.message };
        }
        
        console.log('✅ Conectado a Supabase. Datos:', data);
        return { success: true, message: 'Conectado a Supabase', data };
    } catch (error) {
        console.error('❌ Error inesperado:', error);
        return { success: false, error: error.message };
    }
}

// ========== CLIENTES ==========
export async function registrarCliente(nombre, telefono) {
    try {
        const client = getSupabase();
        
        // Primero verificar si ya existe
        const { data: clienteExistente, error: errorBusqueda } = await client
            .from('clientes')
            .select('*')
            .eq('telefono', telefono)
            .single();
        
        // Si existe, retornarlo
        if (clienteExistente && !errorBusqueda) {
            console.log('✅ Cliente ya existe:', clienteExistente);
            
            // Guardar en localStorage
            localStorage.setItem('cliente_id', clienteExistente.id);
            localStorage.setItem('cliente_nombre', clienteExistente.nombre);
            localStorage.setItem('cliente_telefono', clienteExistente.telefono);
            
            return { success: true, cliente: clienteExistente, mensaje: 'Cliente existente' };
        }
        
        // Si no existe, crear nuevo
        const { data, error } = await client
            .from('clientes')
            .insert([{ 
                nombre: nombre.trim(), 
                telefono: telefono.trim() 
            }])
            .select()
            .single();
        
        if (error) {
            console.error('❌ Error registrando cliente:', error);
            return { success: false, error: error.message };
        }
        
        // Guardar en localStorage
        localStorage.setItem('cliente_id', data.id);
        localStorage.setItem('cliente_nombre', data.nombre);
        localStorage.setItem('cliente_telefono', data.telefono);
        
        console.log('✅ Cliente registrado:', data);
        return { success: true, cliente: data };
        
    } catch (error) {
        console.error('❌ Error inesperado:', error);
        return { success: false, error: error.message };
    }
}

export function getCurrentCliente() {
    try {
        const id = localStorage.getItem('cliente_id');
        const nombre = localStorage.getItem('cliente_nombre');
        const telefono = localStorage.getItem('cliente_telefono');
        
        if (!id || !nombre || !telefono) {
            return null;
        }
        
        return { id, nombre, telefono };
    } catch (error) {
        console.error('Error obteniendo cliente:', error);
        return null;
    }
}

export function clearCliente() {
    try {
        localStorage.removeItem('cliente_id');
        localStorage.removeItem('cliente_nombre');
        localStorage.removeItem('cliente_telefono');
        console.log('✅ Sesión de cliente limpiada');
    } catch (error) {
        console.error('Error limpiando cliente:', error);
    }
}

// ========== BARBEROS ==========
export async function getBarberos() {
    try {
        const client = getSupabase();
        const { data, error } = await client
            .from('barberos')
            .select('*')
            .eq('activo', true)
            .order('nombre');
        
        if (error) {
            console.error('❌ Error obteniendo barberos:', error);
            return { data: null, error: error.message };
        }
        
        console.log(`✅ Barberos obtenidos: ${data?.length || 0}`);
        return { data: data || [], error: null };
    } catch (error) {
        console.error('❌ Error inesperado:', error);
        return { data: null, error: error.message };
    }
}

export async function getBarbero(id) {
    try {
        const client = getSupabase();
        const { data, error } = await client
            .from('barberos')
            .select('*')
            .eq('id', id)
            .single();
        
        if (error) {
            console.error(`❌ Error obteniendo barbero ${id}:`, error);
            return { data: null, error: error.message };
        }
        
        return { data, error: null };
    } catch (error) {
        console.error('❌ Error inesperado:', error);
        return { data: null, error: error.message };
    }
}

// ========== SERVICIOS ==========
export async function getServicios() {
    try {
        const client = getSupabase();
        const { data, error } = await client
            .from('servicios')
            .select('*')
            .eq('activo', true)
            .order('precio');
        
        if (error) {
            console.error('❌ Error obteniendo servicios:', error);
            return { data: null, error: error.message };
        }
        
        console.log(`✅ Servicios obtenidos: ${data?.length || 0}`);
        return { data: data || [], error: null };
    } catch (error) {
        console.error('❌ Error inesperado:', error);
        return { data: null, error: error.message };
    }
}

// ========== HORARIOS ==========
export async function getHorariosDisponibles(barberoId, fecha) {
    try {
        const client = getSupabase();
        const { data, error } = await client
            .from('horarios_disponibles')
            .select('*')
            .eq('barbero_id', barberoId)
            .eq('fecha', fecha)
            .eq('disponible', true)
            .order('hora');
        
        if (error) {
            console.error(`❌ Error obteniendo horarios para barbero ${barberoId}:`, error);
            return { data: null, error: error.message };
        }
        
        console.log(`✅ Horarios obtenidos: ${data?.length || 0}`);
        return { data: data || [], error: null };
    } catch (error) {
        console.error('❌ Error inesperado:', error);
        return { data: null, error: error.message };
    }
}

// ========== TURNOS ==========
export async function crearTurno(turnoData) {
    try {
        const client = getSupabase();
        
        console.log('📝 Creando turno con datos:', turnoData);
        
        const { data, error } = await client
            .from('turnos')
            .insert([{
                cliente_id: turnoData.cliente_id,
                barbero_id: turnoData.barbero_id,
                servicio_id: turnoData.servicio_id,
                fecha: turnoData.fecha,
                hora: turnoData.hora,
                estado: turnoData.estado || 'pendiente',
                notas: turnoData.notas || '',
                creado_en: new Date().toISOString()
            }])
            .select()
            .single();
        
        if (error) {
            console.error('❌ Error creando turno:', error);
            return { data: null, error: error.message };
        }
        
        console.log('✅ Turno creado exitosamente:', data);
        return { data, error: null };
    } catch (error) {
        console.error('❌ Error inesperado:', error);
        return { data: null, error: error.message };
    }
}

export async function getTurnosCliente(clienteId = null) {
    try {
        const client = getSupabase();
        
        // Si no se pasa clienteId, obtener del localStorage
        const cliente = clienteId || getCurrentCliente();
        if (!cliente) {
            return { data: [], error: 'No hay cliente autenticado' };
        }
        
        const id = cliente.id || cliente;
        
        const { data, error } = await client
            .from('turnos')
            .select(`
                *,
                barberos:barbero_id (nombre, especialidad, foto_url),
                servicios:servicio_id (nombre, precio, duracion_min)
            `)
            .eq('cliente_id', id)
            .order('fecha', { ascending: false })
            .order('hora', { ascending: false });
        
        if (error) {
            console.error(`❌ Error obteniendo turnos para cliente ${id}:`, error);
            return { data: null, error: error.message };
        }
        
        console.log(`✅ Turnos obtenidos: ${data?.length || 0}`);
        return { data: data || [], error: null };
    } catch (error) {
        console.error('❌ Error inesperado:', error);
        return { data: null, error: error.message };
    }
}

export async function getTurnosBarbero(barberoId, fecha = null) {
    try {
        const client = getSupabase();
        
        let query = client
            .from('turnos')
            .select(`
                *,
                clientes:cliente_id (nombre, telefono),
                servicios:servicio_id (nombre, precio, duracion_min)
            `)
            .eq('barbero_id', barberoId);
        
        if (fecha) {
            query = query.eq('fecha', fecha);
        }
        
        const { data, error } = await query
            .order('fecha', { ascending: true })
            .order('hora', { ascending: true });
        
        if (error) {
            console.error(`❌ Error obteniendo turnos para barbero ${barberoId}:`, error);
            return { data: null, error: error.message };
        }
        
        return { data: data || [], error: null };
    } catch (error) {
        console.error('❌ Error inesperado:', error);
        return { data: null, error: error.message };
    }
}

export async function cambiarEstadoTurno(turnoId, nuevoEstado) {
    try {
        const client = getSupabase();
        
        console.log(`🔄 Cambiando estado del turno ${turnoId} a ${nuevoEstado}`);
        
        const { data, error } = await client
            .from('turnos')
            .update({ 
                estado: nuevoEstado,
                actualizado_en: new Date().toISOString()
            })
            .eq('id', turnoId)
            .select()
            .single();
        
        if (error) {
            console.error(`❌ Error cambiando estado del turno ${turnoId}:`, error);
            return { data: null, error: error.message };
        }
        
        console.log('✅ Estado cambiado exitosamente:', data);
        return { data, error: null };
    } catch (error) {
        console.error('❌ Error inesperado:', error);
        return { data: null, error: error.message };
    }
}

export async function cancelarTurno(turnoId) {
    return cambiarEstadoTurno(turnoId, 'cancelado');
}

// ========== AUTH BARBERO ==========
export async function loginBarbero(email, password) {
    try {
        const client = getSupabase();
        
        console.log(`🔐 Intentando login para: ${email}`);
        
        const { data, error } = await client.auth.signInWithPassword({
            email: email.trim(),
            password: password.trim()
        });
        
        if (error) {
            console.error('❌ Error en login:', error);
            return { success: false, error: error.message };
        }
        
        console.log('✅ Login exitoso:', data.user.email);
        
        // Guardar sesión en localStorage
        localStorage.setItem('barbero_session', JSON.stringify({
            user: data.user,
            session: data.session,
            timestamp: new Date().toISOString()
        }));
        
        return { 
            success: true, 
            user: data.user, 
            session: data.session 
        };
        
    } catch (error) {
        console.error('❌ Error inesperado:', error);
        return { success: false, error: error.message };
    }
}

export async function logoutBarbero() {
    try {
        const client = getSupabase();
        const { error } = await client.auth.signOut();
        
        // Limpiar localStorage
        localStorage.removeItem('barbero_session');
        
        if (error) {
            console.error('❌ Error en logout:', error);
            return { success: false, error: error.message };
        }
        
        console.log('✅ Logout exitoso');
        return { success: true };
    } catch (error) {
        console.error('❌ Error inesperado:', error);
        return { success: false, error: error.message };
    }
}

export function getCurrentBarbero() {
    try {
        const sessionData = localStorage.getItem('barbero_session');
        if (!sessionData) return null;
        
        const session = JSON.parse(sessionData);
        
        // Verificar si la sesión no ha expirado (24 horas)
        const timestamp = new Date(session.timestamp);
        const now = new Date();
        const diffHours = (now - timestamp) / (1000 * 60 * 60);
        
        if (diffHours > 24) {
            console.log('⚠️ Sesión expirada');
            localStorage.removeItem('barbero_session');
            return null;
        }
        
        return session.user;
    } catch (error) {
        console.error('Error obteniendo barbero:', error);
        localStorage.removeItem('barbero_session');
        return null;
    }
}

// ========== UTILIDADES ==========
export function formatFecha(fechaStr) {
    try {
        const fecha = new Date(fechaStr + 'T00:00:00');
        if (isNaN(fecha.getTime())) {
            return fechaStr;
        }
        return fecha.toLocaleDateString('es-ES', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        }).replace(/^\w/, c => c.toUpperCase());
    } catch (error) {
        console.error('Error formateando fecha:', error);
        return fechaStr;
    }
}

export function formatHora(horaStr) {
    try {
        if (!horaStr) return '--:--';
        return horaStr.substring(0, 5);
    } catch (error) {
        console.error('Error formateando hora:', error);
        return horaStr;
    }
}

export function formatMoneda(monto) {
    try {
        return new Intl.NumberFormat('es-AR', {
            style: 'currency',
            currency: 'ARS',
            minimumFractionDigits: 2
        }).format(monto || 0);
    } catch (error) {
        console.error('Error formateando moneda:', error);
        return `$${monto || 0}`;
    }
}

// ========== EXPORTACIÓN POR DEFECTO ==========
export default {
    initSupabase,
    getSupabase,
    testConnection,
    
    // Clientes
    registrarCliente,
    getCurrentCliente,
    clearCliente,
    
    // Barberos
    getBarberos,
    getBarbero,
    
    // Servicios
    getServicios,
    
    // Horarios
    getHorariosDisponibles,
    
    // Turnos
    crearTurno,
    getTurnosCliente,
    getTurnosBarbero,
    cambiarEstadoTurno,
    cancelarTurno,
    
    // Auth
    loginBarbero,
    logoutBarbero,
    getCurrentBarbero,
    
    // Utilidades
    formatFecha,
    formatHora,
    formatMoneda
};

