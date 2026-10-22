/**
 * FreeWord - Speech Synthesis (Web Speech API) Audio Engine
 * Supports pronunciation in: EN, RU, DE, FR, IT, ES
 */

const LANG_CODE_MAP = {
  en: ['en-US', 'en-GB', 'en'],
  ru: ['ru-RU', 'ru'],
  de: ['de-DE', 'de'],
  fr: ['fr-FR', 'fr'],
  it: ['it-IT', 'it'],
  es: ['es-ES', 'es-MX', 'es']
};

let availableVoices = [];

function loadVoices() {
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    availableVoices = window.speechSynthesis.getVoices();
  }
}

if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
  loadVoices();
  if (window.speechSynthesis.onvoiceschanged !== undefined) {
    window.speechSynthesis.onvoiceschanged = loadVoices;
  }
}

/**
 * Finds the most suitable voice for a given language code
 */
export function getBestVoice(langCode = 'en') {
  if (availableVoices.length === 0) {
    loadVoices();
  }

  const preferredCodes = LANG_CODE_MAP[langCode] || [langCode];

  // Try exact match on preferred BCP 47 codes
  for (const code of preferredCodes) {
    const voice = availableVoices.find(v => v.lang.toLowerCase() === code.toLowerCase() || v.lang.toLowerCase().startsWith(code.toLowerCase()));
    if (voice) return voice;
  }

  // Fallback: match language prefix
  const voice = availableVoices.find(v => v.lang.toLowerCase().startsWith(langCode.toLowerCase()));
  return voice || null;
}

/**
 * Speaks the provided text in the target language
 * @param {string} text Word or sentence to pronounce
 * @param {string} lang Language code (e.g. 'en', 'ru', 'de', 'fr', 'it', 'es')
 * @param {Object} options Optional speech options (rate, pitch)
 * @returns {Promise<boolean>}
 */
export function speakText(text, lang = 'en', options = {}) {
  return new Promise((resolve) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      console.warn('SpeechSynthesis is not supported in this browser.');
      resolve(false);
      return;
    }

    if (!text || text.trim().length === 0) {
      resolve(false);
      return;
    }

    // Cancel any ongoing speech
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text.trim());
    utterance.lang = lang;
    utterance.rate = options.rate || 0.92; // Slightly measured pace for language learning
    utterance.pitch = options.pitch || 1.0;

    const voice = getBestVoice(lang);
    if (voice) {
      utterance.voice = voice;
      utterance.lang = voice.lang;
    }

    utterance.onend = () => resolve(true);
    utterance.onerror = (err) => {
      console.warn('SpeechSynthesis error:', err);
      resolve(false);
    };

    window.speechSynthesis.speak(utterance);
  });
}

/**
 * Checks if SpeechSynthesis is supported
 */
export function isAudioSupported() {
  return typeof window !== 'undefined' && 'speechSynthesis' in window;
}
