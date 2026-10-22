/**
 * FreeWord - Core Spaced Repetition Engine (SM-2 / Leitner Derivative)
 * Implements mathematical scheduling, session queue construction across folders,
 * and comprehensive deck metrics calculation.
 */

export const RATING = {
  AGAIN: 1,
  HARD: 2,
  GOOD: 3,
  EASY: 4
};

export const STATUS = {
  NEW: 'new',
  LEARNING: 'learning',
  REVIEW: 'review',
  MASTERED: 'mastered'
};

export const DEFAULT_EASE_FACTOR = 2.50;
export const MIN_EASE_FACTOR = 1.30;
export const MASTERED_INTERVAL_DAYS = 60;
export const MASTERED_REPETITIONS = 6;

/**
 * Creates a new card object with default SRS state & folder link
 */
export function createCard({
  id = crypto.randomUUID ? crypto.randomUUID() : 'card_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
  folderId = 'folder_default',
  mode = 'word', // 'word' | 'definition'
  front = '',
  transcription = '',
  partOfSpeech = '',
  back = '',
  contextSentence = '',
  keyConcepts = [],
  sourceLang = 'en',
  targetLang = 'es',
  interval = 0,
  repetitions = 0,
  learningStep = 0,
  easeFactor = DEFAULT_EASE_FACTOR,
  nextReviewDate = new Date().toISOString(),
  status = STATUS.NEW,
  createdAt = new Date().toISOString(),
  lastReviewedDate = null,
  currentAttempt = 1,
  hadErrorInSession = false
}) {
  return {
    id,
    folderId,
    mode,
    front: (front || '').trim(),
    transcription: (transcription || '').trim(),
    partOfSpeech: (partOfSpeech || '').trim(),
    back: (back || '').trim(),
    contextSentence: (contextSentence || '').trim(),
    keyConcepts: Array.isArray(keyConcepts) 
      ? keyConcepts 
      : (typeof keyConcepts === 'string' ? keyConcepts.split(',').map(s => s.trim()).filter(Boolean) : []),
    sourceLang: (sourceLang || 'en').toLowerCase(),
    targetLang: (targetLang || 'es').toLowerCase(),
    interval: parseInt(interval, 10) || 0,
    repetitions: parseInt(repetitions, 10) || 0,
    learningStep: Math.max(0, Math.min(3, parseInt(learningStep, 10) || 0)),
    easeFactor: Math.round(Math.max(MIN_EASE_FACTOR, parseFloat(easeFactor) || DEFAULT_EASE_FACTOR) * 100) / 100,
    nextReviewDate,
    status: [STATUS.NEW, STATUS.LEARNING, STATUS.REVIEW, STATUS.MASTERED].includes(status) ? status : STATUS.NEW,
    createdAt,
    lastReviewedDate,
    // Transient session layer
    currentAttempt: parseInt(currentAttempt, 10) || 1,
    hadErrorInSession: Boolean(hadErrorInSession)
  };
}

/**
 * Long-term SRS scheduling applied when a card passes and exits the session queue.
 * Strictly adheres to System Specification Section 5.2:
 * 1. Clean Pass (1st Attempt Success & No Prior Session Failure)
 * 2. Assisted Pass (Passed on Attempt 2 or 3, without prior full failure)
 * 3. Recovered Pass (Failed Earlier in Session, Passed on Re-Queue)
 *
 * @param {Object} card Current card state
 * @param {string} outcomeType 'clean' | 'assisted' | 'recovered'
 * @param {Object} options Optional overrides { rating, isEasy, now }
 * @returns {Object} Updated card and review log
 */
