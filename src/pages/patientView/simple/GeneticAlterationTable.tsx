import * as React from 'react';
import {observer} from "mobx-react";
import LazyMobXTable from "shared/components/lazyMobXTable/LazyMobXTable";
import {DiscreteCopyNumberData, Mutation} from "shared/api/generated/CBioPortalAPI";
import {Column} from "shared/components/lazyMobXTable/LazyMobXTable";
import * as _ from 'lodash';
import MrnaExprColumnFormatter from "shared/components/mutationTable/column/MrnaExprColumnFormatter";
import CohortColumnFormatter from "pages/patientView/copyNumberAlterations/column/CohortColumnFormatter";
import CnaColumnFormatter from "pages/patientView/copyNumberAlterations/column/CnaColumnFormatter";
import MutationAnnotationColumnFormatter from "shared/components/mutationTable/column/AnnotationColumnFormatter";
import CNAAnnotationColumnFormatter from "pages/patientView/copyNumberAlterations/column/AnnotationColumnFormatter";
import TumorColumnFormatter from "pages/patientView/mutation/column/TumorColumnFormatter";
import SampleManager from "pages/patientView/sampleManager";
import {IOncoKbDataWrapper} from "shared/model/OncoKB";
import OncoKbEvidenceCache from "shared/cache/OncoKbEvidenceCache";
import PubMedCache from "shared/cache/PubMedCache";
import MrnaExprRankCache from "shared/cache/MrnaExprRankCache";
import {IGisticData} from "shared/model/Gistic";
import CopyNumberCountCache from "pages/patientView/clinicalInformation/CopyNumberCountCache";
import {ICivicGeneDataWrapper, ICivicVariantDataWrapper} from "shared/model/Civic";
import MutationTypeColumnFormatter from 'shared/components/mutationTable/column/MutationTypeColumnFormatter';
import ProteinChangeColumnFormatter from 'shared/components/mutationTable/column/ProteinChangeColumnFormatter';
import { IHotspotDataWrapper } from 'shared/model/CancerHotspots';
import { IMyCancerGenomeData } from 'shared/model/MyCancerGenome';

class GeneticAlterationTableComponent extends LazyMobXTable<(DiscreteCopyNumberData|Mutation)[]> {

}

type GeneticAlterationTableColumn = Column<(DiscreteCopyNumberData|Mutation)[]>&{order:number};

type IGeneticAlterationTableProps = {
    sampleIds:string[];
    sampleManager:SampleManager|null;
    cnaOncoKbData?: IOncoKbDataWrapper;
    cnaCivicGenes?: ICivicGeneDataWrapper;
    cnaCivicVariants?: ICivicVariantDataWrapper;
    oncoKbEvidenceCache?:OncoKbEvidenceCache;
    oncoKbAnnotatedGenes:{[entrezGeneId:number]:boolean};
    enableOncoKb?:boolean;
    enableCivic?:boolean;
    pubMedCache?:PubMedCache;
    data:(DiscreteCopyNumberData|Mutation)[][];
    copyNumberCountCache?:CopyNumberCountCache;
    mrnaExprRankCache?:MrnaExprRankCache;
    gisticData:IGisticData;
    userEmailAddress?:string;
    mrnaExprRankMolecularProfileId?:string;
    status:"loading"|"available"|"unavailable";
    // mutation annotation data
    hotspotData?: IHotspotDataWrapper;
    myCancerGenomeData?: IMyCancerGenomeData;
    oncoKbData?: IOncoKbDataWrapper;
    civicGenes?: ICivicGeneDataWrapper;
    civicVariants?: ICivicVariantDataWrapper;
    enableMyCancerGenome?: boolean;
    enableHotspot?: boolean;
};


@observer
export default class GeneticAlterationTable extends React.Component<IGeneticAlterationTableProps, {}> {

    public static defaultProps = {
        enableOncoKb: true,
        enableCivic: false
    };

    static INITIAL_ITEMS_PER_PAGE = 10;

