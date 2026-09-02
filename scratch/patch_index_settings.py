with open('public/index.html', 'r', encoding='utf-8') as f:
    html = f.read()

html = html.replace('<button class="nav-btn" data-tab="settings">', '<button class="nav-btn" data-tab="settings" style="display: none;">')
html = html.replace('?v=3.8', '?v=3.9')

with open('public/index.html', 'w', encoding='utf-8') as f:
    f.write(html)
