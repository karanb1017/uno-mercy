import React from "react";

export default function SwapModal({ players, myId, onSwap }) {
  const targets = players.filter(p => !p.eliminated && p.id !== myId);
  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.82)",
      display: "flex", alignItems: "center", justifyContent: "center", zIndex: 300,
    }}>
      <div style={{
        background: "#111827", borderRadius: 24, padding: 32,
        border: "1.5px solid #a78bfa", textAlign: "center",
        boxShadow: "0 25px 60px rgba(0,0,0,0.6)",
        animation: "bounce-in 0.35s ease forwards",
        maxWidth: 380, width: "90%",
      }}>
        <div style={{ fontSize: 32, marginBottom: 8 }}>🔄</div>
        <div style={{ color: "#e0e7ff", fontSize: 20, fontWeight: 800, marginBottom: 6, fontFamily: "Fredoka One" }}>
          Swap Hands!
        </div>
        <div style={{ color: "#9ca3af", fontSize: 13, marginBottom: 24 }}>
          Choose who to swap your hand with
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {targets.map(p => (
            <button key={p.id} onClick={() => onSwap(p.id)} style={{
              background: "linear-gradient(135deg, #312e81, #1e1b4b)",
              color: "#c7d2fe", border: "1.5px solid #6366f1",
              borderRadius: 14, padding: "14px 20px", fontWeight: 700,
              fontSize: 15, fontFamily: "Nunito",
              display: "flex", alignItems: "center", justifyContent: "space-between",
            }}>
              <span>{p.name}</span>
              <span style={{ background: "#6366f1", borderRadius: 8, padding: "2px 10px", fontSize: 12 }}>
                {p.handCount} cards
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
