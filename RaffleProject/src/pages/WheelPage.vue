<template>
  <div class="wheel-page">
    <!-- Reset button floating top-right is below -->

    <!-- Reset button floating top-right -->
    <button
      v-if="winners.length > 0"
      class="floating-reset"
      :disabled="spinning"
      @click="resetWheel"
    >
      Reset All
    </button>

    <!-- Main content -->
    <div class="main-content">
      <!-- Wheel + count + winners all stacked center -->
      <div class="wheel-side">
        <img :src="logoUrl" alt="GSH Logo" class="wheel-logo" />
        <canvas
          ref="canvasRef"
          class="wheel-canvas"
          @click="handleClick"
        />
        <div class="participant-count">
          <span class="count-label">participants</span>
          <span class="count-number">{{ names.length }}</span>
        </div>
        <div v-if="winners.length > 0" class="winners-list">
          <div class="winners-title">Recent Winners</div>
          <div
            v-for="(w, i) in displayedWinners"
            :key="i"
            class="winner-row"
          >
            <span class="winner-rank">#{{ winners.length - i }}</span>
            <span class="winner-name">{{ w }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Winner reveal overlay -->
    <div v-if="revealShowing" class="reveal-overlay" @click="revealHandleClick">
      <canvas ref="revealCanvasRef" class="reveal-canvas" />
      <div class="reveal-buttons" :class="{ visible: revealButtonsVisible }">
        <button class="reveal-btn reveal-btn--spin" @click.stop="onSpinAgain">SPIN AGAIN</button>
        <button class="reveal-btn reveal-btn--done" @click.stop="onDone">CLOSE</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, nextTick, watch } from 'vue';
import { useWheel } from 'src/composables/useWheel';
import { useWinnerReveal } from 'src/composables/useWinnerReveal';
import Papa from 'papaparse';
import logoImg from 'src/assets/images/logo.png';
import bgImg from 'src/assets/images/bg.jpeg';

const logoUrl = logoImg;
const bgUrl = `url("${bgImg}")`;

// Collaborators / admins to exclude from the raffle
const EXCLUDED_USERS = new Set([
  'dr_amera_elsayed_dr.princess',
  'insta___om',
  'gsp.oman',
  'gsh_oman',
]);

const allNames = ref<string[]>([]);
const winners = ref<string[]>([]);
const loading = ref(true);

const names = computed(() =>
  allNames.value.filter(n => !winners.value.includes(n))
);

const displayedWinners = computed(() =>
  [...winners.value].reverse().slice(0, 5)
);

async function loadParticipants() {
  try {
    const res = await fetch('/data/users.csv');
    const text = await res.text();
    const parsed = Papa.parse<Record<string, string>>(text, {
      header: true,
      skipEmptyLines: true,
    });

    const seen = new Set<string>();
    const unique: string[] = [];

    for (const row of parsed.data) {
      const username = (row.username ?? '').trim();
      if (!username || username === 'username') continue;
      const lower = username.toLowerCase();
      if (seen.has(lower) || EXCLUDED_USERS.has(lower)) continue;
      seen.add(lower);
      unique.push(username);
    }

    allNames.value = unique;
  } catch (err) {
    console.error('Failed to load participants:', err);
  } finally {
    loading.value = false;
  }
}

const canvasRef = ref<HTMLCanvasElement | null>(null);
const revealCanvasRef = ref<HTMLCanvasElement | null>(null);
const revealButtonsVisible = ref(false);

const { showing: revealShowing, show: revealShow, handleClick: revealHandleClick } = useWinnerReveal({
  canvas: revealCanvasRef,
});

function triggerReveal(winner: string) {
  revealButtonsVisible.value = false;
  revealShow(winner);
  setTimeout(() => {
    revealButtonsVisible.value = true;
  }, 5500);
}

const { spinning, init, handleClick } = useWheel({
  canvas: canvasRef,
  names,
  onSpinEnd(winner) {
    winners.value.push(winner);
    void nextTick(() => {
      triggerReveal(winner);
    });
  },
});

watch(revealCanvasRef, (el) => {
  if (el && revealShowing.value) {
    const lastWinner = winners.value[winners.value.length - 1];
    if (lastWinner) {
      triggerReveal(lastWinner);
    }
  }
});

function onSpinAgain() {
  revealShowing.value = false;
  revealButtonsVisible.value = false;
}

function onDone() {
  revealShowing.value = false;
  revealButtonsVisible.value = false;
}

function resetWheel() {
  revealShowing.value = false;
  revealButtonsVisible.value = false;
  winners.value = [];
  init();
}

onMounted(async () => {
  await loadParticipants();
  await nextTick();
  init();
  window.addEventListener('resize', () => init());
});
</script>

