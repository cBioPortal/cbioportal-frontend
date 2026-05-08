import * as zarr from "zarrita";
import type { Readable } from "zarrita";
import { ZarrStore } from "./ZarrStore";
import {
  readArray,
  readArraySliced,
  decodeDataframe,
  decodeColumn,
  decodeCategorical,
  decodeSparseMatrix,
  decodeNode,
  toStringArray,
} from "./decoders";
import type {
  ArrayResult,
  SparseMatrix,
  Dataframe,
  DecodeNodeResult,
} from "./decoders";
import { ProfileCollector, startMeasure } from "./ProfileCollector";
import type { ChunkInfo, MeasureExtra } from "./ProfileCollector";

type ZarrGroup = zarr.Group<Readable>;
type ZarrArray = zarr.Array<zarr.DataType, Readable>;

interface ConsolidatedMetadata {
  [key: string]: unknown;
}

interface ObsmBatch {
  data: zarr.TypedArray<zarr.DataType>;
  shape: number[];
  offset: number;
  total: number;
}

interface CachedOpts<T> {
  getChunkInfo?: (result: T) => ChunkInfo | undefined;
  getLabel?: (result: T) => Promise<string | undefined> | string | undefined;
}

/** Common var column names that hold human-readable gene symbols (case-sensitive candidates). */
export const GENE_SYMBOL_COLUMNS: readonly string[] = [
  "gene_symbol",
  "GeneSymbol",
  "gene_symbols",
  "feature_name",
  "var_name",
  "gene_name",
  "gene_short_name",
  "symbol",
  "name",
];

export class AnnDataStore {
  #zarrStore: ZarrStore;
  #shape: number[];
  #attrs: Record<string, unknown>;
  #consolidatedMetadata: ConsolidatedMetadata | null;
  #cache = new Map<string, Promise<unknown>>();
  #settled = new Set<string>();
  #labelCache = new Map<string, string>();
  profiler: ProfileCollector;

  constructor(
    zarrStore: ZarrStore,
    shape: number[],
    consolidatedMetadata: ConsolidatedMetadata | null = null,
  ) {
    this.#zarrStore = zarrStore;
    this.#attrs = zarrStore.attrs;
    this.#shape = shape;
    this.#consolidatedMetadata = consolidatedMetadata;
    this.profiler = new ProfileCollector();
  }

  /**
   * Extract ChunkInfo for a zarr array path from consolidated metadata.
   * Works for both v2 (.zarray keys) and v3 (direct keys with codecs).
   */
  #chunkInfoFromMetadata(path: string): ChunkInfo | undefined {
    const meta = this.#consolidatedMetadata;
    if (!meta) return undefined;

    // v2: look up "<path>/.zarray"
    const v2Key = `${path}/.zarray`;
    const v2Meta = meta[v2Key] as Record<string, unknown> | undefined;
    if (v2Meta && v2Meta.shape) {
      return {
        arrayShape: v2Meta.shape as number[],
        chunkShape: v2Meta.chunks as number[],
        dtype: String(v2Meta.dtype ?? ""),
        sharded: false, // v2 has no sharding
      };
    }

    // v3: look up "<path>" directly
    const v3Meta = meta[path] as Record<string, unknown> | undefined;
    if (v3Meta && v3Meta.shape) {
      const codecs = v3Meta.codecs as { name: string }[] | undefined;
      const sharded = codecs?.some(
        (c) => c.name === "sharding_indexed",
      ) ?? false;

      const chunkGrid = v3Meta.chunk_grid as {
        configuration?: { chunk_shape?: number[] };
      } | undefined;

      return {
        arrayShape: v3Meta.shape as number[],
        chunkShape: chunkGrid?.configuration?.chunk_shape ?? [],
        dtype: String(v3Meta.data_type ?? ""),
        sharded,
      };
    }

