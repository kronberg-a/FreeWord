/**
 * FreeWord - Initial Mock Seed Data
 * Rich dataset across EN, RU, DE, FR, IT, ES in both Word and Definition modes.
 * Includes cards due today, in learning, review, and mastered states.
 */

const now = new Date();
const hoursAgo = (h) => new Date(now.getTime() - h * 3600000).toISOString();
const daysFromNow = (d) => new Date(now.getTime() + d * 86400000).toISOString();

export const INITIAL_MOCK_CARDS = [
  // --- WORD MODE CARDS ---
  {
    id: "card_word_1",
    mode: "word",
    front: "ephemeral",
    back: "efímero, pasajero, que dura poco tiempo",
    contextSentence: "The ephemeral beauty of autumn leaves reminds us to cherish the present moment.",
    keyConcepts: ["pasajero", "efimero", "corto"],
    sourceLang: "en",
    targetLang: "es",
    interval: 0,
    repetitions: 0,
    easeFactor: 2.5,
    nextReviewDate: hoursAgo(2), // Due today!
    status: "new",
    createdAt: hoursAgo(48),
    lastReviewedDate: null
  },
  {
    id: "card_word_2",
    mode: "word",
    front: "das Fernweh",
    back: "тоска по дальним странам, тяга к странствиям",
    contextSentence: "Jedes Mal, wenn sie Flugzeuge am Himmel sah, packte sie das Fernweh.",
    keyConcepts: ["тоска", "путешествия", "страны"],
    sourceLang: "de",
    targetLang: "ru",
    interval: 1,
    repetitions: 1,
    easeFactor: 2.5,
    nextReviewDate: hoursAgo(5), // Due today!
    status: "learning",
    createdAt: hoursAgo(72),
    lastReviewedDate: hoursAgo(24)
  },
  {
    id: "card_word_3",
    mode: "word",
    front: "l'amertume",
    back: "bitterness, bitter taste or resentment",
    contextSentence: "Il parla de son échec sans aucune amertume.",
    keyConcepts: ["bitterness", "resentment"],
    sourceLang: "fr",
    targetLang: "en",
    interval: 3,
    repetitions: 2,
    easeFactor: 2.35,
    nextReviewDate: hoursAgo(1), // Due today!
    status: "review",
    createdAt: hoursAgo(120),
    lastReviewedDate: hoursAgo(72)
  },
  {
    id: "card_word_4",
    mode: "word",
    front: "mozzafiato",
    back: "atemberaubend, spektakulär",
    contextSentence: "Dalla cima della montagna c'era una vista mozzafiato sulla vallata.",
    keyConcepts: ["atemberaubend", "spektakulär"],
    sourceLang: "it",
    targetLang: "de",
    interval: 25,
    repetitions: 5,
    easeFactor: 2.65,
    nextReviewDate: daysFromNow(18),
    status: "mastered",
    createdAt: hoursAgo(500),
    lastReviewedDate: hoursAgo(160)
  },
  {
    id: "card_word_5",
    mode: "word",
    front: "deslumbrante",
    back: "dazzling, stunning, blindingly brilliant",
    contextSentence: "El reflejo del sol sobre la nieve resultaba deslumbrante.",
    keyConcepts: ["dazzling", "stunning"],
    sourceLang: "es",
    targetLang: "en",
    interval: 6,
    repetitions: 3,
    easeFactor: 2.5,
    nextReviewDate: daysFromNow(2),
    status: "review",
    createdAt: hoursAgo(200),
    lastReviewedDate: hoursAgo(96)
  },
  {
    id: "card_word_6",
    mode: "word",
    front: "непревзойденный",
    back: "inégalé, sans égal, hors pair",
    contextSentence: "Его кулинарный талант оставался непревзойденным на протяжении десятилетий.",
    keyConcepts: ["inégalé", "talent"],
    sourceLang: "ru",
    targetLang: "fr",
    interval: 0,
    repetitions: 0,
    easeFactor: 2.5,
    nextReviewDate: hoursAgo(1), // Due today!
    status: "new",
    createdAt: hoursAgo(12),
    lastReviewedDate: null
  },

  // --- DEFINITION MODE CARDS ---
  {
    id: "card_def_1",
    mode: "definition",
    front: "serendipity",
    back: "The occurrence and development of events by chance in a happy or beneficial way.",
    contextSentence: "Discovering penicillin was a classic example of scientific serendipity.",
    keyConcepts: ["chance", "happy", "beneficial", "events", "occurrence"],
    sourceLang: "en",
    targetLang: "en",
    interval: 1,
    repetitions: 1,
    easeFactor: 2.5,
    nextReviewDate: hoursAgo(3), // Due today!
    status: "learning",
    createdAt: hoursAgo(96),
    lastReviewedDate: hoursAgo(24)
  },
  {
    id: "card_def_2",
    mode: "definition",
    front: "die Schadenfreude",
    back: "Freude oder Genugtuung über das Unglück oder Missgeschick eines anderen Menschen.",
    contextSentence: "Er konnte seine Schadenfreude nicht verbergen, als sein Rivale stolperte.",
    keyConcepts: ["Freude", "Unglück", "Missgeschick", "Mensch"],
    sourceLang: "de",
    targetLang: "de",
    interval: 0,
    repetitions: 0,
    easeFactor: 2.5,
    nextReviewDate: hoursAgo(4), // Due today!
    status: "new",
    createdAt: hoursAgo(24),
    lastReviewedDate: null
  },
  {
    id: "card_def_3",
    mode: "definition",
    front: "la résilience",
    back: "Capacité d'un individu ou d'un système à surmonter les chocs et à se reconstruire.",
    contextSentence: "La résilience de cette communauté face aux inondations a impressionné le monde.",
    keyConcepts: ["capacité", "surmonter", "chocs", "reconstruire"],
    sourceLang: "fr",
    targetLang: "fr",
    interval: 4,
    repetitions: 2,
    easeFactor: 2.45,
    nextReviewDate: hoursAgo(2), // Due today!
    status: "review",
    createdAt: hoursAgo(180),
    lastReviewedDate: hoursAgo(80)
  },
  {
    id: "card_def_4",
    mode: "definition",
    front: "la nostalgia",
    back: "Sentimiento de tristeza o melancolía provocado por el recuerdo de una dicha o tiempo perdido.",
    contextSentence: "Miraba las fotos antiguas con una mezcla de cariño y nostalgia.",
    keyConcepts: ["tristeza", "melancolía", "recuerdo", "perdido"],
    sourceLang: "es",
    targetLang: "es",
    interval: 28,
    repetitions: 5,
    easeFactor: 2.7,
    nextReviewDate: daysFromNow(14),
    status: "mastered",
    createdAt: hoursAgo(600),
    lastReviewedDate: hoursAgo(120)
  },
  {
    id: "card_def_5",
    mode: "definition",
    front: "ubiquitous",
    back: "Present, appearing, or found everywhere at the same time; omnipresent.",
    contextSentence: "Smartphones have become ubiquitous in modern everyday life.",
    keyConcepts: ["present", "found", "everywhere", "omnipresent", "same time"],
    sourceLang: "en",
    targetLang: "en",
    interval: 0,
    repetitions: 0,
    easeFactor: 2.5,
    nextReviewDate: hoursAgo(1), // Due today!
    status: "new",
    createdAt: hoursAgo(10),
    lastReviewedDate: null
  },
  {
    id: "card_def_6",
    mode: "definition",
    front: "интроспекция",
    back: "Метод углубленного исследования и познания человеком собственных психических процессов и состояний.",
    contextSentence: "Интроспекция позволяет человеку осознать скрытые мотивы своего поведения.",
    keyConcepts: ["исследование", "познание", "психических", "процессов", "состояний"],
    sourceLang: "ru",
    targetLang: "ru",
    interval: 2,
    repetitions: 1,
    easeFactor: 2.4,
    nextReviewDate: hoursAgo(6), // Due today!
    status: "learning",
    createdAt: hoursAgo(140),
    lastReviewedDate: hoursAgo(30)
  }
];

export const INITIAL_MOCK_LOGS = [
  {
    id: "log_init_1",
    cardId: "card_word_2",
    mode: "word",
    rating: 3,
    timestamp: hoursAgo(24),
    previousInterval: 0,
    newInterval: 1,
    easeFactor: 2.5
  },
  {
    id: "log_init_2",
    cardId: "card_word_3",
    mode: "word",
    rating: 2,
    timestamp: hoursAgo(72),
    previousInterval: 1,
    newInterval: 3,
    easeFactor: 2.35
  },
  {
    id: "log_init_3",
    cardId: "card_def_1",
    mode: "definition",
    rating: 3,
    timestamp: hoursAgo(24),
    previousInterval: 0,
    newInterval: 1,
    easeFactor: 2.5
  },
  {
    id: "log_init_4",
    cardId: "card_def_3",
    mode: "definition",
    rating: 4,
    timestamp: hoursAgo(80),
    previousInterval: 1,
    newInterval: 4,
    easeFactor: 2.45
  }
];
