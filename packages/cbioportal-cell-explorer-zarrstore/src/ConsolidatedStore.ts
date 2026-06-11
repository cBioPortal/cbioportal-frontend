import type { AbsolutePath, AsyncReadable, RangeQuery } from "zarrita";
import type { FetchStats } from "./InstrumentedStore";

interface StoreWithStats extends AsyncReadable<RequestInit> {
  url: string | URL;
  snapshot(): FetchStats;
}

/**
 * Wraps a store to serve zarr metadata from an in-memory cache.
 * Metadata get() calls are intercepted; data requests (getRange) pass through.
 */
export class ConsolidatedStore implements AsyncReadable<RequestInit> {
  #inner: StoreWithStats;
  #cache: Map<string, Uint8Array>;
  #cacheHits = 0;

  constructor(inner: StoreWithStats, cache: Map<string, Uint8Array>) {
    this.#inner = inner;
    this.#cache = cache;
  }

  get url(): string | URL {
    return this.#inner.url;
  }

  async get(
    key: AbsolutePath,
    opts?: RequestInit,
  ): Promise<Uint8Array | undefined> {
    const cached = this.#cache.get(key);
    if (cached) {
      this.#cacheHits++;
      return cached;
    }
    return this.#inner.get(key, opts);
  }

  async getRange(
    key: AbsolutePath,
    range: RangeQuery,
    opts?: RequestInit,
  ): Promise<Uint8Array | undefined> {
    return this.#inner.getRange!(key, range, opts);
  }

  /** Combined stats: inner store network stats + consolidated cache hits. */
  snapshot(): FetchStats {
    const inner = this.#inner.snapshot();
    return {
      requests: inner.requests + this.#cacheHits,
      bytes: inner.bytes,
      cacheHits: inner.cacheHits + this.#cacheHits,
    };
  }
}

const encoder = new TextEncoder();

function encodeJson(value: unknown): Uint8Array {
  return encoder.encode(JSON.stringify(value));
}

/**
 * Build a metadata cache from v3 consolidated metadata.
 * Maps each key to the path zarrita will request: "obs" → "/obs/zarr.json"
 */
export function buildV3Cache(
  rootZarrJson: Record<string, unknown>,
  consolidatedMeta: Record<string, unknown>,
): Map<string, Uint8Array> {
  const cache = new Map<string, Uint8Array>();
  cache.set("/zarr.json", encodeJson(rootZarrJson));
  for (const [key, value] of Object.entries(consolidatedMeta)) {
    cache.set(`/${key}/zarr.json`, encodeJson(value));
  }
  return cache;
}

/**
 * Build a metadata cache from v2 .zmetadata contents.
 * Maps each key to the path zarrita will request: "obs/.zattrs" → "/obs/.zattrs"
 */
export function buildV2Cache(
  v2Metadata: Record<string, unknown>,
): Map<string, Uint8Array> {
  const cache = new Map<string, Uint8Array>();
  for (const [key, value] of Object.entries(v2Metadata)) {
    cache.set(`/${key}`, encodeJson(value));
  }
  return cache;
}
