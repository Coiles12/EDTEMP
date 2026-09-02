import re

# 1. Fix auth.js color-dot issue
with open('public/js/auth.js', 'r', encoding='utf-8') as f:
    auth = f.read()

auth = auth.replace('color-option', 'color-dot')

with open('public/js/auth.js', 'w', encoding='utf-8') as f:
    f.write(auth)

# 2. Fix style.css setting-card layout
with open('public/css/style.css', 'r', encoding='utf-8') as f:
    css = f.read()

# Add align-items: center to setting-card
if 'align-items: center;' not in css.split('.setting-card {')[1].split('}')[0]:
    css = css.replace('.setting-card {\n', '.setting-card {\n  align-items: center;\n')

with open('public/css/style.css', 'w', encoding='utf-8') as f:
    f.write(css)

print("Fixed auth.js and style.css")
