/**
 * FreeWord - Application Orchestrator & State Controller
 */

import { getCurrentLanguage, setLanguage, onLanguageChange, t, SUPPORTED_LANGUAGES } from './i18n.js';
import { processReview, buildStudyQueue, STATUS, RATING } from './srs.js';
import { 
  initStorage, getCards, saveCards, addCard, updateCard, deleteCard, resetCardSRS,
  getReviewLogs, addReviewLog, getSettings, updateSettings, exportAllData, importAllData, resetToSeedData
} from './storage.js';
import { translateText, checkDuplicate, debounce } from './translator.js';
import { 
  applyI18n, showToast, updateHeaderStats, renderDashboard, renderWordStudyCard, 
  renderDefinitionStudyCard, renderSessionCompleted, renderLibraryTable, renderAnalytics 
} from './ui.js';

// Application State
const state = {
  currentView: 'dashboard', // 'dashboard' | 'study' | 'library' | 'stats' | 'settings'
  activeMode: 'word',        // 'word' | 'definition'
  theme: 'dark',
  studyQueue: [],
  studyIndex: 0,
  studySessionCount: 0,
  studyController: null,
  editingCardId: null
};

/**
 * Bootstraps the application on DOM ready
 */
function initApp() {
  initStorage();

  const settings = getSettings();
  state.activeMode = settings.activeMode || 'word';
  state.theme = settings.theme || 'dark';

  // Apply Theme
  applyTheme(state.theme);

  // Setup UI Language
  const langSelect = document.getElementById('ui-lang-select');
  if (langSelect) {
    langSelect.value = getCurrentLanguage();
    langSelect.addEventListener('change', (e) => {
      setLanguage(e.target.value);
    });
  }

  // Subscribe to language change
  onLanguageChange(() => {
    applyI18n();
    refreshCurrentView();
  });

  // Setup Navigation Tabs & Brand
  document.querySelectorAll('.nav-tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const targetView = btn.getAttribute('data-view');
      switchView(targetView);
    });
  });

  const brandLink = document.getElementById('brand-link');
  if (brandLink) {
    brandLink.addEventListener('click', () => switchView('dashboard'));
  }

  // Setup Study Mode Switcher in Header
  setupModeSwitcher();

  // Setup Theme Toggle
  const themeBtn = document.getElementById('theme-toggle-btn');
  if (themeBtn) {
    themeBtn.addEventListener('click', toggleTheme);
  }

  // Header quick stats click -> open stats view
  const statsBadge = document.getElementById('header-stats-badge');
  if (statsBadge) {
    statsBadge.addEventListener('click', () => switchView('stats'));
  }

  // Setup View Specific Event Handlers
  setupDashboardListeners();
  setupStudyListeners();
  setupLibraryListeners();
  setupSettingsListeners();
  setupModalListeners();
  setupGlobalKeyboardShortcuts();

  // Initial render
  applyI18n();
  refreshCurrentView();
}

/**
 * Handles toggling dark and light themes
 */
function applyTheme(theme) {
  state.theme = theme;
  document.documentElement.setAttribute('data-theme', theme);
  const icon = document.getElementById('theme-icon');
  if (icon) {
    icon.textContent = theme === 'dark' ? '🌙' : '☀️';
  }
  updateSettings({ theme });
}

function toggleTheme() {
  const nextTheme = state.theme === 'dark' ? 'light' : 'dark';
  applyTheme(nextTheme);
}

/**
 * Mode Switcher: Words vs Definitions
 */
function setupModeSwitcher() {
  const wordsBtn = document.getElementById('mode-words-btn');
  const defsBtn = document.getElementById('mode-defs-btn');

  const updateModeButtons = (mode) => {
    wordsBtn.classList.toggle('active', mode === 'word');
    wordsBtn.setAttribute('aria-selected', mode === 'word');
    defsBtn.classList.toggle('active', mode === 'definition');
    defsBtn.setAttribute('aria-selected', mode === 'definition');
  };

  wordsBtn.addEventListener('click', () => {
    state.activeMode = 'word';
    updateSettings({ activeMode: 'word' });
    updateModeButtons('word');
    refreshCurrentView();
  });

  defsBtn.addEventListener('click', () => {
    state.activeMode = 'definition';
    updateSettings({ activeMode: 'definition' });
    updateModeButtons('definition');
    refreshCurrentView();
  });

  updateModeButtons(state.activeMode);
}

/**
 * View Switcher
 */
