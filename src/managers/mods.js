import getName from "../mods/PieceNames";
import GridPosition from "../models/gridPosition";

class ModManager {}

const Mods = [
  {
    name: "Fog of War",
    description: "You can only see spaces your pieces can move to",
    tags: ["Information", "Rule Addition"],
    spice: 4,
    uid: "FOG",
    events: {
      Fog: (game, data) => {
        let sight = game.getPlayerSight(game.playerColor);

        let fogArr = [];

        for (let i = 0; i < game.board.length; i++) {
          for (let j = 0; j < game.board[i].length; j++) {
            if (!new GridPosition(i, j).isIn(sight) && !(game.board[i][j] != null && game.board[i][j].color == game.playerColor)) {
              fogArr.push(new GridPosition(i, j));
            }
          }
        }
        data.fogArr = fogArr;
        return "Continue";
      },
    },
  },
  {
    name: "Vampire",
    description: "Pieces gain the powers of pieces they've captured",
    tags: ["Movement", "Rule Addition", "Names"],
    spice: 3,
    uid: "VAMPIRE",
    events: {
      PieceCreated: (game, data) => {
        data.piece.isVampire = data.piece.fenId.toLowerCase() === "n" || data.piece.fenId.toLowerCase() === "q";
        return "Continue";
      },
      PieceInfo: (game, data) => {
        if (data.piece.isVampire) {
          data.abilities += "Vampire\n";
          data.abilities += `Moves: ${data.piece.moveTypes}\n`;
        }
        return "Continue";
      },
      Move: (game, data) => {
        if (data.piece.isVampire && data.targetPiece) {
          data.targetPiece.moveTypes.forEach((value) => {
            if (!data.piece.moveTypes.includes(value)) {
              data.piece.moveTypes.push(value);
            }
          });
        }
        return "Continue";
      },
    },
  },
  {
    name: "Shields",
    description: "Pieces can have a shield that prevents capture, consumed on use",
    tags: ["Capture", "Rule Addition"],
    nonCompatibleIDs: [],
    nonCompatibleTags: [],
    spice: 2,
    uid: "SHIELDS",
    events: {
      PieceCreated: (game, data) => {
        data.piece.hasShield = data.piece.fenId.toLowerCase() === "p";
        return "Continue";
      },
      PieceInfo: (game, data) => {
        if (data.piece.hasShield) {
          data.abilities += "Shielded\n";
        }
        return "Continue";
      },
      Move: (game, data) => {
        if (data.targetPiece?.hasShield) {
          data.targetPiece.hasShield = false;
          data.returnVal.hitShield = true;
          data.returnVal.didCapturePiece = false;
          return "NoMods";
        }
        return "Continue";
      },
      EnPassantCapture: (game, data) => {
        if (data.targetPiece?.hasShield) {
          data.targetPiece.hasShield = false;
          data.returnVal.hitShield = true;
          data.returnVal.didCapturePiece = false;
          return "NoDefault";
        }
      },
    },
  },
  {
    name: "Wrap",
    description: "The left and right sides of the board wrap around",
    tags: ["Movement", "Rule Addition"],
    spice: 4,
    uid: "WRAP",
    events: {
      setSpaceNeighbors: (game, data) => {
        for (let i = 0; i < data.spaces.length; i++) {
          const space = data.spaces[i];
          const position = space.getPosition();
          const row = position.row;
          const col = position.col;
          const neighbors = space.neighbors;
          if (col === 0) {
            neighbors.push({ space: new GridPosition(row, data.width - 1), type: "left" });
          }
          if (col === data.width - 1) {
            neighbors.push({ space: new GridPosition(row, 0), type: "right" });
          }
        }
        return "Continue";
      },
    },
  },
  {
    name: "Loyalty",
    description: "Pieces may defect to the other side",
    tags: ["Capture", "Rule Addition"],
    nonCompatibleIDs: [],
    nonCompatibleTags: [],
    spice: 5,
    uid: "LOYALTY",
    events: {
      pieceCreated: (game, data) => {
        data.piece.loyalty = data.piece.fenId.toLowerCase() === "k" ? 100 : 10;
        return "Continue";
      },
      PieceInfo: (game, data) => {
        data.abilities += `Loyalty:${this.loyalty}\n`;
        return "Continue";
      },
      PieceEndOfTurn: async (game, data) => {
        if (data.piece.fenId.toLowerCase() === "k") {
          data.piece.loyalty = 100;
        } else {
          data.piece.loyalty += 1;
          data.moves.forEach((move) => {
            if (game.board[move.to.row][move.to.col] === data.piece) {
              data.piece.loyalty -= 2;
            }
          });
        }
        if (data.piece.loyalty > 100) {
          data.piece.loyalty = 100;
        }
        if (data.piece.loyalty < 0) {
          data.piece.loyalty = Math.abs(data.piece.loyalty);
          data.piece.color = data.piece.color === "white" ? "black" : "white";
        }

        return "Continue";
      },
    },
  },
  {
    name: "Random Start",
    description: "Pieces will start using the Chess960 random alternate start rules",
    tags: ["Start Position", "Rule Change"],
    nonCompatibleIDs: [],
    nonCompatibleTags: ["Start Position"],
    spice: 1,
    uid: "RANDOM_START",
    events: {
      BoardSetup: (game, data) => {
        var possitionsArr = [null, null, null, null, null, null, null, null];
        possitionsArr[Math.floor(Math.random() * 4) * 2] = "b";
        possitionsArr[Math.floor(Math.random() * 4) * 2 + 1] = "b";

        var i = -1;
        var queenIndex = Math.floor(Math.random() * 6);
        while (i < queenIndex) {
          i++;
          if (possitionsArr[i] !== null) {
            queenIndex++;
          }
        }
        possitionsArr[i] = "q";

        i = -1;
        var knightOneIndex = Math.floor(Math.random() * 5);
        while (i < knightOneIndex) {
          i++;
          if (possitionsArr[i] !== null) {
            knightOneIndex++;
          }
        }
        possitionsArr[i] = "n";

        i = -1;
        var knightTwoIndex = Math.floor(Math.random() * 4);
        while (i < knightTwoIndex) {
          i++;
          if (possitionsArr[i] !== null) {
            knightTwoIndex++;
          }
        }
        possitionsArr[i] = "n";

        var x = 2;
        i = 0;
        while (x >= 0) {
          if (possitionsArr[i] === null) {
            if (x === 2 || x === 0) {
              possitionsArr[i] = "r";
            } else {
              possitionsArr[i] = "k";
            }
            x--;
          }
          i++;
        }

        data.fen = `${possitionsArr.join("")}/pppppppp/8/8/8/8/PPPPPPPP/${possitionsArr.join("").toUpperCase()} w KQkq - 0 1`;
        return "noDefault";
      },
    },
  },
  {
    name: "Elimination",
    description: "All enemy pieces must be eliminated to win, having no legal moves skips your turn",
    tags: ["Win Condition", "Rule Change"],
    spice: 2,
    uid: "ELIMINATION",
    events: {
      CheckForWinner: (game, data) => {
        var hasValidMove = false;
        var whiteHasPieces = false;
        var blackHasPieces = false;
        for (let i = 0; i < game.board.length; i++) {
          for (let j = 0; j < game.board[i].length; j++) {
            const piece = game.board[i][j];
            if (piece !== null) {
              if (piece.color.charAt(0) === game.turn && game.moves(new GridPosition(i, j)).length > 0) {
                hasValidMove = true;
              }
              if (piece.color.charAt(0) === "w") {
                whiteHasPieces = true;
              } else {
                blackHasPieces = true;
              }
            }
          }
        }
        //TODO: Doesn't matter now, but in the future, there could be an edge case where white and black lose all pieces at the same time
        // Come to think of it, I may need to add draws as a result for the normal win detector.
        if (!whiteHasPieces && !blackHasPieces) {
          data.winner = "draw";
        }
        if (!whiteHasPieces) {
          data.winner = "black";
        }
        if (!blackHasPieces) {
          data.winner = "white";
        }

        return "NoDefaultNoMods";
      },
      EndOfTurn: (game, data) => {
        var hasValidMove = false;
        for (let i = 0; i < game.board.length; i++) {
          for (let j = 0; j < game.board[i].length; j++) {
            const piece = game.board[i][j];
            if (piece !== null) {
              if (piece.color.charAt(0) === game.turn && game.moves(new GridPosition(i, j)).length > 0) {
                hasValidMove = true;
              }
            }
          }
        }
        if (!hasValidMove) {
          game.turn = game.turn === "w" ? "b" : "w";
        }
        return "Continue";
      },
      DoesMoveLeaveInCheck(game, data) {
        return "NoDefault";
      },
    },
  },
  {
    name: "Quicktime Promotion",
    description: "Pawn promotion requires a quicktime minigame",
    tags: ["promotion", "Rule Change"],
    nonCompatibleIDs: [],
    nonCompatibleTags: ["promotion"],
    spice: 2,
    uid: "QTE_PROMOTION",
    events: {
      Promotion: async (game, data) => {
        console.log("QTE_PROMOTION");
        if (data.piece.color !== game.playerColor) {
          var value = Math.random() * 51;
        } else {
          var value = data.defaultAction ? "q" : await data.gameplayUIManager().QTUI();
        }
        var fen = null;
        if (value < 10) {
          fen = "q";
        } else if (value < 20) {
          fen = "n";
        } else if (value < 35) {
          fen = "b";
        } else if (value < 50) {
          fen = "r";
        }
        if (fen === null) {
          game.board[data.index.row][data.index.col] = null;
        } else {
          game.board[data.index.row][data.index.col] = data.pieceFactory(game, data.piece.color === "white" ? fen.toUpperCase() : fen.toLowerCase());
        }
        return "noDefaultNoMods";
      },
    },
  },
  {
    name: "No En Passant",
    description: "Pawns may not make the En passant move",
    tags: ["en passant", "Rule Removal"],
    spice: 1,
    uid: "NO_EN_PASSANT",
    events: {
      PawnDoubleMoved: (game, data) => {
        game.enPassant = new GridPosition(-1, -1);
        return "Continue";
      },
    },
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
    tags: ["Flavor"],
    nonCompatibleIDs: [],
    nonCompatibleTags: [],
    spice: 0,
    uid: "NAMES",
    events: {
      PieceCreated: (game, data) => {
        // TODO: Incorporate PieceNames.js here, and allow this to check for custom name lists in other mods
        data.piece.name = getName(data.piece.name.toLowerCase());
        return "Continue";
      },
    },
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
