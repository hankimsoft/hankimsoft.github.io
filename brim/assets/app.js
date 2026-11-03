/* 담은 소개 페이지 런타임 — 언어 토글, 폰 속 앱 화면, 할인 · 입력 순서 데모.
   글은 HTML 에 두 언어가 다 들어 있고(.l-ko / .l-en), 여기선 폰 화면처럼 숫자가 움직이는 부분만 그린다.
   폰 화면의 색 · 문구는 담은 앱(check_list)의 theme.dart · ARB 와 같게 맞춘다. */
(function () {
  'use strict';

  var root = document.documentElement;
  var $ = function (id) { return document.getElementById(id); };

  /* ---------- 언어별 데이터 ---------- */
  var L = {
    ko: {
      title: '담은 - 장보기 계산기 (Brim)',
      money: function (n) { return Math.round(n).toLocaleString('ko-KR') + '원'; },
      big: function (n) { return Math.round(n).toLocaleString('ko-KR') + '<small>원</small>'; },
      // 전부 담으면 예산에 딱 맞는 예시 목록
      budget: 50000,
      items: [['삼겹살 600g', 18900], ['계란 한 판', 7480], ['우유 2.3L', 5290], ['애호박 2개', 3160], ['두부 2모', 3980], ['사과 5입', 11190]],
      adding: '대파',
      date: function (d) { return (d.getMonth() + 1) + '월 ' + d.getDate() + '일 장보기'; },
      done: '완료', lbl: '담은 금액', mode: '한 줄씩 ⌄', filt: '남은 것만', bubble: '딱 맞췄어요!',
      left: function (m) { return m + ' 남았어요'; }, exact: '딱 맞췄어요', over: function (m) { return m + ' 넘었어요'; },
      bud: function (m) { return '예산 ' + m + ' ›'; },
      price: 12900, offWord: '할인',
      modes: ['한 줄씩', '항목 먼저', '금액 먼저'],
      hints: ['장을 보면서 하나씩 담을 때', '집에서 목록을 미리 짤 때', '영수증을 보고 정리할 때'],
      rows: [['사과', 18900], ['우유', 7480], ['달걀', 5290]]
    },
    en: {
      title: 'Brim - Shopping Calculator',
      money: function (n) { return '$' + n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }); },
      big: function (n) { return '$' + n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }); },
      budget: 30,
      items: [['Chicken thighs 2 lb', 9.98], ['Eggs, dozen', 4.29], ['Milk 1 gal', 3.89], ['Zucchini ×2', 2.38], ['Tofu ×2', 3.98], ['Apples 3 lb', 5.48]],
      adding: 'Green onions',
      date: function (d) { return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) + ' shopping list'; },
      done: 'Done', lbl: 'In cart', mode: 'One at a time ⌄', filt: 'Remaining', bubble: 'Right on budget!',
      left: function (m) { return m + ' left'; }, exact: 'On budget', over: function (m) { return m + ' over'; },
      bud: function (m) { return 'Budget ' + m + ' ›'; },
      price: 12.9, offWord: 'off',
      modes: ['One at a time', 'Item first', 'Price first'],
      hints: ['Adding items as you shop', 'Planning the list at home', 'Sorting out a receipt'],
      rows: [['Apples', 13.9], ['Milk', 5.49], ['Eggs', 3.89]]
    }
  };
  var lang = root.getAttribute('data-lang') === 'en' ? 'en' : 'ko';
  var T = L[lang];

  /* ---------- 폰 속 앱 화면 ---------- */
  var CHECK = '<svg viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  var user = [true, true, false, false, false, false];
  var cur = null, last = null;

  // 앱의 AppTheme.gaugeTopFor 와 같은 경계
  function gaugeColor(r) { return r < 0.5 ? 'var(--g-green)' : r < 0.8 ? 'var(--g-amber)' : r <= 1 ? 'var(--g-orange)' : 'var(--g-red)'; }
  function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;'); }
  // 소수 금액끼리 더할 때 생기는 0.000001 오차를 센트 단위로 정리
  function sumOf(on) { var t = 0; T.items.forEach(function (it, i) { if (on[i]) t += Math.round(it[1] * 100); }); return t / 100; }

  // s = { on:[...], prices:false, adding:true, filter:true }
  function render(s) {
    last = s;
    var html = '', n = 0;
    T.items.forEach(function (it, i) {
      var on = !!s.on[i]; if (on) n++;
      var price = s.prices === false ? '<span class="p none">—</span>' : '<span class="p">' + esc(T.money(it[1]).replace(/원$|^\$/, '')) + '</span>';
      html += '<li data-i="' + i + '" class="' + (on ? 'on' : '') + (s.filter && on ? ' hide' : '') + '"><span class="c">' + CHECK + '</span><span class="n">' + esc(it[0]) + '</span>' + price + '</li>';
    });
    if (s.adding) html += '<li class="add"><span class="c"></span><span class="n">' + esc(T.adding) + '</span><span class="p none">—</span></li>';
    var ul = $('items'); ul.innerHTML = html; ul.classList.toggle('live', cur === 'hero');

    var total = sumOf(s.on), max = T.budget * 1.15, r = total / T.budget;
    $('total').innerHTML = T.big(total);
    $('badge').textContent = '✓ ' + n;
    $('fill').style.width = Math.min(total / max, 1) * 100 + '%';
    $('fill').style.setProperty('--gc', gaugeColor(r));
    $('mark').style.left = (T.budget / max * 100) + '%';
    var st = $('st');
    if (total === T.budget) { st.textContent = T.exact; st.className = 'st exact'; }
    else if (total > T.budget) { st.textContent = T.over(T.money(total - T.budget)); st.className = 'st over'; }
    else { st.textContent = T.left(T.money(T.budget - total)); st.className = 'st'; }
    $('left').textContent = T.items.length - n;
    $('filt').className = 'filt' + (s.filter ? ' on' : '');
    $('cheer').className = 'cheer' + (total === T.budget && !s.filter ? ' on' : '');
  }

  function fly(i) {
    var li = document.querySelector('#items li[data-i="' + i + '"]'); if (!li) return;
    var screen = document.querySelector('.screen'), f = document.createElement('div');
    f.className = 'fly';
    f.innerHTML = esc(T.items[i][0]) + ' <span>+' + esc(T.money(T.items[i][1]).replace(/원$|^\$/, '')) + '</span>';
    f.style.top = (li.getBoundingClientRect().top - screen.getBoundingClientRect().top - 6) + 'px';
    screen.appendChild(f); setTimeout(function () { f.remove(); }, 1150);
  }

  // 첫 화면에서는 직접 눌러 담는다
  $('items').addEventListener('click', function (e) {
    var li = e.target.closest('li[data-i]'); if (!li || cur !== 'hero') return;
    var i = +li.dataset.i; user[i] = !user[i]; render({ on: user }); if (user[i]) fly(i);
  });

  var STATES = {
    hero: function () { render({ on: user }); },
    write: function () { render({ on: [], prices: false, adding: true }); },
    add: function () { render({ on: [true, true, true, false, false, false] }); setTimeout(function () { if (cur === 'add') fly(2); }, 250); },
    budget: function () { render({ on: [true, true, true, true, true, true] }); },
    remain: function () { render({ on: [true, true, true, false, false, false], filter: true }); }
  };
  function go(k) {
    if (k === cur) return; cur = k; STATES[k]();
    document.querySelectorAll('.step').forEach(function (s) { s.classList.toggle('on', s.dataset.step === k); });
  }

  // 넓은 화면: 글이 화면 가운데를 지날 때 폰 화면을 바꾼다. 좁은 화면: 폰은 직접 눌러 보는 용도만.
  var wide = matchMedia('(min-width:981px)');
  var io = new IntersectionObserver(function (es) {
    if (!wide.matches) return;
    es.forEach(function (e) { if (e.isIntersecting) go(e.target.dataset.step); });
  }, { rootMargin: '-45% 0px -45% 0px' });
  document.querySelectorAll('.step').forEach(function (s) { io.observe(s); });

  // 넓은 화면에선 폰이 창 높이 안에 다 들어오게 줄인다
  function fit() {
    var ph = document.querySelector('.phone'), pin = document.querySelector('.phone-pin');
    if (!wide.matches) { ph.style.transform = ''; pin.style.height = ''; if (cur !== 'hero') go('hero'); return; }
    var k = Math.min(1, (innerHeight - 58 - 40) / 800);
    ph.style.transform = 'scale(' + k + ')'; pin.style.height = (800 * k + 40) + 'px';
  }
  addEventListener('resize', fit);
  if (wide.addEventListener) wide.addEventListener('change', fit);

  /* ---------- 할인 · 입력 순서 ---------- */
  var rate = 30, mode = 0;
  function drawDisc() {
    var off = Math.round(T.price * rate) / 100;
    if (lang === 'ko') off = Math.round(T.price * rate / 100);
    $('was').textContent = T.money(T.price);
    $('now').textContent = T.money(Math.round((T.price - off) * 100) / 100);
    $('off').textContent = '-' + T.money(off) + ' ' + T.offWord;
    document.querySelectorAll('#disc button').forEach(function (b) { b.setAttribute('aria-pressed', String(+b.dataset.v === rate)); });
  }
  function drawModes() {
    document.querySelectorAll('#modes button').forEach(function (b, i) { b.textContent = T.modes[i]; b.setAttribute('aria-pressed', String(i === mode)); });
    // 한 줄씩: 한 줄씩 채워 가는 중 / 항목 먼저: 이름 · 금액 / 금액 먼저: 금액 · 이름 (지난 소개 페이지 데모와 같은 모양)
    $('mrows').innerHTML = T.rows.map(function (r, i) {
      var name = esc(r[0]), price = esc(T.money(r[1]));
      if (mode === 0) return '<div><span>' + name + '</span><span class="' + (i === 0 ? '' : 'dim') + '">' + (i === 0 ? price : '—') + '</span></div>';
      if (mode === 2) return '<div><span>' + price + '</span><span>' + name + '</span></div>';
      return '<div><span>' + name + '</span><span>' + price + '</span></div>';
    }).join('');
    $('mhint').textContent = T.hints[mode];
  }
  document.querySelectorAll('#disc button').forEach(function (b) { b.addEventListener('click', function () { rate = +b.dataset.v; drawDisc(); }); });
  document.querySelectorAll('#modes button').forEach(function (b) { b.addEventListener('click', function () { mode = +b.dataset.v; drawModes(); }); });

  /* ---------- 언어 ---------- */
  function texts() {
    $('ttl').textContent = T.date(new Date());
    $('done').textContent = T.done; $('lbl').textContent = T.lbl; $('mode').textContent = T.mode;
    $('filtL').textContent = T.filt; $('bubble').textContent = T.bubble; $('bud').textContent = T.bud(T.money(T.budget));
    document.title = T.title;
  }
  function setLang(l) {
    lang = l; T = L[l];
    root.setAttribute('data-lang', l); root.lang = l;
    try { localStorage.setItem('brim-lang', l); } catch (e) {}
    texts(); drawDisc(); drawModes();
    if (last) { var k = cur; cur = null; go(k || 'hero'); }
  }
  document.querySelectorAll('.lang button').forEach(function (b) { b.addEventListener('click', function () { setLang(b.dataset.lang); }); });

  setLang(lang);
  go('hero');
  fit();
})();
