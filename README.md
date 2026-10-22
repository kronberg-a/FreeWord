# FreeWord ⚡

> **Distraction-Free, High-Velocity Spaced Repetition Learning System (SPA)**  
> Inspired by the core spaced-repetition logic of ReWord, reimagined with a clean, utilitarian, high-information-density design.

FreeWord is a modern client-side Single-Page Web Application (SPA) built for serious language learners and concept retention. It runs 100% locally in the browser with zero external tracking, zero gamification clutter (no spam badges, no push notification popups), and a keyboard-first study interface.

---

## 🌟 Key Highlights & Capabilities

### 1. Spaced Repetition Engine (SM-2 / Leitner Derivative)
Runs entirely client-side, adjusting intervals based on recall performance:
- **Card Schema:**
  - `id`: Unique identifier
  - `mode`: `"word"` | `"definition"`
  - `front`: Prompt (Target word / term)
  - `back`: Translation(s) OR Target Reference Definition
  - `contextSentence`: Example in context
  - `sourceLang`: Target study language code (`en`, `ru`, `de`, `fr`, `it`, `es`)
  - `targetLang`: Native/translation language code
  - `interval`: Current review interval in days
  - `repetitions`: Consecutive successful recall count
  - `easeFactor`: Float (initial: 2.5, min: 1.3)
  - `nextReviewDate`: ISO timestamp
  - `status`: `"new"` | `"learning"` | `"review"` | `"mastered"`
- **Review Grading Logic:**
  - **Again (1):** Reset interval to 1 day, repetitions to 0, ease factor decreased (-0.20), status set to `"learning"`.
  - **Hard (2):** Slight interval increase (`interval * 1.2`), ease factor decreased (-0.15), repetitions + 1.
  - **Good (3):** Standard SM-2 progression (1d → 6d → `interval * easeFactor`), repetitions + 1.
  - **Easy (4):** Accelerated interval progression (4d → 8d → `interval * easeFactor * 1.3`), ease factor increased (+0.15), repetitions + 1.
  - **Mastery:** When interval reaches ≥21 days, card status graduates to `"mastered"`.

### 2. Strict Separation of Study Modes
A persistent toggle in the header switches between two distinct operational modes:
- **Mode A: Vocabulary / Flashcard Mode (`[Words]`):**
  - High-speed flashcard study with 3D flip animation.
  - Displays target word, language pairing, and context quote on front.
  - Revealed back displays translations, audio pronunciation, and SRS rating bar.
- **Mode B: Definition Practice Mode (`[Definitions]`):**
  - Active recall challenge: User reads the term and types an explanation in their own words.
  - **Hybrid Fuzzy Evaluation Algorithm:**
    - Tokenizes and normalizes input text across all 6 languages.
    - Strips language-specific stop words (custom stopword sets for EN, RU, DE, FR, IT, ES).
    - Computes **Jaccard Token Set Similarity**, **Normalized Levenshtein Edit Distance**, and **Content Word Coverage**.
    - **Key Concepts Extraction:** Verifies that essential keywords or roots appear in the user's answer.
    - Generates a **0–100% semantic similarity score** with color indicator (Green: ≥75% Accurate, Amber: 50–74% Partial, Red: <50% Divergent).
    - Renders a **side-by-side token diff** highlighting matched terms (green), missing key concepts (red), and extraneous words (amber).
    - Automatically suggests an SRS grade with option for one-click manual override.

### 3. Multi-Language & Internationalization (i18n)
- **Supported Languages:**
  - 🇬🇧 English (`en`)
  - 🇷🇺 Russian (`ru`)
  - 🇩🇪 German (`de`)
  - 🇫🇷 French (`fr`)
  - 🇮🇹 Italian (`it`)
  - 🇪🇸 Spanish (`es`)
- **Instant UI Localization:** Header language switcher immediately re-translates all navigation, buttons, labels, tooltips, stats, and dialogs.
- **Arbitrary Language Pairing:** Create decks with any combination of study and native languages (e.g., German → Russian, French → English, Spanish → Spanish).

