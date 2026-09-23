
/* Recensioni "pinnate" in homepage: legge dati/recensioni-generali.js
   (window.GPJ_REVIEWS, scritto a mano o dal pannello admin / dallo
   script Excel) e mostra in #home-reviews-grid solo quelle con
   pinned:true — così Gianluca sceglie da lì quali far vedere in home,
   senza dover più toccare il codice della pagina. */
(function () {
  const grid = document.getElementById("home-reviews-grid");
  if (!grid) return;
  const reviews = (window.GPJ_REVIEWS || []).filter(r => r && r.pinned && r.nome && r.testo);
  if (!reviews.length) return;

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, c => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
    }[c]));
  }

  grid.innerHTML = reviews.map(r => {
    const voto = Math.max(1, Math.min(5, parseInt(r.voto, 10) || 5));
    const stelle = "★".repeat(voto) + "☆".repeat(5 - voto);
    const iniziale = esc(r.nome.trim().slice(0, 1).toUpperCase());
    const avatar = r.avatar
      ? '<img loading="lazy" decoding="async" class="review-avatar" src="' + esc(r.avatar) + '" alt="' + esc(r.nome) + '">'
      : '<div class="review-avatar" aria-hidden="true" style="display:flex;align-items:center;justify-content:center;background:var(--red);color:#fff;font-weight:800;font-size:18px;font-family:Manrope,sans-serif">' + iniziale + "</div>";
    const categoria = esc(r.categoria || r.ruolo || "Recensione generale");
    return (
      '<article class="review-card reveal">' +
        '<div class="review-header">' + avatar +
          '<div class="review-user"><h3>' + esc(r.nome) + "</h3><p>" + esc(r.ruolo || "") + "</p></div>" +
        "</div>" +
        '<div class="review-rating" aria-label="' + voto + ' stelle su 5">' + stelle + "</div>" +
        "<blockquote>“" + esc(r.testo) + "”</blockquote>" +
        '<div class="review-footer"><span>' + categoria + "</span><span>" + esc(r.anno || "") + "</span></div>" +
      "</article>"
    );
  }).join("");
})();

const header = document.querySelector(".site-header");
const menuBtn = document.querySelector(".menu-btn");
const nav = document.querySelector(".nav");

/* Logo adattivo: nessuno sfondo dietro al marchio, sceglie la
   variante bianca o rossa leggendo il colore del testo dell'header
   (che il resto del CSS già imposta correttamente in ogni stato:
   trasparente-su-hero, scrollato, menu mobile aperto...). */
function syncBrandMark(){
  if(!header) return;
  const marks = document.querySelectorAll(".brand-mark img");
  if(!marks.length) return;
  const c = getComputedStyle(header).color;
  const m = c.match(/[\d.]+/g);
  const light = m && ((parseFloat(m[0]) + parseFloat(m[1]) + parseFloat(m[2])) / 3 > 150);
  marks.forEach(img => {
    const current = img.getAttribute("src") || "";
    const prefix = current.startsWith("../") ? "../" : "";
    const file = light ? "gpj-mark.png" : "gpj-mark-red.png";
    const target = prefix + "images/" + file;
    if(current !== target) img.setAttribute("src", target);
  });
}

function headerState(){
  if(header) header.classList.toggle("scrolled", window.scrollY > 35);
  syncBrandMark();
}
window.addEventListener("scroll", headerState);
window.addEventListener("resize", syncBrandMark);
headerState();

if(menuBtn){
  menuBtn.addEventListener("click", () => {
    const open = document.body.classList.toggle("mobile-menu-open");
    document.body.classList.toggle("locked", open);
    menuBtn.setAttribute("aria-expanded", String(open));
    syncBrandMark();
  });

  if(nav){
    nav.querySelectorAll("a").forEach(link => {
      link.addEventListener("click", () => {
        document.body.classList.remove("mobile-menu-open");
        document.body.classList.remove("locked");
        menuBtn.setAttribute("aria-expanded", "false");
        syncBrandMark();
      });
    });
  }

  document.addEventListener("keydown", e => {
    if(e.key === "Escape" && document.body.classList.contains("mobile-menu-open")){
      document.body.classList.remove("mobile-menu-open");
      document.body.classList.remove("locked");
      menuBtn.setAttribute("aria-expanded", "false");
      syncBrandMark();
    }
  });

  /* Toccare fuori dal pannello (sulla tendina scura di sfondo) chiude
     il menu, come ci si aspetta da un overlay mobile. */
  document.addEventListener("click", e => {
    if(!document.body.classList.contains("mobile-menu-open")) return;
    if(nav && nav.contains(e.target)) return;
    if(menuBtn.contains(e.target)) return;
    document.body.classList.remove("mobile-menu-open");
    document.body.classList.remove("locked");
    menuBtn.setAttribute("aria-expanded", "false");
    syncBrandMark();
  });
}

