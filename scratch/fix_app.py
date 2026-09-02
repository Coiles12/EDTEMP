import re

with open('public/js/app.js', 'r', encoding='utf-8') as f:
    content = f.read()

bad_str = " ${startMonth} au ${endDay} ${endMonth} ${year}`;\n    }\n  }"
content = content.replace(bad_str, "  }")

with open('public/js/app.js', 'w', encoding='utf-8') as f:
    f.write(content)
print("fixed")
