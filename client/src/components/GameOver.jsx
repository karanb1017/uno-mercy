import React from "react";

export default function GameOver({ state, isHost, myIndex, onPlayAgain, onLeave }) {
  const winner = state.players.find(p => p.id === state.winner);
  const isMe = state.winner === myIndex;

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(160deg,#070c18 0%,#0d1530 45%,#070c18 100%)",
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      padding: "24px 16px", gap: 18,
      fontFamily: "Nunito, sans-serif",
      position: "relative", overflow: "hidden",
    }}>
      {/* Ambient glow */}
      <div style={{
        position: "absolute", top: "30%", left: "50%", transform: "translate(-50%,-50%)",
        width: 500, height: 400,
        background: isMe
          ? "radial-gradient(ellipse, rgba(245,158,11,0.1) 0%, transparent 60%)"
          : "radial-gradient(ellipse, rgba(99,102,241,0.07) 0%, transparent 60%)",
        pointerEvents: "none", transition: "background 0.5s",
      }} />

      {/* Trophy / skull */}
      <div style={{
        fontSize: 80, lineHeight: 1,
        animation: "bounce-in 0.5s cubic-bezier(0.34,1.56,0.64,1) forwards",
        filter: isMe ? "drop-shadow(0 0 30px rgba(245,158,11,0.5))" : "none",
        position: "relative", zIndex: 1,
      }}>
        {isMe ? "🏆" : "💀"}
      </div>

      {/* Win/lose text */}
      <div style={{ textAlign: "center", position: "relative", zIndex: 1 }}>
        <div style={{
          fontFamily: "'Fredoka One', cursive",
          fontSize: "clamp(30px,8vw,46px)",
          lineHeight: 1, marginBottom: 8,
          background: isMe
            ? "linear-gradient(120deg,#fbbf24,#f59e0b,#ef4444)"
            : "linear-gradient(120deg,#818cf8,#c084fc)",
          WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
          filter: isMe ? "drop-shadow(0 0 20px rgba(245,158,11,0.4))" : "drop-shadow(0 0 20px rgba(99,102,241,0.3))",
        }}>
          {isMe ? "You Win! 🎉" : `${winner?.name || "?"} Wins!`}
        </div>
        <div style={{ color: "#2d3748", fontSize: 13 }}>Last survivor of UNO Mercy</div>
      </div>

      {/* Player results grid */}
      <div style={{
        display: "grid",
        gridTemplateColumns: `repeat(${Math.min(state.players.length, 4)}, 1fr)`,
        gap: 8, width: "100%", maxWidth: 460,
        position: "relative", zIndex: 1,
      }}>
        {state.players.map(p => (
          <div key={p.id} style={{
            background: p.id === state.winner
              ? "rgba(245,158,11,0.1)"
              : p.eliminated
                ? "rgba(239,68,68,0.06)"
                : "rgba(255,255,255,0.04)",
            borderRadius: 16, padding: "14px 8px", textAlign: "center",
            border: p.id === state.winner
              ? "1.5px solid rgba(245,158,11,0.5)"
              : "1px solid rgba(255,255,255,0.07)",
            boxShadow: p.id === state.winner ? "0 0 24px rgba(245,158,11,0.2)" : "none",
            transition: "all 0.2s",
          }}>
            <div style={{
              fontSize: 24, marginBottom: 6,
              filter: p.id === state.winner ? "drop-shadow(0 0 8px rgba(245,158,11,0.6))" : "none",
            }}>
              {p.id === state.winner ? "👑" : p.eliminated ? "💀" : "🃏"}
            </div>
            <div style={{
              color: p.id === state.winner ? "#fbbf24" : "#e5e7eb",
              fontWeight: 700, fontSize: 12,
            }}>{p.name}</div>
            <div style={{ color: "#1f2a40", fontSize: 10, marginTop: 2 }}>
              {p.handCount ?? p.hand?.length ?? "?"} cards
            </div>
          </div>
        ))}
      </div>

      {/* Stats row */}
      <div style={{
        display: "flex", gap: 10,
        position: "relative", zIndex: 1,
      }}>
        {[
          { val: state.discard?.length || "?", label: "Played", icon: "🃏" },
          { val: state.players.filter(p => p.eliminated).length, label: "Eliminated", icon: "💀" },
          { val: state.turnCount || "?", label: "Turns", icon: "🔄" },
        ].map(s => (
          <div key={s.label} style={{
            background: "rgba(9,15,30,0.85)", backdropFilter: "blur(10px)",
            borderRadius: 14, padding: "12px 16px", textAlign: "center",
            border: "1px solid rgba(255,255,255,0.07)",
            minWidth: 74,
          }}>
            <div style={{ fontSize: 14, marginBottom: 4 }}>{s.icon}</div>
            <div style={{
              color: "#818cf8", fontSize: 22, fontWeight: 800,
              fontFamily: "'Fredoka One', cursive",
            }}>{s.val}</div>
            <div style={{ color: "#1f2a40", fontSize: 9, fontWeight: 700, letterSpacing: 0.5 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Game log */}
      <div style={{
        background: "rgba(5,8,18,0.7)", backdropFilter: "blur(8px)",
        borderRadius: 14, padding: "12px 16px",
        width: "100%", maxWidth: 420, maxHeight: 110, overflowY: "auto",
        border: "1px solid rgba(255,255,255,0.04)",
        position: "relative", zIndex: 1,
      }}>
        {(state.log || []).slice(-8).map((m, i) => (
          <div key={i} style={{ color: "#1a2535", fontSize: 11, lineHeight: 1.8 }}>{m}</div>
        ))}
      </div>

      {/* Buttons */}
      <div style={{
        display: "flex", gap: 10, flexDirection: "column",
        width: "100%", maxWidth: 420,
        position: "relative", zIndex: 1,
      }}>
        {isHost ? (
          <button onClick={onPlayAgain} style={{
            background: "linear-gradient(135deg,#4f46e5,#7c3aed)",
            color: "#fff", border: "none", borderRadius: 16, padding: "15px",
            fontSize: 16, fontWeight: 900, fontFamily: "Nunito", cursor: "pointer",
            boxShadow: "0 6px 24px rgba(79,70,229,0.45)",
            transition: "transform 0.15s",
          }}
          onMouseEnter={e => { e.currentTarget.style.transform = "scale(1.02)"; }}
          onMouseLeave={e => { e.currentTarget.style.transform = "scale(1)"; }}
          >↺ Play Again (Back to Lobby)</button>
        ) : (
          <div style={{
            padding: "13px", borderRadius: 14,
            background: "rgba(255,255,255,0.03)",
            textAlign: "center", color: "#1f2a40", fontSize: 13,
            border: "1px solid rgba(255,255,255,0.06)",
          }}>Waiting for host to start a new game…</div>
        )}
        <button onClick={onLeave} style={{
          background: "transparent", color: "#1f2a40",
          border: "1px solid rgba(255,255,255,0.07)", borderRadius: 12,
          padding: "11px", fontSize: 13, fontFamily: "Nunito", cursor: "pointer",
        }}>← Back to Home</button>
      </div>
    </div>
  );
}
