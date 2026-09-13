/* Brim 소개 페이지 런타임.
   HTML 은 이미 완성된 상태로 그려져 있고, 이 스크립트는 상호작용만 얹는다. */
(function () {
  'use strict';

  var D = window.__BRIM__;
  if (!D) return;

  /* ---------- 공통 ---------- */
  function nf(lang, x) {
    return lang === 'ko'
      ? Math.round(x).toLocaleString('ko-KR') + '원'
      : '$' + x.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }
  function setStyle(el, css) { if (el) el.setAttribute('style', css); }

  /* role="button" 인 요소는 클릭뿐 아니라 Enter·Space 로도 눌려야 한다. */
  function onActivate(el, fn) {
    el.addEventListener('click', fn);
    el.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'Spacebar') { e.preventDefault(); fn(); }
    });
  }

  function chip(active) {
    return active
      ? 'padding:10px 17px;border-radius:999px;background:#2A2521;color:#F4EFE6;font-size:13.5px;font-weight:700;cursor:pointer;border:1px solid #2A2521'
      : 'padding:10px 17px;border-radius:999px;background:#FBF8F3;color:#4A443C;font-size:13.5px;font-weight:600;cursor:pointer;border:1px solid #DACFBC';
  }
  function seg(active) {
    return active
      ? 'flex:1;text-align:center;padding:12px 8px;border-radius:14px;background:#2A2521;color:#F4EFE6;font-size:13.5px;font-weight:700;cursor:pointer;border:1px solid #2A2521'
      : 'flex:1;text-align:center;padding:12px 8px;border-radius:14px;background:#EDE7DD;color:#4A443C;font-size:13.5px;font-weight:600;cursor:pointer;border:1px solid #E0D7C7';
  }

  /* ---------- 섹션 하나(한 언어)에 동작 연결 ---------- */
  function wire(root, lang) {
    var t = D.text[lang];
    var q = function (sel) { return root.querySelector(sel); };
    var qa = function (sel) { return Array.prototype.slice.call(root.querySelectorAll(sel)); };

    /* 예산 게이지 */
    var range = q('[data-act="spent"]');
    if (range) {
      var budget = lang === 'ko' ? 100000 : 70;
      range.addEventListener('input', function () {
        var raw = Number(range.value);
        var spent = lang === 'ko' ? raw : Math.round(raw / 1000 * 0.7 * 100) / 100;
        var ratio = spent / budget, near = ratio >= 0.85, over = ratio > 1;
        var remain = budget - spent;

        q('[data-g="spentText"]').textContent = nf(lang, spent);

        var fillEl = q('[data-g="fill"]');
        fillEl.style.width = Math.min(100, ratio * 100).toFixed(1) + '%';
        fillEl.style.background = over ? '#C0503A' : near ? '#C9853F' : '#3E9E6E';

        var pill = q('[data-g="pill"]');
        pill.textContent = over ? t.gPillOver : near ? t.gPillNear : t.gPillRoom;
        pill.style.background = over ? '#F6DED8' : near ? '#F7E7D2' : '#DDEFE3';
        pill.style.color = over ? '#8E3323' : near ? '#8A5418' : '#1F5B3D';

        q('[data-g="remainLabel"]').textContent = over ? t.gRemainLabelOver : t.gRemainLabelNormal;
        var rem = q('[data-g="remain"]');
        rem.textContent = nf(lang, Math.abs(remain));
        rem.style.color = over ? '#8E3323' : '#1F5B3D';
      });
    }

    /* 할인 키패드 */
    var chips = qa('[data-act="disc"]');
    if (chips.length) {
      var base = lang === 'ko' ? 12900 : 12.9;
      chips.forEach(function (c) {
        onActivate(c, function () {
          var pct = Number(c.getAttribute('data-v'));
          var result = lang === 'ko'
            ? Math.round(base * (100 - pct) / 100)
            : Math.round(base * (100 - pct)) / 100;
          chips.forEach(function (o) { setStyle(o, chip(o === c)); });
          q('[data-d="result"]').textContent = nf(lang, result);
          q('[data-d="saved"]').textContent = '-' + nf(lang, base - result) + ' ' + t.dSavedWord;
        });
      });
    }

    /* 입력 순서 */
    var segs = qa('[data-act="mode"]');
    var rowsBox = q('[data-m="rows"]');
    if (segs.length && rowsBox) {
      var rowEls = Array.prototype.slice.call(rowsBox.children);
      segs.forEach(function (s) {
        onActivate(s, function () {
          var mode = Number(s.getAttribute('data-v'));
          segs.forEach(function (o) { setStyle(o, seg(o === s)); });
          q('[data-m="hint"]').textContent = t.modeHints[mode];
          D.rows[lang][mode].forEach(function (pair, i) {
            var row = rowEls[i];
            if (!row) return;
            var kids = row.children;
            kids[0].style.background = (mode === 1 && i > 0) ? '#DACFBC' : '#3E9E6E';
            kids[1].textContent = pair[0];
            kids[2].textContent = pair[1];
            kids[2].style.color = pair[1] === '—' ? '#A89C86' : '#2A2521';
          });
        });
      });
    }
  }

  /* ---------- 언어 전환 ---------- */
  var sections = { ko: document.getElementById('page-ko'), en: document.getElementById('page-en') };

  function show(lang) {
    document.documentElement.setAttribute('data-lang', lang);
    document.documentElement.lang = lang;
    try { localStorage.setItem('brim-lang', lang); } catch (e) {}
  }

  Object.keys(sections).forEach(function (lang) {
    var root = sections[lang];
    if (!root) return;
    wire(root, lang);
    Array.prototype.forEach.call(root.querySelectorAll('[data-act="lang"]'), function (b) {
      onActivate(b, function () { show(b.getAttribute('data-v')); });
    });
  });

  /* 초기 언어는 head 의 인라인 스크립트가 이미 정했다. */
})();
