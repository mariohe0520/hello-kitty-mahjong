// ═══════════════════════════════════════════════════════════════
// 📊 Hello Kitty 麻将 — Stats & Achievements System
// Persistent progress tracking for long-term engagement
// ═══════════════════════════════════════════════════════════════

const Stats = (() => {
  'use strict';

  const STORAGE_KEY = 'hk_mahjong_stats';
  const ACHIEVEMENTS_KEY = 'hk_mahjong_achievements';

  // Default stats structure
  function getDefaults() {
    return {
      gamesPlayed: 0,
      gamesWon: 0,
      totalScore: 0,
      highScore: 0,
      winStreak: 0,
      bestWinStreak: 0,
      totalTilesDiscarded: 0,
      totalChi: 0,
      totalPeng: 0,
      totalGang: 0,
      totalHu: 0,
      totalZimo: 0,
      dailyGames: {}, // { "2026-02-19": 3 }
      loginDays: [],   // ["2026-02-19", ...]
      firstPlayDate: null,
      lastPlayDate: null,
      beijingWins: 0,
      sichuanWins: 0,
      // Rare hand tracking
      allPeng: 0,      // 碰碰胡
      cleanHand: 0,    // 清一色
      sevenPairs: 0,   // 七对子
      allHonors: 0,    // 字一色
    };
  }

  function load() {
    try {
      const s = localStorage.getItem(STORAGE_KEY);
      return s ? { ...getDefaults(), ...JSON.parse(s) } : getDefaults();
    } catch { return getDefaults(); }
  }

  function save(stats) {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(stats)); } catch {}
  }

  function today() {
    return new Date().toISOString().split('T')[0];
  }

  // ╔═══════════════════════════════════════════════════════════╗
  // ║  ACHIEVEMENTS                                            ║
  // ╚═══════════════════════════════════════════════════════════╝

  const ACHIEVEMENT_DEFS = [
    // Beginner
    { id: 'first_game', name: '初出茅庐', desc: '完成第一局', icon: '🎀', check: s => s.gamesPlayed >= 1 },
    { id: 'first_win', name: '初次胡牌', desc: '赢得第一局', icon: '🌸', check: s => s.gamesWon >= 1 },
    { id: 'play_10', name: '乐此不疲', desc: '玩满10局', icon: '🎮', check: s => s.gamesPlayed >= 10 },
    { id: 'play_50', name: '麻将达人', desc: '玩满50局', icon: '🏆', check: s => s.gamesPlayed >= 50 },
    { id: 'play_100', name: '百战老将', desc: '玩满100局', icon: '👑', check: s => s.gamesPlayed >= 100 },

    // Winning
    { id: 'win_5', name: '连战连胜', desc: '累计赢5局', icon: '⭐', check: s => s.gamesWon >= 5 },
    { id: 'win_20', name: '常胜将军', desc: '累计赢20局', icon: '🌟', check: s => s.gamesWon >= 20 },
    { id: 'streak_3', name: '三连胜', desc: '连续赢3局', icon: '🔥', check: s => s.bestWinStreak >= 3 },
    { id: 'streak_5', name: '五连胜', desc: '连续赢5局', icon: '💥', check: s => s.bestWinStreak >= 5 },
    { id: 'streak_10', name: '十连胜', desc: '连续赢10局', icon: '🎯', check: s => s.bestWinStreak >= 10 },

    // Actions
    { id: 'first_chi', name: '顺水推舟', desc: '第一次吃牌', icon: '🍜', check: s => s.totalChi >= 1 },
    { id: 'first_peng', name: '碰碰碰', desc: '第一次碰牌', icon: '💎', check: s => s.totalPeng >= 1 },
    { id: 'first_gang', name: '开杠大吉', desc: '第一次杠牌', icon: '💰', check: s => s.totalGang >= 1 },
    { id: 'chi_10', name: '吃货', desc: '吃牌10次', icon: '🍴', check: s => s.totalChi >= 10 },
    { id: 'gang_5', name: '杠上开花', desc: '杠牌5次', icon: '🌺', check: s => s.totalGang >= 5 },

    // Special hands
    { id: 'zimo', name: '自摸达人', desc: '自摸3次', icon: '🀄', check: s => s.totalZimo >= 3 },
    { id: 'all_peng', name: '碰碰胡', desc: '赢一把碰碰胡', icon: '💫', check: s => s.allPeng >= 1 },
    { id: 'clean_hand', name: '清一色', desc: '赢一把清一色', icon: '✨', check: s => s.cleanHand >= 1 },
    { id: 'seven_pairs', name: '七对子', desc: '赢一把七对子', icon: '🎲', check: s => s.sevenPairs >= 1 },

    // Dedication
    { id: 'login_7', name: '七日之约', desc: '累计登录7天', icon: '📅', check: s => (s.loginDays?.length || 0) >= 7 },
    { id: 'login_30', name: '月光宝盒', desc: '累计登录30天', icon: '🌙', check: s => (s.loginDays?.length || 0) >= 30 },
    { id: 'login_100', name: '百日之誓', desc: '累计登录100天', icon: '💐', check: s => (s.loginDays?.length || 0) >= 100 },
    { id: 'login_365', name: '一年之约', desc: '累计登录365天', icon: '🎂', check: s => (s.loginDays?.length || 0) >= 365 },

    // Both rules
    { id: 'both_rules', name: '南北通吃', desc: '北京和四川都赢过', icon: '🗺️', check: s => s.beijingWins >= 1 && s.sichuanWins >= 1 },
  ];

  function getUnlocked() {
    try {
      const s = localStorage.getItem(ACHIEVEMENTS_KEY);
      return s ? JSON.parse(s) : [];
    } catch { return []; }
  }

  function checkAndUnlock(stats) {
    const unlocked = getUnlocked();
    const newlyUnlocked = [];
    for (const a of ACHIEVEMENT_DEFS) {
      if (!unlocked.includes(a.id) && a.check(stats)) {
        unlocked.push(a.id);
        newlyUnlocked.push(a);
      }
    }
    if (newlyUnlocked.length) {
      localStorage.setItem(ACHIEVEMENTS_KEY, JSON.stringify(unlocked));
    }
    return newlyUnlocked;
  }

  // ╔═══════════════════════════════════════════════════════════╗
  // ║  PUBLIC API                                              ║
  // ╚═══════════════════════════════════════════════════════════╝

  return {
    // Record a login/play session
    recordLogin() {
      const stats = load();
      const d = today();
      if (!stats.firstPlayDate) stats.firstPlayDate = d;
      stats.lastPlayDate = d;
      if (!stats.loginDays) stats.loginDays = [];
      if (!stats.loginDays.includes(d)) stats.loginDays.push(d);
      if (!stats.dailyGames) stats.dailyGames = {};
      save(stats);
    },

    // Record game start
    recordGameStart() {
      const stats = load();
      stats.gamesPlayed++;
      const d = today();
      stats.dailyGames[d] = (stats.dailyGames[d] || 0) + 1;
      save(stats);
      return this.checkAchievements();
    },

    // Record a win
    recordWin(ruleSet, score, handType) {
      const stats = load();
      stats.gamesWon++;
      stats.totalHu++;
      stats.winStreak++;
      if (stats.winStreak > stats.bestWinStreak) stats.bestWinStreak = stats.winStreak;
      stats.totalScore += score || 0;
      if ((score || 0) > stats.highScore) stats.highScore = score;
      if (ruleSet === 'beijing') stats.beijingWins++;
      if (ruleSet === 'sichuan') stats.sichuanWins++;
      // Track special hands
      if (handType === 'zimo') stats.totalZimo++;
      if (handType === 'allPeng') stats.allPeng++;
      if (handType === 'cleanHand') stats.cleanHand++;
      if (handType === 'sevenPairs') stats.sevenPairs++;
      save(stats);
      return this.checkAchievements();
    },

    // Record a loss
    recordLoss() {
      const stats = load();
      stats.winStreak = 0;
      save(stats);
    },

    // Record actions
    recordAction(type) {
      const stats = load();
      if (type === 'chi') stats.totalChi++;
      if (type === 'peng') stats.totalPeng++;
      if (type === 'gang') stats.totalGang++;
      if (type === 'discard') stats.totalTilesDiscarded++;
      save(stats);
    },

    // Check all achievements
    checkAchievements() {
      return checkAndUnlock(load());
    },

    // Get stats for display
    getStats() { return load(); },

    // Get achievement data
    getAchievements() {
      const unlocked = getUnlocked();
      return ACHIEVEMENT_DEFS.map(a => ({
        ...a,
        unlocked: unlocked.includes(a.id),
      }));
    },

    getProgress() {
      const unlocked = getUnlocked();
      return { total: ACHIEVEMENT_DEFS.length, unlocked: unlocked.length };
    },

    // Render stats page HTML
    renderStatsHTML() {
      const s = load();
      const winRate = s.gamesPlayed ? Math.round(s.gamesWon / s.gamesPlayed * 100) : 0;
      const daysPlayed = s.loginDays?.length || 0;

      let html = '<div class="stats-grid">';
      html += this._statCard('🎮', '总局数', s.gamesPlayed);
      html += this._statCard('🏆', '胜局', s.gamesWon);
      html += this._statCard('📊', '胜率', winRate + '%');
      html += this._statCard('🔥', '最长连胜', s.bestWinStreak);
      html += this._statCard('💯', '最高分', s.highScore);
      html += this._statCard('📅', '游戏天数', daysPlayed);
      html += '</div>';

      // Achievements
      const achievements = this.getAchievements();
      const progress = this.getProgress();
      html += '<div class="achievements-header">🏅 成就 (' + progress.unlocked + '/' + progress.total + ')</div>';
      html += '<div class="achievements-grid">';
      for (const a of achievements) {
        html += '<div class="achievement-card ' + (a.unlocked ? 'unlocked' : 'locked') + '">' +
          '<div class="achievement-icon">' + (a.unlocked ? a.icon : '🔒') + '</div>' +
          '<div class="achievement-name">' + a.name + '</div>' +
          '<div class="achievement-desc">' + a.desc + '</div></div>';
      }
      html += '</div>';
      return html;
    },

    _statCard(icon, label, value) {
      return '<div class="stat-card"><div class="stat-icon">' + icon + '</div>' +
        '<div class="stat-value">' + value + '</div>' +
        '<div class="stat-label">' + label + '</div></div>';
    },
  };
})();