export function processSessionCardExit(card, outcomeType = 'clean', options = {}) {
  const now = options.now ? new Date(options.now) : new Date();
  let interval = card.interval || 0;
  let repetitions = card.repetitions || 0;
  let easeFactor = card.easeFactor || DEFAULT_EASE_FACTOR;
  let status = card.status || STATUS.NEW;
  let learningStep = card.learningStep || 0;
  let rating = RATING.GOOD;

  // Resolve outcome type based on session telemetry if not explicitly forced
  let effectiveOutcome = outcomeType;
  if (card.hadErrorInSession) {
    effectiveOutcome = 'recovered';
  } else if (effectiveOutcome !== 'assisted' && (card.currentAttempt === 2 || card.currentAttempt === 3)) {
    effectiveOutcome = 'assisted';
  }

  if (effectiveOutcome === 'recovered') {
    // 3. Recovered Pass (Failed Earlier in Session, Passed on Re-Queue):
    // repetitions = 1, interval = 1 day, status = "learning", easeFactor = max(1.3, easeFactor - 0.20), nextReviewDate = now + 1 day
    repetitions = 1;
    interval = 1;
    status = STATUS.LEARNING;
    learningStep = Math.min(3, learningStep + 1);
    easeFactor = Math.max(MIN_EASE_FACTOR, easeFactor - 0.20);
    rating = RATING.AGAIN;
  } else if (effectiveOutcome === 'assisted') {
    // 2. Assisted Pass (Passed on Attempt 2 or 3, without prior full failure):
    // status = "review", interval = max(1, round(interval * 1.2)), easeFactor = max(1.3, easeFactor - 0.15)
    status = STATUS.REVIEW;
    repetitions = Math.max(1, repetitions);
    interval = Math.max(1, Math.round((interval || 1) * 1.2));
    easeFactor = Math.max(MIN_EASE_FACTOR, easeFactor - 0.15);
    learningStep = 3;
    rating = RATING.HARD;
  } else {
    // 1. Clean Pass (1st Attempt Success & No Prior Session Failure):
    // repetitions += 1
    // Interval Ladder: rep 1 -> 1d (status review), rep 2 -> 3d, rep 3 -> 7d, rep > 3 -> round(interval * easeFactor)
    // repetitions >= 6 or interval >= 60 -> status mastered
    repetitions += 1;
    learningStep = 3;

    if (repetitions === 1) {
      interval = 1;
      status = STATUS.REVIEW;
    } else if (repetitions === 2) {
      interval = 3;
      status = STATUS.REVIEW;
    } else if (repetitions === 3) {
      interval = 7;
      status = STATUS.REVIEW;
    } else {
      interval = Math.max(1, Math.round((interval || 1) * easeFactor));
      status = STATUS.REVIEW;
    }

    // Easy boost if rating was 4 or explicitly requested
    if (options.rating === RATING.EASY || options.isEasy) {
      easeFactor = easeFactor + 0.15;
      rating = RATING.EASY;
    } else {
      rating = RATING.GOOD;
    }

    if (repetitions >= MASTERED_REPETITIONS || interval >= MASTERED_INTERVAL_DAYS) {
      status = STATUS.MASTERED;
    }
  }

  // Calculate next review timestamp: now + interval in days
  const nextReviewDate = new Date(now.getTime() + interval * 86400000).toISOString();
  const roundedEase = Math.round(easeFactor * 100) / 100;

  const updatedCard = {
    ...card,
    interval,
    repetitions,
    learningStep,
    easeFactor: roundedEase,
    nextReviewDate,
    status,
    lastReviewedDate: now.toISOString(),
    // Reset transient session layer
    currentAttempt: 1,
    hadErrorInSession: false
  };

  const reviewLog = {
    id: 'log_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6),
    cardId: card.id,
    folderId: card.folderId,
    mode: card.mode,
    rating,
    outcomeType: effectiveOutcome,
    timestamp: now.toISOString(),
    previousInterval: card.interval || 0,
    newInterval: interval,
    easeFactor: roundedEase
  };

  return { updatedCard, reviewLog };
}

/**
 * Calculates updated SRS metrics after user review
 * @param {Object} card Current card state
 * @param {number} rating 1 (Again), 2 (Hard), 3 (Good), 4 (Easy)
 * @returns {Object} Updated card fields and review log entry
 */
