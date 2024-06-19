import GridPosition from "../models/gridPosition";
import { Piece, pieceFactory } from "./piece";
import { gameEvent, gameEventAsync } from "./chess2";

class Board {
  constructor(fen, game) {
    this.spaces = [];
    this.game = game;
    this.width = fen.split("/")[0].length;
    this.height = fen.split("/").length;
    this.createBoard(fen.split(" ")[0]);
  }

  createBoard(fen) {
    const rows = fen.split("/");
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      let col = 0;
      for (let j = 0; j < row.length; j++) {
        const char = row.charAt(j);
        if (isNaN(char)) {
          // Create space
          var space = new Space(new GridPosition(i, col));
          this.spaces.push(space);
          // Put piece on space
          const piece = pieceFactory(this.game, char, space.getPosition());
          space.setPiece(piece);
          col++;
        } else {
          const num = parseInt(char);
          for (let k = 0; k < num; k++) {
            this.spaces.push(new Space(new GridPosition(i, col)));
            col++;
          }
        }
      }
    }

    this.addNeighbors();
  }

  getCopy() {
    // TODO: Returns a deep copy of the board
  }

  getSpace(row, col) {
    return this.spaces[row * 8 + col];
  }

  async endOfTurn(game, moves, defaultAction = false) {
    this.getPieces().forEach((piece) => {
      piece.endOfTurn();
    });
  }

  getPieces() {
    return this.spaces.map((space) => space.getPiece()).filter((piece) => piece !== null);
  }

  addNeighbors() {
    gameEvent("setSpaceNeighbors", this.game, { spaces: this.spaces, width: this.width, height: this.height });
    for (let i = 0; i < this.spaces.length; i++) {
      const space = this.spaces[i];
      const position = space.getPosition();
      const row = position.getRow();
      const col = position.getCol();
      const neighbors = [];
      if (row > 0) {
        if (col > 0) {
          neighbors.push({ space: this.getSpace(row - 1, col - 1), types: ["diagonal", "up", "left"] });
        }
        neighbors.push({ space: this.getSpace(row - 1, col), types: ["vertical", "up"] });
        if (col < this.width - 1) {
          neighbors.push({ space: this.getSpace(row - 1, col + 1), types: ["diagonal", "up", "right"] });
        }
      }
      if (col > 0) {
        neighbors.push({ space: this.getSpace(row, col - 1), types: ["horizontal", "left"] });
      }
      if (col < this.width - 1) {
        neighbors.push({ space: this.getSpace(row, col + 1), types: ["horizontal", "right"] });
      }
      if (row < this.height - 1) {
        if (col > 0) {
          neighbors.push({ space: this.getSpace(row + 1, col - 1), types: ["diagonal", "down", "left"] });
        }
        neighbors.push({ space: this.getSpace(row + 1, col), types: ["vertical", "down"] });
        if (col < this.width - 1) {
          neighbors.push({ space: this.getSpace(row + 1, col + 1), types: ["diagonal", "down", "right"] });
        }
      }
      space.addNeighbors(neighbors);
    }
  }
}

class Space {
  constructor(position) {
    this.position = position;
    this.piece = null;
    this.neighbors = [];
    this.details = [];
  }

  addNeighbors(spaces) {
    spaces.forEach((neighbor) => {
      this.neighbors.push(neighbor);
    });
  }

  addDetail(detail) {
    this.details.push(detail);
  }

  hasPiece() {
    return this.piece !== null;
  }

  getPiece() {
    return this.piece;
  }

  setPiece(piece) {
    this.piece = piece;
    this.piece.setSpace(this);
  }

  getPosition() {
    return this.position;
  }

  getNeighbors() {
    return this.neighbors;
  }

  getNeighborOfTypes(types) {
    return this.neighbors.find((neighbor) => {
      return neighbor.types.some((type) => types.includes(type));
    }).space;
  }
}

export default Board;
export { Space };
