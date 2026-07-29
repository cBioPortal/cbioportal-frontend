import * as React from 'react';
import { computed, makeObservable, observable } from 'mobx';
import { observer } from 'mobx-react';
import { PatientViewPageStore } from '../clinicalInformation/PatientViewPageStore';
import LazyMobXTable, {
    Column,
} from 'shared/components/lazyMobXTable/LazyMobXTable';
import TumorColumnFormatter from '../mutation/column/TumorColumnFormatter';
import HeaderIconMenu from '../mutation/HeaderIconMenu';
import GeneFilterMenu from '../mutation/GeneFilterMenu';
import PanelColumnFormatter from 'shared/components/mutationTable/column/PanelColumnFormatter';
import _ from 'lodash';
import { MakeMobxView } from 'shared/components/MobxView';
import LoadingIndicator from 'shared/components/loadingIndicator/LoadingIndicator';
import ErrorMessage from 'shared/components/ErrorMessage';
import AnnotationColumnFormatter from './column/AnnotationColumnFormatter';
import { getServerConfig } from 'config/config';
import { ServerConfigHelpers } from 'config/config';
import ChromosomeColumnFormatter from 'shared/components/mutationTable/column/ChromosomeColumnFormatter';
import { DownloadControlOption, remoteData } from 'cbioportal-frontend-commons';
import {
    calculateOncoKbContentPadding,
    calculateOncoKbContentWidthWithInterval,
    DEFAULT_ONCOKB_CONTENT_WIDTH,
} from 'shared/lib/AnnotationColumnUtils';
import { StructuralVariant } from 'cbioportal-ts-api-client';
import { MutationStatus } from 'react-mutation-mapper';
import { getSamplesProfiledStatus } from 'pages/patientView/PatientViewPageUtils';
import SampleNotProfiledAlert from 'shared/components/SampleNotProfiledAlert';
import { NamespaceColumnConfig } from 'shared/components/namespaceColumns/NamespaceColumnConfig';
import { createNamespaceColumns } from 'shared/components/namespaceColumns/namespaceColumnsUtils';
import CustomDriverTierColumnFormatter from './column/CustomDriverTierColumnFormatter';
import CustomDriverColumnFormatter from './column/CustomDriverColumnFormatter';

export interface IFusionTableWrapperProps {
    store: PatientViewPageStore;
    onSelectGenePanel?: (name: string) => void;
    mergeOncoKbIcons?: boolean;
    sampleIds: string[];
    enableOncoKb: boolean;
    onOncoKbIconToggle: (mergeIcons: boolean) => void;
    namespaceColumns?: NamespaceColumnConfig;
    customDriverName?: string;
    customDriverDescription?: string;
    customDriverTiersName?: string;
    customDriverTiersDescription?: string;
}

type FusionTableColumn = Column<StructuralVariant[]> & { order: number };

class FusionTableComponent extends LazyMobXTable<StructuralVariant[]> {}

const FUSION_ANNOTATION_ELEMENT_ID = 'sv-annotation';

@observer
export default class FusionTableWrapper extends React.Component<
    IFusionTableWrapperProps,
    {}
