// Default categories shown the first time the app is opened.
// Users can add, rename, or delete everything from the Category Manager.
// IDs use a fixed string so we can safely reference them as defaults.

export const DEFAULT_CATEGORIES = [
  {
    id: 'cat-cam',
    name: 'Cam',
    subcategories: [
      {
        id: 'sub-cam-site',
        name: 'Cam Site',
        type: 'token',    // 'dollar' | 'token'
        tokenRate: 0.05,  // dollars per token — Chaturbate's default rate
        emoji: '🎥',
      },
    ],
  },
  {
    id: 'cat-other',
    name: 'Other',
    subcategories: [
      {
        id: 'sub-other-income',
        name: 'Other Income',
        type: 'dollar',
        tokenRate: null,  // not used for dollar-type sources
        emoji: '💰',
      },
    ],
  },
];

// Randomly assigned to new income sources when created.
export const SUBCATEGORY_EMOJIS = [
  '💗', '💖', '💕', '💓', '💝', '🌸', '🌺', '🌹', '🌷', '🌼',
  '🦋', '✨', '🌙', '💫', '🎀', '👑', '💎', '🍓', '🍒', '🩷',
  '🫧', '🌈', '🐝', '🪷', '🌿', '💐', '🫶', '🌟', '🍑', '🎵',
];

// Treat messages shown at goal milestones. All free — money is for saving!
export const GOAL_TREATS = {
  25: [
    "Quarter way there! Step outside for some fresh air 🌿",
    "25%! Make yourself a fancy coffee or tea ☕",
    "You're moving! Take a 5 min dance break 💃",
  ],
  50: [
    "HALFWAY! You deserve a long hot shower or bath 🛁",
    "50% done! Do your nails and vibe 💅",
    "Halfway there! Watch an episode completely guilt-free 📺",
  ],
  75: [
    "75%! Take a nap, you've absolutely earned it 😴",
    "Almost there! Make something yummy to eat 🍳",
    "Three quarters! Call or text someone who makes you smile 💗",
  ],
  100: [
    "YOU HIT YOUR GOAL! 🎉 Do literally whatever you want for an hour",
    "GOAL CRUSHED! 👑 Long bath + face mask + your fave playlist",
    "YOU DID IT! ✨ Dance around your room like nobody's watching",
  ],
};

// Shown at the top of the home screen, rotates daily.
export const AFFIRMATIONS = [
  "The universe will provide for you ✨",
  "All you need to do is show up 💗",
  "Health is wealth 👑",
  "Your worth is not dependent on how much money you make today 🌸",
  "You are growing and changing 🦋",
  "There is enough love, money, and time ✨",
  "You're gonna crush this 🏆",
  "Take a deep breath 💅",
  "Do just what is needed 🌺",
];
