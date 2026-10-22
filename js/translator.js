/**
 * FreeWord - In-App Translation & Duplicate Detection Engine
 * Integrates MyMemory public API with an offline fallback dictionary across EN, RU, DE, FR, IT, ES.
 */

// Comprehensive offline dictionary fallback for common language learning terms
const OFFLINE_DICTIONARY = {
  // English words & translations
  'ephemeral': {
    de: 'flüchtig, vergänglich',
    ru: 'эфемерный, недолговечный',
    fr: 'éphémère, fugace',
    it: 'effimero, fugace',
    es: 'efímero, fugaz',
    def_en: 'Lasting for a very short time; transitory.',
    def_ru: 'Длится очень короткое время; преходящий, сиюминутный.',
    def_de: 'Nur eine sehr kurze Zeit andauernd; vergänglich.',
    def_fr: 'Qui ne dure que très peu de temps ; transitoire.',
    def_it: 'Che dura per brevissimo tempo; transitorio.',
    def_es: 'Que dura muy poco tiempo; pasajero, fugaz.'
  },
  'serendipity': {
    de: 'glücklicher Zufall, Serendipität',
    ru: 'счастливая случайность, интуитивная прозорливость',
    fr: 'sérendipité, heureux hasard',
    it: 'serendipità, lieta sorpresa',
    es: 'serendipia, hallazgo afortunado',
    def_en: 'The occurrence and development of events by chance in a happy or beneficial way.',
    def_ru: 'Случайное нахождение чего-то ценного или приятного без намеренных поисков.',
    def_de: 'Das zufällige Finden von etwas Wertvollem oder Angenehmem.',
    def_fr: 'La découverte heureuse et inattendue d\'une chose agréable ou utile.',
    def_it: 'La capacità di cogliere occasioni fortunate per puro caso.',
    def_es: 'Hallazgo afortunado e inesperado que se produce cuando se busca otra cosa.'
  },
  'ubiquitous': {
    de: 'allgegenwärtig',
    ru: 'вездесущий, повсеместный',
    fr: 'omniprésent, ubiquitaire',
    it: 'onnipresente, ubiquo',
    es: 'omnipresente, ubicuo',
    def_en: 'Present, appearing, or found everywhere at the same time.',
    def_ru: 'Присутствующий или встречающийся повсюду одновременно.',
    def_de: 'Gleichzeitig überall gegenwärtig oder verbreitet.',
    def_fr: 'Présent en même temps en tout lieu ; omniprésent.',
    def_it: 'Presente contemporaneamente in ogni luogo.',
    def_es: 'Que está presente a un mismo tiempo en todas partes.'
  },
  'resilience': {
    de: 'Widerstandsfähigkeit, Resilienz',
    ru: 'стойкость, жизнестойкость, устойчивость',
    fr: 'résilience, résistance',
    it: 'resilienza, tenacia',
    es: 'resiliencia, capacidad de recuperación',
    def_en: 'The capacity to recover quickly from difficulties; toughness.',
    def_ru: 'Способность быстро восстанавливаться после трудностей; стойкость.',
    def_de: 'Die Fähigkeit, Krisen zu bewältigen und gestärkt daraus hervorzugehen.',
    def_fr: 'La capacité à surmonter les difficultés et à rebondir.',
    def_it: 'La capacità di riprendersi rapidamente dalle avversità.',
    def_es: 'Capacidad de sobreponerse a situaciones adversas y adaptarse.'
  },
  'wanderlust': {
    en: 'wanderlust, strong desire to travel',
    de: 'Wanderlust, Fernweh',
    ru: 'страсть к путешествиям, тяга к странствиям',
    fr: 'envie de voyager, bougeotte',
    it: 'brama di viaggiare',
    es: 'pasión por viajar, ansia de viajar',
    def_en: 'A strong desire to travel and explore the world.',
    def_ru: 'Сильное, неодолимое желание путешествовать и исследовать мир.',
    def_de: 'Ein starker Drang, in die Ferne zu reisen und die Welt zu erkunden.',
    def_fr: 'Un désir irrépressible de voyager et de découvrir le monde.',
    def_it: 'Un forte desiderio di viaggiare e scoprire il mondo.',
    def_es: 'Un deseo muy fuerte de viajar y explorar el mundo.'
  },
  'fernweh': {
    en: 'longing for distant places, wanderlust',
    ru: 'тоска по дальним странам, тяга к неизведанному',
    fr: 'nostalgie des pays lointains',
    it: 'nostalgia di luoghi lontani',
    es: 'nostalgia de lugares lejanos',
    def_de: 'Sehnsucht nach der Ferne und fernen Ländern.',
    def_en: 'An ache or homesickness for distant places you have never visited.',
    def_ru: 'Тоска по далеким странам, в которых ты еще не был.',
    def_fr: 'Nostalgie des pays lointains et du dépaysement.',
    def_it: 'Desiderio struggente di luoghi lontani non ancora visitati.',
    def_es: 'Anhelo de viajar a lugares lejanos y desconocidos.'
  },
  'schadenfreude': {
    en: 'malicious joy, pleasure derived from another\'s misfortune',
    ru: 'злорадство',
    fr: 'joie malsaine, schadenfreude',
    it: 'compiacimento per le disgrazie altrui',
    es: 'alegría por el mal ajeno',
    def_de: 'Freude über das Missgeschick oder Unglück eines anderen.',
    def_en: 'Pleasure or satisfaction derived from someone else\'s misfortune.',
    def_ru: 'Чувство удовлетворения или радости от неудач другого человека.',
    def_fr: 'Plaisir ressenti face au malheur ou à l\'échec d\'autrui.',
    def_it: 'Sentimento di piacere provocato dalle disavventure altrui.',
    def_es: 'Placer o regocijo que se experimenta ante la desgracia ajena.'
  },
  'saudade': {
    en: 'melancholic longing, deep nostalgia',
    ru: 'щемящая тоска, светлая печаль, ностальгия',
    de: 'wehmütige Sehnsucht, Nostalgie',
    fr: 'mélancolie, nostalgie poignante',
    it: 'struggente nostalgia, saudade',
    es: 'nostalgia profunda, añoranza melancólica',
    def_en: 'A deep emotional state of melancholic longing for an absent person or place.',
    def_ru: 'Глубокая меланхоличная тоска по отсутствующему человеку, времени или месту.',
    def_de: 'Tiefe wehmütige Sehnsucht nach einer abwesenden Person oder einem Ort.',
    def_fr: 'Sentiment profond de nostalgie et de manque mêlé de mélancolie.',
    def_it: 'Stato d\'animo nostalgico e malinconico per qualcosa o qualcuno perduto.',
    def_es: 'Profundo estado emocional de añoranza melancólica por algo ausente.'
  },
  'nostalgia': {
    en: 'nostalgia, sentimental longing for the past',
    ru: 'ностальгия, тоска по прошлому',
    de: 'Nostalgie, Sehnsucht nach Vergangenem',
    fr: 'nostalgie, mélancolie du passé',
    it: 'nostalgia, rimpianto del passato',
    es: 'nostalgia, añoranza',
    def_en: 'A sentimental longing or wistful affection for the past.',
    def_ru: 'Тоска по родине или по прошедшим временам, воспоминания.',
    def_de: 'Wehmütige Sehnsucht nach vergangenen Zeiten oder der Heimat.',
    def_fr: 'Regret mélancolique d\'une chose révolue ou d\'un lieu éloigné.',
    def_it: 'Desiderio acuto di tornare a uno stato o luogo del passato.',
    def_es: 'Sentimiento de pena por la lejanía, la ausencia o la pérdida del pasado.'
  },
  'lucid': {
    de: 'klar, verständlich, luzide',
    ru: 'ясный, четкий, вразумительный',
    fr: 'lucide, clair, intelligible',
    it: 'lucido, chiaro, perspicuo',
    es: 'lúcido, claro, comprensible',
    def_en: 'Expressed clearly; easy to understand, or having full use of one\'s faculties.',
    def_ru: 'Ясный, легко понимаемый; находящийся в полном сознании.',
    def_de: 'Klar verständlich, einleuchtend oder bei vollem Bewusstsein.',
    def_fr: 'Exprimé avec clarté ; facile à comprendre ; conscient.',
    def_it: 'Espresso con grande chiarezza; comprensibile; pienamente cosciente.',
    def_es: 'Expresado con claridad; fácil de entender o en pleno uso de facultades.'
  }
};