function switchView(viewName) {
  state.currentView = viewName;

  // Toggle active class on navigation tabs
  document.querySelectorAll('.nav-tab-btn').forEach(btn => {
    btn.classList.toggle('active', btn.getAttribute('data-view') === viewName);
  });

  // Show target section, hide others
  document.querySelectorAll('.view-section').forEach(sec => {
    sec.classList.add('hidden');
  });

  const activeSection = document.getElementById(`view-${viewName}`);
  if (activeSection) {
    activeSection.classList.remove('hidden');
  }

  refreshCurrentView();
}

/**
 * Refreshes data and DOM for the active view
 */
function refreshCurrentView() {
  const cards = getCards();
  const logs = getReviewLogs();

  updateHeaderStats(cards, logs);

  switch (state.currentView) {
    case 'dashboard':
      renderDashboard(cards, logs, state.activeMode);
      break;

    case 'library':
      applyLibraryFilters();
      break;

    case 'stats':
      renderAnalytics(cards, logs);
      break;

    case 'settings':
      populateSettingsForm();
      break;

    case 'study':
      // Study view maintains its own queue state
      break;
  }
}

/**
 * Dashboard Actions
 */
function setupDashboardListeners() {
  const startBtn = document.getElementById('btn-start-review');
  const addBtn = document.getElementById('btn-open-add-card');

  if (startBtn) {
    startBtn.addEventListener('click', startStudySession);
  }

  if (addBtn) {
    addBtn.addEventListener('click', () => openCardModal(null, state.activeMode));
  }
}

/**
 * Starts a new Spaced Repetition Study Session
 */
function startStudySession() {
  const cards = getCards();
  const settings = getSettings();

  // Build review queue for current mode
  const queue = buildStudyQueue(cards, {
    mode: state.activeMode,
    dailyNewLimit: parseInt(settings.dailyNewLimit, 10) || 20,
    dailyReviewLimit: parseInt(settings.dailyReviewLimit, 10) || 50
  });

  if (queue.length === 0) {
    // If no cards are due in current mode, check if there are any cards at all
    const modeCards = cards.filter(c => c.mode === state.activeMode);
    if (modeCards.length === 0) {
      showToast(t('noCardsFound'));
      openCardModal(null, state.activeMode);
      return;
    } else {
      showToast(t('noReviewsDue'));
      // Offer to review all available cards anyway
      state.studyQueue = modeCards.slice(0, 10);
    }
  } else {
    state.studyQueue = queue;
  }

  state.studyIndex = 0;
  state.studySessionCount = 0;
  switchView('study');
  loadNextStudyCard();
}

/**
 * Loads and displays the current card in the review queue
 */
function loadNextStudyCard() {
  if (state.studyIndex >= state.studyQueue.length) {
    // Session completed!
    renderSessionCompleted(state.studySessionCount, () => {
      switchView('dashboard');
    });
    return;
  }

  const card = state.studyQueue[state.studyIndex];
  const total = state.studyQueue.length;

  const callbacks = {
    onRate: (rating) => handleCardRating(card, rating)
  };

  if (card.mode === 'word') {
    state.studyController = renderWordStudyCard(card, state.studyIndex, total, callbacks);
  } else {
    state.studyController = renderDefinitionStudyCard(card, state.studyIndex, total, callbacks);
  }
}

/**
 * Handles SRS grade submission for the current card
 */
function handleCardRating(card, rating) {
  const { updatedCard, reviewLog } = processReview(card, rating);

  // Persist update
  updateCard(updatedCard);
  addReviewLog(reviewLog);

  state.studySessionCount++;
  state.studyIndex++;

  // Advance to next card
  loadNextStudyCard();
}

/**
 * Study View Listeners
 */
function setupStudyListeners() {
  const exitBtn = document.getElementById('study-exit-btn');
  if (exitBtn) {
    exitBtn.addEventListener('click', () => switchView('dashboard'));
  }
}

/**
 * Global Keyboard-First Navigation
 */
