import { useEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import './style.css'
import OrbitingSkills from './components/ui/orbiting-skills'
import RadialOrbitalTimeline from "./components/ui/radial-orbital-timeline";
import DigitalProjectSphere, { type DigitalProject } from './components/ui/digital-project-sphere';

const digitalProjects: DigitalProject[] = [
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
  { id: 11, name: 'Шляпный бутик', url: 'https://shlyapa-one.vercel.app', img: '/legacy/11.jpg', desc: 'Магазин головных уборов премиум-класса' },
];

type WorkplaceAiStatus = 'idle' | 'uploading' | 'generating' | 'done' | 'error';

const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY || ''; // TODO: move to backend-only env before production.
const OPENAI_IMAGE_EDIT_ENDPOINT = 'https://api.openai.com/v1/images/edits';
const OPENAI_IMAGE_MODEL = 'gpt-image-2';
const OPENAI_IMAGE_FALLBACK_MODELS = ['gpt-image-1.5', 'gpt-image-1'];
const OPENAI_IMAGE_QUALITY = 'high';
const OPENAI_INPUT_FIDELITY = 'high';
const OPENAI_IMAGE_REQUEST_TIMEOUT_MS = 90000;
const ME_REFERENCE_PUBLIC_FILE = 'public/me/me.png';
const ME_REFERENCE_PATH = '/me/me.png';

const WORKPLACE_AI_PROMPT = `Edit the first input image while preserving the man from the first input image as exactly as possible.

The first input image is the source photo of the real person. The protected/masked region contains the man. Keep the man's face, eyes, eyelids, eyebrows, nose, mouth, jawline, cheeks, skin tone, hairstyle, hairline, age, expression, black t-shirt, watch, arms, hands, and body proportions as close to the first image as possible. Do not redraw, beautify, average, age, de-age, change ethnicity, change facial proportions, or invent a similar-looking person. The final face must remain recognizably the same real person from the first image.

The second input image is the target workplace or room. Use it as the environment reference. Replace or adapt the editable background/workspace around the protected man so the final image looks like he is sitting in the user's workplace.

If the second image already has a visible desk, table, chair, laptop, monitor, or work area, blend the protected man naturally into that existing workspace. If the second image does not have a usable desk or work area, keep the desk, chair, laptop, monitor setup, and working posture from the first input image and adapt the surrounding room to the second image.

Match lighting, shadows, contact shadows, reflections, color temperature, depth of field, camera quality, and realism around the person. The environment may change, but the man's face and body should not become a newly generated person.

Do not output a collage, split-screen, before/after view, sticker, poster, painting, cartoon, or UI mockup. Do not add extra people. Do not distort the face. Do not include labels, captions, borders, or text.`;

const readFileAsDataUrl = (file: File) => new Promise<string>((resolve, reject) => {
  const reader = new FileReader();
  reader.onload = () => resolve(String(reader.result));
  reader.onerror = () => reject(new Error('Не удалось прочитать изображение.'));
  reader.readAsDataURL(file);
});

const loadImage = (src: string) => new Promise<HTMLImageElement>((resolve, reject) => {
  const image = new Image();
  if (src.startsWith('http')) {
    image.crossOrigin = 'anonymous';
  }
  image.onload = () => resolve(image);
  image.onerror = () => reject(new Error(src === ME_REFERENCE_PATH ? `Не найдено фото для вставки. Положите файл сюда: ${ME_REFERENCE_PUBLIC_FILE} (в браузере путь будет ${ME_REFERENCE_PATH})` : 'Не удалось загрузить изображение.'));
  image.src = src;
});

const drawContain = (ctx: CanvasRenderingContext2D, image: HTMLImageElement, x: number, y: number, width: number, height: number) => {
  const sourceRatio = image.naturalWidth / image.naturalHeight;
  const targetRatio = width / height;
  let targetWidth = width;
  let targetHeight = height;
  let targetX = x;
  let targetY = y;

  if (sourceRatio > targetRatio) {
    targetHeight = width / sourceRatio;
    targetY = y + (height - targetHeight) / 2;
  } else {
    targetWidth = height * sourceRatio;
    targetX = x + (width - targetWidth) / 2;
  }

  ctx.drawImage(image, targetX, targetY, targetWidth, targetHeight);
};

const createImageFile = async (src: string, filename: string, type: 'image/jpeg' | 'image/png' = 'image/jpeg') => {
  const image = await loadImage(src);
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 1024;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas недоступен в этом браузере.');

  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  drawContain(ctx, image, 0, 0, canvas.width, canvas.height);

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(blob => {
      if (blob) resolve(blob);
      else reject(new Error(`Не удалось подготовить изображение ${filename}.`));
    }, type, type === 'image/jpeg' ? 0.9 : undefined);
  });
};

