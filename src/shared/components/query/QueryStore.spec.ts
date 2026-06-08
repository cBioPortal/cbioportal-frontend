import { assert, expect } from 'chai';
import {
    QueryStore,
    CUSTOM_CASE_LIST_ID,
    CancerStudyQueryUrlParams,
} from './QueryStore';
import Sinon from 'sinon';
import sessionServiceClient from 'shared/api//sessionServiceInstance';
import client from '../../api/cbioportalClientInstance';
import internalClient from '../../api/cbioportalInternalClientInstance';
import _ from 'lodash';
import {
    VirtualStudy,
    VirtualStudyData,
} from 'shared/api/session-service/sessionServiceModels';

describe('QueryStore', () => {
    describe('#setParamsFromLocalStorage', () => {
        let store: QueryStore;
        let getUserVirtualStudiesStub: sinon.SinonStub;
        let deleteVirtualStudyStub: sinon.SinonStub;
        let addVirtualStudyStub: sinon.SinonStub;
        let initializeStub: sinon.SinonStub;

        beforeEach(() => {
            initializeStub = Sinon.stub(
                QueryStore.prototype,
                'initialize'
            ).callsFake(function() {});

            store = new QueryStore();
        });

        it('given custom case list, sets store and flags appropriately', () => {
            assert.isFalse(store.initiallySelected.profileIds);
            assert.isFalse(store.initiallySelected.sampleListId);
            store.setParamsFromLocalStorage({
                case_set_id: '-1',
                case_ids: 'sample1:study+sample2:study',
            } as Partial<CancerStudyQueryUrlParams>);
            assert.equal(store.caseIds, 'sample1:study\nsample2:study');
            assert.isTrue(store.initiallySelected.sampleListId);
            assert.equal(store.selectedSampleListId, '-1');
        });
    });

    describe.skip('Virtual Studies section on query page', () => {
        let store_vs: QueryStore;
        const virtualStudies: VirtualStudy[] = [
            {
                id: 'study1',
                data: {
                    name: 'Test Study',
                    description: 'Test Study',
                    studies: [
                        {
                            id: 'test_study',
                            samples: ['sample-01', 'sample-02', 'sample-03'],
                        },
                    ],
                    studyViewFilter: {},
                    origin: ['test_study'],
                } as VirtualStudyData,
            },
        ];
        let getUserVirtualStudiesStub: sinon.SinonStub;
        let deleteVirtualStudyStub: sinon.SinonStub;
        let addVirtualStudyStub: sinon.SinonStub;

        beforeAll(() => {
            getUserVirtualStudiesStub = Sinon.stub(
                sessionServiceClient,
                'getUserVirtualStudies'
            ).callsFake(function fakeFn() {
                return new Promise((resolve, reject) => {
                    resolve(virtualStudies);
                });
            });
            deleteVirtualStudyStub = Sinon.stub(
                sessionServiceClient,
                'deleteVirtualStudy'
            ).callsFake(function fakeFn(id: string) {
                return new Promise<void>((resolve, reject) => {
                    resolve();
                });
            });
            addVirtualStudyStub = Sinon.stub(
                sessionServiceClient,
                'addVirtualStudy'
            ).callsFake(function fakeFn(id: string) {
                return new Promise<void>((resolve, reject) => {
                    resolve();
                });
            });

            store_vs = new QueryStore();
        });

        afterAll(() => {
            getUserVirtualStudiesStub.restore();
            deleteVirtualStudyStub.restore();
            addVirtualStudyStub.restore();
        });

        it('should show all user virtual studies', () => {
            assert.isTrue(getUserVirtualStudiesStub.calledOnce);
        });

        it('should be able to delete a virtual study', () => {
            store_vs.deleteVirtualStudy('study1');
            assert.isTrue(deleteVirtualStudyStub.calledOnce);
        });

        it('should be able to restore back deleted virtual study', () => {
            store_vs.restoreVirtualStudy('study1');
            assert.isTrue(addVirtualStudyStub.calledOnce);
        });
    });

    describe('#resourceDefinitions', () => {
        let initializeStub: sinon.SinonStub;
        let fetchResourceDefinitionsStub: sinon.SinonStub;
        let getAllStudiesStub: sinon.SinonStub;

        beforeEach(() => {
            // Restore any existing initialize stub left by sibling test suites
            if ((QueryStore.prototype.initialize as any).restore) {
                (QueryStore.prototype.initialize as any).restore();
            }
            initializeStub = Sinon.stub(
                QueryStore.prototype,
                'initialize'
            ).callsFake(function() {});
            // Stub getAllStudiesUsingGET so cancerStudies remoteData gets a proper promise
            getAllStudiesStub = Sinon.stub(
                client,
                'getAllStudiesUsingGET'
            ).resolves([]);
            fetchResourceDefinitionsStub = Sinon.stub(
                internalClient,
                'fetchResourceDefinitionsUsingPOST'
            ).resolves([]);
        });

        afterEach(() => {
            initializeStub.restore();
            getAllStudiesStub.restore();
            fetchResourceDefinitionsStub.restore();
        });

        it('resolves to [] without calling API when cancerStudies is empty', async () => {
            const store = new QueryStore();
            // cancerStudies.result defaults to [] when no API call has completed
            const result = await (store.resourceDefinitions as any).invoke();
            assert.deepEqual(result, []);
            assert.isFalse(fetchResourceDefinitionsStub.called);
        });

        it('calls fetchResourceDefinitionsUsingPOST when cancerStudies has studies', async () => {
            const store = new QueryStore();
            // Override cancerStudies with a mock that returns a non-empty result
            (store as any).cancerStudies = {
                result: [{ studyId: 'study1' }],
            };
            await (store.resourceDefinitions as any).invoke();
            assert.isTrue(
                fetchResourceDefinitionsStub.calledWith({
                    studyIds: ['study1'],
                })
            );
        });
    });
});
