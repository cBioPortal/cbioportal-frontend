import { ComparisonRow } from './comparisonRows';
import { FrameStatus } from './types';
import { TrackLayout } from './trackGeometry';

export interface LinkRef {
    key5: string;
    key3: string;
    frame: FrameStatus;
}

export interface LinkGroup extends LinkRef {
    id: string;
    x5: number;
    x3: number;
    sampleIds: string[];
    /** Unique samples (D24). */
    sampleCount: number;
}

export const linkId = (l: LinkRef): string => `${l.key5}|${l.key3}|${l.frame}`;

/**
 * Pair-mode link groups: one per (5′ slot, 3′ slot, frame). Rows with either
 * endpoint off-track (or no partner) get no link. `rows` must be the view's
 * oriented rows so anchorBreakpoint is 5′ and partnerBreakpoint is 3′.
 */
export function buildLinkGroups(
    rows: ComparisonRow[],
    layout5: TrackLayout,
    layout3: TrackLayout
): { groups: LinkGroup[]; rowLinkIds: (string | undefined)[] } {
    const s5 = layout5.assign(rows.map(r => r.anchorBreakpoint));
    const s3 = layout3.assign(rows.map(r => r.partnerBreakpoint));
    const byId = new Map<string, LinkGroup & { samples: Set<string> }>();
    const rowLinkIds = rows.map((row, i) => {
        const a = s5[i];
        const b = s3[i];
        if (!a || !b) return undefined;
        const ref = { key5: a.key, key3: b.key, frame: row.frame };
        const id = linkId(ref);
        let g = byId.get(id);
        if (!g) {
            g = {
                ...ref,
                id,
                x5: a.x,
                x3: b.x,
                sampleIds: [],
                sampleCount: 0,
                samples: new Set<string>(),
            };
            byId.set(id, g);
        }
        if (!g.samples.has(row.sampleId)) {
            g.samples.add(row.sampleId);
            g.sampleIds.push(row.sampleId);
            g.sampleCount += 1;
        }
        return id;
    });
    const groups = Array.from(byId.values())
        .map(({ samples, ...g }) => g)
        .sort((x, y) => y.sampleCount - x.sampleCount);
    return { groups, rowLinkIds };
}

export type LinkMatcher = (l: LinkRef) => boolean;

export function matchLinkIds(ids: Iterable<string>): LinkMatcher {
    const set = new Set(ids);
    return l => set.has(linkId(l));
}

export function matchBar(side: '5p' | '3p', slotKey: string): LinkMatcher {
    return l => (side === '5p' ? l.key5 : l.key3) === slotKey;
}

/** Bars at both ends of every matching link. */
export function litBarKeys(
    groups: LinkGroup[],
    matcher: LinkMatcher
): { lit5: Set<string>; lit3: Set<string> } {
    const lit5 = new Set<string>();
    const lit3 = new Set<string>();
    groups.forEach(g => {
        if (!matcher(g)) return;
        lit5.add(g.key5);
        lit3.add(g.key3);
    });
    return { lit5, lit3 };
}

/** Human label for a slot key (feature `kind:label` or `bin:<idx>`). */
export function slotLabel(key: string): string {
    const i = key.indexOf(':');
    if (i < 0) return key;
    const kind = key.slice(0, i);
    const label = key.slice(i + 1);
    switch (kind) {
        case 'exon':
            return label;
        case 'intron':
            return `intron ${label}`;
        case 'promoter':
            return 'promoter';
        case 'downstream':
            return 'downstream';
        case 'bin':
            return 'genomic bin';
        default:
            return key;
    }
}
