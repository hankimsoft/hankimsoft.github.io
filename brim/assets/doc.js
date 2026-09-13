/* 언어 토글. 실제 표시는 CSS(html[data-lang])가 결정하고,
   첫 페인트 전 초기값은 head 의 인라인 스크립트가 정한다. */
(function () {
  var root = document.documentElement;
  var buttons = Array.prototype.slice.call(document.querySelectorAll('.lang button'));
  if (!buttons.length) return;

  function apply(lang) {
    root.setAttribute('data-lang', lang);
    root.lang = lang;
    buttons.forEach(function (b) {
      b.setAttribute('aria-selected', String(b.getAttribute('data-lang') === lang));
    });
    try { localStorage.setItem('brim-lang', lang); } catch (e) {}
  }

  apply(root.getAttribute('data-lang') === 'en' ? 'en' : 'ko');
  buttons.forEach(function (b) {
    b.addEventListener('click', function () { apply(b.getAttribute('data-lang')); });
  });
})();
