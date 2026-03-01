/**
 * @file meld.js
 * @description 面子/副露（Meld）管理模块
 *
 * 职责：吃/碰/杠面子的构造、升级、查询。
 * 全部为纯函数，不修改传入的 hand 数组。
 *
 * @requires Hand (hand.js)
 */

const Meld = (() => {
  'use strict';

  // ═══════════════════════════════════════════════════════════════
  // 面子构造
  // ═══════════════════════════════════════════════════════════════

  /**
   * 构造吃面子（顺子）
   * @param {object} discardTile         - 吃入的牌（来自上家出牌）
   * @param {Array}  hand                - 当前手牌
   * @param {Array<number>} rankOption   - 3个点数组成的顺子，如 [2,3,4]
   * @returns {{ meld: object, newHand: Array } | null}
   *   null = 手牌中找不到需要的牌，构造失败
   */
  function buildChi(discardTile, hand, rankOption) {
    const chiTiles = [discardTile];
    const neededRanks = rankOption.filter(r => r !== discardTile.rank);
    let workHand = [...hand];

    for (const rank of neededRanks) {
      const idx = workHand.findIndex(t => t.suit === discardTile.suit && t.rank === rank);
      if (idx === -1) return null; // 手牌不足，理论上不应发生
      chiTiles.push(workHand.splice(idx, 1)[0]);
    }

    // 按点数排序
    chiTiles.sort((a, b) => a.rank - b.rank);

    return {
      meld: { type: 'chi', tiles: chiTiles },
      newHand: TileUtils.sortHand(workHand),
    };
  }

  /**
   * 构造碰面子（刻子）
   * @param {object} tile   - 碰入的牌
   * @param {Array}  hand   - 当前手牌（需包含至少2张相同牌）
   * @returns {{ meld: object, newHand: Array } | null}
   */
  function buildPeng(tile, hand) {
    const workHand = [...hand];
    const pengTiles = [tile];
    let removed = 0;

    for (let i = workHand.length - 1; i >= 0 && removed < 2; i--) {
      if (workHand[i].key === tile.key) {
        pengTiles.push(workHand.splice(i, 1)[0]);
        removed++;
      }
    }

    if (removed < 2) return null;

    return {
      meld: { type: 'peng', tiles: pengTiles },
      newHand: TileUtils.sortHand(workHand),
    };
  }

  /**
   * 构造明杠（四张相同，来自出牌）
   * 手牌需包含3张相同牌
   * @param {object} tile   - 杠入的牌
   * @param {Array}  hand   - 当前手牌
   * @returns {{ meld: object, newHand: Array } | null}
   */
  function buildMingGang(tile, hand) {
    const workHand = [...hand];
    const gangTiles = [tile];
    let removed = 0;

    for (let i = workHand.length - 1; i >= 0 && removed < 3; i--) {
      if (workHand[i].key === tile.key) {
        gangTiles.push(workHand.splice(i, 1)[0]);
        removed++;
      }
    }

    if (removed < 3) return null;

    return {
      meld: { type: 'gang', gangType: 'ming', tiles: gangTiles },
      newHand: TileUtils.sortHand(workHand),
    };
  }

  /**
   * 构造暗杠（手牌中4张相同）
   * @param {string} tileKey - 杠的牌 key
   * @param {Array}  hand    - 当前手牌
   * @returns {{ meld: object, newHand: Array } | null}
   */
  function buildAnGang(tileKey, hand) {
    const workHand = [...hand];
    const gangTiles = [];
    let removed = 0;

    for (let i = workHand.length - 1; i >= 0 && removed < 4; i--) {
      if (workHand[i].key === tileKey) {
        gangTiles.push(workHand.splice(i, 1)[0]);
        removed++;
      }
    }

    if (removed < 4) return null;

    return {
      meld: { type: 'gang', gangType: 'an', tiles: gangTiles },
      newHand: TileUtils.sortHand(workHand),
    };
  }

  /**
   * 加杠：将已有的碰面子升级为杠面子
   * @param {Array}  melds    - 当前面子数组
   * @param {string} tileKey  - 要加杠的牌 key
   * @param {object} extraTile - 摸到的第4张牌
   * @returns {{ newMelds: Array, newHand: Array } | null}
   *   null = 没有找到对应的碰面子
   */
  function buildJiaGang(melds, tileKey, extraTile, hand) {
    const pengIdx = melds.findIndex(m => m.type === 'peng' && m.tiles[0].key === tileKey);
    if (pengIdx === -1) return null;

    const newMelds = [...melds];
    const upgraded = {
      ...newMelds[pengIdx],
      type: 'gang',
      gangType: 'jia',
      tiles: [...newMelds[pengIdx].tiles, extraTile],
    };
    newMelds[pengIdx] = upgraded;

    // 从手牌中移除该额外牌
    const workHand = Hand.removeByKey(hand, tileKey, 1);

    return {
      newMelds,
      newHand: TileUtils.sortHand(workHand),
    };
  }

  // ═══════════════════════════════════════════════════════════════
  // 查询
  // ═══════════════════════════════════════════════════════════════

  /**
   * 当前所有面子中的杠数（三种杠都算）
   * @param {Array} melds
   * @returns {number}
   */
  function countGang(melds) {
    return melds.filter(m => m.type === 'gang').length;
  }

  /**
   * 当前所有面子中的碰数
   * @param {Array} melds
   * @returns {number}
   */
  function countPeng(melds) {
    return melds.filter(m => m.type === 'peng').length;
  }

  /**
   * 当前所有面子中的吃数
   * @param {Array} melds
   * @returns {number}
   */
  function countChi(melds) {
    return melds.filter(m => m.type === 'chi').length;
  }

  /**
   * 检查是否存在指定 key 的碰面子（用于判断加杠条件）
   * @param {Array} melds
   * @param {string} tileKey
   * @returns {boolean}
   */
  function hasPengOf(melds, tileKey) {
    return melds.some(m => m.type === 'peng' && m.tiles[0]?.key === tileKey);
  }

  /**
   * 获取面子中所有牌的 key 列表（用于花色计算）
   * @param {Array} melds
   * @returns {Array<string>}
   */
  function allKeys(melds) {
    return melds.flatMap(m => m.tiles.map(t => t.key));
  }

  /**
   * 面子中所有暗杠数（用于三暗刻计算）
   * @param {Array} melds
   * @returns {number}
   */
  function countAnGang(melds) {
    return melds.filter(m => m.type === 'gang' && m.gangType === 'an').length;
  }

  // ═══════════════════════════════════════════════════════════════
  // 导出
  // ═══════════════════════════════════════════════════════════════

  return {
    buildChi,
    buildPeng,
    buildMingGang,
    buildAnGang,
    buildJiaGang,
    countGang,
    countPeng,
    countChi,
    hasPengOf,
    allKeys,
    countAnGang,
  };

})();
