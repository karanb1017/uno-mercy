import React, { useEffect, useState } from "react";
import CardEl from "./CardEl";
import { COLOR_MAP } from "./CardEl";

export default function RouletteModal({ targetName, chosenColor, revealedCards, onDone, isInitiator }) {
  const [shown, setShown] = useState([]);
  const [done, setDone] = useState(false);
  const cm = COLOR_MAP[chosenColor] || COLOR_MAP.wild;

  useEffect(() => {
    if (!revealedCards || revealedCards.length === 0) { setDone(true); return; }
    setShown([]);
    setDone(false);
    let i = 0;
    const iv = setInterval(() => {
      i++;
      setShown(revealedCards.slice(0, i));
      if (i >= revealedCards.length) { clearInterval(iv); setDone(true); }
    }, 250);
    return () => clearInterval(iv);
  }, [revealedCards]);

  return (
    <div style={{
      position: "fixed", inset: 0,
      background: "rgba(2,4,12,0.9)",
      backdropFilter: "blur(16px)",
      display: "flex", alignItems: "center", justifyContent: "center", zIndex: 300,
    }}>
      <div style={{
        background: "rgba(10,16,34,0.96)",
        backdropFilter: "blur(24px)",
        borderRadius: 28, padding: "32px 32px",
        border: `1px solid ${cm.bg}55`,
        boxShadow: `0 32px 80px rgba(0,0,0,0.8), 0 0 60px ${cm.glow}33, inset 0 1px 0 rgba(255,255,255,0.07)`,
        animation: "bounce-in 0.32s cubic-bezier(0.34,1.56,0.64,1) forwards",
        maxWidth: 460, width: "92%", textAlign: "center",
      }}>
        {/* Spinning roulette wheel icon */}
        <div style={{
          fontSize: 42, marginBottom: 10,
          display: "inline-block",
          animation: done ? "none" : "spin 0.8s linear infinite",
        }}>🎲</div>

        <div style={{
          fontFamily: "'Fredoka One', cursive", fontSize: 24, marginBottom: 6,
          color: cm.bg, textShadow: `0 0 24px ${cm.glow}`,
        }}>
          Color Roulette!
        </div>

        <div style={{ color: "#d1d5db", fontSize: 14, marginBottom: 4, lineHeight: 1.5 }}>
          <span style={{ color: "#a5b4fc", fontWeight: 700 }}>{targetName}</span>
          {" "}draws until a{" "}
          <span style={{
            color: cm.bg, fontWeight: 800, textTransform: "capitalize",
            textShadow: `0 0 12px ${cm.glow}`,
          }}>{chosenColor}</span>
          {" "}card appears
        </div>

        {/* Status label */}
        <div style={{
          display: "inline-flex", alignItems: "center", gap: 6,
          background: done ? `${cm.bg}20` : "rgba(255,255,255,0.05)",
          border: done ? `1px solid ${cm.bg}55` : "1px solid rgba(255,255,255,0.08)",
          borderRadius: 20, padding: "4px 14px",
          color: done ? cm.bg : "#6b7280", fontSize: 12, fontWeight: 700,
          marginBottom: 18, marginTop: 8,
          transition: "all 0.3s",
        }}>
          {done ? `✅ Drew ${revealedCards?.length || 0} cards!` : "⏳ Revealing…"}
        </div>

        {/* Card reveal area */}
        <div style={{
          display: "flex", gap: 5, flexWrap: "wrap",
          justifyContent: "center", marginBottom: 22,
          maxHeight: 210, overflowY: "auto",
          padding: "6px 4px",
          background: "rgba(0,0,0,0.2)", borderRadius: 16,
          border: "1px solid rgba(255,255,255,0.04)",
        }}>
          {shown.map((c, i) => (
            <div key={`${c.id}-${i}`} style={{
              animation: "bounce-in 0.25s cubic-bezier(0.34,1.56,0.64,1) forwards",
            }}>
              <CardEl card={c} size={46} animate />
            </div>
          ))}
          {!done && (
            <div style={{
              width: 46, height: 69, borderRadius: 10,
              background: "linear-gradient(160deg,#1e1b4b,#1a103c)",
              border: "1px solid rgba(255,255,255,0.1)",
              display: "flex", alignItems: "center", justifyContent: "center",
              animation: "spin 0.7s linear infinite",
              fontSize: 22,
            }}>🃏</div>
          )}
        </div>

        {done && isInitiator && (
          <button onClick={onDone} style={{
            background: `linear-gradient(135deg, ${cm.grad1 || cm.bg} 0%, ${cm.bg} 50%, ${cm.dark} 100%)`,
            color: "#fff", border: "none", borderRadius: 16,
            padding: "13px 36px", fontWeight: 900, fontSize: 16, fontFamily: "Nunito",
            cursor: "pointer",
            boxShadow: `0 6px 24px ${cm.glow}77`,
            transition: "transform 0.18s",
          }}
          onMouseEnter={e => { e.currentTarget.style.transform = "scale(1.05)"; }}
          onMouseLeave={e => { e.currentTarget.style.transform = "scale(1)"; }}
          >
            Continue ▶
          </button>
        )}
        {done && !isInitiator && (
          <div style={{
            color: "#374151", fontSize: 13,
            background: "rgba(255,255,255,0.03)", borderRadius: 10,
            padding: "10px 20px", display: "inline-block",
          }}>Waiting for host to continue…</div>
        )}
      </div>
    </div>
  );
}
