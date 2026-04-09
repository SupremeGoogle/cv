// ═══════════════════════════════════════
//  PORTFOLIO ANIMATIONS & INTERACTIONS
// ═══════════════════════════════════════

gsap.registerPlugin(ScrollTrigger);

// ── Particles Background ──
(function initParticles() {
  const canvas = document.getElementById('particles-canvas');
  const ctx = canvas.getContext('2d');
  let particles = [];
  let mouse = { x: 0, y: 0 };

  function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  resize();
  window.addEventListener('resize', resize);
  document.addEventListener('mousemove', e => { mouse.x = e.clientX; mouse.y = e.clientY; });

  class Particle {
    constructor() {
      this.reset();
    }
    reset() {
      this.x = Math.random() * canvas.width;
      this.y = Math.random() * canvas.height;
      this.size = Math.random() * 2 + 0.5;
      this.speedX = (Math.random() - 0.5) * 0.3;
      this.speedY = (Math.random() - 0.5) * 0.3;
      this.opacity = Math.random() * 0.5 + 0.1;
      this.color = ['#34D399', '#38BDF8', '#818CF8', '#6EE7B7'][Math.floor(Math.random() * 4)];
    }
    update() {
      this.x += this.speedX;
      this.y += this.speedY;
      // Mouse repulsion
      const dx = this.x - mouse.x;
      const dy = this.y - mouse.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 120) {
        const force = (120 - dist) / 120 * 0.5;
        this.x += dx / dist * force;
        this.y += dy / dist * force;
      }
      if (this.x < 0 || this.x > canvas.width || this.y < 0 || this.y > canvas.height) this.reset();
    }
    draw() {
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
      ctx.fillStyle = this.color;
      ctx.globalAlpha = this.opacity;
      ctx.fill();
      ctx.globalAlpha = 1;
    }
  }

  for (let i = 0; i < 80; i++) particles.push(new Particle());

  function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    particles.forEach(p => { p.update(); p.draw(); });
    // Draw connections
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const dx = particles[i].x - particles[j].x;
        const dy = particles[i].y - particles[j].y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 150) {
          ctx.beginPath();
          ctx.moveTo(particles[i].x, particles[i].y);
          ctx.lineTo(particles[j].x, particles[j].y);
          ctx.strokeStyle = 'rgba(52, 211, 153, ' + (0.06 * (1 - dist / 150)) + ')';
          ctx.lineWidth = 0.5;
          ctx.stroke();
        }
      }
    }
    requestAnimationFrame(animate);
  }
  animate();
})();

// ── Progress Bar ──
const bar = document.getElementById('progress-bar');
window.addEventListener('scroll', () => {
  const pct = window.scrollY / (document.body.scrollHeight - window.innerHeight) * 100;
  bar.style.width = pct + '%';
});

// ── Smooth scroll for nav ──
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', e => {
    e.preventDefault();
    const target = document.querySelector(anchor.getAttribute('href'));
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      // Close mobile menu
      document.querySelector('.nav-links')?.classList.remove('active');
    }
  });
});

// ── Hamburger ──
document.querySelector('.hamburger')?.addEventListener('click', () => {
  document.querySelector('.nav-links').classList.toggle('active');
});

// ── Active nav link ──
const sections = document.querySelectorAll('section[id]');
window.addEventListener('scroll', () => {
  let current = '';
  sections.forEach(s => {
    if (window.scrollY >= s.offsetTop - 200) current = s.id;
  });
  document.querySelectorAll('.nav-links a').forEach(a => {
    a.classList.remove('active');
    if (a.getAttribute('href') === '#' + current) a.classList.add('active');
  });
});

// ── GSAP Scroll Animations ──

// ── Scramble Effect Class (Left-to-Right Reveal) ──
class ScrambleText {
  constructor(el) {
    this.el = el;
    this.chars = 'ABCDEFGHJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()';
    this.update = this.update.bind(this);
  }

