/**
 * FreeWord - UI Rendering & View Controller
 * Implements high-density, utilitarian interface components, Folder Hub,
 * 3-attempt recall loop, fuzzy semantic evaluation diffs, and accessible modal flows.
 */

import { t, getCurrentLanguage, SUPPORTED_LANGUAGES } from './i18n.js';
import { RATING, STATUS, computeStats } from './srs.js';
import { speakText } from './audio.js';
import { evaluateDefinition, normalizeWord, hasFuzzyMatch } from './fuzzy.js';

/**
 * Updates all DOM elements with i18n attributes
 */
export function applyI18n() {
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    el.textContent = t(key);
  });

  document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
    const key = el.getAttribute('data-i18n-placeholder');
    el.setAttribute('placeholder', t(key));
  });

  document.querySelectorAll('[data-i18n-title]').forEach(el => {
    const key = el.getAttribute('data-i18n-title');
    el.setAttribute('title', t(key));
  });
}

/**
 * Displays a lightweight toast message
 */
export function showToast(message, duration = 2800) {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.textContent = message;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transition = 'opacity 0.25s ease';
    setTimeout(() => toast.remove(), 250);
  }, duration);
}

/**
 * Updates Header Quick Stats pill (Due / New / Mastered)
 */
export function updateHeaderStats(cards, reviewLogs, activeMode = 'all', selectedPair = 'all') {
  const stats = computeStats(cards, reviewLogs, { mode: activeMode, pair: selectedPair });
  const badge = document.getElementById('header-stats-badge');
  if (badge) {
    badge.innerHTML = `
      <span class="stat-pill-item"><span class="stat-pill-due">${stats.dueTodayCount}</span> ${t('headerDue')}</span>
      <span class="stat-pill-dot">·</span>
      <span class="stat-pill-item"><span class="stat-pill-new">${stats.newCount}</span> ${t('headerNew')}</span>
      <span class="stat-pill-dot">·</span>
      <span class="stat-pill-item"><span class="stat-pill-mastered">${stats.masteredCount}</span> ${t('headerMastered')}</span>
    `;
  }
}

/**
 * Renders the Dashboard overview: Session Launcher, Folder Manager & Quick Stats
 */
export function renderDashboard(cards, folders, reviewLogs, options = {}, callbacks = {}) {
  const {
    activeMode = 'all',
    selectedPair = 'all',
    sessionType = 'mixed',
    selectedFolderIds = []
  } = options;

  // 1. Update Mode Filter buttons in Header
  document.querySelectorAll('.mode-toggle-group .mode-btn').forEach(btn => {
    const btnMode = btn.getAttribute('data-mode');
    const isActive = btnMode === activeMode;
    btn.classList.toggle('active', isActive);
    btn.setAttribute('aria-selected', String(isActive));
  });

  const modeBadge = document.getElementById('dashboard-active-mode-badge');
  if (modeBadge) {
    if (activeMode === 'word') {
      modeBadge.textContent = t('modeWords');
      modeBadge.className = 'badge badge-new';
    } else if (activeMode === 'definition') {
      modeBadge.textContent = t('modeDefinitions');
      modeBadge.className = 'badge badge-review';
    } else {
      modeBadge.textContent = t('modeAll');
      modeBadge.className = 'badge badge-mastered';
    }
  }

  // 2. Language Pair Filter in Dashboard
  const pairSelect = document.getElementById('dashboard-pair-select');
  if (pairSelect) {
    const pairs = new Set();
    cards.forEach(c => {
      if (activeMode === 'all' || c.mode === activeMode) {
        pairs.add(`${c.sourceLang}-${c.targetLang}`);
      }
    });

    const sortedPairs = Array.from(pairs).sort();
    let optionsHtml = `<option value="all">${t('filterAllPairs')}</option>`;
    sortedPairs.forEach(p => {
      const [src, tgt] = p.split('-');
      optionsHtml += `<option value="${p}" ${p === selectedPair ? 'selected' : ''}>${src.toUpperCase()} → ${tgt.toUpperCase()}</option>`;
    });

    pairSelect.innerHTML = optionsHtml;
    pairSelect.value = selectedPair;
    pairSelect.onchange = (e) => {
      if (callbacks.onPairChange) callbacks.onPairChange(e.target.value);
    };
  }

  // 3. Highlight Session Mode Selector Pill
  document.querySelectorAll('.session-mode-pill').forEach(pill => {
    const pillType = pill.getAttribute('data-session');
    const isSelected = pillType === sessionType;
    pill.classList.toggle('active', isSelected);
    pill.setAttribute('aria-checked', String(isSelected));
  });

  // Calculate cards available in selected folders matching session type
  const now = new Date();
  const selectedCards = cards.filter(c => {
    if (selectedFolderIds.length > 0 && !selectedFolderIds.includes(c.folderId)) return false;
    if (activeMode !== 'all' && c.mode !== activeMode) return false;
    if (selectedPair !== 'all' && `${c.sourceLang}-${c.targetLang}` !== selectedPair) return false;
    return true;
  });

  let matchingCount = 0;
  if (sessionType === 'learning') {
    matchingCount = selectedCards.filter(c => c.status === STATUS.NEW || c.status === STATUS.LEARNING).length;
  } else if (sessionType === 'reviewing') {
    matchingCount = selectedCards.filter(c => (c.status === STATUS.REVIEW || c.status === STATUS.MASTERED) && new Date(c.nextReviewDate) <= now).length;
  } else {
    // Mixed
    matchingCount = selectedCards.filter(c => c.status === STATUS.NEW || c.status === STATUS.LEARNING || new Date(c.nextReviewDate) <= now).length;
  }

  // Update Launcher UI counts
  const summaryEl = document.getElementById('session-launcher-summary');
  const countBadge = document.getElementById('btn-session-count-badge');
  const readyBadge = document.getElementById('session-cards-ready-badge');
  const zeroFoldersAlert = document.getElementById('session-zero-folders-alert');
  const startBtn = document.getElementById('btn-start-session');

  const selectedFolderCount = selectedFolderIds.length;
  const totalFolderCount = folders.length;

  if (zeroFoldersAlert) {
    zeroFoldersAlert.classList.toggle('hidden', selectedFolderCount > 0);
  }

  if (summaryEl) {
    if (selectedFolderCount === 0) {
      summaryEl.textContent = t('selectFolderWarning');
    } else {
      summaryEl.textContent = `${t('selectedFoldersCount', { count: selectedFolderCount })} / ${totalFolderCount} • ${t('cardsReadyCount', { count: matchingCount })}`;
    }
  }

  if (countBadge) countBadge.textContent = String(matchingCount);
  if (readyBadge) readyBadge.textContent = t('cardsReadyCount', { count: matchingCount });

  if (startBtn) {
    startBtn.disabled = selectedFolderCount === 0 || matchingCount === 0;
    startBtn.style.opacity = (selectedFolderCount === 0 || matchingCount === 0) ? '0.5' : '1';
  }

  // 4. Render Folder Cards Grid
  const foldersGrid = document.getElementById('folder-cards-grid');
  const totalFoldersBadge = document.getElementById('folders-total-badge');
  if (totalFoldersBadge) totalFoldersBadge.textContent = String(folders.length);

  if (foldersGrid) {
    if (folders.length === 0) {
      foldersGrid.innerHTML = `
        <div style="grid-column: 1 / -1; padding: 32px; text-align: center; color: var(--text-muted); background: var(--bg-card); border-radius: var(--radius-lg); border: 1px dashed var(--border-color);">
          <p>${t('noFolders')}</p>
          <button type="button" class="btn btn-primary btn-sm" id="btn-empty-create-folder" style="margin-top: 12px;">+ ${t('createFolder')}</button>
        </div>
      `;
      const emptyBtn = document.getElementById('btn-empty-create-folder');
      if (emptyBtn && callbacks.onOpenCreateFolder) {
        emptyBtn.addEventListener('click', callbacks.onOpenCreateFolder);
      }
    } else {
      foldersGrid.innerHTML = folders.map(folder => {
        const isSelected = selectedFolderIds.includes(folder.id);
        const folderCards = cards.filter(c => c.folderId === folder.id);

        let dueCount = 0;
        let newCount = 0;
        folderCards.forEach(c => {
          if (c.status === STATUS.NEW) newCount++;
          else if (new Date(c.nextReviewDate) <= now) dueCount++;
        });

        const typeClass = folder.folderType === 'words' ? 'words' : (folder.folderType === 'definitions' ? 'definitions' : 'mixed');
        const typeLabel = folder.folderType === 'words' ? t('folderWords') : (folder.folderType === 'definitions' ? t('folderDefinitions') : t('folderMixed'));

        return `
          <div class="folder-card ${isSelected ? 'selected' : ''}" data-folder-id="${folder.id}">
            <div class="folder-card-top">
              <input type="checkbox" class="folder-checkbox" ${isSelected ? 'checked' : ''} aria-label="Select folder ${escapeHtml(folder.name)} for study">
              <div class="folder-card-info">
                <div class="folder-card-title-row">
                  <span class="folder-card-name">${escapeHtml(folder.name)}</span>
                  <span class="folder-type-badge ${typeClass}">${typeLabel}</span>
                </div>
                <div class="folder-counts-row">
                  <span class="folder-count-item"><span class="folder-count-due">${dueCount}</span> ${t('headerDue')}</span>
                  <span class="stat-pill-dot">·</span>
                  <span class="folder-count-item"><span class="folder-count-new">${newCount}</span> ${t('headerNew')}</span>
                  <span class="stat-pill-dot">·</span>
                  <span class="folder-count-item"><span>${folderCards.length}</span> ${t('totalCards')}</span>
                </div>
              </div>
            </div>

            <div class="folder-card-actions">
              <button type="button" class="btn btn-ghost btn-sm folder-action-browse" title="${t('navLibrary')}">🔍 ${t('navLibrary')}</button>
              <button type="button" class="btn btn-ghost btn-sm folder-action-add" title="${t('addNewCardBtn')}">+ ${t('addNewCardBtn')}</button>
              <button type="button" class="btn btn-ghost btn-sm folder-action-edit" title="${t('editFolder')}">✏️</button>
              <button type="button" class="btn btn-ghost btn-sm folder-action-delete" style="color: var(--color-danger);" title="${t('deleteFolder')}">🗑️</button>
            </div>
          </div>
        `;
      }).join('');

      // Attach Folder Event Handlers
      foldersGrid.querySelectorAll('.folder-card').forEach(cardEl => {
        const folderId = cardEl.getAttribute('data-folder-id');
        const checkbox = cardEl.querySelector('.folder-checkbox');

        // Checkbox click
        checkbox.addEventListener('change', (e) => {
          if (callbacks.onToggleFolder) callbacks.onToggleFolder(folderId, e.target.checked);
        });

        // Clicking card selects folder unless an action button was clicked
        cardEl.addEventListener('click', (e) => {
          if (e.target.closest('button') || e.target.closest('.folder-checkbox')) return;
          checkbox.checked = !checkbox.checked;
          if (callbacks.onToggleFolder) callbacks.onToggleFolder(folderId, checkbox.checked);
        });

        // Browse
        cardEl.querySelector('.folder-action-browse').addEventListener('click', () => {
          if (callbacks.onBrowseFolder) callbacks.onBrowseFolder(folderId);
        });

        // Add Card
        cardEl.querySelector('.folder-action-add').addEventListener('click', () => {
          if (callbacks.onAddCardToFolder) callbacks.onAddCardToFolder(folderId);
        });

        // Edit Folder
        cardEl.querySelector('.folder-action-edit').addEventListener('click', () => {
          if (callbacks.onEditFolder) callbacks.onEditFolder(folderId);
        });

        // Delete Folder
        cardEl.querySelector('.folder-action-delete').addEventListener('click', () => {
          if (callbacks.onDeleteFolder) callbacks.onDeleteFolder(folderId);
        });
      });
    }
  }

  // 5. Update Integrated Analytics & Performance Stats
  renderAnalytics(cards, reviewLogs, { activeMode, selectedPair });
}

