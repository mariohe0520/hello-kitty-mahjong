// ═══════════════════════════════════════════════════════════════
// 🎀 Hello Kitty 麻将 — App Controller
// Animated splash, page transitions, settings, menu wiring
// ═══════════════════════════════════════════════════════════════

const App = (() => {
  'use strict';

  let currentPage = 'splash';
  let settings = {
    soundEnabled: true,
    aiSpeed: 'normal', // slow, normal, fast
    tileStyle: 'svg',  // svg, png, text
  };
  let settingsOverlay = null;

  // ╔═══════════════════════════════════════════════════════════╗
  // ║  SPLASH SCREEN — Animated tile cascade                   ║
  // ╚═══════════════════════════════════════════════════════════╝

  function initSplash() {
    const splash = document.getElementById('splash');
    if (!splash) return;

    // Create cascading tile elements for splash
    const splashContent = splash.querySelector('.splash-content');
    const tileContainer = document.createElement('div');
    tileContainer.style.cssText = `
      display: flex;
      gap: 6px;
      justify-content: center;
      margin-top: 20px;
      height: 56px;
      overflow: hidden;
    `;

    // Sample tiles for splash cascade
    const sampleKeys = ['w1', 'w2', 'w3', 'b5', 'jz', 't7', 'fe', 'jf', 'b9'];
    sampleKeys.forEach((key, i) => {
      const tile = { ...TILES[key], key, id: `splash_${key}` };
      const el = Game.renderTile(tile, { small: true });
      el.style.opacity = '0';
      el.style.transform = 'translateY(-60px) rotateX(90deg)';
      el.style.transition = 'none';
      tileContainer.appendChild(el);

      // Cascade animation with stagger
      setTimeout(() => {
        el.style.transition = 'all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)';
        el.style.opacity = '1';
        el.style.transform = 'translateY(0) rotateX(0)';
      }, 300 + i * 100);
    });

    // Insert before loading text
    const loadingEl = splash.querySelector('.splash-loading');
    if (loadingEl) {
      splashContent.insertBefore(tileContainer, loadingEl);
      loadingEl.textContent = '正在洗牌...';
    }

    // Auto-transition to menu after splash
    setTimeout(() => {
      hideSplash();
    }, 2200);
  }

  function hideSplash() {
    const splash = document.getElementById('splash');
    if (!splash) return;

    splash.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
    splash.style.opacity = '0';
    splash.style.transform = 'scale(1.05)';

    setTimeout(() => {
      splash.style.display = 'none';
      navigateTo('menu');
    }, 600);
  }

  // ╔═══════════════════════════════════════════════════════════╗
  // ║  PAGE TRANSITIONS — Smooth slide/fade with parallax      ║
  // ╚═══════════════════════════════════════════════════════════╝

  function navigateTo(pageId) {
    const oldPage = document.getElementById(currentPage);
    const newPage = document.getElementById(pageId);
    if (!newPage) return;

    // Determine direction
    const pages = ['menu', 'game', 'tutorial'];
    const oldIdx = pages.indexOf(currentPage);
    const newIdx = pages.indexOf(pageId);
    const direction = newIdx >= oldIdx ? 1 : -1;

    // Show new page off-screen
    newPage.style.display = 'flex';
    newPage.style.position = 'fixed';
    newPage.style.inset = '0';
    newPage.style.zIndex = '50';
    newPage.style.opacity = '0';
    newPage.style.transform = `translateX(${direction * 30}px)`;
    newPage.style.transition = 'none';

    // Fade out old page
    if (oldPage && oldPage.id !== 'splash') {
      oldPage.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
      oldPage.style.opacity = '0';
      oldPage.style.transform = `translateX(${-direction * 15}px)`;
    }

    // Fade in new page
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        newPage.style.transition = 'opacity 0.4s ease, transform 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
        newPage.style.opacity = '1';
        newPage.style.transform = 'translateX(0)';
      });
    });

    // Clean up after transition
    setTimeout(() => {
      if (oldPage && oldPage.id !== 'splash') {
        oldPage.style.display = 'none';
        oldPage.style.opacity = '';
        oldPage.style.transform = '';
        oldPage.style.position = '';
        oldPage.style.transition = '';
        oldPage.style.zIndex = '';
      }
      newPage.style.position = '';
      newPage.style.zIndex = '';
    }, 500);

    currentPage = pageId;
  }

  // ╔═══════════════════════════════════════════════════════════╗
  // ║  MENU ACTIONS                                            ║
  // ╚═══════════════════════════════════════════════════════════╝

  function startGame(mode = 'beijing') {
    // Initialize Audio context on user gesture
    try { Game.Sound.getCtx(); } catch(e) {}

    navigateTo('game');

    // Small delay for transition, then start game
    setTimeout(() => {
      Game.startGame(mode);
    }, 400);
  }

  function showTutorial() {
    navigateTo('tutorial');
    Tutorial.init();
  }

  function showMultiplayer() {
    // Show coming soon modal
    showModal('👥 好友对战', '多人在线对战功能正在开发中...\n敬请期待！', [
      { text: '知道了', action: () => hideModal() }
    ]);
  }

  function backToMenu() {
    // Destroy active game
    if (Game.getState()) {
      Game.destroy();
    }

    // Hide win screen if visible
    const winScreen = document.getElementById('win-screen');
    if (winScreen) winScreen.style.display = 'none';

    navigateTo('menu');
  }

  function nextRound() {
    const winScreen = document.getElementById('win-screen');
    if (winScreen) winScreen.style.display = 'none';

    const gameState = Game.getState();
    if (!gameState) return;

    // Start a new round with the same mode
    Game.startGame(gameState.mode);
  }

  // ╔═══════════════════════════════════════════════════════════╗
  // ║  SETTINGS PANEL                                          ║
  // ╚═══════════════════════════════════════════════════════════╝

  function showSettings() {
    if (settingsOverlay) return;

    settingsOverlay = document.createElement('div');
    settingsOverlay.className = 'settings-overlay';

    settingsOverlay.innerHTML = `
      <div class="settings-panel">
        <h3>⚙️ 设置</h3>
        <div class="setting-row">
          <span class="setting-label">🔊 音效</span>
          <button class="setting-toggle ${settings.soundEnabled ? 'on' : ''}" data-setting="sound"></button>
        </div>
        <div class="setting-row">
          <span class="setting-label">🤖 AI速度</span>
          <div style="display:flex;gap:6px;">
            <button class="speed-btn ${settings.aiSpeed === 'slow' ? 'active' : ''}" data-speed="slow"
              style="padding:6px 14px;border:2px solid ${settings.aiSpeed === 'slow' ? '#ff6b9d' : '#ddd'};
              border-radius:10px;background:${settings.aiSpeed === 'slow' ? '#fff0f5' : '#fff'};
              font-size:13px;font-weight:600;cursor:pointer;">慢</button>
            <button class="speed-btn ${settings.aiSpeed === 'normal' ? 'active' : ''}" data-speed="normal"
              style="padding:6px 14px;border:2px solid ${settings.aiSpeed === 'normal' ? '#ff6b9d' : '#ddd'};
              border-radius:10px;background:${settings.aiSpeed === 'normal' ? '#fff0f5' : '#fff'};
              font-size:13px;font-weight:600;cursor:pointer;">中</button>
            <button class="speed-btn ${settings.aiSpeed === 'fast' ? 'active' : ''}" data-speed="fast"
              style="padding:6px 14px;border:2px solid ${settings.aiSpeed === 'fast' ? '#ff6b9d' : '#ddd'};
              border-radius:10px;background:${settings.aiSpeed === 'fast' ? '#fff0f5' : '#fff'};
              font-size:13px;font-weight:600;cursor:pointer;">快</button>
          </div>
        </div>
        <div class="setting-row">
          <span class="setting-label">🎨 牌面风格</span>
          <div style="display:flex;gap:6px;">
            <button class="style-btn ${settings.tileStyle === 'svg' ? 'active' : ''}" data-style="svg"
              style="padding:6px 14px;border:2px solid ${settings.tileStyle === 'svg' ? '#ff6b9d' : '#ddd'};
              border-radius:10px;background:${settings.tileStyle === 'svg' ? '#fff0f5' : '#fff'};
              font-size:13px;font-weight:600;cursor:pointer;">精美</button>
            <button class="style-btn ${settings.tileStyle === 'text' ? 'active' : ''}" data-style="text"
              style="padding:6px 14px;border:2px solid ${settings.tileStyle === 'text' ? '#ff6b9d' : '#ddd'};
              border-radius:10px;background:${settings.tileStyle === 'text' ? '#fff0f5' : '#fff'};
              font-size:13px;font-weight:600;cursor:pointer;">简约</button>
          </div>
        </div>
        <div style="margin-top:20px;text-align:center;">
          <button class="close-settings" style="
            padding:12px 40px;background:linear-gradient(135deg,#ff6b9d,#ff8fbf);
            border:none;border-radius:14px;color:#fff;font-size:16px;font-weight:700;
            cursor:pointer;box-shadow:0 4px 12px rgba(255,107,157,0.3);">
            完成
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(settingsOverlay);

    // Animate in
    requestAnimationFrame(() => {
      settingsOverlay.classList.add('visible');
    });

    // Wire up interactions
    settingsOverlay.querySelector('[data-setting="sound"]').addEventListener('click', function() {
      settings.soundEnabled = !settings.soundEnabled;
      this.classList.toggle('on', settings.soundEnabled);
      Game.Sound.setMuted(!settings.soundEnabled);
      if (settings.soundEnabled) Game.Sound.playTap();
    });

    settingsOverlay.querySelectorAll('.speed-btn').forEach(btn => {
      btn.addEventListener('click', function() {
        settings.aiSpeed = this.dataset.speed;
        settingsOverlay.querySelectorAll('.speed-btn').forEach(b => {
          b.style.borderColor = '#ddd';
          b.style.background = '#fff';
        });
        this.style.borderColor = '#ff6b9d';
        this.style.background = '#fff0f5';
        Game.Sound.playTap();
      });
    });

    settingsOverlay.querySelectorAll('.style-btn').forEach(btn => {
      btn.addEventListener('click', function() {
        settings.tileStyle = this.dataset.style;
        settingsOverlay.querySelectorAll('.style-btn').forEach(b => {
          b.style.borderColor = '#ddd';
          b.style.background = '#fff';
        });
        this.style.borderColor = '#ff6b9d';
        this.style.background = '#fff0f5';
        Game.Sound.playTap();
      });
    });

    settingsOverlay.querySelector('.close-settings').addEventListener('click', hideSettings);

    // Click overlay background to close
    settingsOverlay.addEventListener('click', (e) => {
      if (e.target === settingsOverlay) hideSettings();
    });
  }

  function hideSettings() {
    if (!settingsOverlay) return;
    settingsOverlay.classList.remove('visible');
    setTimeout(() => {
      settingsOverlay.remove();
      settingsOverlay = null;
    }, 300);
  }

  function toggleSettings() {
    if (settingsOverlay) {
      hideSettings();
    } else {
      showSettings();
    }
  }

  // ╔═══════════════════════════════════════════════════════════╗
  // ║  GENERIC MODAL                                           ║
  // ╚═══════════════════════════════════════════════════════════╝

  let modalOverlay = null;

  function showModal(title, message, buttons = []) {
    if (modalOverlay) modalOverlay.remove();

    modalOverlay = document.createElement('div');
    modalOverlay.className = 'modal';
    modalOverlay.style.display = 'flex';

    const buttonsHtml = buttons.map((b, i) => `
      <button class="menu-btn ${i === 0 ? 'btn-pink' : 'btn-gray'}"
        data-btn-index="${i}" style="margin-top:8px;">
        <span class="btn-text">${b.text}</span>
      </button>
    `).join('');

    modalOverlay.innerHTML = `
      <div class="modal-content" style="animation: huCelebrate 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;">
        <div class="win-title" style="font-size:24px;">${title}</div>
        <p style="color:#666;margin:12px 0;white-space:pre-line;">${message}</p>
        ${buttonsHtml}
      </div>
    `;

    document.body.appendChild(modalOverlay);

    // Wire buttons
    buttons.forEach((b, i) => {
      const btn = modalOverlay.querySelector(`[data-btn-index="${i}"]`);
      if (btn && b.action) {
        btn.addEventListener('click', b.action);
      }
    });
  }

  function hideModal() {
    if (modalOverlay) {
      modalOverlay.style.transition = 'opacity 0.3s';
      modalOverlay.style.opacity = '0';
      setTimeout(() => {
        modalOverlay.remove();
        modalOverlay = null;
      }, 300);
    }
  }

  // ╔═══════════════════════════════════════════════════════════╗
  // ║  INITIALIZATION                                          ║
  // ╚═══════════════════════════════════════════════════════════╝

  function init() {
    // Load saved settings
    try {
      const saved = localStorage.getItem('hk-mahjong-settings');
      if (saved) {
        Object.assign(settings, JSON.parse(saved));
        Game.Sound.setMuted(!settings.soundEnabled);
      }
    } catch(e) {}

    // Start splash
    initSplash();

    // Save settings on unload
    window.addEventListener('beforeunload', () => {
      try {
        localStorage.setItem('hk-mahjong-settings', JSON.stringify(settings));
      } catch(e) {}
    });
  }

  // Auto-init when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // ─── Public API ───
  return {
    startGame,
    showTutorial,
    showMultiplayer,
    showSettings,
    toggleSettings,
    backToMenu,
    nextRound,
    navigateTo,
    showModal,
    hideModal,
  };
})();
