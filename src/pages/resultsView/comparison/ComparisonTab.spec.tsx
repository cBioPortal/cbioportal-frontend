import * as React from 'react';
import { shallow, ShallowWrapper } from 'enzyme';
import { observable, runInAction } from 'mobx';
import ComparisonTab from './ComparisonTab';
import GroupComparisonPage from 'pages/groupComparison/GroupComparisonPage';
import { MSKTab } from 'shared/components/MSKTabs/MSKTabs';
import AlterationEnrichments from 'pages/groupComparison/AlterationEnrichments';
import AlterationEnrichmentTypeSelector from 'shared/lib/comparison/AlterationEnrichmentTypeSelector';
import {
    AlterationFilterMenuSection,
    ComparisonGroup,
} from 'pages/groupComparison/GroupComparisonUtils';
import GroupSelector from 'pages/groupComparison/groupSelector/GroupSelector';
import GroupSelectorButtonList from 'pages/groupComparison/groupSelector/GroupSelectorButtonList';
import LoadingIndicator from 'shared/components/loadingIndicator/LoadingIndicator';
import ErrorMessage from 'shared/components/ErrorMessage';
import { getServerConfig } from 'config/config';
import ComplexKeyMap from 'shared/lib/complexKeyDataStructures/ComplexKeyMap';
import { Sample } from 'cbioportal-ts-api-client';

let mockStore: any;

jest.mock('./ResultsViewComparisonStore', () => ({
    __esModule: true,
    default: jest.fn(() => mockStore),
}));
jest.mock('pages/groupComparison/GroupComparisonStore', () => ({
    __esModule: true,
    default: jest.fn(() => mockStore),
}));
jest.mock('pages/groupComparison/GroupComparisonURLWrapper', () => ({
    __esModule: true,
    default: jest.fn(() => ({
        query: { comparisonId: 'comparison' },
        tabId: 'alterations',
        setTabId: jest.fn(),
        destroy: jest.fn(),
    })),
}));
jest.mock(
    'pages/groupComparison/pathwayMapper/GroupComparisonPathwayMapperUserSelectionStore',
    () => ({ __esModule: true, default: jest.fn() })
);
jest.mock('pages/groupComparison/GroupComparisonMutationsTab', () => ({
    __esModule: true,
    default: () => null,
}));
jest.mock('tours', () => ({ Tour: () => null }), { virtual: true });

function complete<Result>(result: Result) {
    return { status: 'complete', isComplete: true, isPending: false, result };
}

function createStore() {
    const groups = ['First', 'Second', 'Third'].map((name, index) => ({
        name,
        uid: name,
        ordinal: String(index + 1),
        nameWithOrdinal: name,
        nonExistentSamples: [],
        color: '#ffffff',
        description: '',
        origin: ['session'],
        studies: [],
    })) as ComparisonGroup[];
    const state = observable({
        selectedNames: groups.map(group => group.name),
        activeStatus: 'complete',
        excludedNames: [] as string[],
        profilesComplete: true,
    });
    const store = {
        state,
        _originalGroups: complete(groups),
        get _selectedGroups() {
            return complete(
                groups.filter(group => state.selectedNames.includes(group.name))
            );
        },
        get activeGroups() {
            return {
                status: state.activeStatus,
                isComplete: state.activeStatus === 'complete',
                isPending: state.activeStatus === 'pending',
                result: groups.filter(
                    group =>
                        state.selectedNames.includes(group.name) &&
                        !state.excludedNames.includes(group.name)
                ),
            };
        },
        get _activeGroupsNotOverlapRemoved() {
            return this._selectedGroups;
        },
        activeStudyIds: complete(['study']),
        get alterationEnrichmentProfiles() {
            return {
                ...complete([]),
                isComplete: state.profilesComplete,
                isPending: !state.profilesComplete,
            };
        },
        survivalClinicalDataExists: complete([]),
        mRNAEnrichmentProfiles: complete([]),
        proteinEnrichmentProfiles: complete([]),
        methylationEnrichmentProfiles: complete([]),
        mutationEnrichmentProfiles: complete([]),
        alterationEnrichmentRowData: complete([]),
        alterationsEnrichmentData: complete([]),
        alterationsEnrichmentAnalysisGroups: complete([]),
        selectedStudyMutationEnrichmentProfileMap: complete({}),
        selectedStudyCopyNumberEnrichmentProfileMap: complete({}),
        selectedStudyStructuralVariantEnrichmentProfileMap: complete({}),
        studies: complete([]),
        displayedStudies: complete([]),
        sampleMap: complete(new ComplexKeyMap<Sample>()),
        overlapComputations: complete({
            totalSampleOverlap: 0,
            totalPatientOverlap: 0,
            excludedFromAnalysis: {},
        }),
        showGenericAssayCategoricalTab: false,
        showGenericAssayBinaryTab: false,
        showGenericAssayTab: false,
        hasMutationEnrichmentData: true,
        hasCnaEnrichmentData: true,
        hasStructuralVariantData: true,
        isGroupDeletable: () => false,
        isGroupSelected: (name: string) => state.selectedNames.includes(name),
        toggleGroupSelected(name: string) {
            runInAction(() => {
                state.selectedNames = state.selectedNames.includes(name)
                    ? state.selectedNames.filter(selected => selected !== name)
                    : [...state.selectedNames, name];
            });
        },
        destroy: jest.fn(),
    };
    return store;
}

