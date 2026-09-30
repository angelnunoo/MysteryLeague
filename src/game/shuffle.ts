export function hashSeed(input: string): number {
  let hash = 2166136261
  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index)
    hash = Math.imul(hash, 16777619)
  }
  return hash >>> 0
}

export function seededShuffle<T>(items: T[], seed: string): T[] {
  const copy = [...items]
  let state = hashSeed(seed)
  const random = () => {
    state = (Math.imul(1664525, state) + 1013904223) >>> 0
    return state / 4294967296
  }
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swap = Math.floor(random() * (index + 1))
    const current = copy[index]
    copy[index] = copy[swap]
    copy[swap] = current
  }
  return copy
}

export function puzzleOrder(ids: string[], solution: string[], seed: string): string[] {
  const shuffled = seededShuffle(ids, seed)
  const same = shuffled.every((id, index) => id === solution[index])
  if (same && shuffled.length > 1) {
    const [first, second] = shuffled
    shuffled[0] = second
    shuffled[1] = first
  }
  return shuffled
}
