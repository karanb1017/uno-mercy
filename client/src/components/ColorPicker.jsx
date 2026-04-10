import React from "react";
import { COLOR_MAP } from "./CardEl";

const COLORS = ["red", "blue", "green", "yellow"];

const COLOR_ICONS = { red: "🔴", blue: "🔵", green: "🟢", yellow: "🟡" };

export default function ColorPicker({ onPick, exclude = [], title = "Choose a color" }) {
  const available = COLORS.filter(c => !exclude.includes(c));

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
        borderRadius: 28, padding: "36px 40px",
        border: "1px solid rgba(255,255,255,0.1)",
        textAlign: "center",
        boxShadow: "0 32px 80px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,255,255,0.07)",
        animation: "bounce-in 0.32s cubic-bezier(0.34,1.56,0.64,1) forwards",
        minWidth: 280,
      }}>
        <div style={{ fontSize: 30, marginBottom: 10 }}>🎨</div>
        <div style={{
          color: "#e0e7ff", fontSize: 19, fontWeight: 800, marginBottom: 6,
          fontFamily: "'Fredoka One', cursive",
          background: "linear-gradient(120deg,#818cf8,#c084fc)",
          WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
        }}>
          {title}
        </div>
        {exclude.length > 0 && (
          <div style={{
            color: "#4b5563", fontSize: 11, marginBottom: 18,
            background: "rgba(255,255,255,0.04)", borderRadius: 8,
            padding: "4px 12px", display: "inline-block",
          }}>
            Excluded: {exclude.join(", ")}
          </div>
        )}
        <div style={{ display: "flex", gap: 14, justifyContent: "center", marginTop: 8 }}>
          {available.map(c => {
            const cm = COLOR_MAP[c];
            return (
              <button key={c} onClick={() => onPick(c)} style={{
                width: 72, height: 80, borderRadius: 20,
                background: `linear-gradient(160deg, ${cm.grad1 || cm.bg} 0%, ${cm.bg} 50%, ${cm.dark} 100%)`,
                border: "2px solid rgba(255,255,255,0.25)",
                cursor: "pointer", fontSize: 11, color: "#fff",
                fontWeight: 900, textTransform: "capitalize",
                fontFamily: "Nunito",
                boxShadow: `0 6px 24px ${cm.glow}88, inset 0 1px 0 rgba(255,255,255,0.3)`,
                transition: "transform 0.18s cubic-bezier(.22,.68,0,1.4), box-shadow 0.2s",
                display: "flex", flexDirection: "column", alignItems: "center",
                justifyContent: "center", gap: 5,
              }}
              onMouseEnter={e => {
                e.currentTarget.style.transform = "scale(1.13) translateY(-4px)";
                e.currentTarget.style.boxShadow = `0 12px 32px ${cm.glow}cc`;
              }}
              onMouseLeave={e => {
                e.currentTarget.style.transform = "scale(1)";
                e.currentTarget.style.boxShadow = `0 6px 24px ${cm.glow}88, inset 0 1px 0 rgba(255,255,255,0.3)`;
              }}
              >
                <span style={{ fontSize: 20 }}>{COLOR_ICONS[c]}</span>
                <span>{c}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
