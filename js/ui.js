/**
 * FreeWord - UI Rendering & View Controller
 */

import { t, getCurrentLanguage, setLanguage, SUPPORTED_LANGUAGES } from './i18n.js';
import { RATING, STATUS, computeStats } from './srs.js';
import { speakText, isAudioSupported } from './audio.js';
import { evaluateDefinition } from './fuzzy.js';

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
export function showToast(message, duration = 3000) {
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
 * Updates Header Quick Stats badge
 */
export function updateHeaderStats(cards, logs) {
  const stats = computeStats(cards, logs);
  const dueEl = document.getElementById('header-due-count');
  const totalEl = document.getElementById('header-total-count');

  if (dueEl) dueEl.textContent = stats.dueTodayCount;
  if (totalEl) totalEl.textContent = stats.totalCards;
}

/**
 * Renders the Dashboard overview cards, progress bars and quick stats
 */
export function renderDashboard(cards, logs, activeMode = 'word') {
  const stats = computeStats(cards, logs, { mode: activeMode });
  
  // Update hero texts based on mode
  const modeBadge = document.getElementById('dashboard-active-mode-badge');
  const heroSubtitle = document.getElementById('dashboard-hero-subtitle');
  if (modeBadge) {
    modeBadge.textContent = activeMode === 'word' ? t('modeWords') : t('modeDefinitions');
    modeBadge.className = activeMode === 'word' ? 'badge badge-new' : 'badge badge-review';
  }
  if (heroSubtitle) {
    heroSubtitle.textContent = activeMode === 'word' ? t('wordsModeDesc') : t('definitionsModeDesc');
  }

  // Update Progress Bar
  const total = stats.totalCards || 1;
  const newPct = Math.round((stats.newCount / total) * 100);
  const learnPct = Math.round((stats.learningCount / total) * 100);
  const reviewPct = Math.round((stats.reviewCount / total) * 100);
  const masteredPct = Math.round((stats.masteredCount / total) * 100);

  const pBar = document.getElementById('dashboard-progress-bar');
  if (pBar) {
    pBar.innerHTML = `
      <div class="progress-segment new" style="width: ${newPct}%" title="${t('statNew')}: ${stats.newCount}"></div>
      <div class="progress-segment learning" style="width: ${learnPct}%" title="${t('statLearning')}: ${stats.learningCount}"></div>
      <div class="progress-segment review" style="width: ${reviewPct}%" title="${t('statReview')}: ${stats.reviewCount}"></div>
      <div class="progress-segment mastered" style="width: ${masteredPct}%" title="${t('statMastered')}: ${stats.masteredCount}"></div>
    `;
  }

  // Labels under progress bar
  const lNew = document.getElementById('bar-label-new');
  const lLearn = document.getElementById('bar-label-learning');
  const lRev = document.getElementById('bar-label-review');
  const lMast = document.getElementById('bar-label-mastered');

  if (lNew) lNew.textContent = `${t('statNew')}: ${stats.newCount}`;
  if (lLearn) lLearn.textContent = `${t('statLearning')}: ${stats.learningCount}`;
  if (lRev) lRev.textContent = `${t('statReview')}: ${stats.reviewCount}`;
  if (lMast) lMast.textContent = `${t('statMastered')}: ${stats.masteredCount}`;

  // CTA Button due count badge
  const dueBadge = document.getElementById('btn-due-count-badge');
  if (dueBadge) dueBadge.textContent = stats.dueTodayCount;

  // Stat Boxes
  const dueBox = document.getElementById('stat-due-today');
  const totalBox = document.getElementById('stat-total-cards');
  const retBox = document.getElementById('stat-retention-rate');
  const mastBox = document.getElementById('stat-mastered-cards');

  if (dueBox) dueBox.textContent = stats.dueTodayCount;
  if (totalBox) totalBox.textContent = stats.totalCards;
  if (retBox) retBox.textContent = `${stats.retentionRate}%`;
  if (mastBox) mastBox.textContent = stats.masteredCount;
}

/**
 * Renders the Study screen for Word Mode (Flashcard with 3D Flip)
 */
export function renderWordStudyCard(card, index, total, callbacks = {}) {
  const container = document.getElementById('study-active-area');
  if (!container) return;

  const currentNum = index + 1;
  const progressPct = Math.round((currentNum / total) * 100);

  // Update header progress
  const counterEl = document.getElementById('study-progress-counter');
  const progBarEl = document.getElementById('study-progress-bar');
  const modeInd = document.getElementById('study-mode-indicator');

  if (counterEl) counterEl.textContent = t('cardOf', { current: currentNum, total });
  if (progBarEl) progBarEl.style.width = `${progressPct}%`;
  if (modeInd) modeInd.textContent = `${t('modeWords')} • ${card.sourceLang.toUpperCase()} → ${card.targetLang.toUpperCase()}`;

  const langCode = card.sourceLang || 'en';

  container.innerHTML = `
    <div class="flashcard-wrapper" id="flashcard-wrapper">
      <div class="flashcard" id="study-flashcard" tabindex="0" role="button" aria-label="Flashcard. Click or press Space to flip.">
        <!-- FRONT FACE -->
        <div class="flashcard-face flashcard-front">
          <div class="card-face-header">
            <span class="card-lang-tag">${card.sourceLang.toUpperCase()}</span>
            <button type="button" class="audio-btn" id="card-audio-btn-front" title="${t('pronounceWord')}">
              🔊
            </button>
          </div>
          <div class="card-center-prompt">
            <h1 class="card-term">${escapeHtml(card.front)}</h1>
            <div style="font-size: 0.85rem; color: var(--text-muted); margin-top: 8px;">
              ${escapeHtml(card.contextSentence ? '“' + card.contextSentence + '”' : '')}
            </div>
          </div>
          <div class="card-face-footer">
            <span>${t('clickToFlip')} (${t('pressSpaceToFlip')})</span>
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
            <div style="font-size: 1.1rem; color: var(--text-muted); margin-bottom: 4px;">${escapeHtml(card.front)}</div>
            <div class="card-translation-reveal">${escapeHtml(card.back)}</div>
            ${card.contextSentence ? `<div class="card-context-quote">“${escapeHtml(card.contextSentence)}”</div>` : ''}
          </div>
          <div class="card-face-footer">
            <span class="badge badge-${card.status}">${t(`status${capitalize(card.status)}`)}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Rating Buttons Bar (Hidden initially, shown when flipped or submitted) -->
    <div class="srs-ratings-bar hidden" id="study-ratings-bar">
      <button type="button" class="rating-btn again" data-rating="1" title="Shortcut: 1">
        <span class="rating-label">${t('ratingAgain')}</span>
        <span class="rating-hint">1d</span>
        <span class="rating-key-badge">1</span>
      </button>
      <button type="button" class="rating-btn hard" data-rating="2" title="Shortcut: 2">
        <span class="rating-label">${t('ratingHard')}</span>
        <span class="rating-hint">~${Math.max(1, Math.round((card.interval || 0) * 1.2))}d</span>
        <span class="rating-key-badge">2</span>
      </button>
      <button type="button" class="rating-btn good" data-rating="3" title="Shortcut: 3">
        <span class="rating-label">${t('ratingGood')}</span>
        <span class="rating-hint">~${card.repetitions === 0 ? 1 : (card.repetitions === 1 ? 6 : Math.round((card.interval || 1) * (card.easeFactor || 2.5)))}d</span>
        <span class="rating-key-badge">3</span>
      </button>
      <button type="button" class="rating-btn easy" data-rating="4" title="Shortcut: 4">
        <span class="rating-label">${t('ratingEasy')}</span>
        <span class="rating-hint">~${card.repetitions === 0 ? 4 : (card.repetitions === 1 ? 8 : Math.round((card.interval || 1) * (card.easeFactor || 2.5) * 1.3))}d</span>
        <span class="rating-key-badge">4</span>
      </button>
    </div>
  `;

  const flashcardEl = document.getElementById('study-flashcard');
  const ratingsBar = document.getElementById('study-ratings-bar');

  // Flip logic
  let isFlipped = false;
  const doFlip = () => {
    isFlipped = !isFlipped;
    flashcardEl.classList.toggle('flipped', isFlipped);
    if (isFlipped) {
      ratingsBar.classList.remove('hidden');
    }
  };

  flashcardEl.addEventListener('click', (e) => {
    // Avoid flipping if user clicked the audio button
    if (e.target.closest('.audio-btn')) return;
    doFlip();
  });

  // Audio pronunciation listeners
  const playAudio = async (btn) => {
    btn.classList.add('speaking');
    await speakText(card.front, langCode);
    btn.classList.remove('speaking');
  };

  const frontAudioBtn = document.getElementById('card-audio-btn-front');
  const backAudioBtn = document.getElementById('card-audio-btn-back');
  if (frontAudioBtn) frontAudioBtn.addEventListener('click', () => playAudio(frontAudioBtn));
  if (backAudioBtn) backAudioBtn.addEventListener('click', () => playAudio(backAudioBtn));

  // Rating buttons listeners
  ratingsBar.querySelectorAll('.rating-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const rating = parseInt(btn.getAttribute('data-rating'), 10);
      if (callbacks.onRate) callbacks.onRate(rating);
    });
  });

  return {
    flip: doFlip,
    speak: () => playAudio(frontAudioBtn),
    isFlipped: () => isFlipped
  };
}

