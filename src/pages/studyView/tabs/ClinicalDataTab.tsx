import * as React from 'react';
import {
    Column,
    default as LazyMobXTable,
    LazyMobXTableProps,
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
import { isUrl, remoteData } from 'cbioportal-frontend-commons';
import { Else, If, Then } from 'react-if';
import ProgressIndicator, {
    IProgressIndicatorItem,
} from '../../../shared/components/progressIndicator/ProgressIndicator';
import autobind from 'autobind-decorator';
import { WindowWidthBox } from '../../../shared/components/WindowWidthBox/WindowWidthBox';
import { getServerConfig } from 'config/config';
import { StudyViewPageTabKeyEnum } from '../StudyViewPageTabs';
import { TablePaginationStoreAdaptor } from 'shared/components/lazyMobXTable/TablePaginationStoreAdaptor';
import {
    ClinicalTableItem,
    ClinicalTablePaginationStore,
} from 'shared/components/lazyMobXTable/ClinicalTablePaginationStore';
import PaginatedDownloadDataFetcher from 'pages/studyView/tabs/PaginatedDownloadDataFetcher';
import { TablePaginationParams } from 'shared/components/lazyMobXTable/TablePaginationParams';

export interface IClinicalDataTabTable {
    store: StudyViewPageStore;
}

class ClinicalDataTabTableComponent extends LazyMobXTable<{
    [id: string]: string;
}> {
    constructor(props: LazyMobXTableProps<{ [id: string]: string }>) {
        super(props);
    }
}

type MapColumn = Column<{ [id: string]: string }>;

const downloadParams = {
    // Large page size to decrease db load:
    pageSize: 10_000,
    pageNumber: 0,
    sortParam: undefined,
    direction: 'ASC',
} as TablePaginationParams;

@observer
export class ClinicalDataTab extends React.Component<
    IClinicalDataTabTable,
    {}
> {
    getDefaultColumnConfig(
        key: string,
        sortColumn: string,
        isNumber?: boolean
    ): MapColumn {
        return {
            name: sortColumn || '',
            headerRender: (data: string) => (
                <span data-test={data}>{data}</span>
            ),
            render: (data: { [id: string]: string }) => {
                if (isUrl(data[key])) {
                    return (
                        <a href={data[key]} target="_blank">
                            {data[key]}
                        </a>
                    );
                }
                return <span data-test={data[key]}>{data[key]}</span>;
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
            sortParam: key,
            filter: (
                data: { [id: string]: string },
                filterString: string,
                filterStringUpper: string
            ) => (data[key] || '').toUpperCase().includes(filterStringUpper),
        };
    }

    readonly columns = remoteData({
        invoke: async () => {
            let defaultColumns: MapColumn[] = [
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
                    this.props.store.visibleAttributes,
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
                this.props.store.visibleAttributes.sort(chartMetaComparator),
                (acc: MapColumn[], chartMeta: ChartMeta) => {
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

    private clinicalPageStore = new ClinicalTablePaginationStore(
        this.props.store
    );
    private clinicalDataStore = new TablePaginationStoreAdaptor(
        this.clinicalPageStore
    );
    private clinicalDownloadDataFetcher = new PaginatedDownloadDataFetcher<
        ClinicalTableItem
    >(
        new ClinicalTablePaginationStore(this.props.store),
        downloadParams,
        this.clinicalDataStore
    );

    @autobind
    getProgressItems(elapsedSecs: number): IProgressIndicatorItem[] {
        return [
            {
                label:
                    'Loading clinical data' +
                    (elapsedSecs > 2 ? ' - this can take several seconds' : ''),
                promises: [this.clinicalPageStore.pageItems],
            },
        ];
    }

    public render() {
        return (
            <span data-test="clinical-data-tab-content">
                <WindowWidthBox offset={60}>
                    <If
                        condition={
                            this.props.store.clinicalAttributeProduct
                                .isPending ||
                            this.props.store.maxSamplesForClinicalTab
                                .isPending ||
                            this.props.store.selectedSamples.isPending
                        }
                    >
                        <Then>
                            <LoadingIndicator
                                isLoading={
                                    this.props.store.clinicalAttributeProduct
                                        .isPending ||
                                    this.props.store.maxSamplesForClinicalTab
                                        .isPending ||
                                    this.props.store.selectedSamples.isPending
                                }
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
                                    <If
                                        condition={
                                            this.columns.isPending ||
                                            this.clinicalPageStore.pageItems
                                                .isPending
                                        }
                                    >
                                        <Then>
                                            <LoadingIndicator
                                                isLoading={
                                                    this.columns.isPending ||
                                                    this.clinicalPageStore
                                                        .pageItems.isPending
                                                }
                                                size={'big'}
                                                center={true}
                                            >
                                                <ProgressIndicator
                                                    getItems={
                                                        this.getProgressItems
                                                    }
                                                    show={
                                                        this.columns
                                                            .isPending ||
                                                        this.clinicalPageStore
                                                            .pageItems.isPending
                                                    }
                                                />
                                            </LoadingIndicator>
                                        </Then>
                                        <Else>
                                            <ClinicalDataTabTableComponent
                                                dataStore={
                                                    this.clinicalDataStore
                                                }
                                                downloadDataFetcher={
                                                    this
                                                        .clinicalDownloadDataFetcher
                                                }
                                                initialItemsPerPage={100}
                                                initialFilterString={
                                                    this.clinicalDataStore
                                                        .filterString
                                                }
                                                showCopyDownload={true}
                                                showColumnVisibility={false}
                                                columns={this.columns.result}
                                                copyDownloadProps={{
                                                    showCopy: false,
                                                    downloadFilename: this.props
                                                        .store
                                                        .clinicalDataDownloadFilename,
                                                }}
                                            />
                                        </Else>
                                    </If>
                                </Else>
                            </If>
                        </Else>
                    </If>
                </WindowWidthBox>
            </span>
        );
    }
}