export function processReview(card, rating) {
  const now = new Date();
  let interval = card.interval || 0;
  let repetitions = card.repetitions || 0;
  let easeFactor = card.easeFactor || DEFAULT_EASE_FACTOR;
  let status = card.status || STATUS.NEW;

  switch (rating) {
    case RATING.AGAIN: // Score 1: Reset / Re-queue
      interval = 1;
      repetitions = 0;
      easeFactor = Math.max(MIN_EASE_FACTOR, easeFactor - 0.20);
      status = STATUS.LEARNING;
      break;

    case RATING.HARD: // Score 2: Slight increase
      interval = interval === 0 ? 1 : Math.max(1, Math.round(interval * 1.2));
      easeFactor = Math.max(MIN_EASE_FACTOR, easeFactor - 0.15);
      repetitions += 1;
      status = interval >= MASTERED_INTERVAL_DAYS ? STATUS.MASTERED : (repetitions > 1 ? STATUS.REVIEW : STATUS.LEARNING);
      break;

    case RATING.GOOD: // Score 3: Standard SM-2
      if (repetitions === 0) {
        interval = 1;
      } else if (repetitions === 1) {
        interval = 6;
      } else {
        interval = Math.max(1, Math.round(interval * easeFactor));
      }
      repetitions += 1;
      status = interval >= MASTERED_INTERVAL_DAYS ? STATUS.MASTERED : STATUS.REVIEW;
      break;

    case RATING.EASY: // Score 4: Accelerated progression
      if (repetitions === 0) {
        interval = 4;
      } else if (repetitions === 1) {
        interval = 8;
      } else {
        interval = Math.max(2, Math.round(interval * easeFactor * 1.3));
      }
      easeFactor = Math.max(MIN_EASE_FACTOR, easeFactor + 0.15);
      repetitions += 1;
      status = interval >= MASTERED_INTERVAL_DAYS ? STATUS.MASTERED : STATUS.REVIEW;
      break;

    default:
      throw new Error(`Invalid rating: ${rating}`);
  }

  // Calculate next review timestamp: now + interval in days
  const nextReviewDate = new Date(now.getTime() + interval * 86400000).toISOString();
  const roundedEase = Math.round(easeFactor * 100) / 100;

  const updatedCard = {
    ...card,
    interval,
    repetitions,
    easeFactor: roundedEase,
    nextReviewDate,
    status,
    lastReviewedDate: now.toISOString()
  };

  const reviewLog = {
    id: 'log_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6),
    cardId: card.id,
    folderId: card.folderId,
    mode: card.mode,
    rating,
    timestamp: now.toISOString(),
    previousInterval: card.interval,
    newInterval: interval,
    easeFactor: roundedEase
  };

  return { updatedCard, reviewLog };
}

/**
 * Builds the practice session queue based on selected folders, session type,
 * global mode filter, language pair, and daily limits.
 */
export function buildStudyQueue(cards, folders = [], options = {}) {
  const {
    selectedFolderIds = [],
    sessionType = 'mixed', // 'learning' | 'reviewing' | 'mixed'
    globalMode = 'all',    // 'all' | 'word' | 'definition'
    pair = 'all',          // 'all' or 'en-es', etc.
    dailyNewLimit = 20,
    dailyReviewLimit = 50
  } = options;

  const now = new Date();

  // 1. Filter by selected folders
  let pool = cards.filter(c => {
    if (selectedFolderIds.length > 0 && !selectedFolderIds.includes(c.folderId)) {
      return false;
    }
    return true;
  });

  // 2. Filter by global mode
  if (globalMode !== 'all') {
    pool = pool.filter(c => c.mode === globalMode);
  }

  // 3. Filter by language pair
  if (pair && pair !== 'all') {
    pool = pool.filter(c => `${(c.sourceLang || '').toLowerCase()}-${(c.targetLang || '').toLowerCase()}` === pair.toLowerCase());
  }

  // 4. Categorize by status & due date
  const dueReviews = [];
  const learningCards = [];
  const newCards = [];

  for (const card of pool) {
    if (card.status === STATUS.NEW) {
      newCards.push(card);
    } else if (card.status === STATUS.LEARNING) {
      learningCards.push(card);
    } else {
      const dueDate = new Date(card.nextReviewDate);
      if (dueDate <= now) {
        dueReviews.push(card);
      }
    }
  }

  // Sort due reviews: most overdue first
  dueReviews.sort((a, b) => new Date(a.nextReviewDate) - new Date(b.nextReviewDate));

  // Cap according to limits (handling Infinity or numeric limit)
  const maxNew = dailyNewLimit === Infinity ? newCards.length : Math.max(0, dailyNewLimit);
  const maxReviews = dailyReviewLimit === Infinity ? dueReviews.length : Math.max(0, dailyReviewLimit);

  // 5. Build queue according to Session Type
  let rawQueue = [];
  switch (sessionType) {
    case 'learning':
      // Learning Only: Pulls only "new" and currently "learning" cards
      rawQueue = [
        ...learningCards,
        ...newCards.slice(0, maxNew)
      ];
      break;

    case 'reviewing':
      // Reviewing Only: Pulls only due cards
      rawQueue = dueReviews.slice(0, maxReviews);
      break;

    case 'mixed':
    default:
      // Mixed Session: Combines both due Review cards and New/Learning cards
      rawQueue = [
        ...dueReviews.slice(0, maxReviews),
        ...learningCards,
        ...newCards.slice(0, maxNew)
      ];
      break;
  }

  // Reset & initialize transient session properties for each card in active session
  return rawQueue.map(c => ({
    ...c,
    currentAttempt: 1,
    hadErrorInSession: false
  }));
}

