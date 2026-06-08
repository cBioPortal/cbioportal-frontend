// BeaconEngine — framework-neutral DOM engine that places pulsing "beacon"
// dots over oncoprint legend labels, gene-track titles, and results-view tabs,
// keeps them pinned to their targets as the page scrolls/re-renders, and shows
// a small tooltip on click.
//
// Extracted from AlterationBeacons.tsx: all of the placement, the rAF
// reposition/pulse loop, the MutationObserver rescan, the SVG/HTML scanning,
// and the tooltip now live here. AlterationBeacons became a thin React wrapper
// (fetch highlights → setBeacons), and HostPortalContext.annotate() drives the
// same engine — so there is one beacon implementation, consumable by any client
// (React component or MCP tool call).

import { LABEL_PREFIXES } from './inventory';

export type AnnotationTarget =
    | { type: 'alteration'; alterationType: string }
    | { type: 'gene'; gene: string }
    | { type: 'tab'; tabHint: string };

export interface Beacon {
    target: AnnotationTarget;
    note: string;
    quote?: string;
    importance?: 'high' | 'medium' | 'low';
    /** Extra genes shown in the alteration tooltip subtitle. */
    genes?: string[];
    /** Optional provenance link rendered in the tooltip footer. */
    sourceUrl?: string;
    sourceLabel?: string;
}

const BEACON_ATTR = 'data-chat-beacon';
const STYLE_ID = 'chat-beacon-styles';

function beaconColor(importance?: Beacon['importance']): string {
    if (importance === 'high') return '#f97316';
    if (importance === 'medium') return '#eab308';
    return '#94a3b8';
}

function tooltipTitle(t: AnnotationTarget): string {
    switch (t.type) {
        case 'alteration':
            return t.alterationType.replace(/_/g, ' ');
        case 'gene':
            return t.gene;
        case 'tab':
            return `Tab: ${t.tabHint}`;
    }
}

function ensureBeaconStyles() {
    if (document.getElementById(STYLE_ID)) return;
    const s = document.createElement('style');
    s.id = STYLE_ID;
    s.textContent = `
        .chat-beacon-dot {
            position: absolute;
            width: 14px;
            height: 14px;
            border-radius: 50%;
            cursor: pointer;
            pointer-events: auto;
            z-index: 9990;
            box-shadow: 0 0 0 2px #fff, 0 0 6px rgba(0,0,0,0.25);
            will-change: transform, opacity;
        }
        .chat-beacon-tooltip {
            position: absolute;
            width: 340px;
            background: #ffffff;
            border: 1px solid #e5e5e7;
            box-shadow: 0 8px 24px rgba(0,0,0,0.12);
            border-radius: 8px;
            padding: 12px;
            font-size: 13px;
            line-height: 1.4;
            color: #1f2328;
            z-index: 9999;
        }
        .chat-beacon-tooltip-title { font-weight: 600; margin-bottom: 6px; text-transform: capitalize; }
        .chat-beacon-tooltip-sub { font-weight: 400; color: #6e7681; margin-left: 6px; }
        .chat-beacon-tooltip-note { margin-bottom: 8px; }
        .chat-beacon-tooltip-quote {
            margin: 0; padding: 6px 10px; border-left: 3px solid #cbd5e1;
            background: #f8fafc; font-style: italic; font-size: 12px; color: #475569;
        }
        .chat-beacon-tooltip-source { margin-top: 8px; font-size: 11px; }
        .chat-beacon-tooltip-source a { color: #3786C2; text-decoration: none; }
    `;
    (document.head || document.documentElement).appendChild(s);
}

interface PlacedBeacon {
    el: HTMLDivElement;
    target: Element;
    beacon: Beacon;
}

export class BeaconEngine {
    private beacons: Beacon[] = [];
    private placed: PlacedBeacon[] = [];
    private observer: MutationObserver | null = null;
    private scheduled = false;
    private rafId: number | null = null;
    private destroyed = false;
    private tooltipEl: HTMLDivElement | null = null;
    private backdropEl: HTMLDivElement | null = null;

    constructor() {
        ensureBeaconStyles();
    }

    /** Begin observing the DOM and running the reposition/pulse loop. */
    start() {
        if (this.observer || this.destroyed) return;
        this.observer = new MutationObserver(() => this.scheduleScan());
        this.observer.observe(document.body, {
            childList: true,
            subtree: true,
        });
        document.addEventListener('keydown', this.onKeyDown);
        const tick = () => {
            this.repositionAll();
            this.rafId = requestAnimationFrame(tick);
        };
        this.rafId = requestAnimationFrame(tick);
    }

