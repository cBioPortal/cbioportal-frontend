import { FusionEvent } from './types';
import { describeCallerSource } from './callerSource';

/**
 * Caller provenance for the VISUALIZED transcript combo.
 * - called    → the caller letters that identified the event (+ raw callMethod
 *               so DNA-SV variant-class strings still render on the default combo)
 * - userSelected → the user switched to an isoform the callers did not report;
 *               name the called transcript so the pill can say what was called.
 */
export type CallerState =
    | { kind: 'called'; callers: string[]; rawCallMethod: string }
    | { kind: 'userSelected'; calledTranscriptLabel: string };

function called5p(fusion: FusionEvent): string {
    return fusion.gene1.selectedTranscriptId;
}

function called3p(fusion: FusionEvent): string {
    return fusion.gene2 ? fusion.gene2.selectedTranscriptId : '';
}

/** True when the visualized combo equals the caller-reported (called) combo. */
export function isCalledCombo(
    fusion: FusionEvent,
    active5pId: string,
    active3pId: string
): boolean {
    return active5pId === called5p(fusion) && active3pId === called3p(fusion);
}

/** Label naming the called transcript combo, e.g. "ENST_5::ENST_3". */
export function calledTranscriptLabel(fusion: FusionEvent): string {
    const c3 = called3p(fusion);
    return c3 ? `${called5p(fusion)}::${c3}` : called5p(fusion);
}

export function resolveCallerState(
    fusion: FusionEvent,
    active5pId: string,
    active3pId: string
): CallerState {
    if (isCalledCombo(fusion, active5pId, active3pId)) {
        return {
            kind: 'called',
            callers: describeCallerSource(fusion.callMethod),
            rawCallMethod: fusion.callMethod,
        };
    }
    return {
        kind: 'userSelected',
        calledTranscriptLabel: calledTranscriptLabel(fusion),
    };
}
