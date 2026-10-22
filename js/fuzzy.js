/**
 * FreeWord - Multi-Language Fuzzy Definition Evaluation Engine
 * Supports: EN, RU, DE, FR, IT, ES
 * Computes:
 * - Token Set Similarity (Jaccard Index)
 * - Normalized Levenshtein String Similarity
 * - Multi-Token & Stemmed Key Concept Extraction & Coverage
 * - Hybrid Weighted Semantic Score (0-100%)
 * - Side-by-Side Highlighted Semantic Diff
 */

// Common stop words for all 6 supported languages
export const STOP_WORDS = {
  en: new Set([
    'a', 'an', 'the', 'and', 'or', 'but', 'is', 'are', 'was', 'were', 'be', 'been',
    'being', 'to', 'of', 'in', 'on', 'at', 'by', 'for', 'with', 'about', 'against',
    'between', 'into', 'through', 'during', 'before', 'after', 'above', 'below',
    'from', 'up', 'down', 'out', 'off', 'over', 'under', 'again', 'further', 'then',
    'once', 'here', 'there', 'when', 'where', 'why', 'how', 'all', 'any', 'both',
    'each', 'few', 'more', 'most', 'other', 'some', 'such', 'no', 'nor', 'not',
    'only', 'own', 'same', 'so', 'than', 'too', 'very', 's', 't', 'can', 'will',
    'just', 'don', 'should', 'now', 'that', 'this', 'these', 'those', 'it', 'its',
    'which', 'who', 'whom', 'what', 'as', 'has', 'have', 'had', 'having', 'do',
    'does', 'did', 'doing', 'i', 'you', 'he', 'she', 'we', 'they', 'their', 'our'
  ]),

  ru: new Set([
    'и', 'в', 'во', 'не', 'что', 'он', 'на', 'я', 'с', 'со', 'как', 'а', 'то', 'все',
    'она', 'так', 'его', 'но', 'да', 'ты', 'к', 'у', 'же', 'вы', 'за', 'бы', 'по',
    'только', 'ее', 'мне', 'было', 'вот', 'от', 'меня', 'еще', 'нет', 'о', 'из',
    'ему', 'теперь', 'когда', 'даже', 'ну', 'вдруг', 'ли', 'если', 'уже', 'или',
    'ни', 'быть', 'был', 'него', 'до', 'вас', 'нибудь', 'опять', 'уж', 'вам', 'ведь',
    'там', 'потом', 'себя', 'ничего', 'ей', 'может', 'они', 'тут', 'где', 'есть',
    'надо', 'ней', 'для', 'мы', 'тебя', 'их', 'чем', 'была', 'сам', 'чтоб', 'без',
    'будто', 'чего', 'раз', 'тоже', 'себе', 'под', 'будет', 'ж', 'тогда', 'кто',
    'этот', 'того', 'потому', 'этого', 'какой', 'совсем', 'ним', 'здесь', 'этом',
    'один', 'почти', 'мой', 'тем', 'чтобы', 'нее', 'сейчас', 'были', 'куда', 'зачем'
  ]),

  de: new Set([
    'der', 'die', 'das', 'den', 'dem', 'des', 'ein', 'eine', 'einer', 'einem', 'einen',
    'eines', 'und', 'oder', 'aber', 'ist', 'sind', 'war', 'waren', 'sein', 'gewesen',
    'zu', 'von', 'in', 'im', 'auf', 'an', 'am', 'bei', 'beim', 'mit', 'über', 'unter',
    'vor', 'nach', 'für', 'gegen', 'ohne', 'durch', 'als', 'wie', 'auch', 'nicht',
    'nur', 'noch', 'so', 'wenn', 'dann', 'da', 'hier', 'dort', 'wo', 'wer', 'was',
    'warum', 'wie', 'welche', 'welcher', 'welches', 'dieser', 'diese', 'dieses',
    'er', 'sie', 'es', 'wir', 'ihr', 'ihnen', 'ihr', 'ihre', 'sein', 'seine', 'seiner'
  ]),

  fr: new Set([
    'le', 'la', 'les', 'un', 'une', 'des', 'du', 'de', 'd', 'l', 'et', 'ou', 'mais',
    'est', 'sont', 'était', 'étaient', 'être', 'été', 'à', 'en', 'dans', 'sur', 'sous',
    'par', 'pour', 'avec', 'sans', 'chez', 'comme', 'qui', 'que', 'quoi', 'dont', 'où',
    'ce', 'cette', 'ces', 'cet', 'il', 'elle', 'ils', 'elles', 'on', 'nous', 'vous',
    'mon', 'ton', 'son', 'notre', 'votre', 'leur', 'mes', 'tes', 'ses', 'nos', 'vos',
    'leurs', 'ne', 'pas', 'plus', 'aussi', 'bien', 'très', 'y', 'faire', 'tout', 'tous'
  ]),

  it: new Set([
    'il', 'lo', 'la', 'i', 'gli', 'le', 'un', 'uno', 'una', 'un\'', 'di', 'a', 'da',
    'in', 'con', 'su', 'per', 'tra', 'fra', 'e', 'ed', 'o', 'od', 'ma', 'se', 'che',
    'chi', 'cui', 'non', 'più', 'è', 'sono', 'era', 'erano', 'stato', 'stata', 'essere',
    'questo', 'questa', 'questi', 'queste', 'quello', 'quella', 'quelli', 'quelle',
    'io', 'tu', 'lui', 'lei', 'noi', 'voi', 'loro', 'mio', 'tuo', 'suo', 'nostro', 'vostro'
  ]),

  es: new Set([
    'el', 'la', 'los', 'las', 'un', 'una', 'unos', 'unas', 'de', 'del', 'a', 'al',
    'en', 'con', 'por', 'para', 'sin', 'sobre', 'entre', 'hacia', 'hasta', 'y', 'e',
    'o', 'u', 'pero', 'mas', 'que', 'quien', 'cual', 'donde', 'cuando', 'como',
    'es', 'son', 'fue', 'eran', 'ser', 'sido', 'estar', 'este', 'esta', 'estos',
    'estas', 'ese', 'esa', 'esos', 'esas', 'aquel', 'aquella', 'yo', 'tu', 'el',
    'ella', 'nosotros', 'ellos', 'ellas', 'su', 'sus', 'mi', 'mis', 'tu', 'tus', 'no', 'si'
  ])
};

