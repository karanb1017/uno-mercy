import React from "react";

export const COLOR_MAP = {
  red:    { bg: "#ef4444", dark: "#991b1b", text: "#fff", light: "#fecaca", glow: "rgba(239,68,68,0.5)" },
  blue:   { bg: "#3b82f6", dark: "#1d4ed8", text: "#fff", light: "#bfdbfe", glow: "rgba(59,130,246,0.5)" },
  green:  { bg: "#22c55e", dark: "#15803d", text: "#fff", light: "#bbf7d0", glow: "rgba(34,197,94,0.5)" },
  yellow: { bg: "#eab308", dark: "#a16207", text: "#fff", light: "#fef08a", glow: "rgba(234,179,8,0.5)" },
  wild:   { bg: "#1e1b4b", dark: "#0f0a33", text: "#fff", light: "#c7d2fe", glow: "rgba(99,102,241,0.5)" },
};

export function cardLabel(card) {
  const m = {
    draw2: "+2", draw4: "+4", draw6: "+6", draw10: "+10",
    reverseDraw4: "R+4", skip: "⊘", reverse: "↺",
    skipAll: "⊘⊘", discardAll: "DA", wild: "W",
    roulette: "??", "7": "7", "0": "0",
  };
  return m[card.value] || card.value;
}

