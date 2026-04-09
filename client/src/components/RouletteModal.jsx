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
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.88)",
      display: "flex", alignItems: "center", justifyContent: "center", zIndex: 300,
    }}>
      <div style={{
        background: "#111827", borderRadius: 24, padding: 28,
        border: `1.5px solid ${cm.bg}`,
        boxShadow: `0 25px 60px rgba(0,0,0,0.7), 0 0 40px ${cm.glow}`,
        animation: "bounce-in 0.35s ease forwards",
        maxWidth: 440, width: "92%", textAlign: "center",
      }}>
        <div style={{ fontSize: 32, marginBottom: 8 }}>🎲</div>
        <div style={{ fontFamily: "Fredoka One", fontSize: 22, marginBottom: 6, color: cm.bg }}>
          Color Roulette!
        </div>
        <div style={{ color: "#d1d5db", fontSize: 14, marginBottom: 4 }}>
          {targetName} draws until a{" "}
          <span style={{ color: cm.bg, fontWeight: 700, textTransform: "capitalize" }}>{chosenColor}</span> card appears
        </div>
        <div style={{ color: "#6b7280", fontSize: 12, marginBottom: 16 }}>
          {done ? `Drew ${revealedCards?.length || 0} cards!` : "Revealing..."}
        </div>

        <div style={{
          display: "flex", gap: 4, flexWrap: "wrap",
          justifyContent: "center", marginBottom: 20,
          maxHeight: 200, overflowY: "auto",
        }}>
          {shown.map((c, i) => (
            <CardEl key={`${c.id}-${i}`} card={c} size={44} animate />
          ))}
          {!done && (
            <div style={{
              width: 44, height: 66, borderRadius: 8,
              background: "#1f2937", display: "flex",
              alignItems: "center", justifyContent: "center",
              animation: "spin 0.6s linear infinite",
              fontSize: 20,
            }}>🃏</div>
          )}
        </div>

        {done && isInitiator && (
          <button onClick={onDone} style={{
            background: `linear-gradient(135deg, ${cm.bg}, ${cm.dark})`,
            color: "#fff", border: "none", borderRadius: 12,
            padding: "12px 32px", fontWeight: 800, fontSize: 15, fontFamily: "Nunito",
            boxShadow: `0 4px 16px ${cm.glow}`,
          }}>
            Continue ▶
          </button>
        )}
        {done && !isInitiator && (
          <div style={{ color: "#6b7280", fontSize: 13 }}>Waiting for host to continue...</div>
        )}
      </div>
    </div>
  );
}
