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
      num: function (n) { return Math.round(n).toLocaleString('ko-KR'); },
      unit: '원',
      // 스토어 스크린샷 목록에서 골랐다. 일곱 개를 다 담으면 예산에 딱 맞는다.
      budget: 50000,
      items: [['삼겹살 600g', 18900], ['계란 한 판', 7480], ['서울우유 2L', 5290], ['대파 한 단', 3980], ['애호박 2개', 3160], ['두부 2모', 4300], ['요거트 4입', 6890]],
      date: function (d) { return (d.getMonth() + 1) + '월 ' + d.getDate() + '일 장보기'; },
      // 앱 글자(ARB) 그대로
      done: '완료', lbl: '담은 금액', mode: '한 줄씩 ⌄', filt: '남은 것만', bubble: '딱 맞췄어요!',
      left: function (m) { return m + ' 남았어요'; }, exact: '딱 맞췄어요', over: function (m) { return m + ' 넘었어요'; },
      bud: function (m) { return '예산 ' + m + ' ›'; }, cart: '담은 ', checked: '체크 ',
      // 키패드 체험 — 처음엔 「12,900 × 2」에 30% 할인을 건 상태
      allDone: '다 담았어요!', allDoneSub: '장바구니를 다 채웠어요 👏',
      // 공유 글 — 앱 ARB(share*, receivedList*) 그대로
      sh: { def: '장보기', total: '합계', budget: '예산', app: '담은 - 장보기 계산기', get: 'https://hankimsoft.github.io/brim/get/', count: function (n) { return n + '개'; }, more: function (n) { return '외 ' + n + '개'; }, bud: function (m) { return '예산 ' + m; } },
      kname: '삼겹살 600g', kstart: '12900×2', dot: false,
      tag: function (p, m) { return p + '% 할인 · ' + m; },
    },
    en: {
      title: 'Brim - Shopping Calculator',
      money: function (n) { return '$' + n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }); },
      num: function (n) { return n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }); },
      unit: '',
      budget: 50,
      items: [['Chicken breast', 8.99], ['Eggs, dozen', 3.49], ['Milk, 1 gal', 3.89], ['Ground coffee', 8.90], ['Cheddar cheese', 4.79], ['Olive oil', 9.99], ['Paper towels', 9.95]],
      date: function (d) { return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) + ' shopping list'; },
      done: 'Done', lbl: 'In cart', mode: 'One at a time ⌄', filt: 'Remaining', bubble: 'Right on budget!',
      left: function (m) { return m + ' left'; }, exact: 'On budget', over: function (m) { return m + ' over'; },
      bud: function (m) { return 'Budget ' + m + ' ›'; }, cart: 'Cart ', checked: 'Checked ',
      allDone: 'All in the cart!', allDoneSub: 'Nothing left on the list 👏',
      sh: { def: 'Shopping list', total: 'Total', budget: 'Budget', app: 'Brim - Shopping Calculator', get: 'https://hankimsoft.github.io/brim/get/en/', count: function (n) { return n === 1 ? '1 item' : n + ' items'; }, more: function (n) { return '+' + n + ' more'; }, bud: function (m) { return 'Budget ' + m; } },
      kname: 'Chicken breast', kstart: '8.99×2', dot: true,
      tag: function (p, m) { return p + '% off · ' + m; },
    }
  };
  var lang = root.getAttribute('data-lang') === 'en' ? 'en' : 'ko';
  var T = L[lang];

  /* ---------- 폰 속 앱 화면 ----------
     앱과 같은 규칙: 「담은 금액」은 금액을 적은 항목의 합(체크와 무관), 체크한 금액은 따로(배지 · 아래 막대 · 범례).
     막대 색은 담은 금액 ÷ 예산으로 정한다(AppTheme.gaugeTopFor / gaugeBottomFor). 예산선은 막대의 75% 자리. */
  var TOP = ['#3E9E6E', '#E0A82E', '#E0792F', '#C2562E'], BOTTOM = ['#A9D8BE', '#F2D488', '#F2C4A0', '#E7B6A2'];
  function band(r) { return r < 0.5 ? 0 : r < 0.8 ? 1 : r <= 1 ? 2 : 3; }
  function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;'); }
  function cents(v) { return Math.round(v * 100); }

  // 첫 화면 — 집에서 금액을 아는 것만 적어 왔고(우유 · 두부), 두 개는 이미 담았다
  var user = { priced: [1, 1, 1, 0, 0, 1, 0], checked: [1, 1, 0, 0, 0, 0, 0] };
  var cur = null, last = null, seq = 0;

  // s = { priced:[], checked:[], typing:i, filter:true }
  function render(s) {
    last = s;
    var html = '', n = 0, tot = 0, ck = 0;
    T.items.forEach(function (it, i) {
      var priced = !!s.priced[i], on = !!s.checked[i];
      if (priced) tot += cents(it[1]);
      if (on) { n++; if (priced) ck += cents(it[1]); }
      if (s.typing === i) { html += '<li class="typing"><span class="ck"></span><span class="n">' + esc(it[0]) + '</span><span class="p"></span></li>'; return; }
      html += '<li data-i="' + i + '" class="' + (on ? 'on' : '') + (s.filter && on ? ' hide' : '') + '"><span class="ck"></span><span class="n">' + esc(it[0]) +
              '</span><span class="p">' + (priced ? esc(T.num(it[1])) : '') + '</span></li>';
    });
    if (s.filter && n === T.items.length) html = '<li class="alldone"><img src="assets/char/done_cheer.svg" alt=""><b>' + esc(T.allDone) + '</b><span>' + esc(T.allDoneSub) + '</span></li>';
    var ul = $('items'); ul.innerHTML = html; ul.classList.toggle('live', cur === 'hero');
    tot /= 100; ck /= 100;

    var b = band(tot / T.budget), exact = cents(tot) === cents(T.budget), over = tot > T.budget;
    $('total').textContent = T.unit ? T.num(tot) : T.money(tot);
    $('unit').textContent = T.unit;
    $('tot').className = 'tot' + (exact ? ' exact' : over ? ' over' : '');
    $('badge').textContent = '✓ ' + n + ' · ' + T.num(ck);
    $('l1').style.width = Math.min(tot / T.budget * 75, 100) + '%';
    $('l2').style.width = Math.min(ck / T.budget * 75, 100) + '%';
    $('l1').style.background = $('k1').style.background = TOP[b];
    $('l2').style.background = $('k2').style.background = BOTTOM[b];
    $('st').textContent = exact ? T.exact : over ? T.over(T.money(tot - T.budget)) : T.left(T.money(T.budget - tot));
    $('legT').textContent = T.cart + T.num(tot);
    $('legC').textContent = T.checked + T.num(ck);
    $('left').textContent = T.items.length - n;
    $('filt').className = 'filt' + (s.filter ? ' on' : '');
    $('cheer').className = 'cheer' + (exact && !s.filter ? ' on' : '');
  }

  function fly(i) {
    var li = document.querySelector('#items li[data-i="' + i + '"]'); if (!li) return;
    var screen = document.querySelector('.screen'), f = document.createElement('div');
    f.className = 'fly';
    f.innerHTML = '<span class="ck"></span><span class="n">' + esc(T.items[i][0]) + '</span><span class="p">+' + esc(T.unit ? T.num(T.items[i][1]) : T.money(T.items[i][1])) + '</span>';
    f.style.top = (li.getBoundingClientRect().top - screen.getBoundingClientRect().top - 4) + 'px';
    screen.appendChild(f); setTimeout(function () { f.remove(); }, 1250);
  }

  // 첫 화면에서는 직접 눌러 본다 — 안 담은 줄을 누르면 담고(금액이 없으면 금액도 넣어 합계에 더한다), 담은 줄을 누르면 체크만 푼다
  $('items').addEventListener('click', function (e) {
    var li = e.target.closest('li[data-i]'); if (!li || cur !== 'hero') return;
    var i = +li.dataset.i, added = false;
    if (user.checked[i]) user.checked[i] = 0;
    else { user.checked[i] = 1; if (!user.priced[i]) { user.priced[i] = 1; added = true; } }
    render(user); if (added) fly(i);
  });

  var STATES = {
    hero: function () { render(user); },
    // 집에서 — 금액을 아는 것만 적고, 마지막 줄은 지금 적는 중
    write: function () { render({ priced: [0, 0, 1, 0, 0, 1, 0], checked: [], typing: 6 }); },
    // 장 보면서 — 담고 금액을 넣을 때마다 합계가 쌓인다
    add: function () { render({ priced: [1, 1, 1, 1, 0, 1, 0], checked: [1, 1, 1, 1, 0, 0, 0] }); setTimeout(function () { if (cur === 'add') fly(3); }, 250); },
    budget: function () { render({ priced: [1, 1, 1, 1, 1, 1, 1], checked: [1, 1, 1, 1, 1, 1, 1] }); },
    // 「남은 것만」 — 남은 셋을 차례로 담으면 목록 자리에 「다 담았어요!」
    remain: function () {
      var s = { priced: [1, 1, 1, 1, 0, 1, 0], checked: [1, 1, 1, 1, 0, 0, 0], filter: true }, run = ++seq;
      render(s);
      [4, 5, 6].forEach(function (i, k) {
        setTimeout(function () {
          if (cur !== 'remain' || run !== seq) return;
          if (!s.priced[i]) fly(i);
          s.priced[i] = 1; s.checked[i] = 1; render(s);
        }, 1100 + k * 900);
      });
    }
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

  /* ---------- 키패드 체험 ----------
     앱 키패드(check_list_provider.dart)와 같은 순서: 사칙연산(× ÷ 먼저)으로 금액을 넣고, 「할인 %」를 누르면 할인 입력 —
     숫자가 할인율(정수, 100까지)이 되고 금액 칸은 「N% 할인 · 원가」, 연산자 · 소수점은 무시, 빈 할인율에서 지우면 원가로,
     완료를 누르면 할인가가 금액으로 들어간다. 처음엔 「12,900 × 2」에 30%를 막 적은 상태. */
  var expr = '', disc = null, dbase = 0, kidle = true;
  function calc(e) {
    var t = e.replace(/[+−×÷]$/, '').split(/([+−×÷])/).filter(function (x) { return x !== ''; });
    if (!t.length) return 0;
    var a = [+t[0]];
    for (var i = 1; i < t.length; i += 2) {
      var op = t[i], n = +t[i + 1];
      if (op === '×') a[a.length - 1] *= n;
      else if (op === '÷') a[a.length - 1] = n ? a[a.length - 1] / n : 0;
      else a.push(op === '−' ? -n : n);
    }
    return a.reduce(function (x, y) { return x + y; }, 0);
  }
  function round(v) { return lang === 'ko' ? Math.round(v) : Math.round(v * 100) / 100; }
  function group(n) { var p = n.split('.'); p[0] = p[0].replace(/\B(?=(\d{3})+(?!\d))/g, ','); return p.join('.'); }
  function pct() { return disc ? +disc : 0; }
  function drawKey() {
    var on = disc !== null, base = on ? dbase : round(calc(expr)), val = on ? round(base * (100 - pct()) / 100) : base;
    $('kname').textContent = T.kname;
    $('kexpr').textContent = !on && /[+−×÷]/.test(expr) ? expr.split(/([+−×÷])/).map(function (x) { return /\d/.test(x) ? group(x) : ' ' + x + ' '; }).join('') : '';
    $('kres').textContent = T.money(val);
    $('ktag').innerHTML = on ? '<span>' + esc(T.tag(pct(), T.money(base))) + '</span>' : '';
    $('kdot').disabled = !T.dot || on;
    $('kdisc').setAttribute('aria-pressed', String(on));
  }
  function flash() { var r = $('kres'); r.classList.add('flash'); setTimeout(function () { r.classList.remove('flash'); }, 400); }
  function endDisc() { var v = round(dbase * (100 - pct()) / 100); expr = String(pct() ? v : dbase); disc = null; }
  function press(k) {
    if (disc !== null) {                      // 할인 입력 중
      if (k === 'ok') { endDisc(); kidle = true; flash(); }
      else if (k === 'bs') { if (disc === '') endDisc(); else disc = disc.slice(0, -1); }
      else if (/^\d+$/.test(k)) { var next = disc + k; if (+next > 100) return; disc = String(+next); }
      else return;                            // 연산자 · 소수점은 무시
      return drawKey();
    }
    var last = expr.slice(-1), num = expr.split(/[+−×÷]/).pop();
    if (kidle && /^[0-9.]/.test(k)) { expr = ''; num = ''; last = ''; }   // 값이 정해진 뒤 숫자를 치면 새 금액
    kidle = false;
    if (k === 'bs') expr = expr.slice(0, -1);
    else if (k === 'ok') { expr = String(round(calc(expr)) || ''); kidle = true; flash(); }
    else if (/^[+−×÷]$/.test(k)) { if (!expr) return; expr = /[+−×÷]/.test(last) ? expr.slice(0, -1) + k : expr + k; }
    else if (k === '.') { if (!T.dot || num.indexOf('.') >= 0) return; expr += num ? '.' : '0.'; }
    else if (expr.length < 14) {
      if (/\.\d{2}$/.test(num)) return;
      expr = (num === '0' ? expr.slice(0, -1) : expr) + k;
    }
    drawKey();
  }
  // 「할인 %」 — 금액이 있어야 들어감(앱과 같음). 이미 할인 입력 중이면 그대로
  function startDisc() {
    if (disc !== null) return;
    var base = round(calc(expr)); if (!(base > 0)) return;
    dbase = base; disc = ''; kidle = false; drawKey();
  }
  document.querySelectorAll('#kkeys button').forEach(function (b) {
    b.addEventListener('click', function () { press(b.dataset.k === 'bs' ? 'bs' : b.dataset.k === 'ok' ? 'ok' : b.dataset.k === 'dot' ? '.' : b.textContent.trim()); });
  });
  $('kdisc').addEventListener('click', startDisc);

  /* ---------- 공유 ---------- 부탁하는 목록: 아직 아무것도 안 담았고, 대파는 금액을 모른다 */
  function drawShare() {
    var pick = [0, 1, 2, 3, 5], S = T.sh, total = 0;
    var rows = pick.map(function (i) { var it = T.items[i], known = i !== 3; if (known) total += it[1]; return { n: it[0], p: known ? T.money(it[1]) : '-' }; });
    var link = S.get + '#' + 'eJyrVkrOz0nVK0nNyVGyUlBKzs8ttlJIycxLL0os';
    $('shTxt').innerHTML = esc('🛒 ' + T.date(new Date())) + '\n\n' +
      rows.map(function (r) { return esc('☐ ' + r.n + '  ' + r.p); }).join('\n') + '\n\n' +
      esc(S.total + '  ' + T.money(Math.round(total * 100) / 100)) + '\n' + esc(S.budget + '  ' + T.money(T.budget)) + '\n\n' +
      esc(S.app) + '\n<a>' + esc(link.slice(0, 52)) + '…</a>';
    $('shCard').innerHTML = '<h4>' + esc(T.date(new Date())) + '</h4><div class="sm">' + esc(T.money(Math.round(total * 100) / 100)) +
      '<small>· ' + esc(S.count(rows.length) + ' · ' + S.bud(T.money(T.budget))) + '</small></div><hr>' +
      rows.slice(0, 3).map(function (r) { return '<div class="r"><i></i><span>' + esc(r.n) + '</span><span>' + esc(r.p) + '</span></div>'; }).join('') +
      '<div class="mo">' + esc(S.more(rows.length - 3)) + '</div>';
  }

  /* ---------- 언어 ---------- */
  function texts() {
    $('ttl').textContent = T.date(new Date());
    $('done').textContent = T.done; $('lbl').textContent = T.lbl; $('mode').textContent = T.mode;
    $('filtL').textContent = T.filt; $('bubble').textContent = T.bubble; $('bud').textContent = T.bud(T.money(T.budget));
    document.title = T.title;
  }
  // 저장은 사용자가 언어 버튼을 눌렀을 때만 — 처음엔 브라우저 언어로 정하고 아무것도 남기지 않는다
  function setLang(l, save) {
    lang = l; T = L[l];
    root.setAttribute('data-lang', l); root.lang = l;
    if (save) { try { localStorage.setItem('brim-lang', l); } catch (e) {} }
    expr = T.kstart; disc = null; startDisc(); disc = '30'; texts(); drawKey(); drawShare();
    if (last) { var k = cur; cur = null; go(k || 'hero'); }
  }
  document.querySelectorAll('.lang button').forEach(function (b) { b.addEventListener('click', function () { setLang(b.dataset.lang, true); }); });

  setLang(lang);
  go('hero');
  fit();
})();
