import { render } from '@testing-library/react';
import React from 'react';
import { assert } from 'chai';
import _ from 'lodash';

import { sortValue as oncoKbAnnotationSortValue, OncoKB } from './OncoKB';
import { defaultArraySortMethod } from 'cbioportal-utils';
import {
    GermlineIndicatorQueryResp,
    LevelOfEvidence,
    SomaticIndicatorQueryResp,
} from 'oncokb-ts-api-client';
import {
    IndicatorQueryResp,
    isGermlineIndicator,
    isSomaticIndicator,
} from '../model/OncoKB';

function emptySomaticQueryIndicator(): SomaticIndicatorQueryResp {
    return {
        // alleleExist: false,
        // dataVersion: "",
        geneExist: false,
        geneSummary: '',
        highestResistanceLevel: 'LEVEL_R3',
        highestSensitiveLevel: 'LEVEL_4',
        // highestDiagnosticImplicationLevel: "LEVEL_Dx1",
        // highestPrognosticImplicationLevel: "LEVEL_Px1",
        // hotspot: false,
        // lastUpdate: "",
        mutationEffect: {
            description: '',
            knownEffect: '',
            citations: {
                abstracts: [],
                pmids: [],
            },
        },
        oncogenic: '',
        // otherSignificantResistanceLevels: [],
        // otherSignificantSensitiveLevels: [],
        query: {
            alteration: '',
            germline: false,
            // alterationType: "",
            // consequence: "",
            // entrezGeneId: -1,
            hugoSymbol: '',
            id: '',
            //proteinEnd: -1,
            //proteinStart: -1,
            tumorType: '',
            //type: "web",
            //hgvs: "",
            //svType: "DELETION" // TODO: hack because svType is not optional
        },
        treatments: [],
        // diagnosticImplications: [],
        // prognosticImplications: [],
        tumorTypeSummary: '',
        // diagnosticSummary: "",
        // prognosticSummary: "",
        // variantExist: false,
        variantSummary: '',
        vus: false,
    } as any;
}

function initSomaticQueryIndicator(props: {
    [key: string]: any;
}): SomaticIndicatorQueryResp {
    return _.merge(emptySomaticQueryIndicator(), props);
}

function emptyGermlineQueryIndicator(): GermlineIndicatorQueryResp {
    return {
        geneExist: false,
        geneSummary: '',
        highestResistanceLevel: 'LEVEL_R1',
        highestSensitiveLevel: 'LEVEL_1',
        mutationEffect: {
            description: '',
            knownEffect: '',
            citations: {
                abstracts: [],
                pmids: [],
            },
        },
        pathogenic: '',
        penetrance: '',
        genomicIndicators: [],
        query: {
            alteration: '',
            germline: true,
            hugoSymbol: '',
            id: '',
            tumorType: '',
        },
        treatments: [],
        tumorTypeSummary: '',
        variantSummary: '',
        vus: false,
    } as any;
}

function initGermlineQueryIndicator(props: {
    [key: string]: any;
}): GermlineIndicatorQueryResp {
    return _.merge(emptyGermlineQueryIndicator(), props);
}

function oncoKbAnnotationSortMethod(
    a: IndicatorQueryResp,
    b: IndicatorQueryResp
) {
    return defaultArraySortMethod(
        oncoKbAnnotationSortValue(a),
        oncoKbAnnotationSortValue(b)
    );
}

