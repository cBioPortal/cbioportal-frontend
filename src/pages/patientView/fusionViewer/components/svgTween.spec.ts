import { assert } from 'chai';
import {
    easeOutQuad,
    killTweensOf,
    resetTween,
    tween,
    tweenAttrs,
} from './svgTween';

// ---------------------------------------------------------------------------
// Fake requestAnimationFrame: callbacks queue up and only run when the test
// calls step(timestamp), so every frame's time is deterministic.
// ---------------------------------------------------------------------------
let queue: Map<number, FrameRequestCallback>;
let nextId: number;
let realRaf: typeof window.requestAnimationFrame;
let realCaf: typeof window.cancelAnimationFrame;
let realMatchMedia: typeof window.matchMedia;

function step(timestamp: number) {
    const frame = Array.from(queue.values());
    queue.clear();
    frame.forEach(cb => cb(timestamp));
}

function makeRect(x: number, width: number): SVGRectElement {
    const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    rect.setAttribute('x', String(x));
    rect.setAttribute('width', String(width));
    return rect;
}

const num = (el: Element, attr: string) => Number(el.getAttribute(attr));

beforeEach(() => {
    queue = new Map();
    nextId = 1;
    realRaf = window.requestAnimationFrame;
    realCaf = window.cancelAnimationFrame;
    realMatchMedia = window.matchMedia;
    window.requestAnimationFrame = (cb: FrameRequestCallback) => {
        const id = nextId++;
        queue.set(id, cb);
        return id;
    };
    window.cancelAnimationFrame = (id: number) => {
        queue.delete(id);
    };
    (window as any).matchMedia = undefined; // jsdom has none by default
});

afterEach(() => {
    window.requestAnimationFrame = realRaf;
    window.cancelAnimationFrame = realCaf;
    window.matchMedia = realMatchMedia;
});

describe('easeOutQuad', () => {
    it('matches GSAP power2.out: 1 - (1 - t)^2', () => {
        assert.equal(easeOutQuad(0), 0);
        assert.equal(easeOutQuad(1), 1);
        assert.closeTo(easeOutQuad(0.5), 0.75, 1e-12);
        assert.closeTo(easeOutQuad(0.25), 1 - 0.75 * 0.75, 1e-12);
    });
});

describe('tweenAttrs', () => {
    it('applies the from values immediately', () => {
        const rect = makeRect(999, 999);
        tweenAttrs(
            rect,
            { x: 10, width: 20 },
            { x: 110, width: 40 },
            {
                duration: 0.35,
            }
        );
        assert.equal(num(rect, 'x'), 10);
        assert.equal(num(rect, 'width'), 20);
    });

    it('ends exactly on the target values and stops scheduling frames', () => {
        const rect = makeRect(0, 0);
        tweenAttrs(
            rect,
            { x: 0.1, width: 3 },
            { x: 123.456, width: 7.89 },
            {
                duration: 0.35,
            }
        );
        step(1000); // first frame = clock start
        step(1100);
        step(1400); // past the 350 ms duration
        assert.equal(rect.getAttribute('x'), '123.456');
        assert.equal(rect.getAttribute('width'), '7.89');
        assert.equal(queue.size, 0, 'no frames left after the end');
    });

    it('is monotonic and follows the ease at each frame', () => {
        const rect = makeRect(0, 0);
        tweenAttrs(
            rect,
            { x: 0 },
            { x: 100 },
            {
                duration: 1,
                ease: easeOutQuad,
            }
        );
        step(0);
        let last = num(rect, 'x');
        for (let ms = 100; ms <= 1000; ms += 100) {
            step(ms);
            const value = num(rect, 'x');
            assert.isAtLeast(value, last, `non-decreasing at ${ms} ms`);
            assert.closeTo(value, 100 * easeOutQuad(ms / 1000), 1e-9);
            last = value;
        }
        assert.equal(last, 100);
    });

    it('killTweensOf stops the running tween', () => {
        const rect = makeRect(0, 0);
        tweenAttrs(rect, { x: 0 }, { x: 100 }, { duration: 1 });
        step(0);
        step(500);
        const frozen = num(rect, 'x');
        killTweensOf(rect);
        step(1000);
        assert.equal(num(rect, 'x'), frozen);
        assert.equal(queue.size, 0);
    });

    it('a new tween on the same element supersedes the old one', () => {
        const rect = makeRect(0, 0);
        tweenAttrs(rect, { x: 0 }, { x: 100 }, { duration: 1 });
        step(0);
        step(500);
        tweenAttrs(rect, { x: 50 }, { x: -20 }, { duration: 1 });
        assert.equal(queue.size, 1, 'old frame cancelled');
        step(600);
        step(2000);
        assert.equal(num(rect, 'x'), -20);
        assert.equal(queue.size, 0);
    });

    it('tweens on different elements run independently', () => {
        const a = makeRect(0, 0);
        const b = makeRect(0, 0);
        tweenAttrs(a, { x: 0 }, { x: 10 }, { duration: 1 });
        tweenAttrs(b, { x: 0 }, { x: 20 }, { duration: 1 });
        killTweensOf(a);
        step(0);
        step(1000);
        assert.equal(num(a, 'x'), 0);
        assert.equal(num(b, 'x'), 20);
    });

    it('jumps straight to the end under prefers-reduced-motion', () => {
        (window as any).matchMedia = (q: string) => ({
            matches: q === '(prefers-reduced-motion: reduce)',
        });
        const rect = makeRect(0, 0);
        tweenAttrs(
            rect,
            { x: 0, width: 1 },
            { x: 100, width: 50 },
            {
                duration: 0.35,
            }
        );
        assert.equal(num(rect, 'x'), 100);
        assert.equal(num(rect, 'width'), 50);
        assert.equal(queue.size, 0, 'no frames scheduled');
    });

    it('animates when matchMedia exists but reduced motion is off', () => {
        (window as any).matchMedia = () => ({ matches: false });
        const rect = makeRect(0, 0);
        tweenAttrs(rect, { x: 0 }, { x: 100 }, { duration: 1 });
        assert.equal(num(rect, 'x'), 0);
        assert.equal(queue.size, 1);
    });
});

describe('tween (custom apply)', () => {
    it('passes interpolated values to the apply callback', () => {
        const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        const seen: number[] = [];
        tween(g, { y: 0 }, { y: 40 }, { duration: 1 }, (el, v) => {
            seen.push(v.y);
            el.setAttribute('transform', `translate(0, ${v.y})`);
        });
        step(0);
        step(1000);
        assert.equal(seen[0], 0);
        assert.equal(seen[seen.length - 1], 40);
        assert.equal(g.getAttribute('transform'), 'translate(0, 40)');
    });
});

describe('resetTween', () => {
    it('kills the running tween and forces opacity back to 1', () => {
        const rect = makeRect(0, 0);
        rect.style.opacity = '0';
        tweenAttrs(rect, { x: 0 }, { x: 100 }, { duration: 1 });
        resetTween(rect);
        assert.equal(rect.style.opacity, '1');
        assert.equal(queue.size, 0);
    });
});
