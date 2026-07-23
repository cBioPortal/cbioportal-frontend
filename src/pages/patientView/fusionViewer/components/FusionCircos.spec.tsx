import * as React from 'react';
import { assert } from 'chai';
import { mount } from 'enzyme';
import sinon from 'sinon';
import { FusionCircos } from './FusionCircos';
import { FusionEvent } from '../data/types';

function makeFusion(overrides: Partial<FusionEvent> = {}): FusionEvent {
    return {
        id: 'fusion-1',
        tumorId: 'tumor-1',
        gene1: {
            symbol: 'TMPRSS2',
            chromosome: '21',
            position: 42880000,
            selectedTranscriptId: 'ENST_A',
            siteDescription: 'exon',
        },
        gene2: {
            symbol: 'ERG',
            chromosome: '21',
            position: 39956000,
            selectedTranscriptId: 'ENST_B',
            siteDescription: 'exon',
        },
        fusion: 'TMPRSS2::ERG',
        totalReadSupport: 10,
        callMethod: '',
        frameCallMethod: '',
        annotation: '',
        position: '',
        significance: 'NA',
        note: '',
        connectionType: '5to3',
        svIdiom: 'INTRACHROM_FUSION',
        frame: 'UNKNOWN',
        isRnaDerived: true,
        ...overrides,
    };
}

describe('FusionCircos', () => {
    it('renders one arc <path> per mappable fusion', () => {
        const fusions = [
            makeFusion({ id: 'f1' }),
            makeFusion({
                id: 'f2',
                gene2: { ...makeFusion().gene2!, chromosome: '9' },
            }),
        ];
        const wrapper = mount(
            <FusionCircos
                fusions={fusions}
                selectedFusionId="f1"
                genomeBuild="GRCh38"
                onSelectFusion={() => {}}
            />
        );
        assert.equal(wrapper.find('[data-testid="circos-arc"]').length, 2);
    });

    it('skips a fusion with gene2 === null (no chord drawn)', () => {
        const fusions = [
            makeFusion({ id: 'f1' }),
            makeFusion({ id: 'f2', gene2: null, svIdiom: 'INTERGENIC_REGION' }),
        ];
        const wrapper = mount(
            <FusionCircos
                fusions={fusions}
                selectedFusionId="f1"
                genomeBuild="GRCh38"
                onSelectFusion={() => {}}
            />
        );
        assert.equal(wrapper.find('[data-testid="circos-arc"]').length, 1);
    });

    it('skips a fusion whose chromosome is unmappable', () => {
        const fusions = [
            makeFusion({
                id: 'f1',
                gene1: { ...makeFusion().gene1, chromosome: 'GL000220.1' },
            }),
        ];
        const wrapper = mount(
            <FusionCircos
                fusions={fusions}
                selectedFusionId=""
                genomeBuild="GRCh38"
                onSelectFusion={() => {}}
            />
        );
        assert.equal(wrapper.find('[data-testid="circos-arc"]').length, 0);
    });

    it('renders the selected fusion arc at full opacity and thicker stroke than an unselected one', () => {
        const fusions = [makeFusion({ id: 'f1' }), makeFusion({ id: 'f2' })];
        const wrapper = mount(
            <FusionCircos
                fusions={fusions}
                selectedFusionId="f1"
                genomeBuild="GRCh38"
                onSelectFusion={() => {}}
            />
        );
        const selected = wrapper
            .find('[data-testid="circos-arc"]')
            .filterWhere(n => n.prop('data-fusion-id') === 'f1');
        const unselected = wrapper
            .find('[data-testid="circos-arc"]')
            .filterWhere(n => n.prop('data-fusion-id') === 'f2');

        assert.equal(selected.prop('strokeOpacity'), 1);
        assert.equal(selected.prop('strokeWidth'), 2);
        assert.isBelow(unselected.prop('strokeOpacity') as number, 1);
        assert.equal(unselected.prop('strokeWidth'), 1);
    });

    it('calls onSelectFusion with the clicked fusion id', () => {
        const onSelectFusion = sinon.spy();
        const fusions = [makeFusion({ id: 'f1' })];
        const wrapper = mount(
            <FusionCircos
                fusions={fusions}
                selectedFusionId=""
                genomeBuild="GRCh38"
                onSelectFusion={onSelectFusion}
            />
        );
        wrapper
            .find('[data-testid="circos-arc"]')
            .first()
            .simulate('click');
        assert.isTrue(onSelectFusion.calledOnceWith('f1'));
    });

    it('renders without error for an empty fusions list', () => {
        const wrapper = mount(
            <FusionCircos
                fusions={[]}
                selectedFusionId=""
                genomeBuild="GRCh38"
                onSelectFusion={() => {}}
            />
        );
        assert.equal(wrapper.find('[data-testid="circos-arc"]').length, 0);
    });
});
