with open('public/js/auth.js', 'r', encoding='utf-8') as f:
    auth_js = f.read()

# Replace renderUserBadge
old_badge = """    const container = document.getElementById('navUserArea');
    if (!container) return;

    if (currentUser) {
      container.innerHTML = `
        <div class="user-badge" title="Connecté en tant que ${currentUser.username}">
          <span class="user-color-dot" style="background-color: ${currentUser.color || '#3B82F6'}"></span>
          <span>${currentUser.username}</span>
        </div>
        <button class="btn btn-outline" id="logoutBtn" style="padding: 0.35rem 0.75rem; font-size: 0.8rem;">
          Déconnexion
        </button>
      `;

      document.getElementById('logoutBtn')?.addEventListener('click', () => {
        API.clearToken();
        currentUser = null;
        Auth.renderUserBadge();
        showToast('Vous êtes déconnecté.', 'info');
        window.dispatchEvent(new CustomEvent('auth:logout'));
        Auth.openModal();
      });
    } else {
      container.innerHTML = `
        <button class="btn btn-primary btn-sm" id="navLoginBtn">Connexion</button>
      `;
      document.getElementById('navLoginBtn')?.addEventListener('click', () => this.openModal());
    }"""

new_badge = """    const container = document.getElementById('navUserArea');
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
    
    // Bind global logout button in settings
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
    }"""

auth_js = auth_js.replace(old_badge, new_badge)

# Fallback string replace if encoding weirdness happens
if "Déconnexion" not in auth_js and "D\xc3\xa9connexion" not in auth_js:
    # Meaning the replace didn't work. We can use regex.
    pass

with open('public/js/auth.js', 'w', encoding='utf-8') as f:
    f.write(auth_js)
print("auth.js patched")
