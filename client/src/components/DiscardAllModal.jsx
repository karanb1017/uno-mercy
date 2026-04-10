import React, { useState } from "react";
import CardEl, { COLOR_MAP } from "./CardEl";

export default function DiscardAllModal({ hand, color, onConfirm, onSkip }) {
  const [sel, setSel] = useState([]);
  const eligible = hand.filter(c =>
    c.color === color && c.type === "number" && c.value !== "0" && c.value !== "7"
  );

  const toggle = (id) => setSel(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id]);
  const selectAll = () => setSel(eligible.map(c => c.id));

  const cm = COLOR_MAP[color] || COLOR_MAP.wild;

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
        borderRadius: 28, padding: "28px 28px",
        border: `1px solid ${cm.bg}55`,
        textAlign: "center",
        boxShadow: `0 32px 80px rgba(0,0,0,0.7), 0 0 50px ${cm.glow}22, inset 0 1px 0 rgba(255,255,255,0.07)`,
        animation: "bounce-in 0.32s cubic-bezier(0.34,1.56,0.64,1) forwards",
        maxWidth: 440, width: "92%",
      }}>
        <div style={{ fontSize: 30, marginBottom: 8 }}>🗑️</div>
        <div style={{
          fontSize: 20, fontWeight: 800, marginBottom: 4,
          fontFamily: "'Fredoka One', cursive", color: cm.bg,
          textShadow: `0 0 20px ${cm.glow}`,
        }}>
          Discard All —{" "}
          <span style={{ textTransform: "capitalize" }}>{color}</span>
        </div>
        <div style={{ color: "#4b5563", fontSize: 12, marginBottom: 12 }}>
          Select number cards to discard (no 0s, 7s, or action cards)
        </div>

        {eligible.length === 0 ? (
          <div style={{
            color: "#374151", fontSize: 14, padding: "20px 0",
            background: "rgba(255,255,255,0.03)", borderRadius: 12,
          }}>
            No eligible cards to discard
          </div>
        ) : (
          <>
            <button onClick={selectAll} style={{
              background: `${cm.bg}20`,
              color: cm.bg,
              border: `1px solid ${cm.bg}55`, borderRadius: 10,
              padding: "5px 14px", fontSize: 12, fontWeight: 700,
              marginBottom: 14, fontFamily: "Nunito", cursor: "pointer",
              transition: "all 0.15s",
            }}
            onMouseEnter={e => { e.currentTarget.style.background = `${cm.bg}35`; }}
            onMouseLeave={e => { e.currentTarget.style.background = `${cm.bg}20`; }}
            >Select All</button>
            <div style={{
              display: "flex", gap: 6, flexWrap: "wrap",
              justifyContent: "center", marginBottom: 18,
              maxHeight: 200, overflowY: "auto",
              padding: "4px 2px",
            }}>
              {eligible.map(c => (
                <div key={c.id} style={{
                  transform: sel.includes(c.id) ? "translateY(-8px) scale(1.06)" : "none",
                  transition: "transform 0.16s cubic-bezier(.22,.68,0,1.3)",
                  filter: sel.includes(c.id) ? `drop-shadow(0 0 8px ${cm.glow})` : "none",
                }}>
                  <CardEl card={c} size={52}
                    selected={sel.includes(c.id)}
                    onClick={() => toggle(c.id)}
                    playable={true}
                  />
                </div>
              ))}
            </div>
          </>
        )}

        <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
          <button onClick={() => onConfirm(sel)} style={{
            background: `linear-gradient(135deg, ${cm.grad1 || cm.bg}, ${cm.dark})`,
            color: "#fff", border: "none", borderRadius: 14,
            padding: "12px 26px", fontWeight: 900, fontSize: 14, fontFamily: "Nunito",
            cursor: "pointer",
            boxShadow: `0 6px 22px ${cm.glow}66`,
            transition: "transform 0.15s",
          }}
          onMouseEnter={e => { e.currentTarget.style.transform = "scale(1.04)"; }}
          onMouseLeave={e => { e.currentTarget.style.transform = "scale(1)"; }}
          >
            🗑️ Discard {sel.length > 0 ? sel.length : "None"}
          </button>
          <button onClick={onSkip} style={{
            background: "rgba(255,255,255,0.04)", color: "#6b7280",
            border: "1px solid rgba(255,255,255,0.1)", borderRadius: 14,
            padding: "12px 22px", fontSize: 13, fontFamily: "Nunito", cursor: "pointer",
          }}>Skip</button>
        </div>
      </div>
    </div>
  );
}
