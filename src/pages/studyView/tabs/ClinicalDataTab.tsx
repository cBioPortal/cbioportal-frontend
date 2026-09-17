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
import { getClinicalAttributeDisplayName } from 'shared/lib/ClinicalAttributeDisplay';
import { StudyViewPageTabKeyEnum } from '../StudyViewPageTabs';
import { computed, makeObservable, observable } from 'mobx';
import {
    ClinicalAttribute,
    ClinicalData,
    Sample,
    StudyViewFilter,
} from 'cbioportal-ts-api-client';

export interface IClinicalDataTabTable {
    store: StudyViewPageStore;
}

class ClinicalDataTabTableComponent extends LazyMobXTable<{
    [id: string]: string;
}> {}

const CLINICAL_DATA_DOWNLOAD_PAGE_SIZE = 500;

const HIDDEN_CLINICAL_ATTRIBUTE_IDS = new Set([
    'WSI_TIMEPOINT_BIN',
    'WSI_TIMEPOINT_DAYS',
    'WSI_TIMEPOINT_SOURCE',
]);

const WSI_PATIENT_SLIDE_COLUMNS = [
    {
        attributeId: 'WSI_SAMPLE_SLIDE_COUNT',
        displayName: 'WSI Slides per Sample',
        visible: false,
    },
    {
        attributeId: 'WSI_PATIENT_SLIDE_COUNT',
        displayName: 'WSI Slides per Patient',
        visible: true,
    },
    {
        attributeId: 'WSI_SAMPLE_PART_MATCHED_SLIDE_COUNT',
        displayName: 'WSI Slides per Sample, Part-matched',
        visible: false,
    },
    {
        attributeId: 'WSI_SAMPLE_BLOCK_MATCHED_SLIDE_COUNT',
        displayName: 'WSI Slides per Sample, Block-matched',
        visible: false,
    },
    {
        attributeId: 'WSI_PATIENT_PART_MATCHED_SLIDE_COUNT',
        displayName: 'WSI Slides per Patient, Part-matched',
        visible: false,
    },
    {
        attributeId: 'WSI_PATIENT_BLOCK_MATCHED_SLIDE_COUNT',
        displayName: 'WSI Slides per Patient, Block-matched',
        visible: false,
    },
] as const;

const WSI_PATIENT_SLIDE_ATTRIBUTE_IDS = new Set<string>(
    WSI_PATIENT_SLIDE_COLUMNS.map(column => column.attributeId)
);

const WSI_SAMPLE_TO_PATIENT_SLIDE_ATTRIBUTES = [
    ['WSI_SAMPLE_SLIDE_COUNT', 'WSI_PATIENT_SLIDE_COUNT'],
    [
        'WSI_SAMPLE_PART_MATCHED_SLIDE_COUNT',
        'WSI_PATIENT_PART_MATCHED_SLIDE_COUNT',
    ],
    [
        'WSI_SAMPLE_BLOCK_MATCHED_SLIDE_COUNT',
        'WSI_PATIENT_BLOCK_MATCHED_SLIDE_COUNT',
    ],
] as const;

export function addPatientWsiSlideCounts(
    rows: Array<{ [attributeId: string]: string }>
): Array<{ [attributeId: string]: string }> {
    const totalsByPatient = new Map<string, Record<string, number>>();

    rows.forEach(row => {
        const patientId = row.patientId;
        if (!patientId) {
            return;
        }

        const totals = totalsByPatient.get(patientId) || {};
        WSI_SAMPLE_TO_PATIENT_SLIDE_ATTRIBUTES.forEach(
            ([sampleAttributeId, patientAttributeId]) => {
                const sampleCount = Number(row[sampleAttributeId]);
                if (Number.isFinite(sampleCount)) {
                    totals[patientAttributeId] =
                        (totals[patientAttributeId] || 0) + sampleCount;
                }
            }
        );
        totalsByPatient.set(patientId, totals);
    });

    return rows.map(row => {
        const totals = totalsByPatient.get(row.patientId);
        if (!totals) {
            return row;
        }

        return {
            ...row,
            ...Object.fromEntries(
                Object.entries(totals)
                    // Patient-level values are authoritative when supplied by
                    // the importer. Falling back to a page-local sample sum
                    // is useful for older studies, but cannot represent all
                    // samples when the table is paginated.
                    .filter(([attributeId]) => {
                        const directValue = row[attributeId];
                        return (
                            directValue === undefined ||
                            directValue === '' ||
                            !Number.isFinite(Number(directValue))
                        );
                    })
                    .map(([attributeId, value]) => [attributeId, String(value)])
            ),
        };
    });
}

type SortCriteria = {
    field: string | undefined;
    direction: SortDirection | undefined;
};

