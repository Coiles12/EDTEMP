import re

with open('public/js/app.js', 'r', encoding='utf-8') as f:
    app_js = f.read()

# 1. Update tab selector
app_js = app_js.replace("document.querySelectorAll('.tab-btn');", "document.querySelectorAll('.nav-btn');")

# 2. Add mobile day label update to updatePeriodLabel
period_logic = """    if (startMonth === endMonth) {
      periodLabel.textContent = `Semaine du ${startDay} au ${endDay} ${endMonth} ${year}`;
    } else {
      periodLabel.textContent = `Semaine du ${startDay} ${startMonth} au ${endDay} ${endMonth} ${year}`;
    }

    // Mise a jour du sous-titre mobile
    const mobileLabel = document.getElementById('currentMobileDayLabel');
    if (mobileLabel) {
      const activeIdx = window.edtempMobileActiveDayIndex || 0;
      const activeDate = new Date(monday);
      activeDate.setDate(monday.getDate() + activeIdx);
      const DAYS_FR = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];
      mobileLabel.textContent = `${DAYS_FR[activeIdx]} ${activeDate.getDate()}`;
      mobileLabel.style.display = '';
    }
"""
app_js = re.sub(r'    if \(startMonth === endMonth\) \{[\s\S]*?\} else \{[\s\S]*?\}', period_logic.replace('\\', '\\\\'), app_js)

# 3. Export updatePeriodLabel to window
app_js = app_js.replace('function updatePeriodLabel() {', 'window.updatePeriodLabel = function() {')

# 4. Update changeMobileDay to call window.updatePeriodLabel
app_js = app_js.replace('  if (viewType === \'myCalendar\' && window.MyCalendar) {', '  if (window.updatePeriodLabel) window.updatePeriodLabel();\n  if (viewType === \'myCalendar\' && window.MyCalendar) {')

# Also fix the previous swipe bug: we need to handle swipe left/right correctly.
# TouchendX < touchStartX means we dragged left -> next day (direction 1). 
# That was correctly implemented in my python script before!

with open('public/js/app.js', 'w', encoding='utf-8') as f:
    f.write(app_js)
print("app.js rewritten")
