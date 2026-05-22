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

    // Login y registro están renderizados como forms; activamos el panel correcto.
    const panelId = t === 'register' ? 'registerForm' : 'loginForm';
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

if (loginForm) {
  loginForm.addEventListener('submit', async (event) => {
    event.preventDefault(); // intercepta el submit de login

    const identifier = document.getElementById('loginEmailOrUsername').value.trim();
    const password = document.getElementById('loginPassword').value;

    const loginMessage = document.getElementById('loginMessage');
    if (loginMessage) { loginMessage.textContent = ''; loginMessage.style.color = '#042463'; }

    try {
      const response = await fetch('/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ identifier, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (loginMessage) {
          loginMessage.textContent = data.message || 'No se pudo iniciar sesión.';
          loginMessage.style.color = '#ff3039';
        }
        return;
      }

      loginForm.reset();
      // Redirigir a dashboard o manejar sesión
      window.location.href = '/login-dashboard.html';

    } catch (error) {
      if (loginMessage) {
        loginMessage.textContent = 'Error de red. Intenta otra vez.';
        loginMessage.style.color = '#ff3039';
      }
    }
  });
}
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });
