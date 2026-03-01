/**
 * @file ui.js
 * @description UI 工具模块 — 纯 DOM 渲染函数
 *
 * 职责：
 *   - 牌面 DOM 元素渲染（renderTile）
 *   - 牌面图片预加载
 *   - 通用 toast / 弹窗工具
 *   - 不持有任何游戏状态（纯函数，接受数据返回 DOM）
 *
 * game.js 内的 renderTile 是同名函数，两者实现相同。
 * 未来可将 game.js 中的调用全部替换为 UI.renderTile()。
 *
 * @requires TILES, TILE_SUITS (tiles.js)
 * @requires CONFIG (config.js)
 */

const UI = (() => {
  'use strict';

  // ═══════════════════════════════════════════════════════════════
  // 牌面图片映射（SVG 资源名）
  // ═══════════════════════════════════════════════════════════════

  const TILE_IMAGE_MAP = Object.freeze({
    w1: 'Man1', w2: 'Man2', w3: 'Man3', w4: 'Man4', w5: 'Man5',
    w6: 'Man6', w7: 'Man7', w8: 'Man8', w9: 'Man9',
    t1: 'Sou1', t2: 'Sou2', t3: 'Sou3', t4: 'Sou4', t5: 'Sou5',
    t6: 'Sou6', t7: 'Sou7', t8: 'Sou8', t9: 'Sou9',
    b1: 'Pin1', b2: 'Pin2', b3: 'Pin3', b4: 'Pin4', b5: 'Pin5',
    b6: 'Pin6', b7: 'Pin7', b8: 'Pin8', b9: 'Pin9',
    fe: 'Ton',  fs: 'Nan',  fw: 'Shaa', fn: 'Pei',
    jz: 'Chun', jf: 'Hatsu', jb: 'Haku',
  });

  /** 箭牌（三元牌）颜色 */
  const JIAN_COLORS = Object.freeze({ jz: '#e74c3c', jf: '#2ecc71', jb: '#5b9bd5' });

  /** 数牌花色背景色 */
  const SUIT_BG = Object.freeze({ wan: '#fff0f0', tiao: '#f0fff0', tong: '#f0f0ff' });

  const imageCache = {};

  // ═══════════════════════════════════════════════════════════════
  // 图片预加载
  // ═══════════════════════════════════════════════════════════════

  /**
   * 预加载所有牌面 SVG 图片（页面启动时调用一次）
   * @param {string} [assetBase] - 资源目录（默认从 CONFIG 读取）
   */
  function preloadImages(assetBase) {
    const base = assetBase || (typeof CONFIG !== 'undefined' ? CONFIG.TILE_ASSET_BASE : 'assets/tiles/');
    const names = [...Object.values(TILE_IMAGE_MAP), 'Back', 'Front'];
    for (const name of names) {
      if (!imageCache[name]) {
        const img = new Image();
        img.src = `${base}${name}.svg`;
        imageCache[name] = img;
      }
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // 牌面渲染
  // ═══════════════════════════════════════════════════════════════

  /**
   * 创建单张牌的 DOM 元素
   *
   * 渲染策略：先用文字内容保证可见性，再异步覆盖 SVG 图片。
   *
   * @param {object}  tile           - 牌对象 { id, key, suit, rank, display }
   * @param {object}  [options]
   * @param {boolean} [options.faceDown=false]  - 是否背面朝上
   * @param {boolean} [options.small=false]     - 小尺寸（侧面玩家）
   * @param {boolean} [options.mini=false]      - 迷你尺寸（牌河）
   * @param {boolean} [options.selected=false]  - 选中状态
   * @param {string}  [options.assetBase]       - 自定义资源路径
   * @returns {HTMLElement}
   */
  function renderTile(tile, options = {}) {
    const { faceDown = false, small = false, selected = false, mini = false, assetBase } = options;
    const base = assetBase || (typeof CONFIG !== 'undefined' ? CONFIG.TILE_ASSET_BASE : 'assets/tiles/');

    const div = document.createElement('div');
    div.className = 'tile' +
      (small    ? ' tile-sm'   : '') +
      (mini     ? ' tile-mini' : '') +
      (selected ? ' selected'  : '') +
      (faceDown ? ' face-down' : '');
    div.dataset.id  = tile.id;
    div.dataset.key = tile.key;

    if (faceDown) {
      const span = document.createElement('span');
      span.className   = 'tile-back';
      span.textContent = '🎀';
      div.appendChild(span);
    } else {
      // 1. 文字内容（始终可见，作为 SVG 加载失败的降级方案）
      _renderTileText(div, tile);
      // 2. SVG 图片（异步加载，覆盖在文字上方）
      const imgName = TILE_IMAGE_MAP[tile.key];
      if (imgName) {
        const img      = new Image();
        img.className  = 'tile-img';
        img.alt        = '';
        img.draggable  = false;
        img.onload     = function () { div.appendChild(this); };
        img.src        = base + imgName + '.svg';
      }
    }

    return div;
  }

  /**
   * @private
   * 向牌 div 内写入文字内容（花色 + 点数，带颜色编码）
   * @param {HTMLElement} div
   * @param {object}      tile
   */
  function _renderTileText(div, tile) {
    if (tile.suit === 'jian') {
      // 三元牌：中/发/白
      const span       = document.createElement('span');
      span.className   = 'tile-honor';
      const color      = JIAN_COLORS[tile.key] || '#333';
      span.style.color = color;
      span.textContent = tile.display;
      if (tile.key === 'jb') {
        // 白板特殊处理：蓝边框
        span.style.color      = '#5b9bd5';
        span.style.textShadow = 'none';
        div.style.borderColor = '#5b9bd5';
        div.style.borderWidth = '2px';
      }
      div.appendChild(span);

    } else if (tile.suit === 'feng') {
      // 风牌
      const span             = document.createElement('span');
      span.className         = 'tile-honor';
      span.style.color       = '#1a1a1a';
      span.style.fontWeight  = '900';
      span.textContent       = tile.display;
      div.appendChild(span);

    } else {
      // 数牌（万/条/筒）：按花色着色
      const suitColor = (typeof TILE_SUITS !== 'undefined' && TILE_SUITS[tile.suit])
        ? TILE_SUITS[tile.suit].color : '#333';
      const suitName  = (typeof TILE_SUITS !== 'undefined' && TILE_SUITS[tile.suit])
        ? TILE_SUITS[tile.suit].name  : '';

      div.style.background       = SUIT_BG[tile.suit] || '';
      div.style.borderLeftWidth  = '3px';
      div.style.borderLeftColor  = suitColor;

      const rank         = document.createElement('span');
      rank.className     = 'tile-rank';
      rank.style.color   = suitColor;
      rank.textContent   = tile.rank;
      div.appendChild(rank);

      const suit         = document.createElement('span');
      suit.className     = 'tile-suit';
      suit.style.color   = suitColor;
      suit.textContent   = suitName;
      div.appendChild(suit);
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // Toast / 弹窗工具
  // ═══════════════════════════════════════════════════════════════

  /**
   * 显示轻量 toast 消息
   * @param {string}  text
   * @param {object}  [opts]
   * @param {number}  [opts.duration=2000]  - 显示时长（毫秒）
   * @param {string}  [opts.color='#ff6b9d'] - 文字颜色
   * @param {string}  [opts.icon='']
   */
  function showToast(text, opts = {}) {
    const { duration = 2000, color = '#ff6b9d', icon = '' } = opts;
    const el = document.createElement('div');
    el.textContent = icon ? `${icon} ${text}` : text;
    el.style.cssText = `
      position:fixed;bottom:80px;left:50%;transform:translateX(-50%) translateY(20px);
      background:rgba(0,0,0,0.8);color:${color};padding:10px 24px;
      border-radius:24px;font-size:15px;font-weight:600;z-index:9999;
      transition:all 0.3s ease;opacity:0;pointer-events:none;
      border:1px solid ${color}44;backdrop-filter:blur(8px);
    `;
    document.body.appendChild(el);
    requestAnimationFrame(() => {
      el.style.opacity   = '1';
      el.style.transform = 'translateX(-50%) translateY(0)';
    });
    setTimeout(() => {
      el.style.opacity   = '0';
      el.style.transform = 'translateX(-50%) translateY(20px)';
      setTimeout(() => el.remove(), 300);
    }, duration);
  }

  /**
   * 显示全屏文字动画（仿书法字）
   * @param {string} text
   * @param {string} [color='#ff6b9d']
   * @param {number} [duration=800]
   */
  function showActionText(text, color = '#ff6b9d', duration = 800) {
    const el       = document.createElement('div');
    el.className   = 'action-calligraphy';
    el.textContent = text;
    el.style.color = color;
    if (text.includes('胡')) el.classList.add('action-hu');
    document.body.appendChild(el);
    setTimeout(() => {
      el.style.opacity = '0';
      setTimeout(() => el.remove(), 300);
    }, duration);
  }

  /**
   * 显示弹出评分标签（例如 "+1000"）
   * @param {number} delta   - 分数变化值
   * @param {HTMLElement|null} anchor - 锚点元素（用于定位）
   */
  function showScorePopup(delta, anchor = null) {
    const el = document.createElement('div');
    el.className   = 'score-popup';
    el.textContent = delta >= 0 ? `+${delta}` : `${delta}`;
    el.style.color = delta >= 0 ? '#f1c40f' : '#e74c3c';

    if (anchor) {
      const rect     = anchor.getBoundingClientRect();
      el.style.left  = `${rect.left + rect.width / 2}px`;
      el.style.top   = `${rect.top}px`;
    } else {
      el.style.left = '50%';
      el.style.top  = '50%';
    }

    document.body.appendChild(el);
    setTimeout(() => el.remove(), 1200);
  }

  // ═══════════════════════════════════════════════════════════════
  // 进度条 / 加载
  // ═══════════════════════════════════════════════════════════════

  /**
   * 更新进度条元素
   * @param {HTMLElement} bar     - 进度条 DOM
   * @param {number}      percent - 0-100
   */
  function setProgress(bar, percent) {
    if (bar) bar.style.width = `${Math.max(0, Math.min(100, percent))}%`;
  }

  // ═══════════════════════════════════════════════════════════════
  // DOM 工具
  // ═══════════════════════════════════════════════════════════════

  /**
   * 安全设置元素文本（空安全）
   * @param {string} id
   * @param {string} text
   */
  function setText(id, text) {
    const el = document.getElementById(id);
    if (el) el.textContent = text;
  }

  /**
   * 安全设置元素 HTML（空安全）
   * @param {string} id
   * @param {string} html
   */
  function setHTML(id, html) {
    const el = document.getElementById(id);
    if (el) el.innerHTML = html;
  }

  /**
   * 安全设置元素显示状态
   * @param {string}  id
   * @param {boolean} visible
   * @param {string}  [display='block']
   */
  function setVisible(id, visible, display = 'block') {
    const el = document.getElementById(id);
    if (el) el.style.display = visible ? display : 'none';
  }

  // ═══════════════════════════════════════════════════════════════
  // 导出
  // ═══════════════════════════════════════════════════════════════

  return {
    TILE_IMAGE_MAP,
    preloadImages,
    renderTile,
    showToast,
    showActionText,
    showScorePopup,
    setProgress,
    setText,
    setHTML,
    setVisible,
  };

})();
