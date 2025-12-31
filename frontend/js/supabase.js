// Cliente Supabase para sistema de barbería específica

let supabaseClient = null;

// Inicializar
export function initSupabase() {
    if (!supabaseClient && window.supabase && window.SUPABASE_CONFIG) {
        supabaseClient = window.supabase.createClient(
            window.SUPABASE_CONFIG.URL,
            window.SUPABASE_CONFIG.KEY
        );
        console.log('✅ Cliente Supabase inicializado');
    }
    return supabaseClient;
}

export function getSupabase() {
    if (!supabaseClient) return initSupabase();
    return supabaseClient;
}

// ========== CLIENTES ==========

export async function registrarCliente(nombre, telefono) {
    try {
        const supabase = getSupabase();
        
        const { data, error } = await supabase
            .from('clientes')
            .insert([
                {
                    nombre: nombre,
                    telefono: telefono
                }
            ])
            .select()
            .single();
        
        if (error) throw error;
        
        // Guardar en localStorage
        localStorage.setItem('cliente_id', data.id);
        localStorage.setItem('cliente_nombre', data.nombre);
        localStorage.setItem('cliente_telefono', data.telefono);
        
        return { success: true, cliente: data };
        
    } catch (error) {
        console.error('Error registrando cliente:', error);
        return { success: false, error: error.message };
    }
}

export function getCurrentCliente() {
    const id = localStorage.getItem('cliente_id');
    const nombre = localStorage.getItem('cliente_nombre');
    const telefono = localStorage.getItem('cliente_telefono');
    
    if (!id || !nombre || !telefono) return null;
    
    return { id, nombre, telefono };
}

export function clearCliente() {
    localStorage.removeItem('cliente_id');
    localStorage.removeItem('cliente_nombre');
    localStorage.removeItem('cliente_telefono');
}

// ========== BARBEROS ==========

export async function getBarberos() {
    try {
        const supabase = getSupabase();
        const { data, error } = await supabase
            .from('barberos')
            .select('*')
            .eq('activo', true)
            .order('nombre');
        
        return { data, error };
    } catch (error) {
        console.error('Error obteniendo barberos:', error);
        return { data: null, error: error.message };
    }
}

export async function getBarbero(id) {
    try {
        const supabase = getSupabase();
        const { data, error } = await supabase
            .from('barberos')
            .select('*')
            .eq('id', id)
            .single();
        
        return { data, error };
    } catch (error) {
        return { data: null, error: error.message };
    }
}

// ========== SERVICIOS ==========

export async function getServicios() {
    try {
        const supabase = getSupabase();
        const { data, error } = await supabase
            .from('servicios')
            .select('*')
            .eq('activo', true)
            .order('precio');
        
        return { data, error };
    } catch (error) {
        console.error('Error obteniendo servicios:', error);
        return { data: null, error: error.message };
    }
}

// ========== HORARIOS ==========

export async function getHorariosDisponibles(barberoId, fecha) {
    try {
        const supabase = getSupabase();
        const { data, error } = await supabase
            .from('horarios_disponibles')
            .select('*')
            .eq('barbero_id', barberoId)
            .eq('fecha', fecha)
            .eq('disponible', true)
            .order('hora');
        
        return { data, error };
    } catch (error) {
        return { data: null, error: error.message };
    }
}

// ========== TURNOS ==========

export async function crearTurno(turnoData) {
    try {
        const supabase = getSupabase();
        const { data, error } = await supabase
            .from('turnos')
            .insert([turnoData])
            .select()
            .single();
        
        return { data, error };
    } catch (error) {
        console.error('Error creando turno:', error);
        return { data: null, error: error.message };
    }
}

export async function getTurnosCliente(clienteId) {
    try {
        const supabase = getSupabase();
        const { data, error } = await supabase
            .from('turnos')
            .select(`
                *,
                barberos:barbero_id (nombre, especialidad),
                servicios:servicio_id (nombre, precio)
            `)
            .eq('cliente_id', clienteId)
            .order('fecha', { ascending: false })
            .order('hora', { ascending: false });
        
        return { data, error };
    } catch (error) {
        return { data: null, error: error.message };
    }
}

export async function cancelarTurno(turnoId) {
    try {
        const supabase = getSupabase();
        const { data, error } = await supabase
            .from('turnos')
            .update({ estado: 'cancelado' })
            .eq('id', turnoId)
            .select()
            .single();
        
        return { data, error };
    } catch (error) {
        return { data: null, error: error.message };
    }
}

// ========== BARBERO AUTH ==========

export async function loginBarbero(email, password) {
    try {
        const supabase = getSupabase();
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password
        });
        
        if (error) throw error;
        
        return { success: true, user: data.user, session: data.session };
        
    } catch (error) {
        return { success: false, error: error.message };
    }
}

export async function getTurnosBarbero(barberoId, fecha = null) {
    try {
        const supabase = getSupabase();
        
        let query = supabase
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
        
        return { data, error };
    } catch (error) {
        return { data: null, error: error.message };
    }
}

export async function cambiarEstadoTurno(turnoId, nuevoEstado) {
    try {
        const supabase = getSupabase();
        const { data, error } = await supabase
            .from('turnos')
            .update({ estado: nuevoEstado })
            .eq('id', turnoId)
            .select()
            .single();
        
        return { data, error };
    } catch (error) {
        return { data: null, error: error.message };
    }
}

// ========== UTILIDADES ==========

export async function testConnection() {
    try {
        const supabase = getSupabase();
        const { data, error } = await supabase
            .from('servicios')
            .select('*')
            .limit(1);
        
        if (error) {
            return { success: false, error: error.message };
        }
        
        return {
            success: true,
            message: 'Conectado a Supabase',
            url: window.SUPABASE_CONFIG.URL
        };
        
    } catch (error) {
        return { success: false, error: error.message };
    }
}

// Helper para formatear fechas
export function formatFecha(fechaStr) {
    const fecha = new Date(fechaStr + 'T00:00:00');
    return fecha.toLocaleDateString('es-ES', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    }).replace(/^\w/, c => c.toUpperCase());
}

// Helper para formatear hora
export function formatHora(horaStr) {
    return horaStr.substring(0, 5);
}