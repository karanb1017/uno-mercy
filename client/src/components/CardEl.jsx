import React from "react";

export const COLOR_MAP = {
  red:    { bg: "#e53e3e", grad1: "#ff6b6b", dark: "#9b2335", text: "#fff", light: "#ffe0e0", glow: "rgba(229,62,62,0.6)" },
  blue:   { bg: "#3182ce", grad1: "#63b3ed", dark: "#1a4a8a", text: "#fff", light: "#dbeafe", glow: "rgba(49,130,206,0.6)" },
  green:  { bg: "#38a169", grad1: "#68d391", dark: "#1a5e35", text: "#fff", light: "#dcfce7", glow: "rgba(56,161,105,0.6)" },
  yellow: { bg: "#d97706", grad1: "#fbbf24", dark: "#92400e", text: "#fff", light: "#fef3c7", glow: "rgba(217,119,6,0.6)" },
  wild:   { bg: "#1a103c", grad1: "#4c3491", dark: "#0d0820", text: "#fff", light: "#ddd6fe", glow: "rgba(124,58,237,0.6)" },
};

// Icon paths / text for each card type
function getCardDisplay(card) {
  switch (card.value) {
    case "skip":       return { type: "text", val: "⊘" };
    case "reverse":    return { type: "text", val: "⇄" };
    case "skipAll":    return { type: "text", val: "↺" };
    case "draw2":      return { type: "draw", val: "+2" };
    case "draw4":      return { type: "draw", val: "+4" };
    case "draw6":      return { type: "draw", val: "+6" };
    case "draw10":     return { type: "draw", val: "+10" };
    case "reverseDraw4": return { type: "draw", val: "R+4" };
    case "discardAll": return { type: "text", val: "DA" };
    case "wild":       return { type: "wild", val: "W" };
    case "roulette":   return { type: "roulette", val: "?" };
    case "0":          return { type: "num", val: "0" };
    case "7":          return { type: "num", val: "7" };
    default:           return { type: "num", val: card.value };
  }
}

export function cardLabel(card) {
  return getCardDisplay(card).val;
}