> {
    @observable mergeOncoKbIcons;
    @observable oncokbWidth = DEFAULT_ONCOKB_CONTENT_WIDTH;
    private oncokbInterval: any;

    constructor(props: IFusionTableWrapperProps) {
        super(props);
        makeObservable(this);

        // here we wait for the oncokb icons to fully finish rendering
        // then update the oncokb width in order to align annotation column header icons with the cell content
        this.oncokbInterval = calculateOncoKbContentWidthWithInterval(
            FUSION_ANNOTATION_ELEMENT_ID,
            oncoKbContentWidth => {
                if (this.oncokbWidth !== oncoKbContentWidth)
                    this.oncokbWidth = oncoKbContentWidth;
            }
        );

        this.mergeOncoKbIcons = !!props.mergeOncoKbIcons;
    }

    public destroy() {
        clearInterval(this.oncokbInterval);
    }

    readonly columns = remoteData({
        await: () => [
            this.props.store.sampleManager,
            this.props.store.sampleToFusionGenePanelId,
            this.props.store.genePanelIdToEntrezGeneIds,
            this.props.store.fusionTableShowGeneFilterMenu,
            this.props.store.oncoKbAnnotatedGenes,
            this.props.store.studyIdToStudy,
            this.props.store.oncoKbCancerGenes,
        ],
        invoke: async () => {
            const columns: FusionTableColumn[] = [];
            const numSamples = this.props.store.sampleIds.length;

            if (numSamples >= 2) {
                columns.push({
                    name: 'Samples',
                    render: (d: StructuralVariant[]) => {
                        return TumorColumnFormatter.renderFunction(
                            d.map(datum => {
                                // if both are available, return both genes in an array
                                // otherwise, return whichever is available
                                const genes =
                                    datum.site1EntrezGeneId &&
                                    datum.site2EntrezGeneId
                                        ? [
                                              datum.site1EntrezGeneId,
                                              datum.site2EntrezGeneId,
                                          ]
                                        : datum.site1EntrezGeneId ||
                                          datum.site2EntrezGeneId;
                                return {
                                    sampleId: datum.sampleId,
                                    entrezGeneId: genes,
                                    sv: true,
                                };
                            }),
                            this.props.store.sampleManager.result!,
                            this.props.store.sampleToFusionGenePanelId.result!,
                            this.props.store.genePanelIdToEntrezGeneIds.result!,
                            this.props.onSelectGenePanel
                        );
                    },
                    sortBy: (d: StructuralVariant[]) =>
                        TumorColumnFormatter.getSortValue(
                            d,
                            this.props.store.sampleManager.result!
                        ),
                    download: (d: StructuralVariant[]) =>
                        TumorColumnFormatter.getSample(d),
                    order: 20,
                    resizable: true,
                });
            }

            columns.push({
                name: 'Gene 1',
                render: (d: StructuralVariant[]) => (
                    <span data-test="sv-table-gene1-column">
                        {d[0].site1HugoSymbol}
                    </span>
                ),
                filter: (
                    d: StructuralVariant[],
                    filterString: string,
                    filterStringUpper: string
                ) => {
                    return (
                        d[0].site1HugoSymbol?.indexOf(filterStringUpper) > -1
                    );
                },
                download: (d: StructuralVariant[]) => d[0].site1HugoSymbol,
                sortBy: (d: StructuralVariant[]) => d[0].site1HugoSymbol,
                headerRender: (name: string) => {
                    return (
                        <HeaderIconMenu
                            name={name}
                            showIcon={
                                this.props.store.fusionTableShowGeneFilterMenu
                                    .result
                            }
                        >
                            <GeneFilterMenu
                                onOptionChanged={
                                    this.props.store.onFilterGenesFusionTable
                                }
                                currentSelection={
                                    this.props.store.fusionTableGeneFilterOption
                                }
                            />
                        </HeaderIconMenu>
                    );
                },
                visible: true,
                order: 30,
            });

            columns.push({
                name: 'Gene 2',
                render: (d: StructuralVariant[]) => (
                    <span data-test="sv-table-gene2-column">
                        {d[0].site2HugoSymbol}
                    </span>
                ),
                filter: (
                    d: StructuralVariant[],
                    filterString: string,
                    filterStringUpper: string
                ) => {
                    return (
                        (d[0].site2HugoSymbol || '').indexOf(
                            filterStringUpper
                        ) > -1
                    );
                },
                download: (d: StructuralVariant[]) => d[0].site2HugoSymbol,
                sortBy: (d: StructuralVariant[]) => d[0].site2HugoSymbol,
                headerRender: (name: string) => {
                    return (
                        <HeaderIconMenu
                            name={name}
                            showIcon={
                                this.props.store.fusionTableShowGeneFilterMenu
                                    .result
                            }
                        >
                            <GeneFilterMenu
                                onOptionChanged={
                                    this.props.store.onFilterGenesFusionTable
                                }
                                currentSelection={
                                    this.props.store.fusionTableGeneFilterOption
                                }
                            />
                        </HeaderIconMenu>
                    );
                },
                visible: true,
                order: 35,
            });

            const genePanelProps = (d: StructuralVariant[]) => ({
                data: d.map(datum => ({
                    sampleId: datum.sampleId,
                    entrezGeneId: datum.site1EntrezGeneId,
                })),
                sampleToGenePanelId: this.props.store.sampleToFusionGenePanelId
                    .result!,
                sampleManager: this.props.store.sampleManager.result!,
                genePanelIdToGene: this.props.store.genePanelIdToEntrezGeneIds
                    .result!,
                onSelectGenePanel: this.props.onSelectGenePanel,
            });

            columns.push({
                name: 'Gene panel',
                render: (d: StructuralVariant[]) =>
                    PanelColumnFormatter.renderFunction(genePanelProps(d)),
                download: (d: StructuralVariant[]) =>
                    PanelColumnFormatter.download(genePanelProps(d)),
                sortBy: (d: StructuralVariant[]) =>
                    PanelColumnFormatter.getGenePanelIds(genePanelProps(d)),
                visible: false,
                order: 40,
            });

            columns.push({
                name: 'Status',
                //Cell: (column: any) => <MutationStatus mutation={column.original} />,
                render: (d: StructuralVariant[]) => {
                    return (
                        <MutationStatus
                            value={d[0].svStatus}
                            displayValueMap={{
                                somatic: 's',
                                germline: 'g',
                            }}
                        />
                    );
                },
                download: (d: StructuralVariant[]) => (d[0] as any).svStatus,
                sortBy: (d: StructuralVariant[]) => 'no',
                visible: true,
                order: 40,
            });

            columns.push({
                name: 'Annotation',
                headerRender: (name: string) =>
                    AnnotationColumnFormatter.headerRender(
                        name,
                        this.oncokbWidth,
                        this.props.mergeOncoKbIcons,
                        this.props.onOncoKbIconToggle
                    ),
                render: (d: StructuralVariant[]) => (
                    <span id="sv-annotation">
                        {AnnotationColumnFormatter.renderFunction(d, {
                            uniqueSampleKeyToTumorType: this.props.store
                                .uniqueSampleKeyToTumorType,
                            oncoKbData: this.props.store.fusionOncoKbData,
                            oncoKbCancerGenes: this.props.store
                                .oncoKbCancerGenes,
                            usingPublicOncoKbInstance: this.props.store
                                .usingPublicOncoKbInstance,
                            mergeOncoKbIcons: this.props.mergeOncoKbIcons,
                            oncoKbContentPadding: calculateOncoKbContentPadding(
                                this.oncokbWidth
                            ),
                            enableOncoKb: this.props.enableOncoKb,
                            pubMedCache: this.props.store.pubMedCache,
                            enableCivic: false,
                            enableHotspot: false,
                            enableRevue: false,
                            userDisplayName: ServerConfigHelpers.getUserDisplayName(),
                            studyIdToStudy: this.props.store.studyIdToStudy
                                .result,
                        })}
                    </span>
                ),
                sortBy: (d: StructuralVariant[]) => {
                    return AnnotationColumnFormatter.sortValue(
                        d,
                        this.props.store.oncoKbCancerGenes,
                        this.props.store.usingPublicOncoKbInstance,
                        this.props.store.fusionOncoKbData,
                        this.props.store.uniqueSampleKeyToTumorType
                    );
                },
                order: 45,
            });

            columns.push({
                name: this.props.customDriverName!,
                render: d => CustomDriverColumnFormatter.renderFunction(d),
                download: CustomDriverColumnFormatter.getTextValue,
                sortBy: (d: StructuralVariant[]) =>
                    CustomDriverColumnFormatter.sortValue(d),
                filter: (
                    d: StructuralVariant[],
                    filterString: string,
                    filterStringUpper: string
                ) =>
                    CustomDriverColumnFormatter.getTextValue(d)
                        .toUpperCase()
                        .includes(filterStringUpper),
                visible:
                    this.props.store.groupedFusionData.result.length > 0 &&
                    this.props.store.groupedFusionData.result.some(
                        d =>
                            d[0].driverFilter !== undefined ||
                            d[0].driverFilterAnn !== undefined
                    ),
                tooltip: <span>{this.props.customDriverDescription!}</span>,
                defaultSortDirection: 'desc',
                order: 46,
            });

            columns.push({
                name: this.props.customDriverTiersName!,
                render: d => CustomDriverTierColumnFormatter.renderFunction(d),
                download: CustomDriverTierColumnFormatter.getTextValue,
                sortBy: (d: StructuralVariant[]) =>
                    CustomDriverTierColumnFormatter.getTextValue(d),
                filter: (
                    d: StructuralVariant[],
                    filterString: string,
                    filterStringUpper: string
                ) =>
                    CustomDriverTierColumnFormatter.getTextValue(d)
                        .toUpperCase()
                        .includes(filterStringUpper),
                visible:
                    this.props.store.groupedFusionData.result.length > 0 &&
                    this.props.store.groupedFusionData.result.every(
                        d =>
                            d[0].driverFilter !== undefined ||
                            d[0].driverFilterAnn !== undefined
                    ),
                tooltip: <span>{this.props.customDriverTiersDescription}</span>,
                order: 47,
            });

            columns.push({
                name: 'Variant Class',
                render: (d: StructuralVariant[]) => (
                    <span>{d[0].variantClass}</span>
                ),
                filter: (
                    d: StructuralVariant[],
                    filterString: string,
                    filterStringUpper: string
                ) => {
                    return (
                        d[0].variantClass
                            .toUpperCase()
                            .indexOf(filterStringUpper) > -1
                    );
                },
                download: (d: StructuralVariant[]) => d[0].variantClass,
                sortBy: (d: StructuralVariant[]) => d[0].variantClass,
                visible: true,
                order: 50,
            });

            columns.push({
                name: 'Site1 Chromosome',
                render: (d: StructuralVariant[]) => (
                    <span>
                        {ChromosomeColumnFormatter.getData(
                            d.map(datum => ({ chr: datum.site1Chromosome }))
                        )}
                    </span>
                ),
                download: (d: StructuralVariant[]) =>
                    ChromosomeColumnFormatter.getData(
                        d.map(datum => ({ chr: datum.site1Chromosome }))
                    ) || '',
                sortBy: (d: StructuralVariant[]) =>
                    ChromosomeColumnFormatter.getSortValue(
                        d.map(datum => ({ chr: datum.site1Chromosome }))
                    ),
                filter: (
                    d: StructuralVariant[],
                    filterString: string,
                    filterStringUpper: string
                ) =>
                    (
                        ChromosomeColumnFormatter.getData(
                            d.map(datum => ({ chr: datum.site1Chromosome }))
                        ) + ''
                    )
                        .toUpperCase()
                        .includes(filterStringUpper),
                visible: false,
                order: 51,
            });

            columns.push({
                name: 'Site2 Chromosome',
                render: (d: StructuralVariant[]) => (
                    <span>
                        {ChromosomeColumnFormatter.getData(
                            d.map(datum => ({ chr: datum.site2Chromosome }))
                        )}
                    </span>
                ),
                download: (d: StructuralVariant[]) =>
                    ChromosomeColumnFormatter.getData(
                        d.map(datum => ({ chr: datum.site2Chromosome }))
                    ) || '',
                sortBy: (d: StructuralVariant[]) =>
                    ChromosomeColumnFormatter.getSortValue(
                        d.map(datum => ({ chr: datum.site2Chromosome }))
                    ),
                filter: (
                    d: StructuralVariant[],
                    filterString: string,
                    filterStringUpper: string
                ) =>
                    (
                        ChromosomeColumnFormatter.getData(
                            d.map(datum => ({ chr: datum.site2Chromosome }))
                        ) + ''
                    )
                        .toUpperCase()
                        .includes(filterStringUpper),
                visible: false,
                order: 52,
            });

            columns.push({
                name: 'Site1 Position',
                render: (d: StructuralVariant[]) => (
                    <span>{d[0].site1Position}</span>
                ),
                download: (d: StructuralVariant[]) => `${d[0].site1Position}`,
                sortBy: (d: StructuralVariant[]) => `${d[0].site1Position}`,
                visible: false,
                order: 55,
            });

            columns.push({
                name: 'Site2 Position',
                render: (d: StructuralVariant[]) => (
                    <span>{d[0].site2Position}</span>
                ),
                download: (d: StructuralVariant[]) => `${d[0].site2Position}`,
                sortBy: (d: StructuralVariant[]) => `${d[0].site2Position}`,
                visible: false,
                order: 65,
            });

            columns.push({
                name: 'Event Info',
                render: (d: StructuralVariant[]) => (
                    <span>{d[0].eventInfo}</span>
                ),
                download: (d: StructuralVariant[]) => d[0].eventInfo,
                sortBy: (d: StructuralVariant[]) => d[0].eventInfo,
                visible: true,
                order: 66,
            });

            columns.push({
                name: 'Connection Type',
                render: (d: StructuralVariant[]) => (
                    <span>{d[0].connectionType}</span>
                ),
                download: (d: StructuralVariant[]) => d[0].connectionType,
                sortBy: (d: StructuralVariant[]) => d[0].connectionType,
                visible: true,
                order: 70,
            });

            columns.push({
                name: 'Breakpoint Type',
                render: (d: StructuralVariant[]) => (
                    <span>{d[0].breakpointType}</span>
                ),
                download: (d: StructuralVariant[]) => d[0].breakpointType,
                sortBy: (d: StructuralVariant[]) => d[0].breakpointType,
                visible: false,
                order: 75,
            });

            columns.push({
                name: 'Additional Annotation',
                render: (d: StructuralVariant[]) => (
                    <span>{d[0].annotation}</span>
                ),
                download: (d: StructuralVariant[]) => d[0].annotation,
                sortBy: (d: StructuralVariant[]) => d[0].annotation,
                visible: false,
                order: 80,
            });

            columns.push(
                ...createFusionNamespaceColumns(this.props.namespaceColumns)
            );

            //Adjust visibility
            const visibleColumnsProperty = getServerConfig()
                .skin_patient_view_structural_variant_table_columns_show_on_init;
            if (visibleColumnsProperty) {
                const visibleColumns = visibleColumnsProperty.split(',');
                columns.forEach(column => {
                    column.visible = visibleColumns.includes(column.name);
                });
            }

            return _.sortBy(columns, (c: FusionTableColumn) => c.order);
        },
        default: [],
    });

    readonly tableUI = MakeMobxView({
        await: () => [
            this.props.store.fusionProfile,
            this.props.store.groupedFusionData,
            this.props.store.genePanelDataByMolecularProfileIdAndSampleId,
            this.columns,
        ],
        render: () => {
            if (!this.props.store.fusionProfile.result) {
                return (
                    <div className="alert alert-info" role="alert">
                        Study is not profiled for fusions.
                    </div>
                );
            }

            const { someProfiled } = getSamplesProfiledStatus(
                this.props.sampleIds,
                this.props.store.genePanelDataByMolecularProfileIdAndSampleId
                    .result,
                this.props.store.fusionProfile.result?.molecularProfileId
            );

            return (
                <>
                    <SampleNotProfiledAlert
                        sampleManager={this.props.store.sampleManager.result!}
                        genePanelDataByMolecularProfileIdAndSampleId={
                            this.props.store
                                .genePanelDataByMolecularProfileIdAndSampleId
                                .result
                        }
                        molecularProfiles={[
                            this.props.store.fusionProfile.result!,
                        ]}
                    />
                    {someProfiled && (
                        <FusionTableComponent
                            columns={this.columns.result}
                            data={this.props.store.groupedFusionData.result!}
                            initialSortColumn={
                                getServerConfig()
                                    .skin_patient_view_tables_default_sort_column
                            }
                            initialSortDirection="desc"
                            initialItemsPerPage={10}
                            itemsLabel="Fusions"
                            itemsLabelPlural="Fusions"
                            showCountHeader={true}
                            showCopyDownload={
                                getServerConfig()
                                    .skin_hide_download_controls ===
                                DownloadControlOption.SHOW_ALL
                            }
                        />
                    )}
                </>
            );
        },
        renderPending: () => <LoadingIndicator isLoading={true} />,
        renderError: () => <ErrorMessage />,
    });

    public render() {
        return (
            <div data-test="patientview-fusion-table">
                {this.tableUI.component}
            </div>
        );
    }
}

function createFusionNamespaceColumns(
    config?: NamespaceColumnConfig
): FusionTableColumn[] {
    const namespaceColumnRecords = createNamespaceColumns(config);
    const namespaceColumns = Object.values(
        namespaceColumnRecords
    ) as FusionTableColumn[];
    namespaceColumns.forEach(c => (c.visible = false));
    return namespaceColumns;
}
