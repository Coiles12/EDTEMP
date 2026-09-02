with open('public/css/style.css', 'r', encoding='utf-8') as f:
    css = f.read()

# Fix the circles that were broken
css = css.replace("width: 10px; height: 10px; border-radius: var(--radius-md);", "width: 10px; height: 10px; border-radius: 50%;")
css = css.replace("width: 50px;\n  height: 50px;\n  border-radius: var(--radius-md);", "width: 50px;\n  height: 50px;\n  border-radius: 50%;")
css = css.replace("width: 18px; height: 18px;\n  border-radius: var(--radius-md);", "width: 18px; height: 18px;\n  border-radius: 50%;")
css = css.replace("width: 32px; height: 32px;\n  border-radius: var(--radius-md);", "width: 32px; height: 32px;\n  border-radius: 50%;")
css = css.replace("width: 32px; height: 32px;\n  border-radius: var(--radius-md);\n  font-size: 1.2rem;", "width: 32px; height: 32px;\n  border-radius: 50%;\n  font-size: 1.2rem;")

with open('public/css/style.css', 'w', encoding='utf-8') as f:
    f.write(css)
print("css fixed")
