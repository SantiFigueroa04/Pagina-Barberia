// app.js - SOLO LÓGICA, SIN ESTILOS
document.addEventListener('DOMContentLoaded', function() {
  console.log('🚀 Barbería Jaque - Cargando...');
  
  // Inicializar Supabase
  const supabase = inicializarSupabase();
  if (!supabase) return;
  
  // Cargar contenido según la página
  if (document.getElementById('barberos-container')) {
    cargarBarberos(supabase);
  }
  
  if (document.getElementById('servicios-container')) {
    cargarServicios(supabase);
  }
});

// FUNCIONES PRINCIPALES
function inicializarSupabase() {
  try {
    const url = 'https://qpwmoczbsjtdanakzpqz.supabase.co';
    const key = 'sb_publishable_l3RMYjthRrUqeMuHosdPMw_n9Wo7d-c';
    return window.supabase.createClient(url, key);
  } catch (error) {
    console.error('❌ Error Supabase:', error);
    return null;
  }
}

async function cargarBarberos(supabase) {
  const container = document.getElementById('barberos-container');
  if (!container) return;
  
  mostrarEstado(container, 'cargando', 'Cargando barberos...');
  
  try {
    const { data: barberos, error } = await supabase
      .from('barberos')
      .select('*');
    
    if (error) throw error;
    
    console.log('✅ Barberos:', barberos);
    
    if (!barberos?.length) {
      mostrarEstado(container, 'vacio', 'No hay barberos disponibles');
      return;
    }
    
    container.innerHTML = barberos.map(crearBarberoHTML).join('');
    
  } catch (error) {
    console.error('❌ Error:', error);
    mostrarEstado(container, 'error', 'Error al cargar');
  }
}

async function cargarServicios(supabase) {
  const container = document.getElementById('servicios-container');
  if (!container) return;
  
  try {
    const { data: servicios, error } = await supabase
      .from('servicios')
      .select('*');
    
    if (error) throw error;
    
    if (servicios?.length) {
      container.innerHTML = servicios.map(crearServicioHTML).join('');
    }
  } catch (error) {
    console.error('Error servicios:', error);
  }
}

// FUNCIONES DE CREACIÓN DE HTML
function crearBarberoHTML(barbero) {
  const nombre = barbero.nombre || barbero.name || 'Barbero';
  const especialidad = barbero.especialidad || 'Especialista';
  const foto = barbero.foto_url || `https://ui-avatars.com/api/?name=${nombre}&background=333&color=fff`;
  const valoracion = barbero.valoracion || 5;
  
  return `
    <div class="barbero-card">
      <img src="${foto}" alt="${nombre}" class="barbero-foto">
      <h3>${nombre}</h3>
      <p class="especialidad">${especialidad}</p>
      <div class="estrellas">${'★'.repeat(valoracion)}${'☆'.repeat(5 - valoracion)}</div>
      <button class="btn-reservar" onclick="reservarBarbero('${barbero.id}', '${nombre}')">
        Reservar
      </button>
    </div>
  `;
}

function crearServicioHTML(servicio) {
  return `
    <div class="servicio-card">
      <i class="${servicio.icono || 'fas fa-cut'}"></i>
      <h4>${servicio.nombre}</h4>
      <p>${servicio.descripcion || ''}</p>
      <div class="precio">$${servicio.precio}</div>
      <div class="duracion">${servicio.duracion || 30} min</div>
    </div>
  `;
}

// FUNCIONES UTILITARIAS
function mostrarEstado(container, tipo, mensaje) {
  const iconos = {
    cargando: 'fa-spinner fa-spin',
    vacio: 'fa-info-circle',
    error: 'fa-exclamation-triangle'
  };
  
  container.innerHTML = `
    <div class="estado estado-${tipo}">
      <i class="fas ${iconos[tipo]}"></i>
      <span>${mensaje}</span>
    </div>
  `;
}

// FUNCIONES GLOBALES
window.reservarBarbero = function(id, nombre) {
  localStorage.setItem('barberoSeleccionado', id);
  window.location.href = 'reservar.html';
};