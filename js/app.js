/**
 * FreeWord - Application Orchestrator & State Controller
 * Manages Folder Hub, Session Launcher, Spaced Repetition Queue,
 * Active 3-Attempt Mastery Loops, and Keyboard-First Ergonomics.
 */

import { getCurrentLanguage, setLanguage, onLanguageChange, t } from './i18n.js';
import { processReview, buildStudyQueue, STATUS, RATING } from './srs.js';
import { 
  initStorage, getFolders, saveFolders, addFolder, updateFolder, deleteFolder, getFolderById,
  getCards, saveCards, addCard, updateCard, deleteCard, moveCardToFolder, resetCardSRS,
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
  activeMode: 'all',        // 'all' | 'word' | 'definition'
  selectedPair: 'all',      // 'all' or 'en-es', 'de-ru', etc.
  sessionType: 'mixed',     // 'learning' | 'reviewing' | 'mixed'
  selectedFolderIds: [],    // Pre-session selected folder IDs
  theme: 'dark',
  // Active Study Session State
  studySession: {
    activeQueue: [],
    totalInitial: 0,
    completedCards: new Set(),
    requeuedCards: new Set(),
    firstPassCount: 0,
    studyController: null
  },
  editingCardId: null,
  editingFolderId: null,
  movingCardId: null
};

/**
 * Bootstraps the application on DOM ready
 */
