/**
 * 排行榜和每日奖励系统
 */
const DAILY_REWARDS = [
  { day: 1, coins: 100, item: '随机皮肤' },
  { day: 2, coins: 200, item: '100金币' },
  { day: 3, coins: 300, item: '头像框' },
  { day: 4, coins: 400, item: '200金币' },
  { day: 5, coins: 500, item: '限定表情' },
  { day: 6, coins: 600, item: '500金币' },
  { day: 7, coins: 1000, item: '传说皮肤' }
];

const LEADERBOARD = {
  // 模拟排行榜数据
  getTopPlayers: () => {
    return [
      { name: '雀神小明', score: 99999, wins: 666 },
      { name: '欧皇附体', score: 88888, wins: 555 },
      { name: '非酋本酋', score: 77777, wins: 444 },
      { name: '运气选手', score: 66666, wins: 333 },
      { name: '快乐麻将', score: 55555, wins: 222 }
    ];
  }
};

// 领取每日奖励
function claimDailyReward(playerId) {
  const lastClaim = localStorage.getItem('lastDailyClaim');
  const today = new Date().toDateString();
  
  if (lastClaim === today) {
    return { success: false, message: '今日已领取' };
  }
  
  const streak = parseInt(localStorage.getItem('dailyStreak') || '0');
  const reward = DAILY_REWARDS[streak % 7];
  
  localStorage.setItem('lastDailyClaim', today);
  localStorage.setItem('dailyStreak', streak + 1);
  
  return { success: true, reward };
}

window.DAILY_REWARDS = DAILY_REWARDS;
window.LEADERBOARD = LEADERBOARD;
window.claimDailyReward = claimDailyReward;
