import React, { useState } from "react";
import { COLOR_MAP } from "./CardEl";

const COLORS = ["red", "blue", "green", "yellow"];

const COLOR_CONFIG = {
  red:    { emoji: "🔥", label: "RED",    shimmer: "rgba(255,120,120,0.5)" },
  blue:   { emoji: "💧", label: "BLUE",   shimmer: "rgba(100,180,255,0.5)" },
  green:  { emoji: "🍀", label: "GREEN",  shimmer: "rgba(80,220,130,0.5)" },
  yellow: { emoji: "⚡", label: "YELLOW", shimmer: "rgba(255,210,60,0.5)" },
};

export default function ColorPicker({ onPick, onCancel, exclude = [], title = "Choose a color" }) {
  const available = COLORS.filter(c => !exclude.includes(c));
  const [hovered, setHovered] = useState(null);

  return (
    <div style={{
      position: "fixed", inset: 0,
      background: "rgba(2,4,12,0.92)",
      backdropFilter: "blur(18px)",
      display: "flex", alignItems: "center", justifyContent: "center", zIndex: 300,
    }}>
      {/* Big ambient glow that matches hovered color */}
      <div style={{
        position: "absolute", inset: 0, pointerEvents: "none",
        background: hovered
          ? `radial-gradient(ellipse 50% 50% at 50% 50%, ${COLOR_MAP[hovered].glow} 0%, transparent 70%)`
          : "none",
        transition: "background 0.35s ease",
      }} />

      <div style={{
        background: "rgba(8,12,28,0.97)",
        backdropFilter: "blur(24px)",
        borderRadius: 32, padding: "32px 28px 28px",
        border: hovered
          ? `1.5px solid ${COLOR_MAP[hovered].bg}88`
          : "1px solid rgba(255,255,255,0.1)",
        textAlign: "center",
        boxShadow: hovered
          ? `0 32px 80px rgba(0,0,0,0.8), 0 0 60px ${COLOR_MAP[hovered].glow}44`
          : "0 32px 80px rgba(0,0,0,0.7)",
        animation: "bounce-in 0.32s cubic-bezier(0.34,1.56,0.64,1) forwards",
        minWidth: 300, maxWidth: "92vw",
        position: "relative",
        transition: "border 0.3s, box-shadow 0.3s",
      }}>
        {/* Cancel button */}
        {onCancel && (
          <button onClick={onCancel} style={{
            position: "absolute", top: 12, right: 14,
            background: "rgba(255,255,255,0.06)", color: "#6b7280",
            border: "1px solid rgba(255,255,255,0.1)", borderRadius: "50%",
            width: 28, height: 28, fontSize: 14, lineHeight: 1,
            cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
            transition: "background 0.15s, color 0.15s",
          }}
          onMouseEnter={e => { e.currentTarget.style.background = "rgba(239,68,68,0.25)"; e.currentTarget.style.color = "#ef4444"; }}
          onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.06)"; e.currentTarget.style.color = "#6b7280"; }}
          >✕</button>
        )}

        {/* Title */}
        <div style={{ fontSize: 36, marginBottom: 4, lineHeight: 1 }}>🎨</div>
        <div style={{
          fontSize: 20, fontWeight: 900, marginBottom: 4,
          fontFamily: "'Fredoka One', cursive", letterSpacing: 1,
          background: "linear-gradient(120deg,#f472b6,#c084fc,#818cf8)",
          WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
        }}>{title}</div>
        <div style={{ color: "#4b5563", fontSize: 11, marginBottom: 24 }}>
          tap a color to lock it in
        </div>

        {/* Color buttons */}
        <div style={{
          display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap",
        }}>
          {available.map(c => {
            const cm = COLOR_MAP[c];
            const cfg = COLOR_CONFIG[c];
            const isHov = hovered === c;
            return (
              <button
                key={c}
                onClick={() => onPick(c)}
                onMouseEnter={() => setHovered(c)}
                onMouseLeave={() => setHovered(null)}
                onTouchStart={() => setHovered(c)}
                onTouchEnd={() => setHovered(null)}
                style={{
                  width: 76, height: 100,
                  borderRadius: 22,
                  background: isHov
                    ? `linear-gradient(155deg, ${cm.grad1 || cm.bg} 0%, ${cm.bg} 45%, ${cm.dark} 100%)`
                    : `linear-gradient(155deg, ${cm.bg}cc 0%, ${cm.dark}ee 100%)`,
                  border: isHov
                    ? `2.5px solid rgba(255,255,255,0.55)`
                    : `2px solid rgba(255,255,255,0.18)`,
                  cursor: "pointer",
                  fontFamily: "Fredoka One, cursive",
                  boxShadow: isHov
                    ? `0 0 0 4px ${cm.bg}44, 0 12px 36px ${cm.glow}cc, inset 0 1px 0 rgba(255,255,255,0.4)`
                    : `0 4px 16px ${cm.glow}55, inset 0 1px 0 rgba(255,255,255,0.15)`,
                  transform: isHov ? "scale(1.16) translateY(-6px)" : "scale(1)",
                  transition: "transform 0.2s cubic-bezier(.22,.68,0,1.4), box-shadow 0.2s, border 0.2s, background 0.2s",
                  display: "flex", flexDirection: "column",
                  alignItems: "center", justifyContent: "center", gap: 6,
                  position: "relative", overflow: "hidden",
                }}
              >
                {/* Shimmer stripe */}
                <div style={{
                  position: "absolute", top: 0, left: "-60%",
                  width: "40%", height: "100%",
                  background: `linear-gradient(105deg, transparent 0%, ${cfg.shimmer} 50%, transparent 100%)`,
                  animation: isHov ? "shimmer-sweep 0.55s ease forwards" : "none",
                  pointerEvents: "none",
                }} />

                {/* Top corner dot (like UNO card) */}
                <div style={{
                  position: "absolute", top: 7, left: 9,
                  width: 8, height: 8, borderRadius: "50%",
                  background: "rgba(255,255,255,0.5)",
                }} />
                <div style={{
                  position: "absolute", bottom: 7, right: 9,
                  width: 8, height: 8, borderRadius: "50%",
                  background: "rgba(255,255,255,0.5)",
                }} />

                <span style={{ fontSize: isHov ? 30 : 24, transition: "font-size 0.2s" }}>{cfg.emoji}</span>
                <span style={{
                  fontSize: 11, fontWeight: 900, color: "#fff",
                  letterSpacing: 1.5, textTransform: "uppercase",
                  textShadow: "0 1px 4px rgba(0,0,0,0.5)",
                }}>{cfg.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
