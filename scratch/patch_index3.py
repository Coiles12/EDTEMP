with open('public/index.html', 'r', encoding='utf-8') as f:
    html = f.read()

html = html.replace('<div class="setting-card mt-3">', '<div class="setting-card">')
html = html.replace('?v=3.5', '?v=3.6')

with open('public/index.html', 'w', encoding='utf-8') as f:
    f.write(html)
