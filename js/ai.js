// ═══════════════════════════════════════════════════════════════
// 🤖 Hello Kitty 麻将 — AI Engine v2.0
// Character-based personalities, smart discard, reactions
// ═══════════════════════════════════════════════════════════════

const AI = (() => {
  'use strict';

  // ─── Legacy personality mapping (backwards compat) ───
  const PERSONALITIES = {
    cautious:    { aggression: 0.3, gangRate: 0.6, chiRate: 0.7, bluffRate: 0.05, riskTolerance: 0.3, name: '慎重' },
    balanced:    { aggression: 0.5, gangRate: 0.7, chiRate: 0.8, bluffRate: 0.10, riskTolerance: 0.5, name: '平衡' },
    aggressive:  { aggression: 0.8, gangRate: 0.9, chiRate: 0.9, bluffRate: 0.15, riskTolerance: 0.8, name: '激进' },
    friendly:    { aggression: 0.5, gangRate: 0.7, chiRate: 0.8, bluffRate: 0.05, riskTolerance: 0.5, name: '友好' },
    defensive:   { aggression: 0.2, gangRate: 0.4, chiRate: 0.9, bluffRate: 0.02, riskTolerance: 0.2, name: '防守' },
    tricky:      { aggression: 0.6, gangRate: 0.6, chiRate: 0.7, bluffRate: 0.35, riskTolerance: 0.6, name: '狡猾' },
    wise:        { aggression: 0.6, gangRate: 0.8, chiRate: 0.6, bluffRate: 0.1,  riskTolerance: 0.4, name: '睿智' },
    legendary:   { aggression: 0.7, gangRate: 0.85, chiRate: 0.75, bluffRate: 0.25, riskTolerance: 0.7, name: '传奇' },
  };

  // ─── Get personality for a character or legacy type ───
  function getProfile(personalityOrCharId) {
    // Try character system first
    if (typeof Characters !== 'undefined') {
      const char = Characters.getCharacter(personalityOrCharId);
      if (char?.aiProfile) return char.aiProfile;
    }
    return PERSONALITIES[personalityOrCharId] || PERSONALITIES.balanced;
  }

  // ─── Tile danger scoring ───
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

  function tileDangerScore(tileKey, visibleMap, discardPile, playerDiscards) {
    const tile = TILES[tileKey];
    if (!tile) return 50;
    const visible = visibleMap[tileKey] || 0;
    let danger = 0;

    if (visible >= 3) return 5;
    if (visible >= 2) danger = 15;
    else if (visible >= 1) danger = 30;
    else danger = 50;

    if (['feng', 'jian'].includes(tile.suit)) danger += (3 - visible) * 10;
    if (tile.rank === 1 || tile.rank === 9) danger -= 8;
    if ([4, 5, 6].includes(tile.rank)) danger += 10;

    const recentDiscards = discardPile.slice(-8);
    if (recentDiscards.some(t => t.key === tileKey)) danger -= 15;

    for (const pd of playerDiscards) {
      const last3 = pd.slice(-3);
      if (last3.some(t => t.suit === tile.suit)) danger -= 5;
    }

    return Math.max(0, Math.min(100, danger));
  }

  // ─── Hand evaluation ───
  function evaluateHand(hand, melds = []) {
    const counts = {};
    for (const t of hand) counts[t.key] = (counts[t.key] || 0) + 1;

    let pairs = 0, triplets = 0, sequences = 0, partialSeqs = 0;
    const visited = new Set();

    for (const key of Object.keys(counts)) {
      const c = counts[key];
      if (c >= 3) triplets++;
      if (c >= 2) pairs++;
      const tile = TILES[key];
      if (tile && ['wan', 'tiao', 'tong'].includes(tile.suit)) {
        const p = key[0];
        const r = tile.rank;
        const next1 = p + (r + 1), next2 = p + (r + 2);
        if (counts[next1] > 0 && counts[next2] > 0 && !visited.has(key + '_seq')) {
          sequences++;
          visited.add(key + '_seq');
        }
        if (counts[next1] > 0 && !counts[next2]) partialSeqs++;
        if (!counts[next1] && counts[next2] > 0) partialSeqs++;
      }
    }

    const completeSets = melds.length + triplets + sequences;
    const partialSets = pairs + partialSeqs;
    const neededSets = 4;
    const shanten = Math.max(0, (neededSets - completeSets) * 2 - Math.min(partialSets, neededSets - completeSets));

    return { pairs, triplets, sequences, partialSeqs, shanten, completeSets };
  }

  // ─── Tile value in hand ───
  function tileValueInHand(tile, hand, melds) {
    const counts = {};
    for (const t of hand) counts[t.key] = (counts[t.key] || 0) + 1;

    const key = tile.key;
    const t = TILES[key];
    let value = 0;
    const count = counts[key] || 0;

    if (count >= 3) value += 80;
    else if (count >= 2) value += 50;
    else value += 10;

    if (t && ['wan', 'tiao', 'tong'].includes(t.suit)) {
      const p = key[0];
      const r = t.rank;
      const neighbors = [p + (r - 2), p + (r - 1), p + (r + 1), p + (r + 2)];
      let seqPotential = 0;
      for (const nk of neighbors) {
        if (counts[nk] > 0) seqPotential += 15;
      }
      if (counts[p + (r - 1)] > 0 && counts[p + (r + 1)] > 0) seqPotential += 30;
      value += seqPotential;
    }

    if (['feng', 'jian'].includes(t?.suit)) {
      if (count >= 2) value += 20;
      else value -= 5;
    }

    if (t?.rank === 1 || t?.rank === 9) value -= 5;

    return value;
  }

  // ─── Choose best discard (character-aware) ───
  function chooseDiscard(hand, melds, visibleMap, discardPile, playerDiscards, personality, rules, removedSuit, difficulty) {
    const p = getProfile(personality);
    const diff = difficulty || 0.5;

    // Sichuan: must discard removed suit tiles first
    if (removedSuit) {
      const suitTiles = hand.filter(t => t.suit === removedSuit);
      if (suitTiles.length > 0) {
        let worst = suitTiles[0], worstValue = Infinity;
        for (const t of suitTiles) {
          const val = tileValueInHand(t, hand, melds);
          if (val < worstValue) { worstValue = val; worst = t; }
        }
        return worst;
      }
    }

    let bestDiscard = null, bestScore = -Infinity;

    for (const tile of hand) {
      const handValue = tileValueInHand(tile, hand, melds);
      const danger = tileDangerScore(tile.key, visibleMap, discardPile, playerDiscards);

      // Personality affects weight: aggressive cares more about hand value, cautious about safety
      const offenseWeight = 0.4 + p.aggression * 0.3;
      const defenseWeight = 1 - offenseWeight;

      const discardScore = (100 - handValue) * offenseWeight + (100 - danger) * defenseWeight;

      // Bluff factor: sometimes discard a "good" tile to confuse
      const bluffBonus = Math.random() < p.bluffRate ? 20 : 0;

      // Difficulty affects randomness
      const noise = (Math.random() - 0.5) * 30 * (1 - diff);
      const finalScore = discardScore + noise + bluffBonus;

      if (finalScore > bestScore) { bestScore = finalScore; bestDiscard = tile; }
    }

    return bestDiscard || hand[hand.length - 1];
  }

  // ─── Decision functions ───
  function decideChi(hand, discardTile, chiOptions, melds, personality, rules) {
    const p = getProfile(personality);
    if (chiOptions.length === 0) return null;
    if (Math.random() > p.chiRate) return null;

    const currentEval = evaluateHand(hand, melds);
    for (const option of chiOptions) {
      const newHand = hand.filter(t => {
        const needed = option.filter(r => r !== discardTile.rank);
        for (const r of needed) {
          if (t.suit === discardTile.suit && t.rank === r) {
            const idx = needed.indexOf(r);
            if (idx >= 0) { needed.splice(idx, 1); return false; }
          }
        }
        return true;
      });
      const newEval = evaluateHand(newHand, [...melds, { type: 'chi', tiles: [] }]);
      if (newEval.shanten < currentEval.shanten) return option;
    }
    if (Math.random() < p.aggression * 0.3 && chiOptions.length > 0) return chiOptions[0];
    return null;
  }

  function decidePeng(hand, discardTile, melds, personality) {
    const p = getProfile(personality);
    const currentEval = evaluateHand(hand, melds);
    const newHand = hand.filter(t => t.key !== discardTile.key).slice(0, hand.length - 2);
    const newEval = evaluateHand(newHand, [...melds, { type: 'peng', tiles: [] }]);
    if (newEval.shanten <= currentEval.shanten) return true;
    if (Math.random() < p.aggression * 0.5) return true;
    return false;
  }

  function decideGang(hand, tileKey, melds, personality) {
    const p = getProfile(personality);
    if (Math.random() < p.gangRate) return true;
    const eval_ = evaluateHand(hand, melds);
    if (eval_.shanten <= 1) return true;
    return false;
  }

  function decideHu() { return true; }

  function chooseQueYiMen(hand) {
    return SichuanRules.suggestQueYiMen(hand);
  }

  // ─── Delayed action with personality-based timing ───
  function delayedAction(callback, baseDelay = 500) {
    const delay = baseDelay + Math.random() * 300 - 100;
    return new Promise(resolve => {
      setTimeout(() => resolve(callback()), Math.max(200, delay));
    });
  }

  // ─── Full AI turn ───
  async function takeTurn(playerState, gameState) {
    const { hand, melds, personality = 'balanced', playerIndex, removedSuit } = playerState;
    const { discardPile, allMelds, playerDiscards, rules, remainingTiles } = gameState;
    const difficulty = gameState.aiDifficulty || 0.5;
    const visibleMap = buildVisibleMap(discardPile, allMelds);

    // Check an gang
    const anGangs = rules.findAnGang(hand);
    if (anGangs.length > 0) {
      for (const gangKey of anGangs) {
        if (decideGang(hand, gangKey, melds, personality)) {
          return await delayedAction(() => ({ action: 'angang', tileKey: gangKey }), 600);
        }
      }
    }

    // Check jia gang
    const jiaGangs = rules.findJiaGang(hand, melds);
    if (jiaGangs.length > 0) {
      for (const gangKey of jiaGangs) {
        if (decideGang(hand, gangKey, melds, personality)) {
          return await delayedAction(() => ({ action: 'jiagang', tileKey: gangKey }), 600);
        }
      }
    }

    const discard = chooseDiscard(hand, melds, visibleMap, discardPile, playerDiscards, personality, rules, removedSuit, difficulty);
    return await delayedAction(() => ({ action: 'discard', tile: discard }), 500);
  }

  // ─── React to discard ───
  async function reactToDiscard(playerState, discardTile, discardPlayerIndex, gameState) {
    const { hand, melds, personality = 'balanced', playerIndex, removedSuit } = playerState;
    const { rules } = gameState;

    const huResult = rules.checkCanHu(hand, discardTile, melds);
    if (huResult && decideHu()) {
      return await delayedAction(() => ({ action: 'hu', tile: discardTile }), 400);
    }

    if (rules.canGang(hand, discardTile)) {
      if (decideGang(hand, discardTile.key, melds, personality)) {
        return await delayedAction(() => ({ action: 'gang', tile: discardTile }), 600);
      }
    }

    if (rules.canPeng(hand, discardTile)) {
      if (decidePeng(hand, discardTile, melds, personality)) {
        return await delayedAction(() => ({ action: 'peng', tile: discardTile }), 500);
      }
    }

    const chiOptions = rules.canChi(hand, discardTile, playerIndex, discardPlayerIndex);
    if (chiOptions.length > 0) {
      const chiChoice = decideChi(hand, discardTile, chiOptions, melds, personality, rules);
      if (chiChoice) {
        return await delayedAction(() => ({ action: 'chi', tile: discardTile, option: chiChoice }), 500);
      }
    }

    return { action: 'pass' };
  }

  return {
    PERSONALITIES,
    getProfile,
    takeTurn,
    reactToDiscard,
    chooseDiscard,
    chooseQueYiMen,
    evaluateHand,
    buildVisibleMap,
    tileDangerScore,
    delayedAction,
  };
})();
