const express = require("express");
const { createServer } = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const {
  initGame, processPlay, processDraw,
  processSwap, processDiscardAll, processRoulette,
  getPlayerView, shuffle, canPlayCard, getDrawStrength,
} = require("./gameEngine");

// ─── CONFIG ──────────────────────────────────────────────────
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "flavours";
const PORT = process.env.PORT || 3001;
const CLIENT_URL = process.env.CLIENT_URL || "*";

const app = express();
app.use(cors({ origin: CLIENT_URL }));
app.use(express.json());

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: { origin: CLIENT_URL, methods: ["GET", "POST"] }
});

// ─── ROOM STORAGE (in memory) ─────────────────────────────────
// rooms = { [code]: { players, state, settings, host, timer } }
const rooms = {};

function generateRoomCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code;
  do {
    code = Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
  } while (rooms[code]);
  return code;
}

function broadcastRoom(roomCode) {
  const room = rooms[roomCode];
  if (!room) return;
  // Send each player their own view
  for (const player of room.players) {
    const socket = io.sockets.sockets.get(player.socketId);
    if (socket) {
      socket.emit("gameState", room.state
        ? getPlayerView(room.state, player.socketId)
        : null
      );
    }
  }
  // Broadcast lobby info to everyone
  io.to(roomCode).emit("lobbyUpdate", {
    roomCode,
    players: room.players.map(p => ({
      id: p.id,
      name: p.name,
      isHost: p.socketId === room.host,
      connected: !!io.sockets.sockets.get(p.socketId),
      isBot: !!p.isBot,
    })),
    gameStarted: !!room.state,
    settings: room.settings,
  });
}

function clearTurnTimer(roomCode) { /* no turn timer */ }
function startTurnTimer(roomCode) { /* no turn timer */ }

// ─── BOT LOGIC ─────────────────────────────────────────────
function getBotBestColor(hand) {
  const counts = { red: 0, blue: 0, green: 0, yellow: 0 };
  for (const c of hand) if (counts[c.color] !== undefined) counts[c.color]++;
  return Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0] || "red";
}

function computeBotMove(state, botIdx) {
  const hand = state.players[botIdx].hand;
  const playable = hand.filter(c => canPlayCard(c, state));
  if (playable.length === 0) return { draw: true };

  if (state.chainActive && state.drawStack > 0) {
    const draws = playable.filter(c => getDrawStrength(c) > 0);
    if (draws.length > 0) {
      const best = draws.reduce((a, b) => getDrawStrength(a) >= getDrawStrength(b) ? a : b);
      const needsColor = best.type === "wildDraw" || best.type === "wildReverseDraw";
      return { draw: false, cardIds: [best.id], chosenColor: needsColor ? getBotBestColor(hand) : null };
    }
    return { draw: false, cardIds: [playable[0].id], chosenColor: null };
  }

  const numGroups = {};
  for (const c of playable.filter(c => c.type === "number" || c.type === "seven" || c.type === "zero")) {
    if (!numGroups[c.value]) numGroups[c.value] = [];
    numGroups[c.value].push(c);
  }
  const bigGroup = Object.values(numGroups).sort((a, b) => b.length - a.length)[0];
  if (bigGroup?.length > 1) return { draw: false, cardIds: bigGroup.map(c => c.id), chosenColor: null };

  const pick =
    playable.find(c => c.type === "number") ||
    playable.find(c => c.type === "action" && c.value !== "discardAll" && c.value !== "roulette") ||
    playable.find(c => c.type === "seven" || c.type === "zero") ||
    playable.find(c => getDrawStrength(c) > 0) ||
    playable[0];

  const needsColor = pick.type === "wild" || pick.type === "wildDraw" || pick.type === "wildReverseDraw" || pick.value === "roulette";
  return { draw: false, cardIds: [pick.id], chosenColor: needsColor ? getBotBestColor(hand) : null };
}

