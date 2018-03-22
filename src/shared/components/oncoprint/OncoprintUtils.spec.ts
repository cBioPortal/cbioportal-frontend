import {
    makeGeneticTrackWith,
    percentAltered
} from "./OncoprintUtils";
import * as _ from 'lodash';
import {assert} from 'chai';

describe('OncoprintUtils', () => {
    describe('makeGeneticTrackWith', () => {
        const makeMinimalCoverageRecord = () => ({
            byGene: {}, allGenes: [],
            notProfiledByGene: {}, notProfiledAllGenes: []
        });
        const makeMinimal3Patient3GeneStoreProperties = () => ({
            samples: [],
            patients: [
                { 'patientId': 'TCGA-02-0001', 'studyId': 'gbm_tcga', 'uniquePatientKey': 'VENHQS0wMi0wMDAxOmdibV90Y2dh' },
                { 'patientId': 'TCGA-02-0003', 'studyId': 'gbm_tcga', 'uniquePatientKey': 'VENHQS0wMi0wMDAzOmdibV90Y2dh' },
                { 'patientId': 'TCGA-02-0006', 'studyId': 'gbm_tcga', 'uniquePatientKey': 'VENHQS0wMi0wMDA2OmdibV90Y2dh' }
            ],
            coverageInformation: {
                samples: {},
                patients: {
                    'VENHQS0wMi0wMDAxOmdibV90Y2dh': makeMinimalCoverageRecord(),
                    'VENHQS0wMi0wMDAzOmdibV90Y2dh': makeMinimalCoverageRecord(),
                    'VENHQS0wMi0wMDA2OmdibV90Y2dh': makeMinimalCoverageRecord()
                }
            },
            sequencedSampleKeysByGene: {},
            sequencedPatientKeysByGene: {'BRCA1': [], 'PTEN': [], 'TP53': []},
            selectedMolecularProfiles: []
        });
        const makeMinimal3Patient3GeneCaseData = () => ({
            samples: {},
            patients: {
                'VENHQS0wMi0wMDAxOmdibV90Y2dh': [],
                'VENHQS0wMi0wMDAzOmdibV90Y2dh': [],
                'VENHQS0wMi0wMDA2OmdibV90Y2dh': []
            }
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
                    parsed_oql_line: {gene: 'TP53', alterations: []},
                    data: []
                }
            };
            // when the track formatting function is called with this query
            const trackFunction = makeGeneticTrackWith({
                sampleMode: false,
                ...storeProperties
            });
            const track = trackFunction(queryData, MINIMAL_TRACK_INDEX);
            // then it returns a track with the same label and OQL
            assert.equal(track.label, 'TP53');
            assert.equal(track.oql, 'TP53;');
        });
    });

    describe('percentAltered', () => {
        it("returns the percentage with no decimal digits, for percentages >= 3", ()=>{
            assert.equal(percentAltered(3,100), "3%");
            assert.equal(percentAltered(20,100), "20%");
            assert.equal(percentAltered(3,3), "100%");
            assert.equal(percentAltered(50,99), "51%");
        })
        it("returns the percentage with one decimal digit, for percentages < 3, unless its exact", ()=>{
            assert.equal(percentAltered(22,1000), "2.2%");
            assert.equal(percentAltered(156,10000), "1.6%");
            assert.equal(percentAltered(0,3), "0%");
            assert.equal(percentAltered(2,100), "2%");
        })
    });
});