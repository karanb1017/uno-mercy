// ============================================================
// UNO SHOW 'EM NO MERCY — COMPLETE GAME ENGINE
// 168-card deck, all house rules implemented
// ============================================================

const COLORS = ["red", "blue", "green", "yellow"];

// ─── DECK BUILDER (132 cards) ───────────────────────────────
// Per color (×4): 1×0, 2×1-6, 2×7(seven), 2×8-9, 2×skip,
//   2×reverse, 2×draw2, 1×skipAll, 1×discardAll  = 27 × 4 = 108
// Wild (×4 each): wild, draw4, draw6, draw10, reverseDraw4,
//   roulette  = 24   →  Total: 132 cards
function createDeck() {
  const d = [];
  let uid = 0;
  const mk = (color, value, type, extra = {}) => ({ id: uid++, color, value, type, ...extra });

  for (const c of COLORS) {
    // 1x zero
    d.push(mk(c, "0", "zero"));
    // 2x 1-9 (skip 7 — handled separately as "seven" type)
    for (let n = 1; n <= 9; n++) {
      if (n === 7) continue;
      d.push(mk(c, String(n), "number"));
      d.push(mk(c, String(n), "number"));
    }
    // 2x seven (triggers hand swap, cannot win)
    d.push(mk(c, "7", "seven"));
    d.push(mk(c, "7", "seven"));
    // 2x each action
    for (const a of ["skip", "reverse", "draw2"]) {
      d.push(mk(c, a, "action"));
      d.push(mk(c, a, "action"));
    }
    // 1x skip all
    d.push(mk(c, "skipAll", "action"));
    // 1x discard all
    d.push(mk(c, "discardAll", "action"));
  }

  // 4x wild
  for (let i = 0; i < 4; i++) d.push(mk("wild", "wild", "wild"));
  // 4x each wild draw
  for (let i = 0; i < 4; i++) {
    d.push(mk("wild", "draw4", "wildDraw", { draws: 4 }));
    d.push(mk("wild", "draw6", "wildDraw", { draws: 6 }));
    d.push(mk("wild", "draw10", "wildDraw", { draws: 10 }));
    d.push(mk("wild", "reverseDraw4", "wildReverseDraw", { draws: 4 }));
    d.push(mk("wild", "roulette", "roulette"));
  }

  return d; // 132 cards
}

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Draw card strength for stacking hierarchy (+2 < +4 < +6 < +10)
function getDrawStrength(card) {
  if (card.value === "draw2") return 2;
  if (card.type === "wildDraw" || card.type === "wildReverseDraw") return card.draws || 0;
  return 0;
}

// ─── HELPERS ─────────────────────────────────────────────────
function getAlive(players) {
  return players.filter(p => !p.eliminated);
}

function getAliveIds(players) {
  return players.map((_, i) => i).filter(i => !players[i].eliminated);
}

function nextPlayerIdx(players, currentPlayer, direction) {
  const alive = getAliveIds(players);
  const cur = alive.indexOf(currentPlayer);
  if (cur === -1) return alive[0];
  return alive[(cur + direction + alive.length) % alive.length];
}

function checkEliminations(players, mercyLimit) {
  return players.map(p => ({
    ...p,
    eliminated: p.eliminated || (!p.eliminated && p.hand.length >= mercyLimit)
  }));
}

function drawCardsFromDeck(state, playerId, count) {
  let deck = [...state.deck];
  let discard = [...state.discard];

  if (deck.length < count) {
    const eliminatedCards = state.players
      .filter(p => p.eliminated)
      .flatMap(p => p.eliminatedHand || []);
    const reshuffled = shuffle([...discard.slice(0, -1), ...eliminatedCards]);
    deck = [...deck, ...reshuffled];
    discard = [discard[discard.length - 1]];
  }

  const drawn = deck.splice(0, Math.min(count, deck.length));
  const newPlayers = state.players.map((p, i) =>
    i === playerId ? { ...p, hand: [...p.hand, ...drawn] } : p
  );

  return { ...state, deck, discard, players: newPlayers };
}