export default function CardEl({
  card, size = 72, faceDown = false, selected = false,
  playable = true, onClick, style = {}, animate = false, chosenColor,
}) {
  const w = size;
  const h = Math.round(size * 1.5);
  const r = Math.max(7, size * 0.11);

  const containerStyle = {
    width: w, height: h,
    cursor: onClick && playable ? "pointer" : "default",
    flexShrink: 0,
    transform: selected ? `translateY(${-size * 0.22}px) scale(1.07)` : "none",
    transition: "transform 0.18s cubic-bezier(0.34,1.56,0.64,1), filter 0.15s, opacity 0.15s",
    filter: selected
      ? "drop-shadow(0 6px 20px rgba(255,255,255,0.6))"
      : playable && onClick
        ? `drop-shadow(0 3px 10px rgba(139,92,246,0.5))`
        : "none",
    opacity: !playable && onClick ? 0.35 : 1,
    animation: animate ? "deal-in 0.3s ease forwards" : "none",
    ...style,
  };

  // ─── FACE DOWN ───────────────────────────────────────────────
  if (faceDown) {
    const uid = `back-${size}`;
    return (
      <div onClick={onClick} style={containerStyle}>
        <svg viewBox={`0 0 ${w} ${h}`} width={w} height={h}>
          <defs>
            <linearGradient id={`${uid}-bg`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#1e3a6e" />
              <stop offset="100%" stopColor="#0c1a3a" />
            </linearGradient>
            <linearGradient id={`${uid}-gloss`} x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="rgba(255,255,255,0.18)" />
              <stop offset="50%" stopColor="rgba(255,255,255,0)" />
            </linearGradient>
          </defs>
          {/* Card body */}
          <rect x={1} y={1} width={w-2} height={h-2} rx={r}
            fill={`url(#${uid}-bg)`} stroke="#2d5a9e" strokeWidth={1.5} />
          {/* Diamond pattern */}
          <rect x={w*0.08} y={h*0.06} width={w*0.84} height={h*0.88} rx={r*0.7}
            fill="none" stroke="rgba(99,140,220,0.35)" strokeWidth={1} />
          <rect x={w*0.15} y={h*0.11} width={w*0.7} height={h*0.78} rx={r*0.5}
            fill="none" stroke="rgba(99,140,220,0.2)" strokeWidth={0.8} />
          {/* Center UNO text */}
          <text x={w/2} y={h*0.48} textAnchor="middle" dominantBaseline="middle"
            fill="#4a90d9" fontSize={size * 0.35} fontWeight="900"
            fontFamily="Fredoka One, serif" letterSpacing={-1}>UNO</text>
          <text x={w/2} y={h*0.63} textAnchor="middle"
            fill="rgba(74,144,217,0.5)" fontSize={size * 0.13}
            fontFamily="Nunito, sans-serif" letterSpacing={3}>MERCY</text>
          {/* Gloss */}
          <rect x={1} y={1} width={w-2} height={h*0.45} rx={r} fill={`url(#${uid}-gloss)`} />
        </svg>
      </div>
    );
  }

  // ─── FACE UP ─────────────────────────────────────────────────
  const effectiveColor = card.color === "wild" ? (chosenColor || "wild") : card.color;
  const cm = COLOR_MAP[effectiveColor] || COLOR_MAP.wild;
  const isWild = card.type === "wild" || card.type === "wildDraw" ||
    card.type === "wildReverseDraw" || card.value === "roulette";
  const display = getCardDisplay(card);
  const uid = `c-${card.id}-${card.color}`;

  // Font sizing
  const centerFontSize = display.val.length >= 4 ? size * 0.22
    : display.val.length === 3 ? size * 0.27
    : display.val.length === 2 ? size * 0.33
    : size * 0.42;
  const cornerFontSize = size * 0.17;

  // Oval dimensions
  const ovalRx = w * 0.34;
  const ovalRy = h * 0.38;

  return (
    <div onClick={onClick} style={containerStyle}>
      <svg viewBox={`0 0 ${w} ${h}`} width={w} height={h}>
        <defs>
          {/* Main card gradient */}
          <linearGradient id={`${uid}-g`} x1="0%" y1="0%" x2="60%" y2="100%">
            <stop offset="0%" stopColor={cm.grad1} />
            <stop offset="100%" stopColor={cm.dark} />
          </linearGradient>
          {/* Oval fill */}
          <linearGradient id={`${uid}-oval`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={isWild ? "#2a1a6e" : cm.dark} />
            <stop offset="100%" stopColor={isWild ? "#120a3a" : cm.bg} />
          </linearGradient>
          {/* Gloss overlay */}
          <linearGradient id={`${uid}-gloss`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="rgba(255,255,255,0.28)" />
            <stop offset="55%" stopColor="rgba(255,255,255,0)" />
          </linearGradient>
          {/* Wild radial bg */}
          {isWild && (
            <radialGradient id={`${uid}-wbg`} cx="40%" cy="35%" r="70%">
              <stop offset="0%" stopColor="#3e2080" />
              <stop offset="100%" stopColor="#0d0820" />
            </radialGradient>
          )}
          <clipPath id={`${uid}-clip`}>
            <rect x={1} y={1} width={w-2} height={h-2} rx={r} />
          </clipPath>
        </defs>

        {/* Card body */}
        <rect x={0.5} y={0.5} width={w-1} height={h-1} rx={r}
          fill={isWild ? `url(#${uid}-wbg)` : `url(#${uid}-g)`}
          stroke={selected ? "rgba(255,255,255,0.95)" : "rgba(255,255,255,0.25)"}
          strokeWidth={selected ? 2.5 : 1.5}
        />

        {/* Wild star-burst background decoration */}
        {isWild && (
          <g clipPath={`url(#${uid}-clip)`} opacity={0.15}>
            {[0,45,90,135].map(ang => (
              <line key={ang}
                x1={w/2} y1={h/2}
                x2={w/2 + Math.cos(ang*Math.PI/180)*w}
                y2={h/2 + Math.sin(ang*Math.PI/180)*h}
                stroke="white" strokeWidth={w*0.6}
              />
            ))}
          </g>
        )}

        {/* Center oval */}
        <ellipse cx={w/2} cy={h*0.54} rx={ovalRx} ry={ovalRy}
          fill={`url(#${uid}-oval)`}
          stroke={isWild ? "rgba(255,255,255,0.15)" : "rgba(255,255,255,0.2)"}
          strokeWidth={1}
          transform={`rotate(-8 ${w/2} ${h*0.54})`}
        />

        {/* Wild 4-color arc ring inside oval */}
        {isWild && card.value !== "roulette" && (
          <g transform={`rotate(-8 ${w/2} ${h*0.54})`}>
            {[["#ef4444",0],["#f59e0b",90],["#22c55e",180],["#3b82f6",270]].map(([c,deg]) => (
              <path key={deg}
                d={describeArc(w/2, h*0.54, size*0.2, deg, deg+78)}
                fill="none" stroke={c} strokeWidth={size*0.055} strokeLinecap="round"
              />
            ))}
            {/* Stars between arcs */}
            {[["#ef4444",45],["#f59e0b",135],["#22c55e",225],["#3b82f6",315]].map(([c,deg]) => {
              const rad = deg * Math.PI / 180;
              const sx = w/2 + Math.cos(rad) * size*0.2;
              const sy = h*0.54 + Math.sin(rad) * size*0.2;
              return <circle key={deg} cx={sx} cy={sy} r={size*0.028} fill={c} opacity={0.7} />;
            })}
          </g>
        )}

        {/* Roulette: spinning color quadrants */}
        {card.value === "roulette" && (
          <g transform={`rotate(-8 ${w/2} ${h*0.54})`}>
            {[["#ef4444",0],["#f59e0b",90],["#22c55e",180],["#3b82f6",270]].map(([c,deg]) => {
              const a1 = (deg - 45) * Math.PI / 180;
              const a2 = (deg + 45) * Math.PI / 180;
              const r2 = size * 0.22;
              const x1 = w/2 + Math.cos(a1)*r2, y1 = h*0.54 + Math.sin(a1)*r2;
              const x2 = w/2 + Math.cos(a2)*r2, y2 = h*0.54 + Math.sin(a2)*r2;
              return (
                <path key={deg}
                  d={`M ${w/2} ${h*0.54} L ${x1} ${y1} A ${r2} ${r2} 0 0 1 ${x2} ${y2} Z`}
                  fill={c} opacity={0.85}
                />
              );
            })}
            <circle cx={w/2} cy={h*0.54} r={size*0.07} fill="#0d0820" />
            <circle cx={w/2} cy={h*0.54} r={size*0.04} fill="white" opacity={0.9} />
          </g>
        )}

        {/* Center symbol / number */}
        <text
          x={w/2} y={h*0.6}
          textAnchor="middle" dominantBaseline="middle"
          fill="white"
          fontSize={centerFontSize}
          fontWeight="900"
          fontFamily="Fredoka One, serif"
          style={{ letterSpacing: display.val.length > 2 ? -1 : 0 }}
          filter={`drop-shadow(0 2px 4px rgba(0,0,0,0.6))`}
        >{display.val}</text>

        {/* Top-left corner */}
        <text x={w*0.16} y={h*0.14}
          textAnchor="middle" dominantBaseline="middle"
          fill="rgba(255,255,255,0.95)" fontSize={cornerFontSize}
          fontWeight="900" fontFamily="Fredoka One, serif">{display.val}</text>

        {/* Bottom-right corner (rotated) */}
        <text x={w*0.84} y={h*0.88}
          textAnchor="middle" dominantBaseline="middle"
          fill="rgba(255,255,255,0.95)" fontSize={cornerFontSize}
          fontWeight="900" fontFamily="Fredoka One, serif"
          transform={`rotate(180 ${w*0.84} ${h*0.88})`}>{display.val}</text>

        {/* Wild card type label bottom */}
        {(card.type === "wildDraw" || card.type === "wildReverseDraw") && (
          <>
            <rect x={w*0.15} y={h*0.84} width={w*0.7} height={h*0.1} rx={4}
              fill="rgba(0,0,0,0.4)" />
            <text x={w/2} y={h*0.895}
              textAnchor="middle" dominantBaseline="middle"
              fill="#fbbf24" fontSize={size*0.12} fontWeight="800"
              fontFamily="Nunito, sans-serif">
              {card.value === "draw6" ? "DRAW 6" : card.value === "draw10" ? "DRAW 10" : "REV +4"}
            </text>
          </>
        )}

        {/* DiscardAll subtitle */}
        {card.value === "discardAll" && size >= 40 && (
          <>
            <rect x={w*0.1} y={h*0.83} width={w*0.8} height={h*0.1} rx={4}
              fill="rgba(0,0,0,0.4)" />
            <text x={w/2} y={h*0.89}
              textAnchor="middle" dominantBaseline="middle"
              fill={cm.light} fontSize={size*0.11} fontWeight="700"
              fontFamily="Nunito, sans-serif">DISCARD ALL</text>
          </>
        )}

        {/* Gloss highlight */}
        <rect x={1} y={1} width={w-2} height={h*0.5} rx={r}
          fill={`url(#${uid}-gloss)`}
          clipPath={`url(#${uid}-clip)`}
        />
      </svg>
    </div>
  );
}

// SVG arc helpers
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


export function cardLabel(card) {
  const m = {
    draw2: "+2", draw4: "+4", draw6: "+6", draw10: "+10",
    reverseDraw4: "R+4", skip: "⊘", reverse: "⇄",
    skipAll: "↺", discardAll: "DA", wild: "W",
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
