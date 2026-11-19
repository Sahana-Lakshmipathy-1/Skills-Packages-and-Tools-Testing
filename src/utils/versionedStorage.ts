type VersionedStorageOptions<T> = {
  key: string
  version: number
  collectionKey: string
  isItem: (value: unknown) => value is T
}

type StoredPayload<T> = {
  v: number
  [collectionKey: string]: number | T[]
}

export function createVersionedStorage<T>({
  key,
  version,
  collectionKey,
  isItem,
}: VersionedStorageOptions<T>) {
  let cachedRead: T[] | null = null

  function parse(raw: string | null): T[] {
    if (!raw) return []

    try {
      const parsed: unknown = JSON.parse(raw)
      if (
        typeof parsed !== 'object' ||
        parsed === null ||
        (parsed as StoredPayload<T>).v !== version ||
        !Array.isArray((parsed as StoredPayload<T>)[collectionKey])
      ) {
        return []
      }

      return ((parsed as StoredPayload<T>)[collectionKey] as T[]).filter(isItem)
    } catch {
      return []
    }
  }

  function load(): T[] {
    if (cachedRead) return cachedRead
    cachedRead = parse(
      typeof localStorage === 'undefined' ? null : localStorage.getItem(key),
    )
    return cachedRead
  }

  function save(items: T[]): void {
    const payload = { v: version, [collectionKey]: items }
    localStorage.setItem(key, JSON.stringify(payload))
    cachedRead = items
  }

  return { parse, load, save }
}
