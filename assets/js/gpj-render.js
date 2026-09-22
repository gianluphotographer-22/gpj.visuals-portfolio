/*
 * assets/js/gpj-render.js
 * ------------------------------------------------------------------
 * Libreria di rendering condivisa tra il pannello admin
 * (admin-XXXX.html) e il sito pubblico (dynamic.js).
 *
 * Non tocca il DOM da sola: espone solo funzioni pure che
 * restituiscono stringhe HTML (o piccole utility). Chi la usa
 * decide se metterle in un iframe (anteprima admin), scaricarle
 * come file .html (pubblicazione) o iniettarle nella pagina
 * (dynamic.js sul sito vero).
 *
 * window.GPJRender = { esc, slugify, makeSrc, PLACEMENTS,
 *   EXTRA_PLACEMENTS, homePreview, extrasPreview, projectPage }
 * ------------------------------------------------------------------
 */
(function (global) {
  'use strict';

  /* =========================================================
     BASE
  ========================================================= */
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function slugify(s) {
    return String(s || '')
      .normalize('NFD').replace(/[̀-ͯ]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 60) || '';
  }

  // Trasforma un percorso salvato ("images/foto.jpg") nell'indirizzo
  // giusto per dove la pagina sta per essere mostrata.
  //   base    prefisso da anteporre ai percorsi già nel sito (es. "../")
  //   resolve funzione path -> url alternativo (es. blob: di una foto
  //           appena caricata nel pannello, non ancora pubblicata)
  function makeSrc(opts) {
    opts = opts || {};
    var base = opts.base || '';
    var resolve = typeof opts.resolve === 'function' ? opts.resolve : function () { return null; };
    return function (path) {
      if (!path) return '';
      if (/^(https?:)?\/\//i.test(path) || /^data:/i.test(path)) return path;
      var r = resolve(path);
      if (r) return r;
      return base + path.replace(/^\/+/, '');
    };
  }

  // Dove può comparire un blocco extra nella homepage.
  var PLACEMENTS = {
    intro: 'Dopo l’intro',
    work: 'Dopo il portfolio',
    about: 'Dopo «Chi sono»',
    services: 'Dopo i servizi',
    reviews: 'Dopo le recensioni'
  };
  // Dove può comparire una raccolta aggiunta a una pagina già nel sito.
  var EXTRA_PLACEMENTS = {
    gallery: 'Subito dopo le foto della pagina',
    video: 'Dopo il video',
    end: 'In fondo alla pagina'
  };

  /* =========================================================
     HELPER DI RENDER
  ========================================================= */
  var CHEV = '<span class="gpj-chev" aria-hidden="true"></span>';

  function paragraphs(body) {
    return String(body || '')
      .split(/\n\s*\n/)
      .map(function (p) { return p.trim(); })
      .filter(Boolean)
      .map(function (p) { return '<p>' + esc(p).replace(/\n/g, '<br>') + '</p>'; })
      .join('');
  }

  function sectionHead(s) {
    if (!s.eyebrow && !s.title) return '';
    return '<div class="gpj-sec-head">' +
      (s.eyebrow ? '<div class="eyebrow red">' + esc(s.eyebrow) + '</div>' : '') +
      (s.title ? '<h2>' + esc(s.title) + '</h2>' : '') +
      '</div>';
  }

  function galleryGrid(images, srcFor, columns) {
    if (!images || !images.length) return '';
    var cols = columns || 3;
    return '<div class="gallery-grid gpj-cols-' + cols + '">' +
      images.map(function (im, i) {
        return '<button class="gallery-item" type="button" aria-label="Apri immagine ' + (i + 1) + '">' +
          '<img src="' + esc(srcFor(im.path)) + '" alt="' + esc(im.alt || '') + '" loading="lazy" decoding="async">' +
          '</button>';
      }).join('') + '</div>';
  }

  function infoBody(s) {
    var facts = (s.facts || []).filter(function (f) { return f.k || f.v; });
    return '<div class="project-info-grid gpj-info-grid">' +
      '<div>' + (s.intro ? '<p class="project-intro">' + esc(s.intro).replace(/\n/g, '<br>') + '</p>' : '') + '</div>' +
      (facts.length ? '<div class="project-facts">' + facts.map(function (f) {
        return '<div class="fact"><small>' + esc(f.k) + '</small><strong>' + esc(f.v) + '</strong></div>';
      }).join('') + '</div>' : '') +
      '</div>';
  }

  function videoBody(s, srcFor) {
    var url = s.url || '';
    var player;
    var yt = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/))([\w-]{6,})/i);
    var vim = url.match(/vimeo\.com\/(\d+)/i);
    if (yt) {
      player = '<div class="video-frame gpj-embed"><iframe src="https://www.youtube.com/embed/' + esc(yt[1]) +
        '" title="Video" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe></div>';
    } else if (vim) {
      player = '<div class="video-frame gpj-embed"><iframe src="https://player.vimeo.com/video/' + esc(vim[1]) +
        '" title="Video" allow="autoplay; fullscreen; picture-in-picture" allowfullscreen></iframe></div>';
    } else if (url) {
      player = '<div class="video-frame"><video controls playsinline preload="metadata">' +
        '<source src="' + esc(srcFor(url)) + '" type="video/mp4">Il browser non supporta la riproduzione video.</video></div>';
    } else {
      player = '<div class="video-frame gpj-embed-empty">Nessun video collegato.</div>';
    }
    return '<div class="video-head"><div><p class="lead">' + (s.description ? esc(s.description).replace(/\n/g, '<br>') : '') + '</p></div></div>' +
      player + (s.note ? '<p class="video-note">' + esc(s.note) + '</p>' : '');
  }

  function cardsBody(s) {
    var items = (s.items || []).filter(function (it) { return it.title || it.text; });
    if (!items.length) return '';
    return (s.intro ? '<p class="lead gpj-cards-intro">' + esc(s.intro).replace(/\n/g, '<br>') + '</p>' : '') +
      '<div class="gpj-cards">' + items.map(function (it) {
        return '<article class="gpj-card">' +
          (it.meta ? '<div class="gpj-card-meta">' + esc(it.meta) + '</div>' : '') +
          (it.title ? '<h3>' + esc(it.title) + '</h3>' : '') +
          (it.text ? '<p>' + esc(it.text).replace(/\n/g, '<br>') + '</p>' : '') +
          (it.link ? '<a class="gpj-card-link" href="' + esc(it.link) + '" target="_blank" rel="noopener noreferrer">' +
            esc(it.label || 'Visualizza') + ' <span aria-hidden="true">↗</span></a>' : '') +
          '</article>';
      }).join('') + '</div>';
  }

  function sectionInner(s, srcFor) {
    switch (s.type) {
      case 'text': return '<div class="gpj-text">' + paragraphs(s.body) + '</div>';
      case 'info': return infoBody(s);
      case 'gallery': return galleryGrid(s.images, srcFor, s.columns);
      case 'collection':
        return (s.description ? '<p class="lead gpj-coll-desc">' + esc(s.description).replace(/\n/g, '<br>') + '</p>' : '') +
          galleryGrid(s.images, srcFor, s.columns);
      case 'video': return videoBody(s, srcFor);
      case 'cards': return cardsBody(s);
      default: return '';
    }
  }

  // Una sezione completa (extra homepage, raccolta o sezione di pagina).
  function sectionHtml(s, opts) {
    opts = opts || {};
    var srcFor = opts.srcFor || function (p) { return p; };
    if (s.visible === false) return '';
    var theme = s.theme || 'light';
    var typeClass = 'gpj-type-' + s.type;
    var fallbackLabel = { collection: 'Raccolta', text: 'Testo', info: 'Info progetto', gallery: 'Gallery', video: 'Video', cards: 'Schede' }[s.type] || 'Sezione';
    var titleText = s.title || fallbackLabel;
    var inner = sectionHead(s) + sectionInner(s, srcFor);

    if (s.collapsible) {
      var count = (s.type === 'collection' || s.type === 'gallery') ? (s.images || []).length : 0;
      var thumb = count && s.images[0] ? '<span class="gpj-coll-thumb"><img src="' + esc(srcFor(s.images[0].path)) + '" alt="" loading="lazy"></span>' : '';
      return '<details class="gpj-sec gpj-th-' + theme + ' ' + typeClass + '"' + (s.open !== false ? ' open' : '') + '>' +
        '<summary class="gpj-sec-sum">' + thumb +
        '<span class="gpj-sec-sum-txt"><b>' + esc(titleText) + '</b>' +
        (s.eyebrow ? '<small>' + esc(s.eyebrow) + '</small>' : '') +
        (count ? '<small>' + count + (count === 1 ? ' foto' : ' foto') + '</small>' : '') +
        '</span>' + CHEV + '</summary>' +
        '<div class="gpj-sec-body"><div class="container">' + inner + '</div></div></details>';
    }
    return '<section class="gpj-sec gpj-th-' + theme + ' ' + typeClass + '"><div class="container">' + inner + '</div></section>';
  }

  function sectionsHtml(list, opts) {
    return (list || []).map(function (s) { return sectionHtml(s, opts); }).join('');
  }

  /* =========================================================
     ANTEPRIMA — homepage e pagine già nel sito
     (usate solo dentro l'iframe del pannello: pagine minime,
     non l'intero index.html o l'intera pagina progetto, giusto
     per vedere come verrebbero le sezioni extra)
  ========================================================= */
  var PREVIEW_HEAD =
    '<meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">' +
    '<link rel="preconnect" href="https://fonts.googleapis.com">' +
    '<link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Manrope:wght@500;600;700;800&display=swap" rel="stylesheet">' +
    '<link rel="stylesheet" href="assets/css/style.css">' +
    '<link rel="stylesheet" href="assets/css/pages.css">' +
    '<style>body{background:#fff}.gpj-preview-note{padding:14px 22px;background:#111;color:#fff;font:600 12px Inter,sans-serif}</style>';

  function homePreview(sections, opts) {
    opts = opts || {};
    var srcFor = makeSrc({ base: '', resolve: opts.resolve });
    var vis = (sections || []).filter(function (s) { return s.visible !== false; });
    return '<!doctype html><html lang="it"><head>' + PREVIEW_HEAD + '</head><body class="project-page">' +
      '<p class="gpj-preview-note">Anteprima delle sezioni extra della homepage — il resto della pagina non è mostrato qui.</p>' +
      sectionsHtml(vis, { srcFor: srcFor }) +
      '</body></html>';
  }

  function extrasPreview(sections, opts) {
    opts = opts || {};
    var srcFor = makeSrc({ base: '', resolve: opts.resolve });
    var vis = (sections || []).filter(function (s) { return s.visible !== false; });
    return '<!doctype html><html lang="it"><head>' + PREVIEW_HEAD + '</head><body class="project-page">' +
      '<p class="gpj-preview-note">Anteprima delle raccolte aggiunte a «' + esc(opts.title || '') + '» — la pagina originale non è mostrata qui.</p>' +
      (vis.length ? sectionsHtml(vis, { srcFor: srcFor }) : '<p style="padding:40px;color:#707070;font:14px Inter,sans-serif">Ancora nessuna raccolta.</p>') +
      '</body></html>';
  }

  /* =========================================================
     PAGINA PROGETTO COMPLETA (nuove pagine create dal pannello)
     Usata sia per l'anteprima (preview:true, base:'') sia per il
     file .html vero esportato dentro projects/ (base:'../').
  ========================================================= */
  function nextTarget(page, opts) {
    var pages = opts.pages || [];
    var legacy = opts.legacy || [];
    if (page.next === 'none') return null;
    if (page.next && page.next.indexOf('page:') === 0) {
      var id = page.next.slice(5);
      var p = pages.filter(function (x) { return x.id === id; })[0];
      return p ? { href: p.slug + '.html', title: p.tag ? p.title : p.title } : null;
    }
    if (page.next && page.next.indexOf('legacy:') === 0) {
      var slug = page.next.slice(7);
      var l = legacy.filter(function (x) { return x.slug === slug; })[0];
      return l ? { href: slug + '.html', title: l.title } : null;
    }
    // automatico: la pagina successiva nell'elenco di quelle pubblicate
    var i = pages.indexOf(page);
    if (i === -1) i = pages.map(function (p2) { return p2.id; }).indexOf(page.id);
    var n = pages[i + 1] || pages[0];
    if (n && n.id !== page.id) return { href: n.slug + '.html', title: n.title };
    return null;
  }

  function projectPage(page, opts) {
    opts = opts || {};
    var preview = !!opts.preview;
    var base = preview ? '' : '../';
    var srcFor = makeSrc({ base: base, resolve: opts.resolve });
    var desc = page.description || ((page.tag ? page.tag + ' — ' : '') + (page.title || ''));
    var next = nextTarget(page, opts);
    var visSections = (page.sections || []).filter(function (s) { return s.visible !== false; });

    return '<!doctype html>\n<html lang="it">\n<head>\n' +
      '<meta charset="utf-8">\n' +
      '<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">\n' +
      '<meta name="theme-color" content="#e10600">\n' +
      '<meta name="description" content="' + esc(desc) + '">\n' +
      '<title>' + esc(page.title || 'Progetto') + ' — GPJ</title>\n' +
      '<link rel="icon" type="image/png" href="' + base + 'images/GPJ%20pos.png">\n' +
      '<link rel="apple-touch-icon" href="' + base + 'images/GPJ%20pos.png">\n' +
      '<link rel="preconnect" href="https://fonts.googleapis.com">\n' +
      '<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>\n' +
      '<link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Manrope:wght@500;600;700;800&display=swap" rel="stylesheet">\n' +
      '<link rel="stylesheet" href="' + base + 'assets/css/style.css">\n' +
      '<link rel="stylesheet" href="' + base + 'assets/css/pages.css">\n' +
      '</head>\n<body class="project-page">\n' +
      '<header class="site-header">\n' +
      '  <a class="brand" href="' + base + 'index.html">\n' +
      '    <span class="brand-mark"><img src="' + base + 'images/GPJ%20neg.png" alt="" width="64" height="64"></span>\n' +
      '    <span class="brand-name">GIANLUCA PAGLIONICO</span>\n' +
      '  </a>\n' +
      '  <nav class="nav" aria-label="Navigazione principale">\n' +
      '    <a href="' + base + 'index.html#work">Portfolio</a>\n' +
      '    <a href="' + base + 'index.html#about">Chi sono</a>\n' +
      '    <a href="' + base + 'index.html#services">Servizi</a>\n' +
      '    <a href="' + base + 'index.html#reviews">Recensioni</a>\n' +
      '    <a href="' + base + 'index.html#contact">Contatti</a>\n' +
      '  </nav>\n' +
      '  <a class="header-contact" href="' + base + 'index.html#contact">Parliamone</a>\n' +
      '  <button class="menu-btn" type="button" aria-label="Apri il menu" aria-expanded="false">☰</button>\n' +
      '</header>\n' +
      '<main id="top">\n' +
      '  <section class="page-hero">\n' +
      (page.cover ? '    <img src="' + esc(srcFor(page.cover)) + '" alt="' + esc(page.coverAlt || page.title || '') + '" fetchpriority="high" decoding="async">\n' : '') +
      '    <div class="container page-hero-content reveal">\n' +
      (page.tag ? '      <div class="eyebrow project-category">' + esc(page.tag) + '</div>\n' : '') +
      '      <h1>' + esc(page.title || '') + '</h1>\n' +
      '    </div>\n' +
      '  </section>\n' +
      sectionsHtml(visSections, { srcFor: srcFor }) +
      (next ? '  <section class="next-project">\n    <div class="container">\n      <div class="next-label">Progetto successivo</div>\n' +
        '      <a href="' + esc(next.href) + '">\n        <h2>' + esc(next.title) + '</h2>\n        <span class="next-arrow" aria-hidden="true">↗</span>\n      </a>\n    </div>\n  </section>\n' : '') +
      '</main>\n' +
      '<footer>\n  <strong>GPJ.VISUALS</strong>\n  <a href="' + base + 'index.html#work">Tutti i progetti</a>\n  <a href="#top">Top ↑</a>\n</footer>\n' +
      '<div class="lightbox" role="dialog" aria-modal="true" aria-label="Anteprima immagine" aria-hidden="true">\n' +
      '  <button class="lightbox-close" type="button" aria-label="Chiudi anteprima">×</button>\n  <img alt="Anteprima immagine">\n</div>\n' +
      '<script src="' + base + 'data/content.js"><\/script>\n' +
      '<script src="' + base + 'assets/js/gpj-render.js"><\/script>\n' +
      '<script src="' + base + 'assets/js/dynamic.js"><\/script>\n' +
      '<script src="' + base + 'assets/js/main.js"><\/script>\n' +
      '</body>\n</html>\n';
  }

  /* =========================================================
     CARD DI UNA PAGINA (per la griglia portfolio in home)
  ========================================================= */
  function projectCard(page, srcFor) {
    return '<a class="project' + (page.wide ? ' wide' : '') + ' reveal gpj-added" data-category="' + esc(page.category || 'content') + '" href="projects/' + esc(page.slug) + '.html">' +
      '<div class="project-media"><img src="' + esc(srcFor(page.cover || '')) + '" alt="' + esc(page.coverAlt || page.title || '') + '"></div>' +
      '<div class="project-bottom"><div>' +
      (page.tag ? '<div class="project-tag">' + esc(page.tag) + '</div>' : '') +
      '<h3>' + esc(page.title || '') + '</h3></div>' +
      '<div class="project-arrow">↗</div></div></a>';
  }

  /* =========================================================
     EXPORT
  ========================================================= */
  global.GPJRender = {
    esc: esc,
    slugify: slugify,
    makeSrc: makeSrc,
    PLACEMENTS: PLACEMENTS,
    EXTRA_PLACEMENTS: EXTRA_PLACEMENTS,
    sectionHtml: sectionHtml,
    sectionsHtml: sectionsHtml,
    projectCard: projectCard,
    homePreview: homePreview,
    extrasPreview: extrasPreview,
    projectPage: projectPage
  };
})(window);