const isRetryableOpenAiImageError = (message: string) => {
  const normalized = message.toLowerCase();
  return normalized.includes('input_fidelity')
    || normalized.includes('unsupported')
    || normalized.includes('invalid_value')
    || normalized.includes('param')
    || normalized.includes('model')
    || normalized.includes('долго отвечает')
    || normalized.includes('timeout');
};

const createIdentityMaskFile = async (src: string) => {
  const image = await loadImage(src);
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 1024;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas недоступен в этом браузере.');

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const sourceRatio = image.naturalWidth / image.naturalHeight;
  const targetRatio = canvas.width / canvas.height;
  let imageWidth = canvas.width;
  let imageHeight = canvas.height;
  let imageX = 0;
  let imageY = 0;

  if (sourceRatio > targetRatio) {
    imageHeight = canvas.width / sourceRatio;
    imageY = (canvas.height - imageHeight) / 2;
  } else {
    imageWidth = canvas.height * sourceRatio;
    imageX = (canvas.width - imageWidth) / 2;
  }

  const protectStart = imageX + imageWidth * 0.43;
  const solidStart = imageX + imageWidth * 0.54;
  const protectTop = imageY + imageHeight * 0.04;
  const protectHeight = imageHeight * 0.94;

  const feather = ctx.createLinearGradient(protectStart, 0, solidStart, 0);
  feather.addColorStop(0, 'rgba(0, 0, 0, 0)');
  feather.addColorStop(1, 'rgba(0, 0, 0, 1)');
  ctx.fillStyle = feather;
  ctx.fillRect(protectStart, protectTop, solidStart - protectStart, protectHeight);

  ctx.fillStyle = 'rgba(0, 0, 0, 1)';
  ctx.fillRect(solidStart, protectTop, imageX + imageWidth - solidStart, protectHeight);

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(blob => {
      if (blob) resolve(blob);
      else reject(new Error('Не удалось подготовить маску для сохранения лица.'));
    }, 'image/png');
  });
};