describe('OncoKB', () => {
    it('displays a load spinner when there is no indicator data', () => {
        const component = render(
            <OncoKB
                status="pending"
                isCancerGene={false}
                geneNotExist={false}
                hugoGeneSymbol=""
                usingPublicOncoKbInstance={true}
            />
        );

        const loader = component.container.getElementsByClassName('fa-spinner');

        assert.equal(loader.length, 1, 'Spinner component should exist');
    });

    it('properly calculates OncoKB sort values', () => {
        let queryA = initSomaticQueryIndicator({
            oncogenic: 'Oncogenic',
        });

        let queryB = initSomaticQueryIndicator({
            oncogenic: 'Oncogenic',
        });

        let array: IndicatorQueryResp[] = [queryA, queryB];

        let sortedArray: IndicatorQueryResp[];

        assert.deepEqual(
            oncoKbAnnotationSortValue(queryA),
            oncoKbAnnotationSortValue(queryB),
            'Equal Oncogenicity'
        );

        queryA.oncogenic = 'Oncogenic';
        queryB.oncogenic = 'Inconclusive';
        array = [queryB, queryA];
        sortedArray = array.sort(oncoKbAnnotationSortMethod);
        assert.isAbove(
            sortedArray.indexOf(queryA),
            sortedArray.indexOf(queryB),
            'Oncogenicity test 2'
        );

        queryA.oncogenic = 'Oncogenic';
        queryB.oncogenic = 'Unknown';
        array = [queryB, queryA];
        sortedArray = array.sort(oncoKbAnnotationSortMethod);
        assert.isAbove(
            sortedArray.indexOf(queryA),
            sortedArray.indexOf(queryB),
            'Oncogenicity test 3'
        );

        queryA.oncogenic = 'Oncogenic';
        queryB.oncogenic = 'Likely Neutral';
        array = [queryB, queryA];
        sortedArray = array.sort(oncoKbAnnotationSortMethod);
        assert.isAbove(
            sortedArray.indexOf(queryA),
            sortedArray.indexOf(queryB),
            'Oncogenicity test 4'
        );

        queryA.oncogenic = 'Inconclusive';
        queryB.oncogenic = 'Unknown';
        array = [queryB, queryA];
        sortedArray = array.sort(oncoKbAnnotationSortMethod);
        assert.isAbove(
            sortedArray.indexOf(queryA),
            sortedArray.indexOf(queryB),
            'Oncogenicity test 5'
        );

        queryA.oncogenic = 'Likely Neutral';
        queryB.oncogenic = 'Inconclusive';
        array = [queryB, queryA];
        sortedArray = array.sort(oncoKbAnnotationSortMethod);
        assert.isAbove(
            sortedArray.indexOf(queryA),
            sortedArray.indexOf(queryB),
            'Oncogenicity test 6'
        );

        queryA = initSomaticQueryIndicator({
            oncogenic: 'Unknown',
            vus: true,
        });
        queryB = initSomaticQueryIndicator({
            oncogenic: 'Unknown',
            vus: false,
        });
        array = [queryB, queryA];
        sortedArray = array.sort(oncoKbAnnotationSortMethod);
        assert.isAbove(
            sortedArray.indexOf(queryA),
            sortedArray.indexOf(queryB),
            'A is VUS, which should have higher score.'
        );

        queryA = initSomaticQueryIndicator({
            oncogenic: 'Oncogenic',
            highestSensitiveLevel: LevelOfEvidence.LEVEL_1,
        });
        queryB = initSomaticQueryIndicator({
            oncogenic: 'Oncogenic',
            highestSensitiveLevel: LevelOfEvidence.LEVEL_2,
        });
        array = [queryB, queryA];
        sortedArray = array.sort(oncoKbAnnotationSortMethod);
        assert.isAbove(
            sortedArray.indexOf(queryA),
            sortedArray.indexOf(queryB),
            'A(LEVEL_1) should be higher than B(LEVEL_2)'
        );

        queryA = initSomaticQueryIndicator({
            oncogenic: 'Oncogenic',
            highestResistanceLevel: LevelOfEvidence.LEVEL_R1,
        });
        queryB = initSomaticQueryIndicator({
            oncogenic: 'Oncogenic',
            highestResistanceLevel: LevelOfEvidence.LEVEL_R2,
        });
        array = [queryB, queryA];
        sortedArray = array.sort(oncoKbAnnotationSortMethod);
        assert.isAbove(
            sortedArray.indexOf(queryA),
            sortedArray.indexOf(queryB),
            'A(LEVEL_R1) should be higher than B(LEVEL_R2)'
        );

        queryA = initSomaticQueryIndicator({
            oncogenic: 'Oncogenic',
            highestSensitiveLevel: LevelOfEvidence.LEVEL_2,
            highestResistanceLevel: '',
        });
        queryB = initSomaticQueryIndicator({
            oncogenic: 'Oncogenic',
            highestSensitiveLevel: '',
            highestResistanceLevel: LevelOfEvidence.LEVEL_R1,
        });
        array = [queryB, queryA];
        sortedArray = array.sort(oncoKbAnnotationSortMethod);
        assert.isAbove(
            sortedArray.indexOf(queryA),
            sortedArray.indexOf(queryB),
            'A(LEVEL_2) should be higher than B(LEVEL_R1)'
        );

        queryA = initSomaticQueryIndicator({
            oncogenic: 'Oncogenic',
        });
        queryB = initSomaticQueryIndicator({
            oncogenic: 'Unknown',
            highestSensitiveLevel: LevelOfEvidence.LEVEL_2,
        });
        array = [queryB, queryA];
        sortedArray = array.sort(oncoKbAnnotationSortMethod);
        assert.isAbove(
            sortedArray.indexOf(queryA),
            sortedArray.indexOf(queryB),
            'The score for Oncogenic variant(A) should always higher than other categories(B) even B has treatments.'
        );

        // GeneExist tests
        queryA = initSomaticQueryIndicator({
            geneExist: true,
        });
        queryB = initSomaticQueryIndicator({
            geneExist: false,
        });
        array = [queryB, queryA];
        sortedArray = array.sort(oncoKbAnnotationSortMethod);
        assert.isAbove(
            sortedArray.indexOf(queryA),
            sortedArray.indexOf(queryB),
            'A should be higher than B.'
        );

        // GeneExist tests
        queryA = initSomaticQueryIndicator({
            geneExist: false,
            oncogenic: 'Oncogenic',
        });
        queryB = initSomaticQueryIndicator({
            geneExist: true,
        });
        array = [queryB, queryA];
        sortedArray = array.sort(oncoKbAnnotationSortMethod);
        assert.isAbove(
            sortedArray.indexOf(queryA),
            sortedArray.indexOf(queryB),
            'A should be higher than B even A gene does not exist. Because A has higher oncogenicity.'
        );

        // VariantExist does not have any impact any more
        queryA = initSomaticQueryIndicator({
            variantExist: false,
        });
        queryB = initSomaticQueryIndicator({
            variantExist: true,
            highestSensitiveLevel: LevelOfEvidence.LEVEL_2,
        });
        array = [queryB, queryA];
        sortedArray = array.sort(oncoKbAnnotationSortMethod);
        assert.isBelow(
            sortedArray.indexOf(queryA),
            sortedArray.indexOf(queryB),
            'A should be lower than B.'
        );

        queryA = initSomaticQueryIndicator({
            variantExist: true,
        });
        queryB = initSomaticQueryIndicator({
            variantExist: false,
            highestSensitiveLevel: LevelOfEvidence.LEVEL_2,
        });
        array = [queryB, queryA];
        sortedArray = array.sort(oncoKbAnnotationSortMethod);
        assert.isBelow(
            sortedArray.indexOf(queryA),
            sortedArray.indexOf(queryB),
            'A should be lower than B[LEVEL_2] even B variant does not exist.'
        );

        // Is Hotspot does not have any impact any more
        queryA = initSomaticQueryIndicator({
            oncogenic: 'Oncogenic',
            hotspot: false,
        });
        queryB = initSomaticQueryIndicator({
            oncogenic: 'Oncogenic',
            hotspot: true,
            highestSensitiveLevel: LevelOfEvidence.LEVEL_2,
        });
        array = [queryB, queryA];
        sortedArray = array.sort(oncoKbAnnotationSortMethod);
        assert.isBelow(
            sortedArray.indexOf(queryA),
            sortedArray.indexOf(queryB),
            'A should be lower than B.'
        );

        queryA = initSomaticQueryIndicator({
            oncogenic: 'Oncogenic',
            hotspot: true,
        });
        queryB = initSomaticQueryIndicator({
            oncogenic: 'Oncogenic',
            hotspot: false,
            highestSensitiveLevel: LevelOfEvidence.LEVEL_2,
        });
        array = [queryB, queryA];
        sortedArray = array.sort(oncoKbAnnotationSortMethod);
        assert.isBelow(
            sortedArray.indexOf(queryA),
            sortedArray.indexOf(queryB),
            'A should be lower than B[LEVEL_2] even A is hotspot.'
        );
    });
});

