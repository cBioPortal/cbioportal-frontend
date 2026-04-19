import * as zarr from "zarrita";
import type { Readable } from "zarrita";
import { InstrumentedStore } from "./InstrumentedStore";
import { ConsolidatedStore, buildV3Cache, buildV2Cache } from "./ConsolidatedStore";
import type { FetchStats } from "./InstrumentedStore";

interface ConsolidatedMetadataMap {
  [key: string]: unknown;
}

export class ZarrStore {
  store: InstrumentedStore;
  root: zarr.Group<Readable>;
  attrs: Record<string, unknown>;
  consolidatedMetadata: ConsolidatedMetadataMap | null;
  zarrVersion: 2 | 3;
  #effectiveStore: InstrumentedStore | ConsolidatedStore;

  constructor(
    store: InstrumentedStore,
    root: zarr.Group<Readable>,
    consolidatedMetadata: ConsolidatedMetadataMap | null = null,
    effectiveStore?: ConsolidatedStore,
    zarrVersion: 2 | 3 = 2,
  ) {
    this.store = store;
    this.root = root;
    this.attrs = root.attrs;
    this.consolidatedMetadata = consolidatedMetadata;
    this.zarrVersion = zarrVersion;
    this.#effectiveStore = effectiveStore ?? store;
  }

  static async open(url: string): Promise<ZarrStore> {
    // useSuffixRequest: false — uses HEAD+GET instead of Range suffix requests.
    // Range headers trigger CORS preflights (OPTIONS), which fail on CloudFront
    // distributions that don't allow OPTIONS method. HEAD+GET adds one extra
    // request per shard but avoids preflight entirely. To re-enable, CloudFront
    // needs: OPTIONS in allowed methods, CORS-S3Origin request policy, and
    // Origin in the cache key. See: https://github.com/cBioPortal/cbioportal-cell-explorer/issues/162
    const fetchStore = new zarr.FetchStore(url, { useSuffixRequest: false });
    const instrumented = new InstrumentedStore(fetchStore);

    let effectiveStore: ConsolidatedStore | undefined;
    let consolidatedMetadata: ConsolidatedMetadataMap | null = null;

    // Try v3: fetch root zarr.json, check for consolidated_metadata
    const rootBytes = await instrumented.get("/zarr.json" as any);
    if (rootBytes) {
      const rootJson = JSON.parse(new TextDecoder().decode(rootBytes)) as Record<string, unknown>;
      const consolidated = rootJson.consolidated_metadata as
        | { metadata?: ConsolidatedMetadataMap }
        | undefined;
      if (consolidated?.metadata) {
        consolidatedMetadata = consolidated.metadata;
        const cache = buildV3Cache(rootJson, consolidatedMetadata);
        effectiveStore = new ConsolidatedStore(instrumented, cache);
      } else {
        // v3 without consolidated — cache just the root zarr.json we already fetched
        const cache = new Map<string, Uint8Array>();
        cache.set("/zarr.json", rootBytes);
        effectiveStore = new ConsolidatedStore(instrumented, cache);
      }
    } else {
      // Try v2: fetch .zmetadata
      const zmetaBytes = await instrumented.get("/.zmetadata" as any);
      if (zmetaBytes) {
        const zmeta = JSON.parse(new TextDecoder().decode(zmetaBytes)) as Record<string, unknown>;
        if (zmeta.zarr_consolidated_format === 1 && zmeta.metadata) {
          consolidatedMetadata = zmeta.metadata as ConsolidatedMetadataMap;
          const cache = buildV2Cache(consolidatedMetadata);
          effectiveStore = new ConsolidatedStore(instrumented, cache);
        }
      }
    }

    const zarrVersion = rootBytes ? 3 : 2;
    const openFn = zarrVersion === 3 ? zarr.open.v3 : zarr.open.v2;
    const root = await openFn(effectiveStore ?? instrumented, { kind: "group" });
    return new ZarrStore(instrumented, root, consolidatedMetadata, effectiveStore, zarrVersion);
  }

  #open(location: zarr.Location<Readable>, opts: { kind: "array" }): Promise<zarr.Array<zarr.DataType, Readable>>;
  #open(location: zarr.Location<Readable>, opts: { kind: "group" }): Promise<zarr.Group<Readable>>;
  #open(location: zarr.Location<Readable>, opts: { kind: "array" | "group" }): Promise<zarr.Array<zarr.DataType, Readable> | zarr.Group<Readable>> {
    const openFn = this.zarrVersion === 3 ? zarr.open.v3 : zarr.open.v2;
    return openFn(location, opts as { kind: "array" });
  }

  async openArray(path: string): Promise<zarr.Array<zarr.DataType, Readable>> {
    return this.#open(this.root.resolve(path), { kind: "array" });
  }

  async openGroup(path: string): Promise<zarr.Group<Readable>> {
    return this.#open(this.root.resolve(path), { kind: "group" });
  }

  /** Version-specific open function suitable for passing to decoders. */
  get openFn(): (location: zarr.Location<Readable>, opts: { kind: "array" | "group" }) => Promise<zarr.Array<zarr.DataType, Readable> | zarr.Group<Readable>> {
    return this.zarrVersion === 3
      ? (loc, opts) => zarr.open.v3(loc, opts as { kind: "array" })
      : (loc, opts) => zarr.open.v2(loc, opts as { kind: "array" });
  }

  snapshotFetchStats(): FetchStats {
    return this.#effectiveStore.snapshot();
  }
}
