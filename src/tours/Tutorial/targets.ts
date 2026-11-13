import { Box, Target, TargetSpec } from './types';

/**
 * Finds the elements a tutorial script's targets name. Same semantics as the resolver the
 * tutorial capture runner uses, so a target that measures a slide's box also finds the
 * element the tour highlights.
 */

function isVisible(el: Element): boolean {
    const r = el.getBoundingClientRect();
    return (
        r.width > 0 &&
        r.height > 0 &&
        getComputedStyle(el).visibility !== 'hidden'
    );
}

export function elementText(el: Element): string {
    return ((el as HTMLElement).innerText ?? el.textContent ?? '')
        .replace(/\s+/g, ' ')
        .trim();
}

function spec(t: Target): TargetSpec {
    return typeof t === 'string' ? { css: t } : t;
}

function query(root: ParentNode, css: string): Element[] {
    try {
        return Array.from(root.querySelectorAll(css));
    } catch (e) {
        // a selector this browser can't parse finds nothing
        return [];
    }
}

/** The elements a target finds: the first visible match, or the nth; for a union, one per part. */
export function findAll(
    target: Target,
    root: ParentNode = document
): Element[] {
    const t = spec(target);
    if (t.union) {
        return t.union.flatMap(u => findAll(u, root));
    }
    if (t.within) {
        const w = findAll(t.within, root)[0];
        if (!w) {
            return [];
        }
        root = w;
    }
    let els = query(root, t.css || '*').filter(isVisible);
    if (t.text != null) {
        els = els.filter(e => elementText(e) === t.text);
    }
    if (t.has != null) {
        els = els.filter(e => elementText(e).includes(t.has!));
    }
    if (t.text != null || t.has != null) {
        // innermost: drop matches that contain another match
        els = els.filter(e => !els.some(o => o !== e && e.contains(o)));
    }
    if (t.nth != null) {
        return els[t.nth] ? [els[t.nth]] : [];
    }
    return els.slice(0, 1);
}

function padOf(t: TargetSpec): Box {
    if (t.pad == null) {
        return [0, 0, 0, 0];
    }
    return Array.isArray(t.pad) ? (t.pad as Box) : [t.pad, t.pad, t.pad, t.pad];
}

/**
 * The box around the elements a target finds, plus its pad, in viewport px; null when any
 * part of it is missing. With clip, the box is clipped to the window before it is padded,
 * as the capture runner measures it. Without withPad, the pad is left off: pads reproduce
 * boxes drawn on a capture of one window size.
 */
export function targetBox(
    target: Target,
    clip = false,
    withPad = true
): Box | null {
    const t = spec(target);
    const els = t.union ? t.union.map(u => findAll(u)[0]) : findAll(t);
    if (!els.length || els.some(e => !e)) {
        return null;
    }
    let b = els
        .map(e => {
            const r = e.getBoundingClientRect();
            return [r.left, r.top, r.right, r.bottom] as Box;
        })
        .reduce((a, r) => [
            Math.min(a[0], r[0]),
            Math.min(a[1], r[1]),
            Math.max(a[2], r[2]),
            Math.max(a[3], r[3]),
        ]);
    if (clip) {
        b = [
            Math.max(0, b[0]),
            Math.max(0, b[1]),
            Math.min(window.innerWidth, b[2]),
            Math.min(window.innerHeight, b[3]),
        ].map(Math.round) as Box;
    }
    const p = withPad ? padOf(t) : [0, 0, 0, 0];
    return [b[0] - p[0], b[1] - p[1], b[2] + p[2], b[3] + p[3]];
}
