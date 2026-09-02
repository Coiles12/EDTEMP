import re

with open('public/js/auth.js', 'r', encoding='utf-8') as f:
    auth_js = f.read()

old_badge = """    if (currentUser) {
      container.innerHTML = `
        <div class="user-badge" title="Connecté en tant que ${currentUser.username}">
          <span class="user-color-dot" style="background-color: ${currentUser.color || '#3B82F6'}"></span>
          <span>${currentUser.username}</span>
        </div>
      `;
    } else {"""

# The new badge will look like the group buttons:
# We can use `.member-avatar-btn` class which is already styled correctly in style.css!
# We just need to give it `flex-direction: row` locally or add a new class, but local style is fine.
new_badge = """    if (currentUser) {
      const letter = currentUser.username.charAt(0).toUpperCase();
      container.innerHTML = `
        <button class="member-avatar-btn" id="navProfileBtn" title="Réglages" style="flex-direction: row; width: auto; opacity: 1; padding: 0.3rem 0.6rem; gap: 0.5rem; background: var(--bg-muted); border-radius: 20px;">
          <div class="member-avatar" style="width: 24px; height: 24px; font-size: 0.85rem; border: none; box-shadow: none; background-color: ${currentUser.color || '#3B82F6'}">${letter}</div>
          <div class="member-name" style="font-size: 0.85rem;">${currentUser.username}</div>
        </button>
      `;
      // We bind the click here, but we must use setTimeout or requestAnimationFrame to ensure it's in the DOM
      setTimeout(() => {
        document.getElementById('navProfileBtn')?.addEventListener('click', (e) => {
          e.preventDefault();
          const settingsTab = document.querySelector('.nav-btn[data-tab="settings"]');
          if (settingsTab) {
            settingsTab.click();
          }
        });
      }, 0);
    } else {"""

auth_js = auth_js.replace(old_badge, new_badge)

with open('public/js/auth.js', 'w', encoding='utf-8') as f:
    f.write(auth_js)
