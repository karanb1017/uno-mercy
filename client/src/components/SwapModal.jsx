import React from "react";

export default function SwapModal({ players, myId, onSwap }) {
  const targets = players.filter(p => !p.eliminated && p.id !== myId);
  return (
    <div style={{
      position: "fixed", inset: 0,
      background: "rgba(2,4,12,0.88)",
      backdropFilter: "blur(14px)",
      display: "flex", alignItems: "center", justifyContent: "center", zIndex: 300,
    }}>
      <div style={{
        background: "rgba(10,16,34,0.95)",
        backdropFilter: "blur(20px)",
        borderRadius: 28, padding: "32px 36px",
        border: "1px solid rgba(167,139,250,0.3)",
        textAlign: "center",
        boxShadow: "0 32px 80px rgba(0,0,0,0.7), 0 0 40px rgba(167,139,250,0.1), inset 0 1px 0 rgba(255,255,255,0.07)",
        animation: "bounce-in 0.32s cubic-bezier(0.34,1.56,0.64,1) forwards",
        maxWidth: 380, width: "90%",
      }}>
        <div style={{ fontSize: 36, marginBottom: 10 }}>🔄</div>
        <div style={{
          fontSize: 22, fontWeight: 800, marginBottom: 6,
          fontFamily: "'Fredoka One', cursive",
          background: "linear-gradient(120deg,#a78bfa,#c084fc)",
          WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
        }}>
          Swap Hands!
        </div>
        <div style={{ color: "#6b7280", fontSize: 13, marginBottom: 24 }}>
          Choose who to swap your hand with
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {targets.map(p => (
            <button key={p.id} onClick={() => onSwap(p.id)} style={{
              background: "rgba(99,102,241,0.12)",
              color: "#c7d2fe",
              border: "1.5px solid rgba(99,102,241,0.4)",
              borderRadius: 16, padding: "14px 20px", fontWeight: 700,
              fontSize: 15, fontFamily: "Nunito", cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "space-between",
              transition: "all 0.18s",
              boxShadow: "0 0 0 rgba(99,102,241,0)",
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = "rgba(99,102,241,0.25)";
              e.currentTarget.style.boxShadow = "0 0 20px rgba(99,102,241,0.3)";
              e.currentTarget.style.transform = "translateX(4px)";
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = "rgba(99,102,241,0.12)";
              e.currentTarget.style.boxShadow = "0 0 0 rgba(99,102,241,0)";
              e.currentTarget.style.transform = "translateX(0)";
            }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{
                  width: 34, height: 34, borderRadius: "50%",
                  background: "linear-gradient(135deg,#4f46e5,#7c3aed)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontWeight: 900, fontSize: 14, color: "#fff",
                }}>
                  {p.name[0].toUpperCase()}
                </div>
                <span>{p.name}{p.isBot ? " 🤖" : ""}</span>
              </div>
              <span style={{
                background: "rgba(99,102,241,0.3)",
                border: "1px solid rgba(99,102,241,0.5)",
                borderRadius: 10, padding: "3px 12px", fontSize: 12, fontWeight: 800,
              }}>
                {p.handCount} 🃏
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
