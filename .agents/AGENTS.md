# AGENTS.md — Repository Context & Architecture Specification

> **FreeWord** is a distraction-free, high-velocity Spaced Repetition System (SPA) built for serious vocabulary acquisition and active conceptual recall.  
> Inspired by the core spaced-repetition logic of ReWord, reimagined with a clean, utilitarian, high-information-density interface running 100% client-side in the browser.

This document serves as the persistent architectural and operational guide for autonomous AI agents, lead architects, and engineers contributing to this repository.

---

## 1. Project Mission & Design Principles

1. **Zero Gamification Bloat:**
   - **Strictly Prohibited:** Push notifications, browser notification permission popups, streak animations, confetti, badges, sound spam, or forced social sharing.
   - **Encouraged:** High information density, instant keyboard interactions, calm contrast, tabular data views, and transparent memory metrics.
2. **Keyboard-First Ergonomics:**
   - Every core workflow must be executable without touching the mouse: <kbd>Space</kbd> (flip/reveal), <kbd>Enter</kbd> (submit definition/check recall), <kbd>1</kbd>–<kbd>4</kbd> (SRS grading), <kbd>S</kbd> (audio pronunciation), <kbd>Esc</kbd> (exit/close).
3. **100% Local Privacy & Portability:**
   - Decks, review logs, SRS metrics, and settings reside exclusively in browser `localStorage`.
   - Complete JSON backup export and import must remain functional offline.
4. **Zero Heavy Framework Bloat:**
   - Vanilla semantic HTML5, modern modular ES6 JavaScript, and responsive CSS3 utilizing custom properties for instantaneous dark/light theme switching.

---

## 2. Repository Layout & File Responsibilities

```
FreeWord/
├── .agents/
│   ├── skills/
│   │   ├── coder/
│   │   │   └── SKILL.md        # Senior Full-Stack Implementation Engineer skill definition
│   │   └── designer/
│   │       ├── SKILL.md        # Principal UX/UI Critic & Logic Auditor skill definition
│   │       └── AUDIT.md        # Prioritized design and logic critique checklist
│   └── AGENTS.md               # Machine-readable architectural context and agent operating manual
├── .github/
│   └── workflows/
│       └── static.yml          # GitHub Pages static automated deployment workflow
├── css/
│   ├── base.css                # CSS variables (light/dark themes), reset, typography, WCAG AA contrast
│   ├── layout.css              # Header, mode toggle, layout grids, navigation tabs, mobile responsiveness
│   ├── components.css          # Buttons, badges, form inputs, modals, progress bars, toast alerts
│   ├── flashcard.css           # 3D perspective card flip, audio button, active recall typing variant
│   ├── definition.css          # Definition input textarea, similarity score pill, side-by-side diff
│   └── browser.css             # Search toolbar, filter selects, data tables, analytics forecast chart
├── js/
│   ├── app.js                  # Application orchestrator, state manager, keyboard shortcuts, modal logic
│   ├── ui.js                   # DOM rendering, view transitions, toast notifications, table rendering
│   ├── srs.js                  # SM-2 / Leitner Spaced Repetition engine, queue builder, analytics math
│   ├── fuzzy.js                # Multi-language tokenizer, stop words, Levenshtein, multi-token concept matcher, diff
│   ├── i18n.js                 # Localization dictionaries (EN, RU, DE, FR, IT, ES) with 100% key parity
│   ├── audio.js                # Browser-native Web Speech API wrapper with BCP 47 voice selector
│   ├── translator.js           # MyMemory API + expanded offline dictionary & mode-scoped duplicate detector
│   ├── mockData.js             # Initial seed cards & review logs across all 6 languages in both modes
│   └── storage.js              # LocalStorage persistence, JSON backup export/import, default settings
├── index.html                  # Accessible semantic SPA markup with modals and dynamic view sections
└── README.md                   # User-facing manual, feature list, and getting started instructions
```

---

