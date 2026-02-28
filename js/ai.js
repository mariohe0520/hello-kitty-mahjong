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

  // ─── FEATURE 6: Check if action breaks tenpai ───
  function isTenpai(hand, melds, rulesEngine) {
    if (!rulesEngine || hand.length !== 13) return false;
    const tingTiles = rulesEngine.getTingTiles(hand, melds);
    return tingTiles.length > 0;
  }

  function wouldBreakTenpai(hand, melds, discardTile, actionType, rulesEngine) {
    if (!rulesEngine) return false;
    // Only check if currently tenpai
    if (!isTenpai(hand, melds, rulesEngine)) return false;

    // Simulate the action
    if (actionType === 'peng') {
      // After peng: remove 2 matching tiles, add meld, hand goes to 12 tiles (need to discard to 13-3=10 in hand)
      // Actually after peng we have hand.length-2 tiles in hand + 1 new meld, then need to discard
      // So after peng+discard: hand is (hand.length-2-1)=hand.length-3 in hand + melds.length+1 melds
      // Check if any discard after peng keeps us tenpai
      const newHand = hand.filter(t => t.key !== discardTile.key);
      // Remove only 2 copies
      let removed = 0;
      const pengHand = [];
      for (const t of hand) {
        if (t.key === discardTile.key && removed < 2) {
          removed++;
          continue;
        }
        pengHand.push(t);
      }
      const newMelds = [...melds, { type: 'peng', tiles: [{key: discardTile.key},{key: discardTile.key},{key: discardTile.key}] }];

      // Check if any discard from pengHand leaves us tenpai
      for (const candidate of pengHand) {
        const afterDiscard = pengHand.filter(t => t.id !== candidate.id);
        if (afterDiscard.length === 13 || afterDiscard.length === 10 || afterDiscard.length === 7 || afterDiscard.length === 4 || afterDiscard.length === 1) {
          const ting = rulesEngine.getTingTiles(afterDiscard, newMelds);
          if (ting.length > 0) return false; // Found a discard that maintains tenpai
        }
      }
      return true; // No discard maintains tenpai
    }

    if (actionType === 'chi') {
      // Similar: after chi we lose 2 tiles from hand, gain a meld, then discard
      // This is harder to check generically, so approximate by checking shanten
      return false; // Allow chi if shanten improves — handled in decideChi
    }

    return false;
  }

  // ─── Decision functions ───
  function decideChi(hand, discardTile, chiOptions, melds, personality, rules) {
    const p = getProfile(personality);
    if (chiOptions.length === 0) return null;
    if (Math.random() > p.chiRate) return null;

    // FEATURE 6: Don't chi if it breaks tenpai
    if (rules && isTenpai(hand, melds, rules)) {
      // Check each chi option to see if any maintains tenpai
      let anyMaintains = false;
      for (const option of chiOptions) {
        const neededRanks = option.filter(r => r !== discardTile.rank);
        const chiHand = [...hand];
        for (const rank of neededRanks) {
          const idx = chiHand.findIndex(t => t.suit === discardTile.suit && t.rank === rank);
          if (idx >= 0) chiHand.splice(idx, 1);
        }
        const newMelds = [...melds, { type: 'chi', tiles: [] }];
        // After chi, we need to discard one tile. Check if any discard maintains tenpai.
        for (const candidate of chiHand) {
          const afterDiscard = chiHand.filter(t => t.id !== candidate.id);
          const ting = rules.getTingTiles(afterDiscard, newMelds);
          if (ting.length > 0) { anyMaintains = true; break; }
        }
        if (anyMaintains) break;
      }
      if (!anyMaintains) return null; // Decline chi to protect tenpai
    }

    const currentEval = evaluateHand(hand, melds);
    for (const option of chiOptions) {
      const needed = option.filter(r => r !== discardTile.rank);
      const newHand = [...hand];
      for (const r of needed) {
        const idx = newHand.findIndex(t => t.suit === discardTile.suit && t.rank === r);
        if (idx >= 0) newHand.splice(idx, 1);
      }
      const newEval = evaluateHand(newHand, [...melds, { type: 'chi', tiles: [] }]);
      if (newEval.shanten < currentEval.shanten) return option;
    }
    if (Math.random() < p.aggression * 0.3 && chiOptions.length > 0) return chiOptions[0];
    return null;
  }

  function decidePeng(hand, discardTile, melds, personality, rules) {
    const p = getProfile(personality);

    // FEATURE 6: Don't peng if it would break tenpai
    if (rules && wouldBreakTenpai(hand, melds, discardTile, 'peng', rules)) {
      return false; // Protect tenpai
    }

    const currentEval = evaluateHand(hand, melds);
    let removed = 0;
    const newHand = hand.filter(t => {
      if (t.key === discardTile.key && removed < 2) { removed++; return false; }
      return true;
    });
    const newEval = evaluateHand(newHand, [...melds, { type: 'peng', tiles: [] }]);
    if (newEval.shanten <= currentEval.shanten) return true;
    if (Math.random() < p.aggression * 0.5) return true;
    return false;
  }

  function decideGang(hand, tileKey, melds, personality, rules) {
    const p = getProfile(personality);

    // FEATURE 6: Don't gang if it breaks tenpai (for jia gang)
    if (rules && hand.length === 13) {
      if (isTenpai(hand, melds, rules)) {
        // After gang, we draw a replacement — might be okay, but risky
        // Only gang if personality is aggressive enough
        if (p.aggression < 0.6) return false;
      }
    }

    if (Math.random() < p.gangRate) return true;
    const eval_ = evaluateHand(hand, melds);
    if (eval_.shanten <= 1) return true;
    return false;
  }

  function decideHu(hand, melds, scoreResult, mode) {
    // FEATURE 6: In blood war mode, evaluate whether to take a low-score win
    if (mode === 'sichuan' && scoreResult) {
      // If score is very low (1 fan pinghu) and we could wait for better, sometimes skip
      if (scoreResult.totalFan <= 1 && Math.random() < 0.15) {
        return false; // 15% chance to skip a 1-fan win hoping for better
      }
    }
    return true;
  }

  function chooseQueYiMen(hand) {
    return SichuanRules.suggestQueYiMen(hand);
  }

  // ─── Delayed action with personality-based timing ───
  // Each personality has a distinct "thinking time" feel:
  //   aggressive  → fast, impulsive (shorter delays)
  //   defensive   → slow, careful (longer delays, more variance)
  //   tricky      → unpredictable (high variance, sometimes fast sometimes slow)
  //   balanced    → moderate timing
  function delayedAction(callback, baseDelay = 500, personality = null) {
    let minDelay = baseDelay * 0.5;
    let maxDelay = baseDelay * 1.6;
    let jitter = 0;

    if (personality) {
      const pKey = typeof personality === 'string' ? personality : 'balanced';
      switch (pKey) {
        case 'aggressive':
          // Fox: impulsive, snappy reactions — discards fast
          minDelay = baseDelay * 0.35;
          maxDelay = baseDelay * 0.9;
          break;
        case 'defensive':
          // Bunny: very deliberate, thinks carefully — always slow
          minDelay = baseDelay * 0.9;
          maxDelay = baseDelay * 2.2;
          jitter = Math.random() < 0.3 ? baseDelay * 0.8 : 0; // occasional extra pause
          break;
        case 'tricky':
          // Fox: wildly unpredictable — sometimes instant, sometimes very slow to throw off timing
          if (Math.random() < 0.35) {
            minDelay = baseDelay * 0.2;
            maxDelay = baseDelay * 0.5;
          } else {
            minDelay = baseDelay * 0.8;
            maxDelay = baseDelay * 2.5;
          }
          break;
        case 'cautious':
        case 'defensive':
          minDelay = baseDelay * 1.0;
          maxDelay = baseDelay * 2.0;
          break;
        case 'wise':
          // Thoughtful, methodical
          minDelay = baseDelay * 0.7;
          maxDelay = baseDelay * 1.8;
          break;
        default:
          // balanced
          minDelay = baseDelay * 0.5;
          maxDelay = baseDelay * 1.6;
      }
    }

    const delay = minDelay + Math.random() * (maxDelay - minDelay) + jitter;
    return new Promise(resolve => {
      setTimeout(() => resolve(callback()), Math.max(180, delay));
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
        if (decideGang(hand, gangKey, melds, personality, rules)) {
          return await delayedAction(() => ({ action: 'angang', tileKey: gangKey }), 600, personality);
        }
      }
    }

    // Check jia gang
    const jiaGangs = rules.findJiaGang(hand, melds);
    if (jiaGangs.length > 0) {
      for (const gangKey of jiaGangs) {
        if (decideGang(hand, gangKey, melds, personality, rules)) {
          return await delayedAction(() => ({ action: 'jiagang', tileKey: gangKey }), 600, personality);
        }
      }
    }

    const discard = chooseDiscard(hand, melds, visibleMap, discardPile, playerDiscards, personality, rules, removedSuit, difficulty);
    return await delayedAction(() => ({ action: 'discard', tile: discard }), 500, personality);
  }

  // ─── React to discard ───
  async function reactToDiscard(playerState, discardTile, discardPlayerIndex, gameState) {
    const { hand, melds, personality = 'balanced', playerIndex, removedSuit } = playerState;
    const { rules } = gameState;

    const huResult = rules.checkCanHu(hand, discardTile, melds);
    if (huResult) {
      // FEATURE 6: Calculate score to decide if win is worth taking
      const testHand = [...hand, discardTile];
      let scoreResult = null;
      try {
        scoreResult = rules.calculateScore(testHand, melds, discardTile, { isZimo: false });
      } catch(e) { /* scoring may fail on edge cases */ }
      if (decideHu(hand, melds, scoreResult, gameState.mode || 'beijing')) {
        // Hu reactions are always fast regardless of personality (can't hold a winning hand!)
        return await delayedAction(() => ({ action: 'hu', tile: discardTile }), 300, 'aggressive');
      }
    }

    if (rules.canGang(hand, discardTile)) {
      if (decideGang(hand, discardTile.key, melds, personality, rules)) {
        return await delayedAction(() => ({ action: 'gang', tile: discardTile }), 600, personality);
      }
    }

    if (rules.canPeng(hand, discardTile)) {
      if (decidePeng(hand, discardTile, melds, personality, rules)) {
        return await delayedAction(() => ({ action: 'peng', tile: discardTile }), 500, personality);
      }
    }

    const chiOptions = rules.canChi(hand, discardTile, playerIndex, discardPlayerIndex);
    if (chiOptions.length > 0) {
      const chiChoice = decideChi(hand, discardTile, chiOptions, melds, personality, rules);
      if (chiChoice) {
        return await delayedAction(() => ({ action: 'chi', tile: discardTile, option: chiChoice }), 500, personality);
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
    // FEATURE 6: Exposed for external use
    decideHu,
    isTenpai,
    wouldBreakTenpai,
  };
})();