// ─── CARD LEGALITY ────────────────────────────────────────────
function canPlayCard(card, state) {
  const top = state.discard[state.discard.length - 1];
  const color = state.currentColor;
  const stack = state.drawStack;
  const chainActive = state.chainActive;

  // Roulette: always alone, never during chain
  if (card.value === "roulette") return !chainActive && stack === 0;

  if (chainActive && stack > 0) {
    // During draw chain: draw cards can always stack
    const isDrawCard =
      card.type === "wildDraw" ||
      card.type === "wildReverseDraw" ||
      card.value === "draw2";
    if (isDrawCard) return true;

    // Same-color action cards can be played during chain
    if (card.color === color && card.type === "action") return true;
    if (card.color === color && (card.value === "skip" || card.value === "reverse" || card.value === "skipAll")) return true;
    return false;
  }

  // Normal turn
  if (card.type === "wild" || card.type === "wildDraw" ||
      card.type === "wildReverseDraw" || card.value === "roulette") return true;
  if (card.color === color) return true;
  if (card.value === top.value) return true;
  if (card.type === "action" && top.type === "action" && card.value === top.value) return true;
  return false;
}

// Cards that can be multi-played together
function canMultiPlay(cards, state) {
  if (cards.length === 0) return false;
  if (cards.length === 1) return canPlayCard(cards[0], state);

  // Roulette must always be played alone
  if (cards.some(c => c.value === "roulette")) return false;

  const first = cards[0];

  // Same numeric value across any colors (numbers, sevens, zeros)
  const numericTypes = ["number", "seven", "zero"];
  if (numericTypes.includes(first.type) && cards.every(c => c.value === first.value)) {
    return canPlayCard(first, state);
  }

  // Multiple draw cards: all must meet chain requirement; outside chain first must be playable
  const allDraw = cards.every(c => getDrawStrength(c) > 0);
  if (allDraw) {
    if (!canPlayCard(first, state)) return false;
    if (state.chainActive && state.drawStack > 0) {
      const req = state.chainRequiredDraw || 0;
      return cards.every(c => getDrawStrength(c) >= req);
    }
    return true;
  }

  // Multiple action cards: all must be individually playable
  return cards.every(c => canPlayCard(c, state));
}

