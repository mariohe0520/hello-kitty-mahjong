// ═══════════════════════════════════════════════════════════════
// 💾 Hello Kitty 麻将 — Persistent Storage System
// Save/Load/Backup for all game state
// ═══════════════════════════════════════════════════════════════

const Storage = (() => {
  'use strict';

  const PREFIX = 'hk_mj_';
  const VERSION = 2;

  function _key(name) { return PREFIX + name; }

  function save(name, data) {
    try {
      const wrapped = { v: VERSION, ts: Date.now(), d: data };
      localStorage.setItem(_key(name), JSON.stringify(wrapped));
      return true;
    } catch (e) {
      console.warn('[Storage] save failed:', name, e);
      return false;
    }
  }

  function load(name, defaults = null) {
    try {
      const raw = localStorage.getItem(_key(name));
      if (!raw) return defaults;
      const parsed = JSON.parse(raw);
      // Handle both wrapped and legacy formats
      if (parsed && parsed.v && parsed.d !== undefined) return parsed.d;
      return parsed; // legacy format
    } catch {
      return defaults;
    }
  }

  function remove(name) {
    try { localStorage.removeItem(_key(name)); } catch {}
  }

  function has(name) {
    return localStorage.getItem(_key(name)) !== null;
  }

  // ─── Profile system ───
  function getProfile() {
    return load('profile', {
      name: '玩家',
      title: '麻将新手',
      avatar: '🎀',
      level: 1,
      exp: 0,
      coins: 1000,
      gems: 10,
      createdAt: Date.now(),
      totalPlayTime: 0,
      settings: {
        soundEnabled: true,
        musicEnabled: true,
        aiSpeed: 'normal',
        tileTheme: 'classic',
        tableTheme: 'green-felt',
        language: 'zh',
        difficulty: 'normal',
        showHints: true,
        autoSort: true,
      },
    });
  }

  function saveProfile(profile) {
    return save('profile', profile);
  }

  // ─── Unlock system ───
  function getUnlocks() {
    return load('unlocks', {
      tileThemes: ['classic', 'hello-kitty'],
      tableThemes: ['green-felt', 'wood'],
      characters: ['kitty', 'bear', 'bunny', 'fox'],
      titles: ['麻将新手'],
      avatars: ['🎀'],
    });
  }

  function saveUnlocks(unlocks) {
    return save('unlocks', unlocks);
  }

  function unlock(category, itemId) {
    const unlocks = getUnlocks();
    if (!unlocks[category]) unlocks[category] = [];
    if (!unlocks[category].includes(itemId)) {
      unlocks[category].push(itemId);
      saveUnlocks(unlocks);
      return true; // newly unlocked
    }
    return false; // already had it
  }

  function isUnlocked(category, itemId) {
    const unlocks = getUnlocks();
    return unlocks[category]?.includes(itemId) || false;
  }

  // ─── Campaign progress ───
  function getCampaign() {
    return load('campaign', {
      currentChapter: 1,
      currentLevel: 1,
      completedLevels: {},
      stars: {},        // levelId -> 1-3 stars
      totalStars: 0,
      bossesDefeated: [],
      unlockedChapters: [1],
      dialoguesSeen: [],
    });
  }

  function saveCampaign(data) { return save('campaign', data); }

  // ─── Character friendship ───
  function getFriendship() {
    return load('friendship', {
      kitty: { level: 1, exp: 0, gamesPlayed: 0 },
      bear: { level: 1, exp: 0, gamesPlayed: 0 },
      bunny: { level: 1, exp: 0, gamesPlayed: 0 },
      fox: { level: 1, exp: 0, gamesPlayed: 0 },
    });
  }

  function saveFriendship(data) { return save('friendship', data); }

  function addFriendshipExp(charId, amount) {
    const f = getFriendship();
    if (!f[charId]) f[charId] = { level: 1, exp: 0, gamesPlayed: 0 };
    f[charId].exp += amount;
    f[charId].gamesPlayed++;
    // Level up every 100 exp
    while (f[charId].exp >= f[charId].level * 100) {
      f[charId].exp -= f[charId].level * 100;
      f[charId].level++;
    }
    saveFriendship(f);
    return f[charId];
  }

  // ─── Daily challenge ───
  function getDailyChallenge() {
    const today = new Date().toISOString().split('T')[0];
    const data = load('daily', { date: null, completed: false, challenge: null });
    if (data.date !== today) {
      return { date: today, completed: false, challenge: null };
    }
    return data;
  }

  function saveDailyChallenge(data) { return save('daily', data); }

  // ─── Hall of Fame ───
  function getHallOfFame() {
    return load('hall_of_fame', []);
  }

  function addToHallOfFame(entry) {
    const hall = getHallOfFame();
    hall.unshift({ ...entry, date: Date.now() });
    if (hall.length > 50) hall.length = 50; // keep top 50
    save('hall_of_fame', hall);
  }

  // ─── Export / Import ───
  function exportAll() {
    const data = {};
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key.startsWith(PREFIX)) {
        data[key] = localStorage.getItem(key);
      }
    }
    return JSON.stringify(data);
  }

  function importAll(jsonStr) {
    try {
      const data = JSON.parse(jsonStr);
      for (const [key, value] of Object.entries(data)) {
        if (key.startsWith(PREFIX)) {
          localStorage.setItem(key, value);
        }
      }
      return true;
    } catch { return false; }
  }

  // ─── Today helper ───
  function today() {
    return new Date().toISOString().split('T')[0];
  }

  return {
    save, load, remove, has,
    getProfile, saveProfile,
    getUnlocks, saveUnlocks, unlock, isUnlocked,
    getCampaign, saveCampaign,
    getFriendship, saveFriendship, addFriendshipExp,
    getDailyChallenge, saveDailyChallenge,
    getHallOfFame, addToHallOfFame,
    exportAll, importAll, today,
  };
})();
