import re

# 1. Update style.css
css_path = 'public/css/style.css'
with open(css_path, 'r', encoding='utf-8') as f:
    css_content = f.read()

# Make sure it's not already added
if "VUE CALENDRIER MOBILE" not in css_content:
    # Add mobile calendar CSS right before Responsive media queries (or at the end)
    mobile_css = """
/* =========================================================
   VUE CALENDRIER MOBILE (Vue 1 Jour)
   ========================================================= */
.mobile-day-nav {
  display: none;
  align-items: center;
  justify-content: space-between;
  background-color: var(--bg-muted);
  padding: 0.75rem 1rem;
  border-bottom: 1px solid var(--border-color);
}
.mobile-day-nav button {
  min-width: 44px;
}
.mobile-day-label {
  font-weight: 700;
  font-size: 1rem;
  color: var(--text-main);
  text-transform: capitalize;
}

@media (max-width: 768px) {
  /* Grille 1 seule colonne (Heure + 1 Jour actif) */
  .calendar-container {
    min-width: 0;
    overflow-x: hidden; 
  }
  .calendar-header-row,
  .calendar-body {
    grid-template-columns: 50px 1fr !important;
    min-width: 0 !important;
  }
  
  /* Masquer tous les jours sauf le mobile-active-day */
  .calendar-header-cell:not(:first-child) {
    display: none;
  }
  .calendar-header-cell.mobile-active-day {
    display: block;
  }
  
  .day-column {
    display: none;
  }
  .day-column.mobile-active-day {
    display: block;
  }
  
  /* Afficher la nav mobile */
  .mobile-day-nav {
    display: flex;
  }
  
  /* Agrandi inputs for touch */
  input[type="text"], input[type="password"], input[type="url"] {
    min-height: 48px;
    font-size: 16px;
  }
  
  .btn {
    min-height: 44px;
  }
  
  /* Page connexion centrage parfait */
  .modal {
    margin: auto !important; /* Centrage vertical Flex/Grid natif sur dialog top-layer */
    padding: 0 !important;
    width: 100% !important;
    max-width: 400px !important;
  }
  .modal-card {
    border-radius: var(--radius-md) !important;
  }
  
  /* Empêche le débordement et le scroll horizontal au niveau du body */
  body {
    overflow-x: hidden;
    width: 100%;
  }
}
"""
    css_content = css_content.replace('/* =========================================================\n   RESPONSIVE (PC / Tablette / Téléphone)', mobile_css + '\n/* =========================================================\n   RESPONSIVE (PC / Tablette / Téléphone)')
    
    with open(css_path, 'w', encoding='utf-8') as f:
        f.write(css_content)

# 2. Update calendar.js
cal_path = 'public/js/calendar.js'
with open(cal_path, 'r', encoding='utf-8') as f:
    cal_content = f.read()

# Add global state logic for active mobile day
if "edtempMobileActiveDayIndex" not in cal_content:
    replacement = """
    // -- Navigation Mobile --
    if (typeof window.edtempMobileActiveDayIndex === 'undefined') {
      window.edtempMobileActiveDayIndex = weekDays.findIndex(d => d.toDateString() === now.toDateString());
      if (window.edtempMobileActiveDayIndex === -1) window.edtempMobileActiveDayIndex = 0;
    }
    const activeIdx = window.edtempMobileActiveDayIndex;
    const isMobileActive = (i) => i === activeIdx;

    // ── En-tête (colonnes des jours) ──
    let mobileNavHtml = `
      <div class="mobile-day-nav">
        <button class="btn btn-outline" onclick="window.changeMobileDay(-1, 'myCalendar')">‹ Prec</button>
        <span class="mobile-day-label">${DAYS_FR[activeIdx]} ${weekDays[activeIdx].getDate()}</span>
        <button class="btn btn-outline" onclick="window.changeMobileDay(1, 'myCalendar')">Suiv ›</button>
      </div>
    `;

    let headerHtml = `
      <div class="calendar-header-row">
        <div class="calendar-header-cell" style="font-weight:600; color:var(--text-muted);">Heure</div>
    `;
"""
    cal_content = re.sub(r'// ── En-tête \(colonnes des jours\) ──\s*let headerHtml = `\s*<div class="calendar-header-row">\s*<div class="calendar-header-cell" style="font-weight:600; color:var\(--text-muted\);">Heure</div>\s*`;', replacement, cal_content)
    
    # Inject active day class into header
    cal_content = cal_content.replace('<div class="calendar-header-cell ${isToday ? \'today\' : \'\'}">', '<div class="calendar-header-cell ${isToday ? \'today\' : \'\'} ${isMobileActive(i) ? \'mobile-active-day\' : \'\'}">')
    
    # Inject active day class into body column
    cal_content = cal_content.replace('<div class="day-column ${isToday ? \'today\' : \'\'}" data-day-index="${i}">', '<div class="day-column ${isToday ? \'today\' : \'\'} ${isMobileActive(i) ? \'mobile-active-day\' : \'\'}" data-day-index="${i}">')
    
    # Prefix container.innerHTML with mobileNavHtml
    cal_content = cal_content.replace('container.innerHTML = headerHtml + bodyHtml;', 'container.innerHTML = mobileNavHtml + headerHtml + bodyHtml;')

    # Add touch swipe logic
    swipe_logic = """
    this.renderEventsOnGrid(weekDays);
    this.renderNowLine(weekDays);
    this.startNowLineTimer(weekDays);

    // Swipe events
    let touchstartX = 0;
    let touchendX = 0;
    container.addEventListener('touchstart', e => { touchstartX = e.changedTouches[0].screenX; }, {passive: true});
    container.addEventListener('touchend', e => {
      touchendX = e.changedTouches[0].screenX;
      if (touchendX < touchstartX - 50) window.changeMobileDay(1, 'myCalendar');
      if (touchendX > touchstartX + 50) window.changeMobileDay(-1, 'myCalendar');
    }, {passive: true});
"""
    cal_content = cal_content.replace('this.renderEventsOnGrid(weekDays);\n    this.renderNowLine(weekDays);\n    this.startNowLineTimer(weekDays);', swipe_logic)
    
    with open(cal_path, 'w', encoding='utf-8') as f:
        f.write(cal_content)

