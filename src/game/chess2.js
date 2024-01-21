import gameplayUIManager from "./gameplayUI";
import GridPosition from "../models/gridPosition";
import { Mods } from "../managers/mods";
import getName from "../mods/PieceNames";

function pieceFactory(fenId, index) {
  const color = fenId >= "A" && fenId <= "Z" ? "white" : "black";
  switch (fenId.toLowerCase()) {
    case "p":
      return new Piece(color, fenId, index, instance.mods.includes("NAMES") ? getName("pawn") : "Pawn", ["pawn"], true, false, true);
    case "b":
      return new Piece(color, fenId, index, instance.mods.includes("NAMES") ? getName("bishop") : "Bishop", ["diagonal"]);
    case "n":
      return new Piece(color, fenId, index, instance.mods.includes("NAMES") ? getName("knight") : "Knight", ["knight"], false, true);
    case "r":
      return new Piece(color, fenId, index, instance.mods.includes("NAMES") ? getName("rook") : "Rook", ["rook"]);
    case "q":
      return new Piece(color, fenId, index, instance.mods.includes("NAMES") ? getName("queen") : "Queen", ["vertical", "horizontal", "diagonal"], false, true);
    case "k":
      return new Piece(color, fenId, index, instance.mods.includes("NAMES") ? getName("king") : "King", ["king"], false, true, false, 100);
    default:
      console.log("Unrecognized piece");
      return new Piece(color, fenId, index, instance.mods.includes("NAMES") ? getName() : "");
  }
}

class Piece {
  constructor(color, fenId, startingIndex, name = fenId, moveTypes = [], hasShield = false, isVampire = false, canPromote = false, loyalty = 10) {
    this.color = color;
    this.fenId = fenId;
    this.moveTypes = moveTypes;
    this.hasShield = hasShield;
    this.isVampire = isVampire;
    this.name = isVampire && instance.mods.includes("NAMES") ? getName("vampire") : name;
    this.loyalty = loyalty;
    this.canPromote = canPromote;
    this.startingIndex = startingIndex;
  }

  getIndex(board) {
    for (let i = 0; i < board.length; i++) {
      for (let j = 0; j < board[i].length; j++) {
        if (board[i][j] === this) {
          return new GridPosition(i, j);
        }
      }
    }
    return null; // Object not found in the array
  }

