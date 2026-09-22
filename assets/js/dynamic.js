/* =========================================================
   DYNAMIC.JS
   Legge data/content.js (creato dall'admin) e inserisce nella
   homepage:
   - le card delle nuove pagine progetto
   - i filtri delle nuove categorie
   - le sezioni extra (anche comprimibili)
   - le raccolte aggiunte alle pagine progetto già esistenti

   Deve essere caricato PRIMA di main.js, così filtri,
   animazioni e lightbox trovano già tutti gli elementi.
========================================================= */
(function () {
  'use strict';

  var C = window.GPJ_CONTENT;
  var R = window.GPJRender;
  if (!C || !R) return;

  /* nelle pagine progetto valgono solo le raccolte (punto 4) */
  var isProject = document.body.classList.contains('project-page');

  /* ---------- 0. immagini generali sostituite dall'admin ---------- */

  (function applySiteImages() {
    var overrides = C.siteImages || {};
    Object.keys(overrides).forEach(function (key) {
      var path = overrides[key];
      if (!path) return;
      var el = document.querySelector('[data-gx-img="' + key + '"]');
      if (!el) return;
      var base = isProject ? '../' : '';
      var R2 = R;
      var src = R2.makeSrc({ base: base })(path);
      if (src) el.src = src;
    });
  })();

  /* ---------- 1. card progetti ---------- */

  var grid = document.querySelector('.projects');
  var pages = (C.pages || []).filter(function (p) {
    return p.published !== false && p.showInGrid !== false;
  });

  if (grid && pages.length) {
    var atStart = pages.filter(function (p) { return p.gridPosition === 'start'; });
    var atEnd = pages.filter(function (p) { return p.gridPosition !== 'start'; });
    if (atStart.length) {
      grid.insertAdjacentHTML('afterbegin', atStart.map(function (p) { return R.projectCard(p); }).join(''));
    }
    if (atEnd.length) {
      grid.insertAdjacentHTML('beforeend', atEnd.map(function (p) { return R.projectCard(p); }).join(''));
    }
  }

  /* ---------- 2. filtri per le nuove categorie ---------- */

  var filters = document.querySelector('.filters');
  if (filters && pages.length) {
    (C.categories || []).forEach(function (cat) {
      var used = pages.some(function (p) { return p.category === cat.key; });
      var exists = filters.querySelector('[data-filter="' + cat.key + '"]');
      if (used && !exists) {
        var b = document.createElement('button');
        b.className = 'filter';
        b.type = 'button';
        b.setAttribute('data-filter', cat.key);
        b.textContent = cat.label;
        filters.appendChild(b);
      }
    });
  }

  /* ---------- 3. sezioni extra ---------- */

  var SELECTORS = {
    intro: '.intro',
    work: '#work',
    about: '#about',
    services: '#services',
    reviews: '#reviews'
  };

  var sections = isProject ? [] : ((C.home && C.home.sections) || []).filter(function (s) { return s.visible !== false; });
  var hasGallery = false;

  var byPlace = {};
  sections.forEach(function (s) {
    var key = SELECTORS[s.placement] ? s.placement : 'reviews';
    var html = R.section(s, { base: '' });
    if (!html) return;
    if (s.type === 'gallery' || s.type === 'collection') hasGallery = true;
    (byPlace[key] = byPlace[key] || []).push(html);
  });

  Object.keys(byPlace).forEach(function (key) {
    var ref = document.querySelector(SELECTORS[key]) || document.querySelector('#contact');
    if (!ref) return;
    var html = byPlace[key].join('\n');
    if (ref.id === 'contact' && key !== 'contact') ref.insertAdjacentHTML('beforebegin', html);
    else ref.insertAdjacentHTML('afterend', html);
  });

  /* voci di menu */
  var nav = document.querySelector('.nav');
  if (nav) {
    var contact = nav.querySelector('a[href="#contact"]');
    sections.forEach(function (s) {
      if (!s.showInNav) return;
      var a = document.createElement('a');
      a.href = '#' + R.anchorOf(s);
      a.textContent = s.navLabel || s.title || 'Sezione';
      nav.insertBefore(a, contact);
    });
  }

  /* ---------- 4. raccolte nelle pagine progetto già esistenti ---------- */

  var lightboxReady = false;
  function enableLightbox() {
    if (lightboxReady) return;
    lightboxReady = true;
    if (!document.querySelector('.lightbox')) {
      document.body.insertAdjacentHTML('beforeend',
        '<div class="lightbox" aria-hidden="true" role="dialog" aria-modal="true" aria-label="Anteprima immagine">' +
        '<button class="lightbox-close" type="button" aria-label="Chiudi">×</button><img alt="Anteprima"></div>');
    }
    document.addEventListener('click', function (e) {
      var b = e.target.closest('.gx-shot');
      if (!b) return;
      var lb = document.querySelector('.lightbox');
      if (!lb) return;
      lb.querySelector('img').src = b.querySelector('img').src;
      lb.classList.add('active');
      document.body.classList.add('locked');
    });
  }

  var EXTRA_SELECTORS = { gallery: '.gallery-section', video: '.video-section' };

  function addExtras() {
    if (!C.extras || !document.body.classList.contains('project-page')) return;
    var file = decodeURIComponent((location.pathname.split('/').pop() || '')).replace(/\.html?$/i, '');
    var entry = C.extras[file];
    if (!entry) return;

    var list = (entry.sections || []).filter(function (s) { return s.visible !== false; });
    var groups = { gallery: [], video: [], end: [] };
    var anyPhotos = false;

    list.forEach(function (s) {
      var html = R.section(s, { base: '../' });
      if (!html) return;
      if (s.type === 'gallery' || s.type === 'collection') anyPhotos = true;
      var key = groups[s.placement] ? s.placement : 'gallery';
      groups[key].push(html);
    });

    var next = document.querySelector('.next-project');
    var main = document.querySelector('main');

    ['gallery', 'video', 'end'].forEach(function (key) {
      if (!groups[key].length) return;
      var html = groups[key].join('\n');
      var ref = EXTRA_SELECTORS[key] ? document.querySelector(EXTRA_SELECTORS[key]) : null;
      if (ref) ref.insertAdjacentHTML('afterend', html);
      else if (next) next.insertAdjacentHTML('beforebegin', html);
      else if (main) main.insertAdjacentHTML('beforeend', html);
    });

    if (anyPhotos) enableLightbox();
  }

  addExtras();

  /* ---------- 5. lightbox per le gallerie in homepage ---------- */

  if (hasGallery) enableLightbox();
})();
