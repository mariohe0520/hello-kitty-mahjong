// ═══════════════════════════════════════════════════════════════
// Hello Kitty 麻将 — App Store Enhancements v1.0
// Features: Shanten Display, Tile Counter, Victory Celebration,
//           Ranking System, Hint System
// ═══════════════════════════════════════════════════════════════

// ╔═══════════════════════════════════════════════════════════╗
// ║  FEATURE 1: SHANTEN COUNT DISPLAY                        ║
// ╚═══════════════════════════════════════════════════════════╝

const ShantenDisplay = (() => {
  'use strict';

  const LABELS = {
    '-1': { text: '和牌', color: '#f5c518', bg: 'rgba(245,197,24,0.2)', pulse: true },
    '0':  { text: '听牌!', color: '#22c55e', bg: 'rgba(34,197,94,0.2)', pulse: true },
    '1':  { text: '一向听', color: '#ff8c42', bg: 'rgba(255,140,66,0.15)', pulse: false },
    '2':  { text: '二向听', color: '#5b9bd5', bg: 'rgba(91,155,213,0.15)', pulse: false },
    '3':  { text: '三向听', color: '#8a7f9a', bg: 'rgba(138,127,154,0.1)', pulse: false },
    '4':  { text: '四向听', color: '#5a5070', bg: 'rgba(90,80,112,0.1)', pulse: false },
    '5':  { text: '五向听', color: '#5a5070', bg: 'rgba(90,80,112,0.1)', pulse: false },
    '6':  { text: '六向听', color: '#5a5070', bg: 'rgba(90,80,112,0.1)', pulse: false },
  };

  // Calculate shanten using the same algorithm as AI.evaluateHand
  function calcShanten(hand, melds) {
    if (!hand || hand.length === 0) return 8;

    const counts = {};
    for (const t of hand) counts[t.key] = (counts[t.key] || 0) + 1;

    let pairs = 0, triplets = 0, sequences = 0, partialSeqs = 0;
    const visited = new Set();

    for (const key of Object.keys(counts)) {
      const c = counts[key];
      if (c >= 3) triplets++;
      if (c >= 2) pairs++;
      const tile = (typeof TILES !== 'undefined') ? TILES[key] : null;
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

    const completeSets = (melds ? melds.length : 0) + triplets + sequences;
    const partialSets = pairs + partialSeqs;
    const neededSets = 4;

    // Check for complete winning hand (shanten = -1):
    // all 4 sets complete + at least one pure pair as head (c===2, not a triplet)
    const purePairs = Object.keys(counts).filter(k => counts[k] === 2).length;
    if (completeSets >= neededSets && purePairs > 0) return -1;

    const shanten = Math.max(0, (neededSets - completeSets) * 2 - Math.min(partialSets, neededSets - completeSets));

    // Check 7-pairs shanten separately
    const pairsCount = Object.values(counts).filter(c => c >= 2).length;
    const sevenPairsShanten = 6 - pairsCount;

    return Math.min(shanten, sevenPairsShanten);
  }

  function update(hand, melds) {
    const badge = document.getElementById('shanten-badge');
    if (!badge) return;

    if (!hand || hand.length === 0) {
      badge.style.display = 'none';
      return;
    }

    const shanten = calcShanten(hand, melds || []);
    const key = String(Math.min(shanten, 6));
    const info = LABELS[key] || LABELS['6'];

    badge.style.display = 'flex';
    badge.textContent = info.text;
    badge.style.color = info.color;
    badge.style.background = info.bg;
    badge.style.borderColor = info.color + '60';

    if (info.pulse) {
      badge.classList.add('shanten-pulse');
    } else {
      badge.classList.remove('shanten-pulse');
    }
  }

  function hide() {
    const badge = document.getElementById('shanten-badge');
    if (badge) badge.style.display = 'none';
  }

  return { update, hide, calcShanten };
})();


// ╔═══════════════════════════════════════════════════════════╗
// ║  FEATURE 2: REMAINING TILES COUNTER PANEL                ║
// ╚═══════════════════════════════════════════════════════════╝

const TileCounter = (() => {
  'use strict';

  let visible = false;
  let overlay = null;

  function countAll(gameState) {
    if (!gameState || typeof TILES === 'undefined') return {};
    const result = {};

    // Total 4 of each key
    for (const key of Object.keys(TILES)) {
      result[key] = 4;
    }

    // Subtract discards
    for (const t of (gameState.discardPile || [])) {
      if (result[t.key] !== undefined) result[t.key]--;
    }

    // Subtract melds
    for (const player of (gameState.players || [])) {
      for (const meld of (player.melds || [])) {
        for (const t of meld.tiles) {
          if (result[t.key] !== undefined) result[t.key]--;
        }
      }
    }

    // Subtract player's own hand (visible to player)
    const humanHand = gameState.players?.[0]?.hand || [];
    for (const t of humanHand) {
      if (result[t.key] !== undefined) result[t.key]--;
    }

    return result;
  }

  function toggle() {
    visible ? hide() : show();
  }

  function show() {
    const gameState = (typeof Game !== 'undefined') ? Game.getState() : null;
    if (!gameState) return;

    if (overlay) overlay.remove();
    visible = true;

    const counts = countAll(gameState);

    overlay = document.createElement('div');
    overlay.id = 'tile-counter-overlay';
    overlay.className = 'tile-counter-overlay';

    // Group tiles by suit
    const groups = [
      { name: '万', prefix: 'w', keys: ['w1','w2','w3','w4','w5','w6','w7','w8','w9'] },
      { name: '条', prefix: 't', keys: ['t1','t2','t3','t4','t5','t6','t7','t8','t9'] },
      { name: '筒', prefix: 'b', keys: ['b1','b2','b3','b4','b5','b6','b7','b8','b9'] },
      { name: '字', prefix: '',  keys: ['fe','fs','fw','fn','jz','jf','jb'] },
    ];

    const SUIT_COLORS = { w: '#e74c3c', t: '#2ecc71', b: '#3498db', '': '#f5c518' };

    let html = `
      <div class="tile-counter-panel">
        <div class="tile-counter-header">
          <span>余牌统计</span>
          <button class="tile-counter-close" onclick="TileCounter.hide()">✕</button>
        </div>
        <div class="tile-counter-body">
    `;

    for (const group of groups) {
      const color = SUIT_COLORS[group.prefix] || '#f5c518';
      html += `<div class="tile-counter-group">
        <div class="tile-counter-group-name" style="color:${color}">${group.name}</div>
        <div class="tile-counter-row">`;
      for (const key of group.keys) {
        const count = counts[key] ?? 4;
        const tile = TILES[key];
        const label = tile ? (tile.rank || tile.display || key) : key;
        const depleted = count === 0;
        html += `<div class="tile-count-cell ${depleted ? 'depleted' : count <= 1 ? 'scarce' : ''}">
          <div class="tile-count-label" style="color:${depleted ? '#ef4444' : color}">${label}</div>
          <div class="tile-count-num ${depleted ? 'num-depleted' : ''}">${count}</div>
        </div>`;
      }
      html += `</div></div>`;
    }

    html += `</div></div>`;
    overlay.innerHTML = html;

    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) hide();
    });

    document.body.appendChild(overlay);
    requestAnimationFrame(() => overlay.classList.add('visible'));
  }

  function hide() {
    visible = false;
    if (overlay) {
      overlay.classList.remove('visible');
      setTimeout(() => { overlay?.remove(); overlay = null; }, 300);
    }
  }

  // Auto-refresh when called during game
  function refresh() {
    if (visible) show();
  }

  return { toggle, show, hide, refresh };
})();


