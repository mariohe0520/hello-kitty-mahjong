// ═══════════════════════════════════════════════════════════════
// 🎀 Hello Kitty 麻将 — App Controller v2.0
// Tab navigation, page routing, character selection, settings
// ═══════════════════════════════════════════════════════════════

const App = (() => {
  'use strict';

  let currentPage = 'splash';
  let settings = null;
  let settingsOverlay = null;
  let responsiveBound = false;
  let responsiveRaf = 0;

  function getSettings() {
    if (!settings) {
      const profile = Storage.getProfile();
      settings = profile.settings;
    }
    return settings;
  }

  function clamp(v, min, max) {
    return Math.max(min, Math.min(max, v));
  }

  function applyResponsiveMetrics() {
    const vv = window.visualViewport;
    const viewportW = Math.round(vv?.width || window.innerWidth || 390);
    const viewportH = Math.round(vv?.height || window.innerHeight || 844);

    const root = document.documentElement;
    root.style.setProperty('--app-width', `${viewportW}px`);
    root.style.setProperty('--app-height', `${viewportH}px`);

    const table = document.getElementById('mahjong-table');
    let tableW = table ? Math.round(table.getBoundingClientRect().width) : 0;
    if (!tableW || tableW < 280) {
      tableW = Math.round(clamp(viewportW - 10, 320, 430));
    }

    const bottomTileW = clamp((tableW - 58) / 14, 22, 31);
    const topTileW = clamp((tableW - 88) / 14, 17, 27);
    const sideTileW = clamp(tableW * 0.09, 30, 38);
    const sideTileH = clamp(sideTileW * 0.34, 10, 14);
    const sideColW = clamp(tableW * 0.18, 60, 82);

    root.style.setProperty('--table-width', `${tableW}px`);
    root.style.setProperty('--tile-bottom-w', `${bottomTileW.toFixed(2)}px`);
    root.style.setProperty('--tile-top-w', `${topTileW.toFixed(2)}px`);
    root.style.setProperty('--tile-side-w', `${sideTileW.toFixed(2)}px`);
    root.style.setProperty('--tile-side-h', `${sideTileH.toFixed(2)}px`);
    root.style.setProperty('--side-column-w', `${sideColW.toFixed(2)}px`);

    root.classList.toggle('compact-height', viewportH < 820);
    root.classList.toggle('short-height', viewportH < 740);
  }

  function scheduleResponsiveMetrics() {
    if (responsiveRaf) cancelAnimationFrame(responsiveRaf);
    responsiveRaf = requestAnimationFrame(() => {
      responsiveRaf = 0;
      applyResponsiveMetrics();
    });
  }

  function setupResponsiveLayout() {
    if (responsiveBound) return;
    responsiveBound = true;

    window.addEventListener('resize', scheduleResponsiveMetrics, { passive: true });
    window.addEventListener('orientationchange', scheduleResponsiveMetrics, { passive: true });
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', scheduleResponsiveMetrics, { passive: true });
    }

    scheduleResponsiveMetrics();
    setTimeout(scheduleResponsiveMetrics, 120);
    setTimeout(scheduleResponsiveMetrics, 500);
  }

  // ╔═══════════════════════════════════════════════════════════╗
  // ║  SPLASH SCREEN                                           ║
  // ╚═══════════════════════════════════════════════════════════╝

  function initSplash() {
    const splash = document.getElementById('splash');
    if (!splash) return;

    const splashContent = splash.querySelector('.splash-content');
    const tileContainer = document.createElement('div');
    tileContainer.style.cssText = 'display:flex;gap:6px;justify-content:center;margin-top:20px;height:56px;overflow:hidden;';

    const sampleKeys = ['w1', 'w2', 'w3', 'b5', 'jz', 't7', 'fe', 'jf', 'b9'];
    sampleKeys.forEach((key, i) => {
      const tile = { ...TILES[key], key, id: `splash_${key}` };
      const el = Game.renderTile(tile, { small: true });
      el.style.opacity = '0';
      el.style.transform = 'translateY(-60px) rotateX(90deg)';
      el.style.transition = 'none';
      tileContainer.appendChild(el);
      setTimeout(() => {
        el.style.transition = 'all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)';
        el.style.opacity = '1';
        el.style.transform = 'translateY(0) rotateX(0)';
      }, 300 + i * 100);
    });

    const loadingEl = splash.querySelector('.splash-loading');
    if (loadingEl) {
      splashContent.insertBefore(tileContainer, loadingEl);
      loadingEl.textContent = '正在洗牌...';
    }

    setTimeout(() => hideSplash(), 2200);
  }

  function hideSplash() {
    const splash = document.getElementById('splash');
    if (!splash) return;
    splash.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
    splash.style.opacity = '0';
    splash.style.transform = 'scale(1.05)';
    setTimeout(() => {
      splash.style.display = 'none';
      navigateTo('home');
    }, 600);
  }

  // ╔═══════════════════════════════════════════════════════════╗
  // ║  PAGE NAVIGATION — Tab system                            ║
  // ╚═══════════════════════════════════════════════════════════╝

  function navigateTo(pageId) {
    const allPages = document.querySelectorAll('.page');
    allPages.forEach(p => {
      if (p.id !== 'splash') {
        p.style.display = 'none';
        p.style.opacity = '';
        p.style.transform = '';
      }
    });

    const newPage = document.getElementById(pageId);
    if (!newPage) return;

    newPage.style.display = 'flex';
    newPage.style.opacity = '0';
    newPage.style.transform = 'translateY(10px)';
    requestAnimationFrame(() => {
      newPage.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
      newPage.style.opacity = '1';
      newPage.style.transform = 'translateY(0)';
    });

    currentPage = pageId;
    updateTabBar(pageId);

    // Show/hide tab bar
    const tabBar = document.getElementById('tab-bar');
    if (tabBar) {
      const hideTabs = ['game', 'splash', 'tutorial'];
      tabBar.style.display = hideTabs.includes(pageId) ? 'none' : 'flex';
    }

    // Page-specific init
    if (pageId === 'home') renderHomePage();
    if (pageId === 'story') renderStoryPage();
    if (pageId === 'collection') renderCollectionPage();
    if (pageId === 'achievements') renderAchievementsPage();

    scheduleResponsiveMetrics();
  }

  function updateTabBar(pageId) {
    document.querySelectorAll('.tab-item').forEach(tab => {
      tab.classList.toggle('active', tab.dataset.page === pageId);
    });
  }

  // ╔═══════════════════════════════════════════════════════════╗
  // ║  HOME PAGE                                               ║
  // ╚═══════════════════════════════════════════════════════════╝

  function renderHomePage() {
    const container = document.getElementById('home-content');
    if (!container) return;

    const profile = Storage.getProfile();
    const stats = Stats.getStats();
    const daily = Campaign.generateDailyChallenge();
    const winRate = stats.gamesPlayed ? Math.round(stats.gamesWon / stats.gamesPlayed * 100) : 0;
    const progress = Campaign.getTotalProgress();

    container.innerHTML = `
      <div class="home-header">
        <div class="home-profile">
          <div class="home-avatar">${profile.avatar}</div>
          <div class="home-info">
            <div class="home-name">${profile.name}</div>
            <div class="home-level">Lv.${profile.level} ${profile.title}</div>
          </div>
          <div class="home-coins">
            <span>🪙 ${profile.coins}</span>
          </div>
        </div>
        <div class="rank-badge" id="home-rank-badge"></div>
      </div>

      <!-- Quick Play -->
      <div class="home-section">
        <div class="section-title">🎮 快速开始</div>
        <div class="quick-play-grid">
          <button class="play-card play-beijing" onclick="App.startGame('beijing')">
            <span class="play-icon">🏯</span>
            <span class="play-name">北京麻将</span>
            <span class="play-desc">经典规则</span>
          </button>
          <button class="play-card play-sichuan" onclick="App.startGame('sichuan')">
            <span class="play-icon">🌶️</span>
            <span class="play-name">川麻血战</span>
            <span class="play-desc">血战到底</span>
          </button>
        </div>
      </div>

      <!-- Daily Challenge -->
      <div class="home-section">
        <div class="section-title">📅 每日挑战</div>
        <div class="daily-card ${daily.completed ? 'completed' : ''}">
          <div class="daily-info">
            <div class="daily-name">${daily.challenge?.name || '加载中...'}</div>
            <div class="daily-desc">${daily.challenge?.desc || ''}</div>
          </div>
          <div class="daily-reward">
            ${daily.completed ? '✅ 已完成' : `🪙 ${daily.reward?.coins || 200}`}
          </div>
        </div>
      </div>

      <!-- Stats Summary -->
      <div class="home-section">
        <div class="section-title">📊 战绩概览</div>
        <div class="home-stats-row">
          <div class="home-stat"><span class="home-stat-value">${stats.gamesWon}</span><span class="home-stat-label">胜局</span></div>
          <div class="home-stat"><span class="home-stat-value">${winRate}%</span><span class="home-stat-label">胜率</span></div>
          <div class="home-stat"><span class="home-stat-value">${stats.bestWinStreak}</span><span class="home-stat-label">最长连胜</span></div>
          <div class="home-stat"><span class="home-stat-value">${progress.completedLevels}</span><span class="home-stat-label">物语进度</span></div>
        </div>
      </div>

      <!-- Campaign Progress -->
      <div class="home-section">
        <div class="section-title">📖 麻将物语</div>
        <button class="story-banner" onclick="App.navigateTo('story')">
          <div class="story-banner-left">
            <div class="story-banner-chapter">第${Math.min(5, Math.ceil(progress.completedLevels / 10) || 1)}章</div>
            <div class="story-banner-name">${Campaign.CHAPTERS[Math.min(4, Math.floor(progress.completedLevels / 10))].name}</div>
          </div>
          <div class="story-banner-progress">
            <div class="story-bar"><div class="story-bar-fill" style="width:${progress.percentage}%"></div></div>
            <span class="story-bar-text">${progress.completedLevels}/${progress.totalLevels}</span>
          </div>
          <span class="story-arrow">›</span>
        </button>
      </div>

      <!-- Character Skills Preview -->
      ${typeof Skills !== 'undefined' ? `<div class="home-section">
        <div class="section-title">⚡ 角色技能</div>
        <div class="skills-preview">
          ${Object.entries(Skills.SKILLS).map(([charId, skill]) => {
            const friendship = typeof Storage !== 'undefined' ? Storage.getFriendship() : {};
            const fl = friendship[charId]?.level || 0;
            const unlocked = fl >= skill.friendshipUnlock;
            return `<div class="skill-preview-card ${unlocked ? '' : 'locked'}" style="border-color:${skill.color}40">
              <span class="skill-preview-icon">${unlocked ? skill.icon : '🔒'}</span>
              <div class="skill-preview-info">
                <div class="skill-preview-name" style="color:${unlocked ? skill.color : '#666'}">${unlocked ? skill.name : '???'}</div>
                <div class="skill-preview-desc">${unlocked ? skill.desc : `好感度Lv.${skill.friendshipUnlock}解锁`}</div>
              </div>
            </div>`;
          }).join('')}
        </div>
      </div>` : ''}

      <!-- Quick Actions -->
      <div class="home-section">
        <div class="home-quick-actions">
          <button class="quick-btn" onclick="App.showTutorial()"><span>📖</span>教学</button>
          <button class="quick-btn" onclick="App.showSettings()"><span>⚙️</span>设置</button>
          <button class="quick-btn" onclick="App.navigateTo('achievements')"><span>🏅</span>成就</button>
        </div>
      </div>

      <div class="home-footer">
        <span class="version">Hello Kitty 麻将 v2.0 🎀</span>
      </div>
    `;

    // Render rank badge
    if (typeof RankSystem !== 'undefined') {
      const rankBadgeEl = document.getElementById('home-rank-badge');
      if (rankBadgeEl) RankSystem.renderBadge(rankBadgeEl);
    }
  }

  // ╔═══════════════════════════════════════════════════════════╗
  // ║  STORY / CAMPAIGN PAGE                                   ║
  // ╚═══════════════════════════════════════════════════════════╝

  function renderStoryPage() {
    const container = document.getElementById('story-content');
    if (!container) return;

    const campaignProgress = Storage.getCampaign();

    let html = '';
    for (const chapter of Campaign.CHAPTERS) {
      const isUnlocked = Campaign.isChapterUnlocked(chapter.id);
      const levels = Campaign.getChapterLevels(chapter.id);

      html += `<div class="chapter-card ${isUnlocked ? '' : 'locked'}">
        <div class="chapter-header" style="border-left:4px solid ${chapter.color}">
          <span class="chapter-icon">${chapter.icon}</span>
          <div class="chapter-info">
            <div class="chapter-name">${isUnlocked ? chapter.name : '???'}</div>
            <div class="chapter-subtitle">${isUnlocked ? chapter.subtitle : `需要 ${chapter.unlockStars}⭐`}</div>
          </div>
          <div class="chapter-stars">⭐ ${levels.reduce((s, l) => s + Campaign.getLevelStars(l.id), 0)}/${levels.length * 3}</div>
        </div>`;

      if (isUnlocked) {
        html += '<div class="chapter-levels">';
        for (const level of levels) {
          const completed = Campaign.isLevelCompleted(level.id);
          const stars = Campaign.getLevelStars(level.id);
          const isNext = !completed && (level.id === 1 || Campaign.isLevelCompleted(level.id - 1));
          const isLocked = !completed && !isNext;

          html += `<button class="level-btn ${completed ? 'completed' : isNext ? 'next' : 'locked'} ${level.isBoss ? 'boss' : ''}"
            onclick="${isLocked ? '' : `App.startCampaignLevel(${level.id})`}"
            ${isLocked ? 'disabled' : ''}>
            <span class="level-num">${level.isBoss ? '👑' : level.id}</span>
            <div class="level-stars">${completed ? '⭐'.repeat(stars) + '☆'.repeat(3 - stars) : ''}</div>
          </button>`;
        }
        html += '</div>';
      }
      html += '</div>';
    }

    container.innerHTML = html;
  }

  // ╔═══════════════════════════════════════════════════════════╗
  // ║  COLLECTION PAGE                                         ║
  // ╚═══════════════════════════════════════════════════════════╝

  function renderCollectionPage() {
    const container = document.getElementById('collection-content');
    if (!container) return;

    const unlocks = Storage.getUnlocks();
    const allChars = Characters.getAllCharacters();

    let html = '<div class="section-title" style="color:#fff;">🎭 角色图鉴</div>';
    html += '<div class="collection-grid">';
    for (const char of allChars) {
      const isUnlocked = unlocks.characters.includes(char.id);
      const friendship = Characters.getFriendshipInfo(char.id);
      html += `<div class="collection-card ${isUnlocked ? '' : 'locked'}" style="border-color:${char.color}40">
        <div class="collection-avatar" style="font-size:40px;${!isUnlocked ? 'filter:grayscale(1) opacity(0.4);' : ''}">${char.emoji}</div>
        <div class="collection-name" style="color:${isUnlocked ? char.color : '#666'}">${isUnlocked ? char.name : '???'}</div>
        <div class="collection-desc">${isUnlocked ? char.desc : '未解锁'}</div>
        ${isUnlocked ? `<div class="collection-friendship">
          <div class="friendship-bar"><div class="friendship-fill" style="width:${friendship.progress * 100}%;background:${char.color}"></div></div>
          <span class="friendship-text">${friendship.title} Lv.${friendship.level}</span>
        </div>` : ''}
      </div>`;
    }
    html += '</div>';

    // Tile themes
    const THEMES = [
      { id: 'classic', name: '经典', icon: '🀄', color: '#8B4513' },
      { id: 'hello-kitty', name: 'Hello Kitty', icon: '🎀', color: '#ff6b9d' },
      { id: 'bamboo', name: '竹林', icon: '🎋', color: '#2d5016' },
      { id: 'jade', name: '翡翠', icon: '💎', color: '#00a86b' },
      { id: 'gold', name: '黄金', icon: '👑', color: '#f5c518' },
      { id: 'neon', name: '霓虹', icon: '💜', color: '#9b59b6' },
      { id: 'sakura', name: '樱花', icon: '🌸', color: '#ff69b4' },
      { id: 'ocean', name: '海洋', icon: '🌊', color: '#0077be' },
    ];

    html += '<div class="section-title" style="color:#fff;margin-top:24px;">🎨 牌面主题</div>';
    html += '<div class="collection-grid themes">';
    for (const theme of THEMES) {
      const isUnlocked = unlocks.tileThemes.includes(theme.id);
      const isActive = getSettings().tileTheme === theme.id;
      html += `<div class="theme-card ${isUnlocked ? '' : 'locked'} ${isActive ? 'active' : ''}"
        onclick="${isUnlocked ? `App.setTheme('${theme.id}')` : ''}"
        style="border-color:${isActive ? theme.color : 'transparent'}">
        <div class="theme-icon">${isUnlocked ? theme.icon : '🔒'}</div>
        <div class="theme-name">${theme.name}</div>
      </div>`;
    }
    html += '</div>';

    container.innerHTML = html;
  }

  // ╔═══════════════════════════════════════════════════════════╗
  // ║  ACHIEVEMENTS PAGE                                       ║
  // ╚═══════════════════════════════════════════════════════════╝

  function renderAchievementsPage() {
    const container = document.getElementById('achievements-content');
    if (!container) return;
    container.innerHTML = Stats.renderStatsHTML();
  }

  // ╔═══════════════════════════════════════════════════════════╗
  // ║  GAME ACTIONS                                            ║
  // ╚═══════════════════════════════════════════════════════════╝

  function startGame(mode = 'beijing') {
    try { Game.Sound.getCtx(); } catch(e) {}

    Stats.recordLogin();
    const newAchievements = Stats.recordGameStart(mode);
    if (newAchievements.length) {
      setTimeout(() => showAchievementToast(newAchievements[0]), 2000);
    }

    navigateTo('game');
    scheduleResponsiveMetrics();
    setTimeout(() => Game.startGame(mode, { freshStart: true }), 300);
  }

  function startCampaignLevel(levelId) {
    const level = Campaign.getLevel(levelId);
    if (!level) return;

    // Show dialogue before starting
    if (level.dialogue?.before) {
      showDialogue(level.dialogue.before, () => {
        _launchCampaignGame(level);
      });
    } else {
      _launchCampaignGame(level);
    }
  }

  function _launchCampaignGame(level) {
    try { Game.Sound.getCtx(); } catch(e) {}
    Stats.recordLogin();

    const chapter = Campaign.getChapter(level.chapter);
    const rules = chapter?.rules || 'beijing';

    navigateTo('game');
    scheduleResponsiveMetrics();
    setTimeout(() => {
      Game.startGame(rules, {
        campaignLevel: level,
        opponents: level.opponents,
        aiDifficulty: level.aiDifficulty,
        freshStart: true,
      });
    }, 300);
  }

  function showDialogue(text, onComplete) {
    const overlay = document.createElement('div');
    overlay.className = 'dialogue-overlay';
    // 注意：按钮不使用 inline onclick，避免与 addEventListener 重复触发
    overlay.innerHTML = `
      <div class="dialogue-box">
        <div class="dialogue-text">${text}</div>
        <button class="dialogue-btn">继续 ›</button>
      </div>
    `;
    document.body.appendChild(overlay);
    overlay.querySelector('.dialogue-btn').addEventListener('click', () => {
      overlay.remove();
      if (onComplete) onComplete();
    });
  }

  function handleCampaignWin(level, scoreResult, goalResult) {
    if (!level) return;

    // FEATURE 5: Use goal verification result for star calculation
    let stars;
    if (goalResult) {
      stars = goalResult.stars;
    } else {
      stars = Math.min(3, scoreResult.totalFan >= 6 ? 3 : scoreResult.totalFan >= 3 ? 2 : 1);
    }

    const rewards = Campaign.completeLevel(level.id, stars);
    if (typeof Stats !== 'undefined') Stats.recordCampaignWin();

    if (level.dialogue?.after) {
      setTimeout(() => showDialogue(level.dialogue.after), 1500);
    }

    // Update friendship
    if (level.opponents) {
      for (const charId of level.opponents) {
        if (typeof Storage !== 'undefined') Storage.addFriendshipExp(charId, 15);
      }
    }

    return rewards;
  }

  // ╔═══════════════════════════════════════════════════════════╗
  // ║  UI HELPERS                                              ║
  // ╚═══════════════════════════════════════════════════════════╝

  function showAchievementToast(achievement) {
    const toast = document.createElement('div');
    toast.className = 'achievement-toast';
    toast.innerHTML = `<span class="toast-icon">${achievement.icon}</span><div><b>🏅 成就解锁！</b><br>${achievement.name}</div>`;
    document.body.appendChild(toast);
    requestAnimationFrame(() => toast.classList.add('show'));
    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => toast.remove(), 400);
    }, 3000);
  }

  function showCharacterBubble(charId, event, position) {
    const text = Characters.getDialogue(charId, event);
    if (!text) return;

    // Determine player index from charId
    const gameState = Game.getState();
    let playerIndex = 0;
    if (gameState) {
      for (let i = 0; i < 4; i++) {
        if (gameState.players[i].charId === charId) {
          playerIndex = i;
          break;
        }
      }
    }
    // Override with explicit position if given
    if (typeof position === 'number') playerIndex = position;

    const bubble = document.createElement('div');
    bubble.className = 'char-speech-bubble';
    bubble.innerHTML = text;

    // Position based on player seat
    let positionCSS = 'position:absolute;z-index:200;';
    switch (playerIndex) {
      case 0: // bottom
        positionCSS += 'bottom:120px;left:50%;transform:translateX(-50%);';
        break;
      case 1: // right
        positionCSS += 'top:50%;right:80px;transform:translateY(-50%);';
        break;
      case 2: // top
        positionCSS += 'top:80px;left:50%;transform:translateX(-50%);';
        break;
      case 3: // left
        positionCSS += 'top:50%;left:80px;transform:translateY(-50%);';
        break;
    }

    bubble.style.cssText = positionCSS;
    document.getElementById('mahjong-table')?.appendChild(bubble);
    setTimeout(() => {
      bubble.style.opacity = '0';
      setTimeout(() => bubble.remove(), 300);
    }, 2500);
  }

  function showTutorial() {
    navigateTo('tutorial');
    Tutorial.init();
  }

  function backToMenu() {
    if (Game.getState() && !Game.getState().gameOver) {
      if (!confirm('确定要退出当前对局吗？')) return;
    }
    if (Game.getState()) Game.destroy();
    // 清理残留 UI（防止 action bar 留在主页）
    const actionBar = document.getElementById('action-bar');
    if (actionBar) actionBar.style.display = 'none';
    const winScreen = document.getElementById('win-screen');
    if (winScreen) winScreen.style.display = 'none';
    const scoreBoard = document.getElementById('round-scoreboard');
    if (scoreBoard) scoreBoard.style.display = 'none';
    const campaignGoalBar = document.getElementById('campaign-goal-bar');
    if (campaignGoalBar) campaignGoalBar.style.display = 'none';
    const campaignGoalResult = document.getElementById('campaign-goal-result');
    if (campaignGoalResult) campaignGoalResult.style.display = 'none';
    navigateTo('home');
  }

  function nextRound() {
    const winScreen = document.getElementById('win-screen');
    if (winScreen) winScreen.style.display = 'none';
    const campaignGoalResult = document.getElementById('campaign-goal-result');
    if (campaignGoalResult) campaignGoalResult.style.display = 'none';
    const campaignGoalBar = document.getElementById('campaign-goal-bar');
    if (campaignGoalBar) campaignGoalBar.style.display = 'none';
    const gameState = Game.getState();
    if (!gameState) return;

    // FEATURE 3: Multi-round flow — advance to next hand
    Game.startNextHand();
  }

  function startNextRound() {
    // Called from the round scoreboard to start a new full round
    const scoreModal = document.getElementById('round-scoreboard');
    if (scoreModal) scoreModal.style.display = 'none';
    const gameState = Game.getState();
    if (!gameState) return;
    Game.startNextHand();
  }

  function setTheme(themeId) {
    settings.tileTheme = themeId;
    const profile = Storage.getProfile();
    profile.settings = settings;
    Storage.saveProfile(profile);
    renderCollectionPage();
  }

  // ╔═══════════════════════════════════════════════════════════╗
  // ║  SETTINGS                                                ║
  // ╚═══════════════════════════════════════════════════════════╝

  function showSettings() {
    if (settingsOverlay) return;
    const s = getSettings();

    settingsOverlay = document.createElement('div');
    settingsOverlay.className = 'settings-overlay';
    settingsOverlay.innerHTML = `
      <div class="settings-panel">
        <h3>⚙️ 设置</h3>
        <div class="setting-row">
          <span class="setting-label">🔊 音效</span>
          <button class="setting-toggle ${s.soundEnabled ? 'on' : ''}" data-setting="sound"></button>
        </div>
        <div class="setting-row">
          <span class="setting-label">🤖 AI速度</span>
          <div class="setting-options">
            ${['slow', 'normal', 'fast'].map(v => `<button class="speed-btn ${s.aiSpeed === v ? 'active' : ''}" data-speed="${v}">${v === 'slow' ? '慢' : v === 'normal' ? '中' : '快'}</button>`).join('')}
          </div>
        </div>
        <div class="setting-row">
          <span class="setting-label">💡 游戏提示</span>
          <button class="setting-toggle ${s.showHints ? 'on' : ''}" data-setting="hints"></button>
        </div>
        <div class="setting-row">
          <span class="setting-label">🎯 难度</span>
          <div class="setting-options">
            ${['easy', 'normal', 'hard', 'master'].map(v => `<button class="diff-btn ${s.difficulty === v ? 'active' : ''}" data-diff="${v}">${v === 'easy' ? '简单' : v === 'normal' ? '普通' : v === 'hard' ? '困难' : '大师'}</button>`).join('')}
          </div>
        </div>
        <div style="margin-top:20px;text-align:center;">
          <button class="close-settings-btn">完成</button>
        </div>
      </div>
    `;

    document.body.appendChild(settingsOverlay);
    requestAnimationFrame(() => settingsOverlay.classList.add('visible'));

    // Wire events
    settingsOverlay.querySelector('[data-setting="sound"]').addEventListener('click', function() {
      s.soundEnabled = !s.soundEnabled;
      this.classList.toggle('on', s.soundEnabled);
      Game.Sound.setMuted(!s.soundEnabled);
      _saveSettings();
    });

    settingsOverlay.querySelector('[data-setting="hints"]').addEventListener('click', function() {
      s.showHints = !s.showHints;
      this.classList.toggle('on', s.showHints);
      _saveSettings();
    });

    settingsOverlay.querySelectorAll('.speed-btn').forEach(btn => {
      btn.addEventListener('click', function() {
        s.aiSpeed = this.dataset.speed;
        settingsOverlay.querySelectorAll('.speed-btn').forEach(b => b.classList.remove('active'));
        this.classList.add('active');
        _saveSettings();
      });
    });

    settingsOverlay.querySelectorAll('.diff-btn').forEach(btn => {
      btn.addEventListener('click', function() {
        s.difficulty = this.dataset.diff;
        settingsOverlay.querySelectorAll('.diff-btn').forEach(b => b.classList.remove('active'));
        this.classList.add('active');
        _saveSettings();
      });
    });

    settingsOverlay.querySelector('.close-settings-btn').addEventListener('click', hideSettings);
    settingsOverlay.addEventListener('click', (e) => { if (e.target === settingsOverlay) hideSettings(); });
  }

  function _saveSettings() {
    const profile = Storage.getProfile();
    profile.settings = settings;
    Storage.saveProfile(profile);
  }

  function hideSettings() {
    if (!settingsOverlay) return;
    settingsOverlay.classList.remove('visible');
    setTimeout(() => { settingsOverlay.remove(); settingsOverlay = null; }, 300);
  }

  function toggleSettings() {
    settingsOverlay ? hideSettings() : showSettings();
  }

  // ╔═══════════════════════════════════════════════════════════╗
  // ║  MODAL                                                   ║
  // ╚═══════════════════════════════════════════════════════════╝

  let modalOverlay = null;

  function showModal(title, message, buttons = []) {
    if (modalOverlay) modalOverlay.remove();
    modalOverlay = document.createElement('div');
    modalOverlay.className = 'modal';
    modalOverlay.style.display = 'flex';
    const buttonsHtml = buttons.map((b, i) => `<button class="menu-btn ${i === 0 ? 'btn-pink' : 'btn-gray'}" data-btn-index="${i}" style="margin-top:8px;"><span class="btn-text">${b.text}</span></button>`).join('');
    modalOverlay.innerHTML = `<div class="modal-content"><div class="win-title" style="font-size:24px;">${title}</div><p style="color:#999;margin:12px 0;white-space:pre-line;">${message}</p>${buttonsHtml}</div>`;
    document.body.appendChild(modalOverlay);
    buttons.forEach((b, i) => {
      const btn = modalOverlay.querySelector(`[data-btn-index="${i}"]`);
      if (btn && b.action) btn.addEventListener('click', b.action);
    });
    // Dismiss on backdrop click
    modalOverlay.addEventListener('click', (e) => { if (e.target === modalOverlay) hideModal(); });
  }

  function hideModal() {
    if (modalOverlay) {
      modalOverlay.style.opacity = '0';
      setTimeout(() => { modalOverlay?.remove(); modalOverlay = null; }, 300);
    }
  }

  // ╔═══════════════════════════════════════════════════════════╗
  // ║  INIT                                                    ║
  // ╚═══════════════════════════════════════════════════════════╝

  function init() {
    getSettings();
    Game.Sound.setMuted(!settings.soundEnabled);
    setupResponsiveLayout();

    // Tab bar events
    document.querySelectorAll('.tab-item').forEach(tab => {
      tab.addEventListener('click', () => {
        const page = tab.dataset.page;
        if (!page) return;
        try { Game.Sound.playTap(); } catch {}
        if (page === 'game') {
          // Show mode selection before starting game
          showModal('选择模式', '请选择麻将规则', [
            { text: '🏯 北京麻将', action: () => { hideModal(); startGame('beijing'); } },
            { text: '🌶️ 川麻血战', action: () => { hideModal(); startGame('sichuan'); } },
            { text: '取消', action: () => { hideModal(); } },
          ]);
          return;
        }
        navigateTo(page);
      });
    });

    initSplash();
    scheduleResponsiveMetrics();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  return {
    startGame,
    startCampaignLevel,
    handleCampaignWin,
    showTutorial,
    showSettings,
    toggleSettings,
    backToMenu,
    nextRound,
    startNextRound,
    navigateTo,
    showModal,
    hideModal,
    showAchievementToast,
    showCharacterBubble,
    showDialogue,
    setTheme,
    getSettings,
  };
})();