function getRatingName(rating) {
  switch (rating) {
    case 1: return t('ratingAgain');
    case 2: return t('ratingHard');
    case 3: return t('ratingGood');
    case 4: return t('ratingEasy');
    default: return t('ratingGood');
  }
}

/**
 * Renders the Study screen for Word Mode
 * Strictly adheres to Section 3:
 *  - Path A: "Just Flip & Show" (Self-Evaluation: Remembered / Forgot + SRS ratings)
 *  - Path B: "Input / Type Answer" (The 3-Attempt Rule with auto-reveal and SRS state)
 */
export function renderWordStudyCard(card, queueInfo = {}, callbacks = {}) {
  const container = document.getElementById('study-active-area');
  if (!container) return;

  const {
    currentNumber = 1,
    remainingInSession = 1,
    totalInitial = 1,
    isRequeued = false
  } = queueInfo;

  const progressPct = Math.round((Math.max(0, totalInitial - remainingInSession + 1) / totalInitial) * 100);

  // Update header progress
  const counterEl = document.getElementById('study-progress-counter');
  const remainingEl = document.getElementById('study-queue-remaining');
  const progBarEl = document.getElementById('study-progress-bar');
  const modeInd = document.getElementById('study-mode-indicator');

  if (counterEl) counterEl.textContent = t('cardOf', { current: currentNumber, total: totalInitial });
  if (remainingEl) {
    remainingEl.textContent = isRequeued 
      ? `⚡ ${t('cardRequeued')}`
      : `${remainingInSession} ${t('headerDue').toLowerCase()}`;
    remainingEl.className = isRequeued ? 'badge badge-learning' : 'badge badge-new';
  }
  if (progBarEl) progBarEl.style.width = `${progressPct}%`;
  if (modeInd) modeInd.textContent = `${t('modeWords')} • ${card.sourceLang.toUpperCase()} → ${card.targetLang.toUpperCase()}`;

  const langCode = (card.sourceLang || 'en').toLowerCase();
  const targetLangCode = (card.targetLang || 'es').toLowerCase();
  card.currentAttempt = card.currentAttempt || 1;
  let attemptsRemaining = Math.max(1, 4 - card.currentAttempt);
  let isFlipped = false;

  container.innerHTML = `
    <div class="flashcard-wrapper" id="flashcard-wrapper">
      <div class="flashcard" id="study-flashcard" tabindex="0" role="button" aria-label="${t('clickToFlip')}">
        <!-- FRONT FACE -->
        <div class="flashcard-face flashcard-front">
          <div class="card-face-header">
            <span class="card-lang-tag">${card.sourceLang.toUpperCase()}</span>
            <div style="display: flex; align-items: center; gap: 8px;">
              <span class="attempt-badge ${attemptsRemaining === 1 ? 'danger' : (attemptsRemaining === 2 ? 'warning' : '')}" id="attempt-badge">
                ${t('attemptsRemaining', { n: attemptsRemaining })}
              </span>
              <button type="button" class="audio-btn" id="card-audio-btn-front" title="${t('pronounceWord')}">
                🔊
              </button>
            </div>
          </div>
          
          <div class="card-center-prompt">
            <h1 class="card-term">${escapeHtml(card.front)}</h1>
            ${card.transcription ? `<div class="card-transcription">[${escapeHtml(card.transcription)}]</div>` : ''}
            ${card.partOfSpeech ? `<span class="card-pos-tag">${escapeHtml(card.partOfSpeech)}</span>` : ''}
            ${card.contextSentence ? `
              <div class="card-context-quote" style="margin-top: 10px;">“${escapeHtml(card.contextSentence)}”</div>
            ` : ''}

            <!-- OPTION 2: ACTIVE INPUT (3 ATTEMPTS) -->
            <div class="word-recall-box" id="word-recall-box" onclick="event.stopPropagation();" style="margin-top: 20px;">
              <input type="text" id="word-recall-input" class="word-recall-input" placeholder="${t('typeYourTranslation')}" autocomplete="off" spellcheck="false" autofocus>
              <button type="button" id="word-recall-check-btn" class="btn btn-primary btn-sm">
                <span>✓</span>
                <span>${t('shortcutEnterSubmit')}</span>
              </button>
            </div>

            <!-- Feedback Alert for Attempts -->
            <div id="word-attempt-feedback" class="attempt-feedback-box hidden"></div>

            <div class="study-choice-divider">
              <span>${t('optionJustFlip')} (Space)</span>
            </div>

            <!-- OPTION 1: JUST FLIP BUTTON -->
            <button type="button" class="btn btn-secondary btn-sm" id="btn-just-flip" style="align-self: center;" onclick="event.stopPropagation();">
              <span>🔄</span>
              <span>${t('optionJustFlip')}</span>
            </button>
          </div>

          <div class="card-face-footer">
            <span>${t('pressSpaceToFlip')}</span>
            <span style="font-size: 0.75rem; color: var(--text-muted);">${t('sessionQueueRemaining', { count: remainingInSession })}</span>
          </div>
        </div>

        <!-- BACK FACE (REVEALED) -->
        <div class="flashcard-face flashcard-back">
          <div class="card-face-header">
            <span class="card-lang-tag">${card.targetLang.toUpperCase()}</span>
            <button type="button" class="audio-btn" id="card-audio-btn-back" title="${t('pronounceWord')}">
              🔊
            </button>
          </div>
          
          <div class="card-center-prompt">
            <div style="font-size: 1.1rem; color: var(--text-muted); margin-bottom: 2px;">
              ${escapeHtml(card.front)}
              ${card.transcription ? `<span style="font-family: monospace; font-size: 0.9rem; margin-left: 6px;">[${escapeHtml(card.transcription)}]</span>` : ''}
            </div>
            ${card.partOfSpeech ? `<span class="card-pos-tag" style="margin-bottom: 8px;">${escapeHtml(card.partOfSpeech)}</span>` : ''}
            <div class="card-translation-reveal">${escapeHtml(card.back)}</div>
            
            <!-- Recall Outcome Banner -->
            <div id="recall-feedback-banner" class="recall-feedback-banner hidden"></div>
            
            ${card.contextSentence ? `<div class="card-context-quote" style="margin-top: 12px;">“${escapeHtml(card.contextSentence)}”</div>` : ''}
          </div>

          <div class="card-face-footer">
            <span class="badge badge-${card.status}">${t(`status${capitalize(card.status)}`)}</span>
            <span style="font-size: 0.75rem; color: var(--text-muted);">EF: ${Number(card.easeFactor || 2.5).toFixed(2)}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Path A: Self-Evaluation Bar (Remembered vs Forgot) -->
    <div class="self-eval-bar hidden" id="self-eval-bar">
      <button type="button" class="btn-self-eval forgot" id="btn-self-forgot">
        <span>✗</span>
        <span>${t('selfGradeForgot')}</span>
      </button>
      <button type="button" class="btn-self-eval remembered" id="btn-self-remembered">
        <span>✓</span>
        <span>${t('selfGradeRemembered')}</span>
      </button>
    </div>

    <!-- Rating Buttons Bar (Hidden initially, revealed when flipped) -->
    <div class="srs-ratings-bar hidden" id="study-ratings-bar">
      <button type="button" class="rating-btn again" data-rating="1" title="Shortcut: 1 (Re-queue to end of session)">
        <span class="rating-label">${t('failCardBtn')}</span>
        <span class="rating-hint">${t('cardRequeued')}</span>
        <span class="rating-key-badge">1</span>
      </button>

      <button type="button" class="rating-btn hard" data-rating="2" title="Shortcut: 2">
        <span class="rating-label">${t('ratingHard')}</span>
        <span class="rating-hint">~${Math.max(1, Math.round((card.interval || 0) * 1.2))}d</span>
        <span class="rating-key-badge">2</span>
      </button>

      <button type="button" class="rating-btn good" data-rating="3" title="Shortcut: 3 (Pass - removes from session)">
        <span class="rating-label">${t('passCardBtn')}</span>
        <span class="rating-hint">${t('cardPassed')}</span>
        <span class="rating-key-badge">3</span>
      </button>

      <button type="button" class="rating-btn easy" data-rating="4" title="Shortcut: 4 (Easy - accelerated interval)">
        <span class="rating-label">${t('ratingEasy')}</span>
        <span class="rating-hint">~${card.repetitions === 0 ? 4 : Math.round((card.interval || 1) * (card.easeFactor || 2.5) * 1.3)}d</span>
        <span class="rating-key-badge">4</span>
      </button>
    </div>

    <!-- Success Next Bar (shown when word is answered correctly via typing) -->
    <div id="pass-continue-bar" class="hidden" style="margin-top: 14px; text-align: center;">
      <button type="button" class="btn btn-primary btn-lg" id="btn-word-next" style="width: 100%; display: flex; align-items: center; justify-content: center; gap: 8px;">
        <span>${t('nextCard')} →</span>
        <kbd class="kbd-badge" style="background: rgba(255,255,255,0.25); color: #fff; font-size: 0.75rem;">Enter</kbd>
      </button>
    </div>

    <!-- Failure Re-queue Continue Bar (shown when 3 attempts fail) -->
    <div id="requeue-continue-bar" class="hidden" style="margin-top: 12px; text-align: center;">
      <button type="button" class="btn btn-danger btn-lg" id="btn-requeue-continue" style="width: 100%;">
        <span>🔄</span>
        <span>${t('continueRequeued')} (Enter)</span>
      </button>
    </div>
  `;

  const flashcardEl = document.getElementById('study-flashcard');
  const selfEvalBar = document.getElementById('self-eval-bar');
  const ratingsBar = document.getElementById('study-ratings-bar');
  const requeueBar = document.getElementById('requeue-continue-bar');
  const recallInput = document.getElementById('word-recall-input');
  const recallCheckBtn = document.getElementById('word-recall-check-btn');
  const attemptBadge = document.getElementById('attempt-badge');
  const attemptFeedback = document.getElementById('word-attempt-feedback');
  const feedbackBanner = document.getElementById('recall-feedback-banner');
  const btnJustFlip = document.getElementById('btn-just-flip');
  const btnSelfRemembered = document.getElementById('btn-self-remembered');
  const btnSelfForgot = document.getElementById('btn-self-forgot');

  // Audio pronunciation listeners
  const frontAudioBtn = document.getElementById('card-audio-btn-front');
  const backAudioBtn = document.getElementById('card-audio-btn-back');

  const playFrontAudio = async () => {
    if (frontAudioBtn) frontAudioBtn.classList.add('speaking');
    try {
      await speakText(card.front, langCode);
    } finally {
      if (frontAudioBtn) frontAudioBtn.classList.remove('speaking');
    }
  };

  const playBackAudio = async () => {
    if (backAudioBtn) backAudioBtn.classList.add('speaking');
    try {
      await speakText(card.back, targetLangCode);
    } finally {
      if (backAudioBtn) backAudioBtn.classList.remove('speaking');
    }
  };

  if (frontAudioBtn) frontAudioBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    playFrontAudio();
  });
  if (backAudioBtn) backAudioBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    playBackAudio();
  });

  // Path A: Just Flip card
  const doFlip = () => {
    if (isFlipped) return;
    isFlipped = true;
    flashcardEl.classList.add('flipped');
    if (selfEvalBar) selfEvalBar.classList.remove('hidden');
    if (ratingsBar) ratingsBar.classList.remove('hidden');
    playBackAudio();
  };

  if (btnJustFlip) btnJustFlip.addEventListener('click', doFlip);

  flashcardEl.addEventListener('click', (e) => {
    if (e.target.closest('.audio-btn') || e.target.closest('#word-recall-box') || e.target.closest('#btn-just-flip') || e.target.closest('#pass-continue-bar')) return;
    if (!isFlipped) doFlip();
  });

  // Self-Evaluation Listeners (Path A)
  if (btnSelfRemembered) {
    btnSelfRemembered.addEventListener('click', () => {
      const outcome = card.hadErrorInSession ? 'recovered' : 'clean';
      if (callbacks.onPass) callbacks.onPass(outcome, { rating: RATING.GOOD });
    });
  }

  if (btnSelfForgot) {
    btnSelfForgot.addEventListener('click', () => {
      if (callbacks.onFail) callbacks.onFail();
      if (callbacks.onNext) callbacks.onNext();
    });
  }

  // Path B: Active Recall Typing Submit with 3-Attempt Rule
  const handleRecallSubmit = () => {
    if (isFlipped) return;
    const typed = recallInput ? recallInput.value.trim() : '';
    if (!typed) {
      if (recallInput) recallInput.focus();
      return;
    }

    const isMatch = evaluateWordAnswer(typed, card.back);

    if (isMatch) {
      // SUCCESS!
      isFlipped = true;
      flashcardEl.classList.add('flipped');
      playBackAudio();

      const outcome = card.hadErrorInSession 
        ? 'recovered' 
        : (card.currentAttempt === 1 ? 'clean' : 'assisted');

      if (feedbackBanner) {
        feedbackBanner.classList.remove('hidden');
        feedbackBanner.className = 'recall-feedback-banner match-good';
        feedbackBanner.textContent = card.currentAttempt === 1 
          ? t('correctAttempt1') 
          : (card.currentAttempt === 2 ? t('correctAttempt2') : t('correctAttempt3'));
      }

      ratingsBar.classList.remove('hidden');
      ratingsBar.querySelectorAll('.rating-btn').forEach(btn => {
        const btnRating = parseInt(btn.getAttribute('data-rating'), 10);
        const matchRating = outcome === 'clean' ? RATING.GOOD : (outcome === 'assisted' ? RATING.HARD : RATING.AGAIN);
        btn.classList.toggle('active-srs-grade', btnRating === matchRating);
      });

      const passBar = document.getElementById('pass-continue-bar');
      if (passBar) passBar.classList.remove('hidden');

      const btnWordNext = document.getElementById('btn-word-next');
      if (btnWordNext) {
        btnWordNext.focus();
        btnWordNext.onclick = () => {
          if (callbacks.onPass) {
            callbacks.onPass(outcome, { rating: outcome === 'assisted' ? RATING.HARD : RATING.GOOD });
          }
        };
      }
    } else {
      // INCORRECT ATTEMPT
      if (card.currentAttempt === 1) {
        card.currentAttempt = 2;
        attemptsRemaining = 2;
        if (attemptBadge) {
          attemptBadge.textContent = t('attemptsRemaining', { n: 2 });
          attemptBadge.className = 'attempt-badge warning';
        }
        if (attemptFeedback) {
          attemptFeedback.classList.remove('hidden');
          attemptFeedback.className = 'attempt-feedback-box error';
          attemptFeedback.textContent = "Incorrect — 2 attempts remaining";
        }
        if (recallInput) {
          recallInput.classList.remove('shake');
          void recallInput.offsetWidth;
          recallInput.classList.add('shake');
          recallInput.value = '';
          recallInput.focus();
        }
      } else if (card.currentAttempt === 2) {
        card.currentAttempt = 3;
        attemptsRemaining = 1;
        if (attemptBadge) {
          attemptBadge.textContent = t('attemptsRemaining', { n: 1 });
          attemptBadge.className = 'attempt-badge danger';
        }
        if (attemptFeedback) {
          attemptFeedback.classList.remove('hidden');
          attemptFeedback.className = 'attempt-feedback-box error';
          attemptFeedback.textContent = "Incorrect — 1 attempt remaining";
        }
        if (recallInput) {
          recallInput.classList.remove('shake');
          void recallInput.offsetWidth;
          recallInput.classList.add('shake');
          recallInput.value = '';
          recallInput.focus();
        }
      } else {
        // 3 ATTEMPTS EXHAUSTED: Reveal correct answer & mark failed (re-queue)
        isFlipped = true;
        flashcardEl.classList.add('flipped');
        playBackAudio();

        if (attemptBadge) {
          attemptBadge.textContent = '0 left';
          attemptBadge.className = 'attempt-badge danger';
        }

        if (feedbackBanner) {
          feedbackBanner.classList.remove('hidden');
          feedbackBanner.className = 'recall-feedback-banner match-divergent';
          feedbackBanner.textContent = t('attemptsExhausted');
        }

        requeueBar.classList.remove('hidden');

        if (callbacks.onFail) {
          callbacks.onFail();
        }

        const btnRequeueContinue = document.getElementById('btn-requeue-continue');
        if (btnRequeueContinue) {
          btnRequeueContinue.focus();
          btnRequeueContinue.onclick = () => {
            if (callbacks.onNext) callbacks.onNext();
          };
        }
      }
    }
  };

  if (recallCheckBtn) recallCheckBtn.addEventListener('click', handleRecallSubmit);
  if (recallInput) {
    recallInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        handleRecallSubmit();
      }
    });
  }

  // Rating buttons listeners (for Option 1 or granular manual grading)
  ratingsBar.querySelectorAll('.rating-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const rating = parseInt(btn.getAttribute('data-rating'), 10);
      if (rating === RATING.AGAIN) {
        if (callbacks.onFail) callbacks.onFail();
        if (callbacks.onNext) callbacks.onNext();
      } else if (rating === RATING.HARD) {
        if (callbacks.onPass) callbacks.onPass('assisted', { rating: RATING.HARD });
      } else if (rating === RATING.EASY) {
        if (callbacks.onPass) callbacks.onPass('clean', { rating: RATING.EASY, isEasy: true });
      } else {
        if (callbacks.onPass) callbacks.onPass(card.hadErrorInSession ? 'recovered' : 'clean', { rating: RATING.GOOD });
      }
    });
  });

  return {
    flip: doFlip,
    speak: playFrontAudio,
    isFlipped: () => isFlipped
  };
}

