/**
 * @file save.js
 * @description 存档模块（扩展 Storage）
 *
 * 职责：
 *   1. 转发所有 Storage 基础操作（向后兼容）
 *   2. 新增：局中断点存档（页面刷新恢复）
 *   3. 新增：多存档槽
 *   4. 新增：存档版本迁移
 *
 * 向后兼容：window.Storage 仍可正常访问；
 *           本模块作为推荐的新接口（window.Save）。
 *
 * @requires Storage (storage.js)
 */

const Save = (() => {
  'use strict';

  /** 存档槽数量 */
  const MAX_SLOTS = 3;
  /** 局中断点存档 key */
  const GAME_STATE_KEY = 'mid_game';

  // ═══════════════════════════════════════════════════════════════
  // 转发 Storage 基础接口（向后兼容）
  // ═══════════════════════════════════════════════════════════════

  const save          = (k, v)       => Storage.save(k, v);
  const load          = (k, d)       => Storage.load(k, d);
  const remove        = (k)          => Storage.remove(k);
  const has           = (k)          => Storage.has(k);
  const getProfile    = ()           => Storage.getProfile();
  const saveProfile   = (p)          => Storage.saveProfile(p);
  const getUnlocks    = ()           => Storage.getUnlocks();
  const saveUnlocks   = (u)          => Storage.saveUnlocks(u);
  const unlock        = (cat, id)    => Storage.unlock(cat, id);
  const isUnlocked    = (cat, id)    => Storage.isUnlocked(cat, id);
  const getCampaign   = ()           => Storage.getCampaign();
  const saveCampaign  = (d)          => Storage.saveCampaign(d);
  const getFriendship = ()           => Storage.getFriendship();
  const saveFriendship= (d)          => Storage.saveFriendship(d);
  const addFriendshipExp = (id, amt) => Storage.addFriendshipExp(id, amt);
  const getDailyChallenge = ()       => Storage.getDailyChallenge();
  const saveDailyChallenge= (d)      => Storage.saveDailyChallenge(d);
  const getHallOfFame = ()           => Storage.getHallOfFame();
  const addToHallOfFame= (e)         => Storage.addToHallOfFame(e);
  const exportAll     = ()           => Storage.exportAll();
  const importAll     = (j)          => Storage.importAll(j);

  // ═══════════════════════════════════════════════════════════════
  // 断点存档（局中刷新恢复）
  // ═══════════════════════════════════════════════════════════════

  /**
   * 保存局中快照（仅保存关键恢复信息，不存全量 state）
   * @param {object} state - 当前游戏 state
   * @returns {boolean}
   */
  function saveGameState(state) {
    if (!state) return false;
    const snapshot = {
      mode: state.mode,
      savedAt: Date.now(),
      scores: state.players.map(p => p.score),
      names: state.players.map(p => p.name),
      charIds: state.players.map(p => p.charId),
      dealer: state.dealer,
      roundWind: state.roundWind,
      round: state.round,
      turnCount: state.turnCount,
    };
    return Storage.save(GAME_STATE_KEY, snapshot);
  }

  /**
   * 读取局中快照
   * @returns {object|null}
   */
  function loadGameState() {
    return Storage.load(GAME_STATE_KEY, null);
  }

  /**
   * 清除局中快照（游戏正常结束后调用）
   */
  function clearGameState() {
    Storage.remove(GAME_STATE_KEY);
  }

  /**
   * 是否有未完成的对局
   * @returns {boolean}
   */
  function hasInProgressGame() {
    const snap = loadGameState();
    if (!snap) return false;
    // 超过24小时的断点存档视为过期
    const expired = Date.now() - snap.savedAt > 24 * 60 * 60 * 1000;
    if (expired) { clearGameState(); return false; }
    return true;
  }

  // ═══════════════════════════════════════════════════════════════
  // 多存档槽
  // ═══════════════════════════════════════════════════════════════

  /**
   * 保存到指定存档槽（0-2）
   * @param {number} slot
   * @param {object} data - 存档数据
   * @returns {boolean}
   */
  function saveSlot(slot, data) {
    if (slot < 0 || slot >= MAX_SLOTS) return false;
    return Storage.save(`slot_${slot}`, {
      ...data,
      savedAt: Date.now(),
      slot,
    });
  }

  /**
   * 读取存档槽
   * @param {number} slot
   * @returns {object|null}
   */
  function loadSlot(slot) {
    if (slot < 0 || slot >= MAX_SLOTS) return null;
    return Storage.load(`slot_${slot}`, null);
  }

  /**
   * 删除存档槽
   * @param {number} slot
   */
  function deleteSlot(slot) {
    if (slot >= 0 && slot < MAX_SLOTS) Storage.remove(`slot_${slot}`);
  }

  /**
   * 列出所有存档槽信息
   * @returns {Array<{slot:number, savedAt:number|null, empty:boolean}>}
   */
  function listSlots() {
    return Array.from({ length: MAX_SLOTS }, (_, i) => {
      const data = loadSlot(i);
      return data
        ? { slot: i, savedAt: data.savedAt, empty: false, label: data.label || `存档 ${i + 1}` }
        : { slot: i, savedAt: null, empty: true, label: `空存档 ${i + 1}` };
    });
  }

  // ═══════════════════════════════════════════════════════════════
  // 导出
  // ═══════════════════════════════════════════════════════════════

  return {
    // 基础转发（向后兼容）
    save, load, remove, has,
    getProfile, saveProfile,
    getUnlocks, saveUnlocks, unlock, isUnlocked,
    getCampaign, saveCampaign,
    getFriendship, saveFriendship, addFriendshipExp,
    getDailyChallenge, saveDailyChallenge,
    getHallOfFame, addToHallOfFame,
    exportAll, importAll,
    // 断点存档
    saveGameState, loadGameState, clearGameState, hasInProgressGame,
    // 多存档槽
    saveSlot, loadSlot, deleteSlot, listSlots,
    MAX_SLOTS,
  };

})();
