/**
 * @file scoring.js
 * @description 积分结算模块
 *
 * 职责：胡牌后的积分流转计算（荣和/自摸/杠上花等），
 *       与具体番型计算（rules-beijing.js / rules-sichuan.js）分离。
 *
 * 番型计算由规则引擎负责；本模块负责"谁付钱给谁"的结算逻辑。
 *
 * @requires CONFIG (config.js)
 */

const Scoring = (() => {
  'use strict';

  // ═══════════════════════════════════════════════════════════════
  // 番数 → 基础分换算
  // ═══════════════════════════════════════════════════════════════

  /**
   * 番数转基础支付额（可自定义翻倍系数）
   * 默认：北京麻将 1番 = 基础1分，实际支付由 settle 处理
   * @param {number} totalFan
   * @param {number} baseUnit - 1番对应的基础分值（默认100）
   * @returns {number}
   */
  function fanToPoints(totalFan, baseUnit = 100) {
    if (totalFan <= 0) return baseUnit;
    return Math.pow(2, Math.min(totalFan, 13)) * baseUnit;
  }

  // ═══════════════════════════════════════════════════════════════
  // 分数结算
  // ═══════════════════════════════════════════════════════════════

  /**
   * 荣和（荣胡）结算：出牌者单独支付
   * @param {Array<number>} scores       - 4人当前分数数组（原地修改副本）
   * @param {number}        winnerIdx    - 胡牌玩家座位
   * @param {number}        discarderIdx - 出牌玩家座位
   * @param {number}        points       - 支付点数
   * @returns {Array<number>} 更新后的分数数组（新数组）
   */
  function settleRon(scores, winnerIdx, discarderIdx, points) {
    const next = [...scores];
    next[discarderIdx] -= points;
    next[winnerIdx]    += points;
    return next;
  }

  /**
   * 自摸结算：其余三家各付 points
   * @param {Array<number>} scores     - 4人当前分数
   * @param {number}        winnerIdx  - 胡牌玩家座位
   * @param {number}        points     - 每人支付点数
   * @returns {Array<number>} 更新后的分数数组（新数组）
   */
  function settleTsumo(scores, winnerIdx, points) {
    const next = [...scores];
    let paid = 0;
    for (let i = 0; i < next.length; i++) {
      if (i !== winnerIdx) {
        next[i] -= points;
        paid += points;
      }
    }
    next[winnerIdx] += paid;
    return next;
  }

  /**
   * 流局（荒牌）听牌罚符结算
   * 听牌者均分罚符，不听牌者按不听牌人数付出
   * @param {Array<number>}  scores         - 4人当前分数
   * @param {Array<boolean>} tenpaiFlags    - 4人是否听牌
   * @param {number}         penaltyPerPair - 每组听/不听的罚符（通常1000）
   * @returns {Array<number>} 更新后的分数数组（新数组）
   */
  function settleDrawGame(scores, tenpaiFlags, penaltyPerPair = 1000) {
    const next = [...scores];
    const tenpaiCount   = tenpaiFlags.filter(Boolean).length;
    const noTenpaiCount = tenpaiFlags.length - tenpaiCount;

    if (tenpaiCount === 0 || noTenpaiCount === 0) return next; // 无需结算

    const totalPenalty  = penaltyPerPair * tenpaiCount * noTenpaiCount;
    const perTenpai     = totalPenalty / tenpaiCount;
    const perNoTenpai   = totalPenalty / noTenpaiCount;

    for (let i = 0; i < tenpaiFlags.length; i++) {
      if (tenpaiFlags[i]) {
        next[i] += perTenpai;
      } else {
        next[i] -= perNoTenpai;
      }
    }
    return next;
  }

  // ═══════════════════════════════════════════════════════════════
  // 四川血战结算（多赢继续，每次独立结算）
  // ═══════════════════════════════════════════════════════════════

  /**
   * 四川血战点炮结算（点炮者单独付款，其他人不付）
   * 与北京麻将荣和相同结构，但确认语义分开
   * @param {Array<number>} scores
   * @param {number}        winnerIdx
   * @param {number}        discarderIdx
   * @param {number}        points
   * @returns {Array<number>}
   */
  function settleSichuanRon(scores, winnerIdx, discarderIdx, points) {
    return settleRon(scores, winnerIdx, discarderIdx, points);
  }

  /**
   * 四川血战自摸结算
   * 已胡牌的玩家（hasWon=true）不再付款
   * @param {Array<number>}  scores
   * @param {number}         winnerIdx
   * @param {number}         points
   * @param {Array<boolean>} hasWon     - 各玩家是否已胡牌
   * @returns {Array<number>}
   */
  function settleSichuanTsumo(scores, winnerIdx, points, hasWon) {
    const next = [...scores];
    let paid = 0;
    for (let i = 0; i < next.length; i++) {
      if (i !== winnerIdx && !hasWon[i]) {
        next[i] -= points;
        paid += points;
      }
    }
    next[winnerIdx] += paid;
    return next;
  }

  // ═══════════════════════════════════════════════════════════════
  // 显示用格式化
  // ═══════════════════════════════════════════════════════════════

  /**
   * 格式化分数变化为显示字符串（例如 "+1000", "-500"）
   * @param {number} delta
   * @returns {string}
   */
  function formatDelta(delta) {
    return delta >= 0 ? `+${delta}` : `${delta}`;
  }

  /**
   * 生成支付摘要（谁付了多少，用于胡牌弹窗）
   * @param {Array<number>} before   - 结算前分数
   * @param {Array<number>} after    - 结算后分数
   * @param {Array<string>} names    - 玩家名字
   * @returns {Array<{name:string, delta:number}>}
   */
  function paymentSummary(before, after, names) {
    return before.map((b, i) => ({
      name: names[i],
      delta: after[i] - b,
    }));
  }

  // ═══════════════════════════════════════════════════════════════
  // 导出
  // ═══════════════════════════════════════════════════════════════

  return {
    fanToPoints,
    settleRon,
    settleTsumo,
    settleDrawGame,
    settleSichuanRon,
    settleSichuanTsumo,
    formatDelta,
    paymentSummary,
  };

})();
