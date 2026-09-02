import re

with open('public/index.html', 'r', encoding='utf-8') as f:
    html = f.read()

# Replace header-brand
old_brand = """    <div class="header-brand">
      <span class="brand-icon">📅</span>
      <h1 class="brand-title" onclick="location.reload()" style="cursor:pointer;">EDTEMP</h1>
    </div>"""

new_brand = """    <button class="header-brand btn btn-outline" onclick="location.reload()" style="border: none; background: var(--bg-muted); display: flex; align-items: center; gap: 0.5rem; padding: 0.4rem 0.75rem; border-radius: var(--radius-md);">
      <span class="brand-icon">📅</span>
      <h1 class="brand-title" style="margin: 0;">EDTEMP</h1>
    </button>"""

html = html.replace(old_brand, new_brand)

# Add separator in desktop nav
old_desktop_nav = """      <button class="nav-btn active" data-tab="my-calendar">
        <span class="nav-icon">📅</span> Agenda
      </button>
      <button class="nav-btn" data-tab="group-calendar">"""

new_desktop_nav = """      <button class="nav-btn active" data-tab="my-calendar">
        <span class="nav-icon">📅</span> Agenda
      </button>
      <div class="nav-separator"></div>
      <button class="nav-btn" data-tab="group-calendar">"""

html = html.replace(old_desktop_nav, new_desktop_nav)

# Add separator in bottom nav
old_bottom_nav = """    <button class="nav-btn active" data-tab="my-calendar">
      <span class="nav-icon">📅</span>
      <span class="nav-label">Agenda</span>
    </button>
    <button class="nav-btn" data-tab="group-calendar">"""

new_bottom_nav = """    <button class="nav-btn active" data-tab="my-calendar">
      <span class="nav-icon">📅</span>
      <span class="nav-label">Agenda</span>
    </button>
    <div class="nav-separator"></div>
    <button class="nav-btn" data-tab="group-calendar">"""

html = html.replace(old_bottom_nav, new_bottom_nav)

html = html.replace('?v=3.9', '?v=3.10')

with open('public/index.html', 'w', encoding='utf-8') as f:
    f.write(html)
