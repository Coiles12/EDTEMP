/**
 * Module du calendrier des disponibilités de groupe (Confidentialité garantie)
 */

const GroupCalendar = {
  groupData: [],
  selectedUserIds: new Set(),
  doodleMode: false,

  init() {
    this.setupEventListeners();
  },

  setupEventListeners() {
    // Boutons Tout cocher / Décocher
    document.getElementById('selectAllMembersBtn')?.addEventListener('click', () => {
      this.groupData.forEach(m => this.selectedUserIds.add(m.userId));
      this.updateMemberCheckboxes();
      this.render();
    });

    document.getElementById('deselectAllMembersBtn')?.addEventListener('click', () => {
      this.selectedUserIds.clear();
      this.updateMemberCheckboxes();
      this.render();
    });

    // Bascule Mode Doodle
    const doodleToggle = document.getElementById('doodleModeToggle');
    doodleToggle?.addEventListener('change', (e) => {
      this.doodleMode = e.target.checked;
      this.render();
    });
  },

  async loadGroupData() {
    const { monday, sunday } = MyCalendar.getWeekRange();

    try {
      const res = await API.calendar.getGroupEvents(monday.toISOString(), sunday.toISOString());
      this.groupData = res.group || [];

      // Si premier chargement, sélectionner tous les membres par défaut
      if (this.selectedUserIds.size === 0) {
        this.groupData.forEach(m => this.selectedUserIds.add(m.userId));
      }

      this.renderMembersSidebar();
      this.render();
    } catch (err) {
      console.error('[GroupCalendar] Erreur chargement :', err);
      showToast('Impossible de charger les disponibilités du groupe.', 'error');
    }
  },

  renderMembersSidebar() {
    const container = document.getElementById('groupMembersList');
    if (!container) return;

    if (this.groupData.length === 0) {
      container.innerHTML = `
        <div class="empty-hint">
          Aucun autre membre dans le groupe pour l'instant.<br>
          <small>Invitez vos amis à créer un compte pour comparer vos emplois du temps !</small>
        </div>
      `;
      return;
    }

    container.innerHTML = this.groupData.map((member) => {
      const isChecked = this.selectedUserIds.has(member.userId);
      return `
        <label class="member-checkbox-item" data-id="${member.userId}">
          <input type="checkbox" value="${member.userId}" ${isChecked ? 'checked' : ''} />
          <span class="member-color-indicator" style="background-color: ${member.color || '#3B82F6'}"></span>
          <span class="member-name" title="${this.escapeHtml(member.username)}">${this.escapeHtml(member.username)}</span>
        </label>
      `;
    }).join('');

    // Gestion du changement individuel de case à cocher
    container.querySelectorAll('input[type="checkbox"]').forEach((chk) => {
      chk.addEventListener('change', (e) => {
        const uid = Number(e.target.value);
        if (e.target.checked) {
          this.selectedUserIds.add(uid);
        } else {
          this.selectedUserIds.delete(uid);
        }
        this.render();
      });
    });
  },

  updateMemberCheckboxes() {
    const container = document.getElementById('groupMembersList');
    if (!container) return;
    container.querySelectorAll('.member-avatar-btn').forEach((btn) => {
      if (this.selectedUserIds.has(Number(btn.dataset.id))) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });
  },

  render() {
    const container = document.getElementById('groupCalendarContainer');
    if (!container) return;

    const { monday } = MyCalendar.getWeekRange();
    const now = new Date();

    // En-têtes des jours
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

    // Corps de la grille
    let bodyHtml = `<div class="calendar-body">`;

    // Colonne horaire
    bodyHtml += `<div class="time-gutter">`;
    for (let h = START_HOUR; h < END_HOUR; h++) {
      const label = `${h.toString().padStart(2, '0')}:00`;
      bodyHtml += `<div class="time-slot-label">${label}</div>`;
    }
    bodyHtml += `</div>`;

    // Colonnes des jours
    for (let i = 0; i < 7; i++) {
      const dayDate = weekDays[i];
      const isToday = dayDate.toDateString() === now.toDateString();

      bodyHtml += `
        <div class="day-column ${isToday ? 'today' : ''} ${isMobileActive(i) ? 'mobile-active-day' : ''}" data-day-index="${i}">
          <div class="day-grid-lines">
            ${Array.from({ length: TOTAL_HOURS }).map(() => '<div class="grid-line-hour"></div>').join('')}
          </div>
          <div class="events-layer" id="group-events-day-${i}"></div>
        </div>
      `;
    }

    bodyHtml += `</div>`;

    container.innerHTML = headerHtml + bodyHtml;

    // Rendu des créneaux
    if (this.doodleMode) {
      this.renderCommonFreeSlots(weekDays);
    } else {
      this.renderSuperposedBusySlots(weekDays);
    }
  },

  /**
   * Mode Standard : Superposition des blocs "Occupé" pour chaque ami sélectionné
   */
  renderSuperposedBusySlots(weekDays) {
    const selectedMembers = this.groupData.filter(m => this.selectedUserIds.has(m.userId));
    if (selectedMembers.length === 0) return;

    weekDays.forEach((dayDate, dayIndex) => {
      const layer = document.getElementById(`group-events-day-${dayIndex}`);
      if (!layer) return;

      // Récupérer tous les créneaux occupés de ce jour pour les membres sélectionnés
      const daySlots = [];
      selectedMembers.forEach((member) => {
        (member.busySlots || []).forEach((slot) => {
          const start = new Date(slot.startTime);
          const end = new Date(slot.endTime);

          if (
            dayDate.getFullYear() === start.getFullYear() &&
            dayDate.getMonth() === start.getMonth() &&
            dayDate.getDate() === start.getDate()
          ) {
            daySlots.push({
              member,
              start,
              end,
            });
          }
        });
      });

      // Rendu de chaque bloc occupé
      daySlots.forEach((item) => {
        const startMin = (item.start.getHours() - START_HOUR) * 60 + item.start.getMinutes();
        const endMin = (item.end.getHours() - START_HOUR) * 60 + item.end.getMinutes();

        if (endMin <= 0 || startMin >= TOTAL_HOURS * 60) return;

        const clampedStart = Math.max(0, startMin);
        const clampedEnd = Math.min(TOTAL_HOURS * 60, endMin);
        const durationMin = Math.max(22, clampedEnd - clampedStart);

        const topPercent = (clampedStart / (TOTAL_HOURS * 60)) * 100;
        const heightPercent = (durationMin / (TOTAL_HOURS * 60)) * 100;

        const startStr = item.start.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
        const endStr = item.end.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

        const block = document.createElement('div');
        block.className = 'group-busy-block';
        block.style.top = `${topPercent}%`;
        block.style.height = `calc(${heightPercent}% - 2px)`;
        block.style.backgroundColor = item.member.color || '#64748B';
        block.style.left = '4px';
        block.style.right = '4px';

        block.innerHTML = `
          <span>🔒 Occupé(e) — ${this.escapeHtml(item.member.username)}</span>
          <span style="opacity:0.85; font-size:0.68rem; margin-left:auto;">${startStr}-${endStr}</span>
        `;
        block.title = `${item.member.username} est occupé(e) de ${startStr} à ${endStr}`;

        layer.appendChild(block);
      });
    });
  },

  /**
   * Mode Doodle : Détection et affichage des créneaux communs libres
   * Recherche les plages horaires où AUCUN des membres sélectionnés n'est occupé.
   */
  renderCommonFreeSlots(weekDays) {
    const selectedMembers = this.groupData.filter(m => this.selectedUserIds.has(m.userId));
    if (selectedMembers.length === 0) return;

    weekDays.forEach((dayDate, dayIndex) => {
      const layer = document.getElementById(`group-events-day-${dayIndex}`);
      if (!layer) return;

      // Rassembler toutes les plages occupées (en minutes depuis START_HOUR)
      const busyIntervals = [];
      selectedMembers.forEach((member) => {
        (member.busySlots || []).forEach((slot) => {
          const start = new Date(slot.startTime);
          const end = new Date(slot.endTime);

          if (
            dayDate.getFullYear() === start.getFullYear() &&
            dayDate.getMonth() === start.getMonth() &&
            dayDate.getDate() === start.getDate()
          ) {
            const s = (start.getHours() - START_HOUR) * 60 + start.getMinutes();
            const e = (end.getHours() - START_HOUR) * 60 + end.getMinutes();
            busyIntervals.push([
              Math.max(0, s),
              Math.min(TOTAL_HOURS * 60, e),
            ]);
          }
        });
      });

      // Fusionner les intervalles occupés qui se chevauchent
      busyIntervals.sort((a, b) => a[0] - b[0]);
      const mergedBusy = [];
      busyIntervals.forEach(([s, e]) => {
        if (mergedBusy.length === 0) {
          mergedBusy.push([s, e]);
        } else {
          const last = mergedBusy[mergedBusy.length - 1];
          if (s <= last[1]) {
            last[1] = Math.max(last[1], e);
          } else {
            mergedBusy.push([s, e]);
          }
        }
      });

      // Calculer le complément (les plages libres entre START_HOUR et END_HOUR)
      const freeIntervals = [];
      let cursor = 60; // Commence à 08h00 pour un créneau de disponibilité réaliste (60 min après 07h)
      const maxTime = TOTAL_HOURS * 60 - 60; // Jusqu'à 20h00

      mergedBusy.forEach(([s, e]) => {
        if (s > cursor) {
          const freeStart = Math.max(cursor, 60);
          const freeEnd = Math.min(s, maxTime);
          if (freeEnd - freeStart >= 30) { // Minimum 30 minutes de temps libre consécutif
            freeIntervals.push([freeStart, freeEnd]);
          }
        }
        cursor = Math.max(cursor, e);
      });

      if (cursor < maxTime && (maxTime - cursor >= 30)) {
        freeIntervals.push([cursor, maxTime]);
      }

      // Rendu des créneaux libres en vert
      freeIntervals.forEach(([s, e]) => {
        const topPercent = (s / (TOTAL_HOURS * 60)) * 100;
        const heightPercent = ((e - s) / (TOTAL_HOURS * 60)) * 100;

        const startHour = Math.floor(s / 60) + START_HOUR;
        const startMin = s % 60;
        const endHour = Math.floor(e / 60) + START_HOUR;
        const endMin = e % 60;

        const timeLabel = `${startHour.toString().padStart(2, '0')}:${startMin.toString().padStart(2, '0')} - ${endHour.toString().padStart(2, '0')}:${endMin.toString().padStart(2, '0')}`;

        const block = document.createElement('div');
        block.className = 'free-slot-block';
        block.style.top = `${topPercent}%`;
        block.style.height = `calc(${heightPercent}% - 4px)`;
        block.innerHTML = `✨ Libre (${timeLabel})`;
        block.title = `Tout le monde sélectionné (${selectedMembers.length} pers.) est libre de ${timeLabel}`;

        layer.appendChild(block);
      });
    });
  },

  escapeHtml(str) {
    if (!str) return '';
    return str.replace(/&/g, '&amp;')
              .replace(/</g, '&lt;')
              .replace(/>/g, '&gt;')
              .replace(/"/g, '&quot;')
              .replace(/'/g, '&#039;');
  },
};

window.GroupCalendar = GroupCalendar;
