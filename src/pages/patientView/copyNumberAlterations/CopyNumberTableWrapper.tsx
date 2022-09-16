import * as React from 'react';
import { observer } from 'mobx-react';
import { action, computed, makeObservable, observable } from 'mobx';
import _ from 'lodash';
import LazyMobXTable from 'shared/components/lazyMobXTable/LazyMobXTable';
import {
    CancerStudy,
    DiscreteCopyNumberData,
    GenePanelData,
    MolecularProfile,
    ReferenceGenomeGene,
} from 'cbioportal-ts-api-client';
import { Column } from 'shared/components/lazyMobXTable/LazyMobXTable';
import MrnaExprColumnFormatter from 'shared/components/mutationTable/column/MrnaExprColumnFormatter';
import { IColumnVisibilityControlsProps } from 'shared/components/columnVisibilityControls/ColumnVisibilityControls';
import CohortColumnFormatter from './column/CohortColumnFormatter';
import CnaColumnFormatter from './column/CnaColumnFormatter';
import AnnotationColumnFormatter from './column/AnnotationColumnFormatter';
import TumorColumnFormatter from '../mutation/column/TumorColumnFormatter';
import SampleManager from '../SampleManager';
import PubMedCache from 'shared/cache/PubMedCache';
import MrnaExprRankCache from 'shared/cache/MrnaExprRankCache';
import { IGisticData } from 'shared/model/Gistic';
import CopyNumberCountCache from '../clinicalInformation/CopyNumberCountCache';
import HeaderIconMenu from '../mutation/HeaderIconMenu';
import GeneFilterMenu, { GeneFilterOption } from '../mutation/GeneFilterMenu';
import PanelColumnFormatter from 'shared/components/mutationTable/column/PanelColumnFormatter';
import {
    ICivicGeneIndex,
    ICivicVariantIndex,
    IOncoKbData,
    RemoteData,
} from 'cbioportal-utils';
import { CancerGene } from 'oncokb-ts-api-client';
import {
    calculateOncoKbContentPadding,
    calculateOncoKbContentWidthOnNextFrame,
    calculateOncoKbContentWidthWithInterval,
    DEFAULT_ONCOKB_CONTENT_WIDTH,
    updateOncoKbIconStyle,
} from 'shared/lib/AnnotationColumnUtils';
import { ILazyMobXTableApplicationDataStore } from 'shared/lib/ILazyMobXTableApplicationDataStore';

class CNATableComponent extends LazyMobXTable<DiscreteCopyNumberData[]> {}

type CNATableColumn = Column<DiscreteCopyNumberData[]> & { order: number };

type ICopyNumberTableWrapperProps = {
    studyIdToStudy?: { [studyId: string]: CancerStudy };
    sampleIds: string[];
    sampleManager: SampleManager | null;
    sampleToGenePanelId: { [sampleId: string]: string | undefined };
    uniqueSampleKeyToTumorType?: { [sampleId: string]: string };
    genePanelIdToEntrezGeneIds: { [genePanelId: string]: number[] };
    cnaOncoKbData?: RemoteData<IOncoKbData | Error | undefined>;
    cnaCivicGenes?: RemoteData<ICivicGeneIndex | undefined>;
    cnaCivicVariants?: RemoteData<ICivicVariantIndex | undefined>;
    oncoKbCancerGenes?: RemoteData<CancerGene[] | Error | undefined>;
    usingPublicOncoKbInstance: boolean;
    mergeOncoKbIcons?: boolean;
    enableOncoKb?: boolean;
    enableCivic?: boolean;
    pubMedCache?: PubMedCache;
    referenceGenes: ReferenceGenomeGene[];
    data: DiscreteCopyNumberData[][];
    dataStore?: ILazyMobXTableApplicationDataStore<DiscreteCopyNumberData[]>;
    profile: MolecularProfile | undefined;
    genePanelDataByMolecularProfileIdAndSampleId: {
        [profileId: string]: {
            [sampleId: string]: GenePanelData;
        };
    };
    copyNumberCountCache?: CopyNumberCountCache;
    mrnaExprRankCache?: MrnaExprRankCache;
    gisticData: IGisticData;
    userEmailAddress?: string;
    mrnaExprRankMolecularProfileId?: string;
    columnVisibility?: { [columnId: string]: boolean };
    columnVisibilityProps?: IColumnVisibilityControlsProps;
    pageMode?: 'sample' | 'patient';
    showGeneFilterMenu?: boolean;
    currentGeneFilter: GeneFilterOption;
    onFilterGenes?: (option: GeneFilterOption) => void;
    onSelectGenePanel?: (name: string) => void;
    onRowClick?: (d: DiscreteCopyNumberData[]) => void;
    onRowMouseEnter?: (d: DiscreteCopyNumberData[]) => void;
    onRowMouseLeave?: (d: DiscreteCopyNumberData[]) => void;
    disableTooltip?: boolean;
};

