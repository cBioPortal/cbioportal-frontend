import * as React from 'react';
import { assert } from 'chai';
import { shallow } from 'enzyme';
import { FusionDiagramSVG } from './FusionDiagramSVG';
import { FusionProduct } from './components/FusionProduct';
import { ProteinDomainTrack } from './components/ProteinDomainTrack';
import { GeneTrack } from './components/GeneTrack';
import { PromoterSwapTooltip } from './components/ExonTooltip';
import { FusionEvent, GenePartner, TranscriptData } from './data/types';

function makeTranscript(
    overrides: Partial<TranscriptData> = {}
): TranscriptData {
    return {
        transcriptId: 'ENST_DEFAULT',
        displayName: 'ENST_DEFAULT',
        gene: 'GENE_A',
        biotype: 'protein_coding',
        strand: '+' as const,
        txStart: 100,
        txEnd: 10000,
        exons: [
            { number: 1, start: 100, end: 200 },
            { number: 2, start: 300, end: 400 },
            { number: 3, start: 500, end: 600 },
        ],
        isForteSelected: false,
        isCallerSelected: false,
        isCanonical: false,
        domains: [
            {
                name: 'SP',
                pfamId: 'PF00001',
                startGenomic: 100,
                endGenomic: 200,
                startAA: 1,
                endAA: 30,
                source: 'Pfam',
            },
        ],
        proteinLength: 100,
        utrs: [],
        ...overrides,
    };
}

function makeFusion(overrides: Partial<FusionEvent> = {}): FusionEvent {
    return {
        id: 'f1',
        tumorId: 'T',
        gene1: {
            symbol: 'A',
            chromosome: '1',
            position: 350,
            selectedTranscriptId: 'ENST_5P_FORTE',
            siteDescription: '',
        },
        gene2: {
            symbol: 'B',
            chromosome: '2',
            position: 350,
            selectedTranscriptId: 'ENST_3P_FORTE',
            siteDescription: '',
        },
        fusion: 'A::B',
        totalReadSupport: 5,
        callMethod: 'FUSION',
        frameCallMethod: 'In_frame',
        annotation: '',
        position: '',
        significance: 'NA',
        note: '',
        connectionType: '',
        svIdiom: 'INTERGENIC_FUSION',
        frame: 'IN_FRAME',
        isRnaDerived: false,
        ...overrides,
    };
}

describe('FusionDiagramSVG — promoter-swap gating', () => {
    const gene5p: GenePartner = {
        symbol: 'GENE5P',
        chromosome: '1',
        position: 150, // inside the 5′UTR [100,200] → 5′ contributes no coding
        selectedTranscriptId: 'T5',
        siteDescription: '',
    };
    const gene3p: GenePartner = {
        symbol: 'GENE3P',
        chromosome: '1',
        position: 5000,
        selectedTranscriptId: 'T3',
        siteDescription: '',
    };
    const t5 = makeTranscript({
        transcriptId: 'T5',
        gene: 'GENE5P',
        strand: '+',
        utrs: [{ start: 100, end: 200, type: 'five_prime' }],
    });
    const t3 = makeTranscript({ transcriptId: 'T3', gene: 'GENE3P' });

    function renderWith(overrides: Partial<FusionEvent>) {
        return shallow(
            <FusionDiagramSVG
                fusion={makeFusion({
                    gene1: gene5p,
                    gene2: gene3p,
                    ...overrides,
                })}
                forteTranscript5p={t5}
                forteTranscript3p={t3}
                activeTranscript5p={t5}
                activeTranscript3p={t3}
                onActivate5p={() => {}}
                onActivate3p={() => {}}
            />
        ).dive();
    }

    it('shows the promoter-swap badge for an in-frame fusion whose 5′ contributes no coding', () => {
        const wrapper = renderWith({
            svIdiom: 'INTERGENIC_FUSION',
            frame: 'IN_FRAME',
        });
        assert.equal(wrapper.find(PromoterSwapTooltip).length, 1);
    });

    it('still shows the promoter-swap badge when the join is out-of-frame (frame is caller annotation, not per-transcript confirmable)', () => {
        const wrapper = renderWith({
            svIdiom: 'INTERGENIC_FUSION',
            frame: 'OUT_OF_FRAME',
        });
        assert.equal(wrapper.find(PromoterSwapTooltip).length, 1);
    });

    it('suppresses the promoter-swap badge for a non-rendering idiom (intragenic inversion)', () => {
        const wrapper = renderWith({
            svIdiom: 'INTRAGENIC_INVERSION',
            frame: 'IN_FRAME',
        });
        assert.equal(wrapper.find(PromoterSwapTooltip).length, 0);
    });
});

