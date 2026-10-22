# FreeWord ⚡

> **Distraction-Free, High-Velocity Spaced Repetition Learning System (SPA)**  
> Inspired by the core spaced-repetition logic of ReWord, reimagined with a clean, utilitarian, high-information-density design.

FreeWord is a modern client-side Single-Page Web Application (SPA) built for serious vocabulary acquisition and conceptual retention. It runs 100% locally in the browser with zero external tracking, zero gamification clutter (no spam streaks, no push notification popups), and a keyboard-first study interface.

---

## 🌟 Key Highlights & Capabilities

### 1. Folder Architecture & Strict Mode Separation
Users organize cards into customizable **Folders** before studying:
- **Folder Types:**
  - `[Words Only]`: Exclusively accepts and presents Vocabulary / Flashcard items.
  - `[Definitions Only]`: Exclusively accepts and presents Definition Practice items.
  - `[Mixed]`: Stores and practices both Word and Definition items together in unified sessions.
- **Strict Type Enforcement:**
  - Moving or adding items respects folder types.
  - The Add Card modal automatically adapts to the chosen folder's type constraints.
- **Pre-Session Selection:**
  - Before launching any practice session, users select one or more folders via checkboxes to customize their study scope.

---

### 2. Spaced Repetition Engine (SM-2 / Leitner Derivative)
Runs entirely client-side, adjusting intervals based on recall performance:
- **Card Schema:**
  - `id`: Unique identifier (UUID)
  - `folderId`: Reference to parent Folder ID
  - `mode`: `"word"` | `"definition"`
  - `front`: Prompt (Target word / term)
  - `back`: Translation(s) OR Target Reference Definition
  - `contextSentence`: Example in context
  - `keyConcepts`: Core keywords required for recall (definition mode)
  - `sourceLang`: Target study language code (`en`, `ru`, `de`, `fr`, `it`, `es`)
  - `targetLang`: Native / translation language code
  - `interval`: Current review interval in days
  - `repetitions`: Consecutive successful recall count
  - `easeFactor`: Float (initial: 2.50, min: 1.30, rounded to 2 decimals)
  - `nextReviewDate`: ISO timestamp
  - `status`: `"new"` | `"learning"` | `"review"` | `"mastered"`
- **Review Grading Logic:**
  - **Again (1):** Reset interval to 1 day, repetitions to 0, ease factor decreased (-0.20), status set to `"learning"`.
  - **Hard (2):** Slight interval increase (`interval * 1.2`), ease factor decreased (-0.15), repetitions + 1.
  - **Good (3):** Standard SM-2 progression (1d → 6d → `interval * easeFactor`), repetitions + 1.
  - **Easy (4):** Accelerated progression (4d → 8d → `interval * easeFactor * 1.3`), ease factor increased (+0.15), repetitions + 1.
  - **Mastery:** When interval reaches ≥21 days, card status graduates to `"mastered"`.

---

### 3. Session Modes & Configurable Daily Limits
- **Three Strict Session Types:**
  1. **Learning Only (`[Learning]`):** Pulls only `"new"` unstudied cards and currently `"learning"` cards.
  2. **Reviewing Only (`[Reviewing]`):** Pulls only due cards (`status === "review"` or `"mastered"` where `nextReviewDate <= now()`).
  3. **Mixed Session (`[Mixed]`):** Combines both due Review cards and New/Learning cards into a unified queue.
- **Configurable Daily Limits with "No Limit" Toggle:**
  - **Daily New Card Limit:** Numeric input OR a `"No Limit"` toggle (`Infinity`).
  - **Daily Max Reviews Limit:** Numeric input OR a `"No Limit"` toggle (`Infinity`).
  - **Header Indicators:** Persistent pill shows today's progress (e.g. `New: 5/20 · Rev: 12/50` or `New: 5/∞`).

---

### 4. Active Session Mechanics & In-Session Mastery Loop
- **In-Session Re-Queueing Loop:**
  - **Correctly Answered Cards:** Immediately removed from the active session queue.
  - **Incorrectly Answered Cards:** Pushed back to the end of the active session queue and **will reappear later in the same session** until the learner inputs or recalls them correctly.
- **Word Mode — Two User Interaction Paths:**
  - **Option 1: "Just Flip Card" (<kbd>Space</kbd>):**
    - Instant 3D card flip revealing translation and pronunciation.
    - User self-grades: `Pass / Correct` removes it from session; `Fail / Again` re-queues it for later.
  - **Option 2: "Type / Input the Word" (3-Attempt Rule):**
    - Input answer field with instant validation against reference translation(s).
    - **Attempt 1:** Correct → reveal, pass, remove. Incorrect → visual shake & `"Incorrect — 2 attempts remaining"`.
    - **Attempt 2:** Correct → reveal, pass. Incorrect → visual shake & `"Incorrect — 1 attempt remaining"`.
    - **Attempt 3 (Final):** Correct → pass. Incorrect → **automatically reveals the correct word**, marks card as failed for this turn (`Again`), and **re-queues the card to appear again later in the session**!
