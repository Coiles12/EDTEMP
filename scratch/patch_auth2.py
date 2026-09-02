import re

with open('public/js/auth.js', 'r', encoding='utf-8') as f:
    auth_js = f.read()

pattern = re.compile(r'    const container = document.getElementById\(\'navUserArea\'\);.*?\}\n  \},', re.DOTALL)

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
  },"""

auth_js = pattern.sub(new_badge, auth_js)

with open('public/js/auth.js', 'w', encoding='utf-8') as f:
    f.write(auth_js)
print("auth.js regex patched")
