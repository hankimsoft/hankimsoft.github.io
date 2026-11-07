/* hankimsoft 메인 — 폰 속 제목 날짜, 대표 앱 띠의 폰이 담은을 쓰는 모습을 되풀이해 보여 줌.
   숫자 · 문구 · 막대 규칙은 담은 소개 페이지(/brim/assets/app.js)와 같습니다. */
(function () {
  'use strict';
  var d = new Date(), title = (d.getMonth() + 1) + '월 ' + d.getDate() + '일 장보기';
  document.querySelectorAll('.scr .ttl').forEach(function (e) { e.textContent = title; });

  var scr = document.querySelector('.feature .scr'), steps = document.querySelectorAll('.feature__steps li');
  if (!scr || !window.IntersectionObserver || matchMedia('(prefers-reduced-motion: reduce)').matches) return;

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
    q('.badge').textContent = '✓ ' + n + ' · ' + num(ck);
    q('u.l1').style.width = Math.min(tot / BUDGET * 75, 100) + '%';
    q('u.l2').style.width = Math.min(ck / BUDGET * 75, 100) + '%';
    q('.gline b').textContent = exact ? '딱 맞췄어요' : over ? num(tot - BUDGET) + '원 넘었어요' : num(BUDGET - tot) + '원 남았어요';
    var leg = scr.querySelectorAll('.leg span');
    leg[0].textContent = '담은 ' + num(tot); leg[1].textContent = '체크 ' + num(ck);
    q('.filt').className = 'filt' + (s.filter ? ' on' : '');
    q('.filt em').textContent = ITEMS.length - n;
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
    for (var c = 1; c <= word.length; c++) (function (c) { at(500 + c * 120, function () { s.typed = word.slice(0, c); render(s); }); })(c);
    at(1900, function () { s.typing = -1; render(s); });
    // 마트에서 — 담을 때마다 금액을 넣으면 합계가 쌓인다
    at(2700, function () { step(1); take(s, 0); });
    at(3600, function () { take(s, 1); });
    at(4500, function () { take(s, 2); });
    at(5400, function () { take(s, 3); });
    // 남은 것만 보고 마저 담으면 예산에 딱 맞는다
    at(6600, function () { step(2); s.filter = true; render(s); });
    at(7500, function () { take(s, 4); });
    at(8400, function () { take(s, 5); });
    at(9300, function () { take(s, 6); });
    at(12600, function () { scr.classList.add('fade'); });
    at(13000, play);
  }
  function stop() { timers.forEach(clearTimeout); timers = []; }

  new IntersectionObserver(function (es) {
    var vis = es[0].isIntersecting;
    if (vis && !running) { running = true; shown = 35970; play(); }
    else if (!vis && running) { running = false; stop(); }
  }, { threshold: 0.35 }).observe(scr);
})();
