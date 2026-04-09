import React from "react";

export default function GameOver({ state, isHost, myIndex, onPlayAgain, onLeave }) {
  const winner = state.players.find(p => p.id === state.winner);
  const isMe = state.winner === myIndex;

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(160deg, #0a0f1a 0%, #1e1b4b 50%, #0a0f1a 100%)",
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      padding: "24px 16px", gap: 20,
    }}>
      {/* Trophy */}
      <div style={{ fontSize: 72, animation: "bounce-in 0.5s ease forwards" }}>
        {isMe ? "🏆" : "💀"}
      </div>

      <div style={{ textAlign: "center" }}>
        <div style={{
          fontFamily: "Fredoka One", fontSize: "clamp(28px, 8vw, 42px)",
          color: isMe ? "#f59e0b" : "#f9fafb",
          textShadow: isMe ? "0 0 30px rgba(245,158,11,0.5)" : "none",
          marginBottom: 6,
        }}>
          {isMe ? "You Win! 🎉" : `${winner?.name || "?"} Wins!`}
        </div>
        <div style={{ color: "#818cf8", fontSize: 15 }}>Last survivor of UNO Mercy</div>
      </div>

      {/* Player results */}
      <div style={{
        display: "grid",
        gridTemplateColumns: `repeat(${Math.min(state.players.length, 4)}, 1fr)`,
        gap: 10, width: "100%", maxWidth: 440,
      }}>
        {state.players.map(p => (
          <div key={p.id} style={{
            background: p.eliminated ? "#1a0808" : p.id === state.winner ? "#1a1600" : "#111827",
            borderRadius: 14, padding: "12px 8px", textAlign: "center",
            border: p.id === state.winner ? "2px solid #f59e0b" : "1px solid #1f2937",
          }}>
            <div style={{ fontSize: 20, marginBottom: 4 }}>
              {p.id === state.winner ? "👑" : p.eliminated ? "💀" : "🃏"}
            </div>
            <div style={{ color: "#f9fafb", fontWeight: 700, fontSize: 12 }}>{p.name}</div>
            <div style={{ color: "#6b7280", fontSize: 10 }}>{p.handCount ?? p.hand?.length ?? "?"} cards</div>
          </div>
        ))}
      </div>

      {/* Stats */}
      <div style={{ display: "flex", gap: 16 }}>
        {[
          { val: state.discard?.length || "?", label: "Played" },
          { val: state.players.filter(p => p.eliminated).length, label: "Eliminated" },
          { val: state.turnCount || "?", label: "Turns" },
        ].map(s => (
          <div key={s.label} style={{
            background: "#111827", borderRadius: 12, padding: "10px 16px", textAlign: "center",
            border: "1px solid #1f2937",
          }}>
            <div style={{ color: "#818cf8", fontSize: 22, fontWeight: 800, fontFamily: "Fredoka One" }}>{s.val}</div>
            <div style={{ color: "#6b7280", fontSize: 10 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Game log */}
      <div style={{
        background: "#0f172a", borderRadius: 14, padding: "12px 16px",
        width: "100%", maxWidth: 400, maxHeight: 120, overflowY: "auto",
        border: "1px solid #1f2937",
      }}>
        {(state.log || []).slice(-8).map((m, i) => (
          <div key={i} style={{ color: "#374151", fontSize: 11, lineHeight: 1.8 }}>{m}</div>
        ))}
      </div>

      <div style={{ display: "flex", gap: 12, flexDirection: "column", width: "100%", maxWidth: 400 }}>
        {isHost ? (
          <button onClick={onPlayAgain} style={{
            background: "linear-gradient(135deg, #4f46e5, #7c3aed)",
            color: "#fff", border: "none", borderRadius: 14, padding: "14px",
            fontSize: 16, fontWeight: 800, fontFamily: "Nunito",
            boxShadow: "0 4px 20px rgba(79,70,229,0.4)",
          }}>↺ Play Again (Back to Lobby)</button>
        ) : (
          <div style={{
            padding: "12px", borderRadius: 12, background: "#1f2937",
            textAlign: "center", color: "#6b7280", fontSize: 13,
          }}>Waiting for host to start a new game...</div>
        )}
        <button onClick={onLeave} style={{
          background: "transparent", color: "#6b7280",
          border: "1px solid #374151", borderRadius: 12,
          padding: "10px", fontSize: 13, fontFamily: "Nunito",
        }}>← Back to Home</button>
      </div>
    </div>
  );
}
