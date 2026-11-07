/* hankimsoft 메인 — 폰 속 제목 날짜, 대표 앱 띠의 폰이 담은을 쓰는 모습을 되풀이해 보여 줌.
   숫자 · 문구 · 막대 규칙은 담은 소개 페이지(/brim/assets/app.js)와 같습니다. */
(function () {
  'use strict';
  var d = new Date(), title = (d.getMonth() + 1) + '월 ' + d.getDate() + '일 장보기';
  document.querySelectorAll('.scr .ttl').forEach(function (e) { e.textContent = title; });

  var calm = matchMedia('(prefers-reduced-motion: reduce)').matches;

  // 「무료로 받기」 — 아이폰 · 아이패드는 App Store, 안드로이드는 Google Play 로 바로. 그 밖에는 담은 페이지(공식 배지)
  var ua = navigator.userAgent;
  document.querySelectorAll('.get[data-ios]').forEach(function (a) {
    if (/iPhone|iPad|iPod/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1)) a.href = a.dataset.ios;
    else if (/Android/.test(ua)) a.href = a.dataset.android;
  });

  // 회사 소개 — 화면에 들어오면 한 글자씩 쳐 나감. 아직 안 친 글자도 자리는 지켜서(보이지만 않게) 줄이 흔들리지 않음
  var intro = document.querySelector('.studio__text');
  if (intro && window.IntersectionObserver && !calm) {
    var lines = [].slice.call(intro.children);
    intro.setAttribute('aria-label', intro.textContent.replace(/\s+/g, ' ').trim());
    lines.forEach(function (ln) { var t = ln.textContent; ln.setAttribute('aria-hidden', 'true'); ln.innerHTML = '<span class="typed"></span><span class="rest"></span>'; ln.lastChild.textContent = t; });
    var io = new IntersectionObserver(function (es) {
      if (!es[0].isIntersecting) return;
      io.disconnect();
      var li = 0;
      (function next() {
        var ln = lines[li]; if (!ln) return;
        var typed = ln.firstChild, rest = ln.lastChild;
        ln.classList.add('typing');
        (function tick() {
          if (rest.textContent) {
            typed.textContent += rest.textContent[0]; rest.textContent = rest.textContent.slice(1);
            setTimeout(tick, 55);
          } else if (++li < lines.length) { ln.classList.remove('typing'); setTimeout(next, 260); }
          else setTimeout(function () { ln.classList.remove('typing'); }, 2400);
        })();
      })();
    }, { threshold: 0.6 });
    io.observe(intro);
  }

  var scr = document.querySelector('.feature .scr'), steps = document.querySelectorAll('.feature__steps li'), chr = document.querySelector('.feature__char');
  if (!scr || !window.IntersectionObserver || calm) return;

  // 일곱 개를 다 담으면 예산 50,000원에 딱 맞는다
  var BUDGET = 50000, ITEMS = [['삼겹살 600g', 18900], ['계란 한 판', 7480], ['서울우유 2L', 5290], ['대파 한 단', 3980], ['애호박 2개', 3160], ['두부 2모', 4300], ['요거트 4입', 6890]];
  var q = function (s) { return scr.querySelector(s); };
  var num = function (n) { return n.toLocaleString('ko-KR'); };
  var ul = q('.items'), shown = 0, timers = [], running = false;

  // 막대 색 단계: 담은 금액 ÷ 예산 (앱의 gaugeTopFor 와 같음)
  function band(r) { return r < 0.5 ? 0 : r < 0.8 ? 1 : r <= 1 ? 2 : 3; }

  var cid = 0;
  function countTo(to) {
    var b = q('.tot b'), from = shown, t0 = performance.now(), id = ++cid;
    shown = to;
    (function tick(t) {
      if (id !== cid) return;
      var k = Math.max(0, Math.min(1, (t - t0) / 380));
      b.textContent = num(Math.round(from + (to - from) * (1 - Math.pow(1 - k, 3))));
      if (k < 1) requestAnimationFrame(tick);
    })(t0);
    setTimeout(function () { if (id === cid) b.textContent = num(to); }, 420);
  }

  // s = { priced:[], checked:[], typing:i, typed:'', filter:bool }
  function render(s) {
    var html = '', n = 0, tot = 0, ck = 0;
    ITEMS.forEach(function (it, i) {
      var p = !!s.priced[i], on = !!s.checked[i];
      if (p) tot += it[1];
      if (on) { n++; if (p) ck += it[1]; }
      var name = s.typing === i ? s.typed : it[0];
      html += '<li class="' + (on ? 'on' : '') + (s.typing === i ? ' typing' : '') + (s.filter && on ? ' hide' : '') + '"><span class="ck"></span><span class="n">' + name + '</span><span class="p">' + (p ? num(it[1]) : '') + '</span></li>';
    });
    if (s.filter && n === ITEMS.length) html = '<li class="alldone"><img src="/brim/assets/char/done_cheer.svg" alt=""><b>다 담았어요!</b><span>장바구니를 다 채웠어요 👏</span></li>';
    ul.innerHTML = html;
    var exact = tot === BUDGET, over = tot > BUDGET;
    if (tot !== shown) countTo(tot);
    scr.setAttribute('data-b', band(tot / BUDGET));
    q('.tot').className = 'tot' + (exact ? ' exact' : '');
    setChar(exact ? 3 : s.filter ? 2 : n ? 1 : 0);
    q('.badge').textContent = '✓ ' + n + ' · ' + num(ck);
    q('u.l1').style.width = Math.min(tot / BUDGET * 75, 100) + '%';
    q('u.l2').style.width = Math.min(ck / BUDGET * 75, 100) + '%';
    q('.gline b').textContent = exact ? '딱 맞췄어요' : over ? num(tot - BUDGET) + '원 넘었어요' : num(BUDGET - tot) + '원 남았어요';
    var leg = scr.querySelectorAll('.leg span');
    leg[0].textContent = '담은 ' + num(tot); leg[1].textContent = '체크 ' + num(ck);
    q('.filt').className = 'filt' + (s.filter ? ' on' : '');
    q('.filt em').textContent = ITEMS.length - n;
  }

  // 캐릭터 — 딱 맞는 순간 폭죽을 한 번 터뜨린다
  function setChar(k) {
    if (!chr || chr.getAttribute('data-k') === String(k)) return;
    chr.setAttribute('data-k', k);
    if (k === 3) burst();
  }

  /* 폭죽 꽃가루 — 앱 confetti_burst.dart 와 같은 조각 · 색 · 물리(30조각, 입구 쪽 -68° ±35°, 1.1초, 0.6초부터 사라짐).
     크기는 앱의 캐릭터 높이 88 기준으로 비례(scale). 입구 = tutorial_done 그림 안 (376/448, 55/240). */
  var CONF_COLORS = ['#3E9E6E', '#E0A82E', '#A9D8BE', '#E0792F', '#F2D488', '#2E7A56'];
  var pieces = (function () {
    var seed = 11, rnd = function () { seed = (seed * 1103515245 + 12345) % 2147483648; return seed / 2147483648; }, out = [];
    for (var i = 0; i < 30; i++) {
      var a = (-68 + (rnd() * 70 - 35)) * Math.PI / 180, v = 180 + rnd() * 192, sh = rnd();
      out.push({ vx: Math.cos(a) * v, vy: Math.sin(a) * v, t0: rnd() * Math.PI * 2, spin: (rnd() - 0.5) * 16, shape: sh < 0.4 ? 0 : sh < 0.75 ? 1 : 2, color: CONF_COLORS[i % 6] });
    }
    return out;
  })();
  function burst() {
    var cv = chr.querySelector('.feature__confetti'), img = chr.querySelectorAll('img')[3]; if (!cv || !img) return;
    var dpr = window.devicePixelRatio || 1, W = cv.offsetWidth, H = cv.offsetHeight, ctx = cv.getContext('2d');
    cv.width = W * dpr; cv.height = H * dpr;
    var ox = img.offsetLeft - cv.offsetLeft + img.offsetWidth * 376 / 448, oy = img.offsetTop - cv.offsetTop + img.offsetHeight * 55 / 240, k = img.offsetHeight / 88, t0 = performance.now();
    (function frame(now) {
      var sec = Math.max(0, (now - t0) / 1000);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, W, H);
      if (sec >= 1.1) return;
      ctx.globalAlpha = Math.max(0, Math.min(1, 1 - (sec - 0.6) / 0.45));
      pieces.forEach(function (p) {
        var x = ox + p.vx * k * sec * (1 - 0.35 * sec), y = oy + p.vy * k * sec + 0.5 * 576 * k * sec * sec;
        ctx.save(); ctx.translate(x, y); ctx.rotate(p.t0 + p.spin * sec); ctx.scale(k, k); ctx.fillStyle = p.color;
        if (p.shape === 1) { ctx.beginPath(); ctx.arc(0, 0, 2.2, 0, Math.PI * 2); ctx.fill(); }
        else { var w = p.shape ? 3 : 5, h = p.shape ? 13 : 9; ctx.beginPath(); if (ctx.roundRect) ctx.roundRect(-w / 2, -h / 2, w, h, 1.5); else ctx.rect(-w / 2, -h / 2, w, h); ctx.fill(); }
        ctx.restore();
      });
      requestAnimationFrame(frame);
    })(t0);
  }

  // 금액을 넣을 때 떠오르는 줄 — 「삼겹살 600g +18,900」
  function fly(i) {
    var li = ul.children[i]; if (!li || li.classList.contains('hide')) return;
    var f = document.createElement('div');
    f.className = 'fly';
    f.style.top = (li.offsetTop - 4) + 'px';
    f.innerHTML = '<span class="ck"></span><span class="n">' + ITEMS[i][0] + '</span><span class="p">+' + num(ITEMS[i][1]) + '</span>';
    scr.appendChild(f); setTimeout(function () { f.remove(); }, 1250);
  }

  function step(k) { steps.forEach(function (li, j) { li.classList.toggle('on', j === k); }); }
  function at(ms, fn) { timers.push(setTimeout(fn, ms)); }

  // 담기: 안 담은 줄을 누르면 담고, 금액이 없으면 금액도 넣는다
  function take(s, i) {
    var add = !s.priced[i];
    if (add) fly(i);
    s.checked[i] = 1; s.priced[i] = 1; render(s);
  }

  function play() {
    var s = { priced: [0, 0, 1, 0, 0, 1, 0], checked: [0, 0, 0, 0, 0, 0, 0], typing: 6, typed: '' };
    scr.classList.remove('fade'); step(0); render(s);
    // 집에서 — 금액을 아는 것만 적고, 마지막 줄을 적는 중
    var word = ITEMS[6][0];
    for (var c = 1; c <= word.length; c++) (function (c) { at(300 + c * 110, function () { s.typed = word.slice(0, c); render(s); }); })(c);
    at(1300, function () { s.typing = -1; render(s); });
    // 마트에서 — 담을 때마다 금액을 넣으면 합계가 쌓인다
    at(1900, function () { step(1); take(s, 0); });
    at(2650, function () { take(s, 1); });
    at(3400, function () { take(s, 3); });
    // 남은 것만 보고 마저 담으면 예산에 딱 맞는다 (우유는 남겨 둠 — 합계는 금액을 적은 항목의 합)
    at(4300, function () { step(2); s.filter = true; render(s); });
    at(5050, function () { take(s, 4); });
    at(5800, function () { take(s, 5); });
    at(6550, function () { take(s, 6); });
    at(9400, function () { scr.classList.add('fade'); });
    at(9800, play);
  }
  function stop() { timers.forEach(clearTimeout); timers = []; }

  new IntersectionObserver(function (es) {
    var vis = es[0].isIntersecting;
    if (vis && !running) { running = true; shown = 35970; play(); }
    else if (!vis && running) { running = false; stop(); }
  }, { threshold: 0.35 }).observe(scr);
})();