    fitsOnTwoPages() {
        return this.props.data.length < 2 * GeneticAlterationTable.INITIAL_ITEMS_PER_PAGE;
    }

    render() {
        const columns: GeneticAlterationTableColumn[] = [];
        const numSamples = this.props.sampleIds.length;

        if (numSamples >= 2) {
            columns.push({
                name: "Tumors",
                render:(d:(DiscreteCopyNumberData|Mutation)[])=>TumorColumnFormatter.renderFunction(d, this.props.sampleManager),
                sortBy:(d:(DiscreteCopyNumberData|Mutation)[])=>TumorColumnFormatter.getSortValue(d, this.props.sampleManager),
                download:(d:(DiscreteCopyNumberData|Mutation)[])=>TumorColumnFormatter.getSample(d),
                order: 20
            });
        }

        columns.push({
            name: "Gene",
            render: (d:(DiscreteCopyNumberData|Mutation)[])=><span>{d[0].gene.hugoGeneSymbol}</span>,
            filter: (d:(DiscreteCopyNumberData|Mutation)[], filterString:string, filterStringUpper:string)=>{
                return d[0].gene.hugoGeneSymbol.indexOf(filterStringUpper) > -1;
            },
            download: (d:(DiscreteCopyNumberData|Mutation)[])=>d[0].gene.hugoGeneSymbol,
            sortBy: (d:(DiscreteCopyNumberData|Mutation)[])=>d[0].gene.hugoGeneSymbol,
            visible: true,
            order: 30
        });

        columns.push({
            name: "Alteration Type",
            render:(d:(DiscreteCopyNumberData|Mutation)[])=> {
                if (d && d[0].hasOwnProperty("mutationType")) {
                    return MutationTypeColumnFormatter.renderLongNameFunction(d as Mutation[]);
                } else {
                    return <span><b>Copy Number Change</b></span>;
                }
            },
            download:MutationTypeColumnFormatter.getTextValue,
            // TODO: implement sortBy and filter
            sortBy:(d:Mutation[])=>MutationTypeColumnFormatter.getDisplayValue(d),
            filter:(d:Mutation[], filterString:string, filterStringUpper:string) =>
                MutationTypeColumnFormatter.getDisplayValue(d).toUpperCase().indexOf(filterStringUpper) > -1,
            visible: true,
            order: 40
        });


        columns.push({
            name: "Alteration",
            render:(d:(DiscreteCopyNumberData|Mutation)[])=> {
                if (d && d[0].hasOwnProperty("mutationType")) {
                    return ProteinChangeColumnFormatter.renderWithMutationStatus(d as Mutation[]);
                } else {
                    return CnaColumnFormatter.renderFunction(d as DiscreteCopyNumberData[]);
                }
            },
            download: ProteinChangeColumnFormatter.getTextValue,
            sortBy:(d:Mutation[])=>ProteinChangeColumnFormatter.getSortValue(d),
            /*filter: (d:Mutation[], filterString:string, filterStringUpper:string) =>
                ProteinChangeColumnFormatter.getTextValue(d).toUpperCase().indexOf(filterStringUpper) > -1,*/
            visible: true,
            order: 50
        });

        columns.push({
            name: "Interpretation",
            render:(d:(DiscreteCopyNumberData|Mutation)[])=> {
                if (d && d[0].hasOwnProperty("mutationType")) {
                    return MutationAnnotationColumnFormatter.renderInterpretationFunction(
                        d as Mutation[], {
                            hotspotData: this.props.hotspotData,
                            myCancerGenomeData: this.props.myCancerGenomeData,
                            oncoKbData: this.props.oncoKbData,
                            oncoKbEvidenceCache: this.props.oncoKbEvidenceCache,
                            oncoKbAnnotatedGenes: this.props.oncoKbAnnotatedGenes,
                            pubMedCache: this.props.pubMedCache,
                            civicGenes: this.props.civicGenes,
                            civicVariants: this.props.civicVariants,
                            enableCivic: this.props.enableCivic as boolean,
                            enableOncoKb: this.props.enableOncoKb as boolean,
                            enableMyCancerGenome: this.props.enableMyCancerGenome as boolean,
                            enableHotspot: this.props.enableHotspot as boolean,
                            userEmailAddress: this.props.userEmailAddress
                        }
                    );
                } else {
                    return CNAAnnotationColumnFormatter.renderInterpretationFunction(
                        d as DiscreteCopyNumberData[], {
                            oncoKbData: this.props.cnaOncoKbData,
                            oncoKbEvidenceCache: this.props.oncoKbEvidenceCache,
                            oncoKbAnnotatedGenes: this.props.oncoKbAnnotatedGenes,
                            enableOncoKb: this.props.enableOncoKb as boolean,
                            pubMedCache: this.props.pubMedCache,
                            civicGenes: this.props.cnaCivicGenes,
                            civicVariants: this.props.cnaCivicVariants,
                            enableCivic: this.props.enableCivic as boolean,
                            enableMyCancerGenome: false,
                            enableHotspot: false,
                            userEmailAddress: this.props.userEmailAddress
                        }
                    );
                }
            },
            visible: true,
            order: 60
        });

        columns.push({
            name: "Annotation",
            render:(d:(DiscreteCopyNumberData|Mutation)[])=> {
                if (d && d[0].hasOwnProperty("mutationType")) {
                    return MutationAnnotationColumnFormatter.renderFunction(
                        d as Mutation[], {
                            hotspotData: this.props.hotspotData,
                            myCancerGenomeData: this.props.myCancerGenomeData,
                            oncoKbData: this.props.oncoKbData,
                            oncoKbEvidenceCache: this.props.oncoKbEvidenceCache,
                            oncoKbAnnotatedGenes: this.props.oncoKbAnnotatedGenes,
                            pubMedCache: this.props.pubMedCache,
                            civicGenes: this.props.civicGenes,
                            civicVariants: this.props.civicVariants,
                            enableCivic: this.props.enableCivic as boolean,
                            enableOncoKb: this.props.enableOncoKb as boolean,
                            enableMyCancerGenome: this.props.enableMyCancerGenome as boolean,
                            enableHotspot: this.props.enableHotspot as boolean,
                            userEmailAddress: this.props.userEmailAddress
                        }
                    );
                } else {
                    return CNAAnnotationColumnFormatter.renderFunction(
                        d as DiscreteCopyNumberData[], {
                            oncoKbData: this.props.cnaOncoKbData,
                            oncoKbEvidenceCache: this.props.oncoKbEvidenceCache,
                            oncoKbAnnotatedGenes: this.props.oncoKbAnnotatedGenes,
                            enableOncoKb: this.props.enableOncoKb as boolean,
                            pubMedCache: this.props.pubMedCache,
                            civicGenes: this.props.cnaCivicGenes,
                            civicVariants: this.props.cnaCivicVariants,
                            enableCivic: this.props.enableCivic as boolean,
                            enableMyCancerGenome: false,
                            enableHotspot: false,
                            userEmailAddress: this.props.userEmailAddress
                        }
                    );
                }
            },
            sortBy:(d:(Mutation|DiscreteCopyNumberData)[])=>{
                if (d && d[0].hasOwnProperty("mutationType")) {
                    return MutationAnnotationColumnFormatter.sortValue(
                        d as Mutation[],
                        this.props.oncoKbAnnotatedGenes,
                        this.props.hotspotData,
                        this.props.myCancerGenomeData,
                        this.props.oncoKbData,
                        this.props.civicGenes,
                        this.props.civicVariants
                    );
                } else {
                    return CNAAnnotationColumnFormatter.sortValue(
                        d as DiscreteCopyNumberData[],
                        this.props.oncoKbAnnotatedGenes,
                        this.props.cnaOncoKbData,
                        this.props.cnaCivicGenes,
                        this.props.cnaCivicVariants
                    );
                }
            },
            visible: true,
            order: 70
        });

        /*
        columns.push({
            name: "CNA",
            render: CnaColumnFormatter.renderFunction,
            filter: (d:DiscreteCopyNumberData[], filterString:string, filterStringUpper:string)=>{
                return CnaColumnFormatter.displayText(d).toUpperCase().indexOf(filterStringUpper) > -1;
            },
            download: CnaColumnFormatter.download,
            sortBy: CnaColumnFormatter.sortValue,
            visible: true,
            order: 40
        });

        columns.push({
            name: "Annotation",
            render: (d:DiscreteCopyNumberData[]) => (AnnotationColumnFormatter.renderFunction(d, {
                oncoKbData: this.props.cnaOncoKbData,
                oncoKbEvidenceCache: this.props.oncoKbEvidenceCache,
                oncoKbAnnotatedGenes: this.props.oncoKbAnnotatedGenes,
                enableOncoKb: this.props.enableOncoKb as boolean,
                pubMedCache: this.props.pubMedCache,
                civicGenes: this.props.cnaCivicGenes,
                civicVariants: this.props.cnaCivicVariants,
                enableCivic: this.props.enableCivic as boolean,
                enableMyCancerGenome: false,
                enableHotspot: false,
                userEmailAddress: this.props.userEmailAddress
            })),
            sortBy:(d:DiscreteCopyNumberData[])=>{
                return AnnotationColumnFormatter.sortValue(d,
                    this.props.oncoKbAnnotatedGenes, this.props.cnaOncoKbData, this.props.cnaCivicGenes, this.props.cnaCivicVariants);
            },
            order: 50
        });

        columns.push({
            name: "Cytoband",
            render: (d:DiscreteCopyNumberData[])=><span>{d[0].gene.cytoband}</span>,
            download: (d:DiscreteCopyNumberData[])=>d[0].gene.cytoband,
            sortBy: (d:DiscreteCopyNumberData[])=>d[0].gene.cytoband,
            visible: true,
            order: 60
        });

        columns.push({
            name:"Cohort",
            render:(d:DiscreteCopyNumberData[])=>(this.props.copyNumberCountCache
                ? CohortColumnFormatter.renderFunction(d,
                    this.props.copyNumberCountCache,
                    this.props.gisticData)
                : (<span/>)),
            sortBy:(d:DiscreteCopyNumberData[]) => {
                if (this.props.copyNumberCountCache) {
                    return CohortColumnFormatter.getSortValue(d, this.props.copyNumberCountCache);
                } else {
                    return 0;
                }
            },
            tooltip: (<span>Alteration frequency in cohort</span>),
            defaultSortDirection: "desc",
            order: 80
        });

        if ((numSamples === 1) && this.props.mrnaExprRankMolecularProfileId) {
            columns.push({
                name: "mRNA Expr.",
                render: (d:DiscreteCopyNumberData[])=>(this.props.mrnaExprRankCache
                                    ? MrnaExprColumnFormatter.cnaRenderFunction(d, this.props.mrnaExprRankCache)
                                    : (<span/>)),
                order: 70
            });
        }
        */

        const orderedColumns = _.sortBy(columns, (c:GeneticAlterationTableColumn)=>c.order);
        return (
            <div>
            {
                (this.props.status === "unavailable") && (
                    <div className="alert alert-info" role="alert">Genetic Alterations information is not available.</div>
                )
            }

            {
                (this.props.status === "available") && (
                    <GeneticAlterationTableComponent
                        columns={orderedColumns}
                        data={this.props.data}
                        initialSortColumn="Annotation"
                        initialSortDirection="desc"
                        initialItemsPerPage={0}
                        itemsLabel="Genetic Alteration"
                        itemsLabelPlural="Genetic Alterations"
                        showCountHeader={false}
                        showColumnVisibility={false}
                        showPagination={false}
                        showFilter={false}
                        showCopyDownload={false}
                    />
                )
            }
            </div>
        );
    }
}