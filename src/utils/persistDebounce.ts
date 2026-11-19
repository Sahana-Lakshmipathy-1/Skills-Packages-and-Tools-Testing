const DEFAULT_MS = 300

/** Schedule a deferred persist. Cleanup only cancels — call flush on unmount. */
export function schedulePersist(
  persist: () => void,
  delayMs: number = DEFAULT_MS,
): () => void {
  const timer = window.setTimeout(persist, delayMs)
  return () => window.clearTimeout(timer)
}