/**
 * Translates a term using MyMemory API with offline fallback
 * @param {string} text Target term to translate
 * @param {string} sourceLang Source language code ('en', 'de', etc.)
 * @param {string} targetLang Target translation language code ('es', 'ru', etc.)
 * @returns {Promise<{translation: string, definition: string|null, provider: string}>}
 */
export async function translateText(text, sourceLang = 'en', targetLang = 'es') {
  const clean = text.trim();
  if (!clean) return { translation: '', definition: null, provider: 'none' };

  const normKey = clean.toLowerCase();

  // Try MyMemory public translation API
  try {
    const pair = `${sourceLang}|${targetLang}`;
    const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(clean)}&langpair=${pair}`;
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4500); // 4.5s timeout

    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (response.ok) {
      const data = await response.json();
      if (data && data.responseData && data.responseData.translatedText) {
        const translatedText = data.responseData.translatedText;
        // Don't return error messages from MyMemory as translations
        if (!translatedText.includes('QUERY LENGTH LIMIT') && !translatedText.includes('MYMEMORY WARNING')) {
          // Check if we have an offline definition match to enrich it
          const offlineMatch = OFFLINE_DICTIONARY[normKey];
          const defKey = `def_${targetLang}` in (offlineMatch || {}) ? offlineMatch[`def_${targetLang}`] : (offlineMatch ? offlineMatch.def_en : null);

          return {
            translation: translatedText,
            definition: defKey || null,
            provider: 'mymemory'
          };
        }
      }
    }
  } catch (err) {
    // Network error or timeout, proceed to offline fallback
    console.info('Online translation unavailable, using internal dictionary fallback:', err.message);
  }

  // Offline Dictionary Fallback
  const entry = OFFLINE_DICTIONARY[normKey];
  if (entry) {
    const translation = entry[targetLang] || entry['en'] || clean;
    const definition = entry[`def_${targetLang}`] || entry[`def_${sourceLang}`] || entry['def_en'] || null;
    return {
      translation,
      definition,
      provider: 'offline_dictionary'
    };
  }

  // Default heuristic fallback if no entry found
  return {
    translation: '',
    definition: null,
    provider: 'fallback_empty'
  };
}

/**
 * Checks if a card with the same target word already exists in the study deck
 * @param {Array} cards Current deck cards
 * @param {string} term Word to check
 * @param {string} sourceLang Language code of the word
 * @param {string|null} currentCardId Exclude this card ID when editing
 * @returns {Object|null} Matching duplicate card or null
 */
export function checkDuplicate(cards, term, sourceLang, currentCardId = null) {
  if (!term || !cards || cards.length === 0) return null;
  const cleanTerm = term.trim().toLowerCase();

  const found = cards.find(c => {
    if (currentCardId && c.id === currentCardId) return false;
    return c.front.trim().toLowerCase() === cleanTerm && c.sourceLang === sourceLang;
  });

  return found || null;
}

/**
 * Simple debounce utility for input listeners
 */
export function debounce(func, wait = 400) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}
