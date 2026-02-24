// ═══════════════════════════════════════════════════════════════
// 🎀 Hello Kitty 麻将 — App Controller v2.0
// Tab navigation, page routing, character selection, settings
// ═══════════════════════════════════════════════════════════════

const App = (() => {
  'use strict';

  let currentPage = 'splash';
  let settings = null;
  let settingsOverlay = null;

  function getSettings() {
    if (!settings) {
      const profile = Storage.getProfile();
      settings = profile.settings;
    }
    return settings;
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
    setTimeout(() => Game.startGame(mode), 300);
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
    setTimeout(() => {
      Game.startGame(rules, {
        campaignLevel: level,
        opponents: level.opponents,
        aiDifficulty: level.aiDifficulty,
      });
    }, 300);
  }

  function showDialogue(text, onComplete) {
    const overlay = document.createElement('div');
    overlay.className = 'dialogue-overlay';
    overlay.innerHTML = `
      <div class="dialogue-box">
        <div class="dialogue-text">${text}</div>
        <button class="dialogue-btn" onclick="this.closest('.dialogue-overlay').remove()">继续 ›</button>
      </div>
    `;
    document.body.appendChild(overlay);
    overlay.querySelector('.dialogue-btn').addEventListener('click', () => {
      if (onComplete) onComplete();
    });
  }

  function handleCampaignWin(level, scoreResult) {
    if (!level) return;
    const stars = Math.min(3, scoreResult.totalFan >= 6 ? 3 : scoreResult.totalFan >= 3 ? 2 : 1);
    const rewards = Campaign.completeLevel(level.id, stars);
    Stats.recordCampaignWin();

    if (level.dialogue?.after) {
      setTimeout(() => showDialogue(level.dialogue.after), 1500);
    }

    // Update friendship
    if (level.opponents) {
      for (const charId of level.opponents) {
        Storage.addFriendshipExp(charId, 15);
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
    const bubble = document.createElement('div');
    bubble.className = 'char-speech-bubble';
    bubble.innerHTML = text;
    bubble.style.cssText = `position:absolute;z-index:200;`;
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
    if (Game.getState()) Game.destroy();
    // Stop BGM when returning to menu
    if (typeof Sound !== 'undefined' && Sound.stopBGM) Sound.stopBGM();
    const winScreen = document.getElementById('win-screen');
    if (winScreen) winScreen.style.display = 'none';
    navigateTo('home');
  }

  function nextRound() {
    const winScreen = document.getElementById('win-screen');
    if (winScreen) winScreen.style.display = 'none';
    const gameState = Game.getState();
    if (!gameState) return;
    Game.startGame(gameState.mode);
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
    // Initialize real sound effects
    Game.Sound.init().then(() => {
      console.log('🎵 Mahjong sounds loaded successfully');
    }).catch(e => console.warn('Sound init failed:', e));
    Game.Sound.setMuted(!settings.soundEnabled);

    // Tab bar events
    document.querySelectorAll('.tab-item').forEach(tab => {
      tab.addEventListener('click', () => {
        const page = tab.dataset.page;
        if (page) navigateTo(page);
        try { Game.Sound.playTap(); } catch {}
      });
    });

    initSplash();
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
