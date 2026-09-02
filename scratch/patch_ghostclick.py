import re

# Fix ghost click for calendar.js
with open('public/js/calendar.js', 'r', encoding='utf-8') as f:
    js = f.read()

# el.addEventListener('click', () => this.openEventDetails(ev));
js = js.replace("el.addEventListener('click', () => this.openEventDetails(ev));", "el.addEventListener('click', (e) => { e.preventDefault(); e.stopPropagation(); this.openEventDetails(ev); });")

with open('public/js/calendar.js', 'w', encoding='utf-8') as f:
    f.write(js)

# Fix ghost click for auth.js
with open('public/js/auth.js', 'r', encoding='utf-8') as f:
    auth_js = f.read()

auth_js = auth_js.replace("document.getElementById('navLoginBtn')?.addEventListener('click', () => this.openModal());", "document.getElementById('navLoginBtn')?.addEventListener('click', (e) => { e.preventDefault(); e.stopPropagation(); this.openModal(); });")

with open('public/js/auth.js', 'w', encoding='utf-8') as f:
    f.write(auth_js)
