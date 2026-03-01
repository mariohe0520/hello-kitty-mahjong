/**
 * @file wall.js
 * @description 牌山（Wall）管理模块
 *
 * 职责：牌山的创建、摸牌、补牌、计数。
 * 全部为纯函数（不修改全局状态），由 game.js 调用并传入当前墙数组/索引。
 *
 * @requires TileUtils  (tiles.js)
 * @requires CONFIG     (config.js)
 */

const Wall = (() => {
  'use strict';

  // ═══════════════════════════════════════════════════════════════
  // 创建牌山
  // ═══════════════════════════════════════════════════════════════

  /**
   * 创建并洗好的牌山
   * @param {string} mode - 'beijing'（136张）| 'sichuan'（108张）
   * @returns {Array<{key:string, id:string, suit:string, rank:number}>} 洗好的牌数组
   */
  function create(mode = 'beijing') {
    return TileUtils.shuffle(TileUtils.createDeck(mode));
  }

  // ═══════════════════════════════════════════════════════════════
  // 摸牌
  // ═══════════════════════════════════════════════════════════════

  /**
   * 从牌山正面（活牌）摸一张
   * @param {Array} wall      - 当前牌山数组
   * @param {number} drawIndex - 当前摸牌位置
   * @returns {{ tile: object|null, newIndex: number }}
   *   tile 为 null 表示牌山已空（应触发流局）
   */
  function draw(wall, drawIndex) {
    if (drawIndex >= wall.length) {
      return { tile: null, newIndex: drawIndex };
    }
    return { tile: wall[drawIndex], newIndex: drawIndex + 1 };
  }

  /**
   * 从牌山末尾（死牌/杠牌区域）抽取补牌
   * 用于明杠/暗杠/加杠后的补牌
   * @param {Array} wall       - 当前牌山数组（会被原地修改）
   * @param {number} drawIndex - 活牌摸牌位置（用于判断是否已空）
   * @returns {{ tile: object|null, exhausted: boolean }}
   *   tile 为 null 且 exhausted=true 表示牌山已完全耗尽
   */
  function drawFromEnd(wall, drawIndex) {
    if (wall.length === 0 || drawIndex >= wall.length) {
      return { tile: null, exhausted: true };
    }
    const tile = wall[wall.length - 1];
    wall.pop();
    // 补牌后检查活牌区是否已越过末尾
    const exhausted = drawIndex > wall.length;
    return { tile, exhausted };
  }

  // ═══════════════════════════════════════════════════════════════
  // 计数
  // ═══════════════════════════════════════════════════════════════

  /**
   * 剩余可摸活牌数
   * @param {Array} wall
   * @param {number} drawIndex
   * @returns {number}
   */
  function remaining(wall, drawIndex) {
    return Math.max(0, wall.length - drawIndex);
  }

  /**
   * 牌山是否已空（无法再正常摸牌）
   * @param {Array} wall
   * @param {number} drawIndex
   * @returns {boolean}
   */
  function isEmpty(wall, drawIndex) {
    return drawIndex >= wall.length;
  }

  // ═══════════════════════════════════════════════════════════════
  // 发牌
  // ═══════════════════════════════════════════════════════════════

  /**
   * 初始发牌：每位玩家各 dealCount 张，按庄家开始轮流
   * @param {Array} wall           - 牌山（不修改）
   * @param {number} playerCount   - 玩家数
   * @param {number} dealerIndex   - 庄家座位
   * @param {number} dealCount     - 每人发牌数（默认 CONFIG.DEAL_TILES_EACH）
   * @returns {{ hands: Array<Array>, newDrawIndex: number }}
   */
  function dealHands(wall, playerCount = 4, dealerIndex = 0, dealCount = 13) {
    const hands = Array.from({ length: playerCount }, () => []);
    let idx = 0;
    for (let round = 0; round < dealCount; round++) {
      for (let i = 0; i < playerCount; i++) {
        const pIdx = (dealerIndex + i) % playerCount;
        if (idx < wall.length) {
          hands[pIdx].push(wall[idx]);
          idx++;
        }
      }
    }
    return { hands, newDrawIndex: idx };
  }

  // ═══════════════════════════════════════════════════════════════
  // 导出
  // ═══════════════════════════════════════════════════════════════

  return {
    create,
    draw,
    drawFromEnd,
    remaining,
    isEmpty,
    dealHands,
  };

})();
