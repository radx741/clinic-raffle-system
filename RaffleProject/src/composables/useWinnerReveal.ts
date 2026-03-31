import { ref, type Ref } from 'vue';

export interface WinnerRevealOptions {
  canvas: Ref<HTMLCanvasElement | null>;
}

const ANIM_DUR = 8000;

function easeOut(t: number) { return 1 - Math.pow(1 - t, 3); }
function easeInOut(t: number) { return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }
function elasticOut(t: number) {
  if (t === 0 || t === 1) return t;
  return Math.pow(2, -10 * t) * Math.sin((t * 0.75 - 0.075) * (2 * Math.PI) / 0.3) + 1;
}
function clamp(v: number, a: number, b: number) { return Math.max(a, Math.min(b, v)); }
function hexRgba(hex: string, a = 1) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${a})`;
}

// ─── Brand colors ───
const PRIMARY = '#433A96';
const ACCENT = '#5B3FA6';
const CYAN = '#00AEEF';
const SKY = '#7EC8E3';
const LAVENDER = '#C5B8F8';
const TEXT_COLOR = '#FFFFFF';
const BG_COLOR = PRIMARY; // deep purple overlay

// ─── Ring particles: orbit around center ───
interface RingParticle {
  angle: number;
  radius: number;
  speed: number;
  size: number;
  color: string;
  phase: number;
}

function createRingParticles(): RingParticle[] {
  const colors = [CYAN, SKY, LAVENDER, PRIMARY, TEXT_COLOR];
  return Array.from({ length: 60 }, () => ({
    angle: Math.random() * Math.PI * 2,
    radius: 0.2 + Math.random() * 0.25,
    speed: 0.3 + Math.random() * 0.6,
    size: 1.5 + Math.random() * 2.5,
    color: colors[Math.floor(Math.random() * colors.length)]!,
    phase: Math.random() * Math.PI * 2,
  }));
}

// ─── Confetti: burst from top center ───
interface ConfettiParticle {
  x: number; y: number; vx: number; vy: number;
  size: number; color: string; rotation: number; rotSpeed: number;
  gravity: number; opacity: number; shape: 'rect' | 'circle' | 'strip';
}

function createConfetti(W: number): ConfettiParticle[] {
  const colors = [PRIMARY, ACCENT, CYAN, SKY, LAVENDER, TEXT_COLOR];
  const shapes: ('rect' | 'circle' | 'strip')[] = ['rect', 'circle', 'strip'];
  return Array.from({ length: 200 }, () => {
    const angle = -Math.PI / 2 + (Math.random() - 0.5) * Math.PI * 0.8;
    const force = 6 + Math.random() * 12;
    return {
      x: W * (0.3 + Math.random() * 0.4),
      y: -10 - Math.random() * 40,
      vx: Math.cos(angle) * force * (Math.random() - 0.5) * 2,
      vy: Math.abs(Math.sin(angle)) * force * 0.5 + Math.random() * 2,
      size: 4 + Math.random() * 8,
      color: colors[Math.floor(Math.random() * colors.length)]!,
      rotation: Math.random() * 360,
      rotSpeed: (Math.random() - 0.5) * 20,
      gravity: 0.12 + Math.random() * 0.08,
      opacity: 1,
      shape: shapes[Math.floor(Math.random() * shapes.length)]!,
    };
  });
}

// ─── Starburst rays ───
interface Ray {
  angle: number;
  length: number;
  width: number;
  speed: number;
}

function createRays(): Ray[] {
  return Array.from({ length: 24 }, (_, i) => ({
    angle: (i / 24) * Math.PI * 2,
    length: 0.3 + Math.random() * 0.4,
    width: 0.5 + Math.random() * 1.5,
    speed: 0.2 + Math.random() * 0.3,
  }));
}

export function useWinnerReveal({ canvas }: WinnerRevealOptions) {
  const showing = ref(false);
  let animFrame = 0;
  let animStart = 0;
  let winnerName = '';
  let confettiParticles: ConfettiParticle[] = [];
  let confettiSpawned = false;
  let onCloseCallback: (() => void) | null = null;

  const ringParticles = createRingParticles();
  const rays = createRays();

  function phase(t: number, start: number, end: number) {
    return clamp((t - start) / (end - start), 0, 1);
  }

  function drawFrame(t: number, realTime: number) {
    const el = canvas.value;
    if (!el) return;
    const ctx = el.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const W = el.clientWidth;
    const H = el.clientHeight;
    el.width = W * dpr;
    el.height = H * dpr;
    ctx.scale(dpr, dpr);

    const centerX = W / 2;
    const centerY = H * 0.44;
    const rt = realTime;

    // ─── Background — deep purple overlay ───
    const bgAlpha = easeOut(phase(t, 0, 0.06));
    ctx.globalAlpha = 1;
    // Fill with brand purple overlay
    ctx.fillStyle = 'rgba(67, 58, 150, 0.93)';
    ctx.fillRect(0, 0, W, H);

    // Radial gradient — subtle light center
    if (bgAlpha > 0) {
      const vg = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, W * 0.7);
      vg.addColorStop(0, hexRgba(CYAN, 0.08));
      vg.addColorStop(0.4, hexRgba(PRIMARY, 0.3));
      vg.addColorStop(1, hexRgba('#1A1A2E', 0.4));
      ctx.globalAlpha = bgAlpha;
      ctx.fillStyle = vg;
      ctx.fillRect(0, 0, W, H);
      ctx.globalAlpha = 1;
    }

    // ─── Starburst rays from center ───
    const rayP = phase(t, 0.15, 0.40);
    if (rayP > 0) {
      ctx.save();
      const rayAlpha = easeOut(rayP) * 0.06;
      const maxR = Math.max(W, H) * 0.9;
      for (const ray of rays) {
        const pulse = 0.7 + 0.3 * Math.sin(rt * 8 + ray.speed * 20);
        ctx.globalAlpha = rayAlpha * pulse;
        ctx.strokeStyle = CYAN;
        ctx.lineWidth = ray.width;
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.lineTo(
          centerX + Math.cos(ray.angle + rt * ray.speed) * maxR * ray.length,
          centerY + Math.sin(ray.angle + rt * ray.speed) * maxR * ray.length
        );
        ctx.stroke();
      }
      ctx.restore();
    }

    // ─── Pulsing ring — expands outward ───
    const ringP = phase(t, 0.20, 0.50);
    if (ringP > 0) {
      const radius = easeOut(ringP) * Math.min(W, H) * 0.35;
      ctx.save();
      ctx.globalAlpha = (1 - ringP) * 0.3;
      ctx.strokeStyle = CYAN;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();

      // Second ring, delayed
      const ring2P = phase(t, 0.28, 0.55);
      if (ring2P > 0) {
        const r2 = easeOut(ring2P) * Math.min(W, H) * 0.35;
        ctx.save();
        ctx.globalAlpha = (1 - ring2P) * 0.2;
        ctx.strokeStyle = SKY;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(centerX, centerY, r2, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }
    }

    // ─── Orbiting ring particles ───
    const orbitP = phase(t, 0.30, 1.0);
    if (orbitP > 0) {
      ctx.save();
      const orbitRadius = Math.min(W, H) * 0.28;
      for (const p of ringParticles) {
        const a = p.angle + rt * p.speed * 4;
        const r = orbitRadius * p.radius;
        const pulse = 0.5 + 0.5 * Math.sin(rt * 6 + p.phase);
        ctx.globalAlpha = orbitP * 0.5 * pulse;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(
          centerX + Math.cos(a) * r,
          centerY + Math.sin(a) * r,
          p.size, 0, Math.PI * 2
        );
        ctx.fill();
      }
      ctx.restore();
    }

    // ─── "W I N N E R" label — cyan ───
    const winLblP = phase(t, 0.12, 0.28);
    if (winLblP > 0) {
      ctx.save();
      const lAlpha = easeOut(winLblP);
      ctx.globalAlpha = lAlpha;
      const yOff = (1 - easeOut(winLblP)) * 30;
      ctx.font = `600 13px 'Inter', -apple-system, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = CYAN;
      ctx.shadowColor = CYAN;
      ctx.shadowBlur = 20 * lAlpha;
      ctx.letterSpacing = '0.15em';
      ctx.fillText('W I N N E R', centerX, centerY - H * 0.12 + yOff);
      ctx.shadowBlur = 0;
      ctx.restore();
    }

    // ─── Horizontal accent lines flanking "WINNER" ───
    const lineP = phase(t, 0.22, 0.38);
    if (lineP > 0) {
      const lineW = W * 0.18 * easeOut(lineP);
      const lineY = centerY - H * 0.12;
      ctx.save();
      ctx.globalAlpha = easeOut(lineP) * 0.4;

      const lgL = ctx.createLinearGradient(centerX - 140 - lineW, 0, centerX - 140, 0);
      lgL.addColorStop(0, hexRgba(CYAN, 0));
      lgL.addColorStop(1, CYAN);
      ctx.strokeStyle = lgL;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(centerX - 140, lineY);
      ctx.lineTo(centerX - 140 - lineW, lineY);
      ctx.stroke();

      const lgR = ctx.createLinearGradient(centerX + 140, 0, centerX + 140 + lineW, 0);
      lgR.addColorStop(0, CYAN);
      lgR.addColorStop(1, hexRgba(CYAN, 0));
      ctx.strokeStyle = lgR;
      ctx.beginPath();
      ctx.moveTo(centerX + 140, lineY);
      ctx.lineTo(centerX + 140 + lineW, lineY);
      ctx.stroke();

      ctx.restore();
    }

    // ─── Winner name — large, white, glowing ───
    const nameP = phase(t, 0.25, 0.45);
    if (nameP > 0) {
      const scale = elasticOut(nameP);
      const maxFs = Math.min(72, W / ((winnerName.length + 1) * 0.55));
      const fs = maxFs * scale;
      ctx.save();
      ctx.globalAlpha = Math.min(nameP * 2.5, 1);
      ctx.font = `700 ${fs}px 'Inter', -apple-system, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      // Double glow — cyan outer, white inner
      ctx.shadowColor = CYAN;
      ctx.shadowBlur = 60;
      ctx.fillStyle = TEXT_COLOR;
      ctx.fillText('@' + winnerName, centerX, centerY);
      ctx.shadowColor = TEXT_COLOR;
      ctx.shadowBlur = 20;
      ctx.fillText('@' + winnerName, centerX, centerY);

      ctx.shadowBlur = 0;
      ctx.restore();
    }

    // ─── Underline — gradient bar below name ───
    const ulP = phase(t, 0.40, 0.55);
    if (ulP > 0) {
      const barW = W * 0.35 * easeInOut(ulP);
      const barY = centerY + H * 0.06;
      const barH = 3;
      ctx.save();
      ctx.globalAlpha = easeOut(ulP) * 0.8;
      const grad = ctx.createLinearGradient(centerX - barW / 2, 0, centerX + barW / 2, 0);
      grad.addColorStop(0, hexRgba(CYAN, 0));
      grad.addColorStop(0.3, CYAN);
      grad.addColorStop(0.5, LAVENDER);
      grad.addColorStop(0.7, CYAN);
      grad.addColorStop(1, hexRgba(CYAN, 0));
      ctx.fillStyle = grad;
      ctx.fillRect(centerX - barW / 2, barY, barW, barH);
      ctx.restore();
    }

    // ─── Confetti — rains from top ───
    if (t >= 0.35 && !confettiSpawned) {
      confettiSpawned = true;
      confettiParticles = createConfetti(W);
    }
    if (confettiParticles.length > 0 && t >= 0.35) {
      ctx.save();
      for (const p of confettiParticles) {
        p.vy += p.gravity;
        p.vx += (Math.random() - 0.5) * 0.1;
        p.x += p.vx;
        p.y += p.vy;
        p.rotation += p.rotSpeed;
        p.vx *= 0.995;
        if (p.y > H + 30) p.opacity = Math.max(0, p.opacity - 0.02);

        if (p.opacity <= 0) continue;
        ctx.globalAlpha = p.opacity * 0.9;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rotation * Math.PI) / 180);
        ctx.fillStyle = p.color;

        if (p.shape === 'rect') {
          ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.55);
        } else if (p.shape === 'circle') {
          ctx.beginPath();
          ctx.arc(0, 0, p.size * 0.4, 0, Math.PI * 2);
          ctx.fill();
        } else {
          ctx.fillRect(-p.size * 0.15, -p.size / 2, p.size * 0.3, p.size);
        }

        ctx.restore();
      }
      ctx.restore();
    }

    // ─── "Congratulations" subtitle ───
    const congratsP = phase(t, 0.55, 0.70);
    if (congratsP > 0) {
      ctx.save();
      ctx.globalAlpha = easeOut(congratsP);
      const yOff = (1 - easeOut(congratsP)) * 15;
      ctx.font = `500 ${20}px 'Inter', -apple-system, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = hexRgba(SKY, 0.9);
      ctx.fillText('Congratulations!', centerX, centerY + H * 0.13 + yOff);
      ctx.restore();
    }

    // ─── Ambient sparkles (continuous shimmer) ───
    if (t > 0.30) {
      ctx.save();
      const sparkCount = 50;
      for (let i = 0; i < sparkCount; i++) {
        const seed = i * 137.508;
        const sx = ((seed * 1.1) % 1) * W;
        const sy = ((seed * 0.7) % 1) * H;
        const twinkle = 0.5 + 0.5 * Math.sin(rt * 10 + seed);
        const fadeIn = clamp((t - 0.30) / 0.15, 0, 1);
        ctx.globalAlpha = twinkle * 0.4 * fadeIn;
        ctx.fillStyle = i % 3 === 0 ? CYAN : i % 3 === 1 ? SKY : TEXT_COLOR;
        ctx.beginPath();
        ctx.arc(sx, sy, 1 + (i % 3), 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }
  }

  function animLoop(ts: number) {
    if (!showing.value) return;
    const elapsed = ts - animStart;
    const t = Math.min(elapsed / ANIM_DUR, 1);

    drawFrame(t, performance.now() / 1000);

    if (t < 1) {
      animFrame = requestAnimationFrame(animLoop);
    } else {
      // Keep sparkles and orbiting particles alive after animation ends
      const loopFrame = () => {
        if (!showing.value) return;
        drawFrame(1, performance.now() / 1000);
        animFrame = requestAnimationFrame(loopFrame);
      };
      animFrame = requestAnimationFrame(loopFrame);
    }
  }

  function show(name: string, onClose?: () => void) {
    winnerName = name;
    showing.value = true;
    confettiSpawned = false;
    confettiParticles = [];
    onCloseCallback = onClose || null;
    animStart = performance.now();
    animFrame = requestAnimationFrame(animLoop);
  }

  function close() {
    showing.value = false;
    cancelAnimationFrame(animFrame);
    confettiParticles = [];
    onCloseCallback?.();
  }

  function handleClick() {
    const elapsed = performance.now() - animStart;
    if (elapsed > ANIM_DUR * 0.65) {
      close();
    }
  }

  return {
    showing,
    show,
    close,
    handleClick,
  };
}
