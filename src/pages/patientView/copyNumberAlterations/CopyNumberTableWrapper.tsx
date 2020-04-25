import * as React from 'react';
import { observer } from 'mobx-react';
import { computed } from 'mobx';
import * as _ from 'lodash';
import LazyMobXTable from 'shared/components/lazyMobXTable/LazyMobXTable';
import {
    CancerStudy,
    DiscreteCopyNumberData,
    Gene,
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
import { ICivicGene, ICivicVariant, RemoteData } from 'react-mutation-mapper';
import { IOncoKbData } from 'cbioportal-frontend-commons';
import { CancerGene } from 'oncokb-ts-api-client';

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
    cnaCivicGenes?: RemoteData<ICivicGene | undefined>;
    cnaCivicVariants?: RemoteData<ICivicVariant | undefined>;
    oncoKbCancerGenes?: RemoteData<CancerGene[] | Error | undefined>;
    enableOncoKb?: boolean;
    enableCivic?: boolean;
    pubMedCache?: PubMedCache;
    referenceGenes: ReferenceGenomeGene[];
    data: DiscreteCopyNumberData[][];
    copyNumberCountCache?: CopyNumberCountCache;
    mrnaExprRankCache?: MrnaExprRankCache;
    gisticData: IGisticData;
    userEmailAddress?: string;
    mrnaExprRankMolecularProfileId?: string;
    columnVisibility?: { [columnId: string]: boolean };
    columnVisibilityProps?: IColumnVisibilityControlsProps;
    status: 'loading' | 'available' | 'unavailable';
    showGeneFilterMenu?: boolean;
    currentGeneFilter: GeneFilterOption;
    onFilterGenes?: (option: GeneFilterOption) => void;
    onSelectGenePanel?: (name: string) => void;
    disableTooltip?: boolean;
};

@observer
export default class CopyNumberTableWrapper extends React.Component<
    ICopyNumberTableWrapperProps,
    {}
> {
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

    render() {
        const columns: CNATableColumn[] = [];
        const numSamples = this.props.sampleIds.length;

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
            render: (d: DiscreteCopyNumberData[]) =>
                AnnotationColumnFormatter.renderFunction(d, {
                    uniqueSampleKeyToTumorType: this.props
                        .uniqueSampleKeyToTumorType,
                    oncoKbData: this.props.cnaOncoKbData,
                    oncoKbCancerGenes: this.props.oncoKbCancerGenes,
                    enableOncoKb: this.props.enableOncoKb as boolean,
                    pubMedCache: this.props.pubMedCache,
                    civicGenes: this.props.cnaCivicGenes,
                    civicVariants: this.props.cnaCivicVariants,
                    enableCivic: this.props.enableCivic as boolean,
                    enableMyCancerGenome: false,
                    enableHotspot: false,
                    userEmailAddress: this.props.userEmailAddress,
                    studyIdToStudy: this.props.studyIdToStudy,
                }),
            sortBy: (d: DiscreteCopyNumberData[]) => {
                return AnnotationColumnFormatter.sortValue(
                    d,
                    this.props.oncoKbCancerGenes,
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
                order: 70,
            });
        }

        const orderedColumns = _.sortBy(
            columns,
            (c: CNATableColumn) => c.order
        );
        return (
            <div>
                {this.props.status === 'unavailable' && (
                    <div className="alert alert-info" role="alert">
                        Copy Number Alterations are not available.
                    </div>
                )}

                {this.props.status === 'available' && (
                    <CNATableComponent
                        columns={orderedColumns}
                        data={this.props.data}
                        initialSortColumn="Annotation"
                        initialSortDirection="desc"
                        initialItemsPerPage={10}
                        itemsLabel="Copy Number Alteration"
                        itemsLabelPlural="Copy Number Alterations"
                        showCountHeader={true}
                        columnVisibility={this.props.columnVisibility}
                        columnVisibilityProps={this.props.columnVisibilityProps}
                    />
                )}
            </div>
        );
    }
}
