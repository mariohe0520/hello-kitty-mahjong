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

  // ── Multi-round persistent state ──
  let multiRound = null;

  function initMultiRound(mode) {
    multiRound = {
      enabled: true,
      mode,
      roundNumber: 1,    // 1 = East round, 2 = South round, etc.
      handNumber: 1,      // 1-4 within each round
      dealerIndex: 0,
      prevailingWind: 'fe',  // fe=east, fs=south, fw=west, fn=north
      cumulativeScores: [25000, 25000, 25000, 25000],
      handsPlayed: 0,
      maxHands: 4,        // 4 hands per round
    };
  }

  function getWindName(windKey) {
    const map = { fe: '东', fs: '南', fw: '西', fn: '北' };
    return map[windKey] || '东';
  }

  function getSeatWind(playerIndex) {
    if (!multiRound) return ['fe','fs','fw','fn'][playerIndex];
    const offset = (playerIndex - multiRound.dealerIndex + 4) % 4;
    return ['fe','fs','fw','fn'][offset];
  }

  function createInitialState(mode = 'beijing') {
    rules = mode === 'sichuan' ? SichuanRules : BeijingRules;
    const deck = TileUtils.shuffle(rules.createDeck());

    const dealerIdx = multiRound ? multiRound.dealerIndex : 0;
    const scores = multiRound ? [...multiRound.cumulativeScores] : [25000, 25000, 25000, 25000];

    return {
      mode,
      deck,
      wall: [...deck], // tiles to draw from
      drawIndex: 0,
      players: [
        { hand: [], melds: [], discards: [], score: scores[0], isHuman: true, name: '我', avatar: '🎀', personality: null, charId: null, removedSuit: null, hasWon: false, pengCount: 0, chiCount: 0, gangCount: 0 },
        { hand: [], melds: [], discards: [], score: scores[1], isHuman: false, name: '狐狸', avatar: '🦊', personality: 'tricky', charId: 'fox', removedSuit: null, hasWon: false, pengCount: 0, chiCount: 0, gangCount: 0 },
        { hand: [], melds: [], discards: [], score: scores[2], isHuman: false, name: '大熊', avatar: '🐻', personality: 'aggressive', charId: 'bear', removedSuit: null, hasWon: false, pengCount: 0, chiCount: 0, gangCount: 0 },
        { hand: [], melds: [], discards: [], score: scores[3], isHuman: false, name: '小兔', avatar: '🐰', personality: 'defensive', charId: 'bunny', removedSuit: null, hasWon: false, pengCount: 0, chiCount: 0, gangCount: 0 },
      ],
      currentPlayer: dealerIdx,    // dealer starts
      dealer: dealerIdx,
      roundWind: multiRound ? multiRound.prevailingWind : 'fe',
      round: multiRound ? multiRound.handsPlayed + 1 : 1,
      discardPile: [],      // all discards
      discardHistory: [],   // FEATURE 2: per-player discard tracking [{tile, playerIndex}, ...]
      lastDiscard: null,
      lastDiscardPlayer: -1,
      turnPhase: 'idle',    // idle, draw, discard, action, waiting
      selectedTile: null,
      lastDrawnTile: null,  // Track the tile just drawn for tsumo detection
      gameOver: false,
      winners: [],
      gameStartTime: Date.now(), // For speed challenges
      turnCount: 0,
    };
  }

  // ╔═══════════════════════════════════════════════════════════╗
  // ║  GAME FLOW                                               ║
  // ╚═══════════════════════════════════════════════════════════╝

  async function startGame(mode = 'beijing', options = {}) {
    injectTileImageStyles();
    preloadImages();
    Particles.init();
    Particles.start();

    // Initialize multi-round if not already active
    if (!multiRound || options.freshStart) {
      initMultiRound(mode);
    }

    state = createInitialState(mode);

    // Campaign level support
    if (options.campaignLevel) {
      state.campaignLevel = options.campaignLevel;
      state.aiDifficulty = options.aiDifficulty || 0.5;
    }

    // Show campaign goal bar
    showCampaignGoalBar();

    // Character-based opponents
    if (options.opponents && typeof Characters !== 'undefined') {
      const charIds = options.opponents;
      for (let i = 1; i < 4 && i - 1 < charIds.length; i++) {
        const charId = charIds[i - 1];
        const char = Characters.getCharacter(charId);
        if (char) {
          state.players[i].name = char.name;
          state.players[i].avatar = char.emoji;
          state.players[i].personality = char.personality;
          state.players[i].charId = charId;
        }
      }
      // Update avatar displays
      const avatarEls = { 1: 'avatar-right', 2: 'avatar-top', 3: 'avatar-left' };
      const nameEls = { 1: 'name-right', 2: 'name-top', 3: 'name-left' };
      for (let i = 1; i < 4; i++) {
        const aEl = document.getElementById(avatarEls[i]);
        const nEl = document.getElementById(nameEls[i]);
        if (aEl) aEl.textContent = state.players[i].avatar;
        if (nEl) nEl.textContent = state.players[i].name;
      }
    }

    // Update UI
    updateTopBar();
    clearTable();

    // Initialize skill system
    if (typeof Skills !== 'undefined') Skills.initForGame();

    // Initialize commentary
    if (typeof Commentary !== 'undefined') Commentary.onGameStart();

    // Start ambient dust
    if (dustInterval) clearInterval(dustInterval);
    dustInterval = setInterval(() => Particles.dustMotes(), 2000);

    // Show character dialogue on game start
    if (typeof Characters !== 'undefined') {
      for (let i = 1; i < 4; i++) {
        const charId = state.players[i].charId;
        if (charId) {
          const line = Characters.getDialogue(charId, 'gameStart');
          if (line && typeof App !== 'undefined') {
            setTimeout(() => App.showCharacterBubble(charId, 'gameStart'), 500 + i * 800);
          }
        }
      }
    }

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
    const ids = ['hand-bottom', 'hand-top', 'hand-left', 'hand-right', 'discard-pool',
                 'discard-river-0', 'discard-river-1', 'discard-river-2', 'discard-river-3'];
    for (const id of ids) {
      const el = document.getElementById(id);
      if (el) el.innerHTML = '';
    }
    // Hide tenpai indicator
    const tenpaiEl = document.getElementById('tenpai-indicator');
    if (tenpaiEl) tenpaiEl.style.display = 'none';
    hideActionBar();
  }

  function updateTopBar() {
    const windNames = { fe: '东风', fs: '南风', fw: '西风', fn: '北风' };
    const windEl = document.getElementById('wind-indicator');
    const roundEl = document.getElementById('round-number');
    if (windEl) windEl.textContent = windNames[state.roundWind] || '东风';
    if (roundEl) {
      if (multiRound) {
        roundEl.textContent = `第${multiRound.handNumber}手 / ${multiRound.maxHands}`;
      } else {
        roundEl.textContent = `第${state.round}局`;
      }
    }
    updateScoreDisplay();
    updateWindDisplay();
    updateRoundWindDisplay();
  }

  function updateWindDisplay() {
    // Show seat winds for each player
    const windMap = { 0: 'wind-bottom', 1: 'wind-right', 2: 'wind-top', 3: 'wind-left' };
    const windChars = { fe: '东', fs: '南', fw: '西', fn: '北' };
    for (let i = 0; i < 4; i++) {
      const el = document.getElementById(windMap[i]);
      if (el) {
        const seatWind = getSeatWind(i);
        el.textContent = windChars[seatWind] || '';
      }
    }
  }

  function updateRoundWindDisplay() {
    const windChars = { fe: '东', fs: '南', fw: '西', fn: '北' };
    const prevEl = document.getElementById('prevailing-wind');
    const handEl = document.getElementById('hand-count');
    if (prevEl) prevEl.textContent = windChars[state.roundWind] || '东';
    if (handEl) {
      if (multiRound) {
        handEl.textContent = `第${multiRound.handNumber}手`;
      } else {
        handEl.textContent = `第${state.round}局`;
      }
    }
  }

  function updateScoreDisplay() {
    if (!state) return;
    const scoreEl = document.getElementById('my-score');
    if (scoreEl) {
      scoreEl.textContent = state.players[0].score.toLocaleString();
    }
    // Update all player scores
    const scoreMap = { 1: 'score-right', 2: 'score-top', 3: 'score-left' };
    for (let i = 1; i < 4; i++) {
      const el = document.getElementById(scoreMap[i]);
      if (el) {
        el.textContent = state.players[i].score.toLocaleString();
      }
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

      // Danger indicator (when skill active or hints enabled)
      if (isHuman && isBottom && typeof Skills !== 'undefined') {
        const showDanger = Skills.isDangerVisionActive() ||
          (typeof App !== 'undefined' && App.getSettings()?.showHints);
        if (showDanger) {
          const gameState = {
            discardPile: state.discardPile,
            players: state.players,
          };
          const danger = Skills.calculateTileDanger(tile, gameState);
          const dangerColor = Skills.getDangerColor(danger);
          const indicator = document.createElement('div');
          indicator.className = 'tile-danger-indicator';
          indicator.style.cssText = `
            position:absolute;bottom:-2px;left:50%;transform:translateX(-50%);
            width:80%;height:3px;border-radius:2px;
            background:${dangerColor};
            opacity:${Skills.isDangerVisionActive() ? '0.9' : '0.5'};
            transition:all 0.3s;
          `;
          tileEl.style.position = 'relative';
          tileEl.appendChild(indicator);
        }
      }

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

  // ─── Draw best tile (Dragon skill) ───
  function drawBestTile(playerIndex) {
    if (state.drawIndex >= state.wall.length) {
      handleDrawGame();
      return null;
    }
    // Evaluate each remaining tile in wall to find best for player
    const player = state.players[playerIndex];
    let bestIdx = state.drawIndex;
    let bestValue = -Infinity;
    const limit = Math.min(state.drawIndex + 20, state.wall.length); // Search next 20 tiles
    for (let i = state.drawIndex; i < limit; i++) {
      const tile = state.wall[i];
      const val = AI.evaluateHand([...player.hand, tile], player.melds);
      const score = (4 - val.shanten) * 100 + val.completeSets * 30 + val.pairs * 10;
      if (score > bestValue) { bestValue = score; bestIdx = i; }
    }
    // Swap best tile to draw position
    [state.wall[state.drawIndex], state.wall[bestIdx]] = [state.wall[bestIdx], state.wall[state.drawIndex]];
    return drawTile(playerIndex);
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

    // Add to discard pile and history
    player.discards.push(tile);
    state.discardPile.push(tile);
    state.discardHistory.push({ tile, playerIndex });
    state.lastDiscard = tile;
    state.lastDiscardPlayer = playerIndex;

    // Sound
    Sound.playPlace();

    // Render discard to per-player river
    renderDiscardToRiver(tile, playerIndex);

    // Re-render hand
    await renderHand(playerIndex);

    // Update tenpai indicator after discard (hand is now 13 tiles)
    if (playerIndex === 0) updateTenpaiIndicator(0);

    // Check other players for reactions (hu/gang/peng/chi)
    await checkReactions(playerIndex, tile);
  }

  // ─── FEATURE 2: Render discard to per-player river ───
  function renderDiscardToRiver(tile, playerIndex) {
    const riverId = `discard-river-${playerIndex}`;
    const river = document.getElementById(riverId);
    if (!river) return;

    // Remove last-discard highlight from all previous tiles
    document.querySelectorAll('.discard-river .tile.last-discard').forEach(el => {
      el.classList.remove('last-discard');
    });

    const tileEl = renderTile(tile, { small: true, mini: true, faceDown: false });
    tileEl.classList.add('last-discard');
    tileEl.style.opacity = '0';
    tileEl.style.transform = 'scale(1.3)';
    river.appendChild(tileEl);

    requestAnimationFrame(() => {
      tileEl.style.transition = 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)';
      tileEl.style.opacity = '1';
      tileEl.style.transform = 'scale(1)';
    });
  }

  // Legacy compatibility
  function renderDiscard(tile) {
    renderDiscardToRiver(tile, state.lastDiscardPlayer >= 0 ? state.lastDiscardPlayer : 0);
  }

  // ─── FEATURE 1: Tenpai indicator with waiting tile display ───
  function updateTenpaiIndicator(playerIndex) {
    if (playerIndex !== 0) return; // Only show for human player
    const player = state.players[0];
    const indicator = document.getElementById('tenpai-indicator');
    const waitingContainer = document.getElementById('tenpai-waiting');
    if (!indicator || !waitingContainer) return;

    // Only check when hand is 13 tiles (waiting state)
    if (player.hand.length !== 13) {
      indicator.style.display = 'none';
      return;
    }

    const tingTiles = rules.getTingTiles(player.hand, player.melds);

    if (tingTiles.length === 0) {
      indicator.style.display = 'none';
      return;
    }

    indicator.style.display = 'flex';
    waitingContainer.innerHTML = '';

    for (const key of tingTiles) {
      const tileData = { ...TILES[key], key, id: key + '_ting' };
      const tileEl = renderTile(tileData, { small: true, mini: true, faceDown: false });
      tileEl.style.position = 'relative';

      // Count remaining copies of this tile in the wall
      const remaining = countRemainingTiles(key);
      const countEl = document.createElement('span');
      countEl.className = 'tile-remain-count';
      countEl.textContent = remaining;
      tileEl.appendChild(countEl);

      waitingContainer.appendChild(tileEl);
    }
  }

  function countRemainingTiles(tileKey) {
    // Count how many of this tile are NOT visible (still in wall or unknown)
    let visible = 0;
    // Discard pile
    for (const t of state.discardPile) {
      if (t.key === tileKey) visible++;
    }
    // All players' melds
    for (const p of state.players) {
      for (const meld of p.melds) {
        for (const t of meld.tiles) {
          if (t.key === tileKey) visible++;
        }
      }
    }
    // Player's own hand
    for (const t of state.players[0].hand) {
      if (t.key === tileKey) visible++;
    }
    return Math.max(0, 4 - visible);
  }

  // Check tenpai for any player (used by AI)
  function isPlayerTenpai(playerIndex) {
    const player = state.players[playerIndex];
    if (player.hand.length !== 13) return false;
    const tingTiles = rules.getTingTiles(player.hand, player.melds);
    return tingTiles.length > 0;
  }

  function getPlayerTingTiles(playerIndex) {
    const player = state.players[playerIndex];
    if (player.hand.length !== 13) return [];
    return rules.getTingTiles(player.hand, player.melds);
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
    state.turnCount++;

    // Update turn indicator
    updateTurnIndicator(playerIndex);

    // Commentary: turn tracking
    if (typeof Commentary !== 'undefined') Commentary.onTurn(state);

    // Skills: turn end processing
    if (typeof Skills !== 'undefined') Skills.onTurnEnd();

    // Draw tile (with skill modifications)
    let drawn;
    if (playerIndex === 0 && typeof Skills !== 'undefined' && Skills.isBestDrawActive()) {
      // Dragon skill: find best tile for player
      Skills.consumeBestDraw();
      drawn = drawBestTile(playerIndex);
    } else {
      drawn = drawTile(playerIndex);
    }
    if (!drawn) return; // draw game

    const player = state.players[playerIndex];

    // Check for tsumo (self-draw win)
    // Hand already includes drawn tile (14 tiles), so check the full hand directly
    const huResult = rules.checkWin(player.hand, player.melds);

    if (player.isHuman) {
      // Render hand with new tile
      renderHand(playerIndex, false);

      // Show skill buttons
      if (typeof Skills !== 'undefined') Skills.renderSkillButton();

      // Update tenpai indicator (will show when hand goes back to 13 after discard)
      updateTenpaiIndicator(0);

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

    // Check tsumo — use FEATURE 6 enhanced decideHu
    if (huResult) {
      let scoreResult = null;
      try {
        scoreResult = rules.calculateScore(player.hand, player.melds, drawnTile, {
          isZimo: true,
          seatWind: getSeatWind(playerIndex),
          roundWind: state.roundWind,
        });
      } catch(e) { /* scoring may fail */ }
      if (typeof AI !== 'undefined' && AI.decideHu) {
        // Use AI's decideHu which may skip low-value wins in blood war
        if (AI.decideHu(player.hand, player.melds, scoreResult, state.mode)) {
          await wait(500);
          await handleHu(playerIndex, drawnTile, true);
          return;
        }
      } else if (AI.PERSONALITIES[player.personality]?.aggression > 0.2 || Math.random() > 0.1) {
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
      mode: state.mode,
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

    // Check blood war completion (Sichuan mode: game ends when 3 of 4 have won)
    if (state.mode === 'sichuan' && typeof SichuanRules !== 'undefined' &&
        SichuanRules.isBloodWarComplete(state.winners)) {
      state.gameOver = true;
      state.turnPhase = 'idle';
      hideActionBar();
      showActionText('血战结束', '#ef4444');
      if (typeof Commentary !== 'undefined') Commentary.announce('血战到底！三家胡牌，对局结束！', '#ef4444', true);
      setTimeout(() => {
        const modal = document.getElementById('win-screen');
        if (modal) {
          modal.style.display = 'flex';
          const title = modal.querySelector('.win-title');
          if (title) title.textContent = '血战结束！';
          const score = modal.querySelector('#win-score');
          if (score) score.textContent = '三家胡牌';
          const fans = modal.querySelector('#win-fans');
          if (fans) fans.innerHTML = state.winners.map(w =>
            `<div>${state.players[w].avatar} ${state.players[w].name} 胡牌</div>`
          ).join('');
          const hand = modal.querySelector('#win-hand');
          if (hand) hand.innerHTML = '';
        }
      }, 1000);
      return;
    }

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
    state.players[playerIndex].chiCount++;
    if (playerIndex === 0 && typeof Stats !== 'undefined') Stats.recordAction('chi');
    if (typeof Commentary !== 'undefined') Commentary.onAction('chi', playerIndex, state);

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
    state.players[playerIndex].pengCount++;
    if (playerIndex === 0 && typeof Stats !== 'undefined') Stats.recordAction('peng');
    if (typeof Commentary !== 'undefined') Commentary.onAction('peng', playerIndex, state);

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
    if (typeof Commentary !== 'undefined') Commentary.onAction('gang', playerIndex, state);

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

    // Find the tile being added to the peng (for qianggang check)
    let gangTile = null;
    const tileIdx = player.hand.findIndex(t => t.key === tileKey);
    if (tileIdx >= 0) {
      gangTile = player.hand[tileIdx];
    }

    // Check for qianggang (robbing the kong) — other players may hu on this tile
    if (gangTile) {
      let robbed = false;
      for (let i = 1; i <= 3; i++) {
        const pIdx = (playerIndex + i) % 4;
        const other = state.players[pIdx];
        if (other.hasWon) continue;

        const huResult = rules.checkCanHu(other.hand, gangTile, other.melds);
        if (huResult) {
          if (other.isHuman) {
            // Show hu option to human player
            showActionBar(['hu', 'pass']);
            state.turnPhase = 'action';
            state._pendingReactions = [{ playerIndex: pIdx, action: 'hu', priority: 4 }];
            state._pendingJiaGang = { playerIndex, tileKey, gangTile };
            return; // Wait for human decision
          } else {
            // AI decides whether to rob the kong
            const gameState = {
              discardPile: state.discardPile,
              allMelds: state.players.flatMap(p => p.melds),
              playerDiscards: state.players.map(p => p.discards),
              rules,
            };
            const decision = await AI.reactToDiscard({
              hand: other.hand,
              melds: other.melds,
              personality: other.personality,
              playerIndex: pIdx,
              removedSuit: other.removedSuit,
            }, gangTile, playerIndex, gameState);

            if (decision.action === 'hu') {
              // Rob the kong! The gang does not complete.
              await handleHu(pIdx, gangTile, false);
              return;
            }
          }
        }
      }
    }

    // No one robbed the kong — proceed with jia gang
    _completeJiaGang(playerIndex, tileKey);
  }

  async function _completeJiaGang(playerIndex, tileKey) {
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

    // Commentary
    if (typeof Commentary !== 'undefined') {
      Commentary.onAction(isTsumo ? 'tsumo' : 'hu', playerIndex, state);
    }

    // Remove skill buttons
    if (typeof Skills !== 'undefined') Skills.removeSkillButton();

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
        // Pass seat wind for scoring bonus (FEATURE 3: wind rotation affects scoring)
        seatWind: getSeatWind(playerIndex),
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
      // Ron: the discarder pays double to balance with tsumo (3 players * 1x each)
      const ronPayment = points * 2;
      state.players[state.lastDiscardPlayer].score -= ronPayment;
      player.score += ronPayment;
    }

    player.hasWon = true;
    state.winners.push(playerIndex);

    updateScoreDisplay();

    // Update multi-round cumulative scores
    if (multiRound) {
      for (let i = 0; i < 4; i++) {
        multiRound.cumulativeScores[i] = state.players[i].score;
      }
    }

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

    // Commentary on score
    if (typeof Commentary !== 'undefined') {
      const totalFan = scoreResult.fans.reduce((s, f) => s + (f.fan || 0), 0);
      Commentary.onScore(scoreResult.fans, totalFan);
    }

    // Record stats
    if (typeof Stats !== 'undefined') {
      if (playerIndex === 0) {
        const handType = isTsumo ? 'zimo' : null;
        Stats.recordWin(state.mode, points, scoreResult.fans, handType);
        // Campaign integration — use new goal verification (FEATURE 5)
        if (state.campaignLevel && typeof App !== 'undefined') {
          const goalResult = verifyCampaignGoal(0, scoreResult, isTsumo);
          state._campaignGoalResult = goalResult;
          App.handleCampaignWin(state.campaignLevel, scoreResult, goalResult);
        }
      } else {
        Stats.recordLoss();
      }
    }

    // Character friendship
    if (typeof Storage !== 'undefined') {
      for (let i = 1; i < 4; i++) {
        const charId = state.players[i].charId;
        if (charId) Storage.addFriendshipExp(charId, playerIndex === 0 ? 15 : 10);
      }
    }

    // Character dialogue on win/lose
    if (typeof Characters !== 'undefined') {
      for (let i = 1; i < 4; i++) {
        const charId = state.players[i].charId;
        if (charId) {
          const event = i === playerIndex ? 'hu' : (playerIndex === 0 ? 'react_others_hu' : 'lose');
          if (typeof App !== 'undefined') {
            setTimeout(() => App.showCharacterBubble(charId, event), 500 + i * 400);
          }
        }
      }
    }

    await wait(700);

    // Show win screen
    showWinScreen(playerIndex, scoreResult, isTsumo);
  }

  // ─── Show win screen ───

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

    // Win title
    const title = modal.querySelector('.win-title');
    if (title) {
      if (player.isHuman) {
        title.textContent = '🎉 胡牌！';
      } else {
        title.innerHTML = `${player.avatar || '🐱'} ${player.name} 胡牌！`;
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

      // Post-game analysis
      const totalFan = scoreResult.fans.reduce((s, f) => s + (f.fan || 0), 0);
      const remaining = state.wall.length - state.drawIndex;
      const turnsUsed = state.drawIndex - 52; // 52 tiles dealt initially
      const efficiency = playerIndex === 0 ? 'good' : 'neutral';

      let analysisHtml = '<div class="analysis-section">';
      analysisHtml += '<div class="analysis-title">📊 对局分析</div>';

      // Turns used
      analysisHtml += `<div class="analysis-item">
        <span class="analysis-icon">⏱</span>
        <span class="analysis-label">胡牌回合</span>
        <span class="analysis-value">${Math.ceil(turnsUsed / 4)}回合</span>
      </div>`;

      // Total fan
      analysisHtml += `<div class="analysis-item">
        <span class="analysis-icon">⭐</span>
        <span class="analysis-label">总番数</span>
        <span class="analysis-value ${totalFan >= 6 ? 'analysis-good' : totalFan >= 3 ? 'analysis-neutral' : ''}">${totalFan}番</span>
      </div>`;

      // Win type
      analysisHtml += `<div class="analysis-item">
        <span class="analysis-icon">${isTsumo ? '🤚' : '🎯'}</span>
        <span class="analysis-label">胡牌方式</span>
        <span class="analysis-value">${isTsumo ? '自摸' : '点炮'}</span>
      </div>`;

      // Remaining tiles
      analysisHtml += `<div class="analysis-item">
        <span class="analysis-icon">🀄</span>
        <span class="analysis-label">剩余牌数</span>
        <span class="analysis-value ${remaining > 40 ? 'analysis-good' : remaining < 15 ? 'analysis-bad' : ''}">${remaining}张</span>
      </div>`;

      // Efficiency rating
      const stars = totalFan >= 6 ? 3 : totalFan >= 3 ? 2 : 1;
      analysisHtml += `<div class="analysis-item">
        <span class="analysis-icon">🏆</span>
        <span class="analysis-label">评价</span>
        <span class="analysis-value" style="color:#f5c518">${'⭐'.repeat(stars)}</span>
      </div>`;

      analysisHtml += '</div>';
      fansEl.innerHTML += analysisHtml;
    }

    // Show campaign goal result if applicable (FEATURE 5)
    if (state._campaignGoalResult) {
      showCampaignGoalResult(state._campaignGoalResult);
    }

    // Update "next" button text for multi-round
    const nextBtn = document.getElementById('btn-next-hand');
    if (nextBtn && multiRound) {
      if (multiRound.handNumber >= multiRound.maxHands) {
        nextBtn.textContent = '查看排名';
      } else {
        nextBtn.textContent = `下一手 (${multiRound.handNumber}/${multiRound.maxHands})`;
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

  // ─── Handle draw game (流局) with tenpai payment ───
  function handleDrawGame() {
    state.gameOver = true;
    state.turnPhase = 'idle';
    hideActionBar();

    showActionText('流局', '#95a5a6');
    if (typeof Commentary !== 'undefined') Commentary.onDrawGame();
    if (typeof Skills !== 'undefined') Skills.removeSkillButton();

    // FEATURE 3: Tenpai payment — check who is tenpai
    const tenpaiPlayers = [];
    const notTenpaiPlayers = [];
    for (let i = 0; i < 4; i++) {
      if (state.players[i].hasWon) continue; // already won in blood war
      const tingTiles = rules.getTingTiles(state.players[i].hand, state.players[i].melds);
      if (tingTiles.length > 0) {
        tenpaiPlayers.push(i);
      } else {
        notTenpaiPlayers.push(i);
      }
    }

    // Tenpai payment: 1000 points from each non-tenpai to each tenpai player
    const tenpaiPayment = 1000;
    if (tenpaiPlayers.length > 0 && notTenpaiPlayers.length > 0) {
      for (const nt of notTenpaiPlayers) {
        const totalPayment = tenpaiPayment * tenpaiPlayers.length;
        state.players[nt].score -= totalPayment;
      }
      for (const tp of tenpaiPlayers) {
        const totalReceived = tenpaiPayment * notTenpaiPlayers.length;
        state.players[tp].score += totalReceived;
      }
      updateScoreDisplay();
      // Update multi-round cumulative scores
      if (multiRound) {
        for (let i = 0; i < 4; i++) {
          multiRound.cumulativeScores[i] = state.players[i].score;
        }
      }
    }

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
        if (title) title.textContent = '流局';
        const score = modal.querySelector('#win-score');
        if (score) score.textContent = '无人胡牌';
        const fans = modal.querySelector('#win-fans');
        if (fans) {
          // Show tenpai payment results
          let html = '';
          if (tenpaiPlayers.length > 0 && notTenpaiPlayers.length > 0) {
            html += '<div class="tenpai-payment-display">';
            html += '<div class="tenpai-payment-title">听牌罚符</div>';
            for (let i = 0; i < 4; i++) {
              const p = state.players[i];
              const isTenpai = tenpaiPlayers.includes(i);
              html += `<div class="tenpai-payment-row">
                <span>${p.avatar} ${p.name}</span>
                <span class="tenpai-status-badge ${isTenpai ? 'is-tenpai' : 'not-tenpai'}">${isTenpai ? '听牌' : '未听'}</span>
                <span style="margin-left:auto;font-weight:700;color:${isTenpai ? '#22c55e' : '#ef4444'}">
                  ${isTenpai ? '+' + (tenpaiPayment * notTenpaiPlayers.length) : '-' + (tenpaiPayment * tenpaiPlayers.length)}
                </span>
              </div>`;
            }
            html += '</div>';
          } else {
            html += '<div style="font-size:13px;color:rgba(255,255,255,0.5);margin:8px 0;">';
            if (tenpaiPlayers.length === 0) html += '四家都未听牌';
            else html += '四家都听牌';
            html += '</div>';
          }
          fans.innerHTML = html;
        }
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

  // ─── Remove last discard from pool/river ───
  function removeLastDiscard() {
    // Remove from the per-player river
    if (state.discardHistory.length > 0) {
      const lastEntry = state.discardHistory[state.discardHistory.length - 1];
      const riverId = `discard-river-${lastEntry.playerIndex}`;
      const river = document.getElementById(riverId);
      if (river && river.lastChild) {
        river.lastChild.remove();
      }
      state.discardHistory.pop();
    }
    // Also remove from legacy pool
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

    // Qianggang hu: robbing the kong
    if (state._pendingJiaGang) {
      const pending = state._pendingJiaGang;
      state._pendingJiaGang = null;
      handleHu(0, pending.gangTile, false);
      return;
    }

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

    // If passing on a qianggang opportunity, complete the jia gang
    if (state._pendingJiaGang) {
      const pending = state._pendingJiaGang;
      state._pendingJiaGang = null;
      _completeJiaGang(pending.playerIndex, pending.tileKey);
      return;
    }

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
  // ║  FEATURE 3: Multi-Round Game Flow                        ║
  // ╚═══════════════════════════════════════════════════════════╝

  function advanceMultiRound() {
    if (!multiRound) return;

    multiRound.handsPlayed++;
    multiRound.handNumber++;

    // After maxHands hands, advance to next round
    if (multiRound.handNumber > multiRound.maxHands) {
      multiRound.handNumber = 1;
      multiRound.roundNumber++;
      // Advance prevailing wind
      const winds = ['fe', 'fs', 'fw', 'fn'];
      const nextWindIdx = winds.indexOf(multiRound.prevailingWind) + 1;
      if (nextWindIdx >= winds.length) {
        // Game complete after 4 rounds (or 2 for shorter games)
        showFinalScoreboard();
        return false; // no more hands
      }
      multiRound.prevailingWind = winds[nextWindIdx];
    }

    // Rotate dealer
    multiRound.dealerIndex = (multiRound.dealerIndex + 1) % 4;
    return true; // continue to next hand
  }

  function showFinalScoreboard() {
    const modal = document.getElementById('round-scoreboard');
    if (!modal) return;

    modal.style.display = 'flex';
    const titleEl = document.getElementById('scoreboard-title');
    const tableEl = document.getElementById('scoreboard-table');
    if (!titleEl || !tableEl) return;

    const windNames = { fe: '东风圈', fs: '南风圈', fw: '西风圈', fn: '北风圈' };
    titleEl.textContent = multiRound ? `${windNames[multiRound.prevailingWind] || ''}结束 - 最终排名` : '最终排名';

    // Sort players by score
    const sorted = state.players.map((p, i) => ({ ...p, idx: i }))
      .sort((a, b) => b.score - a.score);

    const rankColors = ['gold', 'silver', 'bronze', ''];
    const rankEmojis = ['1', '2', '3', '4'];

    tableEl.innerHTML = sorted.map((p, i) => {
      const delta = p.score - 25000;
      const deltaClass = delta >= 0 ? 'positive' : 'negative';
      const deltaSign = delta >= 0 ? '+' : '';
      return `<div class="scoreboard-row ${i === 0 ? 'winner' : ''}">
        <span class="scoreboard-rank ${rankColors[i]}">${rankEmojis[i]}</span>
        <span class="scoreboard-avatar">${p.avatar}</span>
        <span class="scoreboard-name">${p.name}</span>
        <span class="scoreboard-score">${p.score.toLocaleString()}</span>
        <span class="scoreboard-delta ${deltaClass}">${deltaSign}${delta}</span>
      </div>`;
    }).join('');
  }

  function startNextHand() {
    // Hide modals
    const winModal = document.getElementById('win-screen');
    if (winModal) winModal.style.display = 'none';
    const scoreModal = document.getElementById('round-scoreboard');
    if (scoreModal) scoreModal.style.display = 'none';

    const canContinue = advanceMultiRound();
    if (canContinue === false) return; // game over

    startGame(state.mode, { campaignLevel: state.campaignLevel, aiDifficulty: state.aiDifficulty });
  }

  // ╔═══════════════════════════════════════════════════════════╗
  // ║  FEATURE 4: Skill System Visual Integration              ║
  // ╚═══════════════════════════════════════════════════════════╝

  function showSkillVisualEffect(skillId, result) {
    const table = document.getElementById('mahjong-table');
    if (!table) return;

    if (skillId === 'kitty_insight' && result.type === 'peek_wall') {
      // Kitty peek: show wall glow
      const glow = document.createElement('div');
      glow.className = 'skill-wall-glow';
      table.appendChild(glow);
      setTimeout(() => glow.remove(), result.duration || 5000);
    }

    if (skillId === 'bear_fury' && result.type === 'double_draw') {
      // Bear double draw: sparkle on draw area
      const remaining = document.querySelector('.remaining-tiles');
      if (remaining) {
        for (let i = 0; i < 8; i++) {
          setTimeout(() => {
            const sparkle = document.createElement('div');
            sparkle.className = 'skill-sparkle';
            sparkle.style.left = (Math.random() * 50 + 5) + 'px';
            sparkle.style.top = (Math.random() * 50 + 5) + 'px';
            remaining.style.position = 'relative';
            remaining.appendChild(sparkle);
            setTimeout(() => sparkle.remove(), 1500);
          }, i * 150);
        }
      }
    }

    if (skillId === 'dragon_summon' && result.type === 'best_draw') {
      // Dragon: golden dragon fly animation
      const dragon = document.createElement('div');
      dragon.className = 'skill-dragon-anim';
      dragon.textContent = '🐉';
      document.body.appendChild(dragon);
      setTimeout(() => dragon.remove(), 1500);
    }

    if (result.type === 'swap_complete') {
      // Fox swap: show exchange animation
      const swapEl = document.createElement('div');
      swapEl.className = 'skill-swap-anim';
      swapEl.innerHTML = '🔄';
      swapEl.style.fontSize = '48px';
      document.body.appendChild(swapEl);
      setTimeout(() => swapEl.remove(), 1000);
    }

    if (skillId === 'panda_count' && result.type === 'tile_count') {
      // Panda count: floating numbers on table
      const remaining = result.remaining;
      const keys = Object.keys(remaining).filter(k => remaining[k] > 0);
      const subset = keys.slice(0, 12); // Show a subset
      subset.forEach((key, i) => {
        setTimeout(() => {
          const float = document.createElement('div');
          float.className = 'skill-count-float';
          float.textContent = `${TILES[key]?.name || key}: ${remaining[key]}`;
          float.style.left = (10 + (i % 4) * 25) + '%';
          float.style.top = (20 + Math.floor(i / 4) * 25) + '%';
          table.style.position = 'relative';
          table.appendChild(float);
          setTimeout(() => float.remove(), 3000);
        }, i * 200);
      });
    }

    if (skillId === 'bunny_shield' && result.type === 'danger_vision') {
      // Bunny shield: brief flash on opponent tiles
      for (let i = 1; i < 4; i++) {
        const positions = ['hand-bottom', 'hand-right', 'hand-top', 'hand-left'];
        const handEl = document.getElementById(positions[i]);
        if (handEl) {
          handEl.style.transition = 'box-shadow 0.5s';
          handEl.style.boxShadow = '0 0 20px rgba(155,89,182,0.5)';
          setTimeout(() => {
            handEl.style.boxShadow = '';
          }, 1500);
        }
      }
    }
  }

  function updateSkillCooldowns() {
    if (typeof Skills === 'undefined') return;
    // Show cooldown progress on character portraits
    const cooldownMap = { 1: 'cooldown-right', 2: 'cooldown-top', 3: 'cooldown-left' };
    for (let i = 1; i < 4; i++) {
      const el = document.getElementById(cooldownMap[i]);
      if (!el) continue;
      const charId = state.players[i].charId;
      if (charId && Skills.SKILLS[charId]) {
        const skill = Skills.SKILLS[charId];
        const canUse = Skills.canUseSkill(charId);
        if (canUse) {
          el.textContent = skill.icon;
          el.className = 'skill-cooldown skill-ready';
        } else {
          el.textContent = '';
          el.className = 'skill-cooldown';
        }
      }
    }
  }

  // ╔═══════════════════════════════════════════════════════════╗
  // ║  FEATURE 5: Campaign Goal Verification                   ║
  // ╚═══════════════════════════════════════════════════════════╝

  function showCampaignGoalBar() {
    const bar = document.getElementById('campaign-goal-bar');
    if (!bar) return;

    if (!state.campaignLevel) {
      bar.style.display = 'none';
      return;
    }

    const level = typeof Campaign !== 'undefined' ? Campaign.getLevel(state.campaignLevel) : null;
    if (!level) {
      bar.style.display = 'none';
      return;
    }

    bar.style.display = 'flex';
    const textEl = document.getElementById('campaign-goal-text');
    const statusEl = document.getElementById('campaign-goal-status');
    if (textEl) textEl.textContent = level.desc || '赢得比赛';
    if (statusEl) {
      statusEl.textContent = '进行中';
      statusEl.className = 'campaign-goal-status pending';
    }
  }

  function verifyCampaignGoal(playerIndex, scoreResult, isTsumo) {
    if (!state.campaignLevel || typeof Campaign === 'undefined') return { met: false, stars: 1 };

    const level = Campaign.getLevel(state.campaignLevel);
    if (!level) return { met: false, stars: 1 };

    const player = state.players[playerIndex];
    const isPlayerWin = playerIndex === 0;
    let goalMet = isPlayerWin; // Base: just need to win
    let bonusStars = 0;
    let goalDesc = '';

    // Parse level description for specific goals
    const desc = level.desc || '';

    // "用至少2个顺子胡牌" — Check sequences in winning hand
    if (desc.includes('顺子')) {
      const match = desc.match(/(\d+)个顺子/);
      const reqSeq = match ? parseInt(match[1]) : 2;
      if (isPlayerWin && scoreResult.decomposition) {
        const seqCount = (scoreResult.decomposition.melds || []).filter(m => m.type === 'sequence').length
          + player.melds.filter(m => m.type === 'chi').length;
        goalMet = seqCount >= reqSeq;
        goalDesc = `顺子数: ${seqCount}/${reqSeq}`;
      }
    }

    // "碰牌至少N次" — Check peng count
    if (desc.includes('碰牌')) {
      const match = desc.match(/碰牌至少(\d+)次/);
      const reqPeng = match ? parseInt(match[1]) : 1;
      if (isPlayerWin) {
        goalMet = player.pengCount >= reqPeng;
        goalDesc = `碰牌次数: ${player.pengCount}/${reqPeng}`;
      }
    }

    // Fan count requirements
    if (desc.includes('番')) {
      const match = desc.match(/(\d+)番/);
      if (match) {
        const reqFan = parseInt(match[1]);
        if (isPlayerWin && scoreResult) {
          goalMet = scoreResult.totalFan >= reqFan;
          goalDesc = `番数: ${scoreResult.totalFan}/${reqFan}`;
        }
      }
    }

    // Speed challenges — "在N张牌内胡牌"
    if (desc.includes('张牌内') || desc.includes('速战')) {
      const match = desc.match(/(\d+)张牌内/);
      const maxTiles = match ? parseInt(match[1]) : 30;
      const tilesUsed = state.drawIndex - 52;
      if (isPlayerWin) {
        goalMet = tilesUsed <= maxTiles;
        goalDesc = `用牌数: ${tilesUsed}/${maxTiles}`;
      }
    }

    // Specific hand types
    if (desc.includes('清一色') && isPlayerWin) {
      goalMet = scoreResult.fans.some(f => f.name === '清一色');
      goalDesc = goalMet ? '清一色达成' : '未组成清一色';
    }
    if (desc.includes('七对') && isPlayerWin) {
      goalMet = scoreResult.fans.some(f => f.name === '七对' || f.name === '龙七对');
      goalDesc = goalMet ? '七对达成' : '未组成七对';
    }
    if (desc.includes('自摸') && isPlayerWin) {
      goalMet = isTsumo;
      goalDesc = goalMet ? '自摸达成' : '未自摸';
    }
    if (desc.includes('不碰不杠') || desc.includes('门清')) {
      if (isPlayerWin) {
        goalMet = player.melds.length === 0;
        goalDesc = goalMet ? '门清达成' : '有吃碰杠';
      }
    }

    // Star calculation
    let stars = 0;
    if (isPlayerWin) stars = 1;
    if (goalMet) stars = 2;
    if (goalMet && scoreResult && scoreResult.totalFan >= 4) stars = 3;

    return { met: goalMet, stars, goalDesc };
  }

  function showCampaignGoalResult(goalResult) {
    const resultEl = document.getElementById('campaign-goal-result');
    if (!resultEl) return;

    resultEl.style.display = 'block';
    if (goalResult.met) {
      resultEl.className = 'campaign-goal-result goal-met';
      resultEl.innerHTML = `🎯 目标达成！${goalResult.goalDesc ? ' — ' + goalResult.goalDesc : ''}`;
    } else {
      resultEl.className = 'campaign-goal-result goal-missed';
      resultEl.innerHTML = `❌ 目标未达成${goalResult.goalDesc ? ' — ' + goalResult.goalDesc : ''}`;
    }

    // Update the goal bar status
    const statusEl = document.getElementById('campaign-goal-status');
    if (statusEl) {
      statusEl.textContent = goalResult.met ? '已达成' : '未达成';
      statusEl.className = `campaign-goal-status ${goalResult.met ? 'achieved' : 'pending'}`;
    }
  }

  // ╔═══════════════════════════════════════════════════════════╗
  // ║  UTILITIES                                               ║
  // ╚═══════════════════════════════════════════════════════════╝

  function wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  function getState() { return state; }
  function getRules() { return rules; }
  function getMultiRound() { return multiRound; }

  function destroy() {
    Particles.stop();
    if (dustInterval) clearInterval(dustInterval);
    if (typeof Commentary !== 'undefined') Commentary.destroy();
    if (typeof Skills !== 'undefined') Skills.removeSkillButton();
    state = null;
    multiRound = null;
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
    getMultiRound,
    destroy,
    Sound,
    Particles,
    Anim,
    renderTile,
    // Feature 1: Tenpai
    isPlayerTenpai,
    getPlayerTingTiles,
    updateTenpaiIndicator,
    countRemainingTiles,
    // Feature 3: Multi-round
    startNextHand,
    advanceMultiRound,
    showFinalScoreboard,
    initMultiRound,
    getSeatWind,
    // Feature 4: Skill visuals
    showSkillVisualEffect,
    updateSkillCooldowns,
    // Feature 5: Campaign goals
    verifyCampaignGoal,
    showCampaignGoalResult,
  };
})();
