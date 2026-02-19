// ═══════════════════════════════════════════════════════════════
// 📖 Hello Kitty 麻将 — Interactive Tutorial
// 3-step tutorial with animated tile demos
// ═══════════════════════════════════════════════════════════════

const Tutorial = (() => {
  'use strict';

  let currentStep = 1;
  const TOTAL_STEPS = 3;
  let demoAnimations = [];

  // ─── Tile demo data ───
  const DEMO_TILES = {
    sequence: [
      { key: 'w1', ...TILES.w1, id: 'demo_w1_0' },
      { key: 'w2', ...TILES.w2, id: 'demo_w2_0' },
      { key: 'w3', ...TILES.w3, id: 'demo_w3_0' },
    ],
    triplet: [
      { key: 'b5', ...TILES.b5, id: 'demo_b5_0' },
      { key: 'b5', ...TILES.b5, id: 'demo_b5_1' },
      { key: 'b5', ...TILES.b5, id: 'demo_b5_2' },
    ],
    suits: {
      wan: [
        { key: 'w1', ...TILES.w1, id: 'demo_w1_s' },
        { key: 'w5', ...TILES.w5, id: 'demo_w5_s' },
        { key: 'w9', ...TILES.w9, id: 'demo_w9_s' },
      ],
      tiao: [
        { key: 't1', ...TILES.t1, id: 'demo_t1_s' },
        { key: 't5', ...TILES.t5, id: 'demo_t5_s' },
        { key: 't9', ...TILES.t9, id: 'demo_t9_s' },
      ],
      tong: [
        { key: 'b1', ...TILES.b1, id: 'demo_b1_s' },
        { key: 'b5', ...TILES.b5, id: 'demo_b5_s' },
        { key: 'b9', ...TILES.b9, id: 'demo_b9_s' },
      ],
      honors: [
        { key: 'fe', ...TILES.fe, id: 'demo_fe_s' },
        { key: 'fs', ...TILES.fs, id: 'demo_fs_s' },
        { key: 'jz', ...TILES.jz, id: 'demo_jz_s' },
        { key: 'jf', ...TILES.jf, id: 'demo_jf_s' },
        { key: 'jb', ...TILES.jb, id: 'demo_jb_s' },
      ],
    },
    winHand: [
      // 4 melds + 1 pair example
      { key: 'w1', ...TILES.w1, id: 'demo_win_w1' },
      { key: 'w2', ...TILES.w2, id: 'demo_win_w2' },
      { key: 'w3', ...TILES.w3, id: 'demo_win_w3' },
      { key: 't4', ...TILES.t4, id: 'demo_win_t4a' },
      { key: 't5', ...TILES.t5, id: 'demo_win_t5' },
      { key: 't6', ...TILES.t6, id: 'demo_win_t6' },
      { key: 'b7', ...TILES.b7, id: 'demo_win_b7a' },
      { key: 'b7', ...TILES.b7, id: 'demo_win_b7b' },
      { key: 'b7', ...TILES.b7, id: 'demo_win_b7c' },
      { key: 'fe', ...TILES.fe, id: 'demo_win_fea' },
      { key: 'fe', ...TILES.fe, id: 'demo_win_feb' },
      { key: 'fe', ...TILES.fe, id: 'demo_win_fec' },
      { key: 'jz', ...TILES.jz, id: 'demo_win_jza' },
      { key: 'jz', ...TILES.jz, id: 'demo_win_jzb' },
    ],
  };

  function init() {
    currentStep = 1;
    renderStep(currentStep);
    injectTutorialStyles();
  }

  function injectTutorialStyles() {
    if (document.getElementById('tutorial-premium-styles')) return;
    const style = document.createElement('style');
    style.id = 'tutorial-premium-styles';
    style.textContent = `
      .tutorial-tile-row {
        display: flex;
        gap: 4px;
        justify-content: center;
        align-items: center;
        padding: 16px;
        background: linear-gradient(180deg, #f8f4e8, #f0ead8);
        border-radius: 14px;
        margin: 12px 0;
        box-shadow: inset 0 2px 8px rgba(0,0,0,0.06);
        flex-wrap: wrap;
      }
      .tutorial-tile-group {
        display: flex;
        gap: 3px;
        align-items: center;
        margin: 4px 8px;
      }
      .tutorial-tile-group-label {
        font-size: 12px;
        color: #999;
        margin-top: 4px;
        text-align: center;
      }
      .tutorial-separator {
        width: 2px;
        height: 40px;
        background: rgba(0,0,0,0.1);
        margin: 0 8px;
        border-radius: 1px;
      }
      .tutorial-bracket {
        display: flex;
        flex-direction: column;
        align-items: center;
        margin: 0 4px;
      }
      .tutorial-bracket-label {
        font-size: 11px;
        color: #ff6b9d;
        font-weight: 700;
        margin-top: 6px;
        padding: 2px 8px;
        background: #fff0f5;
        border-radius: 10px;
      }
      .tutorial-tile-row .tile {
        transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
      }
      .tutorial-tile-row .tile:hover {
        transform: translateY(-6px) scale(1.08);
      }
      .tutorial-step {
        opacity: 0;
        transform: translateX(20px);
        transition: opacity 0.4s, transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
      }
      .tutorial-step.active {
        display: block;
        opacity: 1;
        transform: translateX(0);
      }
      .tutorial-step.exiting {
        opacity: 0;
        transform: translateX(-20px);
      }
      .tutorial-highlight {
        display: inline-block;
        background: linear-gradient(135deg, #ff6b9d20, #ff6b9d40);
        padding: 2px 8px;
        border-radius: 6px;
        font-weight: 700;
        color: #e55a8a;
      }
      .tutorial-progress-bar {
        display: flex;
        gap: 6px;
        justify-content: center;
        margin: 16px 0;
      }
      .tutorial-progress-dot {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background: #ddd;
        transition: all 0.3s;
      }
      .tutorial-progress-dot.active {
        background: #ff6b9d;
        transform: scale(1.3);
      }
      .tutorial-progress-dot.completed {
        background: #ff8fbf;
      }
    `;
    document.head.appendChild(style);
  }

  // ─── Render current step content ───
  function renderStep(step) {
    const content = document.getElementById('tutorial-content');
    if (!content) return;

    // Update progress
    const progress = document.getElementById('tutorial-progress');
    if (progress) progress.textContent = `${step}/${TOTAL_STEPS}`;

    // Animate out old, in new
    const steps = content.querySelectorAll('.tutorial-step');
    steps.forEach(s => {
      if (s.classList.contains('active')) {
        s.classList.remove('active');
        s.classList.add('exiting');
        setTimeout(() => s.classList.remove('exiting'), 400);
      }
    });

    setTimeout(() => {
      steps.forEach(s => s.style.display = 'none');
      const target = content.querySelector(`[data-step="${step}"]`);
      if (target) {
        target.style.display = 'block';
        // Force reflow before adding active class
        target.offsetHeight;
        target.classList.add('active');
        renderTileDemos(step, target);
      }
    }, 200);

    // Update nav buttons
    updateNavButtons(step);
  }

  // ─── Render real tile demos for each step ───
  function renderTileDemos(step, container) {
    // Clear existing demos
    stopDemoAnimations();

    const demoContainers = container.querySelectorAll('.tile-demo');
    demoContainers.forEach(d => d.innerHTML = '');

    if (step === 1) {
      // Step 1: Show sequence and triplet
      const demo = container.querySelector('.tile-demo');
      if (!demo) return;
      demo.innerHTML = '';
      demo.className = 'tutorial-tile-row';

      // Sequence demo
      const seqGroup = createTileGroup('顺子', DEMO_TILES.sequence);
      demo.appendChild(seqGroup);

      // Separator
      const sep = document.createElement('div');
      sep.className = 'tutorial-separator';
      demo.appendChild(sep);

      // Triplet demo
      const tripGroup = createTileGroup('刻子', DEMO_TILES.triplet);
      demo.appendChild(tripGroup);

      // Animate tiles appearing one by one
      animateTilesSequential(demo.querySelectorAll('.tile'), 150);
    }

    if (step === 2) {
      // Step 2: Show all suit types with real tiles
      const demo = container.querySelector('.tile-demo') || container;
      demo.innerHTML = '';
      demo.className = 'tutorial-tile-row';
      demo.style.flexDirection = 'column';

      const suitGroups = [
        { name: '万子', tiles: DEMO_TILES.suits.wan, color: '#e74c3c' },
        { name: '条子', tiles: DEMO_TILES.suits.tiao, color: '#2ecc71' },
        { name: '筒子', tiles: DEMO_TILES.suits.tong, color: '#3498db' },
        { name: '字牌', tiles: DEMO_TILES.suits.honors, color: '#9b59b6' },
      ];

      for (const sg of suitGroups) {
        const row = document.createElement('div');
        row.style.cssText = 'display:flex;align-items:center;gap:8px;margin:4px 0;';

        const label = document.createElement('span');
        label.style.cssText = `font-size:13px;font-weight:700;color:${sg.color};min-width:40px;text-align:right;`;
        label.textContent = sg.name;
        row.appendChild(label);

        const group = document.createElement('div');
        group.className = 'tutorial-tile-group';
        for (const tile of sg.tiles) {
          const el = Game.renderTile(tile, { small: true });
          group.appendChild(el);
        }
        row.appendChild(group);
        demo.appendChild(row);
      }

      animateTilesSequential(demo.querySelectorAll('.tile'), 80);
    }

    if (step === 3) {
      // Step 3: Show winning hand decomposition
      const demo = container.querySelector('.tile-demo') || container;
      demo.innerHTML = '';
      demo.className = 'tutorial-tile-row';

      const groups = [
        { label: '顺子', tiles: DEMO_TILES.winHand.slice(0, 3) },
        { label: '顺子', tiles: DEMO_TILES.winHand.slice(3, 6) },
        { label: '刻子', tiles: DEMO_TILES.winHand.slice(6, 9) },
        { label: '刻子', tiles: DEMO_TILES.winHand.slice(9, 12) },
        { label: '对子', tiles: DEMO_TILES.winHand.slice(12, 14) },
      ];

      for (let i = 0; i < groups.length; i++) {
        const g = groups[i];
        const bracket = document.createElement('div');
        bracket.className = 'tutorial-bracket';

        const tileGroup = document.createElement('div');
        tileGroup.className = 'tutorial-tile-group';
        for (const tile of g.tiles) {
          const el = Game.renderTile(tile, { small: true });
          tileGroup.appendChild(el);
        }
        bracket.appendChild(tileGroup);

        const label = document.createElement('span');
        label.className = 'tutorial-bracket-label';
        label.textContent = g.label;
        bracket.appendChild(label);

        demo.appendChild(bracket);

        if (i < groups.length - 1) {
          const plus = document.createElement('span');
          plus.style.cssText = 'font-size:18px;color:#ccc;margin:0 2px;';
          plus.textContent = '+';
          demo.appendChild(plus);
        }
      }

      animateTilesSequential(demo.querySelectorAll('.tile'), 60);
    }
  }

  // ─── Create a labeled tile group ───
  function createTileGroup(label, tiles) {
    const bracket = document.createElement('div');
    bracket.className = 'tutorial-bracket';

    const group = document.createElement('div');
    group.className = 'tutorial-tile-group';
    for (const tile of tiles) {
      const el = Game.renderTile(tile, { small: false });
      group.appendChild(el);
    }
    bracket.appendChild(group);

    const labelEl = document.createElement('span');
    labelEl.className = 'tutorial-bracket-label';
    labelEl.textContent = label;
    bracket.appendChild(labelEl);

    return bracket;
  }

  // ─── Animate tiles appearing sequentially ───
  function animateTilesSequential(tiles, stagger = 100) {
    tiles.forEach((tile, i) => {
      tile.style.opacity = '0';
      tile.style.transform = 'translateY(-20px) rotateX(60deg) scale(0.7)';
      tile.style.transition = 'none';

      const timerId = setTimeout(() => {
        tile.style.transition = 'all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)';
        tile.style.opacity = '1';
        tile.style.transform = 'translateY(0) rotateX(0) scale(1)';
      }, i * stagger);

      demoAnimations.push(timerId);
    });
  }

  function stopDemoAnimations() {
    demoAnimations.forEach(id => clearTimeout(id));
    demoAnimations = [];
  }

  // ─── Update nav buttons ───
  function updateNavButtons(step) {
    const content = document.getElementById('tutorial-content');
    if (!content) return;

    const prevBtn = content.querySelector('.btn-nav:first-child');
    const nextBtn = content.querySelector('.btn-nav:last-child');

    if (prevBtn) {
      prevBtn.style.visibility = step === 1 ? 'hidden' : 'visible';
    }
    if (nextBtn) {
      nextBtn.textContent = step === TOTAL_STEPS ? '完成 ✨' : '下一步';
    }
  }

  // ─── Navigation ───
  function next() {
    if (currentStep < TOTAL_STEPS) {
      currentStep++;
      renderStep(currentStep);
    } else {
      // Tutorial complete — back to menu
      if (typeof App !== 'undefined' && App.backToMenu) {
        App.backToMenu();
      }
    }
    if (typeof Game !== 'undefined' && Game.Sound) {
      Game.Sound.playTap();
    }
  }

  function prev() {
    if (currentStep > 1) {
      currentStep--;
      renderStep(currentStep);
    }
    if (typeof Game !== 'undefined' && Game.Sound) {
      Game.Sound.playTap();
    }
  }

  function goToStep(step) {
    if (step >= 1 && step <= TOTAL_STEPS) {
      currentStep = step;
      renderStep(step);
    }
  }

  // ─── Public API ───
  return {
    init,
    next,
    prev,
    goToStep,
  };
})();