// ╔═══════════════════════════════════════════════════════════╗
// ║  FEATURE 3: VICTORY CELEBRATION                          ║
// ╚═══════════════════════════════════════════════════════════╝

const VictoryCelebration = (() => {
  'use strict';

  const HAND_TYPES = {
    '平胡':    { label: '平胡', color: '#5b9bd5', emoji: '🀄' },
    '碰碰胡':  { label: '碰碰胡', color: '#e74c3c', emoji: '💥' },
    '清一色':  { label: '清一色!', color: '#f5c518', emoji: '✨' },
    '七对':    { label: '七对子', color: '#9b59b6', emoji: '🎭' },
    '龙七对':  { label: '龙七对!', color: '#f5c518', emoji: '🐉' },
    '天胡':    { label: '天胡!!!', color: '#f5c518', emoji: '⚡' },
    '地胡':    { label: '地胡!!!', color: '#f5c518', emoji: '🌟' },
    '自摸':    { label: '自摸', color: '#22c55e', emoji: '🤚' },
    '门前清':  { label: '门前清', color: '#5b9bd5', emoji: '🎯' },
  };

  function detectHandType(fans, isTsumo) {
    if (!fans) return null;
    const fanNames = fans.map(f => f.name);

    for (const [key, info] of Object.entries(HAND_TYPES)) {
      if (fanNames.some(n => n.includes(key))) return info;
    }

    if (isTsumo) return HAND_TYPES['自摸'];
    return { label: '胡牌!', color: '#ff6b9d', emoji: '🎉' };
  }

  function play(playerIndex, scoreResult, isTsumo, winTileEls) {
    const isHuman = playerIndex === 0;

    // Big confetti burst for human win
    if (isHuman && typeof Game !== 'undefined') {
      _fullConfettiBurst();
    }

    // Flash winning hand tiles with golden glow
    _flashWinningTiles(winTileEls);

    // Detect and show hand type banner
    const fans = scoreResult?.fans || [];
    const handType = detectHandType(fans, isTsumo);
    if (handType && isHuman) {
      setTimeout(() => _showHandTypeBanner(handType), 600);
    }
  }

  function _fullConfettiBurst() {
    const colors = ['#ff6b9d', '#f5c518', '#5b9bd5', '#2ecc71', '#9b59b6', '#ff8fbf', '#e74c3c', '#ffffff'];
    const table = document.getElementById('mahjong-table') || document.body;
    const w = table.offsetWidth || window.innerWidth;
    const h = table.offsetHeight || window.innerHeight;

    for (let wave = 0; wave < 3; wave++) {
      setTimeout(() => {
        for (let i = 0; i < 40; i++) {
          setTimeout(() => {
            const el = document.createElement('div');
            el.className = 'victory-confetti';
            el.style.cssText = `
              position: fixed;
              left: ${Math.random() * 100}%;
              top: -10px;
              width: ${4 + Math.random() * 8}px;
              height: ${4 + Math.random() * 8}px;
              background: ${colors[Math.floor(Math.random() * colors.length)]};
              border-radius: ${Math.random() > 0.5 ? '50%' : '2px'};
              z-index: 400;
              pointer-events: none;
              animation: victoryConfettiFall ${1.5 + Math.random() * 1.5}s ease-in forwards;
              animation-delay: ${Math.random() * 0.3}s;
              transform: rotate(${Math.random() * 360}deg);
            `;
            document.body.appendChild(el);
            setTimeout(() => el.remove(), 3500);
          }, i * 20);
        }
      }, wave * 400);
    }
  }

  function _flashWinningTiles(winTileEls) {
    if (!winTileEls) {
      // Flash all tiles in the win-hand container
      setTimeout(() => {
        const container = document.getElementById('win-hand');
        if (container) {
          const tiles = container.querySelectorAll('.tile');
          tiles.forEach((el, i) => {
            setTimeout(() => {
              el.classList.add('tile-golden-flash');
              setTimeout(() => el.classList.remove('tile-golden-flash'), 1200);
            }, i * 80);
          });
        }
      }, 400);
    }
  }

  function _showHandTypeBanner(handType) {
    const existing = document.getElementById('hand-type-banner');
    if (existing) existing.remove();

    const banner = document.createElement('div');
    banner.id = 'hand-type-banner';
    banner.className = 'hand-type-banner';
    banner.innerHTML = `
      <span class="hand-type-emoji">${handType.emoji}</span>
      <span class="hand-type-label" style="color:${handType.color}">${handType.label}</span>
    `;
    document.body.appendChild(banner);

    requestAnimationFrame(() => banner.classList.add('visible'));
    setTimeout(() => {
      banner.classList.remove('visible');
      setTimeout(() => banner.remove(), 500);
    }, 2800);
  }

  return { play, detectHandType };
})();


