// Minimal, dependency-free requestAnimationFrame tweening for SVG elements.
// Replaces GSAP (whose licence is incompatible with AGPL-3.0-or-later) for the
// Fusion Viewer's three transcript-switch animations.

export type Ease = (t: number) => number;
export type TweenValues = Record<string, number>;
export type ApplyFn = (el: Element, values: TweenValues) => void;

export interface TweenOptions {
    /** Seconds (GSAP's convention). */
    duration: number;
    ease?: Ease;
}

/** Same curve as GSAP's power2.out. */
export const easeOutQuad: Ease = t => 1 - (1 - t) * (1 - t);

// At most one running tween per element; the value is its pending frame id.
const running = new WeakMap<Element, number>();

/** Like GSAP's killTweensOf: stops el's tween where it currently is. */
export function killTweensOf(el: Element): void {
    const id = running.get(el);
    if (id !== undefined) {
        window.cancelAnimationFrame(id);
        running.delete(el);
    }
}

/**
 * Stop el's tween and force it visible. Opacity is not a React-controlled
 * prop on the animated elements, so healing it every transition guarantees an
 * interrupted run can never leave an element stuck invisible.
 */
export function resetTween(el: SVGElement): void {
    killTweensOf(el);
    el.style.opacity = '1';
}

function skipAnimation(): boolean {
    if (typeof window.requestAnimationFrame !== 'function') return true;
    return (
        typeof window.matchMedia === 'function' &&
        !!window.matchMedia('(prefers-reduced-motion: reduce)')?.matches
    );
}

export const setAttrs: ApplyFn = (el, values) => {
    Object.keys(values).forEach(k => el.setAttribute(k, String(values[k])));
};

/**
 * Animate `from` → `to`, handing the interpolated values to `apply` each
 * frame. `from` is applied immediately (like GSAP's fromTo); the clock starts on
 * the first frame; the last frame applies `to` verbatim so the element always
 * ends exactly on target. Any earlier tween on `el` is cancelled.
 * Under prefers-reduced-motion the end state is applied at once.
 */
export function tween(
    el: Element,
    from: TweenValues,
    to: TweenValues,
    { duration, ease = easeOutQuad }: TweenOptions,
    apply: ApplyFn
): void {
    killTweensOf(el);
    if (skipAnimation() || duration <= 0) {
        apply(el, to);
        return;
    }
    apply(el, from);
    let start: number | null = null;
    const frame = (now: number) => {
        if (start === null) start = now;
        const t = Math.min(1, (now - start) / (duration * 1000));
        if (t >= 1) {
            running.delete(el);
            apply(el, to);
            return;
        }
        const k = ease(t);
        const values: TweenValues = {};
        Object.keys(to).forEach(key => {
            values[key] = from[key] + (to[key] - from[key]) * k;
        });
        apply(el, values);
        running.set(el, window.requestAnimationFrame(frame));
    };
    running.set(el, window.requestAnimationFrame(frame));
}

/** Tween numeric SVG attributes (x, width, x1, …) on `el`. */
export function tweenAttrs(
    el: Element,
    from: TweenValues,
    to: TweenValues,
    options: TweenOptions
): void {
    tween(el, from, to, options, setAttrs);
}
