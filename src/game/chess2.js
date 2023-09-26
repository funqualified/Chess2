import gameplayUIManager from "./gameplayUI";
import getName from "../mods/PieceNames";

const GameTags = {
  FOG: "You can only see spaces your pieces can move to",
  //STAMINA: "Each piece needs stamina to move",
  VAMPIRE: "Pieces gain the powers of pieces they've captured",
  SHIELDS: "Pieces can have a shield that prevents capture, consumed on use",
  WRAP: "The left and right sides of the board wrap around",
  LOYALTY: "Pieces may defect to the other side",
  RANDOM_START: "Pieces will start using the Chess960 random alternate start rules",
  ELIMINATION: "All enemy pieces must be eliminated to win, having no legal moves skips your turn",
  //HIT_CHANCE: "Pieces may fail to capture",
  //BOMBERS: "Pieces explode after X moves, capturing themselves and adjecent spaces",
  QTE_PROMOTION: "Pawn promotion requires a quicktime minigame",
  NO_EN_PASSANT: "Pawns may not make the En passant move",
  NO_CASTLING: "Kings may not make the castling move",
  NAMES: "Pieces have names",
};

function pieceFactory(fenId, index) {
  const color = fenId >= "A" && fenId <= "Z" ? "white" : "black";
  switch (fenId.toLowerCase()) {
    case "p":
      return new Piece(color, fenId, index, instance.mods.includes(GameTags.NAMES) ? getName("pawn") : "Pawn", ["pawn"], true, true);
    case "b":
      return new Piece(color, fenId, index, instance.mods.includes(GameTags.NAMES) ? getName("bishop") : "Bishop", ["diagonal"]);
    case "n":
      return new Piece(color, fenId, index, instance.mods.includes(GameTags.NAMES) ? getName("knight") : "Knight", ["knight"]);
    case "r":
      return new Piece(color, fenId, index, instance.mods.includes(GameTags.NAMES) ? getName("rook") : "Rook", ["rook"]);
    case "q":
      return new Piece(color, fenId, index, instance.mods.includes(GameTags.NAMES) ? getName("queen") : "Queen", ["vertical", "horizontal", "diagonal"]);
    case "k":
      return new Piece(color, fenId, index, instance.mods.includes(GameTags.NAMES) ? getName("king") : "King", ["king"], false, false, 100);
    default:
      console.log("Unrecognized piece");
      return new Piece(color, fenId, index, instance.mods.includes(GameTags.NAMES) ? getName() : "");
  }
}

class Piece {
  constructor(color, fenId, startingIndex, name = fenId, moveTypes = [], hasShield = false, canPromote = false, loyalty = 10) {
    this.color = color;
    this.fenId = fenId;
    this.moveTypes = moveTypes;
    this.hasShield = hasShield;
    this.name = instance.mods.includes(GameTags.VAMPIRE) && instance.mods.includes(GameTags.NAMES) ? getName("vampire") : name;
    this.loyalty = loyalty;
    this.canPromote = canPromote;
    this.startingIndex = startingIndex;
  }

  getIndex(board) {
    for (let i = 0; i < board.length; i++) {
      for (let j = 0; j < board[i].length; j++) {
        if (board[i][j] === this) {
          return [i, j];
        }
      }
    }
    return null; // Object not found in the array
  }

  async endOfTurn(game, moves, defaultAction = false) {
    if (game.mods.includes(GameTags.LOYALTY)) {
      if (this.fenId.toLowerCase() === "k") {
        this.loyalty = 100;
      } else {
        this.loyalty += 1;
        moves.forEach((move) => {
          const index = algebraicToIndex(move.to);
          if (game.board[index[0]][index[1]] === this) {
            this.loyalty -= 2;
          }
        });
      }
      if (this.loyalty > 100) {
        this.loyalty = 100;
      }
      if (this.loyalty < 0) {
        this.loyalty = Math.abs(this.loyalty);
        this.color = this.color === "white" ? "black" : "white";
      }
    }

    var index = this.getIndex(game.board);
    if (this.canPromote && ((this.color === "white" && index[0] === 0) || (this.color === "black" && index[0] === 7))) {
      if (game.mods.includes(GameTags.QTE_PROMOTION)) {
        if (this.color !== game.playerColor) {
          var value = Math.random() * 51;
        } else {
          var value = defaultAction ? "q" : await gameplayUIManager().QTUI();
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
          game.board[index[0]][index[1]] = null;
        } else {
          game.board[index[0]][index[1]] = pieceFactory(this.color === "white" ? fen.toUpperCase() : fen.toLowerCase());
        }
      } else {
        if (this.color !== game.playerColor) {
          game.board[index[0]][index[1]] = pieceFactory(this.color === "white" ? "q".toUpperCase() : "q".toLowerCase());
        } else {
          var fen = defaultAction
            ? "q"
            : await gameplayUIManager().choiceUI([
                { label: "Queen", response: "q" },
                { label: "Rook", response: "r" },
                { label: "Bishop", response: "b" },
                { label: "Knight", response: "n" },
              ]);
          game.board[index[0]][index[1]] = pieceFactory(this.color === "white" ? fen.toUpperCase() : fen.toLowerCase());
        }
      }
    }
  }

