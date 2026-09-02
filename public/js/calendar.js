/**
 * Module du calendrier personnel (Mon Agenda)
 * — Détection CM / TD / TP basée prioritairement sur la 1ère ligne de la description (ENT)
 * — Ligne de l'heure actuelle mise à jour chaque minute
 * — Résolution des chevauchements d'horaires et affichage haute visibilité
 */

const START_HOUR = 7;
const END_HOUR = 21;
const TOTAL_HOURS = END_HOUR - START_HOUR;

const DAYS_FR = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];

/* =========================================================
   Couleurs par type de cours (contrastées, vives et accessibles)
   ========================================================= */

const COURSE_TYPES = {
  CM: { label: 'CM', color: '#2563EB', badgeBg: 'rgba(0, 0, 0, 0.28)' },   // Bleu royal vif
  TD: { label: 'TD', color: '#059669', badgeBg: 'rgba(0, 0, 0, 0.28)' },   // Vert émeraude vif
  TP: { label: 'TP', color: '#D97706', badgeBg: 'rgba(0, 0, 0, 0.28)' },   // Ambre / Orange vif
  OTHER: { label: 'Autre', color: '#64748B', badgeBg: 'rgba(0, 0, 0, 0.28)' }, // Gris ardoise
};

/**
 * Détecte le type de cours (CM, TD, TP) prioritairement à partir de la 1ère ligne de la description,
 * avec repli sur le titre de l'événement si nécessaire.
 *
 * Analyse (exemples ENT réels) :
 * - Description ligne 1 "GIM1 B2" ou "GIM1 B1" (lettre + chiffre) → TP
 * - Description ligne 1 "GIM1 B" ou "GIM1 A" (lettre seule)      → TD
 * - Description ligne 1 "GIM1" (promo entière sans lettre)       → CM
 * - Mots-clés explicites "CM", "TD", "TP" détectés dans le texte
 */
function detectCourseType(description, title) {
  let text = '';

  // 1. Extraction de la première ligne non vide de la description
  if (description && typeof description === 'string') {
    const lines = description.split(/\r?\n/);
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed) {
        text = trimmed;
        break;
      }
    }
  }

  // 2. Si aucune description exploitable, se replier sur le titre
  if (!text && title && typeof title === 'string') {
    text = title.trim();
  }

  if (!text) return COURSE_TYPES.CM;

  // 3. Recherche de mots-clés explicites TP / TD / CM (ex: "TP", "TP2", "TD1", "CM")
  if (/(?:^|\s|[(\[/\-–—:_])TP\d?(?:\s|[)\]/\-–—:_]|$)/i.test(text)) return COURSE_TYPES.TP;
  if (/(?:^|\s|[(\[/\-–—:_])TD\d?(?:\s|[)\]/\-–—:_]|$)/i.test(text)) return COURSE_TYPES.TD;
  if (/(?:^|\s|[(\[/\-–—:_])CM\d?(?:\s|[)\]/\-–—:_]|$)/i.test(text)) return COURSE_TYPES.CM;

  // 4. Analyse du dernier groupe / lettre en fin de texte
  const tokens = text.split(/\s+/);
  const lastToken = tokens[tokens.length - 1];

  // Lettre + chiffre(s) en fin (ex: B1, B2, A1...) → TP
  if (lastToken && /^[A-Z]\d+$/i.test(lastToken)) {
    return COURSE_TYPES.TP;
  }

  // Lettre majuscule seule en fin (ex: B, A, C...) → TD
  if (lastToken && /^[A-Z]$/i.test(lastToken)) {
    return COURSE_TYPES.TD;
  }

  // 5. Par défaut (ex: 'GIM1' promo entière, amphi) → CM
  return COURSE_TYPES.CM;
}

/**
 * Extrait un nom lisible du cours (sans les préfixes/suffixes techniques redondants).
 */
