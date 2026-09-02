import re

with open('public/js/app.js', 'r', encoding='utf-8') as f:
    js = f.read()

# Fix updatePeriodLabel
old_logic = """    const mobileLabel = document.getElementById('currentMobileDayLabel');
    if (mobileLabel) {
      const activeIdx = window.edtempMobileActiveDayIndex || 0;"""

new_logic = """    const mobileLabel = document.getElementById('currentMobileDayLabel');
    if (mobileLabel) {
      if (typeof window.edtempMobileActiveDayIndex === 'undefined') {
        window.edtempMobileActiveDayIndex = (new Date().getDay() + 6) % 7;
      }
      const activeIdx = window.edtempMobileActiveDayIndex;"""

js = js.replace(old_logic, new_logic)

with open('public/js/app.js', 'w', encoding='utf-8') as f:
    f.write(js)
