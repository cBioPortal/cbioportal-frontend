import { assert } from 'chai';
import { CancerStudy, StudyViewFilter } from 'cbioportal-ts-api-client';
import { VirtualStudy } from 'shared/api/session-service/sessionServiceModels';
import { QueryParser } from 'shared/lib/query/QueryParser';
import CancerStudyTreeData from './CancerStudyTreeData';
import { QueryStore } from './QueryStore';
import StudyListLogic from './StudyListLogic';

function physicalStudy(
    studyId: string,
    properties: Partial<CancerStudy> = {}
): CancerStudy {
    return {
        studyId,
        name: studyId,
        description: '',
        cancerTypeId: 'tissue',
        readPermission: true,
        status: 1,
        sequencedSampleCount: 0,
        cnaSampleCount: 0,
        resourceCounts: [],
        referenceGenome: 'hg19',
        ...properties,
    } as CancerStudy;
}

function virtualStudy(
    id: string,
    studies: { id: string; samples: string[] }[],
    name = 'My cohort'
): VirtualStudy {
    return {
        id,
        data: {
            name,
            description: 'Saved cohort',
            studies,
            origin: studies.map(study => study.id),
            studyViewFilter: {} as StudyViewFilter,
        },
    };
}

function createStudyList({
    studies = [physicalStudy('mutations', { sequencedSampleCount: 3 })],
    virtualStudies = [
        virtualStudy('virtual', [{ id: 'mutations', samples: ['sample1'] }]),
    ],
    publicVirtualStudies = [],
    filters = ['sequencedSampleCount'],
    search = '',
}: {
    studies?: CancerStudy[];
    virtualStudies?: VirtualStudy[];
    publicVirtualStudies?: VirtualStudy[];
    filters?: string[];
    search?: string;
} = {}) {
    const treeData = new CancerStudyTreeData({
        cancerTypes: [],
        studies,
        allStudyTags: [
            {
                studyId: 'mutations',
                cancerStudyId: 1,
                tags: '{"tag":"tagged"}',
            },
        ],
        virtualStudies,
        publicVirtualStudies,
        maxTreeDepth: 2,
    });
    const store = {
        treeData,
        cancerStudies: { result: studies },
        virtualStudiesMap: Object.fromEntries(
            [...virtualStudies, ...publicVirtualStudies].map(study => [
                study.id,
                study,
            ])
        ),
        dataTypeFilters: filters,
        searchClauses: new QueryParser(
            new Set(['hg19', 'hg38'])
        ).parseSearchQuery(search),
        selectedCancerTypes: [],
        maxTreeDepth: 2,
    };
    const logic = new StudyListLogic((store as unknown) as QueryStore);
    const visibleStudyIds = () =>
        logic.mainView
            .getDescendantCancerStudies(treeData.rootCancerType)
            .map(study => study.studyId);
    return { logic, treeData, visibleStudyIds };
}

