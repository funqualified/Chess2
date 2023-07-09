import Chessboard from "chessboardjsx";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import React from "react";
import Chess from "./chess2";
import Multiplayer from "./multiplayer";

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
  const [moveHighlights, setMoveHighlights] = useState({});
  const [fogHighlights, setFogHighlights] = useState({});

  if (!Chess().initialized) {
    return null;
  }

  function onDragStart(drag) {
    // do not pick up pieces if the game is over
    if (Chess().game_over()) return false;
    if (Chess().turn !== Chess().playerColor.charAt(0)) return false;

    // only pick up pieces for White
    if (Chess().playerColor === "white") {
      if (drag.piece.search(/^b/) !== -1) return false;
    } else {
      if (drag.piece.search(/^w/) !== -1) return false;
    }

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

  async function onDrop(source, target) {
    // see if the move is legal
    var move = await Chess().move(source, target);

    // illegal move
    if (!move) {
      return "snapback";
    } else if (props.multiplayer && Multiplayer().peerIsConnected) {
      Multiplayer().conn.send({ board: Chess().board, turn: Chess().turn, winner: Chess().winner, enPassant: Chess().enPassant });
    }

    // make random legal move for black
    if (!props.multiplayer && !Chess().game_over()) {
      window.setTimeout(makeRandomMove, 250);
    }

    updateUI();
  }

  function onMouseoverSquare(square) {
    const info = Chess().getPieceInfo(square);

    if (info) {
      setPieceInfo(info);
    }

    greySquareMoves(square);
  }

  function onMouseoutSquare(square) {
    removeHightlighSquares();
    setPieceInfo("");
  }

  function greySquareMoves(square) {
    // get list of possible moves for this square
    var moves = Chess().moves(square, true);

    // exit if there are no moves available for this square
    if (moves.length === 0) return;

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
    navigate("/");
  }

  return (
    <div id="game-space" className="game">
      <div className="board">
        <Chessboard
          position={fen}
          orientation={Chess().playerColor}
          allowDrag={onDragStart}
          onDrop={onDrop}
          onMouseOutSquare={onMouseoutSquare}
          onMouseOverSquare={onMouseoverSquare}
          squareStyles={{ ...fogHighlights, ...moveHighlights }}
          width={window.innerWidth * 0.7 < window.innerHeight * 0.9 ? window.innerWidth * 0.7 : window.innerHeight * 0.9}
        />
      </div>
      <div className="info-container">
        <div id="space-details" className="info-box">
          <p>{pieceInfo}</p>
        </div>
        <div id="game-details" className="info-box">
          <p>{gameInfo}</p>
        </div>
        <button onClick={quit}>Quit Game</button>
      </div>
    </div>
  );
};

export default Game;
