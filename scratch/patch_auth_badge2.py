import re

with open('public/js/auth.js', 'r', encoding='utf-8') as f:
    auth_js = f.read()

# Replace the innerHTML block for the badge
old_badge = """      container.innerHTML = `
        <button class="member-avatar-btn" id="navProfileBtn" title="Réglages" style="flex-direction: row; width: auto; opacity: 1; padding: 0.3rem 0.6rem; gap: 0.5rem; background: var(--bg-muted); border-radius: 20px;">
          <div class="member-avatar" style="width: 24px; height: 24px; font-size: 0.85rem; border: none; box-shadow: none; background-color: ${currentUser.color || '#3B82F6'}">${letter}</div>
          <div class="member-name" style="font-size: 0.85rem;">${currentUser.username}</div>
        </button>
      `;"""

new_badge = """      container.innerHTML = `
        <button class="btn btn-outline" id="navProfileBtn" title="Réglages" style="display: flex; align-items: center; gap: 0.5rem; padding: 0.4rem 0.75rem; border: none; background: var(--bg-muted); border-radius: var(--radius-md);">
          <div class="member-avatar" style="width: 24px; height: 24px; font-size: 0.85rem; flex-shrink: 0; border: none; border-radius: 50%; box-shadow: none; background-color: ${currentUser.color || '#3B82F6'}">${letter}</div>
          <div class="member-name" style="font-size: 0.9rem; font-weight: 600;">${currentUser.username}</div>
        </button>
      `;"""

auth_js = auth_js.replace(old_badge, new_badge)

with open('public/js/auth.js', 'w', encoding='utf-8') as f:
    f.write(auth_js)