function cleanTitle(rawTitle) {
  if (!rawTitle || typeof rawTitle !== 'string') return 'Cours';
  let t = rawTitle.trim();

  // Retirer les tags [CM], [TD], etc.
  t = t.replace(/^\[[^\]]+\]\s*/i, '');

  // Retirer les préfixes CM/TD/TP/COURS en tête
  t = t.replace(/^(CM|TD|TP|COURS)\b\s*[-–—:\/]?\s*/i, '');

  // Retirer les suffixes de groupe en fin (ex: " B", " B2", " (TD)", " (CM)")
  t = t.replace(/\s+[A-Z]\d*(?:\+[A-Z]\d*)?\s*$/i, '');
  t = t.replace(/\s*\((CM|TD|TP)\)\s*$/i, '');

  t = t.trim();
  if (t.length < 2) t = rawTitle.trim();

  return t.charAt(0).toUpperCase() + t.slice(1);
}

/* =========================================================
   Module calendrier
   ========================================================= */

const MyCalendar = {
  currentDate: new Date(),
  events: [],
  _nowLineInterval: null,

  init() {
    this.setupModalEvents();
  },

  setupModalEvents() {
    const modal = document.getElementById('eventDetailModal');
    const closeBtn1 = document.getElementById('closeEventModalBtn');
    const closeBtn2 = document.getElementById('closeEventModalBtn2');

    const closeModal = () => modal?.close();
    closeBtn1?.addEventListener('click', closeModal);
    closeBtn2?.addEventListener('click', closeModal);
    modal?.addEventListener('click', (e) => {
      if (e.target === modal) closeModal();
    });
  },

  getMonday(d) {
    const date = new Date(d);
    const day = date.getDay();
    const diff = date.getDate() - day + (day === 0 ? -6 : 1);
    date.setDate(diff);
    date.setHours(0, 0, 0, 0);
    return date;
  },

  getWeekRange() {
    const monday = this.getMonday(this.currentDate);
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    sunday.setHours(23, 59, 59, 999);
    return { monday, sunday };
  },

  async loadEvents() {
    const { monday, sunday } = this.getWeekRange();

    try {
      const res = await API.calendar.getMyEvents(monday.toISOString(), sunday.toISOString());
      this.events = res.events || [];
      this.render();
    } catch (err) {
      console.error('[Calendar] Erreur de chargement :', err);
      showToast('Impossible de charger votre agenda.', 'error');
    }
  },

  render() {
    const container = document.getElementById('myCalendarContainer');
    if (!container) return;

    const { monday } = this.getWeekRange();
    const now = new Date();

    

    // -- Navigation Mobile --
    if (typeof window.edtempMobileActiveDayIndex === 'undefined') {
      window.edtempMobileActiveDayIndex = (now.getDay() + 6) % 7; // Lundi=0, Dimanche=6
    }

    const activeIdx = window.edtempMobileActiveDayIndex;
    const isMobileActive = (i) => i === activeIdx;

    // ── En-tête (colonnes des jours) ──
    

    let headerHtml = `
      <div class="calendar-header-row">
        <div class="calendar-header-cell" style="font-weight:600; color:var(--text-muted);">Heure</div>
    `;


    const weekDays = [];
    for (let i = 0; i < 7; i++) {
      const dayDate = new Date(monday);
      dayDate.setDate(monday.getDate() + i);
      weekDays.push(dayDate);

      const isToday = dayDate.toDateString() === now.toDateString();
      headerHtml += `
        <div class="calendar-header-cell ${isToday ? 'today' : ''} ${isMobileActive(i) ? 'mobile-active-day' : ''}">
          <div class="day-name">${DAYS_FR[i]}</div>
          <div class="day-date">${dayDate.getDate()}</div>
        </div>
      `;
    }
    headerHtml += `</div>`;

    // ── Corps (heures + 7 colonnes) ──
    let bodyHtml = `<div class="calendar-body">`;

    bodyHtml += `<div class="time-gutter">`;
    for (let h = START_HOUR; h < END_HOUR; h++) {
      bodyHtml += `<div class="time-slot-label">${h.toString().padStart(2, '0')}:00</div>`;
    }
    bodyHtml += `</div>`;

    for (let i = 0; i < 7; i++) {
      const isToday = weekDays[i].toDateString() === now.toDateString();
      bodyHtml += `
        <div class="day-column ${isToday ? 'today' : ''} ${isMobileActive(i) ? 'mobile-active-day' : ''}" data-day-index="${i}">
          <div class="day-grid-lines">
            ${Array.from({ length: TOTAL_HOURS }).map(() => '<div class="grid-line-hour"></div>').join('')}
          </div>
          <div class="events-layer" id="my-events-day-${i}"></div>
        </div>
      `;
    }
    bodyHtml += `</div>`;

    container.innerHTML = headerHtml + bodyHtml;

    
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

  },

  /* ── Ligne de l'heure actuelle ── */

  renderNowLine(weekDays) {
    document.querySelectorAll('.now-line').forEach(el => el.remove());

    const now = new Date();
    const todayIndex = weekDays.findIndex(d => d.toDateString() === now.toDateString());
    if (todayIndex === -1) return;

    const nowMin = (now.getHours() - START_HOUR) * 60 + now.getMinutes();
    if (nowMin < 0 || nowMin >= TOTAL_HOURS * 60) return;

    const topPercent = (nowMin / (TOTAL_HOURS * 60)) * 100;

    const col = document.querySelector(`.day-column[data-day-index="${todayIndex}"]`);
    if (!col) return;

    const line = document.createElement('div');
    line.className = 'now-line';
    line.style.top = `${topPercent}%`;
    col.appendChild(line);
  },

  startNowLineTimer(weekDays) {
    if (this._nowLineInterval) clearInterval(this._nowLineInterval);
    this._nowLineInterval = setInterval(() => this.renderNowLine(weekDays), 60_000);
  },

  /* ── Chevauchements ── */

  computeOverlapLayout(dayEvents) {
    if (dayEvents.length <= 1) {
      return dayEvents.map(e => ({ ...e, colIndex: 0, numCols: 1 }));
    }

    dayEvents.sort((a, b) => a.startMin - b.startMin || b.endMin - a.endMin);

    const columns = [];
    dayEvents.forEach(ev => {
      let placed = false;
      for (let i = 0; i < columns.length; i++) {
        if (columns[i] <= ev.startMin) {
          columns[i] = ev.endMin;
          ev.colIndex = i;
          placed = true;
          break;
        }
      }
      if (!placed) {
        ev.colIndex = columns.length;
        columns.push(ev.endMin);
      }
    });

    dayEvents.forEach(ev => {
      const conflicting = dayEvents.filter(
        o => ev.startMin < o.endMin && o.startMin < ev.endMin
      );
      const maxCol = Math.max(...conflicting.map(o => o.colIndex)) + 1;
      conflicting.forEach(o => {
        o.numCols = Math.max(o.numCols || 1, maxCol);
      });
    });

    return dayEvents;
  },

  /* ── Rendu des événements ── */

  renderEventsOnGrid(weekDays) {
    weekDays.forEach((dayDate, dayIndex) => {
      const layer = document.getElementById(`my-events-day-${dayIndex}`);
      if (!layer) return;

      const dayRawEvents = this.events.filter(ev => {
        const s = new Date(ev.startTime);
        return dayDate.getFullYear() === s.getFullYear()
          && dayDate.getMonth() === s.getMonth()
          && dayDate.getDate() === s.getDate();
      });

      const dayProcessed = dayRawEvents.map(ev => {
        const start = new Date(ev.startTime);
        const end = new Date(ev.endTime);
        const sMin = (start.getHours() - START_HOUR) * 60 + start.getMinutes();
        const eMin = (end.getHours() - START_HOUR) * 60 + end.getMinutes();
        return {
          original: ev, start, end,
          startMin: Math.max(0, sMin),
          endMin: Math.min(TOTAL_HOURS * 60, eMin),
        };
      }).filter(item => item.endMin > 0 && item.startMin < TOTAL_HOURS * 60);

      const layoutEvents = this.computeOverlapLayout(dayProcessed);

      layoutEvents.forEach(item => {
        const ev = item.original;
        const durationMin = item.endMin - item.startMin;
        const isShort = durationMin <= 60; // 60 min ou moins
        const topPercent = (item.startMin / (TOTAL_HOURS * 60)) * 100;
        const heightPercent = Math.max(durationMin, 40) / (TOTAL_HOURS * 60) * 100;

        const colIndex = item.colIndex || 0;
        const numCols = item.numCols || 1;
        const widthPct = 100 / numCols;
        const leftPct = colIndex * widthPct;

        // Détection CM / TD / TP via la première ligne de description (avec fallback titre)
        const type = detectCourseType(ev.description, ev.title);
        const title = cleanTitle(ev.title);

        const t0 = item.start.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
        const t1 = item.end.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

        const el = document.createElement('div');
        el.className = `event-card ${isShort ? 'event-card-short' : ''}`;
        el.style.top = `${topPercent}%`;
        el.style.height = `calc(${heightPercent}% - 3px)`;
        el.style.width = `calc(${widthPct}% - 6px)`;
        el.style.left = `calc(${leftPct}% + 3px)`;
        el.style.backgroundColor = type.color;

        if (isShort) {
          // Disposition compacte haute lisibilité sur 2 lignes pour créneaux d'1 heure ou moins
          el.innerHTML = `
            <div class="event-header" style="justify-content: space-between; gap: 0.35rem;">
              <div style="display: flex; align-items: center; gap: 0.35rem; min-width: 0;">
                <span class="event-type-badge">${esc(type.label)}</span>
                <span class="event-title" style="color:#ffffff !important;" title="${esc(ev.title)}">${esc(title)}</span>
              </div>
              <span class="event-time" style="flex-shrink: 0;">${t0}-${t1}</span>
            </div>
            ${ev.location ? `<div class="event-location" style="margin-top:0.05rem;" title="Salle : ${esc(ev.location)}"><span class="loc-icon">📍</span><span class="loc-name">${esc(ev.location)}</span></div>` : ''}
          `;
        } else {
          // Disposition spacieuse standard (3 lignes)
          el.innerHTML = `
            <div class="event-header">
              <span class="event-type-badge">${esc(type.label)}</span>
              <span class="event-time">${t0} - ${t1}</span>
            </div>
            <div class="event-title" style="color:#ffffff !important;" title="${esc(ev.title)}">${esc(title)}</div>
            ${ev.location ? `<div class="event-location" title="Salle : ${esc(ev.location)}"><span class="loc-icon">📍</span><span class="loc-name">${esc(ev.location)}</span></div>` : ''}
          `;
        }

        el.addEventListener('click', (e) => { e.preventDefault(); e.stopPropagation(); this.openEventDetails(ev); });
        layer.appendChild(el);
      });
    });
  },

  /* ── Modale de détails ── */

  openEventDetails(ev) {
    const modal = document.getElementById('eventDetailModal');
    if (!modal) return;

    const start = new Date(ev.startTime);
    const end = new Date(ev.endTime);
    const type = detectCourseType(ev.description, ev.title);

    const titleEl = document.getElementById('modalEventTitle');
    if (titleEl) {
      titleEl.textContent = ev.title || 'Cours';
      titleEl.style.color = 'var(--text-main)';
    }

    // Badge type dans la modale
    const typeBadge = document.getElementById('modalTypeBadge');
    if (typeBadge) {
      typeBadge.textContent = type.label;
      typeBadge.style.backgroundColor = type.color;
    }

    document.getElementById('modalEventTime').textContent =
      `${start.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })} de ${start.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })} à ${end.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`;

    const locRow = document.getElementById('modalLocationRow');
    const locVal = document.getElementById('modalEventLocation');
    if (ev.location) {
      locVal.textContent = ev.location;
      locRow.style.display = 'flex';
    } else {
      locRow.style.display = 'none';
    }

    const descRow = document.getElementById('modalDescRow');
    const descVal = document.getElementById('modalEventDesc');
    if (ev.description) {
      descVal.textContent = ev.description;
      descRow.style.display = 'flex';
    } else {
      descRow.style.display = 'none';
    }

    modal.showModal();
  },
};

function esc(str) {
  if (!str) return '';
  return str.replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
}

window.MyCalendar = MyCalendar;
window.detectCourseType = detectCourseType;