/**
 * Renders the Study screen for Definition Practice Mode
 * Strictly adheres to Section 4.2 & Section 3:
 *  - Path A: "Just Flip Card" (<kbd>Space</kbd>)
 *  - Path B: 3-Attempt Fuzzy Semantic Evaluation with Keyword Coverage & Dice coefficient
 *  - Visual similarity score, missing key concept hints, side-by-side diff
 *  - Manual "Override: Mark as Correct" button after reveal
 */
export function renderDefinitionStudyCard(card, queueInfo = {}, callbacks = {}) {
  const container = document.getElementById('study-active-area');
  if (!container) return;

  const {
    currentNumber = 1,
    remainingInSession = 1,
    totalInitial = 1,
    isRequeued = false
  } = queueInfo;

  const progressPct = Math.round((Math.max(0, totalInitial - remainingInSession + 1) / totalInitial) * 100);

  // Update header progress
  const counterEl = document.getElementById('study-progress-counter');
  const remainingEl = document.getElementById('study-queue-remaining');
  const progBarEl = document.getElementById('study-progress-bar');
  const modeInd = document.getElementById('study-mode-indicator');

  if (counterEl) counterEl.textContent = t('cardOf', { current: currentNumber, total: totalInitial });
  if (remainingEl) {
    remainingEl.textContent = isRequeued 
      ? `⚡ ${t('cardRequeued')}`
      : `${remainingInSession} ${t('headerDue').toLowerCase()}`;
    remainingEl.className = isRequeued ? 'badge badge-learning' : 'badge badge-new';
  }
  if (progBarEl) progBarEl.style.width = `${progressPct}%`;
  if (modeInd) modeInd.textContent = `${t('modeDefinitions')} • ${card.sourceLang.toUpperCase()}`;

  const langCode = (card.sourceLang || 'en').toLowerCase();
  card.currentAttempt = card.currentAttempt || 1;
  let attemptsRemaining = Math.max(1, 4 - card.currentAttempt);
  let evaluated = false;

  container.innerHTML = `
    <div class="definition-card">
      <div class="definition-header">
        <span class="card-lang-tag">${langCode.toUpperCase()} ${t('defPracticeHeader')}</span>
        <div style="display: flex; align-items: center; gap: 8px;">
          <span class="attempt-badge ${attemptsRemaining === 1 ? 'danger' : (attemptsRemaining === 2 ? 'warning' : '')}" id="def-attempt-badge">
            ${t('attemptsRemaining', { n: attemptsRemaining })}
          </span>
          <button type="button" class="audio-btn" id="def-audio-btn" title="${t('pronounceWord')}">🔊</button>
        </div>
      </div>

      <div class="definition-prompt-box">
        <h1 class="definition-term">${escapeHtml(card.front)}</h1>
        ${card.transcription ? `<div class="card-transcription">[${escapeHtml(card.transcription)}]</div>` : ''}
        ${card.partOfSpeech ? `<span class="card-pos-tag">${escapeHtml(card.partOfSpeech)}</span>` : ''}
        ${card.contextSentence ? `
          <div style="font-size: 0.9rem; font-style: italic; color: var(--text-muted); margin-top: 6px;">
            ${t('contextLabel')}: “${escapeHtml(card.contextSentence)}”
          </div>
        ` : ''}
      </div>

      <!-- User Active Typing Area -->
      <div class="definition-input-area" id="def-input-area">
        <textarea id="def-user-input" class="definition-textarea" placeholder="${t('typeYourDefinition')}" autofocus></textarea>
        <div class="definition-submit-bar" style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px;">
          <button type="button" class="btn btn-ghost btn-sm" id="btn-def-flip">
            <span>🔄</span>
            <span>${t('optionJustFlip')} (Space)</span>
          </button>

          <button type="button" class="btn btn-primary" id="def-submit-btn">
            <span>✓</span>
            <span>${t('submitAnswer')} (Enter)</span>
          </button>
        </div>
      </div>

      <!-- Attempt Hint Banner -->
      <div id="def-attempt-hint" class="attempt-feedback-box hidden" style="margin-top: 10px;"></div>

      <!-- Fuzzy Evaluation Results Box -->
      <div id="def-eval-container" class="hidden"></div>

      <!-- Self-Evaluation Bar for Just Flip (Remembered vs Forgot) -->
      <div class="self-eval-bar hidden" id="def-self-eval-bar">
        <button type="button" class="btn-self-eval forgot" id="btn-def-self-forgot">
          <span>✗</span>
          <span>${t('selfGradeForgot')}</span>
        </button>
        <button type="button" class="btn-self-eval remembered" id="btn-def-self-remembered">
          <span>✓</span>
          <span>${t('selfGradeRemembered')}</span>
        </button>
      </div>

      <!-- SRS Ratings Toolbar -->
      <div class="srs-ratings-bar hidden" id="def-ratings-bar">
        <button type="button" class="rating-btn again" data-rating="1">
          <span class="rating-label">${t('failCardBtn')}</span>
          <span class="rating-hint">${t('cardRequeued')}</span>
          <span class="rating-key-badge">1</span>
        </button>
        <button type="button" class="rating-btn hard" data-rating="2">
          <span class="rating-label">${t('ratingHard')}</span>
          <span class="rating-hint">${t('ratingHard')}</span>
          <span class="rating-key-badge">2</span>
        </button>
        <button type="button" class="rating-btn good" data-rating="3">
          <span class="rating-label">${t('passCardBtn')}</span>
          <span class="rating-hint">${t('cardPassed')}</span>
          <span class="rating-key-badge">3</span>
        </button>
        <button type="button" class="rating-btn easy" data-rating="4">
          <span class="rating-label">${t('ratingEasy')}</span>
          <span class="rating-hint">${t('ratingEasy')}</span>
          <span class="rating-key-badge">4</span>
        </button>
      </div>

      <!-- Re-queue continue & override bar (shown when 3 attempts fail) -->
      <div id="def-requeue-bar" class="hidden" style="margin-top: 14px; text-align: center;">
        <div style="display: flex; gap: 10px; justify-content: center; flex-wrap: wrap;">
          <button type="button" class="btn btn-secondary btn-lg" id="btn-def-override">
            <span>✓</span>
            <span>${t('overrideCorrectBtn')}</span>
          </button>
          <button type="button" class="btn btn-danger btn-lg" id="btn-def-requeue-continue" style="flex: 1;">
            <span>🔄</span>
            <span>${t('continueRequeued')} (Enter)</span>
          </button>
        </div>
      </div>
    </div>
  `;

  const audioBtn = document.getElementById('def-audio-btn');
  const userInput = document.getElementById('def-user-input');
  const submitBtn = document.getElementById('def-submit-btn');
  const btnDefFlip = document.getElementById('btn-def-flip');
  const evalContainer = document.getElementById('def-eval-container');
  const selfEvalBar = document.getElementById('def-self-eval-bar');
  const ratingsBar = document.getElementById('def-ratings-bar');
  const requeueBar = document.getElementById('def-requeue-bar');
  const attemptBadge = document.getElementById('def-attempt-badge');
  const attemptHint = document.getElementById('def-attempt-hint');
  const btnDefSelfRemembered = document.getElementById('btn-def-self-remembered');
  const btnDefSelfForgot = document.getElementById('btn-def-self-forgot');

  const playAudio = async () => {
    if (audioBtn) audioBtn.classList.add('speaking');
    try {
      await speakText(card.front, langCode);
    } finally {
      if (audioBtn) audioBtn.classList.remove('speaking');
    }
  };

  if (audioBtn) audioBtn.addEventListener('click', playAudio);

  // Path A: "Just Flip" definition action
  const handleJustFlip = () => {
    if (evaluated) return;
    evaluated = true;
    userInput.disabled = true;
    submitBtn.classList.add('hidden');
    btnDefFlip.classList.add('hidden');

    playAudio();

    // Run evaluation against empty string to show reference diff
    const evalResult = evaluateDefinition('', card.back, card.keyConcepts, langCode);
    renderEvaluationResults(evalResult, false, false);
    if (selfEvalBar) selfEvalBar.classList.remove('hidden');
    if (ratingsBar) ratingsBar.classList.remove('hidden');
  };

  if (btnDefFlip) btnDefFlip.addEventListener('click', handleJustFlip);

  if (btnDefSelfRemembered) {
    btnDefSelfRemembered.addEventListener('click', () => {
      const outcome = card.hadErrorInSession ? 'recovered' : 'clean';
      if (callbacks.onPass) callbacks.onPass(outcome, { rating: RATING.GOOD });
    });
  }

  if (btnDefSelfForgot) {
    btnDefSelfForgot.addEventListener('click', () => {
      if (callbacks.onFail) callbacks.onFail();
      if (callbacks.onNext) callbacks.onNext();
    });
  }

  // Renders the diff and results
  const renderEvaluationResults = (evalResult, isPassed = false, showAcceptGrade = true) => {
    evalContainer.classList.remove('hidden');

    const tierClass = `score-${evalResult.tier}`;
    const tierLabel = evalResult.tier === 'accurate' 
      ? t('evalAccurate') 
      : (evalResult.tier === 'partial' ? t('evalPartial') : t('evalDivergent'));

    evalContainer.innerHTML = `
      <div class="evaluation-results">
        <div class="evaluation-summary-header">
          <div class="similarity-score-pill ${tierClass}">
            <span>${evalResult.scorePercent}%</span>
            <span>${tierLabel}</span>
          </div>

          <div style="font-size: 0.85rem; color: var(--text-secondary); display: flex; gap: 14px;">
            <span>${t('coverageLabel')}: <strong>${evalResult.metrics.keywordCoverage}%</strong></span>
            <span>Dice: <strong>${evalResult.metrics.diceSimilarity}%</strong></span>
          </div>
        </div>

        <!-- Key Concepts Chips -->
        ${evalResult.conceptMatches.length > 0 ? `
          <div>
            <div style="font-size: 0.75rem; font-weight: 700; color: var(--text-secondary); margin-bottom: 4px;">
              ${t('keyConceptsMatched')}:
            </div>
            <div class="concepts-row">
              ${evalResult.conceptMatches.map(c => `
                <span class="concept-tag ${c.matched ? 'matched' : 'missing'}">
                  ${c.matched ? '✓' : '✗'} ${escapeHtml(c.concept)}
                </span>
              `).join('')}
            </div>
          </div>
        ` : ''}

        <!-- Side-by-Side Diff Comparison -->
        <div class="diff-container">
          <div class="diff-column">
            <span class="diff-title">${t('referenceDefinition')}</span>
            <div class="diff-content">${evalResult.diff.refHtml}</div>
          </div>
          <div class="diff-column">
            <span class="diff-title">${t('yourAnswer')}</span>
            <div class="diff-content">${evalResult.diff.userHtml}</div>
          </div>
        </div>

        <!-- Grade acceptance & override bar -->
        ${showAcceptGrade ? `
          <div class="eval-action-bar">
            <button type="button" class="btn btn-primary btn-sm" id="btn-accept-grade">
              <span>✓ ${t('acceptGrade')} (${getRatingName(evalResult.suggestedRating)})</span>
            </button>
            <span style="font-size: 0.8rem; color: var(--text-muted);">${t('manualOverride')}:</span>
          </div>
        ` : ''}
      </div>
    `;

    if (showAcceptGrade) {
      const acceptBtn = document.getElementById('btn-accept-grade');
      if (acceptBtn) {
        acceptBtn.focus();
        acceptBtn.addEventListener('click', () => {
          const outcome = card.hadErrorInSession 
            ? 'recovered' 
            : (card.currentAttempt === 1 ? 'clean' : 'assisted');
          if (callbacks.onPass) callbacks.onPass(outcome, { rating: evalResult.suggestedRating });
        });
      }
    }
  };

  // Path B: 3-Attempt Fuzzy Evaluation Handler (Section 4.2)
  const doEvaluate = () => {
    if (evaluated) return;
    const userText = userInput.value.trim();
    if (!userText) {
      userInput.focus();
      return;
    }

    const evalResult = evaluateDefinition(userText, card.back, card.keyConcepts, langCode);

    if (evalResult.isPassed) {
      // ACCURATE MATCH (>= 75%): Pass turn & remove from session!
      evaluated = true;
      userInput.disabled = true;
      submitBtn.classList.add('hidden');
      btnDefFlip.classList.add('hidden');

      renderEvaluationResults(evalResult, true, true);
      ratingsBar.classList.remove('hidden');

      const outcome = card.hadErrorInSession
        ? 'recovered'
        : (card.currentAttempt === 1 ? 'clean' : 'assisted');

      ratingsBar.querySelectorAll('.rating-btn').forEach(btn => {
        const btnRating = parseInt(btn.getAttribute('data-rating'), 10);
        btn.classList.toggle('active-srs-grade', btnRating === evalResult.suggestedRating);
      });
    } else {
      // PARTIAL OR DIVERGENT MATCH (< 75%)
      if (card.currentAttempt === 1) {
        card.currentAttempt = 2;
        attemptsRemaining = 2;
        if (attemptBadge) {
          attemptBadge.textContent = t('attemptsRemaining', { n: 2 });
          attemptBadge.className = 'attempt-badge warning';
        }

        if (attemptHint) {
          attemptHint.classList.remove('hidden');
          attemptHint.className = 'attempt-feedback-box error';
          attemptHint.textContent = `${evalResult.scorePercent}% Match — Incorrect, 2 attempts remaining (${evalResult.missingCount} key concepts missing)`;
        }

        userInput.focus();
      } else if (card.currentAttempt === 2) {
        card.currentAttempt = 3;
        attemptsRemaining = 1;
        if (attemptBadge) {
          attemptBadge.textContent = t('attemptsRemaining', { n: 1 });
          attemptBadge.className = 'attempt-badge danger';
        }

        if (attemptHint) {
          attemptHint.classList.remove('hidden');
          attemptHint.className = 'attempt-feedback-box error';
          attemptHint.textContent = `${evalResult.scorePercent}% Match — Incorrect, 1 attempt remaining (${evalResult.missingCount} key concepts missing)`;
        }

        userInput.focus();
      } else {
        // 3 ATTEMPTS EXHAUSTED: Reveal full diff and mark failed (re-queue)
        evaluated = true;
        userInput.disabled = true;
        submitBtn.classList.add('hidden');
        btnDefFlip.classList.add('hidden');

        if (attemptBadge) {
          attemptBadge.textContent = '0 left';
          attemptBadge.className = 'attempt-badge danger';
        }

        if (attemptHint) {
          attemptHint.classList.remove('hidden');
          attemptHint.className = 'attempt-feedback-box error';
          attemptHint.textContent = t('attemptsExhausted');
        }

        renderEvaluationResults(evalResult, false, false);
        requeueBar.classList.remove('hidden');

        if (callbacks.onFail) {
          callbacks.onFail();
        }

        // Override button: allows learner to override and mark as correct
        const btnOverride = document.getElementById('btn-def-override');
        if (btnOverride) {
          btnOverride.onclick = () => {
            if (callbacks.onOverride) {
              callbacks.onOverride();
            } else if (callbacks.onPass) {
              callbacks.onPass('assisted');
            }
            showToast(t('overrideSuccessToast'));
          };
        }

        const btnRequeue = document.getElementById('btn-def-requeue-continue');
        if (btnRequeue) {
          btnRequeue.focus();
          btnRequeue.addEventListener('click', () => {
            if (callbacks.onNext) callbacks.onNext();
          });
        }
      }
    }
  };

  submitBtn.addEventListener('click', doEvaluate);
  userInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      doEvaluate();
    }
  });

  // Rating buttons listeners for manual override
  ratingsBar.querySelectorAll('.rating-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const rating = parseInt(btn.getAttribute('data-rating'), 10);
      if (rating === RATING.AGAIN) {
        if (callbacks.onFail) callbacks.onFail();
        if (callbacks.onNext) callbacks.onNext();
      } else if (rating === RATING.HARD) {
        if (callbacks.onPass) callbacks.onPass('assisted', { rating: RATING.HARD });
      } else if (rating === RATING.EASY) {
        if (callbacks.onPass) callbacks.onPass('clean', { rating: RATING.EASY, isEasy: true });
      } else {
        if (callbacks.onPass) callbacks.onPass(card.hadErrorInSession ? 'recovered' : 'clean', { rating: RATING.GOOD });
      }
    });
  });

  return {
    evaluate: doEvaluate,
    flip: handleJustFlip,
    speak: playAudio,
    isEvaluated: () => evaluated
  };
}