const filters = document.querySelectorAll(".filter");
const projects = document.querySelectorAll(".project");

filters.forEach(btn => {
  btn.addEventListener("click", () => {
    filters.forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    const selected = btn.dataset.filter;
    projects.forEach(card => {
      const show = selected === "all" || card.dataset.category === selected;
      card.classList.toggle("hidden", !show);
    });
  });
});

const observer = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if(entry.isIntersecting){
      entry.target.classList.add("visible");
      observer.unobserve(entry.target);
    }
  });
},{threshold:.1});
document.querySelectorAll(".reveal").forEach(el => observer.observe(el));

const lightbox = document.querySelector(".lightbox");
if(lightbox){
  const lightboxImg = lightbox.querySelector("img");
  const close = lightbox.querySelector(".lightbox-close");

  document.querySelectorAll(".gallery-item").forEach(item => {
    item.addEventListener("click", () => {
      const img = item.querySelector("img");
      lightboxImg.src = img.src;
      lightbox.classList.add("active");
      document.body.classList.add("locked");
    });
  });

  function closeLightbox(){
    lightbox.classList.remove("active");
    document.body.classList.remove("locked");
  }
  close.addEventListener("click", closeLightbox);
  lightbox.addEventListener("click", e => {if(e.target === lightbox) closeLightbox();});
  document.addEventListener("keydown", e => {if(e.key==="Escape") closeLightbox();});
}


/* Responsive state reset */
function resetResponsiveNavigation(){
  if(window.innerWidth > 1050){
    document.body.classList.remove("mobile-menu-open");
    if(!document.querySelector(".lightbox.active")){
      document.body.classList.remove("locked");
    }
    if(menuBtn){
      menuBtn.setAttribute("aria-expanded","false");
    }
    if(nav){
      nav.removeAttribute("style");
    }
  }
}

window.addEventListener("resize", resetResponsiveNavigation);
window.addEventListener("orientationchange", resetResponsiveNavigation);
resetResponsiveNavigation();


/* Mobile compact navigation polish */
window.addEventListener("resize", () => {
  if(window.innerWidth > 760){
    document.body.classList.remove("mobile-menu-open");
    if(!document.querySelector(".lightbox.active")){
      document.body.classList.remove("locked");
    }
    if(menuBtn) menuBtn.setAttribute("aria-expanded","false");
  }
});


/* Form contatti e recensioni — invio via Web3Forms, senza ricaricare la
   pagina. Richiede una access key gratuita da https://web3forms.com nel
   campo nascosto "access_key" di ogni form (vedi index.html/recensioni.html).
   Funziona su qualunque <form class="contact-form">: contatti, recensioni,
   e ogni altro form con la stessa struttura che aggiungerai in futuro.

   Il form delle recensioni (id="review-form") manda in più una copia dei
   dati anche a un Google Sheet, tramite un piccolo script Google Apps
   Script pubblicato come "app web" — vedi GUIDA-ADMIN.txt, punto 12, per
   come crearlo. Finché SHEET_WEBHOOK_URL resta vuoto questo invio in più
   è semplicemente saltato, e tutto continua a funzionare come prima
   (la recensione arriva comunque via email da Web3Forms). */