/**
 * Normalizes a word or phrase for comparison:
 * Lowercases, maps German ß to ss, strips diacritics where appropriate,
 * splits elision apostrophes, and removes punctuation.
 */
export function normalizeWord(word) {
  if (!word) return '';
  return word
    .toLowerCase()
    .replace(/ß/g, 'ss')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // strip diacritics
    .replace(/['’]/g, ' ')           // split apostrophes (e.g. l'amertume -> l amertume)
    .replace(/[^\p{L}\p{N}\s]/gu, '') // keep letters, numbers and spaces
    .trim();
}

/**
 * Tokenizes text into an array of clean words
 */
export function tokenize(text, lang = 'en') {
  if (!text) return [];
  const normalized = normalizeWord(text);
  return normalized
    .split(/\s+/)
    .map(w => w.trim())
    .filter(w => w.length > 0);
}

/**
 * Strips stop words based on language
 */
export function filterContentWords(tokens, lang = 'en') {
  const stops = STOP_WORDS[lang] || STOP_WORDS.en;
  return tokens.filter(token => {
    return token.length > 1 && !stops.has(token);
  });
}

/**
 * Levenshtein distance between two strings
 */
export function levenshteinDistance(s1, s2) {
  const m = s1.length;
  const n = s2.length;
  if (m === 0) return n;
  if (n === 0) return m;

  const d = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));

  for (let i = 0; i <= m; i++) d[i][0] = i;
  for (let j = 0; j <= n; j++) d[0][j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = s1[i - 1] === s2[j - 1] ? 0 : 1;
      d[i][j] = Math.min(
        d[i - 1][j] + 1,       // deletion
        d[i][j - 1] + 1,       // insertion
        d[i - 1][j - 1] + cost // substitution
      );
    }
  }

  return d[m][n];
}

/**
 * Normalized string similarity (0.0 to 1.0) based on Levenshtein distance
 */
