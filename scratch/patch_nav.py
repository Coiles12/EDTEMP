import re

with open('public/js/app.js', 'r', encoding='utf-8') as f:
    app_js = f.read()

# 1. Replace the button event listeners with the responsive logic
old_buttons = """  prevBtn?.addEventListener('click', () => changeWeek(-7));
  nextBtn?.addEventListener('click', () => changeWeek(7));"""

new_nav_logic = """  function navigateGlobal(direction) {
    if (window.innerWidth < 768) {
      // Mobile: Jour par jour
      let newIdx = (window.edtempMobileActiveDayIndex !== undefined ? window.edtempMobileActiveDayIndex : (new Date().getDay() + 6) % 7) + direction;
      if (newIdx < 0) {
        window.edtempMobileActiveDayIndex = 6;
        changeWeek(-7);
      } else if (newIdx > 6) {
        window.edtempMobileActiveDayIndex = 0;
        changeWeek(7);
      } else {
        window.edtempMobileActiveDayIndex = newIdx;
        if (window.updatePeriodLabel) window.updatePeriodLabel();
        refreshActiveView();
      }
    } else {
      // PC: Semaine par semaine
      changeWeek(direction === 1 ? 7 : -7);
    }
  }

  prevBtn?.addEventListener('click', () => navigateGlobal(-1));
  nextBtn?.addEventListener('click', () => navigateGlobal(1));

  window.navigateGlobal = navigateGlobal; // Expose to window for touch events
"""

app_js = app_js.replace(old_buttons, new_nav_logic)

# 2. Update changeMobileDay to just call navigateGlobal
old_swipe = r"""window.changeMobileDay = function\(direction, viewType\) \{[\s\S]*?\};"""
new_swipe = """window.changeMobileDay = function(direction, viewType) {
  if (window.navigateGlobal) {
    window.navigateGlobal(direction);
  }
};"""

app_js = re.sub(old_swipe, new_swipe, app_js)

with open('public/js/app.js', 'w', encoding='utf-8') as f:
    f.write(app_js)
print("app.js navigation patched")
