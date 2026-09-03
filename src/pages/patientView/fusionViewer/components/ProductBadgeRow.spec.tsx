import * as React from 'react';
import { assert } from 'chai';
import { mount } from 'enzyme';
import { ProductBadgeRow, alternateIsoformText } from './ProductBadgeRow';
import { FrameStatus, getFrameStatusDisplay } from '../data/frameStatus';

describe('ProductBadgeRow', () => {
    it('renders the frame label and caller letters on a called in-frame combo', () => {
        const wrapper = mount(
            <ProductBadgeRow
                frame={getFrameStatusDisplay(FrameStatus.InFrame)}
                callerState={{
                    kind: 'called',
                    callers: ['Arriba', 'FusionCatcher'],
                    rawCallMethod: 'AF',
                }}
            />
        );
        assert.include(wrapper.text(), 'In frame');
        assert.include(wrapper.text(), 'AF');
    });

    it('renders a user-selected marker + Frame unknown off the called combo', () => {
        const wrapper = mount(
            <ProductBadgeRow
                frame={getFrameStatusDisplay(FrameStatus.Unknown)}
                callerState={{
                    kind: 'userSelected',
                    calledTranscriptLabel: 'ENST_5::ENST_3',
                    isRnaDerived: true,
                }}
            />
        );
        assert.include(wrapper.text(), 'Frame unknown');
        assert.include(wrapper.text().toLowerCase(), 'alternate isoform');
    });

    it('renders the out-of-frame display', () => {
        const wrapper = mount(
            <ProductBadgeRow
                frame={getFrameStatusDisplay(FrameStatus.OutOfFrame)}
                callerState={{
                    kind: 'called',
                    callers: [],
                    rawCallMethod: 'TRANSLOCATION',
                }}
            />
        );
        assert.include(wrapper.text(), 'Out of frame');
        // DNA-SV variant class still shows on the called combo.
        assert.include(wrapper.text(), 'TRANSLOCATION');
    });
});

describe('alternateIsoformText', () => {
    it('uses caller wording for an RNA-derived fusion', () => {
        const text = alternateIsoformText({
            kind: 'userSelected',
            calledTranscriptLabel: 'ENST_5::ENST_3',
            isRnaDerived: true,
        });
        assert.include(text, 'the fusion caller reported');
        assert.include(text, 'ENST_5::ENST_3');
    });

    it('uses annotated-transcript wording for a DNA structural variant', () => {
        const text = alternateIsoformText({
            kind: 'userSelected',
            calledTranscriptLabel: 'ENST_5::ENST_3',
            isRnaDerived: false,
        });
        assert.notInclude(text, 'caller');
        assert.include(text, 'annotated');
        assert.include(text, 'genomic level');
    });
});