describe('StudyListLogic data type filtering', () => {
    it('keeps a saved virtual cohort when its source has mutation data', () => {
        const { visibleStudyIds, treeData, logic } = createStudyList();

        assert.sameMembers(visibleStudyIds(), ['mutations', 'virtual']);
        assert.isTrue(logic.mainView.nodeFilter(treeData.virtualStudyCategory));
        assert.isTrue(logic.mainView.nodeFilter(treeData.rootCancerType));
    });

    it('keeps public virtual cohorts using their constituent study IDs', () => {
        const { visibleStudyIds } = createStudyList({
            virtualStudies: [],
            publicVirtualStudies: [
                virtualStudy('public', [
                    { id: 'mutations', samples: ['sample1'] },
                ]),
            ],
        });

        assert.sameMembers(visibleStudyIds(), ['mutations', 'public']);
    });

    it('requires every selected data type, allowing different cohort sources to provide them', () => {
        const { visibleStudyIds } = createStudyList({
            studies: [
                physicalStudy('mutations', { sequencedSampleCount: 3 }),
                physicalStudy('copy-number', { cnaSampleCount: 2 }),
            ],
            virtualStudies: [
                virtualStudy('mixed', [
                    { id: 'mutations', samples: ['sample1'] },
                    { id: 'copy-number', samples: ['sample2'] },
                ]),
                virtualStudy('mutation-only', [
                    { id: 'mutations', samples: ['sample1'] },
                ]),
            ],
            filters: ['sequencedSampleCount', 'cnaSampleCount'],
        });

        assert.deepEqual(visibleStudyIds(), ['mixed']);
    });

    it('includes resource data from a constituent study', () => {
        const { visibleStudyIds } = createStudyList({
            studies: [
                physicalStudy('mutations', {
                    resourceCounts: [
                        { resourceId: 'pathology', sampleCount: 2 },
                    ] as CancerStudy['resourceCounts'],
                }),
            ],
            filters: ['pathology'],
        });

        assert.sameMembers(visibleStudyIds(), ['mutations', 'virtual']);
    });

    it('uses stable IDs when physical and virtual studies share display names', () => {
        const { visibleStudyIds } = createStudyList({
            studies: [
                physicalStudy('empty', { name: 'Same name' }),
                physicalStudy('mutations', {
                    name: 'Same name',
                    sequencedSampleCount: 3,
                }),
            ],
            virtualStudies: [
                virtualStudy(
                    'virtual',
                    [{ id: 'empty', samples: ['sample1'] }],
                    'Same name'
                ),
            ],
        });

        assert.deepEqual(visibleStudyIds(), ['mutations']);
    });

    it('does not borrow counts from a physical study with the same name as a virtual cohort', () => {
        const { visibleStudyIds } = createStudyList({
            studies: [
                physicalStudy('mutations', {
                    name: 'My cohort',
                    sequencedSampleCount: 3,
                }),
                physicalStudy('empty'),
            ],
            virtualStudies: [
                virtualStudy('virtual', [
                    { id: 'empty', samples: ['sample1'] },
                ]),
            ],
        });

        assert.deepEqual(visibleStudyIds(), ['mutations']);
    });

    it('preserves top-level count precedence over resources with the same ID', () => {
        const { visibleStudyIds } = createStudyList({
            studies: [
                physicalStudy('mutations', {
                    resourceCounts: [
                        { resourceId: 'sequencedSampleCount', sampleCount: 3 },
                    ] as CancerStudy['resourceCounts'],
                }),
            ],
        });

        assert.deepEqual(visibleStudyIds(), []);
    });

    it.each(['missing', 'private', 'unavailable'])(
        'does not infer data from a %s constituent',
        sourceId => {
            const { visibleStudyIds } = createStudyList({
                studies: [
                    physicalStudy('private', {
                        readPermission: false,
                        sequencedSampleCount: 3,
                    }),
                    physicalStudy('unavailable', {
                        status: 0,
                        sequencedSampleCount: 3,
                    }),
                    physicalStudy('empty'),
                ],
                virtualStudies: [
                    virtualStudy('virtual', [
                        { id: sourceId, samples: ['sample1'] },
                        { id: 'empty', samples: ['sample2'] },
                    ]),
                ],
            });

            assert.notInclude(visibleStudyIds(), 'virtual');
        }
    );

    it('uses available sources when a former constituent is missing', () => {
        const { visibleStudyIds } = createStudyList({
            virtualStudies: [
                virtualStudy('virtual', [
                    { id: 'missing', samples: ['deleted-sample'] },
                    { id: 'mutations', samples: ['sample1'] },
                ]),
            ],
        });

        assert.sameMembers(visibleStudyIds(), ['mutations', 'virtual']);
    });

    it('does not use a source with no samples in the virtual cohort', () => {
        const { visibleStudyIds } = createStudyList({
            virtualStudies: [
                virtualStudy('virtual', [{ id: 'mutations', samples: [] }]),
            ],
        });

        assert.deepEqual(visibleStudyIds(), ['mutations']);
    });

    it('excludes empty virtual cohorts when a data type is selected', () => {
        const { visibleStudyIds } = createStudyList({
            virtualStudies: [virtualStudy('virtual', [])],
        });

        assert.deepEqual(visibleStudyIds(), ['mutations']);
    });

    it('preserves all study nodes when no data type is selected', () => {
        const { visibleStudyIds } = createStudyList({
            filters: [],
            virtualStudies: [virtualStudy('virtual', [])],
        });

        assert.sameMembers(visibleStudyIds(), ['mutations', 'virtual']);
    });

    it('keeps search based on virtual cohort fields rather than its source name', () => {
        assert.deepEqual(
            createStudyList({ search: 'cohort' }).visibleStudyIds(),
            ['virtual']
        );
        assert.deepEqual(
            createStudyList({ search: 'mutations' }).visibleStudyIds(),
            ['mutations']
        );
    });

    it('does not inherit source tags or change reference-genome search behavior', () => {
        assert.deepEqual(
            createStudyList({ search: 'tagged' }).visibleStudyIds(),
            ['mutations']
        );
        assert.deepEqual(
            createStudyList({
                search: 'reference-genome:hg19',
            }).visibleStudyIds(),
            ['mutations']
        );
    });

    it('does not modify constituent samples or physical study metadata', () => {
        const studies = [
            physicalStudy('mutations', { sequencedSampleCount: 3 }),
        ];
        const virtualStudies = [
            virtualStudy('virtual', [
                { id: 'mutations', samples: ['sample1'] },
            ]),
        ];
        const original = JSON.stringify({ studies, virtualStudies });

        createStudyList({ studies, virtualStudies }).visibleStudyIds();

        assert.equal(JSON.stringify({ studies, virtualStudies }), original);
    });
});