/**
 * Renders the session completed congratulatory card with mastery stats
 */
export function renderSessionCompleted(summary = {}, onReturn = () => {}) {
  const container = document.getElementById('study-active-area');
  if (!container) return;

  const {
    totalMastered = 0,
    cleanPassCount = 0,
    assistedPassCount = 0,
    recoveredPassCount = 0
  } = summary;

  container.innerHTML = `
    <div class="session-completed-card">
      <div class="completed-icon">🎉</div>
      <h2 style="font-size: 1.6rem; font-weight: 700; color: var(--text-primary); margin-bottom: 4px;">
        ${t('congratsTitle')}
      </h2>
      <p style="color: var(--text-secondary); font-size: 0.95rem; margin-bottom: 12px;">
        ${t('congratsMsg', { count: totalMastered })}
      </p>

      <div class="dashboard-metrics-grid" style="grid-template-columns: repeat(3, 1fr); width: 100%; margin: 12px 0;">
        <div class="stat-box" style="padding: 12px 8px; text-align: center;">
          <span class="stat-box-label">${t('statCleanPasses')}</span>
          <span class="stat-box-value" style="color: var(--color-success); font-size: 1.4rem;">${cleanPassCount}</span>
        </div>
        <div class="stat-box" style="padding: 12px 8px; text-align: center;">
          <span class="stat-box-label">${t('statAssistedPasses')}</span>
          <span class="stat-box-value" style="color: var(--color-warning); font-size: 1.4rem;">${assistedPassCount}</span>
        </div>
        <div class="stat-box" style="padding: 12px 8px; text-align: center;">
          <span class="stat-box-label">${t('statRecoveredPasses')}</span>
          <span class="stat-box-value" style="color: var(--color-purple); font-size: 1.4rem;">${recoveredPassCount}</span>
        </div>
      </div>

      <button type="button" class="btn btn-primary btn-lg" id="btn-session-return" style="margin-top: 14px;">
        <span>←</span>
        <span>${t('backToDashboard')}</span>
      </button>
    </div>
  `;

  const btnReturn = document.getElementById('btn-session-return');
  if (btnReturn) btnReturn.addEventListener('click', onReturn);
}

