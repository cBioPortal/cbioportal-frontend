import chai, {assert, expect} from 'chai';
import {
    caseCounts,
    caseCountsInParens,
    ComparisonGroup,
    convertPatientsStudiesAttrToSamples,
    excludePatients,
    excludeSamples,
    finalizeStudiesAttr,
    getNumPatients,
    getNumSamples, getOrdinals,
    getOverlapFilteredGroups,
    getOverlappingPatients,
    getOverlappingSamples,
    getPatientIdentifiers,
    getSampleIdentifiers,
    getStudyIds,
    getVennPlotData,
    intersectPatients,
    intersectSamples,
    isGroupEmpty,
    OverlapFilteredComparisonGroup, partitionCasesByGroupMembership,
    sortDataIntoQuartiles,
    unionPatients,
    unionSamples
} from './GroupComparisonUtils';
import deepEqualInAnyOrder from "deep-equal-in-any-order";
import ComplexKeySet from "../../shared/lib/complexKeyDataStructures/ComplexKeySet";
import {Sample} from "../../shared/api/generated/CBioPortalAPI";
import ComplexKeyMap from "../../shared/lib/complexKeyDataStructures/ComplexKeyMap";
import {assertDeepEqualInAnyOrder} from "../../shared/lib/SpecUtils";
import ComplexKeyGroupsMap from "../../shared/lib/complexKeyDataStructures/ComplexKeyGroupsMap";

chai.use(deepEqualInAnyOrder);