## 3. Core Domain Models & Schemas

### A. Card State Schema
Every study item in `localStorage['freeword_cards']` strictly conforms to:

```typescript
interface Card {
  id: string;                      // Unique identifier (UUID or timestamp-based)
  mode: "word" | "definition";     // Strict operational mode
  front: string;                   // Target word / term prompt
  back: string;                    // Word translation OR reference definition
  contextSentence: string;         // Example sentence in context (optional)
  keyConcepts: string[];           // Essential keywords/stems required for recall (definition mode)
  sourceLang: "en"|"ru"|"de"|"fr"|"it"|"es"; // Study target language code
  targetLang: "en"|"ru"|"de"|"fr"|"it"|"es"; // Native / translation language code
  interval: number;                // Current review interval in days (default: 0)
  repetitions: number;             // Consecutive successful recall count (default: 0)
  easeFactor: number;              // Float (default: 2.50, minimum: 1.30, rounded to 2 decimals)
  nextReviewDate: string;          // ISO 8601 timestamp for scheduled review
  status: "new" | "learning" | "review" | "mastered";
  createdAt: string;               // ISO 8601 creation timestamp
  lastReviewedDate: string | null; // ISO 8601 timestamp of last review
}
```

### B. Review Log Schema
Logged to `localStorage['freeword_logs']` after every review rating:

```typescript
interface ReviewLog {
  id: string;                      // Unique log identifier
  cardId: string;                  // Associated card id
  mode: "word" | "definition";     // Mode at time of review
  rating: 1 | 2 | 3 | 4;           // 1: Again, 2: Hard, 3: Good, 4: Easy
  timestamp: string;               // ISO 8601 review timestamp
  previousInterval: number;        // Interval before review
  newInterval: number;             // Interval computed after review
  easeFactor: number;              // Ease factor recorded after review
}
```

### C. Settings Schema
Stored in `localStorage['freeword_settings']`:

```typescript
interface Settings {
  activeMode: "word" | "definition";
  theme: "dark" | "light";
  dailyNewLimit: number;           // Default: 20
  dailyReviewLimit: number;        // Default: 50
  defaultSourceLang: string;       // Default: 'en'
  defaultTargetLang: string;       // Default: 'es'
  selectedLanguagePair: string;    // 'all' or 'en-es', 'de-ru', etc.
}
```

---

## 4. Spaced Repetition Engine (SM-2 Derivative)