export function sortClinicalDataRows<T extends object>(
    rows: T[],
    attributeId: string,
    direction: 'asc' | 'desc'
): T[] {
    const multiplier = direction === 'asc' ? 1 : -1;
    return rows.slice().sort((a, b) => {
        const aValue = (a as Record<string, string | undefined>)[attributeId];
        const bValue = (b as Record<string, string | undefined>)[attributeId];
        const aMissing = aValue === undefined || aValue === '';
        const bMissing = bValue === undefined || bValue === '';

        if (aMissing || bMissing) {
            if (aMissing && bMissing) return 0;
            return aMissing ? 1 : -1;
        }

        const aNumber = Number(aValue);
        const bNumber = Number(bValue);
        if (Number.isFinite(aNumber) && Number.isFinite(bNumber)) {
            return multiplier * (aNumber - bNumber);
        }
        return multiplier * aValue.localeCompare(bValue);
    });
}

export async function fetchClinicalDataForStudyViewClinicalDataTab(
    filters: StudyViewFilter,
    sampleSetByKey: { [sampleId: string]: Sample },
    searchTerm: string | undefined,
    sortAttributeId: string | undefined,
    sortDirection: 'asc' | 'desc' | undefined,
    pageSize: number,
    pageNumber: number = 0
) {
    const sampleClinicalDataResponse = await getAllClinicalDataByStudyViewFilter(
        filters,
        searchTerm,
        sortAttributeId || 'sampleId',
        sortDirection || 'asc',
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

    // The response is keyed by sample, so restore the display order after
    // the server has selected the requested page from the entire cohort.
    const data = sortClinicalDataRows(
        addPatientWsiSlideCounts(_.values(aggregatedSampleClinicalData)),
        sortAttributeId || 'sampleId',
        sortDirection || 'asc'
    );
    return {
        totalItems: sampleClinicalDataResponse.totalItems,
        data,
    };
}

@observer
export class ClinicalDataTab extends React.Component<
    IClinicalDataTabTable,
    {}
> {
    constructor(props: IClinicalDataTabTable) {
        super(props);
        makeObservable(this);
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

    @observable clinicalDataPageSize = 20;
    @observable private clinicalDataPage = 0;
    @observable private clinicalDataPageQuery = '';

    @computed
    get clinicalDataQueryKey(): string {
        return JSON.stringify([
            this.props.store.filters,
            this.clinicalDataTabSearchTerm,
            this.clinicalDataSortCriteria,
            this.clinicalDataPageSize,
        ]);
    }

    @computed
    get clinicalDataPageNumber(): number {
        return this.clinicalDataPageQuery === this.clinicalDataQueryKey
            ? this.clinicalDataPage
            : 0;
    }

    @autobind
    setClinicalDataPage(page: number) {
        this.clinicalDataPageQuery = this.clinicalDataQueryKey;
        this.clinicalDataPage = page;
    }

    @computed
    get clinicalDataPaginationProps() {
        const total = this.getDataForClinicalDataTab.result?.totalItems || 0;
        const page = this.clinicalDataPageNumber;
        const size = this.clinicalDataPageSize;
        const lastPage = Math.max(0, Math.ceil(total / size) - 1);
        const pending = this.getDataForClinicalDataTab.isPending;
        return {
            totalItems: total,
            itemsPerPage: size,
            currentPage: page,
            showMoreButton: false,
            showFirstPage: true,
            showLastPage: true,
            showItemsPerPageSelector: true,
            itemsPerPageOptions: [20, 50, 100, 500],
            showAllOption: false,
            textBetweenButtons: `Showing ${
                total ? page * size + 1 : 0
            }-${Math.min((page + 1) * size, total)} of ${total}`,
            firstPageDisabled: pending || page === 0,
            previousPageDisabled: pending || page === 0,
            nextPageDisabled: pending || page >= lastPage,
            lastPageDisabled: pending || page >= lastPage,
            onFirstPageClick: () => this.setClinicalDataPage(0),
            onPreviousPageClick: () => this.setClinicalDataPage(page - 1),
            onNextPageClick: () => this.setClinicalDataPage(page + 1),
            onLastPageClick: () => this.setClinicalDataPage(lastPage),
            onChangeItemsPerPage: (value: number) => {
                this.clinicalDataPageSize = value;
                this.setClinicalDataPage(0);
            },
        };
    }

    @observable clinicalDataSortCriteria: SortCriteria = {
        field: undefined,
        direction: undefined,
    };

    @computed
    get clinicalDataSortClinicalAttribute(): ClinicalAttribute | undefined {
        const field = this.clinicalDataSortCriteria?.field;
        if (!field || field === 'Patient ID' || field === 'Sample ID') {
            return undefined;
        }

        return (
            this.props.store.clinicalAttributeDisplayNameToClinicalAttribute
                .result![field] ||
            this.props.store.visibleAttributesForClinicalData.find(
                chartMeta =>
                    chartMeta.clinicalAttribute &&
                    getClinicalAttributeDisplayName(
                        chartMeta.clinicalAttribute
                    ) === field
            )?.clinicalAttribute
        );
    }

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
                return this.clinicalDataSortClinicalAttribute
                    ?.clinicalAttributeId;
        }
    }

    @computed
    get clinicalDataSortDirection(): 'asc' | 'desc' | undefined {
        return this.clinicalDataSortCriteria?.direction;
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
            const sampleClinicalData = await fetchClinicalDataForStudyViewClinicalDataTab(
                this.props.store.filters,
                this.props.store.sampleSetByKey.result!,
                this.clinicalDataTabSearchTerm,
                this.clinicalDataSortAttributeId,
                this.clinicalDataSortDirection,
                this.clinicalDataPageSize,
                this.clinicalDataPageNumber
            );

            return Promise.resolve(sampleClinicalData);
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
            const defaultColumnCount = defaultColumns.length;
            const clinicalColumns = _.reduce(
                this.props.store.visibleAttributesForClinicalData.sort(
                    chartMetaComparator
                ),
                (
                    acc: Column<{ [id: string]: string }>[],
                    chartMeta: ChartMeta,
                    index: number
                ) => {
                    if (
                        chartMeta.clinicalAttribute !== undefined &&
                        !HIDDEN_CLINICAL_ATTRIBUTE_IDS.has(
                            chartMeta.clinicalAttribute.clinicalAttributeId
                        ) &&
                        !WSI_PATIENT_SLIDE_ATTRIBUTE_IDS.has(
                            chartMeta.clinicalAttribute.clinicalAttributeId
                        )
                    ) {
                        acc.push({
                            ...this.getDefaultColumnConfig(
                                getUniqueKey(chartMeta.clinicalAttribute),
                                getClinicalAttributeDisplayName(
                                    chartMeta.clinicalAttribute
                                ),
                                chartMeta.clinicalAttribute.datatype ===
                                    DataType.NUMBER
                            ),
                            tooltip: getClinicalAttributeOverlay(
                                getClinicalAttributeDisplayName(
                                    chartMeta.clinicalAttribute
                                ),
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

            const wsiColumns = WSI_PATIENT_SLIDE_COLUMNS.map(column => ({
                ...this.getDefaultColumnConfig(
                    column.attributeId,
                    column.displayName,
                    true
                ),
                visible: column.visible,
            }));

            // Keep the primary patient WSI count in the initial viewport. The
            // remaining WSI breakdown columns stay available from Columns.
            clinicalColumns.splice(
                defaultColumnCount,
                0,
                ...wsiColumns.filter(column => column.visible)
            );
            clinicalColumns.push(
                ...wsiColumns.filter(column => !column.visible)
            );

            return clinicalColumns;
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
                                        initialItemsPerPage={-1}
                                        paginationProps={
                                            this.clinicalDataPaginationProps
                                        }
                                        tableMaxHeight="calc(100vh - 220px)"
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
                                        showColumnVisibility={true}
                                        onFilterTextChange={searchTerm => {
                                            this.clinicalDataTabSearchTerm = searchTerm;
                                            this.setClinicalDataPage(0);
                                        }}
                                        onSortDirectionChange={(
                                            field,
                                            sortDirection
                                        ) => {
                                            this.clinicalDataSortCriteria = {
                                                field: field,
                                                direction: sortDirection,
                                            };
                                            this.setClinicalDataPage(0);
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
                                        downloadDataFetcher={async () => {
                                            const filters = this.props.store
                                                .filters;
                                            const samples = this.props.store
                                                .sampleSetByKey.result!;
                                            const search = this
                                                .clinicalDataTabSearchTerm;
                                            const sort = this
                                                .clinicalDataSortAttributeId;
                                            const direction = this
                                                .clinicalDataSortDirection;
                                            const rows: Array<{
                                                [id: string]: string;
                                            }> = [];
                                            let page = 0;
                                            let total = 0;
                                            do {
                                                const result = await fetchClinicalDataForStudyViewClinicalDataTab(
                                                    filters,
                                                    samples,
                                                    search,
                                                    sort,
                                                    direction,
                                                    CLINICAL_DATA_DOWNLOAD_PAGE_SIZE,
                                                    page++
                                                );
                                                rows.push(...result.data);
                                                total = result.totalItems;
                                                if (!result.data.length) break;
                                            } while (
                                                page *
                                                    CLINICAL_DATA_DOWNLOAD_PAGE_SIZE <
                                                total
                                            );
                                            return rows;
                                        }}
                                        resultCountOverride={
                                            this.getDataForClinicalDataTab
                                                .result?.totalItems
                                        }
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
