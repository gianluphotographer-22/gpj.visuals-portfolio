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
     HOMEPAGE — testi fissi (hero, chi sono, servizi, contatti)
     Sono testi scritti nel codice della pagina, non sezioni: un campo
     lasciato vuoto nel pannello vuol dire "tieni il testo originale",
     quindi qui si tocca il DOM solo per i campi che hanno un valore.
  ========================================================= */
  if (onRoot && C.home) {
    var hero = C.home.hero;
    if (hero) {
      var heroEy = $('.hero .eyebrow'); if (hero.eyebrow && heroEy) heroEy.textContent = hero.eyebrow;
      var heroSub = $('.hero-content > p'); if (hero.subtitle && heroSub) heroSub.textContent = hero.subtitle;
      if (hero.title) {
        var h1 = $('.hero h1');
        if (h1) h1.innerHTML = hero.title.split('\n').map(function (l) { return l.trim(); }).filter(Boolean)
          .map(function (l) { return '<span>' + R.esc(l) + '</span>'; }).join('');
      }
      var heroLinks = $$('.hero-actions a');
      if (hero.ctaWork && heroLinks[0]) heroLinks[0].textContent = hero.ctaWork;
      if (hero.ctaContact && heroLinks[1]) heroLinks[1].textContent = hero.ctaContact;
    }

    var about = C.home.about;
    if (about) {
      var aboutEy = $('.about .eyebrow'); if (about.eyebrow && aboutEy) aboutEy.textContent = about.eyebrow;
      var aboutH2 = $('.about h2'); if (about.title && aboutH2) aboutH2.textContent = about.title;
      if (about.body) {
        var aboutPs = $$('.about .about-grid > div.reveal > p');
        var paras = about.body.split(/\n\s*\n/).map(function (p) { return p.trim(); }).filter(Boolean);
        if (aboutPs.length) {
          aboutPs.forEach(function (p, i) { if (paras[i] != null) p.textContent = paras[i]; else p.remove(); });
          if (paras.length > aboutPs.length) {
            var lastP = aboutPs[aboutPs.length - 1];
            for (var pi = aboutPs.length; pi < paras.length; pi++) {
              var np = document.createElement('p'); np.textContent = paras[pi];
              lastP.insertAdjacentElement('afterend', np); lastP = np;
            }
          }
        }
      }
    }

    var servicesHead = C.home.servicesHead;
    if (servicesHead) {
      var svEy = $('.services .eyebrow'); if (servicesHead.eyebrow && svEy) svEy.textContent = servicesHead.eyebrow;
      var svH2 = $('.services h2'); if (servicesHead.title && svH2) svH2.textContent = servicesHead.title;
    }
    if (Array.isArray(C.home.services)) {
      var svRows = $$('.service-row');
      C.home.services.forEach(function (s, i) {
        var row = svRows[i]; if (!row) return;
        if (s.title) { var h3 = row.querySelector('h3'); if (h3) h3.textContent = s.title; }
        if (s.text) { var sp = row.querySelector('p'); if (sp) sp.textContent = s.text; }
      });
    }

    var contact = C.home.contact;
    if (contact) {
      var cEy = $('.contact .eyebrow'); if (contact.eyebrow && cEy) cEy.textContent = contact.eyebrow;
      var cH2 = $('.contact h2'); if (contact.title && cH2) cH2.textContent = contact.title;
      var cP = $('.contact > .container > p'); if (contact.body && cP) cP.textContent = contact.body;
      var cActions = $$('.contact-actions a');
      if (contact.email && cActions[0]) {
        cActions[0].setAttribute('href', 'mailto:' + contact.email);
        cActions[0].textContent = 'o scrivimi direttamente a ' + contact.email;
      }
      if (contact.instagramUrl && cActions[1]) cActions[1].setAttribute('href', contact.instagramUrl);
      if (contact.instagramLabel && cActions[1]) cActions[1].textContent = contact.instagramLabel;
    }
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
  // Pagine con un indice "I CAPITOLI" scritto a mano (vedi CSS
  // .match-chapter): il numero qui è quanti capitoli ha già la pagina
  // scritti a mano, per continuare a numerare da lì i capitoli
  // aggiunti dal pannello admin. Va tenuto allineato a LEGACY.chapters
  // nel pannello — se si aggiunge un capitolo scritto a mano fuori dal
  // pannello, va aggiornato anche qui.
  var CHAPTER_PAGES = { 'cuore-biancorosso': 2, 'matchday-stories': 1 };

  if (!onRoot) {
    var slug = (location.pathname.split('/').pop() || '').replace(/\.html?$/i, '');

    // Testo di apertura della pagina (titolo, intro, dati): stessa logica
    // dei testi fissi della homepage, campo vuoto = testo originale.
    var lmeta = (C.legacyMeta || {})[slug];
    if (lmeta) {
      var heroTag = $('.page-hero .eyebrow'); if (lmeta.tag && heroTag) heroTag.textContent = lmeta.tag;
      var heroH1 = $('.page-hero h1'); if (lmeta.title && heroH1) heroH1.textContent = lmeta.title;
      var introP = $('.project-intro'); if (lmeta.intro && introP) introP.textContent = lmeta.intro;
      if (Array.isArray(lmeta.facts)) {
        var factEls = $$('.project-facts .fact');
        lmeta.facts.forEach(function (f, i) {
          var fe = factEls[i]; if (!fe) return;
          var fk = fe.querySelector('small'), fv = fe.querySelector('strong');
          if (f.k && fk) fk.textContent = f.k;
          if (f.v && fv) fv.textContent = f.v;
        });
      }
    }

    var extra = (C.extras || {})[slug];
    var secs = extra ? (extra.sections || []).filter(function (s) { return s.visible !== false; }) : [];
    if (CHAPTER_PAGES[slug] != null) R.numberChapters(secs, CHAPTER_PAGES[slug]);
    var chapterSecs = secs.filter(function (s) { return s.type === 'chapter'; });
    var otherSecs = secs.filter(function (s) { return s.type !== 'chapter'; });

    if (otherSecs.length) {
      var groups = { gallery: [], video: [], end: [] };
      otherSecs.forEach(function (s) { (groups[s.placement || 'gallery'] || groups.end).push(s); });
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

    // Capitoli aggiunti dal pannello: vanno dopo l'ultimo capitolo già
    // in pagina (non dopo il primo ".gallery-section", che è l'indice
    // stesso), e serve anche aggiungere la voce nel menu "I CAPITOLI".
    if (chapterSecs.length) {
      var chHtml = R.sectionsHtml(chapterSecs, { srcFor: srcFor });
      var existingChapters = $$('.match-chapter');
      var lastChapter = existingChapters[existingChapters.length - 1];
      var galleryAnchor2 = $('.gallery-section');
      var main2 = $('main');
      if (lastChapter) lastChapter.insertAdjacentHTML('afterend', chHtml);
      else if (galleryAnchor2) galleryAnchor2.insertAdjacentHTML('afterend', chHtml);
      else if (main2) main2.insertAdjacentHTML('beforeend', chHtml);

      var navList = $('.match-nav');
      if (navList) {
        chapterSecs.forEach(function (s) {
          var num = s.number ? String(s.number) : '1';
          if (num.length < 2) num = '0' + num;
          var anchor = R.chapterAnchor(s, num);
          var li = document.createElement('li');
          li.innerHTML = '<a href="#' + anchor + '"><span class="n">' + num + '</span> ' + R.esc(String(s.title || '').toUpperCase()) + '</a>';
          navList.appendChild(li);
        });
        var idxBox = navList.closest ? navList.closest('.container') : null;
        var idxEyebrow = idxBox ? idxBox.querySelector('.eyebrow') : null;
        var total = chapterSecs[chapterSecs.length - 1].number;
        if (idxEyebrow && total) idxEyebrow.textContent = total + ' partite raccontate';
      }
    }
  }
})();