const ANNOTATION_ELEMENT_ID = 'copy-number-annotation';

@observer
export default class CopyNumberTableWrapper extends React.Component<
    ICopyNumberTableWrapperProps,
    {}
> {
    @observable mergeOncoKbIcons;
    @observable oncokbWidth = DEFAULT_ONCOKB_CONTENT_WIDTH;
    private oncokbInterval: any;

    constructor(props: ICopyNumberTableWrapperProps) {
        super(props);
        makeObservable(this);

        // here we wait for the oncokb icons to fully finish rendering
        // then update the oncokb width in order to align annotation column header icons with the cell content
        this.oncokbInterval = calculateOncoKbContentWidthWithInterval(
            ANNOTATION_ELEMENT_ID,
            oncoKbContentWidth => (this.oncokbWidth = oncoKbContentWidth)
        );

        this.mergeOncoKbIcons = !!props.mergeOncoKbIcons;
    }

    public destroy() {
        clearInterval(this.oncokbInterval);
    }

    public static defaultProps = {
        enableOncoKb: true,
        enableCivic: false,
        showGeneFilterMenu: true,
    };

    @computed get hugoGeneSymbolToCytoband() {
        // build reference gene map
        const result: {
            [hugosymbol: string]: string;
        } = this.props.referenceGenes!.reduce(
            (
                map: { [hugosymbol: string]: string },
                next: ReferenceGenomeGene
            ) => {
                map[next.hugoGeneSymbol] = next.cytoband || '';
                return map;
            },
            {}
        );
        return result;
    }

    getCytobandForGene(hugoGeneSymbol: string) {
        return this.hugoGeneSymbolToCytoband[hugoGeneSymbol];
    }

    public render() {
        const columns: CNATableColumn[] = [];
        const numSamples = this.props.sampleIds.length;
        const isProfiled = this.props
            .genePanelDataByMolecularProfileIdAndSampleId?.[
            this.props.profile?.molecularProfileId!
        ]?.[this.props.sampleIds?.[0]]?.profiled;

        if (numSamples >= 2) {
            columns.push({
                name: 'Samples',
                render: (d: DiscreteCopyNumberData[]) =>
                    TumorColumnFormatter.renderFunction(
                        d,
                        this.props.sampleManager,
                        this.props.sampleToGenePanelId,
                        this.props.genePanelIdToEntrezGeneIds,
                        this.props.onSelectGenePanel,
                        this.props.disableTooltip
                    ),
                sortBy: (d: DiscreteCopyNumberData[]) =>
                    TumorColumnFormatter.getSortValue(
                        d,
                        this.props.sampleManager
                    ),
                download: (d: DiscreteCopyNumberData[]) =>
                    TumorColumnFormatter.getSample(d),
                order: 20,
                resizable: true,
            });
        }

        columns.push({
            name: 'Gene',
            render: (d: DiscreteCopyNumberData[]) => (
                <span data-test="cna-table-gene-column">
                    {d[0].gene.hugoGeneSymbol}
                </span>
            ),
            filter: (
                d: DiscreteCopyNumberData[],
                filterString: string,
                filterStringUpper: string
            ) => {
                return d[0].gene.hugoGeneSymbol.indexOf(filterStringUpper) > -1;
            },
            download: (d: DiscreteCopyNumberData[]) => d[0].gene.hugoGeneSymbol,
            sortBy: (d: DiscreteCopyNumberData[]) => d[0].gene.hugoGeneSymbol,
            headerRender: (name: string) => {
                return (
                    <HeaderIconMenu
                        name={name}
                        showIcon={this.props.showGeneFilterMenu}
                    >
                        <GeneFilterMenu
                            onOptionChanged={this.props.onFilterGenes}
                            currentSelection={this.props.currentGeneFilter}
                        />
                    </HeaderIconMenu>
                );
            },
            visible: true,
            order: 30,
        });

        const GenePanelProps = (d: DiscreteCopyNumberData[]) => ({
            data: d,
            sampleToGenePanelId: this.props.sampleToGenePanelId,
            sampleManager: this.props.sampleManager,
            genePanelIdToGene: this.props.genePanelIdToEntrezGeneIds,
            onSelectGenePanel: this.props.onSelectGenePanel,
        });

        columns.push({
            name: 'Gene panel',
            render: (d: DiscreteCopyNumberData[]) =>
                PanelColumnFormatter.renderFunction(GenePanelProps(d)),
            download: (d: DiscreteCopyNumberData[]) =>
                PanelColumnFormatter.download(GenePanelProps(d)),
            sortBy: (d: DiscreteCopyNumberData[]) =>
                PanelColumnFormatter.getGenePanelIds(GenePanelProps(d)),
            visible: false,
            order: 35,
        });

        columns.push({
            name: 'CNA',
            render: CnaColumnFormatter.renderFunction,
            filter: (
                d: DiscreteCopyNumberData[],
                filterString: string,
                filterStringUpper: string
            ) => {
                return (
                    CnaColumnFormatter.displayText(d)
                        .toUpperCase()
                        .indexOf(filterStringUpper) > -1
                );
            },
            download: CnaColumnFormatter.download,
            sortBy: CnaColumnFormatter.sortValue,
            visible: true,
            order: 40,
        });

        columns.push({
            name: 'Annotation',
            headerRender: (name: string) =>
                AnnotationColumnFormatter.headerRender(
                    name,
                    this.oncokbWidth,
                    this.mergeOncoKbIcons,
                    this.handleOncoKbIconModeToggle
                ),
            render: (d: DiscreteCopyNumberData[]) => (
                <span id="copy-number-annotation">
                    {AnnotationColumnFormatter.renderFunction(d, {
                        uniqueSampleKeyToTumorType: this.props
                            .uniqueSampleKeyToTumorType,
                        oncoKbData: this.props.cnaOncoKbData,
                        oncoKbCancerGenes: this.props.oncoKbCancerGenes,
                        usingPublicOncoKbInstance: this.props
                            .usingPublicOncoKbInstance,
                        mergeOncoKbIcons: this.mergeOncoKbIcons,
                        oncoKbContentPadding: calculateOncoKbContentPadding(
                            this.oncokbWidth
                        ),
                        enableOncoKb: this.props.enableOncoKb as boolean,
                        pubMedCache: this.props.pubMedCache,
                        civicGenes: this.props.cnaCivicGenes,
                        civicVariants: this.props.cnaCivicVariants,
                        enableCivic: this.props.enableCivic as boolean,
                        enableMyCancerGenome: false,
                        enableHotspot: false,
                        userEmailAddress: this.props.userEmailAddress,
                        studyIdToStudy: this.props.studyIdToStudy,
                    })}
                </span>
            ),
            sortBy: (d: DiscreteCopyNumberData[]) => {
                return AnnotationColumnFormatter.sortValue(
                    d,
                    this.props.oncoKbCancerGenes,
                    this.props.usingPublicOncoKbInstance,
                    this.props.cnaOncoKbData,
                    this.props.uniqueSampleKeyToTumorType,
                    this.props.cnaCivicGenes,
                    this.props.cnaCivicVariants
                );
            },
            order: 50,
        });

        columns.push({
            name: 'Cytoband',
            render: (d: DiscreteCopyNumberData[]) => (
                <span>{this.getCytobandForGene(d[0].gene.hugoGeneSymbol)}</span>
            ),
            sortBy: (d: DiscreteCopyNumberData[]) =>
                this.getCytobandForGene(d[0].gene.hugoGeneSymbol),
            download: (d: DiscreteCopyNumberData[]) =>
                this.getCytobandForGene(d[0].gene.hugoGeneSymbol),
            visible: true,
            order: 60,
        });

        columns.push({
            name: 'Cohort',
            render: (d: DiscreteCopyNumberData[]) =>
                this.props.copyNumberCountCache ? (
                    CohortColumnFormatter.renderFunction(
                        d,
                        this.props.copyNumberCountCache,
                        this.props.gisticData
                    )
                ) : (
                    <span />
                ),
            sortBy: (d: DiscreteCopyNumberData[]) => {
                if (this.props.copyNumberCountCache) {
                    return CohortColumnFormatter.getSortValue(
                        d,
                        this.props.copyNumberCountCache
                    );
                } else {
                    return 0;
                }
            },
            download: (d: DiscreteCopyNumberData[]) => {
                if (this.props.copyNumberCountCache) {
                    return CohortColumnFormatter.getDownloadValue(
                        d,
                        this.props.copyNumberCountCache
                    );
                } else {
                    return 'N/A';
                }
            },
            tooltip: <span>Alteration frequency in cohort</span>,
            defaultSortDirection: 'desc',
            order: 80,
        });

        if (numSamples === 1 && this.props.mrnaExprRankMolecularProfileId) {
            columns.push({
                name: 'mRNA Expr.',
                render: (d: DiscreteCopyNumberData[]) =>
                    this.props.mrnaExprRankCache ? (
                        MrnaExprColumnFormatter.cnaRenderFunction(
                            d,
                            this.props.mrnaExprRankCache
                        )
                    ) : (
                        <span />
                    ),
                download: (d: DiscreteCopyNumberData[]) => {
                    if (this.props.mrnaExprRankCache) {
                        return MrnaExprColumnFormatter.getDownloadData(
                            d,
                            this.props.mrnaExprRankCache
                        );
                    } else {
                        return 'N/A';
                    }
                },
                order: 70,
            });
        }

        const orderedColumns = _.sortBy(
            columns,
            (c: CNATableColumn) => c.order
        );

        if (this.props.profile === undefined) {
            return (
                <div className="alert alert-info" role="alert">
                    Study has no Copy Number Alteration data.
                </div>
            );
        } else if (!isProfiled) {
            return (
                <div className="alert alert-info" role="alert">
                    {this.props.pageMode === 'patient'
                        ? 'Patient is not profiled for Copy Number Alterations.'
                        : 'Sample is not profiled for Copy Number Alterations.'}
                </div>
            );
        }
        return (
            <CNATableComponent
                columns={orderedColumns}
                data={this.props.data}
                dataStore={this.props.dataStore}
                initialSortColumn="Annotation"
                initialSortDirection="desc"
                initialItemsPerPage={10}
                itemsLabel="Copy Number Alteration"
                itemsLabelPlural="Copy Number Alterations"
                showCountHeader={true}
                columnVisibility={this.props.columnVisibility}
                columnVisibilityProps={this.props.columnVisibilityProps}
                onRowClick={this.props.onRowClick}
                onRowMouseEnter={this.props.onRowMouseEnter}
                onRowMouseLeave={this.props.onRowMouseLeave}
            />
        );
    }

    @action.bound
    private handleOncoKbIconModeToggle(mergeIcons: boolean) {
        this.mergeOncoKbIcons = mergeIcons;
        updateOncoKbIconStyle({ mergeIcons });

        // we need to set the OncoKB width on the next render cycle, otherwise it is not updated yet
        calculateOncoKbContentWidthOnNextFrame(
            ANNOTATION_ELEMENT_ID,
            width => (this.oncokbWidth = width || DEFAULT_ONCOKB_CONTENT_WIDTH)
        );
    }
}
