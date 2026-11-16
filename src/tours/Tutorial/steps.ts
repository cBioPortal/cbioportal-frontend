import { TutorialScript, TutorialStep } from './types';

/** One step per point of a beat; a beat without points (title, text, end) is one step. */
export function tutorialSteps(script: TutorialScript): TutorialStep[] {
    return script.beats.flatMap(beat =>
        beat.points && beat.points.length
            ? beat.points.map(point => ({ beat, point }))
            : [{ beat }]
    );
}

/**
 * Where to navigate for a step's page, from the current location; null when already there.
 * Between study view tabs of the same study it keeps the current query and hash, which carry
 * the filters applied so far.
 */
export function navigationFor(
    page: string | undefined,
    location: { pathname: string; search: string; hash?: string }
): string | null {
    if (!page) {
        return null;
    }
    const [path, query = ''] = page.split('?');
    if (path === location.pathname) {
        return null;
    }
    if (path.startsWith('/study') && location.pathname.startsWith('/study')) {
        const id = new URLSearchParams(query).get('id');
        if (id && id === new URLSearchParams(location.search).get('id')) {
            return path + location.search + (location.hash || '');
        }
    }
    return page;
}
