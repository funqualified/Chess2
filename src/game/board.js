import GridPosition from "../models/gridPosition";
import Piece from "./piece";
import { pieceFactory } from "./piece";
import { gameEvent, gameEventAsync } from "./chess2";

class Board {
  constructor(game, fen) {
    if (fen) {
      this.spaces = [];
      this.width = fen.split("/")[0].length;
      this.height = fen.split("/").length;
      this.createBoard(fen.split(" ")[0], game);
    }
  }

  createBoard(fen, game) {
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
          const piece = pieceFactory(game, char, space.getPosition()); //TODO: stop using the piece factory
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

    this.addNeighbors(game);
  }

  save() {
    return {
      spaces: this.spaces.map((space) => {
        return {
          position: { row: space.position.row, col: space.position.col },
          piece: space.getPiece() ? space.getPiece().save() : null,
          neighbors: space.neighbors.map((neighbor) => {
            return {
              space: { row: neighbor.space.row, col: neighbor.space.col },
              type: neighbor.type,
            };
          }),
          details: space.details,
        };
      }),
      width: this.width,
      height: this.height,
    };
  }

  restore(state) {
    this.width = state.width;
    this.height = state.height;
    this.spaces = state.spaces.map((space) => {
      const newSpace = new Space(new GridPosition(space.position.row, space.position.col));
      newSpace.addNeighbors(space.neighbors);
      newSpace.details = space.details;
      if (space.piece) {
        newSpace.setPiece(new Piece());
        newSpace.getPiece().restore(space.piece);
      }
      return newSpace;
    });
  }

  getSpace(position) {
    return this.spaces[position.row * this.width + position.col];
  }

  async endOfTurn(game, moves, defaultAction = false) {
    this.getPieces().forEach((piece) => {
      piece.endOfTurn(game, moves, defaultAction);
    });
  }

  getPieces() {
    return this.spaces.map((space) => space.getPiece()).filter((piece) => piece !== null);
  }

  addNeighbors(game) {
    gameEvent("setSpaceNeighbors", game, { spaces: this.spaces, width: this.width, height: this.height });
    for (let i = 0; i < this.spaces.length; i++) {
      const space = this.spaces[i];
      const position = space.getPosition();
      const row = position.row;
      const col = position.col;
      const neighbors = [];
      if (row > 0) {
        if (col > 0) {
          neighbors.push({ space: new GridPosition(row - 1, col - 1), type: "upleft" });
        }
        neighbors.push({ space: new GridPosition(row - 1, col), type: "up" });
        if (col < this.width - 1) {
          neighbors.push({ space: new GridPosition(row - 1, col + 1), type: "upright" });
        }
      }
      if (col > 0) {
        neighbors.push({ space: new GridPosition(row, col - 1), type: "left" });
      }
      if (col < this.width - 1) {
        neighbors.push({ space: new GridPosition(row, col + 1), type: "right" });
      }
      if (row < this.height - 1) {
        if (col > 0) {
          neighbors.push({ space: new GridPosition(row + 1, col - 1), type: "downleft" });
        }
        neighbors.push({ space: new GridPosition(row + 1, col), type: "down" });
        if (col < this.width - 1) {
          neighbors.push({ space: new GridPosition(row + 1, col + 1), type: "downright" });
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
    if (this.piece) {
      this.piece.setPosition(this.position);
    }
  }

  getPosition() {
    return this.position;
  }

  getNeighborOfType(type, game) {
    const board = game.board;
    var position = this.neighbors.find((neighbor) => {
      return neighbor.type === type;
    })?.space;
    return position ? board.getSpace(position) : null;
  }
}

export default Board;
export { Space };
