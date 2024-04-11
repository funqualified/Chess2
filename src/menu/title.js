import { useState } from "react";

const Title = () => {
  function getGameTitle() {
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
      "Chess II: Game of the Year Edition",
    ];

    var title = "";
    if (Math.random() < 0.5) {
      title = randomGameNames[Math.floor(Math.random() * randomGameNames.length)];
      if (title.includes("[insert piece name]")) {
        var pieceName = randomPieceNames[Math.floor(Math.random() * randomPieceNames.length)];
        title = title.replace("[insert piece name]", pieceName);
      }
    } else {
      title = "Chess 2: Game of the Year Edition";
    }

    return title;
  }

  function getClassList() {
    var list = "";
    if (Math.random() < 0.01) {
      list += "bounce-title ";
    }
    if (Math.random() < 0.05) {
      list += "shake-title ";
    }
    if (Math.random() < 0.33) {
      list += "shine-title ";
    }
    if (Math.random() < 0.05) {
      list += "tiny-title ";
    }
    if (Math.random() < 0.1) {
      list += "red-title ";
    }

    return list;
  }

  const [classList] = useState(getClassList());
  const [gameTitle] = useState(getGameTitle());

  return <h1 className={classList} id="game-title" dangerouslySetInnerHTML={{ __html: gameTitle }}></h1>;
};

export default Title;