  async endOfTurn(game, moves, defaultAction = false) {
    if (game.mods.includes("LOYALTY")) {
      if (this.fenId.toLowerCase() === "k") {
        this.loyalty = 100;
      } else {
        this.loyalty += 1;
        moves.forEach((move) => {
          if (game.board[move.to.row][move.to.col] === this) {
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
    if (this.canPromote && ((this.color === "white" && index.row === 0) || (this.color === "black" && index.row === 7))) {
      if (game.mods.includes("QTE_PROMOTION")) {
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
          game.board[index.row][index.col] = null;
        } else {
          game.board[index.row][index.col] = pieceFactory(this.color === "white" ? fen.toUpperCase() : fen.toLowerCase());
        }
      } else {
        if (this.color !== game.playerColor) {
          game.board[index.row][index.col] = pieceFactory(this.color === "white" ? "q".toUpperCase() : "q".toLowerCase());
        } else {
          var fen = defaultAction
            ? "q"
            : await gameplayUIManager().choiceUI([
                { label: "Queen", response: "q" },
                { label: "Rook", response: "r" },
                { label: "Bishop", response: "b" },
                { label: "Knight", response: "n" },
              ]);
          game.board[index.row][index.col] = pieceFactory(this.color === "white" ? fen.toUpperCase() : fen.toLowerCase());
        }
      }
    }
  }

  move(game, move) {
    //can be en passant
    if (
      !game.mods.includes("NO_EN_PASSANT") &&
      this.moveTypes.includes("pawn") &&
      move.from.equals(this.startingIndex) &&
      Math.abs(move.to.row - this.startingIndex.row) === 2 &&
      move.from.col == move.to.col
    ) {
      game.enPassant = new GridPosition(Math.min(move.from.row, move.to.row) + 1, move.from.col);
      game.justDoubleMovedPawn = true;
    }

    //did an en passant
    if (
      !game.mods.includes("NO_EN_PASSANT") &&
      this.moveTypes.includes("pawn") &&
      move.to.equals(game.enPassant) &&
      Math.abs(move.from.row - move.to.row) === 1 &&
      Math.abs(move.from.col - move.to.col) === 1
    ) {
      game.board[move.from.row][move.to.col] = null;
      game.board[move.to.row][move.to.col] = this;
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
      const targetPiece = game.board[move.to.row][move.to.col];
      if (targetPiece && targetPiece.fenId.toUpperCase() === "R" && targetPiece.color === this.color) {
        //move king and rook to correct positions
        game.board[move.from.row][move.from.col] = null;
        game.board[move.to.row][move.to.col] = null;
        if (move.to.col > move.from.col) {
          game.board[move.to.row][5] = targetPiece;
          game.board[move.to.row][6] = this;
        } else {
          game.board[move.to.row][3] = targetPiece;
          game.board[move.to.row][2] = this;
        }
        return true;
      }
    }

    if (!game.isCopy && this.moveTypes.includes("rook") && move.from.col == this.startingIndex.col) {
      //get king index
      var kingIndex = null;
      for (let i = 0; i < game.board.length; i++) {
        for (let j = 0; j < game.board[i].length; j++) {
          if (game.board[i][j] && game.board[i][j].fenId.toUpperCase() === "K" && game.board[i][j].color === this.color) {
            kingIndex = new GridPosition(i, j);
          }
        }
      }

      //Remove castling rights if rook moves, using chess960 rules
      if (kingIndex != null && this.startingIndex.col < kingIndex.col) {
        game.castling = game.castling.replace(this.color === "white" ? "Q" : "q", "");
      } else {
        game.castling = game.castling.replace(this.color === "white" ? "K" : "k", "");
      }
    }
    return false;
  }

  info(game) {
    let details = "";
    details += game.mods.includes("NAMES") ? `${this.name}\n` : `${this.color.charAt(0).toUpperCase() + this.color.slice(1)} ${this.name}\n`;
    details += "Abilities:\n";
    if (this.isVampire) {
      details += "Move " + this.moveTypes + "\n";
    }
    if (game.mods.includes("SHIELDS") && this.hasShield) {
      details += "Shielded\n";
    }
    if (game.mods.includes("LOYALTY")) {
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
      if (source.col === target.col) {
        if (source.row - target.row === 2 && source.row === 6 && !targetPiece && !game.board[source.row - 1][source.col]) {
          // Pawn moves 2 spaces on its first move
          return true;
        } else if (source.row - target.row === 1 && !targetPiece) {
          // Pawn moves forward 1 space
          return true;
        }
      } else if (Math.abs(source.col - target.col) === 1 && source.row - target.row === 1 && (!!targetPiece || game.enPassant.equals(target))) {
        // Pawn captures diagonally
        return true;
      } else if (
        game.mods.includes("WRAP") &&
        source.row - target.row === 1 &&
        (!!targetPiece || game.enPassant.equals(target)) &&
        ((source.col === 0 && target.col === game.board[source.row].length - 1) || (source.col === game.board[source.row].length - 1 && target.col === 0))
      ) {
        //Pawn captures diagonally over wrap
        return true;
      }
    } else {
      if (source.col === target.col) {
        if (source.row - target.row === -2 && source.row === 1 && !targetPiece && !game.board[source.row + 1][source.col]) {
          // Pawn moves 2 spaces on its first move
          return true;
        } else if (source.row - target.row === -1 && !targetPiece) {
          // Pawn moves forward 1 space
          return true;
        }
      } else if (Math.abs(source.col - target.col) === 1 && source.row - target.row === -1 && (!!targetPiece || game.enPassant.equals(target))) {
        // Pawn captures diagonally
        return true;
      } else if (
        game.mods.includes("WRAP") &&
        source.row - target.row === -1 &&
        (!!targetPiece || game.enPassant.equals(target)) &&
        ((source.col === 0 && target.col === game.board[source.row].length - 1) || (source.col === game.board[source.row].length - 1 && target.col === 0))
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
      (Math.abs(source.row - target.row) === 2 && Math.abs(source.col - target.col) === 1) ||
      (Math.abs(source.row - target.row) === 1 && Math.abs(source.col - target.col) === 2)
    ) {
      // Knight moves in L shape
      return true;
    }
    if (
      (game.mods.includes("WRAP") && Math.abs(source.row - target.row) === 2 && Math.abs(source.col - target.col) === game.board[source.row].length - 1) ||
      (game.mods.includes("WRAP") && Math.abs(source.row - target.row) === 1 && Math.abs(source.col - target.col) === game.board[source.row].length - 2)
    ) {
      return true;
    }
    return false;
  }

  horizontalMove(source, target, targetPiece, game) {
    if (!!targetPiece && this.color === targetPiece.color) {
      return false;
    }

    if (source.row === target.row) {
      const minRow = Math.min(source.col, target.col);
      const maxRow = Math.max(source.col, target.col);
      for (let i = minRow + 1; i < maxRow; i++) {
        if (game.board[source.row][i]) {
          if (game.mods.includes("WRAP")) {
            for (let o = maxRow + 1; o !== minRow; o++) {
              if (o >= game.board[source.row].length) {
                o = 0;
                if (minRow === o) {
                  return true;
                }
              }
              if (game.board[source.row][o]) {
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

    if (source.col === target.col) {
      // Rook moves vertically
      const minCol = Math.min(source.row, target.row);
      const maxCol = Math.max(source.row, target.row);
      for (let j = minCol + 1; j < maxCol; j++) {
        if (game.board[j][source.col]) {
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

    if (Math.abs(source.row - target.row) === Math.abs(source.col - target.col)) {
      // Bishop moves diagonally
      const startRow = source.col;
      const startCol = source.row;
      let colIncrement = 1;
      let rowIncrement = 1;

      if (source.row > target.row) {
        colIncrement = -1; // moving from bottom-right to top-left or vice versa
      }

      if (source.col > target.col) {
        rowIncrement = -1;
      }
      let canAccessNormal = true;
      for (
        let i = startRow + rowIncrement, j = startCol + colIncrement;
        (rowIncrement > 0 ? i < target.col : i > target.col) && (colIncrement > 0 ? j < target.row : j > target.row);
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
      game.mods.includes("WRAP") &&
      (Math.abs(source.row - target.row + 8) === Math.abs(source.col - target.col) ||
        Math.abs(source.row - target.row) === Math.abs(source.col - target.col + 8) ||
        Math.abs(source.row - target.row - 8) === Math.abs(source.col - target.col) ||
        Math.abs(source.row - target.row) === Math.abs(source.col - target.col - 8))
    ) {
      if (source.row < target.row && source.col > target.col) {
        //UR
        for (let x = source.row + 1, y = source.col + 1; x !== target.row && y !== target.col; x++, y++) {
          if (x >= game.board.length || x < 0) {
            return false;
          }
          if (y >= game.board[source.row].length) {
            y = 0;
            if (x === target.row && y === target.col) {
              return true;
            }
          }
          if (game.board[x][y]) {
            return false;
          }
        }
        return true;
      } else if (source.row < target.row && source.col < target.col) {
        //UL
        for (let x = source.row + 1, y = source.col - 1; x !== target.row && y !== target.col; x++, y--) {
          if (x >= game.board.length || x < 0) {
            return false;
          }
          if (y < 0) {
            y = game.board[source.row].length - 1;
            if (x === target.row && y === target.col) {
              return true;
            }
          }
          if (game.board[x][y]) {
            return false;
          }
        }
        return true;
      } else if (source.row > target.row && source.col < target.col) {
        //DL
        for (let x = source.row - 1, y = source.col - 1; x !== target.row && y !== target.col; x--, y--) {
          if (x >= game.board.length || x < 0) {
            return false;
          }
          if (y < 0) {
            y = game.board[source.row].length - 1;
            if (x === target.row && y === target.col) {
              return true;
            }
          }
          if (game.board[x][y]) {
            return false;
          }
        }
        return true;
      } else if (source.row > target.row && source.col > target.col) {
        //DR
        for (let x = source.row - 1, y = source.col + 1; x !== target.row && y !== target.col; x--, y++) {
          if (x >= game.board.length || x < 0) {
            return false;
          }
          if (y >= game.board[source.row].length) {
            y = 0;
            if (x === target.row && y === target.col) {
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
    if (Math.abs(source.row - target.row) <= 1 && Math.abs(source.col - target.col) <= 1) {
      if (!!targetPiece && this.color === targetPiece.color) {
        return false;
      }
      // King moves 1 space in any direction
      return true;
    } else if (
      !game.mods.includes("NO_CASTLING") &&
      targetPiece &&
      targetPiece.fenId &&
      targetPiece.fenId.toUpperCase() === "R" &&
      targetPiece.color === this.color &&
      game.castling.includes(source.col < target.col ? (this.color === "white" ? "K" : "k") : this.color === "white" ? "Q" : "q")
    ) {
      //Check if there is an obstruction between the king and rook and the end spaces
      const kingEndCol = source.col < target.col ? 6 : 2;
      const rookEndCol = source.col < target.col ? 5 : 3;
      const minCol = Math.min(source.col, target.col, kingEndCol, rookEndCol);
      const maxCol = Math.max(source.col, target.col, kingEndCol, rookEndCol);
      for (let j = minCol; j <= maxCol; j++) {
        if (game.board[source.row][j] && game.board[source.row][j] !== this && game.board[source.row][j] !== targetPiece) {
          return false;
        }
      }
      // Check if there is a check between the king start and end spaces
      const minCol2 = Math.min(source.col, kingEndCol);
      const maxCol2 = Math.max(source.col, kingEndCol);
      for (let j = minCol2; j <= maxCol2; j++) {
        if (game.isCheck(this.color, [source.row, j], game.board)) {
          return false;
        }
      }

      // King castles
      return true;
    } else if (game.mods.includes("WRAP")) {
      if (!!targetPiece && this.color === targetPiece.color) {
        return false;
      }
      if (
        (Math.abs(source.row - target.row) <= 1 && source.col === 0 && target.col === game.board[target.row].length - 1) ||
        (source.col === game.board[source.col].length - 1 && target.col === 0)
      ) {
        // King moves 1 space in any direction over wrap
        return true;
      }
    }
    return false;
  }
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
          return new Piece(p.color, p.fenId, p.startingIndex, p.name, p.moveTypes, p.hasShield, p.isVampire, p.canPromote, p.loyalty);
        });
      });
      this.turn = move.turn;
      this.castling = move.castling;
      this.enPassant = new GridPosition(move.enPassant.row, move.enPassant.col);
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
        //deep copy move types
        var moveTypes = [];
        p.moveTypes.forEach((element) => {
          moveTypes.push(element);
        });
        return new Piece(p.color, p.fenId, p.startingIndex, p.name, moveTypes, p.hasShield, p.isVampire, p.canPromote, p.loyalty);
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
    this.enPassant = new GridPosition(-1, -1);
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
          row.push(pieceFactory(char, new GridPosition(i, j)));
        } else {
          for (let o = 0; o < parseInt(char); o++) {
            row.push(null);
          }
        }
      }

      // while (row.length < 8) {
      //   row.push(null);
      // }

      this.board.push(row);
    }
  }

  getInitialFen() {
    if (this.mods.includes("RANDOM_START")) {
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
    const piece = this.board[square.row][square.col];
    if (piece) {
      if (this.mods.includes("FOG")) {
        let sight = this.getPlayerSight(this.playerColor);
        if (square.isIn(sight) || piece.color === this.playerColor) {
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
    if (this.mods.includes("ELIMINATION")) {
      var hasValidMove = false;
      var whiteHasPieces = false;
      var blackHasPieces = false;
      for (let i = 0; i < this.board.length; i++) {
        for (let j = 0; j < this.board[i].length; j++) {
          const piece = this.board[i][j];
          if (piece !== null) {
            if (piece.color.charAt(0) === this.turn && this.moves(new GridPosition(i, j)).length > 0) {
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
          this.moves(new GridPosition(i, j)).forEach((move) => {
            var target = this.board[move.to.row][move.to.col];
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

  playerMoves(color, playerVisable = false) {
    let moves = [];

    for (let i = 0; i < this.board.length; i++) {
      for (let j = 0; j < this.board[i].length; j++) {
        const piece = this.board[i][j];
        if (!!piece && (color === "" || !color || color === piece.color)) {
          for (let x = 0; x < this.board.length; x++) {
            for (let y = 0; y < this.board[x].length; y++) {
              if (this.isLegalMove(new GridPosition(i, j), new GridPosition(x, y))) {
                moves.push({
                  from: new GridPosition(i, j),
                  to: new GridPosition(x, y),
                });
              }
            }
          }
        }
      }
    }
    return moves;
  }

  getPlayerSight(color) {
    let sight = [];
    this.playerMoves(color).forEach((move) => {
      sight.push(move.to);
    });
    //Add all pawn forward diagonals to sight
    for (let i = 0; i < this.board.length; i++) {
      for (let j = 0; j < this.board[i].length; j++) {
        const piece = this.board[i][j];
        if (!!piece && piece.moveTypes.includes("pawn") && piece.color === this.playerColor) {
          if (piece.color === "white") {
            if (j > 0) {
              sight.push(new GridPosition(i - 1, j - 1));
            }
            if (j < this.board[i].length - 1) {
              sight.push(new GridPosition(i - 1, j + 1));
            }
          } else {
            if (j > 0) {
              sight.push(new GridPosition(i + 1, j - 1));
            }
            if (j < this.board[i].length - 1) {
              sight.push(new GridPosition(i + 1, j + 1));
            }
          }
        }
      }
    }
    return sight;
  }

  moves(from, playerVisable = false) {
    let moves = [];

    let sight = this.getPlayerSight(this.playerColor);

    const piece = this.board[from.row][from.col];
    if (!playerVisable || !this.mods.includes("FOG") || from.isIn(sight) || piece?.color === this.playerColor) {
      for (let x = 0; x < this.board.length; x++) {
        for (let y = 0; y < this.board[x].length; y++) {
          if (this.isLegalMove(from, new GridPosition(x, y))) {
            moves.push({
              from: from,
              to: new GridPosition(x, y),
            });
          }
        }
      }
      return moves;
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
          if (piece.isLegalMove(new GridPosition(i, j), kingIndex, board, this)) {
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
          kingIndex = new GridPosition(i, j);
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
          if (piece.isLegalMove(new GridPosition(i, j), kingIndex, this.board, this)) {
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
    const source = from;
    const target = to;
    const piece = copy.board[source.row][source.col];
    const targetPiece = copy.board[target.row][target.col];

    piece.move(copy, { from: source, to: target });

    if (copy.mods.includes("SHIELDS") && targetPiece?.hasShield) {
      targetPiece.hasShield = false;
      copy.endTurn(true);
      return copy;
    }

    if (copy.mods.includes("VAMPIRE") && piece.isVampire && targetPiece) {
      targetPiece.moveTypes.forEach((value) => {
        if (!piece.moveTypes.includes(value)) {
          piece.moveTypes.push(value);
        }
      });
    }

    copy.board[source.row][source.col] = null;
    copy.board[target.row][target.col] = piece;
    copy.endTurn(true);

    return copy;
  }

  isLegalMove(from, to) {
    const source = from;
    const target = to;
    const piece = this.board[source.row][source.col];
    const targetPiece = this.board[target.row][target.col];

    if (!piece) {
      return false;
    }

    if (!piece.isLegalMove(source, target, targetPiece, this)) {
      return false;
    }

    //Ensure move doesn't put or keep the player in check
    if (!this.isCopy && !this.mods.includes("ELIMINATION")) {
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

    const moves = this.playerMoves();
    for (let x = 0; x < this.board.length; x++) {
      for (let y = 0; y < this.board[x].length; y++) {
        await this.board[x][y]?.endOfTurn(this, moves, simulatedMove);
      }
    }

    if (this.mods.includes("ELIMINATION")) {
      var hasValidMove = false;
      for (let i = 0; i < this.board.length; i++) {
        for (let j = 0; j < this.board[i].length; j++) {
          const piece = this.board[i][j];
          if (piece !== null) {
            if (piece.color.charAt(0) === this.turn && this.moves(new GridPosition(i, j)).length > 0) {
              hasValidMove = true;
            }
          }
        }
      }
      if (!hasValidMove) {
        this.turn = this.turn === "w" ? "b" : "w";
      }
    }

    if (!this.enPassant.equals(new GridPosition(-1, -1)) && !this.justDoubleMovedPawn) {
      this.enPassant = new GridPosition(-1, -1);
    }
    this.justDoubleMovedPawn = false;
  }

  fog() {
    if (this.mods.includes("FOG")) {
      let sight = this.getPlayerSight(this.playerColor);

      let fogArr = [];

      for (let i = 0; i < this.board.length; i++) {
        for (let j = 0; j < this.board[i].length; j++) {
          if (!new GridPosition(i, j).isIn(sight) && !(this.board[i][j] != null && this.board[i][j].color == this.playerColor)) {
            fogArr.push(new GridPosition(i, j));
          }
        }
      }
      return fogArr;
    }

    return [];
  }

  async move(move) {
    const isLegal = this.isLegalMove(move.sourceSquare, move.targetSquare);

    if (isLegal) {
      const gamestate = JSON.parse(JSON.stringify(this));
      delete gamestate.history;
      this.history.push(gamestate);

      const source = move.sourceSquare;
      const target = move.targetSquare;
      const targetPiece = this.board[target.row][target.col];
      const piece = this.board[source.row][source.col];

      const moveHandled = piece.move(this, { from: source, to: target });

      if (this.mods.includes("SHIELDS") && targetPiece?.hasShield) {
        targetPiece.hasShield = false;
        await this.endTurn();
        return { isLegal: true, hitShield: true, didCapturePiece: false };
      }

      if (this.mods.includes("VAMPIRE") && piece.isVampire && targetPiece) {
        targetPiece.moveTypes.forEach((value) => {
          if (!piece.moveTypes.includes(value)) {
            piece.moveTypes.push(value);
          }
        });
      }

      if (!moveHandled) {
        this.board[source.row][source.col] = null;
        this.board[target.row][target.col] = piece;
      }
      await this.endTurn();
      return { isLegal: isLegal, hitShield: false, didCapturePiece: !!targetPiece };
    }
    return { isLegal: false, hitShield: false, didCapturePiece: false };
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
export { Piece };
