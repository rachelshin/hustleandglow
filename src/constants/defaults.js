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
    "Quarter done! Blast your favorite song and sing every word 🎶",
    "25%! Stretch it out — your body is working hard too 🧘",
    "You started and that's everything. Take a 10 min walk 🚶",
    "25%! Write down one thing you're proud of right now 💗",
    "Quarter way! Do a quick face massage, you deserve it ✨",
    "25%! Watch one funny video and actually laugh 😂",
    "You're going! Grab some water and take 5 deep breaths 💧",
  ],
  50: [
    "HALFWAY! You deserve a long hot shower or bath 🛁",
    "50% done! Do your nails and vibe 💅",
    "Halfway there! Watch an episode completely guilt-free 📺",
    "HALFWAY! Do a full skincare routine, slow and indulgent 🌸",
    "50%! Go outside for a 15 min walk and clear your head 🌤️",
    "Halfway! Put on a hair mask and let it sit while you relax 💆",
    "50% done! Read a chapter of something you actually want to read 📖",
    "HALFWAY! Journal for 10 min — what's going well? 📝",
    "50%! Lie on the floor and stare at the ceiling guilt-free 🙃",
    "Halfway there! Text someone you love for no reason 💗",
  ],
  75: [
    "75%! Take a nap, you've absolutely earned it 😴",
    "Almost there! Make something yummy to eat 🍳",
    "Three quarters! Call or text someone who makes you smile 💗",
    "75%! Do a full body stretch and groan as loud as you want 😌",
    "Almost there! Make a playlist for your next session 🎵",
    "Three quarters! Run a bath and add whatever makes it feel fancy 🛁",
    "75%! Sit outside for 20 minutes and do absolutely nothing 🌿",
    "Almost there! Watch something cozy with no guilt at all 📺",
    "75%! Write down everything you're grateful for right now ✨",
    "Three quarters! Give yourself a little shoulder and neck massage 💆",
  ],
  100: [
    "YOU HIT YOUR GOAL! 🎉 Do literally whatever you want for an hour",
    "GOAL CRUSHED! 👑 Long bath + face mask + your fave playlist",
    "YOU DID IT! ✨ Dance around your room like nobody's watching",
    "GOAL UNLOCKED! 🎉 Full pamper night — face mask, hair mask, the works",
    "YOU CRUSHED IT! 🔥 Pick a movie and watch the whole thing guilt-free",
    "GOAL HIT! 🌟 Sleep in tomorrow, you have officially earned it",
    "YOU DID THAT! 💗 Call your best friend and tell them you killed it",
    "ACHIEVED! ✨ Make your absolute favorite meal from whatever's home",
    "GOAL SMASHED! 👑 Take tomorrow morning completely off, for real",
    "YOU LEGEND! 🦋 Full cozy night — blanket burrito, comfort show, snacks",
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