(function () {
  var SHEET_WEBHOOK_URL = "https://script.google.com/macros/s/AKfycbxK6Ode2TxFAQSHvtBhFnwcYrdT8OjlKL6kqGKgvTfmpwoovqhA_Qw02N7TpmIO2F1K/exec";

  var forms = document.querySelectorAll("form.contact-form");
  if (!forms.length) return;

  function inviaAGoogleSheet(form) {
    if (!SHEET_WEBHOOK_URL) return;
    try {
      var dati = Object.fromEntries(new FormData(form));
      // mode:"no-cors" evita il pre-flight CORS che Apps Script non
      // gestisce: non possiamo leggere la risposta, ma va bene così,
      // è un invio "in aggiunta", non è quello che decide se il form
      // ha funzionato (quello lo dice sempre Web3Forms, sopra).
      fetch(SHEET_WEBHOOK_URL, {
        method: "POST",
        mode: "no-cors",
        body: JSON.stringify(dati),
      }).catch(function () {});
    } catch (e) {}
  }

  forms.forEach(function (form) {
    var stato = form.querySelector(".contact-form-status");
    var bottone = form.querySelector("button[type='submit']");

    form.addEventListener("submit", function (evento) {
      evento.preventDefault();

      var accessKey = form.access_key.value.trim();
      if (!accessKey || accessKey === "INSERISCI_QUI_LA_TUA_ACCESS_KEY") {
        stato.textContent = "Form non ancora configurato: manca la access key di Web3Forms.";
        stato.setAttribute("data-state", "errore");
        return;
      }

      // Il form usa novalidate (per non mostrare i bordi rossi di default
      // del browser prima ancora che l'utente scriva); controlliamo quindi
      // a mano i campi obbligatori prima di inviare, cosi' un invio vuoto
      // o incompleto non parte comunque verso Web3Forms.
      if (!form.checkValidity()) {
        form.reportValidity();
        return;
      }

      bottone.disabled = true;
      stato.removeAttribute("data-state");
      stato.textContent = "Invio in corso...";

      if (form.id === "review-form") inviaAGoogleSheet(form);

      fetch("https://api.web3forms.com/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(Object.fromEntries(new FormData(form))),
      })
        .then(function (risposta) { return risposta.json(); })
        .then(function (dati) {
          if (dati.success) {
            stato.textContent = "Inviato, grazie! Ti rispondo appena posso.";
            stato.setAttribute("data-state", "ok");
            form.reset();
          } else {
            stato.textContent = "Non sono riuscito a inviare. Riprova, o scrivimi via email.";
            stato.setAttribute("data-state", "errore");
          }
        })
        .catch(function () {
          stato.textContent = "Connessione assente. Riprova, o scrivimi via email.";
          stato.setAttribute("data-state", "errore");
        })
        .finally(function () {
          bottone.disabled = false;
        });
    });
  });
})();


/* Numeri animati (pagina numeri.html): le cifre partono da 0 e salgono
   fino al valore reale quando la statistica entra nello schermo. Legge
   il numero direttamente dal testo già scritto nell'HTML (nessun dato
   duplicato altrove): capisce il segno "+", i punti delle migliaia,
   la virgola dei decimali e un'eventuale parola dopo il numero
   ("mln", "follower"...). Se l'utente preferisce meno animazioni,
   il numero compare direttamente, senza contare. */
(function () {
  var targets = document.querySelectorAll(".stat strong, .bar-row strong, .followers-big, .fitem strong, .growth");
  if (!targets.length) return;
  var reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function parseNumero(testo) {
    var m = testo.trim().match(/^(\+)?([\d.,]+)(.*)$/);
    if (!m) return null;
    var segno = m[1] || "";
    var cifre = m[2];
    var seguito = m[3] || "";
    var decimali = 0;
    var normalizzato = cifre;
    if (cifre.indexOf(",") > -1) {
      var parti = cifre.split(",");
      decimali = parti[parti.length - 1].length;
      normalizzato = parti.join("").replace(/\./g, "");
      normalizzato = normalizzato.slice(0, normalizzato.length - decimali) + "." + normalizzato.slice(normalizzato.length - decimali);
    } else {
      normalizzato = cifre.replace(/\./g, "");
    }
    var valore = parseFloat(normalizzato);
    if (isNaN(valore)) return null;
    return { segno: segno, valore: valore, decimali: decimali, seguito: seguito };
  }

  function formatta(v, decimali, segno, seguito) {
    var testo = v.toLocaleString("it-IT", { minimumFractionDigits: decimali, maximumFractionDigits: decimali });
    return segno + testo + seguito;
  }

  function animaContatore(el) {
    var dati = parseNumero(el.textContent);
    if (!dati) return;
    if (reduceMotion) return;
    var finale = el.textContent;
    var durata = 1400, inizio = null;
    el.textContent = formatta(0, dati.decimali, dati.segno, dati.seguito);
    function frame(t) {
      if (inizio === null) inizio = t;
      var p = Math.min(1, (t - inizio) / durata);
      var eased = 1 - Math.pow(1 - p, 3);
      el.textContent = formatta(dati.valore * eased, dati.decimali, dati.segno, dati.seguito);
      if (p < 1) requestAnimationFrame(frame);
      else el.textContent = finale;
    }
    requestAnimationFrame(frame);
  }

  var numObserver = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        animaContatore(entry.target);
        numObserver.unobserve(entry.target);
      }
    });
  }, { threshold: .4 });
  targets.forEach(function (el) { numObserver.observe(el); });
})();


/* Filigrana: un piccolo marchio semi-trasparente in basso a destra
   sulle foto principali (hero, gallerie di progetto), per riconoscere
   a colpo d'occhio le immagini se vengono condivise o screenshottate
   fuori dal sito. Aggiunta via JS così non tocca il markup di ogni
   pagina: uno stesso stile, ovunque, aggiornabile da un punto solo. */
