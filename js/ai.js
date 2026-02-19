// ═══════════════════════════════════════════════════════════════
// 🤖 Hello Kitty 麻将 — AI Opponents Engine
// Smart discard, chi/peng/gang/hu decisions, human-like delays
// ═══════════════════════════════════════════════════════════════

const AI = (() => {
  'use strict';

  // ─── Personality profiles ───
  const PERSONALITIES = {
    cautious:    { aggression: 0.3, gangRate: 0.6, chiRate: 0.7, bluffRate: 0.05, name: '🐻 慎重熊' },
    balanced:    { aggression: 0.5, gangRate: 0.7, chiRate: 0.8, bluffRate: 0.10, name: '🐰 平衡兔' },
    aggressive:  { aggression: 0.8, gangRate: 0.9, chiRate: 0.9, bluffRate: 0.15, name: '🦊 激进狐' },
  };

  const DEFAULT_PERSONALITY = 'balanced';

  // ─── Tile danger scoring ───
  // Track which tiles are visible (discarded, in melds) to estimate safety
  function buildVisibleMap(discardPile, allMelds) {
    const visible = {};
    for (const tile of discardPile) {
      visible[tile.key] = (visible[tile.key] || 0) + 1;
    }
    for (const meld of allMelds) {
      for (const tile of meld.tiles) {
        visible[tile.key] = (visible[tile.key] || 0) + 1;
      }
    }
    return visible;
  }

  // Calculate danger score for a tile (higher = more dangerous to discard)
  function tileDangerScore(tileKey, visibleMap, discardPile, playerDiscards) {
    const tile = TILES[tileKey];
    if (!tile) return 50;

    const visible = visibleMap[tileKey] || 0;
    let danger = 0;

    // If 3 already visible, it's safe (only 1 left, hard to need)
    if (visible >= 3) return 5;
    // If 2 visible, fairly safe
    if (visible >= 2) danger = 15;
    // If 1 visible, moderate
    else if (visible >= 1) danger = 30;
    // If 0 visible, potentially dangerous
    else danger = 50;

    // Honor tiles: more dangerous if none/few visible (people collect them)
    if (['feng', 'jian'].includes(tile.suit)) {
      danger += (3 - visible) * 10;
    }

    // Terminal tiles (1, 9) are slightly less dangerous
    if (tile.rank === 1 || tile.rank === 9) {
      danger -= 8;
    }

    // Middle tiles (4,5,6) are most dangerous (most sequence combinations)
    if ([4, 5, 6].includes(tile.rank)) {
      danger += 10;
    }

    // Recently discarded by others = safer (they don't need it)
    const recentDiscards = discardPile.slice(-8);
    if (recentDiscards.some(t => t.key === tileKey)) {
      danger -= 15;
    }

    // If other players discarded tiles of same suit recently, their suit is "safe"
    for (const pd of playerDiscards) {
      const last3 = pd.slice(-3);
      if (last3.some(t => t.suit === tile.suit)) {
        danger -= 5;
      }
    }

    return Math.max(0, Math.min(100, danger));
  }

  // ─── Hand evaluation: how close to winning ───
  function evaluateHand(hand, melds = []) {
    // Count pairs, potential sequences, isolated tiles
    const counts = {};
    for (const t of hand) {
      counts[t.key] = (counts[t.key] || 0) + 1;
    }

    let pairs = 0;
    let triplets = 0;
    let sequences = 0;
    let partialSeqs = 0; // two tiles that could become sequence
    let isolated = 0;

    const visited = new Set();

    for (const key of Object.keys(counts)) {
      const c = counts[key];
      if (c >= 3) triplets++;
      if (c >= 2) pairs++;

      const tile = TILES[key];
      if (tile && ['wan', 'tiao', 'tong'].includes(tile.suit)) {
        const p = key[0];
        const r = tile.rank;
        // Check sequences
        const next1 = p + (r + 1);
        const next2 = p + (r + 2);
        if (counts[next1] > 0 && counts[next2] > 0 && !visited.has(key + '_seq')) {
          sequences++;
          visited.add(key + '_seq');
        }
        // Check partial sequences
        if (counts[next1] > 0 && !counts[next2]) partialSeqs++;
        if (!counts[next1] && counts[next2] > 0) partialSeqs++;
      }
    }

    // Shanten estimate (simplified)
    const completeSets = melds.length + triplets + sequences;
    const partialSets = pairs + partialSeqs;
    const neededSets = 4;
    const shanten = Math.max(0, (neededSets - completeSets) * 2 - Math.min(partialSets, neededSets - completeSets));

    return {
      pairs, triplets, sequences, partialSeqs, isolated,
      shanten: Math.max(0, shanten),
      completeSets,
    };
  }

  // ─── Tile value in hand (how useful is keeping it) ───
  function tileValueInHand(tile, hand, melds) {
    const counts = {};
    for (const t of hand) {
      counts[t.key] = (counts[t.key] || 0) + 1;
    }

    const key = tile.key;
    const t = TILES[key];
    let value = 0;

    // Pairs and triplets are valuable
    const count = counts[key] || 0;
    if (count >= 3) value += 80;     // triplet
    else if (count >= 2) value += 50; // pair
    else value += 10;                 // single

    // Sequence potential
    if (t && ['wan', 'tiao', 'tong'].includes(t.suit)) {
      const p = key[0];
      const r = t.rank;
      const neighbors = [
        p + (r - 2), p + (r - 1), p + (r + 1), p + (r + 2)
      ];
      let seqPotential = 0;
      for (const nk of neighbors) {
        if (counts[nk] > 0) seqPotential += 15;
      }
      // Direct neighbors are more valuable
      if (counts[p + (r - 1)] > 0 && counts[p + (r + 1)] > 0) {
        seqPotential += 30; // middle of sequence
      }
      value += seqPotential;
    }

    // Honor tiles: valuable if pair/triplet, less so alone
    if (['feng', 'jian'].includes(t?.suit)) {
      if (count >= 2) value += 20; // pairs of honors are good
      else value -= 5; // isolated honors are less useful
    }

    // Terminal tiles slightly less flexible
    if (t?.rank === 1 || t?.rank === 9) {
      value -= 5;
    }

    return value;
  }

  // ─── Choose best discard ───
  function chooseDiscard(hand, melds, visibleMap, discardPile, playerDiscards, personality, rules, removedSuit) {
    const p = PERSONALITIES[personality] || PERSONALITIES[DEFAULT_PERSONALITY];

    // If Sichuan mode: must discard removed suit tiles first (缺一门)
    if (removedSuit) {
      const suitTiles = hand.filter(t => t.suit === removedSuit);
      if (suitTiles.length > 0) {
        // Discard the least useful one from removed suit
        let worst = suitTiles[0];
        let worstValue = Infinity;
        for (const t of suitTiles) {
          const val = tileValueInHand(t, hand, melds);
          if (val < worstValue) {
            worstValue = val;
            worst = t;
          }
        }
        return worst;
      }
    }

    // Score each tile: balance between hand value and discard danger
    let bestDiscard = null;
    let bestScore = -Infinity;

    for (const tile of hand) {
      const handValue = tileValueInHand(tile, hand, melds);
      const danger = tileDangerScore(tile.key, visibleMap, discardPile, playerDiscards);

      // Score = how much we want to discard (low hand value + low danger = good discard)
      const discardScore = (100 - handValue) * 0.6 + (100 - danger) * 0.4;

      // Add slight randomness for human feel
      const noise = (Math.random() - 0.5) * 15 * (1 - p.aggression);
      const finalScore = discardScore + noise;

      if (finalScore > bestScore) {
        bestScore = finalScore;
        bestDiscard = tile;
      }
    }

    return bestDiscard || hand[hand.length - 1];
  }

  // ─── Decision: should we chi? ───
  function decideChi(hand, discardTile, chiOptions, melds, personality, rules) {
    const p = PERSONALITIES[personality] || PERSONALITIES[DEFAULT_PERSONALITY];

    if (chiOptions.length === 0) return null;
    if (Math.random() > p.chiRate) return null;

    // Evaluate if chi improves our hand
    const currentEval = evaluateHand(hand, melds);

    for (const option of chiOptions) {
      // Simulate chi
      const newHand = hand.filter(t => {
        const needed = option.filter(r => r !== discardTile.rank);
        for (const r of needed) {
          if (t.suit === discardTile.suit && t.rank === r) {
            const idx = needed.indexOf(r);
            if (idx >= 0) {
              needed.splice(idx, 1);
              return false;
            }
          }
        }
        return true;
      });

      const newEval = evaluateHand(newHand, [...melds, { type: 'chi', tiles: [] }]);

      if (newEval.shanten < currentEval.shanten) {
        return option;
      }
    }

    // Maybe chi anyway if aggressive
    if (Math.random() < p.aggression * 0.3 && chiOptions.length > 0) {
      return chiOptions[0];
    }

    return null;
  }

  // ─── Decision: should we peng? ───
  function decidePeng(hand, discardTile, melds, personality, rules) {
    const p = PERSONALITIES[personality] || PERSONALITIES[DEFAULT_PERSONALITY];

    // Almost always peng — it's a strong move
    const currentEval = evaluateHand(hand, melds);

    // Simulate peng
    const newHand = hand.filter(t => t.key !== discardTile.key).slice(0, hand.length - 2);
    const newEval = evaluateHand(newHand, [...melds, { type: 'peng', tiles: [] }]);

    // Peng if it improves position or we're aggressive
    if (newEval.shanten <= currentEval.shanten) return true;
    if (Math.random() < p.aggression * 0.5) return true;

    return false;
  }

  // ─── Decision: should we gang? ───
  function decideGang(hand, tileKey, melds, personality) {
    const p = PERSONALITIES[personality] || PERSONALITIES[DEFAULT_PERSONALITY];

    // Gang is usually good (free tile + score bonus)
    // But it reveals information and reduces flexibility
    if (Math.random() < p.gangRate) return true;

    // Always gang if close to winning
    const eval_ = evaluateHand(hand, melds);
    if (eval_.shanten <= 1) return true;

    return false;
  }

  // ─── Decision: should we hu? ───
  function decideHu() {
    // Always hu if possible! (In real play, sometimes strategic not to, but AI always takes it)
    return true;
  }

  // ─── Choose removed suit for Sichuan ───
  function chooseQueYiMen(hand) {
    return SichuanRules.suggestQueYiMen(hand);
  }

  // ─── Delayed action wrapper (human-like timing) ───
  function delayedAction(callback, baseDelay = 500) {
    // 300-800ms with variance
    const delay = baseDelay + Math.random() * 300 - 100;
    return new Promise(resolve => {
      setTimeout(() => {
        const result = callback();
        resolve(result);
      }, Math.max(200, delay));
    });
  }

  // ─── Full AI turn ───
  async function takeTurn(playerState, gameState) {
    const {
      hand, melds, personality = DEFAULT_PERSONALITY, playerIndex, removedSuit
    } = playerState;

    const {
      discardPile, allMelds, playerDiscards, rules, remainingTiles
    } = gameState;

    const visibleMap = buildVisibleMap(discardPile, allMelds);

    // Check for an gang first
    const anGangs = rules.findAnGang(hand);
    if (anGangs.length > 0) {
      for (const gangKey of anGangs) {
        if (decideGang(hand, gangKey, melds, personality)) {
          return await delayedAction(() => ({
            action: 'angang',
            tileKey: gangKey,
          }), 600);
        }
      }
    }

    // Check for jia gang
    const jiaGangs = rules.findJiaGang(hand, melds);
    if (jiaGangs.length > 0) {
      for (const gangKey of jiaGangs) {
        if (decideGang(hand, gangKey, melds, personality)) {
          return await delayedAction(() => ({
            action: 'jiagang',
            tileKey: gangKey,
          }), 600);
        }
      }
    }

    // Choose discard
    const discard = chooseDiscard(
      hand, melds, visibleMap, discardPile, playerDiscards,
      personality, rules, removedSuit
    );

    return await delayedAction(() => ({
      action: 'discard',
      tile: discard,
    }), 500);
  }

  // ─── React to a discard from another player ───
  async function reactToDiscard(playerState, discardTile, discardPlayerIndex, gameState) {
    const {
      hand, melds, personality = DEFAULT_PERSONALITY, playerIndex, removedSuit
    } = playerState;

    const { rules } = gameState;

    // Priority: Hu > Gang > Peng > Chi > Pass

    // Check hu
    const huResult = rules.checkCanHu(hand, discardTile, melds);
    if (huResult && decideHu()) {
      return await delayedAction(() => ({
        action: 'hu',
        tile: discardTile,
      }), 400);
    }

    // Check gang
    if (rules.canGang(hand, discardTile)) {
      if (decideGang(hand, discardTile.key, melds, personality)) {
        return await delayedAction(() => ({
          action: 'gang',
          tile: discardTile,
        }), 600);
      }
    }

    // Check peng
    if (rules.canPeng(hand, discardTile)) {
      if (decidePeng(hand, discardTile, melds, personality, rules)) {
        return await delayedAction(() => ({
          action: 'peng',
          tile: discardTile,
        }), 500);
      }
    }

    // Check chi (only from left player)
    const chiOptions = rules.canChi(hand, discardTile, playerIndex, discardPlayerIndex);
    if (chiOptions.length > 0) {
      const chiChoice = decideChi(hand, discardTile, chiOptions, melds, personality, rules);
      if (chiChoice) {
        return await delayedAction(() => ({
          action: 'chi',
          tile: discardTile,
          option: chiChoice,
        }), 500);
      }
    }

    // Pass
    return { action: 'pass' };
  }

  // ─── Get personality for player index ───
  function getPersonality(playerIndex) {
    const types = ['balanced', 'cautious', 'aggressive', 'balanced'];
    return types[playerIndex % types.length];
  }

  // ─── Public API ───
  return {
    PERSONALITIES,
    takeTurn,
    reactToDiscard,
    chooseDiscard,
    chooseQueYiMen,
    evaluateHand,
    getPersonality,
    buildVisibleMap,
    tileDangerScore,
    delayedAction,
  };
})();