<style lang="scss" scoped>
.wheel-page {
  width: 100%;
  min-height: 100vh;
  background-image: v-bind(bgUrl);
  background-size: cover;
  background-position: center top;
  background-repeat: no-repeat;
  background-attachment: fixed;
  position: relative;
}

// ─── Floating reset button ───
.floating-reset {
  position: fixed;
  top: 16px;
  right: 16px;
  z-index: 100;
  border: 1.5px solid #433A96;
  color: #433A96;
  background: rgba(255, 255, 255, 0.6);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  border-radius: 10px;
  padding: 6px 16px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover:not(:disabled) {
    background: rgba(255, 255, 255, 0.85);
  }

  &:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
}

// ─── Main content — scrollable ───
.main-content {
  width: 100%;
  min-height: 100vh;
  overflow-y: auto;
}

// ─── Everything stacked vertically, centered ───
.wheel-side {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20px 16px 40px;
  gap: 12px;
}

// ─── Logo ───
.wheel-logo {
  width: 250px;
  height: auto;
  max-height: 250px;
  object-fit: contain;
  flex-shrink: 0;
}

// ─── Wheel canvas — scales with viewport ───
.wheel-canvas {
  cursor: pointer;
  width: min(500px, 80vw, 50vh);
  height: min(500px, 80vw, 50vh);
}

// Participant count
.participant-count {
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  background: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  border-radius: 12px;
  padding: 6px 28px;

  .count-label {
    font-size: 10px;
    font-weight: 600;
    color: #5A5A7A;
    letter-spacing: 0.12em;
    text-transform: uppercase;
  }

  .count-number {
    font-size: 36px;
    font-weight: 700;
    color: #433A96;
    line-height: 1.1;
    letter-spacing: -1px;
  }
}

// Winners list — horizontal row
.winners-list {
  display: flex;
  align-items: center;
  gap: 8px;
  background: rgba(255, 255, 255, 0.75);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  border-radius: 12px;
  padding: 6px 16px;
  border: 1px solid rgba(67, 58, 150, 0.12);
  flex-wrap: wrap;
  justify-content: center;
  max-width: 90vw;
}

.winners-title {
  font-size: 10px;
  font-weight: 600;
  color: #433A96;
  text-transform: uppercase;
  letter-spacing: 1px;
  margin-right: 4px;
}

.winner-row {
  display: flex;
  align-items: center;
  gap: 4px;

  & + & {
    padding-left: 8px;
    border-left: 1px solid rgba(67, 58, 150, 0.15);
  }
}

.winner-rank {
  font-size: 11px;
  font-weight: 700;
  color: #00AEEF;
}

.winner-name {
  font-size: 13px;
  font-weight: 600;
  color: #433A96;
  max-width: 120px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Large screens / landscape — bigger wheel
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
@media (min-width: 1024px) {
  .wheel-canvas {
    width: min(600px, 45vw, 55vh);
    height: min(600px, 45vw, 55vh);
  }
}

@media (min-width: 1400px) {
  .wheel-canvas {
    width: min(700px, 40vw, 60vh);
    height: min(700px, 40vw, 60vh);
  }
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Small screens
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
@media (max-width: 768px) {
  .wheel-logo {
    width: 150px;
    max-height: 150px;
  }

  .wheel-side {
    padding: 12px 12px 32px;
  }
}

@media (max-width: 480px) {
  .wheel-logo {
    width: 100px;
    max-height: 100px;
  }

  .floating-reset {
    font-size: 11px;
    padding: 4px 10px;
  }

  .participant-count .count-number {
    font-size: 28px;
  }
}

// ─── Winner reveal overlay ───
.reveal-overlay {
  position: fixed;
  inset: 0;
  z-index: 9999;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.reveal-canvas {
  width: 100%;
  height: 100%;
  position: absolute;
  inset: 0;
}

.reveal-buttons {
  position: absolute;
  bottom: 60px;
  display: flex;
  gap: 20px;
  z-index: 10000;
  opacity: 0;
  transform: translateY(20px);
  transition: opacity 0.6s ease, transform 0.6s ease;
  pointer-events: none;

  &.visible {
    opacity: 1;
    transform: translateY(0);
    pointer-events: auto;
  }
}

.reveal-btn {
  padding: 12px 36px;
  border-radius: 12px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;

  &--spin {
    background: linear-gradient(135deg, #5B3FA6 0%, #00AEEF 100%);
    color: #FFFFFF;
    border: none;
    box-shadow: 0 4px 20px rgba(0, 174, 239, 0.3);

    &:hover {
      transform: scale(1.06);
      box-shadow: 0 6px 28px rgba(0, 174, 239, 0.4);
    }
  }

  &--done {
    background: transparent;
    color: #FFFFFF;
    border: 2px solid rgba(255, 255, 255, 0.6);

    &:hover {
      background: rgba(255, 255, 255, 0.1);
      border-color: #FFFFFF;
    }
  }
}
</style>
