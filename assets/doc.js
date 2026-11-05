/* 문서 페이지 런타임 — 언어 토글(담은) + (있으면) 목차와 지금 읽는 조항 표시.
   첫 페인트 전 언어는 head 의 인라인 스크립트가 정한다. 트리밸은 국문 전용이라 토글이 없다. */
(function () {
  'use strict';
  var root = document.documentElement;
  var buttons = Array.prototype.slice.call(document.querySelectorAll('.lang button'));
  var toc = document.querySelector('.toc ol');
  var spy = null;

  function buildToc(lang) {
    if (!toc) return;
    var sec = document.getElementById('sec-' + lang) || document.querySelector('.sheet');
    if (!sec) return;
    var heads = Array.prototype.slice.call(sec.querySelectorAll('.doc h2'));
    toc.innerHTML = '';
    heads.forEach(function (h, i) {
      if (!h.id) h.id = lang + '-' + (i + 1);
      var li = document.createElement('li'), a = document.createElement('a');
      a.href = '#' + h.id; a.textContent = h.textContent;
      li.appendChild(a); toc.appendChild(li);
    });
    if (spy) spy.disconnect();
    spy = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (!e.isIntersecting) return;
        toc.querySelectorAll('a').forEach(function (a) { a.classList.toggle('on', a.getAttribute('href') === '#' + e.target.id); });
      });
    }, { rootMargin: '-80px 0px -70% 0px' });
    heads.forEach(function (h) { spy.observe(h); });
  }

  function apply(lang) {
    root.setAttribute('data-lang', lang);
    root.lang = lang;
    buttons.forEach(function (b) { b.setAttribute('aria-selected', String(b.getAttribute('data-lang') === lang)); });
    try { localStorage.setItem('brim-lang', lang); } catch (e) {}
    // 담은 문서 페이지는 head 스크립트가 두 언어 제목을 <html>에 넣어 둔다
    var t = root.getAttribute('data-title-' + lang);
    if (t) document.title = t;
    var s = document.querySelector('.toc summary');
    if (s) s.textContent = lang === 'ko' ? '목차' : 'Contents';
    buildToc(lang);
  }

  if (buttons.length) apply(root.getAttribute('data-lang') === 'en' ? 'en' : 'ko');
  else buildToc('ko');
  buttons.forEach(function (b) { b.addEventListener('click', function () { apply(b.getAttribute('data-lang')); }); });

  // 넓은 화면에선 목차를 늘 펼쳐 두고, 좁은 화면에선 접어 둔다
  var det = document.querySelector('details.toc');
  if (det) {
    var wide = matchMedia('(min-width:901px)');
    var sync = function () { det.open = wide.matches; };
    sync(); wide.addEventListener('change', sync);
    toc.addEventListener('click', function () { if (!wide.matches) det.open = false; });
  }

  // 지원 페이지: 주소의 #q-… 로 들어오면 그 질문을 펼친다
  if (location.hash) {
    var t = document.getElementById(location.hash.slice(1));
    if (t && t.tagName === 'DETAILS') t.open = true;
  }
})();
