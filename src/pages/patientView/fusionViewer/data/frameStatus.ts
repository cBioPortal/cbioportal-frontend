/**
 * Frame-status normalization for fusion events.
 *
 * The raw `site2EffectOnFrame` / `frameCallMethod` field is inconsistent across
 * callers (e.g. "In_frame", "in frame", "out_of_frame", "frameshift", "", "NA").
 * This module normalises it into a small typed enum and attaches display
 * metadata (label, color, background, icon) used consistently by the Fusion
 * Viewer info bar, the junction glyph, and the patient-view SV table.
 *
 * Precedence (tested in order, case-insensitive after normalisation):
 *   1. "out of frame" / "frameshift" / "frame shift" / "stop" / "truncat" → OutOfFrame
 *   2. "in frame" (and not "out") → InFrame
 *   3. Everything else (empty, "na", "unknown", etc.) → Unknown
 *
 * The out-of-frame check must come before the in-frame check so that a
 * hypothetical string like "out of frame" never partially matches the
 * "in frame" substring.
 */

export enum FrameStatus {
    InFrame = 'IN_FRAME',
    OutOfFrame = 'OUT_OF_FRAME',
    Unknown = 'UNKNOWN',
}

export interface FrameStatusDisplay {
    status: FrameStatus;
    /** Human-readable label, e.g. 'In frame' */
    label: string;
    /** Text and border colour */
    color: string;
    /** Badge background colour */
    bg: string;
    /** Unicode glyph prefix used in the badge and table cell */
    icon: string;
}

const DISPLAYS: Record<FrameStatus, FrameStatusDisplay> = {
    [FrameStatus.InFrame]: {
        status: FrameStatus.InFrame,
        label: 'In frame',
        color: '#3c763d',
        bg: '#dff0d8',
        icon: '✓', // ✓
    },
    [FrameStatus.OutOfFrame]: {
        status: FrameStatus.OutOfFrame,
        label: 'Out of frame',
        color: '#a94442',
        bg: '#f2dede',
        icon: '⚠', // ⚠
    },
    [FrameStatus.Unknown]: {
        status: FrameStatus.Unknown,
        label: 'Frame unknown',
        color: '#777',
        bg: '#eee',
        icon: '?',
    },
};

/**
 * Normalise a raw caller frame-status string into a {@link FrameStatusDisplay}.
 *
 * Handles null / undefined (treat as Unknown), literal "NA" / "N/A",
 * underscore/hyphen separators, and arbitrary capitalisation.
 */
export function classifyFrameStatus(
    raw: string | null | undefined
): FrameStatusDisplay {
    if (raw == null || raw.trim() === '') {
        return DISPLAYS[FrameStatus.Unknown];
    }

    // Normalise: lowercase, replace underscores and hyphens with spaces, trim.
    const norm = raw
        .toLowerCase()
        .replace(/[_-]/g, ' ')
        .trim();

    if (norm === 'na' || norm === 'n/a' || norm === 'unknown') {
        return DISPLAYS[FrameStatus.Unknown];
    }

    // Out-of-frame patterns must be checked BEFORE in-frame to avoid the
    // substring "in frame" matching inside "out of frame".
    if (
        norm.includes('out of frame') ||
        norm.includes('frameshift') ||
        norm.includes('frame shift') ||
        norm.includes('stop') ||
        norm.includes('truncat')
    ) {
        return DISPLAYS[FrameStatus.OutOfFrame];
    }

    if (norm.includes('in frame')) {
        return DISPLAYS[FrameStatus.InFrame];
    }

    return DISPLAYS[FrameStatus.Unknown];
}

/** Expose display metadata for a known FrameStatus (useful for legend/docs). */
export function getFrameStatusDisplay(status: FrameStatus): FrameStatusDisplay {
    return DISPLAYS[status];
}
