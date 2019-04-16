import chai, {assert, expect} from 'chai';
import {
    ComparisonGroup,
    finalizeStudiesAttr,
    getCombinations, getNumPatients,
    getNumSamples,
    getOverlapFilteredGroups,
    getOverlappingPatients,
    getOverlappingSamples,
    getSampleIdentifiers,
    getStackedBarData,
    getStudyIds,
    getVennPlotData,
    OverlapFilteredComparisonGroup, sortDataIntoQuartiles
} from './GroupComparisonUtils';
import deepEqualInAnyOrder from "deep-equal-in-any-order";
import ComplexKeySet from "../../shared/lib/complexKeyDataStructures/ComplexKeySet";
import ListIndexedMap from "../../shared/lib/ListIndexedMap";
import {Sample} from "../../shared/api/generated/CBioPortalAPI";
import ComplexKeyMap from "../../shared/lib/complexKeyDataStructures/ComplexKeyMap";

chai.use(deepEqualInAnyOrder);

describe('GroupComparisonUtils', () => {

    describe('getCombinations', () => {
        it('when empty groups', () => {
            assert.deepEqual(getCombinations([]), [])
        });

        it('when there are no overlapping groups', () => {
            assert.deepEqual(
                getCombinations([{
                    uid: '1',
                    cases: ['1-1', '1-2']
                }, {
                    uid: '2',
                    cases: ['2-1']
                }]), [
                    { groups: ['1'], cases: ['1-1', '1-2'] },
                    { groups: ['1', '2'], cases: [] },
                    { groups: ['2'], cases: ['2-1'] }
                ]);
        });

        it('when there are one or more overlapping groups', () => {
            assert.deepEqual(
                getCombinations([{
                    uid: '1',
                    cases: ['1-1', '1-2']
                }, {
                    uid: '2',
                    cases: ['1-1']
                }]), [
                    { groups: ['1'], cases: ['1-1', '1-2'] },
                    { groups: ['1', '2'], cases: ['1-1'] },
                    { groups: ['2'], cases: ['1-1'] }
                ]);

            assert.deepEqual(
                getCombinations([{
                    uid: '1',
                    cases: ['1-1', '1-2']
                }, {
                    uid: '2',
                    cases: ['1-1', '1-3']
                }, {
                    uid: '3',
                    cases: ['1-1', '1-2', '1-3']
                }]), [
                    { groups: ['1'], cases: ['1-1', '1-2'] },
                    { groups: ['1', '2'], cases: ['1-1'] },
                    { groups: ['1', '2', '3'], cases: ['1-1'] },
                    { groups: ['1', '3'], cases: ['1-1', '1-2'] },
                    { groups: ['2'], cases: ['1-1', '1-3'] },
                    { groups: ['2', '3'], cases: ['1-1', '1-3'] },
                    { groups: ['3'], cases: ['1-1', '1-2', '1-3'] }
                ]);

            assert.deepEqual(
                getCombinations([{
                    uid: '1',
                    cases: ['1-1', '1-2']
                }, {
                    uid: '2',
                    cases: ['1-2', '1-3']
                }, {
                    uid: '3',
                    cases: ['1-3', '1-1']
                }]), [
                    { groups: ['1'], cases: ['1-1', '1-2'] },
                    { groups: ['1', '2'], cases: ['1-2'] },
                    { groups: ['1', '2', '3'], cases: [] },
                    { groups: ['1', '3'], cases: ['1-1'] },
                    { groups: ['2'], cases: ['1-2', '1-3'] },
                    { groups: ['2', '3'], cases: ['1-3'] },
                    { groups: ['3'], cases: ['1-3', '1-1'] }
                ]);
        });
    });

    describe('getStackedBarData', () => {
        const uidToGroup = {
            "1":{
                uid:"1",
                name:"1",
                color:"#990099"
            } as ComparisonGroup,
            "2":{
                uid:"2",
                name:"2",
                color:"#0099c6"
            } as ComparisonGroup
        };
        it('when no data', () => {
            assert.deepEqual(getStackedBarData([], {}), [])
        });

        it('when there no overlapping groups', () => {
            assert.deepEqual(getStackedBarData([
                { uid: '1', cases: ['1-1'] },
                { uid: '2', cases: ['1-2'] }
            ], uidToGroup),
                [
                    [{ cases: ['1-1'], fill: '#990099', groupName: '1' }],
                    [{ cases: ['1-2'], fill: '#0099c6', groupName: '2' }]
                ]);
        });

        it('when there one or more overlapping groups', () => {

            (expect(getStackedBarData([
                { uid: '1', cases: ['1-1', '1-2'] },
                { uid: '2', cases: ['1-1'] }
            ], uidToGroup))
                .to.deep as any).equalInAnyOrder([
                [{ cases: ['1-1'], fill: '#CCCCCC', groupName: 'Overlapping Cases' }],
                [{ cases: [], fill: '#0099c6', groupName: '2' }],
                [{ cases: ['1-2'], fill: '#990099', groupName: '1' }]
            ]);
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
});