(function () {
  var contenitori = document.querySelectorAll(".hero, .page-hero, .gallery-item");
  if (!contenitori.length) return;
  var primoMark = document.querySelector(".brand-mark img");
  if (!primoMark) return;
  var src = primoMark.getAttribute("src") || "";
  var prefix = src.startsWith("../") ? "../" : "";
  contenitori.forEach(function (el) {
    if (el.querySelector(".site-watermark")) return;
    var span = document.createElement("span");
    span.className = "site-watermark";
    span.setAttribute("aria-hidden", "true");
    span.style.backgroundImage = "url('" + prefix + "images/gpj-mark.png')";
    el.appendChild(span);
  });
})();

/* Pulsante WhatsApp fisso, su tutte le pagine. Numero e messaggio
   in un punto solo: per cambiarli basta modificare qui. */
(function () {
  if (document.querySelector(".wa-float")) return;
  var NUMERO = "393913896386";
  var MESSAGGIO = "Ciao Gianluca, ho visto il tuo portfolio e vorrei parlare di un progetto.";
  var link = document.createElement("a");
  link.className = "wa-float";
  link.href = "https://wa.me/" + NUMERO + "?text=" + encodeURIComponent(MESSAGGIO);
  link.target = "_blank";
  link.rel = "noopener";
  link.setAttribute("aria-label", "Scrivimi su WhatsApp");
  link.innerHTML =
    '<span class="wa-float-label">Scrivimi su WhatsApp</span>' +
    '<svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">' +
    '<path fill="#fff" d="M16.02 3C9.4 3 4.02 8.38 4.02 15c0 2.24.62 4.34 1.7 6.14L4 29l8.06-1.66A11.9 11.9 0 0 0 16.02 27C22.64 27 28 21.62 28 15S22.64 3 16.02 3Zm0 21.8c-1.9 0-3.68-.52-5.2-1.44l-.37-.22-4.44.92.94-4.32-.24-.38A9.7 9.7 0 0 1 5.22 15c0-5.96 4.86-10.8 10.8-10.8 5.94 0 10.78 4.84 10.78 10.8 0 5.96-4.84 10.8-10.78 10.8Zm5.9-8.1c-.32-.16-1.9-.94-2.2-1.04-.3-.11-.5-.16-.72.16-.2.32-.83 1.04-1.02 1.25-.19.22-.37.24-.69.08-.32-.16-1.34-.5-2.55-1.58-.94-.84-1.58-1.87-1.76-2.19-.19-.32-.02-.49.14-.65.14-.14.32-.37.48-.55.16-.19.21-.32.32-.53.11-.22.05-.4-.03-.56-.08-.16-.72-1.75-.99-2.4-.26-.62-.53-.54-.72-.55h-.62c-.21 0-.56.08-.85.4-.29.32-1.12 1.1-1.12 2.67 0 1.57 1.15 3.09 1.31 3.3.16.22 2.26 3.5 5.49 4.9.77.33 1.36.53 1.83.68.77.25 1.47.21 2.02.13.62-.09 1.9-.78 2.16-1.53.27-.75.27-1.4.19-1.53-.08-.14-.29-.22-.61-.38Z"/>' +
    "</svg>";
  document.body.appendChild(link);
})();

/* Barra di avanzamento lettura: una linea sottile in cima alla pagina
   che si riempie mentre si scorre, su tutte le pagine. Aggiornata con
   requestAnimationFrame per restare fluida anche su pagine lunghe. */
(function () {
  if (document.querySelector(".scroll-progress")) return;
  var bar = document.createElement("div");
  bar.className = "scroll-progress";
  bar.setAttribute("aria-hidden", "true");
  document.body.appendChild(bar);

  var ticking = false;
  function update() {
    ticking = false;
    var doc = document.documentElement;
    var max = doc.scrollHeight - doc.clientHeight;
    var pct = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
    bar.style.transform = "scaleX(" + pct + ")";
  }
  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(update);
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll);
  update();
})();

/* Freccia "scorri" animata: solo nella hero della homepage e nelle
   page-hero delle pagine interne, sparisce appena si comincia a
   scorrere. Un clic scende di un viewport. */
(function () {
  var hero = document.querySelector(".hero, .page-hero");
  if (!hero) return;
  var hint = document.createElement("button");
  hint.type = "button";
  hint.className = "scroll-hint";
  hint.setAttribute("aria-label", "Scorri per vedere altro");
  hint.innerHTML =
    '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">' +
    '<path d="M12 4v15M12 19l-6-6M12 19l6-6" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>' +
    "</svg>";
  hint.addEventListener("click", function () {
    window.scrollTo({ top: window.innerHeight * 0.92, behavior: "smooth" });
  });
  hero.appendChild(hint);

  function syncVisibility() {
    hint.classList.toggle("is-hidden", window.scrollY > 80);
  }
  window.addEventListener("scroll", syncVisibility, { passive: true });
  syncVisibility();
})();