// ╔═══════════════════════════════════════════════════════════╗
// ║  FEATURE 4: RANKING SYSTEM                               ║
// ╚═══════════════════════════════════════════════════════════╝

const RankSystem = (() => {
  'use strict';

  const STORAGE_KEY = 'hk_mj_ranking';

  const RANKS = [
    { name: '新手',   minPoints: 0,    icon: '🌱', color: '#8a7f9a' },
    { name: '入门',   minPoints: 100,  icon: '🎋', color: '#2ecc71' },
    { name: '初段',   minPoints: 300,  icon: '⚡', color: '#5b9bd5' },
    { name: '中段',   minPoints: 700,  icon: '🔥', color: '#ff8c42' },
    { name: '高段',   minPoints: 1500, icon: '💎', color: '#9b59b6' },
    { name: '大师',   minPoints: 3000, icon: '🏆', color: '#f5c518' },
    { name: '雀圣',   minPoints: 6000, icon: '🎀', color: '#ff6b9d' },
  ];

  const WIN_POINTS = 30;
  const LOSS_POINTS = -10;
  const TSUMO_BONUS = 15;
  const HIGH_FAN_BONUS = 20; // if totalFan >= 5

  function getData() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) return JSON.parse(raw);
    } catch {}
    return { points: 0, wins: 0, losses: 0, currentRank: 0 };
  }

  function saveData(data) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch {}
  }

  function getRankInfo(points) {
    let rank = RANKS[0];
    for (const r of RANKS) {
      if (points >= r.minPoints) rank = r;
    }
    return rank;
  }

  function getRankIndex(points) {
    let idx = 0;
    for (let i = 0; i < RANKS.length; i++) {
      if (points >= RANKS[i].minPoints) idx = i;
    }
    return idx;
  }

  function recordWin(isTsumo, totalFan) {
    const data = getData();
    const prevRankIdx = getRankIndex(data.points);

    let earned = WIN_POINTS;
    if (isTsumo) earned += TSUMO_BONUS;
    if (totalFan >= 5) earned += HIGH_FAN_BONUS;

    data.points = Math.max(0, data.points + earned);
    data.wins = (data.wins || 0) + 1;
    saveData(data);

    const newRankIdx = getRankIndex(data.points);
    const rankUp = newRankIdx > prevRankIdx;
    return { earned, rankUp, newRank: RANKS[newRankIdx], data };
  }

  function recordLoss() {
    const data = getData();
    const prevRankIdx = getRankIndex(data.points);

    data.points = Math.max(0, data.points + LOSS_POINTS);
    data.losses = (data.losses || 0) + 1;
    saveData(data);

    const newRankIdx = getRankIndex(data.points);
    const rankDown = newRankIdx < prevRankIdx;
    return { lost: Math.abs(LOSS_POINTS), rankDown, newRank: RANKS[newRankIdx], data };
  }

  function getCurrentRankInfo() {
    const data = getData();
    const rank = getRankInfo(data.points);
    const rankIdx = getRankIndex(data.points);
    const nextRank = RANKS[rankIdx + 1];
    const nextMin = nextRank ? nextRank.minPoints : null;
    const progress = nextMin
      ? Math.min(1, (data.points - rank.minPoints) / (nextMin - rank.minPoints))
      : 1;

    return { rank, data, progress, nextRank, rankIdx };
  }

  function renderBadge(container) {
    if (!container) return;
    const { rank, data, progress, nextRank } = getCurrentRankInfo();
    const nextPts = nextRank ? nextRank.minPoints - data.points : 0;

    container.innerHTML = `
      <div class="rank-badge-inner">
        <span class="rank-icon">${rank.icon}</span>
        <div class="rank-info">
          <div class="rank-name" style="color:${rank.color}">${rank.name}</div>
          <div class="rank-points">${data.points} 分</div>
        </div>
        ${nextRank ? `
        <div class="rank-progress-wrap">
          <div class="rank-progress-bar">
            <div class="rank-progress-fill" style="width:${progress * 100}%;background:${rank.color}"></div>
          </div>
          <div class="rank-progress-label" style="color:${rank.color}">还需 ${nextPts} 分升 ${nextRank.icon}</div>
        </div>` : '<div class="rank-max">满级!</div>'}
      </div>
    `;
  }

  function showRankUpAnimation(newRank) {
    const el = document.createElement('div');
    el.className = 'rank-up-banner';
    el.innerHTML = `
      <div class="rank-up-inner">
        <div class="rank-up-title">段位提升!</div>
        <div class="rank-up-rank" style="color:${newRank.color}">${newRank.icon} ${newRank.name}</div>
      </div>
    `;
    document.body.appendChild(el);
    requestAnimationFrame(() => el.classList.add('visible'));
    setTimeout(() => {
      el.classList.remove('visible');
      setTimeout(() => el.remove(), 600);
    }, 2500);
  }

  return {
    getData, getRankInfo, getCurrentRankInfo,
    recordWin, recordLoss,
    renderBadge, showRankUpAnimation,
    RANKS,
  };
})();


