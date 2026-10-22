const SLIDE_KEY = /^[0-9a-f]{12}$/;
const DASHED_SLIDE_ID = /^([0-9a-f]{4})-([0-9a-f]{4})-([0-9a-f]{4})$/i;

/**
 * How the UI shows a slide key: the 12 hex chars in groups of four
 * (`1234-094d-6bc6`). Keys, links and the API keep the bare form; anything
 * that is not a slide key is returned unchanged.
 */
export function formatSlideId(slideKey: string): string {
    return SLIDE_KEY.test(slideKey)
        ? `${slideKey.slice(0, 4)}-${slideKey.slice(4, 8)}-${slideKey.slice(8)}`
        : slideKey;
}

/**
 * The bare slide key a displayed Slide ID (`1234-094d-6bc6`, any case)
 * stands for, or null when the text is not a dashed Slide ID.
 */
export function slideKeyFromSlideId(text: string): string | null {
    const match = DASHED_SLIDE_ID.exec(text.trim());
    return match
        ? match
              .slice(1)
              .join('')
              .toLowerCase()
        : null;
}