function initApp() {
  initStorage();

  const settings = getSettings();
  state.activeMode = settings.activeMode || 'all';
  state.selectedPair = settings.selectedLanguagePair || 'all';
  state.theme = settings.theme || 'dark';

  // Ensure default selected folders
  const folders = getFolders();
  if (Array.isArray(settings.selectedFolderIds) && settings.selectedFolderIds.length > 0) {
    state.selectedFolderIds = settings.selectedFolderIds.filter(id => folders.some(f => f.id === id));
  } else {
    state.selectedFolderIds = folders.map(f => f.id);
  }

  // Apply Theme
  applyTheme(state.theme);

  // Setup UI Language Selector
  const langSelect = document.getElementById('ui-lang-select');
  if (langSelect) {
    langSelect.value = getCurrentLanguage();
    langSelect.addEventListener('change', (e) => {
      setLanguage(e.target.value);
    });
  }

  // Subscribe to language changes
  onLanguageChange(() => {
    applyI18n();
    refreshCurrentView();
  });

  // Setup Navigation Tabs & Brand Link
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

  // Setup Global Study Mode Switcher in Header (All | Words | Definitions)
  setupModeSwitcher();

  // Setup Theme Toggle Button
  const themeBtn = document.getElementById('theme-toggle-btn');
  if (themeBtn) {
    themeBtn.addEventListener('click', toggleTheme);
  }

  // Header quick stats click -> open dashboard and scroll to analytics section
  const statsBadge = document.getElementById('header-stats-badge');
  if (statsBadge) {
    statsBadge.addEventListener('click', () => switchView('dashboard', 'dashboard-analytics-section'));
  }

  // Setup View Specific Event Handlers
  setupDashboardListeners();
  setupStudyListeners();
  setupLibraryListeners();
  setupSettingsListeners();
  setupCardModalListeners();
  setupFolderModalListeners();
  setupMoveModalListeners();
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
 * Global Mode Switcher: All vs Words vs Definitions
 */
function setupModeSwitcher() {
  const allBtn = document.getElementById('mode-all-btn');
  const wordsBtn = document.getElementById('mode-words-btn');
  const defsBtn = document.getElementById('mode-defs-btn');

  const updateModeButtons = (mode) => {
    if (allBtn) {
      allBtn.classList.toggle('active', mode === 'all');
      allBtn.setAttribute('aria-selected', String(mode === 'all'));
    }
    if (wordsBtn) {
      wordsBtn.classList.toggle('active', mode === 'word');
      wordsBtn.setAttribute('aria-selected', String(mode === 'word'));
    }
    if (defsBtn) {
      defsBtn.classList.toggle('active', mode === 'definition');
      defsBtn.setAttribute('aria-selected', String(mode === 'definition'));
    }
  };

  const handleModeChange = (mode) => {
    state.activeMode = mode;
    updateSettings({ activeMode: mode });
    updateModeButtons(mode);
    refreshCurrentView();
  };

  if (allBtn) allBtn.addEventListener('click', () => handleModeChange('all'));
  if (wordsBtn) wordsBtn.addEventListener('click', () => handleModeChange('word'));
  if (defsBtn) defsBtn.addEventListener('click', () => handleModeChange('definition'));

  updateModeButtons(state.activeMode);
}

/**
 * View Switcher
 */
function switchView(viewName, scrollToId = null) {
  if (viewName === 'stats') {
    viewName = 'dashboard';
    scrollToId = scrollToId || 'dashboard-analytics-section';
  }
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

  if (scrollToId) {
    setTimeout(() => {
      const targetEl = document.getElementById(scrollToId);
      if (targetEl) {
        targetEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 60);
  }
}

/**
 * Refreshes data and DOM for the active view
 */
function refreshCurrentView() {
  const cards = getCards();
  const folders = getFolders();
  const logs = getReviewLogs();
  const settings = getSettings();

  updateHeaderStats(cards, logs, state.activeMode, state.selectedPair, settings);

  switch (state.currentView) {
    case 'dashboard':
      renderDashboard(cards, folders, logs, {
        activeMode: state.activeMode,
        selectedPair: state.selectedPair,
        sessionType: state.sessionType,
        selectedFolderIds: state.selectedFolderIds
      }, {
        onPairChange: (newPair) => {
          state.selectedPair = newPair;
          updateSettings({ selectedLanguagePair: newPair });
          refreshCurrentView();
        },
        onToggleFolder: (folderId, isSelected) => {
          const set = new Set(state.selectedFolderIds);
          if (isSelected) set.add(folderId);
          else set.delete(folderId);
          state.selectedFolderIds = Array.from(set);
          updateSettings({ selectedFolderIds: state.selectedFolderIds });
          refreshCurrentView();
        },
        onBrowseFolder: (folderId) => {
          switchView('library');
          const folderSelect = document.getElementById('filter-folder-select');
          if (folderSelect) {
            folderSelect.value = folderId;
            applyLibraryFilters();
          }
        },
        onAddCardToFolder: (folderId) => {
          openCardModal(null, 'word', folderId);
        },
        onEditFolder: (folderId) => {
          openFolderModal(folderId);
        },
        onDeleteFolder: (folderId) => {
          if (confirm(t('confirmDeleteFolder'))) {
            deleteFolder(folderId);
            showToast(t('deleteFolder') + ' ✓');
            refreshCurrentView();
          }
        },
        onOpenCreateFolder: () => {
          openFolderModal(null);
        }
      });
      break;

    case 'library':
      applyLibraryFilters();
      break;

    case 'stats':
      state.currentView = 'dashboard';
      refreshCurrentView();
      break;

    case 'settings':
      populateSettingsForm();
      break;

    case 'study':
      // Study flow handled by active session
      break;
  }
}

/**
 * Dashboard & Session Launcher Listeners
 */
function setupDashboardListeners() {
  const startBtn = document.getElementById('btn-start-session');
  const addBtn = document.getElementById('btn-open-add-card');
  const selectAllBtn = document.getElementById('btn-select-all-folders');
  const deselectAllBtn = document.getElementById('btn-deselect-all-folders');
  const openCreateFolderBtn = document.getElementById('btn-open-create-folder');

  // Session mode pill clicks (mixed, learning, reviewing)
  document.querySelectorAll('.session-mode-pill').forEach(pill => {
    pill.addEventListener('click', () => {
      state.sessionType = pill.getAttribute('data-session');
      refreshCurrentView();
    });
  });

  if (startBtn) {
    startBtn.addEventListener('click', startStudySession);
  }

  if (addBtn) {
    addBtn.addEventListener('click', () => openCardModal(null, state.activeMode === 'definition' ? 'definition' : 'word'));
  }

  if (selectAllBtn) {
    selectAllBtn.addEventListener('click', () => {
      const folders = getFolders();
      state.selectedFolderIds = folders.map(f => f.id);
      updateSettings({ selectedFolderIds: state.selectedFolderIds });
      refreshCurrentView();
    });
  }

  if (deselectAllBtn) {
    deselectAllBtn.addEventListener('click', () => {
      state.selectedFolderIds = [];
      updateSettings({ selectedFolderIds: [] });
      refreshCurrentView();
    });
  }

  if (openCreateFolderBtn) {
    openCreateFolderBtn.addEventListener('click', () => openFolderModal(null));
  }
}

/**
 * Starts a new Spaced Repetition Session with the selected folder(s) & session type
 */
function startStudySession() {
  if (state.selectedFolderIds.length === 0) {
    showToast(t('selectFolderWarning'));
    return;
  }

  const cards = getCards();
  const folders = getFolders();
  const settings = getSettings();

  const dailyNewLimit = settings.dailyNewLimitNoLimit ? Infinity : (parseInt(settings.dailyNewLimit, 10) || 20);
  const dailyReviewLimit = settings.dailyReviewLimitNoLimit ? Infinity : (parseInt(settings.dailyReviewLimit, 10) || 50);

  // Build session queue
  const queue = buildStudyQueue(cards, folders, {
    selectedFolderIds: state.selectedFolderIds,
    sessionType: state.sessionType,
    globalMode: state.activeMode,
    pair: state.selectedPair,
    dailyNewLimit,
    dailyReviewLimit
  });

  if (queue.length === 0) {
    showToast(t('noCardsMatchingSession'));
    return;
  }

  // Initialize active study session state
  state.studySession.activeQueue = [...queue];
  state.studySession.totalInitial = queue.length;
  state.studySession.completedCards = new Set();
  state.studySession.requeuedCards = new Set();
  state.studySession.firstPassCount = 0;

  switchView('study');
  loadNextStudyCard();
}

/**
 * Loads and renders the next card in the active session queue
 */
function loadNextStudyCard() {
  const session = state.studySession;

  if (session.activeQueue.length === 0) {
    // Session completed! All items mastered!
    renderSessionCompleted({
      totalMastered: session.totalInitial,
      firstPassCount: session.firstPassCount,
      requeuedCount: session.requeuedCards.size
    }, () => {
      switchView('dashboard');
    });
    return;
  }

  const card = session.activeQueue[0];
  const isRequeued = session.requeuedCards.has(card.id);

  const queueInfo = {
    currentNumber: session.completedCards.size + 1,
    remainingInSession: session.activeQueue.length,
    totalInitial: session.totalInitial,
    isRequeued
  };

  let cardHandled = false;

  const callbacks = {
    // Called when user passes (correct recall, high fuzzy score, or manual pass)
    onPass: (rating = RATING.GOOD) => {
      if (cardHandled) return;
      cardHandled = true;

      const { updatedCard, reviewLog } = processReview(card, rating);
      updateCard(updatedCard);
      addReviewLog(reviewLog);

      if (!session.requeuedCards.has(card.id)) {
        session.firstPassCount++;
      }

      // Remove from session queue
      session.activeQueue.shift();
      session.completedCards.add(card.id);

      // Advance
      setTimeout(() => {
        loadNextStudyCard();
      }, 80);
    },

    // Called when user fails (exhausted 3 attempts, or clicked Again/Fail)
    onFail: () => {
      if (cardHandled) return;
      cardHandled = true;

      const { updatedCard, reviewLog } = processReview(card, RATING.AGAIN);
      updateCard(updatedCard);
      addReviewLog(reviewLog);

      // RE-QUEUE LOOP: Remove from front, push to back of activeQueue
      const failedCard = session.activeQueue.shift();
      session.activeQueue.push(failedCard);
      session.requeuedCards.add(failedCard.id);
    },

    // Advance to next card
    onNext: () => {
      loadNextStudyCard();
    }
  };

  if (card.mode === 'word') {
    session.studyController = renderWordStudyCard(card, queueInfo, callbacks);
  } else {
    session.studyController = renderDefinitionStudyCard(card, queueInfo, callbacks);
  }
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
    const activeEl = document.activeElement;
    const isTyping = activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA' || activeEl.isContentEditable);

    // Escape closes modals or exits study view
    if (e.key === 'Escape') {
      const cardModal = document.getElementById('modal-card-backdrop');
      const folderModal = document.getElementById('modal-folder-backdrop');
      const moveModal = document.getElementById('modal-move-backdrop');

      if (cardModal && !cardModal.classList.contains('hidden')) {
        closeCardModal();
        return;
      }
      if (folderModal && !folderModal.classList.contains('hidden')) {
        closeFolderModal();
        return;
      }
      if (moveModal && !moveModal.classList.contains('hidden')) {
        closeMoveModal();
        return;
      }
      if (state.currentView === 'study') {
        switchView('dashboard');
        return;
      }
    }

    if (state.currentView !== 'study') return;
    const session = state.studySession;
    if (!session || !session.studyController) return;

    // Space: flip / reveal card (only if not typing), or advance if next button is visible
    if (e.code === 'Space' && !isTyping) {
      e.preventDefault();
      const btnNext = document.getElementById('btn-word-next');
      if (btnNext && !btnNext.closest('.hidden')) {
        btnNext.click();
        return;
      }
      const btnAccept = document.getElementById('btn-accept-grade');
      if (btnAccept && !btnAccept.closest('.hidden')) {
        btnAccept.click();
        return;
      }
      if (session.studyController.flip) {
        session.studyController.flip();
      }
      return;
    }

    // Audio pronunciation shortcut: Key 'S'
    if ((e.key === 's' || e.key === 'S') && !isTyping) {
      e.preventDefault();
      if (session.studyController.speak) {
        session.studyController.speak();
      }
      return;
    }

    // Enter key when next button, failure continue button, or accept grade button is visible
    if (e.key === 'Enter') {
      const btnNext = document.getElementById('btn-word-next');
      if (btnNext && !btnNext.closest('.hidden')) {
        e.preventDefault();
        btnNext.click();
        return;
      }
      const btnAccept = document.getElementById('btn-accept-grade');
      if (btnAccept && !btnAccept.closest('.hidden')) {
        e.preventDefault();
        btnAccept.click();
        return;
      }
      const btnRequeue = document.getElementById('btn-requeue-continue') || document.getElementById('btn-def-requeue-continue');
      if (btnRequeue && !btnRequeue.closest('.hidden')) {
        e.preventDefault();
        btnRequeue.click();
        return;
      }
    }

    // SRS Ratings: 1, 2, 3, 4 (only if ratings bar is visible and not typing)
    if (['1', '2', '3', '4'].includes(e.key) && !isTyping) {
      const rating = parseInt(e.key, 10);
      const ratingsBar = document.querySelector('.srs-ratings-bar:not(.hidden)');
      if (ratingsBar) {
        const ratingBtn = ratingsBar.querySelector(`.rating-btn[data-rating="${rating}"]`);
        if (ratingBtn) {
          e.preventDefault();
          ratingBtn.click();
          return;
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
  const folderSelect = document.getElementById('filter-folder-select');
  const modeSelect = document.getElementById('filter-mode-select');
  const statusSelect = document.getElementById('filter-status-select');
  const langSelect = document.getElementById('filter-lang-select');
  const addItemBtn = document.getElementById('btn-library-add-item');

  if (searchInput) searchInput.addEventListener('input', debounce(applyLibraryFilters, 200));
  if (folderSelect) folderSelect.addEventListener('change', applyLibraryFilters);
  if (modeSelect) modeSelect.addEventListener('change', applyLibraryFilters);
  if (statusSelect) statusSelect.addEventListener('change', applyLibraryFilters);
  if (langSelect) langSelect.addEventListener('change', applyLibraryFilters);

  if (addItemBtn) {
    addItemBtn.addEventListener('click', () => openCardModal(null, state.activeMode === 'definition' ? 'definition' : 'word'));
  }
}

function applyLibraryFilters() {
  const cards = getCards();
  const folders = getFolders();

  // Populate folder select filter options
  const folderSelect = document.getElementById('filter-folder-select');
  if (folderSelect) {
    const curVal = folderSelect.value;
    let opts = `<option value="all">${t('allFolders')}</option>`;
    folders.forEach(f => {
      opts += `<option value="${f.id}" ${f.id === curVal ? 'selected' : ''}>📁 ${escapeHtml(f.name)}</option>`;
    });
    folderSelect.innerHTML = opts;
    if (curVal && folders.some(f => f.id === curVal)) {
      folderSelect.value = curVal;
    }
  }

  const search = (document.getElementById('library-search-input')?.value || '').trim().toLowerCase();
  const folderId = folderSelect?.value || 'all';
  const mode = document.getElementById('filter-mode-select')?.value || 'all';
  const status = document.getElementById('filter-status-select')?.value || 'all';
  const lang = document.getElementById('filter-lang-select')?.value || 'all';

  const filtered = cards.filter(card => {
    if (folderId !== 'all' && card.folderId !== folderId) return false;
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

  renderLibraryTable(filtered, folders, {
    onEdit: (cardId) => {
      const card = cards.find(c => c.id === cardId);
      if (card) openCardModal(card);
    },
    onMove: (cardId) => {
      openMoveModal(cardId);
    },
    onReset: (cardId) => {
      if (confirm(t('confirmReset'))) {
        resetCardSRS(cardId);
        showToast(t('resetSRS') + ' ✓');
        applyLibraryFilters();
        updateHeaderStats(getCards(), getReviewLogs(), state.activeMode, state.selectedPair, getSettings());
      }
    },
    onDelete: (cardId) => {
      if (confirm(t('confirmDelete'))) {
        deleteCard(cardId);
        showToast(t('deleteCard') + ' ✓');
        applyLibraryFilters();
        updateHeaderStats(getCards(), getReviewLogs(), state.activeMode, state.selectedPair, getSettings());
      }
    }
  });
}

/**
 * Add / Edit Card Modal with Strict Folder Type Enforcement
 */
function setupCardModalListeners() {
  const backdrop = document.getElementById('modal-card-backdrop');
  const closeBtn = document.getElementById('modal-card-close');
  const cancelBtn = document.getElementById('modal-card-cancel');
  const saveBtn = document.getElementById('modal-card-save');
  const tabWord = document.getElementById('modal-tab-word');
  const tabDef = document.getElementById('modal-tab-def');
  const folderSelect = document.getElementById('card-form-folder');
  const autoTranslateBtn = document.getElementById('btn-auto-translate');
  const translateDefBtn = document.getElementById('btn-translate-def');
  const termInput = document.getElementById('card-form-front');
  const sourceLangSelect = document.getElementById('card-form-source-lang');

  closeBtn.addEventListener('click', closeCardModal);
  cancelBtn.addEventListener('click', closeCardModal);
  backdrop.addEventListener('click', (e) => {
    if (e.target === backdrop) closeCardModal();
  });

  tabWord.addEventListener('click', () => {
    if (!tabWord.disabled) setCardModalMode('word');
  });
  tabDef.addEventListener('click', () => {
    if (!tabDef.disabled) setCardModalMode('definition');
  });

  // Folder change: enforces allowed modes based on folderType!
  folderSelect.addEventListener('change', () => {
    const selectedFolder = getFolderById(folderSelect.value);
    if (!selectedFolder) return;

    if (selectedFolder.folderType === 'words') {
      tabWord.disabled = false;
      tabDef.disabled = true;
      tabDef.style.opacity = '0.4';
      setCardModalMode('word');
    } else if (selectedFolder.folderType === 'definitions') {
      tabWord.disabled = true;
      tabWord.style.opacity = '0.4';
      tabDef.disabled = false;
      setCardModalMode('definition');
    } else {
      tabWord.disabled = false;
      tabDef.disabled = false;
      tabWord.style.opacity = '1';
      tabDef.style.opacity = '1';
    }

    checkCardDuplicate();
  });

  // Duplicate detection scoped to folder and mode
  const checkCardDuplicate = debounce(() => {
    const term = termInput.value.trim();
    const sourceLang = sourceLangSelect.value;
    const mode = document.getElementById('card-form-mode').value;
    const folderId = folderSelect.value;
    const cards = getCards();
    const duplicate = checkDuplicate(cards, term, sourceLang, mode, folderId, state.editingCardId);
    
    const alertEl = document.getElementById('card-duplicate-alert');
    if (alertEl) {
      alertEl.classList.toggle('hidden', !duplicate);
    }
  }, 250);

  termInput.addEventListener('input', checkCardDuplicate);
  sourceLangSelect.addEventListener('change', checkCardDuplicate);

  // Auto-Translate Term
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

      showToast(`${t('autoTranslateBtn')} (${result.provider})`);
    } catch (err) {
      console.error(err);
      showToast('Translation error');
    } finally {
      if (spinner) spinner.classList.add('hidden');
      autoTranslateBtn.disabled = false;
    }
  });

  // Auto-Translate Definition
  if (translateDefBtn) {
    translateDefBtn.addEventListener('click', async () => {
      const defField = document.getElementById('card-form-back-def');
      const textToTranslate = defField ? defField.value.trim() : '';
      if (!textToTranslate) {
        if (defField) defField.focus();
        return;
      }

      const sourceLang = sourceLangSelect.value;
      const targetLang = document.getElementById('card-form-target-lang').value;

      translateDefBtn.disabled = true;
      try {
        const result = await translateText(textToTranslate, targetLang, sourceLang);
        if (result && result.translation) {
          defField.value = result.translation;
          showToast(`${t('translateDefinitionBtn')} ✓`);
        }
      } catch (err) {
        console.error(err);
      } finally {
        translateDefBtn.disabled = false;
      }
    });
  }

  const cardForm = document.getElementById('card-edit-form');
  if (cardForm) {
    cardForm.addEventListener('submit', handleSaveCard);
  }

  saveBtn.addEventListener('click', handleSaveCard);
}

function setCardModalMode(mode) {
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

function openCardModal(card = null, defaultMode = 'word', preselectedFolderId = null) {
  const backdrop = document.getElementById('modal-card-backdrop');
  const modalTitle = document.getElementById('modal-card-title');
  const idInput = document.getElementById('card-form-id');
  const folderSelect = document.getElementById('card-form-folder');
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
  let folders = getFolders();
  if (!folders || folders.length === 0) {
    const defaultFolder = addFolder({ name: 'General', folderType: 'mixed' });
    folders = [defaultFolder];
  }

  // Populate folder select
  let folderOpts = '';
  folders.forEach(f => {
    const typeLabel = f.folderType === 'words' ? t('folderWords') : (f.folderType === 'definitions' ? t('folderDefinitions') : t('folderMixed'));
    folderOpts += `<option value="${f.id}">${escapeHtml(f.name)} (${typeLabel})</option>`;
  });
  folderSelect.innerHTML = folderOpts;

  if (card) {
    state.editingCardId = card.id;
    modalTitle.textContent = t('modalEditTitle');
    idInput.value = card.id;
    folderSelect.value = card.folderId || (folders[0] ? folders[0].id : '');
    frontInput.value = card.front;
    sourceLang.value = card.sourceLang || settings.defaultSourceLang;
    targetLang.value = card.targetLang || settings.defaultTargetLang;
    backWord.value = card.mode === 'word' ? card.back : '';
    backDef.value = card.mode === 'definition' ? card.back : '';
    conceptsInput.value = (card.keyConcepts || []).join(', ');
    contextInput.value = card.contextSentence || '';
    setCardModalMode(card.mode);
  } else {
    state.editingCardId = null;
    modalTitle.textContent = t('modalAddTitle');
    idInput.value = '';
    
    // Preselected folder or first folder
    const targetFid = preselectedFolderId || (folders[0] ? folders[0].id : '');
    folderSelect.value = targetFid;

    frontInput.value = '';
    sourceLang.value = settings.defaultSourceLang || 'en';
    targetLang.value = settings.defaultTargetLang || 'es';
    backWord.value = '';
    backDef.value = '';
    conceptsInput.value = '';
    contextInput.value = '';

    // Enforce folder constraints
    const folder = getFolderById(targetFid);
    let chosenMode = defaultMode;
    if (folder) {
      if (folder.folderType === 'words') chosenMode = 'word';
      else if (folder.folderType === 'definitions') chosenMode = 'definition';
    }
    setCardModalMode(chosenMode);
  }

  // Trigger folder constraints on tabs
  folderSelect.dispatchEvent(new Event('change'));

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
  const folderId = document.getElementById('card-form-folder').value;
  const mode = document.getElementById('card-form-mode').value;
  const front = document.getElementById('card-form-front').value.trim();
  const sourceLang = document.getElementById('card-form-source-lang').value;
  const targetLang = document.getElementById('card-form-target-lang').value;
  const backWord = document.getElementById('card-form-back-word').value.trim();
  const backDef = document.getElementById('card-form-back-def').value.trim();
  const concepts = document.getElementById('card-form-concepts').value;
  const contextSentence = document.getElementById('card-form-context').value.trim();

  if (!front) {
    showToast(t('pleaseEnterTerm'));
    document.getElementById('card-form-front').focus();
    return;
  }

  const back = mode === 'word' ? backWord : backDef;
  if (!back) {
    showToast(mode === 'word' ? t('pleaseEnterTranslation') : t('pleaseEnterDefinition'));
    const field = mode === 'word' ? document.getElementById('card-form-back-word') : document.getElementById('card-form-back-def');
    if (field) field.focus();
    return;
  }

  const cardData = {
    folderId,
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
 * Folder Create / Edit Modal
 */
function setupFolderModalListeners() {
  const backdrop = document.getElementById('modal-folder-backdrop');
  const closeBtn = document.getElementById('modal-folder-close');
  const cancelBtn = document.getElementById('modal-folder-cancel');
  const saveBtn = document.getElementById('modal-folder-save');

  closeBtn.addEventListener('click', closeFolderModal);
  cancelBtn.addEventListener('click', closeFolderModal);
  backdrop.addEventListener('click', (e) => {
    if (e.target === backdrop) closeFolderModal();
  });

  saveBtn.addEventListener('click', (e) => {
    e.preventDefault();
    const id = document.getElementById('folder-form-id').value;
    const name = document.getElementById('folder-form-name').value.trim();
    const folderType = document.querySelector('input[name="folder-form-type"]:checked')?.value || 'mixed';

    if (!name) {
      document.getElementById('folder-form-name').focus();
      return;
    }

    if (id) {
      updateFolder({ id, name, folderType });
      showToast(t('editFolder') + ' ✓');
    } else {
      addFolder({ name, folderType });
      showToast(t('createFolder') + ' ✓');
    }

    closeFolderModal();
    refreshCurrentView();
  });
}

function openFolderModal(folderId = null) {
  const backdrop = document.getElementById('modal-folder-backdrop');
  const title = document.getElementById('modal-folder-title');
  const idInput = document.getElementById('folder-form-id');
  const nameInput = document.getElementById('folder-form-name');

  if (folderId) {
    const folder = getFolderById(folderId);
    if (!folder) return;
    state.editingFolderId = folderId;
    title.textContent = t('editFolder');
    idInput.value = folder.id;
    nameInput.value = folder.name;

    const radio = document.querySelector(`input[name="folder-form-type"][value="${folder.folderType}"]`);
    if (radio) radio.checked = true;
  } else {
    state.editingFolderId = null;
    title.textContent = t('createFolder');
    idInput.value = '';
    nameInput.value = '';
    const radioMixed = document.getElementById('folder-type-mixed');
    if (radioMixed) radioMixed.checked = true;
  }

  backdrop.classList.remove('hidden');
  nameInput.focus();
}

function closeFolderModal() {
  const backdrop = document.getElementById('modal-folder-backdrop');
  backdrop.classList.add('hidden');
  state.editingFolderId = null;
}

/**
 * Move Card Modal
 */
function setupMoveModalListeners() {
  const backdrop = document.getElementById('modal-move-backdrop');
  const closeBtn = document.getElementById('modal-move-close');
  const cancelBtn = document.getElementById('modal-move-cancel');
  const saveBtn = document.getElementById('modal-move-save');

  closeBtn.addEventListener('click', closeMoveModal);
  cancelBtn.addEventListener('click', closeMoveModal);
  backdrop.addEventListener('click', (e) => {
    if (e.target === backdrop) closeMoveModal();
  });

  saveBtn.addEventListener('click', () => {
    const cardId = document.getElementById('move-card-id').value;
    const targetFolderId = document.getElementById('move-card-folder-select').value;

    const res = moveCardToFolder(cardId, targetFolderId);
    if (res.success) {
      showToast(t('moveToFolder') + ' ✓');
      closeMoveModal();
      applyLibraryFilters();
      updateHeaderStats(getCards(), getReviewLogs(), state.activeMode, state.selectedPair, getSettings());
    } else {
      showToast(res.error || 'Cannot move card to selected folder');
    }
  });
}

function openMoveModal(cardId) {
  const backdrop = document.getElementById('modal-move-backdrop');
  const cards = getCards();
  const card = cards.find(c => c.id === cardId);
  if (!card) return;

  document.getElementById('move-card-id').value = cardId;
  const folderSelect = document.getElementById('move-card-folder-select');

  // Filter compatible folders
  const folders = getFolders();
  const compatible = folders.filter(f => {
    if (card.mode === 'word') return f.folderType === 'words' || f.folderType === 'mixed';
    if (card.mode === 'definition') return f.folderType === 'definitions' || f.folderType === 'mixed';
    return true;
  });

  folderSelect.innerHTML = compatible.map(f => `
    <option value="${f.id}" ${f.id === card.folderId ? 'selected' : ''}>
      📁 ${escapeHtml(f.name)} (${f.folderType})
    </option>
  `).join('');

  backdrop.classList.remove('hidden');
}

function closeMoveModal() {
  const backdrop = document.getElementById('modal-move-backdrop');
  backdrop.classList.add('hidden');
}

/**
 * Settings Listeners & Data Management (with No Limit Toggles)
 */
function setupSettingsListeners() {
  const dailyNewInput = document.getElementById('setting-daily-new');
  const dailyNewNoLimit = document.getElementById('setting-daily-new-nolimit');
  const dailyReviewsInput = document.getElementById('setting-daily-reviews');
  const dailyReviewsNoLimit = document.getElementById('setting-daily-reviews-nolimit');
  const defaultSourceSelect = document.getElementById('setting-default-source');
  const defaultTargetSelect = document.getElementById('setting-default-target');

  const exportBtn = document.getElementById('btn-export-json');
  const importTriggerBtn = document.getElementById('btn-trigger-import');
  const importFileInput = document.getElementById('import-file-input');
  const resetBtn = document.getElementById('btn-reset-seed');

  if (dailyNewInput) {
    dailyNewInput.addEventListener('change', () => {
      updateSettings({ dailyNewLimit: parseInt(dailyNewInput.value, 10) || 20 });
      refreshCurrentView();
    });
  }

  if (dailyNewNoLimit) {
    dailyNewNoLimit.addEventListener('change', () => {
      dailyNewInput.disabled = dailyNewNoLimit.checked;
      updateSettings({ dailyNewLimitNoLimit: dailyNewNoLimit.checked });
      refreshCurrentView();
    });
  }

  if (dailyReviewsInput) {
    dailyReviewsInput.addEventListener('change', () => {
      updateSettings({ dailyReviewLimit: parseInt(dailyReviewsInput.value, 10) || 50 });
      refreshCurrentView();
    });
  }

  if (dailyReviewsNoLimit) {
    dailyReviewsNoLimit.addEventListener('change', () => {
      dailyReviewsInput.disabled = dailyReviewsNoLimit.checked;
      updateSettings({ dailyReviewLimitNoLimit: dailyReviewsNoLimit.checked });
      refreshCurrentView();
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
      showToast(t('exportCompleted'));
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
        showToast(t('resetCompleted'));
        refreshCurrentView();
      }
    });
  }
}

function populateSettingsForm() {
  const settings = getSettings();
  const dailyNewInput = document.getElementById('setting-daily-new');
  const dailyNewNoLimit = document.getElementById('setting-daily-new-nolimit');
  const dailyReviewsInput = document.getElementById('setting-daily-reviews');
  const dailyReviewsNoLimit = document.getElementById('setting-daily-reviews-nolimit');
  const defaultSourceSelect = document.getElementById('setting-default-source');
  const defaultTargetSelect = document.getElementById('setting-default-target');

  if (dailyNewInput) {
    dailyNewInput.value = settings.dailyNewLimit || 20;
    dailyNewInput.disabled = Boolean(settings.dailyNewLimitNoLimit);
  }
  if (dailyNewNoLimit) {
    dailyNewNoLimit.checked = Boolean(settings.dailyNewLimitNoLimit);
  }

  if (dailyReviewsInput) {
    dailyReviewsInput.value = settings.dailyReviewLimit || 50;
    dailyReviewsInput.disabled = Boolean(settings.dailyReviewLimitNoLimit);
  }
  if (dailyReviewsNoLimit) {
    dailyReviewsNoLimit.checked = Boolean(settings.dailyReviewLimitNoLimit);
  }

  if (defaultSourceSelect) defaultSourceSelect.value = settings.defaultSourceLang || 'en';
  if (defaultTargetSelect) defaultTargetSelect.value = settings.defaultTargetLang || 'es';
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// Start app when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}
