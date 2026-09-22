/* =========================================================
   GPJ RENDER
   Genera l'HTML di sezioni, card progetto e pagine intere.

   Usato da:
   - admin.html            (anteprima live + esportazione pagine)
   - assets/js/dynamic.js  (sezioni e card sulla homepage)

   Un solo motore = l'anteprima dell'admin è identica al sito.
========================================================= */
(function (root) {
  'use strict';

  /* ---------- utilità ---------- */

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function paragraphs(text) {
    return String(text || '')
      .split(/\n{2,}/)
      .map(function (p) { return p.trim(); })
      .filter(Boolean)
      .map(function (p) { return '<p>' + esc(p).replace(/\n/g, '<br>') + '</p>'; })
      .join('');
  }

  function slugify(s) {
    return String(s || '')
      .toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 60) || 'pagina';
  }

  function encodeSeg(s) {
    try { return encodeURIComponent(decodeURIComponent(s)); } catch (e) { return s; }
  }

  /* Trasforma un percorso salvato (es. "images/foto.jpg") in un URL
     valido rispetto alla pagina che lo mostra.
       base    : "" per la homepage, "../" per projects/*.html
       resolve : (facoltativo) usato dall'admin per le anteprime da blob */
  function makeSrc(o) {
    var base = (o && o.base) || '';
    var resolve = o && o.resolve;
    return function (p) {
      p = String(p == null ? '' : p).trim();
      if (!p) return '';
      if (resolve) {
        var r = resolve(p);
        if (r) return r;
      }
      if (/^(https?:|data:|blob:|\/\/|\/)/i.test(p)) return p;
      p = p.replace(/^(\.\.?\/)+/, '');
      return base + p.split('/').map(encodeSeg).join('/');
    };
  }

  var PLACEHOLDER =
    'data:image/svg+xml;utf8,' +
    encodeURIComponent(
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 1000">' +
      '<rect width="800" height="1000" fill="#1a1a1a"/>' +
      '<path d="M0 1000L800 0" stroke="#e10600" stroke-width="2" opacity=".35"/></svg>'
    );

  /* ---------- video ---------- */

  function videoHtml(url, o) {
    url = String(url || '').trim();
    if (!url) return '';
    var m;
    if ((m = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/))([\w-]{6,})/))) {
      return '<div class="gx-video-frame"><iframe src="https://www.youtube.com/embed/' + m[1] +
        '" title="Video" loading="lazy" allow="accelerometer; encrypted-media; picture-in-picture" allowfullscreen></iframe></div>';
    }
    if ((m = url.match(/vimeo\.com\/(?:video\/)?(\d+)/))) {
      return '<div class="gx-video-frame"><iframe src="https://player.vimeo.com/video/' + m[1] +
        '" title="Video" loading="lazy" allow="fullscreen; picture-in-picture" allowfullscreen></iframe></div>';
    }
    var type = /\.webm(\?|$)/i.test(url) ? 'video/webm' : /\.ogv(\?|$)/i.test(url) ? 'video/ogg' : 'video/mp4';
    return '<div class="gx-video-frame"><video controls playsinline preload="metadata">' +
      '<source src="' + esc(o.src(url)) + '" type="' + type + '">' +
      'Il browser non supporta la riproduzione video.</video></div>';
  }

  /* ---------- corpo dei vari tipi di sezione ---------- */

  var BODY = {

    text: function (s) {
      var html = paragraphs(s.body);
      return html ? '<div class="gx-prose">' + html + '</div>' : '';
    },

    info: function (s) {
      var facts = (s.facts || [])
        .filter(function (f) { return f && f.v; })
        .map(function (f) {
          return '<div class="gx-fact"><small>' + esc(f.k) + '</small><strong>' + esc(f.v) + '</strong></div>';
        }).join('');
      var intro = s.intro ? '<p class="gx-intro">' + esc(s.intro).replace(/\n/g, '<br>') + '</p>' : '';
      if (!intro && !facts) return '';
      return '<div class="gx-info-grid"><div>' + intro + '</div>' +
        (facts ? '<div class="gx-facts">' + facts + '</div>' : '') + '</div>';
    },

    gallery: function (s, o) {
      var imgs = (s.images || []).filter(function (i) { return i && i.path; });
      if (!imgs.length) return '';
      var cols = [2, 3, 4].indexOf(+s.columns) > -1 ? +s.columns : 3;
      return '<div class="gx-gallery-grid" data-cols="' + cols + '">' +
        imgs.map(function (i, n) {
          return '<button class="gx-shot" type="button" aria-label="Apri immagine ' + (n + 1) + '">' +
            '<img src="' + esc(o.src(i.path)) + '" alt="' + esc(i.alt || s.title || '') +
            '" loading="lazy" decoding="async"></button>';
        }).join('') + '</div>';
    },

    /* Raccolta: descrizione + foto (es. le foto di un'altra partita) */
    collection: function (s, o) {
      var desc = paragraphs(s.description);
      var grid = BODY.gallery(s, o);
      if (!desc && !grid) return '';
      return (desc ? '<div class="gx-prose gx-coll-desc">' + desc + '</div>' : '') + grid;
    },

    video: function (s, o) {
      var v = videoHtml(s.url, o);
      if (!v && !s.description) return '';
      return (s.description ? '<p class="gx-lead">' + esc(s.description) + '</p>' : '') + v +
        (s.note ? '<p class="gx-note">' + esc(s.note) + '</p>' : '');
    },

    cards: function (s) {
      var items = (s.items || []).filter(function (i) { return i && (i.title || i.text); });
      var lead = s.intro ? '<p class="gx-lead">' + esc(s.intro) + '</p>' : '';
      if (!items.length) return lead;
      return lead + '<div class="gx-cards">' + items.map(function (i) {
        var link = i.link
          ? '<a class="gx-card-link" href="' + esc(i.link) + '"' +
            (/^https?:/i.test(i.link) ? ' target="_blank" rel="noopener noreferrer"' : '') + '>' +
            esc(i.label || 'Visualizza') + '<span aria-hidden="true">↗</span></a>'
          : '';
        return '<article class="gx-card">' +
          (i.meta ? '<div class="gx-card-meta">' + esc(i.meta) + '</div>' : '') +
          (i.title ? '<h3>' + esc(i.title) + '</h3>' : '') +
          (i.text ? '<p>' + esc(i.text) + '</p>' : '') + link + '</article>';
      }).join('') + '</div>';
    }
  };

  /* ---------- sezione completa ---------- */

  function anchorOf(sec) {
    return 'sec-' + slugify(sec.anchor || sec.title || sec.id || 'sezione') + (sec.anchor ? '' : '-' + String(sec.id || '').slice(-4));
  }

  function section(sec, o) {
    o = o || {};
    if (!o.src) o.src = makeSrc(o);
    var fn = BODY[sec.type];
    if (!fn) return '';
    var body = fn(sec, o);
    if (!body) return '';

    var theme = ['light', 'white', 'dark', 'red'].indexOf(sec.theme) > -1 ? sec.theme : 'light';
    var head = '';
    if (sec.eyebrow || sec.title) {
      head = '<div class="gx-head-text">' +
        (sec.eyebrow ? '<div class="eyebrow red">' + esc(sec.eyebrow) + '</div>' : '') +
        (sec.title ? '<h2 class="gx-title">' + esc(sec.title) + '</h2>' : '') + '</div>';
    }
    var id = anchorOf(sec);
    var cls = 'gx-sec gx-' + sec.type + ' gx-theme-' + theme;

    if (sec.collapsible) {
      if (!head) head = '<div class="gx-head-text"><h2 class="gx-title">' + (sec.type === 'collection' ? 'Raccolta' : 'Sezione') + '</h2></div>';
      var thumb = '', count = '';
      if (sec.type === 'collection') {
        var ims = (sec.images || []).filter(function (i) { return i && i.path; });
        if (ims.length) {
          thumb = '<img class="gx-thumb" src="' + esc(o.src(ims[0].path)) + '" alt="" loading="lazy" decoding="async">';
          count = '<span class="gx-count">' + ims.length + ' foto</span>';
        }
      }
      return '<section class="' + cls + '" id="' + id + '"><div class="container">' +
        '<details class="gx-collapse' + (sec.type === 'collection' ? ' gx-coll' : '') + '"' + (sec.open === false ? '' : ' open') + '>' +
        '<summary class="gx-summary">' + thumb + head + count + '<span class="gx-toggle" aria-hidden="true"></span></summary>' +
        '<div class="gx-body">' + body + '</div></details></div></section>';
    }

    return '<section class="' + cls + '" id="' + id + '"><div class="container">' +
      (head ? '<div class="gx-head reveal">' + head + '</div>' : '') +
      '<div class="gx-body reveal">' + body + '</div></div></section>';
  }

  /* ---------- card nella griglia progetti ---------- */

  function projectCard(p, o) {
    o = o || {};
    var src = o.src || makeSrc(o);
    var base = o.base || '';
    var cover = p.cover ? src(p.cover) : PLACEHOLDER;
    return '<a class="project' + (p.wide ? ' wide' : '') + ' reveal" data-category="' + esc(p.category || 'content') +
      '" data-gx="1" href="' + esc(base + 'projects/' + p.slug + '.html') + '">' +
      '<div class="project-media"><img src="' + esc(cover) + '" alt="' + esc(p.coverAlt || p.title) + '"></div>' +
      '<div class="project-bottom"><div><div class="project-tag">' + esc(p.tag) + '</div>' +
      '<h3>' + esc(p.title) + '</h3></div><div class="project-arrow">↗</div></div></a>';
  }

  /* ---------- pagina progetto completa ---------- */

  function nextBlock(page, ctx) {
    var n = page.next || 'auto';
    if (n === 'none') return '';
    var href = '', label = '';
    var pages = ctx.pages || [];
    var legacy = ctx.legacy || [];
    var i, item;

    if (n === 'auto') {
      var idx = -1;
      for (i = 0; i < pages.length; i++) if (pages[i].id === page.id) idx = i;
      if (pages.length > 1 && idx > -1) {
        item = pages[(idx + 1) % pages.length];
        href = item.slug + '.html'; label = item.title;
      } else { href = '../index.html#work'; label = 'Tutti i progetti'; }
    } else if (n.indexOf('legacy:') === 0) {
      for (i = 0; i < legacy.length; i++) if (legacy[i].slug === n.slice(7)) item = legacy[i];
      if (item) { href = item.slug + '.html'; label = item.title; }
    } else if (n.indexOf('page:') === 0) {
      for (i = 0; i < pages.length; i++) if (pages[i].id === n.slice(5)) item = pages[i];
      if (item) { href = item.slug + '.html'; label = item.title; }
    }
    if (!href) return '';
    return '<section class="next-project"><div class="container"><div class="next-label">Progetto successivo</div>' +
      '<a href="' + esc(href) + '"><h2>' + esc(label) + '</h2><span class="next-arrow" aria-hidden="true">↗</span></a>' +
      '</div></section>';
  }

  var OPENER =
    '<script>document.addEventListener("click",function(e){var b=e.target.closest(".gx-shot");if(!b)return;' +
    'var l=document.querySelector(".lightbox");if(!l)return;l.querySelector("img").src=b.querySelector("img").src;' +
    'l.classList.add("active");document.body.classList.add("locked");});</script>';

  function projectPage(page, ctx) {
    ctx = ctx || {};
    var preview = !!ctx.preview;
    var base = preview ? '' : '../';
    var o = { base: base, resolve: ctx.resolve };
    o.src = makeSrc(o);

    var sections = (page.sections || []).filter(function (s) { return s.visible !== false; })
      .map(function (s) { return section(s, { base: base, src: o.src }); }).join('\n');

    var desc = page.description || (page.title + ' — ' + page.tag);
    var cover = page.cover ? o.src(page.cover) : '';

    return '<!doctype html>\n<html lang="it">\n<head>\n<meta charset="utf-8">\n' +
      '<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">\n' +
      '<meta name="theme-color" content="#e10600">\n' +
      '<meta name="description" content="' + esc(desc) + '">\n' +
      '<title>' + esc(page.title) + ' — GPJ</title>\n' +
      '<link rel="icon" type="image/png" href="' + base + 'images/GPJ%20pos.png">\n' +
      '<link rel="apple-touch-icon" href="' + base + 'images/GPJ%20pos.png">\n' +
      '<link rel="preconnect" href="https://fonts.googleapis.com">\n' +
      '<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>\n' +
      '<link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Manrope:wght@500;600;700;800&display=swap" rel="stylesheet">\n' +
      '<link rel="stylesheet" href="' + base + 'assets/css/style.css">\n' +
      '<link rel="stylesheet" href="' + base + 'assets/css/pages.css">\n' +
      (preview ? '<style>.reveal{opacity:1!important;transform:none!important}a{pointer-events:none}</style>\n' : '') +
      '</head>\n\n<body class="project-page gx-page">\n' +
      '<header class="site-header">\n' +
      '  <a class="brand" href="' + base + 'index.html"><span class="brand-mark"><img src="' + base + 'images/GPJ%20neg.png" alt="" width="64" height="64"></span>' +
      '<span class="brand-name">GIANLUCA PAGLIONICO</span></a>\n' +
      '  <nav class="nav" aria-label="Navigazione principale">\n' +
      '    <a href="' + base + 'index.html#work">Portfolio</a>\n' +
      '    <a href="' + base + 'index.html#about">Chi sono</a>\n' +
      '    <a href="' + base + 'index.html#contact">Contatti</a>\n  </nav>\n' +
      '  <a class="header-contact" href="' + base + 'index.html#contact">Parliamone</a>\n' +
      '  <button class="menu-btn" type="button" aria-label="Apri il menu" aria-expanded="false">☰</button>\n' +
      '</header>\n\n<main>\n' +
      '  <section class="page-hero">\n' +
      (cover ? '    <img src="' + esc(cover) + '" alt="' + esc(page.coverAlt || page.title) + '" fetchpriority="high" decoding="async">\n' : '') +
      '    <div class="container page-hero-content reveal">\n' +
      '      <div class="eyebrow project-category">' + esc(page.tag) + '</div>\n' +
      '      <h1>' + esc(page.title) + '</h1>\n    </div>\n  </section>\n\n' +
      sections + '\n\n' + nextBlock(page, ctx) + '\n</main>\n\n' +
      '<footer>\n  <strong>GPJ.VISUALS </strong>\n  <a href="' + base + 'index.html#work">Tutti i progetti</a>\n  <a href="#">Top ↑</a>\n</footer>\n\n' +
      '<div class="lightbox" aria-hidden="true" role="dialog" aria-modal="true" aria-label="Anteprima immagine">\n' +
      '  <button class="lightbox-close" type="button" aria-label="Chiudi">×</button>\n  <img alt="Anteprima">\n</div>\n\n' +
      (preview ? '' : '<script src="' + base + 'assets/js/main.js"></script>\n' + OPENER + '\n') +
      '</body>\n</html>\n';
  }

  /* ---------- anteprima delle sezioni homepage ---------- */

  var PLACEMENTS = {
    intro: 'Dopo l\u2019introduzione',
    work: 'Dopo i Progetti',
    about: 'Dopo Chi sono',
    services: 'Dopo i Servizi',
    reviews: 'Dopo le Recensioni'
  };

  function homePreview(sections, ctx) {
    ctx = ctx || {};
    var o = { base: '', resolve: ctx.resolve };
    o.src = makeSrc(o);
    var body = sections.filter(function (s) { return s.visible !== false; }).map(function (s) {
      var html = section(s, { base: '', src: o.src });
      return html ? '<div class="gx-pv-tag">' + esc(PLACEMENTS[s.placement] || PLACEMENTS.reviews) + '</div>' + html : '';
    }).join('\n');
    return '<!doctype html><html lang="it"><head><meta charset="utf-8">' +
      '<meta name="viewport" content="width=device-width, initial-scale=1">' +
      '<link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Manrope:wght@500;600;700;800&display=swap" rel="stylesheet">' +
      '<link rel="stylesheet" href="assets/css/style.css"><link rel="stylesheet" href="assets/css/pages.css">' +
      '<style>.reveal{opacity:1!important;transform:none!important}a{pointer-events:none}' +
      '.gx-pv-tag{background:#111;color:#fff;font:700 11px/1 Inter,sans-serif;padding:9px 16px}' +
      '.gx-empty{padding:80px 20px;text-align:center;font:500 14px Inter,sans-serif;color:#707070}</style></head>' +
      '<body>' + (body || '<p class="gx-empty">Nessuna sezione da mostrare.</p>') + '</body></html>';
  }

  /* Dove compaiono le raccolte aggiunte a una pagina già presente nel sito */
  var EXTRA_PLACEMENTS = {
    gallery: 'Subito dopo le foto della pagina',
    video: 'Dopo il video della pagina',
    end: 'In fondo, prima di «Progetto successivo»'
  };

  function extrasPreview(sections, ctx) {
    ctx = ctx || {};
    var o = { base: '', resolve: ctx.resolve };
    o.src = makeSrc(o);
    var body = sections.filter(function (s) { return s.visible !== false; }).map(function (s) {
      var html = section(s, { base: '', src: o.src });
      return html ? '<div class="gx-pv-tag">' + esc(EXTRA_PLACEMENTS[s.placement] || EXTRA_PLACEMENTS.gallery) + '</div>' + html : '';
    }).join('\n');
    return '<!doctype html><html lang="it"><head><meta charset="utf-8">' +
      '<meta name="viewport" content="width=device-width, initial-scale=1">' +
      '<link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Manrope:wght@500;600;700;800&display=swap" rel="stylesheet">' +
      '<link rel="stylesheet" href="assets/css/style.css"><link rel="stylesheet" href="assets/css/pages.css">' +
      '<style>.reveal{opacity:1!important;transform:none!important}a{pointer-events:none}' +
      '.gx-pv-tag{background:#111;color:#fff;font:700 11px/1 Inter,sans-serif;padding:9px 16px}' +
      '.gx-pv-head{padding:26px 20px;background:#f5f5f1;font:500 13px/1.5 Inter,sans-serif;color:#707070;border-bottom:1px solid rgba(0,0,0,.08)}' +
      '.gx-pv-head b{color:#111}' +
      '.gx-empty{padding:80px 20px;text-align:center;font:500 14px Inter,sans-serif;color:#707070}</style></head>' +
      '<body>' +
      '<div class="gx-pv-head"><b>' + esc(ctx.title || 'Pagina') + '</b> — qui sopra c\u2019è la pagina già nel sito, com\u2019è. Sotto: le tue raccolte.</div>' +
      (body || '<p class="gx-empty">Ancora nessuna raccolta da mostrare.</p>') + '</body></html>';
  }

  root.GPJRender = {
    esc: esc,
    slugify: slugify,
    makeSrc: makeSrc,
    section: section,
    anchorOf: anchorOf,
    projectCard: projectCard,
    projectPage: projectPage,
    homePreview: homePreview,
    extrasPreview: extrasPreview,
    PLACEMENTS: PLACEMENTS,
    EXTRA_PLACEMENTS: EXTRA_PLACEMENTS
  };

})(typeof window !== 'undefined' ? window : globalThis);
