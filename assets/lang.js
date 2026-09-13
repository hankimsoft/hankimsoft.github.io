/* hankimsoft — bilingual document toggle.
   Without JS both language sections render, separated by a divider. */
(function () {
  var ko = document.getElementById('sec-ko');
  var en = document.getElementById('sec-en');
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
    Array.prototype.forEach.call(
      document.querySelectorAll('[data-ko][data-en]'),
      function (el) { el.textContent = el.getAttribute('data-' + lang); }
    );
    try { localStorage.setItem('hankimsoft-lang', lang); } catch (e) {}
  }

  var saved = null;
  try { saved = localStorage.getItem('hankimsoft-lang'); } catch (e) {}
  var browserKo = (navigator.language || '').toLowerCase().indexOf('ko') === 0;
  apply(saved === 'ko' || saved === 'en' ? saved : (browserKo ? 'ko' : 'en'));

  buttons.forEach(function (b) {
    b.addEventListener('click', function () { apply(b.getAttribute('data-lang')); });
  });
})();
