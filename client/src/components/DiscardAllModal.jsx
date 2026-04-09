import React, { useState } from "react";
import CardEl, { COLOR_MAP } from "./CardEl";

export default function DiscardAllModal({ hand, color, onConfirm, onSkip }) {
  const [sel, setSel] = useState([]);
  const eligible = hand.filter(c =>
    c.color === color && c.type === "number"
  );

  const toggle = (id) => setSel(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id]);
  const selectAll = () => setSel(eligible.map(c => c.id));

  const cm = COLOR_MAP[color] || COLOR_MAP.wild;

  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.82)",
      display: "flex", alignItems: "center", justifyContent: "center", zIndex: 300,
    }}>
      <div style={{
        background: "#111827", borderRadius: 24, padding: 24,
        border: `1.5px solid ${cm.bg}`, textAlign: "center",
        boxShadow: "0 25px 60px rgba(0,0,0,0.6)",
        animation: "bounce-in 0.35s ease forwards",
        maxWidth: 420, width: "92%",
      }}>
        <div style={{ fontSize: 28, marginBottom: 6 }}>🗑️</div>
        <div style={{ color: "#f9fafb", fontSize: 19, fontWeight: 800, marginBottom: 4, fontFamily: "Fredoka One" }}>
          Discard All —{" "}
          <span style={{ color: cm.bg, textTransform: "capitalize" }}>{color}</span>
        </div>
        <div style={{ color: "#6b7280", fontSize: 12, marginBottom: 6 }}>
          Select number cards to discard (no 0s or action cards)
        </div>

        {eligible.length === 0 ? (
          <div style={{ color: "#4b5563", fontSize: 14, padding: "16px 0" }}>No eligible cards to discard</div>
        ) : (
          <>
            <button onClick={selectAll} style={{
              background: "transparent", color: cm.bg,
              border: `1px solid ${cm.bg}`, borderRadius: 8,
              padding: "4px 12px", fontSize: 12, fontWeight: 700,
              marginBottom: 12, fontFamily: "Nunito",
            }}>Select All</button>
            <div style={{
              display: "flex", gap: 6, flexWrap: "wrap",
              justifyContent: "center", marginBottom: 16,
              maxHeight: 200, overflowY: "auto",
            }}>
              {eligible.map(c => (
                <CardEl key={c.id} card={c} size={52}
                  selected={sel.includes(c.id)}
                  onClick={() => toggle(c.id)}
                  playable={true}
                />
              ))}
            </div>
          </>
        )}

        <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
          <button onClick={() => onConfirm(sel)} style={{
            background: `linear-gradient(135deg, ${cm.bg}, ${cm.dark})`,
            color: "#fff", border: "none", borderRadius: 12,
            padding: "11px 24px", fontWeight: 800, fontSize: 14, fontFamily: "Nunito",
          }}>
            Discard {sel.length > 0 ? sel.length : "None"}
          </button>
          <button onClick={onSkip} style={{
            background: "transparent", color: "#6b7280",
            border: "1px solid #374151", borderRadius: 12,
            padding: "11px 20px", fontSize: 13, fontFamily: "Nunito",
          }}>Skip</button>
        </div>
      </div>
    </div>
  );
}
