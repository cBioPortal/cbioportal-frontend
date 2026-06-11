export interface ShardIndexEntry {
    /** Inner chunk linear index */
    index: number;
    /** Byte offset within the shard file */
    offset: bigint;
    /** Compressed size in bytes */
    nbytes: bigint;
}

export interface ShardIndex {
    /** Total shard file size in bytes */
    shardSize: number;
    /** Index entries for each inner chunk */
    entries: ShardIndexEntry[];
}

const FILL_VALUE = BigInt('18446744073709551615'); // 2^64 - 1
let headWarningLogged = false;

/**
 * Fetch and parse the shard index from a specific shard of a zarr v3 array.
 *
 * The index is stored at the end of the shard file:
 *   [chunk data...][index: (offset, nbytes) uint64 pairs][crc32c: 4 bytes]
 *
 * @param shardCoords - Shard coordinates as an array (e.g. [0, 0] for the first shard).
 *                      Defaults to all zeros if not provided.
 */
export async function fetchShardIndex(
    storeUrl: string,
    arrayPath: string,
    shardShape: number[],
    innerChunkShape: number[],
    shardCoords?: number[]
): Promise<ShardIndex> {
    // Number of inner chunks per shard along each axis
    const chunksPerAxis = shardShape.map((s, i) =>
        Math.ceil(s / innerChunkShape[i])
    );
    const totalInnerChunks = chunksPerAxis.reduce((a, b) => a * b, 1);

    // Index size: 16 bytes per entry (2 × uint64) + 4 bytes CRC32C checksum
    const indexSize = totalInnerChunks * 16;
    const suffixSize = indexSize + 4;

    // Build the URL for the specified shard
    const coords = shardCoords ?? shardShape.map(() => 0);
    const coordPath = coords.join('/');
    const shardUrl = `${storeUrl.replace(
        /\/$/,
        ''
    )}/${arrayPath}/c/${coordPath}`;

    // HEAD to get file size, then fetch only the index tail via absolute Range.
    // Note: Chrome logs "Fetch failed loading: HEAD ..." in the console for HEAD
    // requests even when they succeed (200 OK). This is a known Chrome quirk —
    // it logs "failed loading" because there's no response body. The fetch
    // promise resolves correctly and head.ok is true. These messages are harmless
    // and cannot be suppressed from JavaScript.
    const head = await fetch(shardUrl, { method: 'HEAD' });
    if (!head.ok) {
        throw new Error(`Failed to HEAD shard: ${head.status}`);
    }
    // Log once to explain the Chrome "Fetch failed loading: HEAD" noise
    if (!headWarningLogged) {
        headWarningLogged = true;
        console.info(
            '[zarr-inspector] Chrome logs "Fetch failed loading: HEAD" for HEAD requests even when they succeed (200 OK). This is a Chrome quirk, not an error. The HEAD requests are working correctly.'
        );
    }
    const shardSize = Number(head.headers.get('Content-Length') ?? 0);
    if (shardSize === 0) {
        throw new Error('Shard file has no Content-Length');
    }

    const rangeStart = shardSize - suffixSize;
    const rangeEnd = shardSize - 1; // inclusive
    const response = await fetch(shardUrl, {
        headers: { Range: `bytes=${rangeStart}-${rangeEnd}` },
    });

    if (!response.ok && response.status !== 206) {
        throw new Error(`Failed to fetch shard index: ${response.status}`);
    }

    const tailBuffer = await response.arrayBuffer();

    // Strip the trailing 4-byte CRC32C to get just the index entries
    const buffer = tailBuffer.slice(0, tailBuffer.byteLength - 4);

    const view = new DataView(buffer);
    const entries: ShardIndexEntry[] = [];

    for (let i = 0; i < totalInnerChunks; i++) {
        const bytePos = i * 16;
        const offset = view.getBigUint64(bytePos, true); // little-endian
        const nbytes = view.getBigUint64(bytePos + 8, true);

        entries.push({
            index: i,
            offset: offset === FILL_VALUE ? BigInt(-1) : offset,
            nbytes: nbytes === FILL_VALUE ? BigInt(0) : nbytes,
        });
    }

    return { shardSize, entries };
}

export function formatBytes(bytes: number | bigint): string {
    const n = typeof bytes === 'bigint' ? Number(bytes) : bytes;
    if (n === 0) return '0 B';
    const units = ['B', 'KB', 'MB', 'GB'];
    const i = Math.min(
        Math.floor(Math.log(n) / Math.log(1024)),
        units.length - 1
    );
    const value = n / Math.pow(1024, i);
    return `${value < 10 ? value.toFixed(1) : Math.round(value)} ${units[i]}`;
}
