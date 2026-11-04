import { assert } from 'chai';
import { classifyFrameStatus, FrameStatus } from './frameStatus';

describe('classifyFrameStatus', () => {
    // -------------------------------------------------------------------------
    // InFrame cases
    // -------------------------------------------------------------------------
    it('classifies "In_frame" as InFrame', () => {
        const r = classifyFrameStatus('In_frame');
        assert.equal(r.status, FrameStatus.InFrame);
        assert.equal(r.label, 'In frame');
        assert.equal(r.color, '#3c763d');
        assert.equal(r.bg, '#dff0d8');
        assert.equal(r.icon, '✓');
    });

    it('classifies "in frame" (lowercase, space) as InFrame', () => {
        assert.equal(
            classifyFrameStatus('in frame').status,
            FrameStatus.InFrame
        );
    });

    it('classifies "IN-FRAME" (caps, hyphen) as InFrame', () => {
        assert.equal(
            classifyFrameStatus('IN-FRAME').status,
            FrameStatus.InFrame
        );
    });

    it('classifies "IN_FRAME" as InFrame', () => {
        assert.equal(
            classifyFrameStatus('IN_FRAME').status,
            FrameStatus.InFrame
        );
    });

    // -------------------------------------------------------------------------
    // OutOfFrame cases
    // -------------------------------------------------------------------------
    it('classifies "Out_of_frame" as OutOfFrame', () => {
        const r = classifyFrameStatus('Out_of_frame');
        assert.equal(r.status, FrameStatus.OutOfFrame);
        assert.equal(r.label, 'Out of frame');
        assert.equal(r.color, '#a94442');
        assert.equal(r.bg, '#f2dede');
        assert.equal(r.icon, '⚠');
    });

    it('classifies "out of frame" as OutOfFrame', () => {
        assert.equal(
            classifyFrameStatus('out of frame').status,
            FrameStatus.OutOfFrame
        );
    });

    it('classifies "frameshift" as OutOfFrame', () => {
        assert.equal(
            classifyFrameStatus('frameshift').status,
            FrameStatus.OutOfFrame
        );
    });

    it('classifies "Frameshift" as OutOfFrame', () => {
        assert.equal(
            classifyFrameStatus('Frameshift').status,
            FrameStatus.OutOfFrame
        );
    });

    it('classifies "frame shift" as OutOfFrame', () => {
        assert.equal(
            classifyFrameStatus('frame shift').status,
            FrameStatus.OutOfFrame
        );
    });

    it('classifies "Frame_shift" as OutOfFrame', () => {
        assert.equal(
            classifyFrameStatus('Frame_shift').status,
            FrameStatus.OutOfFrame
        );
    });

    it('classifies strings containing "stop" as OutOfFrame', () => {
        assert.equal(
            classifyFrameStatus('premature stop').status,
            FrameStatus.OutOfFrame
        );
    });

    it('classifies strings containing "truncat" as OutOfFrame', () => {
        assert.equal(
            classifyFrameStatus('truncation').status,
            FrameStatus.OutOfFrame
        );
        assert.equal(
            classifyFrameStatus('truncated').status,
            FrameStatus.OutOfFrame
        );
    });

    it('OUT_OF_FRAME beats in-frame substring for conflicting strings', () => {
        // "out of frame" contains "in frame" as a substring — out should win
        assert.equal(
            classifyFrameStatus('out of frame').status,
            FrameStatus.OutOfFrame
        );
    });

    it('classifies "in-frame frameshift" as OutOfFrame (frameshift wins)', () => {
        assert.equal(
            classifyFrameStatus('in-frame frameshift').status,
            FrameStatus.OutOfFrame
        );
    });

    // -------------------------------------------------------------------------
    // Unknown cases
    // -------------------------------------------------------------------------
    it('classifies empty string as Unknown', () => {
        const r = classifyFrameStatus('');
        assert.equal(r.status, FrameStatus.Unknown);
        assert.equal(r.label, 'Frame unknown');
        assert.equal(r.color, '#777');
        assert.equal(r.bg, '#eee');
        assert.equal(r.icon, '?');
    });

    it('classifies null as Unknown', () => {
        assert.equal(classifyFrameStatus(null).status, FrameStatus.Unknown);
    });

    it('classifies undefined as Unknown', () => {
        assert.equal(
            classifyFrameStatus(undefined).status,
            FrameStatus.Unknown
        );
    });

    it('classifies "NA" as Unknown', () => {
        assert.equal(classifyFrameStatus('NA').status, FrameStatus.Unknown);
    });

    it('classifies "N/A" as Unknown', () => {
        assert.equal(classifyFrameStatus('N/A').status, FrameStatus.Unknown);
    });

    it('classifies "unknown" as Unknown', () => {
        assert.equal(
            classifyFrameStatus('unknown').status,
            FrameStatus.Unknown
        );
    });

    it('classifies whitespace-only string as Unknown', () => {
        assert.equal(classifyFrameStatus('   ').status, FrameStatus.Unknown);
    });

    it('classifies arbitrary unknown strings as Unknown', () => {
        assert.equal(
            classifyFrameStatus('some_other_value').status,
            FrameStatus.Unknown
        );
    });
});
