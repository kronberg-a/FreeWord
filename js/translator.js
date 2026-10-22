/**
 * FreeWord - In-App Translation & Duplicate Detection Engine
 * Integrates MyMemory public API with an expanded offline fallback dictionary across EN, RU, DE, FR, IT, ES.
 */

// Comprehensive offline dictionary fallback covering all seed words & definitions
const OFFLINE_DICTIONARY = {
  'ephemeral': {
    en: 'ephemeral, fleeting',
    de: 'flüchtig, vergänglich',
    ru: 'эфемерный, недолговечный',
    fr: 'éphémère, fugace',
    it: 'effimero, fugace',
    es: 'efímero, pasajero, que dura poco tiempo',
    def_en: 'Lasting for a very short time; transitory.',
    def_ru: 'Длится очень короткое время; преходящий, сиюминутный.',
    def_de: 'Nur eine sehr kurze Zeit andauernd; vergänglich.',
    def_fr: 'Qui ne dure que très peu de temps ; transitoire.',
    def_it: 'Che dura per brevissimo tempo; transitorio.',
    def_es: 'Que dura muy poco tiempo; pasajero, fugaz.'
  },
  'serendipity': {
    en: 'serendipity, happy accident',
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
    en: 'ubiquitous, omnipresent',
    de: 'allgegenwärtig',
    ru: 'вездесущий, повсеместный',
    fr: 'omniprésent, ubiquitaire',
    it: 'onnipresente, ubiquo',
    es: 'omnipresente, ubicuo',
    def_en: 'Present, appearing, or found everywhere at the same time; omnipresent.',
    def_ru: 'Присутствующий или встречающийся повсюду одновременно; вездесущий.',
    def_de: 'Gleichzeitig überall gegenwärtig oder verbreitet; omnipräsent.',
    def_fr: 'Présent en même temps en tout lieu ; omniprésent.',
    def_it: 'Presente contemporaneamente in ogni luogo; onnipresente.',
    def_es: 'Que está presente a un mismo tiempo en todas partes; omnipresente.'
  },
  'resilience': {
    en: 'resilience, toughness',
    de: 'Widerstandsfähigkeit, Resilienz',
    ru: 'стойкость, жизнестойкость, устойчивость',
    fr: 'résilience, résistance',
    it: 'resilienza, tenacia',
    es: 'resiliencia, capacidad de recuperación',
    def_en: 'The capacity of an individual or system to recover quickly from shocks.',
    def_ru: 'Способность человека или системы выдерживать удары и восстанавливаться.',
    def_de: 'Die Fähigkeit eines Individuums oder Systems, Krisen zu bewältigen und sich neu aufzubauen.',
    def_fr: 'Capacité d\'un individu ou d\'un système à surmonter les chocs et à se reconstruire.',
    def_it: 'Capacità di un individuo o sistema di resistere agli urti e riorganizzarsi.',
    def_es: 'Capacidad de un individuo o sistema para sobreponerse a los choques y reconstruirse.'
  },
  'la resilience': {
    en: 'resilience',
    de: 'Resilienz',
    ru: 'жизнестойкость',
    fr: 'résilience',
    it: 'resilienza',
    es: 'resiliencia',
    def_fr: 'Capacité d\'un individu ou d\'un système à surmonter les chocs et à se reconstruire.',
    def_en: 'Capacity of an individual or system to overcome shocks and rebuild.',
    def_ru: 'Способность человека или системы преодолевать удары судьбы и восстанавливаться.'
  },
  'fernweh': {
    en: 'longing for distant places, wanderlust',
    de: 'Fernweh, Sehnsucht nach der Ferne',
    ru: 'тоска по дальним странам, тяга к странствиям',
    fr: 'nostalgie des pays lointains',
    it: 'nostalgia di luoghi lontani',
    es: 'añoranza de tierras lejanas',
    def_de: 'Sehnsucht nach der Ferne und fernen Ländern.',
    def_en: 'An ache or homesickness for distant places you have never visited.',
    def_ru: 'Тоска по далеким странам, в которых ты еще не был.',
    def_fr: 'Nostalgie des pays lointains et du dépaysement.',
    def_it: 'Desiderio struggente di luoghi lontani non ancora visitati.',
    def_es: 'Anhelo de viajar a lugares lejanos y desconocidos.'
  },
  'das fernweh': {
    en: 'wanderlust, longing for travel',
    de: 'das Fernweh',
    ru: 'тоска по дальним странам, тяга к странствиям',
    fr: 'nostalgie des pays lointains',
    it: 'nostalgia di paesi lontani',
    es: 'añoranza de países lejanos',
    def_de: 'Sehnsucht nach der Ferne und fernen Ländern.',
    def_ru: 'Тоска по дальним странам, в которых ты никогда не бывал.'
  },
  'schadenfreude': {
    en: 'malicious joy, pleasure derived from another\'s misfortune',
    de: 'Schadenfreude',
    ru: 'злорадство',
    fr: 'joie malsaine, schadenfreude',
    it: 'compiacimento per le disgrazie altrui',
    es: 'alegría por el mal ajeno',
    def_de: 'Freude oder Genugtuung über das Unglück oder Missgeschick eines anderen Menschen.',
    def_en: 'Pleasure or satisfaction derived from someone else\'s misfortune or bad luck.',
    def_ru: 'Чувство удовлетворения или радости от неудач и несчастий другого человека.',
    def_fr: 'Plaisir ressenti face au malheur ou à l\'échec d\'autrui.',
    def_it: 'Sentimento di piacere provocato dalle disavventure altrui.',
    def_es: 'Placer o regocijo que se experimenta ante la desgracia ajena.'
  },
  'die schadenfreude': {
    en: 'malicious joy',
    de: 'Schadenfreude',
    ru: 'злорадство',
    fr: 'joie maligne',
    it: 'sadismo verbale',
    es: 'regocijo por el mal ajeno',
    def_de: 'Freude oder Genugtuung über das Unglück oder Missgeschick eines anderen Menschen.',
    def_en: 'Pleasure or satisfaction derived from someone else\'s misfortune.',
    def_ru: 'Радость от неудач другого человека.'
  },
  'nostalgia': {
    en: 'nostalgia, wistful yearning',
    de: 'Nostalgie, Wehmut',
    ru: 'ностальгия, светлая грусть',
    fr: 'nostalgie, mélancolie',
    it: 'nostalgia, rimpianto',
    es: 'nostalgia, añoranza',
    def_en: 'A sentimental longing or wistful affection for a period in the past.',
    def_es: 'Sentimiento de tristeza o melancolía provocado por el recuerdo de una dicha o tiempo perdido.',
    def_ru: 'Чувство тоски или меланхолии, вызванное воспоминаниями о прошлом.',
    def_de: 'Wehmütige Sehnsucht nach vergangenen Zeiten oder der Heimat.',
    def_fr: 'Regret mélancolique d\'une chose révolue ou d\'un temps passé.',
    def_it: 'Desiderio acuto e malinconico di tornare a uno stato o tempo del passato.'
  },
  'la nostalgia': {
    en: 'nostalgia',
    de: 'Nostalgie',
    ru: 'ностальгия',
    fr: 'nostalgie',
    it: 'nostalgia',
    es: 'nostalgia',
    def_es: 'Sentimiento de tristeza o melancolía provocado por el recuerdo de una dicha o tiempo perdido.',
    def_en: 'Feeling of sadness or melancholy caused by the memory of a lost happiness.'
  },
  'amertume': {
    en: 'bitterness, resentment',
    de: 'Bitterkeit, Verbitterung',
    ru: 'горечь, обида',
    fr: 'amertume',
    it: 'amarezza',
    es: 'amargura, resentimiento',
    def_fr: 'Saveur âpre, ou sentiment de tristesse mêlé de rancœur.',
    def_en: 'Sharp, bitter taste, or feeling of deep resentment.',
    def_ru: 'Горький вкус или тяжелое чувство обиды и разочарования.'
  },
  'lamertume': {
    en: 'bitterness, resentment',
    de: 'Bitterkeit',
    ru: 'горечь, обида',
    fr: 'l\'amertume',
    it: 'amarezza',
    es: 'amargura'
  },
  'mozzafiato': {
    en: 'breathtaking, stunning',
    de: 'atemberaubend, spektakulär',
    ru: 'захватывающий дух, потрясающий',
    fr: 'à couper le souffle, époustouflant',
    it: 'mozzafiato',
    es: 'asombroso, que corta la respiración',
    def_it: 'Tale da togliere il fiato per la commozione o la bellezza.',
    def_en: 'Astonishing or awe-inspiring to the point of taking one\'s breath away.'
  },
  'deslumbrante': {
    en: 'dazzling, stunning, blindingly brilliant',
    de: 'blendend, überwältigend',
    ru: 'ослепительный, великолепный',
    fr: 'éblouissant, resplendissant',
    it: 'abbagliante, folgorante',
    es: 'deslumbrante',
    def_es: 'Que deslumbra o impresiona vivamente por su brillo o belleza.',
    def_en: 'Extremely bright, impressive, or beautiful.'
  },
  'непревзойденный': {
    en: 'unmatched, unequaled, second to none',
    de: 'unübertroffen, unerreicht',
    ru: 'непревзойденный',
    fr: 'inégalé, sans égal, hors pair',
    it: 'insuperato, senza pari',
    es: 'inigualable, insuperable',
    def_ru: 'Такой, которого никто не превзошел; лучший в своем роде.',
    def_en: 'Better than everyone or everything else; unequaled.',
    def_fr: 'Qui ne peut être surpassé ; sans égal.'
  },
  'интроспекция': {
    en: 'introspection, self-examination',
    de: 'Introspektion, Selbstbeobachtung',
    ru: 'интроспекция',
    fr: 'introspection',
    it: 'introspezione',
    es: 'introspección',
    def_ru: 'Метод углубленного исследования и познания человеком собственных психических процессов и состояний.',
    def_en: 'The examination or observation of one\'s own mental and emotional processes.',
    def_de: 'Die Beobachtung und Analyse des eigenen seelischen Erlebens.'
  },
  'il capolavoro': {
    en: 'masterpiece',
    de: 'Meisterwerk',
    ru: 'шедевр',
    fr: 'chef-d\'œuvre',
    it: 'capolavoro',
    es: 'obra maestra',
    def_it: 'Opera eccellente o di sommo valore artistico o intellettuale realizzata da un autore.',
    def_en: 'An outstanding piece of artistic or intellectual work of highest quality.',
    def_es: 'Obra excelente o de máximo valor artístico o intelectual.'
  },
  'capolavoro': {
    en: 'masterpiece',
    de: 'Meisterwerk',
    ru: 'шедевр',
    fr: 'chef-d\'œuvre',
    it: 'capolavoro',
    es: 'obra maestra'
  }
};

