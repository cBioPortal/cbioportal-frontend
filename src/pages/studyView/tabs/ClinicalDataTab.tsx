import * as React from 'react';
import {
    Column,
    default as LazyMobXTable,
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
import AppConfig from 'appConfig';

export interface IClinicalDataTabTable {
    store: StudyViewPageStore;
}

class ClinicalDataTabTableComponent extends LazyMobXTable<{
    [id: string]: string;
}> {}

@observer
export class ClinicalDataTab extends React.Component<
    IClinicalDataTabTable,
    {}
> {
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
            filter: (
                data: { [id: string]: string },
                filterString: string,
                filterStringUpper: string
            ) => (data[key] || '').toUpperCase().includes(filterStringUpper),
        };
    }

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
                promises: [this.props.store.getDataForClinicalDataTab],
            },
        ];
    }

    public render() {
        return (
            <span data-test="clinical-data-tab-content">
                <WindowWidthBox offset={60}>
                    <If
                        condition={
                            this.columns.isPending ||
                            this.props.store.getDataForClinicalDataTab.isPending
                        }
                    >
                        <Then>
                            <LoadingIndicator
                                isLoading={
                                    this.columns.isPending ||
                                    this.props.store.getDataForClinicalDataTab
                                        .isPending
                                }
                                size={'big'}
                                center={true}
                            >
                                <ProgressIndicator
                                    getItems={this.getProgressItems}
                                    show={
                                        this.columns.isPending ||
                                        this.props.store
                                            .getDataForClinicalDataTab.isPending
                                    }
                                />
                            </LoadingIndicator>
                        </Then>
                        <Else>
                            <ClinicalDataTabTableComponent
                                initialItemsPerPage={20}
                                showCopyDownload={
                                    !AppConfig.serverConfig
                                        .skin_hide_download_controls
                                }
                                showColumnVisibility={false}
                                data={
                                    this.props.store.getDataForClinicalDataTab
                                        .result || []
                                }
                                columns={this.columns.result}
                                copyDownloadProps={{
                                    showCopy:
                                        false &&
                                        !AppConfig.serverConfig
                                            .skin_hide_download_controls,
                                    downloadFilename: this.props.store
                                        .clinicalDataDownloadFilename,
                                }}
                            />
                        </Else>
                    </If>
                </WindowWidthBox>
            </span>
        );
    }
}
