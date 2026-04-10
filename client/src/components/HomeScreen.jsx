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
      background: "linear-gradient(160deg,#070c18 0%,#0e1430 45%,#070c18 100%)",
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      padding: "24px 16px",
      position: "relative", overflow: "hidden",
      fontFamily: "Nunito, sans-serif",
    }}>
      {/* Ambient blobs */}
      <div style={{
        position: "absolute", top: "8%", left: "0%", width: 420, height: 420,
        background: "radial-gradient(circle, rgba(99,102,241,0.09) 0%, transparent 65%)",
        borderRadius: "50%", pointerEvents: "none",
      }} />
      <div style={{
        position: "absolute", bottom: "5%", right: "0%", width: 360, height: 360,
        background: "radial-gradient(circle, rgba(239,68,68,0.07) 0%, transparent 65%)",
        borderRadius: "50%", pointerEvents: "none",
      }} />
      <div style={{
        position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)",
        width: 600, height: 600,
        background: "radial-gradient(ellipse, rgba(99,102,241,0.04) 0%, transparent 60%)",
        borderRadius: "50%", pointerEvents: "none",
      }} />

      {/* Logo */}
      <div style={{ textAlign: "center", marginBottom: 24, position: "relative", zIndex: 1 }}>
        <div style={{
          fontFamily: "'Fredoka One', cursive",
          fontSize: "clamp(52px,13vw,86px)",
          lineHeight: 1, letterSpacing: -2,
          background: "linear-gradient(135deg,#e0e7ff 10%,#818cf8 50%,#c084fc 90%)",
          WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
          filter: "drop-shadow(0 0 30px rgba(99,102,241,0.35))",
        }}>UNO<span style={{
          WebkitTextFillColor: "#f59e0b",
          filter: "drop-shadow(0 0 20px rgba(245,158,11,0.6))",
        }}>⚡</span></div>
        <div style={{
          fontFamily: "'Fredoka One', cursive",
          fontSize: "clamp(14px,4vw,20px)",
          letterSpacing: "0.45em",
          background: "linear-gradient(120deg,#818cf8,#c084fc)",
          WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
          marginTop: 2,
        }}>MERCY</div>
        <div style={{ color: "#1f2a40", fontSize: 11, marginTop: 8, letterSpacing: 0.5 }}>
          168-card No Mercy deck · Private rooms · Play with friends
        </div>
      </div>

      {/* Preview card fan */}
      <div style={{
        display: "flex", marginBottom: 24, alignItems: "flex-end",
        position: "relative", zIndex: 1,
      }}>
        {PREVIEW_CARDS.map((c, i) => (
          <div key={c.id} style={{
            transform: `rotate(${(i - 2) * 10}deg) translateY(${Math.abs(i - 2) * 9}px)`,
            marginLeft: i > 0 ? -20 : 0, zIndex: i + 1,
            filter: `drop-shadow(0 4px 12px rgba(0,0,0,0.5))`,
            transition: "transform 0.3s",
          }}>
            <CardEl card={c} size={56} />
          </div>
        ))}
      </div>

      {/* Main card */}
      <div style={{
        background: "rgba(9,15,30,0.92)", backdropFilter: "blur(20px)",
        borderRadius: 28, padding: "28px 28px",
        border: "1px solid rgba(255,255,255,0.09)",
        boxShadow: "0 30px 70px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.07)",
        width: "100%", maxWidth: 410,
        animation: "slide-up 0.4s cubic-bezier(.22,.68,0,1.2) forwards",
        position: "relative", zIndex: 1,
      }}>
        {/* Tabs */}
        <div style={{
          display: "flex", background: "rgba(255,255,255,0.05)",
          border: "1px solid rgba(255,255,255,0.07)",
          borderRadius: 16, padding: 4, marginBottom: 24,
        }}>
          {[{ id: "join", label: "🎮 Join Game" }, { id: "host", label: "👑 Host Game" }].map(t => (
            <button key={t.id} onClick={() => { setTab(t.id); setError(""); }} style={{
              flex: 1, padding: "11px 0", borderRadius: 12, border: "none",
              background: tab === t.id
                ? "linear-gradient(135deg,#4f46e5,#7c3aed)"
                : "transparent",
              color: tab === t.id ? "#fff" : "#4b5563",
              fontWeight: 800, fontSize: 13, fontFamily: "Nunito", cursor: "pointer",
              boxShadow: tab === t.id ? "0 2px 12px rgba(79,70,229,0.45)" : "none",
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
              background: connecting ? "rgba(255,255,255,0.07)" : "linear-gradient(135deg,#4f46e5,#7c3aed)",
              color: connecting ? "#4b5563" : "#fff",
              border: "none", borderRadius: 14, padding: "15px",
              fontSize: 16, fontWeight: 900, fontFamily: "Nunito", cursor: connecting ? "default" : "pointer",
              boxShadow: connecting ? "none" : "0 6px 24px rgba(79,70,229,0.45)",
              transition: "all 0.2s",
            }}>
              {connecting ? "Connecting…" : "Join Room →"}
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
              background: connecting ? "rgba(255,255,255,0.07)" : "linear-gradient(135deg,#d97706,#ef4444)",
              color: connecting ? "#4b5563" : "#fff",
              border: "none", borderRadius: 14, padding: "15px",
              fontSize: 16, fontWeight: 900, fontFamily: "Nunito", cursor: connecting ? "default" : "pointer",
              boxShadow: connecting ? "none" : "0 6px 24px rgba(239,68,68,0.4)",
              transition: "all 0.2s",
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
