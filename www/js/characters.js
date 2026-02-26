// ═══════════════════════════════════════════════════════════════
// 🎭 Hello Kitty 麻将 — Character System
// 4 AI opponents with unique personalities, dialogue, emotions
// ═══════════════════════════════════════════════════════════════

const Characters = (() => {
  'use strict';

  // ╔═══════════════════════════════════════════════════════════╗
  // ║  CHARACTER DEFINITIONS                                   ║
  // ╚═══════════════════════════════════════════════════════════╝

  const CHARACTERS = {
    kitty: {
      id: 'kitty',
      name: '凯蒂',
      emoji: '🐱',
      color: '#ff6b9d',
      colorLight: '#fff0f5',
      personality: 'friendly',
      style: 'balanced',
      desc: '温柔可爱，总是鼓励你',
      unlockCondition: null, // starter
      aiProfile: { aggression: 0.5, gangRate: 0.7, chiRate: 0.8, bluffRate: 0.05, riskTolerance: 0.5 },
      emotions: {
        idle: '😊', happy: '😄', excited: '🥳', nervous: '😰',
        angry: '😤', smug: '😏', sad: '😢', thinking: '🤔',
      },
      dialogue: {
        gameStart: ['一起来打麻将吧～', '今天运气一定很好！', '加油哦！💕'],
        draw: ['嗯...摸到什么了呢？', '让我看看～'],
        discard: ['这张不要了～', '打掉这个吧'],
        chi: ['吃！谢谢啦～', '正好需要这个！'],
        peng: ['碰！运气不错呢～', '碰碰碰！'],
        gang: ['杠！好开心！', '杠！这运气太好了吧～'],
        hu: ['胡啦！🎉', '耶！赢了赢了！', '好开心～胡牌啦！'],
        tsumo: ['自摸！运气爆棚！✨', '哇，自摸了！'],
        win: ['太开心了！再来一局吧？', '赢了好高兴～🌸'],
        lose: ['没关系，下局再努力！', '好可惜...不过很好玩！'],
        hint: ['要不要试试打这张？', '这张牌可能比较安全哦～', '小心，对面可能在听牌'],
        idle_chat: ['天气真好呢～', '最喜欢和你一起打牌了', '你今天看起来气色很好！'],
        nervous: ['呜...好紧张...', '对面好厉害...', '怎么办怎么办...'],
        taunt: ['嘻嘻，我要赢了哦～', '再加把劲！'],
        encourage: ['你打得很好！', '这手牌不错哦！', '别放弃，还有机会！'],
        react_others_hu: ['恭喜恭喜！', '好厉害！'],
        react_riichi: ['好紧张！他们要听牌了！'],
        friendship_up: ['和你越来越默契了呢～', '好开心，我们的友谊加深了！'],
      },
    },

    bear: {
      id: 'bear',
      name: '大熊',
      emoji: '🐻',
      color: '#8B4513',
      colorLight: '#FFF5EE',
      personality: 'aggressive',
      style: 'power',
      desc: '霸气豪爽，追求大牌',
      unlockCondition: null, // starter
      aiProfile: { aggression: 0.85, gangRate: 0.95, chiRate: 0.5, bluffRate: 0.2, riskTolerance: 0.8 },
      emotions: {
        idle: '😐', happy: '😁', excited: '🤩', nervous: '😨',
        angry: '😡', smug: '😤', sad: '😞', thinking: '🧐',
      },
      dialogue: {
        gameStart: ['来吧！今天不留情面！', '大牌大牌！给我来大牌！', '哼，看我的！'],
        draw: ['嗯！', '来了！'],
        discard: ['不要！', '垃圾牌！'],
        chi: ['吃了！', '这个归我！'],
        peng: ['碰！哈哈！', '碰！接着来！'],
        gang: ['杠！太爽了！💪', '杠！这才是麻将！', '杠杠杠！'],
        hu: ['胡了！哈哈哈！', '看到了吗？这就是实力！', '大牌！通吃！'],
        tsumo: ['自摸！三家都给钱！', '自摸大牌！爽！'],
        win: ['认输吧！哈哈！', '赢了！今天手气真好！'],
        lose: ['可恶...下次一定赢！', '哼！再来！', '手气太差了...'],
        hint: null, // Bear doesn't give hints
        idle_chat: ['快点打牌！别磨蹭！', '想什么呢？该你了！'],
        nervous: ['不会吧...要输了？', '这...有点危险...'],
        taunt: ['就这？太弱了吧！', '我闭着眼都能赢你们！', '颤抖吧！'],
        encourage: null, // Bear doesn't encourage
        react_others_hu: ['切...运气好而已！', '下次不会让你赢的！'],
        react_riichi: ['来啊！谁怕谁！'],
        friendship_up: ['你还行，比我想象的强', '嗯...算你有两下子'],
      },
    },

    bunny: {
      id: 'bunny',
      name: '小兔',
      emoji: '🐰',
      color: '#9b59b6',
      colorLight: '#F5F0FF',
      personality: 'defensive',
      style: 'safe',
      desc: '害羞胆小，安全第一',
      unlockCondition: null, // starter
      aiProfile: { aggression: 0.2, gangRate: 0.4, chiRate: 0.9, bluffRate: 0.02, riskTolerance: 0.2 },
      emotions: {
        idle: '😊', happy: '☺️', excited: '😆', nervous: '😱',
        angry: '😣', smug: '🤭', sad: '🥺', thinking: '😶',
      },
      dialogue: {
        gameStart: ['好...好紧张...', '我会加油的...！', '请...请多关照...'],
        draw: ['呜...摸到了...', '这张...'],
        discard: ['打...打这个吧...', '应该安全吧...？'],
        chi: ['吃...吃了！', '可...可以吃！'],
        peng: ['碰！啊...我碰了！', '碰碰...！'],
        gang: ['杠...？我真的杠了！', '啊！杠！好意外！'],
        hu: ['我...我胡了！？真的吗！？', '啊啊啊胡了！！', '不敢相信...我赢了！'],
        tsumo: ['自...自摸了！😭', '呜呜呜，太感动了...自摸！'],
        win: ['谢谢大家...我好开心...🥺', '居然赢了...好梦幻...'],
        lose: ['呜...输了...', '果然我还是太弱了...', '对不起...我打得不好...'],
        hint: ['那张牌...好像有点危险...', '小心点...'],
        idle_chat: ['...', '今天天气不错呢...', '(默默打牌)'],
        nervous: ['好...好可怕...', '怎么办怎么办...要输了...', '呜...压力好大...'],
        taunt: null, // Bunny never taunts
        encourage: ['你...你很厉害的！', '加油...！'],
        react_others_hu: ['好...好厉害...', '恭喜...'],
        react_riichi: ['呜呜...好可怕...'],
        friendship_up: ['和你打牌...不那么紧张了呢', '谢谢你...一直对我很好'],
      },
    },

    fox: {
      id: 'fox',
      name: '狐狸',
      emoji: '🦊',
      color: '#e67e22',
      colorLight: '#FFF8F0',
      personality: 'tricky',
      style: 'deceptive',
      desc: '狡猾多变，善于伪装',
      unlockCondition: null, // starter
      aiProfile: { aggression: 0.6, gangRate: 0.6, chiRate: 0.7, bluffRate: 0.35, riskTolerance: 0.6 },
      emotions: {
        idle: '😼', happy: '😸', excited: '🤑', nervous: '😿',
        angry: '👿', smug: '😈', sad: '😾', thinking: '🤫',
      },
      dialogue: {
        gameStart: ['呵呵呵...今天的猎物看起来不错', '来吧，让我看看你的实力～', '别被我骗到了哦～'],
        draw: ['嗯～有意思', '呵呵...'],
        discard: ['这张...就送给你们吧～', '拿去吧...嘿嘿'],
        chi: ['吃～谢了', '正中下怀～'],
        peng: ['碰！计划通～', '碰！一切都在掌握中'],
        gang: ['杠！出乎意料吧？', '杠～意不意外？'],
        hu: ['胡～一切都在计划中！', '呵呵呵，胡了～', '早就知道会赢了～'],
        tsumo: ['自摸！天意如此～', '计划通！自摸～'],
        win: ['呵呵呵...你们还太嫩了', '赢了赢了～这不是很简单吗？'],
        lose: ['哼...这次是意外', '有趣...下次可不会输了', '不可能...我的计划怎么会...'],
        hint: null, // Fox doesn't help
        idle_chat: ['你在想什么呢？我看穿你了哦～', '别以为我不知道你要打什么...', '嘿嘿嘿...'],
        nervous: ['这...不在计划内...', '冷静...一定有办法...'],
        taunt: ['就这程度？太让我失望了', '你确定要打这张？嘿嘿～', '我已经看穿你的手牌了～', '怕了吧？'],
        encourage: null, // Fox never encourages
        react_others_hu: ['哼...运气好罢了', '下次可没这么简单'],
        react_riichi: ['呵...正好中了我的圈套'],
        friendship_up: ['你倒是挺有趣的...', '哼，算你有点眼力'],
      },
    },

    // ═══ UNLOCKABLE CHARACTERS ═══
    panda: {
      id: 'panda',
      name: '团团',
      emoji: '🐼',
      color: '#2c3e50',
      colorLight: '#F0F4F8',
      personality: 'wise',
      style: 'calculated',
      desc: '沉稳睿智，算牌高手',
      unlockCondition: { type: 'campaign', chapter: 3 },
      aiProfile: { aggression: 0.6, gangRate: 0.8, chiRate: 0.6, bluffRate: 0.1, riskTolerance: 0.4 },
      emotions: {
        idle: '🧘', happy: '😌', excited: '🤓', nervous: '😐',
        angry: '😑', smug: '🧐', sad: '😔', thinking: '💭',
      },
      dialogue: {
        gameStart: ['坐下来，慢慢打', '不急，打好每一手', '以静制动'],
        draw: ['嗯...', '有趣'],
        discard: ['此牌可弃', '顺其自然'],
        chi: ['承让', '借用'],
        peng: ['碰。意料之中', '碰'],
        gang: ['杠。时机到了', '杠'],
        hu: ['胡。功到自然成', '胡了。运筹帷幄'],
        tsumo: ['自摸。天道酬勤', '水到渠成，自摸'],
        win: ['胜不骄，败不馁', '棋逢对手，好局'],
        lose: ['胜败乃兵家常事', '学到了，下次再来'],
        idle_chat: ['静心观局...', '麻将如人生...'],
        nervous: ['局势有变...需要重新计算', '嗯...不太妙'],
        taunt: ['你的牌...我已经算到了', '三步之内，尘埃落定'],
        friendship_up: ['与智者同行，其乐无穷', '你进步很大'],
        hint: ['这张牌的安全系数较高', '注意对手的出牌规律'],
      },
    },

    dragon: {
      id: 'dragon',
      name: '龙王',
      emoji: '🐉',
      color: '#c0392b',
      colorLight: '#FFF0F0',
      personality: 'legendary',
      style: 'unpredictable',
      desc: '传奇高手，变幻莫测',
      unlockCondition: { type: 'campaign', chapter: 5 },
      aiProfile: { aggression: 0.7, gangRate: 0.85, chiRate: 0.75, bluffRate: 0.25, riskTolerance: 0.7 },
      emotions: {
        idle: '🐲', happy: '😎', excited: '🔥', nervous: '🌪️',
        angry: '💢', smug: '👑', sad: '🌧️', thinking: '⚡',
      },
      dialogue: {
        gameStart: ['龙行天下！', '让你们见识真正的麻将！', '准备好了吗？'],
        draw: ['命运在此', '天降好牌'],
        discard: ['去吧', '此牌无用'],
        chi: ['吃！', '龙吞之！'],
        peng: ['碰！龙怒！', '碰！'],
        gang: ['杠！天崩地裂！', '龙杠！'],
        hu: ['胡！龙腾四海！🐉', '驾！胡了！', '龙吟之声！胡！'],
        tsumo: ['自摸！龙啸九天！', '天命所归！自摸！'],
        win: ['哈哈哈！这就是传说中的龙之力！', '龙行天下，无人能挡！'],
        lose: ['有趣...居然能胜我', '下次我将全力以赴！'],
        idle_chat: ['呵...', '沧海桑田，唯有麻将永恒'],
        nervous: ['嗯...？有人能让我紧张？', '有意思...'],
        taunt: ['凡人，你在与龙对弈！', '这就是你的全部实力？'],
        friendship_up: ['你有龙的潜质', '看来你值得我认真对待'],
        hint: ['真龙不屑给提示...但看在你的份上', '注意右边那家'],
      },
    },
  };

  // ╔═══════════════════════════════════════════════════════════╗
  // ║  CHARACTER MANAGEMENT                                    ║
  // ╚═══════════════════════════════════════════════════════════╝

  function getCharacter(id) {
    return CHARACTERS[id] || CHARACTERS.kitty;
  }

  function getAllCharacters() {
    return Object.values(CHARACTERS);
  }

  function getUnlockedCharacters() {
    const unlocks = Storage.getUnlocks();
    return Object.values(CHARACTERS).filter(c =>
      unlocks.characters.includes(c.id)
    );
  }

  function isCharacterUnlocked(id) {
    return Storage.isUnlocked('characters', id);
  }

  // ─── Get random dialogue line ───
  function getDialogue(charId, event) {
    const char = CHARACTERS[charId];
    if (!char) return null;
    const lines = char.dialogue[event];
    if (!lines || lines.length === 0) return null;
    return lines[Math.floor(Math.random() * lines.length)];
  }

  // ─── Get emotion for game state ───
  function getEmotion(charId, gameState) {
    const char = CHARACTERS[charId];
    if (!char) return '😊';

    const emotions = char.emotions;

    if (gameState === 'win') return emotions.excited;
    if (gameState === 'lose') return emotions.sad;
    if (gameState === 'hu') return emotions.excited;
    if (gameState === 'nervous') return emotions.nervous;
    if (gameState === 'angry') return emotions.angry;
    if (gameState === 'smug') return emotions.smug;
    if (gameState === 'thinking') return emotions.thinking;
    if (gameState === 'happy') return emotions.happy;
    return emotions.idle;
  }

  // ─── Get friendship level info ───
  function getFriendshipInfo(charId) {
    const f = Storage.getFriendship();
    const data = f[charId] || { level: 1, exp: 0, gamesPlayed: 0 };
    const nextLevelExp = data.level * 100;
    return {
      ...data,
      nextLevelExp,
      progress: data.exp / nextLevelExp,
      title: getFriendshipTitle(data.level),
    };
  }

  function getFriendshipTitle(level) {
    if (level >= 20) return '知己';
    if (level >= 15) return '挚友';
    if (level >= 10) return '好友';
    if (level >= 7) return '朋友';
    if (level >= 5) return '熟人';
    if (level >= 3) return '相识';
    return '初识';
  }

  // ─── Render character portrait (CSS/emoji based) ───
  function renderPortrait(charId, size = 48, emotion = 'idle') {
    const char = CHARACTERS[charId];
    if (!char) return '';
    const em = char.emotions[emotion] || char.emoji;
    return `<div class="char-portrait" style="
      width:${size}px;height:${size}px;
      background:linear-gradient(135deg,${char.color}20,${char.color}40);
      border:3px solid ${char.color};
      border-radius:50%;
      display:flex;align-items:center;justify-content:center;
      font-size:${Math.round(size * 0.55)}px;
      box-shadow:0 2px 8px ${char.color}40;
      transition:transform 0.3s;
    " data-char="${charId}">${em}</div>`;
  }

  // ─── Speech bubble ───
  function renderSpeechBubble(text, charId, position = 'bottom') {
    if (!text) return '';
    const char = CHARACTERS[charId];
    const color = char?.color || '#ff6b9d';
    return `<div class="speech-bubble speech-${position}" style="
      background:rgba(255,255,255,0.95);
      border:2px solid ${color};
      border-radius:14px;
      padding:6px 12px;
      font-size:13px;
      color:#333;
      max-width:180px;
      box-shadow:0 2px 8px rgba(0,0,0,0.15);
      position:relative;
      animation:bubblePop 0.3s cubic-bezier(0.34,1.56,0.64,1);
    ">${text}</div>`;
  }

  // ─── Get default opponents for game mode ───
  function getDefaultOpponents(mode) {
    return ['fox', 'bear', 'bunny'];
  }

  // ─── Map character to AI personality config ───
  function getAIProfile(charId) {
    const char = CHARACTERS[charId];
    return char?.aiProfile || CHARACTERS.kitty.aiProfile;
  }

  return {
    CHARACTERS,
    getCharacter,
    getAllCharacters,
    getUnlockedCharacters,
    isCharacterUnlocked,
    getDialogue,
    getEmotion,
    getFriendshipInfo,
    renderPortrait,
    renderSpeechBubble,
    getDefaultOpponents,
    getAIProfile,
  };
})();
