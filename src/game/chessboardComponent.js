import Chess from "./chess2";
import GridPosition from "../models/gridPosition";
import { useState, useEffect } from "react";
import { func } from "prop-types";

const ChessboardComponent = (props) => {
  const imageMap = {
    wP: require("../assets/Pieces/wP.svg").default,
    wR: require("../assets/Pieces/wR.svg").default,
    wN: require("../assets/Pieces/wN.svg").default,
    wB: require("../assets/Pieces/wB.svg").default,
    wQ: require("../assets/Pieces/wQ.svg").default,
    wK: require("../assets/Pieces/wK.svg").default,
    bP: require("../assets/Pieces/bP.svg").default,
    bR: require("../assets/Pieces/bR.svg").default,
    bN: require("../assets/Pieces/bN.svg").default,
    bB: require("../assets/Pieces/bB.svg").default,
    bQ: require("../assets/Pieces/bQ.svg").default,
    bK: require("../assets/Pieces/bK.svg").default,
  };

  const [heldPiece, setHeldPiece] = useState(null);

  function onDragStart(ev, piece) {
    if (props.onDragStart(piece)) {
      setHeldPiece(piece);
    } else {
      ev.preventDefault();
    }
  }

  function onDragEnd(ev, heldPiece, rowIndex, squareIndex) {
    ev.preventDefault();
    props.onDrop(heldPiece, new GridPosition(rowIndex, squareIndex));
    setHeldPiece(null);
  }

  function squareClasses(rowIndex, colIndex) {
    let classes = "square ";
    classes += (colIndex - rowIndex) % 2 === 0 ? "light" : "dark";

    // if the highlighted squares includes an object with the row and col of the current square, add the highlight class
    if (props.highlightedSquares && new GridPosition(rowIndex, colIndex).isIn(props.highlightedSquares)) {
      classes += " highlight";
    }

    if (props.fog && new GridPosition(rowIndex, colIndex).isIn(props.fog)) {
      classes += " fog";
    }
    return classes;
  }

  function isFog(rowIndex, colIndex) {
    if (props.fog && new GridPosition(rowIndex, colIndex).isIn(props.fog)) {
      return true;
    }
    return false;
  }

  function onMouseOverSquare(row, col) {
    var square = new GridPosition(row, col);
    props.onMouseOverSquare(square);
  }

  function onTouchStart(ev, row, col, piece) {
    ev.preventDefault();
    var square = new GridPosition(row, col);
    props.onMouseOverSquare(square);
    if (heldPiece == null && piece != null) {
      if (props.onDragStart(piece)) {
        setHeldPiece(piece);
      }
    }
    if (heldPiece != null) {
      var dropPiece = heldPiece;
      setHeldPiece(null);
      props.onDrop(dropPiece, new GridPosition(row, col));
    }
  }

  var board = processBoard(Chess().board, props.orientation);

  function processBoard(board, orientation) {
    // Sort the board spaces using row and col based on the orientation
    var sortedBoard = board.spaces.sort((a, b) => {
      if (orientation == "black") {
        return a.position.getRow() - b.position.getRow() || a.position.getCol() - b.position.getCol(); // TODO: double check this
      } else {
        return b.position.getRow() - a.position.getRow() || b.position.getCol() - a.position.getCol();
      }
    });
    // Then split the board into rows
    var processedBoard = [];
    var row = [];
    var rowIndex = 0;
    for (var i = 0; i < sortedBoard.length; i++) {
      var space = sortedBoard[i];
      if (space.position.getRow() != rowIndex) {
        processedBoard.push(row);
        row = [];
        rowIndex = space.position.getRow();
      }
      row.push(space);
    }
    processedBoard.push(row);

    // return the processed board
    return processedBoard;
  }

  return (
    <div id="board" className="black">
      {/* Sort the board spaces using row and col based on the orientation
      Then map over the rows and columns to create the board
      go to next row when the column is done */}
      {board &&
        board.map((row, rowIndex) => {
          var displayRow = row;
          return (
            <div className="row" key={rowIndex}>
              {displayRow.map((square, squareIndex) => {
                return (
                  <div
                    className={squareClasses(square.position.getRow(), square.position.getCol())}
                    key={square.position.getCol()}
                    onMouseOver={() => onMouseOverSquare(square.position.getRow(), square.position.getCol())}
                    onMouseOut={() => props.onMouseoutSquare(square)}
                    onDrop={(e) => onDragEnd(e, heldPiece, square.position.getRow(), square.position.getCol())}
                    onDragOver={(e) => e.preventDefault()}
                    onTouchStart={(e) => onTouchStart(e, square.position.getRow(), square.position.getCol(), square)}>
                    {square.getPiece() && !isFog(square.position.getRow(), square.position.getCol()) ? (
                      <img
                        className="piece"
                        src={imageMap[`${square.color[0]}${square.getPiece().fenId.toUpperCase()}`]}
                        alt={`${square.getPiece().color[0]}${square.getPiece().fenId.toUpperCase()}.svg`}
                        onDragStart={(e) => onDragStart(e, square.getPiece())}
                      />
                    ) : (
                      ""
                    )}
                    {square && !isFog(square.position.getRow(), square.position.getCol()) ? <PieceStateIndicator piece={square} /> : ""}
                  </div>
                );
              })}
            </div>
          );
        })}
    </div>
  );
};

const PieceStateIndicator = (props) => {
  return (
    <div className="piece-state-indicator">
      {Chess().mods.includes("SHIELDS") && props.piece.hasShield && <div className="state-icon">S</div>}
      {Chess().mods.includes("VAMPIRE") && props.piece.isVampire && <div className="state-icon">V</div>}
      {Chess().mods.includes("LOYALTY") && (
        <div className={"number-icon " + (props.piece.loyalty > 50 ? "number-good" : props.piece.loyalty > 9 ? "number-neutral" : "number-bad")}>
          {props.piece.loyalty}
        </div>
      )}
    </div>
  );
};

export default ChessboardComponent;
