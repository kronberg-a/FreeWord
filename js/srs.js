/**
 * FreeWord - Core Spaced Repetition Engine (SM-2 / Leitner Derivative)
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

export const DEFAULT_EASE_FACTOR = 2.5;
export const MIN_EASE_FACTOR = 1.3;
export const MASTERED_INTERVAL_DAYS = 21;

/**
 * Creates a new card object with default SRS state
 */
export function createCard({
  id = crypto.randomUUID ? crypto.randomUUID() : 'card_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
  mode = 'word', // 'word' | 'definition'
  front = '',
  back = '',
  contextSentence = '',
  keyConcepts = [],
  sourceLang = 'en',
  targetLang = 'es',
  interval = 0,
  repetitions = 0,
  easeFactor = DEFAULT_EASE_FACTOR,
  nextReviewDate = new Date().toISOString(),
  status = STATUS.NEW,
  createdAt = new Date().toISOString(),
  lastReviewedDate = null
}) {
  return {
    id,
    mode,
    front: front.trim(),
    back: back.trim(),
    contextSentence: contextSentence.trim(),
    keyConcepts: Array.isArray(keyConcepts) 
      ? keyConcepts 
      : (typeof keyConcepts === 'string' ? keyConcepts.split(',').map(s => s.trim()).filter(Boolean) : []),
    sourceLang,
    targetLang,
    interval: parseInt(interval, 10) || 0,
    repetitions: parseInt(repetitions, 10) || 0,
    easeFactor: Math.round(Math.max(MIN_EASE_FACTOR, parseFloat(easeFactor) || DEFAULT_EASE_FACTOR) * 100) / 100,
    nextReviewDate,
    status,
    createdAt,
    lastReviewedDate
  };
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
    case RATING.AGAIN: // Score 1: Reset
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

    case RATING.EASY: // Score 4: Accelerated
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
 * Builds the daily review session queue based on limits, mode, and optional language pair
 */
export function buildStudyQueue(cards, options = {}) {
  const {
    mode = null, // 'word' | 'definition' | null (all)
    pair = 'all', // e.g. 'de-ru' or 'all'
    dailyNewLimit = 20,
    dailyReviewLimit = 50
  } = options;

  const now = new Date();

  // Filter cards by criteria
  const matchingCards = cards.filter(card => {
    if (mode && card.mode !== mode) return false;
    if (pair && pair !== 'all') {
      const cardPair = `${card.sourceLang}-${card.targetLang}`;
      if (cardPair !== pair) return false;
    }
    return true;
  });

  // Separate due reviews from new cards
  const dueReviews = [];
  const newCards = [];

  for (const card of matchingCards) {
    if (card.status === STATUS.NEW) {
      newCards.push(card);
    } else {
      const dueDate = new Date(card.nextReviewDate);
      if (dueDate <= now) {
        dueReviews.push(card);
      }
    }
  }

  // Sort due reviews: most overdue first
  dueReviews.sort((a, b) => new Date(a.nextReviewDate) - new Date(b.nextReviewDate));

  // Cap with daily limits
  const selectedReviews = dueReviews.slice(0, dailyReviewLimit);
  const selectedNew = newCards.slice(0, dailyNewLimit);

  // Return queue: due reviews first, then new material
  return [...selectedReviews, ...selectedNew];
}

/**
 * Computes analytics stats for cards and logs filtered by mode and language pair
 */
export function computeStats(cards, reviewLogs = [], options = {}) {
  const { mode = null, pair = 'all' } = options;
  const now = new Date();
  const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

  const filteredCards = cards.filter(c => {
    if (mode && c.mode !== mode) return false;
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
    if (mode && l.mode !== mode) return false;
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
