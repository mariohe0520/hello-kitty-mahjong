// ═══════════════════════════════════════════════════════════════
// 🌶️ Hello Kitty 麻将 — 四川血战麻将规则引擎
// 108 tiles, blood war mode, 缺一门
// ═══════════════════════════════════════════════════════════════

const SichuanRules = (() => {
  'use strict';

  // ─── Constants ───
  const TOTAL_TILES = 108;
  const HAND_SIZE = 13;
  const WIN_HAND_SIZE = 14;
  const SUITS = ['wan', 'tiao', 'tong'];
  const SUIT_PREFIXES = { wan: 'w', tiao: 't', tong: 'b' };

  // ─── Scoring ───
  const SCORING = {
    pinghu:      { fan: 1,  name: '平胡',     desc: '基本胡牌' },
    duanyao:     { fan: 1,  name: '断幺九',   desc: '没有1和9' },
    qidui:       { fan: 2,  name: '七对',     desc: '七个对子' },
    longQiDui:   { fan: 4,  name: '龙七对',   desc: '七对含四张相同' },
    duidui:      { fan: 2,  name: '对对胡',   desc: '全部刻子' },
    qingyi:      { fan: 4,  name: '清一色',   desc: '全部一种花色' },
    jinGouDiao:  { fan: 4,  name: '金钩钓',   desc: '四个刻子手中只剩一张' },
    shibaLuoHan: { fan: 32, name: '十八罗汉', desc: '四个杠' },
    qingQidui:   { fan: 8,  name: '清七对',   desc: '清一色七对' },
    qingDuidui:  { fan: 8,  name: '清对对',   desc: '清一色对对胡' },
    jiangDui:    { fan: 4,  name: '将对',     desc: '全部是2、5、8' },
    zimo:        { fan: 1,  name: '自摸',     desc: '自己摸牌胡' },
    gangShangHua:{ fan: 1,  name: '杠上花',   desc: '杠后摸牌胡' },
    gangShangPao:{ fan: 1,  name: '杠上炮',   desc: '杠后打出被胡' },
    qiangGang:   { fan: 1,  name: '抢杠',     desc: '别人加杠时胡牌' },
    haidi:       { fan: 1,  name: '海底捞月', desc: '最后一张牌胡' },
    menQing:     { fan: 1,  name: '门清',     desc: '没有吃碰杠（暗手）' },
    tianHu:      { fan: 16, name: '天胡',     desc: '庄家起手胡' },
    diHu:        { fan: 16, name: '地胡',     desc: '闲家第一次摸牌胡' },
  };

  // ─── Core decomposition (reuse same algorithm as Beijing) ───
  function handToCountMap(hand) {
    const counts = {};
    for (const tile of hand) {
      counts[tile.key] = (counts[tile.key] || 0) + 1;
    }
    return counts;
  }

  function getKeys(counts) {
    return Object.keys(counts).filter(k => counts[k] > 0);
  }

  function cloneCounts(counts) {
    return { ...counts };
  }

  function canDecompose(counts) {
    const keys = getKeys(counts);
    if (keys.length === 0) return true;

    const firstKey = keys.sort()[0];
    const tile = TILES[firstKey];
    if (!tile) return false;

    // Try triplet
    if (counts[firstKey] >= 3) {
      const next = cloneCounts(counts);
      next[firstKey] -= 3;
      if (next[firstKey] === 0) delete next[firstKey];
      if (canDecompose(next)) return true;
    }

    // Try sequence
    if (['wan', 'tiao', 'tong'].includes(tile.suit) && tile.rank <= 7) {
      const p = firstKey[0];
      const r = tile.rank;
      const k2 = p + (r + 1);
      const k3 = p + (r + 2);
      if (counts[k2] > 0 && counts[k3] > 0) {
        const next = cloneCounts(counts);
        next[firstKey]--;
        next[k2]--;
        next[k3]--;
        if (next[firstKey] === 0) delete next[firstKey];
        if (next[k2] === 0) delete next[k2];
        if (next[k3] === 0) delete next[k3];
        if (canDecompose(next)) return true;
      }
    }

    return false;
  }

  // ─── Standard win check ───
  function checkStandardWin(hand, melds = []) {
    const totalTiles = hand.length + melds.reduce((s, m) => s + m.tiles.length, 0);
    if (totalTiles !== WIN_HAND_SIZE) return null;

    const counts = handToCountMap(hand);
    const results = [];

    for (const key of getKeys(counts)) {
      if (counts[key] >= 2) {
        const remaining = cloneCounts(counts);
        remaining[key] -= 2;
        if (remaining[key] === 0) delete remaining[key];
        if (canDecompose(remaining)) {
          results.push({ pair: key, type: 'standard' });
        }
      }
    }

    return results.length > 0 ? results : null;
  }

  // ─── Seven pairs ───
  function checkSevenPairs(hand) {
    if (hand.length !== WIN_HAND_SIZE) return null;
    const counts = handToCountMap(hand);
    const keys = getKeys(counts);

    // Allow dragon pairs (4 of same counts as 2 pairs)
    let pairs = 0;
    let hasFour = false;
    for (const key of keys) {
      const c = counts[key];
      if (c === 2) pairs++;
      else if (c === 4) { pairs += 2; hasFour = true; }
      else return null;
    }

    if (pairs !== 7) return null;
    return [{ type: hasFour ? 'longQiDui' : 'qidui' }];
  }

  // ─── Master win check ───
  function checkWin(hand, melds = []) {
    const results = [];

    const standard = checkStandardWin(hand, melds);
    if (standard) results.push(...standard);

    if (melds.length === 0) {
      const qidui = checkSevenPairs(hand);
      if (qidui) results.push(...qidui);
    }

    return results.length > 0 ? results : null;
  }

  function checkCanHu(hand, tile, melds = []) {
    const testHand = [...hand, tile];
    return checkWin(testHand, melds);
  }

  // ─── 缺一门 validation ───
  // Returns which suit the player should remove (the one with fewest tiles)
  function suggestQueYiMen(hand) {
    const suitCounts = { wan: 0, tiao: 0, tong: 0 };
    for (const tile of hand) {
      if (suitCounts[tile.suit] !== undefined) {
        suitCounts[tile.suit]++;
      }
    }

    // Sort by count ascending — remove the suit with fewest tiles
    const sorted = SUITS.slice().sort((a, b) => suitCounts[a] - suitCounts[b]);
    return sorted[0];
  }

  // Check if hand satisfies 缺一门
  function isQueYiMenSatisfied(hand, removedSuit) {
    return !hand.some(t => t.suit === removedSuit);
  }

  // Get tiles of the removed suit (these need to be discarded first)
  function getQueYiMenDiscards(hand, removedSuit) {
    return hand.filter(t => t.suit === removedSuit);
  }

  // ─── Scoring ───
  function calculateScore(hand, melds, winTile, options = {}) {
    const {
      isZimo = false,
      isGangShang = false,
      isGangShangPao = false,
      isQiangGang = false,
      isHaidi = false,
      isTianHu = false,
      isDiHu = false,
      removedSuit = null,
    } = options;

    const allTiles = [...hand];
    const lockedMelds = melds || [];
    const counts = handToCountMap(allTiles);
    const fans = [];
    let totalFan = 0;

    // Verify 缺一门
    if (removedSuit && !isQueYiMenSatisfied(hand, removedSuit)) {
      return { fans: [], totalFan: 0, baseScore: 0, error: '未完成缺一门' };
    }

    // ─── Check seven pairs ───
    const qiduiResult = checkSevenPairs(allTiles);
    const isQidui = !!qiduiResult;
    const isLongQidui = qiduiResult && qiduiResult[0]?.type === 'longQiDui';

    if (isLongQidui) {
      fans.push(SCORING.longQiDui);
      totalFan += SCORING.longQiDui.fan;
    } else if (isQidui) {
      fans.push(SCORING.qidui);
      totalFan += SCORING.qidui.fan;
    }

    // ─── Suit analysis ───
    const allKeys = allTiles.map(t => t.key);
    const suits = new Set(allKeys.map(k => TILES[k]?.suit));
    const numSuits = [...suits].filter(s => SUITS.includes(s));
    const isQingYi = numSuits.length === 1;

    // ─── Check duidui ───
    let isDuidui = false;
    if (!isQidui) {
      const meldKeys = [];
      // Extract melds to check for all triplets
      const decomps = extractMelds(allTiles);
      if (decomps.length > 0) {
        const allTrip = decomps.some(d =>
          d.melds.every(m => m.type === 'triplet') &&
          lockedMelds.every(m => m.type !== 'chi')
        );
        if (allTrip) isDuidui = true;
      }
    }

    // Pinghu
    if (!isQidui && !isDuidui && !isQingYi) {
      fans.push(SCORING.pinghu);
      totalFan += SCORING.pinghu.fan;
    }

    // Duidui
    if (isDuidui) {
      fans.push(SCORING.duidui);
      totalFan += SCORING.duidui.fan;
    }

    // Qingyi
    if (isQingYi) {
      fans.push(SCORING.qingyi);
      totalFan += SCORING.qingyi.fan;
    }

    // Qing qidui
    if (isQingYi && isQidui) {
      fans.push(SCORING.qingQidui);
      totalFan += SCORING.qingQidui.fan;
    }

    // Qing duidui
    if (isQingYi && isDuidui) {
      fans.push(SCORING.qingDuidui);
      totalFan += SCORING.qingDuidui.fan;
    }

    // Duanyao (no 1/9)
    const hasTerm = allKeys.some(k => {
      const t = TILES[k];
      return t && (t.rank === 1 || t.rank === 9);
    });
    if (!hasTerm) {
      fans.push(SCORING.duanyao);
      totalFan += SCORING.duanyao.fan;
    }

    // Jiang dui (all 2/5/8)
    const isJiang = allKeys.every(k => {
      const t = TILES[k];
      return t && [2, 5, 8].includes(t.rank);
    });
    if (isJiang && (isDuidui || isQidui)) {
      fans.push(SCORING.jiangDui);
      totalFan += SCORING.jiangDui.fan;
    }

    // Jin gou diao (hand has only 1 tile before winning)
    if (hand.length === 1 && lockedMelds.length === 4) {
      fans.push(SCORING.jinGouDiao);
      totalFan += SCORING.jinGouDiao.fan;
    }

    // Shiba luohan (four gangs)
    if (lockedMelds.filter(m => m.type === 'gang').length === 4) {
      fans.push(SCORING.shibaLuoHan);
      totalFan += SCORING.shibaLuoHan.fan;
    }

    // Men qing (no exposed melds)
    if (lockedMelds.length === 0) {
      fans.push(SCORING.menQing);
      totalFan += SCORING.menQing.fan;
    }

    // ─── Situational ───
    if (isZimo) { fans.push(SCORING.zimo); totalFan += SCORING.zimo.fan; }
    if (isGangShang) { fans.push(SCORING.gangShangHua); totalFan += SCORING.gangShangHua.fan; }
    if (isGangShangPao) { fans.push(SCORING.gangShangPao); totalFan += SCORING.gangShangPao.fan; }
    if (isQiangGang) { fans.push(SCORING.qiangGang); totalFan += SCORING.qiangGang.fan; }
    if (isHaidi) { fans.push(SCORING.haidi); totalFan += SCORING.haidi.fan; }
    if (isTianHu) { fans.push(SCORING.tianHu); totalFan += SCORING.tianHu.fan; }
    if (isDiHu) { fans.push(SCORING.diHu); totalFan += SCORING.diHu.fan; }

    totalFan = Math.max(totalFan, 1);
    const baseScore = totalFan * 100;

    return { fans, totalFan, baseScore };
  }

  // ─── Extract melds (same as Beijing) ───
  function extractMelds(hand) {
    const counts = handToCountMap(hand);
    const allResults = [];

    function extract(remaining, melds, pair) {
      const keys = getKeys(remaining);
      if (keys.length === 0) {
        allResults.push({ melds: [...melds], pair });
        return;
      }

      const firstKey = keys.sort()[0];
      const tile = TILES[firstKey];

      if (remaining[firstKey] >= 3) {
        const next = cloneCounts(remaining);
        next[firstKey] -= 3;
        if (next[firstKey] === 0) delete next[firstKey];
        extract(next, [...melds, { type: 'triplet', key: firstKey }], pair);
      }

      if (tile && ['wan', 'tiao', 'tong'].includes(tile.suit) && tile.rank <= 7) {
        const p = firstKey[0];
        const r = tile.rank;
        const k2 = p + (r + 1);
        const k3 = p + (r + 2);
        if (remaining[k2] > 0 && remaining[k3] > 0) {
          const next = cloneCounts(remaining);
          next[firstKey]--;
          next[k2]--;
          next[k3]--;
          if (next[firstKey] === 0) delete next[firstKey];
          if (next[k2] === 0) delete next[k2];
          if (next[k3] === 0) delete next[k3];
          extract(next, [...melds, { type: 'sequence', keys: [firstKey, k2, k3] }], pair);
        }
      }
    }

    for (const key of getKeys(counts)) {
      if (counts[key] >= 2) {
        const remaining = cloneCounts(counts);
        remaining[key] -= 2;
        if (remaining[key] === 0) delete remaining[key];
        extract(remaining, [], key);
      }
    }

    return allResults;
  }

  // ─── Chi / Peng / Gang (same rules, but no honors) ───
  function canChi(hand, discardTile, playerIndex, discardPlayerIndex) {
    if ((discardPlayerIndex + 1) % 4 !== playerIndex) return [];
    return TileUtils.findChi(hand, discardTile);
  }

  function canPeng(hand, discardTile) {
    return hand.filter(t => t.key === discardTile.key).length >= 2;
  }

  function canGang(hand, discardTile) {
    if (discardTile) {
      return hand.filter(t => t.key === discardTile.key).length >= 3;
    }
    return false;
  }

  function findAnGang(hand) {
    const counts = handToCountMap(hand);
    const gangs = [];
    for (const key of getKeys(counts)) {
      if (counts[key] >= 4) gangs.push(key);
    }
    return gangs;
  }

  function findJiaGang(hand, melds) {
    const jiaGangs = [];
    for (const meld of melds) {
      if (meld.type === 'peng') {
        const meldKey = meld.tiles[0].key;
        if (hand.some(t => t.key === meldKey)) {
          jiaGangs.push(meldKey);
        }
      }
    }
    return jiaGangs;
  }

  // ─── Blood war: check if game continues ───
  function isBloodWarComplete(winners, playerCount = 4) {
    // Blood war ends when 3 out of 4 players have won
    return winners.length >= playerCount - 1;
  }

  // ─── Create deck ───
  function createDeck() {
    return TileUtils.createDeck('sichuan');
  }

  // ─── Get ting tiles ───
  function getTingTiles(hand, melds = []) {
    const tingTiles = [];
    // Only check numbered suits
    const allKeys = Object.keys(TILES).filter(k =>
      ['wan', 'tiao', 'tong'].includes(TILES[k].suit)
    );

    for (const key of allKeys) {
      const testTile = { ...TILES[key], key, id: key + '_test' };
      if (checkCanHu(hand, testTile, melds)) {
        tingTiles.push(key);
      }
    }

    return tingTiles;
  }

  // ─── Public API ───
  return {
    TOTAL_TILES,
    HAND_SIZE,
    WIN_HAND_SIZE,
    SCORING,
    checkWin,
    checkCanHu,
    getTingTiles,
    calculateScore,
    canChi,
    canPeng,
    canGang,
    findAnGang,
    findJiaGang,
    createDeck,
    suggestQueYiMen,
    isQueYiMenSatisfied,
    getQueYiMenDiscards,
    isBloodWarComplete,
    extractMelds,
    handToCountMap,
  };
})();