  setText(newText) {
    this.targetText = newText;
    this.oldText = this.el.innerText;
    this.iteration = 0;
    
    const promise = new Promise((resolve) => (this.resolve = resolve));
    cancelAnimationFrame(this.frameRequest);
    this.update();
    return promise;
  }

  update() {
    let output = '';
    let isComplete = true;

    for (let i = 0; i < this.targetText.length; i++) {
      if (i < this.iteration) {
        // Character is locked
        output += this.targetText[i];
      } else {
        // Character is still scrambling
        output += `<span class="scramble-char-active">${this.chars[Math.floor(Math.random() * this.chars.length)]}</span>`;
        isComplete = false;
      }
    }

    this.el.innerHTML = output;

    if (this.iteration < this.targetText.length) {
      // Control reveal speed here (0.08 means it's about 3x slower than before)
      this.iteration += 0.08; 
      this.frameRequest = requestAnimationFrame(this.update);
    } else {
      this.el.innerText = this.targetText; // Final clean up
      this.resolve();
    }
  }
}

// Hero entrance
const heroTL = gsap.timeline({ delay: 0.3 });
heroTL
  .from('.terminal-window', { 
    opacity: 0, 
    y: 30, 
    scale: 0.98,
    duration: 1, 
    ease: 'power3.out' 
  })
  .add(() => {
    document.querySelectorAll('.hero-name .scramble-text').forEach(el => {
      const fx = new ScrambleText(el);
      fx.setText(el.dataset.value);
    });
  }, '-=0.2')
  .from('.hero-title', { opacity: 0, x: -30, duration: 0.6 }, '-=0.4')
  .from('.hero-desc', { opacity: 0, y: 20, duration: 0.6 }, '-=0.3')
  .from('.hero-btns', { opacity: 0, y: 20, duration: 0.5 }, '-=0.2')
  .from('.hero-socials a', { opacity: 0, y: 15, stagger: 0.1, duration: 0.4 }, '-=0.2')
  .from('.hero-avatar-wrapper', { opacity: 0, scale: 0.8, duration: 0.8, ease: 'back.out(1.5)' }, '-=0.8')
  .from('.floating-icon', { opacity: 0, scale: 0, stagger: 0.1, duration: 0.4, ease: 'back.out(2)' }, '-=0.4')
  .from('.scroll-indicator', { opacity: 0, y: -20, duration: 0.5 }, '-=0.2');

// Scramble for section titles on scroll
gsap.utils.toArray('.section-title').forEach(title => {
  const originalText = title.textContent;
  const fx = new ScrambleText(title);
  let triggered = false;

  ScrollTrigger.create({
    trigger: title,
    start: 'top 85%',
    onEnter: () => {
      if (!triggered) {
        triggered = true;
        title.style.opacity = 1;
        title.style.transform = 'none';
        fx.setText(originalText);
      }
    }
  });
});

// Section labels & titles
gsap.utils.toArray('.section-label').forEach(el => {
  gsap.to(el, {
    opacity: 1, y: 0, duration: 0.6,
    scrollTrigger: { trigger: el, start: 'top 85%' }
  });
});
gsap.utils.toArray('.section-title').forEach(el => {
  gsap.to(el, {
    opacity: 1, y: 0, duration: 0.8, ease: 'power3.out',
    scrollTrigger: { trigger: el, start: 'top 85%' }
  });
});

// About cards
gsap.utils.toArray('.about-card').forEach((el, i) => {
  gsap.from(el, {
    opacity: 0, y: 30, duration: 0.6, delay: i * 0.1,
    scrollTrigger: { trigger: el, start: 'top 85%' }
  });
});

