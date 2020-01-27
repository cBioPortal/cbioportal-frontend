import {
    alterationInfoForCaseAggregatedDataByOQLLine,
    makeGeneticTrackWith,
    percentAltered,
    extractGenericAssaySelections,
    getTreatmentTrackRuleSetParams
} from "./OncoprintUtils";
import {observable} from "mobx";
import * as _ from 'lodash';
import { assert } from 'chai';
import { IQueriedMergedTrackCaseData } from '../../../pages/resultsView/ResultsViewPageStore';
import { splitHeatmapTextField } from 'shared/components/oncoprint/OncoprintUtils';
import { ISelectOption } from 'shared/components/oncoprint/controls/OncoprintControls';
import { IHeatmapTrackSpec, IBaseHeatmapTrackDatum } from './Oncoprint';
import { IGradientAndCategoricalRuleSetParams } from 'oncoprintjs';
import { isMutationProfile } from 'shared/lib/StoreUtils';

describe('OncoprintUtils', () => {
    describe('alterationInfoForCaseAggregatedDataByOQLLine', () => {
        it('counts two sequenced samples if the gene was sequenced in two out of three samples', () => {
            // given
            const dataByCase = {
                samples: { SAMPLE1: [], SAMPLE2: [], SAMPLE3: [] },
                patients: {},
            };
            const sequencedSampleKeysByGene = { TTN: ['SAMPLE2', 'SAMPLE3'] };
            // when
            const info = alterationInfoForCaseAggregatedDataByOQLLine(
                true,
                { cases: dataByCase, oql: { gene: 'TTN' } },
                sequencedSampleKeysByGene,
                {}
            );
            // then
            assert.equal(info.sequenced, 2);
        });

        it("counts no sequenced patients if the gene wasn't sequenced in either patient", () => {
            // given
            const dataByCase = {
                samples: {},
                patients: { PATIENT1: [], PATIENT2: [] },
            };
            const sequencedPatientKeysByGene = { ADH1A: [] };
            // when
            const info = alterationInfoForCaseAggregatedDataByOQLLine(
                false,
                { cases: dataByCase, oql: { gene: 'ADH1A' } },
                {},
                sequencedPatientKeysByGene
            );
            // then
            assert.equal(info.sequenced, 0);
        });

        it('counts three sequenced patients if at least one merged-track gene was sequenced in each', () => {
            // given
            const dataByCase = {
                samples: {},
                patients: { PATIENT1: [], PATIENT2: [], PATIENT3: [] },
            };
            const sequencedPatientKeysByGene = {
                VEGFA: ['PATIENT1', 'PATIENT2'],
                VEGFB: ['PATIENT1', 'PATIENT3'],
                CXCL8: ['PATIENT1', 'PATIENT3'],
            };
            // when
            const info = alterationInfoForCaseAggregatedDataByOQLLine(
                false,
                {
                    cases: dataByCase,
                    oql: ['CXCL8', 'VEGFA', 'VEGFB'],
                },
                {},
                sequencedPatientKeysByGene
            );
            // then
            assert.equal(info.sequenced, 3);
        });

        it("counts one sequenced sample if the other one wasn't covered by either of the genes", () => {
            // given
            const dataByCase = {
                samples: { SAMPLE1: [], SAMPLE2: [] },
                patients: {},
            };
            const sequencedSampleKeysByGene = {
                MYC: ['SAMPLE2'],
                CDK8: [],
            };
            // when
            const info = alterationInfoForCaseAggregatedDataByOQLLine(
                true,
                {
                    cases: dataByCase,
                    oql: ['MYC', 'CDK8'],
                },
                sequencedSampleKeysByGene,
                {}
            );
            // then
            assert.equal(info.sequenced, 1);
        });
    });

    describe('makeGeneticTrackWith', () => {
        const makeMinimalCoverageRecord = () => ({
            byGene: {},
            allGenes: [],
            notProfiledByGene: {},
            notProfiledAllGenes: [],
        });
        const makeMinimal3Patient3GeneStoreProperties = () => ({
            samples: [],
            patients: [
                {
                    patientId: 'TCGA-02-0001',
                    studyId: 'gbm_tcga',
                    uniquePatientKey: 'VENHQS0wMi0wMDAxOmdibV90Y2dh',
                },
                {
                    patientId: 'TCGA-02-0003',
                    studyId: 'gbm_tcga',
                    uniquePatientKey: 'VENHQS0wMi0wMDAzOmdibV90Y2dh',
                },
                {
                    patientId: 'TCGA-02-0006',
                    studyId: 'gbm_tcga',
                    uniquePatientKey: 'VENHQS0wMi0wMDA2OmdibV90Y2dh',
                },
            ],
            coverageInformation: {
                samples: {},
                patients: {
                    VENHQS0wMi0wMDAxOmdibV90Y2dh: makeMinimalCoverageRecord(),
                    VENHQS0wMi0wMDAzOmdibV90Y2dh: makeMinimalCoverageRecord(),
                    VENHQS0wMi0wMDA2OmdibV90Y2dh: makeMinimalCoverageRecord(),
                },
            },
            sequencedSampleKeysByGene: {},
            sequencedPatientKeysByGene: { BRCA1: [], PTEN: [], TP53: [] },
            selectedMolecularProfiles: [],
            expansionIndexMap: observable.map<number[]>(),
            hideGermlineMutations: false,
            oncoprint: {} as any,
        });
        const makeMinimal3Patient3GeneCaseData = () => ({
            samples: {},
            patients: {
                VENHQS0wMi0wMDAxOmdibV90Y2dh: [],
                VENHQS0wMi0wMDAzOmdibV90Y2dh: [],
                VENHQS0wMi0wMDA2OmdibV90Y2dh: [],
            },
        });
        const MINIMAL_TRACK_INDEX = 0;

        it('if queried for a plain gene, labels the track based on that query', () => {
            // given store properties for three patients and query data for
            // a single gene
            const storeProperties = makeMinimal3Patient3GeneStoreProperties();
            const queryData = {
                cases: makeMinimal3Patient3GeneCaseData(),
                oql: {
                    gene: 'TP53',
                    oql_line: 'TP53;',
                    parsed_oql_line: { gene: 'TP53', alterations: [] },
                    data: [],
                },
            };
            // when the track formatting function is called with this query
            const trackFunction = makeGeneticTrackWith({
                sampleMode: false,
                ...storeProperties,
            });
            const track = trackFunction(queryData, MINIMAL_TRACK_INDEX);
            // then it returns a track with the same label and OQL
            assert.equal(track.label, 'TP53');
            assert.equal(track.oql, 'TP53;');
        });

        it('if queried for a merged track without a label, labels the track based on the genes inside', () => {
            // given store properties for three patients and query data
            // for a two-gene merged track
            const storeProperties = makeMinimal3Patient3GeneStoreProperties();
            const queryData = {
                cases: makeMinimal3Patient3GeneCaseData(),
                oql: {
                    list: [
                        {
                            gene: 'BRCA1',
                            oql_line: 'BRCA1;',
                            parsed_oql_line: { gene: 'BRCA1', alterations: [] },
                            data: [],
                        },
                        {
                            gene: 'PTEN',
                            oql_line: 'PTEN;',
                            parsed_oql_line: { gene: 'PTEN', alterations: [] },
                            data: [],
                        },
                    ],
                },
            };
            // when the track formatting function is called with this query
            const trackFunction = makeGeneticTrackWith({
                sampleMode: false,
                ...storeProperties,
            });
            const track = trackFunction(queryData, MINIMAL_TRACK_INDEX);
            // then it returns a track with the genes' OQL and labels
            assert.equal(track.label, 'BRCA1 / PTEN');
            assert.equal(track.oql, '[BRCA1; PTEN;]');
        });

        it('if queried for a merged track with a label, uses that to label the track', () => {
            // given store properties for three patients and query data
            // for a two-gene merged track with a label
            const storeProperties = makeMinimal3Patient3GeneStoreProperties();
            const queryData = {
                cases: makeMinimal3Patient3GeneCaseData(),
                oql: {
                    list: [
                        {
                            gene: 'BRCA1',
                            oql_line: 'BRCA1;',
                            parsed_oql_line: { gene: 'BRCA1', alterations: [] },
                            data: [],
                        },
                        {
                            gene: 'PTEN',
                            oql_line: 'PTEN;',
                            parsed_oql_line: { gene: 'PTEN', alterations: [] },
                            data: [],
                        },
                    ],
                    label: 'HELLO',
                },
            };
            // when the track formatting function is called with this query
            const trackFunction = makeGeneticTrackWith({
                sampleMode: false,
                ...storeProperties,
            });
            const track = trackFunction(queryData, MINIMAL_TRACK_INDEX);
            // then it returns a track with that label and the genes' OQL
            assert.equal(track.label, 'HELLO');
            assert.equal(track.oql, '[BRCA1; PTEN;]');
        });

        it('returns an expandable track if queried for a merged track', () => {
            // given
            const storeProperties = makeMinimal3Patient3GeneStoreProperties();
            const queryData = {
                cases: makeMinimal3Patient3GeneCaseData(),
                oql: {
                    list: [
                        {
                            gene: 'TTN',
                            oql_line: 'TTN;',
                            parsed_oql_line: { gene: 'TTN', alterations: [] },
                            data: [],
                        },
                    ],
                },
            };
            // when
            const trackFunction = makeGeneticTrackWith({
                sampleMode: false,
                ...storeProperties,
            });
            const track = trackFunction(queryData, MINIMAL_TRACK_INDEX);
            // then
            assert.isFunction(track.expansionCallback);
        });

        it("makes the expansion callback for merged tracks list the track's subquery indexes in the expansion observable", () => {
            // given
            const storeProperties = makeMinimal3Patient3GeneStoreProperties();
            const queryData = {
                cases: makeMinimal3Patient3GeneCaseData(),
                oql: {
                    list: [
                        {
                            gene: 'FOLR1',
                            oql_line: 'FOLR1;',
                            parsed_oql_line: { gene: 'FOLR1', alterations: [] },
                            data: [],
                        },
                        {
                            gene: 'FOLR2',
                            oql_line: 'FOLR2;',
                            parsed_oql_line: { gene: 'FOLR2', alterations: [] },
                            data: [],
                        },
                        {
                            gene: 'IZUMO1R',
                            oql_line: 'IZUMO1R;',
                            parsed_oql_line: {
                                gene: 'IZUMO1R',
                                alterations: [],
                            },
                            data: [],
                        },
                    ],
                },
                list: [
                    {
                        cases: makeMinimal3Patient3GeneCaseData(),
                        oql: {
                            gene: 'FOLR1',
                            oql_line: 'FOLR1;',
                            parsed_oql_line: { gene: 'FOLR1', alterations: [] },
                            data: [],
                        },
                    },
                    {
                        cases: makeMinimal3Patient3GeneCaseData(),
                        oql: {
                            gene: 'FOLR2',
                            oql_line: 'FOLR2;',
                            parsed_oql_line: { gene: 'FOLR2', alterations: [] },
                            data: [],
                        },
                    },
                    {
                        cases: makeMinimal3Patient3GeneCaseData(),
                        oql: {
                            gene: 'IZUMO1R',
                            oql_line: 'IZUMO1R;',
                            parsed_oql_line: {
                                gene: 'IZUMO1R',
                                alterations: [],
                            },
                            data: [],
                        },
                    },
                ],
            };
            // when
            const trackFunction = makeGeneticTrackWith({
                sampleMode: false,
                ...storeProperties,
            });
            const track = trackFunction(queryData, MINIMAL_TRACK_INDEX);
            track.expansionCallback!();
            // then
            assert.includeMembers(
                storeProperties.expansionIndexMap.get(track.key)!.slice(),
                [0, 1, 2]
            );
        });

        it('includes expansion tracks in the spec if the observable lists them', () => {
            // given
            const queryData: IQueriedMergedTrackCaseData = {
                cases: makeMinimal3Patient3GeneCaseData(),
                oql: {
                    list: [
                        {
                            gene: 'PIK3CA',
                            oql_line: 'PIK3CA;',
                            parsed_oql_line: {
                                gene: 'PIK3CA',
                                alterations: [],
                            },
                            data: [],
                        },
                        {
                            gene: 'MTOR',
                            oql_line: 'MTOR;',
                            parsed_oql_line: { gene: 'MTOR', alterations: [] },
                            data: [],
                        },
                    ],
                },
                mergedTrackOqlList: [
                    {
                        cases: makeMinimal3Patient3GeneCaseData(),
                        oql: {
                            gene: 'PIK3CA',
                            oql_line: 'PIK3CA;',
                            parsed_oql_line: {
                                gene: 'PIK3CA',
                                alterations: [],
                            },
                            data: [],
                        },
                    },
                    {
                        cases: makeMinimal3Patient3GeneCaseData(),
                        oql: {
                            gene: 'MTOR',
                            oql_line: 'MTOR;',
                            parsed_oql_line: { gene: 'MTOR', alterations: [] },
                            data: [],
                        },
                    },
                ],
            };
            const trackIndex = MINIMAL_TRACK_INDEX + 7;
            // list expansions for the track key determined before expansion
            const preExpandStoreProperties = makeMinimal3Patient3GeneStoreProperties();
            const trackKey: string = makeGeneticTrackWith({
                sampleMode: false,
                ...preExpandStoreProperties,
            })(queryData, trackIndex).key;
            const postExpandStoreProperties = {
                ...preExpandStoreProperties,
                expansionIndexMap: observable.shallowMap({
                    [trackKey]: [0, 1],
                }),
            };
            // when
            const trackFunction = makeGeneticTrackWith({
                sampleMode: false,
                ...postExpandStoreProperties,
            });
            const track = trackFunction(queryData, trackIndex);
            // then
            assert.equal(track.expansionTrackList![0].oql, 'PIK3CA;');
            assert.equal(track.expansionTrackList![1].oql, 'MTOR;');
        });

        it('gives expansion tracks a remove callback that removes them from the observable', () => {
            // given
            const parentKey = 'SOME_MERGED_TRACK_14';
            const trackIndex = MINIMAL_TRACK_INDEX + 8;
            const storeProperties = {
                ...makeMinimal3Patient3GeneStoreProperties(),
                expansionIndexMap: observable.map<number[]>({
                    UNRELATED_TRACK_1: [8, 9, 10],
                    [parentKey]: [3, trackIndex, 15],
                }),
            };
            const queryData = {
                cases: makeMinimal3Patient3GeneCaseData(),
                oql: {
                    gene: 'ADH1',
                    oql_line: 'ADH1;',
                    parsed_oql_line: { gene: 'ADH1', alterations: [] },
                    data: [],
                },
            };
            // when
            const trackFunction = makeGeneticTrackWith({
                sampleMode: false,
                ...storeProperties,
            });
            const track = trackFunction(queryData, trackIndex, parentKey);
            // then
            assert.deepEqual(
                storeProperties.expansionIndexMap.get(parentKey)!.slice(),
                [3, trackIndex, 15],
                "Just formatting an expansion track shouldn't change the parent's active expansions"
            );
            track.removeCallback!();
            assert.deepEqual(
                storeProperties.expansionIndexMap.get(parentKey)!.slice(),
                [3, 15],
                "Calling the track's remove callback should unlist it"
            );
        });

        it('indents and lowlights expansion tracks', () => {
            // given
            const storeProperties = makeMinimal3Patient3GeneStoreProperties();
            const queryData = {
                cases: makeMinimal3Patient3GeneCaseData(),
                oql: {
                    gene: 'KRAS',
                    oql_line: 'KRAS;',
                    parsed_oql_line: { gene: 'KRAS', alterations: [] },
                    data: [],
                },
            };
            // when
            const trackFunction = makeGeneticTrackWith({
                sampleMode: true,
                ...storeProperties,
            });
            const track = trackFunction(
                queryData,
                MINIMAL_TRACK_INDEX,
                'PARENT_TRACK_1'
            );
            // then
            assert.equal(track.labelColor, 'grey');
            assert.equal(track.label, '  KRAS');
        });
    });

    describe('percentAltered', () => {
        it('returns the percentage with no decimal digits, for percentages >= 3', () => {
            assert.equal(percentAltered(3, 100), '3%');
            assert.equal(percentAltered(20, 100), '20%');
            assert.equal(percentAltered(3, 3), '100%');
            assert.equal(percentAltered(50, 99), '51%');
        });
        it('returns the percentage with one decimal digit, for percentages < 3, unless its exact', () => {
            assert.equal(percentAltered(22, 1000), '2.2%');
            assert.equal(percentAltered(156, 10000), '1.6%');
            assert.equal(percentAltered(0, 3), '0%');
            assert.equal(percentAltered(2, 100), '2%');
        });
    });

    describe('Treatment ruleset params', () => {
        it('Is created from Track Spec param', () => {
            const treatmentTracSpec = {
                key: 'TREATMENTTRACK_1',
                label: '',
                molecularProfileId: 'profile1',
                molecularAlterationType: 'GENERIC_ASSAY',
                data: [
                    { profile_data: 1, study: 'study1', uid: 'uid' },
                    { profile_data: 2, study: 'study1', uid: 'uid' },
                    { profile_data: 3, study: 'study1', uid: 'uid' },
                ],
                datatype: 'GENERIC_ASSAY',
                trackGroupIndex: 1,
                onRemove: () => {},
            };

            // const ruleSetParams = getTreatmentTrackRuleSetParams(treatmentTracSpec);
        });
    });
});

