import * as React from 'react';
import { assert } from 'chai';
import { shallow } from 'enzyme';
import { FusionDiagramSVG } from './FusionDiagramSVG';
import { FusionProduct } from './components/FusionProduct';
import { ProteinDomainTrack } from './components/ProteinDomainTrack';
import { GeneTrack } from './components/GeneTrack';
import { FusionEvent, TranscriptData } from './data/types';

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
        ...overrides,
    };
}

function makeFusion(): FusionEvent {
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
    };
}

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
