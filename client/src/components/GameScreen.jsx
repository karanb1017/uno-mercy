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
      minHeight: "100vh", background: "#080e18",
      display: "flex", flexDirection: "column",
      fontFamily: "Nunito, sans-serif", userSelect: "none",
      maxWidth: "100vw", overflow: "hidden",
    }}>
      {/* Modals */}
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

      {/* Header bar */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "10px 14px",
        background: "#0d1520", borderBottom: "1px solid #1f2937",
      }}>
        <div style={{ fontFamily: "Fredoka One", fontSize: 18, color: "#818cf8" }}>
          UNO⚡
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <div style={{
            background: "#1f2937", borderRadius: 8, padding: "4px 10px",
            color: "#6b7280", fontSize: 11, fontWeight: 700,
          }}>
            {state.players.filter(p => !p.eliminated).length} alive
          </div>
          <div style={{
            background: state.chainActive ? "#7f1d1d" : "#1f2937",
            borderRadius: 8, padding: "4px 10px",
            color: state.chainActive ? "#fca5a5" : "#6b7280",
            fontSize: 11, fontWeight: 700,
          }}>
            {state.drawStack > 0 ? `+${state.drawStack} chain` : "168 deck"}
          </div>
          <button onClick={() => setShowChat(s => !s)} style={{
            background: showChat ? "#4f46e5" : "#1f2937",
            color: "#fff", border: "none", borderRadius: 8,
            padding: "4px 10px", fontSize: 12, fontFamily: "Nunito",
          }}>💬</button>
          {onLeave && (
            <button onClick={onLeave} style={{
              background: "#7f1d1d", color: "#fca5a5",
              border: "1px solid #991b1b", borderRadius: 8,
              padding: "4px 10px", fontSize: 12, fontFamily: "Nunito", fontWeight: 700,
              cursor: "pointer",
            }}>✕ Exit</button>
          )}
        </div>
      </div>

      <div style={{ flex: 1, display: "flex", flexDirection: "column", padding: "10px 12px", gap: 10 }}>

        {/* Opponents grid */}
        <div style={{
          display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "center",
        }}>
          {opponents.map(p => {
            const isCurrent = state.currentPlayer === p.id;
            const pCm = p.hand?.length > 0 ? null : null;
            return (
              <div key={p.id} style={{
                display: "flex", flexDirection: "column", alignItems: "center",
                gap: 4, padding: "8px 12px", borderRadius: 14,
                background: isCurrent ? "#0f1f3d" : "#111827",
                border: isCurrent ? "2px solid #3b82f6" : "1px solid #1f2937",
                minWidth: 74, maxWidth: 100,
                transition: "all 0.3s",
                boxShadow: isCurrent ? "0 0 16px rgba(59,130,246,0.3)" : "none",
              }}>
                <div style={{
                  width: 30, height: 30, borderRadius: "50%",
                  background: p.eliminated ? "#7f1d1d" : isCurrent ? "#1d4ed8" : "#374151",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 13, fontWeight: 800, color: "#fff",
                }}>{p.eliminated ? "💀" : p.name[0].toUpperCase()}</div>
                <div style={{
                  color: p.eliminated ? "#6b7280" : "#d1d5db",
                  fontSize: 10, fontWeight: 700,
                  maxWidth: 80, overflow: "hidden",
                  textOverflow: "ellipsis", whiteSpace: "nowrap",
                }}>{p.name}</div>
                {!p.eliminated && (
                  <div style={{ display: "flex", gap: 2, flexWrap: "wrap", justifyContent: "center", maxWidth: 84 }}>
                    {Array.from({ length: Math.min(p.handCount, 8) }).map((_, i) => (
                      <CardEl key={i} card={{ id: `back-${p.id}-${i}`, color: "wild", value: "?" }} faceDown size={14} />
                    ))}
                    {p.handCount > 8 && <span style={{ color: "#6b7280", fontSize: 9 }}>+{p.handCount - 8}</span>}
                  </div>
                )}
                {p.saidUno && !p.eliminated && (
                  <div style={{
                    background: "#fbbf24", color: "#1c1917",
                    fontSize: 9, fontWeight: 900, padding: "2px 6px", borderRadius: 5,
                  }}>UNO!</div>
                )}
                {isCurrent && !p.eliminated && (
                  <div style={{
                    background: "#1d4ed8", color: "#93c5fd",
                    fontSize: 9, fontWeight: 700, padding: "2px 6px", borderRadius: 5,
                  }}>▶ TURN</div>
                )}
                {/* Catch button */}
                {catchWindowOpen && catchTarget?.id === p.id && (
                  <button onClick={() => handleCatch(p.id)} style={{
                    background: "#ef4444", color: "#fff",
                    border: "none", borderRadius: 6,
                    padding: "3px 8px", fontSize: 10, fontWeight: 800,
                    fontFamily: "Nunito",
                    animation: "pulse-ring 0.5s infinite",
                  }}>Caught!</button>
                )}
              </div>
            );
          })}
        </div>

        {/* Table center */}
        <div style={{
          flex: 1, display: "flex", alignItems: "center", justifyContent: "center",
          gap: "clamp(16px,4vw,40px)",
          background: "radial-gradient(ellipse at center, #14532d 0%, #052e16 100%)",
          borderRadius: 24, border: "2px solid #166534",
          padding: "16px 20px", position: "relative", minHeight: 160,
          boxShadow: "0 8px 32px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.05)",
        }}>
          {/* Color indicator + direction */}
          <div style={{ position: "absolute", top: 10, left: 14, display: "flex", gap: 6, alignItems: "center" }}>
            <div style={{
              width: 18, height: 18, borderRadius: "50%",
              background: cm.bg, border: "2px solid rgba(255,255,255,0.4)",
              boxShadow: `0 0 10px ${cm.glow}`,
            }} />
            <span style={{ color: cm.bg, fontSize: 11, fontWeight: 700, textTransform: "capitalize" }}>
              {state.currentColor}
            </span>
          </div>
          <div style={{ position: "absolute", top: 10, right: 14, color: "#86efac", fontSize: 20, fontWeight: 700 }}>
            {state.direction === 1 ? "↻" : "↺"}
          </div>

          {/* Turn indicator */}
          <div style={{ position: "absolute", bottom: 10, left: "50%", transform: "translateX(-50%)", display: "flex", alignItems: "center", gap: 6 }}>
            {state.drawStack > 0 ? (
              <div style={{
                background: "#7f1d1d", color: "#fca5a5",
                borderRadius: 8, padding: "3px 10px", fontSize: 12, fontWeight: 800,
                boxShadow: "0 0 12px rgba(239,68,68,0.4)",
              }}>⚡ Draw stack: +{state.drawStack}</div>
            ) : (
              <div style={{ color: "#4ade80", fontSize: 11, fontWeight: 600 }}>
                {isMyTurn ? "🎯 Your turn" : `${state.players[state.currentPlayer]?.name}'s turn`}
              </div>
            )}
          </div>

          {/* Draw pile */}
          <div style={{ position: "relative" }}>
            <div
              onClick={isMyTurn && state.phase === "play" ? handleDraw : undefined}
              title={isMyTurn ? "Click to draw" : ""}
              style={{ cursor: isMyTurn && state.phase === "play" ? "pointer" : "not-allowed" }}
            >
              <CardEl card={{ id: "back", color: "wild", value: "?" }} faceDown size={68}
                style={{ filter: isMyTurn ? "drop-shadow(0 0 10px rgba(59,130,246,0.5))" : "none" }}
              />
            </div>
            <div style={{
              position: "absolute", bottom: -18, left: "50%",
              transform: "translateX(-50%)", whiteSpace: "nowrap",
              color: "#4ade80", fontSize: 10, fontWeight: 600,
            }}>{state.deck?.length || 0} left</div>
          </div>

          {/* Discard pile */}
          <div style={{ position: "relative" }}>
            {topCard && <CardEl card={topCard} size={68} chosenColor={state.currentColor} />}
            {state.drawStack > 0 && (
              <div style={{
                position: "absolute", top: -8, right: -8,
                background: "#ef4444", color: "#fff",
                borderRadius: "50%", width: 24, height: 24,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 12, fontWeight: 900,
                boxShadow: "0 0 10px rgba(239,68,68,0.5)",
              }}>+{state.drawStack}</div>
            )}
          </div>
        </div>

        {/* My hand area */}
        <div style={{
          background: "#0d1520", borderRadius: 20,
          border: isMyTurn ? "2px solid #3b82f6" : "1px solid #1f2937",
          padding: "12px 12px 10px",
          transition: "border 0.3s",
          boxShadow: isMyTurn ? "0 0 20px rgba(59,130,246,0.2)" : "none",
        }}>
          {/* Status row */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              {me?.eliminated ? (
                <span style={{ color: "#ef4444", fontWeight: 800, fontSize: 13 }}>💀 Eliminated</span>
              ) : isMyTurn ? (
                <span style={{ color: "#60a5fa", fontWeight: 800, fontSize: 13 }}>
                  🎯 Your turn
                  {state.drawStack > 0 && <span style={{ color: "#fca5a5" }}> — draw +{state.drawStack} or stack!</span>}
                </span>
              ) : (
                <span style={{ color: "#4b5563", fontWeight: 700, fontSize: 13 }}>⏳ Waiting...</span>
              )}
            </div>
            <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
              {unoWindowOpen && (
                <button onClick={handleUno} style={{
                  background: "#7f1d1d", color: "#fca5a5",
                  border: "1px solid #991b1b", borderRadius: 10,
                  padding: "6px 14px", fontWeight: 900, fontSize: 14, fontFamily: "Nunito",
                }}>UNO! ({unoCountdown}s)</button>
              )}
            </div>
          </div>

          {/* Cards */}
          {me?.eliminated ? (
            <div style={{ textAlign: "center", color: "#374151", padding: "12px 0", fontSize: 13 }}>
              You reached the mercy limit. Spectating...
            </div>
          ) : (
            <>
              <div style={{
                display: "flex", flexWrap: "wrap", gap: 4,
                justifyContent: "center", maxHeight: 180, overflowY: "auto",
                padding: "4px 0",
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
                    <CardEl key={card.id} card={card} size={52}
                      selected={isSel}
                      playable={playable || !isMyTurn || isMultiAddable}
                      onClick={isClickable ? () => handleCardClick(card) : undefined}
                      style={{ cursor: isClickable && isMyTurn ? "pointer" : "not-allowed" }}
                    />
                  );
                })}
              </div>
              {selected.length > 0 && (
                <div style={{ display: "flex", gap: 8, justifyContent: "center", marginTop: 8 }}>
                  <button onClick={() => handlePlaySelected()} style={{
                    background: "linear-gradient(135deg, #3b82f6, #6366f1)",
                    color: "#fff", border: "none", borderRadius: 10,
                    padding: "8px 20px", fontWeight: 800, fontSize: 13, fontFamily: "Nunito",
                    boxShadow: "0 4px 12px rgba(59,130,246,0.4)",
                  }}>▶ Play {selected.length} card{selected.length > 1 ? "s" : ""}</button>
                  <button onClick={() => setSelected([])} style={{
                    background: "transparent", color: "#6b7280",
                    border: "1px solid #374151", borderRadius: 10,
                    padding: "8px 14px", fontSize: 12, fontFamily: "Nunito",
                  }}>✕</button>
                </div>
              )}
              <div style={{ color: "#374151", fontSize: 10, textAlign: "center", marginTop: 6 }}>
                Tap once to select · Tap again to play · Same symbol = multi-select
              </div>
            </>
          )}
        </div>
      </div>

      {/* Game log */}
      <div ref={logRef} style={{
        height: 44, overflowY: "auto", background: "#050a12",
        borderTop: "1px solid #0f172a", padding: "5px 14px",
      }}>
        {log.slice(-5).map((m, i) => (
          <div key={i} style={{ color: "#1f2937", fontSize: 10, lineHeight: 1.8, fontFamily: "Nunito" }}>{m}</div>
        ))}
      </div>

      {/* Chat overlay */}
      {showChat && (
        <div style={{
          position: "fixed", bottom: 0, right: 0, width: "min(320px, 95vw)",
          background: "#111827", border: "1px solid #1f2937",
          borderRadius: "16px 0 0 0",
          boxShadow: "0 -8px 32px rgba(0,0,0,0.5)",
          display: "flex", flexDirection: "column",
          maxHeight: "50vh", zIndex: 100,
        }}>
          <div style={{
            padding: "10px 14px", borderBottom: "1px solid #1f2937",
            display: "flex", justifyContent: "space-between", alignItems: "center",
          }}>
            <span style={{ fontWeight: 700, fontSize: 13 }}>💬 Chat</span>
            <button onClick={() => setShowChat(false)} style={{
              background: "transparent", color: "#6b7280", border: "none", fontSize: 16, padding: 0,
            }}>✕</button>
          </div>
          <div ref={chatRef} style={{ flex: 1, overflowY: "auto", padding: 12, display: "flex", flexDirection: "column", gap: 6 }}>
            {chat.length === 0 && <div style={{ color: "#374151", fontSize: 12, textAlign: "center" }}>No messages yet</div>}
            {chat.map((m, i) => (
              <div key={i} style={{ fontSize: 12 }}>
                <span style={{ color: "#818cf8", fontWeight: 700 }}>{m.name}: </span>
                <span style={{ color: "#9ca3af" }}>{m.message}</span>
              </div>
            ))}
          </div>
          <form onSubmit={sendChat} style={{ display: "flex", padding: "8px 10px", gap: 6, borderTop: "1px solid #1f2937" }}>
            <input value={chatMsg} onChange={e => setChatMsg(e.target.value)}
              placeholder="Message..."
              style={{
                flex: 1, background: "#1f2937", border: "1px solid #374151",
                borderRadius: 8, padding: "6px 10px", color: "#f9fafb", fontSize: 12,
                fontFamily: "Nunito",
              }}
            />
            <button type="submit" style={{
              background: "#4f46e5", color: "#fff", border: "none",
              borderRadius: 8, padding: "6px 12px", fontSize: 12, fontFamily: "Nunito",
            }}>Send</button>
          </form>
        </div>
      )}
    </div>
  );
}