// ╔═══════════════════════════════════════════════════════════╗
// ║  FEATURE 5: HINT SYSTEM                                  ║
// ╚═══════════════════════════════════════════════════════════╝

const HintSystem = (() => {
  'use strict';

  const MAX_HINTS = 3;
  let hintsLeft = MAX_HINTS;
  let activeHintTileId = null;
  let hintTimeout = null;

  function reset() {
    hintsLeft = MAX_HINTS;
    clearHintHighlight();
    updateHintButton();
  }

  function updateHintButton() {
    const btn = document.getElementById('hint-btn');
    if (!btn) return;
    btn.textContent = `提示 (${hintsLeft})`;
    btn.disabled = hintsLeft <= 0;
    btn.style.opacity = hintsLeft <= 0 ? '0.4' : '1';
  }

  function clearHintHighlight() {
    activeHintTileId = null;
    if (hintTimeout) { clearTimeout(hintTimeout); hintTimeout = null; }
    document.querySelectorAll('.tile-hint-highlight').forEach(el => {
      el.classList.remove('tile-hint-highlight');
    });
    const reasoning = document.getElementById('hint-reasoning');
    if (reasoning) {
      reasoning.classList.remove('visible');
      setTimeout(() => { reasoning.style.display = 'none'; }, 300);
    }
  }

  function getHint() {
    if (hintsLeft <= 0) return;

    const gameState = (typeof Game !== 'undefined') ? Game.getState() : null;
    if (!gameState) return;
    if (gameState.turnPhase !== 'discard' || gameState.currentPlayer !== 0) return;

    const player = gameState.players[0];
    const hand = player.hand;
    if (!hand || hand.length === 0) return;

    // Find best discard using AI logic
    const suggestion = _findBestDiscard(hand, player.melds, gameState);
    if (!suggestion) return;

    hintsLeft--;
    updateHintButton();

    // Highlight the suggested tile
    _highlightTile(suggestion.tile);
    _showReasoning(suggestion);
  }

  function _findBestDiscard(hand, melds, gameState) {
    if (typeof AI === 'undefined' || typeof TILES === 'undefined') return null;

    const visibleMap = {};
    for (const t of (gameState.discardPile || [])) {
      visibleMap[t.key] = (visibleMap[t.key] || 0) + 1;
    }
    for (const p of gameState.players) {
      for (const meld of (p.melds || [])) {
        for (const t of meld.tiles) visibleMap[t.key] = (visibleMap[t.key] || 0) + 1;
      }
    }

    let bestTile = null;
    let bestShanten = 99;
    let bestReasoning = '';

    for (const tile of hand) {
      const testHand = hand.filter(t => t.id !== tile.id);
      const shanten = ShantenDisplay.calcShanten(testHand, melds);

      if (shanten < bestShanten) {
        bestShanten = shanten;
        bestTile = tile;

        // Build reasoning text
        const suitNames = { wan: '万', tiao: '条', tong: '筒', feng: '字', jian: '字' };
        const tileName = tile.name || `${tile.rank || ''}${suitNames[tile.suit] || ''}`;

        if (shanten === 0) {
          bestReasoning = `建议打${tileName}，可达到听牌`;
        } else if (shanten === 1) {
          bestReasoning = `建议打${tileName}，保留向子`;
        } else {
          bestReasoning = `建议打${tileName}，减少向听数`;
        }
      }
    }

    return bestTile ? { tile: bestTile, shanten: bestShanten, reasoning: bestReasoning } : null;
  }

  function _highlightTile(tile) {
    clearHintHighlight();
    activeHintTileId = tile.id;

    const handContainer = document.getElementById('hand-bottom');
    if (!handContainer) return;

    const tileEls = handContainer.querySelectorAll('.tile');
    for (const el of tileEls) {
      if (el.dataset.id === tile.id) {
        el.classList.add('tile-hint-highlight');
        // Auto-clear after 4 seconds
        hintTimeout = setTimeout(() => clearHintHighlight(), 4000);
        break;
      }
    }
  }

  function _showReasoning(suggestion) {
    let reasoning = document.getElementById('hint-reasoning');
    if (!reasoning) {
      reasoning = document.createElement('div');
      reasoning.id = 'hint-reasoning';
      reasoning.className = 'hint-reasoning';
      // Insert above the hand
      const bottomArea = document.getElementById('player-bottom');
      if (bottomArea) bottomArea.insertBefore(reasoning, bottomArea.firstChild);
    }

    reasoning.textContent = suggestion.reasoning;
    reasoning.style.display = 'block';
    requestAnimationFrame(() => reasoning.classList.add('visible'));
  }

  return { reset, getHint, clearHintHighlight, updateHintButton, get hintsLeft() { return hintsLeft; } };
})();


