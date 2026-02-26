// 🀄 Hello Kitty 麻将 — 牌库系统
// Covers Beijing and Sichuan mahjong tile sets

const TILE_SUITS = {
  wan:  { name: '万', color: '#e74c3c' },
  tiao: { name: '条', color: '#2ecc71' },
  tong: { name: '筒', color: '#3498db' },
  feng: { name: '风', color: '#333' },
  jian: { name: '箭', color: '#9b59b6' },
};

// Unicode mahjong tiles: 🀇-🀏 (wan), 🀐-🀘 (tiao), 🀙-🀡 (tong), 🀀-🀃 (feng), 🀄🀅🀆 (jian)
const TILES = {
  // 万子 1-9
  w1: { suit: 'wan', rank: 1, name: '一万', char: '🀇', display: '1万' },
  w2: { suit: 'wan', rank: 2, name: '二万', char: '🀈', display: '2万' },
  w3: { suit: 'wan', rank: 3, name: '三万', char: '🀉', display: '3万' },
  w4: { suit: 'wan', rank: 4, name: '四万', char: '🀊', display: '4万' },
  w5: { suit: 'wan', rank: 5, name: '五万', char: '🀋', display: '5万' },
  w6: { suit: 'wan', rank: 6, name: '六万', char: '🀌', display: '6万' },
  w7: { suit: 'wan', rank: 7, name: '七万', char: '🀍', display: '7万' },
  w8: { suit: 'wan', rank: 8, name: '八万', char: '🀎', display: '8万' },
  w9: { suit: 'wan', rank: 9, name: '九万', char: '🀏', display: '9万' },
  // 条子 1-9
  t1: { suit: 'tiao', rank: 1, name: '一条', char: '🀐', display: '1条' },
  t2: { suit: 'tiao', rank: 2, name: '二条', char: '🀑', display: '2条' },
  t3: { suit: 'tiao', rank: 3, name: '三条', char: '🀒', display: '3条' },
  t4: { suit: 'tiao', rank: 4, name: '四条', char: '🀓', display: '4条' },
  t5: { suit: 'tiao', rank: 5, name: '五条', char: '🀔', display: '5条' },
  t6: { suit: 'tiao', rank: 6, name: '六条', char: '🀕', display: '6条' },
  t7: { suit: 'tiao', rank: 7, name: '七条', char: '🀖', display: '7条' },
  t8: { suit: 'tiao', rank: 8, name: '八条', char: '🀗', display: '8条' },
  t9: { suit: 'tiao', rank: 9, name: '九条', char: '🀘', display: '9条' },
  // 筒子 1-9
  b1: { suit: 'tong', rank: 1, name: '一筒', char: '🀙', display: '1筒' },
  b2: { suit: 'tong', rank: 2, name: '二筒', char: '🀚', display: '2筒' },
  b3: { suit: 'tong', rank: 3, name: '三筒', char: '🀛', display: '3筒' },
  b4: { suit: 'tong', rank: 4, name: '四筒', char: '🀜', display: '4筒' },
  b5: { suit: 'tong', rank: 5, name: '五筒', char: '🀝', display: '5筒' },
  b6: { suit: 'tong', rank: 6, name: '六筒', char: '🀞', display: '6筒' },
  b7: { suit: 'tong', rank: 7, name: '七筒', char: '🀟', display: '7筒' },
  b8: { suit: 'tong', rank: 8, name: '八筒', char: '🀠', display: '8筒' },
  b9: { suit: 'tong', rank: 9, name: '九筒', char: '🀡', display: '9筒' },
  // 风牌
  fe: { suit: 'feng', rank: 1, name: '东风', char: '🀀', display: '东' },
  fs: { suit: 'feng', rank: 2, name: '南风', char: '🀁', display: '南' },
  fw: { suit: 'feng', rank: 3, name: '西风', char: '🀂', display: '西' },
  fn: { suit: 'feng', rank: 4, name: '北风', char: '🀃', display: '北' },
  // 箭牌 (三元牌)
  jz: { suit: 'jian', rank: 1, name: '中', char: '🀄', display: '中' },
  jf: { suit: 'jian', rank: 2, name: '发', char: '🀅', display: '发' },
  jb: { suit: 'jian', rank: 3, name: '白', char: '🀆', display: '白' },
};

