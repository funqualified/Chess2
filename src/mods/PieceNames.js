function getName(piece) {
  switch (piece) {
    case "pawn":
      if (Math.random() < 0.1) {
        return getPawnName();
      } else {
        return getDefaultName();
      }
    case "rook":
      if (Math.random() < 0.1) {
        return getRookName();
      } else {
        return getDefaultName();
      }
    case "knight":
      if (Math.random() < 0.1) {
        return getKnightName();
      } else {
        return getDefaultName();
      }
    case "bishop":
      if (Math.random() < 0.1) {
        return getBishopName();
      } else {
        return getDefaultName();
      }
    case "queen":
      if (Math.random() < 0.3) {
        return getQueenName();
      } else {
        return getDefaultName();
      }
    case "king":
      if (Math.random() < 0.3) {
        return getKingName() + " II";
      } else {
        return getDefaultName() + " II";
      }
    case "vampire":
      return vampireNames[Math.floor(Math.random() * vampireNames.length)];
    default:
      return getDefaultName();
  }
}

const pawnNames = ["Pawny McPawnface", "Pawn Solo", "Pawn Jovi", "Pawn of the Dead", "Pawn Connery", "P", "Kyle"];
const rookNames = ["Rook Astley", "Rooky Balboa", "Rooky Racoon", "Rooky Horror Picture Show", "Rooky Martin", "R"];
const knightNames = [
  "Knight Rider",
  "Knight of the Living Dead",
  "Knight of the Round Table",
  "Knight of Cups",
  "Knight of Wands",
  "K",
  "Percival",
  "Lancelot",
  "Joan of Arc",
  "Galahad",
  "Tristan",
  "Isolde",
  "Gawain",
  "Mordred",
];
const bishopNames = [
  "Bishop of the Dead",
  "Bishop of the Seven Kingdoms",
  "Bishop of the North",
  "Bishop of the East",
  "Bishop of the South",
  "Bishop of the W",
  "Gabriel",
  "Leo",
  "Gregory",
];
const queenNames = [
  "Girl Boss",
  "Yass Queen Slay",
  "Her Majesty",
  "Killer Queen Black",
  "Freddie Mercury",
  "Q",
  "Qween",
  "Qweenie",
  "Qweenie Todd",
  "Barbie",
  "Elizabeth",
  "Mary",
  "Victoria",
  "Catherine",
  "Anne",
  "Margaret",
  "Charlotte",
  "Guinevere",
];
const kingNames = [
  "King of the Hill",
  "King of the Kill",
  "Hank Hill",
  "Charles",
  "Richard",
  "George",
  "Edward",
  "Louis",
  "Philip",
  "Arthur",
  "William",
  "Mufasa",
  "Alexander",
  "Solomon",
  "Charlemagne",
  "Napoleon",
  "Henry",
  "John",
  "James",
];
const defaultNames = [
  "Clarence",
  "Randy Andy",
  "Greg",
  "Anderson Hank",
  "Bobby",
  "Spartacus",
  "Master Chief",
  "Ryan",
  "Sam",
  "Jaime",
  "Richie",
  "Brandon",
  "Britt",
  "Sarah",
  "Kirsten",
  "Tammy",
  "David",
  "Dave",
  "John",
  "Tommy",
  "Cody",
  "Jackie",
  "Cassidy",
  "Vince",
  "Ashley",
  "Hannah",
  "Hanna",
  "Sara",
  "Kate",
  "Austin",
  "Thomas",
  "Carol",
  "Jake",
  "Jess",
  "Jessica",
  "Jen",
  "Jennifer",
  "Samantha",
  "Sammy",
  "Christopher",
  "Michael",
  "Andrew",
  "Caleb",
  "Madeline",
  "No one",
  "John Spartan 117 Master Chief of the Seven Kingdoms of the North and the East and the South and the West and the W and the W",
  "James",
  "Jim",
  "Jimothy",
  "Jimbo",
  "Robert",
  "Bob",
  "Bobby",
  "Rob",
  "Robbie",
  "Robbo",
  "Patricia",
  "Pat",
  "Patty",
  "Patty Cakes",
  "Patty Wack",
  "Patty Mayonnaise",
  "Linda",
  "Lindsey",
  "Lindsay",
  "Liz",
  "Lizzy",
  "Lizbeth",
  "Barbara",
  "Barb",
  "Barbie",
  "William",
  "Bill",
  "Billy",
  "Will",
  "Willie",
  "Willie Wonka",
  "Richard",
  "Dick",
  "Lisa",
  "Logan",
  "Grace",
  "Juan",
  "Julia",
  "Alan",
  "Mark",
  "Amber",
  "Danielle",
  "Dani",
  "Elijah",
  "Marilyn",
  "Sophia",
  "Lydia",
  "Lawrence",
  "Dylan",
  "Harold",
  "Alice",
  "Isabella",
  "Jacob",
];

const vampireNames = [
  "Bella",
  "Edward",
  "Emmett",
  "Rosalie",
  "Carlisle",
  "Esme",
  "Rosalie",
  "Jasper",
  "Renesmee",
  "Laurent",
  "Riley",
  "Bree",
  "Maria",
  "Zafrina",
  "Senna",
  "Kachiri",
  "Peter",
  "Alice",
  "Sasha",
  "Dracula",
  "Nosferatu",
  "Alucard",
  "Lenore",
  "Ratko",
  "Striga",
  "Dragan",
  "Carmilla",
  "Spike",
  "Angel",
  "Darla",
  "Drusilla",
  "Willow",
  "Chastity",
  "LaCroix",
  "Maximillian",
  "Gary",
  "Cain",
  "Kain",
  "Nadja",
  "Laszlo",
  "Nandor",
  "Colin",
  "Morbius",
  "Selene",
  "Katherine",
  "Damon",
  "Barnabas",
  "Marceline",
  "Lestat",
  "Blade",
  "The Count",
  "Viago",
  "The Countess",
  "Bill",
  "Pamela",
  "Rebekah",
  "Elijah",
  "Eric",
  "klaus",
  "Stefan",
  "Shori",
  "Vamp",
  "Vlad",
  "Alcina",
  "Seth",
  "Lillian",
  "Claudia",
  "Mina",
  "Sandy",
  "Mavis",
  "Dennis",
  "Santánico",
  "Charlotte",
  "Lee",
  "Caroline",
  "Abby",
  "Lucien",
  "Dimitri",
  "Marcel",
  "Jade",
  "Julian",
  "Roman",
  "Oliver",
  "Kol",
  "Katherine",
  "Elana",
  "Orlok",
  "Armand",
  "Juliet",
  "Rudolph",
  "Oxana",
  "Boris",
  "Vladimir",
  "Vladislav",
  "Vladislaus",
  "Vladimir",
  "Vladislav",
  "Drac",
  "Lilith",
];

function getPawnName() {
  return pawnNames[Math.floor(Math.random() * pawnNames.length)];
}

function getRookName() {
  return rookNames[Math.floor(Math.random() * rookNames.length)];
}

function getKnightName() {
  return knightNames[Math.floor(Math.random() * knightNames.length)];
}

function getBishopName() {
  return bishopNames[Math.floor(Math.random() * bishopNames.length)];
}

function getQueenName() {
  return queenNames[Math.floor(Math.random() * queenNames.length)];
}

function getKingName() {
  return kingNames[Math.floor(Math.random() * kingNames.length)];
}

function getDefaultName() {
  return defaultNames[Math.floor(Math.random() * defaultNames.length)];
}

export default getName;