### 4. In-App Auto-Translator & Duplicate Detector
- Dedicated modal for adding and editing cards.
- **Built-in Auto-Translator:** Queries public translation APIs (MyMemory) with an internal offline multilingual dictionary fallback covering common vocabulary across all 6 languages.
- **Instant Duplicate Warning:** In-flight check alerts the user if the target word already exists in the deck for that study language.

### 5. Native Audio Pronunciation
- Browser-native `window.speechSynthesis` (Web Speech API).
- Automatically selects the best available system voice matching the card's BCP 47 language code (`en-US`, `ru-RU`, `de-DE`, `fr-FR`, `it-IT`, `es-ES`).
- Controlled rate for clear language learning pronunciation.
- Accessible via on-screen button or keyboard shortcut (`S`).

### 6. Design System & Theming
- Minimalist, high contrast, typography-centered aesthetic (Inter / modern system font stack).
- **Dark Mode & Light Mode:** Seamless transition with state persisted in `localStorage`.
- Zero unnecessary gamification clutter: No annoying badge modals, no push notification prompts, no sound effects.
- Full responsive support for desktop, tablets, and smartphones.

---

## ⌨️ Keyboard-First Navigation

FreeWord is optimized for rapid hands-on-keyboard study:

| Key | Context | Action |
|---|---|---|
| <kbd>Space</kbd> | Study (Word Mode) | Flip flashcard to reveal translation |
| <kbd>Enter</kbd> | Study (Definition Mode) | Submit written definition for fuzzy evaluation |
| <kbd>1</kbd> | Study (when revealed) | Rate **Again** (Score 1, interval reset) |
| <kbd>2</kbd> | Study (when revealed) | Rate **Hard** (Score 2, slight increase) |
| <kbd>3</kbd> | Study (when revealed) | Rate **Good** (Score 3, standard SM-2) |
| <kbd>4</kbd> | Study (when revealed) | Rate **Easy** (Score 4, accelerated interval) |
| <kbd>S</kbd> | Study | Native audio pronunciation |
| <kbd>Esc</kbd> | Anywhere | Close open modal or exit study view |

---

## 📁 Project Architecture

```
FreeWord/
├── index.html               # Semantic SPA markup with accessible modals and views
├── css/
│   ├── base.css             # Theme variables (light/dark), reset, typography
│   ├── layout.css           # Header, navigation, layout grids, responsiveness
│   ├── components.css       # Buttons, badges, forms, modals, progress bars
│   ├── flashcard.css        # 3D card flip animation, audio button, ratings bar
│   ├── definition.css       # Definition textarea, score pill, side-by-side diff
│   └── browser.css          # Search toolbar, filter selects, data tables, charts
└── js/
    ├── app.js               # Application orchestrator, state manager, shortcuts
    ├── srs.js               # SM-2 Spaced Repetition engine, queue & analytics logic
    ├── i18n.js              # Localization dictionaries for EN, RU, DE, FR, IT, ES
    ├── fuzzy.js             # Multi-language tokenizer, stop words, Levenshtein & diff
    ├── audio.js             # Web Speech API wrapper with voice selector
    ├── translator.js        # MyMemory API + offline dictionary & duplicate detector
    ├── mockData.js          # Seed cards across EN, RU, DE, FR, IT, ES in both modes
    └── storage.js           # LocalStorage CRUD, JSON backup export & import
```

---

## 🚀 Getting Started

Since FreeWord uses standard ES6 modules and modern web standards:

### Option A: Using Python (Recommended)
From the project folder, start a local HTTP server:
```bash
python -m http.server 8080
```
Then open [http://localhost:8080](http://localhost:8080) in any modern browser (Chrome, Edge, Firefox, Safari).

### Option B: Using any static web server
You can also use VS Code Live Server, Caddy, Nginx, or GitHub Pages.

---

## 💾 Data Portability & Privacy
- All decks, cards, review logs, and preferences reside exclusively in your browser's `localStorage`.
- You can export a complete JSON backup at any time from **Settings → Export All Data (JSON)**, and restore or transfer it to another machine via **Import Data (JSON)**.
