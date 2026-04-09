import React, { useState, useEffect, useCallback } from "react";
import socket from "./socket";
import HomeScreen from "./components/HomeScreen";
import LobbyScreen from "./components/LobbyScreen";
import GameScreen from "./components/GameScreen";
import GameOver from "./components/GameOver";

export default function App() {
  const [screen, setScreen] = useState("home"); // home | lobby | game | gameover
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState("");
  const [roomCode, setRoomCode] = useState("");
  const [isHost, setIsHost] = useState(false);
  const [myName, setMyName] = useState("");
  const [myIndex, setMyIndex] = useState(null);
  const [lobby, setLobby] = useState(null);
  const [gameState, setGameState] = useState(null);

  // Connect socket on mount
  useEffect(() => {
    socket.connect();

    socket.on("connect", () => {
      console.log("Connected to server");
      setError("");
    });

    socket.on("connect_error", () => {
      setError("Cannot connect to server. Make sure the server is running.");
      setConnecting(false);
    });

    socket.on("disconnect", () => {
      console.log("Disconnected");
    });

    socket.on("lobbyUpdate", (data) => {
      setLobby(data);
      if (data.gameStarted && screen === "lobby") {
        // game will start via gameState
      }
    });

    socket.on("gameState", (state) => {
      if (!state) return;
      setMyIndex(state.myIndex);
      setGameState(state);
      if (state.phase === "end") {
        setScreen("gameover");
      } else if (screen !== "game") {
        setScreen("game");
      }
    });

    socket.on("kicked", () => {
      setScreen("home");
      setError("You were kicked from the room.");
      resetState();
    });

    socket.on("hostTransferred", ({ newHost }) => {
      console.log("Host transferred to", newHost);
    });

    socket.on("error", (msg) => {
      console.error("Game error:", msg);
    });

    return () => {
      socket.off("connect");
      socket.off("connect_error");
      socket.off("disconnect");
      socket.off("lobbyUpdate");
      socket.off("gameState");
      socket.off("kicked");
      socket.off("hostTransferred");
      socket.off("error");
    };
  }, [screen]);

  function resetState() {
    setRoomCode("");
    setIsHost(false);
    setMyName("");
    setMyIndex(null);
    setLobby(null);
    setGameState(null);
  }

  function handleCreateRoom({ name, password, settings }) {
    setConnecting(true);
    setError("");
    setMyName(name);
    socket.emit("createRoom", { name, password, settings }, (res) => {
      setConnecting(false);
      if (res.error) {
        setError(res.error);
        return;
      }
      setRoomCode(res.roomCode);
      setIsHost(true);
      setScreen("lobby");
    });
  }

  function handleJoinRoom({ name, roomCode }) {
    setConnecting(true);
    setError("");
    setMyName(name);
    socket.emit("joinRoom", { name, roomCode }, (res) => {
      setConnecting(false);
      if (res.error) {
        setError(res.error);
        return;
      }
      setRoomCode(res.roomCode);
      setIsHost(false);
      setScreen("lobby");
    });
  }

  function handleStart() {
    socket.emit("startGame", { roomCode });
  }

  function handleKick(targetSocketId) {
    socket.emit("kickPlayer", { roomCode, targetSocketId });
  }

  function handleUpdateSettings(settings) {
    socket.emit("updateSettings", { roomCode, settings });
  }

  function handlePlayAgain() {
    socket.emit("playAgain", { roomCode });
    setGameState(null);
    setScreen("lobby");
  }

  function handleLeave() {
    socket.disconnect();
    socket.connect();
    resetState();
    setError("");
    setScreen("home");
  }

  function handleAddBot() {
    socket.emit("addBot", { roomCode });
  }

  function handleRemoveBot() {
    socket.emit("removeBot", { roomCode });
  }

  function handleGameOver() {
    setScreen("gameover");
  }

  return (
    <div style={{ minHeight: "100vh", background: "#080e18" }}>
      {error && screen === "home" && (
        <div style={{
          position: "fixed", top: 16, left: "50%", transform: "translateX(-50%)",
          background: "#7f1d1d", color: "#fca5a5",
          borderRadius: 12, padding: "10px 20px", fontSize: 13,
          fontFamily: "Nunito", fontWeight: 700, zIndex: 999,
          border: "1px solid #991b1b", maxWidth: "90vw", textAlign: "center",
          animation: "slide-up 0.3s ease forwards",
        }}>
          {error}
          <button onClick={() => setError("")} style={{
            background: "transparent", color: "#fca5a5",
            border: "none", marginLeft: 10, fontSize: 14, cursor: "pointer",
          }}>✕</button>
        </div>
      )}

      {screen === "home" && (
        <HomeScreen
          onCreateRoom={handleCreateRoom}
          onJoinRoom={handleJoinRoom}
          connecting={connecting}
        />
      )}

      {screen === "lobby" && lobby && (
        <LobbyScreen
          lobby={lobby}
          isHost={isHost}
          myName={myName}
          onStart={handleStart}
          onKick={handleKick}
          onUpdateSettings={handleUpdateSettings}
          onLeave={handleLeave}
          onAddBot={handleAddBot}
          onRemoveBot={handleRemoveBot}
        />
      )}

      {screen === "game" && gameState && (
        <GameScreen
          state={gameState}
          myIndex={myIndex}
          isHost={isHost}
          roomCode={roomCode}
          socket={socket}
          onGameOver={handleGameOver}
        />
      )}

      {screen === "gameover" && gameState && (
        <GameOver
          state={gameState}
          isHost={isHost}
          myIndex={myIndex}
          onPlayAgain={handlePlayAgain}
          onLeave={handleLeave}
        />
      )}
    </div>
  );
}
