// ═══════════════════════════════════════════════════════════════
// 🎙️ Hello Kitty 麻将 — Live Commentary System
// Dynamic play-by-play, dramatic moments, sports-broadcast feel
// ═══════════════════════════════════════════════════════════════

const Commentary = (() => {
  'use strict';

  let container = null;
  let messageQueue = [];
  let isShowing = false;
  let turnCount = 0;
  let lastCommentTime = 0;
  const MIN_INTERVAL = 2000; // Minimum ms between comments

  // ╔═══════════════════════════════════════════════════════════╗
  // ║  COMMENTARY DATABASE                                     ║
  // ╚═══════════════════════════════════════════════════════════╝

  const LINES = {
    // ═══ Game flow ═══
    gameStart: [
      '对局开始！让我们看看今天谁能笑到最后！',
      '洗牌完毕！好戏即将开场！',
      '四位选手已就位！比赛开始！',
    ],
    earlyGame: [
      '开局阶段，各家都在积蓄力量...',
      '暗流涌动，谁会率先发难？',
      '起手不错！看看后续发展...',
    ],
    midGame: [
      '中盘博弈！局势开始明朗了！',
      '关键时刻到了！每一张牌都至关重要！',
      '战况胶着！这就是麻将的魅力！',
    ],
    lateGame: [
      '最后阶段！决战时刻！',
      '牌墙见底了！谁能率先胡牌？',
      '紧张！只剩几张牌了！',
      '千钧一发！下一张牌可能改变一切！',
    ],
    lowTiles: [
      '只剩{n}张牌了！最后的机会！',
      '牌墙告急！{n}张！',
    ],

    // ═══ Player actions ═══
    playerDraw: [
      '摸牌...会是好牌吗？',
    ],
    playerDiscard: [
      '打出{tile}！',
    ],
    playerChi: [
      '吃牌！顺子组成！',
      '漂亮的吃！',
    ],
    playerPeng: [
      '碰！三张一样的！',
      '碰牌成功！攻势渐起！',
    ],
    playerGang: [
      '杠！四张齐了！太霸气了！',
      '开杠！运气爆棚！',
      '杠上开花？期待好运！',
    ],
    playerHu: [
      '胡牌！恭喜恭喜！',
      '漂亮的胡牌！',
    ],
    playerTsumo: [
      '自摸！三家通赔！',
      '自摸了！太漂亮了！',
      '神之一摸！自摸胡牌！',
    ],

    // ═══ AI actions ═══
    aiChi: [
      '{name}吃牌了！',
      '{name}：吃！',
    ],
    aiPeng: [
      '{name}碰牌！要小心了！',
      '{name}碰！对手在加速！',
    ],
    aiGang: [
      '{name}开杠了！气势如虹！',
      '{name}杠！可怕的运气！',
    ],
    aiHu: [
      '{name}胡了！功亏一篑！',
      '{name}赢了！下次再接再厉！',
    ],
    aiTsumo: [
      '{name}自摸！太可惜了！',
      '{name}自摸胡牌！实力不容小觑！',
    ],

    // ═══ Special situations ═══
    consecutivePeng: [
      '连续碰牌！手气太好了！',
      '又碰了！势不可挡！',
    ],
    dangerousDiscard: [
      '这张牌有点危险...小心放炮！',
      '注意！这是张危险牌！',
    ],
    safeDiscard: [
      '安全牌！稳健的选择！',
    ],
    hearingChance: [
      '快听牌了！加油！',
      '离胡牌只差一步！',
    ],
    drawGame: [
      '流局了！平局收场！',
      '没人胡牌...麻将有时就是这样',
    ],

    // ═══ Character-specific ═══
    characterAction: {
      kitty: { peng: '凯蒂碰了一个可爱的碰！', gang: '凯蒂居然杠了！意外的强势！' },
      bear: { peng: '大熊暴力碰牌！', gang: '大熊开杠！霸气侧漏！' },
      bunny: { peng: '小兔鼓起勇气碰牌了！', gang: '小兔意外开杠！连她自己都吃惊了！' },
      fox: { peng: '狐狸碰了...又在算计什么？', gang: '狐狸开杠！是陷阱还是实力？' },
      panda: { peng: '团团从容碰牌！', gang: '团团杠！一切尽在计算之中！' },
      dragon: { peng: '龙王碰牌！龙威不可挡！', gang: '龙王开杠！天崩地裂！' },
    },

    // ═══ Combo comments ═══
    combo2: ['连续两次操作！节奏起来了！'],
    combo3: ['三连击！停不下来了！'],
    combo4plus: ['超级连击！这就是高手的风范！'],

    // ═══ Score comments ═══
    bigScore: [
      '大番！分数飙升！',
      '高番牌型！太厉害了！',
    ],
    megaScore: [
      '超级大牌！一把翻盘！',
      '满贯！传说级别的牌！',
    ],
  };

  // ╔═══════════════════════════════════════════════════════════╗
  // ║  CORE LOGIC                                              ║
  // ╚═══════════════════════════════════════════════════════════╝

  function init() {
    turnCount = 0;
    lastCommentTime = 0;
    messageQueue = [];
    isShowing = false;
    ensureContainer();
  }

  function ensureContainer() {
    if (container && document.body.contains(container)) return;
    container = document.createElement('div');
    container.id = 'commentary-container';
    container.style.cssText = `
      position: fixed; top: max(52px, env(safe-area-inset-top, 0px));
      left: 50%; transform: translateX(-50%);
      z-index: 250; pointer-events: none;
      display: flex; flex-direction: column; align-items: center;
      gap: 4px; max-width: 90%;
    `;
    document.body.appendChild(container);
  }

  function pickRandom(arr) {
    if (!arr || arr.length === 0) return null;
    return arr[Math.floor(Math.random() * arr.length)];
  }

  function announce(text, color = '#fff', priority = false) {
    if (!text) return;
    const now = Date.now();
    if (!priority && (now - lastCommentTime) < MIN_INTERVAL) {
      // Queue instead
      messageQueue.push({ text, color });
      return;
    }
    showMessage(text, color);
    lastCommentTime = now;
  }

  function showMessage(text, color = '#fff') {
    ensureContainer();

    const msg = document.createElement('div');
    msg.className = 'commentary-msg';
    msg.textContent = text;
    msg.style.cssText = `
      background: rgba(0,0,0,0.85);
      color: ${color};
      padding: 6px 16px;
      border-radius: 20px;
      font-size: 13px;
      font-weight: 600;
      white-space: nowrap;
      backdrop-filter: blur(8px);
      border: 1px solid ${color}30;
      box-shadow: 0 2px 12px rgba(0,0,0,0.3);
      opacity: 0;
      transform: translateY(-10px) scale(0.9);
      transition: all 0.3s cubic-bezier(0.34,1.56,0.64,1);
    `;
    container.appendChild(msg);

    requestAnimationFrame(() => {
      msg.style.opacity = '1';
      msg.style.transform = 'translateY(0) scale(1)';
    });

    // Remove after delay
    setTimeout(() => {
      msg.style.opacity = '0';
      msg.style.transform = 'translateY(-10px) scale(0.9)';
      setTimeout(() => msg.remove(), 300);
    }, 2500);

    // Limit visible messages
    while (container.children.length > 3) {
      container.firstChild.remove();
    }
  }

  // Process queued messages
  setInterval(() => {
    if (messageQueue.length > 0 && (Date.now() - lastCommentTime) >= MIN_INTERVAL) {
      const msg = messageQueue.shift();
      showMessage(msg.text, msg.color);
      lastCommentTime = Date.now();
    }
  }, 500);

  // ╔═══════════════════════════════════════════════════════════╗
  // ║  EVENT HANDLERS                                          ║
  // ╚═══════════════════════════════════════════════════════════╝

  function onGameStart() {
    init();
    announce(pickRandom(LINES.gameStart), '#f5c518', true);
  }

  function onTurn(gameState) {
    turnCount++;
    const remaining = gameState.wall.length - gameState.drawIndex;
    const total = gameState.wall.length;
    const progress = 1 - (remaining / total);

    // Phase comments (only occasionally)
    if (Math.random() < 0.15) {
      if (progress < 0.25) {
        announce(pickRandom(LINES.earlyGame), 'rgba(255,255,255,0.7)');
      } else if (progress < 0.65) {
        announce(pickRandom(LINES.midGame), '#5b9bd5');
      } else {
        announce(pickRandom(LINES.lateGame), '#ef4444');
      }
    }

    // Low tiles warning
    if (remaining === 20) {
      announce(pickRandom(LINES.lowTiles).replace('{n}', '20'), '#f97316');
    } else if (remaining === 10) {
      announce(pickRandom(LINES.lowTiles).replace('{n}', '10'), '#ef4444', true);
    } else if (remaining === 5) {
      announce('最后5张！绝境中的希望！', '#ef4444', true);
    }
  }

  function onAction(action, playerIndex, gameState, tile) {
    const isHuman = playerIndex === 0;
    const player = gameState.players[playerIndex];
    const name = player.name;
    const charId = player.charId;

    if (isHuman) {
      switch (action) {
        case 'chi':
          if (Math.random() < 0.5) announce(pickRandom(LINES.playerChi), '#5b9bd5');
          break;
        case 'peng':
          announce(pickRandom(LINES.playerPeng), '#22c55e');
          break;
        case 'gang':
          announce(pickRandom(LINES.playerGang), '#a855f7', true);
          break;
        case 'hu':
          announce(pickRandom(LINES.playerHu), '#f5c518', true);
          break;
        case 'tsumo':
          announce(pickRandom(LINES.playerTsumo), '#f5c518', true);
          break;
      }
    } else {
      // Character-specific lines
      const charLines = LINES.characterAction[charId];

      switch (action) {
        case 'chi':
          announce(pickRandom(LINES.aiChi).replace('{name}', name), '#5b9bd5');
          break;
        case 'peng':
          const pengLine = charLines?.peng || pickRandom(LINES.aiPeng).replace('{name}', name);
          announce(pengLine, '#22c55e');
          break;
        case 'gang':
          const gangLine = charLines?.gang || pickRandom(LINES.aiGang).replace('{name}', name);
          announce(gangLine, '#a855f7', true);
          break;
        case 'hu':
          announce(pickRandom(LINES.aiHu).replace('{name}', name), '#ef4444', true);
          break;
        case 'tsumo':
          announce(pickRandom(LINES.aiTsumo).replace('{name}', name), '#ef4444', true);
          break;
      }
    }
  }

  function onDangerousDiscard(tile) {
    if (Math.random() < 0.3) {
      announce(pickRandom(LINES.dangerousDiscard), '#ef4444');
    }
  }

  function onDrawGame() {
    announce(pickRandom(LINES.drawGame), '#95a5a6', true);
  }

  function onScore(fans, totalFan) {
    if (totalFan >= 10) {
      announce(pickRandom(LINES.megaScore), '#f5c518', true);
    } else if (totalFan >= 4) {
      announce(pickRandom(LINES.bigScore), '#f5c518');
    }
  }

  function destroy() {
    if (container) {
      container.remove();
      container = null;
    }
    messageQueue = [];
  }

  return {
    init,
    announce,
    onGameStart,
    onTurn,
    onAction,
    onDangerousDiscard,
    onDrawGame,
    onScore,
    destroy,
  };
})();
