import { FusionEvent } from './types';
import { FrameStatus, classifyFrameStatus } from './frameStatus';

/**
 * Frame status for a specific 5'×3' transcript combination.
 *
 * Today only the CALLED combo has a known frame; alternates return undefined.
 * When per-combo frame data is delivered ("called for all genes" + "all combos
 * for a subset"), replace the factory internals — the store and UI are unchanged.
 */
export interface FrameProvider {
    /** undefined = no frame data for this combo. */
    getFrame(tx5pId: string, tx3pId: string): FrameStatus | undefined;
}

/**
 * Provider that knows frame ONLY for the called transcript combo.
 * Returns `calledFrame` when (tx5pId, tx3pId) matches the called combo,
 * undefined for every other combo.
 */
export function createCalledOnlyFrameProvider(
    calledTx5pId: string,
    calledTx3pId: string,
    calledFrame: FrameStatus
): FrameProvider {
    return {
        getFrame(tx5pId: string, tx3pId: string): FrameStatus | undefined {
            if (tx5pId === calledTx5pId && tx3pId === calledTx3pId) {
                return calledFrame;
            }
            return undefined;
        },
    };
}

/** Build the current (called-only) provider from a fusion event. */
export function frameProviderForFusion(fusion: FusionEvent): FrameProvider {
    const called5p = fusion.gene1.selectedTranscriptId;
    const called3p = fusion.gene2 ? fusion.gene2.selectedTranscriptId : '';
    const calledFrame = classifyFrameStatus(fusion.frameCallMethod).status;
    return createCalledOnlyFrameProvider(called5p, called3p, calledFrame);
}
