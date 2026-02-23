/**
 * 麻将成就系统
 * 搞笑成就！
 */
const ACHIEVEMENTS = {
  // 基础成就
  firstWin: { name: "首胜!", desc: "第一次胡牌", icon: "🎉" },
  tenWins: { name: "十连胜!", desc: "连赢10把", icon: "🏆" },
  
  // 搞笑成就
  bigLoser: { name: "大冤种", desc: "连续点炮5次", icon: "😂" },
  luckyDog: { name: "幸运儿", desc: "3次杠上开花", icon: "🍀" },
  stoneFace: { name: "面瘫", desc: "胡牌不笑", icon: "😐" },
  showOff: { name: "嘚瑟王", desc: "每次胡牌都炫耀", icon: "😎" },
  
  // 高级成就
  mahjongMaster: { name: "雀神", desc: "累计赢100局", icon: "👑" },
  moneyKing: { name: "财神", desc: "赢100000分", icon: "💰" },
  
  // 特殊成就
  sosad: { name: "sad", desc: "输光所有分数", icon: "💸" },
  rich: { name: "一夜暴富", desc: "单局赢5000分", icon: "🤑" }
};

// 显示成就弹窗
function showAchievement(id) {
  const ach = ACHIEVEMENTS[id];
  if (!ach) return;
  
  // 创建弹窗
  const popup = document.createElement('div');
  popup.className = 'achievement-popup';
  popup.innerHTML = `
    <div class="achievement-icon">${ach.icon}</div>
    <div class="achievement-name">${ach.name}</div>
    <div class="achievement-desc">${ach.desc}</div>
  `;
  
  // 添加样式
  popup.style.cssText = `
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: linear-gradient(135deg, #ff6b6b, #feca57);
    border-radius: 20px;
    padding: 30px;
    text-align: center;
    z-index: 10000;
    animation: achievementPop 2s ease-out forwards;
    box-shadow: 0 10px 30px rgba(0,0,0,0.3);
  `;
  
  document.body.appendChild(popup);
  
  // 2秒后移除
  setTimeout(() => popup.remove(), 2000);
  
  // 播放音效
  playAchievementSound();
}

// 成就音效
function playAchievementSound() {
  // 使用Web Audio API播放简单音效
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    osc.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
    osc.frequency.setValueAtTime(659.25, ctx.currentTime + 0.1); // E5
    osc.frequency.setValueAtTime(783.99, ctx.currentTime + 0.2); // G5
    
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
    
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.5);
  } catch(e) {}
}

// 导出
window.Achievements = {
  show: showAchievement,
  list: ACHIEVEMENTS
};

console.log("🏆 成就系统已加载!");