const TileUtils = {
  // Create a full mahjong set (136 tiles for standard, 108 for Sichuan)
  createDeck(mode = 'beijing') {
    const deck = [];
    const tileKeys = Object.keys(TILES);
    
    let validKeys;
    if (mode === 'sichuan') {
      // Sichuan: no feng/jian, only wan/tiao/tong (108 tiles)
      validKeys = tileKeys.filter(k => ['wan', 'tiao', 'tong'].includes(TILES[k].suit));
    } else {
      // Beijing: all tiles (136 tiles)
      validKeys = tileKeys;
    }
    
    // 4 copies of each tile
    for (const key of validKeys) {
      for (let i = 0; i < 4; i++) {
        deck.push({ ...TILES[key], id: `${key}_${i}`, key });
      }
    }
    
    return deck;
  },

  // Shuffle deck (Fisher-Yates)
  shuffle(deck) {
    const arr = [...deck];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  },

  // Sort hand by suit then rank
  sortHand(hand) {
    const suitOrder = { wan: 0, tiao: 1, tong: 2, feng: 3, jian: 4 };
    return [...hand].sort((a, b) => {
      const sa = suitOrder[a.suit] ?? 9;
      const sb = suitOrder[b.suit] ?? 9;
      if (sa !== sb) return sa - sb;
      return a.rank - b.rank;
    });
  },

  // Check if two tiles match (same suit + rank)
  match(a, b) {
    return a.suit === b.suit && a.rank === b.rank;
  },

  // Check if three tiles form a sequence (chi/顺子)
  isSequence(a, b, c) {
    if (a.suit !== b.suit || b.suit !== c.suit) return false;
    if (['feng', 'jian'].includes(a.suit)) return false; // honor tiles can't form sequences
    const ranks = [a.rank, b.rank, c.rank].sort((x, y) => x - y);
    return ranks[1] === ranks[0] + 1 && ranks[2] === ranks[1] + 1;
  },

  // Check if three tiles form a triplet (peng/刻子)
  isTriplet(a, b, c) {
    return this.match(a, b) && this.match(b, c);
  },

  // Check if four tiles form a quad (gang/杠)
  isQuad(a, b, c, d) {
    return this.match(a, b) && this.match(b, c) && this.match(c, d);
  },

  // Render a tile element
  renderTile(tile, options = {}) {
    const { faceDown = false, small = false, selected = false, clickable = true } = options;
    const div = document.createElement('div');
    div.className = 'tile' + (small ? ' tile-sm' : '') + (selected ? ' selected' : '') + (faceDown ? ' face-down' : '');
    div.dataset.id = tile.id;
    div.dataset.key = tile.key;
    
    if (faceDown) {
      div.innerHTML = '<span class="tile-back">🎀</span>';
    } else {
      const suitColor = TILE_SUITS[tile.suit]?.color || '#333';
      div.innerHTML = `<span class="tile-rank" style="color:${suitColor}">${tile.rank || ''}</span>
        <span class="tile-suit" style="color:${suitColor}">${TILE_SUITS[tile.suit]?.name || ''}</span>`;
      if (tile.suit === 'jian') {
        // Special display for honor tiles
        const jianColors = { jz: '#e74c3c', jf: '#2ecc71', jb: '#ccc' };
        div.innerHTML = `<span class="tile-honor" style="color:${jianColors[tile.key] || '#333'}">${tile.display}</span>`;
      } else if (tile.suit === 'feng') {
        div.innerHTML = `<span class="tile-honor">${tile.display}</span>`;
      }
    }
    
    return div;
  },

  // Count tiles by key in hand
  countByKey(hand, key) {
    return hand.filter(t => t.key === key).length;
  },

  // Find all possible chi combinations for a tile from hand
  findChi(hand, tile) {
    if (['feng', 'jian'].includes(tile.suit)) return [];
    const results = [];
    const suitTiles = hand.filter(t => t.suit === tile.suit);
    const ranks = [...new Set(suitTiles.map(t => t.rank))];
    
    // Check rank-2, rank-1, rank (left sequence)
    if (ranks.includes(tile.rank - 2) && ranks.includes(tile.rank - 1)) {
      results.push([tile.rank - 2, tile.rank - 1, tile.rank]);
    }
    // Check rank-1, rank, rank+1 (middle)
    if (ranks.includes(tile.rank - 1) && ranks.includes(tile.rank + 1)) {
      results.push([tile.rank - 1, tile.rank, tile.rank + 1]);
    }
    // Check rank, rank+1, rank+2 (right)
    if (ranks.includes(tile.rank + 1) && ranks.includes(tile.rank + 2)) {
      results.push([tile.rank, tile.rank + 1, tile.rank + 2]);
    }
    
    return results;
  },
};
