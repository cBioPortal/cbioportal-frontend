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
import {
    computed,
    IReactionDisposer,
    makeObservable,
    observable,
    reaction,
    runInAction,
    toJS,
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
export const CLINICAL_DATA_FETCH_SIZE = 500;
export const CLINICAL_DATA_DOWNLOAD_BATCH_SIZE = 25000;
export const CLINICAL_DATA_PAGES_PER_BLOCK =
    CLINICAL_DATA_FETCH_SIZE / CLINICAL_DATA_PAGE_SIZE;
export const CLINICAL_DATA_PAGE_CACHE_SIZE = 3;

type ClinicalDataTabRow = { [id: string]: string };

export type ClinicalDataTabBlock = {
    totalItems: number;
    data: ClinicalDataTabRow[];
    supportsServerPagination: boolean;
};

export type ClinicalDataTabPage = {
    totalItems: number;
    data: ClinicalDataTabRow[];
    supportsServerPagination: boolean;
    availableItems: number;
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

export function getClinicalDataLastPageForResult(
    result: Pick<
        ClinicalDataTabPage,
        'totalItems' | 'supportsServerPagination' | 'availableItems'
    >,
    pageSize: number
): number {
    const accessibleItems = result.supportsServerPagination
        ? result.totalItems
        : Math.min(result.totalItems, result.availableItems);
    return getClinicalDataLastPage(accessibleItems, pageSize);
}

export function shouldShowClinicalDataResultLimit(
    result: ClinicalDataTabPage | undefined,
    pageNumber: number,
    pageSize: number
): boolean {
    return (
        !!result &&
        !result.supportsServerPagination &&
        result.totalItems > CLINICAL_DATA_FETCH_SIZE &&
        pageNumber >= getClinicalDataLastPageForResult(result, pageSize) &&
        result.data.length > 0
    );
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
): Promise<ClinicalDataTabBlock> {
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
    const orderedSampleKeys =
        sampleClinicalDataResponse.orderedSampleKeys ||
        Object.keys(aggregatedSampleClinicalData);

    return {
        totalItems: sampleClinicalDataResponse.totalItems,
        supportsServerPagination:
            sampleClinicalDataResponse.orderedSampleKeys !== undefined,
        data: orderedSampleKeys
            .map(uniqueSampleId => aggregatedSampleClinicalData[uniqueSampleId])
            .filter(
                (sampleData): sampleData is ClinicalDataTabRow => !!sampleData
            ),
    };
}

export function serializeClinicalDataRows(
    rows: ClinicalDataTabRow[],
    columns: Column<ClinicalDataTabRow>[]
): string {
    const downloadableColumns = columns.filter(column => column.download);
    const headers = downloadableColumns.map(column => {
        const headerDownload = (column as Column<ClinicalDataTabRow> & {
            headerDownload?: (name: string) => string;
        }).headerDownload;
        return headerDownload ? headerDownload(column.name) : column.name;
    });
    const lines = [headers.join('\t')];

    rows.forEach(row => {
        lines.push(
            downloadableColumns
                .map(column => {
                    const value = column.download!(row);
                    return Array.isArray(value) ? value.join(',') : value;
                })
                .join('\t')
        );
    });

    return lines.join('\r\n') + '\r\n';
}

export async function fetchClinicalDataForStudyViewClinicalDataTabDownload(
    filters: StudyViewFilter,
    sampleSetByKey: { [sampleId: string]: Sample },
    searchTerm: string | undefined,
    sortAttributeId: string | undefined,
    sortDirection: 'asc' | 'desc' | undefined,
    columns: Column<ClinicalDataTabRow>[]
): Promise<string> {
    const rows: ClinicalDataTabRow[] = [];
    let totalItems = 0;
    let pageNumber = 0;

    do {
        const page = await fetchClinicalDataForStudyViewClinicalDataTab(
            filters,
            sampleSetByKey,
            searchTerm,
            sortAttributeId,
            sortDirection,
            CLINICAL_DATA_DOWNLOAD_BATCH_SIZE,
            pageNumber
        );
        totalItems = page.totalItems;
        rows.push(...page.data);

        if (page.data.length === 0 && rows.length < totalItems) {
            throw new Error(
                'Clinical data download ended before all matching rows were fetched'
            );
        }

        pageNumber += 1;
    } while (rows.length < totalItems);

    return serializeClinicalDataRows(rows.slice(0, totalItems), columns);
}

@observer
export class ClinicalDataTab extends React.Component<
    IClinicalDataTabTable,
    {}
> {
    @observable clinicalDataPage = 0;

    @observable private clinicalDataDisplayedPage = 0;

    @observable private clinicalDataDisplayedResult:
        | ClinicalDataTabPage
        | undefined;

    @observable private clinicalDataFailedPage: number | undefined;

    @observable private clinicalDataRetryCount = 0;

    private readonly clinicalDataPageCache = new ClinicalDataPageCache<
        ClinicalDataTabBlock
    >(CLINICAL_DATA_PAGE_CACHE_SIZE);

    private readonly clinicalDataQueryReaction: IReactionDisposer;

    constructor(props: IClinicalDataTabTable) {
        super(props);
        makeObservable(this);

        this.clinicalDataQueryReaction = reaction(
            () => [
                this.clinicalDataQueryKey,
                this.props.store.sampleSetByKey.result,
            ],
            () => {
                runInAction(() => {
                    this.clinicalDataPage = 0;
                    this.clinicalDataDisplayedPage = 0;
                    this.clinicalDataDisplayedResult = undefined;
                    this.clinicalDataFailedPage = undefined;
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

    @computed
    private get clinicalDataQueryKey(): string {
        return JSON.stringify({
            filters: toJS(this.props.store.filters),
            sampleKeys: Object.keys(
                this.props.store.sampleSetByKey.result || {}
            ),
            searchTerm: this.clinicalDataTabSearchTerm || '',
            sortAttributeId: this.clinicalDataSortAttributeId || '',
            sortDirection: this.clinicalDataSortDirection || '',
        });
    }

    @autobind
    private setClinicalDataPage(pageNumber: number): void {
        this.clinicalDataPage = Math.max(
            0,
            Math.min(pageNumber, this.clinicalDataLastPage)
        );
    }

    @autobind
    private retryClinicalDataPage(): void {
        runInAction(() => {
            this.clinicalDataPage =
                this.clinicalDataFailedPage ?? this.clinicalDataDisplayedPage;
            this.clinicalDataRetryCount += 1;
        });
    }

    @computed
    private get clinicalDataLastPage(): number {
        return this.clinicalDataDisplayedResult
            ? getClinicalDataLastPageForResult(
                  this.clinicalDataDisplayedResult,
                  CLINICAL_DATA_PAGE_SIZE
              )
            : 0;
    }

    readonly getDataForClinicalDataTab = remoteData({
        await: () => [
            this.props.store.clinicalAttributes,
            this.props.store.selectedSamples,
            this.props.store.sampleSetByKey,
            this.props.store.clinicalAttributeDisplayNameToClinicalAttribute,
        ],
        onError: () => {
            const failedPage = this.clinicalDataPage;
            runInAction(() => {
                this.clinicalDataFailedPage = failedPage;
            });
        },
        invoke: async () => {
            // Reading this observable makes Retry re-run the current request,
            // including when the failed page is already selected.
            this.clinicalDataRetryCount;

            if (this.props.store.selectedSamples.result.length === 0) {
                return Promise.resolve({
                    totalItems: 0,
                    supportsServerPagination: true,
                    availableItems: 0,
                    data: [],
                });
            }

            const pageNumber = this.clinicalDataPage;
            const queryKey = this.clinicalDataQueryKey;
            const blockNumber = Math.floor(
                pageNumber / CLINICAL_DATA_PAGES_PER_BLOCK
            );
            const cachedBlock = this.clinicalDataPageCache.get(
                queryKey,
                blockNumber
            );
            const cacheVersion = this.clinicalDataPageCache.version;
            if (cachedBlock) {
                const pageOffset =
                    (pageNumber % CLINICAL_DATA_PAGES_PER_BLOCK) *
                    CLINICAL_DATA_PAGE_SIZE;
                return Promise.resolve({
                    totalItems: cachedBlock.totalItems,
                    supportsServerPagination:
                        cachedBlock.supportsServerPagination,
                    availableItems: cachedBlock.data.length,
                    data: cachedBlock.data.slice(
                        pageOffset,
                        pageOffset + CLINICAL_DATA_PAGE_SIZE
                    ),
                });
            }

            const sampleClinicalData = await fetchClinicalDataForStudyViewClinicalDataTab(
                this.props.store.filters,
                this.props.store.sampleSetByKey.result!,
                this.clinicalDataTabSearchTerm,
                this.clinicalDataSortAttributeId,
                this.clinicalDataSortDirection,
                CLINICAL_DATA_FETCH_SIZE,
                blockNumber
            );

            if (cacheVersion === this.clinicalDataPageCache.version) {
                this.clinicalDataPageCache.set(
                    queryKey,
                    blockNumber,
                    sampleClinicalData
                );
            }

            const pageOffset =
                (pageNumber % CLINICAL_DATA_PAGES_PER_BLOCK) *
                CLINICAL_DATA_PAGE_SIZE;
            return Promise.resolve({
                totalItems: sampleClinicalData.totalItems,
                supportsServerPagination:
                    sampleClinicalData.supportsServerPagination,
                availableItems: sampleClinicalData.data.length,
                data: sampleClinicalData.data.slice(
                    pageOffset,
                    pageOffset + CLINICAL_DATA_PAGE_SIZE
                ),
            });
        },
        onResult: sampleClinicalData => {
            if (!sampleClinicalData) {
                return;
            }

            const lastPage = getClinicalDataLastPageForResult(
                sampleClinicalData,
                CLINICAL_DATA_PAGE_SIZE
            );
            if (this.clinicalDataPage > lastPage) {
                runInAction(() => {
                    this.clinicalDataPage = lastPage;
                });
                return;
            }

            runInAction(() => {
                this.clinicalDataDisplayedPage = this.clinicalDataPage;
                this.clinicalDataDisplayedResult = sampleClinicalData;
                this.clinicalDataFailedPage = undefined;
            });
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
        const clinicalDataResult = this.clinicalDataDisplayedResult;
        const clinicalDataTotalItems = clinicalDataResult?.totalItems || 0;
        const clinicalDataIsResultLimited = shouldShowClinicalDataResultLimit(
            clinicalDataResult,
            this.clinicalDataDisplayedPage,
            CLINICAL_DATA_PAGE_SIZE
        );
        const clinicalDataPageRange = getClinicalDataPageRange(
            this.clinicalDataDisplayedPage,
            CLINICAL_DATA_PAGE_SIZE,
            clinicalDataTotalItems,
            clinicalDataResult?.data.length || 0
        );
        const clinicalDataPageIsPending = this.getDataForClinicalDataTab
            .isPending;
        const clinicalDataHasError = this.getDataForClinicalDataTab.isError;

        return (
            <span data-test="clinical-data-tab-content">
                <WindowWidthBox offset={60}>
                    {/*
                     * Clinical data is fetched in bounded 500-row blocks, so
                     * the total selected-sample/attribute product must not
                     * prevent the table from rendering.
                     */}
                    <If
                        condition={
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
                            <React.Fragment>
                                {clinicalDataHasError && (
                                    <div
                                        className="alert alert-danger"
                                        role="alert"
                                        data-test="clinical-data-load-error"
                                    >
                                        Unable to load clinical data.{' '}
                                        <button
                                            type="button"
                                            className="btn btn-link"
                                            onClick={this.retryClinicalDataPage}
                                            disabled={clinicalDataPageIsPending}
                                        >
                                            Retry
                                        </button>
                                    </div>
                                )}
                                <ClinicalDataTabTableComponent
                                    initialItemsPerPage={20}
                                    tableMaxHeight="calc(100vh - 220px)"
                                    paginationProps={{
                                        currentPage: this
                                            .clinicalDataDisplayedPage,
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
                                            this.clinicalDataDisplayedPage ===
                                                0,
                                        previousPageDisabled:
                                            clinicalDataPageIsPending ||
                                            this.clinicalDataDisplayedPage ===
                                                0,
                                        nextPageDisabled:
                                            clinicalDataPageIsPending ||
                                            this.clinicalDataDisplayedPage >=
                                                this.clinicalDataLastPage,
                                        lastPageDisabled:
                                            clinicalDataPageIsPending ||
                                            this.clinicalDataDisplayedPage >=
                                                this.clinicalDataLastPage,
                                        onFirstPageClick: () =>
                                            this.setClinicalDataPage(0),
                                        onPreviousPageClick: () =>
                                            this.setClinicalDataPage(
                                                this.clinicalDataDisplayedPage -
                                                    1
                                            ),
                                        onNextPageClick: () =>
                                            this.setClinicalDataPage(
                                                this.clinicalDataDisplayedPage +
                                                    1
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
                                                {clinicalDataTotalItems} results
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
                                    isResultLimited={
                                        clinicalDataIsResultLimited
                                    }
                                    resultCountOverride={clinicalDataTotalItems}
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
                                    data={clinicalDataResult?.data || []}
                                    showLoading={
                                        this.getDataForClinicalDataTab
                                            .isPending || this.columns.isPending
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
                                        this.clinicalDataSortCriteria?.direction
                                    }
                                    initialSortColumn={
                                        this.clinicalDataSortCriteria?.field
                                    }
                                    downloadDataFetcher={() => {
                                        return fetchClinicalDataForStudyViewClinicalDataTabDownload(
                                            this.props.store.filters,
                                            this.props.store.sampleSetByKey
                                                .result!,
                                            this.clinicalDataTabSearchTerm,
                                            this.clinicalDataSortAttributeId,
                                            this.clinicalDataSortDirection,
                                            this.columns.result
                                        );
                                    }}
                                />
                            </React.Fragment>
                        </Else>
                    </If>
                </WindowWidthBox>
            </span>
        );
    }
}
