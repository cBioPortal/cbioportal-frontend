/**
 * An element (or elements) of the page, as a tutorial script names it.
 * A CSS selector, or a mapping:
 *   {css: 'button', text: 'Explore'}   elements matching css whose trimmed text is exactly `text`
 *   {css: '...', has: 'IDH1'}          ... whose text contains `has`
 *   {css: '...', within: <target>}     ... inside the element another target finds
 *   {css: '...', nth: 1}               the second match (default: the first visible one)
 *   {union: [<target>, <target>]}      one box around several elements
 *   {..., pad: 2 | [l, t, r, b]}       grow the box (px; negative shrinks)
 */
export type Target = string | TargetSpec;

export type TargetSpec = {
    css?: string;
    text?: string;
    has?: string;
    within?: Target;
    nth?: number;
    union?: Target[];
    pad?: number | number[];
};

/** [left, top, right, bottom] in px of the viewport */
export type Box = [number, number, number, number];

export type TutorialPoint = {
    n: number;
    say: string;
    target?: Target;
    /** more elements the same point refers to, outlined but not highlighted */
    also?: Target[];
    /** an element shown as hovered while the step is open */
    hover?: Target;
};

/** A user action, as the tutorial capture runner replays it. */
export type TutorialAction = {
    click?: Target;
    hover?: Target;
    type?: { into: Target; text: string };
    scroll_to?: Target;
    press?: string;
    wait?: number | Target;
};

export type TutorialLink = { label: string; text?: string; url?: string };

export type TutorialBeat = {
    kind?: 'title' | 'text' | 'end';
    title: string;
    /** the page this beat happens on; the tour navigates there */
    page?: string;
    points?: TutorialPoint[];
    /** the actions that lead to the state the beat shows: open a menu, apply a filter */
    reveal?: TutorialAction[];
    bullets?: string[];
    foot?: string;
    links?: TutorialLink[];
};

export type TutorialScript = {
    tutorial: string;
    name: string;
    study: string;
    beats: TutorialBeat[];
};

/** One step of the tour: a point of a beat, or a whole text beat. */
export type TutorialStep = {
    beat: TutorialBeat;
    point?: TutorialPoint;
};