/**
 * Renders the library table of all cards with folder badges & move action
 */
export function renderLibraryTable(cards, folders = [], callbacks = {}) {
  const tbody = document.getElementById('library-table-body');
  if (!tbody) return;

  const folderMap = new Map();
  folders.forEach(f => folderMap.set(f.id, f));

  if (cards.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="9" style="text-align: center; padding: 36px; color: var(--text-muted);">
          ${t('noCardsFound')}
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = cards.map(card => {
    const dueDate = new Date(card.nextReviewDate);
    const isDue = dueDate <= new Date();
    const dueFormatted = dueDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    const folder = folderMap.get(card.folderId);
    const folderName = folder ? folder.name : 'General';

    return `
      <tr data-card-id="${card.id}">
        <td class="cell-term">
          <div style="font-weight: 600;">${escapeHtml(card.front)}</div>
          ${card.transcription ? `<div style="font-size: 0.78rem; font-family: monospace; color: var(--text-muted);">[${escapeHtml(card.transcription)}]</div>` : ''}
          ${card.partOfSpeech ? `<span class="badge" style="font-size: 0.65rem; background: var(--bg-tertiary); color: var(--text-secondary);">${escapeHtml(card.partOfSpeech)}</span>` : ''}
        </td>
        <td class="cell-translation" title="${escapeHtml(card.back)}">${escapeHtml(card.back)}</td>
        <td>
          <span class="badge" style="background: var(--bg-tertiary); max-width: 140px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" title="${escapeHtml(folderName)}">
            📁 ${escapeHtml(folderName)}
          </span>
        </td>
        <td><span class="badge" style="background: var(--bg-tertiary);">${(card.sourceLang || 'en').toUpperCase()} → ${(card.targetLang || 'es').toUpperCase()}</span></td>
        <td><span class="badge ${card.mode === 'word' ? 'badge-new' : 'badge-review'}">${card.mode}</span></td>
        <td><span class="badge badge-${card.status}">${t(`status${capitalize(card.status)}`)}</span></td>
        <td style="font-variant-numeric: tabular-nums;">${card.interval}d (EF ${Number(card.easeFactor || 2.5).toFixed(2)})</td>
        <td style="color: ${isDue ? 'var(--color-danger)' : 'var(--text-secondary)'}; font-weight: ${isDue ? '700' : 'normal'};">
          ${isDue ? t('dueTodayLabel') : dueFormatted}
        </td>
        <td class="cell-actions">
          <button type="button" class="btn btn-secondary btn-sm action-edit" title="${t('editCard')}">✏️</button>
          <button type="button" class="btn btn-secondary btn-sm action-move" title="${t('moveToFolder')}">📁</button>
          <button type="button" class="btn btn-secondary btn-sm action-reset" title="${t('resetSRS')}">🔄</button>
          <button type="button" class="btn btn-secondary btn-sm action-delete" style="color: var(--color-danger);" title="${t('deleteCard')}">🗑️</button>
        </td>
      </tr>
    `;
  }).join('');

  // Attach table action event listeners
  tbody.querySelectorAll('.action-edit').forEach(btn => {
    btn.addEventListener('click', () => {
      const cardId = btn.closest('tr').getAttribute('data-card-id');
      if (callbacks.onEdit) callbacks.onEdit(cardId);
    });
  });

  tbody.querySelectorAll('.action-move').forEach(btn => {
    btn.addEventListener('click', () => {
      const cardId = btn.closest('tr').getAttribute('data-card-id');
      if (callbacks.onMove) callbacks.onMove(cardId);
    });
  });

  tbody.querySelectorAll('.action-reset').forEach(btn => {
    btn.addEventListener('click', () => {
      const cardId = btn.closest('tr').getAttribute('data-card-id');
      if (callbacks.onReset) callbacks.onReset(cardId);
    });
  });

  tbody.querySelectorAll('.action-delete').forEach(btn => {
    btn.addEventListener('click', () => {
      const cardId = btn.closest('tr').getAttribute('data-card-id');
      if (callbacks.onDelete) callbacks.onDelete(cardId);
    });
  });
}


export function renderAnalytics(cards, logs, options = {}) {
  const { activeMode = 'all', selectedPair = 'all' } = options;
  const stats = options.stats || computeStats(cards, logs, { mode: activeMode, pair: selectedPair });

  const total = stats.totalCards || 1;
  const newPct = Math.round((stats.newCount / total) * 100);
  const learnPct = Math.round((stats.learningCount / total) * 100);
  const reviewPct = Math.round((stats.reviewCount / total) * 100);
  const masteredPct = Math.round((stats.masteredCount / total) * 100);

  // Consolidated progress bar
  const pBar = document.getElementById('dashboard-progress-bar');
  if (pBar) {
    pBar.innerHTML = `
      <div class="progress-segment new" style="width: ${newPct}%" title="${t('statNew')}: ${stats.newCount}"></div>
      <div class="progress-segment learning" style="width: ${learnPct}%" title="${t('statLearning')}: ${stats.learningCount}"></div>
      <div class="progress-segment review" style="width: ${reviewPct}%" title="${t('statReview')}: ${stats.reviewCount}"></div>
      <div class="progress-segment mastered" style="width: ${masteredPct}%" title="${t('statMastered')}: ${stats.masteredCount}"></div>
    `;
  }

  const lNew = document.getElementById('bar-label-new');
  const lLearn = document.getElementById('bar-label-learning');
  const lRev = document.getElementById('bar-label-review');
  const lMast = document.getElementById('bar-label-mastered');

  if (lNew) lNew.textContent = `${t('statNew')}: ${stats.newCount}`;
  if (lLearn) lLearn.textContent = `${t('statLearning')}: ${stats.learningCount}`;
  if (lRev) lRev.textContent = `${t('statReview')}: ${stats.reviewCount}`;
  if (lMast) lMast.textContent = `${t('statMastered')}: ${stats.masteredCount}`;

  // Metric boxes
  const dueBox = document.getElementById('stat-due-today');
  const totalBox = document.getElementById('stat-total-cards');
  const retBox = document.getElementById('stat-retention-rate');
  const mastBox = document.getElementById('stat-mastered-cards');
  const totalRevEl = document.getElementById('stats-total-reviews');
  const avgEaseEl = document.getElementById('stats-avg-ease');

  if (dueBox) dueBox.textContent = stats.dueTodayCount;
  if (totalBox) totalBox.textContent = stats.totalCards;
  if (retBox) retBox.textContent = `${stats.retentionRate}%`;
  if (mastBox) mastBox.textContent = stats.masteredCount;
  if (totalRevEl) totalRevEl.textContent = stats.totalReviews;
  if (avgEaseEl) avgEaseEl.textContent = stats.avgEase;

  // Detailed distribution breakdown
  const distEl = document.getElementById('stats-distribution-breakdown');
  if (distEl) {
    distEl.innerHTML = `
      <div style="display: flex; justify-content: space-between; font-size: 0.85rem;">
        <span>${t('statNew')}</span>
        <strong>${stats.newCount} (${newPct}%)</strong>
      </div>
      <div class="progress-bar-container" style="margin: 0 0 10px 0;"><div class="progress-segment new" style="width: ${newPct}%"></div></div>

      <div style="display: flex; justify-content: space-between; font-size: 0.85rem;">
        <span>${t('statLearning')}</span>
        <strong>${stats.learningCount} (${learnPct}%)</strong>
      </div>
      <div class="progress-bar-container" style="margin: 0 0 10px 0;"><div class="progress-segment learning" style="width: ${learnPct}%"></div></div>

      <div style="display: flex; justify-content: space-between; font-size: 0.85rem;">
        <span>${t('statReview')}</span>
        <strong>${stats.reviewCount} (${reviewPct}%)</strong>
      </div>
      <div class="progress-bar-container" style="margin: 0 0 10px 0;"><div class="progress-segment review" style="width: ${reviewPct}%"></div></div>

      <div style="display: flex; justify-content: space-between; font-size: 0.85rem;">
        <span>${t('statMastered')}</span>
        <strong>${stats.masteredCount} (${masteredPct}%)</strong>
      </div>
      <div class="progress-bar-container" style="margin: 0 0 10px 0;"><div class="progress-segment mastered" style="width: ${masteredPct}%"></div></div>
    `;
  }

  // 7-day forecast chart
  const forecastEl = document.getElementById('stats-forecast-chart');
  if (forecastEl) {
    const maxVal = Math.max(1, ...stats.forecast.map(f => f.count));
    forecastEl.innerHTML = stats.forecast.map(f => {
      const heightPct = Math.max(8, Math.round((f.count / maxVal) * 100));
      return `
        <div class="forecast-bar-col">
          <span class="forecast-val">${f.count}</span>
          <div class="forecast-bar" style="height: ${heightPct}%;" title="${f.label}: ${f.count} ${t('headerDue')}"></div>
          <span class="forecast-label">${f.label}</span>
        </div>
      `;
    }).join('');
  }
}

// Helpers
function capitalize(str) {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
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
