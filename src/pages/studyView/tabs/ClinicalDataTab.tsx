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

const CLINICAL_DATA_RECORD_LIMIT = 500;

const SLIDE_COUNT_COLUMNS = [
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
];

const SLIDE_COUNT_ATTRIBUTE_IDS = new Set<string>(
    SLIDE_COUNT_COLUMNS.map(column => column.attributeId)
);

export type SlideCountColumnSpec = {
    attributeId: string;
    displayName: string;
    description: string;
    visible: boolean;
};

/**
 * The WSI slide-count columns for the attributes a study has, in a fixed
 * order. Names and descriptions come from the study's attribute metadata;
 * a name that is missing or only repeats the id falls back to a built-in one.
 */
export function getSlideCountColumnSpecs(
    clinicalAttributes: Pick<
        ClinicalAttribute,
        'clinicalAttributeId' | 'displayName' | 'description'
    >[]
): SlideCountColumnSpec[] {
    const attributesById = _.keyBy(
        clinicalAttributes.filter(attribute =>
            SLIDE_COUNT_ATTRIBUTE_IDS.has(attribute.clinicalAttributeId)
        ),
        attribute => attribute.clinicalAttributeId
    );
    return SLIDE_COUNT_COLUMNS.filter(
        column => attributesById[column.attributeId] !== undefined
    ).map(column => {
        const attribute = attributesById[column.attributeId];
        const ownName = (attribute.displayName || '').trim();
        const ownDescription = (attribute.description || '').trim();
        const displayName =
            ownName && ownName !== column.attributeId
                ? ownName
                : column.displayName;
        return {
            attributeId: column.attributeId,
            displayName,
            description:
                ownDescription && ownDescription !== column.attributeId
                    ? ownDescription
                    : '',
            visible: column.visible,
        };
    });
}

export function isSlideCountChartMeta(chartMeta: ChartMeta): boolean {
    return (
        chartMeta.clinicalAttribute !== undefined &&
        SLIDE_COUNT_ATTRIBUTE_IDS.has(
            chartMeta.clinicalAttribute.clinicalAttributeId
        )
    );
}

/**
 * Maps a sorted column's header name to the attribute id the server sorts
 * by. Slide-count columns resolve by their own id first, so another
 * attribute with the same display name cannot take their place.
 */
export function getClinicalDataSortAttributeId(
    field: string | undefined,
    slideCountColumns: SlideCountColumnSpec[],
    clinicalAttributeByDisplayName:
        | { [displayName: string]: ClinicalAttribute }
        | undefined
): string | undefined {
    if (!field) {
        return undefined;
    }
    // Patient ID and Sample ID are not clinical attributes
    if (field === 'Patient ID') {
        return 'patientId';
    }
    if (field === 'Sample ID') {
        return 'sampleId';
    }
    const slideCountColumn = slideCountColumns.find(
        column => column.displayName === field
    );
    if (slideCountColumn) {
        return slideCountColumn.attributeId;
    }
    return clinicalAttributeByDisplayName?.[field]?.clinicalAttributeId;
}

type SortCriteria = {
    field: string | undefined;
    direction: SortDirection | undefined;
};

async function fetchClinicalDataForStudyViewClinicalDataTab(
    filters: StudyViewFilter,
    sampleSetByKey: { [sampleId: string]: Sample },
    searchTerm: string | undefined,
    sortAttributeId: string | undefined,
    sortDirection: 'asc' | 'desc' | undefined,
    recordLimit: number
) {
    let sampleClinicalDataResponse = await getAllClinicalDataByStudyViewFilter(
        filters,
        searchTerm,
        sortAttributeId,
        sortDirection,
        recordLimit,
        0
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

    @observable clinicalDataSortCriteria: SortCriteria = {
        field: undefined,
        direction: undefined,
    };

    @computed
    get slideCountColumns(): SlideCountColumnSpec[] {
        return getSlideCountColumnSpecs(
            this.props.store.clinicalAttributes.result || []
        );
    }

    @computed
    get clinicalDataSortAttributeId(): string | undefined {
        return getClinicalDataSortAttributeId(
            this.clinicalDataSortCriteria?.field,
            this.slideCountColumns,
            this.props.store.clinicalAttributeDisplayNameToClinicalAttribute
                .result
        );
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
                CLINICAL_DATA_RECORD_LIMIT
            );

            return Promise.resolve(sampleClinicalData);
        },
    });

    // this problem is that the visible attributes are not yet populated.

    readonly columns = remoteData({
        await: () => [this.props.store.clinicalAttributes],
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
                this.props.store.visibleAttributesForClinicalData
                    .filter(chartMeta => !isSlideCountChartMeta(chartMeta))
                    .sort(chartMetaComparator),
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

            const slideCountColumns = this.slideCountColumns.map(column => ({
                ...this.getDefaultColumnConfig(
                    column.attributeId,
                    column.displayName,
                    true
                ),
                tooltip: getClinicalAttributeOverlay(
                    column.displayName,
                    column.description,
                    column.attributeId
                ),
                visible: column.visible,
            }));
            clinicalColumns.splice(
                defaultColumnCount,
                0,
                ...slideCountColumns.filter(column => column.visible)
            );
            clinicalColumns.push(
                ...slideCountColumns.filter(column => !column.visible)
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
                                        initialItemsPerPage={20}
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
                                        showColumnVisibility={
                                            this.slideCountColumns.length > 0
                                        }
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
                                                500
                                            ).then(data => {
                                                return data.data;
                                            });
                                        }}
                                        // result limited mode will show a message when user reaches maximum
                                        // allowed result and explain to them they can use filtering or sorting
                                        // to find more specific results
                                        // this should only engage when the total matching items reported by server
                                        // exceeds the allowed limit
                                        // this allows us to limit the number of results without introducing the complication
                                        // of server side pagination
                                        isResultLimited={
                                            !!this.getDataForClinicalDataTab
                                                .result?.totalItems
                                                ? this.getDataForClinicalDataTab
                                                      .result?.totalItems >
                                                  CLINICAL_DATA_RECORD_LIMIT
                                                : false
                                        }
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
