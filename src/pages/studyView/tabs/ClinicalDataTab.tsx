import * as React from 'react';
import {
    Column,
    default as LazyMobXTable,
    SortDirection,
} from 'shared/components/lazyMobXTable/LazyMobXTable';
import { observer } from 'mobx-react';
import _ from 'lodash';
import { getPatientViewUrl, getSampleViewUrl } from 'shared/api/urls';
import {
    chartMetaComparator,
    getClinicalAttributeOverlay,
    getUniqueKey,
    ChartMeta,
    SpecialChartsUniqueKeyEnum,
    DataType,
    getAllClinicalDataByStudyViewFilter,
} from '../StudyViewUtils';
import LoadingIndicator from 'shared/components/loadingIndicator/LoadingIndicator';
import { StudyViewPageStore } from 'pages/studyView/StudyViewPageStore';
import {
    DownloadControlOption,
    isUrl,
    remoteData,
} from 'cbioportal-frontend-commons';
import { Else, If, Then } from 'react-if';
import { IProgressIndicatorItem } from '../../../shared/components/progressIndicator/ProgressIndicator';
import autobind from 'autobind-decorator';
import { WindowWidthBox } from '../../../shared/components/WindowWidthBox/WindowWidthBox';
import { getServerConfig } from 'config/config';
import { StudyViewPageTabKeyEnum } from '../StudyViewPageTabs';
import {
    computed,
    IReactionDisposer,
    makeObservable,
    observable,
    reaction,
    runInAction,
} from 'mobx';
import { Sample, StudyViewFilter } from 'cbioportal-ts-api-client';
import { ClinicalDataPageCache } from './ClinicalDataPageCache';

export interface IClinicalDataTabTable {
    store: StudyViewPageStore;
}

class ClinicalDataTabTableComponent extends LazyMobXTable<{
    [id: string]: string;
}> {}

export const CLINICAL_DATA_PAGE_SIZE = 20;
export const CLINICAL_DATA_PAGE_CACHE_SIZE = 3;
const CLINICAL_DATA_DOWNLOAD_PAGE_SIZE = 500;

type ClinicalDataTabRow = { [id: string]: string };

export type ClinicalDataTabPage = {
    totalItems: number;
    data: ClinicalDataTabRow[];
};

export function getClinicalDataLastPage(
    totalItems: number,
    pageSize: number
): number {
    return Math.max(0, Math.ceil(totalItems / pageSize) - 1);
}

export function getClinicalDataPageRange(
    pageNumber: number,
    pageSize: number,
    totalItems: number,
    rowCount: number
): { first: number; last: number } {
    if (totalItems === 0 || rowCount === 0) {
        return { first: 0, last: 0 };
    }

    const first = pageNumber * pageSize + 1;
    return {
        first,
        last: Math.min(totalItems, first + rowCount - 1),
    };
}

type SortCriteria = {
    field: string | undefined;
    direction: SortDirection | undefined;
};

export async function fetchClinicalDataForStudyViewClinicalDataTab(
    filters: StudyViewFilter,
    sampleSetByKey: { [sampleId: string]: Sample },
    searchTerm: string | undefined,
    sortAttributeId: string | undefined,
    sortDirection: 'asc' | 'desc' | undefined,
    pageSize: number,
    pageNumber: number
): Promise<ClinicalDataTabPage> {
    let sampleClinicalDataResponse = await getAllClinicalDataByStudyViewFilter(
        filters,
        searchTerm,
        sortAttributeId,
        sortDirection,
        pageSize,
        pageNumber
    );

    const aggregatedSampleClinicalData = _.mapValues(
        sampleClinicalDataResponse.data,
        (attrs, uniqueSampleId) => {
            const sample = sampleSetByKey[uniqueSampleId];
            const sampleData = {
                studyId: sample.studyId,
                patientId: sample.patientId,
                sampleId: sample.sampleId,
            } as { [attributeId: string]: string };
            attrs.forEach(
                attr =>
                    (sampleData[attr['clinicalAttributeId']] = attr['value'])
            );
            return sampleData;
        }
    );

    return {
        totalItems: sampleClinicalDataResponse.totalItems,
        data: _.values(aggregatedSampleClinicalData),
    };
}

@observer
export class ClinicalDataTab extends React.Component<
    IClinicalDataTabTable,
    {}