# 3. Update groupCalendar.js
grp_path = 'public/js/groupCalendar.js'
try:
    with open(grp_path, 'r', encoding='utf-8') as f:
        grp_content = f.read()

    if "edtempMobileActiveDayIndex" not in grp_content:
        replacement2 = """
    // -- Navigation Mobile --
    if (typeof window.edtempMobileActiveDayIndex === 'undefined') {
      window.edtempMobileActiveDayIndex = weekDays.findIndex(d => d.toDateString() === now.toDateString());
      if (window.edtempMobileActiveDayIndex === -1) window.edtempMobileActiveDayIndex = 0;
    }
    const activeIdx = window.edtempMobileActiveDayIndex;
    const isMobileActive = (i) => i === activeIdx;

    // ── En-tête (colonnes des jours) ──
    let mobileNavHtml = `
      <div class="mobile-day-nav">
        <button class="btn btn-outline" onclick="window.changeMobileDay(-1, 'groupCalendar')">‹ Prec</button>
        <span class="mobile-day-label">${DAYS_FR[activeIdx]} ${weekDays[activeIdx].getDate()}</span>
        <button class="btn btn-outline" onclick="window.changeMobileDay(1, 'groupCalendar')">Suiv ›</button>
      </div>
    `;

    let headerHtml = `
      <div class="calendar-header-row">
        <div class="calendar-header-cell" style="font-weight:600; color:var(--text-muted);">Heure</div>
    `;
"""
        grp_content = re.sub(r'// ── En-tête \(colonnes des jours\) ──\s*let headerHtml = `\s*<div class="calendar-header-row">\s*<div class="calendar-header-cell" style="font-weight:600; color:var\(--text-muted\);">Heure</div>\s*`;', replacement2, grp_content)
        
        grp_content = grp_content.replace('<div class="calendar-header-cell ${isToday ? \'today\' : \'\'}">', '<div class="calendar-header-cell ${isToday ? \'today\' : \'\'} ${isMobileActive(i) ? \'mobile-active-day\' : \'\'}">')
        grp_content = grp_content.replace('<div class="day-column ${isToday ? \'today\' : \'\'}" data-day-index="${i}">', '<div class="day-column ${isToday ? \'today\' : \'\'} ${isMobileActive(i) ? \'mobile-active-day\' : \'\'}" data-day-index="${i}">')
        grp_content = grp_content.replace('container.innerHTML = headerHtml + bodyHtml;', 'container.innerHTML = mobileNavHtml + headerHtml + bodyHtml;')

        swipe_logic2 = """
    this.renderEventsOnGrid(weekDays);
    this.renderNowLine(weekDays);
    this.startNowLineTimer(weekDays);

    // Swipe events
    let touchstartX = 0;
    let touchendX = 0;
    container.addEventListener('touchstart', e => { touchstartX = e.changedTouches[0].screenX; }, {passive: true});
    container.addEventListener('touchend', e => {
      touchendX = e.changedTouches[0].screenX;
      if (touchendX < touchstartX - 50) window.changeMobileDay(1, 'groupCalendar');
      if (touchendX > touchstartX + 50) window.changeMobileDay(-1, 'groupCalendar');
    }, {passive: true});
"""
        grp_content = grp_content.replace('this.renderEventsOnGrid(weekDays);\n    this.renderNowLine(weekDays);\n    this.startNowLineTimer(weekDays);', swipe_logic2)

        with open(grp_path, 'w', encoding='utf-8') as f:
            f.write(grp_content)
except Exception as e:
    print(f"Group calendar issue: {e}")


# 4. Update app.js
app_path = 'public/js/app.js'
with open(app_path, 'r', encoding='utf-8') as f:
    app_content = f.read()

if "window.changeMobileDay =" not in app_content:
    app_content += """
// ==========================================
// NAVIGATION MOBILE (Swipe & Boutons)
// ==========================================
window.changeMobileDay = function(direction, viewType) {
  if (typeof window.edtempMobileActiveDayIndex === 'undefined') return;
  
  let newIdx = window.edtempMobileActiveDayIndex + direction;
  
  // Si on dépasse la semaine, on change de semaine
  if (newIdx < 0) {
    document.getElementById('prevWeekBtn').click();
    window.edtempMobileActiveDayIndex = 6;
  } else if (newIdx > 6) {
    document.getElementById('nextWeekBtn').click();
    window.edtempMobileActiveDayIndex = 0;
  } else {
    window.edtempMobileActiveDayIndex = newIdx;
  }
  
  if (viewType === 'myCalendar' && window.MyCalendar) {
    window.MyCalendar.render();
  } else if (viewType === 'groupCalendar' && window.GroupCalendar) {
    window.GroupCalendar.render();
  }
};
"""
    with open(app_path, 'w', encoding='utf-8') as f:
        f.write(app_content)

print("Done updates")
