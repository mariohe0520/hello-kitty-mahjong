/**
 * 麻将AI对手
 * 智能+搞笑
 */
class MahjongAI {
  constructor(name, difficulty = 'normal') {
    this.name = name;
    this.difficulty = difficulty;
    this.personality = this.getPersonality();
  }
  
  getPersonality() {
    const personalities = {
      aggressive: { name: '进攻型', desc: '喜欢胡大牌' },
      defensive: { name: '防守型', desc: '小心谨慎' },
      random: { name: '迷茫型', desc: '经常打错牌' },
      lucky: { name: '幸运型', desc: '运气超好' }
    };
    return Object.values(personalities)[Math.floor(Math.random() * 4)];
  }
  
  // AI决策
  decide(tiles, discardPile, lastDraw) {
    // 简单AI：随机打牌
    const validTiles = tiles.filter(t => !this.hasPong(t) && !this.hasKong(t));
    return validTiles[Math.floor(Math.random() * validTiles.length)];
  }
  
  hasPong(tile) {
    return false;
  }
  
  hasKong(tile) {
    return false;
  }
  
  // 搞笑发言
  getComment(action) {
    const comments = {
      draw: ["这张牌...嗯...", "哦豁～", "运气不错！"],
      discard: ["打这个！", "不要了", "随便打打～"],
      pong: ["碰！", "抓到了！", "嘿嘿～"],
      hu: ["我胡了！", "不好意思～", "运气好没办法！"]
    };
    const list = comments[action] || comments.draw;
    return list[Math.floor(Math.random() * list.length)];
  }
}

window.MahjongAI = MahjongAI;