  move(game, move) {
    //can be en passant
    if (
      !game.mods.includes(GameTags.NO_EN_PASSANT) &&
      this.moveTypes.includes("pawn") &&
      indexToAlgebraic(move.from) === indexToAlgebraic(this.startingIndex) &&
      Math.abs(move.to[0] - this.startingIndex[0]) === 2 &&
      move.from[1] == move.to[1]
    ) {
      game.enPassant = indexToAlgebraic([Math.min(move.from[0], move.to[0]) + 1, move.from[1]]);
      game.justDoubleMovedPawn = true;
    }

    //did an en passant
    if (
      !game.mods.includes(GameTags.NO_EN_PASSANT) &&
      this.moveTypes.includes("pawn") &&
      indexToAlgebraic(move.to) === game.enPassant &&
      Math.abs(move.from[0] - move.to[0]) === 1 &&
      Math.abs(move.from[1] - move.to[1]) === 1
    ) {
      game.board[move.from[0]][move.to[1]] = null;
      game.board[move.to[0]][move.to[1]] = this;
      return true;
    }

    if (this.moveTypes.includes("king")) {
      //Remove castling rights if king moves
      if (this.color === "white") {
        game.castling = game.castling.replace("K", "");
        game.castling = game.castling.replace("Q", "");
      }
      if (this.color === "black") {
        game.castling = game.castling.replace("k", "");
        game.castling = game.castling.replace("q", "");
      }

      //Castling
      const targetPiece = game.board[move.to[0]][move.to[1]];
      if (targetPiece && targetPiece.fenId.toUpperCase() === "R" && targetPiece.color === this.color) {
        //move king and rook to correct positions
        game.board[move.from[0]][move.from[1]] = null;
        game.board[move.to[0]][move.to[1]] = null;
        if (move.to[1] > move.from[1]) {
          game.board[move.to[0]][5] = targetPiece;
          game.board[move.to[0]][6] = this;
        } else {
          game.board[move.to[0]][3] = targetPiece;
          game.board[move.to[0]][2] = this;
        }
        return true;
      }
    }

    if (!game.isCopy && this.moveTypes.includes("rook") && move.from[1] == this.startingIndex[1]) {
      //get king index
      var kingIndex = null;
      for (let i = 0; i < game.board.length; i++) {
        for (let j = 0; j < game.board[i].length; j++) {
          if (game.board[i][j] && game.board[i][j].fenId.toUpperCase() === "K" && game.board[i][j].color === this.color) {
            kingIndex = [i, j];
          }
        }
      }

      //Remove castling rights if rook moves, using chess960 rules
      if (kingIndex != null && this.startingIndex[1] < kingIndex[1]) {
        game.castling = game.castling.replace(this.color === "white" ? "Q" : "q", "");
      } else {
        game.castling = game.castling.replace(this.color === "white" ? "K" : "k", "");
      }
    }
    return false;
  }

