/**
 * 麻将搞笑增强
 * 目标: 够搞笑！
 */

// 搞笑语音配置
const FUNNY_VOICES = {
  // 胡牌时的搞笑语音
  hu: [
    "我胡了！快给我钱！",
    "哈哈哈我又赢了！",
    "不好意思，又是我赢啦！",
    "这牌太好了忍不住笑出声！"
  ],
  // 摸牌
  draw: [
    "这张牌...嗯...",
    "让我想想怎么打",
    "这张牌有点东西",
    "哦豁～"
  ],
  // 打牌
  discard: [
    "打这张！",
    "不要了不要了",
    "这牌没用",
    "走你！"
  ],
  // 碰
  pong: [
    "碰！我要碰！",
    "碰碰碰！",
    "嘿嘿被我抓到了吧！"
  ],
  // 杠
  kong: [
    "杠！杠上开花！",
    "四级台风！",
    "不好意思我要杠！"
  ],
  // 点炮
  dotPong: [
    "哎呀不好意思！",
    "sorry啦～",
    "这张牌...哈哈",
    "我的我的！"
  ]
};

// 搞笑表情
const FUNNY_FACES = {
  happy: ["😄", "🥳", "🎉", "😎", "🤩"],
  thinking: ["🤔", "😣", "💭", "🧐"],
  sad: ["😢", "😭", "😤", "🥺"],
  surprised: ["😱", "🙀", "🤯", "😳"],
  winning: ["🏆", "👑", "💰", "🎊"]
};

// 随机选择
function randomFrom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

// 播放搞笑语音
function playFunnyVoice(type) {
  const voices = FUNNY_VOICES[type] || FUNNY_VOICES.hu;
  const text = randomFrom(voices);
  
  // 使用macOS say
  const { exec } = require('child_process');
  const voice = type === 'hu' ? 'Ting-Ting' : 'Mei-Jia';
  exec(`say -v ${voice} "${text}"`, (err) => {
    if (err) console.error('语音播放失败:', err);
  });
  
  // 显示表情
  showFunnyFace(type);
}

// 显示搞笑表情
function showFunnyFace(type) {
  const faces = FUNNY_FACES.happy || ["😄"];
  const face = randomFrom(faces);
  
  // 创建临时表情元素
  const el = document.createElement('div');
  el.innerHTML = face;
  el.style.cssText = `
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%) scale(0);
    font-size: 100px;
    z-index: 9999;
    animation: facePopup 1s ease-out forwards;
    pointer-events: none;
  `;
  
  document.body.appendChild(el);
  
  setTimeout(() => el.remove(), 1000);
}

// 添加CSS动画
const style = document.createElement('style');
style.textContent = `
  @keyframes facePopup {
    0% { transform: translate(-50%, -50%) scale(0); opacity: 0; }
    50% { transform: translate(-50%, -50%) scale(1.5); opacity: 1; }
    100% { transform: translate(-50%, -50%) scale(2); opacity: 0; }
  }
  
  @keyframes funnyBounce {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-20px) rotate(5deg); }
  }
  
  .funny-player {
    animation: funnyBounce 0.5s ease-in-out infinite;
  }
`;
document.head.appendChild(style);

// 导出
window.MahjongFunny = {
  playVoice: playFunnyVoice,
  showFace: showFunnyFace,
  voices: FUNNY_VOICES
};

console.log("🎉 麻将搞笑增强已加载!");