function setupGlobalKeyboardShortcuts() {
  window.addEventListener('keydown', (e) => {
    // Don't trigger study shortcuts when typing in a text field
    const activeEl = document.activeElement;
    const isTyping = activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA' || activeEl.isContentEditable);

    // Escape always closes modal or exits study
    if (e.key === 'Escape') {
      const modal = document.getElementById('modal-card-backdrop');
      if (modal && !modal.classList.contains('hidden')) {
        closeCardModal();
        return;
      }
      if (state.currentView === 'study') {
        switchView('dashboard');
        return;
      }
    }

    if (state.currentView !== 'study') return;
    if (!state.studyController) return;

    // Space: flip card in word mode
    if (e.code === 'Space' && !isTyping) {
      e.preventDefault();
      if (state.studyController.flip) {
        state.studyController.flip();
      }
      return;
    }

    // Audio shortcut: Key 'S'
    if ((e.key === 's' || e.key === 'S') && !isTyping) {
      e.preventDefault();
      if (state.studyController.speak) {
        state.studyController.speak();
      }
      return;
    }

    // SRS Ratings: 1, 2, 3, 4
    if (['1', '2', '3', '4'].includes(e.key) && !isTyping) {
      const rating = parseInt(e.key, 10);
      const ratingsBar = document.querySelector('.srs-ratings-bar:not(.hidden)');
      if (ratingsBar) {
        e.preventDefault();
        const currentCard = state.studyQueue[state.studyIndex];
        if (currentCard) {
          handleCardRating(currentCard, rating);
        }
      }
    }
  });
}

/**
 * Library Filters & Table
 */
function setupLibraryListeners() {
  const searchInput = document.getElementById('library-search-input');
  const modeSelect = document.getElementById('filter-mode-select');
  const statusSelect = document.getElementById('filter-status-select');
  const langSelect = document.getElementById('filter-lang-select');
  const addItemBtn = document.getElementById('btn-library-add-item');

  if (searchInput) {
    searchInput.addEventListener('input', debounce(applyLibraryFilters, 250));
  }

  if (modeSelect) modeSelect.addEventListener('change', applyLibraryFilters);
  if (statusSelect) statusSelect.addEventListener('change', applyLibraryFilters);
  if (langSelect) langSelect.addEventListener('change', applyLibraryFilters);

  if (addItemBtn) {
    addItemBtn.addEventListener('click', () => openCardModal(null, state.activeMode));
  }
}

function applyLibraryFilters() {
  const cards = getCards();
  const search = (document.getElementById('library-search-input')?.value || '').trim().toLowerCase();
  const mode = document.getElementById('filter-mode-select')?.value || 'all';
  const status = document.getElementById('filter-status-select')?.value || 'all';
  const lang = document.getElementById('filter-lang-select')?.value || 'all';

  const filtered = cards.filter(card => {
    if (mode !== 'all' && card.mode !== mode) return false;
    if (status !== 'all' && card.status !== status) return false;
    if (lang !== 'all' && card.sourceLang !== lang && card.targetLang !== lang) return false;

    if (search) {
      const inFront = card.front.toLowerCase().includes(search);
      const inBack = card.back.toLowerCase().includes(search);
      const inContext = (card.contextSentence || '').toLowerCase().includes(search);
      if (!inFront && !inBack && !inContext) return false;
    }

    return true;
  });

  renderLibraryTable(filtered, {
    onEdit: (cardId) => {
      const card = cards.find(c => c.id === cardId);
      if (card) openCardModal(card);
    },
    onReset: (cardId) => {
      if (confirm(t('confirmReset'))) {
        resetCardSRS(cardId);
        showToast(t('resetSRS') + ' ✓');
        applyLibraryFilters();
        updateHeaderStats(getCards(), getReviewLogs());
      }
    },
    onDelete: (cardId) => {
      if (confirm(t('confirmDelete'))) {
        deleteCard(cardId);
        showToast(t('deleteCard') + ' ✓');
        applyLibraryFilters();
        updateHeaderStats(getCards(), getReviewLogs());
      }
    }
  });
}

/**
 * Add / Edit Modal & Auto-Translator
 */