describe('GroupComparisonUtils', () => {
    describe("getOrdinals", ()=>{
        it("correct values", ()=>{
            assert.deepEqual(
                getOrdinals(0,5),
                []
            );
            assert.deepEqual(
                getOrdinals(1,5),
                ["A"]
            );
            assert.deepEqual(
                getOrdinals(5,5),
                ["A","B","C","D","E"]
            );
            assert.deepEqual(
                getOrdinals(20,5),
                [
                    "A","B","C","D","E","AA","AB","AC","AD","AE",
                    "BA","BB","BC","BD","BE","CA","CB","CC","CD","CE"
                ]
            );
            assert.deepEqual(
                getOrdinals(20, 3),
                [
                    "A","B","C","AA","AB","AC","BA","BB","BC",
                    "CA","CB","CC","AAA","AAB","AAC","ABA","ABB","ABC",
                    "ACA","ACB"
                ]
            );
        });
    });

    describe('getVennPlotData', () => {
        it('when no data', () => {
            assert.deepEqual(getVennPlotData([]), [])
        });

        it('when there no overlapping groups', () => {
            assert.deepEqual(getVennPlotData([
                { groups: ['1'], cases: ['1-1'] },
                { groups: ['1', '2'], cases: [] },
                { groups: ['2'], cases: ['1-2'] }
            ]),
                [{ count: 1, size: 1, label: '1', sets: ['1'] },
                { count: 1, size: 1, label: '1', sets: ['2'] },
                { count: 0, size: 0, label: '0', sets: ['1', '2'] }]
            );
        });

        it('when there one or more overlapping groups', () => {
            assert.deepEqual(getVennPlotData([
                { groups: ['1'], cases: ['1-1', '1-2'] },
                { groups: ['1', '2'], cases: ['1-1'] },
                { groups: ['2'], cases: ['1-1'] }
            ]),
                [{ count: 2, size: 2, label: '2', sets: ['1'] },
                { count: 1, size: 1, label: '1', sets: ['1', '2'] },
                { count: 1, size: 1, label: '1', sets: ['2'] }]
            );
        });
    });

    describe("caseCountsInParens", ()=>{
        it("0 patients and samples", ()=>{
            assert.equal(
                caseCountsInParens([], []),
                "(0)"
            );
        });
        it("1 patients and samples", ()=>{
            assert.equal(
                caseCountsInParens(["sample"], ["patient"]),
                "(1)"
            );
        });
        it("same nonzero number patients and samples", ()=>{
            assert.equal(
                caseCountsInParens(["sampleA", "sampleB"], ["patientA", "patientB"]),
                "(2)"
            );
        });
        it("0 patients and 1 sample", ()=>{
            assert.equal(
                caseCountsInParens(["sample"], []),
                "(1 sample/0 patients)"
            );
        });
        it("1 patient and 0 samples", ()=>{
            assert.equal(
                caseCountsInParens([], ["patient"]),
                "(0 samples/1 patient)"
            );
        });
        it("0 patients and nonzero samples", ()=>{
            assert.equal(
                caseCountsInParens(["sample","sample"], []),
                "(2 samples/0 patients)"
            );
        });
        it("0 samples and nonzero patients", ()=>{
            assert.equal(
                caseCountsInParens([], ["patient","patient","patient"]),
                "(0 samples/3 patients)"
            );
        });
        it("nonzero nonequal patients and samples", ()=>{
            assert.equal(
                caseCountsInParens(["sampleA", "sampleB","sampleC"], ["patientA", "patientB"]),
                "(3 samples/2 patients)"
            );
        });
    });

    describe("caseCounts", ()=>{
        it("0 patients and samples", ()=>{
            assert.equal(
                caseCounts(0,0),
                "0 samples/patients"
            );
            assert.equal(
                caseCounts(0,0, "+", " overlapping "),
                "0 overlapping samples+patients"
            );
        });
        it("1 patients and samples", ()=>{
            assert.equal(
                caseCounts(1,1),
                "1 sample/patient"
            );
        });
        it("same nonzero number patients and samples", ()=>{
            assert.equal(
                caseCounts(2,2),
                "2 samples/patients"
            );
        });
        it("0 patients and 1 sample", ()=>{
            assert.equal(
                caseCounts(1,0),
                "1 sample/0 patients"
            );
        });
        it("1 patient and 0 samples", ()=>{
            assert.equal(
                caseCounts(0,1),
                "0 samples/1 patient"
            );
        });
        it("0 patients and nonzero samples", ()=>{
            assert.equal(
                caseCounts(2,0),
                "2 samples/0 patients"
            );
            assert.equal(
                caseCounts(2,0, " and ", " overlapping "),
                "2 overlapping samples and 0 overlapping patients"
            );
        });
        it("0 samples and nonzero patients", ()=>{
            assert.equal(
                caseCounts(0,3),
                "0 samples/3 patients"
            );
        });
        it("nonzero nonequal patients and samples", ()=>{
            assert.equal(
                caseCounts(3,2),
                "3 samples/2 patients"
            );
        });
    });

    describe("getPatientIdentifiers", ()=>{
        const sampleIds = [
            { sampleId:"sample1", studyId:"study1"},
            { sampleId:"sample2", studyId:"study1"},
            { sampleId:"sample3", studyId:"study1"},
            { sampleId:"sample1", studyId:"study2"},
            { sampleId:"sample2", studyId:"study2"},
            { sampleId:"sample3", studyId:"study2"}
        ];
        let sampleSet:ComplexKeyMap<any>;
        before(()=>{
            sampleSet = new ComplexKeyMap<any>();
            sampleSet.set(sampleIds[0], { patientId:"patient1", uniquePatientKey:"patient1key", studyId:"study1"});
            sampleSet.set(sampleIds[1], { patientId:"patient2", uniquePatientKey:"patient2key", studyId:"study1"});
            sampleSet.set(sampleIds[2], { patientId:"patient2", uniquePatientKey:"patient2key", studyId:"study1"});
            sampleSet.set(sampleIds[3], { patientId:"patient1", uniquePatientKey:"patient3key", studyId:"study2"});
            sampleSet.set(sampleIds[4], { patientId:"patient2", uniquePatientKey:"patient4key", studyId:"study2"});
            sampleSet.set(sampleIds[5], { patientId:"patient3", uniquePatientKey:"patient5key", studyId:"study2"});
        });

        it("empty", ()=>{
            assertDeepEqualInAnyOrder(getPatientIdentifiers([], sampleSet), []);
        });
        it("one sample", ()=>{
            assertDeepEqualInAnyOrder(getPatientIdentifiers([sampleIds[0]], sampleSet), [{patientId:"patient1", studyId:"study1"}]);
        });
        it("multiple samples one patient one study", ()=>{
            assertDeepEqualInAnyOrder(getPatientIdentifiers([
                sampleIds[1], sampleIds[2]
            ], sampleSet), [{
                patientId:"patient2",
                studyId:"study1"
            }]);
        });
        it("multiple samples one per patient one study", ()=>{
            assertDeepEqualInAnyOrder(getPatientIdentifiers([
                sampleIds[3], sampleIds[4], sampleIds[5]
            ], sampleSet), [{
                patientId:"patient1",
                studyId:"study2"
            },{
                patientId:"patient2",
                studyId:"study2"
            },{
                patientId:"patient3",
                studyId:"study2"
            }]);
        });
        it("multiple samples multiple per patient one study", ()=>{
            assertDeepEqualInAnyOrder(getPatientIdentifiers([
                sampleIds[0], sampleIds[1], sampleIds[2]
            ], sampleSet), [{
                patientId:"patient1",
                studyId:"study1"
            },{
                patientId:"patient2",
                studyId:"study1"
            }]);
        });
        it("multiple samples one per patient multiple studies", ()=>{
            assertDeepEqualInAnyOrder(getPatientIdentifiers([
                sampleIds[0], sampleIds[3], sampleIds[4], sampleIds[5]
            ], sampleSet), [{
                patientId:"patient1",
                studyId:"study1"
            },{
                patientId:"patient1",
                studyId:"study2"
            },{
                patientId:"patient2",
                studyId:"study2"
            },{
                patientId:"patient3",
                studyId:"study2"
            }]);
        });
        it("multiple samples multiple per patient multiple studies", ()=>{
            assertDeepEqualInAnyOrder(getPatientIdentifiers(sampleIds, sampleSet), [{
                patientId:"patient1",
                studyId:"study1"
            },{
                patientId:"patient2",
                studyId:"study1"
            },{
                patientId:"patient1",
                studyId:"study2"
            },{
                patientId:"patient2",
                studyId:"study2"
            },{
                patientId:"patient3",
                studyId:"study2"
            }]);
        });
    });

    describe("getOverlapFilteredGroups", ()=>{

        function makeGroup(params:Partial<OverlapFilteredComparisonGroup>) {
            return Object.assign({
                description:"",
                origin:[],
                studyViewFilter:{} as any
            }, params) as any;
        }

        it("filters one group", ()=>{

            assert.deepEqual(getOverlapFilteredGroups(
                [
                        makeGroup({
                            name: "group1",
                            studies:[{ id:"study1", samples:["sample1","sample2"], patients:["patient1", "patient2"]}],
                            color:"color1",
                            uid:"uid1",
                            nonExistentSamples:[
                                { studyId:"study1", sampleId:"ne1"},{studyId:"study1", sampleId:"ne2"},{studyId:"study1", sampleId:"ne3"}
                            ]
                        })
                    ],
                {
                    overlappingSamplesSet: ComplexKeySet.from([{ sampleId:"sample1", studyId:"study1"}]),
                    overlappingPatientsSet: ComplexKeySet.from([{ patientId:"patient2", studyId:"study1"}])
                }),
                [makeGroup({
                    name: "group1",
                    studies:[{ id:"study1", samples:["sample2"], patients:["patient1"]}],
                    color:"color1",
                    uid:"uid1",
                    nonExistentSamples:[
                        { studyId:"study1", sampleId:"ne1"},{studyId:"study1", sampleId:"ne2"},{studyId:"study1", sampleId:"ne3"}
                    ],
                    hasOverlappingSamples:true,
                    hasOverlappingPatients:true
                })]);
        });

        it("filters more than one group", ()=>{
            assert.deepEqual(getOverlapFilteredGroups(
                [
                    makeGroup({
                        name: "group1",
                        studies:[{ id:"study1", samples:["sample1","sample2"], patients:["patient1", "patient2"]}],
                        color:"color1",
                        uid:"uid1",
                        nonExistentSamples:[
                            { studyId:"study1", sampleId:"ne1"},{studyId:"study1", sampleId:"ne2"},{studyId:"study1", sampleId:"ne3"}
                        ]
                    }),
                    makeGroup({
                        name: "group2",
                        studies:[{ id:"study1", samples:["sample1","sample2"], patients:[]}, { id:"study2", samples:["sample1","sample2"], patients:["patient1"]}],
                        color:"color2",
                        uid:"uid2",
                        nonExistentSamples:[
                            { studyId:"study2", sampleId:"ne1"},{studyId:"study2", sampleId:"ne2"}
                        ],
                    }),
                    makeGroup({
                        name: "group3",
                        studies:[{ id:"study3", samples:["sample1","sample2"], patients:["patient1", "patient2"]}, { id:"study2", samples:["sample1"], patients:["patient1", "patient2"]}],
                        color:"color3",
                        uid:"uid3",
                        nonExistentSamples:[
                            { studyId:"study3", sampleId:"ne1"},{studyId:"study4", sampleId:"ne2"},{studyId:"study6", sampleId:"ne3"}
                        ]
                    })
                ],
                {
                    overlappingSamplesSet: ComplexKeySet.from([{ sampleId:"sample1", studyId:"study1"}, { sampleId:"sample2", studyId:"study1"}, { sampleId:"sample2", studyId:"study2"}]),
                    overlappingPatientsSet: ComplexKeySet.from([{ patientId:"patient2", studyId:"study1"}, { patientId:"patient1", studyId:"study1"}, { patientId:"patient2", studyId:"study2"}])
                }),
                [makeGroup({
                    name: "group1",
                    studies:[],
                    color:"color1",
                    uid:"uid1",
                    nonExistentSamples:[
                        { studyId:"study1", sampleId:"ne1"},{studyId:"study1", sampleId:"ne2"},{studyId:"study1", sampleId:"ne3"}
                    ],
                    hasOverlappingSamples:true,
                    hasOverlappingPatients:true
                }),
                    makeGroup({
                        name: "group2",
                        studies:[{ id:"study2", samples:["sample1"], patients:["patient1"]}],
                        color:"color2",
                        uid:"uid2",
                        nonExistentSamples:[
                            { studyId:"study2", sampleId:"ne1"},{studyId:"study2", sampleId:"ne2"}
                        ],
                        hasOverlappingSamples:true,
                        hasOverlappingPatients:false
                    }),
                    makeGroup({
                        name: "group3",
                        studies:[{ id:"study3", samples:["sample1","sample2"], patients:["patient1", "patient2"]}, { id:"study2", samples:["sample1"], patients:["patient1"]}],
                        color:"color3",
                        uid:"uid3",
                        nonExistentSamples:[
                            { studyId:"study3", sampleId:"ne1"},{studyId:"study4", sampleId:"ne2"},{studyId:"study6", sampleId:"ne3"}
                        ],
                        hasOverlappingSamples:false,
                        hasOverlappingPatients:true
                    })
                ]);
        });

        it("gives empty for empty", ()=>{
            assert.deepEqual(getOverlapFilteredGroups([],
                {
                    overlappingSamplesSet: ComplexKeySet.from([{ sampleId:"sample1", studyId:"study1"}]),
                    overlappingPatientsSet: ComplexKeySet.from([{ patientId:"patient2", studyId:"study1"}])
                }),
                []);
        });
    });

    describe("getOverlappingSamples", ()=>{
        it("empty for empty", ()=>{
            assert.deepEqual(getOverlappingSamples([]), []);
        });
        it("one group", ()=>{
            assert.deepEqual(getOverlappingSamples([
                { studies: [
                    { id:"study1", samples:["sample1", "sample2"], patients:["patient1"]},
                    { id:"study2", samples:["sample1", "sample2", "sample3"], patients:["patient1", "patient2", "patient3"]},
                    { id:"study3", samples:["sample1"], patients:["patient1", "patient2"]}
                ]}
            ]), []);
        });
        it("two groups no overlap", ()=>{
            assert.deepEqual(getOverlappingSamples([
                { studies: [
                    { id:"study1", samples:["sample1", "sample2"], patients:["patient1"]},
                    { id:"study2", samples:["sample1", "sample2", "sample3"], patients:["patient1", "patient2", "patient3"]},
                    { id:"study3", samples:["sample1"], patients:["patient1", "patient2"]}
                ]},
                { studies: [
                    { id:"study1", samples:["sample3"], patients:["patient2"]},
                    { id:"study2", samples:["sample4"], patients:["patient4", "patient5"]},
                    { id:"study3", samples:["sample2", "sample3", "sample4"], patients:["patient3", "patient4", "patient5"]}
                ]}
            ]), []);
        });
        it("two groups overlap", ()=>{
            (expect(getOverlappingSamples([
                { studies: [
                        { id:"study1", samples:["sample1", "sample2"], patients:["patient1"]},
                        { id:"study2", samples:["sample1", "sample2", "sample3"], patients:["patient1", "patient2", "patient3"]},
                        { id:"study3", samples:["sample1"], patients:["patient1", "patient2"]}
                    ]},
                { studies: [
                        { id:"study1", samples:["sample1"], patients:["patient1"]},
                        { id:"study2", samples:["sample2", "sample3",], patients:["patient1"]},
                        { id:"study3", samples:["sample1", "sample2", "sample3", "sample4"], patients:["patient1", "patient2", "patient3", "patient4", "patient5"]}
                    ]}
            ])).to.deep as any).equalInAnyOrder([
                { studyId:"study1", sampleId:"sample1"},
                { studyId:"study2", sampleId:"sample2"},
                { studyId:"study2", sampleId:"sample3"},
                { studyId:"study3", sampleId:"sample1"},
            ]);
        });
        it("three groups no overlap", ()=>{
            assert.deepEqual(getOverlappingSamples([
                { studies: [
                        { id:"study1", samples:["sample1", "sample2"], patients:["patient1"]},
                        { id:"study2", samples:["sample1", "sample2", "sample3"], patients:["patient1", "patient2", "patient3"]},
                        { id:"study3", samples:["sample1"], patients:["patient1", "patient2"]}
                    ]},
                { studies: [
                        { id:"study1", samples:["sample3"], patients:["patient2"]},
                        { id:"study2", samples:["sample4"], patients:["patient4", "patient5"]},
                        { id:"study3", samples:["sample2", "sample3", "sample4"], patients:["patient3", "patient4", "patient5"]}
                    ]},
                { studies: [
                        { id:"study1", samples:["sample4"], patients:["patient3"]},
                        { id:"study2", samples:["sample5"], patients:["patient6"]},
                        { id:"study3", samples:["sample5", "sample6"], patients:["patient6", "patient7", "patient8"]}
                    ]}
            ]), []);
        });
        it("three groups overlap", ()=>{
            (expect(getOverlappingSamples([
                { studies: [
                        { id:"study1", samples:["sample1", "sample2"], patients:["patient1"]},
                        { id:"study2", samples:["sample1", "sample2", "sample3"], patients:["patient1", "patient2", "patient3"]},
                        { id:"study3", samples:["sample1"], patients:["patient1", "patient2"]}
                    ]},
                { studies: [
                        { id:"study1", samples:["sample1"], patients:["patient1"]},
                        { id:"study2", samples:["sample2", "sample3",], patients:["patient1"]},
                        { id:"study3", samples:["sample1", "sample2", "sample3", "sample4"], patients:["patient1", "patient2", "patient3", "patient4", "patient5"]}
                    ]},
                { studies: [
                        { id:"study1", samples:["sample1"], patients:["patient1"]},
                        { id:"study2", samples:["sample2", "sample3","sample4"], patients:["patient1"]},
                        { id:"study3", samples:["sample1", "sample2", "sample3", "sample4"], patients:["patient1", "patient2", "patient3", "patient4", "patient5"]}
                    ]}
            ])).to.deep as any).equalInAnyOrder([
                { studyId:"study1", sampleId:"sample1"},
                { studyId:"study2", sampleId:"sample2"},
                { studyId:"study2", sampleId:"sample3"},
                { studyId:"study3", sampleId:"sample1"},
                { studyId:"study3", sampleId:"sample2"},
                { studyId:"study3", sampleId:"sample3"},
                { studyId:"study3", sampleId:"sample4"},
            ]);
        });
    });

    describe("getOverlappingPatients", ()=>{
        it("empty for empty", ()=>{
            assert.deepEqual(getOverlappingPatients([]), []);
        });
        it("one group", ()=>{
            assert.deepEqual(getOverlappingPatients([
                { studies: [
                        { id:"study1", samples:["sample1", "sample2"], patients:["patient1"]},
                        { id:"study2", samples:["sample1", "sample2", "sample3"], patients:["patient1", "patient2", "patient3"]},
                        { id:"study3", samples:["sample1"], patients:["patient1", "patient2"]}
                    ]}
            ]), []);
        });
        it("two groups no overlap", ()=>{
            assert.deepEqual(getOverlappingPatients([
                { studies: [
                        { id:"study1", samples:["sample1", "sample2"], patients:["patient1"]},
                        { id:"study2", samples:["sample1", "sample2", "sample3"], patients:["patient1", "patient2", "patient3"]},
                        { id:"study3", samples:["sample1"], patients:["patient1", "patient2"]}
                    ]},
                { studies: [
                        { id:"study1", samples:["sample3"], patients:["patient2"]},
                        { id:"study2", samples:["sample4"], patients:["patient4", "patient5"]},
                        { id:"study3", samples:["sample2", "sample3", "sample4"], patients:["patient3", "patient4", "patient5"]}
                    ]}
            ]), []);
        });
        it("two groups overlap", ()=>{
            (expect(getOverlappingPatients([
                { studies: [
                        { id:"study1", samples:["sample1", "sample2"], patients:["patient1"]},
                        { id:"study2", samples:["sample1", "sample2", "sample3"], patients:["patient1", "patient2", "patient3"]},
                        { id:"study3", samples:["sample1"], patients:["patient1", "patient2"]}
                    ]},
                { studies: [
                        { id:"study1", samples:["sample1"], patients:["patient1"]},
                        { id:"study2", samples:["sample2", "sample3",], patients:["patient1"]},
                        { id:"study3", samples:["sample1", "sample2", "sample3", "sample4"], patients:["patient1", "patient2", "patient3", "patient4", "patient5"]}
                    ]}
            ])).to.deep as any).equalInAnyOrder([
                { studyId:"study1", patientId:"patient1"},
                { studyId:"study2", patientId:"patient1"},
                { studyId:"study3", patientId:"patient1"},
                { studyId:"study3", patientId:"patient2"},
            ]);
        });
        it("three groups no overlap", ()=>{
            assert.deepEqual(getOverlappingPatients([
                { studies: [
                        { id:"study1", samples:["sample1", "sample2"], patients:["patient1"]},
                        { id:"study2", samples:["sample1", "sample2", "sample3"], patients:["patient1", "patient2", "patient3"]},
                        { id:"study3", samples:["sample1"], patients:["patient1", "patient2"]}
                    ]},
                { studies: [
                        { id:"study1", samples:["sample3"], patients:["patient2"]},
                        { id:"study2", samples:["sample4"], patients:["patient4", "patient5"]},
                        { id:"study3", samples:["sample2", "sample3", "sample4"], patients:["patient3", "patient4", "patient5"]}
                    ]},
                { studies: [
                        { id:"study1", samples:["sample4"], patients:["patient3"]},
                        { id:"study2", samples:["sample5"], patients:["patient6"]},
                        { id:"study3", samples:["sample5", "sample6"], patients:["patient6", "patient7", "patient8"]}
                    ]}
            ]), []);
        });
        it("three groups overlap", ()=>{
            (expect(getOverlappingPatients([
                { studies: [
                        { id:"study1", samples:["sample1", "sample2"], patients:["patient1"]},
                        { id:"study2", samples:["sample1", "sample2", "sample3"], patients:["patient1", "patient2", "patient3"]},
                        { id:"study3", samples:["sample1"], patients:["patient1", "patient2", "patient3"]}
                    ]},
                { studies: [
                        { id:"study1", samples:["sample1"], patients:["patient1"]},
                        { id:"study2", samples:["sample2", "sample3",], patients:["patient1"]},
                        { id:"study3", samples:["sample1", "sample2", "sample3", "sample4"], patients:["patient1", "patient2", "patient4", "patient5"]}
                    ]},
                { studies: [
                        { id:"study1", samples:["sample1"], patients:["patient1"]},
                        { id:"study2", samples:["sample2", "sample3","sample4"], patients:["patient1"]},
                        { id:"study3", samples:["sample1", "sample2", "sample3", "sample4"], patients:["patient2", "patient3", "patient4", "patient5"]}
                    ]}
            ])).to.deep as any).equalInAnyOrder([
                { studyId:"study1", patientId:"patient1"},
                { studyId:"study2", patientId:"patient1"},
                { studyId:"study3", patientId:"patient1"},
                { studyId:"study3", patientId:"patient2"},
                { studyId:"study3", patientId:"patient3"},
                { studyId:"study3", patientId:"patient4"},
                { studyId:"study3", patientId:"patient5"},
            ]);
        });
    });

    describe("isGroupEmpty", ()=>{
        it("empty", ()=>{
            assert.isTrue(isGroupEmpty({
                studies:[]
            }), "empty array");

            assert.isTrue(isGroupEmpty({
                studies:[{
                    id:"study",
                    samples:[],
                    patients:[]
                }]
            }), "one empty study");

            assert.isTrue(isGroupEmpty({
                studies:[{
                    id:"study",
                    samples:[],
                    patients:[]
                },
                {
                    id:"study2",
                    samples:[],
                    patients:[]
                }]
            }), "two empty studies");
        });
        it("not empty", ()=>{
            assert.isFalse(isGroupEmpty({
                studies:[
                {
                    id:"study2",
                    samples:["sample1"],
                    patients:[]
                }]
            }), "one nonempty study");

            assert.isFalse(isGroupEmpty({
                studies:[{
                    id:"study",
                    samples:[],
                    patients:[]
                },
                {
                    id:"study2",
                    samples:["sample1"],
                    patients:["patient1"]
                }]
            }), "one empty study, one nonempty study");
        });
    });

    describe("getStudyIds", ()=>{
        it("empty for empty", ()=>{
            assert.deepEqual(getStudyIds([]), []);
        });
        it("one group", ()=>{
            assert.deepEqual(getStudyIds([{ studies: [
                { id:"study1", samples:["sample1", "sample2"]},
                { id:"study2", samples:["sample1", "sample2", "sample3"]},
                { id:"study3", samples:["sample1"]}
            ]}]), ["study1", "study2", "study3"]);
        });
        it("two groups", ()=>{
            assert.deepEqual(getStudyIds([{ studies: [
                { id:"study1", samples:["sample1", "sample2"]},
                { id:"study2", samples:["sample1", "sample2", "sample3"]},
                { id:"study3", samples:["sample1"]}
            ]},{ studies: [
                { id:"study1", samples:["sample1", "sample2"]},
                { id:"study2", samples:["sample1", "sample2", "sample3"]},
                { id:"study4", samples:["sample1"]}
            ]}]), ["study1", "study2", "study3", "study4"]);
        });
        it("three groups", ()=>{
            assert.deepEqual(getStudyIds([{ studies: [
                { id:"study1", samples:["sample1", "sample2"]},
                { id:"study2", samples:["sample1", "sample2", "sample3"]},
                { id:"study3", samples:["sample1"]}
            ]},{ studies: [
                { id:"study1", samples:["sample1", "sample2"]},
                { id:"study2", samples:["sample1", "sample2", "sample3"]},
                { id:"study4", samples:["sample1"]}
            ]},{ studies: [
                { id:"study5", samples:["sample1", "sample2"]},
                { id:"study2", samples:["sample1", "sample2", "sample3"]},
                { id:"study6", samples:["sample1"]}
            ]}]), ["study1", "study2", "study3", "study4", "study5", "study6"]);
        });
    });

    describe("getSampleIdentifiers",()=>{
        it("empty for empty", ()=>{
            assert.deepEqual(getSampleIdentifiers([]), []);
        });
        it("one group", ()=>{
            (expect(getSampleIdentifiers([{ studies: [
                    { id:"study1", samples:["sample1", "sample2"]},
                    { id:"study2", samples:["sample1", "sample2", "sample3"]},
                    { id:"study3", samples:["sample1"]}
                ]}])).to.deep as any).equalInAnyOrder([
                { sampleId:"sample1", studyId:"study1"},
                { sampleId:"sample2", studyId:"study1"},
                { sampleId:"sample1", studyId:"study2"},
                { sampleId:"sample2", studyId:"study2"},
                { sampleId:"sample3", studyId:"study2"},
                { sampleId:"sample1", studyId:"study3"},
            ]);
        });
        it("two groups", ()=>{
            (expect(getSampleIdentifiers([{ studies: [
                    { id:"study1", samples:["sample1", "sample2"]},
                    { id:"study2", samples:["sample1", "sample2", "sample3"]},
                    { id:"study3", samples:["sample1"]}
                ]},{ studies: [
                    { id:"study1", samples:["sample1", "sample2"]},
                    { id:"study2", samples:["sample1", "sample2", "sample3"]},
                    { id:"study4", samples:["sample1"]}
                ]}])).to.deep as any).equalInAnyOrder([
                { sampleId:"sample1", studyId:"study1"},
                { sampleId:"sample2", studyId:"study1"},
                { sampleId:"sample1", studyId:"study2"},
                { sampleId:"sample2", studyId:"study2"},
                { sampleId:"sample3", studyId:"study2"},
                { sampleId:"sample1", studyId:"study3"},
                { sampleId:"sample1", studyId:"study4"},
                ]);
        });
        it("three groups", ()=>{
            (expect(getSampleIdentifiers([{ studies: [
                    { id:"study1", samples:["sample1", "sample2"]},
                    { id:"study2", samples:["sample1", "sample2", "sample3"]},
                    { id:"study3", samples:["sample1"]}
                ]},{ studies: [
                    { id:"study1", samples:["sample1", "sample2"]},
                    { id:"study2", samples:["sample1", "sample2", "sample3"]},
                    { id:"study4", samples:["sample1"]}
                ]},{ studies: [
                    { id:"study5", samples:["sample1", "sample2"]},
                    { id:"study2", samples:["sample1", "sample2", "sample3"]},
                    { id:"study6", samples:["sample1"]}
                ]}])).to.deep as any).equalInAnyOrder([
                { sampleId:"sample1", studyId:"study1"},
                { sampleId:"sample2", studyId:"study1"},
                { sampleId:"sample1", studyId:"study2"},
                { sampleId:"sample2", studyId:"study2"},
                { sampleId:"sample3", studyId:"study2"},
                { sampleId:"sample1", studyId:"study3"},
                { sampleId:"sample1", studyId:"study4"},
                { sampleId:"sample1", studyId:"study5"},
                { sampleId:"sample2", studyId:"study5"},
                { sampleId:"sample1", studyId:"study6"},
            ]);
        });
    });

    describe("getNumSamples", ()=>{
        it("empty for empty", ()=>{
            assert.deepEqual(getNumSamples({studies:[]}), 0);
        });
        it("nonempty", ()=>{
            assert.deepEqual(getNumSamples({ studies: [
                    { id:"study1", samples:["sample1", "sample2"]},
                    { id:"study2", samples:["sample1", "sample2", "sample3"]},
                    { id:"study3", samples:["sample1"]}]}), 6);

        });
    });

    describe("getNumPatients", ()=>{
        it("empty for empty", ()=>{
            assert.deepEqual(getNumPatients({studies:[]}), 0);
        });
        it("nonempty", ()=>{
            assert.deepEqual(getNumPatients({ studies: [
                    { id:"study1", samples:["sample1", "sample2"], patients:["patient1"]},
                    { id:"study2", samples:["sample1", "sample2", "sample3"], patients:["patient1", "patient3"]},
                    { id:"study3", samples:["sample1"], patients:["patient2"]}]}), 4);

        });
    });

    describe("finalizeStudiesAttr", ()=>{
        const sampleSet = ComplexKeyMap.from([
            {studyId:"1", sampleId:"1", patientId:"1"}, {studyId:"1", sampleId:"2", patientId:"1"},
            {studyId:"2", sampleId:"2", patientId:"1"}, {studyId:"2", sampleId:"4", patientId:"4"},
            {studyId:"3", sampleId:"1", patientId:"1"}
        ] as Sample[], s=>({studyId: s.studyId, sampleId: s.sampleId}));

        it("empty for empty", ()=>{
            assert.deepEqual(finalizeStudiesAttr({studies:[]}, sampleSet), {
                nonExistentSamples:[],
                studies:[]
            });
        });

        it("all samples existing", ()=>{
            (expect(finalizeStudiesAttr({ studies: [
                    { id: "1", samples:["1", "2"]},
                    { id: "2", samples:["4"]},
                    { id: "3", samples:["1"]}
                ]}, sampleSet)).to.deep as any).equalInAnyOrder({
                nonExistentSamples:[],
                studies:[
                    { id: "1", samples:["1", "2"], patients:["1"]},
                    { id: "2", samples:["4"], patients:["4"]},
                    { id: "3", samples:["1"], patients:["1"]}
                ]
            });
        });

        it("some samples not existing", ()=>{
            (expect(finalizeStudiesAttr({ studies: [
                    { id: "1", samples:["1", "2", "3", "4"]},
                    { id: "2", samples:["2", "3", "4"]},
                    { id: "3", samples:["2","3","4"]}
                ]}, sampleSet)).to.deep as any).equalInAnyOrder({
                nonExistentSamples:[
                    {studyId:"1", sampleId:"3"},
                    {studyId:"1", sampleId:"4"},
                    {studyId:"2", sampleId:"3"},
                    {studyId:"3", sampleId:"2"},
                    {studyId:"3", sampleId:"3"},
                    {studyId:"3", sampleId:"4"}
                ],
                studies:[
                    { id: "1", samples:["1", "2"], patients:["1"]},
                    { id: "2", samples:["2","4"], patients:["1", "4"]}
                ]
            });
        });
    });

    describe("sortDataIntoQuartiles", ()=>{
        it("sorts data into quartiles when theres only one value per quartile", ()=>{
            assert.deepEqual(sortDataIntoQuartiles(
                {
                    3: [{id:"a"}, {id:"b"}, {id:"c"}],
                    50:[{id:"e"}],
                    60:[{id:"f"}],
                    82:[{id:"g"}, {id:"h"}],
                },
                [25, 50, 75]
            ),
                [
                    [{id:"a"}, {id:"b"}, {id:"c"}],
                    [{id:"e"}],
                    [{id:"f"}],
                    [{id:"g"}, {id:"h"}]
                ]
            );
        });
        it("sorts data into quartiles when theres various values per quartile", ()=>{
            assert.deepEqual(sortDataIntoQuartiles(
                {
                    3: [{id:"a"}, {id:"b"}, {id:"c"}],
                    4: [{id:"d"}, {id:"e"}, {id:"f"}],
                    5: [{id:"g"}, {id:"h"}, {id:"i"}],
                    6: [{id:"j"}, {id:"k"}, {id:"l"}],
                    51: [{id:"m"}, {id:"n"}, {id:"o"}],
                    60:[{id:"p"}],
                    62: [{id:"q"}, {id:"r"}, {id:"s"}],
                    75: [{id:"t"}, {id:"u"}, {id:"v"}],
                    82:[{id:"w"}, {id:"x"}],
                    90:[{id:"y"}, {id:"z"}],
                },
                [25, 50, 75]
                ),
                [
                    [
                        {id:"a"}, {id:"b"}, {id:"c"},
                        {id:"d"}, {id:"e"}, {id:"f"},
                        {id:"g"}, {id:"h"}, {id:"i"},
                        {id:"j"}, {id:"k"}, {id:"l"}
                    ],
                    [],
                    [
                        {id:"m"}, {id:"n"}, {id:"o"},
                        {id:"p"}, {id:"q"}, {id:"r"},
                        {id:"s"}, {id:"t"}, {id:"u"},
                        {id:"v"}
                    ],
                    [
                        {id:"w"}, {id:"x"}, {id:"y"},
                        {id:"z"}
                    ]
                ]
            );
        });
    });

    describe("convertPatientsStudiesAttrToSamples", ()=>{
        const oneStudyOneSamplePerPatient = [
            {
                id:"study1",
                patients:["4","5"]
            }
        ];
        const multipleStudiesOneSamplePerPatient = [
            {
                id:"study1",
                patients:["4","5"]
            },
            {
                id:"study2",
                patients:["3"]
            }
        ];
        const oneStudyMultipleSamplesPerPatient = [
            {
                id:"study1",
                patients:["1","2","3"]
            }
        ];
        const multipleStudiesMultipleSamplesPerPatient = [
            {
                id:"study1",
                patients:["1","2"]
            },
            {
                id:"study2",
                patients:["1","2","3","4"]
            }
        ];
        let patientToSamplesSet:ComplexKeyGroupsMap<Pick<Sample, "sampleId">>;
        before(()=>{
            patientToSamplesSet = new ComplexKeyGroupsMap<Pick<Sample, "sampleId">>();
            for (const studyId of ["study1", "study2"]) {
                for (const patientId of ["1","2","3","4","5"]) {
                    if (patientId === "1") {
                        patientToSamplesSet.add({ patientId, studyId }, {sampleId: "1.1"});
                        patientToSamplesSet.add({ patientId, studyId }, {sampleId: "1.2"});
                        patientToSamplesSet.add({ patientId, studyId }, {sampleId: "1.3"});
                    } else if (patientId === "2") {
                        patientToSamplesSet.add({ patientId, studyId }, {sampleId: "2.1"});
                        patientToSamplesSet.add({ patientId, studyId }, {sampleId: "2.2"});
                    } else {
                        patientToSamplesSet.add({ patientId, studyId }, {sampleId: patientId});
                    }
                }
            }
        });
        it("empty", ()=>{
            assertDeepEqualInAnyOrder(
                convertPatientsStudiesAttrToSamples([], patientToSamplesSet),
                []
            )
        });
        it("one study, one sample per patient", ()=>{
            assertDeepEqualInAnyOrder(
                convertPatientsStudiesAttrToSamples(oneStudyOneSamplePerPatient, patientToSamplesSet),
                [{
                    id:"study1",
                    samples:["4","5"]
                }]
            );
        });
        it("one study, multiple samples per patient", ()=>{
            assertDeepEqualInAnyOrder(
                convertPatientsStudiesAttrToSamples(oneStudyMultipleSamplesPerPatient, patientToSamplesSet),
                [{
                    id:"study1",
                    samples:["1.1","1.2","1.3","2.1","2.2","3"]
                }]
            );
        });
        it("multiple studies, one sample per patient", ()=>{
            assertDeepEqualInAnyOrder(
                convertPatientsStudiesAttrToSamples(multipleStudiesOneSamplePerPatient, patientToSamplesSet),
                [{
                    id:"study1",
                    samples:["4","5"]
                },
                {
                    id:"study2",
                    samples:["3"]
                }]
            );
        });
        it("multiple studies, multiple samples per patient", ()=>{
            assertDeepEqualInAnyOrder(
                convertPatientsStudiesAttrToSamples(multipleStudiesMultipleSamplesPerPatient, patientToSamplesSet),
                [{
                    id:"study1",
                    samples:["1.1","1.2","1.3","2.1","2.2"]
                },{
                    id:"study2",
                    samples:["1.1","1.2","1.3","2.1","2.2","3","4"]
                }]
            );
        });
    });

    describe("sample set operations", ()=>{
        const groups = [{
            uid:"group0",
            studies:[{
                id:"study1",
                samples:["1", "2", "3"]
            },
                {
                    id:"study2",
                    samples:["1","2"]
                }]
        },{
            uid:"group1",
            studies:[{
                id:"study1",
                samples:["2"]
            },
                {
                    id:"study2",
                    samples:["1"]
                },
                {
                    id:"study3",
                    samples:["1","2","3","4"]
                }]
        },{
            uid:"group2",
            studies:[{
                id:"study1",
                samples:["1","3","4"]
            }]
        }, {
            uid:"group3",
            studies:[{
                id:"study1",
                samples:["1","2","3"]
            }]
        }];
        describe("intersectSamples", ()=>{
            it("intersection of empties", ()=>{
                assertDeepEqualInAnyOrder(intersectSamples([], []), []);
            });
            it("empty intersection of nonempties", ()=>{
                assertDeepEqualInAnyOrder(intersectSamples([{id:"s",samples:["1","2","3"]}], []), []);
                assertDeepEqualInAnyOrder(intersectSamples([], [{id:"s",samples:["1","2","3"]}]), []);
            });
            it("intersection with self is self", ()=>{
                assertDeepEqualInAnyOrder(intersectSamples(groups[0].studies, groups[0].studies), groups[0].studies);
            });
            it("intersection is commutative", ()=>{
                assertDeepEqualInAnyOrder(intersectSamples(groups[0].studies, groups[1].studies), intersectSamples(groups[1].studies, groups[0].studies));
            });
            it("nonempty intersection of nonempties - one study nonempty", ()=>{
                assertDeepEqualInAnyOrder(intersectSamples(groups[0].studies, groups[2].studies), [{
                    id:"study1",
                    samples:["1","3"]
                }]);
            });
            it("nonempty intersection of nonempties - some studies nonempty", ()=>{
                assertDeepEqualInAnyOrder(intersectSamples(groups[0].studies, groups[1].studies), [{
                    id:"study1",
                    samples:["2"]
                },
                    {
                        id:"study2",
                        samples:["1"]
                    }]);
            });
        });
        describe("excludeSamples", ()=>{
            it("exclusion involving empties", ()=>{
                assertDeepEqualInAnyOrder(excludeSamples([], []), []);
                assertDeepEqualInAnyOrder(excludeSamples([{id:"s",samples:["1","2","3"]}], []), [{id:"s",samples:["1","2","3"]}]);
                assertDeepEqualInAnyOrder(excludeSamples([], [{id:"s",samples:["1","2","3"]}]), []);
            });
            it("empty exclusion of nonempties", ()=>{
                assertDeepEqualInAnyOrder(excludeSamples(groups[0].studies, groups[0].studies), []);
                assertDeepEqualInAnyOrder(excludeSamples(groups[3].studies, groups[0].studies), []);
            });
            it("nonempty exclusion of nonempties", ()=>{
                assertDeepEqualInAnyOrder(excludeSamples(groups[0].studies, groups[3].studies), [{
                    id:"study2",
                    samples:["1","2"]
                }]);
                assertDeepEqualInAnyOrder(excludeSamples(groups[0].studies, groups[1].studies), [{
                    id:"study1",
                    samples:["1", "3"]
                },
                    {
                        id:"study2",
                        samples:["2"]
                    }]);
            });
        });
        describe("unionSamples", ()=>{
            it("unions involving empties", ()=>{
                assertDeepEqualInAnyOrder(unionSamples([], []), []);
                assertDeepEqualInAnyOrder(unionSamples(groups[0].studies, []), groups[0].studies);
                assertDeepEqualInAnyOrder(unionSamples([], groups[0].studies), groups[0].studies);
            });
            it("union with self is self", ()=>{
                assertDeepEqualInAnyOrder(unionSamples(groups[0].studies, groups[0].studies), groups[0].studies);
            });
            it("union is commutative", ()=>{
                assertDeepEqualInAnyOrder(unionSamples(groups[0].studies, groups[1].studies), unionSamples(groups[1].studies, groups[0].studies));
            });
            it("unions of nonempties", ()=>{
                assertDeepEqualInAnyOrder(unionSamples(groups[0].studies, groups[1].studies), [{
                    id:"study1",
                    samples:["1", "2", "3"]
                },
                    {
                        id:"study2",
                        samples:["1","2"]
                    },{
                        id:"study3",
                        samples:["1","2","3","4"]
                    }]);

                assertDeepEqualInAnyOrder(unionSamples(groups[2].studies, groups[3].studies), [{
                    id:"study1",
                    samples:["1","2","3","4"]
                }]);
            });
        });
    });

    describe("patient set operations", ()=>{
        const groups = [{
            uid:"group0",
            studies:[{
                id:"study1",
                patients:["1", "2", "3"]
            },
                {
                    id:"study2",
                    patients:["1","2"]
                }]
        },{
            uid:"group1",
            studies:[{
                id:"study1",
                patients:["2"]
            },
                {
                    id:"study2",
                    patients:["1"]
                },
                {
                    id:"study3",
                    patients:["1","2","3","4"]
                }]
        },{
            uid:"group2",
            studies:[{
                id:"study1",
                patients:["1","3","4"]
            }]
        }, {
            uid:"group3",
            studies:[{
                id:"study1",
                patients:["1","2","3"]
            }]
        }];
        describe("intersectPatients", ()=>{
            it("intersection of empties", ()=>{
                assertDeepEqualInAnyOrder(intersectPatients([], []), []);
            });
            it("empty intersection of nonempties", ()=>{
                assertDeepEqualInAnyOrder(intersectPatients([{id:"s",patients:["1","2","3"]}], []), []);
                assertDeepEqualInAnyOrder(intersectPatients([], [{id:"s",patients:["1","2","3"]}]), []);
            });
            it("intersection with self is self", ()=>{
                assertDeepEqualInAnyOrder(intersectPatients(groups[0].studies, groups[0].studies), groups[0].studies);
            });
            it("intersection is commutative", ()=>{
                assertDeepEqualInAnyOrder(intersectPatients(groups[0].studies, groups[1].studies), intersectPatients(groups[1].studies, groups[0].studies));
            });
            it("nonempty intersection of nonempties - one study nonempty", ()=>{
                assertDeepEqualInAnyOrder(intersectPatients(groups[0].studies, groups[2].studies), [{
                    id:"study1",
                    patients:["1","3"]
                }]);
            });
            it("nonempty intersection of nonempties - some studies nonempty", ()=>{
                assertDeepEqualInAnyOrder(intersectPatients(groups[0].studies, groups[1].studies), [{
                    id:"study1",
                    patients:["2"]
                },
                    {
                        id:"study2",
                        patients:["1"]
                    }]);
            });
        });
        describe("excludePatients", ()=>{
            it("exclusion involving empties", ()=>{
                assertDeepEqualInAnyOrder(excludePatients([], []), []);
                assertDeepEqualInAnyOrder(excludePatients([{id:"s",patients:["1","2","3"]}], []), [{id:"s",patients:["1","2","3"]}]);
                assertDeepEqualInAnyOrder(excludePatients([], [{id:"s",patients:["1","2","3"]}]), []);
            });
            it("empty exclusion of nonempties", ()=>{
                assertDeepEqualInAnyOrder(excludePatients(groups[0].studies, groups[0].studies), []);
                assertDeepEqualInAnyOrder(excludePatients(groups[3].studies, groups[0].studies), []);
            });
            it("nonempty exclusion of nonempties", ()=>{
                assertDeepEqualInAnyOrder(excludePatients(groups[0].studies, groups[3].studies), [{
                    id:"study2",
                    patients:["1","2"]
                }]);
                assertDeepEqualInAnyOrder(excludePatients(groups[0].studies, groups[1].studies), [{
                    id:"study1",
                    patients:["1", "3"]
                },
                    {
                        id:"study2",
                        patients:["2"]
                    }]);
            });
        });
        describe("unionPatients", ()=>{
            it("unions involving empties", ()=>{
                assertDeepEqualInAnyOrder(unionPatients([], []), []);
                assertDeepEqualInAnyOrder(unionPatients(groups[0].studies, []), groups[0].studies);
                assertDeepEqualInAnyOrder(unionPatients([], groups[0].studies), groups[0].studies);
            });
            it("union with self is self", ()=>{
                assertDeepEqualInAnyOrder(unionPatients(groups[0].studies, groups[0].studies), groups[0].studies);
            });
            it("union is commutative", ()=>{
                assertDeepEqualInAnyOrder(unionPatients(groups[0].studies, groups[1].studies), unionPatients(groups[1].studies, groups[0].studies));
            });
            it("unions of nonempties", ()=>{
                assertDeepEqualInAnyOrder(unionPatients(groups[0].studies, groups[1].studies), [{
                    id:"study1",
                    patients:["1", "2", "3"]
                },
                    {
                        id:"study2",
                        patients:["1","2"]
                    },{
                        id:"study3",
                        patients:["1","2","3","4"]
                    }]);

                assertDeepEqualInAnyOrder(unionPatients(groups[2].studies, groups[3].studies), [{
                    id:"study1",
                    patients:["1","2","3","4"]
                }]);
            });
        });
    });

    describe("partitionCasesByGroupMembership", ()=>{
        const getCaseIdentifiers = (group:any)=>{
            return getSampleIdentifiers([group]);
        }
        const getUniqueCaseKey = (id:any)=>{
            return id.studyId+"+"+id.sampleId;
        };
        const groups = [{
            uid:"group0",
            studies:[{
                id:"study1",
                samples:["1", "2", "3"],
                patients:["1", "2", "3"]
            },
                {
                    id:"study2",
                    samples:["1","2"],
                    patients:["1","2"]
                }]
        },{
            uid:"group1",
            studies:[{
                id:"study1",
                samples:["2"],
                patients:["2"]
            },
                {
                    id:"study2",
                    samples:["1"],
                    patients:["1"]
                },
                {
                    id:"study3",
                    samples:["1","2","3","4"],
                    patients:["1","2","3","4"]
                }]
        },{
            uid:"group2",
            studies:[{
                id:"study1",
                samples:["1","3","4"],
                patients:["1","3","4"]
            }]
        }, {
            uid:"group3",
            studies:[{
                id:"study1",
                samples:["1","2","3"],
                patients:["1","2","3"]
            }]
        }];
        it("partitions empty list properly", ()=>{
            assertDeepEqualInAnyOrder(
                partitionCasesByGroupMembership(groups, getCaseIdentifiers, getUniqueCaseKey, []),
                []
            );
        });
        it("partitions a list of cases properly", ()=>{
            assertDeepEqualInAnyOrder(
                partitionCasesByGroupMembership(groups, getCaseIdentifiers, getUniqueCaseKey, [
                    "study1+1","study1+2","study1+3","study1+4",
                    "study2+1","study2+2",
                    "study3+1","study3+2","study3+3","study3+4",
                ]),
                [{
                    key:{
                        group0:true,
                        group1:false,
                        group2:true,
                        group3:true
                    },
                    value:["study1+1", "study1+3"]
                },{
                    key:{
                        group0:true,
                        group1:true,
                        group2:false,
                        group3:true
                    },
                    value:["study1+2"]
                },{
                    key:{
                        group0:false,
                        group1:false,
                        group2:true,
                        group3:false
                    },
                    value:["study1+4"]
                },{
                    key:{
                        group0:true,
                        group1:true,
                        group2:false,
                        group3:false
                    },
                    value:["study2+1"]
                },
                {
                    key:{
                        group0: true,
                        group1:false,
                        group2:false,
                        group3:false
                    },
                    value:["study2+2"]
                },{
                    key:{
                        group0:false,
                        group1:true,
                        group2:false,
                        group3:false
                    },
                    value:["study3+1","study3+2","study3+3","study3+4"]
                }]
            )
        });
    });
});