export default function CardEl({
  card,
  size = 72,
  faceDown = false,
  selected = false,
  playable = true,
  onClick,
  style = {},
  animate = false,
  chosenColor,
}) {
  const w = size;
  const h = size * 1.5;
  const r = Math.max(6, size * 0.1);

  const containerStyle = {
    width: w,
    height: h,
    cursor: onClick && playable ? "pointer" : "default",
    flexShrink: 0,
    transform: selected ? "translateY(-14px) scale(1.05)" : "none",
    transition: "transform 0.15s cubic-bezier(0.34,1.56,0.64,1), filter 0.15s, opacity 0.15s",
    filter: selected
      ? "drop-shadow(0 4px 16px rgba(255,255,255,0.5))"
      : playable && onClick
        ? "drop-shadow(0 2px 8px rgba(99,102,241,0.4))"
        : "none",
    opacity: !playable && onClick ? 0.38 : 1,
    animation: animate ? "deal-in 0.3s ease forwards" : "none",
    ...style,
  };

  if (faceDown) {
    return (
      <div onClick={onClick} style={containerStyle}>
        <svg viewBox={`0 0 ${w} ${h}`} width={w} height={h}>
          <defs>
            <linearGradient id="back-grad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#1e3a5f" />
              <stop offset="100%" stopColor="#0f1f3d" />
            </linearGradient>
          </defs>
          <rect x={1} y={1} width={w-2} height={h-2} rx={r} fill="url(#back-grad)" stroke="#3b82f6" strokeWidth={1.5} />
          <rect x={w*0.1} y={h*0.07} width={w*0.8} height={h*0.86} rx={r*0.6}
            fill="none" stroke="#3b82f6" strokeWidth={0.7} strokeDasharray="4,3" opacity={0.6} />
          <text x={w/2} y={h*0.5+5} textAnchor="middle"
            fill="#3b82f6" fontSize={size*0.32} fontWeight="bold" fontFamily="Fredoka One, serif">U</text>
          <text x={w/2} y={h*0.65} textAnchor="middle"
            fill="#3b82f6" fontSize={size*0.13} fontFamily="Nunito, sans-serif" opacity={0.7}>NO</text>
        </svg>
      </div>
    );
  }

  const effectiveColor = card.color === "wild" ? (chosenColor || "wild") : card.color;
  const cm = COLOR_MAP[effectiveColor] || COLOR_MAP.wild;
  const lbl = cardLabel(card);
  const isWild = card.type === "wild" || card.type === "wildDraw" || card.type === "wildReverseDraw" || card.value === "roulette";
  const fontSize = lbl.length > 3 ? size * 0.26 : size * 0.38;

  return (
    <div onClick={onClick} style={containerStyle}>
      <svg viewBox={`0 0 ${w} ${h}`} width={w} height={h}>
        <defs>
          <linearGradient id={`grad-${card.id}-${card.color}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={cm.bg} />
            <stop offset="100%" stopColor={cm.dark} />
          </linearGradient>
        </defs>

        {/* Card body */}
        <rect x={1} y={1} width={w-2} height={h-2} rx={r}
          fill={`url(#grad-${card.id}-${card.color})`}
          stroke={selected ? "#ffffff" : cm.dark}
          strokeWidth={selected ? 2.5 : 1.5}
        />

        {/* Inner oval */}
        <ellipse cx={w/2} cy={h/2} rx={w*0.31} ry={h*0.35}
          fill={cm.light} fillOpacity={0.18} />

        {/* Wild rainbow ring */}
        {isWild && card.value !== "roulette" && (
          <g>
            {[["#ef4444",0],["#eab308",90],["#22c55e",180],["#3b82f6",270]].map(([c, deg]) => (
              <path key={deg}
                d={describeArc(w/2, h/2, size*0.22, deg, deg+80)}
                fill="none" stroke={c} strokeWidth={size*0.05} strokeLinecap="round"
              />
            ))}
          </g>
        )}

        {/* Roulette pips */}
        {card.value === "roulette" && (
          <g>
            {[["#ef4444",0],["#3b82f6",90],["#22c55e",180],["#eab308",270]].map(([c, deg]) => {
              const angle = (deg * Math.PI) / 180;
              const cx2 = w/2 + Math.cos(angle) * size * 0.2;
              const cy2 = h/2 + Math.sin(angle) * size * 0.2;
              return <circle key={deg} cx={cx2} cy={cy2} r={size*0.065} fill={c} />;
            })}
          </g>
        )}

        {/* Top-left label */}
        <text x={w*0.15} y={h*0.19} textAnchor="middle"
          fill={cm.text} fontSize={size*0.18} fontWeight="bold"
          fontFamily="Fredoka One, serif" opacity={0.9}>{lbl}</text>

        {/* Center label */}
        <text x={w/2} y={h*0.6} textAnchor="middle"
          fill={cm.text} fontSize={fontSize} fontWeight="bold"
          fontFamily="Fredoka One, serif">{lbl}</text>

        {/* Bottom-right label (rotated) */}
        <text x={w*0.85} y={h*0.87} textAnchor="middle"
          fill={cm.text} fontSize={size*0.18} fontWeight="bold"
          fontFamily="Fredoka One, serif" opacity={0.9}
          transform={`rotate(180 ${w*0.85} ${h*0.87})`}>{lbl}</text>

        {/* Draws badge for wild draw cards */}
        {(card.type === "wildDraw" || card.type === "wildReverseDraw") && (
          <rect x={w*0.55} y={h*0.08} width={w*0.38} height={h*0.12} rx={4}
            fill="#fbbf24" />
        )}
        {(card.type === "wildDraw" || card.type === "wildReverseDraw") && (
          <text x={w*0.74} y={h*0.175} textAnchor="middle"
            fill="#1c1917" fontSize={size*0.13} fontWeight="bold"
            fontFamily="Nunito, sans-serif">×{card.draws}</text>
        )}
      </svg>
    </div>
  );
}

// SVG arc helper
function describeArc(x, y, radius, startAngle, endAngle) {
  const start = polarToCartesian(x, y, radius, endAngle);
  const end = polarToCartesian(x, y, radius, startAngle);
  const largeArc = endAngle - startAngle <= 180 ? "0" : "1";
  return `M ${start.x} ${start.y} A ${radius} ${radius} 0 ${largeArc} 0 ${end.x} ${end.y}`;
}
function polarToCartesian(cx, cy, r, angle) {
  const rad = ((angle - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}
