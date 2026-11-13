import { findAll } from './targets';
import { Target, TutorialAction, TutorialBeat } from './types';

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

function first(t: Target): HTMLElement | undefined {
    return findAll(t)[0] as HTMLElement | undefined;
}

function setValue(el: HTMLElement, text: string) {
    // set the value the way React notices: through the native setter, then an input event
    const proto =
        el instanceof HTMLTextAreaElement
            ? HTMLTextAreaElement.prototype
            : HTMLInputElement.prototype;
    const setter = Object.getOwnPropertyDescriptor(proto, 'value')!.set!;
    setter.call(el, text);
    el.dispatchEvent(new Event('input', { bubbles: true }));
}

/** Does one action; false when its element isn't on the page. */
export async function runAction(a: TutorialAction): Promise<boolean> {
    if (a.click) {
        const el = first(a.click);
        if (!el) {
            return false;
        }
        // a box that's already ticked stays ticked
        if (!(el instanceof HTMLInputElement && el.checked)) {
            el.click();
        }
    } else if (a.hover) {
        const el = first(a.hover);
        if (!el) {
            return false;
        }
        el.dispatchEvent(new MouseEvent('mouseover', { bubbles: true }));
        el.dispatchEvent(new MouseEvent('mouseenter'));
    } else if (a.type) {
        const el = first(a.type.into);
        if (!el) {
            return false;
        }
        el.focus();
        setValue(el, a.type.text);
    } else if (a.scroll_to) {
        const el = first(a.scroll_to);
        if (!el) {
            return false;
        }
        el.scrollIntoView({ block: 'center' });
    } else if (a.press) {
        (document.activeElement || document.body).dispatchEvent(
            new KeyboardEvent('keydown', { key: a.press, bubbles: true })
        );
    } else if (a.wait != null) {
        if (typeof a.wait === 'number') {
            await sleep(a.wait);
        } else {
            const t0 = Date.now();
            while (!first(a.wait) && Date.now() - t0 < 10000) {
                await sleep(200);
            }
        }
    }
    return true;
}

/**
 * Replays actions until done() holds, checking after each one; stops early when an action's
 * element is missing or cancelled() holds. Returns whether done() holds at the end.
 */
export async function reveal(
    actions: TutorialAction[],
    done: () => boolean,
    cancelled: () => boolean,
    settleMs = 600
): Promise<boolean> {
    for (const a of actions) {
        if (done() || cancelled()) {
            break;
        }
        if (!(await runAction(a))) {
            break;
        }
        await sleep(settleMs);
    }
    return done();
}

function shownTargets(beat: TutorialBeat): number {
    return (beat.points || []).filter(p => p.target && findAll(p.target).length)
        .length;
}

/**
 * Closes what a beat's actions opened, so its menus don't cover the next beats: moves the
 * mouse off what they hovered, and clicks the menu button they clicked again. A click that
 * shows no fewer of the beat's elements opened a closed menu, so it is clicked once more.
 */
export async function closeBeat(beat: TutorialBeat, settleMs = 400) {
    const actions = beat.reveal || [];
    for (const a of actions) {
        const el = a.hover && first(a.hover);
        if (el) {
            el.dispatchEvent(new MouseEvent('mouseout', { bubbles: true }));
            el.dispatchEvent(new MouseEvent('mouseleave'));
        }
    }
    const toggle = actions[0] && actions[0].click && first(actions[0].click);
    if (!toggle || toggle.tagName !== 'BUTTON') {
        return;
    }
    const before = shownTargets(beat);
    toggle.click();
    await sleep(settleMs);
    if (shownTargets(beat) >= before) {
        toggle.click();
        await sleep(settleMs);
    }
}
