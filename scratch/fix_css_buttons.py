with open('public/css/style.css', 'r', encoding='utf-8') as f:
    css = f.read()

css = css.replace(".btn, .icon-btn, .nav-btn, .member-avatar-btn, .btn-link {`n  padding: 0;", ".btn, .icon-btn, .nav-btn, .member-avatar-btn, .btn-link {\n  padding: 0;")
css = css.replace(".btn, .icon-btn, .nav-btn, .member-avatar-btn, .btn-link {", ".btn, .icon-btn, .nav-btn, .member-avatar-btn, .btn-link, .modal-tab-btn {")

with open('public/css/style.css', 'w', encoding='utf-8') as f:
    f.write(css)
