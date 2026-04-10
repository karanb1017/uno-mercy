import React, { useState, useRef, useEffect } from "react";

export default function LobbyScreen({ lobby, isHost, myName, onStart, onKick, onUpdateSettings, onChat, onLeave, onAddBot, onRemoveBot }) {
  const [chat, setChat] = useState([]);
  const [msg, setMsg] = useState("");
  const [copied, setCopied] = useState(false);
  const chatRef = useRef(null);

  useEffect(() => {
    if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight;
  }, [chat]);

  useEffect(() => {
    if (onChat) {
      const handler = (msg) => setChat(c => [...c, msg]);
      onChat.subscribe(handler);
      return () => onChat.unsubscribe(handler);
    }
  }, [onChat]);

  function copyCode() {
    navigator.clipboard.writeText(lobby.roomCode).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  const canStart = lobby.players.length >= 2;

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(160deg,#070c18 0%,#0b1226 50%,#070c18 100%)",
      display: "flex", flexDirection: "column", alignItems: "center",
      padding: "20px 16px", gap: 14,
      fontFamily: "Nunito, sans-serif",
      position: "relative", overflow: "hidden",
    }}>
      {/* Ambient glow */}
      <div style={{
        position: "absolute", top: "20%", left: "50%", transform: "translateX(-50%)",
        width: 500, height: 300,
        background: "radial-gradient(ellipse, rgba(99,102,241,0.07) 0%, transparent 65%)",
        pointerEvents: "none",
      }} />

      {/* Header */}
      <div style={{ textAlign: "center", position: "relative", zIndex: 1 }}>
        <div style={{
          fontFamily: "'Fredoka One', cursive", fontSize: 30,
          background: "linear-gradient(120deg,#e0e7ff,#818cf8,#c084fc)",
          WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
        }}>
          UNO<span style={{ WebkitTextFillColor: "#f59e0b" }}>⚡</span> Mercy
        </div>
        <div style={{ color: "#1f2a40", fontSize: 11, marginTop: 2 }}>Waiting for players…</div>
      </div>

      {/* Room code display */}
      <div style={{
        background: "rgba(9,15,30,0.92)", backdropFilter: "blur(16px)",
        borderRadius: 24, padding: "20px 28px",
        border: "1px solid rgba(129,140,248,0.25)",
        textAlign: "center", width: "100%", maxWidth: 400,
        boxShadow: "0 12px 40px rgba(0,0,0,0.5), 0 0 30px rgba(129,140,248,0.08), inset 0 1px 0 rgba(255,255,255,0.06)",
        position: "relative", zIndex: 1,
      }}>
        <div style={{ color: "#2d3748", fontSize: 10, fontWeight: 700, letterSpacing: 2.5, marginBottom: 8 }}>
          ROOM CODE
        </div>
        <div style={{
          fontFamily: "'Fredoka One', cursive", fontSize: 54, color: "#818cf8",
          letterSpacing: 14, lineHeight: 1,
          textShadow: "0 0 40px rgba(129,140,248,0.45)",
        }}>
          {lobby.roomCode}
        </div>
        <button onClick={copyCode} style={{
          marginTop: 14,
          background: copied ? "rgba(16,185,129,0.15)" : "rgba(255,255,255,0.05)",
          color: copied ? "#10b981" : "#9ca3af",
          border: copied ? "1px solid rgba(16,185,129,0.4)" : "1px solid rgba(255,255,255,0.1)",
          borderRadius: 12, padding: "8px 22px", fontSize: 12,
          fontWeight: 700, fontFamily: "Nunito", cursor: "pointer",
          transition: "all 0.25s",
        }}>
          {copied ? "✓ Copied!" : "📋 Copy Code"}
        </button>
        <div style={{ color: "#1a2535", fontSize: 11, marginTop: 8 }}>
          Share this code with friends to join
        </div>
      </div>

      <div style={{ display: "flex", gap: 14, width: "100%", maxWidth: 400, flexDirection: "column", position: "relative", zIndex: 1 }}>
        {/* Players panel */}
        <div style={{
          background: "rgba(9,15,30,0.92)", backdropFilter: "blur(16px)",
          borderRadius: 24, padding: 20,
          border: "1px solid rgba(255,255,255,0.07)",
          boxShadow: "0 8px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.05)",
        }}>
          <div style={{ color: "#2d3748", fontSize: 10, fontWeight: 700, letterSpacing: 2, marginBottom: 12 }}>
            PLAYERS ({lobby.players.length}/{lobby.settings?.maxPlayers || 6})
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {lobby.players.map(p => (
              <div key={p.id} style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                padding: "10px 14px", borderRadius: 14,
                background: p.name === myName
                  ? "rgba(79,70,229,0.12)"
                  : "rgba(255,255,255,0.04)",
                border: p.name === myName
                  ? "1px solid rgba(79,70,229,0.4)"
                  : "1px solid rgba(255,255,255,0.06)",
                transition: "all 0.2s",
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{
                    width: 34, height: 34, borderRadius: "50%", flexShrink: 0,
                    background: p.isBot
                      ? "rgba(30,58,95,0.7)"
                      : p.isHost
                        ? "linear-gradient(135deg,#d97706,#ef4444)"
                        : "linear-gradient(135deg,#1f2937,#374151)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 15, fontWeight: 900, color: "#fff",
                    border: p.name === myName ? "2px solid rgba(99,102,241,0.5)" : "2px solid transparent",
                  }}>
                    {p.isBot ? "🤖" : p.isHost ? "👑" : p.name[0].toUpperCase()}
                  </div>
                  <div>
                    <div style={{ color: "#f9fafb", fontWeight: 700, fontSize: 14, display: "flex", alignItems: "center", gap: 5 }}>
                      {p.name}
                      {p.name === myName && (
                        <span style={{
                          color: "#818cf8", fontSize: 10, fontWeight: 700,
                          background: "rgba(99,102,241,0.15)", borderRadius: 6,
                          padding: "1px 6px", border: "1px solid rgba(99,102,241,0.3)",
                        }}>you</span>
                      )}
                    </div>
                    <div style={{ color: "#2d3748", fontSize: 11 }}>
                      {p.isBot ? "Bot" : p.isHost ? "Host" : "Player"}
                    </div>
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <div style={{
                    width: 8, height: 8, borderRadius: "50%",
                    background: p.connected !== false ? "#22c55e" : "#ef4444",
                    boxShadow: p.connected !== false ? "0 0 6px #22c55e" : "none",
                  }} />
                  {isHost && !p.isHost && !p.isBot && (
                    <button onClick={() => onKick(p.socketId)} style={{
                      background: "rgba(239,68,68,0.08)", color: "#6b7280",
                      border: "1px solid rgba(255,255,255,0.08)", borderRadius: 7,
                      padding: "2px 9px", fontSize: 11, fontFamily: "Nunito", cursor: "pointer",
                    }}>Kick</button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {lobby.players.length < 2 && (
            <div style={{
              marginTop: 12, padding: "10px 14px", borderRadius: 12,
              background: "rgba(255,255,255,0.03)", color: "#1f2a40",
              fontSize: 12, textAlign: "center",
              border: "1px dashed rgba(255,255,255,0.06)",
            }}>
              Waiting for at least 2 players…
            </div>
          )}

          {/* Bot controls */}
          {isHost && (
            <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
              <button onClick={onAddBot} style={{
                flex: 1,
                background: "rgba(30,58,95,0.4)", color: "#93c5fd",
                border: "1px solid rgba(30,64,175,0.5)", borderRadius: 11,
                padding: "9px", fontSize: 12, fontWeight: 700, fontFamily: "Nunito", cursor: "pointer",
                transition: "all 0.15s",
              }}
              onMouseEnter={e => { e.currentTarget.style.background = "rgba(30,58,95,0.65)"; }}
              onMouseLeave={e => { e.currentTarget.style.background = "rgba(30,58,95,0.4)"; }}
              >🤖 Add Bot</button>
              <button onClick={onRemoveBot} style={{
                flex: 1,
                background: "rgba(255,255,255,0.04)", color: "#4b5563",
                border: "1px solid rgba(255,255,255,0.08)", borderRadius: 11,
                padding: "9px", fontSize: 12, fontWeight: 700, fontFamily: "Nunito", cursor: "pointer",
              }}>Remove Bot</button>
            </div>
          )}
        </div>

        {/* Stats row */}
        <div style={{
          background: "rgba(9,15,30,0.85)", backdropFilter: "blur(12px)",
          borderRadius: 18, padding: "14px 20px",
          border: "1px solid rgba(255,255,255,0.06)",
          display: "flex", gap: 0, justifyContent: "center",
        }}>
          {[
            { val: lobby.settings?.mercyLimit || 25, label: "MERCY CARDS" },
            { val: lobby.settings?.maxPlayers || 6, label: "MAX PLAYERS" },
            { val: 168, label: "CARD DECK" },
          ].map((s, i) => (
            <React.Fragment key={s.label}>
              {i > 0 && <div style={{ width: 1, background: "rgba(255,255,255,0.07)", margin: "0 16px" }} />}
              <div style={{ textAlign: "center", flex: 1 }}>
                <div style={{
                  color: "#818cf8", fontSize: 22, fontWeight: 800,
                  fontFamily: "'Fredoka One', cursive",
                  textShadow: "0 0 16px rgba(129,140,248,0.4)",
                }}>{s.val}</div>
                <div style={{ color: "#1f2a40", fontSize: 9, fontWeight: 700, letterSpacing: 1 }}>{s.label}</div>
              </div>
            </React.Fragment>
          ))}
        </div>

        {/* Action */}
        {isHost ? (
          <button onClick={onStart} disabled={!canStart} style={{
            width: "100%",
            background: canStart
              ? "linear-gradient(135deg,#d97706,#ef4444)"
              : "rgba(255,255,255,0.05)",
            color: canStart ? "#fff" : "#374151",
            border: canStart ? "none" : "1px solid rgba(255,255,255,0.06)",
            borderRadius: 16, padding: "17px",
            fontSize: 17, fontWeight: 900, fontFamily: "Nunito",
            cursor: canStart ? "pointer" : "default",
            boxShadow: canStart ? "0 6px 28px rgba(239,68,68,0.4)" : "none",
            transition: "all 0.25s",
          }}>
            {canStart ? "🚀 Start Game" : "Need 2+ players to start"}
          </button>
        ) : (
          <div style={{
            padding: "15px", borderRadius: 14,
            background: "rgba(255,255,255,0.03)",
            textAlign: "center", color: "#2d3748", fontSize: 13, fontWeight: 600,
            border: "1px dashed rgba(255,255,255,0.07)",
          }}>
            ⏳ Waiting for host to start the game…
          </div>
        )}

        <button onClick={onLeave} style={{
          background: "transparent", color: "#1f2a40",
          border: "1px solid rgba(255,255,255,0.07)", borderRadius: 12,
          padding: "11px", fontSize: 13, fontFamily: "Nunito", cursor: "pointer",
        }}>← Leave Room</button>
      </div>
    </div>
  );
}
