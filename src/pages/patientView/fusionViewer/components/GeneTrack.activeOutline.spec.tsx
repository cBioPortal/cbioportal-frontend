import * as React from 'react';
import { assert } from 'chai';
import { mount, ReactWrapper } from 'enzyme';
import { GeneTrack } from './GeneTrack';
import { TranscriptData } from '../data/types';

// The active-transcript outline group is positioned only by its transform.
// Row y positions (see GeneTrack.tsx): FORTE row at y + LABEL_HEIGHT (36),
// first user row a further FORTE_TRACK_HEIGHT (48) below.
const FORTE_ROW_Y = 36;
const USER_ROW_Y = 36 + 48;

function makeTranscript(id: string, isForte: boolean): TranscriptData {
    return {
        transcriptId: id,
        displayName: id,
        gene: 'GENE_A',
        biotype: 'protein_coding',
        strand: '+',
        txStart: 100,
        txEnd: 500,
        exons: [
            { number: 1, start: 100, end: 200 },
            { number: 2, start: 300, end: 400 },
        ],
        isForteSelected: isForte,
        isCallerSelected: false,
        isCanonical: false,
        domains: [],
        utrs: [],
    };
}

const forte = makeTranscript('ENST_FORTE', true);
const user = makeTranscript('ENST_USER', false);

const Track: React.FC<{ active: string }> = ({ active }) => (
    <svg>
        <GeneTrack
            symbol="GENE_A"
            chromosome="1"
            position={250}
            strand="+"
            siteDescription=""
            forteTranscript={forte}
            userTranscripts={[user]}
            activeTranscriptId={active}
            color="#1864ab"
            x={0}
            y={0}
            width={400}
            is5Prime={true}
        />
    </svg>
);

function outlineTransform(wrapper: ReactWrapper, id: string): string | null {
    const rect = wrapper
        .find(`rect[data-testid="gene-track-active-outline-${id}"]`)
        .getDOMNode();
    return rect.parentElement!.getAttribute('transform');
}

let frames: FrameRequestCallback[];
let realRaf: typeof window.requestAnimationFrame;
let realCaf: typeof window.cancelAnimationFrame;

function flushFrames(timestamp: number) {
    const batch = frames;
    frames = [];
    batch.forEach(cb => cb(timestamp));
}

beforeEach(() => {
    frames = [];
    realRaf = window.requestAnimationFrame;
    realCaf = window.cancelAnimationFrame;
    window.requestAnimationFrame = cb => frames.push(cb);
    window.cancelAnimationFrame = () => {
        frames = [];
    };
});

afterEach(() => {
    window.requestAnimationFrame = realRaf;
    window.cancelAnimationFrame = realCaf;
});

describe('GeneTrack — active-transcript outline position', () => {
    it('is placed on the active row on first render, without animating', () => {
        const wrapper = mount(<Track active="ENST_FORTE" />);
        assert.equal(
            outlineTransform(wrapper, 'ENST_FORTE'),
            `translate(0, ${FORTE_ROW_Y})`
        );
        assert.lengthOf(frames, 0, 'no animation frames on first render');
    });

    it('is placed on a user row when that row is active on first render', () => {
        const wrapper = mount(<Track active="ENST_USER" />);
        assert.equal(
            outlineTransform(wrapper, 'ENST_USER'),
            `translate(0, ${USER_ROW_Y})`
        );
    });

    it('slides from the old row to the new row when the active row changes', () => {
        const wrapper = mount(<Track active="ENST_FORTE" />);
        wrapper.setProps({ active: 'ENST_USER' });
        // Starts where it was, then animates.
        assert.equal(
            outlineTransform(wrapper, 'ENST_USER'),
            `translate(0, ${FORTE_ROW_Y})`
        );
        assert.isAbove(frames.length, 0, 'a tween was scheduled');
        flushFrames(0);
        flushFrames(100);
        const mid = Number(
            /translate\(0, ([-\d.]+)\)/.exec(
                outlineTransform(wrapper, 'ENST_USER')!
            )![1]
        );
        assert.isAbove(mid, FORTE_ROW_Y);
        assert.isBelow(mid, USER_ROW_Y);
        flushFrames(1000);
        assert.equal(
            outlineTransform(wrapper, 'ENST_USER'),
            `translate(0, ${USER_ROW_Y})`
        );
    });
});
