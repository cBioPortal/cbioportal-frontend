const SLIDE_KEY = /^[0-9a-f]{12}$/;
// WSI-1234-094d-6bc6 and 1234-094d-6bc6, or WSI-1234094d6bc6.
const DISPLAYED_SLIDE_ID = /^(?:wsi-)?([0-9a-f]{4})-([0-9a-f]{4})-([0-9a-f]{4})$|^wsi-([0-9a-f]{12})$/i;

/**
 * How the UI shows a slide key: `WSI-` and the 12 hex chars in groups of four
 * (`WSI-1234-094d-6bc6`). Keys, links and the API keep the bare form; anything
 * that is not a slide key is returned unchanged.
 */
export function formatSlideId(slideKey: string): string {
    return SLIDE_KEY.test(slideKey)
        ? `WSI-${slideKey.slice(0, 4)}-${slideKey.slice(4, 8)}-${slideKey.slice(
              8
          )}`
        : slideKey;
}

/**
 * The bare slide key a displayed Slide ID stands for (`WSI-1234-094d-6bc6`,
 * also without the prefix or without the dashes, any case), or null when the
 * text is not a displayed Slide ID.
 */
export function slideKeyFromSlideId(text: string): string | null {
    const match = text.trim().match(DISPLAYED_SLIDE_ID);
    return match
        ? match
              .slice(1)
              .filter(Boolean)
              .join('')
              .toLowerCase()
        : null;
}
