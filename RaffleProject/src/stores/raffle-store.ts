import { defineStore } from 'pinia';
import { ref, computed } from 'vue';

export interface RaffleEntry {
  id: number;
  name: string;
  source: 'csv' | 'manual';
}

export const useRaffleStore = defineStore('raffle', () => {
  const entries = ref<RaffleEntry[]>([]);
  const winners = ref<RaffleEntry[]>([]);
  const isSpinning = ref(false);

  const entryCount = computed(() => entries.value.length);
  const availableEntries = computed(() =>
    entries.value.filter(e => !winners.value.some(w => w.id === e.id))
  );
  const entryNames = computed(() => entries.value.map(e => e.name));
  const availableNames = computed(() => availableEntries.value.map(e => e.name));

  function nextId(): number {
    return entries.value.length > 0
      ? Math.max(...entries.value.map(e => e.id)) + 1
      : 1;
  }

  function addEntries(newEntries: Omit<RaffleEntry, 'id'>[], deduplicate = false) {
    const startId = nextId();
    const toAdd = newEntries.map((e, i) => ({ ...e, id: startId + i }));

    if (deduplicate) {
      const existingNames = new Set(entries.value.map(e => e.name.toLowerCase().trim()));
      const filtered = toAdd.filter(e => {
        const key = e.name.toLowerCase().trim();
        if (existingNames.has(key)) return false;
        existingNames.add(key);
        return true;
      });
      entries.value.push(...filtered);
    } else {
      entries.value.push(...toAdd);
    }
  }

  function addWinner(entry: RaffleEntry) {
    winners.value.push(entry);
  }

  function clearEntries() {
    entries.value = [];
    winners.value = [];
  }

  function clearWinners() {
    winners.value = [];
  }

  function removeEntry(id: number) {
    entries.value = entries.value.filter(e => e.id !== id);
  }

  return {
    entries,
    winners,
    isSpinning,
    entryCount,
    availableEntries,
    entryNames,
    availableNames,
    addEntries,
    addWinner,
    clearEntries,
    clearWinners,
    removeEntry,
  };
});
