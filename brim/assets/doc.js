/* 국문/영문 전환. JS 가 없으면 두 언어가 모두 노출된다. */
(function () {
  var ko = document.getElementById('sec-ko'), en = document.getElementById('sec-en');
  if (!ko || !en) return;
  var divider = document.getElementById('lang-divider');
  var buttons = Array.prototype.slice.call(document.querySelectorAll('.lang button'));

  function apply(lang) {
    ko.hidden = (lang !== 'ko');
    en.hidden = (lang !== 'en');
    if (divider) divider.hidden = true;
    document.documentElement.lang = lang;
    buttons.forEach(function (b) {
      b.setAttribute('aria-selected', String(b.getAttribute('data-lang') === lang));
    });
    Array.prototype.forEach.call(document.querySelectorAll('[data-ko][data-en]'), function (el) {
      el.textContent = el.getAttribute('data-' + lang);
    });
    try { localStorage.setItem('brim-lang', lang); } catch (e) {}
  }

  var saved = null;
  try { saved = localStorage.getItem('brim-lang'); } catch (e) {}
  apply(saved === 'ko' || saved === 'en' ? saved : 'ko');

  buttons.forEach(function (b) {
    b.addEventListener('click', function () { apply(b.getAttribute('data-lang')); });
  });
})();
