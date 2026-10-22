/**
 * FreeWord - Initial Mock Seed Data
 * Pre-populates sample folders and cards across all supported languages:
 * EN, RU, DE, FR, IT, ES in Words Only, Definitions Only, and Mixed folders.
 * Features due today, in-learning, review, and mastered states.
 */

const now = new Date();
const hoursAgo = (h) => new Date(now.getTime() - h * 3600000).toISOString();
const daysFromNow = (d) => new Date(now.getTime() + d * 86400000).toISOString();

export const INITIAL_MOCK_FOLDERS = [
  {
    id: "folder_words_1",
    name: "Core Travel & Idioms",
    folderType: "words",
    createdAt: hoursAgo(240)
  },
  {
    id: "folder_defs_1",
    name: "Philosophy & Science Terms",
    folderType: "definitions",
    createdAt: hoursAgo(180)
  },
  {
    id: "folder_mixed_1",
    name: "Polyglot Mixed Drills",
    folderType: "mixed",
    createdAt: hoursAgo(120)
  }
];

export const INITIAL_MOCK_CARDS = [
  // ==========================================
  // FOLDER 1: WORDS ONLY ("folder_words_1")
  // ==========================================
  {
    id: "card_w_1",
    folderId: "folder_words_1",
    mode: "word",
    front: "ephemeral",
    transcription: "/ɪˈfem.ər.əl/",
    partOfSpeech: "adjective",
    learningStep: 0,
    back: "efímero, pasajero, que dura poco tiempo",
    contextSentence: "The ephemeral beauty of autumn leaves reminds us to cherish the present moment.",
    keyConcepts: ["pasajero", "efimero", "corto"],
    sourceLang: "en",
    targetLang: "es",
    interval: 0,
    repetitions: 0,
    easeFactor: 2.50,
    nextReviewDate: hoursAgo(2), // Due today!
    status: "new",
    createdAt: hoursAgo(48),
    lastReviewedDate: null
  },
  {
    id: "card_w_2",
    folderId: "folder_words_1",
    mode: "word",
    front: "das Fernweh",
    transcription: "/ˈfɛʁn.veː/",
    partOfSpeech: "noun (neuter)",
    learningStep: 1,
    back: "тоска по дальним странам, тяга к странствиям",
    contextSentence: "Jedes Mal, wenn sie Flugzeuge am Himmel sah, packte sie das Fernweh.",
    keyConcepts: ["тоска", "путешествия", "страны"],
    sourceLang: "de",
    targetLang: "ru",
    interval: 1,
    repetitions: 1,
    easeFactor: 2.50,
    nextReviewDate: hoursAgo(5), // Due today!
    status: "learning",
    createdAt: hoursAgo(72),
    lastReviewedDate: hoursAgo(24)
  },
  {
    id: "card_w_3",
    folderId: "folder_words_1",
    mode: "word",
    front: "l'amertume",
    transcription: "/la.mɛʁ.tym/",
    partOfSpeech: "noun (feminine)",
    learningStep: 2,
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
    id: "card_w_4",
    folderId: "folder_words_1",
    mode: "word",
    front: "mozzafiato",
    transcription: "/mott͡saˈfjato/",
    partOfSpeech: "adjective",
    learningStep: 3,
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
    id: "card_w_5",
    folderId: "folder_words_1",
    mode: "word",
    front: "deslumbrante",
    transcription: "/dez.lumˈbɾan.te/",
    partOfSpeech: "adjective",
    learningStep: 2,
    back: "dazzling, stunning, blindingly brilliant",
    contextSentence: "El reflejo del sol sobre la nieve resultaba deslumbrante.",
    keyConcepts: ["dazzling", "stunning"],
    sourceLang: "es",
    targetLang: "en",
    interval: 6,
    repetitions: 3,
    easeFactor: 2.50,
    nextReviewDate: daysFromNow(2),
    status: "review",
    createdAt: hoursAgo(200),
    lastReviewedDate: hoursAgo(96)
  },
  {
    id: "card_w_6",
    folderId: "folder_words_1",
    mode: "word",
    front: "головоломка",
    transcription: "/ʊˈjʉt/",
    partOfSpeech: "noun (masculine)",
    learningStep: 1,
    back: "puzzle, brain teaser, enigma",
    contextSentence: "Эта задача оказалась настоящей головоломкой для всех инженеров.",
    keyConcepts: ["puzzle", "enigma"],
    sourceLang: "ru",
    targetLang: "en",
    interval: 0,
    repetitions: 0,
    easeFactor: 2.50,
    nextReviewDate: hoursAgo(1), // Due today!
    status: "new",
    createdAt: hoursAgo(24),
    lastReviewedDate: null
  },
  {
    id: "card_w_7",
    folderId: "folder_words_1",
    mode: "word",
    front: "die Sehnsucht",
    back: "longing, yearning, ardent desire",
    contextSentence: "Seine Sehnsucht nach Ruhe führte ihn in die stillen Alpen.",
    keyConcepts: ["longing", "yearning"],
    sourceLang: "de",
    targetLang: "en",
    interval: 4,
    repetitions: 2,
    easeFactor: 2.45,
    nextReviewDate: hoursAgo(3), // Due today!
    status: "review",
    createdAt: hoursAgo(150),
    lastReviewedDate: hoursAgo(72)
  },
  {
    id: "card_w_8",
    folderId: "folder_words_1",
    mode: "word",
    front: "flâner",
    back: "pasear sin rumbo, callejear tranquilamente",
    contextSentence: "Nos encanta flâner por las calles empedradas del barrio antiguo.",
    keyConcepts: ["pasear", "callejear"],
    sourceLang: "fr",
    targetLang: "es",
    interval: 14,
    repetitions: 4,
    easeFactor: 2.60,
    nextReviewDate: daysFromNow(7),
    status: "review",
    createdAt: hoursAgo(300),
    lastReviewedDate: hoursAgo(100)
  },

  // ==========================================
  // FOLDER 2: DEFINITIONS ONLY ("folder_defs_1")
  // ==========================================
  {
    id: "card_d_1",
    folderId: "folder_defs_1",
    mode: "definition",
    front: "serendipity",
    back: "The occurrence and development of events by chance in a happy or beneficial way.",
    contextSentence: "A fortunate stroke of serendipity brought the two researchers together at the conference.",
    keyConcepts: ["chance", "happy", "beneficial", "fortune"],
    sourceLang: "en",
    targetLang: "es",
    interval: 0,
    repetitions: 0,
    easeFactor: 2.50,
    nextReviewDate: hoursAgo(3), // Due today!
    status: "new",
    createdAt: hoursAgo(48),
    lastReviewedDate: null
  },
  {
    id: "card_d_2",
    folderId: "folder_defs_1",
    mode: "definition",
    front: "ubiquitous",
    back: "Present, appearing, or found everywhere at the same time; omnipresent.",
    contextSentence: "Smartphones have become ubiquitous across modern society.",
    keyConcepts: ["present", "everywhere", "same time", "omnipresent"],
    sourceLang: "en",
    targetLang: "ru",
    interval: 1,
    repetitions: 1,
    easeFactor: 2.50,
    nextReviewDate: hoursAgo(6), // Due today!
    status: "learning",
    createdAt: hoursAgo(72),
    lastReviewedDate: hoursAgo(24)
  },
  {
    id: "card_d_3",
    folderId: "folder_defs_1",
    mode: "definition",
    front: "resilience",
    back: "The capacity of an individual or system to recover quickly from difficulties and shocks.",
    contextSentence: "Economic resilience helped the nation withstand international turbulence.",
    keyConcepts: ["capacity", "recover", "difficulties", "shocks"],
    sourceLang: "en",
    targetLang: "de",
    interval: 7,
    repetitions: 3,
    easeFactor: 2.50,
    nextReviewDate: hoursAgo(2), // Due today!
    status: "review",
    createdAt: hoursAgo(180),
    lastReviewedDate: hoursAgo(70)
  },
  {
    id: "card_d_4",
    folderId: "folder_defs_1",
    mode: "definition",
    front: "la résilience",
    back: "Capacité d'un individu ou d'un système à surmonter les chocs et à se reconstruire.",
    contextSentence: "La résilience de cette communauté face aux inondations a impressionné le pays.",
    keyConcepts: ["capacite", "surmonter", "chocs", "reconstruire"],
    sourceLang: "fr",
    targetLang: "en",
    interval: 22,
    repetitions: 5,
    easeFactor: 2.70,
    nextReviewDate: daysFromNow(15),
    status: "mastered",
    createdAt: hoursAgo(450),
    lastReviewedDate: hoursAgo(120)
  },
  {
    id: "card_d_5",
    folderId: "folder_defs_1",
    mode: "definition",
    front: "die Schadenfreude",
    back: "Freude über das Missgeschick oder Unglück eines anderen Menschen.",
    contextSentence: "Er konnte seine Schadenfreude nicht verbergen, als sein Rivale stolperte.",
    keyConcepts: ["freude", "missgeschick", "ungluck", "anderen"],
    sourceLang: "de",
    targetLang: "en",
    interval: 5,
    repetitions: 2,
    easeFactor: 2.40,
    nextReviewDate: hoursAgo(4), // Due today!
    status: "review",
    createdAt: hoursAgo(140),
    lastReviewedDate: hoursAgo(60)
  },
  {
    id: "card_d_6",
    folderId: "folder_defs_1",
    mode: "definition",
    front: "la serendipia",
    back: "Hallazgo afortunado e inesperado que se produce cuando se busca otra cosa distinta.",
    contextSentence: "El descubrimiento de la penicilina es el ejemplo clásico de serendipia.",
    keyConcepts: ["hallazgo", "afortunado", "inesperado", "busca"],
    sourceLang: "es",
    targetLang: "en",
    interval: 0,
    repetitions: 0,
    easeFactor: 2.50,
    nextReviewDate: hoursAgo(1), // Due today!
    status: "new",
    createdAt: hoursAgo(12),
    lastReviewedDate: null
  },
  {
    id: "card_d_7",
    folderId: "folder_defs_1",
    mode: "definition",
    front: "интуиция",
    back: "Способность постижения истины путем прямого усмотрения без обоснования доказательствами.",
    contextSentence: "Интуиция подсказала учёному правильное направление исследований.",
    keyConcepts: ["способность", "истина", "прямого", "доказательства"],
    sourceLang: "ru",
    targetLang: "en",
    interval: 10,
    repetitions: 3,
    easeFactor: 2.55,
    nextReviewDate: daysFromNow(4),
    status: "review",
    createdAt: hoursAgo(250),
    lastReviewedDate: hoursAgo(80)
  },
  {
    id: "card_d_8",
    folderId: "folder_defs_1",
    mode: "definition",
    front: "la nostalgia",
    back: "Sentimento di tristezza e rimpianto per la lontananza da persone o luoghi cari.",
    contextSentence: "Guardando le vecchie fotografie sentiva una dolce nostalgia del passato.",
    keyConcepts: ["sentimento", "tristezza", "rimpianto", "lontananza"],
    sourceLang: "it",
    targetLang: "en",
    interval: 2,
    repetitions: 1,
    easeFactor: 2.50,
    nextReviewDate: hoursAgo(2), // Due today!
    status: "learning",
    createdAt: hoursAgo(80),
    lastReviewedDate: hoursAgo(30)
  },

  // ==========================================
  // FOLDER 3: MIXED ("folder_mixed_1")
  // ==========================================
  {
    id: "card_m_1",
    folderId: "folder_mixed_1",
    mode: "word",
    front: "wanderlust",
    back: "an overwhelming desire to travel and explore the world",
    contextSentence: "Her deep wanderlust drove her to backpack solo across South America.",
    keyConcepts: ["desire", "travel", "explore"],
    sourceLang: "en",
    targetLang: "es",
    interval: 0,
    repetitions: 0,
    easeFactor: 2.50,
    nextReviewDate: hoursAgo(1), // Due today!
    status: "new",
    createdAt: hoursAgo(30),
    lastReviewedDate: null
  },
  {
    id: "card_m_2",
    folderId: "folder_mixed_1",
    mode: "definition",
    front: "paradigme",
    back: "Modèle théorique de pensée qui oriente la recherche et la réflexion scientifique.",
    contextSentence: "Cette découverte a provoqué un changement radical de paradigme.",
    keyConcepts: ["modele", "theorique", "pensee", "recherche"],
    sourceLang: "fr",
    targetLang: "en",
    interval: 1,
    repetitions: 1,
    easeFactor: 2.50,
    nextReviewDate: hoursAgo(4), // Due today!
    status: "learning",
    createdAt: hoursAgo(60),
    lastReviewedDate: hoursAgo(20)
  },
  {
    id: "card_m_3",
    folderId: "folder_mixed_1",
    mode: "word",
    front: "gemütlich",
    back: "cozy, comfortable, warm, homelike",
    contextSentence: "Das kleine Café in den Bergen war unheimlich gemütlich.",
    keyConcepts: ["cozy", "comfortable", "homelike"],
    sourceLang: "de",
    targetLang: "en",
    interval: 8,
    repetitions: 3,
    easeFactor: 2.55,
    nextReviewDate: hoursAgo(2), // Due today!
    status: "review",
    createdAt: hoursAgo(160),
    lastReviewedDate: hoursAgo(65)
  },
  {
    id: "card_m_4",
    folderId: "folder_mixed_1",
    mode: "definition",
    front: "la empatía",
    back: "Capacidad de identificarse con alguien y compartir sus sentimientos y emociones.",
    contextSentence: "La empatía es fundamental para resolver conflictos humanos de forma pacífica.",
    keyConcepts: ["capacidad", "identificarse", "sentimientos", "emociones"],
    sourceLang: "es",
    targetLang: "en",
    interval: 24,
    repetitions: 5,
    easeFactor: 2.65,
    nextReviewDate: daysFromNow(12),
    status: "mastered",
    createdAt: hoursAgo(420),
    lastReviewedDate: hoursAgo(110)
  },
  {
    id: "card_m_5",
    folderId: "folder_mixed_1",
    mode: "word",
    front: "meraviglioso",
    back: "wonderful, marvelous, extraordinary",
    contextSentence: "Abbiamo trascorso un weekend meraviglioso sulla costa ligure.",
    keyConcepts: ["wonderful", "marvelous"],
    sourceLang: "it",
    targetLang: "en",
    interval: 0,
    repetitions: 0,
    easeFactor: 2.50,
    nextReviewDate: hoursAgo(3), // Due today!
    status: "new",
    createdAt: hoursAgo(18),
    lastReviewedDate: null
  },
  {
    id: "card_m_6",
    folderId: "folder_mixed_1",
    mode: "definition",
    front: "энтропия",
    back: "Мера беспорядка и хаотичности в замкнутой термодинамической или информационной системе.",
    contextSentence: "В изолированной системе энтропия неизменно возрастает с течением времени.",
    keyConcepts: ["мера", "беспорядка", "хаотичности", "системе"],
    sourceLang: "ru",
    targetLang: "en",
    interval: 3,
    repetitions: 2,
    easeFactor: 2.45,
    nextReviewDate: hoursAgo(2), // Due today!
    status: "review",
    createdAt: hoursAgo(100),
    lastReviewedDate: hoursAgo(45)
  },
  {
    id: "card_m_7",
    folderId: "folder_mixed_1",
    mode: "word",
    front: "incongruous",
    back: "неуместный, нелепый, несовместимый",
    contextSentence: "His formal tuxedo looked completely incongruous at a casual beach party.",
    keyConcepts: ["неуместный", "нелепый"],
    sourceLang: "en",
    targetLang: "ru",
    interval: 1,
    repetitions: 1,
    easeFactor: 2.50,
    nextReviewDate: hoursAgo(5), // Due today!
    status: "learning",
    createdAt: hoursAgo(50),
    lastReviewedDate: hoursAgo(22)
  },
  {
    id: "card_m_8",
    folderId: "folder_mixed_1",
    mode: "definition",
    front: "die Metakognition",
    back: "Das Wissen und die bewusste Steuerung der eigenen kognitiven Lernprozesse.",
    contextSentence: "Erfolgreiche Lernende nutzen Metakognition, um ihre Lernstrategien zu optimieren.",
    keyConcepts: ["wissen", "steuerung", "kognitiven", "prozesse"],
    sourceLang: "de",
    targetLang: "en",
    interval: 28,
    repetitions: 5,
    easeFactor: 2.70,
    nextReviewDate: daysFromNow(20),
    status: "mastered",
    createdAt: hoursAgo(550),
    lastReviewedDate: hoursAgo(140)
  }
];

