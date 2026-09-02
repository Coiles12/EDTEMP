/**
 * Module de communication API pour EDTEMP
 * Gère le stockage du JWT et l'injection du header d'autorisation.
 */

const API = {
  TOKEN_KEY: 'edtemp_auth_token',

  getToken() {
    return localStorage.getItem(this.TOKEN_KEY);
  },

  setToken(token) {
    localStorage.setItem(this.TOKEN_KEY, token);
  },

  clearToken() {
    localStorage.removeItem(this.TOKEN_KEY);
  },

  /**
   * Effectue un appel fetch avec gestion automatique des tokens et erreurs
   */
  async request(endpoint, options = {}) {
    const url = `/api${endpoint}`;
    const headers = options.headers || {};

    const token = this.getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    // Si on envoie du JSON et que ce n'est pas un FormData
    if (options.body && !(options.body instanceof FormData)) {
      headers['Content-Type'] = 'application/json';
      options.body = JSON.stringify(options.body);
    }

    options.headers = headers;

    try {
      const response = await fetch(url, options);

      // Si non autorisé (session expirée), on nettoie et demande reconnexion
      if (response.status === 401) {
        this.clearToken();
        window.dispatchEvent(new CustomEvent('auth:unauthorized'));
      }

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.error || `Erreur serveur (HTTP ${response.status})`);
      }

      return data;
    } catch (err) {
      console.error(`[API] Erreur sur ${endpoint} :`, err.message);
      throw err;
    }
  },

  // Routes d'authentification
  auth: {
    login(username, password) {
      return API.request('/auth/login', {
        method: 'POST',
        body: { username, password },
      });
    },

    register(username, password, color) {
      return API.request('/auth/register', {
        method: 'POST',
        body: { username, password, color },
      });
    },

    getMe() {
      return API.request('/auth/me');
    },

    updateProfile(data) {
      return API.request('/auth/profile', {
        method: 'PUT',
        body: data,
      });
    },
  },

  // Routes de calendrier
  calendar: {
    getMyEvents(start, end) {
      const params = new URLSearchParams();
      if (start) params.append('start', start);
      if (end) params.append('end', end);
      return API.request(`/calendar/me?${params.toString()}`);
    },

    getGroupEvents(start, end) {
      const params = new URLSearchParams();
      if (start) params.append('start', start);
      if (end) params.append('end', end);
      return API.request(`/calendar/group?${params.toString()}`);
    },

    subscribe(icsUrl) {
      return API.request('/calendar/subscribe', {
        method: 'POST',
        body: { icsUrl },
      });
    },

    syncNow() {
      return API.request('/calendar/sync', {
        method: 'POST',
      });
    },

    uploadIcsFile(file) {
      const formData = new FormData();
      formData.append('icsFile', file);
      return API.request('/calendar/upload', {
        method: 'POST',
        body: formData,
      });
    },
  },
};

/**
 * Affiche une notification toast temporaire
 */
function showToast(message, type = 'info') {
  const container = document.getElementById('toastContainer');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.textContent = message;

  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transition = 'opacity 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}
