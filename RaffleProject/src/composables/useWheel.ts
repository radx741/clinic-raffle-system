import { ref, type Ref } from 'vue';
import { gsap } from 'gsap';

export interface WheelOptions {
  canvas: Ref<HTMLCanvasElement | null>;
  names: Ref<string[]>;
  onSpinEnd?: (winner: string) => void;
}

// GSH Brand palette — 4 brand colors cycling
const COLORS = [
  '#433A96',   // deep purple
  '#00AEEF',   // cyan
  '#5B3FA6',   // medium purple
  '#7EC8E3',   // light sky blue
];

export function useWheel({ canvas, names, onSpinEnd }: WheelOptions) {
  const spinning = ref(false);
  const currentRotation = ref(0);

  function getCtx() {
    return canvas.value?.getContext('2d') ?? null;
  }

  function drawWheel(rotation = 0) {
    const ctx = getCtx();
    const el = canvas.value;
    if (!ctx || !el) return;

    const dpr = window.devicePixelRatio || 1;
    const size = Math.min(el.clientWidth, el.clientHeight);
    el.width = size * dpr;
    el.height = size * dpr;
    ctx.scale(dpr, dpr);

    const cx = size / 2;
    const cy = size / 2;
    const radius = size / 2 - 16;
    const list = names.value;
    const sliceCount = Math.min(list.length, 80);
    const sliceAngle = (2 * Math.PI) / sliceCount;

    ctx.clearRect(0, 0, size, size);

    // Outer glow ring
    ctx.beginPath();
    ctx.arc(cx, cy, radius + 10, 0, 2 * Math.PI);
    ctx.fillStyle = 'rgba(0, 174, 239, 0.12)';
    ctx.fill();

    // Outer ring — cyan
    ctx.beginPath();
    ctx.arc(cx, cy, radius + 6, 0, 2 * Math.PI);
    ctx.strokeStyle = '#00AEEF';
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.fillStyle = '#00AEEF';
    ctx.fill();

    // Inner shadow ring
    ctx.beginPath();
    ctx.arc(cx, cy, radius + 3, 0, 2 * Math.PI);
    ctx.fillStyle = 'rgba(67, 58, 150, 0.3)';
    ctx.fill();

    // Draw slices
    for (let i = 0; i < sliceCount; i++) {
      const startAngle = rotation + i * sliceAngle;
      const endAngle = startAngle + sliceAngle;

      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, radius, startAngle, endAngle);
      ctx.closePath();
      ctx.fillStyle = COLORS[i % COLORS.length]!;
      ctx.fill();

      // Subtle slice divider
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
      ctx.lineWidth = 1;
      ctx.stroke();

      // Text
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(startAngle + sliceAngle / 2);

      const nameIndex = i % list.length;
      const name = list[nameIndex] || '';
      const maxLen = sliceCount > 30 ? 8 : 14;
      const displayName = name.length > maxLen ? name.substring(0, maxLen) + '..' : name;

      ctx.fillStyle = '#FFFFFF';
      const fontSize = sliceCount > 40 ? 9 : sliceCount > 20 ? 11 : 13;
      ctx.font = `500 ${fontSize}px 'Inter', -apple-system, sans-serif`;
      ctx.textAlign = 'right';
      ctx.textBaseline = 'middle';
      ctx.fillText(displayName, radius - 18, 0);
      ctx.restore();
    }

    // Center hub — outer glow ring
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, 48, 0, 2 * Math.PI);
    ctx.strokeStyle = '#00AEEF';
    ctx.lineWidth = 4;
    ctx.globalAlpha = 0.5;
    ctx.stroke();
    ctx.globalAlpha = 1;
    ctx.restore();

    // Center hub — border
    ctx.beginPath();
    ctx.arc(cx, cy, 44, 0, 2 * Math.PI);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.lineWidth = 3;
    ctx.stroke();

    // Center hub — gradient fill
    const grad = ctx.createLinearGradient(cx - 38, cy - 38, cx + 38, cy + 38);
    grad.addColorStop(0, '#5B3FA6');
    grad.addColorStop(1, '#00AEEF');
    ctx.beginPath();
    ctx.arc(cx, cy, 42, 0, 2 * Math.PI);
    ctx.fillStyle = grad;
    ctx.shadowColor = 'rgba(0, 174, 239, 0.4)';
    ctx.shadowBlur = 20;
    ctx.fill();
    ctx.shadowBlur = 0;

    // Center hub — highlight
    ctx.beginPath();
    ctx.arc(cx, cy - 6, 26, Math.PI, 2 * Math.PI);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.fill();

    // Center text
    ctx.fillStyle = '#FFFFFF';
    ctx.font = "700 18px 'Inter', -apple-system, sans-serif";
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.letterSpacing = '0.1em';
    ctx.fillText('SPIN', cx, cy + 1);
  }

  function drawPointer() {
    const ctx = getCtx();
    const el = canvas.value;
    if (!ctx || !el) return;

    const size = Math.min(el.clientWidth, el.clientHeight);
    const cx = size / 2;
    const radius = size / 2 - 16;

    // Pointer — cyan triangle with drop shadow
    ctx.save();
    ctx.shadowColor = '#433A96';
    ctx.shadowBlur = 8;
    ctx.shadowOffsetY = 2;

    const pointerTip = radius + 6 - (size / 2 - 16) + 38;

    ctx.beginPath();
    ctx.moveTo(cx, pointerTip);
    ctx.lineTo(cx - 16, pointerTip - 28);
    ctx.lineTo(cx + 16, pointerTip - 28);
    ctx.closePath();
    ctx.fillStyle = '#00AEEF';
    ctx.fill();
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.restore();

    // Small circle at pointer base
    ctx.beginPath();
    ctx.arc(cx, pointerTip - 28, 5, 0, 2 * Math.PI);
    ctx.fillStyle = '#00AEEF';
    ctx.fill();
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 2;
    ctx.stroke();
  }

  function render(rotation = 0) {
    drawWheel(rotation);
    drawPointer();
  }

  function spin() {
    if (spinning.value || names.value.length === 0) return;

    spinning.value = true;

    // Pick winner using crypto RNG
    const arr = new Uint32Array(1);
    crypto.getRandomValues(arr);
    const winnerIndex = arr[0]! % names.value.length;

    const sliceCount = Math.min(names.value.length, 80);
    const sliceAngle = (2 * Math.PI) / sliceCount;
    const visualIndex = winnerIndex % sliceCount;

    const targetAngle = -Math.PI / 2 - visualIndex * sliceAngle - sliceAngle / 2;

    const TWO_PI = 2 * Math.PI;
    const normalizedTarget = ((targetAngle % TWO_PI) + TWO_PI) % TWO_PI;

    const fullSpins = (8 + Math.random() * 4) * TWO_PI;
    const baseRotation = currentRotation.value + fullSpins;
    const normalizedBase = ((baseRotation % TWO_PI) + TWO_PI) % TWO_PI;
    let extraNeeded = normalizedTarget - normalizedBase;
    if (extraNeeded <= 0) extraNeeded += TWO_PI;

    const finalRotation = baseRotation + extraNeeded;

    const obj = { rotation: currentRotation.value };

    gsap.to(obj, {
      rotation: finalRotation,
      duration: 5 + Math.random() * 2,
      ease: 'power4.out',
      onUpdate: () => {
        currentRotation.value = obj.rotation;
        render(obj.rotation);
      },
      onComplete: () => {
        currentRotation.value = finalRotation;
        render(finalRotation);
        spinning.value = false;

        // Derive winner from actual visual position to guarantee consistency
        const TWO_PI2 = 2 * Math.PI;
        const normRot = ((finalRotation % TWO_PI2) + TWO_PI2) % TWO_PI2;
        // Pointer is at -PI/2 (top); find which slice is there
        const pointerAngle = ((-Math.PI / 2 - normRot) % TWO_PI2 + TWO_PI2) % TWO_PI2;
        const landedIndex = Math.floor(pointerAngle / sliceAngle) % sliceCount;
        const nameIndex = landedIndex % names.value.length;
        const winner = names.value[nameIndex]!;
        onSpinEnd?.(winner);
      },
    });
  }

  function init() {
    render(currentRotation.value);
  }

  function handleClick(e: MouseEvent) {
    const el = canvas.value;
    if (!el || spinning.value) return;

    const rect = el.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;
    const dist = Math.sqrt(x * x + y * y);

    if (dist < 44) {
      spin();
    }
  }

  return {
    spinning,
    spin,
    init,
    render,
    handleClick,
  };
}