function setupModalListeners() {
  const backdrop = document.getElementById('modal-card-backdrop');
  const closeBtn = document.getElementById('modal-card-close');
  const cancelBtn = document.getElementById('modal-card-cancel');
  const saveBtn = document.getElementById('modal-card-save');
  const tabWord = document.getElementById('modal-tab-word');
  const tabDef = document.getElementById('modal-tab-def');
  const autoTranslateBtn = document.getElementById('btn-auto-translate');
  const termInput = document.getElementById('card-form-front');
  const sourceLangSelect = document.getElementById('card-form-source-lang');

  closeBtn.addEventListener('click', closeCardModal);
  cancelBtn.addEventListener('click', closeCardModal);
  backdrop.addEventListener('click', (e) => {
    if (e.target === backdrop) closeCardModal();
  });

  // Modal mode tabs
  tabWord.addEventListener('click', () => setModalMode('word'));
  tabDef.addEventListener('click', () => setModalMode('definition'));

  // Duplicate detection listener
  const checkDup = debounce(() => {
    const term = termInput.value.trim();
    const sourceLang = sourceLangSelect.value;
    const cards = getCards();
    const duplicate = checkDuplicate(cards, term, sourceLang, state.editingCardId);
    
    const alertEl = document.getElementById('card-duplicate-alert');
    if (alertEl) {
      if (duplicate) {
        alertEl.classList.remove('hidden');
      } else {
        alertEl.classList.add('hidden');
      }
    }
  }, 300);

  termInput.addEventListener('input', checkDup);
  sourceLangSelect.addEventListener('change', checkDup);

  // Auto-Translate Button
  autoTranslateBtn.addEventListener('click', async () => {
    const term = termInput.value.trim();
    if (!term) {
      termInput.focus();
      return;
    }

    const sourceLang = sourceLangSelect.value;
    const targetLang = document.getElementById('card-form-target-lang').value;
    const mode = document.getElementById('card-form-mode').value;

    const spinner = document.getElementById('translate-spinner');
    if (spinner) spinner.classList.remove('hidden');
    autoTranslateBtn.disabled = true;

    try {
      const result = await translateText(term, sourceLang, targetLang);
      
      if (mode === 'word') {
        const transField = document.getElementById('card-form-back-word');
        if (transField && result.translation) {
          transField.value = result.translation;
        }
      } else {
        const defField = document.getElementById('card-form-back-def');
        if (defField) {
          defField.value = result.definition || result.translation || '';
        }
      }

      showToast(`Translated (${result.provider})`);
    } catch (err) {
      console.error(err);
      showToast('Translation failed');
    } finally {
      if (spinner) spinner.classList.add('hidden');
      autoTranslateBtn.disabled = false;
    }
  });

  // Save Card
  saveBtn.addEventListener('click', handleSaveCard);
}

function setModalMode(mode) {
  const formMode = document.getElementById('card-form-mode');
  const tabWord = document.getElementById('modal-tab-word');
  const tabDef = document.getElementById('modal-tab-def');
  const grpTrans = document.getElementById('group-form-translation');
  const grpDef = document.getElementById('group-form-definition');
  const grpConcepts = document.getElementById('group-form-concepts');

  formMode.value = mode;
  tabWord.classList.toggle('active', mode === 'word');
  tabDef.classList.toggle('active', mode === 'definition');

  if (mode === 'word') {
    grpTrans.classList.remove('hidden');
    grpDef.classList.add('hidden');
    grpConcepts.classList.add('hidden');
  } else {
    grpTrans.classList.add('hidden');
    grpDef.classList.remove('hidden');
    grpConcepts.classList.remove('hidden');
  }
}

function openCardModal(card = null, defaultMode = 'word') {
  const backdrop = document.getElementById('modal-card-backdrop');
  const modalTitle = document.getElementById('modal-card-title');
  const idInput = document.getElementById('card-form-id');
  const frontInput = document.getElementById('card-form-front');
  const sourceLang = document.getElementById('card-form-source-lang');
  const targetLang = document.getElementById('card-form-target-lang');
  const backWord = document.getElementById('card-form-back-word');
  const backDef = document.getElementById('card-form-back-def');
  const conceptsInput = document.getElementById('card-form-concepts');
  const contextInput = document.getElementById('card-form-context');
  const alertEl = document.getElementById('card-duplicate-alert');

  if (alertEl) alertEl.classList.add('hidden');

  const settings = getSettings();

  if (card) {
    state.editingCardId = card.id;
    modalTitle.textContent = t('modalEditTitle');
    idInput.value = card.id;
    frontInput.value = card.front;
    sourceLang.value = card.sourceLang || settings.defaultSourceLang;
    targetLang.value = card.targetLang || settings.defaultTargetLang;
    backWord.value = card.mode === 'word' ? card.back : '';
    backDef.value = card.mode === 'definition' ? card.back : '';
    conceptsInput.value = (card.keyConcepts || []).join(', ');
    contextInput.value = card.contextSentence || '';
    setModalMode(card.mode);
  } else {
    state.editingCardId = null;
    modalTitle.textContent = t('modalAddTitle');
    idInput.value = '';
    frontInput.value = '';
    sourceLang.value = settings.defaultSourceLang || 'en';
    targetLang.value = settings.defaultTargetLang || 'es';
    backWord.value = '';
    backDef.value = '';
    conceptsInput.value = '';
    contextInput.value = '';
    setModalMode(defaultMode);
  }

  backdrop.classList.remove('hidden');
  frontInput.focus();
}

