
/* Header: stato "scrolled" + colore adattivo allo sfondo sotto di esso */
const header = document.querySelector(".site-header");
const menuBtn = document.querySelector(".menu-btn");
const nav = document.querySelector(".nav");

const toneCache = new WeakMap();

function parseColor(str){
  const m = String(str || "").match(/rgba?\(([^)]+)\)/);
  if(!m) return null;
  const p = m[1].split(/[\s,\/]+/).filter(Boolean).map(parseFloat);
  return { r:p[0], g:p[1], b:p[2], a:p.length > 3 && !isNaN(p[3]) ? p[3] : 1 };
}

function toneOf(block){
  if(block.dataset && block.dataset.tone) return block.dataset.tone;
  if(toneCache.has(block)) return toneCache.get(block);

  let el = block, c = null;
  while(el && el.nodeType === 1){
    const col = parseColor(getComputedStyle(el).backgroundColor);
    if(col && col.a > 0.6){ c = col; break; }
    el = el.parentElement;
  }

  let tone = "light";
  if(c){
    if(c.r > 170 && c.g < 90 && c.b < 90){
      tone = "red";
    }else{
      const lum = (0.2126 * c.r + 0.7152 * c.g + 0.0722 * c.b) / 255;
      tone = lum < 0.45 ? "dark" : "light";
    }
  }
  toneCache.set(block, tone);
  return tone;
}

function toneUnderHeader(){
  const x = Math.round(window.innerWidth / 2);
  const y = Math.round(header.offsetHeight / 2);
  const stack = document.elementsFromPoint ? document.elementsFromPoint(x, y) : [];

  for(const el of stack){
    if(header.contains(el) || el === document.documentElement || el === document.body) continue;
    const block = el.closest("section, footer") || el;
    return toneOf(block);
  }
  return "light";
}

let headerTick = false;

function headerState(){
  if(!header) return;
  const scrolled = window.scrollY > 35;
  header.classList.toggle("scrolled", scrolled);

  if(!scrolled){
    header.removeAttribute("data-tone");
    return;
  }
  header.setAttribute("data-tone", toneUnderHeader());
}

function requestHeaderState(){
  if(headerTick) return;
  headerTick = true;
  requestAnimationFrame(() => {
    headerTick = false;
    headerState();
  });
}

window.addEventListener("scroll", requestHeaderState, { passive:true });
window.addEventListener("resize", requestHeaderState);
window.addEventListener("load", headerState);
headerState();

if(menuBtn){
  menuBtn.addEventListener("click", () => {
    const open = document.body.classList.toggle("mobile-menu-open");
    document.body.classList.toggle("locked", open);
    menuBtn.setAttribute("aria-expanded", String(open));
  });

  if(nav){
    nav.querySelectorAll("a").forEach(link => {
      link.addEventListener("click", () => {
        document.body.classList.remove("mobile-menu-open");
        document.body.classList.remove("locked");
        menuBtn.setAttribute("aria-expanded", "false");
      });
    });
  }

  document.addEventListener("keydown", e => {
    if(e.key === "Escape" && document.body.classList.contains("mobile-menu-open")){
      document.body.classList.remove("mobile-menu-open");
      document.body.classList.remove("locked");
      menuBtn.setAttribute("aria-expanded", "false");
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