/**
 * Computes analytics stats for cards and logs filtered by folders, mode, and pair
 */
export function computeStats(cards, reviewLogs = [], options = {}) {
  const { 
    folderId = null,
    selectedFolderIds = null,
    mode = 'all', 
    pair = 'all' 
  } = options;

  const now = new Date();
  const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

  const filteredCards = cards.filter(c => {
    if (folderId && c.folderId !== folderId) return false;
    if (selectedFolderIds && selectedFolderIds.length > 0 && !selectedFolderIds.includes(c.folderId)) return false;
    if (mode && mode !== 'all' && c.mode !== mode) return false;
    if (pair && pair !== 'all') {
      const cardPair = `${c.sourceLang}-${c.targetLang}`;
      if (cardPair !== pair) return false;
    }
    return true;
  });

  let totalCards = filteredCards.length;
  let newCount = 0;
  let learningCount = 0;
  let reviewCount = 0;
  let masteredCount = 0;
  let dueTodayCount = 0;
  let easeSum = 0;

  filteredCards.forEach(c => {
    if (c.status === STATUS.NEW) newCount++;
    else if (c.status === STATUS.LEARNING) learningCount++;
    else if (c.status === STATUS.REVIEW) reviewCount++;
    else if (c.status === STATUS.MASTERED) masteredCount++;

    easeSum += c.easeFactor || DEFAULT_EASE_FACTOR;

    if (c.status === STATUS.NEW || new Date(c.nextReviewDate) <= todayEnd) {
      dueTodayCount++;
    }
  });

  const avgEase = totalCards > 0 ? (easeSum / totalCards).toFixed(2) : '2.50';

  // Calculate retention rate from review logs
  const filteredLogs = reviewLogs.filter(l => {
    if (mode && mode !== 'all' && l.mode !== mode) return false;
    return true;
  });

  const totalReviews = filteredLogs.length;
  const successfulReviews = filteredLogs.filter(l => l.rating === RATING.GOOD || l.rating === RATING.EASY).length;
  const retentionRate = totalReviews > 0 ? Math.round((successfulReviews / totalReviews) * 100) : 100;

  // 7-day forecast
  const forecast = [];
  for (let i = 0; i < 7; i++) {
    const dayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() + i, 0, 0, 0);
    const dayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate() + i, 23, 59, 59, 999);
    
    let count = 0;
    filteredCards.forEach(c => {
      if (c.status === STATUS.NEW && i === 0) {
        count++;
      } else if (c.status !== STATUS.NEW) {
        const due = new Date(c.nextReviewDate);
        if (i === 0 && due <= dayEnd) {
          count++;
        } else if (i > 0 && due >= dayStart && due <= dayEnd) {
          count++;
        }
      }
    });

    forecast.push({
      dayOffset: i,
      date: dayStart.toISOString(),
      label: i === 0 ? 'Today' : (i === 1 ? 'Tomorrow' : `+${i}d`),
      count
    });
  }

  return {
    totalCards,
    newCount,
    learningCount,
    reviewCount,
    masteredCount,
    dueTodayCount,
    retentionRate,
    totalReviews,
    avgEase,
    forecast
  };
}

/**
 * Calculates how many cards user has reviewed and studied new today
 */
export function getDailyStudiedCounts(reviewLogs = []) {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0).getTime();
  const todayLogs = reviewLogs.filter(l => new Date(l.timestamp).getTime() >= todayStart);

  let newStudied = 0;
  let reviewsStudied = 0;

  todayLogs.forEach(l => {
    if ((l.previousInterval || 0) === 0) {
      newStudied++;
    } else {
      reviewsStudied++;
    }
  });

  return {
    newStudied,
    reviewsStudied,
    totalStudiedToday: todayLogs.length
  };
}
