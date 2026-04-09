import React, { useState, useRef, useEffect } from "react";

export default function LobbyScreen({ lobby, isHost, myName, onStart, onKick, onUpdateSettings, onChat, onLeave, onAddBot, onRemoveBot }) {
  const [chat, setChat] = useState([]);
  const [msg, setMsg] = useState("");
  const [copied, setCopied] = useState(false);
  const chatRef = useRef(null);

  useEffect(() => {
    if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight;
  }, [chat]);

  // Listen for chat via prop callback
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
      background: "linear-gradient(160deg, #0a0f1a 0%, #111827 100%)",
      display: "flex", flexDirection: "column", alignItems: "center",
      padding: "20px 16px", gap: 16,
    }}>
      {/* Header */}
      <div style={{ textAlign: "center" }}>
        <div style={{ fontFamily: "Fredoka One", fontSize: 28, color: "#f9fafb" }}>
          UNO<span style={{ color: "#f59e0b" }}>⚡</span> Mercy
        </div>
        <div style={{ color: "#6b7280", fontSize: 12, marginTop: 2 }}>Waiting for players...</div>
      </div>

      {/* Room code */}
      <div style={{
        background: "#111827", borderRadius: 20, padding: "20px 28px",
        border: "1px solid #1f2937", textAlign: "center", width: "100%", maxWidth: 400,
        boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
      }}>
        <div style={{ color: "#6b7280", fontSize: 11, fontWeight: 700, letterSpacing: 2, marginBottom: 8 }}>
          ROOM CODE
        </div>
        <div style={{
          fontFamily: "Fredoka One", fontSize: 52, color: "#818cf8",
          letterSpacing: 12, lineHeight: 1,
          textShadow: "0 0 30px rgba(129,140,248,0.4)",
        }}>
          {lobby.roomCode}
        </div>
        <button onClick={copyCode} style={{
          marginTop: 12, background: copied ? "#065f46" : "#1f2937",
          color: copied ? "#6ee7b7" : "#9ca3af",
          border: `1px solid ${copied ? "#065f46" : "#374151"}`,
          borderRadius: 10, padding: "8px 20px", fontSize: 12,
          fontWeight: 700, fontFamily: "Nunito",
          transition: "all 0.2s",
        }}>
          {copied ? "✓ Copied!" : "📋 Copy Code"}
        </button>
        <div style={{ color: "#374151", fontSize: 11, marginTop: 8 }}>
          Share this code with friends to join
        </div>
      </div>

      <div style={{ display: "flex", gap: 16, width: "100%", maxWidth: 400, flexDirection: "column" }}>
        {/* Players */}
        <div style={{
          background: "#111827", borderRadius: 20, padding: 20,
          border: "1px solid #1f2937",
        }}>
          <div style={{ color: "#9ca3af", fontSize: 11, fontWeight: 700, letterSpacing: 2, marginBottom: 12 }}>
            PLAYERS ({lobby.players.length}/{lobby.settings?.maxPlayers || 6})
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {lobby.players.map(p => (
              <div key={p.id} style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                padding: "10px 14px", borderRadius: 12,
                background: p.name === myName ? "#1e1b4b" : "#1f2937",
                border: p.name === myName ? "1px solid #4f46e5" : "1px solid transparent",
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{
                    width: 32, height: 32, borderRadius: "50%",
                    background: p.isBot ? "#1e3a5f" : p.isHost ? "linear-gradient(135deg, #f59e0b, #ef4444)" : "#374151",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 14, fontWeight: 800,
                  }}>
                    {p.isBot ? "🤖" : p.isHost ? "👑" : p.name[0].toUpperCase()}
                  </div>
                  <div>
                    <div style={{ color: "#f9fafb", fontWeight: 700, fontSize: 14 }}>
                      {p.name} {p.name === myName && <span style={{ color: "#6366f1", fontSize: 11 }}>(you)</span>}
                    </div>
                    <div style={{ color: "#6b7280", fontSize: 11 }}>{p.isBot ? "Bot" : p.isHost ? "Host" : "Player"}</div>
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <div style={{
                    width: 8, height: 8, borderRadius: "50%",
                    background: p.connected !== false ? "#22c55e" : "#ef4444",
                  }} />
                  {isHost && !p.isHost && !p.isBot && (
                    <button onClick={() => onKick(p.socketId)} style={{
                      background: "transparent", color: "#6b7280",
                      border: "1px solid #374151", borderRadius: 6,
                      padding: "2px 8px", fontSize: 11, fontFamily: "Nunito",
                    }}>Kick</button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {lobby.players.length < 2 && (
            <div style={{
              marginTop: 12, padding: "10px 14px", borderRadius: 10,
              background: "#1f2937", color: "#6b7280", fontSize: 12, textAlign: "center",
              border: "1px dashed #374151",
            }}>
              Waiting for at least 2 players...
            </div>
          )}

          {/* Bot controls (host only) */}
          {isHost && (
            <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
              <button onClick={onAddBot} style={{
                flex: 1, background: "#1e3a5f", color: "#93c5fd",
                border: "1px solid #1e40af", borderRadius: 10,
                padding: "8px", fontSize: 12, fontWeight: 700, fontFamily: "Nunito",
              }}>🤖 Add Bot</button>
              <button onClick={onRemoveBot} style={{
                flex: 1, background: "#1f2937", color: "#6b7280",
                border: "1px solid #374151", borderRadius: 10,
                padding: "8px", fontSize: 12, fontWeight: 700, fontFamily: "Nunito",
              }}>Remove Bot</button>
            </div>
          )}
        </div>

        {/* Settings display */}
        <div style={{
          background: "#111827", borderRadius: 16, padding: "14px 18px",
          border: "1px solid #1f2937",
          display: "flex", gap: 16, justifyContent: "center",
        }}>
          <div style={{ textAlign: "center" }}>
            <div style={{ color: "#818cf8", fontSize: 18, fontWeight: 800, fontFamily: "Fredoka One" }}>
              {lobby.settings?.mercyLimit || 25}
            </div>
            <div style={{ color: "#6b7280", fontSize: 10, fontWeight: 700 }}>MERCY CARDS</div>
          </div>
          <div style={{ width: 1, background: "#1f2937" }} />
          <div style={{ textAlign: "center" }}>
            <div style={{ color: "#818cf8", fontSize: 18, fontWeight: 800, fontFamily: "Fredoka One" }}>
              {lobby.settings?.maxPlayers || 6}
            </div>
            <div style={{ color: "#6b7280", fontSize: 10, fontWeight: 700 }}>MAX PLAYERS</div>
          </div>
          <div style={{ width: 1, background: "#1f2937" }} />
          <div style={{ textAlign: "center" }}>
            <div style={{ color: "#818cf8", fontSize: 18, fontWeight: 800, fontFamily: "Fredoka One" }}>
              132
            </div>
            <div style={{ color: "#6b7280", fontSize: 10, fontWeight: 700 }}>CARD DECK</div>
          </div>
        </div>

        {/* Action buttons */}
        {isHost ? (
          <button onClick={onStart} disabled={!canStart} style={{
            width: "100%", background: canStart
              ? "linear-gradient(135deg, #f59e0b, #ef4444)"
              : "#1f2937",
            color: canStart ? "#fff" : "#4b5563",
            border: "none", borderRadius: 16, padding: "16px",
            fontSize: 18, fontWeight: 800, fontFamily: "Nunito",
            boxShadow: canStart ? "0 4px 24px rgba(239,68,68,0.4)" : "none",
          }}>
            {canStart ? "🚀 Start Game" : "Need 2+ players to start"}
          </button>
        ) : (
          <div style={{
            padding: "14px", borderRadius: 14, background: "#1f2937",
            textAlign: "center", color: "#6b7280", fontSize: 14, fontWeight: 600,
            border: "1px dashed #374151",
          }}>
            ⏳ Waiting for host to start the game...
          </div>
        )}

        <button onClick={onLeave} style={{
          background: "transparent", color: "#6b7280",
          border: "1px solid #374151", borderRadius: 12,
          padding: "10px", fontSize: 13, fontFamily: "Nunito",
        }}>← Leave Room</button>
      </div>
    </div>
  );
}
