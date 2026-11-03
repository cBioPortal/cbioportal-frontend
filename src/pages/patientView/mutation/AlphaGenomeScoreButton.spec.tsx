import React from 'react';
import { mount } from 'enzyme';
import { assert } from 'chai';
import { AlphaGenomeScoreButton } from './PatientViewMutationsTab';
import { PatientViewPageStore } from '../clinicalInformation/PatientViewPageStore';
import { setServerConfig } from 'config/config';

function mockStore(overrides: {
    isAlphaGenomeTriggered?: boolean;
    isAlphaGenomeScoring?: boolean;
    alphaGenomeProgress?: { done: number; total: number };
    triggerAlphaGenomeScoring?: () => void;
}): PatientViewPageStore {
    return {
        isAlphaGenomeTriggered: false,
        isAlphaGenomeScoring: false,
        alphaGenomeProgress: { done: 0, total: 0 },
        triggerAlphaGenomeScoring: () => {},
        ...overrides,
    } as PatientViewPageStore;
}

describe('AlphaGenomeScoreButton', () => {
    beforeEach(() => {
        setServerConfig({ show_alphagenome: true });
    });

    it('offers scoring with a click when not yet triggered', () => {
        let triggered = false;
        const wrapper = mount(
            <AlphaGenomeScoreButton
                store={mockStore({
                    triggerAlphaGenomeScoring: () => {
                        triggered = true;
                    },
                })}
            />
        );
        const button = wrapper.find('button');
        assert.equal(button.text(), '⚡ AlphaGenome Score Variants');
        assert.isFalse(button.is('[disabled]'));
        button.simulate('click');
        assert.isTrue(triggered);
    });

    it('shows per-chunk progress while scoring', () => {
        const wrapper = mount(
            <AlphaGenomeScoreButton
                store={mockStore({
                    isAlphaGenomeTriggered: true,
                    isAlphaGenomeScoring: true,
                    alphaGenomeProgress: { done: 16, total: 42 },
                })}
            />
        );
        const button = wrapper.find('button');
        assert.isTrue(button.prop('disabled'));
        assert.include(
            button.text().replace(/\s+/g, ' '),
            'Scoring AlphaGenome (16/42)'
        );
    });

    it('shows the scored total once scoring completes', () => {
        const wrapper = mount(
            <AlphaGenomeScoreButton
                store={mockStore({
                    isAlphaGenomeTriggered: true,
                    isAlphaGenomeScoring: false,
                    alphaGenomeProgress: { done: 42, total: 42 },
                })}
            />
        );
        const button = wrapper.find('button');
        assert.isTrue(button.prop('disabled'));
        assert.include(button.text(), 'AlphaGenome Scored (42)');
    });
});
