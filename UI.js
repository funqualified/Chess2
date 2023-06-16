function beginSingleplayer() {
  mods = [];
  $("input:checkbox[name=mods]:checked").each(function () {
    mods.push(GameTags[$(this).val()]);
  });
  startGame(mods);
}

function hostMultiplayer() {
  mods = [];
  $("input:checkbox[name=mods]:checked").each(function () {
    mods.push(GameTags[$(this).val()]);
  });

  startGame(mods, true);
  hostGame();
}

function joinMultiplayer() {
  joinGame($('input[name="PeerId"]').val());
}

window.onload = function () {
  const section = document.getElementById("mod-selector");
  section.innerHTML = "";
  Object.keys(GameTags).forEach((mod) => {
    const span = document.createElement("span");
    span.innerHTML = `<label>${convertToCapitalCase(mod)}</label><input type='checkbox' name='mods' value='${mod}' />`;
    span.setAttribute("title", GameTags[mod]);
    section.appendChild(span);
    section.appendChild(document.createElement("br"));
  });

  if (Math.random() < 0.5) {
    var randomGameName = randomGameNames[Math.floor(Math.random() * randomGameNames.length)];
    if (randomGameName.includes("[insert piece name]")) {
      var pieceName = randomPieceNames[Math.floor(Math.random() * randomPieceNames.length)];
      randomGameName = randomGameName.replace("[insert piece name]", pieceName);
    }
    document.getElementById("game-title").innerHTML = randomGameName;
  }

  if (Math.random() < 0.01) {
    document.getElementById("game-title").classList.add("bounce-title");
  }
  if (Math.random() < 0.005) {
    document.getElementById("game-title").classList.add("shake-title");
  }
  if (Math.random() < 0.33) {
    document.getElementById("game-title").classList.add("shine-title");
  }
  if (Math.random() < 0.1) {
    document.getElementById("game-title").classList.add("tiny-title");
  }
  if (Math.random() < 0.1) {
    document.getElementById("game-title").classList.add("red-title");
  }
};

function quit() {
  location.reload();
}

//Helpers
function convertToCapitalCase(str) {
  // Replace underscores with spaces
  str = str.replace(/_/g, " ");

  // Convert to capital case
  str = str.toLowerCase().replace(/(?:^|\s)\w/g, function (match) {
    return match.toUpperCase();
  });

  return str;
}

var randomPieceNames = ["Pawn", "Rook", "Bishop", "Knight", "Queen", "King"];

var randomGameNames = [
  "Chess Revelations",
  "The Elder Chess",
  "Call of Chess: Modern Chessfare",
  "Chessout: New Vegas",
  "Chess Box 360",
  "Chess 2: Pig in the City",
  "Chess 2: Pawn in the City",
  "Chess 2: Into Darkness",
  "Chess-Kazooie",
  "Chess-Tooie",
  "Chess: 2049",
  "Super Smash Chess Ultimate",
  "Chess 2: The Return of Jafar",
  "Chess 2: The Chesspire Strikes Back",
  "Chess 2: Cruise Control",
  "Chess 4: A New Chess",
  "Chess Crossing",
  "Chess 9: The Rise of Chess",
  "Chess 2: A Tale of Two Kitties",
  "Chess 2: The Squeakquel",
  "2 Chess 2 Furious",
  "Chess Ever After",
  "Chess 2: The Legend of Curly's Gold",
  "Chess 1 1/2",
  "Chess 2: Die Harder",
  "Total War: Chess 2",
  "Chess and Chesserer",
  "Chess 2: Judgment Day",
  "Doki Doki Chess Club",
  "Doki Doki Chess Club Plus",
  "Chesses",
  "Chesss",
  "Chess 2: The Spy Who Shagged Me",
  "Chess 2: The [insert piece name] Who Shagged Me",
  "Chess 2: Dead Man's Chest",
  "Chess 2:  Dead Man's Chess",
  "Chess 2: Dead Man's Chest. Or perhaps Chess 2:  Dead Man's Chess",
  "The Dark Knight",
  "Chess II",
  "Chess 2 and the Temple of Doom",
  "Chess: Maverick",
  "Chess 2: Fury Board",
  "Chess 2: Passant Thunderdome",
  "Chess 2: The Winter [insert piece name]",
  "Chess: Legacy",
  "Chess 2: Legacy",
  "Chess 2: Your Sister is a Werewolf",
  "Chess 2: Chess 2: Chess 2: Chess 2: Chess 2: Chess 2:",
  "Chess-Man 2",
  "Chess 2: Age of Ultron",
  "Chess! Here We Go Again",
  "Chess Returns",
  "Chess 2: The Dark World",
  "Chess 2: The Mysterious Island",
  "The Chess Supremacy",
  "Chezz II Men",
  "Chess 2: Family Business",
  "Chess Too",
  "Top Chess: Maverick",
  "Chess 2: Back in the Habit",
  "White Chess 2",
  "The Pawn: Desolation of Chess",
  "Checking Private Ryan",
  "Chess^2",
  "Chess: Eternal",
  "Chess: Arkham City",
  "Chess 2: Among [insert piece name]",
  "Killer Queen Chess",
  "Chess 2 Hyperchess",
  "Chess <i>Two</i> ",
];
