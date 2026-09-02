/**
 * Module de gestion de l'authentification et du profil utilisateur
 */

const PALETTE = [
  '#3B82F6', // Bleu
  '#10B981', // Émeraude
  '#F59E0B', // Ambre
  '#EF4444', // Rouge
  '#8B5CF6', // Violet
  '#EC4899', // Rose
  '#06B6D4', // Cyan
  '#84CC16', // Citron vert
  '#F97316', // Orange
  '#6366F1', // Indigo
];

let currentUser = null;
let selectedRegColor = PALETTE[0];

const Auth = {
  init() {
    this.renderColorPalettes();
    this.setupEventListeners();
    this.checkSession();
  },

  renderColorPalettes() {
    // Palette pour l'inscription
    const regPaletteEl = document.getElementById('registerColorPalette');
    if (regPaletteEl) {
      regPaletteEl.innerHTML = PALETTE.map((c, i) => `
        <div class="color-option ${i === 0 ? 'selected' : ''}" style="background-color: ${c}" data-color="${c}"></div>
      `).join('');

      regPaletteEl.addEventListener('click', (e) => {
        const option = e.target.closest('.color-option');
        if (!option) return;
        regPaletteEl.querySelectorAll('.color-option').forEach(el => el.classList.remove('selected'));
        option.classList.add('selected');
        selectedRegColor = option.dataset.color;
      });
    }

    // Palette pour les paramètres
    const profilePaletteEl = document.getElementById('colorPalette');
    if (profilePaletteEl) {
      profilePaletteEl.innerHTML = PALETTE.map((c) => `
        <div class="color-option" style="background-color: ${c}" data-color="${c}"></div>
      `).join('');

      profilePaletteEl.addEventListener('click', async (e) => {
        const option = e.target.closest('.color-option');
        if (!option) return;
        profilePaletteEl.querySelectorAll('.color-option').forEach(el => el.classList.remove('selected'));
        option.classList.add('selected');
        const newColor = option.dataset.color;

        try {
          await API.auth.updateProfile({ color: newColor });
          if (currentUser) {
            currentUser.color = newColor;
            Auth.renderUserBadge();
          }
          showToast('Couleur mise à jour avec succès !', 'success');
        } catch (err) {
          showToast(err.message, 'error');
        }
      });
    }
  },

  setupEventListeners() {
    const authModal = document.getElementById('authModal');
    const loginTabBtn = document.getElementById('showLoginTabBtn');
    const regTabBtn = document.getElementById('showRegisterTabBtn');
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    const authModalTitle = document.getElementById('authModalTitle');

    // Bascule entre Connexion et Inscription
    loginTabBtn?.addEventListener('click', () => {
      loginTabBtn.classList.add('active');
      regTabBtn.classList.remove('active');
      loginForm.style.display = 'block';
      registerForm.style.display = 'none';
      authModalTitle.textContent = 'Connexion à EDTEMP';
    });

    regTabBtn?.addEventListener('click', () => {
      regTabBtn.classList.add('active');
      loginTabBtn.classList.remove('active');
      loginForm.style.display = 'none';
      registerForm.style.display = 'block';
      authModalTitle.textContent = 'Création de compte';
    });

    // Soumission Connexion
    loginForm?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const errEl = document.getElementById('loginError');
      errEl.style.display = 'none';

      const username = document.getElementById('loginUsername').value.trim();
      const password = document.getElementById('loginPassword').value;

      try {
        const res = await API.auth.login(username, password);
        API.setToken(res.token);
        currentUser = res.user;
        authModal.close();
        Auth.renderUserBadge();
        showToast(`Bienvenue, ${currentUser.username} !`, 'success');
        window.dispatchEvent(new CustomEvent('auth:login-success', { detail: currentUser }));
      } catch (err) {
        errEl.textContent = err.message;
        errEl.style.display = 'block';
      }
    });

    // Soumission Inscription
    registerForm?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const errEl = document.getElementById('registerError');
      errEl.style.display = 'none';

      const username = document.getElementById('regUsername').value.trim();
      const password = document.getElementById('regPassword').value;

      try {
        const res = await API.auth.register(username, password, selectedRegColor);
        API.setToken(res.token);
        currentUser = res.user;
        authModal.close();
        Auth.renderUserBadge();
        showToast('Votre compte a été créé avec succès !', 'success');
        window.dispatchEvent(new CustomEvent('auth:login-success', { detail: currentUser }));
      } catch (err) {
        errEl.textContent = err.message;
        errEl.style.display = 'block';
      }
    });

    // Événement d'expiration de session
    window.addEventListener('auth:unauthorized', () => {
      currentUser = null;
      Auth.renderUserBadge();
      Auth.openModal();
    });
  },

  async checkSession() {
    const token = API.getToken();
    if (!token) {
      this.renderUserBadge();
      this.openModal();
      return;
    }

    try {
      const res = await API.auth.getMe();
      currentUser = res.user;
      this.renderUserBadge();
      window.dispatchEvent(new CustomEvent('auth:login-success', { detail: currentUser }));
    } catch (err) {
      this.openModal();
    }
  },

  renderUserBadge() {
    const container = document.getElementById('navUserArea');
    if (!container) return;

    if (currentUser) {
      container.innerHTML = `
        <div class="user-badge" title="Connecté en tant que ${currentUser.username}">
          <span class="user-color-dot" style="background-color: ${currentUser.color || '#3B82F6'}"></span>
          <span>${currentUser.username}</span>
        </div>
      `;
    } else {
      container.innerHTML = `
        <button class="btn btn-primary btn-sm" id="navLoginBtn">Connexion</button>
      `;
      document.getElementById('navLoginBtn')?.addEventListener('click', () => this.openModal());
    }
    
    const settingsLogoutBtn = document.getElementById('settingsLogoutBtn');
    if (settingsLogoutBtn && !settingsLogoutBtn.dataset.bound) {
      settingsLogoutBtn.dataset.bound = "true";
      settingsLogoutBtn.addEventListener('click', () => {
        API.clearToken();
        currentUser = null;
        Auth.renderUserBadge();
        showToast('Vous êtes déconnecté.', 'info');
        window.dispatchEvent(new CustomEvent('auth:logout'));
        Auth.openModal();
      });
    }
  },

  updateSyncStatusDisplay(user) {
    const lastSyncLabel = document.getElementById('lastSyncLabel');
    const syncStatusBadge = document.getElementById('syncStatusBadge');
    const syncErrorMsg = document.getElementById('syncErrorMsg');

    if (!lastSyncLabel || !syncStatusBadge) return;

    if (user.last_sync_at) {
      const date = new Date(user.last_sync_at);
      lastSyncLabel.textContent = date.toLocaleString('fr-FR', {
        dateStyle: 'short',
        timeStyle: 'short',
      });
    } else {
      lastSyncLabel.textContent = 'Jamais';
    }

    if (user.sync_status === 'success') {
      syncStatusBadge.className = 'badge badge-success';
      syncStatusBadge.textContent = 'Synchronisé';
      syncErrorMsg.style.display = 'none';
    } else if (user.sync_status === 'error') {
      syncStatusBadge.className = 'badge badge-error';
      syncStatusBadge.textContent = 'Erreur';
      syncErrorMsg.textContent = user.sync_error || 'Erreur inconnue';
      syncErrorMsg.style.display = 'block';
    } else {
      syncStatusBadge.className = 'badge badge-none';
      syncStatusBadge.textContent = user.ics_url ? 'En attente' : 'Aucun flux';
      syncErrorMsg.style.display = 'none';
    }
  },

  openModal() {
    const modal = document.getElementById('authModal');
    if (modal && !modal.open) {
      modal.showModal();
    }
  },

  getCurrentUser() {
    return currentUser;
  },
};

window.Auth = Auth;