    return undefined;
  }

  /**
   * Get ChunkInfo for a dataframe column, handling categoricals
   * (whose primary data lives at <slot>/<name>/codes).
   */
  #chunkInfoForColumn(slot: string, name: string): ChunkInfo | undefined {
    return this.#chunkInfoFromMetadata(`${slot}/${name}`)
      ?? this.#chunkInfoFromMetadata(`${slot}/${name}/codes`);
  }

  /**
   * Get ChunkInfo for the _index array of a dataframe slot (obs/var).
   * Reads the index key from .zattrs in consolidated metadata.
   */
  #chunkInfoForIndex(slot: string): ChunkInfo | undefined {
    const meta = this.#consolidatedMetadata;
    if (!meta) return undefined;
    // v2: attrs live at "<slot>/.zattrs"
    const v2Attrs = meta[`${slot}/.zattrs`] as Record<string, unknown> | undefined;
    // v3: attrs live on the group key itself (e.g. "obs" with attributes.{_index})
    const v3Group = meta[slot] as Record<string, unknown> | undefined;
    const v3Attributes = v3Group?.attributes as Record<string, unknown> | undefined;
    const indexKey = (v2Attrs?.["_index"] ?? v3Attributes?.["_index"]) as string | undefined;
    if (!indexKey) return undefined;
    return this.#chunkInfoFromMetadata(`${slot}/${indexKey}`)
      ?? this.#chunkInfoFromMetadata(`${slot}/${indexKey}/codes`);
  }

  #cached<T>(
    key: string,
    fn: () => Promise<T>,
    opts?: CachedOpts<T>,
  ): Promise<T> {
    const cacheHit = this.#cache.has(key);
    if (!cacheHit) {
      const before = this.#zarrStore.snapshotFetchStats();
      const finish = startMeasure(key, false);
      const promise = fn().then(async (result) => {
        this.#settled.add(key);
        const after = this.#zarrStore.snapshotFetchStats();
        const fetches = {
          requests: after.requests - before.requests,
          bytes: after.bytes - before.bytes,
          cacheHits: after.cacheHits - before.cacheHits,
        };
        const chunks = opts?.getChunkInfo?.(result);
        const label = await opts?.getLabel?.(result);
        const extra: MeasureExtra = {};
        if (label) {
          extra.label = label;
          this.#labelCache.set(key, label);
        }
        if (chunks) extra.chunks = chunks;
        if (fetches.requests > 0 || fetches.bytes > 0) extra.fetches = fetches;
        finish(extra);
        return result;
      });
      promise.catch((err) => {
        // Only evict if this is still the cached promise — a newer call for the
        // same key may have already replaced it (e.g. React StrictMode double-invoke).
        if (this.#cache.get(key) === promise) {
          this.#cache.delete(key);
          this.#settled.delete(key);
        }
        const aborted = err?.name === "AbortError";
        const after = this.#zarrStore.snapshotFetchStats();
        const fetches = {
          requests: after.requests - before.requests,
          bytes: after.bytes - before.bytes,
          cacheHits: after.cacheHits - before.cacheHits,
        };
        const extra: MeasureExtra = {};
        if (aborted) extra.aborted = true;
        if (fetches.requests > 0 || fetches.bytes > 0) extra.fetches = fetches;
        finish(extra);
      });
      this.#cache.set(key, promise);
    } else {
      // Fire a zero-duration measure for cache hits
      const finish = startMeasure(key, true);
      const cachedLabel = this.#labelCache.get(key);
      const extra: MeasureExtra = { fetches: { requests: 0, bytes: 0, cacheHits: 0 } };
      if (cachedLabel) extra.label = cachedLabel;
      finish(extra);
    }
    return this.#cache.get(key) as Promise<T>;
  }

  clearCache(): void {
    this.#cache.clear();
    this.#settled.clear();
    this.#labelCache.clear();
  }

  static async open(url: string): Promise<AnnDataStore> {
    const zarrStore = await ZarrStore.open(url);
    const attrs = zarrStore.attrs;

    if (attrs["encoding-type"] !== "anndata") {
      throw new Error(
        `Expected encoding-type "anndata", got "${attrs["encoding-type"]}"`,
      );
    }

    const shape = await AnnDataStore.#resolveShape(zarrStore);
    return new AnnDataStore(zarrStore, shape, zarrStore.consolidatedMetadata);
  }

  static async fromZarrStore(zarrStore: ZarrStore): Promise<AnnDataStore> {
    const attrs = zarrStore.attrs;

    if (attrs["encoding-type"] !== "anndata") {
      throw new Error(
        `Expected encoding-type "anndata", got "${attrs["encoding-type"]}"`,
      );
    }

    const shape = await AnnDataStore.#resolveShape(zarrStore);
    return new AnnDataStore(zarrStore, shape, zarrStore.consolidatedMetadata);
  }

  static async #resolveShape(zarrStore: ZarrStore): Promise<number[]> {
    // Try opening X as an array first (dense), fall back to group (sparse)
    try {
      const xArr = await zarrStore.openArray("X");
      return xArr.shape;
    } catch {
      const xGroup = await zarrStore.openGroup("X");
      return xGroup.attrs.shape as number[];
    }
  }

  // --- Metadata (synchronous) ---

  get shape(): number[] {
    return this.#shape;
  }

  get nObs(): number {
    return this.#shape[0];
  }

  get nVar(): number {
    return this.#shape[1];
  }

  get attrs(): Record<string, unknown> {
    return this.#attrs;
  }

  get zarrStore(): ZarrStore {
    return this.#zarrStore;
  }

  // --- X matrix ---

  async X(sliceRange?: [number, number]): Promise<ArrayResult | SparseMatrix> {
    const key = sliceRange ? `X:${sliceRange[0]}-${sliceRange[1]}` : "X";
    const before = this.#zarrStore.snapshotFetchStats();
    const finish = startMeasure(key, false);
    let node: ZarrArray | ZarrGroup;
    try {
      node = await this.#zarrStore.openArray("X");
    } catch {
      node = await this.#zarrStore.openGroup("X");
    }

    let result: ArrayResult | SparseMatrix;
    if ((node.attrs?.["encoding-type"] as string)?.endsWith("_matrix")) {
      result = await decodeSparseMatrix(node as ZarrGroup, this.#zarrStore.openFn);
    } else if (sliceRange) {
      const [start, end] = sliceRange;
      const chunk = await zarr.get(node as ZarrArray, [zarr.slice(start, end), null]);
      result = { data: chunk.data, shape: chunk.shape };
    } else {
      result = await readArray(node as ZarrArray);
    }

    const after = this.#zarrStore.snapshotFetchStats();
    const fetches = {
      requests: after.requests - before.requests,
      bytes: after.bytes - before.bytes,
      cacheHits: after.cacheHits - before.cacheHits,
    };
    const chunks = this.#chunkInfoFromMetadata("X");
    const extra: MeasureExtra = {};
    if (chunks) extra.chunks = chunks;
    if (fetches.requests > 0 || fetches.bytes > 0) extra.fetches = fetches;
    finish(extra);
    return result;
  }

  static readonly #GENE_SYMBOL_COLUMNS = GENE_SYMBOL_COLUMNS;

  /**
   * Try to resolve a human-readable gene symbol for a var-index gene name.
   * Returns undefined if no symbol column exists or the name is already the symbol.
   */
  async #resolveGeneLabel(geneName: string): Promise<string | undefined> {
    try {
      const cols = await this.varColumns();
      // Try exact match first, then case-insensitive fallback
      let symbolCol = AnnDataStore.#GENE_SYMBOL_COLUMNS.find((c) =>
        cols.includes(c),
      );
      if (!symbolCol) {
        const colsLower = cols.map((c) => c.toLowerCase());
        for (const candidate of AnnDataStore.#GENE_SYMBOL_COLUMNS) {
          const idx = colsLower.indexOf(candidate.toLowerCase());
          if (idx !== -1) {
            symbolCol = cols[idx];
            break;
          }
        }
      }
      if (!symbolCol) return undefined;

      const symbols = await this.varColumn(symbolCol);
      const varNames = await this.varNames();
      const idx = varNames.indexOf(geneName);
      if (idx < 0) return undefined;

      const label = String((symbols as ArrayLike<unknown>)[idx]);
      // Don't return a label if it's identical to the key (already readable)
      return label && label !== geneName ? label : undefined;
    } catch {
      return undefined;
    }
  }

  async geneExpression(geneName: string, signal?: AbortSignal): Promise<zarr.TypedArray<zarr.DataType>> {
    const cacheKey = `geneExpression:${geneName}`;
    if (signal && this.#cache.has(cacheKey) && !this.#settled.has(cacheKey)) {
      this.#cache.delete(cacheKey);
    }
    return this.#cached(
      cacheKey,
      async () => {
        // Get gene index from var names
        const varNames = await this.varNames();
        const geneIndex = varNames.indexOf(geneName);
        if (geneIndex === -1) {
          throw new Error(`Gene "${geneName}" not found`);
        }

        // Try to open X as dense array
        let node: ZarrArray | ZarrGroup;
        try {
          node = await this.#zarrStore.openArray("X");
        } catch {
          node = await this.#zarrStore.openGroup("X");
        }

        if ((node.attrs?.["encoding-type"] as string)?.endsWith("_matrix")) {
          // Sparse matrix - need to decode and extract column
          const sparse = await decodeSparseMatrix(node as ZarrGroup, this.#zarrStore.openFn);
          const result = new Float32Array(this.#shape[0]);
          const data = sparse.data as ArrayLike<number>;
          const indices = sparse.indices as ArrayLike<number>;
          const indptr = sparse.indptr as ArrayLike<number>;
          for (let row = 0; row < this.#shape[0]; row++) {
            const rowStart = indptr[row];
            const rowEnd = indptr[row + 1];
            for (let j = rowStart; j < rowEnd; j++) {
              if (indices[j] === geneIndex) {
                result[row] = data[j];
                break;
              }
            }
          }
          return result;
        }

        // Dense array - slice the column
        const chunk = await zarr.get(node as ZarrArray, [null, geneIndex], signal ? { opts: { signal } } : {});
        return chunk.data;
      },
      {
        getChunkInfo: () => this.#chunkInfoFromMetadata("X"),
        getLabel: () => this.#resolveGeneLabel(geneName),
      },
    );
  }

  // --- obs / var dataframes ---

  obs(): Promise<Dataframe> {
    return this.#cached(
      "obs",
      async () => {
        const group = await this.#zarrStore.openGroup("obs");
        return decodeDataframe(group, this.#zarrStore.openFn);
      },
      { getChunkInfo: () => this.#chunkInfoForIndex("obs") },
    );
  }

  obsColumn(name: string, signal?: AbortSignal): Promise<zarr.TypedArray<zarr.DataType> | (string | number | null)[]> {
    const cacheKey = `obs:${name}`;
    if (signal && this.#cache.has(cacheKey) && !this.#settled.has(cacheKey)) {
      this.#cache.delete(cacheKey);
    }
    return this.#cached(
      cacheKey,
      async () => {
        const group = await this.#zarrStore.openGroup("obs");
        return decodeColumn(group, name, this.#zarrStore.openFn, signal);
      },
      { getChunkInfo: () => this.#chunkInfoForColumn("obs", name) },
    );
  }

  obsColumns(): Promise<string[]> {
    return this.#cached("obsColumns", async () => {
      const group = await this.#zarrStore.openGroup("obs");
      return Array.from(group.attrs["column-order"] as string[]);
    });
  }

  obsNames(): Promise<(string | number | null)[]> {
    return this.#cached(
      "obsNames",
      async () => {
        const group = await this.#zarrStore.openGroup("obs");
        const indexKey = group.attrs["_index"] as string;
        // Index can be an array or a categorical group
        const openFn = this.#zarrStore.openFn;
        try {
          const arr = await openFn(group.resolve(indexKey), { kind: "array" });
          const result = await readArray(arr as zarr.Array<zarr.DataType, Readable>);
          return toStringArray(result.data);
        } catch {
          // It's a categorical group
          const catGroup = await openFn(group.resolve(indexKey), {
            kind: "group",
          });
          const decoded = await decodeCategorical(catGroup as zarr.Group<Readable>, openFn);
          return decoded.values;
        }
      },
      { getChunkInfo: () => this.#chunkInfoForIndex("obs") },
    );
  }

  var(): Promise<Dataframe> {
    return this.#cached(
      "var",
      async () => {
        const group = await this.#zarrStore.openGroup("var");
        return decodeDataframe(group, this.#zarrStore.openFn);
      },
      { getChunkInfo: () => this.#chunkInfoForIndex("var") },
    );
  }

  varColumn(name: string): Promise<zarr.TypedArray<zarr.DataType> | (string | number | null)[]> {
    return this.#cached(
      `var:${name}`,
      async () => {
        const group = await this.#zarrStore.openGroup("var");
        return decodeColumn(group, name, this.#zarrStore.openFn);
      },
      { getChunkInfo: () => this.#chunkInfoForColumn("var", name) },
    );
  }

  varColumns(): Promise<string[]> {
    return this.#cached("varColumns", async () => {
      const group = await this.#zarrStore.openGroup("var");
      return Array.from(group.attrs["column-order"] as string[]);
    });
  }

  varNames(): Promise<(string | number | null)[]> {
    return this.#cached(
      "varNames",
      async () => {
        const group = await this.#zarrStore.openGroup("var");
        const indexKey = group.attrs["_index"] as string;
        // Index can be an array or a categorical group
        const openFn = this.#zarrStore.openFn;
        try {
          const arr = await openFn(group.resolve(indexKey), { kind: "array" });
          const result = await readArray(arr as zarr.Array<zarr.DataType, Readable>);
          return toStringArray(result.data);
        } catch {
          // It's a categorical group
          const catGroup = await openFn(group.resolve(indexKey), {
            kind: "group",
          });
          const decoded = await decodeCategorical(catGroup as zarr.Group<Readable>, openFn);
          return decoded.values;
        }
      },
      { getChunkInfo: () => this.#chunkInfoForIndex("var") },
    );
  }

  // --- Dict-of-matrices slots ---

  #slotKeys(path: string): string[] {
    if (!this.#consolidatedMetadata) {
      return [];
    }
    const prefix = path + "/";
    const keys = new Set<string>();
    for (const key of Object.keys(this.#consolidatedMetadata)) {
      if (key.startsWith(prefix)) {
        const rest = key.slice(prefix.length);
        const slashIndex = rest.indexOf("/");
        if (slashIndex > 0) {
          // v2 keys: "obsm/X_umap/.zattrs" → extract "X_umap"
          keys.add(rest.slice(0, slashIndex));
        } else if (rest.length > 0 && !rest.startsWith(".z")) {
          // v3 keys: "obsm/X_umap" → bare path, no sub-key suffix
          // Skip v2 metadata files like .zattrs, .zgroup, .zarray
          keys.add(rest);
        }
      }
    }
    return Array.from(keys);
  }

  #slotNode(path: string, key: string): Promise<DecodeNodeResult> {
    return this.#cached(
      `${path}:${key}`,
      async () => {
        const node = await this.#zarrStore.openGroup(`${path}/${key}`);
        return decodeNode(node, this.#zarrStore.openFn);
      },
      {
        getChunkInfo: () =>
          this.#chunkInfoFromMetadata(`${path}/${key}/data`)
          ?? this.#chunkInfoFromMetadata(`${path}/${key}`),
      },
    );
  }

  #slotArray(path: string, key: string, signal?: AbortSignal): Promise<ArrayResult | DecodeNodeResult> {
    return this.#cached(
      `${path}:${key}`,
      async () => {
        try {
          const arr = await this.#zarrStore.openArray(`${path}/${key}`);
          return readArray(arr, signal);
        } catch {
          const node = await this.#zarrStore.openGroup(`${path}/${key}`);
          return decodeNode(node, this.#zarrStore.openFn);
        }
      },
      { getChunkInfo: () => this.#chunkInfoFromMetadata(`${path}/${key}`) },
    );
  }

  obsm(key: string, signal?: AbortSignal, dims?: number): Promise<ArrayResult | DecodeNodeResult> {
    if (dims != null) {
      const cacheKey = `obsm:${key}:d${dims}`;
      if (signal && this.#cache.has(cacheKey) && !this.#settled.has(cacheKey)) {
        this.#cache.delete(cacheKey);
      }
      return this.#cached(
        cacheKey,
        async () => {
          try {
            const arr = await this.#zarrStore.openArray(`obsm/${key}`);
            return readArraySliced(arr, dims, signal);
          } catch {
            // Group-encoded obsm (e.g. sparse) — fall back to full decode
            const node = await this.#zarrStore.openGroup(`obsm/${key}`);
            return decodeNode(node, this.#zarrStore.openFn);
          }
        },
        { getChunkInfo: () => this.#chunkInfoFromMetadata(`obsm/${key}`) },
      );
    }
    const cacheKey = `obsm:${key}`;
    // Only evict pending (unsettled) cache entries when a new signal is provided.
    // Settled (resolved) entries contain valid data — return them as-is so that
    // switching back to a previously loaded key is instant.
    // Pending entries must be evicted because their in-flight fetch may be tied to
    // a now-aborted signal (e.g. React StrictMode double-invoke).
    if (signal && this.#cache.has(cacheKey) && !this.#settled.has(cacheKey)) {
      this.#cache.delete(cacheKey);
    }
    return this.#slotArray("obsm", key, signal);
  }

  async *obsmStreaming(key: string, batchSize?: number): AsyncGenerator<ObsmBatch> {
    const before = this.#zarrStore.snapshotFetchStats();
    const finish = startMeasure(`obsmStreaming:${key}`, false);
    const arr = await this.#zarrStore.openArray(`obsm/${key}`);
    const [nObs] = arr.shape;
    const step = batchSize ?? arr.chunks[0];

    for (let offset = 0; offset < nObs; offset += step) {
      const end = Math.min(offset + step, nObs);
      const chunk = await zarr.get(arr, [zarr.slice(offset, end), null]);
      yield { data: chunk.data, shape: chunk.shape, offset, total: nObs };
    }

    const after = this.#zarrStore.snapshotFetchStats();
    const fetches = {
      requests: after.requests - before.requests,
      bytes: after.bytes - before.bytes,
      cacheHits: after.cacheHits - before.cacheHits,
    };
    const chunks = this.#chunkInfoFromMetadata(`obsm/${key}`);
    const extra: MeasureExtra = {};
    if (chunks) extra.chunks = chunks;
    if (fetches.requests > 0 || fetches.bytes > 0) extra.fetches = fetches;
    finish(extra);
  }

  obsmKeys(): string[] {
    return this.#slotKeys("obsm");
  }

  varm(key: string): Promise<ArrayResult | DecodeNodeResult> {
    return this.#slotArray("varm", key);
  }

  varmKeys(): string[] {
    return this.#slotKeys("varm");
  }

  obsp(key: string): Promise<DecodeNodeResult> {
    return this.#slotNode("obsp", key);
  }

  obspKeys(): string[] {
    return this.#slotKeys("obsp");
  }

  varp(key: string): Promise<DecodeNodeResult> {
    return this.#slotNode("varp", key);
  }

  varpKeys(): string[] {
    return this.#slotKeys("varp");
  }

  // --- Layers ---

  layer(key: string): Promise<ArrayResult | DecodeNodeResult> {
    return this.#slotArray("layers", key);
  }

  layerKeys(): string[] {
    return this.#slotKeys("layers");
  }

  // --- Unstructured (uns) ---

  uns(key: string): Promise<ArrayResult | DecodeNodeResult> {
    return this.#slotArray("uns", key);
  }

  unsKeys(): string[] {
    return this.#slotKeys("uns");
  }
}