for (const view of ['Results', 'Standalone']) {
    describe(`${view} alteration analysis controls`, () => {
        let page: any;
        let pageWrapper: ShallowWrapper;
        let originalSettingsMenu: boolean;

        beforeEach(() => {
            mockStore = createStore();
            originalSettingsMenu = getServerConfig().skin_show_settings_menu;
        });

        afterEach(() => {
            pageWrapper?.unmount();
            getServerConfig().skin_show_settings_menu = originalSettingsMenu;
        });

        function createPage(settingsMenu: boolean) {
            getServerConfig().skin_show_settings_menu = settingsMenu;
            const appStore = { featureFlagStore: { has: () => false } };
            if (view === 'Results') {
                const props = {
                    appStore,
                    store: {},
                    urlWrapper: { subTab: 'alterations', setSubTab: jest.fn() },
                } as any;
                pageWrapper = shallow(<ComparisonTab {...props} />);
            } else {
                const Page = (GroupComparisonPage as any).wrappedComponent;
                pageWrapper = shallow(
                    <Page
                        appStore={appStore}
                        routing={{ location: { pathname: '/comparison' } }}
                    />
                );
            }
            page = pageWrapper.instance();
        }

        function alterationTab() {
            return shallow(<div>{page.tabs.component}</div>)
                .find(MSKTab)
                .filterWhere(tab => tab.prop('id') === 'alterations');
        }

        function enrichments() {
            return shallow(
                <AlterationEnrichments
                    {...alterationTab()
                        .find(AlterationEnrichments)
                        .props()}
                />
            );
        }

        function assertControls(settingsMenu: boolean, visible: boolean) {
            const tab = alterationTab();
            expect(tab.find(AlterationFilterMenuSection)).toHaveLength(
                visible && settingsMenu ? 1 : 0
            );
            expect(tab.find(AlterationEnrichmentTypeSelector)).toHaveLength(
                visible && !settingsMenu ? 1 : 0
            );
            expect(tab.find(AlterationEnrichments)).toHaveLength(1);
        }

        for (const settingsMenu of [false, true]) {
            for (const count of [0, 1, 2, 3]) {
                it(`handles ${count} active groups with settings menu ${settingsMenu}`, () => {
                    mockStore.state.selectedNames = [
                        'First',
                        'Second',
                        'Third',
                    ].slice(0, count);
                    createPage(settingsMenu);
                    assertControls(settingsMenu, count >= 2);
                    if (count < 2) {
                        expect(enrichments().text()).toContain(
                            'Please select more groups'
                        );
                    }
                    expect(pageWrapper.find(GroupSelector)).toHaveLength(1);
                });
            }

            for (const status of ['pending', 'error']) {
                it(`hides stale controls while groups are ${status} with settings menu ${settingsMenu}`, () => {
                    mockStore.state.activeStatus = status;
                    createPage(settingsMenu);
                    assertControls(settingsMenu, false);
                    expect(
                        enrichments().find(
                            status === 'pending'
                                ? LoadingIndicator
                                : ErrorMessage
                        )
                    ).toHaveLength(1);
                    runInAction(() => {
                        mockStore.state.activeStatus = 'complete';
                    });
                    assertControls(settingsMenu, true);
                });
            }

            it(`uses post-overlap active groups with settings menu ${settingsMenu}`, () => {
                mockStore.state.excludedNames = ['Second', 'Third'];
                createPage(settingsMenu);
                assertControls(settingsMenu, false);
                expect(enrichments().text()).toContain(
                    'Due to excluded overlapping cases'
                );
            });

            it(`recovers through the separate group selector with settings menu ${settingsMenu}`, () => {
                mockStore.state.selectedNames = [];
                createPage(settingsMenu);
                const groupSelectorProps = pageWrapper
                    .find(GroupSelector)
                    .props();
                const selector = new GroupSelector(groupSelectorProps);
                const buttons = shallow(<div>{selector.render()}</div>)
                    .find(GroupSelectorButtonList)
                    .prop('buttons') as React.ReactElement[];
                for (const [index, visible] of [
                    [0, false],
                    [1, true],
                    [0, false],
                    [1, false],
                    [0, false],
                    [1, true],
                ] as const) {
                    buttons[index].props.onClick(
                        buttons[index].props.group.name
                    );
                    assertControls(settingsMenu, visible);
                    expect(pageWrapper.find(GroupSelector)).toHaveLength(1);
                }
                const tabBefore = alterationTab().find(AlterationEnrichments);
                expect(
                    enrichments().find(
                        '[data-test="GroupComparisonAlterationEnrichments"]'
                    )
                ).toHaveLength(1);
                expect(tabBefore.prop('store')).toBe(mockStore);
            });
        }

        if (view === 'Standalone') {
            it('keeps the profile-loading indicator only for a valid inline comparison', () => {
                mockStore.state.profilesComplete = false;
                createPage(false);
                expect(alterationTab().find(LoadingIndicator)).toHaveLength(1);
                runInAction(() => {
                    mockStore.state.selectedNames = ['First'];
                });
                expect(alterationTab().find(LoadingIndicator)).toHaveLength(0);
                expect(enrichments().text()).toContain(
                    'Please select more groups'
                );
                runInAction(() => {
                    mockStore.state.selectedNames = ['First', 'Second'];
                });
                expect(alterationTab().find(LoadingIndicator)).toHaveLength(1);
                runInAction(() => {
                    mockStore.state.profilesComplete = true;
                });
                assertControls(false, true);
            });
            it('keeps settings controls available for valid groups while profiles load', () => {
                mockStore.state.profilesComplete = false;
                createPage(true);
                assertControls(true, true);
                runInAction(() => {
                    mockStore.state.selectedNames = ['First'];
                });
                assertControls(true, false);
                runInAction(() => {
                    mockStore.state.selectedNames = ['First', 'Second'];
                });
                assertControls(true, true);
            });
        }
    });
}
