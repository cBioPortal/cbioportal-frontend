import { computed, makeObservable, observable } from 'mobx';
import { StudyViewPageStore } from 'pages/studyView/StudyViewPageStore';
import MobxPromise from 'mobxpromise';
import {
    ClinicalDataBySampleId,
    getClinicalDataByStudyViewFilter,
    isFirstPage,
    isLastPage,
    Page,
} from 'pages/studyView/StudyViewUtils';
import { remoteData } from 'cbioportal-frontend-commons';
import {
    PageDirection,
    TablePaginationParams,
} from 'shared/components/lazyMobXTable/TablePaginationParams';
import _ from 'lodash';
import { TablePaginationStore } from 'shared/components/lazyMobXTable/TablePaginationStore';

export type ClinicalTableItem = { [key: string]: string };

export class ClinicalTablePaginationStore
    implements TablePaginationStore<ClinicalTableItem> {
    @observable public direction: PageDirection = 'ASC';
    @observable public sortParam: string | undefined;
    @observable public pageNumber: number;
    @observable public pageSize: number;
    @observable public moreItemsPerPage: number | undefined;
    @observable public searchTerm: string = '';

    constructor(private store: StudyViewPageStore) {
        makeObservable(this);
    }

    @computed get pageItems() {
        return this.getDataForClinicalDataTab;
    }

    @computed get totalItems() {
        return this.getSamplePageForClinicalDataTab.result?.totalItems || 0;
    }

    @computed get isFirst() {
        return this.getSamplePageForClinicalDataTab.result?.isFirst || false;
    }

    @computed get isLast() {
        return this.getSamplePageForClinicalDataTab.result?.isLast || false;
    }

    private prevPage: Page<ClinicalDataBySampleId> | undefined = undefined;

    private readonly getSamplePageForClinicalDataTab: MobxPromise<
        Page<ClinicalDataBySampleId> | undefined
    > = remoteData({
        await: () => [
            this.store.clinicalAttributes,
            this.store.selectedSamples,
            this.store.sampleSetByKey,
        ],
        onError: () => {},
        invoke: async () => {
            if (this.store.selectedSamples.result.length === 0) {
                return;
            }
            if (this.pageNumber === undefined || this.pageSize === undefined) {
                return;
            }
            const page = this.moreItemsPerPage
                ? await this.getMore(this.moreItemsPerPage)
                : await this.getPage(this.pageNumber, this.pageSize);
            this.prevPage = page;
            return page;
        },
    });

    private async getMore(
        moreItemsPerPage: number
    ): Promise<Page<ClinicalDataBySampleId>> {
        const fetchedContent: ClinicalDataBySampleId = {};
        const lastItem = this.pageNumber * this.pageSize + moreItemsPerPage;
        let currentPageNumber = this.pageNumber;
        let currentPage = undefined;

        if (this.prevPage && this.prevPage.pageNumber === this.pageNumber) {
            // Keep already fetched items:
            Object.assign(fetchedContent, this.prevPage.content);
            const alreadyFetchedItems = _.toPairs(this.prevPage.content);
            currentPageNumber =
                this.prevPage.pageNumber +
                alreadyFetchedItems.length / this.pageSize;
        }

        while (currentPageNumber * this.pageSize < lastItem) {
            currentPage = await this.getPage(currentPageNumber, this.pageSize);
            Object.assign(fetchedContent, currentPage.content);
            currentPageNumber++;
        }
        return this.toMorePage(fetchedContent, currentPage!);
    }

    private toMorePage(
        fetchedContent: ClinicalDataBySampleId,
        currentPage: Page<ClinicalDataBySampleId>
    ): Page<ClinicalDataBySampleId> {
        return {
            content: fetchedContent,
            pageSize: currentPage.totalItems,
            pageNumber: this.pageNumber,
            totalItems: currentPage.totalItems,
            isFirst: isFirstPage(this.pageNumber),
            isLast: isLastPage(
                this.pageNumber,
                this.pageSize,
                currentPage.totalItems,
                this.moreItemsPerPage
            ),
        } as Page<ClinicalDataBySampleId>;
    }

    private async getPage(
        pageNumber: number,
        pageSize: number
    ): Promise<Page<ClinicalDataBySampleId>> {
        const pageParams = {} as TablePaginationParams;
        pageParams.pageSize = pageSize;
        pageParams.pageNumber = pageNumber;
        if (this.direction && this.sortParam) {
            pageParams.direction = this.direction;
            pageParams.sortParam = this.sortParam;
        }
        if (this.searchTerm) {
            pageParams.searchTerm = this.searchTerm;
        }
        return await getClinicalDataByStudyViewFilter(
            this.store.filters,
            pageParams
        );
    }

    private readonly getDataForClinicalDataTab = remoteData({
        await: () => [
            this.store.clinicalAttributes,
            this.store.selectedSamples,
            this.store.sampleSetByKey,
            this.getSamplePageForClinicalDataTab,
        ],
        onError: () => {},
        invoke: async () => {
            if (!this.getSamplePageForClinicalDataTab.result) {
                return Promise.resolve([]);
            }
            const sampleClinicalDataArray = _.mapValues(
                this.getSamplePageForClinicalDataTab.result.content,
                (attrs, uniqueSampleId) => {
                    const sample = this.store.sampleSetByKey.result![
                        uniqueSampleId
                    ];
                    return {
                        studyId: sample.studyId,
                        patientId: sample.patientId,
                        sampleId: sample.sampleId,
                        ...attrs,
                    };
                }
            );

            return _.values(sampleClinicalDataArray);
        },
        default: [],
    });
}
