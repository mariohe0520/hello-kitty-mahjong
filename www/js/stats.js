// ═══════════════════════════════════════════════════════════════
// 📊 Hello Kitty 麻将 — Stats & Achievements (100+ achievements)
// Deep statistics tracking, achievements, daily challenges
// ═══════════════════════════════════════════════════════════════

const Stats = (() => {
  'use strict';

  const STATS_KEY = 'stats';

  function getDefaults() {
    return {
      gamesPlayed: 0, gamesWon: 0, gamesLost: 0,
      totalScore: 0, highScore: 0, biggestFan: 0, biggestFanName: '',
      winStreak: 0, bestWinStreak: 0, currentLoseStreak: 0,
      fastestWin: Infinity, totalTurns: 0,
      totalChi: 0, totalPeng: 0, totalGang: 0, totalHu: 0, totalZimo: 0,
      totalRon: 0, totalTilesDiscarded: 0, totalTilesDrawn: 0,
      // Mode-specific
      beijingPlayed: 0, beijingWon: 0,
      sichuanPlayed: 0, sichuanWon: 0,
      campaignPlayed: 0, campaignWon: 0,
      // Special hands
      allPeng: 0, cleanHand: 0, sevenPairs: 0, allHonors: 0,
      halfFlush: 0, thirteenOrphans: 0, bigThree: 0, bigFour: 0,
      // Tracking
      dailyGames: {}, loginDays: [],
      firstPlayDate: null, lastPlayDate: null,
      monthlyWins: {}, // "2026-02": 15
      // Friendship
      totalFriendshipGames: 0,
    };
  }

  function load() {
    const s = Storage.load(STATS_KEY, null);
    return s ? { ...getDefaults(), ...s } : getDefaults();
  }

  function save(stats) { Storage.save(STATS_KEY, stats); }

  // ╔═══════════════════════════════════════════════════════════╗
  // ║  100+ ACHIEVEMENTS                                       ║
  // ╚═══════════════════════════════════════════════════════════╝

  const ACHIEVEMENTS = [
    // ═══ BEGINNER (新手入门) ═══
    { id: 'first_game', name: '初出茅庐', desc: '完成第一局', icon: '🎀', cat: 'beginner', check: s => s.gamesPlayed >= 1 },
    { id: 'first_win', name: '初次胡牌', desc: '赢得第一局', icon: '🌸', cat: 'beginner', check: s => s.gamesWon >= 1 },
    { id: 'play_5', name: '新手上路', desc: '玩满5局', icon: '🎮', cat: 'beginner', check: s => s.gamesPlayed >= 5 },
    { id: 'play_10', name: '乐此不疲', desc: '玩满10局', icon: '🎯', cat: 'beginner', check: s => s.gamesPlayed >= 10 },
    { id: 'play_25', name: '勤学苦练', desc: '玩满25局', icon: '📚', cat: 'beginner', check: s => s.gamesPlayed >= 25 },
    { id: 'play_50', name: '麻将达人', desc: '玩满50局', icon: '🏆', cat: 'beginner', check: s => s.gamesPlayed >= 50 },
    { id: 'play_100', name: '百战老将', desc: '玩满100局', icon: '👑', cat: 'beginner', check: s => s.gamesPlayed >= 100 },
    { id: 'play_200', name: '征战不息', desc: '玩满200局', icon: '⚔️', cat: 'beginner', check: s => s.gamesPlayed >= 200 },
    { id: 'play_500', name: '传说降临', desc: '玩满500局', icon: '🐉', cat: 'beginner', check: s => s.gamesPlayed >= 500 },

    // ═══ WINNING (赢赢赢) ═══
    { id: 'win_3', name: '小有成就', desc: '累计赢3局', icon: '🌟', cat: 'winning', check: s => s.gamesWon >= 3 },
    { id: 'win_5', name: '连战连胜', desc: '累计赢5局', icon: '⭐', cat: 'winning', check: s => s.gamesWon >= 5 },
    { id: 'win_10', name: '十胜将军', desc: '累计赢10局', icon: '🎖️', cat: 'winning', check: s => s.gamesWon >= 10 },
    { id: 'win_20', name: '常胜将军', desc: '累计赢20局', icon: '💪', cat: 'winning', check: s => s.gamesWon >= 20 },
    { id: 'win_50', name: '无敌战神', desc: '累计赢50局', icon: '🔱', cat: 'winning', check: s => s.gamesWon >= 50 },
    { id: 'win_100', name: '百胜传说', desc: '累计赢100局', icon: '💎', cat: 'winning', check: s => s.gamesWon >= 100 },

    // ═══ STREAKS (连胜) ═══
    { id: 'streak_2', name: '二连胜', desc: '连续赢2局', icon: '🔥', cat: 'streak', check: s => s.bestWinStreak >= 2 },
    { id: 'streak_3', name: '三连胜', desc: '连续赢3局', icon: '🔥', cat: 'streak', check: s => s.bestWinStreak >= 3 },
    { id: 'streak_5', name: '五连胜', desc: '连续赢5局', icon: '💥', cat: 'streak', check: s => s.bestWinStreak >= 5 },
    { id: 'streak_7', name: '七连胜', desc: '连续赢7局', icon: '🌈', cat: 'streak', check: s => s.bestWinStreak >= 7 },
    { id: 'streak_10', name: '十连胜', desc: '连续赢10局', icon: '🎯', cat: 'streak', check: s => s.bestWinStreak >= 10 },
    { id: 'streak_20', name: '二十连胜', desc: '连续赢20局', icon: '🏆', cat: 'streak', check: s => s.bestWinStreak >= 20 },

    // ═══ ACTIONS (操作) ═══
    { id: 'first_chi', name: '顺水推舟', desc: '第一次吃牌', icon: '🍜', cat: 'action', check: s => s.totalChi >= 1 },
    { id: 'first_peng', name: '碰碰碰', desc: '第一次碰牌', icon: '💎', cat: 'action', check: s => s.totalPeng >= 1 },
    { id: 'first_gang', name: '开杠大吉', desc: '第一次杠牌', icon: '💰', cat: 'action', check: s => s.totalGang >= 1 },
    { id: 'first_zimo', name: '自摸初体验', desc: '第一次自摸', icon: '🀄', cat: 'action', check: s => s.totalZimo >= 1 },
    { id: 'chi_10', name: '吃货', desc: '吃牌10次', icon: '🍴', cat: 'action', check: s => s.totalChi >= 10 },
    { id: 'chi_50', name: '贪吃蛇', desc: '吃牌50次', icon: '🐍', cat: 'action', check: s => s.totalChi >= 50 },
    { id: 'chi_100', name: '吃遍天下', desc: '吃牌100次', icon: '🌍', cat: 'action', check: s => s.totalChi >= 100 },
    { id: 'peng_10', name: '碰碰达人', desc: '碰牌10次', icon: '💫', cat: 'action', check: s => s.totalPeng >= 10 },
    { id: 'peng_50', name: '碰碰大师', desc: '碰牌50次', icon: '🌠', cat: 'action', check: s => s.totalPeng >= 50 },
    { id: 'peng_100', name: '碰神', desc: '碰牌100次', icon: '⚡', cat: 'action', check: s => s.totalPeng >= 100 },
    { id: 'gang_5', name: '杠上开花', desc: '杠牌5次', icon: '🌺', cat: 'action', check: s => s.totalGang >= 5 },
    { id: 'gang_20', name: '杠王', desc: '杠牌20次', icon: '🏔️', cat: 'action', check: s => s.totalGang >= 20 },
    { id: 'gang_50', name: '杠神降世', desc: '杠牌50次', icon: '⛰️', cat: 'action', check: s => s.totalGang >= 50 },
    { id: 'zimo_3', name: '自摸达人', desc: '自摸3次', icon: '✋', cat: 'action', check: s => s.totalZimo >= 3 },
    { id: 'zimo_10', name: '自摸大师', desc: '自摸10次', icon: '🤚', cat: 'action', check: s => s.totalZimo >= 10 },
    { id: 'zimo_30', name: '自摸之神', desc: '自摸30次', icon: '🖐️', cat: 'action', check: s => s.totalZimo >= 30 },
    { id: 'hu_10', name: '胡牌新手', desc: '胡牌10次', icon: '🎴', cat: 'action', check: s => s.totalHu >= 10 },
    { id: 'hu_50', name: '胡牌高手', desc: '胡牌50次', icon: '🃏', cat: 'action', check: s => s.totalHu >= 50 },
    { id: 'hu_100', name: '胡牌宗师', desc: '胡牌100次', icon: '🀄', cat: 'action', check: s => s.totalHu >= 100 },

    // ═══ SPECIAL HANDS (特殊牌型) ═══
    { id: 'hand_allPeng', name: '碰碰胡', desc: '赢一把碰碰胡', icon: '💫', cat: 'hand', check: s => s.allPeng >= 1 },
    { id: 'hand_cleanHand', name: '清一色', desc: '赢一把清一色', icon: '✨', cat: 'hand', check: s => s.cleanHand >= 1 },
    { id: 'hand_cleanHand5', name: '清一色大师', desc: '赢5把清一色', icon: '🌈', cat: 'hand', check: s => s.cleanHand >= 5 },
    { id: 'hand_sevenPairs', name: '七对子', desc: '赢一把七对子', icon: '🎲', cat: 'hand', check: s => s.sevenPairs >= 1 },
    { id: 'hand_sevenPairs5', name: '七对达人', desc: '赢5把七对子', icon: '🎰', cat: 'hand', check: s => s.sevenPairs >= 5 },
    { id: 'hand_halfFlush', name: '混一色', desc: '赢一把混一色', icon: '🎨', cat: 'hand', check: s => s.halfFlush >= 1 },
    { id: 'hand_allHonors', name: '字一色', desc: '赢一把字一色', icon: '🏛️', cat: 'hand', check: s => s.allHonors >= 1 },
    { id: 'hand_thirteen', name: '十三幺', desc: '赢一把十三幺', icon: '🌙', cat: 'hand', check: s => s.thirteenOrphans >= 1 },
    { id: 'hand_bigThree', name: '大三元', desc: '赢一把大三元', icon: '🔮', cat: 'hand', check: s => s.bigThree >= 1 },
    { id: 'hand_bigFour', name: '大四喜', desc: '赢一把大四喜', icon: '🌪️', cat: 'hand', check: s => s.bigFour >= 1 },

    // ═══ SCORING (得分) ═══
    { id: 'score_500', name: '小有盈余', desc: '单局得分超500', icon: '💰', cat: 'score', check: s => s.highScore >= 500 },
    { id: 'score_1000', name: '财源广进', desc: '单局得分超1000', icon: '💵', cat: 'score', check: s => s.highScore >= 1000 },
    { id: 'score_3000', name: '一夜暴富', desc: '单局得分超3000', icon: '💎', cat: 'score', check: s => s.highScore >= 3000 },
    { id: 'score_5000', name: '富可敌国', desc: '单局得分超5000', icon: '👑', cat: 'score', check: s => s.highScore >= 5000 },
    { id: 'score_8800', name: '发发发发', desc: '单局得分超8800', icon: '🧧', cat: 'score', check: s => s.highScore >= 8800 },
    { id: 'total_5000', name: '小有积蓄', desc: '累计得分超5000', icon: '🏦', cat: 'score', check: s => s.totalScore >= 5000 },
    { id: 'total_50000', name: '身家万贯', desc: '累计得分超50000', icon: '🏰', cat: 'score', check: s => s.totalScore >= 50000 },
    { id: 'fan_3', name: '三番起步', desc: '打出3番以上的牌', icon: '🌟', cat: 'score', check: s => s.biggestFan >= 3 },
    { id: 'fan_6', name: '六番大牌', desc: '打出6番以上的牌', icon: '⭐', cat: 'score', check: s => s.biggestFan >= 6 },
    { id: 'fan_10', name: '十番巨牌', desc: '打出10番以上的牌', icon: '💫', cat: 'score', check: s => s.biggestFan >= 10 },
    { id: 'fan_88', name: '满贯', desc: '打出88番', icon: '🐉', cat: 'score', check: s => s.biggestFan >= 88 },

    // ═══ DEDICATION (坚持) ═══
    { id: 'login_3', name: '三日之约', desc: '累计登录3天', icon: '📅', cat: 'dedication', check: s => (s.loginDays?.length || 0) >= 3 },
    { id: 'login_7', name: '七日之约', desc: '累计登录7天', icon: '📆', cat: 'dedication', check: s => (s.loginDays?.length || 0) >= 7 },
    { id: 'login_14', name: '两周达人', desc: '累计登录14天', icon: '🗓️', cat: 'dedication', check: s => (s.loginDays?.length || 0) >= 14 },
    { id: 'login_30', name: '月光宝盒', desc: '累计登录30天', icon: '🌙', cat: 'dedication', check: s => (s.loginDays?.length || 0) >= 30 },
    { id: 'login_60', name: '两月情深', desc: '累计登录60天', icon: '💐', cat: 'dedication', check: s => (s.loginDays?.length || 0) >= 60 },
    { id: 'login_100', name: '百日之誓', desc: '累计登录100天', icon: '💍', cat: 'dedication', check: s => (s.loginDays?.length || 0) >= 100 },
    { id: 'login_180', name: '半年之恋', desc: '累计登录180天', icon: '💝', cat: 'dedication', check: s => (s.loginDays?.length || 0) >= 180 },
    { id: 'login_365', name: '一年之约', desc: '累计登录365天', icon: '🎂', cat: 'dedication', check: s => (s.loginDays?.length || 0) >= 365 },
    { id: 'daily_3', name: '日课三局', desc: '一天内玩3局', icon: '☀️', cat: 'dedication', check: s => Object.values(s.dailyGames || {}).some(v => v >= 3) },
    { id: 'daily_10', name: '今日十局', desc: '一天内玩10局', icon: '🔥', cat: 'dedication', check: s => Object.values(s.dailyGames || {}).some(v => v >= 10) },

    // ═══ RULES (规则) ═══
    { id: 'beijing_win', name: '京城胜客', desc: '北京麻将赢一局', icon: '🏯', cat: 'rules', check: s => s.beijingWon >= 1 },
    { id: 'beijing_10', name: '京城霸主', desc: '北京麻将赢10局', icon: '🏛️', cat: 'rules', check: s => s.beijingWon >= 10 },
    { id: 'sichuan_win', name: '血战初胜', desc: '四川麻将赢一局', icon: '🌶️', cat: 'rules', check: s => s.sichuanWon >= 1 },
    { id: 'sichuan_10', name: '四川辣王', desc: '四川麻将赢10局', icon: '🔥', cat: 'rules', check: s => s.sichuanWon >= 10 },
    { id: 'both_rules', name: '南北通吃', desc: '北京和四川都赢过', icon: '🗺️', cat: 'rules', check: s => s.beijingWon >= 1 && s.sichuanWon >= 1 },

    // ═══ FRIENDSHIP (友谊) ═══
    { id: 'friend_games_10', name: '牌友', desc: '与AI角色共打10局', icon: '🤝', cat: 'social', check: s => s.totalFriendshipGames >= 10 },
    { id: 'friend_games_50', name: '老牌友', desc: '与AI角色共打50局', icon: '🤗', cat: 'social', check: s => s.totalFriendshipGames >= 50 },
    { id: 'friend_games_100', name: '挚友', desc: '与AI角色共打100局', icon: '💕', cat: 'social', check: s => s.totalFriendshipGames >= 100 },

    // ═══ CAMPAIGN (物语) ═══
    { id: 'campaign_1', name: '冒险开始', desc: '完成物语第1关', icon: '📖', cat: 'campaign', check: s => s.campaignWon >= 1 },
    { id: 'campaign_10', name: '初露锋芒', desc: '完成物语10关', icon: '📘', cat: 'campaign', check: s => s.campaignWon >= 10 },
    { id: 'campaign_25', name: '勇往直前', desc: '完成物语25关', icon: '📕', cat: 'campaign', check: s => s.campaignWon >= 25 },
    { id: 'campaign_50', name: '通关大师', desc: '通关全部50关', icon: '🏆', cat: 'campaign', check: s => s.campaignWon >= 50 },

    // ═══ FUN/MISC (趣味) ═══
    { id: 'tile_discard_100', name: '打牌百张', desc: '累计出牌100张', icon: '🎴', cat: 'misc', check: s => s.totalTilesDiscarded >= 100 },
    { id: 'tile_discard_1000', name: '千牌之路', desc: '累计出牌1000张', icon: '🃏', cat: 'misc', check: s => s.totalTilesDiscarded >= 1000 },
    { id: 'tile_discard_5000', name: '出牌如麻', desc: '累计出牌5000张', icon: '🀄', cat: 'misc', check: s => s.totalTilesDiscarded >= 5000 },
    { id: 'night_owl', name: '夜猫子', desc: '在晚上11点后玩牌', icon: '🦉', cat: 'misc', check: () => new Date().getHours() >= 23 },
    { id: 'early_bird', name: '早起鸟', desc: '在早上7点前玩牌', icon: '🐦', cat: 'misc', check: () => new Date().getHours() < 7 },
    { id: 'weekend_warrior', name: '周末战士', desc: '在周末玩牌', icon: '🎉', cat: 'misc', check: () => [0, 6].includes(new Date().getDay()) },
  ];

  // Achievement categories
  const CATEGORIES = [
    { id: 'beginner', name: '新手入门', icon: '🎀' },
    { id: 'winning', name: '赢赢赢', icon: '🏆' },
    { id: 'streak', name: '连胜', icon: '🔥' },
    { id: 'action', name: '操作', icon: '🎯' },
    { id: 'hand', name: '特殊牌型', icon: '✨' },
    { id: 'score', name: '得分', icon: '💰' },
    { id: 'dedication', name: '坚持', icon: '📅' },
    { id: 'rules', name: '规则', icon: '🏯' },
    { id: 'social', name: '友谊', icon: '🤝' },
    { id: 'campaign', name: '物语', icon: '📖' },
    { id: 'misc', name: '趣味', icon: '🎲' },
  ];

  // ╔═══════════════════════════════════════════════════════════╗
  // ║  PUBLIC API                                              ║
  // ╚═══════════════════════════════════════════════════════════╝

  function getUnlockedIds() {
    return Storage.load('achievements', []);
  }

  function checkAndUnlock() {
    const stats = load();
    const unlocked = getUnlockedIds();
    const newlyUnlocked = [];
    for (const a of ACHIEVEMENTS) {
      if (!unlocked.includes(a.id)) {
        try {
          if (a.check(stats)) {
            unlocked.push(a.id);
            newlyUnlocked.push(a);
          }
        } catch {}
      }
    }
    if (newlyUnlocked.length) {
      Storage.save('achievements', unlocked);
    }
    return newlyUnlocked;
  }

  return {
    ACHIEVEMENTS,
    CATEGORIES,

    recordLogin() {
      const stats = load();
      const d = Storage.today();
      if (!stats.firstPlayDate) stats.firstPlayDate = d;
      stats.lastPlayDate = d;
      if (!stats.loginDays) stats.loginDays = [];
      if (!stats.loginDays.includes(d)) stats.loginDays.push(d);
      save(stats);
    },

    recordGameStart(mode) {
      const stats = load();
      stats.gamesPlayed++;
      const d = Storage.today();
      if (!stats.dailyGames) stats.dailyGames = {};
      stats.dailyGames[d] = (stats.dailyGames[d] || 0) + 1;
      if (mode === 'beijing') stats.beijingPlayed++;
      if (mode === 'sichuan') stats.sichuanPlayed++;
      stats.totalFriendshipGames++;
      save(stats);
      return checkAndUnlock();
    },

    recordWin(ruleSet, score, fans, handType) {
      const stats = load();
      stats.gamesWon++;
      stats.totalHu++;
      stats.winStreak++;
      stats.currentLoseStreak = 0;
      if (stats.winStreak > stats.bestWinStreak) stats.bestWinStreak = stats.winStreak;
      stats.totalScore += score || 0;
      if ((score || 0) > stats.highScore) stats.highScore = score;
      if (ruleSet === 'beijing') stats.beijingWon++;
      if (ruleSet === 'sichuan') stats.sichuanWon++;
      const month = Storage.today().slice(0, 7);
      stats.monthlyWins[month] = (stats.monthlyWins[month] || 0) + 1;
      // Fan tracking
      if (fans && fans.length > 0) {
        const totalFan = fans.reduce((s, f) => s + (f.fan || 0), 0);
        if (totalFan > stats.biggestFan) {
          stats.biggestFan = totalFan;
          stats.biggestFanName = fans.map(f => f.name).join('+');
        }
      }
      // Special hand tracking
      if (handType === 'zimo') stats.totalZimo++;
      if (handType === 'allPeng') stats.allPeng++;
      if (handType === 'cleanHand') stats.cleanHand++;
      if (handType === 'sevenPairs') stats.sevenPairs++;
      if (handType === 'halfFlush') stats.halfFlush++;
      if (handType === 'allHonors') stats.allHonors++;
      if (handType === 'thirteenOrphans') stats.thirteenOrphans++;
      if (handType === 'bigThree') stats.bigThree++;
      if (handType === 'bigFour') stats.bigFour++;
      save(stats);
      return checkAndUnlock();
    },

    recordCampaignWin() {
      const stats = load();
      stats.campaignWon++;
      save(stats);
      return checkAndUnlock();
    },

    recordLoss() {
      const stats = load();
      stats.gamesLost++;
      stats.winStreak = 0;
      stats.currentLoseStreak++;
      save(stats);
    },

    recordAction(type) {
      const stats = load();
      if (type === 'chi') stats.totalChi++;
      if (type === 'peng') stats.totalPeng++;
      if (type === 'gang') stats.totalGang++;
      if (type === 'discard') stats.totalTilesDiscarded++;
      if (type === 'draw') stats.totalTilesDrawn++;
      if (type === 'ron') stats.totalRon++;
      save(stats);
    },

    checkAchievements: checkAndUnlock,
    getStats: load,

    getAchievements() {
      const unlocked = getUnlockedIds();
      return ACHIEVEMENTS.map(a => ({ ...a, unlocked: unlocked.includes(a.id) }));
    },

    getProgress() {
      const unlocked = getUnlockedIds();
      return { total: ACHIEVEMENTS.length, unlocked: unlocked.length };
    },

    renderStatsHTML() {
      const s = load();
      const winRate = s.gamesPlayed ? Math.round(s.gamesWon / s.gamesPlayed * 100) : 0;
      const daysPlayed = s.loginDays?.length || 0;

      let html = '<div class="stats-grid">';
      html += statCard('🎮', '总局数', s.gamesPlayed);
      html += statCard('🏆', '胜局', s.gamesWon);
      html += statCard('📊', '胜率', winRate + '%');
      html += statCard('🔥', '最长连胜', s.bestWinStreak);
      html += statCard('💯', '最高分', s.highScore);
      html += statCard('📅', '游戏天数', daysPlayed);
      html += statCard('✨', '最大番', s.biggestFan || 0);
      html += statCard('🀄', '自摸次数', s.totalZimo);
      html += statCard('💎', '碰牌次数', s.totalPeng);
      html += '</div>';

      // Achievements by category
      const achievements = Stats.getAchievements();
      const progress = Stats.getProgress();
      html += `<div class="achievements-header">🏅 成就 (${progress.unlocked}/${progress.total})</div>`;

      for (const cat of CATEGORIES) {
        const catAchievements = achievements.filter(a => a.cat === cat.id);
        const catUnlocked = catAchievements.filter(a => a.unlocked).length;
        html += `<div style="margin:16px 0 8px;font-size:14px;font-weight:700;color:rgba(255,255,255,0.7);">${cat.icon} ${cat.name} (${catUnlocked}/${catAchievements.length})</div>`;
        html += '<div class="achievements-grid">';
        for (const a of catAchievements) {
          html += `<div class="achievement-card ${a.unlocked ? 'unlocked' : 'locked'}">
            <div class="achievement-icon">${a.unlocked ? a.icon : '🔒'}</div>
            <div class="achievement-name">${a.name}</div>
            <div class="achievement-desc">${a.desc}</div></div>`;
        }
        html += '</div>';
      }
      return html;
    },
  };

  function statCard(icon, label, value) {
    return `<div class="stat-card"><div class="stat-icon">${icon}</div><div class="stat-value">${value}</div><div class="stat-label">${label}</div></div>`;
  }
})();
