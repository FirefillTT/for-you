(() => {
  'use strict';

  const CFG = window.LOVE || {};
  const $ = (s, r = document) => r.querySelector(s);
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const pad = n => String(n).padStart(2, '0');
  const rand = (a, b) => a + Math.random() * (b - a);
  const plural = (n, one, few, many) => {
    const m10 = n % 10, m100 = n % 100;
    if (m10 === 1 && m100 !== 11) return one;
    if (m10 >= 2 && m10 <= 4 && (m100 < 10 || m100 >= 20)) return few;
    return many;
  };
  const base = (CFG.ntfy || 'https://ntfy.sh').replace(/\/$/, '');
  const showTests = new URLSearchParams(location.search).has('tests');
  const app = $('#app');

  const store = {
    get(k) { try { return localStorage.getItem('fy:' + k); } catch (e) { return null; } },
    set(k, v) { try { localStorage.setItem('fy:' + k, v); } catch (e) { /* приватный режим */ } },
    del(k) { try { localStorage.removeItem('fy:' + k); } catch (e) { /* приватный режим */ } }
  };

  let toastT;
  function toast(text) {
    const t = $('#toast');
    t.textContent = text;
    t.classList.add('show');
    clearTimeout(toastT);
    toastT = setTimeout(() => t.classList.remove('show'), 2400);
  }

  async function copy(text) {
    try {
      await navigator.clipboard.writeText(text);
    } catch (e) {
      const ta = document.createElement('textarea');
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      try { document.execCommand('copy'); } catch (err) { /* ignore */ }
      ta.remove();
    }
    toast('Скопировано');
  }

  /* ---------- звёзды на фоне ---------- */
  (function sky() {
    const cv = $('#sky');
    const cx = cv.getContext('2d');
    let stars = [];
    function resize() {
      const dpr = Math.min(devicePixelRatio || 1, 2);
      cv.width = innerWidth * dpr;
      cv.height = innerHeight * dpr;
      cx.setTransform(dpr, 0, 0, dpr, 0, 0);
      stars = Array.from({ length: Math.round(innerWidth * innerHeight / 5000) }, () => ({
        x: Math.random() * innerWidth, y: Math.random() * innerHeight,
        r: rand(.3, 1.2), s: rand(.4, 2), p: rand(0, 6.28)
      }));
    }
    function draw(t) {
      cx.clearRect(0, 0, innerWidth, innerHeight);
      for (const s of stars) {
        cx.fillStyle = `rgba(230,236,255,${(.35 + .45 * Math.sin(t * .001 * s.s + s.p)).toFixed(3)})`;
        cx.fillRect(s.x, s.y, s.r * 1.6, s.r * 1.6);
      }
      requestAnimationFrame(draw);
    }
    resize();
    addEventListener('resize', resize);
    requestAnimationFrame(draw);
  })();

  /* ---------- конфетти ---------- */
  const confetti = (() => {
    const cv = $('#fx');
    const cx = cv.getContext('2d');
    let parts = [], running = false;
    const colors = ['#ff7a59', '#f5c27a', '#fff1dc', '#9fb4ff', '#ffffff'];
    function resize() {
      const dpr = Math.min(devicePixelRatio || 1, 2);
      cv.width = innerWidth * dpr;
      cv.height = innerHeight * dpr;
      cx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    function loop() {
      cx.clearRect(0, 0, innerWidth, innerHeight);
      parts = parts.filter(p => {
        p.t++;
        p.vy += .12;
        p.vx *= .99;
        p.x += p.vx;
        p.y += p.vy;
        p.r += p.vr;
        if (p.y > innerHeight + 30 || p.t > 260) return false;
        cx.save();
        cx.translate(p.x, p.y);
        cx.rotate(p.r);
        cx.scale(1, Math.cos(p.t * p.f));
        cx.fillStyle = p.c;
        cx.fillRect(-3, -6, 6, 12);
        cx.restore();
        return true;
      });
      if (parts.length) requestAnimationFrame(loop);
      else { running = false; cx.clearRect(0, 0, innerWidth, innerHeight); }
    }
    resize();
    addEventListener('resize', resize);
    return (n = 120) => {
      for (let i = 0; i < n; i++) {
        parts.push({ x: innerWidth / 2 + rand(-60, 60), y: innerHeight * .3, vx: rand(-8, 8), vy: rand(-12, -3), r: rand(0, 6), vr: rand(-.2, .2), f: rand(.05, .2), t: 0, c: colors[i % colors.length] });
      }
      if (!running) { running = true; requestAnimationFrame(loop); }
    };
  })();

  /* ---------- ключ ---------- */
  let key = null;
  const hash = new URLSearchParams(location.hash.slice(1));
  if (hash.get('k')) {
    store.set('key', hash.get('k'));
    history.replaceState(null, '', location.pathname + location.search);
  }
  const rawKey = store.get('key');

  function showLocked(reason) {
    app.innerHTML = `<section class="card locked">
      <div class="big">🔒</div>
      <h3>Закрыто</h3>
      <p>${esc(reason || 'Эта страница открывается только по секретной ссылке.')}</p>
    </section>`;
  }

  /* ---------- данные ---------- */
  const raw = new Map();       // message -> { id, time }
  const decoded = new Map();   // message -> payload | null
  let badCount = 0;
  let firstLoad = true;

  function addRaw(list) {
    let added = 0;
    for (const m of list) {
      if (!m || !m.message) continue;
      const prev = raw.get(m.message);
      if (!prev) { raw.set(m.message, { id: m.id, time: m.time }); added++; }
      else if (m.time < prev.time) prev.time = m.time;
    }
    return added;
  }

  async function fetchStored() {
    const t = Date.now();
    const urls = ['answers.json?t=' + t];
    if (CFG.rawAnswers) urls.push(CFG.rawAnswers + '?t=' + t);
    const res = await Promise.allSettled(urls.map(u => fetch(u, { cache: 'no-store' }).then(r => (r.ok ? r.json() : []))));
    return res.flatMap(r => (r.status === 'fulfilled' && Array.isArray(r.value) ? r.value : []));
  }

  async function fetchLive() {
    const r = await fetch(`${base}/${CFG.dataTopic}/json?poll=1&since=all`, { cache: 'no-store' });
    if (!r.ok) return [];
    const text = await r.text();
    return text.split('\n').filter(Boolean).map(l => { try { return JSON.parse(l); } catch (e) { return null; } })
      .filter(m => m && m.event === 'message');
  }

  async function decodeAll() {
    const fresh = [];
    for (const [msg, meta] of raw) {
      if (decoded.has(msg)) continue;
      let p = null;
      try { p = await LoveCrypto.decrypt(msg, key); } catch (e) { p = null; }
      if (p && typeof p === 'object') {
        p._time = p.at ? Date.parse(p.at) : meta.time * 1000;
        if (!p._time || isNaN(p._time)) p._time = meta.time * 1000;
        fresh.push(p);
      } else {
        badCount++;
      }
      decoded.set(msg, p);
    }
    return fresh;
  }

  function events() {
    const seen = new Set();
    const out = [];
    for (const p of decoded.values()) {
      if (!p) continue;
      if (p.test && !showTests) continue;
      const k = `${p.sid}|${p.t}|${p.at}`;
      if (seen.has(k)) continue;
      seen.add(k);
      out.push(p);
    }
    return out.sort((a, b) => a._time - b._time);
  }
  const testCount = () => Array.from(decoded.values()).filter(p => p && p.test).length;

  /* ---------- отрисовка ---------- */
  const fmt = ms => {
    const d = new Date(ms);
    const months = ['янв', 'фев', 'мар', 'апр', 'мая', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек'];
    return `${d.getDate()} ${months[d.getMonth()]}, ${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };
  const ago = ms => {
    const s = Math.round((Date.now() - ms) / 1000);
    if (s < 60) return 'только что';
    const m = Math.round(s / 60);
    if (m < 60) return `${m} ${plural(m, 'минуту', 'минуты', 'минут')} назад`;
    const h = Math.round(m / 60);
    if (h < 24) return `${h} ${plural(h, 'час', 'часа', 'часов')} назад`;
    const d = Math.round(h / 24);
    return `${d} ${plural(d, 'день', 'дня', 'дней')} назад`;
  };
  const cap = s => (s ? s.charAt(0).toUpperCase() + s.slice(1) : '');

  function describe(p) {
    const who = p.name ? esc(p.name) : 'Она';
    const tag = p.test ? '<span class="badge">тест</span>' : '';
    const dev = p.dev ? `<small>${esc(p.dev)}</small>` : '';
    if (p.t === 'open') return { ic: '👀', tx: `${who} открыла приглашение${tag}${dev}` };
    if (p.t === 'yes') {
      const n = p.tries || 0;
      const extra = n ? `пыталась нажать «Нет» ${n} ${plural(n, 'раз', 'раза', 'раз')}` : 'сразу, без раздумий';
      return { ic: '🎉', tx: `${who} сказала «да»${tag}<small>${extra}${p.sec != null ? ` · через ${p.sec} с после открытия` : ''}</small>` };
    }
    if (p.t === 'final') return { ic: '📬', tx: `${p.edit ? 'Изменила ответ' : 'Отправила ответ'}${tag}<small>${esc(cap(p.dateText))}, ${esc(p.time)}</small>` };
    return { ic: '•', tx: esc(p.t) };
  }

  let cdTimer = null;

  function render(newKeys = new Set()) {
    const list = events();
    const finals = list.filter(e => e.t === 'final');
    const last = finals[finals.length - 1];
    const yes = list.filter(e => e.t === 'yes').pop();
    const open = list.filter(e => e.t === 'open').pop();

    let hero;
    if (last) {
      hero = `<section class="card hero final">
        <div class="big">✦</div>
        <h3>${last.name ? esc(last.name) + ' сказала «да»' : 'Она сказала «да»'}</h3>
        <p>Свидание назначено. Ответ пришёл ${esc(ago(last._time))}.</p>
        <div class="when">${esc(cap(last.dateText))} · ${esc(last.time)}</div>
        <div class="countdown" id="cd"><div><b>0</b><span>дней</span></div><div><b>00</b><span>часов</span></div><div><b>00</b><span>минут</span></div><div><b>00</b><span>секунд</span></div></div>
      </section>`;
    } else if (yes) {
      hero = `<section class="card hero"><div class="big">🎉</div><h3>Она сказала «да»</h3><p>Сейчас выбирает детали. Страница обновится сама, как только придёт ответ.</p></section>`;
    } else if (open) {
      hero = `<section class="card hero"><div class="big">👀</div><h3>Приглашение открыто</h3><p>${esc(ago(open._time))}. Ждём ответа — страница обновится сама.</p></section>`;
    } else {
      hero = `<section class="card hero"><div class="big">🌙</div><h3>Пока тишина</h3><p>Ответов ещё нет. Отправь ей ссылку ниже — как только она откроет письмо, здесь всё появится.</p></section>`;
    }

    let answer = '';
    if (last) {
      const tags = arr => (arr && arr.length ? `<div class="tags">${arr.map(x => `<span class="tag">${esc(x)}</span>`).join('')}</div>` : '—');
      const mood = typeof last.mood === 'number' ? last.mood : null;
      answer = `<section class="card">
        <h2>Её ответ</h2>
        <div class="rows">
          <div class="row"><span class="k">Когда</span><span class="v">${esc(cap(last.dateText))}, ${esc(last.time)}</span></div>
          <div class="row"><span class="k">Еда</span><span class="v">${tags(last.food)}</span></div>
          ${last.noFood ? `<div class="row"><span class="k">Не ест</span><span class="v">${esc(last.noFood)}</span></div>` : ''}
          <div class="row"><span class="k">После ужина</span><span class="v">${tags(last.fun)}</span></div>
          ${last.dress ? `<div class="row"><span class="k">Дресс-код</span><span class="v">${esc(last.dress)}</span></div>` : ''}
          ${mood != null ? `<div class="row"><span class="k">Насколько ждёт</span><span class="v">${mood}%<div class="meter"><i style="width:${Math.max(0, Math.min(100, mood))}%"></i></div></span></div>` : ''}
          <div class="row"><span class="k">Попыток нажать «Нет»</span><span class="v">${last.tries || 0}</span></div>
          ${last.dev ? `<div class="row"><span class="k">Устройство</span><span class="v">${esc(last.dev)}</span></div>` : ''}
        </div>
        ${last.msg ? `<div class="quote-label">Она написала:</div><div class="quote">${esc(last.msg)}</div>` : '<p class="note">Сообщения не оставила.</p>'}
        ${finals.length > 1 ? `<p class="note">Она меняла ответ — показан последний вариант (всего ${finals.length}).</p>` : ''}
        <div class="row-btns" style="margin-top:14px"><button class="btn ghost" id="copyAns">Скопировать ответ</button></div>
      </section>`;
    }

    const items = list.slice().reverse().map(p => {
      const d = describe(p);
      const k = `${p.sid}|${p.t}|${p.at}`;
      return `<li class="${newKeys.has(k) ? 'new' : ''}"><span class="ic">${d.ic}</span><span class="tx">${d.tx}</span><span class="tm">${esc(fmt(p._time))}</span></li>`;
    }).join('');
    const tc = testCount();
    const timeline = `<section class="card">
      <h2>Хронология</h2>
      ${items ? `<ul class="timeline">${items}</ul>` : '<p class="empty">Событий пока нет</p>'}
      ${tc && !showTests ? `<p class="note">Скрыто тестовых событий: ${tc}. <a href="?tests" style="color:var(--rose-2)">показать</a></p>` : ''}
      ${badCount ? `<p class="note">Не удалось расшифровать: ${badCount}. Если это ваши ответы — проверь, что открыл страницу по своей секретной ссылке.</p>` : ''}
    </section>`;

    const share = `<section class="card">
      <h2>Ссылка для неё</h2>
      <div class="share">
        <div class="field">
          <input id="herName" placeholder="Её имя (необязательно)" maxlength="24" autocomplete="off">
          <input id="myName" placeholder="Твоё имя (необязательно)" maxlength="24" autocomplete="off">
        </div>
        <div class="link-out"><code id="inviteLink"></code><button class="btn" id="copyInvite">Копировать</button></div>
        <p class="hint">С именем заголовок станет «Имя, пойдёшь со мной на свидание?». Ссылку можно отправить в любой мессенджер.</p>
      </div>
    </section>`;

    const push = `<section class="card">
      <h2>Уведомления</h2>
      <div class="share">
        <p class="hint">Чтобы получать пуш на телефон, установи бесплатное приложение <b>ntfy</b>
          (<a href="https://apps.apple.com/app/ntfy/id1625396347" target="_blank" rel="noopener">iPhone</a> ·
          <a href="https://play.google.com/store/apps/details?id=io.heckel.ntfy" target="_blank" rel="noopener">Android</a>)
          и подпишись на тему:</p>
        <div class="link-out"><code>${esc(CFG.notifyTopic)}</code><button class="btn ghost" id="copyTopic">Копировать</button></div>
        <div class="row-btns">
          <button class="btn ghost" id="notifBtn">Уведомления в этом браузере</button>
          <a class="btn ghost" style="text-decoration:none" href="${esc(base + '/' + CFG.notifyTopic)}" target="_blank" rel="noopener">Открыть в ntfy.sh</a>
        </div>
      </div>
    </section>`;

    const keepName = $('#herName') ? $('#herName').value : '';
    const keepMe = $('#myName') ? $('#myName').value : '';
    app.innerHTML = hero + answer + timeline + share + push;
    $('#herName').value = keepName;
    $('#myName').value = keepMe;
    bind(last);
  }

  function inviteUrl() {
    const her = $('#herName').value.trim();
    const me = $('#myName').value.trim();
    const q = new URLSearchParams();
    if (her) q.set('to', her);
    if (me) q.set('from', me);
    const qs = q.toString();
    return (CFG.site || location.origin + location.pathname.replace(/mailbox\.html$/, '')) + (qs ? '?' + qs : '');
  }

  function bind(last) {
    const upd = () => { $('#inviteLink').textContent = inviteUrl(); };
    upd();
    $('#herName').addEventListener('input', upd);
    $('#myName').addEventListener('input', upd);
    $('#copyInvite').addEventListener('click', () => copy(inviteUrl()));
    $('#copyTopic').addEventListener('click', () => copy(CFG.notifyTopic));
    const nb = $('#notifBtn');
    if (!('Notification' in window)) nb.hidden = true;
    else if (Notification.permission === 'granted') nb.textContent = 'Уведомления в браузере включены ✓';
    nb.addEventListener('click', async () => {
      if (!('Notification' in window)) return;
      const r = await Notification.requestPermission();
      nb.textContent = r === 'granted' ? 'Уведомления в браузере включены ✓' : 'Браузер не разрешил уведомления';
    });
    if (last) {
      $('#copyAns').addEventListener('click', () => copy([
        `Когда: ${cap(last.dateText)}, ${last.time}`,
        last.food && last.food.length ? `Еда: ${last.food.join(', ')}` : '',
        last.noFood ? `Не ест: ${last.noFood}` : '',
        last.fun && last.fun.length ? `После ужина: ${last.fun.join(', ')}` : '',
        last.dress ? `Дресс-код: ${last.dress}` : '',
        last.msg ? `Она написала: «${last.msg}»` : ''
      ].filter(Boolean).join('\n')));
      startCountdown(last);
    } else {
      clearInterval(cdTimer);
    }
  }

  function startCountdown(p) {
    clearInterval(cdTimer);
    if (!p.date || !p.time) return;
    const [y, m, d] = p.date.split('-').map(Number);
    const [hh, mm] = p.time.split(':').map(Number);
    const target = new Date(y, m - 1, d, hh, mm);
    const tick = () => {
      const el = $('#cd');
      if (!el) return;
      let diff = Math.max(0, target - Date.now());
      const dd = Math.floor(diff / 864e5); diff -= dd * 864e5;
      const h = Math.floor(diff / 36e5); diff -= h * 36e5;
      const mi = Math.floor(diff / 6e4); diff -= mi * 6e4;
      const s = Math.floor(diff / 1e3);
      const b = el.querySelectorAll('b');
      b[0].textContent = dd; b[1].textContent = pad(h); b[2].textContent = pad(mi); b[3].textContent = pad(s);
      el.querySelector('span').textContent = plural(dd, 'день', 'дня', 'дней');
    };
    tick();
    cdTimer = setInterval(tick, 1000);
  }

  /* ---------- оповещение о новом ---------- */
  function ding() {
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      const ctx = new AC();
      [76, 83, 88].forEach((n, i) => {
        const o = ctx.createOscillator(), g = ctx.createGain();
        const t = ctx.currentTime + i * .09;
        o.frequency.value = 440 * Math.pow(2, (n - 69) / 12);
        g.gain.setValueAtTime(.0001, t);
        g.gain.exponentialRampToValueAtTime(.15, t + .01);
        g.gain.exponentialRampToValueAtTime(.0001, t + .9);
        o.connect(g).connect(ctx.destination);
        o.start(t); o.stop(t + 1);
      });
    } catch (e) { /* без звука */ }
  }

  function announce(fresh) {
    const visible = fresh.filter(p => showTests || !p.test);
    if (!visible.length) return;
    const top = visible.find(p => p.t === 'final') || visible.find(p => p.t === 'yes') || visible[0];
    const text = top.t === 'final' ? 'Пришёл её ответ 📬' : top.t === 'yes' ? 'Она сказала «да» 🎉' : 'Она открыла приглашение 👀';
    toast(text);
    if (top.t !== 'open') confetti(top.t === 'final' ? 180 : 110);
    ding();
    if ('Notification' in window && Notification.permission === 'granted' && document.hidden) {
      try { new Notification(text, { body: top.t === 'final' ? `${cap(top.dateText)}, ${top.time}` : '' }); } catch (e) { /* ignore */ }
    }
    const orig = 'Почтовый ящик';
    document.title = '● ' + text;
    setTimeout(() => { document.title = orig; }, 8000);
  }

  async function load() {
    const btn = $('#refresh');
    btn.classList.add('spin-it');
    const [stored, live] = await Promise.allSettled([fetchStored(), fetchLive()]);
    if (stored.status === 'fulfilled') addRaw(stored.value);
    if (live.status === 'fulfilled') addRaw(live.value);
    const fresh = await decodeAll();
    const newKeys = new Set(firstLoad ? [] : fresh.map(p => `${p.sid}|${p.t}|${p.at}`));
    render(newKeys);
    if (!firstLoad && fresh.length) announce(fresh);
    firstLoad = false;
    setTimeout(() => btn.classList.remove('spin-it'), 400);
  }

  function connect() {
    if (!window.EventSource) return;
    const live = $('#live'), txt = $('#liveText');
    const es = new EventSource(`${base}/${CFG.dataTopic}/sse`);
    es.onopen = () => { live.classList.add('on'); txt.textContent = 'на связи'; };
    es.onerror = () => { live.classList.remove('on'); txt.textContent = 'переподключаюсь'; };
    es.onmessage = async ev => {
      let m;
      try { m = JSON.parse(ev.data); } catch (e) { return; }
      if (!m || m.event !== 'message') return;
      if (!addRaw([m])) return;
      const fresh = await decodeAll();
      render(new Set(fresh.map(p => `${p.sid}|${p.t}|${p.at}`)));
      announce(fresh);
    };
  }

  async function init() {
    if (!rawKey) { showLocked(); return; }
    if (!window.LoveCrypto || !LoveCrypto.supported()) { showLocked('Этот браузер не умеет расшифровывать ответы. Открой страницу в свежем Chrome или Safari.'); return; }
    try {
      key = await LoveCrypto.importPrivate(CFG.pub, rawKey);
    } catch (e) {
      showLocked('Ключ в ссылке неверный. Открой страницу заново по своей секретной ссылке.');
      store.del('key');
      return;
    }
    $('#forget').hidden = false;
    app.innerHTML = '<section class="card hero"><div class="big">✦</div><h3>Загружаю…</h3></section>';
    await load();
    connect();
    setInterval(load, 60000);
    document.addEventListener('visibilitychange', () => { if (!document.hidden) load(); });
  }

  $('#refresh').addEventListener('click', () => { if (key) load(); });
  $('#forget').addEventListener('click', () => {
    store.del('key');
    location.reload();
  });

  init();
})();
