import type { StoreApi } from 'zustand'

export function waitForStore<T>(
  store: StoreApi<T>,
  predicate: (state: T) => boolean,
  timeoutMs = 30_000,
): Promise<void> {
  return new Promise((resolve, reject) => {
    // Check immediately
    if (predicate(store.getState())) {
      resolve()
      return
    }

    let timer: ReturnType<typeof setTimeout> | null = null

    const unsubscribe = store.subscribe((state) => {
      if (predicate(state)) {
        if (timer) clearTimeout(timer)
        unsubscribe()
        resolve()
      }
    })

    timer = setTimeout(() => {
      unsubscribe()
      reject(new Error('waitForStore timed out'))
    }, timeoutMs)
  })
}