function maybeScheduleBot(roomCode) {
  const room = rooms[roomCode];
  if (!room?.state || room.state.phase === "end") return;
  const state = room.state;

  let actorId = null;
  if (state.phase === "play") actorId = state.currentPlayer;
  else if (state.phase === "swapHands") actorId = state.pendingAction?.playerId;
  else if (state.phase === "discardAll") actorId = state.pendingAction?.playerId;
  else if (state.phase === "roulette") actorId = state.pendingAction?.initiator;

  if (actorId === null || actorId === undefined) return;
  if (!room.players.find(p => p.id === actorId && p.isBot)) return;

  setTimeout(() => {
    const r = rooms[roomCode];
    if (!r?.state || r.state.phase === "end") return;
    const s = r.state;

    if (s.phase === "play" && s.currentPlayer === actorId) {
      const move = computeBotMove(s, actorId);
      let ns = move.draw ? processDraw(s, actorId) : processPlay(s, actorId, move.cardIds, move.chosenColor);
      if (ns?.error) ns = processDraw(s, actorId);
      if (!ns?.error) r.state = ns;
    } else if (s.phase === "swapHands" && s.pendingAction?.playerId === actorId) {
      const targets = s.players.filter((p, i) => !p.eliminated && i !== actorId);
      const target = targets.sort((a, b) => b.hand.length - a.hand.length)[0];
      r.state = processSwap(s, actorId, target?.id ?? 0);
    } else if (s.phase === "discardAll" && s.pendingAction?.playerId === actorId) {
      const col = s.pendingAction.color;
      const eligible = s.players[actorId].hand
        .filter(c => c.color === col && c.type === "number" && c.value !== "0" && c.value !== "7")
        .map(c => c.id);
      r.state = processDiscardAll(s, actorId, eligible);
    } else if (s.phase === "roulette" && s.pendingAction?.initiator === actorId) {
      r.state = processRoulette(s);
    }

    broadcastRoom(roomCode);
    maybeScheduleBot(roomCode);
  }, 1200);
}

// ─── HEALTH CHECK ─────────────────────────────────────────────
app.get("/health", (req, res) => res.json({ ok: true, rooms: Object.keys(rooms).length }));