// ─── MAIN PLAY FUNCTION ───────────────────────────────────────
function processPlay(state, playerId, cardIds, chosenColor) {
  const player = state.players[playerId];
  if (!player || player.eliminated) return { error: "Not your turn or eliminated" };
  if (state.currentPlayer !== playerId) return { error: "Not your turn" };

  const playedCards = cardIds.map(id => player.hand.find(c => c.id === id)).filter(Boolean);
  if (playedCards.length !== cardIds.length) return { error: "Invalid cards" };

  // Validate legality
  if (!canMultiPlay(playedCards, state)) return { error: "Illegal play" };

  const newHand = player.hand.filter(c => !cardIds.includes(c.id));

  let ns = {
    ...state,
    players: state.players.map((p, i) =>
      i === playerId ? { ...p, hand: newHand, saidUno: newHand.length === 1 ? p.saidUno : false } : p
    ),
    discard: [...state.discard, ...playedCards],
    log: [...state.log, `${player.name} played ${playedCards.map(c => cardDisplayName(c)).join(" + ")}`],
    turnCount: (state.turnCount || 0) + 1,
  };

  // ── Process each card's effects ──────────────────────────
  let stack = ns.drawStack;
  let dir = ns.direction;
  let chainActive = ns.chainActive;
  let colorStack = [...ns.colorStack];
  let skipCount = 0;
  let reverseCount = 0;
  let reverseDraw4Count = 0;
  let hasSkipAll = false;
  let finalColor = ns.currentColor;
  let needsColorPick = false;
  let hasRoulette = false;
  let hasDiscardAll = false;
  let hasSwap = false;
  let hasZero = false;
  let discardAllColor = null;
  let chainRequiredDraw = ns.chainRequiredDraw || 0;
  let hasSavingAction = false;
  const wasChainActive = state.chainActive && state.drawStack > 0;

  for (const card of playedCards) {
    if (card.value === "draw2") {
      stack += 2;
      chainActive = true;
      chainRequiredDraw = Math.max(chainRequiredDraw, 2);
    } else if (card.type === "wildDraw") {
      stack += card.draws;
      chainActive = true;
      chainRequiredDraw = Math.max(chainRequiredDraw, card.draws);
      finalColor = chosenColor || finalColor;
      colorStack = [...colorStack, finalColor];
      needsColorPick = true;
    } else if (card.type === "wildReverseDraw") {
      stack += card.draws;
      chainActive = true;
      chainRequiredDraw = Math.max(chainRequiredDraw, card.draws);
      finalColor = chosenColor || finalColor;
      colorStack = [...colorStack, finalColor];
      needsColorPick = true;
      reverseDraw4Count++;
    } else if (card.value === "skip") {
      if (wasChainActive) {
        hasSavingAction = true; // deflects chain, does NOT skip next player
      } else {
        skipCount++;
      }
    } else if (card.value === "reverse") {
      reverseCount++;
      if (wasChainActive) hasSavingAction = true;
    } else if (card.value === "skipAll") {
      hasSkipAll = true;
      if (wasChainActive) hasSavingAction = true;
    } else if (card.value === "wild") {
      finalColor = chosenColor || finalColor;
      needsColorPick = true;
    } else if (card.value === "roulette") {
      hasRoulette = true;
      finalColor = chosenColor || finalColor;
    } else if (card.value === "discardAll") {
      hasDiscardAll = true;
      discardAllColor = card.color;
    } else if (card.value === "7") {
      hasSwap = true;
    } else if (card.value === "0") {
      hasZero = true;
    }

    if (card.color !== "wild") finalColor = card.color;
  }

  // Reverse+4 rule: odd=reverse, even=no reverse
  if (reverseDraw4Count % 2 === 1) reverseCount++;

  // Apply all reverses
  if (reverseCount % 2 === 1) dir = dir * -1;

  ns = { ...ns, direction: dir, drawStack: stack, chainActive, chainRequiredDraw, colorStack, currentColor: finalColor };

  // ── Win condition check ───────────────────────────────────
  if (newHand.length === 0) {
    const lastCard = playedCards[playedCards.length - 1];
    const isNumberCard = (lastCard.type === "number" || lastCard.type === "seven" || lastCard.type === "zero") &&
      lastCard.value !== "0" && lastCard.value !== "7";
    // Actually per rules: must be plain number (not 0, not 7, not action)
    const canWin = lastCard.type === "number";

    if (canWin) {
      return { ...ns, winner: playerId, phase: "end", log: [...ns.log, `🏆 ${player.name} wins!`] };
    } else {
      // Penalty draw 2, continue
      ns = drawCardsFromDeck(ns, playerId, 2);
      ns = { ...ns, log: [...ns.log, `${player.name} tried to win on ${cardDisplayName(lastCard)} — draws 2 as penalty!`] };
    }
  }

  // ── Special phases ────────────────────────────────────────

  // Roulette: run immediately, store revealed cards so client can animate
  if (hasRoulette) {
    const target = nextPlayerIdx(ns.players, playerId, dir);
    let rDeck = [...ns.deck];
    let rDiscard = [...ns.discard];
    const revealedCards = [];

    while (rDeck.length > 0) {
      const card = rDeck.shift();
      revealedCards.push(card);
      if (card.color === finalColor) break;
      if (revealedCards.length > 40) break;
    }

    // Reshuffle if deck ran out before hitting the color
    if (revealedCards[revealedCards.length - 1]?.color !== finalColor && rDeck.length === 0) {
      const reshuffled = shuffle(rDiscard.slice(0, -1));
      rDeck = [...reshuffled];
      rDiscard = [rDiscard[rDiscard.length - 1]];
      while (rDeck.length > 0) {
        const card = rDeck.shift();
        revealedCards.push(card);
        if (card.color === finalColor) break;
      }
    }

    return {
      ...ns,
      deck: rDeck,
      discard: rDiscard,
      phase: "roulette",
      pendingAction: { type: "roulette", chosenColor: finalColor, targetPlayer: target, initiator: playerId, revealedCards }
    };
  }

  // Discard All
  if (hasDiscardAll) {
    return {
      ...ns,
      phase: "discardAll",
      pendingAction: { type: "discardAll", color: discardAllColor, playerId }
    };
  }

  // 7 = swap hands
  if (hasSwap && newHand.length > 0) {
    return {
      ...ns,
      phase: "swapHands",
      pendingAction: { type: "swap", playerId }
    };
  }

  // 0 = rotate all hands
  if (hasZero) {
    const alive = getAliveIds(ns.players);
    const hands = alive.map(i => ns.players[i].hand);
    const rotated = dir === 1
      ? [hands[hands.length - 1], ...hands.slice(0, -1)]
      : [...hands.slice(1), hands[0]];
    let ri = 0;
    ns = {
      ...ns,
      players: ns.players.map((p, i) =>
        alive.includes(i) ? { ...p, hand: rotated[ri++] } : p
      ),
      log: [...ns.log, "🔄 All hands rotated!"]
    };
  }

  // ── Advance turn ──────────────────────────────────────────
  let next = nextPlayerIdx(ns.players, playerId, dir);

  if (hasSkipAll) {
    next = nextPlayerIdx(ns.players, playerId, -dir);
    ns = { ...ns, log: [...ns.log, "⦸⦸ Skip All!"] };
  } else {
    for (let i = 0; i < skipCount; i++) {
      next = nextPlayerIdx(ns.players, next, dir);
    }
  }

  ns = { ...ns, currentPlayer: next };

  // 2-card penalty for deflecting a chain with a saving action card
  if (hasSavingAction) {
    ns = drawCardsFromDeck(ns, playerId, 2);
    ns = { ...ns, log: [...ns.log, `${player.name} draws 2 penalty (deflected chain)`] };
  }

  // ── Elimination check ─────────────────────────────────────
  const newPlayers = checkEliminations(ns.players, ns.settings.mercyLimit);
  ns = { ...ns, players: newPlayers };
  const alive = getAlive(newPlayers);

  if (alive.length === 1) {
    return { ...ns, winner: alive[0].id, phase: "end", log: [...ns.log, `💀 ${alive[0].name} is the last survivor!`] };
  }
  if (alive.length === 0) {
    return { ...ns, winner: null, phase: "end", log: [...ns.log, "Everyone eliminated — no winner!"] };
  }

  return ns;
}