  info(game) {
    let details = "";
    details += game.mods.includes(GameTags.NAMES) ? `${this.name}\n` : `${this.color.charAt(0).toUpperCase() + this.color.slice(1)} ${this.name}\n`;
    details += "Abilities:\n";
    if (game.mods.includes(GameTags.VAMPIRE)) {
      details += "Move " + this.moveTypes + "\n";
    }
    if (game.mods.includes(GameTags.SHIELDS) && this.hasShield) {
      details += "Shielded\n";
    }
    if (game.mods.includes(GameTags.LOYALTY)) {
      details += `Loyalty:${this.loyalty}\n`;
    }
    return details;
  }
  fen() {
    return this.color === "white" ? this.fenId.toUpperCase() : this.fenId.toLowerCase();
  }
  isLegalMove(source, target, targetPiece, game) {
    let isMoveLegal = false;
    this.moveTypes.forEach((element) => {
      switch (element) {
        case "pawn":
          if (this.pawnMove(source, target, targetPiece, game)) {
            isMoveLegal = true;
          }
          break;
        case "knight":
          if (this.knightMove(source, target, targetPiece, game)) {
            isMoveLegal = true;
          }
          break;
        case "horizontal":
          if (this.horizontalMove(source, target, targetPiece, game)) {
            isMoveLegal = true;
          }
          break;
        case "vertical":
          if (this.verticalMove(source, target, targetPiece, game)) {
            isMoveLegal = true;
          }
          break;
        case "diagonal":
          if (this.diagonalMove(source, target, targetPiece, game)) {
            isMoveLegal = true;
          }
          break;
        case "king":
          if (this.kingMove(source, target, targetPiece, game)) {
            isMoveLegal = true;
          }
          break;
        case "rook":
          if (this.horizontalMove(source, target, targetPiece, game) || this.verticalMove(source, target, targetPiece, game)) {
            isMoveLegal = true;
          }
          break;
        default:
          console.log("Unknown move type");
          break;
      }
    });
    return isMoveLegal;
  }

  pawnMove(source, target, targetPiece, game) {
    if (!!targetPiece && this.color === targetPiece.color) {
      return false;
    }

    if (this.color === "white") {
      if (source[1] === target[1]) {
        if (source[0] - target[0] === 2 && source[0] === 6 && !targetPiece && !game.board[source[0] - 1][source[1]]) {
          // Pawn moves 2 spaces on its first move
          return true;
        } else if (source[0] - target[0] === 1 && !targetPiece) {
          // Pawn moves forward 1 space
          return true;
        }
      } else if (Math.abs(source[1] - target[1]) === 1 && source[0] - target[0] === 1 && (!!targetPiece || game.enPassant === indexToAlgebraic(target))) {
        // Pawn captures diagonally
        return true;
      } else if (
        game.mods.includes(GameTags.WRAP) &&
        source[0] - target[0] === 1 &&
        (!!targetPiece || game.enPassant === indexToAlgebraic(target)) &&
        ((source[1] === 0 && target[1] === game.board[source[0]].length - 1) || (source[1] === game.board[source[0]].length - 1 && target[1] === 0))
      ) {
        //Pawn captures diagonally over wrap
        return true;
      }
    } else {
      if (source[1] === target[1]) {
        if (source[0] - target[0] === -2 && source[0] === 1 && !targetPiece && !game.board[source[0] + 1][source[1]]) {
          // Pawn moves 2 spaces on its first move
          return true;
        } else if (source[0] - target[0] === -1 && !targetPiece) {
          // Pawn moves forward 1 space
          return true;
        }
      } else if (Math.abs(source[1] - target[1]) === 1 && source[0] - target[0] === -1 && (!!targetPiece || game.enPassant === indexToAlgebraic(target))) {
        // Pawn captures diagonally
        return true;
      } else if (
        game.mods.includes(GameTags.WRAP) &&
        source[0] - target[0] === -1 &&
        (!!targetPiece || game.enPassant === indexToAlgebraic(target)) &&
        ((source[1] === 0 && target[1] === game.board[source[0]].length - 1) || (source[1] === game.board[source[0]].length - 1 && target[1] === 0))
      ) {
        //Pawn captures diagonally over wrap
        return true;
      }
    }
    return false;
  }

  knightMove(source, target, targetPiece, game) {
    if (!!targetPiece && this.color === targetPiece.color) {
      return false;
    }

    if (
      (Math.abs(source[0] - target[0]) === 2 && Math.abs(source[1] - target[1]) === 1) ||
      (Math.abs(source[0] - target[0]) === 1 && Math.abs(source[1] - target[1]) === 2)
    ) {
      // Knight moves in L shape
      return true;
    }
    if (
      (game.mods.includes(GameTags.WRAP) && Math.abs(source[0] - target[0]) === 2 && Math.abs(source[1] - target[1]) === game.board[source[0]].length - 1) ||
      (game.mods.includes(GameTags.WRAP) && Math.abs(source[0] - target[0]) === 1 && Math.abs(source[1] - target[1]) === game.board[source[0]].length - 2)
    ) {
      return true;
    }
    return false;
  }

