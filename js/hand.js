/**
 * @file hand.js
 * @description 手牌（Hand）管理模块
 *
 * 职责：手牌的增删、排序、查找操作。
 * 全部为纯函数，返回新数组，不修改原数组。
 *
 * @requires TileUtils (tiles.js)
 */

const Hand = (() => {
  'use strict';

  // ═══════════════════════════════════════════════════════════════
  // 基础操作
  // ═══════════════════════════════════════════════════════════════

  /**
   * 摸入一张牌并排序
   * @param {Array} hand
   * @param {object} tile
   * @returns {Array} 新手牌数组（已排序）
   */
  function add(hand, tile) {
    return TileUtils.sortHand([...hand, tile]);
  }

  /**
   * 按 tile.id 移除一张牌
   * @param {Array} hand
   * @param {object} tile  - 要移除的牌（通过 id 精确匹配）
   * @returns {Array} 新手牌数组
   */
  function remove(hand, tile) {
    const idx = hand.findIndex(t => t.id === tile.id);
    if (idx === -1) return [...hand];
    const next = [...hand];
    next.splice(idx, 1);
    return next;
  }

  /**
   * 按 key 移除若干张牌（从末尾开始匹配，避免索引移位）
   * @param {Array} hand
   * @param {string} key   - 牌的 key（如 'w3'）
   * @param {number} count - 要移除的数量
   * @returns {Array} 新手牌数组
   */
  function removeByKey(hand, key, count = 1) {
    const next = [...hand];
    let removed = 0;
    for (let i = next.length - 1; i >= 0 && removed < count; i--) {
      if (next[i].key === key) {
        next.splice(i, 1);
        removed++;
      }
    }
    return next;
  }

  /**
   * 排序手牌（花色+点数）
   * @param {Array} hand
   * @returns {Array} 新手牌数组（已排序）
   */
  function sort(hand) {
    return TileUtils.sortHand([...hand]);
  }

  // ═══════════════════════════════════════════════════════════════
  // 查找
  // ═══════════════════════════════════════════════════════════════

  /**
   * 查找第一张匹配 key 的牌的索引
   * @param {Array} hand
   * @param {string} key
   * @returns {number} -1 表示不存在
   */
  function indexOf(hand, key) {
    return hand.findIndex(t => t.key === key);
  }

  /**
   * 手牌中某 key 的数量
   * @param {Array} hand
   * @param {string} key
   * @returns {number}
   */
  function countKey(hand, key) {
    return hand.filter(t => t.key === key).length;
  }

  /**
   * 手牌是否包含某 key
   * @param {Array} hand
   * @param {string} key
   * @returns {boolean}
   */
  function contains(hand, key) {
    return hand.some(t => t.key === key);
  }

  /**
   * 返回手牌的 key 计数 Map
   * @param {Array} hand
   * @returns {Object<string, number>}
   */
  function toCountMap(hand) {
    const map = {};
    for (const tile of hand) {
      map[tile.key] = (map[tile.key] || 0) + 1;
    }
    return map;
  }

  // ═══════════════════════════════════════════════════════════════
  // 验证
  // ═══════════════════════════════════════════════════════════════

  /**
   * 检查手牌张数是否合法（13 或 14 张）
   * @param {Array} hand
   * @returns {boolean}
   */
  function isValidSize(hand) {
    return hand.length === 13 || hand.length === 14;
  }

  // ═══════════════════════════════════════════════════════════════
  // 导出
  // ═══════════════════════════════════════════════════════════════

  return {
    add,
    remove,
    removeByKey,
    sort,
    indexOf,
    countKey,
    contains,
    toCountMap,
    isValidSize,
  };

})();
