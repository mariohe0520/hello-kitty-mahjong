/**
 * 麻将游戏模式
 */
const GAME_MODES = {
  // 经典模式
  classic: {
    name: '经典模式',
    desc: '传统麻将规则',
    players: 4,
    duration: '20分钟'
  },
  // 快速模式
  quick: {
    name: '闪电模式',
    desc: '3分钟一局',
    players: 4,
    duration: '3分钟'
  },
  // 练习模式
  practice: {
    name: '练习模式',
    desc: '熟悉规则',
    players: 1,
    duration: '无限'
  },
  // 挑战模式
  challenge: {
    name: '挑战模式',
    desc: '赢够10局解锁',
    players: 4,
    duration: '30分钟'
  },
  // 趣味模式
  fun: {
    name: '趣味模式',
    desc: '随机Buff/Debuff',
    players: 4,
    duration: '15分钟'
  }
};

// Buff系统
const BUFFS = {
  lucky: { name: '幸运', desc: '胡牌率+50%', duration: 2 },
  rich: { name: '财神', desc: '得分翻倍', duration: 1 },
  stone: { name: '石化', desc: '无法胡牌', duration: 1 },
  double: { name: '双倍', desc: '下局双倍积分', duration: 1 }
};

window.GAME_MODES = GAME_MODES;
window.BUFFS = BUFFS;