describe('splitHeatmapTextField', () => {
    it('Splits around spaces', () => {
        const elements = splitHeatmapTextField('A B C');
        assert.deepEqual(elements, ['A', 'B', 'C']);
    });
    it('Splits around tabs', () => {
        const elements = splitHeatmapTextField('A   B   C');
        assert.deepEqual(elements, ['A', 'B', 'C']);
    });
    it("Splits around comma's", () => {
        const elements = splitHeatmapTextField('A,B,C');
        assert.deepEqual(elements, ['A', 'B', 'C']);
    });
    it("Splits around comma's and spaces", () => {
        const elements = splitHeatmapTextField('A, B, C');
        assert.deepEqual(elements, ['A', 'B', 'C']);
    });
    it("Splits around comma's and tabs", () => {
        const elements = splitHeatmapTextField('A,  B,  C');
        assert.deepEqual(elements, ['A', 'B', 'C']);
    });
    it("Splits around EOL's", () => {
        const elements = splitHeatmapTextField(`
        A
        B
        C`);
        assert.deepEqual(elements, ['A', 'B', 'C']);
    });
    it('Removes duplicate entries', () => {
        const elements = splitHeatmapTextField('A B B');
        assert.deepEqual(elements, ['A', 'B']);
    });
});

describe('getTreatmentTrackRuleSetParams', () => {
    const treatmentTracSpec = ({
        key: 'TREATMENTTRACK_1',
        label: '',
        molecularProfileId: 'profile_1',
        molecularAlterationType: 'GENERIC_ASSAY',
        data: ([
            { profile_data: 1, study: 'study1', uid: 'uid' },
            { profile_data: 2, study: 'study1', uid: 'uid' },
            { profile_data: 3, study: 'study1', uid: 'uid' },
        ] as any) as IBaseHeatmapTrackDatum[],
        datatype: 'GENERIC_ASSAY',
        trackGroupIndex: 1,
        maxProfileValue: 100,
        minProfileValue: -100,
        onRemove: () => {},
    } as any) as IHeatmapTrackSpec;

    it('RuleSetParams are correct w/o sortOrder and pivotThreshold provided', () => {
        const {
            value_range,
            colors,
            value_stop_points,
            category_to_color,
        } = getTreatmentTrackRuleSetParams(
            treatmentTracSpec
        ) as IGradientAndCategoricalRuleSetParams;

        assert.equal(colors!.length, 2);
        assert.deepEqual(value_range, [-100, 100]);
        assert.deepEqual(value_stop_points, [-100, 100]);
        assert.deepEqual(category_to_color, undefined);
    });

    it('ASC SortOrder is default', () => {
        const spec = Object.assign({}, treatmentTracSpec);
        spec.sortOrder = 'ASC';

        const {
            value_range,
            colors,
            value_stop_points,
            category_to_color,
        } = getTreatmentTrackRuleSetParams(
            treatmentTracSpec
        ) as IGradientAndCategoricalRuleSetParams;

        assert.deepEqual(value_range, [-100, 100]);
    });

    it('DESC SortOrder reverses value range', () => {
        const spec = Object.assign({}, treatmentTracSpec);
        spec.sortOrder = 'DESC';

        const {
            value_range,
            colors,
            value_stop_points,
            category_to_color,
        } = getTreatmentTrackRuleSetParams(
            spec
        ) as IGradientAndCategoricalRuleSetParams;

        assert.deepEqual(value_range, [100, -100]);
    });

    it('DESC SortOrder reverses value_range and value_stop_points', () => {
        const spec = Object.assign({}, treatmentTracSpec);
        spec.sortOrder = 'DESC';

        const {
            value_range,
            colors,
            value_stop_points,
            category_to_color,
        } = getTreatmentTrackRuleSetParams(
            spec
        ) as IGradientAndCategoricalRuleSetParams;

        assert.deepEqual(value_range, [100, -100]);
        assert.deepEqual(value_stop_points, [100, -100]);
    });

    it('PivotThreshold adds middle value and color param', () => {
        const spec = Object.assign({}, treatmentTracSpec);
        spec.pivotThreshold = 0;

        const {
            value_range,
            colors,
            value_stop_points,
            category_to_color,
        } = getTreatmentTrackRuleSetParams(
            spec
        ) as IGradientAndCategoricalRuleSetParams;

        assert.equal(colors!.length, 4);
        assert.deepEqual(value_range, [-100, 100]);
        assert.deepEqual(value_stop_points, [-100, 0, 0, 100]);
    });

    it('PivotThreshold to the left of min and max profile values is correctly integrated', () => {
        const spec = Object.assign({}, treatmentTracSpec);
        spec.pivotThreshold = -200;

        const {
            value_range,
            colors,
            value_stop_points,
            category_to_color,
        } = getTreatmentTrackRuleSetParams(
            spec
        ) as IGradientAndCategoricalRuleSetParams;

        assert.equal(colors!.length, 2);
        assert.deepEqual(value_range, [-200, 100]);
        assert.deepEqual(value_stop_points, [-200, 100]);
    });

    it('PivotThreshold to the right of min and max profile values is correctly integrated', () => {
        const spec = Object.assign({}, treatmentTracSpec);
        spec.pivotThreshold = 200;

        const {
            value_range,
            colors,
            value_stop_points,
            category_to_color,
        } = getTreatmentTrackRuleSetParams(
            spec
        ) as IGradientAndCategoricalRuleSetParams;

        assert.equal(colors!.length, 2);
        assert.deepEqual(value_range, [-100, 200]);
        assert.deepEqual(value_stop_points, [-100, 200]);
    });

    it('Categories are added when present on data points', () => {
        const spec = Object.assign({}, treatmentTracSpec);
        spec.data = ([
            { profile_data: 3, study: 'study1', uid: 'uid', category: '>8.00' },
        ] as any) as IBaseHeatmapTrackDatum[];

        const {
            value_range,
            colors,
            value_stop_points,
            category_to_color,
        } = getTreatmentTrackRuleSetParams(
            spec
        ) as IGradientAndCategoricalRuleSetParams;

        assert.isDefined(category_to_color);
        assert.isString(category_to_color!['>8.00']);
    });
});

describe('extractGenericAssaySelections', () => {

    const selectedTreatments:string[] = [];
    const treatmentMap = {
        treatmentA: { id: 'treatmentA', value: 'valueA', label: 'labelA' },
    };

    it('Adds recognized treatments to selection', () => {
        extractGenericAssaySelections("treatmentA treatmentB", selectedTreatments, treatmentMap);
        assert.deepEqual(selectedTreatments, ['treatmentA']);
    });

    it('Removed recognized treatments from text field', () => {
        const text = extractGenericAssaySelections('treatmentC treatmentA treatmentB', selectedTreatments, treatmentMap);
        assert.equal(text, 'treatmentC  treatmentB');
    });
});
