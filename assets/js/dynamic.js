/*
 * assets/js/dynamic.js
 * ------------------------------------------------------------------
 * Gira sul sito vero (non nel pannello admin). Legge i contenuti
 * pubblicati da data/content.js (window.GPJ_CONTENT) e li innesta
 * nella pagina già esistente: nuove card in home, sezioni extra
 * nella homepage, raccolte aggiunte alle pagine progetto già nel
 * sito, immagini generali sostituite.
 *
 * Caricato DOPO gpj-render.js e PRIMA di main.js: quando finisce,
 * il DOM è già pronto e main.js può agganciare filtri, lightbox,
 * reveal e menu anche sugli elementi appena aggiunti.
 *
 * Se data/content.js non esiste ancora o è vuoto, questo file non
 * fa nulla: il sito resta esattamente com'era.
 * ------------------------------------------------------------------
 */
(function () {
  'use strict';
  var R = window.GPJRender;
  var C = window.GPJ_CONTENT;
  if (!R || !C) return;

  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.from((r || document).querySelectorAll(s)); };

  var onRoot = document.body && !document.body.classList.contains('project-page');
  var srcFor = R.makeSrc({ base: onRoot ? '' : '../' });

  /* =========================================================
     IMMAGINI GENERALI DEL SITO
  ========================================================= */
  function siteImg(key) {
    var v = (C.siteImages || {})[key];
    return v || '';
  }
  function swapImg(el, key) {
    var v = siteImg(key);
    if (el && v) el.setAttribute('src', srcFor(v));
  }

  if (onRoot) {
    swapImg($('.hero-media img'), 'hero');
    swapImg($('.about img'), 'about');
    $$('.review-card').forEach(function (card, i) {
      swapImg($('.review-avatar', card), 'review-' + (i + 1));
    });
  } else {
    var slugHere = (location.pathname.split('/').pop() || '').replace(/\.html?$/i, '');
    swapImg($('.page-hero > img'), 'cover-' + slugHere);
  }
  // Copertine progetto nella griglia della home (valgono anche per
  // le pagine già nel sito, non solo per quelle create dal pannello).
  if (onRoot) {
    $$('.projects .project').forEach(function (a) {
      var href = a.getAttribute('href') || '';
      var m = href.match(/projects\/([^/]+)\.html/);
      if (!m) return;
      var v = siteImg('cover-' + m[1]);
      if (v) swapImg($('.project-media img', a), 'cover-' + m[1]);
    });
  }

  /* =========================================================
     HOMEPAGE — categorie, card nuove, sezioni extra
  ========================================================= */
  if (onRoot) {
    // Nuove categorie come filtri
    var filters = $('.filters');
    if (filters && Array.isArray(C.categories)) {
      C.categories.forEach(function (c) {
        if ($('.filter[data-filter="' + c.key + '"]', filters)) return;
        var b = document.createElement('button');
        b.className = 'filter'; b.type = 'button'; b.dataset.filter = c.key;
        b.textContent = c.label;
        filters.appendChild(b);
      });
    }

    // Nuove pagine come card nella griglia portfolio
    var grid = $('.projects');
    if (grid && Array.isArray(C.pages)) {
      var pub = C.pages.filter(function (p) { return p.published !== false && p.showInGrid !== false && p.slug; });
      var start = pub.filter(function (p) { return p.gridPosition === 'start'; });
      var end = pub.filter(function (p) { return p.gridPosition !== 'start'; });
      start.slice().reverse().forEach(function (p) {
        grid.insertAdjacentHTML('afterbegin', R.projectCard(p, srcFor));
      });
      end.forEach(function (p) {
        grid.insertAdjacentHTML('beforeend', R.projectCard(p, srcFor));
      });
    }

    // Sezioni extra della homepage, nella posizione scelta
    var ANCHORS = { intro: '.intro', work: '#work', about: '#about', services: '#services', reviews: '#reviews' };
    var homeSecs = ((C.home || {}).sections || []).filter(function (s) { return s.visible !== false; });
    var byPlace = {};
    homeSecs.forEach(function (s) { (byPlace[s.placement || 'reviews'] = byPlace[s.placement || 'reviews'] || []).push(s); });
    Object.keys(byPlace).forEach(function (place) {
      var anchor = $(ANCHORS[place] || ANCHORS.reviews);
      if (!anchor) return;
      var html = byPlace[place].map(function (s) {
        var out = R.sectionHtml(s, { srcFor: srcFor });
        return out.replace(/^(<details|<section)(\s)/, function (m0, tag, sp) { return tag + ' id="s-' + s.id + '"' + sp; });
      }).join('');
      anchor.insertAdjacentHTML('afterend', html);
    });

    // Voci di menu per le sezioni che lo richiedono
    var nav = $('.nav');
    if (nav) {
      homeSecs.filter(function (s) { return s.showInNav; }).forEach(function (s) {
        var label = s.navLabel || s.title || 'Sezione';
        var a = document.createElement('a');
        a.href = '#s-' + s.id;
        a.textContent = label;
        nav.appendChild(a);
      });
    }
  }

  /* =========================================================
     PAGINE GIÀ NEL SITO — raccolte e sezioni aggiunte
  ========================================================= */
  if (!onRoot) {
    var slug = (location.pathname.split('/').pop() || '').replace(/\.html?$/i, '');
    var extra = (C.extras || {})[slug];
    var secs = extra ? (extra.sections || []).filter(function (s) { return s.visible !== false; }) : [];
    if (secs.length) {
      var groups = { gallery: [], video: [], end: [] };
      secs.forEach(function (s) { (groups[s.placement || 'gallery'] || groups.end).push(s); });
      var afterGallery = $('.gallery-section');
      var afterVideo = $('.video-section');
      var beforeNext = $('.next-project');
      var main = $('main');

      if (groups.gallery.length) {
        var h1 = R.sectionsHtml(groups.gallery, { srcFor: srcFor });
        if (afterGallery) afterGallery.insertAdjacentHTML('afterend', h1);
        else if (main) main.insertAdjacentHTML('beforeend', h1);
      }
      if (groups.video.length) {
        var h2 = R.sectionsHtml(groups.video, { srcFor: srcFor });
        if (afterVideo) afterVideo.insertAdjacentHTML('afterend', h2);
        else if (afterGallery) afterGallery.insertAdjacentHTML('afterend', h2);
        else if (main) main.insertAdjacentHTML('beforeend', h2);
      }
      if (groups.end.length) {
        var h3 = R.sectionsHtml(groups.end, { srcFor: srcFor });
        if (beforeNext) beforeNext.insertAdjacentHTML('beforebegin', h3);
        else if (main) main.insertAdjacentHTML('beforeend', h3);
      }
    }
  }
})();
