/**
 * FreeWord - Storage & Persistence Engine (LocalStorage + Export/Import)
 * Handles Folders, Cards, Review Logs, and User Settings with strict schemas.
 */

import { INITIAL_MOCK_FOLDERS, INITIAL_MOCK_CARDS, INITIAL_MOCK_LOGS } from './mockData.js';
import { createCard } from './srs.js';

export const STORAGE_KEYS = {
  FOLDERS: 'freeword_folders',
  CARDS: 'freeword_cards',
  LOGS: 'freeword_logs',
  SETTINGS: 'freeword_settings'
};

export const DEFAULT_SETTINGS = {
  activeMode: 'all', // 'all' | 'word' | 'definition'
  theme: 'dark',     // 'dark' | 'light'
  dailyNewLimit: 20,
  dailyNewLimitNoLimit: false,
  dailyReviewLimit: 50,
  dailyReviewLimitNoLimit: false,
  defaultSourceLang: 'en',
  defaultTargetLang: 'es',
  selectedLanguagePair: 'all',
  selectedFolderIds: ['folder_words_1', 'folder_defs_1', 'folder_mixed_1']
};

/**
 * Initializes storage with mock data if first run
 */
export function initStorage() {
  const existingFolders = localStorage.getItem(STORAGE_KEYS.FOLDERS);
  if (!existingFolders) {
    localStorage.setItem(STORAGE_KEYS.FOLDERS, JSON.stringify(INITIAL_MOCK_FOLDERS));
  }

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
  } else {
    // Ensure any new setting fields are merged in
    try {
      const parsed = JSON.parse(existingSettings);
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify({ ...DEFAULT_SETTINGS, ...parsed }));
    } catch (e) {
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(DEFAULT_SETTINGS));
    }
  }
}

// ==========================================
// FOLDERS CRUD
// ==========================================

export function getFolders() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.FOLDERS);
    return raw ? JSON.parse(raw) : [];
  } catch (err) {
    console.error('Error reading folders from localStorage:', err);
    return [];
  }
}

export function saveFolders(folders) {
  try {
    localStorage.setItem(STORAGE_KEYS.FOLDERS, JSON.stringify(folders));
  } catch (err) {
    console.error('Error saving folders:', err);
  }
}

export function addFolder({ name, folderType = 'mixed' }) {
  const folders = getFolders();
  const newFolder = {
    id: 'folder_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6),
    name: name.trim() || 'Untitled Folder',
    folderType, // 'words' | 'definitions' | 'mixed'
    createdAt: new Date().toISOString()
  };
  folders.push(newFolder);
  saveFolders(folders);

  // Auto-select new folder for sessions
  const settings = getSettings();
  const selected = new Set(settings.selectedFolderIds || []);
  selected.add(newFolder.id);
  updateSettings({ selectedFolderIds: Array.from(selected) });

  return newFolder;
}

export function updateFolder(updatedFolder) {
  const folders = getFolders();
  const idx = folders.findIndex(f => f.id === updatedFolder.id);
  if (idx !== -1) {
    folders[idx] = { ...folders[idx], ...updatedFolder };
    saveFolders(folders);
    return folders[idx];
  }
  return null;
}

export function deleteFolder(folderId) {
  const folders = getFolders();
  const filtered = folders.filter(f => f.id !== folderId);
  saveFolders(filtered);

  // Also remove cards that belonged to this folder
  const cards = getCards();
  const remainingCards = cards.filter(c => c.folderId !== folderId);
  saveCards(remainingCards);

  // Update selectedFolderIds in settings
  const settings = getSettings();
  if (settings.selectedFolderIds) {
    const newSelected = settings.selectedFolderIds.filter(id => id !== folderId);
    updateSettings({ selectedFolderIds: newSelected });
  }

  return filtered;
}

export function getFolderById(folderId) {
  const folders = getFolders();
  return folders.find(f => f.id === folderId) || null;
}

// ==========================================
// CARDS CRUD
// ==========================================

export function getCards() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.CARDS);
    return raw ? JSON.parse(raw) : [];
  } catch (err) {
    console.error('Error reading cards from localStorage:', err);
    return [];
  }
}

export function saveCards(cards) {
  try {
    localStorage.setItem(STORAGE_KEYS.CARDS, JSON.stringify(cards));
  } catch (err) {
    console.error('Error saving cards to localStorage:', err);
  }
}

