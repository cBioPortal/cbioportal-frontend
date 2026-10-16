import * as React from 'react';
import { mount, ReactWrapper } from 'enzyme';
import { act } from 'react-dom/test-utils';
import { observable } from 'mobx';
import { Observer } from 'mobx-react';
import { CancerStudy, StudyViewFilter } from 'cbioportal-ts-api-client';
import { VirtualStudy } from 'shared/api/session-service/sessionServiceModels';
import { QueryParser } from 'shared/lib/query/QueryParser';
import CancerStudySelector from './CancerStudySelector';
import CancerStudyTreeData from './CancerStudyTreeData';
import { DataTypeFilter } from './DataTypeFilter';
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

function virtualStudy(sourceIds: string[]): VirtualStudy {
    return {
        id: 'virtual',
        data: {
            name: 'Saved cohort',
            description: '',
            studies: sourceIds.map(id => ({ id, samples: ['saved-sample'] })),
            origin: sourceIds,
            studyViewFilter: {} as StudyViewFilter,
        },
    };
}

function createSelector({
    studies = [
        physicalStudy('mutations', { sequencedSampleCount: 3 }),
        physicalStudy('copy-number', { cnaSampleCount: 5 }),
        physicalStudy('empty'),
    ],
    virtualStudies = [virtualStudy(['mutations', 'copy-number'])],
    search = '',
}: {
    studies?: CancerStudy[];
    virtualStudies?: VirtualStudy[];
    search?: string;
} = {}) {
    const treeData = new CancerStudyTreeData({
        cancerTypes: [],
        studies,
        allStudyTags: [],
        virtualStudies,
        maxTreeDepth: 2,
    });
    const store = (Object.assign(
        observable({
            dataTypeFilters: [] as string[],
            studyFilterOptions: [
                {
                    id: 'sequencedSampleCount',
                    name: 'Mutations',
                    checked: false,
                },
                { id: 'cnaSampleCount', name: 'CNA', checked: false },
            ],
        }),
        {
            treeData,
            cancerStudies: { result: studies },
            resourceDefinitions: { result: [] },
            virtualStudiesMap: Object.fromEntries(
                virtualStudies.map(study => [study.id, study])
            ),
            searchClauses: new QueryParser(
                new Set(['hg19', 'hg38'])
            ).parseSearchQuery(search),
            selectableSelectedStudyIds: [],
            selectedCancerTypes: [],
            maxTreeDepth: 2,
        }
    ) as unknown) as QueryStore;
    Object.assign(store, { studyListLogic: new StudyListLogic(store) });
    const selector = new CancerStudySelector({
        queryStore: store,
        forkedMode: false,
    });
    return { selector, store };
}

