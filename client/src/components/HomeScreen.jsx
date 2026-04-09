import React, { useState } from "react";
import CardEl from "./CardEl";

const PREVIEW_CARDS = [
  { id: "p1", color: "red", value: "7", type: "seven" },
  { id: "p2", color: "blue", value: "skip", type: "action" },
  { id: "p3", color: "wild", value: "draw6", type: "wildDraw", draws: 6 },
  { id: "p4", color: "yellow", value: "skipAll", type: "action" },
  { id: "p5", color: "wild", value: "roulette", type: "roulette" },
];

export default function HomeScreen({ onCreateRoom, onJoinRoom, connecting }) {
  const [tab, setTab] = useState("join"); // "host" | "join"
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
      background: "linear-gradient(160deg, #0a0f1a 0%, #1e1b4b 50%, #0a0f1a 100%)",
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      padding: "24px 16px",
      position: "relative", overflow: "hidden",
    }}>
      {/* Background blobs */}
      <div style={{ position: "absolute", top: "10%", left: "5%", width: 300, height: 300,
        background: "radial-gradient(circle, rgba(99,102,241,0.12) 0%, transparent 70%)",
        borderRadius: "50%", pointerEvents: "none" }} />
      <div style={{ position: "absolute", bottom: "10%", right: "5%", width: 250, height: 250,
        background: "radial-gradient(circle, rgba(239,68,68,0.1) 0%, transparent 70%)",
        borderRadius: "50%", pointerEvents: "none" }} />

      {/* Title */}
      <div style={{ textAlign: "center", marginBottom: 28 }}>
        <div style={{
          fontFamily: "Fredoka One", fontSize: "clamp(48px, 12vw, 80px)",
          color: "#fff", letterSpacing: -2, lineHeight: 1,
          textShadow: "0 0 40px rgba(99,102,241,0.5)",
        }}>
          UNO<span style={{ color: "#f59e0b" }}>⚡</span>
        </div>
        <div style={{
          fontFamily: "Fredoka One", fontSize: "clamp(16px, 5vw, 22px)",
          color: "#818cf8", letterSpacing: 10, marginTop: 4,
        }}>MERCY</div>
        <div style={{ color: "#4b5563", fontSize: 12, marginTop: 8 }}>
          132-card No Mercy deck · Private rooms · Play with friends
        </div>
      </div>

      {/* Preview cards */}
      <div style={{ display: "flex", marginBottom: 28, alignItems: "flex-end" }}>
        {PREVIEW_CARDS.map((c, i) => (
          <div key={c.id} style={{
            transform: `rotate(${(i - 2) * 9}deg) translateY(${Math.abs(i - 2) * 8}px)`,
            marginLeft: i > 0 ? -18 : 0, zIndex: i,
            transition: "transform 0.3s",
          }}>
            <CardEl card={c} size={52} />
          </div>
        ))}
      </div>

      {/* Card */}
      <div style={{
        background: "#111827", borderRadius: 24, padding: 28,
        border: "1px solid #1f2937",
        boxShadow: "0 25px 60px rgba(0,0,0,0.5)",
        width: "100%", maxWidth: 400,
        animation: "slide-up 0.4s ease forwards",
      }}>
        {/* Tabs */}
        <div style={{ display: "flex", background: "#1f2937", borderRadius: 14, padding: 4, marginBottom: 24 }}>
          {[{ id: "join", label: "🎮 Join Game" }, { id: "host", label: "👑 Host Game" }].map(t => (
            <button key={t.id} onClick={() => { setTab(t.id); setError(""); }} style={{
              flex: 1, padding: "10px 0", borderRadius: 10, border: "none",
              background: tab === t.id ? "#4f46e5" : "transparent",
              color: tab === t.id ? "#fff" : "#6b7280",
              fontWeight: 800, fontSize: 13, fontFamily: "Nunito",
              boxShadow: tab === t.id ? "0 2px 8px rgba(79,70,229,0.4)" : "none",
              transition: "all 0.2s",
            }}>{t.label}</button>
          ))}
        </div>

        {/* Name field (shared) */}
        <div style={{ marginBottom: 16 }}>
          <label style={{ color: "#9ca3af", fontSize: 12, fontWeight: 700, display: "block", marginBottom: 6 }}>
            YOUR NAME
          </label>
          <input value={name} onChange={e => { setName(e.target.value); try { localStorage.setItem("uno_name", e.target.value); } catch {} }} placeholder="Enter your name..."
            maxLength={20}
            style={{
              width: "100%", background: "#1f2937", border: "1.5px solid #374151",
              borderRadius: 12, padding: "12px 16px", color: "#f9fafb", fontSize: 15,
              fontFamily: "Nunito", transition: "border 0.2s",
            }}
            onFocus={e => e.target.style.border = "1.5px solid #6366f1"}
            onBlur={e => e.target.style.border = "1.5px solid #374151"}
          />
        </div>

        {tab === "join" && (
          <form onSubmit={handleJoin}>
            <div style={{ marginBottom: 20 }}>
              <label style={{ color: "#9ca3af", fontSize: 12, fontWeight: 700, display: "block", marginBottom: 6 }}>
                ROOM CODE
              </label>
              <input value={roomCode} onChange={e => setRoomCode(e.target.value.toUpperCase())}
                placeholder="e.g. WOLF" maxLength={4}
                style={{
                  width: "100%", background: "#1f2937", border: "1.5px solid #374151",
                  borderRadius: 12, padding: "12px 16px", color: "#f9fafb",
                  fontSize: 28, fontFamily: "Fredoka One", letterSpacing: 8, textAlign: "center",
                  transition: "border 0.2s",
                }}
                onFocus={e => e.target.style.border = "1.5px solid #6366f1"}
                onBlur={e => e.target.style.border = "1.5px solid #374151"}
              />
            </div>
            {error && <div style={{ color: "#ef4444", fontSize: 13, marginBottom: 12, textAlign: "center" }}>{error}</div>}
            <button type="submit" disabled={connecting} style={{
              width: "100%", background: "linear-gradient(135deg, #4f46e5, #7c3aed)",
              color: "#fff", border: "none", borderRadius: 14, padding: "14px",
              fontSize: 16, fontWeight: 800, fontFamily: "Nunito",
              boxShadow: "0 4px 20px rgba(79,70,229,0.4)",
            }}>{connecting ? "Connecting..." : "Join Room →"}</button>
          </form>
        )}

        {tab === "host" && (
          <form onSubmit={handleCreate}>
            <div style={{ marginBottom: 16 }}>
              <label style={{ color: "#9ca3af", fontSize: 12, fontWeight: 700, display: "block", marginBottom: 6 }}>
                ADMIN PASSWORD
              </label>
              <input value={password} onChange={e => setPassword(e.target.value)}
                type="password" placeholder="Your secret password..."
                style={{
                  width: "100%", background: "#1f2937", border: "1.5px solid #374151",
                  borderRadius: 12, padding: "12px 16px", color: "#f9fafb", fontSize: 15,
                  fontFamily: "Nunito", transition: "border 0.2s",
                }}
                onFocus={e => e.target.style.border = "1.5px solid #6366f1"}
                onBlur={e => e.target.style.border = "1.5px solid #374151"}
              />
              <div style={{ color: "#4b5563", fontSize: 11, marginTop: 4 }}>
                This is the password you set in your server's ADMIN_PASSWORD env variable
              </div>
            </div>

            {/* Settings */}
            <div style={{ display: "flex", gap: 12, marginBottom: 20 }}>
              <div style={{ flex: 1 }}>
                <label style={{ color: "#9ca3af", fontSize: 11, fontWeight: 700, display: "block", marginBottom: 5 }}>
                  MERCY LIMIT
                </label>
                <input type="number" value={mercyLimit} min={10} max={50}
                  onChange={e => setMercyLimit(Number(e.target.value))}
                  style={{
                    width: "100%", background: "#1f2937", border: "1.5px solid #374151",
                    borderRadius: 10, padding: "10px 12px", color: "#f9fafb",
                    fontSize: 16, fontFamily: "Fredoka One", textAlign: "center",
                  }}
                />
              </div>

            </div>

            {error && <div style={{ color: "#ef4444", fontSize: 13, marginBottom: 12, textAlign: "center" }}>{error}</div>}
            <button type="submit" disabled={connecting} style={{
              width: "100%", background: "linear-gradient(135deg, #f59e0b, #ef4444)",
              color: "#fff", border: "none", borderRadius: 14, padding: "14px",
              fontSize: 16, fontWeight: 800, fontFamily: "Nunito",
              boxShadow: "0 4px 20px rgba(239,68,68,0.4)",
            }}>{connecting ? "Creating..." : "👑 Create Room"}</button>
          </form>
        )}
      </div>

      <div style={{ color: "#1f2937", fontSize: 10, marginTop: 20 }}>
        Fan game · UNO® is a trademark of Mattel
      </div>
    </div>
  );
}