  horizontalMove(source, target, targetPiece, game) {
    if (!!targetPiece && this.color === targetPiece.color) {
      return false;
    }

    if (source[0] === target[0]) {
      const minRow = Math.min(source[1], target[1]);
      const maxRow = Math.max(source[1], target[1]);
      for (let i = minRow + 1; i < maxRow; i++) {
        if (game.board[source[0]][i]) {
          if (game.mods.includes(GameTags.WRAP)) {
            for (let o = maxRow + 1; o !== minRow; o++) {
              if (o >= game.board[source[0]].length) {
                o = 0;
                if (minRow === o) {
                  return true;
                }
              }
              if (game.board[source[0]][o]) {
                return false;
              }
            }
          } else {
            return false;
          }
        }
      }
      return true;
    }
    return false;
  }

  verticalMove(source, target, targetPiece, game) {
    if (!!targetPiece && this.color === targetPiece.color) {
      return false;
    }

    if (source[1] === target[1]) {
      // Rook moves vertically
      const minCol = Math.min(source[0], target[0]);
      const maxCol = Math.max(source[0], target[0]);
      for (let j = minCol + 1; j < maxCol; j++) {
        if (game.board[j][source[1]]) {
          return false;
        }
      }
      return true;
    }
    return false;
  }

  diagonalMove(source, target, targetPiece, game) {
    if (!!targetPiece && this.color === targetPiece.color) {
      return false;
    }

    if (Math.abs(source[0] - target[0]) === Math.abs(source[1] - target[1])) {
      // Bishop moves diagonally
      const startRow = source[1];
      const startCol = source[0];
      let colIncrement = 1;
      let rowIncrement = 1;

      if (source[0] > target[0]) {
        colIncrement = -1; // moving from bottom-right to top-left or vice versa
      }

      if (source[1] > target[1]) {
        rowIncrement = -1;
      }
      let canAccessNormal = true;
      for (
        let i = startRow + rowIncrement, j = startCol + colIncrement;
        (rowIncrement > 0 ? i < target[1] : i > target[1]) && (colIncrement > 0 ? j < target[0] : j > target[0]);
        i += rowIncrement, j += colIncrement
      ) {
        if (game.board[j][i]) {
          canAccessNormal = false;
        }
      }
      if (canAccessNormal) {
        return true;
      }
    }
    if (
      game.mods.includes(GameTags.WRAP) &&
      (Math.abs(source[0] - target[0] + 8) === Math.abs(source[1] - target[1]) ||
        Math.abs(source[0] - target[0]) === Math.abs(source[1] - target[1] + 8) ||
        Math.abs(source[0] - target[0] - 8) === Math.abs(source[1] - target[1]) ||
        Math.abs(source[0] - target[0]) === Math.abs(source[1] - target[1] - 8))
    ) {
      if (source[0] < target[0] && source[1] > target[1]) {
        //UR
        for (let x = source[0] + 1, y = source[1] + 1; x !== target[0] && y !== target[1]; x++, y++) {
          if (x >= game.board.length || x < 0) {
            return false;
          }
          if (y >= game.board[source[0]].length) {
            y = 0;
            if (x === target[0] && y === target[1]) {
              return true;
            }
          }
          if (game.board[x][y]) {
            return false;
          }
        }
        return true;
      } else if (source[0] < target[0] && source[1] < target[1]) {
        //UL
        for (let x = source[0] + 1, y = source[1] - 1; x !== target[0] && y !== target[1]; x++, y--) {
          if (x >= game.board.length || x < 0) {
            return false;
          }
          if (y < 0) {
            y = game.board[source[0]].length - 1;
            if (x === target[0] && y === target[1]) {
              return true;
            }
          }
          if (game.board[x][y]) {
            return false;
          }
        }
        return true;
      } else if (source[0] > target[0] && source[1] < target[1]) {
        //DL
        for (let x = source[0] - 1, y = source[1] - 1; x !== target[0] && y !== target[1]; x--, y--) {
          if (x >= game.board.length || x < 0) {
            return false;
          }
          if (y < 0) {
            y = game.board[source[0]].length - 1;
            if (x === target[0] && y === target[1]) {
              return true;
            }
          }
          if (game.board[x][y]) {
            return false;
          }
        }
        return true;
      } else if (source[0] > target[0] && source[1] > target[1]) {
        //DR
        for (let x = source[0] - 1, y = source[1] + 1; x !== target[0] && y !== target[1]; x--, y++) {
          if (x >= game.board.length || x < 0) {
            return false;
          }
          if (y >= game.board[source[0]].length) {
            y = 0;
            if (x === target[0] && y === target[1]) {
              return true;
            }
          }
          if (game.board[x][y]) {
            return false;
          }
        }
        return true;
      }
      return false;
    }
    return false;
  }

