with open('public/css/style.css', 'r', encoding='utf-8') as f:
    css = f.read()

separator_css = """
.nav-separator {
  width: 2px;
  background-color: var(--border-color);
  margin: auto 0.5rem;
  height: 24px;
  border-radius: 2px;
}
"""
css += separator_css

with open('public/css/style.css', 'w', encoding='utf-8') as f:
    f.write(css)
