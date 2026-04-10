import React, { useState } from "react";
import CardEl from "./CardEl";

const PREVIEW_CARDS = [
  { id: "p1", color: "red", value: "7", type: "seven" },
  { id: "p2", color: "blue", value: "skip", type: "action" },
  { id: "p3", color: "wild", value: "draw6", type: "wildDraw", draws: 6 },
  { id: "p4", color: "yellow", value: "skipAll", type: "action" },
  { id: "p5", color: "wild", value: "roulette", type: "roulette" },
];

function Field({ label, children }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <label style={{
        color: "#4b5563", fontSize: 10, fontWeight: 700,
        letterSpacing: 1.5, display: "block", marginBottom: 6,
      }}>{label}</label>
      {children}
    </div>
  );
}

const inputBase = {
  width: "100%", background: "rgba(255,255,255,0.05)",
  border: "1.5px solid rgba(255,255,255,0.1)",
  borderRadius: 12, padding: "12px 16px",
  color: "#f9fafb", fontSize: 15, fontFamily: "Nunito",
  outline: "none", boxSizing: "border-box", transition: "border 0.2s",
};

export default function HomeScreen({ onCreateRoom, onJoinRoom, connecting }) {
  const [tab, setTab] = useState("join");
  const [name, setName] = useState(() => {
    try { return localStorage.getItem("uno_name") || ""; } catch { return ""; }
  });
  const [password, setPassword] = useState("");
  const [roomCode, setRoomCode] = useState("");
  const [mercyLimit, setMercyLimit] = useState(25);
  const [error, setError] = useState("");

  function handleCreate(e) {
    e.preventDefault();
    setError("");
    if (!name.trim()) return setError("Enter your name");
    if (!password.trim()) return setError("Enter admin password");
    onCreateRoom({ name: name.trim(), password, settings: { mercyLimit, maxPlayers: 6 } });
  }

  function handleJoin(e) {
    e.preventDefault();
    setError("");
    if (!name.trim()) return setError("Enter your name");
    if (!roomCode.trim()) return setError("Enter room code");
    onJoinRoom({ name: name.trim(), roomCode: roomCode.toUpperCase().trim() });
  }

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(160deg,#06030f 0%,#0e0a22 50%,#04060c 100%)",
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      padding: "24px 16px",
      position: "relative", overflow: "hidden",
      fontFamily: "Nunito, sans-serif",
    }}>
      {/* ── Big vivid color blobs (UNO 4 colors) ── */}
      <div style={{
        position: "absolute", top: "-8%", right: "-8%",
        width: 440, height: 440,
        background: "radial-gradient(circle, rgba(239,68,68,0.28) 0%, transparent 65%)",
        filter: "blur(55px)", pointerEvents: "none",
        animation: "blob-drift 9s ease-in-out infinite",
      }} />
      <div style={{
        position: "absolute", bottom: "-10%", left: "-8%",
        width: 400, height: 400,
        background: "radial-gradient(circle, rgba(59,130,246,0.3) 0%, transparent 65%)",
        filter: "blur(55px)", pointerEvents: "none",
        animation: "blob-drift 11s ease-in-out infinite reverse",
      }} />
      <div style={{
        position: "absolute", top: "35%", left: "-5%",
        width: 300, height: 300,
        background: "radial-gradient(circle, rgba(34,197,94,0.22) 0%, transparent 65%)",
        filter: "blur(50px)", pointerEvents: "none",
        animation: "blob-drift 13s ease-in-out infinite 2s",
      }} />
      <div style={{
        position: "absolute", bottom: "20%", right: "5%",
        width: 280, height: 280,
        background: "radial-gradient(circle, rgba(251,191,36,0.24) 0%, transparent 65%)",
        filter: "blur(48px)", pointerEvents: "none",
        animation: "blob-drift 10s ease-in-out infinite 1s reverse",
      }} />
      {/* Center deep purple halo */}
      <div style={{
        position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)",
        width: 500, height: 500,
        background: "radial-gradient(ellipse, rgba(139,92,246,0.12) 0%, transparent 60%)",
        filter: "blur(40px)", pointerEvents: "none",
        animation: "float 7s ease-in-out infinite",
      }} />

      {/* Logo */}
      <div style={{ textAlign: "center", marginBottom: 20, position: "relative", zIndex: 1 }}>
        <div style={{
          fontFamily: "'Fredoka One', cursive",
          fontSize: "clamp(56px,14vw,92px)",
          lineHeight: 1, letterSpacing: -2,
          background: "linear-gradient(135deg,#ffffff 10%,#a5b4fc 40%,#e879f9 70%,#fbbf24 100%)",
          WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
          filter: "drop-shadow(0 0 40px rgba(168,85,247,0.5))",
          animation: "float 4s ease-in-out infinite",
        }}>UNO<span style={{
          WebkitTextFillColor: "#fbbf24",
          filter: "drop-shadow(0 0 24px rgba(251,191,36,0.9))",
        }}>⚡</span></div>
        <div style={{
          fontFamily: "'Fredoka One', cursive",
          fontSize: "clamp(16px,4.5vw,22px)",
          letterSpacing: "0.6em",
          background: "linear-gradient(120deg,#f9a8d4,#c084fc,#93c5fd)",
          WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
          marginTop: 2,
        }}>MERCY</div>
        <div style={{ color: "#374151", fontSize: 11, marginTop: 10, letterSpacing: 0.5 }}>
          168-card No Mercy deck · Private rooms · Play with friends
        </div>
      </div>

      {/* Preview card fan */}
      <div style={{
        display: "flex", marginBottom: 20, alignItems: "flex-end",
        position: "relative", zIndex: 1,
        filter: "drop-shadow(0 8px 30px rgba(0,0,0,0.7))",
      }}>
        {PREVIEW_CARDS.map((c, i) => (
          <div key={c.id} style={{
            transform: `rotate(${(i - 2) * 11}deg) translateY(${Math.abs(i - 2) * 10}px)`,
            marginLeft: i > 0 ? -22 : 0, zIndex: i + 1,
            animation: `card-fan-bob ${3.5 + i * 0.4}s ease-in-out infinite ${i * 0.2}s`,
          }}>
            <CardEl card={c} size={60} />
          </div>
        ))}
      </div>

      {/* Main card */}
      <div style={{
        background: "rgba(12,8,28,0.88)", backdropFilter: "blur(24px)",
        borderRadius: 28, padding: "28px 28px",
        border: "1px solid rgba(168,85,247,0.25)",
        boxShadow: "0 30px 70px rgba(0,0,0,0.7), 0 0 60px rgba(139,92,246,0.08), inset 0 1px 0 rgba(255,255,255,0.08)",
        width: "100%", maxWidth: 410,
        animation: "slide-up 0.4s cubic-bezier(.22,.68,0,1.2) forwards",
        position: "relative", zIndex: 1,
      }}>
        {/* Tabs */}
        <div style={{
          display: "flex", background: "rgba(255,255,255,0.04)",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: 16, padding: 4, marginBottom: 24,
        }}>
          {[{ id: "join", label: "🎮 Join Game" }, { id: "host", label: "👑 Host Game" }].map(t => (
            <button key={t.id} onClick={() => { setTab(t.id); setError(""); }} style={{
              flex: 1, padding: "11px 0", borderRadius: 12, border: "none",
              background: tab === t.id
                ? "linear-gradient(135deg,#7c3aed,#6d28d9)"
                : "transparent",
              color: tab === t.id ? "#fff" : "#6b7280",
              fontWeight: 900, fontSize: 13, fontFamily: "Nunito", cursor: "pointer",
              boxShadow: tab === t.id ? "0 2px 16px rgba(124,58,237,0.55)" : "none",
              transition: "all 0.22s",
            }}>{t.label}</button>
          ))}
        </div>

        {/* Name field */}
        <Field label="YOUR NAME">
          <input value={name}
            onChange={e => { setName(e.target.value); try { localStorage.setItem("uno_name", e.target.value); } catch {} }}
            placeholder="Enter your name…" maxLength={20}
            style={inputBase}
            onFocus={e => { e.target.style.border = "1.5px solid rgba(99,102,241,0.7)"; e.target.style.background = "rgba(99,102,241,0.08)"; }}
            onBlur={e => { e.target.style.border = "1.5px solid rgba(255,255,255,0.1)"; e.target.style.background = "rgba(255,255,255,0.05)"; }}
          />
        </Field>

        {tab === "join" && (
          <form onSubmit={handleJoin}>
            <Field label="ROOM CODE">
              <input value={roomCode} onChange={e => setRoomCode(e.target.value.toUpperCase())}
                placeholder="e.g. WOLF" maxLength={4}
                style={{
                  ...inputBase,
                  fontSize: 30, fontFamily: "'Fredoka One', cursive",
                  letterSpacing: 10, textAlign: "center", padding: "14px 16px",
                }}
                onFocus={e => { e.target.style.border = "1.5px solid rgba(99,102,241,0.7)"; e.target.style.background = "rgba(99,102,241,0.08)"; }}
                onBlur={e => { e.target.style.border = "1.5px solid rgba(255,255,255,0.1)"; e.target.style.background = "rgba(255,255,255,0.05)"; }}
              />
            </Field>
            {error && (
              <div style={{
                color: "#fca5a5", fontSize: 12, marginBottom: 12, textAlign: "center",
                background: "rgba(239,68,68,0.1)", borderRadius: 8, padding: "6px 12px",
                border: "1px solid rgba(239,68,68,0.3)",
              }}>{error}</div>
            )}
            <button type="submit" disabled={connecting} style={{
              width: "100%",
              background: connecting ? "rgba(255,255,255,0.07)" : "linear-gradient(135deg,#7c3aed,#8b5cf6,#6d28d9)",
              color: connecting ? "#4b5563" : "#fff",
              border: "none", borderRadius: 14, padding: "15px",
              fontSize: 16, fontWeight: 900, fontFamily: "Nunito", cursor: connecting ? "default" : "pointer",
              boxShadow: connecting ? "none" : "0 6px 28px rgba(124,58,237,0.6)",
              transition: "all 0.2s",
              letterSpacing: 0.5,
            }}>
              {connecting ? "Connecting…" : "🎮 Join Room →"}
            </button>
          </form>
        )}

        {tab === "host" && (
          <form onSubmit={handleCreate}>
            <Field label="ADMIN PASSWORD">
              <input value={password} onChange={e => setPassword(e.target.value)}
                type="password" placeholder="Your server admin password…"
                style={inputBase}
                onFocus={e => { e.target.style.border = "1.5px solid rgba(99,102,241,0.7)"; e.target.style.background = "rgba(99,102,241,0.08)"; }}
                onBlur={e => { e.target.style.border = "1.5px solid rgba(255,255,255,0.1)"; e.target.style.background = "rgba(255,255,255,0.05)"; }}
              />
              <div style={{ color: "#1f2a40", fontSize: 11, marginTop: 4 }}>
                Set in your server's ADMIN_PASSWORD env variable
              </div>
            </Field>

            <Field label="MERCY LIMIT">
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <input type="number" value={mercyLimit} min={10} max={50}
                  onChange={e => setMercyLimit(Number(e.target.value))}
                  style={{
                    ...inputBase, width: 90, fontSize: 22,
                    fontFamily: "'Fredoka One', cursive", textAlign: "center",
                    padding: "10px 8px",
                  }}
                />
                <div style={{ color: "#4b5563", fontSize: 11, lineHeight: 1.4 }}>
                  Cards before<br />elimination
                </div>
              </div>
            </Field>

            {error && (
              <div style={{
                color: "#fca5a5", fontSize: 12, marginBottom: 12, textAlign: "center",
                background: "rgba(239,68,68,0.1)", borderRadius: 8, padding: "6px 12px",
                border: "1px solid rgba(239,68,68,0.3)",
              }}>{error}</div>
            )}
            <button type="submit" disabled={connecting} style={{
              width: "100%",
              background: connecting ? "rgba(255,255,255,0.07)" : "linear-gradient(135deg,#f59e0b,#ef4444,#dc2626)",
              color: connecting ? "#4b5563" : "#fff",
              border: "none", borderRadius: 14, padding: "15px",
              fontSize: 16, fontWeight: 900, fontFamily: "Nunito", cursor: connecting ? "default" : "pointer",
              boxShadow: connecting ? "none" : "0 6px 28px rgba(239,68,68,0.55)",
              transition: "all 0.2s",
              letterSpacing: 0.5,
            }}>
              {connecting ? "Creating…" : "👑 Create Room"}
            </button>
          </form>
        )}
      </div>

      <div style={{ color: "#0d1320", fontSize: 10, marginTop: 20, position: "relative", zIndex: 1 }}>
        Fan game · UNO® is a trademark of Mattel
      </div>
    </div>
  );
}
