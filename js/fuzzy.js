/**
 * FreeWord - Multi-Language Fuzzy Definition Evaluation Engine
 * Supports: EN, RU, DE, FR, IT, ES
 * Computes:
 * - Token Set Similarity (Jaccard Index)
 * - Normalized Levenshtein String Similarity
 * - Key Concept Extraction & Coverage
 * - Hybrid Weighted Semantic Score (0-100%)
 * - Side-by-Side Highlighted Diff
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
 * Normalizes a word for comparison:
 * Lowercases, strips diacritics/accents where appropriate, removes punctuation.
 */
export function normalizeWord(word) {
  if (!word) return '';
  return word
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // remove accent marks for relaxed root matching
    .replace(/[^\p{L}\p{N}]/gu, ''); // keep unicode letters and numbers
}

/**
 * Tokenizes text into an array of clean words
 */
export function tokenize(text, lang = 'en') {
  if (!text) return [];
  const words = text
    .toLowerCase()
    .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?"'«»„“”]/g, ' ')
    .split(/\s+/)
    .map(w => w.trim())
    .filter(w => w.length > 0);
  return words;
}

/**
 * Strips stop words based on language (or all if not specified)
 */
export function filterContentWords(tokens, lang = 'en') {
  const stops = STOP_WORDS[lang] || STOP_WORDS.en;
  return tokens.filter(token => {
    const norm = normalizeWord(token);
    return norm.length > 1 && !stops.has(token) && !stops.has(norm);
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
 * Normalized string similarity (0 to 1) based on Levenshtein distance
 */
export function stringSimilarity(s1, s2) {
  const maxLen = Math.max(s1.length, s2.length);
  if (maxLen === 0) return 1.0;
  const dist = levenshteinDistance(s1, s2);
  return 1.0 - dist / maxLen;
}

/**
 * Finds if a token matches any token in a candidate list (exact or stem/edit-distance >= 0.8)
 */
export function hasFuzzyMatch(target, candidateList) {
  const normTarget = normalizeWord(target);
  if (!normTarget) return false;

  for (const cand of candidateList) {
    const normCand = normalizeWord(cand);
    if (!normCand) continue;
    if (normTarget === normCand) return true;
    // Prefix / stem match for inflections
    if (normTarget.length >= 4 && normCand.length >= 4) {
      if (normTarget.startsWith(normCand.slice(0, 4)) || normCand.startsWith(normTarget.slice(0, 4))) {
        return true;
      }
    }
    // Levenshtein similarity for typos
    if (stringSimilarity(normTarget, normCand) >= 0.80) {
      return true;
    }
  }
  return false;
}

/**
 * Extracts key concepts from text (non-stop words of substantial length)
 */
export function extractKeyConcepts(text, lang = 'en', manualConcepts = []) {
  if (manualConcepts && manualConcepts.length > 0) {
    return manualConcepts.map(c => c.trim().toLowerCase()).filter(Boolean);
  }

  const tokens = tokenize(text, lang);
  const contentWords = filterContentWords(tokens, lang);
  
  // Pick unique words of length >= 3
  const unique = Array.from(new Set(contentWords.filter(w => w.length >= 3)));
  return unique;
}

/**
 * Main Hybrid Evaluation Function
 * @param {string} userText The definition entered by the user
 * @param {string} refText The reference definition stored in the card
 * @param {Array} explicitKeyConcepts Optional user-defined key concepts
 * @param {string} lang Language code ('en', 'ru', 'de', etc.)
 * @returns {Object} Evaluation report
 */
export function evaluateDefinition(userText, refText, explicitKeyConcepts = [], lang = 'en') {
  const userTokens = tokenize(userText, lang);
  const refTokens = tokenize(refText, lang);

  const userContent = filterContentWords(userTokens, lang);
  const refContent = filterContentWords(refTokens, lang);

  // 1. Jaccard Index & Content Word Overlap
  let matchedContentCount = 0;
  const matchedUserIndices = new Set();
  const matchedRefIndices = new Set();

  refContent.forEach((refWord, rIdx) => {
    let matched = false;
    userContent.forEach((userWord, uIdx) => {
      if (hasFuzzyMatch(refWord, [userWord])) {
        matched = true;
        matchedUserIndices.add(uIdx);
      }
    });
    if (matched) {
      matchedRefIndices.add(rIdx);
      matchedContentCount++;
    }
  });

  const contentCoverage = refContent.length > 0 ? (matchedContentCount / refContent.length) : (userContent.length > 0 ? 0.8 : 0);

  // Jaccard similarity: intersection / union of content tokens
  const unionCount = refContent.length + userContent.length - matchedContentCount;
  const jaccard = unionCount > 0 ? matchedContentCount / unionCount : 1.0;

  // 2. Levenshtein Full String Similarity
  const normUserStr = normalizeWord(userText);
  const normRefStr = normalizeWord(refText);
  const levSimilarity = stringSimilarity(normUserStr, normRefStr);

  // 3. Key Concepts Evaluation
  const targetConcepts = extractKeyConcepts(refText, lang, explicitKeyConcepts);
  let matchedConceptsCount = 0;
  const conceptMatches = [];

  targetConcepts.forEach(concept => {
    const isMatched = hasFuzzyMatch(concept, userTokens);
    if (isMatched) matchedConceptsCount++;
    conceptMatches.push({ concept, matched: isMatched });
  });

  const conceptCoverage = targetConcepts.length > 0 
    ? (matchedConceptsCount / targetConcepts.length) 
    : contentCoverage;

  // 4. Hybrid Weighted Score Calculation (0 - 100%)
  // 40% Key Concepts Coverage, 35% Content Word Overlap, 15% Jaccard, 10% Levenshtein
  const rawScore = (conceptCoverage * 0.40) + (contentCoverage * 0.35) + (jaccard * 0.15) + (levSimilarity * 0.10);
  const scorePercent = Math.min(100, Math.max(0, Math.round(rawScore * 100)));

  // Determine Classification Tier
  let tier = 'divergent'; // < 50%
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

  // 5. Diff Generation
  const diff = generateSideBySideDiff(userText, refText, lang, targetConcepts);

  return {
    scorePercent,
    tier,
    tierColor,
    suggestedRating,
    metrics: {
      conceptCoverage: Math.round(conceptCoverage * 100),
      contentCoverage: Math.round(contentCoverage * 100),
      jaccardIndex: Math.round(jaccard * 100),
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
  // Green if matched in user input, Amber/Red if missing key concept, normal otherwise
  const refTokensHtml = refWords.map((word, idx) => {
    const norm = cleanRefTokens[idx];
    const isStop = STOP_WORDS[lang]?.has(norm);
    const isConcept = keyConcepts.some(c => hasFuzzyMatch(c, [norm]));
    const isMatched = hasFuzzyMatch(norm, cleanUserTokens);

    if (isMatched && !isStop) {
      return `<mark class="diff-token match">${escapeHtml(word)}</mark>`;
    } else if (!isMatched && isConcept) {
      return `<mark class="diff-token missing-concept" title="Key concept missing">${escapeHtml(word)}</mark>`;
    } else if (!isMatched && !isStop && norm.length > 3) {
      return `<mark class="diff-token missing">${escapeHtml(word)}</mark>`;
    } else {
      return `<span class="diff-token neutral">${escapeHtml(word)}</span>`;
    }
  }).join(' ');

  // Build User Highlights:
  // Green if matched reference, Amber/Dim if extra fluff or stop word
  const userTokensHtml = userWords.map((word, idx) => {
    const norm = cleanUserTokens[idx];
    const isStop = STOP_WORDS[lang]?.has(norm);
    const isMatched = hasFuzzyMatch(norm, cleanRefTokens);

    if (isMatched && !isStop) {
      return `<mark class="diff-token match">${escapeHtml(word)}</mark>`;
    } else if (!isMatched && !isStop && norm.length > 2) {
      return `<mark class="diff-token extra" title="Extra / Unmatched term">${escapeHtml(word)}</mark>`;
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
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