describe('OncoKB germline indicators', () => {
    it('classifies indicators using the query.germline discriminant', () => {
        const germline = initGermlineQueryIndicator({});
        const somatic = initSomaticQueryIndicator({});

        assert.isTrue(
            isGermlineIndicator(germline),
            'germline indicator is recognized as germline'
        );
        assert.isFalse(
            isSomaticIndicator(germline),
            'germline indicator is not recognized as somatic'
        );
        assert.isTrue(
            isSomaticIndicator(somatic),
            'somatic indicator is recognized as somatic'
        );
        assert.isFalse(
            isGermlineIndicator(somatic),
            'somatic indicator is not recognized as germline'
        );
    });

    it('scores germline pathogenicity on the same tier as somatic oncogenicity', () => {
        // sortValue()[0] is the top-tier biological-significance score. For
        // germline indicators it is driven by `pathogenic`, and Pathogenic /
        // Likely Pathogenic map to the same score as Oncogenic / Likely
        // Oncogenic so germline rows rank alongside somatic ones.
        const pathogenicScore = oncoKbAnnotationSortValue(
            initGermlineQueryIndicator({ pathogenic: 'Pathogenic' })
        )[0];
        const likelyPathogenicScore = oncoKbAnnotationSortValue(
            initGermlineQueryIndicator({ pathogenic: 'Likely Pathogenic' })
        )[0];
        const oncogenicScore = oncoKbAnnotationSortValue(
            initSomaticQueryIndicator({ oncogenic: 'Oncogenic' })
        )[0];
        const likelyOncogenicScore = oncoKbAnnotationSortValue(
            initSomaticQueryIndicator({ oncogenic: 'Likely Oncogenic' })
        )[0];

        assert.equal(
            pathogenicScore,
            oncogenicScore,
            'Pathogenic scores the same as Oncogenic'
        );
        assert.equal(
            likelyPathogenicScore,
            likelyOncogenicScore,
            'Likely Pathogenic scores the same as Likely Oncogenic'
        );
        assert.isAbove(
            pathogenicScore,
            0,
            'Pathogenic contributes a non-zero score'
        );
    });

    it('ranks a pathogenic germline variant above a benign one', () => {
        const queryA = initGermlineQueryIndicator({ pathogenic: 'Pathogenic' });
        const queryB = initGermlineQueryIndicator({ pathogenic: 'Benign' });
        const sortedArray = [queryB, queryA].sort(oncoKbAnnotationSortMethod);
        assert.isAbove(
            sortedArray.indexOf(queryA),
            sortedArray.indexOf(queryB),
            'A(Pathogenic) should be higher than B(Benign)'
        );
    });

    it('sorts germline indicators by therapeutic level', () => {
        const queryA = initGermlineQueryIndicator({
            highestSensitiveLevel: LevelOfEvidence.LEVEL_1,
        });
        const queryB = initGermlineQueryIndicator({
            highestSensitiveLevel: LevelOfEvidence.LEVEL_2,
        });
        const sortedArray = [queryB, queryA].sort(oncoKbAnnotationSortMethod);
        assert.isAbove(
            sortedArray.indexOf(queryA),
            sortedArray.indexOf(queryB),
            'A(LEVEL_1) should be higher than B(LEVEL_2)'
        );
    });
});