export function stringSimilarity(s1, s2) {
  const maxLen = Math.max(s1.length, s2.length);
  if (maxLen === 0) return 1.0;
  const dist = levenshteinDistance(s1, s2);
  return Math.max(0, 1.0 - dist / maxLen);
}

/**
 * Checks if a single word or multi-word term matches candidate tokens or text
 */
export function hasFuzzyMatch(target, candidateTokens, fullUserText = '') {
  const cleanTarget = normalizeWord(target);
  if (!cleanTarget) return false;

  // 1. Multi-word phrase check in full text
  if (cleanTarget.includes(' ')) {
    if (fullUserText) {
      const normFull = normalizeWord(fullUserText);
      if (normFull.includes(cleanTarget)) return true;
    }
    // Also check if all sub-tokens of the target phrase are present in candidate tokens
    const subWords = cleanTarget.split(/\s+/).filter(Boolean);
    const allFound = subWords.every(sw => hasFuzzyMatch(sw, candidateTokens));
    if (allFound) return true;
  }

  // 2. Unigram comparison
  for (const cand of candidateTokens) {
    const cleanCand = normalizeWord(cand);
    if (!cleanCand) continue;
    if (cleanTarget === cleanCand) return true;

    // Stem / prefix matching for inflected forms (require minimum length 5)
    if (cleanTarget.length >= 5 && cleanCand.length >= 5) {
      const stemLen = Math.min(cleanTarget.length, cleanCand.length, 5);
      if (cleanTarget.slice(0, stemLen) === cleanCand.slice(0, stemLen)) {
        return true;
      }
    }

    // Levenshtein similarity for typos
    if (cleanTarget.length >= 4 && cleanCand.length >= 4) {
      if (stringSimilarity(cleanTarget, cleanCand) >= 0.78) {
        return true;
      }
    }
  }

  return false;
}

/**
 * Extracts key concepts from reference text or returns user-specified key concepts
 */
export function extractKeyConcepts(text, lang = 'en', manualConcepts = []) {
  if (manualConcepts && manualConcepts.length > 0) {
    return manualConcepts.map(c => c.trim()).filter(Boolean);
  }

  const tokens = tokenize(text, lang);
  const contentWords = filterContentWords(tokens, lang);
  
  // Pick unique words of length >= 3
  const unique = Array.from(new Set(contentWords.filter(w => w.length >= 3)));
  return unique.slice(0, 8); // Top concepts
}

/**
 * Main Hybrid Evaluation Function
 * @param {string} userText The definition entered by the user
 * @param {string} refText The reference definition stored in the card
 * @param {Array} explicitKeyConcepts Optional user-defined key concepts
 * @param {string} lang Language code ('en', 'ru', 'de', etc.)
 * @returns {Object} Evaluation report
 */
/**
 * Calculates Bigram Dice coefficient between two strings (0.0 to 1.0)
 */
export function bigramDiceCoefficient(s1, s2) {
  const norm1 = normalizeWord(s1).replace(/\s+/g, ' ');
  const norm2 = normalizeWord(s2).replace(/\s+/g, ' ');

  if (!norm1 && !norm2) return 1.0;
  if (!norm1 || !norm2) return 0.0;
  if (norm1 === norm2) return 1.0;
  if (norm1.length < 2 || norm2.length < 2) {
    return norm1 === norm2 ? 1.0 : stringSimilarity(norm1, norm2);
  }

  const getBigrams = (str) => {
    const map = new Map();
    for (let i = 0; i < str.length - 1; i++) {
      const bg = str.slice(i, i + 2);
      map.set(bg, (map.get(bg) || 0) + 1);
    }
    return map;
  };

  const bg1 = getBigrams(norm1);
  const bg2 = getBigrams(norm2);

  let intersection = 0;
  for (const [bg, count1] of bg1.entries()) {
    if (bg2.has(bg)) {
      intersection += Math.min(count1, bg2.get(bg));
    }
  }

  const total = (norm1.length - 1) + (norm2.length - 1);
  return total > 0 ? (2.0 * intersection) / total : 0;
}

/**
 * Word Mode Evaluator (Section 4.1):
 * Normalizes user input and reference answer, strips diacritics/punctuation,
 * and strictly checks against full back and comma/semicolon/slash separated synonyms.
 */
