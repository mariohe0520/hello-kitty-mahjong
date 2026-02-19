// ═══════════════════════════════════════════════════════════════
// 🎮 Hello Kitty 麻将 — Core Game Engine
// Premium tile rendering, physics, sound, particles, game flow
// ═══════════════════════════════════════════════════════════════

const Game = (() => {
  'use strict';

  // ╔═══════════════════════════════════════════════════════════╗
  // ║  TILE IMAGE MAP — Real SVG assets                        ║
  // ╚═══════════════════════════════════════════════════════════╝

  const TILE_IMAGE_MAP = {
    w1: 'Man1', w2: 'Man2', w3: 'Man3', w4: 'Man4', w5: 'Man5',
    w6: 'Man6', w7: 'Man7', w8: 'Man8', w9: 'Man9',
    t1: 'Sou1', t2: 'Sou2', t3: 'Sou3', t4: 'Sou4', t5: 'Sou5',
    t6: 'Sou6', t7: 'Sou7', t8: 'Sou8', t9: 'Sou9',
    b1: 'Pin1', b2: 'Pin2', b3: 'Pin3', b4: 'Pin4', b5: 'Pin5',
    b6: 'Pin6', b7: 'Pin7', b8: 'Pin8', b9: 'Pin9',
    fe: 'Ton', fs: 'Nan', fw: 'Shaa', fn: 'Pei',
    jz: 'Chun', jf: 'Hatsu', jb: 'Haku',
  };

  const TILE_ASSET_BASE = 'assets/tiles/';

  // Preload all tile images
  const imageCache = {};
  function preloadImages() {
    const keys = Object.values(TILE_IMAGE_MAP);
    keys.push('Back', 'Front');
    for (const name of keys) {
      const img = new Image();
      img.src = `${TILE_ASSET_BASE}${name}.svg`;
      imageCache[name] = img;
    }
  }

  // ╔═══════════════════════════════════════════════════════════╗
  // ║  SOUND ENGINE — Web Audio API Synthesizer                ║
  // ╚═══════════════════════════════════════════════════════════╝

  const Sound = (() => {
    let ctx = null;
    let masterGain = null;
    let muted = false;
    let volume = 0.6;

    function getCtx() {
      if (!ctx) {
        ctx = new (window.AudioContext || window.webkitAudioContext)();
        masterGain = ctx.createGain();
        masterGain.gain.value = volume;
        masterGain.connect(ctx.destination);
      }
      if (ctx.state === 'suspended') ctx.resume();
      return ctx;
    }

    function getMaster() {
      getCtx();
      return masterGain;
    }

    function setVolume(v) {
      volume = Math.max(0, Math.min(1, v));
      if (masterGain) masterGain.gain.value = muted ? 0 : volume;
    }

    function setMuted(m) {
      muted = m;
      if (masterGain) masterGain.gain.value = muted ? 0 : volume;
    }

    function isMuted() { return muted; }

    // ─── Tile tap: bamboo click ───
    function playTap() {
      const c = getCtx(); const m = getMaster();
      const osc = c.createOscillator();
      const gain = c.createGain();
      const filter = c.createBiquadFilter();
      osc.type = 'square';
      osc.frequency.setValueAtTime(1000 + Math.random() * 200, c.currentTime);
      osc.frequency.exponentialRampToValueAtTime(600, c.currentTime + 0.04);
      filter.type = 'highpass';
      filter.frequency.value = 800;
      gain.gain.setValueAtTime(0.3, c.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.08);
      osc.connect(filter);
      filter.connect(gain);
      gain.connect(m);
      osc.start(c.currentTime);
      osc.stop(c.currentTime + 0.08);
    }

    // ─── Tile place: deep thud ───
    function playPlace() {
      const c = getCtx(); const m = getMaster();
      // Body thud
      const osc1 = c.createOscillator();
      const gain1 = c.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(400, c.currentTime);
      osc1.frequency.exponentialRampToValueAtTime(150, c.currentTime + 0.1);
      gain1.gain.setValueAtTime(0.35, c.currentTime);
      gain1.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.15);
      osc1.connect(gain1);
      gain1.connect(m);
      osc1.start(c.currentTime);
      osc1.stop(c.currentTime + 0.15);

      // Impact noise
      const buf = c.createBuffer(1, c.sampleRate * 0.05, c.sampleRate);
      const data = buf.getChannelData(0);
      for (let i = 0; i < data.length; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (data.length * 0.15));
      }
      const noise = c.createBufferSource();
      noise.buffer = buf;
      const nGain = c.createGain();
      nGain.gain.setValueAtTime(0.15, c.currentTime);
      nGain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.06);
      const nFilter = c.createBiquadFilter();
      nFilter.type = 'lowpass';
      nFilter.frequency.value = 2000;
      noise.connect(nFilter);
      nFilter.connect(nGain);
      nGain.connect(m);
      noise.start(c.currentTime);
    }

    // ─── Peng: double click ───
    function playPeng() {
      const c = getCtx(); const m = getMaster();
      [0, 0.1].forEach(offset => {
        const osc = c.createOscillator();
        const gain = c.createGain();
        osc.type = 'square';
        osc.frequency.setValueAtTime(900, c.currentTime + offset);
        osc.frequency.exponentialRampToValueAtTime(500, c.currentTime + offset + 0.05);
        gain.gain.setValueAtTime(0.3, c.currentTime + offset);
        gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + offset + 0.1);
        osc.connect(gain);
        gain.connect(m);
        osc.start(c.currentTime + offset);
        osc.stop(c.currentTime + offset + 0.1);
      });
    }

    // ─── Gang: deep resonance ───
    function playGang() {
      const c = getCtx(); const m = getMaster();
      const freqs = [150, 200, 300];
      freqs.forEach((f, i) => {
        const osc = c.createOscillator();
        const gain = c.createGain();
        osc.type = i === 0 ? 'sine' : 'triangle';
        osc.frequency.setValueAtTime(f, c.currentTime);
        osc.frequency.exponentialRampToValueAtTime(f * 0.5, c.currentTime + 0.4);
        gain.gain.setValueAtTime(0.25, c.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.4);
        osc.connect(gain);
        gain.connect(m);
        osc.start(c.currentTime);
        osc.stop(c.currentTime + 0.4);
      });
    }

    // ─── Hu: rising chord + shimmer ───
    function playHu() {
      const c = getCtx(); const m = getMaster();
      const notes = [261.6, 329.6, 392.0, 523.3]; // C4-E4-G4-C5
      notes.forEach((f, i) => {
        const osc = c.createOscillator();
        const gain = c.createGain();
        osc.type = 'sine';
        const start = c.currentTime + i * 0.12;
        osc.frequency.setValueAtTime(f, start);
        gain.gain.setValueAtTime(0, start);
        gain.gain.linearRampToValueAtTime(0.2, start + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.001, start + 0.8);
        osc.connect(gain);
        gain.connect(m);
        osc.start(start);
        osc.stop(start + 0.8);
      });

      // Shimmer: high frequency noise burst
      setTimeout(() => {
        const c2 = getCtx();
        const buf = c2.createBuffer(1, c2.sampleRate * 0.3, c2.sampleRate);
        const data = buf.getChannelData(0);
        for (let i = 0; i < data.length; i++) {
          data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (data.length * 0.3)) * 0.3;
        }
        const noise = c2.createBufferSource();
        noise.buffer = buf;
        const filter = c2.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.value = 6000;
        filter.Q.value = 2;
        const nGain = c2.createGain();
        nGain.gain.setValueAtTime(0.08, c2.currentTime);
        nGain.gain.exponentialRampToValueAtTime(0.001, c2.currentTime + 0.3);
        noise.connect(filter);
        filter.connect(nGain);
        nGain.connect(getMaster());
        noise.start(c2.currentTime);
      }, 400);
    }

    // ─── Draw: soft slide ───
    function playDraw() {
      const c = getCtx(); const m = getMaster();
      const buf = c.createBuffer(1, c.sampleRate * 0.15, c.sampleRate);
      const data = buf.getChannelData(0);
      for (let i = 0; i < data.length; i++) {
        const t = i / c.sampleRate;
        data[i] = (Math.random() * 2 - 1) * 0.15 * Math.sin(t * 800) * Math.exp(-t * 20);
      }
      const noise = c.createBufferSource();
      noise.buffer = buf;
      const filter = c.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(2000, c.currentTime);
      filter.frequency.linearRampToValueAtTime(800, c.currentTime + 0.15);
      filter.Q.value = 1;
      const gain = c.createGain();
      gain.gain.setValueAtTime(0.2, c.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.15);
      noise.connect(filter);
      filter.connect(gain);
      gain.connect(m);
      noise.start(c.currentTime);
    }

    // ─── Chi: light tap ───
    function playChi() {
      const c = getCtx(); const m = getMaster();
      const osc = c.createOscillator();
      const gain = c.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(1200, c.currentTime);
      osc.frequency.exponentialRampToValueAtTime(800, c.currentTime + 0.06);
      gain.gain.setValueAtTime(0.25, c.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.12);
      osc.connect(gain);
      gain.connect(m);
      osc.start(c.currentTime);
      osc.stop(c.currentTime + 0.12);
    }

    return {
      getCtx, setVolume, setMuted, isMuted,
      playTap, playPlace, playPeng, playGang, playHu, playDraw, playChi,
    };
  })();

  // ╔═══════════════════════════════════════════════════════════╗
  // ║  PARTICLE SYSTEM — DOM pooled particles                  ║
  // ╚═══════════════════════════════════════════════════════════╝

  const Particles = (() => {
    const pool = [];
    const active = [];
    const MAX_PARTICLES = 200;
    let container = null;
    let rafId = null;

    function init() {
      container = document.getElementById('mahjong-table');
      if (!container) return;
      // Pre-create particle elements
      for (let i = 0; i < MAX_PARTICLES; i++) {
        const el = document.createElement('div');
        el.className = 'particle';
        el.style.cssText = 'position:absolute;pointer-events:none;will-change:transform,opacity;display:none;z-index:200;';
        container.appendChild(el);
        pool.push(el);
      }
    }

    function getParticle() {
      if (pool.length > 0) return pool.pop();
      if (active.length > 0) {
        const recycled = active.shift();
        recycled.el.style.display = 'none';
        return recycled.el;
      }
      return null;
    }

    function returnParticle(p) {
      p.el.style.display = 'none';
      p.el.style.transform = '';
      p.el.className = 'particle';
      pool.push(p.el);
    }

    function spawn(opts) {
      const el = getParticle();
      if (!el) return;

      const p = {
        el,
        x: opts.x || 0,
        y: opts.y || 0,
        vx: opts.vx || 0,
        vy: opts.vy || 0,
        gravity: opts.gravity || 0,
        life: opts.life || 1,
        maxLife: opts.life || 1,
        size: opts.size || 6,
        color: opts.color || '#f5c518',
        rotation: opts.rotation || 0,
        rotationSpeed: opts.rotationSpeed || 0,
        shape: opts.shape || 'circle', // circle, square, star
        friction: opts.friction || 0.98,
        fadeOut: opts.fadeOut !== false,
      };

      el.style.display = 'block';
      el.style.width = p.size + 'px';
      el.style.height = p.size + 'px';
      el.style.background = p.color;
      el.style.borderRadius = p.shape === 'circle' ? '50%' : p.shape === 'star' ? '0' : '2px';

      if (p.shape === 'star') {
        el.style.background = 'none';
        el.textContent = '✦';
        el.style.fontSize = p.size + 'px';
        el.style.color = p.color;
        el.style.width = 'auto';
        el.style.height = 'auto';
        el.style.lineHeight = '1';
      } else {
        el.textContent = '';
      }

      active.push(p);
      updateParticle(p);
    }

    function updateParticle(p) {
      p.el.style.transform = `translate(${p.x}px, ${p.y}px) rotate(${p.rotation}deg)`;
      const alpha = p.fadeOut ? (p.life / p.maxLife) : 1;
      p.el.style.opacity = alpha;
    }

    function tick(dt) {
      for (let i = active.length - 1; i >= 0; i--) {
        const p = active[i];
        p.life -= dt;
        if (p.life <= 0) {
          active.splice(i, 1);
          returnParticle(p);
          continue;
        }
        p.vy += p.gravity * dt;
        p.vx *= p.friction;
        p.vy *= p.friction;
        p.x += p.vx * dt * 60;
        p.y += p.vy * dt * 60;
        p.rotation += p.rotationSpeed * dt * 60;
        updateParticle(p);
      }
    }

    let lastTime = 0;
    function loop(time) {
      const dt = Math.min((time - lastTime) / 1000, 0.05);
      lastTime = time;
      tick(dt);
      rafId = requestAnimationFrame(loop);
    }

    function start() {
      if (!container) init();
      if (!rafId) {
        lastTime = performance.now();
        rafId = requestAnimationFrame(loop);
      }
    }

    function stop() {
      if (rafId) {
        cancelAnimationFrame(rafId);
        rafId = null;
      }
    }

    // ─── Effect: Gold sparkles ───
    function goldSparkles(cx, cy, count = 30) {
      for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 1 + Math.random() * 4;
        spawn({
          x: cx, y: cy,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed - 2,
          gravity: 0.15,
          life: 0.8 + Math.random() * 0.6,
          size: 4 + Math.random() * 6,
          color: Math.random() > 0.5 ? '#f5c518' : '#ffdd57',
          shape: Math.random() > 0.5 ? 'star' : 'circle',
          rotationSpeed: (Math.random() - 0.5) * 10,
        });
      }
    }

    // ─── Effect: Confetti rain ───
    function confettiRain(count = 60) {
      if (!container) return;
      const w = container.offsetWidth;
      const colors = ['#ff6b9d', '#f5c518', '#5b9bd5', '#2ecc71', '#9b59b6', '#ff8fbf', '#e74c3c'];
      for (let i = 0; i < count; i++) {
        setTimeout(() => {
          spawn({
            x: Math.random() * w,
            y: -10,
            vx: (Math.random() - 0.5) * 2,
            vy: 1 + Math.random() * 3,
            gravity: 0.08,
            life: 2 + Math.random(),
            size: 5 + Math.random() * 5,
            color: colors[Math.floor(Math.random() * colors.length)],
            shape: 'square',
            rotationSpeed: (Math.random() - 0.5) * 15,
            friction: 0.995,
          });
        }, i * 30);
      }
    }

    // ─── Effect: Dust motes (ambient) ───
    function dustMotes() {
      if (!container) return;
      const w = container.offsetWidth;
      const h = container.offsetHeight;
      for (let i = 0; i < 3; i++) {
        spawn({
          x: Math.random() * w,
          y: Math.random() * h,
          vx: (Math.random() - 0.5) * 0.3,
          vy: -0.1 - Math.random() * 0.2,
          gravity: 0,
          life: 3 + Math.random() * 3,
          size: 2 + Math.random() * 2,
          color: 'rgba(255,255,255,0.3)',
          shape: 'circle',
          friction: 1,
        });
      }
    }

    // ─── Effect: Ink splash for actions ───
    function inkSplash(cx, cy, color = '#333') {
      for (let i = 0; i < 15; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 2 + Math.random() * 5;
        spawn({
          x: cx, y: cy,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          gravity: 0.2,
          life: 0.3 + Math.random() * 0.4,
          size: 3 + Math.random() * 8,
          color,
          shape: 'circle',
          friction: 0.92,
        });
      }
    }

    return {
      init, start, stop, spawn,
      goldSparkles, confettiRain, dustMotes, inkSplash,
    };
  })();

  // ╔═══════════════════════════════════════════════════════════╗
  // ║  ANIMATION ENGINE — Spring physics, easing, screen fx    ║
  // ╚═══════════════════════════════════════════════════════════╝

  const Anim = (() => {
    const animations = [];
    let rafId = null;

    // Spring physics
    function spring(current, target, velocity, config = {}) {
      const { stiffness = 180, damping = 12, mass = 1 } = config;
      const springForce = -stiffness * (current - target);
      const dampingForce = -damping * velocity;
      const acceleration = (springForce + dampingForce) / mass;
      const newVelocity = velocity + acceleration * (1 / 60);
      const newPosition = current + newVelocity * (1 / 60);
      return { position: newPosition, velocity: newVelocity };
    }

    // Animate element with spring physics
    function springTo(el, props, config = {}, onComplete) {
      const state = {};
      for (const [key, target] of Object.entries(props)) {
        const current = parseFloat(el.dataset[`anim_${key}`] || getComputedProp(el, key));
        state[key] = { current: isNaN(current) ? 0 : current, target, velocity: 0 };
      }

      const anim = {
        el, state, config, onComplete,
        done: false,
      };
      animations.push(anim);
      startLoop();
      return anim;
    }

    function getComputedProp(el, key) {
      if (key === 'x' || key === 'y' || key === 'scale' || key === 'rotate') return 0;
      return 0;
    }

    function applyTransform(el, state) {
      const x = state.x?.current || 0;
      const y = state.y?.current || 0;
      const scale = state.scale?.current ?? 1;
      const rotate = state.rotate?.current || 0;
      el.style.transform = `translate(${x}px, ${y}px) scale(${scale}) rotate(${rotate}deg)`;

      // Store for reference
      for (const [key, s] of Object.entries(state)) {
        el.dataset[`anim_${key}`] = s.current;
      }
    }

    function tick() {
      for (let i = animations.length - 1; i >= 0; i--) {
        const anim = animations[i];
        let allDone = true;

        for (const [key, s] of Object.entries(anim.state)) {
          const result = spring(s.current, s.target, s.velocity, anim.config);
          s.current = result.position;
          s.velocity = result.velocity;

          if (Math.abs(s.current - s.target) < 0.1 && Math.abs(s.velocity) < 0.1) {
            s.current = s.target;
            s.velocity = 0;
          } else {
            allDone = false;
          }
        }

        applyTransform(anim.el, anim.state);

        if (allDone) {
          anim.done = true;
          animations.splice(i, 1);
          if (anim.onComplete) anim.onComplete();
        }
      }
    }

    function loop() {
      tick();
      if (animations.length > 0) {
        rafId = requestAnimationFrame(loop);
      } else {
        rafId = null;
      }
    }

    function startLoop() {
      if (!rafId) rafId = requestAnimationFrame(loop);
    }

    // ─── Screen shake ───
    function screenShake(intensity = 6, duration = 400) {
      const table = document.getElementById('mahjong-table');
      if (!table) return;
      table.classList.add('shake');
      table.style.setProperty('--shake-intensity', intensity + 'px');
      setTimeout(() => table.classList.remove('shake'), duration);
    }

    // ─── Score counter spin-up ───
    function countUp(el, from, to, duration = 800) {
      const start = performance.now();
      function update(time) {
        const progress = Math.min((time - start) / duration, 1);
        // Ease out cubic
        const eased = 1 - Math.pow(1 - progress, 3);
        const value = Math.round(from + (to - from) * eased);
        el.textContent = value.toLocaleString();
        if (progress < 1) requestAnimationFrame(update);
      }
      requestAnimationFrame(update);
    }

    // ─── Arc trajectory (parabolic discard path) ───
    function arcTo(el, startX, startY, endX, endY, duration = 400) {
      return new Promise(resolve => {
        const start = performance.now();
        const midY = Math.min(startY, endY) - 60; // Peak of arc

        el.style.position = 'absolute';
        el.style.zIndex = '100';
        el.style.transition = 'none';

        function frame(time) {
          const t = Math.min((time - start) / duration, 1);
          // Ease: fast start, slow end
          const eased = 1 - Math.pow(1 - t, 2);

          // Parabolic path
          const x = startX + (endX - startX) * eased;
          const y = startY + 2 * (midY - startY) * eased * (1 - eased) + (endY - startY) * eased * eased;
          // Rotation during flight
          const rotation = t * 360;

          el.style.transform = `translate(${x}px, ${y}px) rotate(${rotation}deg) scale(${1 - t * 0.3})`;

          if (t < 1) {
            requestAnimationFrame(frame);
          } else {
            el.style.zIndex = '';
            resolve();
          }
        }
        requestAnimationFrame(frame);
      });
    }

    // ─── Cascade reveal ───
    function cascadeReveal(elements, stagger = 60) {
      elements.forEach((el, i) => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(-20px) rotateX(90deg) scale(0.8)';
        el.style.transition = 'none';
        setTimeout(() => {
          el.style.transition = 'all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)';
          el.style.opacity = '1';
          el.style.transform = 'translateY(0) rotateX(0) scale(1)';
        }, i * stagger);
      });
    }

    // ─── Glow pulse ring ───
    function glowPulse(el, color = '#ff6b9d', duration = 1500) {
      el.style.boxShadow = `0 0 0 0 ${color}80`;
      el.style.transition = `box-shadow ${duration}ms ease-in-out`;
      requestAnimationFrame(() => {
        el.style.boxShadow = `0 0 20px 8px ${color}00`;
      });
      setTimeout(() => {
        el.style.boxShadow = '';
        el.style.transition = '';
      }, duration);
    }

    return {
      springTo, screenShake, countUp, arcTo,
      cascadeReveal, glowPulse, spring,
    };
  })();

  // ╔═══════════════════════════════════════════════════════════╗
  // ║  PREMIUM TILE RENDERER — 3D tiles with real SVG images   ║
  // ╚═══════════════════════════════════════════════════════════╝

  function renderTile(tile, options = {}) {
    const { faceDown = false, small = false, selected = false, mini = false } = options;

    const div = document.createElement('div');
    div.className = 'tile' +
      (small ? ' tile-sm' : '') +
      (mini ? ' tile-mini' : '') +
      (selected ? ' selected' : '') +
      (faceDown ? ' face-down' : '');
    div.dataset.id = tile.id;
    div.dataset.key = tile.key;

    if (faceDown) {
      const span = document.createElement('span');
      span.className = 'tile-back';
      span.textContent = '🎀';
      div.appendChild(span);
    } else {
      // ALWAYS render text content first (guaranteed visible)
      renderTileTextContent(div, tile);

      // Then try to load SVG as enhancement
      const imgName = TILE_IMAGE_MAP[tile.key];
      if (imgName) {
        const img = new Image();
        img.className = 'tile-img';
        img.alt = '';
        img.draggable = false;
        img.onload = function() {
          // SVG loaded successfully — overlay on top of text
          div.appendChild(this);
        };
        img.src = TILE_ASSET_BASE + imgName + '.svg';
      }
    }

    return div;
  }

  // Helper: render tile content as colored text (always visible, distinguishable)
  function renderTileTextContent(div, tile) {
    // Specific colors per tile type
    const JIAN_COLORS = { jz: '#e74c3c', jf: '#2ecc71', jb: '#5b9bd5' };

    if (tile.suit === 'jian') {
      // 箭牌: 中=red, 发=green, 白=blue
      const span = document.createElement('span');
      span.className = 'tile-honor';
      const color = JIAN_COLORS[tile.key] || '#333';
      span.style.color = color;
      span.textContent = tile.display;
      if (tile.key === 'jb') {
        // 白板: empty face with blue border
        span.style.color = '#5b9bd5';
        span.style.textShadow = 'none';
        div.style.borderColor = '#5b9bd5';
        div.style.borderWidth = '2px';
      }
      div.appendChild(span);
    } else if (tile.suit === 'feng') {
      // 风牌: bold black
      const span = document.createElement('span');
      span.className = 'tile-honor';
      span.style.color = '#1a1a1a';
      span.style.fontWeight = '900';
      span.textContent = tile.display;
      div.appendChild(span);
    } else {
      // 数牌: rank number + suit name, color-coded
      // wan=red, tiao=green, tong=blue
      const suitColor = TILE_SUITS[tile.suit]?.color || '#333';
      const SUIT_BG = { wan: '#fff0f0', tiao: '#f0fff0', tong: '#f0f0ff' };
      // Tinted background per suit for instant recognition
      div.style.background = SUIT_BG[tile.suit] || '';
      div.style.borderLeftWidth = '3px';
      div.style.borderLeftColor = suitColor;
      const rank = document.createElement('span');
      rank.className = 'tile-rank';
      rank.style.color = suitColor;
      rank.textContent = tile.rank;
      div.appendChild(rank);
      const suit = document.createElement('span');
      suit.className = 'tile-suit';
      suit.style.color = suitColor;
      suit.textContent = TILE_SUITS[tile.suit]?.name || '';
      div.appendChild(suit);
    }
  }

  // All styles now in tiles.css — no JS injection needed
  function injectTileImageStyles() {
    // No-op: styles moved to css/tiles.css
  }

  // ╔═══════════════════════════════════════════════════════════╗
  // ║  GAME STATE                                              ║
  // ╚═══════════════════════════════════════════════════════════╝

  let state = null;
  let dustInterval = null;
  let rules = null;

  function createInitialState(mode = 'beijing') {
    rules = mode === 'sichuan' ? SichuanRules : BeijingRules;
    const deck = TileUtils.shuffle(rules.createDeck());

    return {
      mode,
      deck,
      wall: [...deck], // tiles to draw from
      drawIndex: 0,
      players: [
        { hand: [], melds: [], discards: [], score: 25000, isHuman: true, name: '我', avatar: '🎀', personality: null, removedSuit: null, hasWon: false },
        { hand: [], melds: [], discards: [], score: 25000, isHuman: false, name: '下家', avatar: '🦊', personality: 'aggressive', removedSuit: null, hasWon: false },
        { hand: [], melds: [], discards: [], score: 25000, isHuman: false, name: '对家', avatar: '🐻', personality: 'cautious', removedSuit: null, hasWon: false },
        { hand: [], melds: [], discards: [], score: 25000, isHuman: false, name: '上家', avatar: '🐰', personality: 'balanced', removedSuit: null, hasWon: false },
      ],
      currentPlayer: 0,    // dealer starts
      dealer: 0,
      roundWind: 'fe',      // east wind
      round: 1,
      discardPile: [],      // all discards
      lastDiscard: null,
      lastDiscardPlayer: -1,
      turnPhase: 'idle',    // idle, draw, discard, action, waiting
      selectedTile: null,
      lastDrawnTile: null,  // Track the tile just drawn for tsumo detection
      gameOver: false,
      winners: [],
    };
  }

  // ╔═══════════════════════════════════════════════════════════╗
  // ║  GAME FLOW                                               ║
  // ╚═══════════════════════════════════════════════════════════╝

  async function startGame(mode = 'beijing') {
    injectTileImageStyles();
    preloadImages();
    Particles.init();
    Particles.start();

    state = createInitialState(mode);

    // Update UI
    updateTopBar();
    clearTable();

    // Start ambient dust
    if (dustInterval) clearInterval(dustInterval);
    dustInterval = setInterval(() => Particles.dustMotes(), 2000);

    // Deal animation
    await dealTiles();

    // Sichuan: choose 缺一门
    if (mode === 'sichuan') {
      await chooseQueYiMen();
    }

    // Start first turn
    startTurn(state.dealer);
  }

  function clearTable() {
    const ids = ['hand-bottom', 'hand-top', 'hand-left', 'hand-right', 'discard-pool'];
    for (const id of ids) {
      const el = document.getElementById(id);
      if (el) el.innerHTML = '';
    }
    hideActionBar();
  }

  function updateTopBar() {
    const windNames = { fe: '东风', fs: '南风', fw: '西风', fn: '北风' };
    const windEl = document.getElementById('wind-indicator');
    const roundEl = document.getElementById('round-number');
    if (windEl) windEl.textContent = windNames[state.roundWind] || '东风';
    if (roundEl) roundEl.textContent = `第${state.round}局`;
    updateScoreDisplay();
  }

  function updateScoreDisplay() {
    if (!state) return;
    const scoreEl = document.getElementById('my-score');
    if (scoreEl) {
      scoreEl.textContent = state.players[0].score.toLocaleString();
    }
  }

  // ─── Deal tiles with cascade animation ───
  async function dealTiles() {
    const { wall, players } = state;
    let wallIdx = 0;

    // Deal 13 tiles to each player
    for (let round = 0; round < 13; round++) {
      for (let p = 0; p < 4; p++) {
        const playerIdx = (state.dealer + p) % 4;
        if (wallIdx >= wall.length) break;
        players[playerIdx].hand.push(wall[wallIdx]);
        wallIdx++;
      }
    }

    state.drawIndex = wallIdx;

    // Sort player hands
    for (const p of players) {
      p.hand = TileUtils.sortHand(p.hand);
    }

    // Render with staggered animation
    for (let p = 0; p < 4; p++) {
      await renderHand(p, true);
      await wait(100);
    }

    updateRemainingTiles();
    Sound.playDraw();
  }

  // ─── Sichuan: 缺一门 selection ───
  function chooseQueYiMen() {
    return new Promise(resolve => {
      // AI players choose automatically
      for (let i = 1; i < 4; i++) {
        state.players[i].removedSuit = AI.chooseQueYiMen(state.players[i].hand);
      }

      // Human player chooses
      const suggested = SichuanRules.suggestQueYiMen(state.players[0].hand);

      const overlay = document.createElement('div');
      overlay.className = 'queyimen-overlay';

      const suitNames = { wan: '万子', tiao: '条子', tong: '筒子' };
      const suitColors = { wan: '#e74c3c', tiao: '#2ecc71', tong: '#3498db' };

      overlay.innerHTML = `
        <div class="queyimen-panel">
          <h3>🌶️ 缺一门</h3>
          <p>选择要去掉的花色（该花色的牌要先打出去）</p>
          <div class="queyimen-options">
            ${['wan', 'tiao', 'tong'].map(s => `
              <button class="queyimen-btn ${s === suggested ? 'recommended' : ''}"
                      data-suit="${s}" style="color:${suitColors[s]}">
                ${suitNames[s]}
                <br><small style="font-size:11px;opacity:0.6">${s === suggested ? '推荐' : ''}</small>
              </button>
            `).join('')}
          </div>
        </div>
      `;

      document.body.appendChild(overlay);

      overlay.querySelectorAll('.queyimen-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          state.players[0].removedSuit = btn.dataset.suit;
          overlay.remove();
          Sound.playTap();
          resolve();
        });
      });
    });
  }

  // ─── Render a player's hand ───
  async function renderHand(playerIndex, animate = false) {
    const player = state.players[playerIndex];
    const positions = ['hand-bottom', 'hand-right', 'hand-top', 'hand-left'];
    const container = document.getElementById(positions[playerIndex]);
    if (!container) return;

    container.innerHTML = '';

    const isHuman = player.isHuman;
    const isBottom = playerIndex === 0;
    const isSide = playerIndex === 1 || playerIndex === 3;
    const small = !isBottom;

    // Render melds first
    for (const meld of player.melds) {
      const group = document.createElement('div');
      group.className = 'meld-group';
      for (const tile of meld.tiles) {
        const tileEl = renderTile(tile, { small, faceDown: false });
        tileEl.classList.add('locked');
        group.appendChild(tileEl);
      }
      container.appendChild(group);
    }

    // Render hand tiles
    const tiles = player.hand;
    for (let i = 0; i < tiles.length; i++) {
      const tile = tiles[i];
      const faceDown = !isHuman;
      const tileEl = renderTile(tile, {
        faceDown,
        small,
        selected: state.selectedTile?.id === tile.id,
      });

      if (isHuman) {
        setupTileInteraction(tileEl, tile, playerIndex);
      }

      if (animate) {
        tileEl.style.opacity = '0';
        tileEl.style.transform = 'translateY(-30px) scale(0.5)';
        setTimeout(() => {
          tileEl.style.transition = 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)';
          tileEl.style.opacity = '1';
          tileEl.style.transform = 'translateY(0) scale(1)';
        }, i * 40);
      }

      container.appendChild(tileEl);
    }
  }

  // ─── Tile interaction (tap to select, tap again to discard) ───
  function setupTileInteraction(el, tile, playerIndex) {
    let tapHandled = false;

    function handleTap(e) {
      e.preventDefault();
      e.stopPropagation();
      if (tapHandled) return;
      tapHandled = true;
      setTimeout(() => tapHandled = false, 200);

      if (state.turnPhase !== 'discard' || state.currentPlayer !== playerIndex) return;
      if (state.gameOver) return;

      // Sichuan: if player still has removed suit tiles, must discard those
      if (state.mode === 'sichuan' && state.players[0].removedSuit) {
        const removedSuit = state.players[0].removedSuit;
        const hasRemoved = state.players[0].hand.some(t => t.suit === removedSuit);
        if (hasRemoved && tile.suit !== removedSuit) {
          // Flash the removed suit tiles
          shakeElement(el);
          return;
        }
      }

      Sound.playTap();

      if (state.selectedTile?.id === tile.id) {
        // Second tap — confirm discard
        discardTile(playerIndex, tile);
      } else {
        // First tap — select
        state.selectedTile = tile;
        renderHand(playerIndex);
      }
    }

    el.addEventListener('click', handleTap);
    el.addEventListener('touchend', handleTap, { passive: false });
  }

  function shakeElement(el) {
    el.style.animation = 'none';
    el.offsetHeight; // trigger reflow
    el.style.animation = 'shake 0.3s ease';
    setTimeout(() => el.style.animation = '', 300);
  }

  // ─── Draw a tile from the wall ───
  function drawTile(playerIndex) {
    if (state.drawIndex >= state.wall.length) {
      // No more tiles — draw game
      handleDrawGame();
      return null;
    }

    const tile = state.wall[state.drawIndex];
    state.drawIndex++;
    state.players[playerIndex].hand.push(tile);
    state.players[playerIndex].hand = TileUtils.sortHand(state.players[playerIndex].hand);
    state.lastDrawnTile = tile;

    updateRemainingTiles();

    if (playerIndex === 0) {
      Sound.playDraw();
    }

    return tile;
  }

  // ─── Discard a tile ───
  async function discardTile(playerIndex, tile) {
    const player = state.players[playerIndex];
    const tileIndex = player.hand.findIndex(t => t.id === tile.id);
    if (tileIndex === -1) return;

    // Animate the discarded tile out of hand (player's hand area)
    if (playerIndex === 0) {
      const handContainer = document.getElementById('hand-bottom');
      if (handContainer) {
        const tileEls = handContainer.querySelectorAll('.tile');
        for (const el of tileEls) {
          if (el.dataset.id === tile.id) {
            el.classList.add('discarding');
            break;
          }
        }
      }
      // Wait for the initial "pop" part of animation
      await wait(150);
    }

    // Remove from hand
    player.hand.splice(tileIndex, 1);
    player.hand = TileUtils.sortHand(player.hand);
    state.selectedTile = null;

    // Add to discard pile
    player.discards.push(tile);
    state.discardPile.push(tile);
    state.lastDiscard = tile;
    state.lastDiscardPlayer = playerIndex;

    // Sound
    Sound.playPlace();

    // Render discard
    renderDiscard(tile);

    // Re-render hand
    await renderHand(playerIndex);

    // Check other players for reactions (hu/gang/peng/chi)
    await checkReactions(playerIndex, tile);
  }

  // ─── Render a discarded tile ───
  function renderDiscard(tile) {
    const pool = document.getElementById('discard-pool');
    if (!pool) return;

    // Discard tiles are always face-up (visible to all players)
    const tileEl = renderTile(tile, { small: false, mini: true, faceDown: false });
    tileEl.classList.add('entering');
    tileEl.style.opacity = '0';
    tileEl.style.transform = 'translateY(-20px) scale(1.3)';
    pool.appendChild(tileEl);

    requestAnimationFrame(() => {
      tileEl.style.transition = 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)';
      tileEl.style.opacity = '1';
      tileEl.style.transform = 'translateY(0) scale(1)';
    });
  }

  // ─── Update remaining tiles display ───
  function updateRemainingTiles() {
    const remaining = state.wall.length - state.drawIndex;
    const total = state.wall.length;
    const el = document.getElementById('tiles-remaining');
    if (el) el.textContent = remaining;

    // Update progress ring if present
    const ringContainer = document.querySelector('.remaining-tiles');
    if (ringContainer && !ringContainer.querySelector('.remaining-ring')) {
      // Replace simple display with ring
      ringContainer.innerHTML = '';
      const ring = document.createElement('div');
      ring.className = 'remaining-ring';
      const radius = 22;
      const circumference = 2 * Math.PI * radius;
      ring.innerHTML = `
        <svg width="56" height="56" viewBox="0 0 56 56">
          <circle cx="28" cy="28" r="${radius}" fill="none" stroke="rgba(255,255,255,0.1)" stroke-width="4"/>
          <circle cx="28" cy="28" r="${radius}" fill="none" stroke="#f5c518" stroke-width="4"
            stroke-dasharray="${circumference}"
            stroke-dashoffset="${circumference * (1 - remaining / total)}"
            stroke-linecap="round"
            class="ring-progress"
            style="transition: stroke-dashoffset 0.3s ease"/>
        </svg>
        <span class="ring-text">${remaining}</span>
        <span class="ring-label">余牌</span>
      `;
      ringContainer.appendChild(ring);
    } else {
      // Update existing ring
      const ringText = ringContainer?.querySelector('.ring-text');
      const ringProgress = ringContainer?.querySelector('.ring-progress');
      if (ringText) ringText.textContent = remaining;
      if (ringProgress) {
        const radius = 22;
        const circumference = 2 * Math.PI * radius;
        ringProgress.style.strokeDashoffset = circumference * (1 - remaining / total);
      }
    }
  }

  // ╔═══════════════════════════════════════════════════════════╗
  // ║  TURN MANAGEMENT                                         ║
  // ╚═══════════════════════════════════════════════════════════╝

  function startTurn(playerIndex) {
    if (state.gameOver) return;

    state.currentPlayer = playerIndex;
    state.turnPhase = 'draw';
    state.selectedTile = null;

    // Update turn indicator
    updateTurnIndicator(playerIndex);

    // Draw tile
    const drawn = drawTile(playerIndex);
    if (!drawn) return; // draw game

    const player = state.players[playerIndex];

    // Check for tsumo (self-draw win)
    // Hand already includes drawn tile (14 tiles), so check the full hand directly
    const huResult = rules.checkWin(player.hand, player.melds);

    if (player.isHuman) {
      // Render hand with new tile
      renderHand(playerIndex, false);

      // Check for auto-win / an gang / jia gang
      if (huResult) {
        showActionBar(['hu']);
      }

      const anGangs = rules.findAnGang(player.hand);
      const jiaGangs = rules.findJiaGang(player.hand, player.melds);

      if (anGangs.length > 0 || jiaGangs.length > 0) {
        showActionBar(huResult ? ['hu', 'gang', 'pass'] : ['gang', 'pass']);
        state.turnPhase = 'action';
        return;
      }

      if (huResult) {
        showActionBar(['hu', 'pass']);
        state.turnPhase = 'action';
        return;
      }

      state.turnPhase = 'discard';
    } else {
      // AI turn
      handleAITurn(playerIndex, drawn, huResult);
    }
  }

  async function handleAITurn(playerIndex, drawnTile, huResult) {
    const player = state.players[playerIndex];

    // Check tsumo
    if (huResult) {
      if (AI.PERSONALITIES[player.personality]?.aggression > 0.2 || Math.random() > 0.1) {
        await wait(500);
        await handleHu(playerIndex, drawnTile, true);
        return;
      }
    }

    // AI takes its turn
    const gameState = {
      discardPile: state.discardPile,
      allMelds: state.players.flatMap(p => p.melds),
      playerDiscards: state.players.map(p => p.discards),
      rules,
      remainingTiles: state.wall.length - state.drawIndex,
    };

    const decision = await AI.takeTurn({
      hand: player.hand,
      melds: player.melds,
      personality: player.personality,
      playerIndex,
      removedSuit: player.removedSuit,
    }, gameState);

    if (decision.action === 'angang') {
      await handleAnGang(playerIndex, decision.tileKey);
    } else if (decision.action === 'jiagang') {
      await handleJiaGang(playerIndex, decision.tileKey);
    } else if (decision.action === 'discard') {
      await discardTile(playerIndex, decision.tile);
    }
  }

  // ─── Check reactions to a discard ───
  async function checkReactions(discardPlayerIndex, tile) {
    if (state.gameOver) return;

    const reactions = [];

    // Check each other player for hu > gang > peng > chi
    for (let i = 1; i <= 3; i++) {
      const pIdx = (discardPlayerIndex + i) % 4;
      const player = state.players[pIdx];
      if (player.hasWon) continue;

      // Check hu
      const huResult = rules.checkCanHu(player.hand, tile, player.melds);
      if (huResult) {
        reactions.push({ playerIndex: pIdx, action: 'hu', priority: 4 });
      }

      // Check gang
      if (rules.canGang(player.hand, tile)) {
        reactions.push({ playerIndex: pIdx, action: 'gang', priority: 3 });
      }

      // Check peng
      if (rules.canPeng(player.hand, tile)) {
        reactions.push({ playerIndex: pIdx, action: 'peng', priority: 2 });
      }

      // Check chi (only next player)
      const chiOptions = rules.canChi(player.hand, tile, pIdx, discardPlayerIndex);
      if (chiOptions.length > 0) {
        reactions.push({ playerIndex: pIdx, action: 'chi', priority: 1, options: chiOptions });
      }
    }

    if (reactions.length === 0) {
      // No reactions — next player's turn
      nextTurn(discardPlayerIndex);
      return;
    }

    // Sort by priority
    reactions.sort((a, b) => b.priority - a.priority);

    // For human player, show action bar
    const humanReactions = reactions.filter(r => state.players[r.playerIndex].isHuman);
    const aiReactions = reactions.filter(r => !state.players[r.playerIndex].isHuman);

    if (humanReactions.length > 0) {
      const hr = humanReactions[0];
      const actions = [];
      for (const r of reactions.filter(r2 => r2.playerIndex === hr.playerIndex)) {
        actions.push(r.action);
      }
      actions.push('pass');
      showActionBar(actions);
      state.turnPhase = 'action';
      state._pendingReactions = reactions;
      return;
    }

    // All AI reactions
    for (const reaction of aiReactions) {
      const player = state.players[reaction.playerIndex];
      const gameState = {
        discardPile: state.discardPile,
        allMelds: state.players.flatMap(p => p.melds),
        playerDiscards: state.players.map(p => p.discards),
        rules,
      };

      const decision = await AI.reactToDiscard({
        hand: player.hand,
        melds: player.melds,
        personality: player.personality,
        playerIndex: reaction.playerIndex,
        removedSuit: player.removedSuit,
      }, tile, discardPlayerIndex, gameState);

      if (decision.action === 'hu') {
        await handleHu(reaction.playerIndex, tile, false);
        return;
      } else if (decision.action === 'gang') {
        await handleMingGang(reaction.playerIndex, tile, discardPlayerIndex);
        return;
      } else if (decision.action === 'peng') {
        await handlePeng(reaction.playerIndex, tile, discardPlayerIndex);
        return;
      } else if (decision.action === 'chi') {
        await handleChi(reaction.playerIndex, tile, decision.option, discardPlayerIndex);
        return;
      }
    }

    // Everyone passed
    nextTurn(discardPlayerIndex);
  }

  function nextTurn(fromPlayer) {
    if (state.gameOver) return;

    let next = (fromPlayer + 1) % 4;
    // Skip winners in blood war
    if (state.mode === 'sichuan') {
      let attempts = 0;
      while (state.players[next].hasWon && attempts < 4) {
        next = (next + 1) % 4;
        attempts++;
      }
      if (attempts >= 4) {
        handleDrawGame();
        return;
      }
    }

    startTurn(next);
  }

  // ─── Update turn indicator ───
  function updateTurnIndicator(playerIndex) {
    const areas = ['player-bottom', 'player-right', 'player-top', 'player-left'];
    areas.forEach((id, i) => {
      const el = document.getElementById(id);
      if (el) {
        el.classList.toggle('active-turn', i === playerIndex);
      }
    });
  }

  // ╔═══════════════════════════════════════════════════════════╗
  // ║  ACTIONS: Chi / Peng / Gang / Hu / Pass                  ║
  // ╚═══════════════════════════════════════════════════════════╝

  function showActionBar(actions) {
    const bar = document.getElementById('action-bar');
    if (!bar) return;
    bar.style.display = 'flex';

    const btnMap = {
      chi: '.btn-chi',
      peng: '.btn-peng',
      gang: '.btn-gang',
      hu: '.btn-hu',
      pass: '.btn-pass',
    };

    // Hide all first
    Object.values(btnMap).forEach(sel => {
      const btn = bar.querySelector(sel);
      if (btn) btn.style.display = 'none';
    });

    // Show requested
    for (const action of actions) {
      const btn = bar.querySelector(btnMap[action]);
      if (btn) {
        btn.style.display = '';
        // Pulse animation
        btn.style.animation = 'none';
        btn.offsetHeight;
        btn.style.animation = 'pulse 1s ease-in-out infinite';
      }
    }

    // Slide up animation
    bar.style.transform = 'translateY(100%)';
    bar.style.transition = 'transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)';
    requestAnimationFrame(() => {
      bar.style.transform = 'translateY(0)';
    });
  }

  function hideActionBar() {
    const bar = document.getElementById('action-bar');
    if (bar) {
      bar.style.display = 'none';
      bar.querySelectorAll('.action-btn').forEach(btn => {
        btn.style.animation = '';
      });
    }
  }

  // ─── Show full-screen calligraphy action text ───
  function showActionText(text, color = '#ff6b9d') {
    const el = document.createElement('div');
    el.className = 'action-calligraphy';
    el.textContent = text;
    el.style.color = color;

    // Special golden treatment for "胡"
    const isHu = text.includes('胡');
    if (isHu) {
      el.classList.add('action-hu');
    }

    document.body.appendChild(el);

    // Ink splash particles (gold sparkles for Hu)
    const table = document.getElementById('mahjong-table');
    if (table) {
      const rect = table.getBoundingClientRect();
      if (isHu) {
        Particles.goldSparkles(rect.width / 2, rect.height / 2, 40);
      } else {
        Particles.inkSplash(rect.width / 2, rect.height / 2, color);
      }
    }

    setTimeout(() => el.remove(), isHu ? 1200 : 900);
  }

  // ─── Chi action ───
  async function handleChi(playerIndex, tile, option, fromPlayer) {
    hideActionBar();
    state.turnPhase = 'action';

    showActionText('吃！', '#5b9bd5');
    Sound.playChi();
    if (playerIndex === 0 && typeof Stats !== 'undefined') Stats.recordAction('chi');

    const player = state.players[playerIndex];

    // Remove the tiles from hand that form the chi
    const chiTiles = [tile];
    const neededRanks = option.filter(r => r !== tile.rank);
    for (const rank of neededRanks) {
      const idx = player.hand.findIndex(t => t.suit === tile.suit && t.rank === rank);
      if (idx >= 0) {
        chiTiles.push(player.hand.splice(idx, 1)[0]);
      }
    }

    // Remove last discard from pool
    removeLastDiscard();

    // Add meld
    player.melds.push({ type: 'chi', tiles: chiTiles });
    player.hand = TileUtils.sortHand(player.hand);

    await wait(500);
    await renderHand(playerIndex);

    // Player must discard
    if (player.isHuman) {
      state.currentPlayer = playerIndex;
      state.turnPhase = 'discard';
    } else {
      state.currentPlayer = playerIndex;
      const gameState = {
        discardPile: state.discardPile,
        allMelds: state.players.flatMap(p => p.melds),
        playerDiscards: state.players.map(p => p.discards),
        rules,
      };
      const decision = await AI.takeTurn({
        hand: player.hand,
        melds: player.melds,
        personality: player.personality,
        playerIndex,
        removedSuit: player.removedSuit,
      }, gameState);
      await discardTile(playerIndex, decision.tile);
    }
  }

  // ─── Peng action ───
  async function handlePeng(playerIndex, tile, fromPlayer) {
    hideActionBar();
    state.turnPhase = 'action';

    showActionText('碰！', '#2ecc71');
    Sound.playPeng();
    Anim.screenShake(4, 300);
    if (playerIndex === 0 && typeof Stats !== 'undefined') Stats.recordAction('peng');

    const player = state.players[playerIndex];

    // Remove 2 matching tiles from hand
    const pengTiles = [tile];
    let removed = 0;
    for (let i = player.hand.length - 1; i >= 0 && removed < 2; i--) {
      if (player.hand[i].key === tile.key) {
        pengTiles.push(player.hand.splice(i, 1)[0]);
        removed++;
      }
    }

    removeLastDiscard();

    player.melds.push({ type: 'peng', tiles: pengTiles });
    player.hand = TileUtils.sortHand(player.hand);

    await wait(500);
    await renderHand(playerIndex);

    // Player must discard
    if (player.isHuman) {
      state.currentPlayer = playerIndex;
      state.turnPhase = 'discard';
    } else {
      state.currentPlayer = playerIndex;
      const gameState = {
        discardPile: state.discardPile,
        allMelds: state.players.flatMap(p => p.melds),
        playerDiscards: state.players.map(p => p.discards),
        rules,
      };
      const decision = await AI.takeTurn({
        hand: player.hand,
        melds: player.melds,
        personality: player.personality,
        playerIndex,
        removedSuit: player.removedSuit,
      }, gameState);
      await discardTile(playerIndex, decision.tile);
    }
  }

  // ─── Ming Gang (exposed gang from discard) ───
  async function handleMingGang(playerIndex, tile, fromPlayer) {
    hideActionBar();
    state.turnPhase = 'action';

    showActionText('杠！', '#9b59b6');
    Sound.playGang();
    Anim.screenShake(6, 400);
    if (playerIndex === 0 && typeof Stats !== 'undefined') Stats.recordAction('gang');

    const player = state.players[playerIndex];

    const gangTiles = [tile];
    let removed = 0;
    for (let i = player.hand.length - 1; i >= 0 && removed < 3; i--) {
      if (player.hand[i].key === tile.key) {
        gangTiles.push(player.hand.splice(i, 1)[0]);
        removed++;
      }
    }

    removeLastDiscard();

    player.melds.push({ type: 'gang', tiles: gangTiles, gangType: 'ming' });
    player.hand = TileUtils.sortHand(player.hand);

    await wait(500);
    await renderHand(playerIndex);

    // Draw replacement tile from end of wall
    const replacement = drawTileFromEnd(playerIndex);
    if (!replacement) return;

    // Check tsumo on replacement (hand already includes the replacement tile)
    const huResult = rules.checkWin(player.hand, player.melds);

    if (player.isHuman) {
      renderHand(playerIndex);
      if (huResult) {
        showActionBar(['hu', 'pass']);
        state.turnPhase = 'action';
        state.currentPlayer = playerIndex;
      } else {
        state.currentPlayer = playerIndex;
        state.turnPhase = 'discard';
      }
    } else {
      if (huResult) {
        await handleHu(playerIndex, replacement, true);
      } else {
        state.currentPlayer = playerIndex;
        const gameState = {
          discardPile: state.discardPile,
          allMelds: state.players.flatMap(p => p.melds),
          playerDiscards: state.players.map(p => p.discards),
          rules,
        };
        const decision = await AI.takeTurn({
          hand: player.hand,
          melds: player.melds,
          personality: player.personality,
          playerIndex,
          removedSuit: player.removedSuit,
        }, gameState);
        await discardTile(playerIndex, decision.tile);
      }
    }
  }

  // ─── An Gang (concealed gang) ───
  async function handleAnGang(playerIndex, tileKey) {
    hideActionBar();
    state.turnPhase = 'action';

    showActionText('杠！', '#9b59b6');
    Sound.playGang();
    Anim.screenShake(6, 400);

    const player = state.players[playerIndex];
    const gangTiles = [];

    for (let i = player.hand.length - 1; i >= 0; i--) {
      if (player.hand[i].key === tileKey) {
        gangTiles.push(player.hand.splice(i, 1)[0]);
      }
    }

    player.melds.push({ type: 'gang', tiles: gangTiles, gangType: 'an' });
    player.hand = TileUtils.sortHand(player.hand);

    await wait(500);
    await renderHand(playerIndex);

    // Draw replacement
    const replacement = drawTileFromEnd(playerIndex);
    if (!replacement) return;

    if (player.isHuman) {
      renderHand(playerIndex);
      state.currentPlayer = playerIndex;
      state.turnPhase = 'discard';
    } else {
      state.currentPlayer = playerIndex;
      const gameState = {
        discardPile: state.discardPile,
        allMelds: state.players.flatMap(p => p.melds),
        playerDiscards: state.players.map(p => p.discards),
        rules,
      };
      const decision = await AI.takeTurn({
        hand: player.hand,
        melds: player.melds,
        personality: player.personality,
        playerIndex,
        removedSuit: player.removedSuit,
      }, gameState);
      await discardTile(playerIndex, decision.tile);
    }
  }

  // ─── Jia Gang (add to peng) ───
  async function handleJiaGang(playerIndex, tileKey) {
    hideActionBar();
    showActionText('杠！', '#9b59b6');
    Sound.playGang();
    Anim.screenShake(6, 400);

    const player = state.players[playerIndex];

    // Find the peng meld and upgrade it
    for (const meld of player.melds) {
      if (meld.type === 'peng' && meld.tiles[0].key === tileKey) {
        const tileIdx = player.hand.findIndex(t => t.key === tileKey);
        if (tileIdx >= 0) {
          meld.tiles.push(player.hand.splice(tileIdx, 1)[0]);
          meld.type = 'gang';
          meld.gangType = 'jia';
        }
        break;
      }
    }

    player.hand = TileUtils.sortHand(player.hand);
    await wait(500);
    await renderHand(playerIndex);

    const replacement = drawTileFromEnd(playerIndex);
    if (!replacement) return;

    if (player.isHuman) {
      renderHand(playerIndex);
      state.currentPlayer = playerIndex;
      state.turnPhase = 'discard';
    } else {
      state.currentPlayer = playerIndex;
      const gameState = {
        discardPile: state.discardPile,
        allMelds: state.players.flatMap(p => p.melds),
        playerDiscards: state.players.map(p => p.discards),
        rules,
      };
      const decision = await AI.takeTurn({
        hand: player.hand,
        melds: player.melds,
        personality: player.personality,
        playerIndex,
        removedSuit: player.removedSuit,
      }, gameState);
      await discardTile(playerIndex, decision.tile);
    }
  }

  // ─── Hu action ───
  async function handleHu(playerIndex, winTile, isTsumo = false) {
    hideActionBar();
    state.turnPhase = 'idle';

    const player = state.players[playerIndex];

    // Epic celebration
    showActionText('胡！🎉', '#f5c518');
    Sound.playHu();
    Anim.screenShake(8, 500);

    await wait(300);

    // Particles
    const table = document.getElementById('mahjong-table');
    if (table) {
      Particles.goldSparkles(table.offsetWidth / 2, table.offsetHeight / 2, 50);
      Particles.confettiRain(80);
    }

    // Calculate score
    // For tsumo, hand already has 14 tiles; for ron, add the win tile
    const handForScoring = isTsumo ? [...player.hand] : [...player.hand, winTile];
    const scoreResult = rules.calculateScore(
      handForScoring,
      player.melds,
      winTile,
      {
        isZimo: isTsumo,
        seatWind: ['fe', 'fs', 'fw', 'fn'][playerIndex],
        roundWind: state.roundWind,
        removedSuit: player.removedSuit,
      }
    );

    // Update scores
    const points = scoreResult.baseScore;
    if (isTsumo) {
      // Everyone pays
      for (let i = 0; i < 4; i++) {
        if (i !== playerIndex) {
          state.players[i].score -= points;
        }
      }
      player.score += points * 3;
    } else {
      state.players[state.lastDiscardPlayer].score -= points;
      player.score += points;
    }

    player.hasWon = true;
    state.winners.push(playerIndex);

    updateScoreDisplay();

    // ── BIG score change animation ──
    const scoreEl = document.getElementById('my-score');
    if (scoreEl) {
      scoreEl.style.transition = 'transform 0.3s, color 0.3s';
      scoreEl.style.transform = 'scale(1.5)';
      scoreEl.style.color = playerIndex === 0 ? '#22c55e' : '#ef4444';
      setTimeout(() => {
        scoreEl.style.transform = 'scale(1)';
        scoreEl.style.color = '';
      }, 1500);
    }

    // Record stats
    if (typeof Stats !== 'undefined') {
      if (playerIndex === 0) {
        const handType = isTsumo ? 'zimo' : null;
        Stats.recordWin(state.mode, points, handType);
      } else {
        Stats.recordLoss();
      }
    }

    await wait(700);

    // Show win screen
    showWinScreen(playerIndex, scoreResult, isTsumo);
  }

  // ─── Show win screen ───
  // Avatar map: player index → SVG path
  const AVATAR_MAP = {
    0: 'assets/avatars/kitty.svg',
    1: 'assets/avatars/fox.svg',
    2: 'assets/avatars/bear.svg',
    3: 'assets/avatars/bunny.svg',
  };
  const AVATAR_FALLBACK = { 0: '🎀', 1: '🦊', 2: '🐻', 3: '🐰' };

  function showWinScreen(playerIndex, scoreResult, isTsumo) {
    const player = state.players[playerIndex];
    const modal = document.getElementById('win-screen');
    if (!modal) return;

    modal.style.display = 'flex';
    modal.style.opacity = '0';
    requestAnimationFrame(() => {
      modal.style.transition = 'opacity 0.4s';
      modal.style.opacity = '1';
    });

    // Win title with avatar image
    const title = modal.querySelector('.win-title');
    if (title) {
      if (player.isHuman) {
        title.textContent = '🎉 胡牌！';
      } else {
        const avatarSrc = AVATAR_MAP[playerIndex] || '';
        title.innerHTML = `<img src="${avatarSrc}" style="width:36px;height:36px;border-radius:50%;vertical-align:middle;margin-right:6px;" onerror="this.outerHTML='${player.avatar}'"> ${player.name} 胡牌！`;
      }
    }

    // Render winning hand
    const handContainer = modal.querySelector('#win-hand');
    if (handContainer) {
      handContainer.innerHTML = '';
      handContainer.style.display = 'flex';
      handContainer.style.gap = '3px';
      handContainer.style.justifyContent = 'center';
      handContainer.style.flexWrap = 'wrap';

      // Melds
      for (const meld of player.melds) {
        for (const tile of meld.tiles) {
          const el = renderTile(tile, { small: true });
          el.classList.add('winning');
          handContainer.appendChild(el);
        }
        // Separator
        const sep = document.createElement('div');
        sep.style.width = '4px';
        handContainer.appendChild(sep);
      }

      // Hand tiles
      const handTiles = player.hand.map(t => renderTile(t, { small: true }));
      handTiles.forEach(el => {
        el.classList.add('winning');
        handContainer.appendChild(el);
      });

      Anim.cascadeReveal(handContainer.querySelectorAll('.tile'), 50);
    }

    // Score
    const scoreEl = modal.querySelector('#win-score');
    if (scoreEl) {
      const pts = scoreResult.baseScore;
      scoreEl.textContent = '0';
      setTimeout(() => Anim.countUp(scoreEl, 0, pts, 1200), 300);
    }

    // Fans
    const fansEl = modal.querySelector('#win-fans');
    if (fansEl) {
      fansEl.innerHTML = scoreResult.fans.map(f =>
        `<div style="margin:4px 0"><b>${f.name}</b> (${f.fan}番) — ${f.desc}</div>`
      ).join('');
      if (isTsumo) {
        fansEl.innerHTML += '<div style="margin:4px 0;color:#ff6b9d"><b>自摸</b></div>';
      }
    }

    // Check blood war
    if (state.mode === 'sichuan' && !SichuanRules.isBloodWarComplete(state.winners)) {
      // Game continues
      state.gameOver = false;
    } else {
      state.gameOver = true;
    }
  }

  // ─── Handle draw game (流局) ───
  function handleDrawGame() {
    state.gameOver = true;
    state.turnPhase = 'idle';
    hideActionBar();

    showActionText('流局', '#95a5a6');

    // Reveal all hands face up (temporarily mark all as human for rendering)
    for (let p = 0; p < 4; p++) {
      const wasHuman = state.players[p].isHuman;
      state.players[p].isHuman = true;
      renderHand(p, true);
      state.players[p].isHuman = wasHuman;
    }

    setTimeout(() => {
      const modal = document.getElementById('win-screen');
      if (modal) {
        modal.style.display = 'flex';
        const title = modal.querySelector('.win-title');
        if (title) title.textContent = '😔 流局';
        const score = modal.querySelector('#win-score');
        if (score) score.textContent = '无人胡牌';
        const fans = modal.querySelector('#win-fans');
        if (fans) fans.innerHTML = '';
        const hand = modal.querySelector('#win-hand');
        if (hand) hand.innerHTML = '';
      }
    }, 1500);
  }

  // ─── Draw from end of wall (for gang replacement) ───
  function drawTileFromEnd(playerIndex) {
    if (state.drawIndex >= state.wall.length) {
      handleDrawGame();
      return null;
    }
    // Take from the end
    const tile = state.wall[state.wall.length - 1];
    state.wall.pop();
    state.players[playerIndex].hand.push(tile);
    state.players[playerIndex].hand = TileUtils.sortHand(state.players[playerIndex].hand);
    updateRemainingTiles();
    return tile;
  }

  // ─── Remove last discard from pool ───
  function removeLastDiscard() {
    const pool = document.getElementById('discard-pool');
    if (pool && pool.lastChild) {
      pool.lastChild.remove();
    }
    state.discardPile.pop();
  }

  // ╔═══════════════════════════════════════════════════════════╗
  // ║  HUMAN PLAYER ACTIONS (called from HTML buttons)         ║
  // ╚═══════════════════════════════════════════════════════════╝

  function chi() {
    if (state.turnPhase !== 'action') return;
    const tile = state.lastDiscard;
    if (!tile) return;

    const options = rules.canChi(state.players[0].hand, tile, 0, state.lastDiscardPlayer);
    if (options.length === 0) return;

    if (options.length === 1) {
      handleChi(0, tile, options[0], state.lastDiscardPlayer);
    } else {
      // Show chi option picker
      showChiPicker(tile, options);
    }
  }

  function showChiPicker(tile, options) {
    const overlay = document.createElement('div');
    overlay.className = 'queyimen-overlay';
    overlay.style.zIndex = '450';

    const optionsHtml = options.map((opt, i) => {
      const ranks = opt.sort((a, b) => a - b);
      const display = ranks.map(r => `${r}${TILE_SUITS[tile.suit]?.name || ''}`).join(' ');
      return `<button class="queyimen-btn" data-idx="${i}" style="font-size:16px;min-width:80px;">${display}</button>`;
    }).join('');

    overlay.innerHTML = `
      <div class="queyimen-panel">
        <h3>选择吃牌组合</h3>
        <p>选择要组成的顺子</p>
        <div class="queyimen-options">${optionsHtml}</div>
      </div>
    `;

    document.body.appendChild(overlay);

    overlay.querySelectorAll('.queyimen-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = parseInt(btn.dataset.idx);
        overlay.remove();
        Sound.playTap();
        handleChi(0, tile, options[idx], state.lastDiscardPlayer);
      });
    });
  }

  function peng() {
    if (state.turnPhase !== 'action') return;
    const tile = state.lastDiscard;
    if (!tile) return;
    if (!rules.canPeng(state.players[0].hand, tile)) return;
    handlePeng(0, tile, state.lastDiscardPlayer);
  }

  function gang() {
    if (state.turnPhase !== 'action') return;

    const player = state.players[0];
    const tile = state.lastDiscard;

    // Check ming gang first
    if (tile && rules.canGang(player.hand, tile)) {
      handleMingGang(0, tile, state.lastDiscardPlayer);
      return;
    }

    // Check an gang
    const anGangs = rules.findAnGang(player.hand);
    if (anGangs.length > 0) {
      handleAnGang(0, anGangs[0]);
      return;
    }

    // Check jia gang
    const jiaGangs = rules.findJiaGang(player.hand, player.melds);
    if (jiaGangs.length > 0) {
      handleJiaGang(0, jiaGangs[0]);
      return;
    }
  }

  function hu() {
    if (state.turnPhase !== 'action') return;

    const player = state.players[0];
    const tile = state.lastDiscard;

    // Tsumo (self-draw win)
    if (state.currentPlayer === 0 && player.hand.length === 14) {
      const winTile = state.lastDrawnTile || player.hand[player.hand.length - 1];
      handleHu(0, winTile, true);
      return;
    }

    // Ron
    if (tile) {
      handleHu(0, tile, false);
    }
  }

  function pass() {
    hideActionBar();
    state.turnPhase = 'idle';
    state._pendingReactions = null;

    // If it was our draw turn, we need to discard
    if (state.currentPlayer === 0 && state.players[0].hand.length === 14) {
      state.turnPhase = 'discard';
      return;
    }

    // Check remaining AI reactions
    if (state.lastDiscard) {
      checkRemainingAIReactions();
    } else {
      nextTurn(state.currentPlayer);
    }
  }

  async function checkRemainingAIReactions() {
    const tile = state.lastDiscard;
    const fromPlayer = state.lastDiscardPlayer;

    for (let i = 1; i <= 3; i++) {
      const pIdx = (fromPlayer + i) % 4;
      const player = state.players[pIdx];
      if (player.isHuman || player.hasWon) continue;

      const gameState = {
        discardPile: state.discardPile,
        allMelds: state.players.flatMap(p => p.melds),
        playerDiscards: state.players.map(p => p.discards),
        rules,
      };

      const decision = await AI.reactToDiscard({
        hand: player.hand,
        melds: player.melds,
        personality: player.personality,
        playerIndex: pIdx,
        removedSuit: player.removedSuit,
      }, tile, fromPlayer, gameState);

      if (decision.action === 'hu') {
        await handleHu(pIdx, tile, false);
        return;
      } else if (decision.action === 'gang') {
        await handleMingGang(pIdx, tile, fromPlayer);
        return;
      } else if (decision.action === 'peng') {
        await handlePeng(pIdx, tile, fromPlayer);
        return;
      } else if (decision.action === 'chi') {
        await handleChi(pIdx, tile, decision.option, fromPlayer);
        return;
      }
    }

    // All passed
    nextTurn(fromPlayer);
  }

  // ╔═══════════════════════════════════════════════════════════╗
  // ║  UTILITIES                                               ║
  // ╚═══════════════════════════════════════════════════════════╝

  function wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  function getState() { return state; }
  function getRules() { return rules; }

  function destroy() {
    Particles.stop();
    if (dustInterval) clearInterval(dustInterval);
    state = null;
  }

  // ╔═══════════════════════════════════════════════════════════╗
  // ║  PUBLIC API                                              ║
  // ╚═══════════════════════════════════════════════════════════╝

  return {
    startGame,
    chi,
    peng,
    gang,
    hu,
    pass,
    getState,
    getRules,
    destroy,
    Sound,
    Particles,
    Anim,
    renderTile,
  };
})();
