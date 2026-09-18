import { assert } from 'chai';
import {
    createCalledOnlyFrameProvider,
    frameProviderForFusion,
} from './frameProvider';
import { FrameStatus } from './frameStatus';
import { FusionEvent } from './types';

describe('createCalledOnlyFrameProvider', () => {
    const provider = createCalledOnlyFrameProvider(
        'ENST_5',
        'ENST_3',
        FrameStatus.InFrame
    );

    it('returns the called frame for the called combo', () => {
        assert.equal(
            provider.getFrame('ENST_5', 'ENST_3'),
            FrameStatus.InFrame
        );
    });

    it('returns undefined for any other combo', () => {
        assert.isUndefined(provider.getFrame('ENST_5', 'ENST_OTHER'));
        assert.isUndefined(provider.getFrame('ENST_X', 'ENST_3'));
    });
});

describe('frameProviderForFusion', () => {
    const fusion = {
        gene1: { selectedTranscriptId: 'ENST_5' },
        gene2: { selectedTranscriptId: 'ENST_3' },
        frameCallMethod: 'In_frame',
    } as FusionEvent;

    it('resolves the called combo frame from frameCallMethod', () => {
        const p = frameProviderForFusion(fusion);
        assert.equal(p.getFrame('ENST_5', 'ENST_3'), FrameStatus.InFrame);
        assert.isUndefined(p.getFrame('ENST_5', 'ENST_ALT'));
    });

    it('treats a null gene2 as an empty 3p called id', () => {
        const single = {
            gene1: { selectedTranscriptId: 'ENST_5' },
            gene2: null,
            frameCallMethod: 'out_of_frame',
        } as FusionEvent;
        const p = frameProviderForFusion(single);
        assert.equal(p.getFrame('ENST_5', ''), FrameStatus.OutOfFrame);
    });
});
