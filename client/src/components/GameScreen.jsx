import React, { useState, useEffect, useRef, useCallback } from "react";
import CardEl, { COLOR_MAP, cardLabel } from "./CardEl";
import ColorPicker from "./ColorPicker";
import SwapModal from "./SwapModal";
import DiscardAllModal from "./DiscardAllModal";
import RouletteModal from "./RouletteModal";

export default function GameScreen({ state, myIndex, isHost, roomCode, socket, onGameOver, onLeave }) {
  const [selected, setSelected] = useState([]);
  const [pendingWild, setPendingWild] = useState(null);
  const [unoPressedTime, setUnoPressedTime] = useState(null);
  const [unoWindowOpen, setUnoWindowOpen] = useState(false);
  const [catchWindowOpen, setCatchWindowOpen] = useState(false);
  const [unoCountdown, setUnoCountdown] = useState(4);
  const [log, setLog] = useState(state.log || []);
  const [chatMsg, setChatMsg] = useState("");
  const [chat, setChat] = useState(() => {
    try { return JSON.parse(localStorage.getItem(`chat_${roomCode}`)) || []; } catch { return []; }
  });
  const [showChat, setShowChat] = useState(false);
  const [rouletteData, setRouletteData] = useState(null);
  const chatKey = `chat_${roomCode}`;
  const logRef = useRef(null);
  const chatRef = useRef(null);
  const unoTimerRef = useRef(null);
  const catchTimerRef = useRef(null);

  const me = state.players[myIndex];
  const isMyTurn = state.currentPlayer === myIndex && !me?.eliminated;
  const topCard = state.discard?.[state.discard.length - 1];
  const cm = COLOR_MAP[state.currentColor] || COLOR_MAP.red;

  // Sync log
  useEffect(() => {
    setLog(state.log || []);
    if (logRef.current) setTimeout(() => { if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight; }, 50);
  }, [state.log]);

  // Chat
  useEffect(() => {
    const handler = (msg) => {
      setChat(c => {
        const updated = [...c, msg];
        try { localStorage.setItem(chatKey, JSON.stringify(updated.slice(-200))); } catch {}
        return updated;
      });
      if (chatRef.current) setTimeout(() => { if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight; }, 50);
    };
    socket.on("chatMessage", handler);
    return () => socket.off("chatMessage", handler);
  }, [socket]);

  // Sync roulette data
  useEffect(() => {
    if (state.phase === "roulette" && state.pendingAction) {
      setRouletteData(state.pendingAction);
    } else {
      setRouletteData(null);
    }
  }, [state.phase, state.pendingAction?.chosenColor, state.pendingAction?.revealedCards?.length]);

  // UNO window logic
  useEffect(() => {
    if (!me) return;
    if (me.handCount === 1 && !me.eliminated) {
      setUnoWindowOpen(true);
      setUnoCountdown(4);
      clearInterval(unoTimerRef.current);
      unoTimerRef.current = setInterval(() => {
        setUnoCountdown(c => {
          if (c <= 1) {
            clearInterval(unoTimerRef.current);
            setUnoWindowOpen(false);
            // Open catch window for others
            setCatchWindowOpen(true);
            clearTimeout(catchTimerRef.current);
            catchTimerRef.current = setTimeout(() => setCatchWindowOpen(false), 5000);
            return 0;
          }
          return c - 1;
        });
      }, 1000);
    } else {
      setUnoWindowOpen(false);
      clearInterval(unoTimerRef.current);
    }
    return () => clearInterval(unoTimerRef.current);
  }, [me?.handCount]);

  // Close catch window when target clears or becomes active player
  useEffect(() => {
    if (!catchWindowOpen) return;
    const target = state.players.find((p, i) => i !== myIndex && p.handCount === 1 && !p.saidUno && !p.eliminated);
    if (!target || state.currentPlayer === target.id) {
      setCatchWindowOpen(false);
    }
  }, [state.players, state.currentPlayer, catchWindowOpen, myIndex]);

  function getDrawStrength(card) {
    if (card.value === "draw2") return 2;
    if (card.value === "draw4") return 4;
    if (card.draws === 6 || card.value === "draw6") return 6;
    if (card.draws === 10 || card.value === "draw10") return 10;
    return 0;
  }

  function canPlayCard(card) {
    if (!isMyTurn) return false;
    if (state.phase !== "play") return false;
    const top = state.discard[state.discard.length - 1];
    if (!top) return true;
    const color = state.currentColor;
    const stack = state.drawStack;
    const chainActive = state.chainActive;

    const chainRequiredDraw = state.chainRequiredDraw || 0;
    if (card.value === "roulette") return !chainActive && stack === 0;
    if (chainActive && stack > 0) {
      const str = card.value === "draw2" ? 2 :
        (card.draws === 4 || card.value === "draw4") ? 4 :
        (card.draws === 6 || card.value === "draw6") ? 6 :
        (card.draws === 10 || card.value === "draw10") ? 10 : 0;
      if (str > 0 && str >= chainRequiredDraw) {
        // Wild cards counter any color chain; colored draw cards must match current color
        if (card.color === "wild") return true;
        if (card.color === color) return true;
        return false;
      }
      if (card.value === "skip" || card.value === "reverse" || card.value === "skipAll") {
        if (card.color === color) return true;
        if (top && card.value === top.value) return true;
      }
      return false;
    }
    if (card.type === "wild" || card.type === "wildDraw" || card.type === "wildReverseDraw") return true;
    if (card.color === color) return true;
    if (card.value === top.value) return true;
    return false;
  }

  function getColorExclusions() {
    if (pendingWild) {
      const cards = (me?.hand || []).filter(c => pendingWild.includes(c.id));
      if (cards.some(c => c.value === "roulette")) return [];
    }
    if (!state.chainActive || !state.colorStack?.length) return [state.currentColor];
    return [...new Set([...state.colorStack, state.currentColor])];
  }

  function handleCardClick(card) {
    if (!isMyTurn || state.phase !== "play") return;

    if (selected.includes(card.id)) {
      // Second tap = play
      handlePlaySelected([...selected]);
      return;
    }

    // Adding to existing selection — bypass canPlayCard, only same-value check
    if (selected.length > 0) {
      const firstCard = me.hand.find(c => c.id === selected[0]);
      const noStack = ["0", "7", "discardAll", "roulette"];
      if (!noStack.includes(card.value) && firstCard?.value === card.value) {
        setSelected(s => [...s, card.id]);
        return;
      }
    }

    // Starting new selection — must be individually playable
    if (!canPlayCard(card)) return;
    setSelected([card.id]);
  }

  function handlePlaySelected(cardIds = selected) {
    if (cardIds.length === 0) return;
    const cards = me.hand.filter(c => cardIds.includes(c.id));
    const needsColor = cards.some(c =>
      c.type === "wild" || c.type === "wildDraw" ||
      c.type === "wildReverseDraw"
    );
    if (needsColor) {
      setPendingWild(cardIds);
      setSelected([]);
    } else {
      socket.emit("playCard", { roomCode, cardIds, chosenColor: null });
      setSelected([]);
    }
  }

  function handleColorChosen(color) {
    socket.emit("playCard", { roomCode, cardIds: pendingWild, chosenColor: color });
    setPendingWild(null);
  }

  function handleDraw() {
    if (!isMyTurn || state.phase !== "play") return;
    socket.emit("drawCard", { roomCode });
    setSelected([]);
  }

  function handleSwap(targetId) {
    socket.emit("swapHands", { roomCode, targetId });
  }

  function handleDiscardAll(cardIds) {
    socket.emit("discardAll", { roomCode, cardIds });
  }

  function handleRouletteEnd() {
    socket.emit("resolveRoulette", { roomCode });
  }

  function handleUno() {
    socket.emit("sayUno", { roomCode });
    setUnoWindowOpen(false);
    clearInterval(unoTimerRef.current);
    setCatchWindowOpen(false);
  }

  function handleCatch(targetId) {
    socket.emit("catchUno", { roomCode, targetId });
    setCatchWindowOpen(false);
  }

  function sendChat(e) {
    e.preventDefault();
    if (!chatMsg.trim()) return;
    socket.emit("chatMessage", { roomCode, message: chatMsg.trim() });
    setChatMsg("");
  }

  if (state.phase === "end") {
    onGameOver();
    return null;
  }

  const isRoulette = state.phase === "roulette";
  const isRouletteColorPick = isRoulette &&
    state.pendingAction?.targetPlayer === myIndex &&
    !state.pendingAction?.chosenColor;
  const isSwap = state.phase === "swapHands" && state.pendingAction?.playerId === myIndex;
  const isDiscardAll = state.phase === "discardAll" && state.pendingAction?.playerId === myIndex;

  const opponents = state.players.filter((_, i) => i !== myIndex);

  // UNO catch target: a player who has 1 card and hasn't said UNO
  const catchTarget = state.players.find((p, i) => i !== myIndex && p.handCount === 1 && !p.saidUno && !p.eliminated);

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(160deg,#07091a 0%,#0b1225 40%,#060e18 100%)",
      display: "flex", flexDirection: "column",
      fontFamily: "'Nunito', sans-serif", userSelect: "none",
      maxWidth: "100vw", overflow: "hidden", position: "relative",
    }}>
      {/* Ambient glow behind everything */}
      <div style={{
        position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0,
        background: `radial-gradient(ellipse 60% 40% at 50% 50%, ${cm.glow}18 0%, transparent 70%)`,
        transition: "background 0.8s ease",
      }} />

      {/* ── Modals ─────────────────────────────────────────────────── */}
      {pendingWild && (
        <ColorPicker onPick={handleColorChosen} exclude={getColorExclusions()} />
      )}
      {isRouletteColorPick && (
        <ColorPicker
          onPick={(color) => { socket.emit("rouletteChooseColor", { roomCode, color }); }}
          exclude={[]}
          title="You were hit by Roulette! Pick a color — you'll draw until you get it."
        />
      )}
      {isSwap && (
        <SwapModal players={state.players} myId={myIndex} onSwap={handleSwap} />
      )}
      {isDiscardAll && (
        <DiscardAllModal
          hand={me.hand}
          color={state.pendingAction.color}
          onConfirm={handleDiscardAll}
          onSkip={() => handleDiscardAll([])}
        />
      )}
      {isRoulette && rouletteData && rouletteData.revealedCards?.length > 0 && (
        <RouletteModal
          targetName={state.players[rouletteData.targetPlayer]?.name}
          chosenColor={rouletteData.chosenColor}
          revealedCards={rouletteData.revealedCards}
          onDone={handleRouletteEnd}
          isInitiator={rouletteData.initiator === myIndex}
        />
      )}

      {/* ── Header ─────────────────────────────────────────────────── */}
      <div style={{
        position: "relative", zIndex: 10,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "8px 14px",
        background: "rgba(8,14,28,0.85)",
        backdropFilter: "blur(12px)",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
      }}>
        {/* Logo */}
        <div style={{
          fontFamily: "'Fredoka One', cursive", fontSize: 20, letterSpacing: 1,
          background: "linear-gradient(120deg,#818cf8,#c084fc,#f472b6)",
          WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
        }}>UNO ⚡ MERCY</div>

        {/* Pills row */}
        <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
          {/* Alive count */}
          <div style={{
            display: "flex", alignItems: "center", gap: 5,
            background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: 20, padding: "4px 10px",
            color: "#a3e635", fontSize: 11, fontWeight: 700,
          }}>
            <span style={{ fontSize: 9, opacity: 0.7 }}>👥</span>
            {state.players.filter(p => !p.eliminated).length} alive
          </div>

          {/* Draw chain badge */}
          {state.drawStack > 0 ? (
            <div style={{
              display: "flex", alignItems: "center", gap: 5,
              background: "linear-gradient(135deg,#7f1d1d,#991b1b)",
              border: "1px solid #ef4444",
              borderRadius: 20, padding: "4px 12px",
              color: "#fca5a5", fontSize: 11, fontWeight: 800,
              boxShadow: "0 0 12px rgba(239,68,68,0.4)",
              animation: "chain-pulse 0.9s ease infinite",
            }}>
              ⚡ +{state.drawStack} CHAIN
            </div>
          ) : (
            <div style={{
              background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: 20, padding: "4px 10px",
              color: "#4b5563", fontSize: 11, fontWeight: 700,
            }}>168 deck</div>
          )}

          {/* Color indicator pill */}
          <div style={{
            display: "flex", alignItems: "center", gap: 6,
            background: `${cm.bg}22`, border: `1px solid ${cm.bg}66`,
            borderRadius: 20, padding: "4px 12px",
            boxShadow: `0 0 10px ${cm.glow}55`,
          }}>
            <div style={{
              width: 10, height: 10, borderRadius: "50%",
              background: cm.bg, boxShadow: `0 0 8px ${cm.glow}`,
            }} />
            <span style={{ color: cm.bg, fontSize: 11, fontWeight: 700, textTransform: "capitalize" }}>
              {state.currentColor}
            </span>
            <span style={{ color: "rgba(255,255,255,0.5)", fontSize: 13 }}>
              {state.direction === 1 ? "↻" : "↺"}
            </span>
          </div>

          {/* Chat toggle */}
          <button onClick={() => setShowChat(s => !s)} style={{
            background: showChat ? "rgba(99,102,241,0.4)" : "rgba(255,255,255,0.06)",
            color: showChat ? "#a5b4fc" : "#6b7280",
            border: showChat ? "1px solid #6366f1" : "1px solid rgba(255,255,255,0.08)",
            borderRadius: 20, padding: "4px 10px", fontSize: 13, fontFamily: "Nunito",
            cursor: "pointer",
          }}>💬</button>

          {/* Leave */}
          {onLeave && (
            <button onClick={onLeave} style={{
              background: "rgba(127,29,29,0.5)", color: "#fca5a5",
              border: "1px solid #991b1b", borderRadius: 20,
              padding: "4px 12px", fontSize: 11, fontFamily: "Nunito", fontWeight: 700,
              cursor: "pointer",
            }}>✕ Exit</button>
          )}
        </div>
      </div>

      {/* ── Main layout ─────────────────────────────────────────────── */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", padding: "8px 10px", gap: 8, position: "relative", zIndex: 1 }}>

        {/* ── Opponents row ──────────────────────────────────────────── */}
        <div style={{
          display: "flex", gap: 6, overflowX: "auto", paddingBottom: 4,
          justifyContent: opponents.length <= 4 ? "center" : "flex-start",
        }}>
          {opponents.map(p => {
            const isCurrent = state.currentPlayer === p.id;
            return (
              <div key={p.id} style={{
                flexShrink: 0,
                display: "flex", flexDirection: "column", alignItems: "center",
                gap: 4, padding: "8px 10px",
                borderRadius: 16,
                background: isCurrent
                  ? "rgba(59,130,246,0.12)"
                  : "rgba(255,255,255,0.04)",
                border: isCurrent
                  ? "1.5px solid rgba(99,130,246,0.7)"
                  : "1px solid rgba(255,255,255,0.07)",
                minWidth: 68, maxWidth: 92,
                transition: "all 0.35s cubic-bezier(.22,.68,0,1.2)",
                boxShadow: isCurrent ? "0 0 22px rgba(59,130,246,0.25), inset 0 1px 0 rgba(255,255,255,0.08)" : "none",
                position: "relative", overflow: "visible",
              }}>
                {/* Active turn sparkle ring */}
                {isCurrent && !p.eliminated && (
                  <div style={{
                    position: "absolute", inset: -4, borderRadius: 20,
                    border: "2px solid rgba(59,130,246,0.5)",
                    animation: "spin-border 3s linear infinite",
                    pointerEvents: "none",
                  }} />
                )}

                {/* Avatar */}
                <div style={{
                  width: 32, height: 32, borderRadius: "50%",
                  background: p.eliminated
                    ? "rgba(127,29,29,0.5)"
                    : isCurrent
                      ? "linear-gradient(135deg,#2563eb,#7c3aed)"
                      : "linear-gradient(135deg,#1f2937,#374151)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 14, fontWeight: 900, color: "#fff",
                  boxShadow: isCurrent ? "0 0 14px rgba(99,102,241,0.5)" : "none",
                  border: isCurrent ? "2px solid rgba(165,180,252,0.5)" : "2px solid transparent",
                }}>
                  {p.eliminated ? "💀" : p.name[0].toUpperCase()}
                </div>

                {/* Name */}
                <div style={{
                  color: p.eliminated ? "#4b5563" : isCurrent ? "#bfdbfe" : "#9ca3af",
                  fontSize: 10, fontWeight: 700,
                  maxWidth: 76, overflow: "hidden",
                  textOverflow: "ellipsis", whiteSpace: "nowrap",
                }}>{p.name}{p.isBot ? " 🤖" : ""}</div>

                {/* Card backs fan */}
                {!p.eliminated && p.handCount > 0 && (
                  <div style={{ display: "flex", gap: 2, justifyContent: "center", flexWrap: "wrap", maxWidth: 80, marginTop: 2 }}>
                    {Array.from({ length: Math.min(p.handCount, 7) }).map((_, i) => (
                      <CardEl key={i} card={{ id: `back-${p.id}-${i}`, color: "wild", value: "?" }} faceDown size={12} />
                    ))}
                    {p.handCount > 7 && (
                      <span style={{
                        fontSize: 9, color: "#6b7280",
                        background: "rgba(255,255,255,0.07)",
                        borderRadius: 4, padding: "0 3px",
                        lineHeight: "12px",
                      }}>+{p.handCount - 7}</span>
                    )}
                  </div>
                )}

                {/* UNO badge */}
                {p.saidUno && !p.eliminated && (
                  <div style={{
                    background: "linear-gradient(135deg,#fbbf24,#f59e0b)",
                    color: "#1c1917", fontSize: 9, fontWeight: 900,
                    padding: "2px 7px", borderRadius: 6,
                    boxShadow: "0 0 10px rgba(251,191,36,0.5)",
                  }}>UNO!</div>
                )}

                {/* Turn badge */}
                {isCurrent && !p.eliminated && (
                  <div style={{
                    background: "rgba(59,130,246,0.25)", color: "#93c5fd",
                    fontSize: 9, fontWeight: 700, padding: "2px 7px", borderRadius: 6,
                    border: "1px solid rgba(59,130,246,0.4)",
                  }}>▶ TURN</div>
                )}

                {/* Catch! button */}
                {catchWindowOpen && catchTarget?.id === p.id && (
                  <button onClick={() => handleCatch(p.id)} style={{
                    background: "linear-gradient(135deg,#ef4444,#dc2626)",
                    color: "#fff", border: "none", borderRadius: 8,
                    padding: "4px 10px", fontSize: 11, fontWeight: 900,
                    fontFamily: "Nunito", cursor: "pointer",
                    boxShadow: "0 0 14px rgba(239,68,68,0.6)",
                    animation: "chain-pulse 0.5s ease infinite",
                  }}>🎯 Caught!</button>
                )}
              </div>
            );
          })}
        </div>

        {/* ── Felt table ─────────────────────────────────────────────── */}
        <div style={{
          flex: 1, display: "flex", alignItems: "center", justifyContent: "center",
          gap: "clamp(18px,5vw,56px)",
          background: "radial-gradient(ellipse 80% 90% at 50% 50%, #14532d 0%, #0c3a1e 55%, #061610 100%)",
          borderRadius: 28,
          border: `2px solid rgba(22,101,52,0.6)`,
          padding: "20px 24px", position: "relative", minHeight: 170,
          boxShadow: "0 10px 40px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.04), inset 0 -1px 0 rgba(0,0,0,0.3)",
        }}>
          {/* Felt stitching border */}
          <div style={{
            position: "absolute", inset: 6, borderRadius: 22,
            border: "1px dashed rgba(22,101,52,0.35)",
            pointerEvents: "none",
          }} />

          {/* Turn status floating chip */}
          <div style={{
            position: "absolute", top: 10, left: "50%", transform: "translateX(-50%)",
            display: "flex", alignItems: "center", gap: 6,
          }}>
            {state.drawStack > 0 ? (
              <div style={{
                background: "linear-gradient(135deg,rgba(127,29,29,0.9),rgba(153,27,27,0.9))",
                backdropFilter: "blur(8px)",
                color: "#fca5a5", borderRadius: 12, padding: "4px 14px",
                fontSize: 13, fontWeight: 900,
                border: "1px solid rgba(239,68,68,0.5)",
                boxShadow: "0 0 16px rgba(239,68,68,0.35)",
              }}>⚡ +{state.drawStack} draw chain</div>
            ) : (
              <div style={{
                background: "rgba(0,0,0,0.45)", backdropFilter: "blur(8px)",
                color: isMyTurn ? "#6ee7b7" : "#6b7280",
                borderRadius: 12, padding: "4px 12px", fontSize: 12, fontWeight: 700,
                border: isMyTurn ? "1px solid rgba(52,211,153,0.4)" : "1px solid rgba(255,255,255,0.07)",
              }}>
                {isMyTurn ? "🎯 Your turn!" : `⏳ ${state.players[state.currentPlayer]?.name}'s turn`}
              </div>
            )}
          </div>

          {/* Draw pile */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
            <div
              onClick={isMyTurn && state.phase === "play" ? handleDraw : undefined}
              style={{
                cursor: isMyTurn && state.phase === "play" ? "pointer" : "default",
                transform: "scale(1)", transition: "transform 0.15s",
                borderRadius: 10,
                filter: isMyTurn && state.phase === "play"
                  ? "drop-shadow(0 0 14px rgba(99,102,241,0.7))"
                  : "drop-shadow(0 4px 8px rgba(0,0,0,0.5))",
              }}
              onMouseEnter={e => { if (isMyTurn && state.phase === "play") e.currentTarget.style.transform = "scale(1.06)"; }}
              onMouseLeave={e => { e.currentTarget.style.transform = "scale(1)"; }}
            >
              <CardEl card={{ id: "back-draw", color: "wild", value: "?" }} faceDown size={74} />
            </div>
            <div style={{
              background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)",
              borderRadius: 8, padding: "2px 8px", color: "#4ade80",
              fontSize: 10, fontWeight: 700, border: "1px solid rgba(74,222,128,0.2)",
              whiteSpace: "nowrap",
            }}>{state.deck?.length || 0} cards</div>
          </div>

          {/* VS separator glow dot */}
          <div style={{
            width: 8, height: 8, borderRadius: "50%",
            background: cm.bg, boxShadow: `0 0 16px ${cm.glow}, 0 0 32px ${cm.glow}44`,
            flexShrink: 0,
          }} />

          {/* Discard pile */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
            <div style={{
              position: "relative",
              filter: `drop-shadow(0 0 18px ${cm.glow}88)`,
              transition: "filter 0.5s",
            }}>
              {topCard && <CardEl card={topCard} size={74} chosenColor={state.currentColor} />}
              {state.drawStack > 0 && (
                <div style={{
                  position: "absolute", top: -10, right: -10,
                  background: "linear-gradient(135deg,#ef4444,#dc2626)",
                  color: "#fff", borderRadius: "50%",
                  width: 26, height: 26,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 12, fontWeight: 900,
                  boxShadow: "0 0 12px rgba(239,68,68,0.6)",
                  border: "2px solid rgba(255,255,255,0.2)",
                }}>+{state.drawStack}</div>
              )}
            </div>
            <div style={{
              background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)",
              borderRadius: 8, padding: "2px 8px",
              color: cm.bg, fontSize: 10, fontWeight: 700,
              border: `1px solid ${cm.bg}44`, whiteSpace: "nowrap",
              textTransform: "capitalize",
            }}>{state.currentColor} {state.direction === 1 ? "↻" : "↺"}</div>
          </div>
        </div>

        {/* ── My hand panel ──────────────────────────────────────────── */}
        <div style={{
          background: "rgba(13,21,40,0.9)",
          backdropFilter: "blur(12px)",
          borderRadius: 22,
          border: isMyTurn
            ? `1.5px solid rgba(59,130,246,0.6)`
            : "1px solid rgba(255,255,255,0.07)",
          padding: "12px 12px 10px",
          boxShadow: isMyTurn
            ? "0 0 28px rgba(59,130,246,0.18), inset 0 1px 0 rgba(255,255,255,0.06)"
            : "inset 0 1px 0 rgba(255,255,255,0.04)",
          transition: "border 0.4s, box-shadow 0.4s",
        }}>
          {/* Status row */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              {me?.eliminated ? (
                <span style={{ color: "#ef4444", fontWeight: 800, fontSize: 13 }}>💀 Eliminated — Spectating</span>
              ) : isMyTurn ? (
                <span style={{
                  color: "#60a5fa", fontWeight: 800, fontSize: 13,
                  textShadow: "0 0 10px rgba(96,165,250,0.5)",
                }}>
                  🎯 Your turn!
                  {state.drawStack > 0 && (
                    <span style={{ color: "#fca5a5", fontWeight: 700 }}> — stack or draw +{state.drawStack}</span>
                  )}
                </span>
              ) : (
                <span style={{ color: "#374151", fontWeight: 700, fontSize: 13 }}>⏳ Waiting for your turn…</span>
              )}
            </div>
            <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
              {unoWindowOpen && (
                <button onClick={handleUno} style={{
                  background: "linear-gradient(135deg,#b91c1c,#dc2626)",
                  color: "#fff", border: "none", borderRadius: 12,
                  padding: "7px 16px", fontWeight: 900, fontSize: 14, fontFamily: "Nunito",
                  cursor: "pointer",
                  boxShadow: "0 0 18px rgba(220,38,38,0.5)",
                  animation: "chain-pulse 0.6s ease infinite",
                }}>UNO! ({unoCountdown}s)</button>
              )}
            </div>
          </div>

          {/* Card grid */}
          {me?.eliminated ? (
            <div style={{
              textAlign: "center", color: "#374151", padding: "14px 0", fontSize: 13,
              background: "rgba(0,0,0,0.2)", borderRadius: 12,
            }}>
              You reached the mercy limit. Spectating…
            </div>
          ) : (
            <>
              <div style={{
                display: "flex", flexWrap: "wrap", gap: 5,
                justifyContent: "center", maxHeight: 190, overflowY: "auto",
                padding: "4px 2px",
              }}>
                {(me?.hand || []).map(card => {
                  const playable = canPlayCard(card);
                  const isSel = selected.includes(card.id);
                  const noStack = ["0", "7", "discardAll", "roulette"];
                  const firstSel = selected.length > 0 ? me.hand.find(c => c.id === selected[0]) : null;
                  const isMultiAddable = isMyTurn && !isSel && firstSel &&
                    !noStack.includes(card.value) && card.value === firstSel.value;
                  const isClickable = playable || isMultiAddable;
                  return (
                    <div key={card.id} style={{
                      transform: isSel ? "translateY(-10px) scale(1.06)" : "none",
                      transition: "transform 0.18s cubic-bezier(.22,.68,0,1.3)",
                      filter: isSel ? "drop-shadow(0 0 10px rgba(255,255,255,0.5))" : "none",
                    }}>
                      <CardEl card={card} size={54}
                        selected={isSel}
                        playable={playable || !isMyTurn || isMultiAddable}
                        onClick={isClickable ? () => handleCardClick(card) : undefined}
                        style={{ cursor: isClickable && isMyTurn ? "pointer" : "default" }}
                      />
                    </div>
                  );
                })}
              </div>

              {/* Play / cancel bar */}
              {selected.length > 0 && (
                <div style={{ display: "flex", gap: 8, justifyContent: "center", marginTop: 10 }}>
                  <button onClick={() => handlePlaySelected()} style={{
                    background: "linear-gradient(135deg,#2563eb,#6366f1)",
                    color: "#fff", border: "none", borderRadius: 12,
                    padding: "9px 22px", fontWeight: 900, fontSize: 14, fontFamily: "Nunito",
                    cursor: "pointer",
                    boxShadow: "0 4px 18px rgba(99,102,241,0.45)",
                    letterSpacing: 0.4,
                  }}>▶ Play {selected.length} card{selected.length > 1 ? "s" : ""}</button>
                  <button onClick={() => setSelected([])} style={{
                    background: "rgba(255,255,255,0.05)", color: "#6b7280",
                    border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12,
                    padding: "9px 16px", fontSize: 13, fontFamily: "Nunito", cursor: "pointer",
                  }}>✕</button>
                </div>
              )}

              <div style={{
                color: "#1f2a40", fontSize: 10, textAlign: "center", marginTop: 7,
                letterSpacing: 0.3,
              }}>
                tap to select · tap selected to play · same symbol = chain
              </div>
            </>
          )}
        </div>
      </div>

      {/* ── Game log strip ──────────────────────────────────────────── */}
      <div ref={logRef} style={{
        height: 40, overflowY: "auto",
        background: "rgba(4,8,18,0.7)",
        backdropFilter: "blur(8px)",
        borderTop: "1px solid rgba(255,255,255,0.04)",
        padding: "4px 16px",
        position: "relative", zIndex: 2,
      }}>
        {log.slice(-4).map((m, i) => (
          <div key={i} style={{
            color: i === log.slice(-4).length - 1 ? "#374151" : "#1e2a3a",
            fontSize: 10, lineHeight: "16px", fontFamily: "Nunito",
            whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
          }}>{m}</div>
        ))}
      </div>

      {/* ── Chat drawer ─────────────────────────────────────────────── */}
      {showChat && (
        <div style={{
          position: "fixed", bottom: 0, right: 0, width: "min(340px, 96vw)",
          background: "rgba(9,13,24,0.92)", backdropFilter: "blur(20px)",
          border: "1px solid rgba(255,255,255,0.09)",
          borderRadius: "20px 0 0 0",
          boxShadow: "0 -12px 48px rgba(0,0,0,0.6)",
          display: "flex", flexDirection: "column",
          maxHeight: "52vh", zIndex: 200,
          animation: "slide-up 0.25s cubic-bezier(.22,.68,0,1.2)",
        }}>
          <div style={{
            padding: "10px 16px", borderBottom: "1px solid rgba(255,255,255,0.07)",
            display: "flex", justifyContent: "space-between", alignItems: "center",
          }}>
            <span style={{ fontWeight: 700, fontSize: 13, color: "#e0e7ff" }}>💬 Chat</span>
            <button onClick={() => setShowChat(false)} style={{
              background: "transparent", color: "#4b5563", border: "none",
              fontSize: 18, padding: 0, cursor: "pointer", lineHeight: 1,
            }}>✕</button>
          </div>
          <div ref={chatRef} style={{
            flex: 1, overflowY: "auto", padding: "12px 14px",
            display: "flex", flexDirection: "column", gap: 8,
          }}>
            {chat.length === 0 && (
              <div style={{ color: "#1f2a3a", fontSize: 12, textAlign: "center", padding: "20px 0" }}>
                No messages yet
              </div>
            )}
            {chat.map((m, i) => (
              <div key={i} style={{ fontSize: 12, lineHeight: 1.4 }}>
                <span style={{ color: "#818cf8", fontWeight: 700 }}>{m.name}: </span>
                <span style={{ color: "#9ca3af" }}>{m.message}</span>
              </div>
            ))}
          </div>
          <form onSubmit={sendChat} style={{
            display: "flex", padding: "8px 12px", gap: 8,
            borderTop: "1px solid rgba(255,255,255,0.06)",
          }}>
            <input value={chatMsg} onChange={e => setChatMsg(e.target.value)}
              placeholder="Message…"
              style={{
                flex: 1, background: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: 10, padding: "7px 12px", color: "#f9fafb", fontSize: 12,
                fontFamily: "Nunito", outline: "none",
              }}
            />
            <button type="submit" style={{
              background: "linear-gradient(135deg,#4f46e5,#7c3aed)",
              color: "#fff", border: "none",
              borderRadius: 10, padding: "7px 14px", fontSize: 12, fontFamily: "Nunito",
              cursor: "pointer",
              boxShadow: "0 0 10px rgba(79,70,229,0.4)",
            }}>Send</button>
          </form>
        </div>
      )}
    </div>
  );
}