describe('CancerStudySelector virtual cohort datatype dropdown', () => {
    let dropdown: ReactWrapper | undefined;

    afterEach(() => {
        act(() => {
            dropdown?.unmount();
        });
        dropdown = undefined;
    });

    function mountDropdown(selector: CancerStudySelector, store: QueryStore) {
        dropdown = mount(
            <Observer>
                {() => (
                    <DataTypeFilter
                        dataFilter={store.dataTypeFilters}
                        isChecked={false}
                        buttonText="Data type"
                        dataFilterActive={store.studyFilterOptions}
                        store={store}
                        samplePerFilter={selector.showSamplesPerFilterType}
                        studyPerFilter={selector.showStudiesPerFilterType}
                        toggleFilter={selector.toggleFilter}
                    />
                )}
            </Observer>
        );
        act(() => {
            dropdown!
                .find('button')
                .first()
                .simulate('click');
        });
        dropdown!.update();
    }

    function row(name: string) {
        return dropdown!
            .find('tbody tr')
            .filterWhere(candidate => candidate.find('label').text() === name);
    }

    function toggle(name: string) {
        const checkbox = row(name).find('input');
        expect(checkbox.prop('disabled')).toBe(false);
        act(() => {
            checkbox.simulate('change');
        });
        dropdown!.update();
    }

    it('counts a name-matched virtual row once for every available source datatype', () => {
        const { selector } = createSelector({ search: 'Saved cohort' });

        expect(selector.showStudiesPerFilterType).toEqual([1, 1]);
        expect(selector.showStudiesPerBaseFilterType.slice(0, 2)).toEqual([
            1,
            1,
        ]);
        expect(selector.showSamplesPerFilterType).toEqual([null, null]);
    });

    it('allows filtering a virtual-only search and explains its unknown sample counts', () => {
        const { selector, store } = createSelector({ search: 'Saved cohort' });
        mountDropdown(selector, store);

        expect(
            row('Mutations')
                .find('td')
                .at(1)
                .text()
        ).toBe('1');
        const sampleCell = row('Mutations')
            .find('td')
            .at(2);
        expect(sampleCell.text()).toBe('—');
        expect(sampleCell.find('[title]').prop('title')).toMatch(
            /virtual stud.*source stud/i
        );
        toggle('Mutations');
        toggle('CNA');

        expect(store.dataTypeFilters).toEqual([
            'sequencedSampleCount',
            'cnaSampleCount',
        ]);
        expect(
            store.studyListLogic.mainView
                .getSelectionReport()
                .shownStudies.map(study => study.studyId)
        ).toEqual(['virtual']);
    });

    it.each([
        ['Mutations', 'CNA'],
        ['CNA', 'Mutations'],
    ])(
        'allows selecting %s then %s and undoing both selections',
        (first, second) => {
            const { selector, store } = createSelector();
            mountDropdown(selector, store);

            toggle(first);
            expect(
                store.studyListLogic.mainView.getSelectionReport().shownStudies
            ).toHaveLength(2);
            toggle(second);
            expect(
                store.studyListLogic.mainView
                    .getSelectionReport()
                    .shownStudies.map(study => study.studyId)
            ).toEqual(['virtual']);
            expect(selector.showStudiesPerFilterType).toEqual([1, 1]);
            expect(selector.showSamplesPerFilterType).toEqual([null, null]);

            toggle(first);
            expect(
                store.studyListLogic.mainView.getSelectionReport().shownStudies
            ).toHaveLength(2);
            toggle(second);
            expect(store.dataTypeFilters).toEqual([]);
            expect(
                store.studyListLogic.mainView.getSelectionReport().shownStudies
            ).toHaveLength(4);
        }
    );

    it('counts overlapping physical and virtual rows once each without summing their sample totals', () => {
        const { selector } = createSelector({
            virtualStudies: [
                virtualStudy(['mutations', 'mutations', 'copy-number']),
            ],
        });

        expect(selector.showStudiesPerFilterType).toEqual([2, 2]);
        expect(selector.showSamplesPerFilterType).toEqual([null, null]);
    });

    it('keeps exact physical sample totals for datatypes absent from visible virtual rows', () => {
        const { selector } = createSelector({
            virtualStudies: [virtualStudy(['mutations'])],
        });

        expect(selector.showStudiesPerFilterType).toEqual([2, 1]);
        expect(selector.showSamplesPerFilterType).toEqual([null, 5]);
    });

    it.each(['missing', 'private', 'unavailable'])(
        'does not enable a datatype using a %s source',
        sourceId => {
            const { selector, store } = createSelector({
                studies: [
                    physicalStudy('mutations', { sequencedSampleCount: 3 }),
                    physicalStudy('private', {
                        readPermission: false,
                        cnaSampleCount: 5,
                    }),
                    physicalStudy('unavailable', {
                        status: 0,
                        cnaSampleCount: 5,
                    }),
                ],
                virtualStudies: [virtualStudy(['mutations', sourceId])],
                search: 'Saved cohort',
            });
            mountDropdown(selector, store);

            expect(selector.showStudiesPerFilterType).toEqual([1, 0]);
            expect(selector.showSamplesPerFilterType).toEqual([null, 0]);
            expect(
                row('CNA')
                    .find('input')
                    .prop('disabled')
            ).toBe(true);
            toggle('Mutations');
            expect(
                row('CNA')
                    .find('input')
                    .prop('disabled')
            ).toBe(true);
        }
    );

    it('preserves exact counts and dropdown selection for physical-only studies', () => {
        const { selector, store } = createSelector({ virtualStudies: [] });
        mountDropdown(selector, store);

        expect(selector.showStudiesPerFilterType).toEqual([1, 1]);
        expect(selector.showSamplesPerFilterType).toEqual([3, 5]);
        expect(
            row('Mutations')
                .find('td')
                .at(2)
                .text()
        ).toBe('3');
        toggle('Mutations');
        expect(selector.showStudiesPerFilterType).toEqual([1, 0]);
        expect(selector.showSamplesPerFilterType).toEqual([3, 0]);
        expect(
            row('CNA')
                .find('input')
                .prop('disabled')
        ).toBe(true);
        toggle('Mutations');
        expect(selector.showSamplesPerFilterType).toEqual([3, 5]);
    });
});
