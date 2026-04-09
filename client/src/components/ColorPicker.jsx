import React from "react";
import { COLOR_MAP } from "./CardEl";

const COLORS = ["red", "blue", "green", "yellow"];

export default function ColorPicker({ onPick, exclude = [], title = "Choose a color" }) {
  const available = COLORS.filter(c => !exclude.includes(c));

  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.82)",
      display: "flex", alignItems: "center", justifyContent: "center", zIndex: 300,
    }}>
      <div style={{
        background: "#111827", borderRadius: 24, padding: 32,
        border: "1.5px solid #4f46e5", textAlign: "center",
        boxShadow: "0 25px 60px rgba(0,0,0,0.6)",
        animation: "bounce-in 0.35s cubic-bezier(0.36,0.07,0.19,0.97) forwards",
      }}>
        <div style={{ fontSize: 26, marginBottom: 6 }}>🎨</div>
        <div style={{ color: "#e0e7ff", fontSize: 18, fontWeight: 800, marginBottom: 8, fontFamily: "Fredoka One" }}>
          {title}
        </div>
        {exclude.length > 0 && (
          <div style={{ color: "#6b7280", fontSize: 12, marginBottom: 16 }}>
            Cannot choose: {exclude.join(", ")}
          </div>
        )}
        <div style={{ display: "flex", gap: 14, justifyContent: "center" }}>
          {available.map(c => {
            const cm = COLOR_MAP[c];
            return (
              <button key={c} onClick={() => onPick(c)} style={{
                width: 64, height: 64, borderRadius: 16,
                background: cm.bg,
                border: "3px solid rgba(255,255,255,0.3)",
                cursor: "pointer", fontSize: 11, color: "#fff",
                fontWeight: 800, textTransform: "capitalize",
                fontFamily: "Nunito",
                boxShadow: `0 4px 16px ${cm.glow}`,
                transition: "transform 0.15s",
              }}
              onMouseEnter={e => e.target.style.transform = "scale(1.1)"}
              onMouseLeave={e => e.target.style.transform = "scale(1)"}
              >{c}</button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
