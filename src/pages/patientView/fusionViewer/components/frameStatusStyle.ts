import { FrameStatus } from '../data/types';

export interface FrameStatusStyle {
    label: string;
    /** Fill color for a solid pill/cell. Ignored visually when hollow. */
    fill: string;
    /** When true, render as an outline (no fill) — the "unknown" treatment. */
    hollow: boolean;
}

const STYLES: Record<FrameStatus, FrameStatusStyle> = {
    inFrame: { label: 'In-frame', fill: '#2f9e44', hollow: false },
    outOfFrame: { label: 'Out-of-frame', fill: '#868e96', hollow: false },
    unknown: { label: 'Unknown', fill: '#ffffff', hollow: true },
};

/** Map a 3-state FrameStatus to its pill/cell styling. */
export function frameStatusStyle(status: FrameStatus): FrameStatusStyle {
    return STYLES[status];
}
