/**
 * @file rules.js
 * @description 统一规则引擎适配器
 *
 * 职责：根据游戏模式（'beijing' | 'sichuan'）统一转发规则查询，
 *       消除业务代码中散落的 if (mode === 'sichuan') 判断。
 *
 * 底层引擎：
 *   - BeijingRules  (rules-beijing.js)
 *   - SichuanRules  (rules-sichuan.js)
 *
 * @requires BeijingRules (rules-beijing.js)
 * @requires SichuanRules (rules-sichuan.js)
 */

const Rules = (() => {
  'use strict';

  // ═══════════════════════════════════════════════════════════════
  // 引擎获取
  // ═══════════════════════════════════════════════════════════════

  /**
   * 根据模式获取底层规则引擎
   * @param {string} mode - 'beijing' | 'sichuan'
   * @returns {object} 规则引擎（BeijingRules 或 SichuanRules）
   */
  function getEngine(mode) {
    return mode === 'sichuan' ? SichuanRules : BeijingRules;
  }

  // ═══════════════════════════════════════════════════════════════
  // 胡牌判定
  // ═══════════════════════════════════════════════════════════════

  /**
   * 检查当前手牌是否已经胡牌（用于自摸检测）
   * @param {string} mode
   * @param {Array}  hand
   * @param {Array}  melds
   * @returns {object|null} 胡牌结果或 null
   */
  function checkWin(mode, hand, melds) {
    return getEngine(mode).checkWin(hand, melds);
  }

  /**
   * 检查摸入/出牌后是否可以胡牌（荣和/自摸通用）
   * 四川模式下自动检查缺一门条件
   * @param {string}      mode
   * @param {Array}       hand
   * @param {object}      tile         - 要加入手牌的那张牌
   * @param {Array}       melds
   * @param {string|null} removedSuit  - 四川模式缺一门花色（没有则传 null）
   * @returns {object|null}
   */
  function checkCanHu(mode, hand, tile, melds = [], removedSuit = null) {
    return getEngine(mode).checkCanHu(hand, tile, melds, removedSuit);
  }

  // ═══════════════════════════════════════════════════════════════
  // 吃碰杠判定
  // ═══════════════════════════════════════════════════════════════

  /**
   * 能否吃（仅允许上家出牌）
   * @param {string} mode
   * @param {Array}  hand
   * @param {object} tile               - 出牌
   * @param {number} playerIndex        - 本玩家座位
   * @param {number} discardPlayerIndex - 出牌玩家座位
   * @returns {Array<Array<number>>} 可吃的顺子组合（空数组=不能吃）
   */
  function canChi(mode, hand, tile, playerIndex, discardPlayerIndex) {
    return getEngine(mode).canChi(hand, tile, playerIndex, discardPlayerIndex);
  }

  /**
   * 能否碰
   * @param {string} mode
   * @param {Array}  hand
   * @param {object} tile
   * @returns {boolean}
   */
  function canPeng(mode, hand, tile) {
    return getEngine(mode).canPeng(hand, tile);
  }

  /**
   * 能否杠（明杠，来自出牌）
   * @param {string} mode
   * @param {Array}  hand
   * @param {object} tile
   * @returns {boolean}
   */
  function canGang(mode, hand, tile) {
    return getEngine(mode).canGang(hand, tile);
  }

  /**
   * 查找可以暗杠的牌
   * @param {string} mode
   * @param {Array}  hand
   * @returns {Array<string>} 可暗杠的 key 列表
   */
  function findAnGang(mode, hand) {
    return getEngine(mode).findAnGang(hand);
  }

  /**
   * 查找可以加杠的牌
   * @param {string} mode
   * @param {Array}  hand
   * @param {Array}  melds
   * @returns {Array<string>} 可加杠的 key 列表
   */
  function findJiaGang(mode, hand, melds) {
    return getEngine(mode).findJiaGang(hand, melds);
  }

  // ═══════════════════════════════════════════════════════════════
  // 计分
  // ═══════════════════════════════════════════════════════════════

  /**
   * 计算胡牌番数和基础分
   * @param {string} mode
   * @param {Array}  hand      - 胡牌时的暗牌部分
   * @param {Array}  melds     - 副露面子
   * @param {object} winTile   - 胡的那张牌
   * @param {object} opts      - 附加条件（isZimo, isGangShang, removedSuit 等）
   * @returns {object}  { fans, totalFan, baseScore, error? }
   */
  function calculateScore(mode, hand, melds, winTile, opts = {}) {
    return getEngine(mode).calculateScore(hand, melds, winTile, opts);
  }

  // ═══════════════════════════════════════════════════════════════
  // 听牌分析
  // ═══════════════════════════════════════════════════════════════

  /**
   * 返回当前手牌的等待牌列表（听牌时有效）
   * @param {string} mode
   * @param {Array}  hand
   * @param {Array}  melds
   * @returns {Array<string>} key 列表
   */
  function getTingTiles(mode, hand, melds) {
    return getEngine(mode).getTingTiles(hand, melds);
  }

  // ═══════════════════════════════════════════════════════════════
  // 四川专属
  // ═══════════════════════════════════════════════════════════════

  /**
   * 建议缺一门花色（四川模式）
   * @param {Array} hand
   * @returns {string} 'wan' | 'tiao' | 'tong'
   */
  function suggestQueYiMen(hand) {
    if (typeof SichuanRules !== 'undefined' && SichuanRules.suggestQueYiMen) {
      return SichuanRules.suggestQueYiMen(hand);
    }
    return 'wan';
  }

  /**
   * 检查缺一门是否已满足
   * @param {Array}  hand
   * @param {string} removedSuit
   * @returns {boolean}
   */
  function isQueYiMenSatisfied(hand, removedSuit) {
    if (typeof SichuanRules !== 'undefined' && SichuanRules.isQueYiMenSatisfied) {
      return SichuanRules.isQueYiMenSatisfied(hand, removedSuit);
    }
    return true;
  }

  /**
   * 血战到底：检查是否已有足够玩家胡牌（游戏结束条件）
   * @param {Array<number>} winners    - 已胡牌玩家索引列表
   * @param {number}        playerCount
   * @returns {boolean}
   */
  function isBloodWarComplete(winners, playerCount = 4) {
    if (typeof SichuanRules !== 'undefined' && SichuanRules.isBloodWarComplete) {
      return SichuanRules.isBloodWarComplete(winners, playerCount);
    }
    return false;
  }

  // ═══════════════════════════════════════════════════════════════
  // 导出
  // ═══════════════════════════════════════════════════════════════

  return {
    getEngine,
    checkWin,
    checkCanHu,
    canChi,
    canPeng,
    canGang,
    findAnGang,
    findJiaGang,
    calculateScore,
    getTingTiles,
    suggestQueYiMen,
    isQueYiMenSatisfied,
    isBloodWarComplete,
  };

})();
