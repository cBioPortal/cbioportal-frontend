export const MEASURE_PREFIX = "czl:";

export interface ChunkInfo {
  arrayShape: number[];
  chunkShape: number[];
  dtype: string;
  sharded: boolean;
}

export interface FetchInfo {
  requests: number;
  bytes: number;
  cacheHits: number;
}

export interface ProfileEntry {
  id: number;
  method: string;
  key: string;
  label?: string;
  cacheHit: boolean;
  aborted?: boolean;
  startTime: number;
  duration: number;
  chunks?: ChunkInfo;
  fetches?: FetchInfo;
}

export interface MeasureDetail {
  key: string;
  label?: string;
  cacheHit: boolean;
  aborted?: boolean;
  chunks?: ChunkInfo;
  fetches?: FetchInfo;
}

export class ProfileCollector {
  entries: ProfileEntry[] = [];
  enabled: boolean = true;
  #nextId = 1;
  #version = 0;
  #listeners: Set<() => void> = new Set();
  #observer: PerformanceObserver;

  get version(): number {
    return this.#version;
  }

  constructor() {
    this.#observer = new PerformanceObserver((list) => {
      if (!this.enabled) return;
      let added = false;
      for (const entry of list.getEntries()) {
        if (!entry.name.startsWith(MEASURE_PREFIX)) continue;
        const detail = (entry as PerformanceMeasure).detail as MeasureDetail;
        if (!detail) continue;
        const profileEntry: ProfileEntry = {
          id: this.#nextId++,
          method: detail.key.split(":")[0],
          key: detail.key,
          cacheHit: detail.cacheHit,
          startTime: entry.startTime,
          duration: entry.duration,
          chunks: detail.chunks,
          fetches: detail.fetches,
        };
        if (detail.aborted) profileEntry.aborted = true;
        if (detail.label) profileEntry.label = detail.label;
        this.entries.push(profileEntry);
        added = true;
      }
      if (added) {
        this.#version++;
        this.#notify();
      }
    });
    this.#observer.observe({ type: "measure", buffered: false });
  }

  clear(): void {
    this.entries = [];
    this.#nextId = 1;
    this.#version++;
    this.#notify();
  }

  subscribe(listener: () => void): () => void {
    this.#listeners.add(listener);
    return () => {
      this.#listeners.delete(listener);
    };
  }

  toJSON(): ProfileEntry[] {
    return this.entries;
  }

  dispose(): void {
    this.#observer.disconnect();
    this.#listeners.clear();
  }

  #notify(): void {
    for (const listener of this.#listeners) {
      listener();
    }
  }
}

let measureSeq = 0;

export interface MeasureExtra {
  label?: string;
  aborted?: boolean;
  chunks?: ChunkInfo;
  fetches?: FetchInfo;
}

/** Place a start mark and return a finish callback that records the measure. */
export function startMeasure(
  key: string,
  cacheHit: boolean,
): (extra?: MeasureExtra) => void {
  const seq = ++measureSeq;
  const startMark = `${MEASURE_PREFIX}${key}:${seq}:start`;
  const measureName = `${MEASURE_PREFIX}${key}:${seq}`;
  performance.mark(startMark);
  return (extra?: MeasureExtra) => {
    const detail: MeasureDetail = {
      key,
      cacheHit,
      label: extra?.label,
      chunks: extra?.chunks,
      fetches: extra?.fetches,
    };
    if (extra?.aborted) detail.aborted = true;
    performance.measure(measureName, { start: startMark, detail });
  };
}
