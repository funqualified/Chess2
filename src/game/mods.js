class ModManager {}

const Mods = [
  {
    name: "Fog of War",
    description: "You can only see spaces your pieces can move to",
    tags: ["Information", "Rule Addition"],
    spice: 4,
    uid: "FOG",
  },
  // {
  //   name: "Stamina",
  //   description: "Each piece needs stamina to move",
  //   tags: ["Movement", "Rule Addition"],
  //   spice: 2,
  //   uid: "STAMINA",
  // },
  {
    name: "Vampire",
    description: "Pieces gain the powers of pieces they've captured",
    tags: ["Movement", "Rule Addition"],
    spice: 3,
    uid: "VAMPIRE",
  },
  {
    name: "Shields",
    description: "Pieces can have a shield that prevents capture, consumed on use",
    tags: ["Capture", "Rule Addition"],
    spice: 2,
    uid: "SHIELDS",
  },
  {
    name: "Wrap",
    description: "The left and right sides of the board wrap around",
    tags: ["Movement", "Rule Addition"],
    spice: 4,
    uid: "WRAP",
  },
  {
    name: "Loyalty",
    description: "Pieces may defect to the other side",
    tags: ["Capture", "Rule Addition"],
    spice: 5,
    uid: "LOYALTY",
  },
  {
    name: "Random Start",
    description: "Pieces will start using the Chess960 random alternate start rules",
    tags: ["Start Position", "Rule Change"],
    spice: 1,
    uid: "RANDOM_START",
  },
  {
    name: "Elimination",
    description: "All enemy pieces must be eliminated to win, having no legal moves skips your turn",
    tags: ["Win Condition", "Rule Change"],
    spice: 2,
    uid: "ELIMINATION",
  },
  // {
  //   name: "Hit Chance",
  //   description: "Pieces may fail to capture",
  //   tags: ["Capture", "Rule Change"],
  //   spice: 3,
  //   uid: "HIT_CHANCE",
  // },
  // {
  //   name: "Bombers",
  //   description: "Pieces explode after X moves, capturing themselves and adjecent spaces",
  //   tags: ["Capture", "Rule Addition"],
  //   spice: 3,
  //   uid: "BOMBERS",
  // },
  {
    name: "Quicktime Promotion",
    description: "Pawn promotion requires a quicktime minigame",
    tags: ["promotion", "Rule Change"],
    spice: 2,
    uid: "QTE_PROMOTION",
  },
  {
    name: "No En Passant",
    description: "Pawns may not make the En passant move",
    tags: ["en passant", "Rule Removal"],
    spice: 1,
    uid: "NO_EN_PASSANT",
  },
  {
    name: "No Castling",
    description: "Kings may not make the castling move",
    tags: ["Castling", "Rule Removal"],
    spice: 1,
    uid: "NO_CASTLING",
  },
  {
    name: "Names",
    description: "Pieces have names",
    tags: ["Names", "Flavor"],
    spice: 0,
    uid: "NAMES",
  },
];

let instance = null;

function getModManager() {
  if (!instance) {
    instance = new ModManager();
  }
  return instance;
}

export default getModManager;
export { Mods };
