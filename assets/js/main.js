
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
   e ogni altro form con la stessa struttura che aggiungerai in futuro. */
(function () {
  var forms = document.querySelectorAll("form.contact-form");
  if (!forms.length) return;

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