// Stats counter
let countersDone = false;
ScrollTrigger.create({
  trigger: '.stats-row',
  start: 'top 80%',
  onEnter: () => {
    if (countersDone) return;
    countersDone = true;
    document.querySelectorAll('.stat-item').forEach((el, i) => {
      gsap.to(el, { opacity: 1, y: 0, duration: 0.5, delay: i * 0.1 });
    });
    document.querySelectorAll('.count-up').forEach(el => {
      const target = +el.dataset.target;
      const suffix = el.dataset.suffix || '';
      gsap.to({ val: 0 }, {
        val: target, duration: 1.8, ease: 'power2.out',
        onUpdate: function() {
          el.textContent = Math.round(this.targets()[0].val) + suffix;
        }
      });
    });
  }
});

// Experience cards
gsap.utils.toArray('.exp-card').forEach(el => {
  gsap.to(el, {
    opacity: 1, x: 0, duration: 0.7, ease: 'power3.out',
    scrollTrigger: { trigger: el, start: 'top 85%' }
  });
});

// Bento cards
gsap.utils.toArray('.bento-card').forEach((el, i) => {
  gsap.to(el, {
    opacity: 1, y: 0, duration: 0.7, delay: i * 0.12,
    scrollTrigger: { trigger: el, start: 'top 85%' }
  });
});

// Skills subtitle
gsap.utils.toArray('.skills-subtitle').forEach(el => {
  gsap.to(el, {
    opacity: 1, y: 0, duration: 0.6,
    scrollTrigger: { trigger: el, start: 'top 85%' }
  });
});

// Projects Horizontal Scroll
const projectsTrack = document.querySelector('.projects-track');
if (projectsTrack && window.innerWidth > 968) {
  let scrollTimeline = gsap.to(projectsTrack, {
    x: () => -(projectsTrack.scrollWidth - window.innerWidth),
    ease: "none",
    scrollTrigger: {
      trigger: ".projects",
      pin: true,
      scrub: 0.5,
      end: () => "+=" + (projectsTrack.scrollWidth - window.innerWidth) * 0.7
    }
  });

  // Ghost text parallax within horizontal scroll
  gsap.utils.toArray('.project-slide').forEach((el) => {
    const ghost = el.querySelector('.project-ghost');
    if (ghost) {
      gsap.to(ghost, {
        x: 150, 
        ease: 'none',
        scrollTrigger: { 
          trigger: el, 
          containerAnimation: scrollTimeline,
          start: 'left right', 
          end: 'right left', 
          scrub: 0.5 
        }
      });
    }
  });
} else {
  // Mobile fallback (vertical list)
  gsap.utils.toArray('.project-slide').forEach((el, i) => {
    gsap.from(el, {
      opacity: 0, y: 30, duration: 0.6,
      scrollTrigger: { trigger: el, start: 'top 85%' }
    });
  });
}

// Education
gsap.utils.toArray('.edu-card').forEach(el => {
  gsap.to(el, {
    opacity: 1, y: 0, duration: 0.7,
    scrollTrigger: { trigger: el, start: 'top 85%' }
  });
});
gsap.utils.toArray('.cert-item').forEach((el, i) => {
  gsap.to(el, {
    opacity: 1, y: 0, duration: 0.5, delay: i * 0.08,
    scrollTrigger: { trigger: el, start: 'top 90%' }
  });
});

// Contact
ScrollTrigger.create({
  trigger: '.contact-box',
  start: 'top 80%',
  onEnter: () => {
    gsap.to('.contact-box', { opacity: 1, y: 0, duration: 0.8, ease: 'power3.out' });
  }
});

