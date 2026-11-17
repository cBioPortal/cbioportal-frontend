import { parseOql } from './parse.js';
import { OqlQuery } from './schema.js';
import { serialize } from './serialize.js';

/** Drops defaulted fields (false, undefined, [], cna op "=") and sorts keys, for comparison. */
export function normalize(value: unknown): unknown {
    if (Array.isArray(value)) return value.map(normalize);
    if (value && typeof value === 'object') {
        const obj = value as Record<string, unknown>;
        const out: Record<string, unknown> = {};
        for (const key of Object.keys(obj).sort()) {
            const v = obj[key];
            if (v === undefined || v === false) continue;
            if (Array.isArray(v) && v.length === 0 && key !== 'alterations')
                continue;
            if (obj.type === 'cna' && key === 'op' && v === '=') continue;
            out[key] = normalize(v);
        }
        return out;
    }
    return value;
}

export function sameQuery(a: OqlQuery, b: OqlQuery): boolean {
    return JSON.stringify(normalize(a)) === JSON.stringify(normalize(b));
}

export type RoundTrip =
    | { ok: true; oql: string }
    | { ok: false; oql: string; reparsed?: OqlQuery; reason: string };

/** Serializes a DSL query and confirms cBioPortal's grammar reads it back unchanged. */
export function serializeChecked(dsl: OqlQuery): RoundTrip {
    let oql: string;
    try {
        oql = serialize(dsl);
    } catch (caught) {
        const e = caught as any;
        return { ok: false, oql: '', reason: String(e?.message ?? e) };
    }
    const back = parseOql(oql);
    if (!back.ok)
        return {
            ok: false,
            oql,
            reason: back.errors.map(e => e.message).join('; '),
        };
    if (!sameQuery(dsl, back.dsl)) {
        return {
            ok: false,
            oql,
            reparsed: back.dsl,
            reason: 'reparsed OQL differs from the DSL',
        };
    }
    return { ok: true, oql };
}