function processDraw(state, playerId) {
  if (state.currentPlayer !== playerId) return { error: "Not your turn" };

  // Forced play: during an active chain the player must use a valid card
  if (state.chainActive && state.drawStack > 0) {
    const p = state.players[playerId];
    if (p.hand.some(c => canPlayCard(c, state))) {
      return { error: "You must play a valid card — you cannot draw when you have a valid move during a chain" };
    }
  }

  const player = state.players[playerId];
  const amount = state.drawStack > 0 ? state.drawStack : 1;

  let ns = drawCardsFromDeck(state, playerId, amount);
  ns = {
    ...ns,
    drawStack: 0,
    chainActive: false,
    chainRequiredDraw: 0,
    colorStack: [],
    log: [...ns.log, `${player.name} drew ${amount} card${amount > 1 ? "s" : ""}`],
    players: ns.players.map((p, i) => i === playerId ? { ...p, saidUno: false } : p),
  };

  const newPlayers = checkEliminations(ns.players, ns.settings.mercyLimit);
  ns = { ...ns, players: newPlayers };
  const alive = getAlive(newPlayers);

  if (alive.length === 1) {
    return { ...ns, winner: alive[0].id, phase: "end" };
  }

  const next = nextPlayerIdx(ns.players, playerId, ns.direction);
  return { ...ns, currentPlayer: next };
}

function processSwap(state, initiatorId, targetId) {
  const myHand = state.players[initiatorId].hand;
  const theirHand = state.players[targetId].hand;
  let ns = {
    ...state,
    phase: "play",
    pendingAction: null,
    players: state.players.map((p, i) => {
      if (i === initiatorId) return { ...p, hand: theirHand };
      if (i === targetId) return { ...p, hand: myHand };
      return p;
    }),
    log: [...state.log, `🔄 ${state.players[initiatorId].name} swapped hands with ${state.players[targetId].name}`]
  };
  const next = nextPlayerIdx(ns.players, initiatorId, ns.direction);
  return { ...ns, currentPlayer: next };
}

