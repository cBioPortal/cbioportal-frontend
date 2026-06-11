import type { AbsolutePath, AsyncReadable, RangeQuery } from "zarrita";
import type { FetchStore } from "zarrita";

export interface FetchStats {
  requests: number;
  bytes: number;
  cacheHits: number;
}

/**
 * Wraps a FetchStore to count HTTP requests and bytes transferred.
 * Implements the same AsyncReadable interface so it's a drop-in replacement.
 */
export class InstrumentedStore implements AsyncReadable<RequestInit> {
  #inner: FetchStore;
  #stats: FetchStats = { requests: 0, bytes: 0, cacheHits: 0 };

  constructor(inner: FetchStore) {
    this.#inner = inner;
  }

  get url(): string | URL {
    return this.#inner.url;
  }

  async get(
    key: AbsolutePath,
    opts?: RequestInit,
  ): Promise<Uint8Array | undefined> {
    const result = await this.#inner.get(key, opts);
    this.#stats.requests++;
    if (result) {
      this.#stats.bytes += result.byteLength;
    }
    return result;
  }

  async getRange(
    key: AbsolutePath,
    range: RangeQuery,
    opts?: RequestInit,
  ): Promise<Uint8Array | undefined> {
    const result = await this.#inner.getRange(key, range, opts);
    this.#stats.requests++;
    if (result) {
      this.#stats.bytes += result.byteLength;
    }
    return result;
  }

  snapshot(): FetchStats {
    return { ...this.#stats };
  }
}
