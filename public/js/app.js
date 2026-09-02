/**
 * Point d'entrée Frontend de l'application EDTEMP
 * Orchestre les onglets, la navigation par date et les formulaires d'import.
 */

document.addEventListener('DOMContentLoaded', () => {
  let activeTab = 'my-calendar';

  // 0. Gestion du mode sombre / clair
  const themeToggleBtn = document.getElementById('themeToggleBtn');
  const themeIcon = document.getElementById('themeIcon');

  function updateThemeIcon(theme) {
    if (themeIcon) {
      themeIcon.textContent = theme === 'dark' ? '☀️' : '🌙';
    }
    if (themeToggleBtn) {
      themeToggleBtn.title = theme === 'dark' ? 'Passer en mode clair' : 'Passer en mode sombre';
      themeToggleBtn.setAttribute('aria-label', theme === 'dark' ? 'Passer en mode clair' : 'Passer en mode sombre');
    }
  }

  const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
  updateThemeIcon(currentTheme);

  themeToggleBtn?.addEventListener('click', () => {
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    const newTheme = isDark ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('edtemp_theme', newTheme);
    updateThemeIcon(newTheme);
    showToast(`Mode ${newTheme === 'dark' ? 'sombre' : 'clair'} activé`, 'info');
  });

  // 1. Initialisation des sous-modules
  Auth.init();
  MyCalendar.init();
  GroupCalendar.init();

  // 2. Gestion de la navigation par onglets
  const navTabs = document.querySelectorAll('.tab-btn');
  const panes = document.querySelectorAll('.tab-pane');
  const toolbar = document.getElementById('calendarToolbar');

  navTabs.forEach((btn) => {
    btn.addEventListener('click', () => {
      const targetTab = btn.dataset.tab;
      switchTab(targetTab);
    });
  });

  function switchTab(tabName) {
    activeTab = tabName;

    // Mise à jour visuelle des boutons d'onglets
    navTabs.forEach(b => b.classList.toggle('active', b.dataset.tab === tabName));

    // Affichage du bon conteneur
    panes.forEach(pane => pane.classList.toggle('active', pane.id === `tab-${tabName}`));

    // Affichage ou masquage de la barre d'outils de dates
    if (tabName === 'settings') {
      toolbar.style.display = 'none';
    } else {
      toolbar.style.display = '';
      refreshActiveView();
    }
  }

  // 3. Navigation temporelle (Semaine précédente / Aujourd'hui / Semaine suivante)
  const prevBtn = document.getElementById('prevWeekBtn');
  const nextBtn = document.getElementById('nextWeekBtn');
  const todayBtn = document.getElementById('todayBtn');
  const refreshBtn = document.getElementById('refreshBtn');
  const periodLabel = document.getElementById('currentPeriodLabel');

  function updatePeriodLabel() {
    const { monday, sunday } = MyCalendar.getWeekRange();

    const startDay = monday.getDate();
    const endDay = sunday.getDate();
    const startMonth = monday.toLocaleDateString('fr-FR', { month: 'short' });
    const endMonth = sunday.toLocaleDateString('fr-FR', { month: 'short' });
    const year = sunday.getFullYear();

    // Format propre et concis : ex "31 août au 6 sept. 2026"
    if (startMonth === endMonth) {
      periodLabel.textContent = `Semaine du ${startDay} au ${endDay} ${endMonth} ${year}`;
    } else {
      periodLabel.textContent = `Semaine du ${startDay} ${startMonth} au ${endDay} ${endMonth} ${year}`;
    }
  }

  function changeWeek(offsetDays) {
    const d = new Date(MyCalendar.currentDate);
    d.setDate(d.getDate() + offsetDays);
    MyCalendar.currentDate = d;
    updatePeriodLabel();
    refreshActiveView();
  }

  prevBtn?.addEventListener('click', () => changeWeek(-7));
  nextBtn?.addEventListener('click', () => changeWeek(7));
  todayBtn?.addEventListener('click', () => {
    MyCalendar.currentDate = new Date();
    updatePeriodLabel();
    refreshActiveView();
  });

  refreshBtn?.addEventListener('click', () => {
    refreshActiveView();
    showToast('Plannings actualisés.', 'info');
  });

  function refreshActiveView() {
    updatePeriodLabel();
    if (activeTab === 'my-calendar') {
      MyCalendar.loadEvents();
    } else if (activeTab === 'group-calendar') {
      GroupCalendar.loadGroupData();
    }
  }

  // 4. Écoute des événements d'authentification
  window.addEventListener('auth:login-success', (e) => {
    refreshActiveView();
  });

  window.addEventListener('auth:logout', () => {
    document.getElementById('myCalendarContainer').innerHTML = '';
    document.getElementById('groupCalendarContainer').innerHTML = '';
    document.getElementById('groupMembersList').innerHTML = '';
  });

  // 5. Gestion du formulaire d'abonnement URL ICS
  const subscribeForm = document.getElementById('subscribeForm');
  const saveSubscribeBtn = document.getElementById('saveSubscribeBtn');
  const manualSyncBtn = document.getElementById('manualSyncBtn');

  subscribeForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const urlInput = document.getElementById('icsUrlInput');
    const icsUrl = urlInput.value.trim();

    if (!icsUrl) return;

    saveSubscribeBtn.disabled = true;
    saveSubscribeBtn.textContent = 'Synchronisation en cours...';

    try {
      const res = await API.calendar.subscribe(icsUrl);
      showToast(res.message, 'success');

      // Rafraîchir le profil pour mettre à jour les statuts
      const userRes = await API.auth.getMe();
      Auth.updateSyncStatusDisplay(userRes.user);

      refreshActiveView();
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      saveSubscribeBtn.disabled = false;
      saveSubscribeBtn.textContent = 'Enregistrer & Synchroniser';
    }
  });

  manualSyncBtn?.addEventListener('click', async () => {
    manualSyncBtn.disabled = true;
    manualSyncBtn.textContent = '🔄 Synchronisation...';

    try {
      const res = await API.calendar.syncNow();
      showToast(res.message, 'success');

      const userRes = await API.auth.getMe();
      Auth.updateSyncStatusDisplay(userRes.user);

      refreshActiveView();
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      manualSyncBtn.disabled = false;
      manualSyncBtn.textContent = '🔄 Synchroniser maintenant';
    }
  });

  // 6. Gestion du glisser-déposer et upload de fichier .ics
  const dropzone = document.getElementById('dropzone');
  const fileInput = document.getElementById('icsFileInput');
  const uploadBtn = document.getElementById('uploadBtn');
  const selectedFilename = document.getElementById('selectedFilename');
  const uploadForm = document.getElementById('uploadForm');

  let currentUploadFile = null;

  fileInput?.addEventListener('change', (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelected(e.target.files[0]);
    }
  });

  ['dragenter', 'dragover'].forEach(eventName => {
    dropzone?.addEventListener(eventName, (e) => {
      e.preventDefault();
      dropzone.classList.add('dragover');
    });
  });

  ['dragleave', 'drop'].forEach(eventName => {
    dropzone?.addEventListener(eventName, (e) => {
      e.preventDefault();
      dropzone.classList.remove('dragover');
    });
  });

  dropzone?.addEventListener('drop', (e) => {
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelected(e.dataTransfer.files[0]);
    }
  });

  function handleFileSelected(file) {
    if (!file.name.toLowerCase().endsWith('.ics')) {
      showToast('Veuillez sélectionner un fichier avec l\'extension .ics', 'error');
      return;
    }
    currentUploadFile = file;
    selectedFilename.textContent = `Fichier sélectionné : ${file.name} (${(file.size / 1024).toFixed(1)} Ko)`;
    uploadBtn.disabled = false;
  }

  uploadForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!currentUploadFile) return;

    uploadBtn.disabled = true;
    uploadBtn.textContent = 'Importation en cours...';

    try {
      const res = await API.calendar.uploadIcsFile(currentUploadFile);
      showToast(res.message, 'success');

      // Réinitialisation du champ
      currentUploadFile = null;
      fileInput.value = '';
      selectedFilename.textContent = 'Aucun fichier sélectionné';

      refreshActiveView();
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      uploadBtn.disabled = true;
      uploadBtn.textContent = 'Importer le fichier';
    }
  });

  // Initialisation de la vue
  updatePeriodLabel();
});