function closeCardModal() {
  const backdrop = document.getElementById('modal-card-backdrop');
  backdrop.classList.add('hidden');
  state.editingCardId = null;
}

function handleSaveCard(e) {
  e.preventDefault();
  const id = document.getElementById('card-form-id').value;
  const mode = document.getElementById('card-form-mode').value;
  const front = document.getElementById('card-form-front').value.trim();
  const sourceLang = document.getElementById('card-form-source-lang').value;
  const targetLang = document.getElementById('card-form-target-lang').value;
  const backWord = document.getElementById('card-form-back-word').value.trim();
  const backDef = document.getElementById('card-form-back-def').value.trim();
  const concepts = document.getElementById('card-form-concepts').value;
  const contextSentence = document.getElementById('card-form-context').value.trim();

  if (!front) {
    alert('Please enter a target word or term.');
    return;
  }

  const back = mode === 'word' ? backWord : backDef;
  if (!back) {
    alert(mode === 'word' ? 'Please enter a translation.' : 'Please enter a definition.');
    return;
  }

  const cardData = {
    mode,
    front,
    back,
    sourceLang,
    targetLang,
    contextSentence,
    keyConcepts: concepts.split(',').map(s => s.trim()).filter(Boolean)
  };

  if (id) {
    updateCard({ id, ...cardData });
    showToast(t('modalEditTitle') + ' ✓');
  } else {
    addCard(cardData);
    showToast(t('modalAddTitle') + ' ✓');
  }

  closeCardModal();
  refreshCurrentView();
}

/**
 * Settings Listeners & Data Management
 */
function setupSettingsListeners() {
  const dailyNewInput = document.getElementById('setting-daily-new');
  const dailyReviewsInput = document.getElementById('setting-daily-reviews');
  const defaultSourceSelect = document.getElementById('setting-default-source');
  const defaultTargetSelect = document.getElementById('setting-default-target');

  const exportBtn = document.getElementById('btn-export-json');
  const importTriggerBtn = document.getElementById('btn-trigger-import');
  const importFileInput = document.getElementById('import-file-input');
  const resetBtn = document.getElementById('btn-reset-seed');

  if (dailyNewInput) {
    dailyNewInput.addEventListener('change', () => {
      updateSettings({ dailyNewLimit: parseInt(dailyNewInput.value, 10) || 20 });
    });
  }

  if (dailyReviewsInput) {
    dailyReviewsInput.addEventListener('change', () => {
      updateSettings({ dailyReviewLimit: parseInt(dailyReviewsInput.value, 10) || 50 });
    });
  }

  if (defaultSourceSelect) {
    defaultSourceSelect.addEventListener('change', () => {
      updateSettings({ defaultSourceLang: defaultSourceSelect.value });
    });
  }

  if (defaultTargetSelect) {
    defaultTargetSelect.addEventListener('change', () => {
      updateSettings({ defaultTargetLang: defaultTargetSelect.value });
    });
  }

  // Export JSON
  if (exportBtn) {
    exportBtn.addEventListener('click', () => {
      const dataStr = exportAllData();
      const blob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `freeword_backup_${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      showToast('Export completed ✓');
    });
  }

  // Import JSON
  if (importTriggerBtn && importFileInput) {
    importTriggerBtn.addEventListener('click', () => importFileInput.click());
    importFileInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (event) => {
        const result = importAllData(event.target.result);
        if (result.success) {
          showToast(t('dataImportSuccess', { count: result.count }));
          refreshCurrentView();
        } else {
          showToast(t('dataImportError'));
        }
      };
      reader.readAsText(file);
    });
  }

  // Reset to Seed Data
  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      if (confirm(t('confirmResetAll'))) {
        resetToSeedData();
        showToast('Reset to default seed data ✓');
        refreshCurrentView();
      }
    });
  }
}

function populateSettingsForm() {
  const settings = getSettings();
  const dailyNewInput = document.getElementById('setting-daily-new');
  const dailyReviewsInput = document.getElementById('setting-daily-reviews');
  const defaultSourceSelect = document.getElementById('setting-default-source');
  const defaultTargetSelect = document.getElementById('setting-default-target');

  if (dailyNewInput) dailyNewInput.value = settings.dailyNewLimit || 20;
  if (dailyReviewsInput) dailyReviewsInput.value = settings.dailyReviewLimit || 50;
  if (defaultSourceSelect) defaultSourceSelect.value = settings.defaultSourceLang || 'en';
  if (defaultTargetSelect) defaultTargetSelect.value = settings.defaultTargetLang || 'es';
}

// Start app when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}