// ─── SOCKET EVENTS ────────────────────────────────────────────
io.on("connection", (socket) => {
  console.log("Connected:", socket.id);

  // ── Create room (admin only) ────────────────────────────
  socket.on("createRoom", ({ name, password, settings }, callback) => {
    if (password !== ADMIN_PASSWORD) {
      return callback({ error: "Wrong admin password" });
    }
    const code = generateRoomCode();
    const player = { id: 0, socketId: socket.id, name: name || "Host" };
    rooms[code] = {
      players: [player],
      state: null,
      host: socket.id,
      settings: {
        mercyLimit: settings?.mercyLimit || 25,
        turnTimer: settings?.turnTimer || 20,
        maxPlayers: settings?.maxPlayers || 6,
      },
      timer: null,
    };
    socket.join(code);
    socket.data.roomCode = code;
    socket.data.name = player.name;
    console.log(`Room ${code} created by ${player.name}`);
    callback({ success: true, roomCode: code, isHost: true });
    broadcastRoom(code);
  });

  // ── Join room ───────────────────────────────────────────
  socket.on("joinRoom", ({ name, roomCode }, callback) => {
    const code = roomCode.toUpperCase().trim();
    const room = rooms[code];
    if (!room) return callback({ error: "Room not found" });
    if (room.state) return callback({ error: "Game already in progress" });
    if (room.players.length >= room.settings.maxPlayers) return callback({ error: "Room is full" });

    // Check if name taken
    if (room.players.some(p => p.name.toLowerCase() === name.toLowerCase())) {
      return callback({ error: "Name already taken in this room" });
    }

    const player = {
      id: room.players.length,
      socketId: socket.id,
      name: name || `Player ${room.players.length + 1}`,
    };
    room.players.push(player);
    socket.join(code);
    socket.data.roomCode = code;
    socket.data.name = player.name;
    console.log(`${player.name} joined room ${code}`);
    callback({ success: true, roomCode: code, isHost: false });
    broadcastRoom(code);
  });

  // ── Start game (host only) ──────────────────────────────
  socket.on("startGame", ({ roomCode }, callback) => {
    const room = rooms[roomCode];
    if (!room) return callback?.({ error: "Room not found" });
    if (room.host !== socket.id) return callback?.({ error: "Only the host can start" });
    if (room.players.length < 2) return callback?.({ error: "Need at least 2 players" });
    if (room.state) return callback?.({ error: "Game already started" });

    room.state = initGame(room.players, room.settings);
    console.log(`Game started in room ${roomCode}`);
    callback?.({ success: true });
    broadcastRoom(roomCode);
    maybeScheduleBot(roomCode);
  });

  // ── Play card(s) ────────────────────────────────────────
  socket.on("playCard", ({ roomCode, cardIds, chosenColor }) => {
    const room = rooms[roomCode];
    if (!room?.state) return;
    const playerIdx = room.players.findIndex(p => p.socketId === socket.id);
    if (playerIdx === -1) return;

    const result = processPlay(room.state, playerIdx, cardIds, chosenColor);
    if (result.error) {
      socket.emit("error", result.error);
      return;
    }

    room.state = result;
    clearTurnTimer(roomCode);
    broadcastRoom(roomCode);
    maybeScheduleBot(roomCode);
  });

  // ── Draw card ───────────────────────────────────────────
  socket.on("drawCard", ({ roomCode }) => {
    const room = rooms[roomCode];
    if (!room?.state) return;
    const playerIdx = room.players.findIndex(p => p.socketId === socket.id);
    if (playerIdx === -1) return;

    const result = processDraw(room.state, playerIdx);
    if (result.error) { socket.emit("error", result.error); return; }

    room.state = result;
    clearTurnTimer(roomCode);
    broadcastRoom(roomCode);
    maybeScheduleBot(roomCode);
  });

  // ── Swap hands (7 card) ─────────────────────────────────
  socket.on("swapHands", ({ roomCode, targetId }) => {
    const room = rooms[roomCode];
    if (!room?.state || room.state.phase !== "swapHands") return;
    const playerIdx = room.players.findIndex(p => p.socketId === socket.id);
    if (playerIdx !== room.state.pendingAction?.playerId) return;

    room.state = processSwap(room.state, playerIdx, targetId);
    broadcastRoom(roomCode);
    maybeScheduleBot(roomCode);
  });

  // ── Discard all ─────────────────────────────────────────
  socket.on("discardAll", ({ roomCode, cardIds }) => {
    const room = rooms[roomCode];
    if (!room?.state || room.state.phase !== "discardAll") return;
    const playerIdx = room.players.findIndex(p => p.socketId === socket.id);
    if (playerIdx !== room.state.pendingAction?.playerId) return;

    room.state = processDiscardAll(room.state, playerIdx, cardIds || []);
    clearTurnTimer(roomCode);
    broadcastRoom(roomCode);
    maybeScheduleBot(roomCode);
  });

  // ── Roulette resolve ────────────────────────────────────
  socket.on("resolveRoulette", ({ roomCode }) => {
    const room = rooms[roomCode];
    if (!room?.state || room.state.phase !== "roulette") return;
    const playerIdx = room.players.findIndex(p => p.socketId === socket.id);
    if (playerIdx !== room.state.pendingAction?.initiator) return;

    room.state = processRoulette(room.state);
    clearTurnTimer(roomCode);
    broadcastRoom(roomCode);
    maybeScheduleBot(roomCode);
  });

  // ── Say UNO ─────────────────────────────────────────────
  socket.on("sayUno", ({ roomCode }) => {
    const room = rooms[roomCode];
    if (!room?.state) return;
    const playerIdx = room.players.findIndex(p => p.socketId === socket.id);
    if (playerIdx === -1) return;
    const player = room.state.players[playerIdx];
    if (player.hand.length !== 1) return;

    room.state = {
      ...room.state,
      players: room.state.players.map((p, i) =>
        i === playerIdx ? { ...p, saidUno: true } : p
      ),
      log: [...room.state.log, `${player.name} said UNO!`]
    };
    broadcastRoom(roomCode);
  });

  // ── Catch UNO ───────────────────────────────────────────
  socket.on("catchUno", ({ roomCode, targetId }) => {
    const room = rooms[roomCode];
    if (!room?.state) return;
    const target = room.state.players[targetId];
    if (!target || target.hand.length !== 1 || target.saidUno) return;

    // Draw 4 cards as penalty without changing whose turn it is
    let deck = [...room.state.deck];
    let discard = [...room.state.discard];
    if (deck.length < 4) {
      const reshuffled = shuffle([...discard.slice(0, -1)]);
      deck = [...deck, ...reshuffled];
      discard = [discard[discard.length - 1]];
    }
    const drawn = deck.splice(0, Math.min(5, deck.length));
    room.state = {
      ...room.state,
      deck,
      discard,
      players: room.state.players.map((p, i) =>
        i === targetId ? { ...p, hand: [...p.hand, ...drawn] } : p
      ),
      log: [...room.state.log, `${target.name} was caught without saying UNO! Draws 5!`]
    };
    broadcastRoom(roomCode);
  });

  socket.on("addBot", ({ roomCode }) => {
    const room = rooms[roomCode];
    if (!room || room.host !== socket.id || room.state) return;
    if (room.players.length >= room.settings.maxPlayers) return;
    const botNum = room.players.filter(p => p.isBot).length + 1;
    const botId = room.players.length;
    room.players.push({
      id: botId,
      socketId: `bot_${botId}_${Date.now()}`,
      name: `Bot ${botNum}`,
      isBot: true,
    });
    broadcastRoom(roomCode);
  });

  // ── Remove bot (host only) ──────────────────────────────────
  socket.on("removeBot", ({ roomCode }) => {
    const room = rooms[roomCode];
    if (!room || room.host !== socket.id || room.state) return;
    const lastBotIdx = [...room.players].reverse().findIndex(p => p.isBot);
    if (lastBotIdx === -1) return;
    room.players.splice(room.players.length - 1 - lastBotIdx, 1);
    room.players = room.players.map((p, i) => ({ ...p, id: i }));
    broadcastRoom(roomCode);
  });

  // ── Chat message ────────────────────────────────────────
  socket.on("chatMessage", ({ roomCode, message }) => {
    const room = rooms[roomCode];
    if (!room) return;
    const player = room.players.find(p => p.socketId === socket.id);
    if (!player) return;
    io.to(roomCode).emit("chatMessage", {
      name: player.name,
      message: message.slice(0, 200),
      timestamp: Date.now(),
    });
  });

  // ── Update settings (host only) ─────────────────────────
  socket.on("updateSettings", ({ roomCode, settings }) => {
    const room = rooms[roomCode];
    if (!room || room.host !== socket.id || room.state) return;
    room.settings = { ...room.settings, ...settings };
    broadcastRoom(roomCode);
  });

  // ── Play again (host only) ──────────────────────────────
  socket.on("playAgain", ({ roomCode }) => {
    const room = rooms[roomCode];
    if (!room || room.host !== socket.id) return;
    room.state = null;
    broadcastRoom(roomCode);
  });

  // ── Kick player (host only) ─────────────────────────────
  socket.on("kickPlayer", ({ roomCode, targetSocketId }) => {
    const room = rooms[roomCode];
    if (!room || room.host !== socket.id || room.state) return;
    room.players = room.players.filter(p => p.socketId !== targetSocketId);
    // Re-assign IDs
    room.players = room.players.map((p, i) => ({ ...p, id: i }));
    const targetSocket = io.sockets.sockets.get(targetSocketId);
    if (targetSocket) { targetSocket.emit("kicked"); targetSocket.leave(roomCode); }
    broadcastRoom(roomCode);
  });

  // ── Rejoin room (after browser refresh) ────────────────
  socket.on("rejoinRoom", ({ name, roomCode }, callback) => {
    const room = rooms[roomCode];
    if (!room) return callback({ error: "Room no longer exists" });

    const existingPlayer = room.players.find(p => p.name === name && !p.isBot);
    if (existingPlayer) {
      const oldSocketId = existingPlayer.socketId;
      existingPlayer.socketId = socket.id;
      socket.join(roomCode);
      socket.data.roomCode = roomCode;
      socket.data.name = name;

      if (room.host === oldSocketId) {
        room.host = socket.id;
      }

      // Also update socketId in live game state so getPlayerView finds them
      if (room.state) {
        room.state = {
          ...room.state,
          players: room.state.players.map(p =>
            p.socketId === oldSocketId ? { ...p, socketId: socket.id } : p
          ),
        };
      }

      const isHost = room.host === socket.id;
      callback({ success: true, isHost });
      broadcastRoom(roomCode);
    } else {
      callback({ error: "Player not found in room" });
    }
  });

  // ── Disconnect ──────────────────────────────────────────
  socket.on("disconnect", () => {
    console.log("Disconnected:", socket.id);
    const roomCode = socket.data.roomCode;
    if (!roomCode || !rooms[roomCode]) return;
    const room = rooms[roomCode];

    // If host disconnects, transfer host or close room
    if (room.host === socket.id) {
      const others = room.players.filter(p => p.socketId !== socket.id);
      if (others.length === 0) {
        clearTurnTimer(roomCode);
        delete rooms[roomCode];
        return;
      }
      room.host = others[0].socketId;
      io.to(roomCode).emit("hostTransferred", { newHost: others[0].name });
    }

    if (!room.state) {
      // In lobby: remove player
      room.players = room.players.filter(p => p.socketId !== socket.id);
      room.players = room.players.map((p, i) => ({ ...p, id: i }));
    } else {
      // In game: mark disconnected (keep their hand, they can reconnect)
      io.to(roomCode).emit("playerDisconnected", { name: socket.data.name });
    }

    if (room.players.length === 0) {
      clearTurnTimer(roomCode);
      delete rooms[roomCode];
      return;
    }

    broadcastRoom(roomCode);
  });
});

httpServer.listen(PORT, () => {
  console.log(`✅ UNO Mercy server running on port ${PORT}`);
  console.log(`🔑 Admin password: ${ADMIN_PASSWORD}`);
});

// ─── KEEP-ALIVE PING (Render free tier) ───────────────────────
// Render's free tier sleeps after 15 minutes of inactivity.
// Ping the health endpoint every 10 minutes to prevent cold starts.
const SERVER_URL_SELF = process.env.RENDER_EXTERNAL_URL || null;
if (SERVER_URL_SELF) {
  setInterval(() => {
    fetch(`${SERVER_URL_SELF}/health`).catch((err) => {
      console.error("Keep-alive ping failed:", err.message);
    });
  }, 10 * 60 * 1000);
}
