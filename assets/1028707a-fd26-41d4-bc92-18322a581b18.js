/* ================================================================
   LÚMINA FESTAS — Interaction script
   ================================================================ */

/* ---------- Nav: shrink on scroll ---------- */
const nav = document.querySelector('.nav');
window.addEventListener('scroll', () => {
  nav.classList.toggle('scrolled', window.scrollY > 40);
}, { passive: true });

/* ---------- Cursor glow ---------- */
const glow = document.createElement('div');
glow.className = 'cursor-glow';
document.body.appendChild(glow);
let gx = 0, gy = 0, tx = 0, ty = 0;
window.addEventListener('pointermove', (e) => {
  tx = e.clientX; ty = e.clientY;
});
function rafGlow(){
  gx += (tx - gx) * 0.12;
  gy += (ty - gy) * 0.12;
  glow.style.transform = `translate(${gx}px, ${gy}px) translate(-50%, -50%)`;
  requestAnimationFrame(rafGlow);
}
rafGlow();

/* ---------- Scroll-triggered reveals ---------- */
const io = new IntersectionObserver((entries) => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      e.target.classList.add('in');
      io.unobserve(e.target);
    }
  });
}, { threshold: 0.12, rootMargin: '0px 0px -10% 0px' });
document.querySelectorAll('.reveal').forEach(el => io.observe(el));

/* ---------- Parallax on hero orbs ---------- */
const hero = document.querySelector('.hero');
const heroVisual = document.querySelector('.hero__visual');
if (heroVisual) {
  hero.addEventListener('pointermove', (e) => {
    const rect = hero.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    heroVisual.querySelectorAll('[data-depth]').forEach(el => {
      const d = parseFloat(el.dataset.depth);
      el.style.transform = `translate(${x * d * -30}px, ${y * d * -30}px)`;
    });
  });
  hero.addEventListener('pointerleave', () => {
    heroVisual.querySelectorAll('[data-depth]').forEach(el => el.style.transform = '');
  });
}

/* ---------- Light particles canvas (hero) ---------- */
function initParticles(){
  const canvas = document.getElementById('particles');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let w, h, particles;
  const COLORS = ['#fff7ff', '#c89dff', '#ff4ea8', '#f5d99a'];

  function resize(){
    w = canvas.width = canvas.offsetWidth * devicePixelRatio;
    h = canvas.height = canvas.offsetHeight * devicePixelRatio;
  }
  function spawn(){
    particles = Array.from({length: 60}, () => ({
      x: Math.random() * w,
      y: Math.random() * h,
      r: (Math.random() * 1.6 + .4) * devicePixelRatio,
      vx: (Math.random() - .5) * .3 * devicePixelRatio,
      vy: (Math.random() - .5) * .3 * devicePixelRatio,
      c: COLORS[(Math.random() * COLORS.length) | 0],
      a: Math.random() * .6 + .2,
      tw: Math.random() * Math.PI * 2,
    }));
  }
  function draw(t){
    ctx.clearRect(0,0,w,h);
    particles.forEach(p => {
      p.x += p.vx; p.y += p.vy;
      if (p.x < 0) p.x = w; if (p.x > w) p.x = 0;
      if (p.y < 0) p.y = h; if (p.y > h) p.y = 0;
      const tw = Math.sin(t * 0.001 + p.tw) * .3 + .7;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = p.c;
      ctx.globalAlpha = p.a * tw;
      ctx.shadowColor = p.c;
      ctx.shadowBlur = 12;
      ctx.fill();
    });
    ctx.globalAlpha = 1;
    requestAnimationFrame(draw);
  }
  resize(); spawn();
  window.addEventListener('resize', () => { resize(); spawn(); });
  requestAnimationFrame(draw);
}
initParticles();

/* ---------- Before/after split slider ---------- */
(function initSplit(){
  const split = document.querySelector('.split');
  if (!split) return;
  const after = split.querySelector('.split__pane--after');
  const divider = split.querySelector('.split__divider');
  const handle = split.querySelector('.split__handle');
  let dragging = false;

  function setPos(x){
    const rect = split.getBoundingClientRect();
    let pct = ((x - rect.left) / rect.width) * 100;
    pct = Math.max(2, Math.min(98, pct));
    after.style.clipPath = `inset(0 0 0 ${pct}%)`;
    divider.style.left = pct + '%';
    handle.style.left = pct + '%';
  }

  // Auto-animate on first reveal
  let revealed = false;
  const ro = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting && !revealed){
        revealed = true;
        const rect = split.getBoundingClientRect();
        let i = 0;
        const seq = [50, 35, 65, 50];
        function step(){
          if (i >= seq.length) return;
          const targetX = rect.left + (rect.width * seq[i] / 100);
          animateTo(targetX, 900, () => { i++; setTimeout(step, 250); });
        }
        let raf;
        function animateTo(target, dur, done){
          const startRect = split.getBoundingClientRect();
          const start = parseFloat(divider.style.left || '50') / 100 * startRect.width + startRect.left;
          const t0 = performance.now();
          function tick(t){
            const p = Math.min(1, (t - t0) / dur);
            const eased = 1 - Math.pow(1 - p, 3);
            setPos(start + (target - start) * eased);
            if (p < 1) raf = requestAnimationFrame(tick);
            else done && done();
          }
          raf = requestAnimationFrame(tick);
        }
        step();
      }
    });
  }, { threshold: 0.3 });
  ro.observe(split);

  split.addEventListener('pointerdown', (e) => {
    dragging = true; setPos(e.clientX);
    split.setPointerCapture(e.pointerId);
  });
  split.addEventListener('pointermove', (e) => {
    if (dragging) setPos(e.clientX);
  });
  split.addEventListener('pointerup', () => dragging = false);
  split.addEventListener('pointercancel', () => dragging = false);
})();

/* ---------- Smooth-scroll to anchors ---------- */
document.querySelectorAll('a[href^="#"]').forEach(a => {
  a.addEventListener('click', (e) => {
    const id = a.getAttribute('href');
    if (id.length > 1) {
      const target = document.querySelector(id);
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  });
});

/* ---------- Tile staggered reveal ---------- */
document.querySelectorAll('.tile').forEach((tile, i) => {
  tile.style.transitionDelay = (i * 80) + 'ms';
});

/* ---------- Year ---------- */
const yearEl = document.getElementById('year');
if (yearEl) yearEl.textContent = new Date().getFullYear();
