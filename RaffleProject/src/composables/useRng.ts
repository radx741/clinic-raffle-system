export function useRng() {
  function pickRandom<T>(arr: T[]): T {
    if (arr.length === 0) throw new Error('Cannot pick from empty array');
    const randomValues = new Uint32Array(1);
    crypto.getRandomValues(randomValues);
    const index = randomValues[0]! % arr.length;
    return arr[index]!;
  }

  return { pickRandom };
}
