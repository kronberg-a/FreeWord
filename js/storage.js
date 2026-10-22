/**
 * FreeWord - Storage & Persistence Engine (LocalStorage + Export/Import)
 */

import { INITIAL_MOCK_CARDS, INITIAL_MOCK_LOGS } from './mockData.js';
import { createCard } from './srs.js';

const STORAGE_KEYS = {
  CARDS: 'freeword_cards',
  LOGS: 'freeword_logs',
  SETTINGS: 'freeword_settings'
};

const DEFAULT_SETTINGS = {
  activeMode: 'word', // 'word' | 'definition'
  theme: 'dark',      // 'dark' | 'light'
  dailyNewLimit: 20,
  dailyReviewLimit: 50,
  defaultSourceLang: 'en',
  defaultTargetLang: 'es',
  selectedLanguagePair: 'all' // 'all' or 'en-es', etc.
};

/**
 * Initializes storage with mock data if first run
 */
export function initStorage() {
  const existingCards = localStorage.getItem(STORAGE_KEYS.CARDS);
  if (!existingCards) {
    localStorage.setItem(STORAGE_KEYS.CARDS, JSON.stringify(INITIAL_MOCK_CARDS));
  }

  const existingLogs = localStorage.getItem(STORAGE_KEYS.LOGS);
  if (!existingLogs) {
    localStorage.setItem(STORAGE_KEYS.LOGS, JSON.stringify(INITIAL_MOCK_LOGS));
  }

  const existingSettings = localStorage.getItem(STORAGE_KEYS.SETTINGS);
  if (!existingSettings) {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(DEFAULT_SETTINGS));
  }
}

/**
 * Retrieves all stored cards
 * @returns {Array} List of cards
 */
export function getCards() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.CARDS);
    return raw ? JSON.parse(raw) : [];
  } catch (err) {
    console.error('Error reading cards from localStorage:', err);
    return [];
  }
}

/**
 * Saves all cards to storage
 */
export function saveCards(cards) {
  try {
    localStorage.setItem(STORAGE_KEYS.CARDS, JSON.stringify(cards));
  } catch (err) {
    console.error('Error saving cards to localStorage:', err);
  }
}

/**
 * Adds a new card
 */
export function addCard(cardData) {
  const card = createCard(cardData);
  const cards = getCards();
  cards.unshift(card);
  saveCards(cards);
  return card;
}

/**
 * Updates an existing card
 */
export function updateCard(updatedCard) {
  const cards = getCards();
  const index = cards.findIndex(c => c.id === updatedCard.id);
  if (index !== -1) {
    cards[index] = { ...cards[index], ...updatedCard };
    saveCards(cards);
    return cards[index];
  }
  return null;
}

/**
 * Deletes a card by id
 */
export function deleteCard(cardId) {
  const cards = getCards();
  const filtered = cards.filter(c => c.id !== cardId);
  saveCards(filtered);
  return filtered;
}

/**
 * Resets SRS parameters of a card back to 'new'
 */
export function resetCardSRS(cardId) {
  const cards = getCards();
  const card = cards.find(c => c.id === cardId);
  if (card) {
    card.status = 'new';
    card.interval = 0;
    card.repetitions = 0;
    card.easeFactor = 2.5;
    card.nextReviewDate = new Date().toISOString();
    card.lastReviewedDate = null;
    saveCards(cards);
    return card;
  }
  return null;
}

/**
 * Retrieves review logs
 */
export function getReviewLogs() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.LOGS);
    return raw ? JSON.parse(raw) : [];
  } catch (err) {
    console.error('Error reading logs from localStorage:', err);
    return [];
  }
}

/**
 * Appends a review log entry
 */
export function addReviewLog(logEntry) {
  try {
    const logs = getReviewLogs();
    logs.push(logEntry);
    localStorage.setItem(STORAGE_KEYS.LOGS, JSON.stringify(logs));
  } catch (err) {
    console.error('Error appending review log:', err);
  }
}

/**
 * Retrieves user settings
 */
export function getSettings() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    const parsed = raw ? JSON.parse(raw) : {};
    return { ...DEFAULT_SETTINGS, ...parsed };
  } catch (err) {
    console.error('Error reading settings from localStorage:', err);
    return { ...DEFAULT_SETTINGS };
  }
}

/**
 * Updates settings partially
 */
export function updateSettings(partial) {
  try {
    const current = getSettings();
    const updated = { ...current, ...partial };
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(updated));
    return updated;
  } catch (err) {
    console.error('Error saving settings:', err);
    return DEFAULT_SETTINGS;
  }
}

/**
 * Exports all data as JSON
 */
export function exportAllData() {
  return JSON.stringify({
    version: 1,
    exportedAt: new Date().toISOString(),
    cards: getCards(),
    logs: getReviewLogs(),
    settings: getSettings()
  }, null, 2);
}

/**
 * Imports data from JSON string
 */
export function importAllData(jsonString) {
  try {
    const parsed = JSON.parse(jsonString);
    if (!parsed || !Array.isArray(parsed.cards)) {
      throw new Error('Invalid backup file format: missing cards array.');
    }

    const cards = parsed.cards.map(c => createCard(c));
    saveCards(cards);

    if (Array.isArray(parsed.logs)) {
      localStorage.setItem(STORAGE_KEYS.LOGS, JSON.stringify(parsed.logs));
    }
    if (parsed.settings && typeof parsed.settings === 'object') {
      updateSettings(parsed.settings);
    }

    return { success: true, count: cards.length };
  } catch (err) {
    console.error('Import error:', err);
    return { success: false, error: err.message };
  }
}

/**
 * Resets storage back to initial mock seed data
 */
export function resetToSeedData() {
  localStorage.setItem(STORAGE_KEYS.CARDS, JSON.stringify(INITIAL_MOCK_CARDS));
  localStorage.setItem(STORAGE_KEYS.LOGS, JSON.stringify(INITIAL_MOCK_LOGS));
  localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(DEFAULT_SETTINGS));
}