export function evaluateWordAnswer(typed, referenceBack) {
  if (!typed || !referenceBack) return false;
  const cleanTyped = normalizeWord(typed);
  if (!cleanTyped) return false;

  const cleanBack = normalizeWord(referenceBack);
  if (cleanBack === cleanTyped) return true;

  // Split referenceBack by comma, semicolon, or slash
  const options = referenceBack.split(/[,;\/]+/).map(s => s.trim()).filter(Boolean);
  for (const opt of options) {
    const cleanOpt = normalizeWord(opt);
    if (!cleanOpt) continue;
    if (cleanOpt === cleanTyped) return true;
  }

  return false;
}

/**
 * Main Hybrid Evaluation Function for Definition Mode (Section 4.2):
 * Evaluates user typed explanation vs reference definition:
 * 1. Token normalization + stop-word removal for EN, RU, DE, FR, IT, ES.
 * 2. Keyword Coverage (70% weight): unique meaningful reference tokens in user input
 *    with Levenshtein distance <= 2 per token to forgive minor spelling typos.
 * 3. Sequence / String Similarity (30% weight): Bigram Dice coefficient.
 *
 * @param {string} userText The definition entered by the user
 * @param {string} refText The reference definition stored in the card
 * @param {Array} explicitKeyConcepts Optional user-defined key concepts
 * @param {string} lang Language code ('en', 'ru', 'de', etc.)
 * @returns {Object} Evaluation report
 */
export function evaluateDefinition(userText, refText, explicitKeyConcepts = [], lang = 'en') {
  const normLang = (lang || 'en').toLowerCase();
  const userTokens = tokenize(userText, normLang);
  const refTokens = tokenize(refText, normLang);

  const userContent = filterContentWords(userTokens, normLang);
  const refContent = filterContentWords(refTokens, normLang);

  // Extract Target Keywords: unique meaningful reference words + explicit concepts
  const rawConcepts = extractKeyConcepts(refText, normLang, explicitKeyConcepts);
  // Merge unique tokens from refContent and rawConcepts
  const targetConceptSet = new Set(rawConcepts.map(c => normalizeWord(c)));
  refContent.forEach(word => {
    if (word.length >= 3) {
      targetConceptSet.add(word);
    }
  });

  const targetKeywords = Array.from(targetConceptSet).filter(Boolean);

  // 1. Keyword Coverage (70% weight) with Levenshtein <= 2 per token
  let matchedKeywordsCount = 0;
  const conceptMatches = [];

  targetKeywords.forEach(keyword => {
    let matched = false;

    // Direct multi-word check in user input
    if (keyword.includes(' ')) {
      const normUser = normalizeWord(userText);
      if (normUser.includes(keyword)) {
        matched = true;
      }
    }

    if (!matched) {
      // Check against user tokens with typo tolerance
      for (const uTok of userTokens) {
        const cleanUTok = normalizeWord(uTok);
        if (!cleanUTok) continue;

        if (cleanUTok === keyword) {
          matched = true;
          break;
        }

        // Stem matching if length >= 5
        if (keyword.length >= 5 && cleanUTok.length >= 5) {
          const stemLen = Math.min(keyword.length, cleanUTok.length, 5);
          if (keyword.slice(0, stemLen) === cleanUTok.slice(0, stemLen)) {
            matched = true;
            break;
          }
        }

        // Levenshtein distance <= 2 per token for minor typos
        const maxDist = keyword.length <= 3 ? 1 : 2;
        if (Math.abs(cleanUTok.length - keyword.length) <= maxDist) {
          if (levenshteinDistance(keyword, cleanUTok) <= maxDist) {
            matched = true;
            break;
          }
        }
      }
    }

    if (matched) {
      matchedKeywordsCount++;
    }
    conceptMatches.push({ concept: keyword, matched });
  });

  const keywordCoverage = targetKeywords.length > 0 
    ? (matchedKeywordsCount / targetKeywords.length) 
    : (userContent.length > 0 ? 0.80 : 0);

  // 2. Sequence / String Similarity (30% weight): Bigram Dice Coefficient
  const diceSimilarity = bigramDiceCoefficient(userText, refText);
  const levSimilarity = stringSimilarity(normalizeWord(userText), normalizeWord(refText));
  const sequenceScore = Math.max(diceSimilarity, levSimilarity);

  // 3. Hybrid Weighted Score: 70% Keyword Coverage + 30% Sequence Similarity
  const rawScore = (keywordCoverage * 0.70) + (sequenceScore * 0.30);
  const scorePercent = Math.min(100, Math.max(0, Math.round(rawScore * 100)));

  // Thresholds & Visual Classification:
  // Green: >= 75% Accurate (Pass)
  // Amber: 50-74% Partial (Fail turn, retry attempt)
  // Red: < 50% Divergent (Fail turn, retry attempt)
  let tier = 'divergent';
  let suggestedRating = 1; // Again
  let tierColor = 'var(--color-danger)';

  if (scorePercent >= 75) {
    tier = 'accurate';
    suggestedRating = scorePercent >= 88 ? 4 : 3; // Easy or Good
    tierColor = 'var(--color-success)';
  } else if (scorePercent >= 50) {
    tier = 'partial';
    suggestedRating = 2; // Hard
    tierColor = 'var(--color-warning)';
  }

  // 4. Side-by-Side Highlighted Diff
  const diff = generateSideBySideDiff(userText, refText, normLang, targetKeywords);
  const missingCount = Math.max(0, targetKeywords.length - matchedKeywordsCount);

  return {
    scorePercent,
    tier,
    tierColor,
    suggestedRating,
    isPassed: scorePercent >= 75,
    missingCount,
    metrics: {
      keywordCoverage: Math.round(keywordCoverage * 100),
      sequenceSimilarity: Math.round(sequenceScore * 100),
      diceSimilarity: Math.round(diceSimilarity * 100),
      levenshtein: Math.round(levSimilarity * 100)
    },
    conceptMatches,
    diff
  };
}