// ── Custom Cursor ──
(function initCursor() {
  if (window.innerWidth < 968) return;
  const ring = document.querySelector('.cursor-ring');
  const dot = document.querySelector('.cursor-dot');
  if (!ring || !dot) return;

  let mx = 0, my = 0, cx = 0, cy = 0;
  document.addEventListener('mousemove', e => { mx = e.clientX; my = e.clientY; });

  (function anim() {
    cx += (mx - cx) * 0.12;
    cy += (my - cy) * 0.12;
    ring.style.left = (cx - 16) + 'px';
    ring.style.top = (cy - 16) + 'px';
    dot.style.left = mx + 'px';
    dot.style.top = my + 'px';
    requestAnimationFrame(anim);
  })();

  document.querySelectorAll('a, button, .btn-primary, .btn-outline, .skill-tag, .nav-cta').forEach(el => {
    el.addEventListener('mouseenter', () => { ring.style.transform = 'scale(2)'; ring.style.borderColor = 'rgba(52,211,153,0.7)'; });
    el.addEventListener('mouseleave', () => { ring.style.transform = 'scale(1)'; ring.style.borderColor = 'rgba(52,211,153,0.4)'; });
  });
})();

// ── Card Tilt ──
document.querySelectorAll('.bento-card, .stat-item, .about-card, .project-browser').forEach(card => {
  card.addEventListener('mousemove', e => {
    const r = card.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width - 0.5;
    const y = (e.clientY - r.top) / r.height - 0.5;
    gsap.to(card, { rotateX: -y * 6, rotateY: x * 6, duration: 0.3, transformPerspective: 800 });
  });
  card.addEventListener('mouseleave', () => gsap.to(card, { rotateX: 0, rotateY: 0, duration: 0.5 }));
});

// ── Magnetic Buttons ──
document.querySelectorAll('.btn-primary, .btn-outline, .nav-cta').forEach(btn => {
  btn.addEventListener('mousemove', e => {
    const r = btn.getBoundingClientRect();
    gsap.to(btn, { x: (e.clientX - r.left - r.width / 2) * 0.15, y: (e.clientY - r.top - r.height / 2) * 0.15, duration: 0.3 });
  });
  btn.addEventListener('mouseleave', () => gsap.to(btn, { x: 0, y: 0, duration: 0.5, ease: 'elastic.out(1,0.4)' }));
});

// ── Typewriter for roles ──
const roles = ['AI/ML Engineer', 'Computer Vision Engineer', 'Python Developer', 'Data Analyst', 'Automation Specialist'];
let rIdx = 0, cIdx = 0, deleting = false;
const typedEl = document.getElementById('typed-role');

function typeLoop() {
  if (!typedEl) return;
  const current = roles[rIdx];
  if (!deleting) {
    typedEl.textContent = current.slice(0, cIdx + 1);
    cIdx++;
    if (cIdx === current.length) { deleting = true; setTimeout(typeLoop, 2500); return; }
    setTimeout(typeLoop, 70 + Math.random() * 30);
  } else {
    typedEl.textContent = current.slice(0, cIdx - 1);
    cIdx--;
    if (cIdx === 0) { deleting = false; rIdx = (rIdx + 1) % roles.length; setTimeout(typeLoop, 400); return; }
    setTimeout(typeLoop, 35);
  }
}
setTimeout(typeLoop, 1500);

// ── Bento pill stagger on hover ──
document.querySelectorAll('.bento-card').forEach(group => {
  const tags = group.querySelectorAll('.bento-pill');
  group.addEventListener('mouseenter', () => {
    gsap.fromTo(tags, { scale: 0.92, opacity: 0.5 }, { scale: 1, opacity: 1, stagger: 0.04, duration: 0.25, ease: 'back.out(2)' });
  });
});

// ── Certificate Modal Logic ──
const certBtn = document.querySelector('.cert-btn');
const modal = document.getElementById('cert-modal');
if (certBtn && modal) {
  const closeBtn = modal.querySelector('.modal-close');
  const backdrop = modal.querySelector('.modal-backdrop');

  certBtn.addEventListener('click', () => {
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
  });

  const closeModal = () => {
    modal.classList.remove('active');
    document.body.style.overflow = '';
  };

  closeBtn.addEventListener('click', closeModal);
  backdrop.addEventListener('click', closeModal);
}