  kingMove(source, target, targetPiece, game) {
    if (Math.abs(source[0] - target[0]) <= 1 && Math.abs(source[1] - target[1]) <= 1) {
      if (!!targetPiece && this.color === targetPiece.color) {
        return false;
      }
      // King moves 1 space in any direction
      return true;
    } else if (
      !game.mods.includes(GameTags.NO_CASTLING) &&
      targetPiece &&
      targetPiece.fenId &&
      targetPiece.fenId.toUpperCase() === "R" &&
      targetPiece.color === this.color &&
      game.castling.includes(source[1] < target[1] ? (this.color === "white" ? "K" : "k") : this.color === "white" ? "Q" : "q")
    ) {
      //Check if there is an obstruction between the king and rook and the end spaces
      const kingEndCol = source[1] < target[1] ? 6 : 2;
      const rookEndCol = source[1] < target[1] ? 5 : 3;
      const minCol = Math.min(source[1], target[1], kingEndCol, rookEndCol);
      const maxCol = Math.max(source[1], target[1], kingEndCol, rookEndCol);
      for (let j = minCol; j <= maxCol; j++) {
        if (game.board[source[0]][j] && game.board[source[0]][j] !== this && game.board[source[0]][j] !== targetPiece) {
          return false;
        }
      }
      // Check if there is a check between the king start and end spaces
      const minCol2 = Math.min(source[1], kingEndCol);
      const maxCol2 = Math.max(source[1], kingEndCol);
      for (let j = minCol2; j <= maxCol2; j++) {
        if (game.isCheck(this.color, [source[0], j], game.board)) {
          return false;
        }
      }

      // King castles
      return true;
    } else if (game.mods.includes(GameTags.WRAP)) {
      if (!!targetPiece && this.color === targetPiece.color) {
        return false;
      }
      if (
        (Math.abs(source[0] - target[0]) <= 1 && source[1] === 0 && target[1] === game.board[target[0]].length - 1) ||
        (source[1] === game.board[source[1]].length - 1 && target[1] === 0)
      ) {
        // King moves 1 space in any direction over wrap
        return true;
      }
    }
    return false;
  }
}

function algebraicToIndex(algebraic) {
  return [8 - algebraic.charAt(1), algebraic.charCodeAt(0) - 97];
}

function indexToAlgebraic(index) {
  return String.fromCharCode(index[1] + 97) + Math.abs(index[0] - 8);
}

class Chess {
  constructor() {
    this.initialized = false;
  }

  undo() {
    if (this.history.length > 0) {
      const move = this.history.pop();
      this.board = move.board.map(function (innerArr) {
        return innerArr.map(function (p) {
          if (!p) {
            return null;
          }
          return new Piece(p.color, p.fenId, p.startingIndex, p.name, p.moveTypes, p.hasShield, p.canPromote, p.loyalty);
        });
      });
      this.turn = move.turn;
      this.castling = move.castling;
      this.enPassant = move.enPassant;
      this.winner = null;
      return true;
    }
    return false;
  }

  copy() {
    const copy = new Chess();
    copy.board = this.board.map(function (innerArr) {
      return innerArr.map(function (p) {
        if (!p) {
          return null;
        }
        return new Piece(p.color, p.fenId, p.startingIndex, p.name, p.moveTypes, p.hasShield, p.canPromote, p.loyalty);
      });
    });
    copy.turn = this.turn;
    copy.castling = this.castling;
    copy.enPassant = this.enPassant;
    copy.winner = this.winner;
    copy.initialized = this.initialized;
    copy.history = this.history;
    copy.mods = this.mods;
    copy.playerColor = this.playerColor;
    copy.isCopy = true;
    return copy;
  }