/**
 * Renders the Study screen for Definition Practice Mode (Recall with Fuzzy Evaluation)
 */
export function renderDefinitionStudyCard(card, index, total, callbacks = {}) {
  const container = document.getElementById('study-active-area');
  if (!container) return;

  const currentNum = index + 1;
  const progressPct = Math.round((currentNum / total) * 100);

  // Update header progress
  const counterEl = document.getElementById('study-progress-counter');
  const progBarEl = document.getElementById('study-progress-bar');
  const modeInd = document.getElementById('study-mode-indicator');

  if (counterEl) counterEl.textContent = t('cardOf', { current: currentNum, total });
  if (progBarEl) progBarEl.style.width = `${progressPct}%`;
  if (modeInd) modeInd.textContent = `${t('modeDefinitions')} • ${card.sourceLang.toUpperCase()}`;

  const langCode = card.sourceLang || 'en';

  container.innerHTML = `
    <div class="definition-card">
      <div class="definition-header">
        <span class="card-lang-tag">${langCode.toUpperCase()} DEFINITION PRACTICE</span>
        <button type="button" class="audio-btn" id="def-audio-btn" title="${t('pronounceWord')}">🔊</button>
      </div>

      <div class="definition-prompt-box">
        <h1 class="definition-term">${escapeHtml(card.front)}</h1>
        ${card.contextSentence ? `<div style="font-size: 0.9rem; font-style: italic; color: var(--text-muted); margin-top: 4px;">Context: “${escapeHtml(card.contextSentence)}”</div>` : ''}
      </div>

      <!-- User Active Typing Area -->
      <div class="definition-input-area" id="def-input-area">
        <textarea id="def-user-input" class="definition-textarea" placeholder="${t('typeYourDefinition')}" autofocus></textarea>
        <div class="definition-submit-bar">
          <button type="button" class="btn btn-primary" id="def-submit-btn">
            <span>✓</span>
            <span>${t('submitAnswer')} (Enter)</span>
          </button>
        </div>
      </div>

      <!-- Fuzzy Evaluation Results Box (Injected after submit) -->
      <div id="def-eval-container" class="hidden"></div>

      <!-- Ratings Toolbar (Injected after submit) -->
      <div class="srs-ratings-bar hidden" id="def-ratings-bar">
        <button type="button" class="rating-btn again" data-rating="1">
          <span class="rating-label">${t('ratingAgain')}</span>
          <span class="rating-hint">1d</span>
          <span class="rating-key-badge">1</span>
        </button>
        <button type="button" class="rating-btn hard" data-rating="2">
          <span class="rating-label">${t('ratingHard')}</span>
          <span class="rating-hint">Hard</span>
          <span class="rating-key-badge">2</span>
        </button>
        <button type="button" class="rating-btn good" data-rating="3">
          <span class="rating-label">${t('ratingGood')}</span>
          <span class="rating-hint">Good</span>
          <span class="rating-key-badge">3</span>
        </button>
        <button type="button" class="rating-btn easy" data-rating="4">
          <span class="rating-label">${t('ratingEasy')}</span>
          <span class="rating-hint">Easy</span>
          <span class="rating-key-badge">4</span>
        </button>
      </div>
    </div>
  `;

  const audioBtn = document.getElementById('def-audio-btn');
  const userInput = document.getElementById('def-user-input');
  const submitBtn = document.getElementById('def-submit-btn');
  const evalContainer = document.getElementById('def-eval-container');
  const ratingsBar = document.getElementById('def-ratings-bar');

  let evaluated = false;

  const playAudio = async () => {
    audioBtn.classList.add('speaking');
    await speakText(card.front, langCode);
    audioBtn.classList.remove('speaking');
  };

  if (audioBtn) audioBtn.addEventListener('click', playAudio);

  // Evaluation Handler
  const doEvaluate = () => {
    if (evaluated) return;
    const userText = userInput.value.trim();
    if (!userText) {
      userInput.focus();
      return;
    }

    evaluated = true;
    userInput.disabled = true;
    submitBtn.classList.add('hidden');

    // Run Fuzzy Semantic Similarity Algorithm
    const evalResult = evaluateDefinition(userText, card.back, card.keyConcepts, langCode);

    // Render Side-by-side Diff & Metrics
    evalContainer.classList.remove('hidden');
    ratingsBar.classList.remove('hidden');

    const tierClass = `score-${evalResult.tier}`;
    const tierLabel = evalResult.tier === 'accurate' ? t('evalAccurate') : (evalResult.tier === 'partial' ? t('evalPartial') : t('evalDivergent'));

    evalContainer.innerHTML = `
      <div class="evaluation-results">
        <div class="evaluation-summary-header">
          <div class="similarity-score-pill ${tierClass}">
            <span>${evalResult.scorePercent}%</span>
            <span>${tierLabel}</span>
          </div>

          <div style="font-size: 0.8rem; color: var(--text-muted); display: flex; gap: 10px;">
            <span>Coverage: <strong>${evalResult.metrics.contentCoverage}%</strong></span>
            <span>Jaccard: <strong>${evalResult.metrics.jaccardIndex}%</strong></span>
          </div>
        </div>

        <!-- Key Concepts Chips -->
        ${evalResult.conceptMatches.length > 0 ? `
          <div>
            <div style="font-size: 0.75rem; font-weight: 700; color: var(--text-muted); margin-bottom: 4px;">${t('keyConceptsMatched')}:</div>
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
        <div class="eval-action-bar">
          <button type="button" class="btn btn-primary btn-sm" id="btn-accept-grade">
            <span>✓ ${t('acceptGrade')} (${getRatingName(evalResult.suggestedRating)})</span>
          </button>
          <span style="font-size: 0.75rem; color: var(--text-muted);">${t('manualOverride')}:</span>
        </div>
      </div>
    `;

    // Accept Grade listener
    const acceptBtn = document.getElementById('btn-accept-grade');
    if (acceptBtn) {
      acceptBtn.addEventListener('click', () => {
        if (callbacks.onRate) callbacks.onRate(evalResult.suggestedRating);
      });
    }

    // Manual override listeners
    ratingsBar.querySelectorAll('.rating-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const rating = parseInt(btn.getAttribute('data-rating'), 10);
        if (callbacks.onRate) callbacks.onRate(rating);
      });
    });
  };

  submitBtn.addEventListener('click', doEvaluate);
  userInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      doEvaluate();
    }
  });

  return {
    evaluate: doEvaluate,
    speak: playAudio,
    isEvaluated: () => evaluated
  };
}

/**
 * Renders the session completed congratulatory card
 */
export function renderSessionCompleted(sessionCount, onReturn) {
  const container = document.getElementById('study-active-area');
  if (!container) return;

  container.innerHTML = `
    <div class="session-completed-card">
      <div class="completed-icon">🎉</div>
      <h2 style="font-size: 1.6rem; font-weight: 700;">${t('congratsTitle')}</h2>
      <p style="color: var(--text-secondary); max-width: 440px;">
        ${t('congratsMsg', { count: sessionCount })}
      </p>
      <button type="button" class="btn btn-primary btn-lg" id="btn-session-return" style="margin-top: 12px;">
        <span>←</span>
        <span>${t('backToDashboard')}</span>
      </button>
    </div>
  `;

  const btnReturn = document.getElementById('btn-session-return');
  if (btnReturn) btnReturn.addEventListener('click', onReturn);
}

/**
 * Renders the library table of all cards
 */
export function renderLibraryTable(cards, callbacks = {}) {
  const tbody = document.getElementById('library-table-body');
  if (!tbody) return;

  if (cards.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="8" style="text-align: center; padding: 36px; color: var(--text-muted);">
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

    return `
      <tr data-card-id="${card.id}">
        <td class="cell-term">${escapeHtml(card.front)}</td>
        <td class="cell-translation" title="${escapeHtml(card.back)}">${escapeHtml(card.back)}</td>
        <td><span class="badge" style="background: var(--bg-tertiary);">${card.sourceLang.toUpperCase()} → ${card.targetLang.toUpperCase()}</span></td>
        <td><span class="badge ${card.mode === 'word' ? 'badge-new' : 'badge-review'}">${card.mode}</span></td>
        <td><span class="badge badge-${card.status}">${t(`status${capitalize(card.status)}`)}</span></td>
        <td style="font-variant-numeric: tabular-nums;">${card.interval}d (EF ${card.easeFactor})</td>
        <td style="color: ${isDue ? 'var(--color-danger)' : 'var(--text-secondary)'}; font-weight: ${isDue ? '700' : 'normal'};">
          ${isDue ? 'Due Today' : dueFormatted}
        </td>
        <td class="cell-actions">
          <button type="button" class="btn btn-secondary btn-sm action-edit" title="${t('editCard')}">✏️</button>
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

/**
 * Renders the analytics / stats view
 */
export function renderAnalytics(cards, logs) {
  const stats = computeStats(cards, logs);

  // Breakdown bars
  const distEl = document.getElementById('stats-distribution-breakdown');
  if (distEl) {
    const total = stats.totalCards || 1;
    distEl.innerHTML = `
      <div style="display: flex; justify-content: space-between; font-size: 0.85rem;">
        <span>${t('statNew')}</span>
        <strong>${stats.newCount} (${Math.round(stats.newCount/total*100)}%)</strong>
      </div>
      <div class="progress-bar-container" style="margin: 0 0 10px 0;"><div class="progress-segment new" style="width: ${stats.newCount/total*100}%"></div></div>

      <div style="display: flex; justify-content: space-between; font-size: 0.85rem;">
        <span>${t('statLearning')}</span>
        <strong>${stats.learningCount} (${Math.round(stats.learningCount/total*100)}%)</strong>
      </div>
      <div class="progress-bar-container" style="margin: 0 0 10px 0;"><div class="progress-segment learning" style="width: ${stats.learningCount/total*100}%"></div></div>

      <div style="display: flex; justify-content: space-between; font-size: 0.85rem;">
        <span>${t('statReview')}</span>
        <strong>${stats.reviewCount} (${Math.round(stats.reviewCount/total*100)}%)</strong>
      </div>
      <div class="progress-bar-container" style="margin: 0 0 10px 0;"><div class="progress-segment review" style="width: ${stats.reviewCount/total*100}%"></div></div>

      <div style="display: flex; justify-content: space-between; font-size: 0.85rem;">
        <span>${t('statMastered')}</span>
        <strong>${stats.masteredCount} (${Math.round(stats.masteredCount/total*100)}%)</strong>
      </div>
      <div class="progress-bar-container" style="margin: 0 0 10px 0;"><div class="progress-segment mastered" style="width: ${stats.masteredCount/total*100}%"></div></div>
    `;
  }

  // Forecast Bar Chart
  const forecastEl = document.getElementById('stats-forecast-chart');
  if (forecastEl) {
    const maxVal = Math.max(1, ...stats.forecast.map(f => f.count));
    forecastEl.innerHTML = stats.forecast.map(f => {
      const heightPct = Math.max(8, Math.round((f.count / maxVal) * 100));
      return `
        <div class="forecast-bar-col">
          <span class="forecast-val">${f.count}</span>
          <div class="forecast-bar" style="height: ${heightPct}%;"></div>
          <span class="forecast-label">${f.label}</span>
        </div>
      `;
    }).join('');
  }

  const totalRevEl = document.getElementById('stats-total-reviews');
  const avgEaseEl = document.getElementById('stats-avg-ease');

  if (totalRevEl) totalRevEl.textContent = stats.totalReviews;
  if (avgEaseEl) avgEaseEl.textContent = stats.avgEase;
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

function getRatingName(rating) {
  switch (rating) {
    case 1: return t('ratingAgain');
    case 2: return t('ratingHard');
    case 3: return t('ratingGood');
    case 4: return t('ratingEasy');
    default: return 'Good';
  }
}
