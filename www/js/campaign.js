// ═══════════════════════════════════════════════════════════════
// 📖 Hello Kitty 麻将 — Story Campaign (麻将物语)
// 50 levels across 5 chapters with story, bosses, rewards
// ═══════════════════════════════════════════════════════════════

const Campaign = (() => {
  'use strict';

  // ╔═══════════════════════════════════════════════════════════╗
  // ║  CHAPTER DEFINITIONS                                     ║
  // ╚═══════════════════════════════════════════════════════════╝

  const CHAPTERS = [
    {
      id: 1,
      name: '北京麻将基础',
      subtitle: '初入江湖',
      icon: '🏯',
      color: '#e74c3c',
      rules: 'beijing',
      unlockStars: 0,
      desc: '从基础开始，学习北京麻将的规则和技巧',
      backgroundStory: '欢迎来到麻将学院！你是一名新生，需要从基础开始学习麻将的奥秘。凯蒂老师会指导你入门。',
    },
    {
      id: 2,
      name: '四川血战',
      subtitle: '血战到底',
      icon: '🌶️',
      color: '#ff6b6b',
      rules: 'sichuan',
      unlockStars: 15,
      desc: '学习四川麻将的血战到底规则',
      backgroundStory: '你来到了火辣的四川！这里的麻将更加刺激——血战到底，一人赢了其他人还得继续！大熊师父会教你生存之道。',
    },
    {
      id: 3,
      name: '麻将修行',
      subtitle: '进阶之路',
      icon: '⛩️',
      color: '#9b59b6',
      rules: 'beijing',
      unlockStars: 35,
      desc: '挑战更高难度，学习进阶技巧',
      backgroundStory: '经过基础训练，你来到了麻将修行殿。这里的对手更加强大，你需要学会读牌、算牌、控制节奏。',
    },
    {
      id: 4,
      name: '高手过招',
      subtitle: '巅峰对决',
      icon: '🐉',
      color: '#e67e22',
      rules: 'beijing',
      unlockStars: 60,
      desc: '与各路高手一决高下',
      backgroundStory: '你已经是一名出色的麻将手了。全国各地的高手都来挑战你，每一局都是智慧的较量！',
    },
    {
      id: 5,
      name: '锦标赛',
      subtitle: '传说之路',
      icon: '👑',
      color: '#f5c518',
      rules: 'beijing',
      unlockStars: 90,
      desc: '参加终极锦标赛，成为传奇',
      backgroundStory: '最终的锦标赛！来自各地的顶尖高手齐聚一堂。只有最强者才能站到最后，获得"麻将之王"的称号！',
    },
  ];

  // ╔═══════════════════════════════════════════════════════════╗
  // ║  LEVEL DEFINITIONS — 50 levels                           ║
  // ╚═══════════════════════════════════════════════════════════╝

  const LEVELS = [
    // ═══ Chapter 1: 北京麻将基础 (Levels 1-10) ═══
    { id: 1, chapter: 1, name: '第一课：认识麻将牌', difficulty: 1,
      desc: '赢得第一局麻将', goal: { type: 'win' }, reward: { coins: 100, exp: 50 },
      opponents: ['kitty', 'bunny', 'bunny'], aiDifficulty: 0.3,
      dialogue: { before: '凯蒂：欢迎来到麻将课堂！让我们从一局友谊赛开始吧～', after: '凯蒂：太棒了！你学得很快呢！💕' } },

    { id: 2, chapter: 1, name: '顺子的奥秘', difficulty: 1,
      desc: '用至少2个顺子胡牌', goal: { type: 'sequences', count: 2 }, reward: { coins: 120, exp: 60 },
      opponents: ['kitty', 'bunny', 'bunny'], aiDifficulty: 0.35,
      dialogue: { before: '凯蒂：记住，顺子就是连续三张同花色的牌哦！', after: '凯蒂：做得好！顺子组合很重要呢～' } },

    { id: 3, chapter: 1, name: '碰碰乐', difficulty: 1,
      desc: '在一局中碰牌至少1次并获胜', goal: { type: 'pengCount', count: 1 }, reward: { coins: 150, exp: 70 },
      opponents: ['kitty', 'bear', 'bunny'], aiDifficulty: 0.35,
      dialogue: { before: '大熊：碰！就是看到别人打的牌正好是你要的对子！来试试吧！', after: '大熊：不错不错！碰牌用得好！' } },

    { id: 4, chapter: 1, name: '第一声杠', difficulty: 2,
      desc: '完成一局游戏', goal: { type: 'win' }, reward: { coins: 150, exp: 80 },
      opponents: ['kitty', 'bear', 'bunny'], aiDifficulty: 0.4,
      dialogue: { before: '凯蒂：杠是四张相同的牌放在一起，可以额外摸一张牌哦！', after: '凯蒂：你越来越厉害了！' } },

    { id: 5, chapter: 1, name: '练习赛', difficulty: 2,
      desc: '赢得比赛', goal: { type: 'win' }, reward: { coins: 200, exp: 100 },
      opponents: ['bear', 'bunny', 'fox'], aiDifficulty: 0.4,
      dialogue: { before: '狐狸：呵呵，新来的？让我看看你有什么本事～', after: '狐狸：嗯...有点意思...' } },

    { id: 6, chapter: 1, name: '字牌之力', difficulty: 2,
      desc: '赢得比赛', goal: { type: 'win' }, reward: { coins: 200, exp: 100 },
      opponents: ['kitty', 'fox', 'bunny'], aiDifficulty: 0.45,
      dialogue: { before: '凯蒂：风牌和箭牌虽然不能组顺子，但刻子很值钱哦！', after: '凯蒂：掌握了字牌，你就更强了！' } },

    { id: 7, chapter: 1, name: '听牌的艺术', difficulty: 2,
      desc: '赢得比赛', goal: { type: 'win' }, reward: { coins: 250, exp: 120 },
      opponents: ['bear', 'fox', 'bunny'], aiDifficulty: 0.45,
      dialogue: { before: '大熊：听牌就是只差一张就能胡了！学会判断很重要！', after: '大熊：嗯！不错！' } },

    { id: 8, chapter: 1, name: '安全出牌', difficulty: 3,
      desc: '赢得比赛', goal: { type: 'win' }, reward: { coins: 250, exp: 120 },
      opponents: ['fox', 'bear', 'bunny'], aiDifficulty: 0.5,
      dialogue: { before: '小兔：那个...打牌的时候也要注意安全...不要随便点炮哦...', after: '小兔：你...你好厉害...' } },

    { id: 9, chapter: 1, name: '期中考试', difficulty: 3,
      desc: '赢得比赛', goal: { type: 'win' }, reward: { coins: 300, exp: 150 },
      opponents: ['fox', 'bear', 'kitty'], aiDifficulty: 0.55,
      dialogue: { before: '凯蒂：这是期中测验！三个同学都不会让着你哦～加油！', after: '凯蒂：通过了！你已经是合格的麻将手了！🎉' } },

    { id: 10, chapter: 1, name: '🏆 入门考核', difficulty: 4, isBoss: true,
      desc: '击败入门导师凯蒂', goal: { type: 'win' }, reward: { coins: 500, exp: 300, unlock: { type: 'theme', id: 'bamboo' } },
      opponents: ['kitty', 'kitty', 'kitty'], aiDifficulty: 0.6,
      dialogue: { before: '凯蒂：最终考核！我会认真对待的！请全力以赴吧！💪', after: '凯蒂：太出色了！你毕业了！🎓 拿好这套竹林牌面作为奖励吧～' } },

    // ═══ Chapter 2: 四川血战 (Levels 11-20) ═══
    { id: 11, chapter: 2, name: '血战初体验', difficulty: 2,
      desc: '赢得第一局四川麻将', goal: { type: 'win' }, reward: { coins: 200, exp: 100 },
      opponents: ['bear', 'bunny', 'kitty'], aiDifficulty: 0.4,
      dialogue: { before: '大熊：欢迎来到四川！这里的麻将更刺激——血战到底！', after: '大熊：好样的！适应得很快嘛！' } },

    { id: 12, chapter: 2, name: '缺一门抉择', difficulty: 2,
      desc: '赢得比赛', goal: { type: 'win' }, reward: { coins: 220, exp: 110 },
      opponents: ['bear', 'fox', 'bunny'], aiDifficulty: 0.45,
      dialogue: { before: '大熊：缺一门要选好！选你牌最少的花色去掉！', after: '大熊：选对了缺一门就赢了一半！' } },

    { id: 13, chapter: 2, name: '对对胡之路', difficulty: 3,
      desc: '赢得比赛', goal: { type: 'win' }, reward: { coins: 250, exp: 120 },
      opponents: ['bear', 'fox', 'kitty'], aiDifficulty: 0.5,
      dialogue: { before: '大熊：对对胡——全部是刻子！番数高！值得追！', after: '大熊：漂亮！对对胡很爽吧！' } },

    { id: 14, chapter: 2, name: '清一色追求', difficulty: 3,
      desc: '赢一局清一色', goal: { type: 'hand', hand: 'qingyi' }, reward: { coins: 300, exp: 150 },
      opponents: ['fox', 'bear', 'bunny'], aiDifficulty: 0.5,
      dialogue: { before: '狐狸：清一色...高风险高回报...你敢试试吗？', after: '狐狸：嗯...你的胆量值得赞赏' } },

    { id: 15, chapter: 2, name: '生存之道', difficulty: 3,
      desc: '赢得比赛', goal: { type: 'win' }, reward: { coins: 300, exp: 150 },
      opponents: ['fox', 'bear', 'kitty'], aiDifficulty: 0.55,
      dialogue: { before: '小兔：血战到底...好可怕...但我们一定能活下来的！', after: '小兔：活...活下来了！太好了！' } },

    { id: 16, chapter: 2, name: '七对之美', difficulty: 3,
      desc: '赢得比赛', goal: { type: 'win' }, reward: { coins: 350, exp: 180 },
      opponents: ['bear', 'fox', 'kitty'], aiDifficulty: 0.55,
      dialogue: { before: '凯蒂：七对子——七个对子就能胡！很特别的牌型哦～', after: '凯蒂：七对子太有成就感了！' } },

    { id: 17, chapter: 2, name: '攻守兼备', difficulty: 4,
      desc: '赢得比赛', goal: { type: 'win' }, reward: { coins: 350, exp: 180 },
      opponents: ['fox', 'bear', 'kitty'], aiDifficulty: 0.6,
      dialogue: { before: '大熊：有时候要进攻，有时候要防守！学会切换！', after: '大熊：攻守兼备，才是真正的高手！' } },

    { id: 18, chapter: 2, name: '绝地反击', difficulty: 4,
      desc: '赢得比赛', goal: { type: 'win' }, reward: { coins: 400, exp: 200 },
      opponents: ['fox', 'bear', 'kitty'], aiDifficulty: 0.6,
      dialogue: { before: '狐狸：就算牌不好，也不能放弃哦～逆转才是最精彩的！', after: '狐狸：嗯...逆转成功了...（不甘心）' } },

    { id: 19, chapter: 2, name: '四川大师赛', difficulty: 4,
      desc: '赢得比赛', goal: { type: 'win' }, reward: { coins: 400, exp: 200 },
      opponents: ['fox', 'bear', 'kitty'], aiDifficulty: 0.65,
      dialogue: { before: '大熊：四川大师赛的预赛！打起精神来！', after: '大熊：好样的！决赛见！' } },

    { id: 20, chapter: 2, name: '🏆 血战之王', difficulty: 5, isBoss: true,
      desc: '击败四川大师大熊', goal: { type: 'win' }, reward: { coins: 800, exp: 500, unlock: { type: 'theme', id: 'jade' } },
      opponents: ['bear', 'bear', 'bear'], aiDifficulty: 0.7,
      dialogue: { before: '大熊：最终决战！我不会留手的！来吧！💪🔥', after: '大熊：哈哈！你赢了！不愧是我认可的对手！拿好这套翡翠牌面！' } },

    // ═══ Chapter 3: 麻将修行 (Levels 21-30) ═══
    { id: 21, chapter: 3, name: '读牌入门', difficulty: 3,
      desc: '赢得比赛', goal: { type: 'win' }, reward: { coins: 300, exp: 150 },
      opponents: ['fox', 'bear', 'bunny'], aiDifficulty: 0.55,
      dialogue: { before: '狐狸：读牌——通过别人的出牌推测他们的手牌。这是高手必备的技能。', after: '狐狸：不错，你开始有感觉了' } },

    { id: 22, chapter: 3, name: '控制节奏', difficulty: 3,
      desc: '赢得比赛', goal: { type: 'win' }, reward: { coins: 320, exp: 160 },
      opponents: ['fox', 'kitty', 'bunny'], aiDifficulty: 0.6,
      dialogue: { before: '凯蒂：好的麻将手会控制比赛节奏，不急不躁～', after: '凯蒂：你的节奏感越来越好了！' } },

    { id: 23, chapter: 3, name: '危险牌判断', difficulty: 4,
      desc: '赢得比赛', goal: { type: 'win' }, reward: { coins: 350, exp: 180 },
      opponents: ['fox', 'bear', 'kitty'], aiDifficulty: 0.6,
      dialogue: { before: '小兔：打牌之前想想...这张牌会不会放炮...好可怕...', after: '小兔：安全...打牌了...' } },

    { id: 24, chapter: 3, name: '诱敌之计', difficulty: 4,
      desc: '赢得比赛', goal: { type: 'win' }, reward: { coins: 350, exp: 180 },
      opponents: ['fox', 'bear', 'bunny'], aiDifficulty: 0.65,
      dialogue: { before: '狐狸：有时候故意打出"安全"的牌，引诱对手放松警惕...嘿嘿', after: '狐狸：你学会我的招数了？有意思...' } },

    { id: 25, chapter: 3, name: '番数最大化', difficulty: 4,
      desc: '赢一局3番以上的牌', goal: { type: 'minFan', count: 3 }, reward: { coins: 400, exp: 200 },
      opponents: ['bear', 'fox', 'kitty'], aiDifficulty: 0.65,
      dialogue: { before: '大熊：追求大番！小番不过瘾！', after: '大熊：大番的感觉...太爽了！' } },

    { id: 26, chapter: 3, name: '逆风翻盘', difficulty: 4,
      desc: '赢得比赛', goal: { type: 'win' }, reward: { coins: 400, exp: 200 },
      opponents: ['fox', 'bear', 'kitty'], aiDifficulty: 0.65,
      dialogue: { before: '凯蒂：即使落后也别放弃，逆转的机会永远存在！', after: '凯蒂：逆转成功！你太棒了！🌟' } },

    { id: 27, chapter: 3, name: '心理战', difficulty: 5,
      desc: '赢得比赛', goal: { type: 'win' }, reward: { coins: 450, exp: 250 },
      opponents: ['fox', 'fox', 'bear'], aiDifficulty: 0.7,
      dialogue: { before: '狐狸：麻将不只是牌的游戏，更是心理的较量...', after: '狐狸：你的心理素质...我认可了' } },

    { id: 28, chapter: 3, name: '全面提升', difficulty: 5,
      desc: '赢得比赛', goal: { type: 'win' }, reward: { coins: 450, exp: 250 },
      opponents: ['fox', 'bear', 'kitty'], aiDifficulty: 0.7,
      dialogue: { before: '大熊：到了综合考验的时候了！', after: '大熊：你已经是真正的高手了！' } },

    { id: 29, chapter: 3, name: '修行毕业赛', difficulty: 5,
      desc: '赢得比赛', goal: { type: 'win' }, reward: { coins: 500, exp: 300 },
      opponents: ['fox', 'bear', 'kitty'], aiDifficulty: 0.75,
      dialogue: { before: '全体：最终修行考验开始！', after: '凯蒂：你毕业了！真正的高手！' } },

    { id: 30, chapter: 3, name: '🏆 修行大师', difficulty: 6, isBoss: true,
      desc: '击败修行大师团团', goal: { type: 'win' }, reward: { coins: 1000, exp: 600, unlock: { type: 'character', id: 'panda' } },
      opponents: ['panda', 'panda', 'panda'], aiDifficulty: 0.8,
      dialogue: { before: '团团：年轻人，我等你很久了。来，让我看看你的修为。', after: '团团：善哉...你已超越了我的期待。收下这份认可吧。' } },

    // ═══ Chapter 4: 高手过招 (Levels 31-40) ═══
    { id: 31, chapter: 4, name: '地区冠军赛', difficulty: 5, desc: '赢得比赛', goal: { type: 'win' },
      reward: { coins: 400, exp: 250 }, opponents: ['fox', 'bear', 'panda'], aiDifficulty: 0.7,
      dialogue: { before: '你来到了全国巡回赛！第一站：地区冠军赛。', after: '地区冠军到手！' } },

    { id: 32, chapter: 4, name: '速战速决', difficulty: 5, desc: '在30张牌内胡牌', goal: { type: 'speed', maxTiles: 30 },
      reward: { coins: 420, exp: 260 }, opponents: ['bear', 'panda', 'fox'], aiDifficulty: 0.7,
      dialogue: { before: '大熊：这轮比赛时间有限！速度要快！', after: '速度与技术的完美结合！' } },

    { id: 33, chapter: 4, name: '混战之局', difficulty: 5, desc: '赢得比赛', goal: { type: 'win' },
      reward: { coins: 450, exp: 280 }, opponents: ['fox', 'panda', 'bear'], aiDifficulty: 0.72,
      dialogue: { before: '混战模式：每个人都是对手！', after: '在混战中脱颖而出！' } },

    { id: 34, chapter: 4, name: '高手之路', difficulty: 5, desc: '赢得比赛', goal: { type: 'win' },
      reward: { coins: 450, exp: 280 }, opponents: ['fox', 'panda', 'kitty'], aiDifficulty: 0.75,
      dialogue: { before: '狐狸：高手对决，分毫必争', after: '又近一步了！' } },

    { id: 35, chapter: 4, name: '城市争霸', difficulty: 6, desc: '赢得比赛', goal: { type: 'win' },
      reward: { coins: 500, exp: 300 }, opponents: ['bear', 'panda', 'fox'], aiDifficulty: 0.75,
      dialogue: { before: '城市争霸赛开始！代表你的城市战斗！', after: '城市冠军！' } },

    { id: 36, chapter: 4, name: '精准计算', difficulty: 6, desc: '赢得比赛', goal: { type: 'win' },
      reward: { coins: 500, exp: 300 }, opponents: ['panda', 'fox', 'bear'], aiDifficulty: 0.78,
      dialogue: { before: '团团：这一局，比的是谁算得更准', after: '团团：不错，你的计算能力很强' } },

    { id: 37, chapter: 4, name: '顶级挑战', difficulty: 6, desc: '赢得比赛', goal: { type: 'win' },
      reward: { coins: 550, exp: 350 }, opponents: ['fox', 'panda', 'bear'], aiDifficulty: 0.8,
      dialogue: { before: '前方高能！顶级选手来了！', after: '顶住了压力！' } },

    { id: 38, chapter: 4, name: '半决赛', difficulty: 6, desc: '赢得比赛', goal: { type: 'win' },
      reward: { coins: 550, exp: 350 }, opponents: ['panda', 'bear', 'fox'], aiDifficulty: 0.8,
      dialogue: { before: '半决赛！只有赢了才能进入决赛！', after: '决赛资格到手！' } },

    { id: 39, chapter: 4, name: '决赛之前', difficulty: 7, desc: '赢得比赛', goal: { type: 'win' },
      reward: { coins: 600, exp: 400 }, opponents: ['fox', 'panda', 'bear'], aiDifficulty: 0.82,
      dialogue: { before: '最后的热身...决赛前的最后一战！', after: '准备好了！决赛！' } },

    { id: 40, chapter: 4, name: '🏆 全国冠军', difficulty: 7, isBoss: true,
      desc: '赢得全国冠军', goal: { type: 'win' }, reward: { coins: 1500, exp: 800, unlock: { type: 'theme', id: 'gold' } },
      opponents: ['panda', 'fox', 'bear'], aiDifficulty: 0.85,
      dialogue: { before: '决赛开始！为了冠军而战！所有对手全力以赴！', after: '🏆 全国冠军！你是最强的！金色牌面解锁！' } },

    // ═══ Chapter 5: 锦标赛 (Levels 41-50) ═══
    { id: 41, chapter: 5, name: '传说开始', difficulty: 6, desc: '赢得比赛', goal: { type: 'win' },
      reward: { coins: 600, exp: 400 }, opponents: ['panda', 'fox', 'bear'], aiDifficulty: 0.8,
      dialogue: { before: '欢迎来到传说级别的锦标赛！', after: '传说之路开始了！' } },

    { id: 42, chapter: 5, name: '龙之试炼', difficulty: 7, desc: '赢得比赛', goal: { type: 'win' },
      reward: { coins: 650, exp: 450 }, opponents: ['panda', 'bear', 'fox'], aiDifficulty: 0.82,
      dialogue: { before: '龙的试炼：只有最强者才能通过', after: '龙之试炼通过！' } },

    { id: 43, chapter: 5, name: '极限操作', difficulty: 7, desc: '赢得比赛', goal: { type: 'win' },
      reward: { coins: 650, exp: 450 }, opponents: ['fox', 'panda', 'bear'], aiDifficulty: 0.84,
      dialogue: { before: '狐狸：到了这个级别，每一步都是极限', after: '极限操作成功！' } },

    { id: 44, chapter: 5, name: '传奇之战', difficulty: 7, desc: '赢得比赛', goal: { type: 'win' },
      reward: { coins: 700, exp: 500 }, opponents: ['panda', 'fox', 'bear'], aiDifficulty: 0.85,
      dialogue: { before: '传奇级别的对决！', after: '传奇！你已经是传奇了！' } },

    { id: 45, chapter: 5, name: '四强赛', difficulty: 8, desc: '赢得比赛', goal: { type: 'win' },
      reward: { coins: 700, exp: 500 }, opponents: ['panda', 'fox', 'bear'], aiDifficulty: 0.87,
      dialogue: { before: '锦标赛四强！胜者进入半决赛！', after: '四强突破！' } },

    { id: 46, chapter: 5, name: '半决赛', difficulty: 8, desc: '赢得比赛', goal: { type: 'win' },
      reward: { coins: 800, exp: 600 }, opponents: ['panda', 'fox', 'bear'], aiDifficulty: 0.88,
      dialogue: { before: '半决赛！距离冠军只差两步！', after: '进入决赛了！' } },

    { id: 47, chapter: 5, name: '决赛之路·上', difficulty: 8, desc: '赢得比赛', goal: { type: 'win' },
      reward: { coins: 800, exp: 600 }, opponents: ['panda', 'bear', 'fox'], aiDifficulty: 0.9,
      dialogue: { before: '决赛第一场！三局两胜！', after: '首战告捷！' } },

    { id: 48, chapter: 5, name: '决赛之路·下', difficulty: 9, desc: '赢得比赛', goal: { type: 'win' },
      reward: { coins: 900, exp: 700 }, opponents: ['fox', 'panda', 'bear'], aiDifficulty: 0.9,
      dialogue: { before: '决赛第二场！再赢一场就是冠军！', after: '再下一城！' } },

    { id: 49, chapter: 5, name: '终极考验', difficulty: 9, desc: '赢得比赛', goal: { type: 'win' },
      reward: { coins: 1000, exp: 800 }, opponents: ['panda', 'fox', 'bear'], aiDifficulty: 0.92,
      dialogue: { before: '这是最后的考验...你准备好了吗？', after: '准备好了！最终BOSS！' } },

    { id: 50, chapter: 5, name: '🏆 麻将之王', difficulty: 10, isBoss: true,
      desc: '击败最终BOSS龙王，成为传奇', goal: { type: 'win' },
      reward: { coins: 3000, exp: 2000, unlock: { type: 'character', id: 'dragon' } },
      opponents: ['dragon', 'dragon', 'dragon'], aiDifficulty: 0.95,
      dialogue: { before: '龙王：终于来了...挑战者。我等这一天等了很久。准备好面对真正的麻将之神了吗？', after: '龙王：...了不起。你击败了我。从今天起，你就是新的麻将之王！🐉👑' } },
  ];

  // ╔═══════════════════════════════════════════════════════════╗
  // ║  CAMPAIGN LOGIC                                          ║
  // ╚═══════════════════════════════════════════════════════════╝

  function getChapter(id) {
    return CHAPTERS.find(c => c.id === id);
  }

  function getLevel(id) {
    return LEVELS.find(l => l.id === id);
  }

  function getChapterLevels(chapterId) {
    return LEVELS.filter(l => l.chapter === chapterId);
  }

  function isChapterUnlocked(chapterId) {
    const chapter = getChapter(chapterId);
    if (!chapter) return false;
    const progress = Storage.getCampaign();
    return progress.totalStars >= chapter.unlockStars;
  }

  function isLevelCompleted(levelId) {
    const progress = Storage.getCampaign();
    return !!progress.completedLevels[levelId];
  }

  function getLevelStars(levelId) {
    const progress = Storage.getCampaign();
    return progress.stars[levelId] || 0;
  }

  function completeLevel(levelId, stars) {
    const progress = Storage.getCampaign();
    const level = getLevel(levelId);
    if (!level) return null;

    const prevStars = progress.stars[levelId] || 0;
    const newStars = Math.max(prevStars, Math.min(3, stars));
    const starDiff = newStars - prevStars;

    progress.completedLevels[levelId] = true;
    progress.stars[levelId] = newStars;
    progress.totalStars += starDiff;

    // Update current progress
    if (levelId >= progress.currentLevel) {
      progress.currentLevel = levelId + 1;
    }

    // Boss tracking
    if (level.isBoss && !progress.bossesDefeated.includes(levelId)) {
      progress.bossesDefeated.push(levelId);
    }

    // Handle rewards
    const rewards = { ...level.reward, newStars: starDiff };
    if (level.reward.unlock) {
      const u = level.reward.unlock;
      if (u.type === 'theme') {
        Storage.unlock('tileThemes', u.id);
      } else if (u.type === 'character') {
        Storage.unlock('characters', u.id);
      }
      rewards.unlockName = u.id;
    }

    // Update profile
    const profile = Storage.getProfile();
    profile.coins = (profile.coins || 0) + (level.reward.coins || 0);
    profile.exp = (profile.exp || 0) + (level.reward.exp || 0);
    // Level up every 500 exp
    while (profile.exp >= profile.level * 500) {
      profile.exp -= profile.level * 500;
      profile.level++;
    }
    Storage.saveProfile(profile);
    Storage.saveCampaign(progress);

    return rewards;
  }

  function getTotalProgress() {
    const progress = Storage.getCampaign();
    const totalLevels = LEVELS.length;
    const completedCount = Object.keys(progress.completedLevels).length;
    return {
      completedLevels: completedCount,
      totalLevels,
      totalStars: progress.totalStars,
      maxStars: totalLevels * 3,
      percentage: Math.round(completedCount / totalLevels * 100),
    };
  }

  // ─── Daily Challenge ───
  function generateDailyChallenge() {
    const today = Storage.today();
    const saved = Storage.getDailyChallenge();
    if (saved.date === today && saved.challenge) return saved;

    // Seed-based pseudo-random using date
    const seed = today.replace(/-/g, '');
    const rand = (n) => ((parseInt(seed) * 9301 + 49297) % 233280) / 233280 * n | 0;

    const challenges = [
      { name: '速战速决', desc: '在30张牌内胡牌', type: 'speed' },
      { name: '清一色之梦', desc: '赢一局清一色', type: 'cleanHand' },
      { name: '和平主义', desc: '不碰不杠赢一局', type: 'noPengGang' },
      { name: '碰碰大师', desc: '碰3次以上并获胜', type: 'pengMaster' },
      { name: '自摸之王', desc: '自摸胡牌', type: 'tsumo' },
      { name: '大番挑战', desc: '赢一局3番以上的牌', type: 'bigHand' },
      { name: '连胜挑战', desc: '连续赢2局', type: 'winStreak2' },
    ];

    const challenge = challenges[rand(challenges.length)];
    const data = { date: today, completed: false, challenge, reward: { coins: 200, gems: 5 } };
    Storage.saveDailyChallenge(data);
    return data;
  }

  return {
    CHAPTERS,
    LEVELS,
    getChapter,
    getLevel,
    getChapterLevels,
    isChapterUnlocked,
    isLevelCompleted,
    getLevelStars,
    completeLevel,
    getTotalProgress,
    generateDailyChallenge,
  };
})();