describe('FusionDiagramSVG — chimeric protein gating', () => {
    const t5 = makeTranscript({ transcriptId: 'P5', gene: 'G5' });
    const t3 = makeTranscript({ transcriptId: 'P3', gene: 'G3' });

    function renderWith(overrides: Partial<FusionEvent>) {
        return shallow(
            <FusionDiagramSVG
                fusion={makeFusion(overrides)}
                forteTranscript5p={t5}
                forteTranscript3p={t3}
                activeTranscript5p={t5}
                activeTranscript3p={t3}
                onActivate5p={() => {}}
                onActivate3p={() => {}}
            />
        ).dive();
    }

    it('renders the chimeric protein for an in-frame fusion', () => {
        const w = renderWith({
            svIdiom: 'INTERGENIC_FUSION',
            frame: 'IN_FRAME',
        });
        assert.equal(w.find(FusionProduct).length, 1);
        assert.equal(w.find('[data-testid="no-chimeric-orf-strip"]').length, 0);
    });

    it('still renders the chimeric protein for an out-of-frame join (frame is not a gate; junction glyph shows the annotated frame)', () => {
        const w = renderWith({
            svIdiom: 'INTERGENIC_FUSION',
            frame: 'OUT_OF_FRAME',
        });
        assert.equal(w.find(FusionProduct).length, 1);
        assert.equal(w.find('[data-testid="no-chimeric-orf-strip"]').length, 0);
    });

    it('renders the product for an intragenic deletion (single-gene internal deletion, e.g. EGFRvIII)', () => {
        const w = renderWith({
            svIdiom: 'INTRAGENIC_DELETION',
            frame: 'IN_FRAME',
        });
        assert.equal(w.find(FusionProduct).length, 1);
        assert.equal(w.find('[data-testid="no-chimeric-orf-strip"]').length, 0);
    });

    it('renders the product for an intragenic duplication (tandem-duplicated segment, e.g. EGFR-KDD)', () => {
        const w = renderWith({
            svIdiom: 'INTRAGENIC_DUPLICATION',
            frame: 'IN_FRAME',
        });
        assert.equal(w.find(FusionProduct).length, 1);
        assert.equal(w.find('[data-testid="no-chimeric-orf-strip"]').length, 0);
    });

    it('suppresses the product for a non-rendering idiom (intragenic inversion)', () => {
        const w = renderWith({
            svIdiom: 'INTRAGENIC_INVERSION',
            frame: 'IN_FRAME',
        });
        assert.equal(w.find(FusionProduct).length, 0);
        assert.equal(w.find('[data-testid="no-chimeric-orf-strip"]').length, 1);
    });
});

describe('FusionDiagramSVG', () => {
    it('passes the active 5p transcript into FusionProduct (not FORTE)', () => {
        const forte5p = makeTranscript({
            transcriptId: 'ENST_5P_FORTE',
            isForteSelected: true,
        });
        const active5p = makeTranscript({ transcriptId: 'ENST_5P_ACTIVE' });
        const forte3p = makeTranscript({
            transcriptId: 'ENST_3P_FORTE',
            isForteSelected: true,
        });

        const wrapper = shallow(
            <FusionDiagramSVG
                fusion={makeFusion()}
                forteTranscript5p={forte5p}
                forteTranscript3p={forte3p}
                activeTranscript5p={active5p}
                activeTranscript3p={forte3p}
                onActivate5p={() => {}}
                onActivate3p={() => {}}
            />
        ).dive();

        const product = wrapper.find(FusionProduct);
        assert.equal(product.length, 1);
        assert.equal(
            (product.prop('forteTranscript5p') as TranscriptData).transcriptId,
            'ENST_5P_ACTIVE'
        );
    });

    it('passes the active 3p transcript into ProteinDomainTrack (not FORTE)', () => {
        const forte5p = makeTranscript({
            transcriptId: 'ENST_5P_FORTE',
            isForteSelected: true,
        });
        const forte3p = makeTranscript({
            transcriptId: 'ENST_3P_FORTE',
            isForteSelected: true,
        });
        const active3p = makeTranscript({ transcriptId: 'ENST_3P_ACTIVE' });

        const wrapper = shallow(
            <FusionDiagramSVG
                fusion={makeFusion()}
                forteTranscript5p={forte5p}
                forteTranscript3p={forte3p}
                activeTranscript5p={forte5p}
                activeTranscript3p={active3p}
                onActivate5p={() => {}}
                onActivate3p={() => {}}
            />
        ).dive();

        const domainTrack = wrapper.find(ProteinDomainTrack);
        assert.equal(domainTrack.length, 1);
        assert.equal(
            (domainTrack.prop('forteTranscript3p') as TranscriptData)
                .transcriptId,
            'ENST_3P_ACTIVE'
        );
    });

    it('passes activeTranscriptId and onActivateTranscript to both GeneTracks', () => {
        const forte5p = makeTranscript({
            transcriptId: 'ENST_5P_FORTE',
            isForteSelected: true,
        });
        const forte3p = makeTranscript({
            transcriptId: 'ENST_3P_FORTE',
            isForteSelected: true,
        });
        const spy5 = () => {};
        const spy3 = () => {};

        const wrapper = shallow(
            <FusionDiagramSVG
                fusion={makeFusion()}
                forteTranscript5p={forte5p}
                forteTranscript3p={forte3p}
                activeTranscript5p={forte5p}
                activeTranscript3p={forte3p}
                onActivate5p={spy5}
                onActivate3p={spy3}
            />
        ).dive();

        const tracks = wrapper.find(GeneTrack);
        assert.equal(tracks.length, 2);
        assert.equal(tracks.at(0).prop('activeTranscriptId'), 'ENST_5P_FORTE');
        assert.equal(tracks.at(0).prop('onActivateTranscript'), spy5);
        assert.equal(tracks.at(1).prop('activeTranscriptId'), 'ENST_3P_FORTE');
        assert.equal(tracks.at(1).prop('onActivateTranscript'), spy3);
    });
});
