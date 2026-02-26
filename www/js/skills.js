// ═══════════════════════════════════════════════════════════════
// ⚡ Hello Kitty 麻将 — Character Skill System
// Unique active abilities per character (industry-first for mahjong)
// ═══════════════════════════════════════════════════════════════

const Skills = (() => {
  'use strict';

  // ╔═══════════════════════════════════════════════════════════╗
  // ║  SKILL DEFINITIONS                                       ║
  // ╚═══════════════════════════════════════════════════════════╝

  const SKILLS = {
    kitty: {
      id: 'kitty_insight',
      name: '心灵感应',
      desc: '偷看牌墙顶部3张牌',
      icon: '👁️',
      color: '#ff6b9d',
      cooldown: 0,       // turns until ready (0 = ready)
      maxCooldown: 0,     // one-time use
      uses: 1,
      maxUses: 1,
      friendshipUnlock: 3,  // friendship level needed
      effect(gameState) {
        const wall = gameState.wall;
        const idx = gameState.drawIndex;
        const peekTiles = [];
        for (let i = idx; i < Math.min(idx + 3, wall.length); i++) {
          peekTiles.push(wall[i]);
        }
        return { type: 'peek_wall', tiles: peekTiles, duration: 5000 };
      },
    },

    bear: {
      id: 'bear_fury',
      name: '暴力摸牌',
      desc: '下次摸牌时摸2张，选1张保留',
      icon: '💪',
      color: '#8B4513',
      uses: 1,
      maxUses: 1,
      friendshipUnlock: 3,
      effect(gameState) {
        return { type: 'double_draw', active: true };
      },
    },

    bunny: {
      id: 'bunny_shield',
      name: '安全结界',
      desc: '3回合内显示所有牌的危险度',
      icon: '🛡️',
      color: '#9b59b6',
      uses: 1,
      maxUses: 1,
      friendshipUnlock: 2,
      effect(gameState) {
        return { type: 'danger_vision', turnsLeft: 3 };
      },
    },

    fox: {
      id: 'fox_swap',
      name: '偷天换日',
      desc: '将手中1张牌与牌墙随机1张交换',
      icon: '🔄',
      color: '#e67e22',
      uses: 1,
      maxUses: 1,
      friendshipUnlock: 5,
      effect(gameState, selectedTileId) {
        return { type: 'swap_tile', selectedTileId };
      },
    },

    panda: {
      id: 'panda_count',
      name: '算牌大师',
      desc: '显示所有牌型的剩余数量',
      icon: '🧮',
      color: '#2c3e50',
      uses: 1,
      maxUses: 1,
      friendshipUnlock: 3,
      effect(gameState) {
        const visible = {};
        // Count all visible tiles
        for (const tile of gameState.discardPile) {
          visible[tile.key] = (visible[tile.key] || 0) + 1;
        }
        for (const p of gameState.players) {
          for (const meld of p.melds) {
            for (const tile of meld.tiles) {
              visible[tile.key] = (visible[tile.key] || 0) + 1;
            }
          }
        }
        // Player's own hand
        for (const tile of gameState.players[0].hand) {
          visible[tile.key] = (visible[tile.key] || 0) + 1;
        }
        // Calculate remaining for each tile type
        const remaining = {};
        for (const key of Object.keys(TILES)) {
          remaining[key] = 4 - (visible[key] || 0);
        }
        return { type: 'tile_count', remaining, duration: 8000 };
      },
    },

    dragon: {
      id: 'dragon_summon',
      name: '龙之召唤',
      desc: '从牌墙中召唤1张你最需要的牌',
      icon: '🐉',
      color: '#c0392b',
      uses: 1,
      maxUses: 1,
      friendshipUnlock: 8,
      effect(gameState) {
        return { type: 'best_draw', active: true };
      },
    },
  };

  // ╔═══════════════════════════════════════════════════════════╗
  // ║  SKILL STATE                                             ║
  // ╚═══════════════════════════════════════════════════════════╝

  let skillState = {
    available: {},      // charId -> { uses, cooldown, active effects }
    activeEffects: [],  // currently active effects
    dangerVisionTurns: 0,
    doubleDraw: false,
    bestDraw: false,
  };

  function initForGame() {
    skillState = {
      available: {},
      activeEffects: [],
      dangerVisionTurns: 0,
      doubleDraw: false,
      bestDraw: false,
    };

    // Check which skills the player has unlocked via friendship
    const friendship = typeof Storage !== 'undefined' ? Storage.getFriendship() : {};
    for (const [charId, skill] of Object.entries(SKILLS)) {
      const fl = friendship[charId]?.level || 0;
      if (fl >= skill.friendshipUnlock) {
        skillState.available[charId] = {
          uses: skill.maxUses,
          ready: true,
        };
      }
    }
  }

  function getAvailableSkills() {
    const result = [];
    for (const [charId, state] of Object.entries(skillState.available)) {
      if (state.uses > 0 && state.ready) {
        result.push({ ...SKILLS[charId], charId });
      }
    }
    return result;
  }

  function canUseSkill(charId) {
    const s = skillState.available[charId];
    return s && s.uses > 0 && s.ready;
  }

  function useSkill(charId, gameState, extraArg) {
    const skill = SKILLS[charId];
    if (!skill || !canUseSkill(charId)) return null;

    skillState.available[charId].uses--;
    const result = skill.effect(gameState, extraArg);

    // Apply persistent effects
    if (result.type === 'danger_vision') {
      skillState.dangerVisionTurns = result.turnsLeft;
    } else if (result.type === 'double_draw') {
      skillState.doubleDraw = true;
    } else if (result.type === 'best_draw') {
      skillState.bestDraw = true;
    }

    skillState.activeEffects.push({ charId, ...result, startTime: Date.now() });
    return result;
  }

  function onTurnEnd() {
    if (skillState.dangerVisionTurns > 0) {
      skillState.dangerVisionTurns--;
    }
    // Clean up expired effects
    const now = Date.now();
    skillState.activeEffects = skillState.activeEffects.filter(e => {
      if (e.duration) return (now - e.startTime) < e.duration;
      return true;
    });
  }

  function isDangerVisionActive() {
    return skillState.dangerVisionTurns > 0;
  }

  function isDoubleDrawActive() {
    return skillState.doubleDraw;
  }

  function consumeDoubleDraw() {
    skillState.doubleDraw = false;
  }

  function isBestDrawActive() {
    return skillState.bestDraw;
  }

  function consumeBestDraw() {
    skillState.bestDraw = false;
  }

  // ╔═══════════════════════════════════════════════════════════╗
  // ║  DANGER CALCULATION                                      ║
  // ╚═══════════════════════════════════════════════════════════╝

  function calculateTileDanger(tile, gameState) {
    const visible = {};
    for (const t of gameState.discardPile) {
      visible[t.key] = (visible[t.key] || 0) + 1;
    }
    for (const p of gameState.players) {
      for (const meld of p.melds) {
        for (const t of meld.tiles) {
          visible[t.key] = (visible[t.key] || 0) + 1;
        }
      }
    }

    const count = visible[tile.key] || 0;
    let danger = 0;

    // Base danger
    if (count >= 3) return 5;     // Very safe (3 visible = only 1 left)
    if (count >= 2) danger = 20;  // Safe
    else if (count >= 1) danger = 40;
    else danger = 60;

    // Honor tiles are more dangerous when few visible
    if (['feng', 'jian'].includes(tile.suit)) {
      danger += (3 - count) * 8;
    }

    // Terminal tiles (1,9) are safer
    if (tile.rank === 1 || tile.rank === 9) danger -= 12;

    // Middle tiles (4,5,6) are more dangerous
    if ([4, 5, 6].includes(tile.rank)) danger += 12;

    // Recently discarded tiles are safer
    const recent = gameState.discardPile.slice(-6);
    if (recent.some(t => t.key === tile.key)) danger -= 20;

    // Same suit as opponents' recent discards = safer
    for (let i = 1; i < 4; i++) {
      const pDiscards = gameState.players[i].discards.slice(-3);
      if (pDiscards.some(t => t.suit === tile.suit)) danger -= 5;
    }

    return Math.max(0, Math.min(100, danger));
  }

  function getDangerLevel(danger) {
    if (danger <= 20) return 'safe';        // green
    if (danger <= 45) return 'caution';     // yellow
    if (danger <= 70) return 'warning';     // orange
    return 'danger';                         // red
  }

  function getDangerColor(danger) {
    if (danger <= 20) return '#22c55e';
    if (danger <= 45) return '#eab308';
    if (danger <= 70) return '#f97316';
    return '#ef4444';
  }

  // ╔═══════════════════════════════════════════════════════════╗
  // ║  UI: SKILL BUTTON & OVERLAYS                             ║
  // ╚═══════════════════════════════════════════════════════════╝

  function renderSkillButton() {
    const existing = document.getElementById('skill-btn-container');
    if (existing) existing.remove();

    const skills = getAvailableSkills();
    if (skills.length === 0) return;

    const container = document.createElement('div');
    container.id = 'skill-btn-container';
    container.style.cssText = `
      position: fixed; bottom: 80px; right: 12px; z-index: 300;
      display: flex; flex-direction: column; gap: 6px; align-items: flex-end;
    `;

    for (const skill of skills) {
      const btn = document.createElement('button');
      btn.className = 'skill-btn';
      btn.dataset.char = skill.charId;
      btn.innerHTML = `<span class="skill-icon">${skill.icon}</span><span class="skill-name">${skill.name}</span>`;
      btn.style.cssText = `
        display: flex; align-items: center; gap: 6px;
        padding: 8px 14px; border: 2px solid ${skill.color};
        border-radius: 20px; background: rgba(0,0,0,0.8);
        color: ${skill.color}; font-size: 13px; font-weight: 700;
        cursor: pointer; font-family: inherit;
        box-shadow: 0 2px 12px ${skill.color}40;
        animation: skillPulse 2s ease-in-out infinite;
        transition: transform 0.15s;
      `;
      btn.addEventListener('click', () => onSkillButtonClick(skill));
      container.appendChild(btn);
    }

    document.body.appendChild(container);
  }

  function removeSkillButton() {
    const existing = document.getElementById('skill-btn-container');
    if (existing) existing.remove();
  }

  function onSkillButtonClick(skill) {
    const gameState = Game.getState();
    if (!gameState || gameState.gameOver) return;
    if (gameState.currentPlayer !== 0) return; // Only on player's turn

    if (skill.id === 'fox_swap') {
      // Need to select a tile first
      showSwapPicker(skill, gameState);
      return;
    }

    const result = useSkill(skill.charId, gameState);
    if (!result) return;

    // Show skill activation animation
    showSkillActivation(skill, result);

    // Refresh skill buttons
    renderSkillButton();
  }

  function showSkillActivation(skill, result) {
    // Full-screen flash
    const flash = document.createElement('div');
    flash.style.cssText = `
      position: fixed; inset: 0; z-index: 1000;
      background: ${skill.color}30;
      pointer-events: none;
      animation: skillFlash 0.6s ease-out forwards;
    `;
    document.body.appendChild(flash);
    setTimeout(() => flash.remove(), 600);

    // Skill name display
    const label = document.createElement('div');
    label.textContent = `${skill.icon} ${skill.name}`;
    label.style.cssText = `
      position: fixed; top: 50%; left: 50%;
      transform: translate(-50%, -50%) scale(0);
      z-index: 1001; pointer-events: none;
      font-size: 36px; font-weight: 900;
      color: ${skill.color}; text-shadow: 0 4px 20px ${skill.color}80;
      animation: skillPopIn 0.8s cubic-bezier(0.34,1.56,0.64,1) forwards;
    `;
    document.body.appendChild(label);
    setTimeout(() => label.remove(), 1200);

    // Handle result display
    if (result.type === 'peek_wall' && result.tiles.length > 0) {
      showPeekOverlay(result.tiles, result.duration);
    } else if (result.type === 'tile_count') {
      showTileCountOverlay(result.remaining, result.duration);
    } else if (result.type === 'danger_vision') {
      // Will be applied on next render
      if (typeof Commentary !== 'undefined') Commentary.announce('安全结界启动！3回合内可以看到所有牌的危险度！', '#9b59b6');
    } else if (result.type === 'double_draw') {
      if (typeof Commentary !== 'undefined') Commentary.announce('暴力摸牌！下次摸牌时可以选择最好的一张！', '#8B4513');
    } else if (result.type === 'best_draw') {
      if (typeof Commentary !== 'undefined') Commentary.announce('龙之召唤！下次将摸到你最需要的牌！', '#c0392b');
    }

    // FEATURE 4: Trigger visual effects via Game module
    if (typeof Game !== 'undefined' && Game.showSkillVisualEffect) {
      Game.showSkillVisualEffect(skill.id, result);
    }
  }

  function showPeekOverlay(tiles, duration) {
    const overlay = document.createElement('div');
    overlay.className = 'skill-peek-overlay';
    overlay.style.cssText = `
      position: fixed; top: 50%; left: 50%;
      transform: translate(-50%, -50%);
      z-index: 500; background: rgba(0,0,0,0.9);
      border-radius: 20px; padding: 20px 24px;
      border: 2px solid #ff6b9d;
      box-shadow: 0 8px 32px rgba(255,107,157,0.3);
      text-align: center;
    `;
    overlay.innerHTML = `
      <div style="color:#ff6b9d;font-size:14px;font-weight:700;margin-bottom:12px;">
        👁️ 牌墙预览
      </div>
      <div style="display:flex;gap:6px;justify-content:center;" id="peek-tiles"></div>
      <div style="color:rgba(255,255,255,0.5);font-size:11px;margin-top:10px;">
        ${Math.round(duration / 1000)}秒后消失
      </div>
    `;
    document.body.appendChild(overlay);

    const container = overlay.querySelector('#peek-tiles');
    for (const tile of tiles) {
      container.appendChild(Game.renderTile(tile, { small: false }));
    }

    // Auto-remove
    setTimeout(() => {
      overlay.style.transition = 'opacity 0.5s';
      overlay.style.opacity = '0';
      setTimeout(() => overlay.remove(), 500);
    }, duration);
  }

  function showTileCountOverlay(remaining, duration) {
    const overlay = document.createElement('div');
    overlay.className = 'skill-count-overlay';
    overlay.style.cssText = `
      position: fixed; top: 50%; left: 50%;
      transform: translate(-50%, -50%);
      z-index: 500; background: rgba(0,0,0,0.95);
      border-radius: 20px; padding: 16px 20px;
      border: 2px solid #2c3e50;
      box-shadow: 0 8px 32px rgba(44,62,80,0.3);
      text-align: center; max-height: 70vh; overflow-y: auto;
      max-width: 90vw;
    `;

    let html = `<div style="color:#2c3e50;font-size:14px;font-weight:700;margin-bottom:12px;">
      🧮 剩余牌数
    </div>`;

    const suits = [
      { key: 'wan', name: '万', prefix: 'w', color: '#e74c3c' },
      { key: 'tiao', name: '条', prefix: 't', color: '#2ecc71' },
      { key: 'tong', name: '筒', prefix: 'b', color: '#3498db' },
    ];

    for (const suit of suits) {
      html += `<div style="display:flex;gap:4px;margin:6px 0;align-items:center;">
        <span style="color:${suit.color};font-weight:700;min-width:20px;">${suit.name}</span>`;
      for (let r = 1; r <= 9; r++) {
        const key = suit.prefix + r;
        const count = remaining[key] || 0;
        const bg = count === 0 ? 'rgba(255,255,255,0.05)' :
                   count <= 1 ? 'rgba(239,68,68,0.3)' :
                   count <= 2 ? 'rgba(234,179,8,0.3)' : 'rgba(34,197,94,0.3)';
        html += `<span style="
          width:28px;height:28px;display:flex;align-items:center;justify-content:center;
          background:${bg};border-radius:6px;font-size:13px;font-weight:700;
          color:${count === 0 ? 'rgba(255,255,255,0.2)' : '#fff'};
        ">${count}</span>`;
      }
      html += `</div>`;
    }

    // Honor tiles
    const honors = [
      { key: 'fe', name: '东' }, { key: 'fs', name: '南' },
      { key: 'fw', name: '西' }, { key: 'fn', name: '北' },
      { key: 'jz', name: '中' }, { key: 'jf', name: '发' }, { key: 'jb', name: '白' },
    ];
    html += `<div style="display:flex;gap:4px;margin:6px 0;align-items:center;">
      <span style="color:#9b59b6;font-weight:700;min-width:20px;">字</span>`;
    for (const h of honors) {
      const count = remaining[h.key] || 0;
      const bg = count === 0 ? 'rgba(255,255,255,0.05)' :
                 count <= 1 ? 'rgba(239,68,68,0.3)' : 'rgba(34,197,94,0.3)';
      html += `<span style="
        width:28px;height:28px;display:flex;align-items:center;justify-content:center;
        background:${bg};border-radius:6px;font-size:11px;font-weight:700;
        color:${count === 0 ? 'rgba(255,255,255,0.2)' : '#fff'};
      ">${h.name}<br>${count}</span>`;
    }
    html += `</div>`;

    html += `<div style="color:rgba(255,255,255,0.5);font-size:11px;margin-top:8px;">
      点击任意位置关闭
    </div>`;

    overlay.innerHTML = html;
    document.body.appendChild(overlay);

    overlay.addEventListener('click', () => {
      overlay.style.transition = 'opacity 0.3s';
      overlay.style.opacity = '0';
      setTimeout(() => overlay.remove(), 300);
    });

    setTimeout(() => {
      if (overlay.parentNode) {
        overlay.style.transition = 'opacity 0.5s';
        overlay.style.opacity = '0';
        setTimeout(() => overlay.remove(), 500);
      }
    }, duration);
  }

  function showSwapPicker(skill, gameState) {
    Commentary.announce('选择要交换的牌！', '#e67e22');
    // Mark game as awaiting swap selection
    skillState._pendingSwap = skill;
  }

  function handleSwapSelection(tile, gameState) {
    if (!skillState._pendingSwap) return false;

    const skill = skillState._pendingSwap;
    skillState._pendingSwap = null;

    // Swap with random wall tile
    const wallIdx = gameState.drawIndex + Math.floor(Math.random() * (gameState.wall.length - gameState.drawIndex));
    const wallTile = gameState.wall[wallIdx];

    // Find the tile in hand
    const handIdx = gameState.players[0].hand.findIndex(t => t.id === tile.id);
    if (handIdx === -1) return false;

    // Swap
    gameState.wall[wallIdx] = gameState.players[0].hand[handIdx];
    gameState.players[0].hand[handIdx] = wallTile;

    useSkill(skill.charId, gameState);
    showSkillActivation(skill, { type: 'swap_complete' });
    if (typeof Commentary !== 'undefined') Commentary.announce(`偷天换日！获得了 ${wallTile.name}！`, '#e67e22');
    renderSkillButton();
    return true;
  }

  function isPendingSwap() {
    return !!skillState._pendingSwap;
  }

  return {
    SKILLS,
    initForGame,
    getAvailableSkills,
    canUseSkill,
    useSkill,
    onTurnEnd,
    isDangerVisionActive,
    isDoubleDrawActive,
    consumeDoubleDraw,
    isBestDrawActive,
    consumeBestDraw,
    calculateTileDanger,
    getDangerLevel,
    getDangerColor,
    renderSkillButton,
    removeSkillButton,
    handleSwapSelection,
    isPendingSwap,
  };
})();
