(() => {
  'use strict';

  /* =========================================================
     УТИЛИТЫ
     ========================================================= */
  const CFG = window.LOVE || {};
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const rand = (a, b) => a + Math.random() * (b - a);
  const pick = a => a[Math.floor(Math.random() * a.length)];
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  const pad = n => String(n).padStart(2, '0');
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const plural = (n, one, few, many) => {
    const m10 = n % 10, m100 = n % 100;
    if (m10 === 1 && m100 !== 11) return one;
    if (m10 >= 2 && m10 <= 4 && (m100 < 10 || m100 >= 20)) return few;
    return many;
  };
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = matchMedia('(hover: hover) and (pointer: fine)').matches;
  const isSmall = () => innerWidth < 620;
  const root = document.documentElement;

  const params = new URLSearchParams(location.search);
  const HER = (params.get('to') || CFG.herName || '').trim().slice(0, 24);
  const ME = (params.get('from') || CFG.myName || '').trim().slice(0, 24);
  const TEST = params.has('test');

  const store = {
    get(k, d) {
      try { const v = localStorage.getItem('fy:' + k); return v == null ? d : JSON.parse(v); } catch (e) { return d; }
    },
    set(k, v) {
      try { localStorage.setItem('fy:' + k, JSON.stringify(v)); } catch (e) { /* приватный режим */ }
    }
  };

  let toastTimer;
  function toast(text, ms = 2600) {
    const t = $('#toast');
    t.textContent = text;
    t.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove('show'), ms);
  }

  function say(el, text) {
    if (el.textContent === text) return;
    el.textContent = text;
    el.classList.remove('swap');
    void el.offsetWidth;
    el.classList.add('swap');
  }

  function center(el) {
    const r = el.getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
  }

  /* =========================================================
     ДАННЫЕ
     ========================================================= */
  const MONTHS = ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'];
  const MONTHS_G = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'];
  const WEEKDAYS = ['воскресенье', 'понедельник', 'вторник', 'среда', 'четверг', 'пятница', 'суббота'];

  const FOOD = [
    ['sushi', '🍣', 'Суши и роллы', 'палочки на мне'],
    ['italy', '🍝', 'Итальянская', 'паста и пицца'],
    ['georgia', '🥟', 'Грузинская', 'хинкали, хачапури'],
    ['asia', '🍜', 'Азиатская', 'рамен, вок, том-ям'],
    ['burger', '🍔', 'Бургеры', 'руками, без церемоний'],
    ['steak', '🥩', 'Стейки', 'серьёзный подход'],
    ['sea', '🦐', 'Морепродукты', 'креветки и вид'],
    ['mex', '🌮', 'Мексиканская', 'поострее'],
    ['coffee', '🥐', 'Кофе и выпечка', 'круассан и капучино'],
    ['sweet', '🍰', 'Десерты', 'сразу к главному'],
    ['healthy', '🥗', 'Что-то лёгкое', 'чтобы потом гулять'],
    ['surprise', '🎲', 'Удиви меня', 'выберу сам']
  ];
  const FOOD_SAY = {
    sushi: 'Суши — принято',
    italy: 'Паста — беспроигрышный вариант',
    georgia: 'Хинкали едим руками. Это правило',
    asia: 'Лапша и вок — отлично',
    burger: 'Бургеры — честный выбор',
    steak: 'Стейк — серьёзно. Уважаю',
    sea: 'Морепродукты — со вкусом',
    mex: 'Острое? Интересно',
    coffee: 'Кофе и выпечка — классика',
    sweet: 'Начать с десерта — смело',
    healthy: 'Лёгкое — чтобы хватило сил на прогулку',
    surprise: 'Окей, удивлю'
  };

  const FUN = [
    ['walk', '🌃', 'Прогулка по городу'],
    ['cinema', '🎬', 'Кино'],
    ['skate', '⛸️', 'Каток'],
    ['bowling', '🎳', 'Боулинг'],
    ['karaoke', '🎤', 'Караоке'],
    ['park', '🎡', 'Аттракционы'],
    ['museum', '🖼️', 'Выставка'],
    ['games', '🎲', 'Настолки'],
    ['quest', '🔐', 'Квест'],
    ['river', '🌉', 'Набережная'],
    ['class', '🎨', 'Мастер-класс'],
    ['flow', '✨', 'Решим по ходу']
  ];
  const FUN_SAY = {
    walk: 'Прогулка — лучший способ поговорить',
    cinema: 'Попкорн — общий',
    skate: 'Держись крепче',
    bowling: 'Сразу говорю: поддаваться не буду',
    karaoke: 'Будет громко',
    park: 'Колесо обозрения — обязательно',
    museum: 'Буду умно молчать у картин',
    games: 'Проигравший платит за кофе',
    quest: 'Посмотрим, кто первым найдёт выход',
    river: 'Набережная вечером — хороший план',
    class: 'Сделаем что-нибудь кривое, но своё',
    flow: 'Импровизация — тоже план'
  };
  const DRESS = [['fancy', '✨ Нарядно'], ['comfy', '👟 Удобно'], ['surprise', '🎭 Сюрприз']];

  const NO_TEXTS = ['Нет', 'Мимо', 'Не-а', 'Ещё разок?', 'Почти', 'Слишком медленно', 'Кнопка декоративная', 'Я тренировался', 'Упорная', 'Ну попробуй', 'Ладно…'];
  const NO_SAY = [
    'Кнопка «Нет» сегодня не работает',
    'Интересная тактика',
    'Заметила, что «Да» растёт?',
    'Можно так весь вечер. Или просто пойти на свидание',
    'Счёт: кнопка — 5, ты — 0',
    'Кнопка устала, но держится',
    'Это уже спорт',
    'Ладно, упорство засчитано',
    'Последний рывок…',
    'Окей, сдаюсь'
  ];

  const state = {
    yes: false,
    tries: 0,
    openedAt: 0,
    date: null,
    time: 1140,
    food: [],
    noFood: '',
    fun: [],
    dress: null,
    mood: 70,
    msg: '',
    sent: false
  };

  /* =========================================================
     ЗВУК (музыкальная шкатулка на WebAudio)
     ========================================================= */
  const Sound = (() => {
    let ctx, master, music, sfx, timer, nextTime = 0, pos = 0;
    let on = store.get('sound', true);
    const EIGHTH = 60 / 92 / 2;
    // F, Am, Bb, C, F, Dm, Gm, C
    const CHORDS = [[53, 0], [57, 1], [58, 0], [60, 0], [53, 0], [50, 1], [55, 1], [48, 0]];
    const MELODY = [
      [81, 2], [79, 1], [77, 1], [81, 2],
      [84, 2], [76, 2], [81, 2],
      [86, 2], [84, 1], [82, 1], [86, 2],
      [84, 4], [79, 2],
      [81, 2], [84, 1], [81, 1], [77, 2],
      [77, 2], [81, 2], [86, 2],
      [82, 2], [81, 1], [79, 1], [82, 2],
      [81, 2], [79, 2], [76, 2]
    ];
    const MEL_AT = {};
    let acc = 0;
    MELODY.forEach(([n, d]) => { MEL_AT[acc] = n; acc += d; });

    const mtof = m => 440 * Math.pow(2, (m - 69) / 12);

    function init() {
      if (ctx) return true;
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return false;
      ctx = new AC();
      master = ctx.createGain();
      master.gain.value = .85;
      master.connect(ctx.destination);
      const rev = ctx.createConvolver();
      const len = ctx.sampleRate * 2.4;
      const buf = ctx.createBuffer(2, len, ctx.sampleRate);
      for (let c = 0; c < 2; c++) {
        const d = buf.getChannelData(c);
        for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2.4);
      }
      rev.buffer = buf;
      const wet = ctx.createGain();
      wet.gain.value = .32;
      rev.connect(wet).connect(master);
      music = ctx.createGain();
      music.gain.value = 0;
      music.connect(master);
      music.connect(rev);
      sfx = ctx.createGain();
      sfx.gain.value = .55;
      sfx.connect(master);
      sfx.connect(rev);
      document.addEventListener('visibilitychange', () => {
        if (!ctx) return;
        if (document.hidden) ctx.suspend();
        else if (on) ctx.resume();
      });
      return true;
    }

    function bell(dest, midi, t, dur = 1.5, vol = .15) {
      const f = mtof(midi);
      const g = ctx.createGain();
      g.gain.setValueAtTime(.0001, t);
      g.gain.exponentialRampToValueAtTime(vol, t + .006);
      g.gain.exponentialRampToValueAtTime(.0001, t + dur);
      g.connect(dest);
      [[1, 1], [2, .3], [3.01, .1], [4.17, .04]].forEach(([m, a]) => {
        const o = ctx.createOscillator();
        o.type = 'sine';
        o.frequency.value = f * m;
        const og = ctx.createGain();
        og.gain.value = a;
        o.connect(og).connect(g);
        o.start(t);
        o.stop(t + dur + .05);
      });
    }

    function schedule() {
      while (nextTime < ctx.currentTime + .45) {
        const bar = Math.floor(pos / 6) % 8;
        const inBar = pos % 6;
        const [rootNote, minor] = CHORDS[bar];
        const iv = (minor ? [0, 7, 12, 15, 12, 7] : [0, 7, 12, 16, 12, 7])[inBar];
        bell(music, rootNote + iv, nextTime, 1.3, inBar === 0 ? .085 : .05);
        const mel = MEL_AT[pos];
        if (mel) bell(music, mel, nextTime, 2.2, .11);
        nextTime += EIGHTH;
        pos = (pos + 1) % 48;
      }
    }

    function startMusic() {
      if (!ctx || timer) return;
      nextTime = ctx.currentTime + .15;
      timer = setInterval(schedule, 120);
      music.gain.cancelScheduledValues(ctx.currentTime);
      music.gain.setTargetAtTime(1, ctx.currentTime, .8);
    }
    function stopMusic() {
      if (!ctx || !timer) return;
      music.gain.cancelScheduledValues(ctx.currentTime);
      music.gain.setTargetAtTime(0, ctx.currentTime, .25);
      clearInterval(timer);
      timer = null;
    }

    function begin() {
      if (!init()) return;
      if (ctx.state === 'suspended') ctx.resume();
      if (on) startMusic();
      syncBtn();
    }
    function toggle() {
      on = !on;
      store.set('sound', on);
      if (!ctx) init();
      if (ctx && ctx.state === 'suspended') ctx.resume();
      on ? startMusic() : stopMusic();
      syncBtn();
      if (on) pop();
    }
    function syncBtn() { $('#soundBtn').setAttribute('aria-pressed', String(on)); }
    const ready = () => ctx && on && ctx.state === 'running';

    function pop(p = 1) {
      if (!ready()) return;
      const t = ctx.currentTime;
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = 'sine';
      o.frequency.setValueAtTime(480 * p, t);
      o.frequency.exponentialRampToValueAtTime(920 * p, t + .07);
      g.gain.setValueAtTime(.0001, t);
      g.gain.exponentialRampToValueAtTime(.22, t + .01);
      g.gain.exponentialRampToValueAtTime(.0001, t + .16);
      o.connect(g).connect(sfx);
      o.start(t);
      o.stop(t + .2);
    }
    function boing() {
      if (!ready()) return;
      const t = ctx.currentTime;
      const o = ctx.createOscillator();
      const lfo = ctx.createOscillator();
      const lg = ctx.createGain();
      const g = ctx.createGain();
      o.type = 'triangle';
      o.frequency.setValueAtTime(170, t);
      o.frequency.exponentialRampToValueAtTime(560, t + .07);
      o.frequency.exponentialRampToValueAtTime(210, t + .42);
      lfo.frequency.value = 22;
      lg.gain.value = 38;
      lfo.connect(lg).connect(o.frequency);
      g.gain.setValueAtTime(.0001, t);
      g.gain.exponentialRampToValueAtTime(.28, t + .015);
      g.gain.exponentialRampToValueAtTime(.0001, t + .48);
      o.connect(g).connect(sfx);
      o.start(t); lfo.start(t);
      o.stop(t + .5); lfo.stop(t + .5);
    }
    function chime() {
      if (!ready()) return;
      const t = ctx.currentTime;
      [72, 76, 79, 84, 88, 91].forEach((n, i) => bell(sfx, n, t + i * .075, 1.8, .16));
    }
    function blip(i = 0) {
      if (!ready()) return;
      const scale = [0, 2, 4, 7, 9, 12, 14, 16];
      bell(sfx, 79 + scale[i % scale.length], ctx.currentTime, .7, .13);
    }
    function sparkle() {
      if (!ready()) return;
      const t = ctx.currentTime;
      [96, 100, 103, 108].forEach((n, i) => bell(sfx, n, t + i * .05, .9, .06));
    }
    function whoosh() {
      if (!ready()) return;
      const t = ctx.currentTime;
      const len = ctx.sampleRate * 1.2;
      const buf = ctx.createBuffer(1, len, ctx.sampleRate);
      const d = buf.getChannelData(0);
      for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
      const src = ctx.createBufferSource();
      src.buffer = buf;
      const bp = ctx.createBiquadFilter();
      bp.type = 'bandpass';
      bp.Q.value = 1.4;
      bp.frequency.setValueAtTime(300, t);
      bp.frequency.exponentialRampToValueAtTime(3200, t + 1);
      const g = ctx.createGain();
      g.gain.setValueAtTime(.0001, t);
      g.gain.exponentialRampToValueAtTime(.35, t + .3);
      g.gain.exponentialRampToValueAtTime(.0001, t + 1.15);
      src.connect(bp).connect(g).connect(sfx);
      src.start(t);
    }

    return { begin, toggle, pop, boing, chime, blip, sparkle, whoosh };
  })();

  /* =========================================================
     ЧАСТИЦЫ
     ========================================================= */
  const FX = (() => {
    const cv = $('#fx');
    const cx = cv.getContext('2d');
    const STAR = new Path2D('M50 0C54 34 66 46 100 50 66 54 54 66 50 100 46 66 34 54 0 50 34 46 46 34 50 0Z');
    const cache = new Map();
    let W = 0, H = 0, DPR = 1, parts = [], dirty = false;
    const CONFETTI = ['c:#ff7a59', 'c:#f5c27a', 'c:#fff1dc', 'c:#9fb4ff', 'c:#ffffff', 't:#ffd28a', 't:#ffffff'];
    const SPARKS = ['s:#fff3c4', 's:#ffe6cc', 's:#ffffff', 's:#f5c27a'];
    const STARS = ['t:#ffd28a', 't:#ffffff', 't:#ffb48a'];

    function resize() {
      DPR = Math.min(window.devicePixelRatio || 1, 2);
      W = innerWidth; H = innerHeight;
      cv.width = Math.round(W * DPR);
      cv.height = Math.round(H * DPR);
      cx.setTransform(DPR, 0, 0, DPR, 0, 0);
      cache.clear();
    }

    function sprite(kind, size) {
      const sz = Math.max(4, Math.round(size / 3) * 3);
      const key = kind + '|' + sz;
      let c = cache.get(key);
      if (c) return c;
      c = document.createElement('canvas');
      const px = Math.ceil(sz * 1.35 * DPR);
      c.width = c.height = px;
      const g = c.getContext('2d');
      const type = kind[0], val = kind.slice(2);
      if (type === 'c') {
        g.fillStyle = val;
        const w = px * .32, h = px * .62;
        g.beginPath();
        if (g.roundRect) g.roundRect((px - w) / 2, (px - h) / 2, w, h, w * .3);
        else g.rect((px - w) / 2, (px - h) / 2, w, h);
        g.fill();
      } else if (type === 't') {
        g.translate(px * .15, px * .15);
        g.scale(px * .7 / 100, px * .7 / 100);
        g.shadowColor = val;
        g.shadowBlur = 12;
        g.fillStyle = val;
        g.fill(STAR);
      } else if (type === 's') {
        const r = px / 2;
        const grd = g.createRadialGradient(r, r, 0, r, r, r);
        grd.addColorStop(0, val);
        grd.addColorStop(.25, val);
        grd.addColorStop(1, 'rgba(255,255,255,0)');
        g.fillStyle = grd;
        g.beginPath();
        g.arc(r, r, r, 0, Math.PI * 2);
        g.fill();
      } else {
        g.font = `${Math.round(sz * DPR)}px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif`;
        g.textAlign = 'center';
        g.textBaseline = 'middle';
        g.fillText(val, px / 2, px / 2 + sz * DPR * .08);
      }
      cache.set(key, c);
      return c;
    }

    const MAX = () => (isSmall() ? 260 : 480);

    function add(p) {
      parts.push(p);
      if (parts.length > MAX()) parts.splice(0, parts.length - MAX());
    }

    function burst(x, y, o = {}) {
      if (reduced && !o.force) o.n = Math.min(o.n || 40, 12);
      const n = o.n || 40;
      const kinds = o.kinds || CONFETTI;
      const [s0, s1] = o.speed || [4, 11];
      const [z0, z1] = o.size || [10, 24];
      const [l0, l1] = o.life || [50, 90];
      const spread = o.spread == null ? Math.PI * 2 : o.spread;
      const angle = o.angle == null ? -Math.PI / 2 : o.angle;
      for (let i = 0; i < n; i++) {
        const a = angle + (Math.random() - .5) * spread;
        const v = rand(s0, s1);
        add({
          x, y,
          vx: Math.cos(a) * v,
          vy: Math.sin(a) * v,
          g: o.gravity == null ? .2 : o.gravity,
          drag: o.drag || .975,
          life: rand(l0, l1),
          t: 0,
          size: rand(z0, z1),
          rot: rand(-.6, .6),
          vr: rand(-.12, .12),
          kind: pick(kinds),
          fs: rand(.06, .2),
          wob: o.wobble ? rand(0, 6.28) : null
        });
      }
    }

    function rain(n = 40, kinds = CONFETTI) {
      for (let i = 0; i < n; i++) {
        add({
          x: rand(0, W), y: rand(-H * .5, -20),
          vx: rand(-.6, .6), vy: rand(1.2, 3),
          g: .015, drag: .998,
          life: rand(200, 320), t: 0,
          size: rand(10, 22), rot: rand(-.5, .5), vr: rand(-.03, .03),
          kind: pick(kinds), fs: rand(.04, .14), wob: rand(0, 6.28)
        });
      }
    }

    function update() {
      if (!parts.length && !dirty) return;
      cx.clearRect(0, 0, W, H);
      const alive = [];
      for (const p of parts) {
        p.t++;
        p.vx *= p.drag;
        p.vy = p.vy * p.drag + p.g;
        p.x += p.vx + (p.wob != null ? Math.sin(p.t * .06 + p.wob) * .6 : 0);
        p.y += p.vy;
        p.rot += p.vr;
        if (p.t > p.life || p.y > H + 60) continue;
        alive.push(p);
        const k = p.t / p.life;
        const alpha = k < .1 ? k * 10 : 1 - Math.pow(Math.max(0, (k - .55) / .45), 2);
        const img = sprite(p.kind, p.size);
        const s = img.width / DPR;
        cx.globalAlpha = clamp(alpha, 0, 1);
        cx.setTransform(DPR, 0, 0, DPR, 0, 0);
        cx.translate(p.x, p.y);
        cx.rotate(p.rot);
        if (p.kind[0] === 'c') cx.scale(1, Math.cos(p.t * p.fs) || .05);
        cx.drawImage(img, -s / 2, -s / 2, s, s);
      }
      cx.setTransform(DPR, 0, 0, DPR, 0, 0);
      cx.globalAlpha = 1;
      parts = alive;
      dirty = alive.length > 0;
      if (!dirty) cx.clearRect(0, 0, W, H);
    }

    resize();
    return { resize, burst, rain, update, CONFETTI, SPARKS, STARS };
  })();

  /* =========================================================
     СЦЕНА: звёзды, город, фонарики
     ========================================================= */
  const Scene = (() => {
    const cv = $('#stars');
    const cx = cv.getContext('2d');
    let W = 0, H = 0, DPR = 1, stars = [], shooters = [], nextShoot = 2500, lastDraw = 0;

    function resize() {
      const r = cv.getBoundingClientRect();
      DPR = Math.min(window.devicePixelRatio || 1, 2);
      W = r.width; H = r.height;
      cv.width = Math.round(W * DPR);
      cv.height = Math.round(H * DPR);
      cx.setTransform(DPR, 0, 0, DPR, 0, 0);
      const n = Math.round(clamp(W * H / 4200, 90, 330));
      const tints = ['255,255,255', '222,232,255', '200,214,255', '255,240,214'];
      stars = Array.from({ length: n }, () => ({
        x: Math.random() * W,
        y: Math.random() * H * .82,
        r: Math.random() < .07 ? rand(1.2, 1.9) : rand(.4, 1.05),
        a: rand(.35, 1),
        s: rand(.5, 2.4),
        p: rand(0, 6.28),
        c: pick(tints)
      }));
    }

    function shoot() {
      const fromLeft = Math.random() < .5;
      shooters.push({
        x: fromLeft ? rand(W * .05, W * .45) : rand(W * .55, W * .95),
        y: rand(H * .25, H * .5),
        vx: (fromLeft ? 1 : -1) * rand(7, 11),
        vy: rand(2.5, 4.5),
        t: 0,
        life: rand(38, 60)
      });
    }

    function draw(t) {
      if (t - lastDraw < 30) return;
      lastDraw = t;
      cx.clearRect(0, 0, W, H);
      const ts = t * .001;
      for (const s of stars) {
        const a = s.a * (.5 + .5 * Math.sin(ts * s.s + s.p));
        cx.fillStyle = `rgba(${s.c},${a.toFixed(3)})`;
        if (s.r > 1.15) {
          cx.beginPath();
          cx.arc(s.x, s.y, s.r, 0, 6.283);
          cx.fill();
          cx.fillStyle = `rgba(${s.c},${(a * .35).toFixed(3)})`;
          cx.fillRect(s.x - s.r * 4, s.y - .4, s.r * 8, .8);
          cx.fillRect(s.x - .4, s.y - s.r * 4, .8, s.r * 8);
        } else {
          cx.fillRect(s.x, s.y, s.r * 1.6, s.r * 1.6);
        }
      }
      if (t > nextShoot && !reduced) {
        shoot();
        nextShoot = t + rand(3500, 9000);
      }
      shooters = shooters.filter(sh => {
        sh.t++;
        sh.x += sh.vx;
        sh.y += sh.vy;
        const k = 1 - sh.t / sh.life;
        if (k <= 0) return false;
        const tx = sh.x - sh.vx * 9, ty = sh.y - sh.vy * 9;
        const grd = cx.createLinearGradient(sh.x, sh.y, tx, ty);
        grd.addColorStop(0, `rgba(255,255,255,${k})`);
        grd.addColorStop(1, 'rgba(200,220,255,0)');
        cx.strokeStyle = grd;
        cx.lineWidth = 2;
        cx.lineCap = 'round';
        cx.beginPath();
        cx.moveTo(sh.x, sh.y);
        cx.lineTo(tx, ty);
        cx.stroke();
        return true;
      });
    }

    function buildCity(svg, o) {
      let html = '';
      let x = -30;
      while (x < 1630) {
        const w = rand(o.minW, o.maxW);
        const h = rand(o.minH, o.maxH);
        const y = 300 - h;
        html += `<rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${w.toFixed(1)}" height="${(h + 2).toFixed(1)}" fill="${o.color}"/>`;
        const r = Math.random();
        if (r < .14) {
          html += `<rect x="${(x + w / 2 - 1.5).toFixed(1)}" y="${(y - 26).toFixed(1)}" width="3" height="26" fill="${o.color}"/>`;
          html += `<circle class="wheel-light" cx="${(x + w / 2).toFixed(1)}" cy="${(y - 27).toFixed(1)}" r="2.2" fill="#ff5c7a" style="animation-delay:-${rand(0, 2).toFixed(2)}s"/>`;
        } else if (r < .26) {
          html += `<polygon points="${x.toFixed(1)},${y.toFixed(1)} ${(x + w / 2).toFixed(1)},${(y - w * .35).toFixed(1)} ${(x + w).toFixed(1)},${y.toFixed(1)}" fill="${o.color}"/>`;
        } else if (r < .38) {
          html += `<rect x="${(x + w * .25).toFixed(1)}" y="${(y - 12).toFixed(1)}" width="${(w * .4).toFixed(1)}" height="13" fill="${o.color}"/>`;
        }
        for (let wy = y + 10; wy < 290; wy += 14) {
          for (let wx = x + 6; wx < x + w - 9; wx += 11) {
            if (Math.random() < o.lit) {
              const blink = Math.random() < .05;
              const st = blink ? ` style="--d:${rand(4, 12).toFixed(1)}s;--dl:-${rand(0, 10).toFixed(1)}s"` : '';
              html += `<rect class="win${blink ? ' blink' : ''}" x="${wx.toFixed(1)}" y="${wy.toFixed(1)}" width="5" height="7" opacity="${rand(o.op[0], o.op[1]).toFixed(2)}"${st}/>`;
            }
          }
        }
        x += w + rand(-6, 5);
      }
      if (o.wheel) {
        const cxw = 905, cyw = 128, R = 74;
        let wheel = `<g class="wheel"><circle cx="${cxw}" cy="${cyw}" r="${R}" fill="none" stroke="#2b3470" stroke-width="3"/><circle cx="${cxw}" cy="${cyw}" r="${R - 10}" fill="none" stroke="#222a5c" stroke-width="1.5"/>`;
        for (let i = 0; i < 16; i++) {
          const a = i / 16 * Math.PI * 2;
          const ex = cxw + Math.cos(a) * R, ey = cyw + Math.sin(a) * R;
          wheel += `<line x1="${cxw}" y1="${cyw}" x2="${ex.toFixed(1)}" y2="${ey.toFixed(1)}" stroke="#252d62" stroke-width="1.4"/>`;
          wheel += `<circle class="wheel-light" cx="${ex.toFixed(1)}" cy="${ey.toFixed(1)}" r="3.2" fill="${i % 2 ? '#ffcf7a' : '#cfe0ff'}" style="animation-delay:-${(i * .12).toFixed(2)}s"/>`;
        }
        wheel += '</g>';
        const legs = `<polygon points="${cxw - 3},${cyw} ${cxw - 46},300 ${cxw - 38},300 ${cxw},${cyw + 10} ${cxw + 38},300 ${cxw + 46},300 ${cxw + 3},${cyw}" fill="#1a1f48"/>`;
        html = legs + wheel + html;
      }
      svg.innerHTML = html;
    }

    function buildHills(svg) {
      const wave = (base, amp, n, color) => {
        let d = `M0 300 L0 ${base}`;
        const step = 1600 / n;
        for (let i = 0; i < n; i++) {
          const x1 = i * step + step / 2, x2 = (i + 1) * step;
          d += ` Q ${x1.toFixed(0)} ${(base - rand(amp * .4, amp)).toFixed(0)} ${x2.toFixed(0)} ${(base + rand(-amp * .3, amp * .3)).toFixed(0)}`;
        }
        return `<path d="${d} L1600 300 Z" fill="${color}"/>`;
      };
      svg.innerHTML = wave(150, 80, 5, '#1a1e46') + wave(205, 55, 7, '#121535');
    }

    function buildLanterns() {
      const far = $('#lanternsFar'), near = $('#lanternsNear');
      const small = isSmall();
      const make = (n, o) => {
        let html = '';
        for (let i = 0; i < n; i++) {
          const d = rand(o.d[0], o.d[1]);
          html += `<i class="lantern" style="--x:${rand(2, 96).toFixed(1)}%;--s:${rand(o.s[0], o.s[1]).toFixed(2)};--d:${d.toFixed(1)}s;--delay:-${rand(0, d).toFixed(1)}s;--dx:${rand(-12, 12).toFixed(1)}vw;--o:${rand(o.o[0], o.o[1]).toFixed(2)}"></i>`;
        }
        return html;
      };
      far.innerHTML = make(small ? 9 : 16, { d: [28, 42], s: [.45, .85], o: [.45, .7] });
      near.innerHTML = make(small ? 4 : 7, { d: [18, 28], s: [1.1, 1.7], o: [.8, 1] });

      const ff = $('#fireflies');
      let fh = '';
      for (let i = 0; i < (small ? 9 : 16); i++) {
        fh += `<i class="ff" style="--x:${rand(2, 98).toFixed(1)}%;--y:${rand(2, 24).toFixed(1)}vh;--d:${rand(4, 9).toFixed(1)}s;--dl:-${rand(0, 8).toFixed(1)}s;--mx:${rand(-50, 50).toFixed(0)}px;--my:${rand(-40, 30).toFixed(0)}px"></i>`;
      }
      ff.innerHTML = fh;
    }

    function burstLanterns(n = 12) {
      const near = $('#lanternsNear');
      for (let i = 0; i < n; i++) {
        const el = document.createElement('i');
        el.className = 'lantern';
        const d = rand(9, 15);
        el.style.cssText = `--x:${rand(4, 94).toFixed(1)}%;--s:${rand(.9, 1.6).toFixed(2)};--d:${d.toFixed(1)}s;--delay:${rand(0, 1.6).toFixed(2)}s;--dx:${rand(-10, 10).toFixed(1)}vw;--o:1`;
        el.addEventListener('animationiteration', () => el.remove(), { once: true });
        near.appendChild(el);
      }
    }

    function init() {
      resize();
      buildHills($('#hills'));
      buildCity($('#cityFar'), { minW: 40, maxW: 100, minH: 90, maxH: 210, color: '#151a3c', lit: .07, op: [.18, .45], wheel: true });
      buildCity($('#cityNear'), { minW: 34, maxW: 86, minH: 50, maxH: 170, color: '#080a1c', lit: .2, op: [.45, 1] });
      buildLanterns();
    }

    return { init, resize, draw, shoot, burstLanterns };
  })();

  /* =========================================================
     ПАРАЛЛАКС
     ========================================================= */
  const Parallax = (() => {
    const layers = $$('#scene .layer').map(el => ({ el, d: +el.dataset.depth || 0, c: +(el.dataset.cam || 0) }));
    let tx = 0, ty = 0, x = 0, y = 0, cam = 0, camT = 0, lastInput = -1e5, baseBeta = null;
    let lpx = 9, lpy = 9;

    addEventListener('pointermove', e => {
      if (e.pointerType !== 'mouse') return;
      tx = (e.clientX / innerWidth - .5) * 2;
      ty = (e.clientY / innerHeight - .5) * 2;
      lastInput = performance.now();
    }, { passive: true });

    addEventListener('touchmove', e => {
      const t = e.touches[0];
      if (!t) return;
      tx = (t.clientX / innerWidth - .5) * 1.4;
      ty = (t.clientY / innerHeight - .5) * 1.2;
      lastInput = performance.now();
    }, { passive: true });

    addEventListener('deviceorientation', e => {
      if (e.gamma == null || e.beta == null) return;
      if (baseBeta == null) baseBeta = e.beta;
      baseBeta += (e.beta - baseBeta) * .005;
      tx = clamp(e.gamma / 22, -1, 1);
      ty = clamp((e.beta - baseBeta) / 22, -1, 1);
      lastInput = performance.now();
    });

    function update(t) {
      const idle = t - lastInput > 2600;
      const gx = idle ? Math.sin(t * .00021) * .55 : tx;
      const gy = idle ? Math.cos(t * .00016) * .35 : ty;
      x += (gx - x) * .05;
      y += (gy - y) * .05;
      cam += (camT - cam) * .03;
      const H = innerHeight;
      for (const l of layers) {
        const ox = -x * l.d * 80;
        const oy = -y * l.d * 50 + cam * l.c * l.d * H * .42;
        l.el.style.transform = `translate3d(${ox.toFixed(2)}px,${oy.toFixed(2)}px,0)`;
      }
      if (Math.abs(x - lpx) > .002 || Math.abs(y - lpy) > .002) {
        root.style.setProperty('--px', x.toFixed(3));
        root.style.setProperty('--py', y.toFixed(3));
        lpx = x; lpy = y;
      }
    }

    return { update, setCam: v => { camT = v; } };
  })();

  /* =========================================================
     ОТПРАВКА ОТВЕТОВ (ntfy.sh + шифрование)
     ========================================================= */
  const Messenger = (() => {
    const sid = (() => {
      try {
        return Array.from(crypto.getRandomValues(new Uint8Array(6)), b => b.toString(16).padStart(2, '0')).join('');
      } catch (e) {
        return Math.random().toString(36).slice(2, 14);
      }
    })();
    const base = (CFG.ntfy || 'https://ntfy.sh').replace(/\/$/, '');
    const device = (() => {
      const ua = navigator.userAgent;
      if (/iPhone/.test(ua)) return 'iPhone';
      if (/iPad/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1)) return 'iPad';
      if (/Android/.test(ua)) return 'Android';
      if (/Mac/.test(ua)) return 'Mac';
      if (/Windows/.test(ua)) return 'Windows';
      return 'другое';
    })();

    async function post(body, attempts = 4) {
      for (let i = 0; i < attempts; i++) {
        const ctrl = window.AbortController ? new AbortController() : null;
        const timer = ctrl && setTimeout(() => ctrl.abort(), 9000);
        try {
          const r = await fetch(base + '/', { method: 'POST', body: JSON.stringify(body), signal: ctrl && ctrl.signal });
          if (r.ok) return true;
        } catch (e) { /* сеть */ } finally { clearTimeout(timer); }
        await sleep(700 * Math.pow(2, i));
      }
      return false;
    }

    async function seal(data) {
      if (window.LoveCrypto && LoveCrypto.supported()) {
        try { return await LoveCrypto.encrypt(data, CFG.pub); } catch (e) { /* ниже — запасной вариант */ }
      }
      return JSON.stringify({ v: 0, p: data });
    }

    async function send(type, data = {}, note) {
      const payload = Object.assign({ t: type, sid, at: new Date().toISOString(), dev: device }, data);
      if (TEST) payload.test = true;
      if (HER) payload.name = HER;
      const message = await seal(payload);
      const dataP = post({ topic: CFG.dataTopic, message, title: type });
      if (note) {
        post({
          topic: CFG.notifyTopic,
          title: (TEST ? '[тест] ' : '') + note.title,
          message: note.message || ' ',
          priority: note.priority || 3,
          click: CFG.mailbox
        }, 2);
      }
      const ok = await dataP;
      if (!ok) {
        const box = store.get('outbox', []);
        box.push(message);
        store.set('outbox', box.slice(-10));
      }
      return ok;
    }

    async function flush() {
      const box = store.get('outbox', []);
      if (!box.length) return true;
      const left = [];
      for (const message of box) {
        const ok = await post({ topic: CFG.dataTopic, message, title: 'retry' }, 2);
        if (!ok) left.push(message);
      }
      store.set('outbox', left);
      return left.length === 0;
    }

    return { send, flush, sid };
  })();

  /* =========================================================
     ЛОАДЕР
     ========================================================= */
  function runLoader() {
    const PHRASES = [
      'Зажигаю звёзды…',
      'Настраиваю свет…',
      'Запускаю фонарики…',
      'Подбираю музыку…',
      'Выбираю лучший вечер…',
      'Почти готово…'
    ];
    return new Promise(resolve => {
      const ld = $('#loader'), pctEl = $('#ldPct'), bar = $('#ldBar'), ph = $('#ldPhrase'), moon = $('.ld-moon');
      let p = 0, ready = false, pi = 0;
      const minTime = reduced ? 700 : 3300;
      const t0 = performance.now();
      const loaded = new Promise(r => (document.readyState === 'complete' ? r() : addEventListener('load', r, { once: true })));
      Promise.all([loaded, document.fonts ? document.fonts.ready : null]).then(() => { ready = true; });
      setTimeout(() => { ready = true; }, 7000);
      const phraseTimer = setInterval(() => {
        pi = Math.min(pi + 1, PHRASES.length - 1);
        ph.classList.add('swap');
        setTimeout(() => { ph.textContent = PHRASES[pi]; ph.classList.remove('swap'); }, 330);
      }, 620);

      function tick() {
        const el = performance.now() - t0;
        const cap = ready ? 100 : 92;
        const target = Math.min(cap, (el / minTime) * 100);
        p = Math.min(cap, p + (target - p) * .1 + .12);
        const shown = Math.floor(p);
        pctEl.textContent = shown;
        bar.style.width = p + '%';
        moon.style.setProperty('--dash', (100 - p).toFixed(1));
        moon.style.setProperty('--fill', clamp((p - 72) / 28, 0, 1).toFixed(2));
        if (p >= 99.5 && ready && el >= minTime) {
          pctEl.textContent = '100';
          clearInterval(phraseTimer);
          ph.classList.remove('swap');
          ph.textContent = 'Готово';
          ld.classList.add('full');
          setTimeout(() => {
            ld.classList.add('done');
            setTimeout(resolve, 650);
            setTimeout(() => ld.remove(), 2000);
          }, reduced ? 200 : 900);
          return;
        }
        requestAnimationFrame(tick);
      }
      requestAnimationFrame(tick);
    });
  }

  /* =========================================================
     НАВИГАЦИЯ ПО ЭКРАНАМ
     ========================================================= */
  let current = null;
  const ORDER = ['s2', 's3', 's4', 's5'];
  const onEnter = {};

  function updateProgress(step) {
    const prog = $('#progress');
    prog.classList.toggle('show', step >= 1);
    $$('i', prog).forEach((h, i) => {
      h.classList.toggle('done', i < step - 1 || step >= 6);
      h.classList.toggle('now', i === step - 1 && step < 6);
    });
  }

  function go(id, dir = 1, push = true) {
    const next = $('#' + id);
    if (!next || next === current) return;
    const prev = current;
    if (prev) {
      prev.classList.remove('active', 'back');
      prev.classList.add('leaving');
      if (dir < 0) prev.classList.add('back');
      setTimeout(() => prev.classList.remove('leaving', 'back'), 650);
    }
    next.classList.remove('active');
    next.classList.toggle('back', dir < 0);
    next.scrollTop = 0;
    void next.offsetWidth;
    next.classList.add('active');
    current = next;
    const step = +next.dataset.step;
    Parallax.setCam(step);
    updateProgress(step);
    if (onEnter[id]) onEnter[id](dir);
    if (push && ORDER.includes(id)) {
      try { history.pushState({ s: id }, ''); } catch (e) { /* file:// */ }
    }
  }

  function back() {
    const i = ORDER.indexOf(current && current.id);
    if (i <= 0) return;
    if (history.state && history.state.s === current.id) history.back();
    else go(ORDER[i - 1], -1, false);
  }

  addEventListener('popstate', e => {
    if (!current || current.id === 'done' || current.id === 's1' || current.id === 'intro') return;
    const id = e.state && e.state.s;
    const ci = ORDER.indexOf(current.id), ni = ORDER.indexOf(id);
    if (ni < 0 || ni === ci) return;
    go(id, ni < ci ? -1 : 1, false);
  });

  $$('[data-back]').forEach(b => b.addEventListener('click', () => { Sound.pop(.8); back(); }));

  /* =========================================================
     0. КОНВЕРТ
     ========================================================= */
  let returning = null;

  function showIntro() {
    const hint = $('#introHint');
    if (returning) hint.textContent = 'С возвращением';
    else if (HER) hint.textContent = `${HER}, тебе письмо…`;
    go('intro', 1, false);
    $('#envelope').addEventListener('click', openEnvelope, { once: true });
  }

  async function openEnvelope() {
    const env = $('#envelope');
    Sound.begin();
    Sound.chime();
    $('#soundBtn').classList.add('show');
    const seal = center($('.env-seal'));
    env.classList.add('open');
    $('#intro').classList.add('opened');
    FX.burst(seal.x, seal.y, { n: 46, speed: [3, 9], size: [10, 20] });
    setTimeout(() => FX.burst(seal.x, seal.y - 60, { n: 30, kinds: FX.SPARKS, speed: [2, 7], size: [8, 16], gravity: .05 }), 500);
    if (!state.openedAt) state.openedAt = Date.now();
    if (!returning) {
      Messenger.send('open', {}, { title: '👀 Она открыла приглашение', message: 'Ждём ответа…' });
    }
    await sleep(reduced ? 300 : 2150);
    if (returning) showDone(returning, true);
    else go('s1');
  }

  /* =========================================================
     1. ВОПРОС
     ========================================================= */
  const yesBtn = $('#yesBtn');
  const noBtn = $('#noBtn');
  const glyph = $('#glyph');
  const askComment = $('#askComment');
  let noRunning = false, noTamed = false, lastJump = 0;

  function splitTitle(el) {
    const text = el.textContent.trim();
    const words = text.split(/[ \t\n]+/).filter(Boolean);
    let i = 0;
    el.innerHTML = words.map(plain => {
      const hl = /свидани/i.test(plain);
      const chars = Array.from(plain).map(ch => `<span class="ch" style="--i:${i++}">${ch === ' ' ? '&nbsp;' : esc(ch)}</span>`).join('');
      i++;
      const line = hl ? '<svg viewBox="0 0 100 10" preserveAspectRatio="none" aria-hidden="true"><path pathLength="100" d="M2 7 Q 25 1 50 6 T 98 4"/></svg>' : '';
      return `<span class="w${hl ? ' hl' : ''}">${chars}${line}</span>`;
    }).join(' ');
    el.setAttribute('aria-label', text.replace(/ /g, ' '));
  }

  function pulseGlyph(cls) {
    glyph.classList.remove('shake', 'win');
    void glyph.offsetWidth;
    glyph.classList.add(cls);
  }

  function placeNo() {
    const w = noBtn.offsetWidth, h = noBtn.offsetHeight, m = 12;
    const minY = 72, maxX = innerWidth - w - m, maxY = innerHeight - h - m - 8;
    const cur = noBtn.getBoundingClientRect();
    const yr = yesBtn.getBoundingClientRect();
    const gap = 24;
    let best = null, bestD = -1;
    for (let k = 0; k < 50; k++) {
      const x = rand(m, Math.max(m, maxX));
      const y = rand(minY, Math.max(minY, maxY));
      const hit = x < yr.right + gap && x + w > yr.left - gap && y < yr.bottom + gap && y + h > yr.top - gap;
      if (hit) continue;
      const d = Math.hypot(x - cur.left, y - cur.top);
      if (d > Math.min(innerWidth, innerHeight) * .32) { best = { x, y }; break; }
      if (d > bestD) { bestD = d; best = { x, y }; }
    }
    if (!best) best = { x: m, y: minY };
    noBtn.style.left = best.x.toFixed(0) + 'px';
    noBtn.style.top = best.y.toFixed(0) + 'px';
  }

  function runAway() {
    if (noTamed || state.yes || !current || current.id !== 's1') return;
    const now = performance.now();
    if (now - lastJump < 220) return;
    lastJump = now;
    const from = center(noBtn);
    if (!noRunning) {
      const r = noBtn.getBoundingClientRect();
      const ph = document.createElement('span');
      ph.className = 'no-ph';
      ph.style.cssText = `display:inline-block;width:${r.width}px;height:${r.height}px`;
      noBtn.parentNode.insertBefore(ph, noBtn);
      document.body.appendChild(noBtn);
      setTimeout(() => {
        ph.style.transition = 'width .6s cubic-bezier(.16,1,.3,1), margin .6s';
        ph.style.width = '0px';
        ph.style.marginLeft = '-16px';
        setTimeout(() => ph.remove(), 650);
      }, 900);
      noBtn.classList.add('runaway');
      noBtn.style.left = r.left + 'px';
      noBtn.style.top = r.top + 'px';
      void noBtn.offsetWidth;
      noRunning = true;
    }
    state.tries++;
    const n = state.tries;
    if (n >= NO_TEXTS.length) { tameNo(); return; }
    noBtn.querySelector('span').textContent = NO_TEXTS[n];
    noBtn.classList.toggle('small', n >= 6 && n < 9);
    noBtn.classList.toggle('tiny', n >= 9);
    noBtn.classList.remove('wiggle');
    void noBtn.offsetWidth;
    noBtn.classList.add('wiggle');
    placeNo();
    Sound.boing();
    FX.burst(from.x, from.y, { n: 8, kinds: ['e:💨', 's:#ffffff'], speed: [1, 3], size: [14, 22], gravity: -.02, life: [24, 40] });
    pulseGlyph('shake');
    say(askComment, NO_SAY[Math.min(n - 1, NO_SAY.length - 1)]);
    yesBtn.style.setProperty('--grow', (1 + Math.min(n, 10) * .07).toFixed(2));
  }

  function tameNo() {
    noTamed = true;
    noBtn.classList.remove('small', 'tiny');
    noBtn.classList.add('tamed');
    noBtn.querySelector('span').textContent = 'Да';
    noBtn.classList.remove('runaway', 'wiggle');
    noBtn.style.left = noBtn.style.top = '';
    yesBtn.after(noBtn);
    yesBtn.style.setProperty('--grow', '1.12');
    pulseGlyph('win');
    say(askComment, 'Окей, теперь обе кнопки — «Да»');
    Sound.sparkle();
  }

  function onNoPointer(e) {
    if (noTamed) return;
    e.preventDefault();
    runAway();
  }

  noBtn.addEventListener('pointerdown', onNoPointer);
  noBtn.addEventListener('pointerenter', e => { if (e.pointerType === 'mouse') runAway(); });
  noBtn.addEventListener('click', e => {
    if (noTamed) { sayYes(e); return; }
    if (e.detail === 0) runAway();
  });
  document.addEventListener('mousemove', e => {
    if (!noRunning || noTamed || state.yes) return;
    const r = noBtn.getBoundingClientRect();
    const pad = 26;
    if (e.clientX > r.left - pad && e.clientX < r.right + pad && e.clientY > r.top - pad && e.clientY < r.bottom + pad) runAway();
  }, { passive: true });
  addEventListener('resize', () => {
    if (!noRunning || state.yes) return;
    const r = noBtn.getBoundingClientRect();
    if (r.right > innerWidth - 8 || r.bottom > innerHeight - 8) placeNo();
  });

  yesBtn.addEventListener('click', sayYes);

  async function sayYes(e) {
    if (state.yes) return;
    state.yes = true;
    const src = e && e.currentTarget && e.currentTarget.getBoundingClientRect ? e.currentTarget : yesBtn;
    const c = center(src);
    Sound.chime();
    FX.burst(c.x, c.y, { n: isSmall() ? 90 : 150, speed: [5, 16], size: [12, 30], life: [70, 120] });
    setTimeout(() => FX.burst(c.x, c.y, { n: 40, kinds: FX.SPARKS, speed: [3, 12], size: [8, 16], gravity: .08 }), 120);
    setTimeout(() => FX.rain(isSmall() ? 30 : 50), 350);
    Scene.burstLanterns(isSmall() ? 8 : 14);
    if (noRunning) {
      noBtn.classList.add('gone');
      setTimeout(() => noBtn.remove(), 500);
    }
    pulseGlyph('win');
    $('#askKicker').textContent = 'Отличный выбор.';
    $('#askTitle').classList.add('party');
    const n = state.tries;
    say(askComment, n ? `${n} ${plural(n, 'попытка', 'попытки', 'попыток')} отказаться — засчитаю как разминку` : 'Без колебаний. Уважаю');
    Messenger.send('yes', {
      tries: n,
      sec: state.openedAt ? Math.round((Date.now() - state.openedAt) / 1000) : null
    }, {
      title: '🎉 Она сказала «да»!',
      message: n ? `Пыталась нажать «Нет» ${n} ${plural(n, 'раз', 'раза', 'раз')} 😄 Теперь выбирает детали…` : 'Сразу, без раздумий. Теперь выбирает детали…',
      priority: 4
    });
    await sleep(reduced ? 600 : 2500);
    go('s2');
  }

  /* =========================================================
     2. КОГДА
     ========================================================= */
  const today = (() => { const d = new Date(); d.setHours(0, 0, 0, 0); return d; })();
  const view = { y: today.getFullYear(), m: today.getMonth() };
  const MAX_MONTHS = 6;
  const iso = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const fromIso = s => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };
  const cap = s => s.charAt(0).toUpperCase() + s.slice(1);
  const dateText = s => { const d = fromIso(s); return `${WEEKDAYS[d.getDay()]}, ${d.getDate()} ${MONTHS_G[d.getMonth()]}`; };
  const fmtTime = mins => `${pad(Math.floor(mins / 60))}:${pad(mins % 60)}`;

  function addDays(d, n) { const x = new Date(d); x.setDate(x.getDate() + n); return x; }
  function nextWeekday(wd) { const diff = (wd - today.getDay() + 7) % 7; return addDays(today, diff); }

  function renderQuick() {
    const q = [
      ['Сегодня', today],
      ['Завтра', addDays(today, 1)],
      ['В субботу', nextWeekday(6)],
      ['В воскресенье', nextWeekday(0)]
    ];
    $('#quickDates').innerHTML = q.map(([label, d]) => `<button class="chip" data-date="${iso(d)}">${label}</button>`).join('');
  }

  function monthIndex(y, m) { return y * 12 + m; }

  function renderCal(dir = 0) {
    const grid = $('#calGrid');
    const title = $('#calTitle');
    title.textContent = `${MONTHS[view.m]} ${view.y}`;
    title.classList.remove('swap');
    void title.offsetWidth;
    title.classList.add('swap');
    const first = new Date(view.y, view.m, 1);
    const offset = (first.getDay() + 6) % 7;
    const days = new Date(view.y, view.m + 1, 0).getDate();
    let html = '';
    for (let i = 0; i < offset; i++) html += '<span></span>';
    for (let d = 1; d <= days; d++) {
      const date = new Date(view.y, view.m, d);
      const id = iso(date);
      const past = date < today;
      const wd = date.getDay();
      const cls = ['cal-day'];
      if (wd === 0 || wd === 6) cls.push('we');
      if (+date === +today) cls.push('today');
      if (state.date === id) cls.push('sel');
      const label = `${d} ${MONTHS_G[view.m]}, ${WEEKDAYS[wd]}`;
      html += `<button class="${cls.join(' ')}" data-date="${id}" style="--i:${d + offset}" ${past ? 'disabled' : ''} aria-label="${label}" aria-pressed="${state.date === id}">${d}</button>`;
    }
    grid.innerHTML = html;
    grid.classList.remove('anim', 'from-l', 'from-r');
    void grid.offsetWidth;
    grid.classList.add('anim');
    if (dir > 0) grid.classList.add('from-r');
    if (dir < 0) grid.classList.add('from-l');
    const mi = monthIndex(view.y, view.m), ti = monthIndex(today.getFullYear(), today.getMonth());
    $('#calPrev').disabled = mi <= ti;
    $('#calNext').disabled = mi >= ti + MAX_MONTHS;
  }

  function dateComment(id) {
    const d = fromIso(id);
    const diff = Math.round((d - today) / 864e5);
    const md = `${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
    const special = {
      '10-31': 'Хэллоуин. Костюмы — по желанию 🎃',
      '12-31': 'Новый год? Сильный ход',
      '01-01': 'Первое января — смело',
      '02-14': '14 февраля? Ты знаешь толк в датах',
      '03-08': '8 марта — цветы за мной',
      '12-25': 'Рождество — уютный выбор'
    };
    if (special[md]) return special[md];
    if (diff === 0) return 'Сегодня? Смело. Мне нравится';
    if (diff === 1) return 'Завтра — отлично, успею всё подготовить';
    if (diff > 45) return 'Это почти следующий сезон. Но ок';
    if (diff > 14) return 'Не скоро, но я подожду';
    const wd = d.getDay();
    if (wd === 5) return 'Пятница вечер — классика';
    if (wd === 6 || wd === 0) return 'Выходные — можно не смотреть на часы';
    if (wd === 1) return 'Понедельник, который будет не как все';
    return pick(['Записал', 'Хороший день', 'Принято']);
  }

  function selectDate(id, el) {
    state.date = id;
    const d = fromIso(id);
    const mi = monthIndex(d.getFullYear(), d.getMonth());
    if (mi !== monthIndex(view.y, view.m)) {
      const dir = mi > monthIndex(view.y, view.m) ? 1 : -1;
      view.y = d.getFullYear(); view.m = d.getMonth();
      renderCal(dir);
    } else {
      $$('.cal-day', $('#calGrid')).forEach(b => {
        const on = b.dataset.date === id;
        b.classList.toggle('sel', on);
        b.setAttribute('aria-pressed', on);
      });
    }
    $$('#quickDates .chip').forEach(c => c.classList.toggle('on', c.dataset.date === id));
    const cell = $(`.cal-day[data-date="${id}"]`) || el;
    if (cell) {
      const c = center(cell);
      FX.burst(c.x, c.y, { n: 14, speed: [2, 6], size: [8, 16], life: [30, 55] });
    }
    Sound.blip(d.getDay());
    say($('#dateComment'), dateComment(id));
    $('#timeBlock').classList.add('show');
    $('#next2').disabled = false;
  }

  $('#calGrid').addEventListener('click', e => {
    const b = e.target.closest('.cal-day');
    if (b && !b.disabled) selectDate(b.dataset.date, b);
  });
  $('#quickDates').addEventListener('click', e => {
    const b = e.target.closest('.chip');
    if (b) selectDate(b.dataset.date, b);
  });
  $('#calPrev').addEventListener('click', () => {
    view.m--; if (view.m < 0) { view.m = 11; view.y--; }
    Sound.pop(.8);
    renderCal(-1);
  });
  $('#calNext').addEventListener('click', () => {
    view.m++; if (view.m > 11) { view.m = 0; view.y++; }
    Sound.pop(1.1);
    renderCal(1);
  });

  const timeRange = $('#timeRange');
  let lastTimeBlip = 0;
  function updateTime(fromUser) {
    const v = +timeRange.value;
    state.time = v;
    const p = (v - +timeRange.min) / (+timeRange.max - +timeRange.min) * 100;
    timeRange.style.setProperty('--p', p + '%');
    $('#timeValue').textContent = fmtTime(v);
    const h = v / 60;
    $('#timeEmoji').textContent = h < 12 ? '☀️' : h < 17 ? '🌤️' : h < 20 ? '🌇' : '🌙';
    const c = h < 12 ? 'Утро? Тогда кофе за мной'
      : h < 15 ? 'Обед — отличный повод'
        : h < 18 ? 'Успеем и погулять, и поужинать'
          : h < 21 ? 'Вечер — лучшее время'
            : 'Ночной город — то что надо';
    if ($('#timeComment').textContent !== c) say($('#timeComment'), c);
    root.style.setProperty('--glow', (clamp((21.5 - h) / 11.5, 0, 1) * .85 + .1).toFixed(2));
    if (fromUser) {
      const now = performance.now();
      if (now - lastTimeBlip > 70) { Sound.blip(Math.round(h) % 8); lastTimeBlip = now; }
    }
  }
  timeRange.addEventListener('input', () => updateTime(true));

  $('#next2').addEventListener('click', () => { Sound.pop(); go('s3'); });

  onEnter.s2 = () => {
    if (!$('#calGrid').children.length) { renderQuick(); renderCal(); }
    else renderCal();
    updateTime(false);
    if (state.date) $('#timeBlock').classList.add('show');
  };

  /* =========================================================
     3. ЕДА
     ========================================================= */
  function renderFood() {
    $('#foodGrid').innerHTML = FOOD.map(([id, em, nm, cp], i) =>
      `<button class="food${state.food.includes(id) ? ' sel' : ''}" data-id="${id}" style="--i:${i}" aria-pressed="${state.food.includes(id)}">
        <span class="ck">✓</span><span class="em">${em}</span><span class="nm">${nm}</span><span class="cp">${cp}</span>
      </button>`).join('');
  }

  $('#foodGrid').addEventListener('click', e => {
    const b = e.target.closest('.food');
    if (!b) return;
    const id = b.dataset.id;
    const on = !state.food.includes(id);
    state.food = on ? [...state.food, id] : state.food.filter(x => x !== id);
    b.classList.toggle('sel', on);
    b.setAttribute('aria-pressed', on);
    const item = FOOD.find(f => f[0] === id);
    if (on) {
      const c = center(b);
      FX.burst(c.x, c.y, { n: 12, kinds: ['e:' + item[1]], speed: [3, 8], size: [16, 26], life: [40, 65] });
      Sound.blip(state.food.length);
    } else {
      Sound.pop(.7);
    }
    const n = state.food.length;
    let text = '';
    if (on) text = n >= 5 ? 'Похоже, одним вечером не обойдёмся' : n === 3 ? 'Да ты гурман' : FOOD_SAY[id];
    else text = n ? 'Вычеркнул' : '';
    say($('#foodComment'), text);
    $('#next3').disabled = n === 0;
  });

  if (finePointer) {
    $('#foodGrid').addEventListener('pointermove', e => {
      const b = e.target.closest('.food');
      if (!b) return;
      const r = b.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width - .5;
      const py = (e.clientY - r.top) / r.height - .5;
      b.style.setProperty('--ry', (px * 22).toFixed(1) + 'deg');
      b.style.setProperty('--rx', (-py * 22).toFixed(1) + 'deg');
    });
    $('#foodGrid').addEventListener('pointerout', e => {
      const b = e.target.closest('.food');
      if (b && !b.contains(e.relatedTarget)) { b.style.removeProperty('--rx'); b.style.removeProperty('--ry'); }
    });
  }

  $('#noFood').addEventListener('input', e => { state.noFood = e.target.value.trim(); });
  $('#next3').addEventListener('click', () => { Sound.pop(); go('s4'); });
  onEnter.s3 = () => {
    if (!$('#foodGrid').children.length) renderFood();
    $('#next3').disabled = state.food.length === 0;
    $('#noFood').value = state.noFood;
  };

  /* =========================================================
     4. ПОСЛЕ УЖИНА
     ========================================================= */
  function renderFun() {
    $('#funPills').innerHTML = FUN.map(([id, em, nm], i) =>
      `<button class="pill${state.fun.includes(id) ? ' sel' : ''}" data-id="${id}" style="--i:${i}" aria-pressed="${state.fun.includes(id)}"><span class="em">${em}</span>${nm}</button>`).join('');
    $('#dressSeg').innerHTML = '<span class="seg-thumb"></span>' + DRESS.map(([id, nm]) =>
      `<button data-id="${id}" class="${state.dress === id ? 'sel' : ''}" aria-pressed="${state.dress === id}">${nm}</button>`).join('');
  }

  function moveThumb() {
    const seg = $('#dressSeg');
    const thumb = $('.seg-thumb', seg);
    const sel = $('button.sel', seg);
    if (!sel) { thumb.style.opacity = 0; return; }
    thumb.style.opacity = 1;
    thumb.style.width = sel.offsetWidth + 'px';
    thumb.style.transform = `translateX(${sel.offsetLeft}px)`;
  }

  $('#funPills').addEventListener('click', e => {
    const b = e.target.closest('.pill');
    if (!b) return;
    const id = b.dataset.id;
    const on = !state.fun.includes(id);
    state.fun = on ? [...state.fun, id] : state.fun.filter(x => x !== id);
    b.classList.toggle('sel', on);
    b.setAttribute('aria-pressed', on);
    const item = FUN.find(f => f[0] === id);
    if (on) {
      const c = center($('.em', b));
      FX.burst(c.x, c.y, { n: 10, kinds: ['e:' + item[1], 't:#ffd28a'], speed: [2, 7], size: [14, 24], life: [35, 60] });
      Sound.blip(state.fun.length + 2);
    } else {
      Sound.pop(.7);
    }
    const n = state.fun.length;
    say($('#funComment'), on ? (n >= 5 ? 'Это уже не свидание, а марафон' : FUN_SAY[id]) : (n ? 'Окей, без этого' : ''));
    $('#next4').disabled = n === 0;
  });

  $('#dressSeg').addEventListener('click', e => {
    const b = e.target.closest('button');
    if (!b) return;
    state.dress = b.dataset.id;
    $$('button', $('#dressSeg')).forEach(x => {
      x.classList.toggle('sel', x === b);
      x.setAttribute('aria-pressed', x === b);
    });
    moveThumb();
    Sound.blip(5);
    const c = center(b);
    FX.burst(c.x, c.y, { n: 10, kinds: FX.SPARKS, speed: [2, 5], size: [8, 14], gravity: .05, life: [25, 45] });
    const words = { fancy: 'Значит, я в рубашке', comfy: 'Удобно — значит, будем много гулять', surprise: 'Интрига. Принято' };
    say($('#funComment'), words[state.dress]);
  });

  $('#next4').addEventListener('click', () => { Sound.pop(); go('s5'); });
  onEnter.s4 = () => {
    if (!$('#funPills').children.length) renderFun();
    $('#next4').disabled = state.fun.length === 0;
    requestAnimationFrame(moveThumb);
    setTimeout(moveThumb, 700);
  };
  addEventListener('resize', () => { if (current && current.id === 's4') moveThumb(); });

  /* =========================================================
     5. ИТОГ
     ========================================================= */
  function summary() {
    const food = state.food.map(id => FOOD.find(f => f[0] === id)).filter(Boolean);
    const fun = state.fun.map(id => FUN.find(f => f[0] === id)).filter(Boolean);
    const dress = DRESS.find(d => d[0] === state.dress);
    return {
      date: state.date,
      time: fmtTime(state.time),
      dateText: state.date ? dateText(state.date) : '',
      food: food.map(f => `${f[1]} ${f[2]}`),
      noFood: state.noFood || '',
      fun: fun.map(f => `${f[1]} ${f[2]}`),
      dress: dress ? dress[1] : '',
      mood: state.mood,
      msg: state.msg,
      tries: state.tries
    };
  }

  function ticketHTML(s, print) {
    const d = s.date ? fromIso(s.date) : today;
    const guests = HER && ME ? `${esc(HER)} + ${esc(ME)}` : HER ? `${esc(HER)} + я` : 'Ты + я';
    const row = (k, v) => v ? `<div class="tk-row"><span class="tk-k">${k}</span><span class="tk-v">${v}</span></div>` : '';
    return `<div class="ticket${print ? ' print' : ''}">
      <div class="tk-main">
        <div class="tk-top"><span class="tk-brand">Первое свидание</span><span class="tk-no">№ 001</span></div>
        <div class="tk-row"><span class="tk-k">Когда</span><span class="tk-v tk-date-big">${esc(cap(s.dateText))}</span></div>
        <div class="tk-row two">
          <div><span class="tk-k">Время</span><span class="tk-v big">${esc(s.time)}</span></div>
          <div><span class="tk-k">Гости</span><span class="tk-v">${guests}</span></div>
        </div>
        ${row('Едим', s.food.map(esc).join(' · '))}
        ${row('Не ест', esc(s.noFood))}
        ${row('Потом', s.fun.map(esc).join(' · '))}
        ${row('Дресс-код', esc(s.dress))}
      </div>
      <div class="tk-stub">
        <span class="tk-admit">ADMIT <br>TWO</span>
        <span class="tk-star">✦</span>
        <span><span class="tk-sdate">${pad(d.getDate())}.${pad(d.getMonth() + 1)}</span><br><span class="tk-stime">${esc(s.time)}</span></span>
        <span class="tk-barcode"></span>
      </div>
      <div class="tk-shine"></div>
    </div>`;
  }

  const moodRange = $('#moodRange');
  let lastMood = 0;
  function updateMood(fromUser) {
    const v = +moodRange.value;
    state.mood = v;
    moodRange.style.setProperty('--p', v + '%');
    $('#moodValue').textContent = v + '%';
    const c = v < 15 ? 'Посмотрим, посмотрим'
      : v < 40 ? 'Любопытно'
        : v < 65 ? 'Интересно'
          : v < 90 ? 'Жду'
            : 'Очень жду';
    if ($('#moodComment').textContent !== c) say($('#moodComment'), c);
    if (fromUser) {
      const now = performance.now();
      if (now - lastMood > 90) {
        lastMood = now;
        const r = moodRange.getBoundingClientRect();
        const x = r.left + r.width * v / 100;
        FX.burst(x, r.top + r.height / 2, { n: 1 + Math.round(v / 35), kinds: FX.STARS, speed: [1.5, 4], size: [10, 18], gravity: -.04, life: [40, 70] });
        Sound.blip(Math.round(v / 14));
      }
    }
  }
  moodRange.addEventListener('input', () => updateMood(true));

  const msgEl = $('#msg');
  msgEl.addEventListener('input', () => {
    state.msg = msgEl.value;
    $('#msgCount').textContent = msgEl.value.length;
  });

  onEnter.s5 = () => {
    $('#ticketWrap').innerHTML = ticketHTML(summary(), true);
    moodRange.value = state.mood;
    updateMood(false);
    msgEl.value = state.msg;
    $('#msgCount').textContent = state.msg.length;
    $('#sendBtn').disabled = false;
    $('#finalCard').classList.remove('fold');
  };

  $('#sendBtn').addEventListener('click', async () => {
    const btn = $('#sendBtn');
    if (btn.disabled) return;
    btn.disabled = true;
    state.msg = msgEl.value.trim().slice(0, 400);
    const data = summary();
    const edit = !!store.get('final', null);
    store.set('final', data);
    store.set('state', {
      date: state.date, time: state.time, food: state.food, noFood: state.noFood,
      fun: state.fun, dress: state.dress, mood: state.mood, msg: state.msg, tries: state.tries
    });

    Sound.whoosh();
    $('#finalCard').classList.add('fold');
    const flyer = $('#flyer');
    flyer.classList.remove('go');
    void flyer.offsetWidth;
    flyer.classList.add('go');
    const trail = setInterval(() => {
      const c = center(flyer);
      FX.burst(c.x, c.y + 20, { n: 4, kinds: FX.SPARKS.concat(FX.STARS), speed: [.5, 2.5], size: [6, 14], gravity: .04, life: [30, 55] });
    }, 50);
    setTimeout(() => clearInterval(trail), 1900);

    const sending = Messenger.send('final', Object.assign({ edit }, data), {
      title: '📬 Ответ готов!',
      message: `Всё выбрала${data.msg ? ' и написала тебе' : ''}. Открой страницу ответов`,
      priority: 5
    });

    await sleep(reduced ? 300 : 1700);
    showDone(data, false, sending);
  });

  /* =========================================================
     ФИНАЛ
     ========================================================= */
  let cdTimer = null, fwTimer = null, lastData = null;

  function setStatus(kind, text) {
    const s = $('#sendStatus');
    s.className = 'status' + (kind ? ' ' + kind : '');
    s.innerHTML = kind === 'wait' ? `<span class="spin"></span> ${esc(text)}` : esc(text);
  }

  function startCountdown(s) {
    clearInterval(cdTimer);
    const [h, m] = s.time.split(':').map(Number);
    const target = fromIso(s.date);
    target.setHours(h, m, 0, 0);
    const els = { d: $('#cdD'), h: $('#cdH'), m: $('#cdM'), s: $('#cdS') };
    const set = (el, v) => {
      if (el.textContent === v) return;
      el.textContent = v;
      el.classList.remove('tick');
      void el.offsetWidth;
      el.classList.add('tick');
    };
    const tick = () => {
      let diff = Math.max(0, target - Date.now());
      const d = Math.floor(diff / 864e5); diff -= d * 864e5;
      const hh = Math.floor(diff / 36e5); diff -= hh * 36e5;
      const mm = Math.floor(diff / 6e4); diff -= mm * 6e4;
      const ss = Math.floor(diff / 1e3);
      set(els.d, String(d));
      set(els.h, pad(hh));
      set(els.m, pad(mm));
      set(els.s, pad(ss));
      $$('#countdown span')[0].textContent = plural(d, 'день', 'дня', 'дней');
    };
    tick();
    cdTimer = setInterval(tick, 1000);
  }

  function fireworks(times = 6) {
    clearInterval(fwTimer);
    let k = 0;
    const one = () => {
      const x = rand(innerWidth * .15, innerWidth * .85);
      const y = rand(innerHeight * .12, innerHeight * .4);
      FX.burst(x, y, { n: isSmall() ? 34 : 54, speed: [3, 9], size: [8, 18], gravity: .07, drag: .96, life: [50, 85] });
      FX.burst(x, y, { n: 18, kinds: FX.SPARKS, speed: [2, 7], size: [6, 12], gravity: .05, drag: .95, life: [40, 70] });
      Sound.sparkle();
    };
    one();
    fwTimer = setInterval(() => { if (++k >= times) clearInterval(fwTimer); one(); }, 1600);
  }

  async function showDone(data, isReturn, sending) {
    lastData = data;
    $('#doneTitle').textContent = isReturn ? 'Всё в силе' : (HER ? `${HER}, договорились!` : 'Договорились!');
    $('#doneWhen').innerHTML = `${esc(cap(data.dateText))} · <b>${esc(data.time)}</b><br>До встречи осталось:`;
    $('#donePs').textContent = data.mood >= 85 ? 'P.S. Я тоже жду.' : 'P.S. Будет интересно.';
    $('#fallback').hidden = true;
    startCountdown(data);
    go('done');
    setTimeout(() => fireworks(isReturn ? 2 : 6), 500);
    if (!isReturn) setTimeout(() => FX.rain(isSmall() ? 30 : 60), 900);

    if (isReturn) {
      const pending = store.get('outbox', []).length;
      setStatus(pending ? 'wait' : 'ok', pending ? 'досылаю ответ…' : '✓ ответ уже у меня');
      if (pending) {
        const ok = await Messenger.flush();
        setStatus(ok ? 'ok' : 'fail', ok ? '✓ доставлено' : 'не получилось отправить');
        if (!ok) $('#fallback').hidden = false;
      }
      return;
    }
    setStatus('wait', 'отправляю…');
    const ok = await sending;
    setStatus(ok ? 'ok' : 'fail', ok ? '✓ доставлено' : 'не получилось отправить');
    if (ok) Sound.chime();
    else $('#fallback').hidden = false;
  }

  function answerText(s) {
    return [
      'Мой ответ: да!',
      `📅 ${cap(s.dateText)}, ${s.time}`,
      s.food.length ? `🍽 ${s.food.join(', ')}` : '',
      s.noFood ? `🚫 Не ем: ${s.noFood}` : '',
      s.fun.length ? `🎡 Потом: ${s.fun.join(', ')}` : '',
      s.dress ? `👗 Дресс-код: ${s.dress}` : '',
      `Насколько жду: ${s.mood}%`,
      s.msg ? `«${s.msg}»` : ''
    ].filter(Boolean).join('\n');
  }

  function downloadIcs(s) {
    const icsEsc = t => String(t).replace(/\\/g, '\\\\').replace(/([,;])/g, '\\$1').replace(/\n/g, '\\n');
    const [Y, M, D] = s.date.split('-');
    const [h, m] = s.time.split(':');
    const start = `${Y}${M}${D}T${h}${m}00`;
    const e = new Date(+Y, +M - 1, +D, +h + 3, +m);
    const end = `${e.getFullYear()}${pad(e.getMonth() + 1)}${pad(e.getDate())}T${pad(e.getHours())}${pad(e.getMinutes())}00`;
    const stamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d+/, '');
    const desc = [s.food.length ? `Едим: ${s.food.join(', ')}` : '', s.fun.length ? `Потом: ${s.fun.join(', ')}` : '', s.dress ? `Дресс-код: ${s.dress}` : ''].filter(Boolean).join('\n');
    const text = [
      'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//for-you//date//RU', 'CALSCALE:GREGORIAN',
      'BEGIN:VEVENT',
      `UID:${Messenger.sid}-${Date.now()}@for-you`,
      `DTSTAMP:${stamp}`,
      `DTSTART:${start}`,
      `DTEND:${end}`,
      `SUMMARY:${icsEsc('Свидание')}`,
      `DESCRIPTION:${icsEsc(desc)}`,
      'BEGIN:VALARM', 'TRIGGER:-PT2H', 'ACTION:DISPLAY', `DESCRIPTION:${icsEsc('Скоро свидание')}`, 'END:VALARM',
      'END:VEVENT', 'END:VCALENDAR'
    ].join('\r\n');
    const blob = new Blob([text], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'svidanie.ics';
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 4000);
  }

  $('#showTicket').addEventListener('click', () => {
    if (!lastData) return;
    Sound.pop();
    $('#ticketWrap2').innerHTML = ticketHTML(lastData, true);
    $('#ticketModal').hidden = false;
  });
  $$('#ticketModal [data-close]').forEach(b => b.addEventListener('click', () => { $('#ticketModal').hidden = true; Sound.pop(.8); }));
  addEventListener('keydown', e => { if (e.key === 'Escape') $('#ticketModal').hidden = true; });

  $('#addCal').addEventListener('click', () => {
    if (!lastData) return;
    Sound.pop();
    downloadIcs(lastData);
    toast('Сохраняю в календарь');
  });

  $('#copyAnswer').addEventListener('click', async () => {
    if (!lastData) return;
    const text = answerText(lastData);
    try {
      await navigator.clipboard.writeText(text);
      toast('Скопировано — отправь мне');
    } catch (e) {
      const ta = document.createElement('textarea');
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      try { document.execCommand('copy'); toast('Скопировано — отправь мне'); } catch (err) { toast('Сделай скриншот билета'); }
      ta.remove();
    }
  });

  $('#editAnswer').addEventListener('click', () => {
    const saved = store.get('state', null);
    if (saved) Object.assign(state, saved);
    state.yes = true;
    clearInterval(cdTimer);
    clearInterval(fwTimer);
    Sound.pop();
    go('s2', -1);
  });

  /* =========================================================
     МЕЛОЧИ: луна, искры от касаний, след курсора
     ========================================================= */
  $('#moon').addEventListener('click', () => {
    const m = $('#moon');
    m.classList.add('wink');
    Scene.shoot();
    Sound.sparkle();
    const c = center(m);
    FX.burst(c.x, c.y, { n: 24, kinds: FX.SPARKS, speed: [2, 6], size: [8, 16], gravity: .02, life: [40, 70] });
    toast(pick(['Луна подмигивает тебе 😉', 'Загадай желание — звезда уже летит', 'Луна тоже за «да»']));
    setTimeout(() => m.classList.remove('wink'), 1800);
  });

  document.addEventListener('pointerdown', e => {
    if (e.pointerType === 'mouse' || e.target === noBtn || noBtn.contains(e.target)) return;
    FX.burst(e.clientX, e.clientY, { n: 6, kinds: FX.SPARKS.concat(FX.STARS), speed: [1, 3.5], size: [6, 12], gravity: .02, life: [22, 40] });
  }, { passive: true });

  if (finePointer && !reduced) {
    let lastTrail = 0;
    addEventListener('pointermove', e => {
      if (e.pointerType !== 'mouse') return;
      const now = performance.now();
      if (now - lastTrail < 55) return;
      lastTrail = now;
      FX.burst(e.clientX, e.clientY, { n: 1, kinds: ['t:#ffd28a', 't:#ffffff', 's:#fff3c4'], speed: [.2, .8], size: [7, 12], gravity: -.03, life: [26, 40], angle: Math.PI / 2 });
    }, { passive: true });
  }

  $('#soundBtn').addEventListener('click', () => Sound.toggle());

  /* =========================================================
     СТАРТ
     ========================================================= */
  function loop(t) {
    Parallax.update(t);
    Scene.draw(t);
    FX.update();
    requestAnimationFrame(loop);
  }

  let resizeT;
  addEventListener('resize', () => {
    clearTimeout(resizeT);
    resizeT = setTimeout(() => { Scene.resize(); FX.resize(); }, 150);
  });

  async function start() {
    Scene.init();
    const title = $('#askTitle');
    if (HER) title.textContent = `${HER}, пойдёшь со мной на свидание?`;
    splitTitle(title);
    requestAnimationFrame(loop);
    returning = store.get('final', null);
    if (returning) {
      const saved = store.get('state', null);
      if (saved) Object.assign(state, saved);
      state.yes = true;
      Messenger.flush();
    }
    await runLoader();
    showIntro();
  }

  start();
})();
