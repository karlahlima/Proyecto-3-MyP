function openModal(tab) {
  document.getElementById('authModal').classList.add('open'); // HTML id="authModal"
  switchTab(tab);
  document.body.style.overflow = 'hidden';
}

function closeModal() {
  document.getElementById('authModal').classList.remove('open');
  document.body.style.overflow = '';
}

function switchTab(tab) {
  ['login','register'].forEach(t => {
    const tabElem = document.getElementById('tab-' + t);
    if (tabElem) tabElem.classList.toggle('active', t === tab);

    // Manejo del id="registerForm" mediante el id="tab-register" del boton Registrarse.
    const panelId = t === 'register' ? 'registerForm' : 'panel-' + t;
    const panelElem = document.getElementById(panelId);
    if (panelElem) panelElem.classList.toggle('active', t === tab);
  });
}

const registerForm = document.getElementById('registerForm');
const registerMessage = document.getElementById('registerMessage');
const loginForm = document.getElementById('loginForm');

function showRegisterMessage(message, isError = false) {
  if (!registerMessage) return;
  registerMessage.textContent = message; // Mensaje de respuesta a intento de registro
  registerMessage.style.color = isError ? '#ff3039' : '#042463';
}

if (registerForm) {
  registerForm.addEventListener('submit', async (event) => {
    event.preventDefault(); // intercepta el submit de registro

    const name = document.getElementById('registerName').value.trim();
    const email = document.getElementById('registerEmail').value.trim();
    const username = document.getElementById('registerUsername').value.trim();
    const age = document.getElementById('registerAge').value;
    const password = document.getElementById('registerPassword').value;

    showRegisterMessage('');

    try {
      const response = await fetch('/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, email, username, age, password }),
      }); //JSON con los campos de registro.

      const data = await response.json(); // convierte la respuetsa json a objeto JS.

      if (!response.ok) {
        showRegisterMessage(data.message || 'No se pudo registrar el usuario.', true);
        return;
      }

      registerForm.reset();
      showRegisterMessage(data.message || 'Usuario registrado correctamente.');
    } catch (error) {
      showRegisterMessage('Error de red. Intenta otra vez.', true);
    }
  });
}

if(loginForm) {
  loginForm.addEventlistener('submit', async(event) => {
    event.preventdefaul(); // intercepta el submit de login

    const emailOrUsername = document.getElementById('loginEmailOrUsername').value.trim();
    const password = document.getElementById('loginPassword').value;

    try {
      const response = await fetch('/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({emailOrUsername, password}),
      });

      const data = await response.json();

      if (!response.ok) {
        showRegisterMessage(data.message || 'No se pudo registrar el usuario.', true); //TODO cambiar showRegisterMessage por un showErrorLogin y agregarlo al HTML
        return;
      }

      loginForm.reset();

      if(data.success) {
        window.location.href = '/dashboard'; //TODO Crear la pagina de dashboard para redirigir una vez el LOGIN es exitoso.
      }
      // Probablemente agregar un mensaje de error.
      
    }catch (error) {
      showRegisterMessage('Error de red. Intenta otra vez.', true); //TODO cambiar showRegisterMessage por un showErrorLogin y agregarlo al HTML
    }
    
  });
}
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });
