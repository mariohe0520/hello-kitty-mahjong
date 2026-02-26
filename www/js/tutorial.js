// ═══════════════════════════════════════════════════════════════
// 📖 Hello Kitty 麻将 — Interactive Tutorial System
// Step-by-step teaching with animated tile demos, hints
// ═══════════════════════════════════════════════════════════════

const Tutorial = (() => {
  'use strict';

  let currentStep = 1;
  const TOTAL_STEPS = 6;
  let demoAnimations = [];

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

  const STEPS = [
    { title: '🀄 什么是麻将？', content: `<p>麻将是四个人玩的桌游，目标是用手里的牌组成特定的牌型来<span class="tutorial-highlight">胡牌</span>获胜。</p><p>每人开始有13张牌，轮流摸牌、打牌。</p>` },
    { title: '🎴 麻将牌有哪些？', content: `<p>麻将有四种花色，每种1-9各四张：</p><p><span class="tutorial-highlight">万子</span>（红色）、<span class="tutorial-highlight">条子</span>（绿色）、<span class="tutorial-highlight">筒子</span>（蓝色）</p><p>还有<span class="tutorial-highlight">字牌</span>：东南西北 + 中发白</p>` },
    { title: '🏆 怎么赢？', content: `<p>把手里14张牌组成 <span class="tutorial-highlight">4组+1对</span> 就赢了！</p><p>一组可以是：<br>• <b>顺子</b>：三张连续的同花色牌 (如 1万2万3万)<br>• <b>刻子</b>：三张相同的牌 (如 5筒5筒5筒)</p>` },
    { title: '🎯 吃碰杠', content: `<p>别人打的牌你也可以拿：</p><p>• <span class="tutorial-highlight">吃</span>：上家打的牌正好能组成顺子<br>• <span class="tutorial-highlight">碰</span>：任何人打的牌你手里有两张一样的<br>• <span class="tutorial-highlight">杠</span>：你有三张一样的，别人打出第四张</p>` },
    { title: '💡 安全打牌', content: `<p>怎样避免"点炮"（把牌送给别人胡）：</p><p>• 别人刚打过的牌 → <span class="tutorial-highlight">比较安全</span><br>• 已经出现3张的牌 → <span class="tutorial-highlight">很安全</span><br>• 中间数字(4,5,6) → <span class="tutorial-highlight">比较危险</span><br>• 1和9 → <span class="tutorial-highlight">相对安全</span></p>` },
    { title: '🌟 开始游戏！', content: `<p>你已经掌握了麻将的基础！</p><p>💡 <b>小贴士</b>：<br>• 先打不需要的牌<br>• 注意别人打了什么牌<br>• 快要赢的时候注意安全<br>• 多玩多练，越打越好！</p><p style="text-align:center;font-size:24px;margin-top:16px;">🎀 祝你好运！ 🎀</p>` },
  ];

  function init() {
    currentStep = 1;
    renderStep(currentStep);
  }

  function renderStep(step) {
    const content = document.getElementById('tutorial-content');
    if (!content) return;

    const progress = document.getElementById('tutorial-progress');
    if (progress) progress.textContent = `${step}/${TOTAL_STEPS}`;

    // Generate step HTML
    const stepData = STEPS[step - 1];
    if (!stepData) return;

    const steps = content.querySelectorAll('.tutorial-step');
    steps.forEach(s => {
      s.classList.remove('active');
      s.style.display = 'none';
    });

    let target = content.querySelector(`[data-step="${step}"]`);
    if (!target) {
      target = document.createElement('div');
      target.className = 'tutorial-step';
      target.dataset.step = step;
      const nav = content.querySelector('.tutorial-nav');
      if (nav) content.insertBefore(target, nav);
      else content.appendChild(target);
    }

    target.innerHTML = `<h3>${stepData.title}</h3>${stepData.content}<div class="tile-demo"></div>`;
    target.style.display = 'block';
    setTimeout(() => target.classList.add('active'), 50);

    renderTileDemos(step, target);
    updateNavButtons(step);
  }

  function renderTileDemos(step, container) {
    stopDemoAnimations();
    const demo = container.querySelector('.tile-demo');
    if (!demo) return;
    demo.innerHTML = '';
    demo.className = 'tutorial-tile-row';

    if (step === 1) {
      const seqGroup = createTileGroup('顺子', DEMO_TILES.sequence);
      demo.appendChild(seqGroup);
      const sep = document.createElement('div');
      sep.className = 'tutorial-separator';
      demo.appendChild(sep);
      const tripGroup = createTileGroup('刻子', DEMO_TILES.triplet);
      demo.appendChild(tripGroup);
    } else if (step === 2) {
      demo.style.flexDirection = 'column';
      const groups = [
        { name: '万子', tiles: DEMO_TILES.suits.wan, color: '#e74c3c' },
        { name: '条子', tiles: DEMO_TILES.suits.tiao, color: '#2ecc71' },
        { name: '筒子', tiles: DEMO_TILES.suits.tong, color: '#3498db' },
        { name: '字牌', tiles: DEMO_TILES.suits.honors, color: '#9b59b6' },
      ];
      for (const sg of groups) {
        const row = document.createElement('div');
        row.style.cssText = 'display:flex;align-items:center;gap:8px;margin:4px 0;';
        const label = document.createElement('span');
        label.style.cssText = `font-size:13px;font-weight:700;color:${sg.color};min-width:40px;text-align:right;`;
        label.textContent = sg.name;
        row.appendChild(label);
        const group = document.createElement('div');
        group.className = 'tutorial-tile-group';
        for (const tile of sg.tiles) {
          group.appendChild(Game.renderTile(tile, { small: true }));
        }
        row.appendChild(group);
        demo.appendChild(row);
      }
    } else if (step === 3) {
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
        for (const tile of g.tiles) tileGroup.appendChild(Game.renderTile(tile, { small: true }));
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
    } else {
      demo.style.display = 'none';
    }

    animateTiles(demo.querySelectorAll('.tile'), 80);
  }

  function createTileGroup(label, tiles) {
    const bracket = document.createElement('div');
    bracket.className = 'tutorial-bracket';
    const group = document.createElement('div');
    group.className = 'tutorial-tile-group';
    for (const tile of tiles) group.appendChild(Game.renderTile(tile, { small: false }));
    bracket.appendChild(group);
    const labelEl = document.createElement('span');
    labelEl.className = 'tutorial-bracket-label';
    labelEl.textContent = label;
    bracket.appendChild(labelEl);
    return bracket;
  }

  function animateTiles(tiles, stagger) {
    tiles.forEach((tile, i) => {
      tile.style.opacity = '0';
      tile.style.transform = 'translateY(-20px) rotateX(60deg) scale(0.7)';
      tile.style.transition = 'none';
      const id = setTimeout(() => {
        tile.style.transition = 'all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)';
        tile.style.opacity = '1';
        tile.style.transform = 'translateY(0) rotateX(0) scale(1)';
      }, i * stagger);
      demoAnimations.push(id);
    });
  }

  function stopDemoAnimations() {
    demoAnimations.forEach(id => clearTimeout(id));
    demoAnimations = [];
  }

  function updateNavButtons(step) {
    const content = document.getElementById('tutorial-content');
    if (!content) return;
    const prevBtn = content.querySelector('.btn-nav:first-child');
    const nextBtn = content.querySelector('.btn-nav:last-child');
    if (prevBtn) prevBtn.style.visibility = step === 1 ? 'hidden' : 'visible';
    if (nextBtn) nextBtn.textContent = step === TOTAL_STEPS ? '开始游戏 🎮' : '下一步';
  }

  function next() {
    if (currentStep < TOTAL_STEPS) {
      currentStep++;
      renderStep(currentStep);
    } else {
      if (typeof App !== 'undefined') App.backToMenu();
    }
    try { Game.Sound.playTap(); } catch {}
  }

  function prev() {
    if (currentStep > 1) {
      currentStep--;
      renderStep(currentStep);
    }
    try { Game.Sound.playTap(); } catch {}
  }

  return { init, next, prev };
})();