The SRS scheduling engine resides in [`js/srs.js`](file:///c:/Users/kronb/Documents/FreeWord/js/srs.js).

### Grading Mathematics
When a card is graded with rating $R \in \{1, 2, 3, 4\}$:

1. **Again ($R = 1$):**
   $$\text{interval} = 1\text{ day},\quad \text{repetitions} = 0$$
   $$\text{easeFactor} = \max(1.30,\, \text{easeFactor} - 0.20),\quad \text{status} = \text{"learning"}$$

2. **Hard ($R = 2$):**
   $$\text{interval} = \begin{cases} 1 & \text{if interval} = 0 \\ \max(1, \lfloor\text{interval} \times 1.2\rfloor) & \text{otherwise} \end{cases}$$
   $$\text{easeFactor} = \max(1.30,\, \text{easeFactor} - 0.15),\quad \text{repetitions} = \text{repetitions} + 1$$
   $$\text{status} = \begin{cases} \text{"mastered"} & \text{if interval} \ge 21 \\ \text{"review"} & \text{if repetitions} > 1 \\ \text{"learning"} & \text{otherwise} \end{cases}$$

3. **Good ($R = 3$):**
   $$\text{interval} = \begin{cases} 1 & \text{if repetitions} = 0 \\ 6 & \text{if repetitions} = 1 \\ \max(1, \lfloor\text{interval} \times \text{easeFactor}\rfloor) & \text{otherwise} \end{cases}$$
   $$\text{repetitions} = \text{repetitions} + 1$$
   $$\text{status} = (\text{interval} \ge 21) \ ?\ \text{"mastered"} : \text{"review"}$$

4. **Easy ($R = 4$):**
   $$\text{interval} = \begin{cases} 4 & \text{if repetitions} = 0 \\ 8 & \text{if repetitions} = 1 \\ \max(2, \lfloor\text{interval} \times \text{easeFactor} \times 1.3\rfloor) & \text{otherwise} \end{cases}$$
   $$\text{easeFactor} = \text{easeFactor} + 0.15,\quad \text{repetitions} = \text{repetitions} + 1$$
   $$\text{status} = (\text{interval} \ge 21) \ ?\ \text{"mastered"} : \text{"review"}$$

- All `easeFactor` values are strictly rounded to two decimals: `Math.round(easeFactor * 100) / 100`.
- Cards graduating to `interval >= 21` are categorized as `"mastered"`.

### Queue Construction
`buildStudyQueue(cards, options)`:
- Filters cards by `mode` (`word` | `definition`) and optionally by language pair (e.g., `de-ru`).
- Separates due reviews (`nextReviewDate <= now()`) from unstudied cards (`status === "new"`).
- Sorts overdue cards most overdue first.
- Caps queue by `dailyReviewLimit` and `dailyNewLimit`.
- When due count is 0, the UI provides a **"Practice Ahead (Early Review)"** option that loads up to 10 upcoming cards without breaking SRS cadence.

---

## 5. Strict Study Modes Separation

A persistent header toggle separates the two modes. Study sessions, library filters, and dashboard analytics cleanly isolate:

### Mode A: Vocabulary / Flashcard Mode (`word`)
- **Visual Flip:** 3D card rotation displaying the prompt term, source language code, context quote, and audio button on the front face.
- **Back Face:** Reveals translations, audio output for target language, and SRS grading bar (`1`–`4`).
- **Active Recall Variant:** An optional input on the card's front face allows learners to type their translation. Pressing <kbd>Enter</kbd> checks their input against the reference translation, displays feedback (`Correct Match` or `Reference Answer Revealed`), flips the card, and reveals the SRS grading toolbar. Pressing <kbd>Space</kbd> flips directly without typing.

### Mode B: Definition Practice Mode (`definition`)
- Displays the target term and context.
- Requires active written explanation typed into a multiline textarea.
- **Client-Side Fuzzy Semantic Evaluation Engine ([`js/fuzzy.js`](file:///c:/Users/kronb/Documents/FreeWord/js/fuzzy.js)):**
  1. **Multi-Language Tokenization & Normalization:** Unicode normalization (`NFD`), lowercase, German `ß` $\to$ `ss`, French/Italian apostrophe splitting (`l'amertume` $\to$ `l amertume`), and punctuation removal.
  2. **Stop Word Removal:** Comprehensive custom stop word sets for all 6 languages (`en`, `ru`, `de`, `fr`, `it`, `es`).
  3. **Multi-Token Key Concepts Coverage:** Handles both unigram and n-gram phrases (e.g. `"same time"`, `"dura poco tiempo"`).
  4. **Hybrid Weighted Similarity Metric:**
     $$\text{Score} = (0.40 \times \text{ConceptCov}) + (0.35 \times \text{ContentCov}) + (0.15 \times \text{Jaccard}) + (0.10 \times \text{Levenshtein})$$
  5. **Accuracy Tiers & Feedback:**
     - **Accurate (Green):** $\ge 75\%$ similarity $\to$ auto-suggests `Good` ($3$) or `Easy` ($4$).
     - **Partial (Amber):** $50\text{--}74\%$ similarity $\to$ auto-suggests `Hard` ($2$).
     - **Divergent (Red):** $< 50\%$ similarity $\to$ auto-suggests `Again` ($1$).
  6. **Side-by-Side Highlighted Diff:** Visual markup highlighting matched terms (green), missing key concepts (red with tooltip), extra words (amber), and neutral stop words.
  7. **One-Click Override:** Learner can accept suggested SRS grade or override immediately with keys <kbd>1</kbd>–<kbd>4</kbd>.

---

## 6. Multi-Language & Internationalization Protocol

- Supported languages: **English (`en`)**, **Russian (`ru`)**, **German (`de`)**, **French (`fr`)**, **Italian (`it`)**, **Spanish (`es`)**.
- **Mandatory 100% Parity Rule:** Any new translation key added to [`js/i18n.js`](file:///c:/Users/kronb/Documents/FreeWord/js/i18n.js) must be present in all 6 dictionaries. No untranslated English fallbacks are permitted in Russian, German, French, Italian, or Spanish blocks.
- **UI Localization Mechanism:**
  - Semantic HTML elements contain `data-i18n="key"`, `data-i18n-placeholder="key"`, or `data-i18n-title="key"`.
  - [`applyI18n()`](file:///c:/Users/kronb/Documents/FreeWord/js/ui.js) translates the entire DOM instantly upon language switcher change without reloading the page.

---

## 7. Built-In Auto-Translator & Duplicate Detector

Resides in [`js/translator.js`](file:///c:/Users/kronb/Documents/FreeWord/js/translator.js):
- **Public API Hook:** MyMemory API (`https://api.mymemory.translated.net/get`) with an automated 4-second timeout.
- **Offline Fallback Dictionary:** Covers all seed vocabulary and definitions across all 6 languages for 100% functional offline operation.
- **Dual Translation in Definition Mode:**
  - Translating the term auto-populates definitions.
  - An inline `"Translate Definition"` button translates a written or pasted definition between the source and target languages.
- **Mode-Scoped Duplicate Detector:**
  - `checkDuplicate(cards, term, sourceLang, mode, currentCardId)` warns users only if the term already exists *within the same mode*.

---

## 8. Agent Operating Roles & Rules

When modifying or refactoring this codebase, AI agents must adhere to the specialized skill contracts in `.agents/`:

### Coder Agent ([`.agents/skills/coder/SKILL.md`](file:///c:/Users/kronb/Documents/FreeWord/.agents/skills/coder/SKILL.md))
- Maintain clean, zero-bloat vanilla web code. Never introduce React, Vue, jQuery, or heavy bundle pipelines unless explicitly requested by the user.
- Ensure all DOM element IDs referenced in JavaScript exist in `index.html` or dynamic rendering templates.
- Preserve keyboard navigation accessibility (<kbd>Space</kbd>, <kbd>Enter</kbd>, <kbd>1</kbd>–<kbd>4</kbd>, <kbd>S</kbd>, <kbd>Esc</kbd>).

### Designer Agent ([`.agents/skills/designer/SKILL.md`](file:///c:/Users/kronb/Documents/FreeWord/.agents/skills/designer/SKILL.md))
- Audit interface contrast (WCAG 2.1 AA: minimum 4.5:1 for body text, 3:1 for large headers and UI controls).
- Guard cognitive clarity and ensure that Word Mode and Definition Mode are visually unmistakable.
- Audit algorithmic fairness and diff visualization in definition matching.

---

## 9. Development & Verification Guide

### Local Server Launch
Run Python's built-in static server from the repository root:
```bash
python -m http.server 8080
```
Open [`http://localhost:8080`](http://localhost:8080) in any modern browser.

### Verification Checklist for Future Changes
1. **DOM ID Alignment:** Ensure every `document.getElementById` target has a corresponding element in `index.html`.
2. **i18n Parity:** Ensure every key in `js/i18n.js` exists in all 6 dictionaries.
3. **SRS Mathematical Bounds:** Ensure `easeFactor` stays $\ge 1.30$ and is rounded to two decimal places.
4. **Fuzzy Diff Accuracy:** Verify that multi-word concepts highlight properly in side-by-side diffs.
5. **No Gamification Bloat:** Reject any features requesting push notification permissions or streak popups.