export const INITIAL_MOCK_LOGS = [
  {
    id: "log_init_1",
    cardId: "card_w_2",
    mode: "word",
    rating: 3,
    timestamp: hoursAgo(24),
    previousInterval: 0,
    newInterval: 1,
    easeFactor: 2.50
  },
  {
    id: "log_init_2",
    cardId: "card_w_3",
    mode: "word",
    rating: 3,
    timestamp: hoursAgo(72),
    previousInterval: 1,
    newInterval: 3,
    easeFactor: 2.35
  },
  {
    id: "log_init_3",
    cardId: "card_d_2",
    mode: "definition",
    rating: 3,
    timestamp: hoursAgo(24),
    previousInterval: 0,
    newInterval: 1,
    easeFactor: 2.50
  },
  {
    id: "log_init_4",
    cardId: "card_d_3",
    mode: "definition",
    rating: 4,
    timestamp: hoursAgo(70),
    previousInterval: 3,
    newInterval: 7,
    easeFactor: 2.50
  },
  {
    id: "log_init_5",
    cardId: "card_m_3",
    mode: "word",
    rating: 3,
    timestamp: hoursAgo(65),
    previousInterval: 4,
    newInterval: 8,
    easeFactor: 2.55
  },
  {
    id: "log_init_6",
    cardId: "card_m_6",
    mode: "definition",
    rating: 2,
    timestamp: hoursAgo(45),
    previousInterval: 1,
    newInterval: 3,
    easeFactor: 2.45
  }
];