function processDiscardAll(state, playerId, cardIds) {
  const player = state.players[playerId];
  const color = state.pendingAction?.color;
  const toDiscard = player.hand.filter(c =>
    cardIds.includes(c.id) &&
    c.color === color &&
    c.type === "number" &&
    c.value !== "0" &&
    c.value !== "7"
  );
  const newHand = player.hand.filter(c => !toDiscard.map(x => x.id).includes(c.id));

  // Win: DiscardAll empties the hand AND at least one card was discarded
  if (newHand.length === 0 && toDiscard.length > 0) {
    return {
      ...state,
      phase: "end",
      winner: playerId,
      players: state.players.map((p, i) => i === playerId ? { ...p, hand: [] } : p),
      discard: [...state.discard, ...toDiscard],
      log: [...state.log, `🏆 ${player.name} wins with Discard All!`]
    };
  }

  let ns = {
    ...state,
    phase: "play",
    pendingAction: null,
    players: state.players.map((p, i) =>
      i === playerId ? { ...p, hand: newHand } : p
    ),
    discard: [...state.discard, ...toDiscard],
    log: [...state.log, `${player.name} discarded ${toDiscard.length} ${color} number card${toDiscard.length !== 1 ? "s" : ""}`]
  };
  const next = nextPlayerIdx(ns.players, playerId, ns.direction);
  return { ...ns, currentPlayer: next };
}

// processRoulette: cards were already drawn and stored in pendingAction.revealedCards
// when roulette was played. This just applies them to the target and advances the turn.
function processRoulette(state) {
  const { targetPlayer, initiator, revealedCards } = state.pendingAction;

  const newHand = [...state.players[targetPlayer].hand, ...revealedCards];
  const limit = state.settings.mercyLimit;
  const newPlayers = state.players.map((p, i) =>
    i === targetPlayer ? { ...p, hand: newHand, eliminated: newHand.length >= limit } : p
  );

  let ns = {
    ...state,
    players: newPlayers,
    phase: "play",
    pendingAction: null,
    log: [...state.log, `🎲 ${state.players[targetPlayer].name} drew ${revealedCards.length} cards from roulette!`]
  };

  const alive = getAlive(newPlayers);
  if (alive.length === 1) return { ...ns, winner: alive[0].id, phase: "end" };

  const next = nextPlayerIdx(ns.players, initiator, ns.direction);
  return { ...ns, currentPlayer: next };
}

// ─── INIT GAME ────────────────────────────────────────────────
function initGame(players, settings) {
  let deck = shuffle(createDeck());
  const gamePlayers = players.map((p, i) => ({
    id: i,
    socketId: p.socketId,
    name: p.name,
    hand: deck.splice(0, 7),
    eliminated: false,
    eliminatedHand: [],
    saidUno: false,
    unoExpiry: null,
  }));

  // First card must be a plain number card
  let si = deck.findIndex(c => c.type === "number" && c.value !== "0");
  if (si < 0) si = deck.findIndex(c => c.type === "number");
  const firstCard = deck.splice(si, 1)[0];

  return {
    deck,
    discard: [firstCard],
    players: gamePlayers,
    currentPlayer: 0,
    direction: 1,
    currentColor: firstCard.color,
    drawStack: 0,
    chainActive: false,
    colorStack: [],
    phase: "play",
    winner: null,
    pendingAction: null,
    log: [`Game started! ${gamePlayers.length} players. Mercy: ${settings.mercyLimit} cards.`],
    settings,
    turnCount: 0,
    chainRequiredDraw: 0,
  };
}

// ─── WHAT EACH CLIENT SEES ────────────────────────────────────
// Never send full hands to wrong players
function getPlayerView(state, socketId) {
  const myIdx = state.players.findIndex(p => p.socketId === socketId);
  return {
    ...state,
    players: state.players.map((p, i) => ({
      id: p.id,
      name: p.name,
      socketId: p.socketId,
      eliminated: p.eliminated,
      saidUno: p.saidUno,
      handCount: p.hand.length,
      hand: i === myIdx ? p.hand : [], // only send own hand
    })),
    myIndex: myIdx,
  };
}

function cardDisplayName(card) {
  const m = {
    draw2: "+2", draw4: "+4", draw6: "+6", draw10: "+10",
    reverseDraw4: "R+4", skip: "Skip", reverse: "Reverse",
    skipAll: "SkipAll", discardAll: "DiscardAll", wild: "Wild",
    roulette: "Roulette", "7": "Seven", "0": "Zero",
  };
  const label = m[card.value] || card.value;
  return card.color !== "wild" ? `${label}(${card.color})` : label;
}

module.exports = {
  initGame,
  processPlay,
  processDraw,
  processSwap,
  processDiscardAll,
  processRoulette,
  getPlayerView,
  canPlayCard,
  getDrawStrength,
  shuffle,
  COLORS,
};