/**
 * Builds side-by-side tokenized diff with matched, missing, and extra highlighted tokens
 */
export function generateSideBySideDiff(userText, refText, lang, keyConcepts = []) {
  const userWords = userText.trim().split(/\s+/).filter(Boolean);
  const refWords = refText.trim().split(/\s+/).filter(Boolean);

  const cleanUserTokens = userWords.map(w => normalizeWord(w));
  const cleanRefTokens = refWords.map(w => normalizeWord(w));

  // Build Reference Highlights:
  const refTokensHtml = refWords.map((word, idx) => {
    const norm = cleanRefTokens[idx];
    const isStop = STOP_WORDS[lang]?.has(norm);
    const isConcept = keyConcepts.some(c => hasFuzzyMatch(c, [norm], norm));
    const isMatched = hasFuzzyMatch(norm, cleanUserTokens, userText);

    if (isMatched && !isStop) {
      return `<mark class="diff-token match" title="Matched key term">${escapeHtml(word)}</mark>`;
    } else if (!isMatched && isConcept) {
      return `<mark class="diff-token missing-concept" title="Missing essential concept">${escapeHtml(word)}</mark>`;
    } else if (!isMatched && !isStop && norm.length > 2) {
      return `<mark class="diff-token missing" title="Missing reference word">${escapeHtml(word)}</mark>`;
    } else {
      return `<span class="diff-token neutral">${escapeHtml(word)}</span>`;
    }
  }).join(' ');

  // Build User Highlights:
  const userTokensHtml = userWords.map((word, idx) => {
    const norm = cleanUserTokens[idx];
    const isStop = STOP_WORDS[lang]?.has(norm);
    const isMatched = hasFuzzyMatch(norm, cleanRefTokens, refText);

    if (isMatched && !isStop) {
      return `<mark class="diff-token match" title="Accurately matched">${escapeHtml(word)}</mark>`;
    } else if (!isMatched && !isStop && norm.length > 2) {
      return `<mark class="diff-token extra" title="Extra / Unmatched explanation">${escapeHtml(word)}</mark>`;
    } else {
      return `<span class="diff-token neutral">${escapeHtml(word)}</span>`;
    }
  }).join(' ');

  return {
    refHtml: refTokensHtml || '<em>(empty)</em>',
    userHtml: userTokensHtml || '<em>(empty)</em>'
  };
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
