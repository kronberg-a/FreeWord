# FreeWord - Comprehensive UX/UI & Logic Audit
**Auditor:** Principal UX/UI Critic & Logic Auditor (`designer` skill)  
**Target:** FreeWord Single-Page Spaced Repetition Application  
**Standard:** Cognitive Clarity, Utilitarian Density, WCAG 2.1 AA Compliance, Algorithmic Fairness

---

## 1. Executive Summary
The initial FreeWord architecture demonstrates a solid modular foundation: zero-bloat vanilla ES6, persistent theme switching, SM-2 scheduling, Web Speech API integration, and hybrid fuzzy matching. However, a rigorous stress-test revealed critical gaps in cognitive mode separation, recall variant ergonomics, multi-word concept extraction, and localization completeness.

The following checklist specifies all required fixes for the `coder` skill to implement.

---

## 2. Prioritized Audit Checklist

### `[CRITICAL]` - Functional & Algorithmic Defects
1. **Multi-Token Key Concept Matching Failure in Fuzzy Engine (`fuzzy.js`):**
   - *Issue:* Cards with multi-word key concepts (e.g. `"same time"`, `"dura poco tiempo"`, `"capacité de surmonter"`) fail to match because `hasFuzzyMatch` evaluates single unigram tokens.
   - *Fix:* Update `hasFuzzyMatch` and concept extraction to handle n-grams and multi-word phrases by searching normalized full-text sub-sequences or ensuring all constituent words appear in close proximity.
2. **Duplicate Detector Mode Neglect (`translator.js` & `app.js`):**
   - *Issue:* `checkDuplicate()` checks only `front` term and `sourceLang`, ignoring `mode`. A learner cannot add the same word in "Definition Practice Mode" if they previously created it in "Vocabulary Mode".
   - *Fix:* Pass `mode` into `checkDuplicate(cards, term, sourceLang, mode, currentCardId)` so duplicates are warned strictly within the same mode.
3. **Missing "Recall Typing Variant" in Word Mode (`ui.js` & `app.js`):**
   - *Issue:* Mode A is specified to offer both flashcard flipping AND an active typing variant ("User can type the word translation or flip the card and self-evaluate with standard grading buttons").
   - *Fix:* Add an optional translation input on the front face of the flashcard. If typed, pressing <kbd>Enter</kbd> validates against the translation, highlights matches, flips the card, and displays SRS rating buttons. If skipped, pressing <kbd>Space</kbd> or clicking flips directly.
4. **Hardcoded English Strings in UI & System Prompts (`index.html`, `ui.js`, `app.js`):**
   - *Issue:* Hardcoded strings in `index.html` (hero title, settings descriptions, placeholders) and JS files (`alert()` dialogs, "Coverage:", "Jaccard:", "DEFINITION PRACTICE").
   - *Fix:* Replace all hardcoded strings with `data-i18n` tags and `t()` dictionary lookups across all 6 supported languages (EN, RU, DE, FR, IT, ES). Replace intrusive native browser `alert()` with accessible custom modal dialogs or toasts.

---

### `[UX IMPROVEMENT]` - Interface Ergonomics & Information Density
1. **Header Quick Stats Pill (`layout.css` & `index.html`):**
   - *Issue:* The header currently shows only `Due / Total` instead of the required `Quick Stats pill (Due / New / Mastered)`.
   - *Fix:* Render a high-density, multi-segment pill displaying `Due`, `New`, and `Mastered` counts for the active mode. Ensure a compact variant persists on mobile screens without being hidden.
2. **Language Pair Filter in Navigation & Dashboard:**
   - *Issue:* Learners studying multiple language pairs (e.g., German → Russian alongside English → Spanish) had no way to isolate sessions by language pair on the dashboard.
   - *Fix:* Add a clean Language Pair Selector in the dashboard hero (and top navigation filter) to filter study queues and deck metrics by specific language pair (e.g., `All Pairs`, `DE → RU`, `EN → ES`, `FR → EN`).
3. **Definition Practice Auto-Translation Ergonomics:**
   - *Issue:* In Definition Mode, the Auto-Translate button only looked up direct word translations for the term. If a user pastes a foreign definition, they could not translate the definition itself.
   - *Fix:* Support dual auto-translation in Definition Mode: (1) Auto-generate reference definition from target term, and (2) translate written/pasted definition directly between source and target language.
4. **Contrast & Muted Text Legibility:**
   - *Issue:* Muted text color `--text-muted` (#8c959f on light, #6e7681 on dark) failed WCAG AA 4.5:1 ratio on subtle backgrounds.
   - *Fix:* Boost contrast ratios to ≥4.8:1 across both themes for all secondary text, table timestamps, and keyboard shortcut badges.
5. **Session Completion & Queue Depletion State:**
   - *Issue:* When no cards are due today, clicking "Start Review" silently launched 10 reviewed cards.
   - *Fix:* Provide an explicit, calm state in the dashboard hero: when 0 cards are due, display "All reviews caught up for today" with two distinct actions: "Practice Ahead (Early Review)" and "Add New Card".

---

### `[LOGIC EDGE-CASE]` - Spaced Repetition & State Integrity
1. **Ease Factor Rounding Discrepancies:**
   - *Issue:* Floating-point arithmetic during review processing produced values like `2.3500000000000005`.
   - *Fix:* Ensure `easeFactor` is strictly rounded to two decimal places: `Number(easeFactor.toFixed(2))`.
2. **Offline Dictionary Fallback Expansion:**
   - *Issue:* The offline fallback dictionary covered only a small set of words.
   - *Fix:* Expand offline dictionary coverage for all mock seed cards across all 6 language pairs and both modes to guarantee seamless offline operation.
3. **Punctuation & Diacritics in Multi-Language Normalization:**
   - *Issue:* French/Italian apostrophes (`l'amertume`, `c'era`) and German umlauts (`ä`, `ö`, `ü`, `ß`) need consistent normalization without losing semantic roots.
   - *Fix:* Enhance `normalizeWord()` to preserve necessary character roots while stripping diacritics for relaxed match, handling apostrophe contractions (`l'`, `d'`, `un'`) cleanly.