  init(mods, color = "white") {
    this.board = [];
    this.history = [];
    this.mods = mods;
    var fen = this.getInitialFen();
    const rows = fen.split(" ")[0].split("/");
    this.turn = fen.split(" ")[1];
    this.castling = fen.split(" ")[2];
    this.enPassant = fen.split(" ")[3];
    this.playerColor = color;
    this.winner = null;
    this.initialized = true;
    this.isCopy = false;

    for (let i = 0; i < rows.length; i++) {
      const row = [];
      let col = 0;

      for (let j = 0; j < rows[i].length; j++) {
        const char = rows[i][j];

        if (isNaN(char)) {
          row.push(pieceFactory(char, [i, j]));
        } else {
          for (let o = 0; o < parseInt(char); o++) {
            row.push(null);
          }
        }
      }

      while (row.length < 8) {
        row.push(null);
      }

      this.board.push(row);
    }
  }

  getInitialFen() {
    if (this.mods.includes(GameTags.RANDOM_START)) {
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

      return `${possitionsArr.join("")}/pppppppp/8/8/8/8/PPPPPPPP/${possitionsArr.join("").toUpperCase()} w KQkq - 0 1`;
    } else {
      return "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
    }
  }

  getPieceInfo(square) {
    const index = algebraicToIndex(square);
    const piece = this.board[index[0]][index[1]];
    if (piece) {
      if (this.mods.includes(GameTags.FOG)) {
        let sight = this.moves(this.playerColor).map((move) => {
          return algebraicToIndex(move.to).toString();
        });
        if (sight.includes(index?.toString()) || piece.color === this.playerColor) {
          return piece.info(this);
        }
        return null;
      }
      return piece.info(this);
    }
    return null;
  }

  getGameInfo() {
    if (this.winner === null) {
      return `Current turn: ${this.turn === "w" ? "white" : "black"}\nMods\n${this.mods.join("\n")}`;
    } else {
      return `The winner is ${this.winner}`;
    }
  }