const extractOpenAiError = (payload: unknown) => {
  if (!payload) return 'OpenAI не смог сгенерировать изображение.';
  if (typeof payload === 'string') return payload;
  if (typeof payload !== 'object') return String(payload);

  const data = payload as Record<string, unknown>;
  const candidates = [data.error, data.detail, data.message];
  for (const candidate of candidates) {
    if (!candidate) continue;
    if (typeof candidate === 'string') return candidate;
    if (typeof candidate === 'object') {
      const nested = candidate as Record<string, unknown>;
      if (typeof nested.message === 'string') return nested.message;
      if (typeof nested.detail === 'string') return nested.detail;
      return JSON.stringify(candidate);
    }
    return String(candidate);
  }

  return JSON.stringify(payload);
};

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
  const [selectedDigitalProject, setSelectedDigitalProject] = useState<DigitalProject | null>(null);
  const [isWorkplaceModalOpen, setIsWorkplaceModalOpen] = useState(false);
  const [workplaceStatus, setWorkplaceStatus] = useState<WorkplaceAiStatus>('idle');
  const [workplacePreview, setWorkplacePreview] = useState<string | null>(null);
  const [workplaceResult, setWorkplaceResult] = useState<string | null>(null);
  const [workplaceError, setWorkplaceError] = useState('');
  const workplaceInputRef = useRef<HTMLInputElement | null>(null);

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
    gsap.set('.terminal-window, .hero-greeting, .hero-cmd, .hero-title, .hero-desc, .hero-btns, .hero-visual, .scroll-indicator, .workplace-cta, .contact-box', { opacity: 0, y: 30 });
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
       .to('.hero-visual', { opacity: 1, scale: 1, duration: 1, ease: 'power2.out' }, '-=0.8')
       .to('.scroll-indicator', { opacity: 1, y: 0, duration: 0.5 }, '-=0.2');

    // ── General Scroll Reveals ──
    document.querySelectorAll('.section-label, .about-card, .exp-card, .bento-card, .edu-card, .cert-item, .workplace-cta, .contact-box').forEach(el => {
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

    // ── Projects Horizontal ──
    const cleanupHandlers: Array<() => void> = [];
    const track = document.querySelector('.projects-track') as HTMLElement;
    if (track && window.innerWidth > 968) {
      const section = document.querySelector('.projects') as HTMLElement;
      let projectsScroll: ScrollTrigger | undefined;
      const getScrollDistance = () => Math.max(0, track.scrollWidth - window.innerWidth);
      const tl = gsap.to(track, {
        x: () => -getScrollDistance(),
        ease: "none",
        scrollTrigger: {
          trigger: ".projects",
          pin: true,
          scrub: 1,
          invalidateOnRefresh: true,
          end: () => "+=" + getScrollDistance(),
          onRefresh: self => {
            projectsScroll = self;
          },
        },
      });

      projectsScroll = tl.scrollTrigger;

      const onProjectsWheel = (event: WheelEvent) => {
        if (!projectsScroll?.isActive) return;

        const horizontalDelta = Math.abs(event.deltaX);
        const verticalDelta = Math.abs(event.deltaY);
        const scrollAmount = horizontalDelta > verticalDelta ? event.deltaX : event.shiftKey ? event.deltaY : 0;
        if (Math.abs(scrollAmount) < 1) return;

        event.preventDefault();
        window.scrollBy({ top: scrollAmount, left: 0, behavior: 'auto' });
      };

      section?.addEventListener('wheel', onProjectsWheel, { passive: false });
      cleanupHandlers.push(() => section?.removeEventListener('wheel', onProjectsWheel));

      document.querySelectorAll('.project-slide').forEach(slide => {
        const ghost = slide.querySelector('.project-ghost');
        if (ghost) gsap.to(ghost, { x: 100, scrollTrigger: { trigger: slide, containerAnimation: tl, scrub: true } });
      });
    }

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
      cleanupHandlers.forEach(cleanup => cleanup());
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

  const openWorkplaceModal = () => {
    setIsWorkplaceModalOpen(true);
    document.body.style.overflow = 'hidden';
  };

  const closeWorkplaceModal = () => {
    setIsWorkplaceModalOpen(false);
    document.body.style.overflow = '';
  };

  const resetWorkplaceAi = () => {
    setWorkplaceStatus('idle');
    setWorkplacePreview(null);
    setWorkplaceResult(null);
    setWorkplaceError('');
    if (workplaceInputRef.current) workplaceInputRef.current.value = '';
  };

  const handleWorkplaceFile = async (file?: File) => {
    if (!file) return;

    try {
      setWorkplaceStatus('uploading');
      setWorkplaceError('');
      setWorkplaceResult(null);
      const dataUrl = await readFileAsDataUrl(file);
      setWorkplacePreview(dataUrl);
      setWorkplaceStatus('idle');
    } catch (error) {
      setWorkplaceStatus('error');
      setWorkplaceError(error instanceof Error ? error.message : 'Не удалось загрузить фото рабочего места.');
    }
  };

  const generateWorkplaceImage = async () => {
    if (!workplacePreview) {
      setWorkplaceStatus('error');
      setWorkplaceError('Сначала загрузите фото рабочего места.');
      return;
    }

    try {
      setWorkplaceStatus('generating');
      setWorkplaceError('');
      setWorkplaceResult(null);

      if (!OPENAI_API_KEY) {
        throw new Error('Не задан VITE_OPENAI_API_KEY для генерации изображения.');
      }

      const [meBlob, workspaceBlob, maskBlob] = await Promise.all([
        createImageFile(ME_REFERENCE_PATH, 'me.png', 'image/png'),
        createImageFile(workplacePreview, 'workspace.jpg'),
        createIdentityMaskFile(ME_REFERENCE_PATH),
      ]);

      const createEditPayload = (model: string) => {
        const formData = new FormData();
        formData.append('model', model);
        formData.append('prompt', WORKPLACE_AI_PROMPT);
        formData.append('image[]', meBlob, 'me.png');
        formData.append('image[]', workspaceBlob, 'workspace.jpg');
        formData.append('mask', maskBlob, 'identity-mask.png');
        formData.append('size', '1024x1024');
        formData.append('quality', OPENAI_IMAGE_QUALITY);
        if (model !== 'gpt-image-2') {
          formData.append('input_fidelity', OPENAI_INPUT_FIDELITY);
        }
        formData.append('output_format', 'png');
        formData.append('n', '1');
        return formData;
      };

      const requestEdit = async (model: string) => {
        const controller = new AbortController();
        const timeout = window.setTimeout(() => controller.abort(), OPENAI_IMAGE_REQUEST_TIMEOUT_MS);

        try {
          const response = await fetch(OPENAI_IMAGE_EDIT_ENDPOINT, {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${OPENAI_API_KEY}`,
            },
            body: createEditPayload(model),
            signal: controller.signal,
          });

          const rawText = await response.text();
          let payload: any = null;
          try {
            payload = JSON.parse(rawText);
          } catch { /* OpenAI should return JSON; keep payload null for readable fallback. */ }

          if (!response.ok) {
            throw new Error(extractOpenAiError(payload));
          }

          return payload;
        } catch (error) {
          if (error instanceof Error && error.name === 'AbortError') {
            throw new Error(`${model} слишком долго отвечает. Пробую другую модель.`);
          }
          throw error;
        } finally {
          window.clearTimeout(timeout);
        }
      };

      let payload: any;
      try {
        payload = await requestEdit(OPENAI_IMAGE_MODEL);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        if (!isRetryableOpenAiImageError(message)) {
          throw error;
        }

        let fallbackError = error;
        for (const fallbackModel of OPENAI_IMAGE_FALLBACK_MODELS) {
          try {
            payload = await requestEdit(fallbackModel);
            fallbackError = null;
            break;
          } catch (nextError) {
            fallbackError = nextError;
            const fallbackMessage = nextError instanceof Error ? nextError.message : String(nextError);
            if (!isRetryableOpenAiImageError(fallbackMessage)) {
              break;
            }
          }
        }

        if (fallbackError) {
          throw fallbackError;
        }
      }

      const imageBase64 = payload?.data?.[0]?.b64_json;
      if (imageBase64) {
        setWorkplaceResult(`data:image/png;base64,${imageBase64}`);
      } else {
        throw new Error('OpenAI вернул ответ без изображения.');
      }

      setWorkplaceStatus('done');
    } catch (error) {
      setWorkplaceStatus('error');
      setWorkplaceError(error instanceof Error ? error.message : 'Произошла ошибка генерации.');
    }
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
                    <a href="mailto:gafarovakbar@mail.ru" className="btn-outline">Связаться</a>
                  </div>
                </div>
              </div>
            </div>

            <div className="hero-visual">
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
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path
                      d="M12 21v-8m4-4h-8a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2v-6a2 2 0 0 0-2-2Zm0-4V5a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v2" />
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
              <div className="bento-decoration dek-window">
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
              <div className="bento-decoration dek-orbit">
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
              <div className="bento-decoration dek-progress">
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
              <h2 className="section-title">Лучшие <span data-value="Проекты"></span></h2>
            </div>
            <div className="projects-scroll-hint">ЛИСТАЙТЕ ГОРИЗОНТАЛЬНО</div>
          </div>
        </div>
        <div className="projects-track-wrapper">
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
                    <img src="/monitoring.jpg" alt="Мониторинг" className="project-img" />
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
                  <div className="browser-body p-0 overflow-hidden" style={{ background: '#0a0a0c', height: '480px' }}>
                    <RadialOrbitalTimeline timelineData={[
                      { id: 1, title: "KIBERone KLD", date: "2023", content: "Бот школы KIBERone: приём заявок, интеграция с CRM, рассылки.", category: "Bot", iconName: "messageSquare", relatedIds: [6], status: "completed", energy: 95 },
                      { id: 2, title: "Etagi KLD", date: "2023", content: "Бот компании Этажи: интеграция с CRM, умные ссылки.", category: "Bot", iconName: "home", relatedIds: [3], status: "completed", energy: 90 },
                      { id: 3, title: "AZTmoto", date: "2024", content: "Магазин мото-инвентаря: каталог и рассылки.", category: "Bot", iconName: "zap", relatedIds: [2], status: "completed", energy: 85 },
                      { id: 4, title: "Dreamcars39", date: "2024", content: "Аренда люкс авто: управление записями и расписанием.", iconName: "car", relatedIds: [2, 5], status: "completed", energy: 80, category: "Bot" },
                      { id: 5, title: "Kibernalog", date: "2024", content: "Процесс генерации документов для налогового вычета.", category: "Automation", iconName: "fileText", relatedIds: [1, 4], status: "completed", energy: 100 },
                      { id: 6, title: "KIBERone Visor", date: "2024", content: "Контроль родительских чатов и групп школы.", category: "Shield", iconName: "shieldCheck", relatedIds: [1], status: "completed", energy: 98 },
                      { id: 7, title: "All Interior", date: "2025", content: "Бот-консультант по подбору дизайна интерьера.", iconName: "messageSquare", relatedIds: [3, 4], status: "in-progress", energy: 70, category: "AI" },
                    ]} />
                  </div>
                </div>
                <div className="project-info">
                  <div className="project-num"><span className="num-val">03</span> АВТОМАТИЗАЦИЯ</div>
                  <h3 className="project-name">Telegram-боты для автоматизации</h3>
                  <p className="project-desc">Серия из 10+ Telegram-ботов для реальных бизнес-задач: налоговый вычет, учёт
                    медиафайлов, CRM-процессы.</p>
                  <ul className="project-tasks">
                    <li><strong>@kiberoneKLD_bot</strong> — CRM, рассылки, заявки</li>
                    <li><strong>@etagi_kaliningrad_bot</strong> — CRM, умные ссылки</li>
                    <li><strong>@AZTmoto_bot</strong> — Рассылки и каталог магазина</li>
                    <li><strong>@Dreamcars39_bot</strong> — Управление бронированием</li>
                    <li><strong>@kibernalog_bot</strong> — Генератор документов</li>
                    <li><strong>@KIBERoneVisor_bot</strong> — Контроль качества чатов</li>
                    <li><strong>@allinterior_bot</strong> — ИИ-консультант по дизайну</li>
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
              <div className="project-slide-content digital-project-slide-content" style={{ direction: 'rtl' }}>
                <div className="project-info" style={{ direction: 'ltr', textAlign: 'left' }}>
                  <div className="project-num"><span className="num-val">04</span> WEB-РАЗРАБОТКА</div>
                  <h3 className="project-name">Коммерческие digital-проекты</h3>
                  <p className="project-desc">Более 15 коммерческих сайтов и digital-решений для бизнеса Калининграда:
                    от лендингов до платформ с интеграцией и обработкой данных.</p>
                  <ul className="project-tasks digital-project-list">
                    {digitalProjects.map(project => (
                      <li key={project.id}>
                        <a href={project.url} target="_blank" rel="noopener noreferrer" className="project-bot-link">
                          <strong>{project.name}</strong>
                        </a>
                        <span> — {project.desc}</span>
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
                    <div
                      className="browser-dot red"
                      onClick={() => setSelectedDigitalProject(null)}
                      title="Назад к проектам"
                    ></div>
                    <div className="browser-dot yellow"></div>
                    <div className="browser-dot green"></div>
                    <div
                      className="browser-url browser-url-text"
                      onClick={() => selectedDigitalProject && window.open(selectedDigitalProject.url, '_blank', 'noopener,noreferrer')}
                      title={selectedDigitalProject ? 'Открыть сайт в новой вкладке' : 'Выберите проект'}
                    >
                      {selectedDigitalProject ? selectedDigitalProject.url.replace('https://', '') : 'vercel.app / projects'}
                    </div>
                  </div>
                  <div className="browser-body p-0 digital-projects-bg">
                    {selectedDigitalProject ? (
                      <div className="digital-project-preview">
                        <button
                          type="button"
                          className="iframe-back-btn"
                          onClick={() => setSelectedDigitalProject(null)}
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M19 12H5M12 19l-7-7 7-7" />
                          </svg>
                          Назад к проектам
                        </button>
                        <iframe
                          src={selectedDigitalProject.url}
                          title={selectedDigitalProject.name}
                          className="digital-project-frame"
                        ></iframe>
                      </div>
                    ) : (
                      <DigitalProjectSphere
                        projects={digitalProjects}
                        onProjectClick={setSelectedDigitalProject}
                      />
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
            <div className="edu-dates">2021 — 2025</div>
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

          <div className="workplace-cta">
            <div>
              <div className="workplace-cta-kicker">AI workplace preview</div>
              <h3>Проверьте, как я буду выглядеть на вашем рабочем месте</h3>
              <p>Сфотографируйте рабочее место — это займет меньше минуты.</p>
            </div>
            <button className="workplace-try-btn workplace-try-btn-large" type="button" onClick={openWorkplaceModal}>
              <span className="workplace-try-btn-icon">AI</span>
              <span>Попробуйте меня на своём рабочем месте</span>
              <span className="workplace-try-btn-arrow">→</span>
            </button>
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
              <a href="https://t.me/supremeHn" target="_blank" rel="noopener noreferrer" className="btn-outline">Telegram</a>
            </div>
          </div>
        </div>
      </section>

      {isWorkplaceModalOpen && (
        <div className="workplace-modal" role="dialog" aria-modal="true" aria-labelledby="workplace-modal-title">
          <div className="workplace-modal-backdrop" onClick={closeWorkplaceModal}></div>
          <div className="workplace-modal-content">
            <button className="workplace-modal-close" type="button" onClick={closeWorkplaceModal} aria-label="Закрыть">
              &times;
            </button>
            <div className="workplace-modal-header">
              <div className="workplace-modal-kicker">AI workplace preview</div>
              <h3 id="workplace-modal-title">Попробуйте меня на своём рабочем месте</h3>
              <p>Сфотографируйте рабочее место, это займет меньше минуты. Я аккуратно вставлю свою фотографию в вашу сцену.</p>
            </div>

            <input
              ref={workplaceInputRef}
              className="workplace-file-input"
              type="file"
              accept="image/*"
              capture="environment"
              onChange={event => handleWorkplaceFile(event.target.files?.[0])}
            />

            <button
              type="button"
              className="workplace-upload-zone"
              onClick={() => workplaceInputRef.current?.click()}
            >
              <span className="workplace-upload-icon">+</span>
              <strong>{workplacePreview ? 'Заменить фото рабочего места' : 'Снять или загрузить фото рабочего места'}</strong>
              <small>JPG, PNG или фото с камеры</small>
            </button>

            <div className="workplace-preview-grid">
              <div className="workplace-preview-card">
                <div className="workplace-preview-label">Ваше рабочее место</div>
                {workplacePreview ? (
                  <img src={workplacePreview} alt="Фото рабочего места" />
                ) : (
                  <div className="workplace-preview-empty">Фото пока не выбрано</div>
                )}
              </div>
            </div>

            {workplaceError && <div className="workplace-error">{workplaceError}</div>}

            <div className="workplace-actions">
              <button
                type="button"
                className="btn-primary workplace-generate-btn"
                onClick={generateWorkplaceImage}
                disabled={!workplacePreview || workplaceStatus === 'uploading' || workplaceStatus === 'generating'}
              >
                {workplaceStatus === 'generating' ? 'Генерирую...' : 'Сгенерировать пример'}
              </button>
              <button type="button" className="btn-outline workplace-reset-btn" onClick={resetWorkplaceAi}>
                Сбросить
              </button>
            </div>

            {(workplaceStatus === 'uploading' || workplaceStatus === 'generating') && (
              <div className="workplace-loading">
                <span></span>
                {workplaceStatus === 'uploading' ? 'Загружаю фото...' : 'OpenAI генерирует кадр. Если лучшая модель ответит слишком долго, я автоматически переключусь на резервную.'}
              </div>
            )}

            {workplaceResult && (
              <div className="workplace-result">
                <div className="workplace-preview-label">Результат</div>
                <img src={workplaceResult} alt="Сгенерированный пример на рабочем месте" />
                <a className="btn-primary workplace-download-btn" href={workplaceResult} download="akbar-workplace-preview.png">
                  Скачать
                </a>
              </div>
            )}
          </div>
        </div>
      )}

      <footer className="footer">
        <span>GA</span> · © 2025 Гафаров Акбар Маруфович
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
    </>
  )
}

export default App