// ╔═══════════════════════════════════════════════════════════╗
// ║  INTEGRATION — Hook into existing Game events            ║
// ╚═══════════════════════════════════════════════════════════╝

// Patch the Game object after it loads to add new feature hooks.
// We wrap key functions to inject our logic without breaking existing code.
(function patchGame() {
  if (typeof Game === 'undefined') return;

  // Save originals
  const _origStartGame = Game.startGame;
  const _origUpdateTenpai = Game.updateTenpaiIndicator;
  const _origHandleHu = null; // we patch from the inside via public API

  // After startGame: reset hints and shanten
  if (_origStartGame) {
    // We cannot easily wrap startGame from outside since it's async and already self-contained.
    // Instead, we hook at the DOMContentLoaded and set up MutationObserver or polling.
  }
})();

// Listen for game state changes via DOM changes (tenpai indicator, etc.)
// to update shanten display in real-time.
(function setupRealtimeUpdates() {
  // Watch for changes to the hand-bottom container
  function setupHandObserver() {
    const handEl = document.getElementById('hand-bottom');
    if (!handEl) {
      setTimeout(setupHandObserver, 500);
      return;
    }

    const observer = new MutationObserver(() => {
      if (typeof Game === 'undefined') return;
      const gameState = Game.getState();
      if (!gameState) {
        ShantenDisplay.hide();
        return;
      }
      const player = gameState.players?.[0];
      if (player) {
        ShantenDisplay.update(player.hand, player.melds);
      }
    });

    observer.observe(handEl, { childList: true, subtree: true });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setupHandObserver);
  } else {
    setupHandObserver();
  }
})();