> {
    @observable clinicalDataPage = 0;

    private readonly clinicalDataPageCache = new ClinicalDataPageCache<
        ClinicalDataTabPage
    >(CLINICAL_DATA_PAGE_CACHE_SIZE);

    private readonly clinicalDataQueryReaction: IReactionDisposer;

    constructor(props: IClinicalDataTabTable) {
        super(props);
        makeObservable(this);

        this.clinicalDataQueryReaction = reaction(
            () => ({
                filters: this.props.store.filters,
                sampleSetByKey: this.props.store.sampleSetByKey.result,
                searchTerm: this.clinicalDataTabSearchTerm,
                sortAttributeId: this.clinicalDataSortAttributeId,
                sortDirection: this.clinicalDataSortDirection,
            }),
            () => {
                runInAction(() => {
                    this.clinicalDataPage = 0;
                    this.clinicalDataPageCache.clear();
                });
            }
        );
    }

    componentWillUnmount() {
        this.clinicalDataQueryReaction();
    }

    getDefaultColumnConfig(
        key: string,
        columnName: string,
        isNumber?: boolean
    ) {
        return {
            name: columnName || '',
            headerRender: (data: string) => (
                <span data-test={data}>{data}</span>
            ),
            render: (data: { [id: string]: string }) => {
                const value = data[key];

                if (!value) {
                    return (
                        <span
                            style={{ color: '#999' }}
                            title="No data available"
                            data-test="missing-clinical-data"
                        >
                            —
                        </span>
                    );
                }

                if (isUrl(value)) {
                    return (
                        <a href={value} target="_blank" rel="noreferrer">
                            {value}
                        </a>
                    );
                }

                return <span data-test={value}>{value}</span>;
            },
            download: (data: { [id: string]: string }) => data[key] || '',
            sortBy: (data: { [id: string]: any }) => {
                if (data[key]) {
                    if (isNumber) {
                        return parseFloat(data[key]);
                    } else {
                        return data[key];
                    }
                }
                return null;
            },
            filter: (
                data: { [id: string]: string },
                filterString: string,
                filterStringUpper: string
            ) => (data[key] || '').toUpperCase().includes(filterStringUpper),
        };
    }

    @observable clinicalDataTabSearchTerm: string | undefined = undefined;

    @observable clinicalDataSortCriteria: SortCriteria = {
        field: undefined,
        direction: undefined,
    };

    @computed
    get clinicalDataSortAttributeId(): string | undefined {
        switch (this.clinicalDataSortCriteria?.field) {
            // these first two are special cases where we are not filtering
            // by an attribute
            case 'Patient ID':
                return 'patientId';
            case 'Sample ID':
                return 'sampleId';
            default:
                return this.clinicalDataSortCriteria?.field
                    ? this.props.store
                          .clinicalAttributeDisplayNameToClinicalAttribute
                          .result![this.clinicalDataSortCriteria.field][
                          'clinicalAttributeId'
                      ]
                    : undefined;
        }
    }

    @computed
    get clinicalDataSortDirection(): 'asc' | 'desc' | undefined {
        return this.clinicalDataSortCriteria?.direction;
    }

    @autobind
    private setClinicalDataPage(pageNumber: number): void {
        this.clinicalDataPage = Math.max(
            0,
            Math.min(pageNumber, this.clinicalDataLastPage)
        );
    }

    @computed
    private get clinicalDataLastPage(): number {
        return getClinicalDataLastPage(
            this.getDataForClinicalDataTab.result?.totalItems || 0,
            CLINICAL_DATA_PAGE_SIZE
        );
    }

    readonly getDataForClinicalDataTab = remoteData({
        await: () => [
            this.props.store.clinicalAttributes,
            this.props.store.selectedSamples,
            this.props.store.sampleSetByKey,
            this.props.store.clinicalAttributeDisplayNameToClinicalAttribute,
        ],
        onError: () => {},
        invoke: async () => {
            if (this.props.store.selectedSamples.result.length === 0) {
                return Promise.resolve({ totalItems: 0, data: [] });
            }

            const pageNumber = this.clinicalDataPage;
            const cacheVersion = this.clinicalDataPageCache.version;
            const cachedPage = this.clinicalDataPageCache.get(pageNumber);
            if (cachedPage) {
                return Promise.resolve(cachedPage);
            }

            const sampleClinicalData = await fetchClinicalDataForStudyViewClinicalDataTab(
                this.props.store.filters,
                this.props.store.sampleSetByKey.result!,
                this.clinicalDataTabSearchTerm,
                this.clinicalDataSortAttributeId,
                this.clinicalDataSortDirection,
                CLINICAL_DATA_PAGE_SIZE,
                pageNumber
            );

            if (cacheVersion === this.clinicalDataPageCache.version) {
                this.clinicalDataPageCache.set(pageNumber, sampleClinicalData);
            }

            return Promise.resolve(sampleClinicalData);
        },
        onResult: sampleClinicalData => {
            if (!sampleClinicalData) {
                return;
            }

            const lastPage = getClinicalDataLastPage(
                sampleClinicalData.totalItems,
                CLINICAL_DATA_PAGE_SIZE
            );
            if (this.clinicalDataPage > lastPage) {
                runInAction(() => {
                    this.clinicalDataPage = lastPage;
                });
            }
        },
    });

    // this problem is that the visible attributes are not yet populated.

    readonly columns = remoteData({
        invoke: async () => {
            let defaultColumns: Column<{ [id: string]: string }>[] = [
                {
                    ...this.getDefaultColumnConfig('patientId', 'Patient ID'),
                    render: (data: { [id: string]: string }) => {
                        return (
                            <a
                                href={getPatientViewUrl(
                                    data.studyId,
                                    data.patientId
                                )}
                                target="_blank"
                            >
                                {data.patientId}
                            </a>
                        );
                    },
                },
                {
                    ...this.getDefaultColumnConfig('sampleId', 'Sample ID'),
                    render: (data: { [id: string]: string }) => {
                        return (
                            <a
                                href={getSampleViewUrl(
                                    data.studyId,
                                    data.sampleId
                                )}
                                target="_blank"
                            >
                                {data.sampleId}
                            </a>
                        );
                    },
                },
            ];

            if (
                _.find(
                    this.props.store.visibleAttributesForClinicalData,
                    chartMeta =>
                        chartMeta.uniqueKey ===
                        SpecialChartsUniqueKeyEnum.CANCER_STUDIES
                ) !== undefined
            ) {
                defaultColumns.push({
                    ...this.getDefaultColumnConfig('studyId', 'Cancer Study'),
                });
            }
            return _.reduce(
                this.props.store.visibleAttributesForClinicalData.sort(
                    chartMetaComparator
                ),
                (
                    acc: Column<{ [id: string]: string }>[],
                    chartMeta: ChartMeta,
                    index: number
                ) => {
                    if (chartMeta.clinicalAttribute !== undefined) {
                        acc.push({
                            ...this.getDefaultColumnConfig(
                                getUniqueKey(chartMeta.clinicalAttribute),
                                chartMeta.clinicalAttribute.displayName,
                                chartMeta.clinicalAttribute.datatype ===
                                    DataType.NUMBER
                            ),
                            tooltip: getClinicalAttributeOverlay(
                                chartMeta.clinicalAttribute.displayName,
                                chartMeta.description
                                    ? chartMeta.description
                                    : '',
                                chartMeta.clinicalAttribute
                                    ? chartMeta.clinicalAttribute
                                          .clinicalAttributeId
                                    : undefined
                            ),
                        });
                    }
                    return acc;
                },
                defaultColumns
            );
        },
        default: [],
    });

    @autobind
    getProgressItems(elapsedSecs: number): IProgressIndicatorItem[] {
        return [
            {
                label:
                    'Loading clinical data' +
                    (elapsedSecs > 2 ? ' - this can take several seconds' : ''),
                promises: [this.getDataForClinicalDataTab],
            },
        ];
    }

    public render() {
        // not that the columns which are showing in the table
        // are dependent on visible attributes.
        // for this reason we need to wait for visible attributes to be populated
        // this simplest way to await this is just no avoid rendering the table when there are
        // no visibleAttributes
        const clinicalDataResult = this.getDataForClinicalDataTab.result;
        const clinicalDataTotalItems = clinicalDataResult?.totalItems || 0;
        const clinicalDataPageRange = getClinicalDataPageRange(
            this.clinicalDataPage,
            CLINICAL_DATA_PAGE_SIZE,
            clinicalDataTotalItems,
            clinicalDataResult?.data.length || 0
        );
        const clinicalDataPageIsPending = this.getDataForClinicalDataTab
            .isPending;

        return (
            <span data-test="clinical-data-tab-content">
                <WindowWidthBox offset={60}>
                    <If
                        condition={
                            this.props.store.clinicalAttributeProduct
                                .isPending ||
                            this.props.store.maxSamplesForClinicalTab
                                .isPending ||
                            this.props.store.selectedSamples.isPending ||
                            this.props.store.visibleAttributes.length < 1
                        }
                    >
                        <Then>
                            <LoadingIndicator
                                isLoading={true}
                                size={'big'}
                                center={true}
                            />
                        </Then>
                        <Else>
                            <If
                                condition={
                                    this.props.store.clinicalAttributeProduct
                                        .result >
                                    getServerConfig()
                                        .clinical_attribute_product_limit
                                }
                            >
                                <Then>
                                    Too many samples selected. The maximum table
                                    length is{' '}
                                    <b>
                                        {
                                            this.props.store
                                                .maxSamplesForClinicalTab.result
                                        }
                                    </b>{' '}
                                    rows, but your current selection would be{' '}
                                    <b>
                                        {
                                            this.props.store.selectedSamples
                                                .result.length
                                        }
                                    </b>{' '}
                                    rows. Select fewer samples on the{' '}
                                    <a
                                        onClick={() =>
                                            this.props.store.handleTabChange(
                                                StudyViewPageTabKeyEnum.SUMMARY
                                            )
                                        }
                                    >
                                        Summary tab
                                    </a>
                                    .{' '}
                                </Then>
                                <Else>
                                    <ClinicalDataTabTableComponent
                                        initialItemsPerPage={20}
                                        tableMaxHeight="calc(100vh - 220px)"
                                        paginationProps={{
                                            currentPage: this.clinicalDataPage,
                                            totalItems: clinicalDataTotalItems,
                                            itemsPerPage: CLINICAL_DATA_PAGE_SIZE,
                                            itemsPerPageOptions: [
                                                CLINICAL_DATA_PAGE_SIZE,
                                            ],
                                            showAllOption: false,
                                            showItemsPerPageSelector: false,
                                            showMoreButton: false,
                                            showFirstPage: true,
                                            showLastPage: true,
                                            firstPageDisabled:
                                                clinicalDataPageIsPending ||
                                                this.clinicalDataPage === 0,
                                            previousPageDisabled:
                                                clinicalDataPageIsPending ||
                                                this.clinicalDataPage === 0,
                                            nextPageDisabled:
                                                clinicalDataPageIsPending ||
                                                this.clinicalDataPage >=
                                                    this.clinicalDataLastPage,
                                            lastPageDisabled:
                                                clinicalDataPageIsPending ||
                                                this.clinicalDataPage >=
                                                    this.clinicalDataLastPage,
                                            onFirstPageClick: () =>
                                                this.setClinicalDataPage(0),
                                            onPreviousPageClick: () =>
                                                this.setClinicalDataPage(
                                                    this.clinicalDataPage - 1
                                                ),
                                            onNextPageClick: () =>
                                                this.setClinicalDataPage(
                                                    this.clinicalDataPage + 1
                                                ),
                                            onLastPageClick: () =>
                                                this.setClinicalDataPage(
                                                    this.clinicalDataLastPage
                                                ),
                                            textBetweenButtons: `Showing ${clinicalDataPageRange.first}-${clinicalDataPageRange.last} of ${clinicalDataTotalItems}`,
                                        }}
                                        headerComponent={
                                            <div className={'positionAbsolute'}>
                                                <strong>
                                                    {
                                                        this
                                                            .getDataForClinicalDataTab
                                                            .result?.totalItems
                                                    }{' '}
                                                    results
                                                </strong>
                                            </div>
                                        }
                                        showCopyDownload={
                                            getServerConfig()
                                                .skin_hide_download_controls ===
                                            DownloadControlOption.SHOW_ALL
                                        }
                                        showCountHeader={false}
                                        showColumnVisibility={false}
                                        onFilterTextChange={searchTerm =>
                                            (this.clinicalDataTabSearchTerm = searchTerm)
                                        }
                                        onSortDirectionChange={(
                                            field,
                                            sortDirection
                                        ) => {
                                            this.clinicalDataSortCriteria = {
                                                field: field,
                                                direction: sortDirection,
                                            };
                                        }}
                                        data={
                                            this.getDataForClinicalDataTab
                                                .result?.data || []
                                        }
                                        showLoading={
                                            this.getDataForClinicalDataTab
                                                .isPending ||
                                            this.columns.isPending
                                        }
                                        loadingComponent={
                                            <LoadingIndicator
                                                isLoading={true}
                                                size={'big'}
                                                center={true}
                                            />
                                        }
                                        columns={this.columns.result}
                                        copyDownloadProps={{
                                            showCopy: false,
                                            downloadFilename: this.props.store
                                                .clinicalDataDownloadFilename,
                                        }}
                                        initialFilterString={
                                            this.clinicalDataTabSearchTerm
                                        }
                                        initialSortDirection={
                                            this.clinicalDataSortCriteria
                                                ?.direction
                                        }
                                        initialSortColumn={
                                            this.clinicalDataSortCriteria?.field
                                        }
                                        downloadDataFetcher={() => {
                                            return fetchClinicalDataForStudyViewClinicalDataTab(
                                                this.props.store.filters,
                                                this.props.store.sampleSetByKey
                                                    .result!,
                                                this.clinicalDataTabSearchTerm,
                                                this
                                                    .clinicalDataSortAttributeId,
                                                this.clinicalDataSortDirection,
                                                CLINICAL_DATA_DOWNLOAD_PAGE_SIZE,
                                                0
                                            ).then(data => {
                                                return data.data;
                                            });
                                        }}
                                    />
                                </Else>
                            </If>
                        </Else>
                    </If>
                </WindowWidthBox>
            </span>
        );
    }
}