/**
 * Normalizes lookup keys
 */
function cleanKey(text) {
  return (text || '')
    .toLowerCase()
    .replace(/[«»„“”"'`’]/g, '')
    .replace(/[.,\/#!$%\^&\*;:{}=\-_~()]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Translates text (word or full definition) using MyMemory API with offline fallback
 * @param {string} text Target text to translate
 * @param {string} sourceLang Source language code ('en', 'de', etc.)
 * @param {string} targetLang Target translation language code ('es', 'ru', etc.)
 * @returns {Promise<{translation: string, definition: string|null, provider: string}>}
 */
export async function translateText(text, sourceLang = 'en', targetLang = 'es') {
  const clean = text ? text.trim() : '';
  if (!clean) return { translation: '', definition: null, provider: 'none' };

  const normKey = cleanKey(clean);

  // 1. Try MyMemory public translation API
  try {
    const pair = `${sourceLang}|${targetLang}`;
    const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(clean)}&langpair=${pair}`;
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000); // 4s timeout

    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (response.ok) {
      const data = await response.json();
      if (data && data.responseData && data.responseData.translatedText) {
        const translatedText = data.responseData.translatedText.trim();
        // Check for MyMemory API warning payloads
        if (!translatedText.includes('QUERY LENGTH LIMIT') && !translatedText.includes('MYMEMORY WARNING')) {
          // Check if we have an offline definition match to enrich it
          const offlineMatch = OFFLINE_DICTIONARY[normKey];
          const defKey = offlineMatch 
            ? (offlineMatch[`def_${targetLang}`] || offlineMatch[`def_${sourceLang}`] || offlineMatch.def_en || null)
            : null;

          return {
            translation: translatedText,
            definition: defKey,
            provider: 'mymemory'
          };
        }
      }
    }
  } catch (err) {
    // Proceed to offline fallback on network error or timeout
  }

  // 2. Offline Dictionary Fallback
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

  // 3. Fallback when not found
  return {
    translation: '',
    definition: null,
    provider: 'fallback_empty'
  };
}

/**
 * Checks if a card with the same target word already exists in the study deck for the SPECIFIC mode
 * @param {Array} cards Current deck cards
 * @param {string} term Word to check
 * @param {string} sourceLang Language code of the word
 * @param {string} mode Card mode ('word' | 'definition')
 * @param {string|null} currentCardId Exclude this card ID when editing
 * @returns {Object|null} Matching duplicate card or null
 */
export function checkDuplicate(cards, term, sourceLang, mode = 'word', folderId = null, currentCardId = null) {
  if (!term || !cards || cards.length === 0) return null;
  const cleanTerm = cleanKey(term);

  const found = cards.find(c => {
    if (currentCardId && c.id === currentCardId) return false;
    if (folderId && c.folderId !== folderId) return false;
    return c.mode === mode && 
           c.sourceLang === sourceLang && 
           cleanKey(c.front) === cleanTerm;
  });

  return found || null;
}

/**
 * Simple debounce utility for input listeners
 */
export function debounce(func, wait = 350) {
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
