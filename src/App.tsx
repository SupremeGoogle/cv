import React, { useEffect, useState, useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import './style.css'
import OrbitingSkills from './components/ui/orbiting-skills'
import RadialOrbitalTimeline from "./components/ui/radial-orbital-timeline";
import SphereImageGrid from './components/ui/img-sphere';

type WebProject = {
  id: number;
  name: string;
  url: string;
  img: string;
  desc: string;
};

const COMMERCIAL_SITES: WebProject[] = [
  { id: 1, name: 'БалтМаг', url: 'https://baltmag.vercel.app', img: '/legacy/1.jpg', desc: 'Супермаркет хозтоваров и бытовой химии' },
  { id: 2, name: 'Aristo', url: 'https://aristo39.com', img: '/legacy/2.jpg', desc: 'Профессиональный салон гардеробных систем' },
  { id: 3, name: 'KIBERone: Навигатор', url: 'https://kiberone.vercel.app', img: '/legacy/3.jpg', desc: 'Информационный лендинг родительского навигатора' },
  { id: 4, name: 'C# Курс', url: 'https://supremegoogle.github.io/C-/', img: '/legacy/4.jpg', desc: 'Образовательный каталог уроков программирования' },
  { id: 5, name: 'Пастерия 51', url: 'https://pasteriya.vercel.app', img: '/legacy/5.jpg', desc: 'Кафе пасты ручной работы и завтраков' },
  { id: 6, name: 'L.A. Coffee', url: 'https://la-coffee.vercel.app', img: '/legacy/6.jpg', desc: 'Атмосферная кофейня со свежей выпечкой' },
  { id: 7, name: 'Анима', url: 'https://anima-rho-three.vercel.app', img: '/legacy/7.jpg', desc: 'Стильное кафе итальянской кухни' },
  { id: 8, name: 'Нотариус', url: 'https://notarius-rudobelec.vercel.app', img: '/legacy/8.jpg', desc: 'Официальный сайт нотариальной конторы' },
  { id: 9, name: 'Брусничка', url: 'https://brusni4ka.vercel.app', img: '/legacy/9.jpg', desc: 'Сеть супермаркетов свежих продуктов' },
  { id: 10, name: 'Твой Портной', url: 'https://tvoy-portnoy.vercel.app', img: '/legacy/10.jpg', desc: 'Профессиональное ателье: пошив и ремонт' },
  { id: 11, name: 'Шляпный бутик', url: 'https://shlyapa-one.vercel.app', img: '/legacy/11.jpg', desc: 'Магазин головных уборов премиум-класса' }
];

// ── ScrambleText class for animations ──
class ScrambleText {
  el: HTMLElement;
  chars: string;
  targetText: string = '';
  iteration: number = 0;
  frameRequest: number = 0;
  resolve: any;

  constructor(el: HTMLElement) {
    this.el = el;
    this.chars = 'ABCDEFGHJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()';
    this.update = this.update.bind(this);
  }

  setText(newText: string) {
    this.targetText = newText;
    this.iteration = 0;
    const promise = new Promise((resolve) => (this.resolve = resolve));
    cancelAnimationFrame(this.frameRequest);
    this.update();
    return promise;
  }

  update() {
    let output = '';
    for (let i = 0; i < this.targetText.length; i++) {
      if (i < this.iteration) {
        output += this.targetText[i];
      } else {
        output += `<span class="scramble-char-active">${this.chars[Math.floor(Math.random() * this.chars.length)]}</span>`;
      }
    }
    this.el.innerHTML = output;
    if (this.iteration < this.targetText.length) {
      this.iteration += 0.1;
      this.frameRequest = requestAnimationFrame(this.update);
    } else {
      this.el.innerText = this.targetText;
      this.resolve();
    }
  }
}

function App() {
  const [activeSite, setActiveSite] = useState<WebProject | null>(null);
  const [fullscreenImgUrl, setFullscreenImgUrl] = useState<string | null>(null);

  // ── Drag to scroll logic ──
  const trackWrapperRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const startX = useRef(0);
  const scrollLeft = useRef(0);
  const velocity = useRef(0);
  const lastX = useRef(0);
  const rafId = useRef<number | null>(null);

  const applyMomentum = () => {
    if (!trackWrapperRef.current || Math.abs(velocity.current) < 0.5) return;
    trackWrapperRef.current.scrollLeft -= velocity.current;
    velocity.current *= 0.92; // Friction factor
    rafId.current = requestAnimationFrame(applyMomentum);
  };

  const handleDragStart = (e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>) => {
    isDragging.current = true;
    if (rafId.current) cancelAnimationFrame(rafId.current);
    const pageX = 'touches' in e ? e.touches[0].pageX : e.pageX;
    if (trackWrapperRef.current) {
      startX.current = pageX - trackWrapperRef.current.offsetLeft;
      scrollLeft.current = trackWrapperRef.current.scrollLeft;
      lastX.current = pageX;
      velocity.current = 0;
      trackWrapperRef.current.style.cursor = 'grabbing';
      trackWrapperRef.current.style.scrollBehavior = 'auto';
      trackWrapperRef.current.style.scrollSnapType = 'none';
      if ('touches' in e) document.body.style.overscrollBehaviorY = 'contain';
    }
  };

  const handleDragEnd = () => {
    if (!isDragging.current) return;
    isDragging.current = false;
    if (trackWrapperRef.current) {
      trackWrapperRef.current.style.cursor = 'grab';
      document.body.style.overscrollBehaviorY = 'auto';
      applyMomentum();
      
      // Restore snapping after momentum finishes or after a delay
      setTimeout(() => {
        if (!isDragging.current && trackWrapperRef.current) {
          trackWrapperRef.current.style.scrollSnapType = 'x proximity';
          trackWrapperRef.current.style.scrollBehavior = 'smooth';
        }
      }, 500);
    }
  };

  const handleDragMove = (e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>) => {
    if (!isDragging.current || !trackWrapperRef.current) return;
    const pageX = 'touches' in e ? e.touches[0].pageX : e.pageX;
    const x = pageX - trackWrapperRef.current.offsetLeft;
    const walk = (x - startX.current); 
    trackWrapperRef.current.scrollLeft = scrollLeft.current - walk;
    
    velocity.current = pageX - lastX.current;
    lastX.current = pageX;
  };

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);

    // ── Particle System ──
    const initParticles = () => {
      const canvas = document.getElementById('particles-canvas') as HTMLCanvasElement;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      const particles: any[] = [];
      const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; };
      window.addEventListener('resize', resize);
      resize();

      class P {
        x = Math.random() * canvas.width; y = Math.random() * canvas.height;
        s = Math.random() * 2 + 0.5; sx = (Math.random() - 0.5) * 0.4; sy = (Math.random() - 0.5) * 0.4;
        o = Math.random() * 0.5 + 0.2; c = Math.random() > 0.5 ? '#34D399' : '#38BDF8';
        u() { this.x += this.sx; this.y += this.sy; if (this.x < 0 || this.x > canvas.width) this.sx *= -1; if (this.y < 0 || this.y > canvas.height) this.sy *= -1; }
        d() { if (!ctx) return; ctx.beginPath(); ctx.arc(this.x, this.y, this.s, 0, Math.PI * 2); ctx.fillStyle = this.c; ctx.globalAlpha = this.o; ctx.fill(); }
      }
      for (let i = 0; i < 70; i++) particles.push(new P());
      let aid: number;
      const anim = () => { ctx.clearRect(0, 0, canvas.width, canvas.height); particles.forEach(p => { p.u(); p.d(); }); aid = requestAnimationFrame(anim); };
      anim();
      return () => { window.removeEventListener('resize', resize); cancelAnimationFrame(aid); };
    };
    const cp = initParticles();

    // ── Visibility Setup ──
    gsap.set('.terminal-window, .hero-greeting, .hero-cmd, .hero-title, .hero-desc, .hero-btns, .hero-avatar-wrapper, .scroll-indicator, .contact-box', { opacity: 0, y: 30 });
    gsap.set('.hero-title', { x: -30, y: 0 }); // Override for title slide-in

    // ── Scroll Events ──
    const onScroll = () => {
      const bar = document.getElementById('progress-bar');
      if (bar) bar.style.width = (window.scrollY / (document.body.scrollHeight - window.innerHeight) * 100) + '%';
      
      const nav = document.getElementById('navbar');
      if (nav) nav.classList.toggle('scrolled', window.scrollY > 50);

      const sections = document.querySelectorAll('section[id]');
      let curr = '';
      sections.forEach(s => { if (window.scrollY >= (s as HTMLElement).offsetTop - 200) curr = s.id; });
      document.querySelectorAll('.nav-links a').forEach(a => { a.classList.toggle('active', a.getAttribute('href') === '#' + curr); });
    };
    window.addEventListener('scroll', onScroll);

    // ── Hero Timeline ──
    const hTL = gsap.timeline({ delay: 0.5 });
    hTL.to('.terminal-window', { opacity: 1, y: 0, duration: 1, ease: 'power3.out' })
       .to('.hero-greeting', { opacity: 1, y: 0, duration: 0.5 }, '-=0.6')
       .to('.hero-cmd', { opacity: 1, y: 0, duration: 0.5 }, '-=0.4')
       .add(() => { document.querySelectorAll('.hero-name .scramble-text').forEach(el => new ScrambleText(el as HTMLElement).setText((el as HTMLElement).dataset.value || '')); }, '-=0.2')
       .to('.hero-title', { opacity: 1, x: 0, duration: 0.6 }, '-=0.4')
       .to('.hero-desc', { opacity: 1, y: 0, duration: 0.6 }, '-=0.3')
       .to('.hero-btns', { opacity: 1, y: 0, duration: 0.5 }, '-=0.2')
       .to('.hero-avatar-wrapper', { opacity: 1, scale: 1, duration: 1, ease: 'power2.out' }, '-=0.8')
       .to('.scroll-indicator', { opacity: 1, y: 0, duration: 0.5 }, '-=0.2');

    // ── General Scroll Reveals ──
    document.querySelectorAll('.section-label, .about-card, .exp-card, .bento-card, .edu-card, .cert-item, .contact-box').forEach(el => {
      gsap.to(el, { opacity: 1, y: 0, duration: 0.8, scrollTrigger: { trigger: el, start: 'top 85%' } });
    });

    gsap.utils.toArray('.section-title').forEach(title => {
      const el = title as HTMLElement;
      ScrollTrigger.create({ trigger: el, start: 'top 85%', onEnter: () => { 
        el.style.opacity = '1'; 
        el.querySelectorAll('span').forEach(s => {
          const span = s as HTMLElement;
          new ScrambleText(span).setText(span.dataset.value || span.textContent || '');
        });
      } });
    });

    // ── Stats Reveal ──
    ScrollTrigger.create({
      trigger: '.stats-row',
      start: 'top 80%',
      onEnter: () => {
        document.querySelectorAll('.stat-item').forEach((el, i) => gsap.to(el, { opacity: 1, y: 0, duration: 0.5, delay: i * 0.1 }));
        document.querySelectorAll('.count-up').forEach(el => {
          const target = +( (el as HTMLElement).dataset.target || 0);
          const suffix = (el as HTMLElement).dataset.suffix || '';
          const obj = { v: 0 };
          gsap.to(obj, { v: target, duration: 1.8, ease: 'power2.out', onUpdate: () => { el.textContent = Math.round(obj.v) + suffix; } });
        });
      }
    });

    // ── Projects Scroll Reveal ──
    document.querySelectorAll('.project-slide').forEach((slide) => {
      gsap.fromTo(slide,
        { opacity: 0, y: 50 },
        { opacity: 1, y: 0, duration: 0.9, ease: 'power3.out', scrollTrigger: { trigger: slide, start: 'top 82%' } }
      );
      const ghost = slide.querySelector('.project-ghost');
      if (ghost) {
        gsap.fromTo(ghost, { x: -80, opacity: 0 }, { x: 0, opacity: 1, duration: 1, scrollTrigger: { trigger: slide, start: 'top 85%', scrub: 0.5 } });
      }
    });

    // ── Horizontal Scroll Pinning (Desktop) ──
    const mm = gsap.matchMedia();
    mm.add("(min-width: 1024px)", () => {
      const track = document.querySelector('.projects-track');
      const wrapper = document.querySelector('.projects-track-wrapper');
      if (!track || !wrapper) return;

      const scrollWidth = track.scrollWidth;
      const viewportWidth = window.innerWidth;
      const amountToScroll = scrollWidth - viewportWidth;

      gsap.to(track, {
        x: () => -amountToScroll,
        ease: "none",
        scrollTrigger: {
          trigger: ".projects",
          start: "top top",
          end: () => "+=" + amountToScroll,
          pin: true,
          scrub: 1,
          invalidateOnRefresh: true,
        }
      });
    });

    // ── Mouse Follow & Interactions ──
    const moveM = (e: MouseEvent) => {
      const ring = document.querySelector('.cursor-ring') as HTMLElement;
      const dot = document.querySelector('.cursor-dot') as HTMLElement;
      if (ring && dot) { 
        gsap.to(ring, { x: e.clientX - 16, y: e.clientY - 16, duration: 0.15, overwrite: 'auto' });
        gsap.to(dot, { x: e.clientX - 2, y: e.clientY - 2, duration: 0, overwrite: 'auto' });
      }
    };
    window.addEventListener('mousemove', moveM);

    // Tilt Effect
    document.querySelectorAll('.bento-card, .about-card, .project-browser').forEach(card => {
      const el = card as HTMLElement;
      el.addEventListener('mousemove', (e) => {
        const r = el.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width - 0.5;
        const y = (e.clientY - r.top) / r.height - 0.5;
        gsap.to(el, { rotateX: -y * 6, rotateY: x * 6, duration: 0.3, transformPerspective: 800 });
      });
      el.addEventListener('mouseleave', () => gsap.to(el, { rotateX: 0, rotateY: 0, duration: 0.5 }));
    });

    // Typewriter
    const roles = ['AI/ML Engineer', 'Computer Vision Specialist', 'Python Developer'];
    let ri = 0, ci = 0, del = false;
    const type = () => {
      const el = document.getElementById('typed-role'); if (!el) return;
      const cur = roles[ri];
      if (!del) { el.textContent = cur.slice(0, ci + 1); ci++; if (ci === cur.length) { del = true; typeTimeout = setTimeout(type, 2000); return; } }
      else { el.textContent = cur.slice(0, ci - 1); ci--; if (ci === 0) { del = false; ri = (ri + 1) % roles.length; typeTimeout = setTimeout(type, 500); return; } }
      typeTimeout = setTimeout(type, del ? 50 : 100);
    };
    let typeTimeout = setTimeout(type, 1500);

    return () => {
      if (cp) cp();
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('mousemove', moveM);
      clearTimeout(typeTimeout);
      mm.revert();
      ScrollTrigger.getAll().forEach(t => t.kill());
    };
  }, []);

  const toggleModal = (active: boolean) => {
    const modal = document.getElementById('cert-modal');
    if (modal) {
      if (active) {
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
      } else {
        modal.classList.remove('active');
        document.body.style.overflow = '';
      }
    }
  };

  const handleNavToggle = () => {
    document.querySelector('.nav-links')?.classList.toggle('active');
  };

  return (
    <>
      <canvas id="particles-canvas"></canvas>
      <div id="progress-bar"></div>
      <div className="cursor-ring"></div>
      <div className="cursor-dot"></div>

      {/* ══════ NAV ══════ */}
      <nav className="navbar" id="navbar">
        <a href="#hero" className="nav-logo">GA<span>.</span></a>
        <div className="nav-links">
          <a href="#about" onClick={() => document.querySelector('.nav-links')?.classList.remove('active')}>О себе</a>
          <a href="#experience" onClick={() => document.querySelector('.nav-links')?.classList.remove('active')}>Опыт</a>
          <a href="#projects" onClick={() => document.querySelector('.nav-links')?.classList.remove('active')}>Проекты</a>
          <a href="#skills" onClick={() => document.querySelector('.nav-links')?.classList.remove('active')}>Навыки</a>
          <a href="#education" onClick={() => document.querySelector('.nav-links')?.classList.remove('active')}>Образование</a>
        </div>
        <a href="#contact" className="nav-cta">Связаться</a>
        <div className="hamburger" onClick={handleNavToggle}>
          <span></span><span></span><span></span>
        </div>
      </nav>

      {/* ══════ HERO ══════ */}
      <section className="hero" id="hero">
        <video autoPlay loop muted playsInline id="hero-video">
          <source src="/ezgif-40e95fbedf42a49f.mp4" type="video/mp4" />
        </video>
        <div className="hero-video-overlay"></div>
        <div className="container">
          <div className="hero-content">
            <div className="hero-text">
              <div className="terminal-window">
                <div className="terminal-bar">
                  <div className="terminal-dot red"></div>
                  <div className="terminal-dot yellow"></div>
                  <div className="terminal-dot green"></div>
                  <div className="terminal-title">bash — ~/portfolio — 90×30</div>
                </div>
                <div className="terminal-body">
                  <div className="hero-greeting">
                    <span className="pulse"></span>
                    <span>Открыт к предложениям</span>
                  </div>

                  <div className="terminal-command hero-cmd">akbar@portfolio:~$ cat ./personal_info.txt</div>
                  <h1 className="hero-name">
                    <span className="scramble-text" data-value="Гафаров"></span><br /><span className="accent scramble-text"
                      data-value="Акбар"></span>
                  </h1>

                  <div className="hero-title">
                    <span className="line"></span>
                    <span id="typed-role">AI/ML Engineer</span>
                    <span className="typed-cursor" style={{ animation: 'blink-c 0.8s step-end infinite', color: 'var(--accent)' }}>|</span>
                  </div>

                  <p className="hero-desc">
                    Молодой разработчик с практическим опытом в области <span className="hl">искусственного интеллекта</span>,
                    компьютерного зрения, Python-разработки и автоматизации процессов. Полный цикл создания IT-решений:
                    от сбора данных до внедрения готовых систем.
                  </p>

                  <div className="hero-btns">
                    <a href="#projects" className="btn-primary">Портфолио</a>
                    <a href="https://github.com/SupremeGoogle/" target="_blank" className="btn-outline">GitHub</a>
                    <a href="#contact" className="btn-outline">Связаться</a>
                  </div>
                </div>
              </div>
            </div>

            <div className="hero-visual hidden md:flex">
              <OrbitingSkills />
            </div>
          </div>
        </div>
        <div className="scroll-indicator">
          <div className="scroll-mouse"></div>
          <span>SCROLL</span>
        </div>
      </section>

      {/* ══════ ABOUT ══════ */}
      <section className="about" id="about">
        <div className="container">
          <div className="section-label"><span className="dot"></span> akbar@portfolio:~$ cat ./about_me.txt</div>
          <h2 className="section-title">Обо <span data-value="мне"></span></h2>
          <div className="about-grid">
            <div className="about-text">
              <p>Я — амбициозный разработчик, специализирующийся на <strong>AI, Computer Vision и Python</strong>. Мой опыт
                охватывает полный цикл создания IT-продуктов: от проектирования архитектуры и сбора данных до обучения
                нейросетей и развертывания готовых инструментов.</p>
              <p>Легко адаптируюсь к новым задачам, быстро осваиваю современные технологии и умею эффективно работать как в
                команде, так и самостоятельно, беря на себя полную ответственность за финальный результат.</p>
              <p>Помимо разработки, я успешно совмещаю роли наставника и координатора, имея опыт управления академическими
                процессами и курирования команд из более чем 35 специалистов.</p>
              <div className="langs-grid" style={{ marginTop: '2rem' }}>
                <div className="lang-item"><span className="lang-name">Русский</span><span className="lang-level">Разг.</span></div>
                <div className="lang-item"><span className="lang-name">Английский</span><span className="lang-level">B2</span></div>
                <div className="lang-item"><span className="lang-name">Таджикский</span><span className="lang-level">Разг.</span></div>
                <div className="lang-item"><span className="lang-name">Узбекский</span><span className="lang-level">Разг.</span></div>
                <div className="lang-item"><span className="lang-name">Казахский</span><span className="lang-level">Разг.</span></div>
              </div>
            </div>
            <div className="about-cards">
              <div className="about-card">
                <div className="about-card-icon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                  </svg>
                </div>
                <h4>AI / ML</h4>
                <p>PyTorch, YOLO, RAG, нейросети, компьютерное зрение</p>
              </div>
              <div className="about-card">
                <div className="about-card-icon">
                  <svg width="24" height="24" viewBox="0 0 128 128" fill="none">
                    <path d="M64.6 2.7c-21.6 0-24.6 9.3-24.6 9.3l.1 11.5h25.1v3.5H37.5C20.1 27.1 17.6 38.9 17.6 38.9s-3.1 13.3 17.2 14.8v-8.1s-.2-9.4 9.3-9.4h25.3s8.9-.4 8.9-8.8V13.5s.5-10.8-13.7-10.8z" fill="#387eb8"/>
                    <path d="M47.8 16.7a3.8 3.8 0 1 1-7.5 0 3.8 3.8 0 0 1 7.5 0z" fill="#fff"/>
                    <path d="M65.1 123.6c21.6 0 24.6-9.3 24.6-9.3l-.1-11.5H64.5v-3.5h27.7c17.4 0 19.9-11.8 19.9-11.8s3.1-13.3-17.2-14.8v8.1s.2 9.4-9.3 9.4H60.2s-8.9.4-8.9 8.8v13.9s-.5 10.8 13.8 10.8z" fill="#ffe052"/>
                    <path d="M81.8 109.6a3.8 3.8 0 1 1 7.5 0 3.8 3.8 0 0 1-7.5 0z" fill="#fff"/>
                  </svg>
                </div>
                <h4>Python</h4>
                <p>Бэкенд, автоматизация, боты, анализ данных</p>
              </div>
              <div className="about-card">
                <div className="about-card-icon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path
                      d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20M4 19.5A2.5 2.5 0 0 0 6.5 22H20M4 19.5V4a2 2 0 0 1 2-2h10l4 4v16a2 2 0 0 1-2 2H6.5a2.5 2.5 0 0 1-2.5-2.5z" />
                  </svg>
                </div>
                <h4>Менторство</h4>
                <p>100+ учеников, 35+ тьюторов, 4 учебных модуля</p>
              </div>
              <div className="about-card">
                <div className="about-card-icon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
                  </svg>
                </div>
                <h4>Универсальность</h4>
                <p>Разработчик, автоматизатор, наставник — всё в одном</p>
              </div>
            </div>
          </div>
          <div className="stats-row">
            <div className="stat-item">
              <div className="stat-num count-up" data-target="4" data-suffix="+">0</div>
              <div className="stat-label">Лет в IT и обучении</div>
            </div>
            <div className="stat-item">
              <div className="stat-num count-up" data-target="100" data-suffix="+">0</div>
              <div className="stat-label">Учеников обучено</div>
            </div>
            <div className="stat-item">
              <div className="stat-num count-up" data-target="15" data-suffix="+">0</div>
              <div className="stat-label">Сайтов для бизнеса</div>
            </div>
            <div className="stat-item">
              <div className="stat-num count-up" data-target="10" data-suffix="+">0</div>
              <div className="stat-label">Telegram-ботов</div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════ EXPERIENCE ══════ */}
      <section className="experience" id="experience">
        <div className="container">
          <div className="section-label"><span className="dot"></span> akbar@portfolio:~$ cat ./experience.txt</div>
          <h2 className="section-title">Мой <span data-value="опыт"></span></h2>
          <div className="exp-timeline">
            <div className="exp-card">
              <div className="exp-card-inner">
                <div className="exp-header">
                  <div>
                    <div className="exp-role">Разработчик (AI/ML)</div>
                    <div className="exp-company">Балтийский центр нейротехнологий и ИИ</div>
                  </div>
                  <span className="exp-date">2024 — н.в.</span>
                </div>
                <p className="exp-desc">Разрабатываю интеллектуальные системы на базе AI, компьютерного зрения и анализа
                  цифрового контента. Полный цикл AI-разработки: сбор данных → датасеты → разметка → обучение → тестирование
                  → оценка.</p>
                <div className="tags">
                  <span className="tag">Python</span>
                  <span className="tag">PyTorch</span>
                  <span className="tag">YOLO</span>
                  <span className="tag-blue tag">PostgreSQL</span>
                  <span className="tag-purple tag">RAG</span>
                  <span className="tag-blue tag">Docker</span>
                </div>
              </div>
            </div>
            <div className="exp-card">
              <div className="exp-card-inner">
                <div className="exp-header">
                  <div>
                    <div className="exp-role">Старший тьютор / Тьютор</div>
                    <div className="exp-company">KIBERone</div>
                  </div>
                  <span className="exp-date">2021 — 2026</span>
                </div>
                <p className="exp-desc">Преподавал детям 6–14 лет программирование и цифровые технологии. Последние 2 года
                  совмещал преподавание с ролью старшего тьютора: руководил академическими процессами, курировал команду,
                  адаптировал новых сотрудников.</p>
                <ul className="exp-list">
                  <li>Обучил более 100 учеников</li>
                  <li>Курировал около 35 тьюторов</li>
                  <li>Разработал 4 собственных учебных модуля</li>
                  <li>Автоматизировал внутренние процессы команды</li>
                </ul>
                <div className="tags">
                  <span className="tag">Python</span>
                  <span className="tag-blue tag">Telegram Bot API</span>
                  <span className="tag-purple tag">Unity</span>
                  <span className="tag-purple tag">Blender</span>
                  <span className="tag-blue tag">HTML/CSS</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════ SKILLS ══════ */}
      <section className="skills" id="skills">
        <div className="container">
          <div className="section-label"><span className="dot"></span> akbar@portfolio:~$ ls ./skills/</div>
          <h2 className="section-title">Мои <span data-value="Компетенции"></span></h2>
          <p className="skills-subtitle">Универсален: работаю как разработчик, специалист по автоматизации и наставник команды.
            Быстро осваиваю новые технологии и довожу каждый проект до результата.</p>
          <div className="bento-grid-custom">
            <div className="bento-card top-left">
              <div className="bento-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"
                  strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                  <line x1="3" y1="9" x2="21" y2="9"></line>
                  <line x1="9" y1="21" x2="9" y2="9"></line>
                </svg>
              </div>
              <h3>AI и Computer Vision</h3>
              <p>Обучение нейросетей с нуля, подготовка и разметка датасетов, анализ данных и создание прикладных решений в
                области компьютерного зрения.</p>
              <div className="bento-pills">
                <span className="bento-pill">PyTorch</span>
                <span className="bento-pill">YOLO</span>
                <span className="bento-pill">OpenCV</span>
                <span className="bento-pill">RAG</span>
              </div>
              <div className="bento-decoration dek-window hidden md:block">
                <div className="code-window">
                  <div className="code-window-bar"><span></span><span></span><span></span></div>
                  <div className="code-window-body">
                    <div className="code-line"><span className="bracket">&lt;&gt;</span>
                      <div className="bar p" style={{ width: '100px' }}></div>
                    </div>
                    <div className="code-line">
                      <div className="bar g" style={{ width: '180px' }}></div>
                    </div>
                    <div className="code-line">
                      <div className="bar g" style={{ width: '140px' }}></div>
                    </div>
                    <div className="code-line">
                      <div className="bar g" style={{ width: '160px' }}></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="bento-card bottom-left">
              <div className="bento-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"
                  strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 19l7-7 3 3-7 7-3-3z"></path>
                  <path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"></path>
                  <path d="M2 2l7.586 7.586"></path>
                  <circle cx="11" cy="11" r="2"></circle>
                </svg>
              </div>
              <h3>Автоматизация и Боты</h3>
              <p>Разработка Telegram-ботов для бизнеса, CRM-автоматизация и цифровизация повторяющихся задач для оптимизации
                рабочих процессов.</p>
              <div className="bento-pills">
                <span className="bento-pill">Python</span>
                <span className="bento-pill">Docker</span>
                <span className="bento-pill">Telegram API</span>
                <span className="bento-pill">CI/CD</span>
              </div>
              <div className="bento-decoration dek-orbit hidden md:block">
                <div className="orbit-deco">
                  <div className="orbit-ring"></div>
                  <div className="orbit-center">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.4)"
                      strokeWidth="2">
                      <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                    </svg>
                  </div>
                  <div className="orbit-dot"></div>
                  <div className="orbit-dot"></div>
                  <div className="orbit-dot"></div>
                </div>
              </div>
            </div>
            <div className="bento-card right-tall">
              <div className="bento-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"
                  strokeLinecap="round" strokeLinejoin="round">
                  <ellipse cx="12" cy="5" rx="9" ry="3"></ellipse>
                  <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"></path>
                  <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"></path>
                </svg>
              </div>
              <h3>Инфраструктура и БД</h3>
              <p>Проектирование логики хранения данных в PostgreSQL, контейнеризация приложений в Docker и работа с сетевыми
                протоколами.</p>
              <div className="bento-decoration dek-progress hidden md:block">
                <div className="progress-decoration">
                  <div className="prog-row"><span className="bracket">{">_"}</span>
                    <div className="prog-bar-track">
                      <div className="prog-bar-fill" style={{ width: '40%' }}></div>
                    </div>
                  </div>
                  <div className="prog-row"><span className="bracket">{">_"}</span>
                    <div className="prog-bar-track">
                      <div className="prog-bar-fill" style={{ width: '65%' }}></div>
                    </div>
                  </div>
                  <div className="prog-row"><span className="bracket">{">_"}</span>
                    <div className="prog-bar-track">
                      <div className="prog-bar-fill" style={{ width: '80%' }}></div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bento-pills bento-pills-bottom">
                <span className="bento-pill">SQL</span>
                <span className="bento-pill">PostgreSQL</span>
                <span className="bento-pill">Docker</span>
                <span className="bento-pill">CRM API</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════ PROJECTS ══════ */}
      <section className="projects" id="projects">
        <div className="container">
          <div className="projects-header">
            <div className="projects-header-left">
              <div className="section-label"><span className="dot"></span> akbar@portfolio:~$ cat ./projects.txt</div>
              <h2 className="section-title">Мои <span data-value="Проекты"></span></h2>
            </div>
            <div className="projects-scroll-hint">Листайте горизонтально ➔</div>
          </div>
        </div>
        <div 
          className="projects-track-wrapper"
          ref={trackWrapperRef}
          onMouseDown={handleDragStart}
          onMouseLeave={handleDragEnd}
          onMouseUp={handleDragEnd}
          onMouseMove={handleDragMove}
          onTouchStart={handleDragStart}
          onTouchEnd={handleDragEnd}
          onTouchMove={handleDragMove}
          style={{ cursor: 'grab' }}
        >
          <div className="projects-track">
            {/* Project 1 */}
            <div className="project-slide project-slide-standard">
              <div className="project-ghost">UAV VISION</div>
              <div className="project-slide-content">
                <div className="project-browser">
                  <div className="browser-bar">
                    <div className="browser-dot red"></div>
                    <div className="browser-dot yellow"></div>
                    <div className="browser-dot green"></div>
                    <div className="browser-url"></div>
                  </div>
                  <div className="browser-body">
                    <div className="project-video-wrapper">
                      <video autoPlay loop muted playsInline className="project-video">
                        <source src="/bpla.mp4" type="video/mp4" />
                      </video>
                    </div>
                    <div className="mock-title">UAV Detection System</div>
                  </div>
                </div>
                <div className="project-info">
                  <div className="project-num"><span className="num-val">01</span> КОМПЬЮТЕРНОЕ ЗРЕНИЕ</div>
                  <h3 className="project-name">Система распознавания техники для БПЛА</h3>
                  <p className="project-desc">Система компьютерного зрения для автоматического обнаружения наземной техники по
                    данным с беспилотников.</p>
                  <ul className="project-tasks">
                    <li>Сбор и разметка датасетов</li>
                    <li>Обучение моделей компьютерного зрения</li>
                    <li>Тестирование и оценка качества</li>
                  </ul>
                  <div className="tags">
                    <span className="tag">Python</span>
                    <span className="tag">PyTorch</span>
                    <span className="tag">YOLO</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Project 2 */}
            <div className="project-slide project-slide-standard">
              <div className="project-ghost">MONITORING</div>
              <div className="project-slide-content" style={{ direction: 'rtl' }}>
                <div className="project-info" style={{ direction: 'ltr', textAlign: 'left' }}>
                  <div className="project-num"><span className="num-val">02</span> AI АНАЛИЗ</div>
                  <h3 className="project-name">Система мониторинга контента</h3>
                  <p className="project-desc">Интеллектуальная система выявления признаков продажи запрещённых веществ с
                    применением RAG-подходов.</p>
                  <ul className="project-tasks">
                    <li>Подготовка и анализ данных</li>
                    <li>Обучение AI-моделей</li>
                    <li>RAG-архитектура и работа с БД</li>
                  </ul>
                  <div className="tags">
                    <span className="tag">Python</span>
                    <span className="tag-purple tag">RAG</span>
                    <span className="tag-blue tag">PostgreSQL</span>
                    <span className="tag-blue tag">Docker</span>
                  </div>
                </div>
                <div className="project-browser" style={{ direction: 'ltr' }}>
                  <div className="browser-bar">
                    <div className="browser-dot red"></div>
                    <div className="browser-dot yellow"></div>
                    <div className="browser-dot green"></div>
                    <div className="browser-url"></div>
                  </div>
                  <div className="browser-body">
                    <img 
                      src="/monitoring.jpg" 
                      alt="Мониторинг" 
                      className="project-img cursor-pointer transition-transform duration-300 hover:scale-[1.02]" 
                      onClick={() => setFullscreenImgUrl('/monitoring.jpg')}
                      title="Нажмите, чтобы увеличить"
                    />
                    <div className="mock-title">Content Monitor</div>
                    <button className="btn-outline btn-sm cert-btn" onClick={() => toggleModal(true)}>Свидетельство</button>
                  </div>
                </div>
              </div>
            </div>

            {/* Project 3 */}
            <div className="project-slide project-slide-standard">
              <div className="project-ghost">TELEGRAM</div>
              <div className="project-slide-content">
                <div className="project-browser">
                  <div className="browser-bar">
                    <div className="browser-dot red"></div>
                    <div className="browser-dot yellow"></div>
                    <div className="browser-dot green"></div>
                    <div className="browser-url"></div>
                  </div>
                  <div className="browser-body p-0 digital-projects-bg" style={{ overflow: 'hidden', position: 'relative' }}>
                    <div className="h-[260px] md:h-[480px] w-full">
                      <RadialOrbitalTimeline timelineData={[
                        { id: 1, title: "KIBERone KLD", date: "2023", content: "CRM-бот школы KIBERone: приём онлайн-заявок, умные ссылки, интеграция с AmoCRM, автоматические рассылки ученикам и родителям.", category: "Bot", iconName: "messageSquare", relatedIds: [6], status: "completed", energy: 95, link: "https://t.me/kiberoneKLD_bot" },
                        { id: 2, title: "Этажи KLD", date: "2023", content: "Бот агентства недвижимости Этажи: умные ссылки на объекты, интеграция с CRM-системой, автоматическая обработка входящих заявок.", category: "Bot", iconName: "home", relatedIds: [3], status: "completed", energy: 90, link: "https://t.me/etagi_kaliningrad_bot" },
                        { id: 3, title: "AZTmoto", date: "2024", content: "Бот мото-магазина: каталог экипировки с фото, автоматические рассылки новинок и акций по базе клиентов.", category: "Bot", iconName: "zap", relatedIds: [2], status: "completed", energy: 85, link: "https://t.me/AZTmoto_bot" },
                        { id: 4, title: "Dreamcars39", date: "2024", content: "Бот аренды премиальных авто: онлайн-запись, управление расписанием броней, уведомления для клиентов и менеджеров.", iconName: "car", relatedIds: [2, 5], status: "completed", energy: 80, category: "Bot", link: "https://t.me/Dreamcars39_bot" },
                        { id: 5, title: "Kibernalog", date: "2024", content: "Полностью автоматизированный бот: генерирует пакет документов для налогового вычета по данным пользователя, экспорт в PDF.", category: "Automation", iconName: "fileText", relatedIds: [1, 4], status: "completed", energy: 100, link: "https://t.me/kibernalog_bot" },
                        { id: 6, title: "KIBERone Visor", date: "2024", content: "Сложнейший бот: мониторит родительских чаты школы KIBERone, анализирует активность, автоматический контроль качества коммуникаций.", category: "Shield", iconName: "shieldCheck", relatedIds: [1], status: "completed", energy: 98, link: "https://t.me/KIBERoneVisor_bot" },
                        { id: 7, title: "All Interior", date: "2026", content: "ИИ-консультант по дизайну интерьера: помогает выбрать стиль, палитру и мебель, интегрирован с нейросетью для визуализации идей.", iconName: "messageSquare", relatedIds: [3, 4], status: "in-progress", energy: 70, category: "AI", link: "https://t.me/allinterior_bot" },
                      ]} />
                    </div>
                  </div>
                </div>
                <div className="project-info">
                  <div className="project-num"><span className="num-val">03</span> АВТОМАТИЗАЦИЯ</div>
                  <h3 className="project-name">Telegram-боты для автоматизации</h3>
                  <p className="project-desc">Серия из 10+ Telegram-ботов для реальных бизнес-задач: налоговый вычет, учёт
                    медиафайлов, CRM-процессы.</p>
                  <ul className="project-tasks">
                    <li><a href="https://t.me/kiberoneKLD_bot" target="_blank" rel="noopener" className="project-bot-link"><strong>@kiberoneKLD_bot</strong></a> — CRM, рассылки, онлайн-запись</li>
                    <li><a href="https://t.me/etagi_kaliningrad_bot" target="_blank" rel="noopener" className="project-bot-link"><strong>@etagi_kaliningrad_bot</strong></a> — Умные ссылки, CRM</li>
                    <li><a href="https://t.me/AZTmoto_bot" target="_blank" rel="noopener" className="project-bot-link"><strong>@AZTmoto_bot</strong></a> — Каталог, рассылки</li>
                    <li><a href="https://t.me/Dreamcars39_bot" target="_blank" rel="noopener" className="project-bot-link"><strong>@Dreamcars39_bot</strong></a> — Бронирование авто</li>
                    <li><a href="https://t.me/kibernalog_bot" target="_blank" rel="noopener" className="project-bot-link"><strong>@kibernalog_bot</strong></a> — Генератор налоговых документов</li>
                    <li><a href="https://t.me/KIBERoneVisor_bot" target="_blank" rel="noopener" className="project-bot-link"><strong>@KIBERoneVisor_bot</strong></a> — Мониторинг родительских чатов</li>
                    <li><a href="https://t.me/allinterior_bot" target="_blank" rel="noopener" className="project-bot-link"><strong>@allinterior_bot</strong></a> — ИИ-консультант по интерьеру</li>
                  </ul>
                  <div className="tags">
                    <span className="tag">Python</span>
                    <span className="tag-blue tag">Telegram Bot API</span>
                    <span className="tag-blue tag">SQL</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Project 4 */}
            <div className="project-slide project-slide-standard">
              <div className="project-ghost">DIGITAL WEB</div>
              <div className="project-slide-content" style={{ direction: 'rtl' }}>
                <div className="project-info" style={{ direction: 'ltr', textAlign: 'left' }}>
                  <div className="project-num"><span className="num-val">04</span> WEB-РАЗРАБОТКА</div>
                  <h3 className="project-name">Коммерческие digital-проекты</h3>
                  <p className="project-desc">Более 15 коммерческих сайтов и digital-решений для бизнеса Калининграда — от лендингов до многофункциональных платформ с CRM-интеграцией.</p>
                  <ul className="project-tasks text-[0.8rem] md:text-sm" style={{ maxHeight: '250px', overflowY: 'auto', paddingRight: '10px' }}>
                    {COMMERCIAL_SITES.map(site => (
                      <li key={site.id} style={{ marginBottom: '8px' }}>
                        <span>
                          <a href={site.url} target="_blank" rel="noopener" className="project-bot-link transition-colors duration-200 block md:inline" style={site.name === 'C# Курс' ? { color: '#3b82f6', fontWeight: 'bold' } : { fontWeight: 'bold' }}>
                            {site.name}
                          </a> <span className="hidden md:inline">—</span> <span className="block md:inline">{site.desc}</span>
                        </span>
                      </li>
                    ))}
                  </ul>
                  <div className="tags">
                    <span className="tag-blue tag">HTML</span>
                    <span className="tag-blue tag">CSS</span>
                    <span className="tag">Python</span>
                    <span className="tag-blue tag">SQL</span>
                  </div>
                </div>
                <div className="project-browser" style={{ direction: 'ltr' }}>
                  <div className="browser-bar">
                    <div className="browser-dot red" onClick={() => setActiveSite(null)} style={{ cursor: 'pointer' }}></div>
                    <div className="browser-dot yellow"></div>
                    <div className="browser-dot green"></div>
                    <div className="browser-url browser-url-text" style={{ cursor: 'pointer' }} onClick={() => { if (activeSite) window.open(activeSite.url, '_blank') }}>
                      {activeSite ? activeSite.url.replace('https://', '') : 'vercel.app / projects'}
                    </div>
                  </div>
                  <div className="browser-body p-0 digital-projects-bg">
                    {activeSite ? (
                      <div className="h-[380px] md:h-[520px] w-full flex flex-col relative z-10">
                        <button onClick={() => setActiveSite(null)} className="iframe-back-btn">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 19l-7-7 7-7" /></svg>
                          Назад к проектам
                        </button>
                        <iframe src={activeSite.url} className="w-full h-full min-h-[380px] md:min-h-[520px] border-none bg-white" title={activeSite.name} />
                      </div>
                    ) : (
                      <div className="h-[260px] md:h-[520px] w-full relative flex items-center justify-center overflow-hidden">
                        <SphereImageGrid
                          images={COMMERCIAL_SITES.map(site => ({
                            id: String(site.id),
                            src: site.img,
                            alt: site.name,
                            title: site.name,
                            description: site.desc
                          }))}
                          containerSize={typeof window !== 'undefined' && window.innerWidth < 768 ? 260 : 460}
                          sphereRadius={typeof window !== 'undefined' && window.innerWidth < 768 ? 100 : 175}
                          autoRotate={true}
                          autoRotateSpeed={0.8}
                          dragSensitivity={0.9}
                          momentumDecay={0.96}
                          baseImageScale={typeof window !== 'undefined' && window.innerWidth < 768 ? 0.16 : 0.13}
                          perspective={1000}
                          onImageClick={(imgData) => {
                             const site = COMMERCIAL_SITES.find(s => String(s.id) === imgData.id);
                             if (site) setActiveSite(site);
                          }}
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>


          </div>
        </div>
      </section>

      {/* ══════ EDUCATION ══════ */}
      <section className="education" id="education">
        <div className="container">
          <div className="section-label"><span className="dot"></span> akbar@portfolio:~$ cat ./education.txt</div>
          <h2 className="section-title">Моё <span data-value="образование"></span></h2>
          <div className="edu-card">
            <div className="edu-name">Балтийский федеральный университет имени Иммануила Канта</div>
            <div className="edu-degree">ОНК Высоких технологий · Информационные системы и технологии</div>
            <div className="edu-dates">2021 — 2026</div>
            <span className="diploma-badge">✦ Красный диплом</span>
          </div>

          <div className="certs-grid">
            <div className="cert-item">Диплом о профессиональной подготовке: специалист по ИИ</div>
            <div className="cert-item">Сертифицированный педагог HISTES</div>
            <div className="cert-item">Сертификаты онлайн-курсов (Stepik и др.)</div>
            <div className="cert-item">Наставник первокурсников БФУ</div>
            <div className="cert-item">Победитель международной олимпиады по арифметике</div>
            <div className="cert-item">Свидетельство о регистрации разработанной системы</div>
          </div>
        </div>
      </section>

      {/* ══════ CONTACT ══════ */}
      <section className="contact" id="contact">
        <div className="container">
          <div className="section-label"><span className="dot"></span> akbar@portfolio:~$ nc -zv portfolio 8000</div>
          <h2 className="section-title">Свяжитесь <span data-value="со мной"></span></h2>
          <div className="contact-box">
            <h3 className="contact-title">Готов к новым вызовам</h3>
            <p className="contact-sub">Для сотрудничества, предложений или профессионального общения — выберите любой удобный
              способ связи. Буду рад обсудить ваш проект!</p>
            <div className="contact-links">
              <a href="mailto:gafarovakbar@mail.ru" className="btn-primary">Email</a>
              <a href="https://t.me/supremeHn" target="_blank" className="btn-outline">Telegram</a>
            </div>
          </div>
        </div>
      </section>

      <footer className="footer">
        <span>GA</span> · © 2026 Гафаров Акбар Маруфович
      </footer>

      {/* ══════ MODAL ══════ */}
      <div className="modal" id="cert-modal">
        <div className="modal-backdrop" onClick={() => toggleModal(false)}></div>
        <div className="modal-content">
          <button className="modal-close" onClick={() => toggleModal(false)}>&times;</button>
          <div className="modal-body">
            <embed src="/100 СВИДЕТЕЛЬСТВО.pdf" type="application/pdf" width="100%" height="800px" />
          </div>
        </div>
      </div>

      {/* ══════ IMAGE MODAL ══════ */}
      {fullscreenImgUrl && (
        <div 
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/90 cursor-zoom-out p-4"
          onClick={() => setFullscreenImgUrl(null)}
          style={{ backdropFilter: 'blur(10px)' }}
        >
          <button 
            className="absolute top-6 right-6 text-white text-4xl leading-none hover:text-[var(--primary)] transition-colors"
            onClick={() => setFullscreenImgUrl(null)}
          >
            &times;
          </button>
          <img 
            src={fullscreenImgUrl} 
            alt="Fullscreen View" 
            className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl border border-white/10" 
            onClick={(e) => e.stopPropagation()} 
          />
        </div>
      )}
    </>
  )
}

export default App