  getGameWinner() {
    if (this.mods.includes(GameTags.ELIMINATION)) {
      var hasValidMove = false;
      var whiteHasPieces = false;
      var blackHasPieces = false;
      for (let i = 0; i < this.board.length; i++) {
        for (let j = 0; j < this.board[i].length; j++) {
          const piece = this.board[i][j];
          if (piece !== null) {
            if (piece.color.charAt(0) === this.turn && this.moves(indexToAlgebraic([i, j])).length > 0) {
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
        return "draw";
      }
      if (!whiteHasPieces) {
        return "black";
      }
      if (!blackHasPieces) {
        return "white";
      }
      return null;
    }

    var winner = null;
    var hasValidMove = false;
    for (let i = 0; i < this.board.length; i++) {
      for (let j = 0; j < this.board[i].length; j++) {
        const piece = this.board[i][j];
        if (piece !== null && piece.color.charAt(0) === this.turn) {
          this.moves(indexToAlgebraic([i, j])).forEach((move) => {
            var to = algebraicToIndex(move.to);
            var target = this.board[to[0]][to[1]];
            hasValidMove = true;
            if (target !== null && target.color !== piece.color && target.fenId.toLowerCase() === "k") {
              winner = piece.color;
            }
          });
        }
      }
    }

    if (!hasValidMove) {
      return this.turn === "w" ? "black" : "white";
    }

    return winner;
  }

  moves(from, playerVisable = false) {
    let moves = [];

    if (from?.length === 2) {
      let sight = this.moves(this.playerColor).map((move) => {
        return algebraicToIndex(move.to).toString();
      });
      const index = algebraicToIndex(from);
      const piece = this.board[index[0]][index[1]];
      if (!playerVisable || !this.mods.includes(GameTags.FOG) || sight.includes(index?.toString()) || piece?.color === this.playerColor) {
        for (let x = 0; x < this.board.length; x++) {
          for (let y = 0; y < this.board[x].length; y++) {
            if (this.isLegalMove(from, indexToAlgebraic([x, y]))) {
              moves.push({
                from: from,
                to: indexToAlgebraic([x, y]),
              });
            }
          }
        }
        return moves;
      }
    }

    for (let i = 0; i < this.board.length; i++) {
      for (let j = 0; j < this.board[i].length; j++) {
        const piece = this.board[i][j];
        if (!!piece && (from === "" || !from || from === piece.color)) {
          for (let x = 0; x < this.board.length; x++) {
            for (let y = 0; y < this.board[x].length; y++) {
              if (this.isLegalMove(indexToAlgebraic([i, j]), indexToAlgebraic([x, y]))) {
                moves.push({
                  from: indexToAlgebraic([i, j]),
                  to: indexToAlgebraic([x, y]),
                });
              }
            }
          }
        }
      }
    }
    return moves;
  }

  isCheck(color, kingIndex, board) {
    var enemyColor = color === "white" ? "black" : "white";

    //Check if any enemy pieces can attack the king
    for (let i = 0; i < board.length; i++) {
      for (let j = 0; j < board[i].length; j++) {
        const piece = board[i][j];
        if (piece !== null && piece.color === enemyColor) {
          if (piece.isLegalMove([i, j], kingIndex, board, this)) {
            return true;
          }
        }
      }
    }

    return false;
  }

  isInCheck(color) {
    var king = null;
    var kingIndex = null;

    var enemyColor = color === "white" ? "black" : "white";

    //Find the king
    for (let i = 0; i < this.board.length; i++) {
      for (let j = 0; j < this.board[i].length; j++) {
        if (this.board[i][j] !== null && this.board[i][j].color === color && this.board[i][j].fenId.toLowerCase() === "k") {
          king = this.board[i][j];
          kingIndex = [i, j];
          break;
        }
      }
    }

    if (king.hasShield) {
      return false;
    }

    if (kingIndex === null) {
      console.log("No king found");
      return false;
    }

    //Check if any enemy pieces can attack the king
    for (let i = 0; i < this.board.length; i++) {
      for (let j = 0; j < this.board[i].length; j++) {
        const piece = this.board[i][j];
        if (piece !== null && piece.color === enemyColor) {
          if (piece.isLegalMove([i, j], kingIndex, this.board, this)) {
            return true;
          }
        }
      }
    }

    return false;
  }

  //Creates a copy of the entire game and simulates the move on the copy
  simulateMove(from, to) {
    const copy = this.copy();
    const source = algebraicToIndex(from);
    const target = algebraicToIndex(to);
    const piece = copy.board[source[0]][source[1]];
    const targetPiece = copy.board[target[0]][target[1]];

    piece.move(copy, { from: source, to: target });

    if (copy.mods.includes(GameTags.SHIELDS) && targetPiece?.hasShield) {
      targetPiece.hasShield = false;
      copy.endTurn(true);
      return copy;
    }

    if (copy.mods.includes(GameTags.VAMPIRE) && targetPiece) {
      targetPiece.moveTypes.forEach((value) => {
        if (!piece.moveTypes.includes(value)) {
          piece.moveTypes.push(value);
        }
      });
    }

    copy.board[source[0]][source[1]] = null;
    copy.board[target[0]][target[1]] = piece;
    copy.endTurn(true);

    return copy;
  }

  isLegalMove(from, to) {
    const source = algebraicToIndex(from);
    const target = algebraicToIndex(to);
    const piece = this.board[source[0]][source[1]];
    const targetPiece = this.board[target[0]][target[1]];

    if (!piece) {
      return false;
    }

    if (!piece.isLegalMove(source, target, targetPiece, this)) {
      return false;
    }

    //Ensure move doesn't put or keep the player in check
    if (!this.isCopy && !this.mods.includes(GameTags.ELIMINATION)) {
      const simulatedGame = this.simulateMove(from, to);
      if (simulatedGame.isInCheck(piece.color)) {
        return false;
      }
    }

    return true;
  }

  game_over() {
    return this.winner !== null;
  }

  async endTurn(simulatedMove = false) {
    this.turn = this.turn === "w" ? "b" : "w";

    if (!simulatedMove) this.winner = this.getGameWinner();
    if (this.winner !== null) {
      return;
    }

    const moves = this.moves();
    for (let x = 0; x < this.board.length; x++) {
      for (let y = 0; y < this.board[x].length; y++) {
        await this.board[x][y]?.endOfTurn(this, moves, simulatedMove);
      }
    }

    if (this.mods.includes(GameTags.ELIMINATION)) {
      var hasValidMove = false;
      for (let i = 0; i < this.board.length; i++) {
        for (let j = 0; j < this.board[i].length; j++) {
          const piece = this.board[i][j];
          if (piece !== null) {
            if (piece.color.charAt(0) === this.turn && this.moves(indexToAlgebraic([i, j])).length > 0) {
              hasValidMove = true;
            }
          }
        }
      }
      if (!hasValidMove) {
        this.turn = this.turn === "w" ? "b" : "w";
      }
    }

    if (this.enPassant !== "-" && !this.justDoubleMovedPawn) {
      this.enPassant = "-";
    }
    this.justDoubleMovedPawn = false;
  }

  fog() {
    if (this.mods.includes(GameTags.FOG)) {
      let sight = this.moves(this.playerColor).map((move) => {
        return algebraicToIndex(move.to).toString();
      });

      let fogArr = [];

      for (let i = 0; i < this.board.length; i++) {
        for (let j = 0; j < this.board[i].length; j++) {
          if (!sight.includes(`${i},${j}`) && !(this.board[i][j] != null && this.board[i][j].color == this.playerColor)) {
            fogArr.push(indexToAlgebraic([i, j]));
          }
        }
      }
      return fogArr;
    }

    return [];
  }

  fenFow() {
    let fen = "";
    let emptySquares = 0;
    let sight = this.moves(this.playerColor).map((move) => {
      return algebraicToIndex(move.to).toString();
    });

    for (let i = 0; i < this.board.length; i++) {
      if (i !== 0) {
        fen += "/";
      }

      for (let j = 0; j < this.board[i].length; j++) {
        const piece = this.board[i][j];

        if (piece && (piece.color === this.playerColor || sight.includes([i, j].toString()))) {
          if (emptySquares) {
            fen += emptySquares;
            emptySquares = 0;
          }

          fen += piece.fen();
        } else {
          emptySquares++;
        }
      }

      if (emptySquares) {
        fen += emptySquares;
        emptySquares = 0;
      }
    }

    fen += ` ${this.turn} ${this.castling} ${this.enPassant} 0 1`;

    return fen;
  }

  fen() {
    if (this.mods.includes(GameTags.FOG) && !this.game_over()) {
      return this.fenFow();
    }
    let fen = "";
    let emptySquares = 0;

    for (let i = 0; i < this.board.length; i++) {
      if (i !== 0) {
        fen += "/";
      }

      for (let j = 0; j < this.board[i].length; j++) {
        const piece = this.board[i][j];

        if (piece) {
          if (emptySquares) {
            fen += emptySquares;
            emptySquares = 0;
          }

          fen += piece.fen();
        } else {
          emptySquares++;
        }
      }

      if (emptySquares) {
        fen += emptySquares;
        emptySquares = 0;
      }
    }

    fen += ` ${this.turn} ${this.castling} ${this.enPassant} 0 1`;

    return fen;
  }

  async move(move) {
    const isLegal = this.isLegalMove(move.sourceSquare, move.targetSquare);

    if (isLegal) {
      const gamestate = JSON.parse(JSON.stringify(this));
      delete gamestate.history;
      this.history.push(gamestate);

      const source = [8 - move.sourceSquare.charAt(1), move.sourceSquare.charCodeAt(0) - 97];
      const target = [8 - move.targetSquare.charAt(1), move.targetSquare.charCodeAt(0) - 97];
      const targetPiece = this.board[target[0]][target[1]];
      const piece = this.board[source[0]][source[1]];

      const moveHandled = piece.move(this, { from: source, to: target });

      if (this.mods.includes(GameTags.SHIELDS) && targetPiece?.hasShield) {
        targetPiece.hasShield = false;
        await this.endTurn();
        return true;
      }

      if (this.mods.includes(GameTags.VAMPIRE) && targetPiece) {
        targetPiece.moveTypes.forEach((value) => {
          if (!piece.moveTypes.includes(value)) {
            piece.moveTypes.push(value);
          }
        });
      }

      if (!moveHandled) {
        this.board[source[0]][source[1]] = null;
        this.board[target[0]][target[1]] = piece;
      }
      await this.endTurn();
    }
    return isLegal;
  }
}

let instance = null;

function getChess() {
  if (!instance) {
    instance = new Chess();
  }
  return instance;
}

export default getChess;
export { GameTags, Piece };