- **Definition Practice Mode Mechanics:**
  - Type full definition in multiline textarea (or choose "Just Flip Card").
  - **Hybrid Client-Side Semantic Evaluation Engine:**
    - Jaccard token set similarity + Normalized Levenshtein distance.
    - Language-specific stop word filtration across `EN, RU, DE, FR, IT, ES`.
    - Key concept coverage (unigrams and multi-word phrases).
  - **Visual Feedback & 3-Attempt Rule:**
    - Score badge: Green (≥75% Accurate Match), Amber (50–74% Partial), Red (<50% Divergent).
    - If <75%, shows missing concept count and allows up to 2 additional retry attempts (3 total).
    - If all 3 attempts fail: reveals full **side-by-side token diff** and re-queues card to appear later in the session.
    - One-click manual override to accept answer as correct.

---

### 5. Multi-Language & Internationalization (i18n)
- **Supported Languages:**
  - 🇬🇧 English (`en`)
  - 🇷🇺 Russian (`ru`)
  - 🇩🇪 German (`de`)
  - 🇫🇷 French (`fr`)
  - 🇮🇹 Italian (`it`)
  - 🇪🇸 Spanish (`es`)
- **100% Key Parity:** Every UI element, tooltip, placeholder, and status label is fully localized across all 6 dictionaries with zero untranslated fallbacks.
- **Instant Switching:** Header dropdown re-translates the entire SPA instantaneously without reload.

---

### 6. Built-In Auto-Translator & Duplicate Detector
- Dedicated modal for adding and editing cards.
- **MyMemory API Hook + Expanded Offline Dictionary:** Covers all seed vocabulary and definitions across all 6 languages for 100% offline functionality.
- **Dual Translation in Definition Mode:** Automatically populates definitions from terms, or translates written/pasted foreign definitions directly.
- **Mode- & Folder-Scoped Duplicate Warning:** Warns if the term already exists within the target folder for that mode.

---

### 7. Native Audio Pronunciation
- Browser-native `window.speechSynthesis` (Web Speech API).
- Best-fit voice matching per BCP 47 language code (`en-US`, `ru-RU`, `de-DE`, `fr-FR`, `it-IT`, `es-ES`).
- Triggered via button or keyboard shortcut (<kbd>S</kbd>).

---

## ⌨️ Keyboard-First Ergonomics

FreeWord is designed for rapid study without touching the mouse:

| Key | Context | Action |
|---|---|---|
| <kbd>Space</kbd> | Study (Word & Def Mode) | Flip card or reveal reference answer |
| <kbd>Enter</kbd> | Study (Typing / Re-queue) | Submit recall attempt / continue after failure |
| <kbd>1</kbd> | Study (when revealed) | Rate **Again** (Score 1, re-queues card) |
| <kbd>2</kbd> | Study (when revealed) | Rate **Hard** (Score 2, slight interval boost) |
| <kbd>3</kbd> | Study (when revealed) | Rate **Good** (Score 3, standard SM-2 pass) |
| <kbd>4</kbd> | Study (when revealed) | Rate **Easy** (Score 4, accelerated pass) |
| <kbd>S</kbd> | Study | Native Web Speech audio pronunciation |
| <kbd>Esc</kbd> | Anywhere | Close open modal or exit study view |

---

## 📁 Repository Structure

```
FreeWord/
├── css/
│   ├── base.css          # Color variables (Dark/Light), resets, typography
│   ├── layout.css        # App header, mode switcher, navigation tabs, grid layouts
│   ├── components.css    # Buttons, badges, session launcher, folder cards, alerts
│   ├── flashcard.css     # 3D perspective card flip, audio controls, rating bars
│   ├── definition.css    # Definition textarea, score pills, side-by-side diff
│   └── browser.css       # Search bar, filters, responsive cards data table
├── js/
│   ├── app.js            # Main orchestrator, view transitions, keyboard events
│   ├── ui.js             # View rendering (Folder Hub, Study Card, Table, Stats)
│   ├── srs.js            # SM-2 / Leitner scheduler, queue builder, daily math
│   ├── fuzzy.js          # Tokenizer, stop words, Levenshtein, concept coverage, diff
│   ├── i18n.js           # 6-language dictionaries (EN, RU, DE, FR, IT, ES) with 100% parity
│   ├── audio.js          # Web Speech API wrapper with BCP 47 matching
│   ├── translator.js     # MyMemory API + expanded offline dictionary & duplicate check
│   ├── mockData.js       # Pre-populated sample folders (Words, Defs, Mixed) & cards
│   └── storage.js        # LocalStorage persistence, JSON export/import, settings
├── index.html            # Accessible semantic SPA layout with modals
└── README.md             # Documentation and user guide
```

---

## 🚀 Getting Started

Launch Python's built-in static HTTP server from the project directory:

```bash
python -m http.server 8080
```

Open [`http://localhost:8080`](http://localhost:8080) in any modern web browser.
Pre-populated sample folders (`Core Travel & Idioms`, `Philosophy & Science Terms`, and `Polyglot Mixed Drills`) allow testing all session types (`Learning Only`, `Reviewing Only`, `Mixed`) and the 3-attempt recall loop immediately.