// ╔═══════════════════════════════════════════════════════════╗
// ║  FEATURE 6: FATE CARDS SYSTEM (命运牌)                    ║
// ╚═══════════════════════════════════════════════════════════╝

const FateCards = (() => {
  'use strict';

  // The four fate cards — each game, each player draws one
  const FATE_DECK = [
    {
      id: 'dragon',
      name: '龙',
      icon: '🐉',
      title: '神龙庇佑',
      desc: '首次胡牌得分×2，扭转乾坤的神力',
      effect: 'firstHuDouble',
      color: '#e74c3c',
    },
    {
      id: 'phoenix',
      name: '凤',
      icon: '🦅',
      title: '凤凰涅槃',
      desc: '自摸胡牌额外获得50分奖励',
      effect: 'tsumoBonus',
      color: '#ff6b9d',
    },
    {
      id: 'qilin',
      name: '麒麟',
      icon: '🦄',
      title: '麒麟慧眼',
      desc: '可以偷看对手1张牌（每局1次）',
      effect: 'peekOpponent',
      color: '#9b59b6',
    },
    {
      id: 'turtle',
      name: '神龟',
      icon: '🐢',
      title: '神龟护法',
      desc: '对手向你支付的点数减少10%',
      effect: 'damageReduction',
      color: '#2ecc71',
    },
  ];

  // Current game's fate assignments: { playerIndex: fateCard }
  let currentFates = null;
  let revealed = false;

  function dealFates() {
    // Shuffle a copy of the deck
    const deck = [...FATE_DECK];
    for (let i = deck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [deck[i], deck[j]] = [deck[j], deck[i]];
    }

    currentFates = {};
    for (let i = 0; i < 4; i++) {
      currentFates[i] = deck[i % deck.length];
    }
    revealed = false;
    return currentFates;
  }

  function getFate(playerIndex) {
    return currentFates ? currentFates[playerIndex] : null;
  }

  function getPlayerFate() {
    return getFate(0);
  }

  // Show the player their fate card with a reveal animation
  function revealPlayerFate(onDone) {
    if (!currentFates || revealed) {
      if (onDone) onDone();
      return;
    }
    revealed = true;

    const fate = currentFates[0];
    if (!fate) { if (onDone) onDone(); return; }

    const overlay = document.createElement('div');
    overlay.className = 'fate-reveal-overlay';
    overlay.innerHTML = `
      <div class="fate-reveal-modal">
        <div class="fate-reveal-title">命运牌降临！</div>
        <div class="fate-reveal-icon">${fate.icon}</div>
        <div class="fate-reveal-name">${fate.name} — ${fate.title}</div>
        <div class="fate-reveal-desc">${fate.desc}</div>
        <button class="fate-reveal-btn" id="fate-confirm-btn">接受命运</button>
      </div>
    `;

    document.body.appendChild(overlay);

    let finished = false;
    const cleanup = () => {
      if (finished) return;
      finished = true;
      clearTimeout(autoCloseTimer);
      document.removeEventListener('keydown', onEscClose);
      overlay.classList.add('closing');
      setTimeout(() => {
        overlay.remove();
        // Update player label badge
        updateFateBadges();
        if (onDone) onDone();
      }, 260);
    };

    const onEscClose = (e) => {
      if (e.key === 'Escape') cleanup();
    };

    const autoCloseTimer = setTimeout(cleanup, 8000);
    document.addEventListener('keydown', onEscClose);

    const confirmBtn = overlay.querySelector('#fate-confirm-btn');
    if (confirmBtn) confirmBtn.addEventListener('click', cleanup, { once: true });

    // Click outside the modal also closes to avoid interaction deadlocks.
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) cleanup();
    });
  }

  // Show all players' fate cards in the player labels
  function updateFateBadges() {
    if (!currentFates) return;

    const POSITIONS = {
      0: '.player-bottom .player-label',
      1: '#player-right .player-label',
      2: '#player-top .player-label',
      3: '#player-left .player-label',
    };

    for (let i = 0; i < 4; i++) {
      const fate = currentFates[i];
      const sel = POSITIONS[i];
      const label = document.querySelector(sel);
      if (!label || !fate) continue;

      // Remove old badge if any
      const old = label.querySelector('.fate-card-badge');
      if (old) old.remove();

      // Only show icon for opponents (show full for player)
      const badge = document.createElement('span');
      badge.className = 'fate-card-badge';
      if (i === 0) {
        badge.innerHTML = `<span class="fate-icon">${fate.icon}</span>${fate.name}`;
        badge.title = fate.desc;
      } else {
        badge.innerHTML = `<span class="fate-icon">${fate.icon}</span>`;
        badge.title = '???';
      }
      badge.style.borderColor = fate.color + '60';
      badge.style.color = fate.color;
      label.appendChild(badge);
    }
  }

  // Apply fate card effect to score result
  function applyFateEffect(playerIndex, baseScore, isTsumo) {
    if (!currentFates) return baseScore;
    const fate = currentFates[playerIndex];
    if (!fate) return baseScore;

    let modified = baseScore;
    if (fate.effect === 'firstHuDouble') {
      modified = baseScore * 2;
    } else if (fate.effect === 'tsumoBonus' && isTsumo) {
      modified = baseScore + 50;
    }
    return modified;
  }

  // Check if player has peek ability (麒麟)
  function canPeek(playerIndex) {
    if (!currentFates) return false;
    return currentFates[playerIndex]?.effect === 'peekOpponent';
  }

  // Reset for new game
  function reset() {
    currentFates = null;
    revealed = false;
  }

  return { dealFates, getFate, getPlayerFate, revealPlayerFate, updateFateBadges, applyFateEffect, canPeek, reset };
})();


