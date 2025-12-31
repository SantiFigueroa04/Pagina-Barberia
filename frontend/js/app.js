// Archivo principal de la aplicación
document.addEventListener('DOMContentLoaded', function() {
  console.log('🚀 Aplicación iniciada');
  
  // Probar conexión al cargar
  probarConexionInicial();
  
  // Cargar datos si estamos en la página principal
  if (document.getElementById('barberos-container')) {
    cargarBarberos();
    cargarServicios();
  }
  
  // Configurar botones si existen
  configurarBotones();
});

// 1. Probar conexión con Supabase
async function probarConexionInicial() {
  const conexionExitosa = await window.supabaseClient.probarConexion();
  
  if (conexionExitosa) {
    console.log('🌐 Conectado a Supabase correctamente');
  } else {
    console.error('❌ No se pudo conectar a Supabase');
    alert('Error de conexión con la base de datos');
  }
}

// 2. Cargar barberos y mostrarlos
async function cargarBarberos() {
  const container = document.getElementById('barberos-container');
  if (!container) return;
  
  container.innerHTML = '<p>Cargando barberos...</p>';
  
  const barberos = await window.supabaseClient.obtenerBarberos();
  
  if (barberos.length === 0) {
    container.innerHTML = '<p>No hay barberos disponibles</p>';
    return;
  }
  
  container.innerHTML = barberos.map(barbero => `
    <div class="barbero-card">
      <h3>${barbero.nombre}</h3>
      <p>${barbero.especialidad || 'Barbero profesional'}</p>
      <button onclick="seleccionarBarbero('${barbero.id}')">
        Seleccionar
      </button>
    </div>
  `).join('');
}

// 3. Cargar servicios
async function cargarServicios() {
  const container = document.getElementById('servicios-container');
  if (!container) return;
  
  const servicios = await window.supabaseClient.obtenerServicios();
  
  if (servicios.length === 0) {
    container.innerHTML = '<p>No hay servicios disponibles</p>';
    return;
  }
  
  container.innerHTML = servicios.map(servicio => `
    <div class="servicio-card">
      <h4>${servicio.nombre}</h4>
      <p>${servicio.descripcion || ''}</p>
      <p>Precio: $${servicio.precio}</p>
      <p>Duración: ${servicio.duracion_min} min</p>
      <button onclick="seleccionarServicio('${servicio.id}')">
        Seleccionar
      </button>
    </div>
  `).join('');
}

// 4. Configurar botones básicos
function configurarBotones() {
  // Botón de login
  const loginBtn = document.getElementById('login-btn');
  if (loginBtn) {
    loginBtn.addEventListener('click', async function() {
      const email = document.getElementById('email').value;
      const password = document.getElementById('password').value;
      
      const resultado = await window.supabaseClient.iniciarSesion(email, password);
      
      if (resultado.success) {
        alert('✅ Login exitoso');
        window.location.href = 'panel.html';
      } else {
        alert('❌ Error: ' + resultado.error);
      }
    });
  }
  
  // Botón de registro
  const registerBtn = document.getElementById('register-btn');
  if (registerBtn) {
    registerBtn.addEventListener('click', async function() {
      const nombre = document.getElementById('nombre').value;
      const email = document.getElementById('email').value;
      const telefono = document.getElementById('telefono').value;
      const password = document.getElementById('password').value;
      
      const resultado = await window.supabaseClient.registrarUsuario(
        email, password, nombre, telefono
      );
      
      if (resultado.success) {
        alert('✅ Registro exitoso. Revisa tu email.');
      } else {
        alert('❌ Error: ' + resultado.error);
      }
    });
  }
}

// 5. Funciones para seleccionar (ejemplos)
function seleccionarBarbero(barberoId) {
  console.log('Barbero seleccionado:', barberoId);
  // Aquí guardarías en una variable global o localStorage
  localStorage.setItem('barberoSeleccionado', barberoId);
  alert('Barbero seleccionado');
}

function seleccionarServicio(servicioId) {
  console.log('Servicio seleccionado:', servicioId);
  localStorage.setItem('servicioSeleccionado', servicioId);
  alert('Servicio seleccionado');
}