    /** Replace the set of beacons and (re)scan the DOM to place them. */
    setBeacons(beacons: Beacon[]) {
        this.beacons = beacons;
        this.clearBeacons();
        this.dismissTooltip();
        this.scheduleScan();
    }

    /** Remove all placed beacons and any open tooltip. */
    clear() {
        this.beacons = [];
        this.clearBeacons();
        this.dismissTooltip();
    }

    /** Tear down listeners and DOM. The shared <style> is left in place. */
    destroy() {
        this.destroyed = true;
        this.observer?.disconnect();
        this.observer = null;
        document.removeEventListener('keydown', this.onKeyDown);
        if (this.rafId != null) cancelAnimationFrame(this.rafId);
        this.rafId = null;
        this.clearBeacons();
        this.dismissTooltip();
    }

    // --- scanning / matching ------------------------------------------------

    private onKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') this.dismissTooltip();
    };

    private scheduleScan = () => {
        if (this.scheduled || this.destroyed) return;
        this.scheduled = true;
        requestAnimationFrame(() => {
            this.scheduled = false;
            if (this.destroyed) return;
            this.scanAndPlace();
        });
    };

    private scanAndPlace() {
        if (this.beacons.length === 0) return;
        this.clearBeacons();
        this.scanSvgTexts();
        this.scanHtmlTabs();
        this.repositionAll();
    }

    private findAlterationBeaconForLabel(text: string): Beacon | null {
        for (const b of this.beacons) {
            if (b.target.type !== 'alteration') continue;
            const prefixes = LABEL_PREFIXES[b.target.alterationType] ?? [];
            for (const p of prefixes) {
                if (text.startsWith(p)) return b;
            }
        }
        return null;
    }

    private findGeneBeaconForLabel(text: string): Beacon | null {
        for (const b of this.beacons) {
            if (b.target.type !== 'gene') continue;
            const g = b.target.gene;
            if (text === g) return b;
            if (text.startsWith(g + ' ')) return b;
            if (text.startsWith(g + '\t')) return b;
        }
        return null;
    }

    private scanSvgTexts() {
        const textNodes = document.querySelectorAll<SVGTextElement>('svg text');
        const claimed = new Set<string>();
        for (const t of Array.from(textNodes)) {
            const txt = (t.textContent || '').trim();
            if (!txt) continue;
            const altB = this.findAlterationBeaconForLabel(txt);
            if (altB && altB.target.type === 'alteration') {
                const key = `alteration|${altB.target.alterationType}|${(
                    altB.genes ?? []
                ).join(',')}`;
                if (!claimed.has(key)) {
                    claimed.add(key);
                    this.placeBeacon(t, altB);
                }
                continue;
            }
            const geneB = this.findGeneBeaconForLabel(txt);
            if (geneB && geneB.target.type === 'gene') {
                const key = `gene|${geneB.target.gene}`;
                if (!claimed.has(key)) {
                    claimed.add(key);
                    this.placeBeacon(t, geneB);
                }
            }
        }
    }

    private scanHtmlTabs() {
        const claimed = new Set<string>();
        for (const b of this.beacons) {
            if (b.target.type !== 'tab') continue;
            const key = `tab|${b.target.tabHint}`;
            if (claimed.has(key)) continue;
            const anchor = document.querySelector<HTMLElement>(
                `.tabAnchor_${b.target.tabHint}`
            );
            if (!anchor) continue;
            claimed.add(key);
            this.placeBeacon(anchor, b);
        }
    }

    private placeBeacon(target: Element, b: Beacon) {
        const div = document.createElement('div');
        div.setAttribute(BEACON_ATTR, b.target.type);
        div.className = 'chat-beacon-dot';
        div.style.background = beaconColor(b.importance);
        const noteShort =
            b.note.length > 160 ? b.note.slice(0, 160) + '…' : b.note;
        div.title = `${tooltipTitle(
            b.target
        )}: ${noteShort}\n(click for details)`;
        const handler = (e: Event) => {
            e.stopPropagation();
            e.preventDefault();
            this.onBeaconClick(div, b);
        };
        div.addEventListener('click', handler);
        div.addEventListener('mousedown', handler);
        document.body.appendChild(div);
        this.placed.push({ el: div, target, beacon: b });
    }

    private clearBeacons() {
        for (const p of this.placed) p.el.remove();
        this.placed = [];
    }

    // For HTML targets, measure the inline text content via Range so the beacon
    // sits flush with the last character (ignoring padding/borders on the
    // wrapping element). For SVG <text>, getBoundingClientRect already IS the
    // text-only rect.
    private getTargetTextRect(target: Element): DOMRect | null {
        if (target instanceof SVGElement) {
            return target.getBoundingClientRect();
        }
        try {
            const range = document.createRange();
            range.selectNodeContents(target);
            const rect = range.getBoundingClientRect();
            if (rect.width > 0 || rect.height > 0) return rect;
        } catch {
            /* fall through */
        }
        return target.getBoundingClientRect();
    }

    // Manual pulse driven by the rAF loop — bypasses CSS @keyframes and the Web
    // Animations API entirely. If beacons follow their targets at all, they MUST
    // also pulse, because both use the same loop.
    private repositionAll() {
        if (this.placed.length === 0) return;
        const now = performance.now();
        const phase = (now % 1400) / 1400;
        const wave = (1 - Math.cos(phase * 2 * Math.PI)) / 2; // 0..1..0
        const scale = 1 + 0.6 * wave;
        const opacity = 1 - 0.7 * wave;
        for (const p of this.placed) {
            if (!p.target.isConnected) {
                p.el.style.display = 'none';
                continue;
            }
            const rect = this.getTargetTextRect(p.target);
            if (!rect || (rect.width === 0 && rect.height === 0)) {
                p.el.style.display = 'none';
                continue;
            }
            p.el.style.display = 'block';
            const top = rect.top + window.scrollY + rect.height / 2 - 7;
            // Pull the beacon back so it overlaps the end of the word — center
            // of the 14px dot lands a few px past the last character.
            const left = rect.right + window.scrollX - 8;
            p.el.style.top = `${top}px`;
            p.el.style.left = `${left}px`;
            p.el.style.transform = `scale(${scale})`;
            p.el.style.opacity = `${opacity}`;
        }
    }

    // --- tooltip ------------------------------------------------------------

    private onBeaconClick(el: Element, b: Beacon) {
        this.dismissTooltip();
        const anchor = el.getBoundingClientRect();

        const backdrop = document.createElement('div');
        backdrop.style.cssText =
            'position:fixed;inset:0;z-index:9998;background:transparent;';
        backdrop.addEventListener('click', () => this.dismissTooltip());
        document.body.appendChild(backdrop);
        this.backdropEl = backdrop;

        const tip = document.createElement('div');
        tip.className = 'chat-beacon-tooltip';
        tip.addEventListener('click', e => e.stopPropagation());

        const title = document.createElement('div');
        title.className = 'chat-beacon-tooltip-title';
        title.textContent = tooltipTitle(b.target);
        if (b.target.type === 'alteration' && b.genes && b.genes.length > 0) {
            const sub = document.createElement('span');
            sub.className = 'chat-beacon-tooltip-sub';
            sub.textContent = `— ${b.genes.join(', ')}`;
            title.appendChild(sub);
        }
        tip.appendChild(title);

        const note = document.createElement('div');
        note.className = 'chat-beacon-tooltip-note';
        note.textContent = b.note;
        tip.appendChild(note);

        if (b.quote) {
            const quote = document.createElement('blockquote');
            quote.className = 'chat-beacon-tooltip-quote';
            quote.textContent = `"${b.quote}"`;
            tip.appendChild(quote);
        }

        if (b.sourceUrl) {
            const footer = document.createElement('div');
            footer.className = 'chat-beacon-tooltip-source';
            const a = document.createElement('a');
            a.href = b.sourceUrl;
            a.target = '_blank';
            a.rel = 'noreferrer noopener';
            a.textContent = `${b.sourceLabel ?? 'Source'} ↗`;
            footer.appendChild(a);
            tip.appendChild(footer);
        }

        const top = anchor.bottom + window.scrollY + 8;
        const left = Math.min(
            anchor.left + window.scrollX,
            window.innerWidth - 360
        );
        tip.style.top = `${top}px`;
        tip.style.left = `${left}px`;
        document.body.appendChild(tip);
        this.tooltipEl = tip;
    }

    private dismissTooltip() {
        this.tooltipEl?.remove();
        this.tooltipEl = null;
        this.backdropEl?.remove();
        this.backdropEl = null;
    }
}