// ╔═══════════════════════════════════════════════════════════╗
// ║  FEATURE 7: TILE DRAW & DISCARD ANIMATIONS               ║
// ╚═══════════════════════════════════════════════════════════╝

const TileAnimations = (() => {
  'use strict';

  // Animate newly drawn tile with a bounce
  function animateDrawnTile(containerEl) {
    if (!containerEl) return;
    // The last tile in the container is the newly drawn one
    const tiles = containerEl.querySelectorAll('.tile');
    if (tiles.length === 0) return;
    const lastTile = tiles[tiles.length - 1];
    lastTile.classList.remove('just-drawn');
    // Force reflow
    void lastTile.offsetWidth;
    lastTile.classList.add('just-drawn');
    // Remove class after animation
    setTimeout(() => lastTile.classList.remove('just-drawn'), 500);
  }

  // Spawn gold particle burst at position
  function spawnGoldBurst(x, y, count = 8) {
    for (let i = 0; i < count; i++) {
      const el = document.createElement('div');
      el.className = 'gold-particle';
      const angle = (i / count) * Math.PI * 2;
      const dist = 40 + Math.random() * 60;
      const dx = Math.round(Math.cos(angle) * dist);
      const dy = Math.round(Math.sin(angle) * dist);
      el.style.cssText = `
        left: ${x}px; top: ${y}px;
        --dx: ${dx}px; --dy: ${dy}px;
        animation-delay: ${i * 30}ms;
        background: ${Math.random() > 0.5 ? '#f5c518' : '#ff6b9d'};
      `;
      document.body.appendChild(el);
      setTimeout(() => el.remove(), 1400);
    }
  }

  return { animateDrawnTile, spawnGoldBurst };
})();


// ╔═══════════════════════════════════════════════════════════╗
// ║  AUTO-INIT: Hook FateCards into game startup              ║
// ╚═══════════════════════════════════════════════════════════╝

(function hookFateCards() {
  // Wait for Game to be available
  function tryHook() {
    if (typeof Game === 'undefined' || typeof Game.startGame === 'undefined') {
      setTimeout(tryHook, 300);
      return;
    }

    const _origStart = Game.startGame;
    Game.startGame = async function(mode, options) {
      // Deal fate cards for the new game
      FateCards.dealFates();

      // Run the original game start
      const result = await _origStart.call(this, mode, options);

      // Show fate card reveal after a short delay (after deal animation)
      setTimeout(() => {
        FateCards.revealPlayerFate(() => {
          FateCards.updateFateBadges();
        });
      }, 2500);

      return result;
    };
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', tryHook);
  } else {
    tryHook();
  }
})();
