(function () {
  'use strict';

  /* ---- scroll-spy: highlight the rail link for the section in view ---- */
  var links = Array.prototype.slice.call(
    document.querySelectorAll('.rail nav a[href^="#"]')
  );
  /* `sections` only collects links whose target exists, so it can be empty
     even when `links` is not — and anything thrown here would also stop the
     print handlers below from ever being registered. */
  if (links.length && 'IntersectionObserver' in window) {
    var byId = {};
    var sections = [];

    links.forEach(function (a) {
      var el = document.getElementById(a.hash.slice(1));
      if (el) { byId[el.id] = a; sections.push(el); }
    });

    var setActive = function (id) {
      links.forEach(function (a) { a.classList.remove('active'); });
      if (byId[id]) { byId[id].classList.add('active'); }
    };

    var observer = new IntersectionObserver(function (entries) {
      // pick the visible section closest to the top of the viewport
      var visible = entries.filter(function (e) { return e.isIntersecting; });
      if (!visible.length) { return; }
      visible.sort(function (a, b) {
        return a.boundingClientRect.top - b.boundingClientRect.top;
      });
      setActive(visible[0].target.id);
    }, { rootMargin: '-10% 0px -70% 0px', threshold: 0 });

    if (sections.length) {
      sections.forEach(function (s) { observer.observe(s); });
      setActive(sections[0].id);
    }
  }

  var details = Array.prototype.slice.call(document.querySelectorAll('details'));

  /* ---- an open abstract is moved below its sibling links by the `order` in
          .meta, so DOM order and reading order diverge. Put focus into the
          abstract as it opens and the keyboard path continues forward from
          what the eye is on, instead of jumping back up to the link row. ---- */
  details.forEach(function (d) {
    d.addEventListener('toggle', function () {
      if (!d.open) { return; }
      // Only when the reader opened it themselves. The print handler below
      // opens all five, and stealing focus there would scroll the page out
      // from under whoever just hit Ctrl+P.
      if (document.activeElement !== d.querySelector('summary')) { return; }
      var body = d.querySelector('.abs');
      if (!body) { return; }
      body.setAttribute('tabindex', '-1');
      body.focus({ preventScroll: true });
    });
  });

  /* ---- print: expand every abstract so nothing is silently omitted ---- */
  var wasOpen = null;
  window.addEventListener('beforeprint', function () {
    // Some print flows fire this twice; a second snapshot would record
    // everything as already-open and never restore.
    if (wasOpen) { return; }
    wasOpen = details.map(function (d) { return d.open; });
    details.forEach(function (d) { d.open = true; });
  });
  window.addEventListener('afterprint', function () {
    // Without a snapshot there is nothing to restore to — collapsing here
    // would close abstracts the reader had opened by hand.
    if (!wasOpen) { return; }
    details.forEach(function (d, i) { d.open = wasOpen[i]; });
    wasOpen = null;
  });
})();
