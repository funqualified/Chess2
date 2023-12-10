import Chessboard from "./chessboard";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import React from "react";
import Chess from "./chess2";
import Multiplayer from "./multiplayer";
import getMultiplayer from "./multiplayer";
import ConnectionIndicator from "./connectionIndicator";

const Game = (props) => {
  const navigate = useNavigate();

  useEffect(() => {
    if (!Chess().initialized) {
      navigate("/");
    } else {
      updateUI();
    }

    if (props.multiplayer) {
      Multiplayer().updateUI = updateUI;
    }
  }, [navigate, props.multiplayer]);

  const [fen, setFen] = useState("");
  const [gameInfo, setGameInfo] = useState("");
  const [pieceInfo, setPieceInfo] = useState("");
  const [selectedSquare, setSelectedSquare] = useState("");
  const [moveHighlights, setMoveHighlights] = useState({});
  const [fogHighlights, setFogHighlights] = useState({});

  if (!Chess().initialized) {
    return null;
  }

  function onDragStart(piece) {
    // do not pick up pieces if the game is over
    if (Chess().game_over()) return false;
    if (Chess().turn !== Chess().playerColor.charAt(0)) return false;

    // only pick up pieces for player color
    if (piece.color !== Chess().playerColor) return false;

    return true;
  }

  async function makeRandomMove() {
    var possibleMoves = Chess().moves("black");

    // game over
    if (possibleMoves.length === 0) return;

    var randomIdx = Math.floor(Math.random() * possibleMoves.length);

    await Chess().move({ sourceSquare: possibleMoves[randomIdx].from, targetSquare: possibleMoves[randomIdx].to });

    updateUI();
  }

  function indexToAlgebraic(index) {
    return String.fromCharCode(index[1] + 97) + Math.abs(index[0] - 8);
  }

  async function onDrop(piece, target) {
    //create drag object
    var drag = {
      sourceSquare: indexToAlgebraic(piece.getIndex(Chess().board)),
      targetSquare: indexToAlgebraic([target.row, target.col]),
    };
    // see if the move is legal
    var move = await Chess().move(drag);

    // illegal move
    if (!move) {
      return "snapback";
    } else if (props.multiplayer && Multiplayer().peerIsConnected) {
      Multiplayer().conn.send({ board: JSON.stringify(Chess().board), turn: Chess().turn, winner: Chess().winner, enPassant: Chess().enPassant });
    }

    selectSquare(Chess().board[target.row][target.col]);

    // make random legal move for black
    if (!props.multiplayer && !Chess().game_over()) {
      window.setTimeout(makeRandomMove, 250);
    }

    updateUI();
  }

  function selectSquare(square) {
    if (!square) return;
    const info = square.info(Chess());

    if (info) {
      setPieceInfo(info);
    }

    // greySquareMoves(square);
  }

  function onMouseoutSquare(square) {
    removeHightlighSquares();
    setPieceInfo("");
  }

  function greySquareMoves(square) {
    console.trace();
    // get list of possible moves for this square
    var moves = Chess().moves(square, true);

    var squaresToHighlight = [];
    squaresToHighlight.push(square);

    // highlight the possible squares for this piece
    for (var i = 0; i < moves.length; i++) {
      squaresToHighlight.push(moves[i].to);
    }

    hightlighSquares(squaresToHighlight);
  }

  function removeHightlighSquares() {
    setMoveHighlights({});
  }

  function fogSquares(squares) {
    const newHighlights = squares.reduce((a, c) => {
      return {
        ...a,
        [c]: {
          background: "#000000aa",
        },
      };
    }, {});

    setFogHighlights({ ...newHighlights });
  }

  function hightlighSquares(squares) {
    const newHighlights = squares.reduce((a, c) => {
      return {
        ...a,
        [c]: {
          background: "#88888888",
        },
      };
    }, {});

    setMoveHighlights({ ...newHighlights });
  }

  function updateUI() {
    fogSquares(Chess().fog());
    setFen(Chess().fen());
    setGameInfo(Chess().getGameInfo());
  }

  function quit() {
    if (props.multiplayer) {
      getMultiplayer().disconnect();
      getMultiplayer().closeListing();
    }
    navigate("/");
  }

  function undo() {
    Chess().undo();
    updateUI();
  }

  return (
    <div id="game-space" className="game">
      {props.multiplayer ? <ConnectionIndicator /> : ""}
      <div className="board">
        <Chessboard onMouseOverSquare={selectSquare} onDragStart={onDragStart} onMouseoutSquare={onMouseoutSquare} onDrop={onDrop} />
      </div>
      <div className="info-container">
        <div id="space-details" className="info-box">
          <p>{pieceInfo}</p>
        </div>
        <div id="game-details" className="info-box">
          <p>{gameInfo}</p>
        </div>
        <button onClick={quit}>Quit Game</button>
        <button onClick={undo}>Undo</button>
      </div>
    </div>
  );
};

export default Game;
