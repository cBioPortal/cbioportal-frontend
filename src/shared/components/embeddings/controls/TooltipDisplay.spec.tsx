import { assert } from 'chai';
import { mount } from 'enzyme';
import * as React from 'react';
import { TooltipDisplay, TooltipDisplayProps } from './TooltipDisplay';
import { EmbeddingPoint } from '../EmbeddingTypes';

describe('TooltipDisplay', () => {
    const point: EmbeddingPoint = {
        x: 1.5,
        y: -2.5,
        patientId: 'P-0000012',
        sampleId: 'P-0000012-T03-IM3',
        uniqueSampleKey: 'key1',
        studyId: 'msk_impact_50k_2026',
        displayLabel: 'Breast Cancer',
        isInCohort: true,
    };

    function makeProps(
        overrides: Partial<TooltipDisplayProps> = {}
    ): TooltipDisplayProps {
        return {
            hoveredPoint: point,
            embeddingType: 'samples',
            ...overrides,
        };
    }

    function caseLinks(props: TooltipDisplayProps) {
        const wrapper = mount(<TooltipDisplay {...props} />);
        return wrapper
            .find('a[data-test="embeddings-tooltip-case-link"]')
            .map(a => ({ text: a.text(), href: a.prop('href') as string }));
    }

    it('leaves the case ids as plain text while the tooltip only follows the cursor', () => {
        assert.deepEqual(caseLinks(makeProps()), []);
    });

    it('links the patient and sample ids once the tooltip is pinned', () => {
        const links = caseLinks(makeProps({ isPinned: true }));
        assert.equal(links.length, 2);
        assert.equal(links[0].text, 'P-0000012');
        assert.include(links[0].href, 'caseId=P-0000012');
        assert.include(links[0].href, 'studyId=msk_impact_50k_2026');
        assert.equal(links[1].text, 'P-0000012-T03-IM3');
        assert.include(links[1].href, 'sampleId=P-0000012-T03-IM3');
        assert.include(links[1].href, 'studyId=msk_impact_50k_2026');
    });

    it('leaves a point with no study unlinked, since no page could be named', () => {
        const links = caseLinks(
            makeProps({
                isPinned: true,
                hoveredPoint: { ...point, studyId: undefined },
            })
        );
        assert.deepEqual(links, []);
    });

    it('leaves an out-of-cohort point unlinked', () => {
        const links = caseLinks(
            makeProps({
                isPinned: true,
                hoveredPoint: {
                    ...point,
                    isInCohort: false,
                    studyId: undefined,
                },
            })
        );
        assert.deepEqual(links, []);
    });
});
