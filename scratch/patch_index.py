with open('public/index.html', 'r', encoding='utf-8') as f:
    html = f.read()

# Make EDTEMP title reload page
html = html.replace('<h1 class="brand-title">EDTEMP</h1>', '<h1 class="brand-title" onclick="location.reload()" style="cursor:pointer;">EDTEMP</h1>')

# Remove refresh button
html = html.replace('<button class="icon-btn" id="refreshBtn" title="Actualiser">🔄</button>', '')

# Add Logout to Settings
logout_html = """
        <!-- Déconnexion -->
        <div class="setting-card mt-3">
          <div class="setting-icon">🚪</div>
          <div class="setting-content">
            <h3>Déconnexion</h3>
            <p>Se déconnecter de l'application</p>
            <div class="setting-actions mt-3">
              <button type="button" class="btn btn-outline btn-block" id="settingsLogoutBtn" style="color: var(--danger); border-color: var(--danger);">Se déconnecter</button>
            </div>
          </div>
        </div>
      </div>
"""
html = html.replace('      </div>\n    </div>\n  </main>', logout_html + '    </div>\n  </main>')

# Bump cache
html = html.replace('?v=3.1', '?v=3.2')

with open('public/index.html', 'w', encoding='utf-8') as f:
    f.write(html)
print("index.html patched")