export function addCard(cardData) {
  // Ensure valid folderId
  let folderId = cardData.folderId;
  const folders = getFolders();
  if (!folderId || !folders.some(f => f.id === folderId)) {
    // Pick first compatible folder or any folder
    const compatible = folders.find(f => f.folderType === 'mixed' || (cardData.mode === 'word' ? f.folderType === 'words' : f.folderType === 'definitions'));
    folderId = compatible ? compatible.id : (folders[0] ? folders[0].id : 'folder_default');
  }

  const card = createCard({ ...cardData, folderId });
  const cards = getCards();
  cards.unshift(card);
  saveCards(cards);
  return card;
}

export function addCards(cardsDataArray) {
  const folders = getFolders();
  const existingCards = getCards();
  const createdCards = cardsDataArray.map(cardData => {
    let folderId = cardData.folderId;
    if (!folderId || !folders.some(f => f.id === folderId)) {
      const compatible = folders.find(f => f.folderType === 'mixed' || (cardData.mode === 'word' ? f.folderType === 'words' : f.folderType === 'definitions'));
      folderId = compatible ? compatible.id : (folders[0] ? folders[0].id : 'folder_default');
    }
    return createCard({ ...cardData, folderId });
  });

  const updatedCards = [...createdCards, ...existingCards];
  saveCards(updatedCards);
  return createdCards;
}

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

export function deleteCard(cardId) {
  const cards = getCards();
  const filtered = cards.filter(c => c.id !== cardId);
  saveCards(filtered);
  return filtered;
}

export function moveCardToFolder(cardId, newFolderId) {
  const cards = getCards();
  const card = cards.find(c => c.id === cardId);
  const targetFolder = getFolderById(newFolderId);

  if (!card || !targetFolder) {
    return { success: false, error: 'Card or folder not found.' };
  }

  // Strict type check
  if (targetFolder.folderType === 'words' && card.mode !== 'word') {
    return { success: false, error: 'Cannot move definition card to a Words-Only folder.' };
  }
  if (targetFolder.folderType === 'definitions' && card.mode !== 'definition') {
    return { success: false, error: 'Cannot move word card to a Definitions-Only folder.' };
  }

  card.folderId = newFolderId;
  saveCards(cards);
  return { success: true, card };
}

export function resetCardSRS(cardId) {
  const cards = getCards();
  const card = cards.find(c => c.id === cardId);
  if (card) {
    card.status = 'new';
    card.interval = 0;
    card.repetitions = 0;
    card.easeFactor = 2.50;
    card.nextReviewDate = new Date().toISOString();
    card.lastReviewedDate = null;
    saveCards(cards);
    return card;
  }
  return null;
}

// ==========================================
// REVIEW LOGS
// ==========================================

export function getReviewLogs() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.LOGS);
    return raw ? JSON.parse(raw) : [];
  } catch (err) {
    console.error('Error reading logs from localStorage:', err);
    return [];
  }
}

export function addReviewLog(logEntry) {
  try {
    const logs = getReviewLogs();
    logs.push(logEntry);
    localStorage.setItem(STORAGE_KEYS.LOGS, JSON.stringify(logs));
  } catch (err) {
    console.error('Error appending review log:', err);
  }
}

// ==========================================
// SETTINGS
// ==========================================

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

// ==========================================
// BACKUP: EXPORT & IMPORT
// ==========================================

export function exportAllData() {
  return JSON.stringify({
    version: 2,
    exportedAt: new Date().toISOString(),
    folders: getFolders(),
    cards: getCards(),
    logs: getReviewLogs(),
    settings: getSettings()
  }, null, 2);
}

export function importAllData(jsonString) {
  try {
    const parsed = JSON.parse(jsonString);
    if (!parsed || !Array.isArray(parsed.cards)) {
      throw new Error('Invalid backup file format: missing cards array.');
    }

    // Restore folders
    if (Array.isArray(parsed.folders) && parsed.folders.length > 0) {
      saveFolders(parsed.folders);
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

export function resetToSeedData() {
  localStorage.setItem(STORAGE_KEYS.FOLDERS, JSON.stringify(INITIAL_MOCK_FOLDERS));
  localStorage.setItem(STORAGE_KEYS.CARDS, JSON.stringify(INITIAL_MOCK_CARDS));
  localStorage.setItem(STORAGE_KEYS.LOGS, JSON.stringify(INITIAL_MOCK_LOGS));
  localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(DEFAULT_SETTINGS));
}
