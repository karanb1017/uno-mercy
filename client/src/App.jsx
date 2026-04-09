import React, { useState, useEffect, useCallback, useRef } from "react";
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

  // Track current screen in a ref to avoid stale closures in the socket useEffect
  const screenRef = useRef(screen);
  useEffect(() => { screenRef.current = screen; }, [screen]);

  // Connect socket on mount and register all listeners once (empty dependency array)
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
    });

    socket.on("gameState", (state) => {
      if (!state) return;
      setMyIndex(state.myIndex);
      setGameState(state);
      if (state.phase === "end") {
        setScreen("gameover");
      } else if (screenRef.current !== "game") {
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
  }, []); // ← empty dependency array: register listeners only once

  // Attempt to rejoin from saved session on mount
  useEffect(() => {
    const saved = localStorage.getItem("uno_session");
    if (saved) {
      try {
        const { roomCode: savedRoomCode, name, isHost: wasHost } = JSON.parse(saved);
        socket.emit("rejoinRoom", { name, roomCode: savedRoomCode }, (res) => {
          if (res.error) {
            localStorage.removeItem("uno_session");
            setScreen("home");
          } else {
            setMyName(name);
            setRoomCode(savedRoomCode);
            setIsHost(res.isHost);
            setScreen("lobby");
          }
        });
      } catch {
        localStorage.removeItem("uno_session");
      }
    }
  }, []);

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
      localStorage.setItem("uno_session", JSON.stringify({ roomCode: res.roomCode, name, isHost: true }));
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
      localStorage.setItem("uno_session", JSON.stringify({ roomCode: res.roomCode, name, isHost: false }));
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
    localStorage.removeItem("uno_session");
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

      {screen === "lobby" && !lobby && (
        <div style={{ minHeight: "100vh", background: "#080e18", display: "flex", alignItems: "center", justifyContent: "center", color: "#818cf8", fontFamily: "Nunito", fontSize: 18 }}>
          Reconnecting...
        </div>
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
          onLeave={handleLeave}
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
