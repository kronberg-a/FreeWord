/**
 * FreeWord - Quizlet Link & Text Extraction Engine
 * Extracts terms, translations, and set titles from Quizlet links and exported flashcards text.
 */

/**
 * Extracts a clean title from a Quizlet URL slug
 * e.g. https://quizlet.com/812154148/spanish-vocabulary-flash-cards/ -> "Spanish Vocabulary"
 */
export function extractSlugFromUrl(url) {
  if (!url || typeof url !== 'string') return '';
  const cleanUrl = url.trim();
  const match = cleanUrl.match(/quizlet\.com\/(?:[a-z]{2}\/)?\d+\/([^/?#]+)/i);
  if (match && match[1]) {
    let slug = match[1];
    slug = slug.replace(/-flash-cards$/i, '').replace(/_flash_cards$/i, '');
    const title = slug
      .replace(/[-_]+/g, ' ')
      .trim()
      .split(' ')
      .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
      .join(' ');
    return title || 'Quizlet Import';
  }
  return '';
}

/**
 * Robust flashcard text parser supporting:
 * 1. Quizlet native export (Tab-separated: term \t definition)
 * 2. Dash/hyphen separated (term - definition)
 * 3. Comma/semicolon separated (term, definition)
 * 4. Alternating lines (line 1 = term, line 2 = definition)
 */
export function parseFlashcardsText(rawText) {
  if (!rawText || typeof rawText !== 'string') return [];
  const lines = rawText
    .split(/\r?\n/)
    .map(l => l.trim())
    .filter(Boolean);

  if (lines.length === 0) return [];

  // 1. Check if lines contain Tabs (standard Quizlet export format)
  const tabLines = lines.filter(l => l.includes('\t'));
  if (tabLines.length >= lines.length * 0.4) {
    const cards = [];
    for (const line of lines) {
      const parts = line.split('\t');
      if (parts.length >= 2 && parts[0].trim() && parts[1].trim()) {
        cards.push({
          front: parts[0].trim(),
          back: parts.slice(1).join('\t').trim()
        });
      }
    }
    if (cards.length > 0) return cards;
  }

  // 2. Check for Dash / En-dash / Em-dash delimiters (e.g. "term - translation")
  const dashRegex = /\s+[-—–]\s+/;
  const dashLines = lines.filter(l => dashRegex.test(l));
  if (dashLines.length >= lines.length * 0.4) {
    const cards = [];
    for (const line of lines) {
      const parts = line.split(dashRegex);
      if (parts.length >= 2 && parts[0].trim() && parts[1].trim()) {
        cards.push({
          front: parts[0].trim(),
          back: parts.slice(1).join(' - ').trim()
        });
      }
    }
    if (cards.length > 0) return cards;
  }

  // 3. Check for comma or semicolon delimited
  const commaCount = lines.filter(l => l.includes(',') || l.includes(';')).length;
  if (commaCount >= lines.length * 0.4) {
    const cards = [];
    for (const line of lines) {
      const delimiter = line.includes(';') ? ';' : ',';
      const parts = line.split(delimiter);
      if (parts.length >= 2 && parts[0].trim() && parts[1].trim()) {
        cards.push({
          front: parts[0].trim(),
          back: parts.slice(1).join(delimiter).trim()
        });
      }
    }
    if (cards.length > 0) return cards;
  }

  // 4. Alternating lines fallback (Line 1 = Term, Line 2 = Definition)
  if (lines.length >= 2) {
    const cards = [];
    for (let i = 0; i < lines.length - 1; i += 2) {
      cards.push({
        front: lines[i],
        back: lines[i + 1]
      });
    }
    return cards;
  }

  return [];
}

/**
 * Extracts terms and definitions from Quizlet HTML markup
 * Handles embedded __NEXT_DATA__ JSON script or DOM elements
 */
export function extractCardsFromHtml(html) {
  if (!html || typeof html !== 'string') return { cards: [], title: '' };

  // Try extracting from embedded __NEXT_DATA__ JSON
  const nextMatch = html.match(/<script id="__NEXT_DATA__" type="application\/json">([\s\S]*?)<\/script>/i);
  if (nextMatch && nextMatch[1]) {
    try {
      const data = JSON.parse(nextMatch[1]);
      const queries = data?.props?.pageProps?.dehydratedState?.queries || [];
      for (const q of queries) {
        const setData = q?.state?.data?.set;
        if (setData && Array.isArray(setData.terms) && setData.terms.length > 0) {
          const cards = [];
          for (const t of setData.terms) {
            const w = (t.word || '').trim();
            const d = (t.definition || '').trim();
            if (w && d) {
              cards.push({ front: w, back: d });
            }
          }
          if (cards.length > 0) {
            return { cards, title: setData.title || '' };
          }
        }
      }
    } catch (e) {
      console.warn('Could not parse __NEXT_DATA__ JSON from Quizlet HTML:', e);
    }
  }

  return { cards: [], title: '' };
}

/**
 * Attempts to fetch a Quizlet set via CORS proxy
 * If Cloudflare blocks the proxy (as is standard for quizlet.com), returns structured feedback.
 */
export async function fetchQuizletSet(url) {
  const suggestedTitle = extractSlugFromUrl(url);

  if (!url || !url.includes('quizlet.com')) {
    return {
      success: false,
      error: 'INVALID_URL',
      suggestedTitle
    };
  }

  const proxies = [
    `https://corsproxy.io/?${encodeURIComponent(url)}`,
    `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`
  ];

  for (const proxyUrl of proxies) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6000);

      const resp = await fetch(proxyUrl, { signal: controller.signal });
      clearTimeout(timeoutId);

      if (!resp.ok) continue;

      let html = '';
      if (proxyUrl.includes('allorigins')) {
        const json = await resp.json();
        html = json.contents || '';
      } else {
        html = await resp.text();
      }

      // Check if Cloudflare anti-bot challenged the proxy request
      if (html.toLowerCase().includes('cloudflare') || html.toLowerCase().includes('just a moment')) {
        return {
          success: false,
          error: 'CLOUDFLARE_BLOCKED',
          suggestedTitle
        };
      }

      // Parse HTML
      const { cards, title } = extractCardsFromHtml(html);
      if (cards.length > 0) {
        return {
          success: true,
          cards,
          title: title || suggestedTitle || 'Quizlet Import'
        };
      }
    } catch (err) {
      // Proxy failed or timed out, try next
    }
  }

  return {
    success: false,
    error: 'CLOUDFLARE_BLOCKED',
    suggestedTitle
  };
}
