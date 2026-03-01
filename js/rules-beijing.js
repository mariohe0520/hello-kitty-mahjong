// ═══════════════════════════════════════════════════════════════
// 🏯 Hello Kitty 麻将 — 北京麻将规则引擎
// Full win detection, scoring, chi/peng/gang validation
// ═══════════════════════════════════════════════════════════════

const BeijingRules = (() => {
  'use strict';

  // ─── Constants ───
  const TOTAL_TILES = 136;
  const HAND_SIZE = 13;
  const WIN_HAND_SIZE = 14;

  // ─── Scoring table ───
  const SCORING = {
    pinghu:    { fan: 1,  name: '平胡',   desc: '基本胡牌' },
    duanyao:   { fan: 1,  name: '断幺',   desc: '没有1、9和字牌' },
    yibeikou:  { fan: 1,  name: '一杯口', desc: '两个相同的顺子' },
    fanpai:    { fan: 1,  name: '番牌',   desc: '刻子为风牌或箭牌' },
    qidui:     { fan: 2,  name: '七对',   desc: '七个对子' },
    hunyi:     { fan: 3,  name: '混一色', desc: '一种花色加字牌' },
    duidui:    { fan: 2,  name: '对对胡', desc: '四个刻子加一对' },
    qingyi:    { fan: 6,  name: '清一色', desc: '全部同一花色' },
    gangshang: { fan: 1,  name: '杠上花', desc: '杠后摸牌即胡' },
    haidi:     { fan: 1,  name: '海底捞月', desc: '最后一张牌胡' },
    zimo:      { fan: 1,  name: '自摸',   desc: '自己摸到胡牌' },
    danyao:    { fan: 1,  name: '断幺九', desc: '全部是2-8的数牌' },
    sanAnke:   { fan: 2,  name: '三暗刻', desc: '三个暗刻' },
    xiaoSY:    { fan: 6,  name: '小三元', desc: '中发白两刻一对' },
    daSY:      { fan: 88, name: '大三元', desc: '中发白三个刻子' },
    xiaoSX:    { fan: 6,  name: '小四喜', desc: '东南西北三刻一对' },
    daSX:      { fan: 88, name: '大四喜', desc: '东南西北四个刻子' },
    ziYiSe:    { fan: 64, name: '字一色', desc: '全部是字牌' },
    shiSanYao: { fan: 88, name: '十三幺', desc: '所有幺九字牌各一张加一对' },
  };

  // ─── Helper: Convert hand to count map ───
  function handToCountMap(hand) {
    const counts = {};
    for (const tile of hand) {
      counts[tile.key] = (counts[tile.key] || 0) + 1;
    }
    return counts;
  }

  // ─── Helper: Get all unique keys from count map ───
  function getKeys(counts) {
    return Object.keys(counts).filter(k => counts[k] > 0);
  }

  // ─── Helper: Clone counts ───
  function cloneCounts(counts) {
    return { ...counts };
  }

  // ─── Core: Recursive meld decomposition ───
  // Try to decompose remaining tiles into sets of 3 (sequences or triplets)
  function canDecompose(counts) {
    const keys = getKeys(counts);
    if (keys.length === 0) return true;

    // Pick the first key with tiles remaining
    const firstKey = keys.sort()[0];
    const tile = TILES[firstKey];
    if (!tile) return false;

    // Try triplet first
    if (counts[firstKey] >= 3) {
      const next = cloneCounts(counts);
      next[firstKey] -= 3;
      if (next[firstKey] === 0) delete next[firstKey];
      if (canDecompose(next)) return true;
    }

    // Try sequence (only for numbered suits)
    if (['wan', 'tiao', 'tong'].includes(tile.suit) && tile.rank <= 7) {
      const suitPrefix = firstKey[0]; // w, t, or b
      const r = tile.rank;
      const k2 = suitPrefix + (r + 1);
      const k3 = suitPrefix + (r + 2);

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

  // ─── Win Detection: Standard form (4 melds + 1 pair) ───
  function checkStandardWin(hand, melds = []) {
    // hand = tiles in hand (not in melds), melds = locked melds
    const totalTiles = hand.length + melds.reduce((s, m) => s + m.tiles.length, 0);
    if (totalTiles !== WIN_HAND_SIZE) return null;

    const counts = handToCountMap(hand);
    const results = [];

    // Try each possible pair
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

  // ─── Win Detection: Seven Pairs ───
  function checkSevenPairs(hand) {
    if (hand.length !== WIN_HAND_SIZE) return null;
    const counts = handToCountMap(hand);
    const keys = getKeys(counts);

    if (keys.length !== 7) return null;
    for (const key of keys) {
      if (counts[key] !== 2) return null;
    }

    return [{ type: 'qidui' }];
  }

  // ─── Win Detection: Thirteen Orphans (十三幺) ───
  function checkThirteenOrphans(hand) {
    if (hand.length !== WIN_HAND_SIZE) return null;
    const required = ['w1','w9','t1','t9','b1','b9','fe','fs','fw','fn','jz','jf','jb'];
    const counts = handToCountMap(hand);

    let hasPair = false;
    for (const key of required) {
      if (!counts[key] || counts[key] < 1) return null;
      if (counts[key] === 2) hasPair = true;
    }

    if (!hasPair) return null;
    // Ensure total is exactly these tiles
    const totalUsed = required.reduce((s, k) => s + (counts[k] || 0), 0);
    if (totalUsed !== WIN_HAND_SIZE) return null;

    return [{ type: 'shiSanYao' }];
  }

  // ─── Master Win Check ───
  function checkWin(hand, melds = []) {
    const results = [];

    const standard = checkStandardWin(hand, melds);
    if (standard) results.push(...standard);

    // Seven pairs only if no melds
    if (melds.length === 0) {
      const qidui = checkSevenPairs(hand);
      if (qidui) results.push(...qidui);

      const shisanyao = checkThirteenOrphans(hand);
      if (shisanyao) results.push(...shisanyao);
    }

    return results.length > 0 ? results : null;
  }

  // ─── Check if adding a tile completes a win ───
  function checkCanHu(hand, tile, melds = []) {
    const testHand = [...hand, tile];
    return checkWin(testHand, melds);
  }

  // ─── Get all tiles that would complete a win (听牌) ───
  function getTingTiles(hand, melds = []) {
    const tingTiles = [];
    const allKeys = Object.keys(TILES);

    for (const key of allKeys) {
      const testTile = { ...TILES[key], key, id: key + '_test' };
      if (checkCanHu(hand, testTile, melds)) {
        tingTiles.push(key);
      }
    }

    return tingTiles;
  }

  // ─── Extract melds from winning hand for scoring ───
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

      // Try triplet
      if (remaining[firstKey] >= 3) {
        const next = cloneCounts(remaining);
        next[firstKey] -= 3;
        if (next[firstKey] === 0) delete next[firstKey];
        extract(next, [...melds, { type: 'triplet', key: firstKey }], pair);
      }

      // Try sequence
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

    // Try each pair
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

  // ─── Scoring Engine ───
  function calculateScore(hand, melds, winTile, options = {}) {
    const {
      isZimo = false,
      isGangShang = false,
      isHaidi = false,
      seatWind = 'fe',
      roundWind = 'fe',
    } = options;

    const allTiles = [...hand];
    const lockedMelds = melds || [];
    const counts = handToCountMap(allTiles);
    const fans = [];
    let totalFan = 0;

    // ─── Check special wins first ───

    // Thirteen Orphans
    if (checkThirteenOrphans(allTiles)) {
      fans.push(SCORING.shiSanYao);
      return { fans, totalFan: 88, baseScore: 88 * 100 };
    }

    // Seven Pairs
    const isQidui = checkSevenPairs(allTiles);
    if (isQidui) {
      fans.push(SCORING.qidui);
      totalFan += SCORING.qidui.fan;
    }

    // ─── Extract meld decomposition for scoring ───
    const decompositions = extractMelds(allTiles);
    let bestDecomp = decompositions[0] || { melds: [], pair: null };

    // Score with the decomposition that yields highest fan
    let bestFan = 0;
    let bestFans = [];

    for (const decomp of decompositions) {
      const currentFans = [];
      let currentFan = 0;

      const allMeldKeys = [
        ...decomp.melds,
        ...lockedMelds.map(m => ({
          type: m.type === 'gang' ? 'triplet' : m.type,
          key: m.tiles[0]?.key,
          keys: m.tiles.map(t => t.key),
        }))
      ];

      // 花色分析需包含副露面子（locked melds），否则清一色/混一色判定有误
      const allKeys = allTiles.map(t => t.key);
      const lockedMeldKeys = lockedMelds.flatMap(m => m.tiles.map(t => t.key));
      const allKeysWithMelds = [...allKeys, ...lockedMeldKeys];
      const suits = new Set(allKeysWithMelds.map(k => TILES[k]?.suit));
      const numSuits = [...suits].filter(s => ['wan', 'tiao', 'tong'].includes(s));
      const hasHonors = [...suits].some(s => ['feng', 'jian'].includes(s));

      // Pinghu (basic win)
      if (!isQidui) {
        currentFans.push(SCORING.pinghu);
        currentFan += SCORING.pinghu.fan;
      }

      // Duanyao (no 1/9/honors)：需检查含副露的全部牌
      const allTileKeys = allKeysWithMelds;
      const hasTerHon = allTileKeys.some(k => {
        const t = TILES[k];
        return !t || t.rank === 1 || t.rank === 9 || ['feng', 'jian'].includes(t.suit);
      });
      if (!hasTerHon) {
        currentFans.push(SCORING.duanyao);
        currentFan += SCORING.duanyao.fan;
      }

      // Duidui (all triplets, no sequences)
      const allTriplets = allMeldKeys.every(m => m.type === 'triplet');
      if (allTriplets && allMeldKeys.length >= 4 && !isQidui) {
        currentFans.push(SCORING.duidui);
        currentFan += SCORING.duidui.fan;
        // Duidui replaces pinghu — remove pinghu if it was added
        const pinghuIdx = currentFans.indexOf(SCORING.pinghu);
        if (pinghuIdx !== -1) {
          currentFans.splice(pinghuIdx, 1);
          currentFan -= SCORING.pinghu.fan;
        }
      }

      // Hunyi (mixed flush — one number suit + honors)
      if (numSuits.length === 1 && hasHonors) {
        currentFans.push(SCORING.hunyi);
        currentFan += SCORING.hunyi.fan;
      }

      // Qingyi (full flush — only one suit, no honors)
      if (numSuits.length === 1 && !hasHonors) {
        currentFans.push(SCORING.qingyi);
        currentFan += SCORING.qingyi.fan;
      }

      // Zi Yi Se (all honors)
      if (numSuits.length === 0 && hasHonors) {
        currentFans.push(SCORING.ziYiSe);
        currentFan += SCORING.ziYiSe.fan;
      }

      // Fan pai (honor triplets)
      for (const m of allMeldKeys) {
        if (m.type === 'triplet') {
          const k = m.key;
          const t = TILES[k];
          if (t && (t.suit === 'jian' || k === seatWind || k === roundWind)) {
            currentFans.push({ ...SCORING.fanpai, desc: `${t.name}刻子` });
            currentFan += SCORING.fanpai.fan;
          }
        }
      }

      // Iibeikou (two identical sequences)
      if (!isQidui) {
        const seqSigs = allMeldKeys
          .filter(m => m.type === 'sequence')
          .map(m => (m.keys || []).join(','));
        const seqCounts = {};
        for (const sig of seqSigs) {
          seqCounts[sig] = (seqCounts[sig] || 0) + 1;
        }
        if (Object.values(seqCounts).some(c => c >= 2)) {
          currentFans.push(SCORING.yibeikou);
          currentFan += SCORING.yibeikou.fan;
        }
      }

      // San yuan (三元)
      const jianKeys = ['jz', 'jf', 'jb'];
      const jianTriplets = jianKeys.filter(jk =>
        allMeldKeys.some(m => m.type === 'triplet' && m.key === jk)
      );
      const jianPair = jianKeys.includes(decomp.pair);

      if (jianTriplets.length === 3) {
        currentFans.push(SCORING.daSY);
        currentFan += SCORING.daSY.fan;
      } else if (jianTriplets.length === 2 && jianPair) {
        currentFans.push(SCORING.xiaoSY);
        currentFan += SCORING.xiaoSY.fan;
      }

      // Si xi (四喜)
      const fengKeys = ['fe', 'fs', 'fw', 'fn'];
      const fengTriplets = fengKeys.filter(fk =>
        allMeldKeys.some(m => m.type === 'triplet' && m.key === fk)
      );
      const fengPair = fengKeys.includes(decomp.pair);

      if (fengTriplets.length === 4) {
        currentFans.push(SCORING.daSX);
        currentFan += SCORING.daSX.fan;
      } else if (fengTriplets.length === 3 && fengPair) {
        currentFans.push(SCORING.xiaoSX);
        currentFan += SCORING.xiaoSX.fan;
      }

      // San anke (三暗刻): 暗刻数包含手牌分解的刻子 + 暗杠 locked melds
      const anGangCount = lockedMelds.filter(m => m.gangType === 'an').length;
      const concealedTriplets = decomp.melds.filter(m => m.type === 'triplet').length + anGangCount;
      if (concealedTriplets >= 3) {
        currentFans.push(SCORING.sanAnke);
        currentFan += SCORING.sanAnke.fan;
      }

      if (currentFan > bestFan) {
        bestFan = currentFan;
        bestFans = currentFans;
        bestDecomp = decomp;
      }
    }

    // Add the best decomposition fans
    if (!isQidui) {
      fans.push(...bestFans);
      totalFan += bestFan;
    } else {
      // For qidui, still add applicable bonus fans (duanyao, hunyi, qingyi, ziYiSe, etc.)
      // but skip pinghu, duidui, yibeikou, and meld-based fans
      const qiduiCompatible = ['duanyao', 'hunyi', 'qingyi', 'ziYiSe'];
      for (const f of bestFans) {
        const scoringKey = Object.entries(SCORING).find(([k, v]) => v.name === f.name)?.[0];
        if (scoringKey && qiduiCompatible.includes(scoringKey)) {
          fans.push(f);
          totalFan += f.fan;
        }
      }
    }

    // ─── Situational bonuses ───
    if (isZimo) {
      fans.push(SCORING.zimo);
      totalFan += SCORING.zimo.fan;
    }
    if (isGangShang) {
      fans.push(SCORING.gangshang);
      totalFan += SCORING.gangshang.fan;
    }
    if (isHaidi) {
      fans.push(SCORING.haidi);
      totalFan += SCORING.haidi.fan;
    }

    // Minimum 1 fan
    totalFan = Math.max(totalFan, 1);

    const baseScore = totalFan * 100;

    return { fans, totalFan, baseScore, decomposition: bestDecomp };
  }

  // ─── Chi validation ───
  function canChi(hand, discardTile, playerIndex, discardPlayerIndex) {
    // Chi only from the player to your left (previous player)
    if ((discardPlayerIndex + 1) % 4 !== playerIndex) return [];

    if (['feng', 'jian'].includes(discardTile.suit)) return [];

    return TileUtils.findChi(hand, discardTile);
  }

  // ─── Peng validation ───
  function canPeng(hand, discardTile) {
    const count = hand.filter(t => t.key === discardTile.key).length;
    return count >= 2;
  }

  // ─── Gang validation ───
  function canGang(hand, discardTile) {
    if (discardTile) {
      // Ming gang (exposed): need 3 in hand + 1 discarded
      const count = hand.filter(t => t.key === discardTile.key).length;
      return count >= 3;
    }
    return false;
  }

  // ─── An Gang (concealed gang from hand) ───
  function findAnGang(hand) {
    const counts = handToCountMap(hand);
    const gangs = [];
    for (const key of getKeys(counts)) {
      if (counts[key] >= 4) {
        gangs.push(key);
      }
    }
    return gangs;
  }

  // ─── Jia Gang (add to existing peng) ───
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

  // ─── Create deck ───
  function createDeck() {
    return TileUtils.createDeck('beijing');
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
    extractMelds,
    handToCountMap,
  };
})();
