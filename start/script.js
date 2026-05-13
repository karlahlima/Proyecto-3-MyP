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

document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });
