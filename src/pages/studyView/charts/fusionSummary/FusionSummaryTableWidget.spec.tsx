import { assert } from 'chai';
import { mount } from 'enzyme';
import * as React from 'react';
import FusionSummaryTableWidget, {
    summaryTitle,
} from './FusionSummaryTableWidget';
import { FusionCohortStore } from 'pages/patientView/fusionViewer/FusionCohortStore';
import { FusionEvent } from 'pages/patientView/fusionViewer/data/types';

// ---------------------------------------------------------------------------
// Mock adapter — pass inputs through as FusionEvents, same as FusionCohortStore.spec.ts
// ---------------------------------------------------------------------------

jest.mock(
    'pages/patientView/fusionViewer/data/structuralVariantAdapter',
    () => ({
        convertStructuralVariantsToFusionEvents: jest.fn((svs: any[]) =>
            svs.map((sv: any) => sv as FusionEvent)
        ),
    })
);

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

function makeEvent(overrides: Partial<FusionEvent> = {}): FusionEvent {
    return {
        id: 'S1_TMPRSS2_ERG_100_900',
        tumorId: 'S1',
        gene1: {
            symbol: 'TMPRSS2',
            chromosome: '21',
            position: 100,
            selectedTranscriptId: '',
            siteDescription: '',
        },
        gene2: {
            symbol: 'ERG',
            chromosome: '21',
            position: 900,
            selectedTranscriptId: '',
            siteDescription: '',
        },
        fusion: 'TMPRSS2::ERG',
        totalReadSupport: 10,
        callMethod: 'FUSION',
        frameCallMethod: 'in_frame',
        annotation: '',
        position: '',
        significance: 'NA',
        note: '',
        connectionType: '5to3',
        ...overrides,
    };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('summaryTitle', () => {
    it('switches label on annotation availability', () => {
        assert.equal(summaryTitle(true), 'Top recurrent fusions');
        assert.equal(summaryTitle(false), 'Top SV gene pairs');
    });
});

describe('FusionSummaryTableWidget', () => {
    it('emits an anchor when a row is clicked', () => {
        const store = new FusionCohortStore();
        store.setStructuralVariants([
            makeEvent({ id: 'e1', tumorId: 'S1' }) as any,
            makeEvent({ id: 'e2', tumorId: 'S2' }) as any,
        ]);
        let picked: any = null;
        const wrapper = mount(
            <FusionSummaryTableWidget
                store={store}
                hasFusionAnnotation={true}
                onSelectAnchor={a => (picked = a)}
            />
        );
        wrapper
            .find('[data-testid="fusion-summary-row"]')
            .hostNodes()
            .first()
            .simulate('click');
        assert.equal(picked.mode, 'pair');
        assert.isString(picked.key);
    });
});
