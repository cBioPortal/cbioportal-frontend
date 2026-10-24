import { ResultsViewPageStore } from './ResultsViewPageStore';
import ResultsViewURLWrapper from './ResultsViewURLWrapper';
import { AppStore } from 'AppStore';
import { CancerStudy, Sample } from 'cbioportal-ts-api-client';
import { remoteData } from 'cbioportal-frontend-commons';
import { autorun, observable, when } from 'mobx';
import comparisonClient from 'shared/api/comparisonGroupClientInstance';
import { ServerConfigHelpers } from 'config/config';
import ResultsViewComparisonStore from './comparison/ResultsViewComparisonStore';
import CreateGroupFromOverlap from 'pages/groupComparison/CreateGroupFromOverlap';
import { ComparisonGroup } from 'pages/groupComparison/GroupComparisonUtils';
import {
    ComparisonSession,
    SessionGroupData,
} from 'shared/api/session-service/sessionServiceModels';

describe('Results comparison session origin', () => {
    const stores: ResultsViewPageStore[] = [];
    const comparisonStores: ResultsViewComparisonStore[] = [];
    const disposers: (() => void)[] = [];

    function createStore(
        queriedIds: string[],
        physicalIds: string[],
        sessionId?: string,
        isLoggedIn = false
    ) {
        const appStore = { isLoggedIn } as AppStore;
        const urlWrapper = (observable({
            query: {
                cancer_study_list: queriedIds.join(','),
                comparison_createdGroupsSessionId: sessionId,
            },
            updateURL: jest.fn(),
        }) as unknown) as ResultsViewURLWrapper;
        const store = new ResultsViewPageStore(appStore, urlWrapper);
        Object.defineProperty(store, 'studyIds', {
            value: remoteData(() => Promise.resolve(physicalIds)),
        });
        Object.defineProperty(store, 'queriedStudies', {
            value: remoteData(() =>
                Promise.resolve(
                    queriedIds.map(studyId => ({ studyId } as CancerStudy))
                )
            ),
        });
        stores.push(store);
        return store;
    }

    async function completedSession(store: ResultsViewPageStore) {
        disposers.push(
            autorun(() => store.comparisonTabComparisonSession.status)
        );
        await when(
            () =>
                store.comparisonTabComparisonSession.isComplete ||
                store.comparisonTabComparisonSession.isError,
            { timeout: 5000 }
        );
        expect(store.comparisonTabComparisonSession.error).toBeUndefined();
        return store.comparisonTabComparisonSession.result!;
    }

    beforeEach(() => {
        jest.spyOn(
            ServerConfigHelpers,
            'sessionServiceIsEnabled'
        ).mockReturnValue(false);
    });

    afterEach(() => {
        disposers.splice(0).forEach(dispose => dispose());
        comparisonStores.splice(0).forEach(store => store.destroy());
        stores.splice(0).forEach(store => {
            store.destroy();
            store.pageUserSession.destroy();
        });
        jest.restoreAllMocks();
    });

    it.each([
        [['virtual-study'], ['physical-study']],
        [['virtual-study'], ['physical-study', 'other-physical']],
        [
            ['virtual-study', 'second-study'],
            ['physical-study', 'second-study'],
        ],
        [['first-virtual', 'second-virtual'], ['physical-study']],
        [['physical-study'], ['physical-study']],
    ])(
        'preserves queried IDs %j in a new session',
        async (queried, physical) => {
            const store = createStore(queried, physical);
            const session = await completedSession(store);
            expect(session).toEqual({ id: '', groups: [], origin: queried });
            expect(store.studyIds.result).toEqual(physical);
        }
    );

    it('waits for queried metadata before initializing virtual provenance', async () => {
        const store = createStore(['virtual-study'], ['physical-study']);
        const started = observable.box(false);
        let resolveStudies!: (studies: CancerStudy[]) => void;
        const pendingStudies = new Promise<CancerStudy[]>(resolve => {
            resolveStudies = resolve;
        });
        Object.defineProperty(store, 'queriedStudies', {
            value: remoteData(() => {
                started.set(true);
                return pendingStudies;
            }),
        });
        disposers.push(
            autorun(() => store.comparisonTabComparisonSession.status)
        );
        await when(
            () =>
                started.get() ||
                store.comparisonTabComparisonSession.isComplete,
            { timeout: 5000 }
        );
        expect(started.get()).toBe(true);
        expect(store.comparisonTabComparisonSession.isPending).toBe(true);
        resolveStudies([{ studyId: 'virtual-study' } as CancerStudy]);
        expect((await completedSession(store)).origin).toEqual([
            'virtual-study',
        ]);
    });

    it.each(['pending', 'error'])(
        'loads a saved session with %s query metadata',
        async state => {
            const storedGroup: SessionGroupData = {
                name: 'Saved overlap',
                description: '',
                origin: ['stored-origin'],
                studies: [{ id: 'physical-study', samples: ['sample-one'] }],
            };
            const stored: ComparisonSession = {
                id: 'saved-session',
                origin: ['stored-origin'],
                groups: [storedGroup],
            };
            const fetchSession = jest
                .spyOn(comparisonClient, 'getComparisonSession')
                .mockResolvedValue(stored);
            const store = createStore(
                ['virtual-study'],
                ['physical-study'],
                'saved-session'
            );
            const metadata = remoteData<CancerStudy[]>({
                invoke: () => {
                    if (state === 'pending') {
                        return new Promise(() => {});
                    }
                    const failure = Promise.reject<CancerStudy[]>(
                        new Error('metadata unavailable')
                    );
                    failure.catch(() => {});
                    return failure;
                },
                onError: () => {},
            });
            Object.defineProperty(store, 'queriedStudies', { value: metadata });
            if (state === 'error') {
                disposers.push(autorun(() => metadata.status));
                await when(() => metadata.isError, { timeout: 5000 });
            }
            const actual = await completedSession(store);
            expect(fetchSession).toHaveBeenCalledWith('saved-session');
            expect(actual).toEqual(stored);
            expect(actual.groups[0].studies).toEqual(storedGroup.studies);
            expect(stored).toEqual({
                id: 'saved-session',
                origin: ['stored-origin'],
                groups: [storedGroup],
            });
        }
    );

    it.each(['sample', 'patient'] as const)(
        'saves a %s overlap under its virtual study with physical membership',
        async caseType => {
            const store = createStore(
                ['virtual-study'],
                ['physical-study'],
                undefined,
                true
            );
            const session = await completedSession(store);
            const groups = [
                {
                    name: 'First',
                    uid: 'first',
                    studies: [
                        {
                            id: 'physical-study',
                            samples: ['sample-one', 'sample-two'],
                            patients: ['patient-one', 'patient-two'],
                        },
                    ],
                },
                {
                    name: 'Second',
                    uid: 'second',
                    studies: [
                        {
                            id: 'physical-study',
                            samples: ['sample-two'],
                            patients: ['patient-two'],
                        },
                    ],
                },
            ] as ComparisonGroup[];
            const originalGroups = JSON.stringify(groups);
            Object.defineProperty(store, 'samples', {
                value: remoteData(() =>
                    Promise.resolve([
                        {
                            studyId: 'physical-study',
                            sampleId: 'sample-one',
                            patientId: 'patient-one',
                        },
                        {
                            studyId: 'physical-study',
                            sampleId: 'sample-two',
                            patientId: 'patient-two',
                        },
                    ] as Sample[])
                ),
            });
            const appStore = { isLoggedIn: true } as AppStore;
            const urlWrapper = store.urlWrapper;
            const tabs = [
                'showSurvivalTab',
                'showMRNATab',
                'showProteinTab',
                'showMethylationTab',
                'showGenericAssayTab',
                'showGenericAssayBinaryTab',
                'showAlterationsTab',
                'showMutationsTab',
            ] as const;
            for (const tab of tabs) {
                jest.spyOn(
                    ResultsViewComparisonStore.prototype,
                    tab,
                    'get'
                ).mockReturnValue(false);
            }
            const comparison = new ResultsViewComparisonStore(
                appStore,
                urlWrapper,
                store
            );
            comparisonStores.push(comparison);
            Object.defineProperty(comparison, '_originalGroups', {
                value: remoteData(() => Promise.resolve(groups)),
            });
            disposers.push(
                autorun(() => {
                    comparison.origin.status;
                    comparison._originalGroups.status;
                    comparison.patientToSamplesSet.status;
                })
            );
            await when(
                () =>
                    comparison.origin.isComplete &&
                    comparison._originalGroups.isComplete &&
                    comparison.patientToSamplesSet.isComplete,
                { timeout: 5000 }
            );
            const saveGroup = jest
                .spyOn(comparisonClient, 'addGroup')
                .mockResolvedValue({ id: 'saved-group' });
            const saveSession = jest
                .spyOn(comparisonClient, 'addComparisonSession')
                .mockResolvedValue({ id: 'new-session' });
            let submission!: Promise<void>;
            const component = new CreateGroupFromOverlap({
                store: comparison,
                includedRegions: [['first', 'second']],
                allGroupsInPlot: ['first', 'second'],
                caseType,
                width: 500,
                submitGroup: (group, saveToUser) => {
                    submission = comparison.addGroup(group, saveToUser);
                },
            });
            component.inputGroupName = 'Saved overlap';
            ((component as unknown) as { submit(): void }).submit();
            await submission;
            const saved = saveGroup.mock.calls[0][0];
            expect(saved.origin).toEqual(['virtual-study']);
            expect(saved.studies).toEqual([
                { id: 'physical-study', samples: ['sample-two'] },
            ]);
            expect(JSON.stringify(groups)).toBe(originalGroups);
            expect(session.groups).toEqual([]);
            expect(saveSession.mock.calls[0][0]).toEqual({
                id: '',
                origin: ['virtual-study'],
                groups: [saved],
            });
            const reloadGroups = jest
                .spyOn(comparisonClient, 'getGroupsForStudies')
                .mockImplementation(async ids =>
                    ids.join(',') === saved.origin.join(',')
                        ? [{ id: 'saved-group', data: saved }]
                        : []
                );
            disposers.push(
                autorun(() => store.savedComparisonGroupsForStudies.status)
            );
            await when(() => store.savedComparisonGroupsForStudies.isComplete, {
                timeout: 5000,
            });
            expect(reloadGroups).toHaveBeenCalledWith(['virtual-study']);
            expect(store.savedComparisonGroupsForStudies.result).toEqual([
                { id: 'saved-group', data: saved },
            ]);
        }
    );
});
