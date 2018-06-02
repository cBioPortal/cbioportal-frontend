import * as React from 'react';
import {observer} from "mobx-react";
import * as _ from 'lodash';
import LazyMobXTable from "shared/components/lazyMobXTable/LazyMobXTable";
import {DiscreteCopyNumberData} from "shared/api/generated/CBioPortalAPI";
import {Column} from "shared/components/lazyMobXTable/LazyMobXTable";
import MrnaExprColumnFormatter from "shared/components/mutationTable/column/MrnaExprColumnFormatter";
import {IColumnVisibilityControlsProps} from "shared/components/columnVisibilityControls/ColumnVisibilityControls";
import CohortColumnFormatter from "./column/CohortColumnFormatter";
import CnaColumnFormatter from "./column/CnaColumnFormatter";
import AnnotationColumnFormatter from "./column/AnnotationColumnFormatter";
import TumorColumnFormatter from "../mutation/column/TumorColumnFormatter";
import SampleManager from "../sampleManager";
import {IOncoKbDataWrapper} from "shared/model/OncoKB";
import OncoKbEvidenceCache from "shared/cache/OncoKbEvidenceCache";
import PubMedCache from "shared/cache/PubMedCache";
import MrnaExprRankCache from "shared/cache/MrnaExprRankCache";
import {IGisticData} from "shared/model/Gistic";
import CopyNumberCountCache from "../clinicalInformation/CopyNumberCountCache";
import {ICivicGeneDataWrapper, ICivicVariantDataWrapper} from "shared/model/Civic.ts";

class CNATableComponent extends LazyMobXTable<DiscreteCopyNumberData[]> {

}

type CNATableColumn = Column<DiscreteCopyNumberData[]>&{order:number};

type ICopyNumberTableWrapperProps = {
    sampleIds:string[];
    sampleManager:SampleManager|null;
    cnaOncoKbData?: IOncoKbDataWrapper;
    cnaCivicGenes?: ICivicGeneDataWrapper;
    cnaCivicVariants?: ICivicVariantDataWrapper;
    oncoKbEvidenceCache?:OncoKbEvidenceCache;
    oncoKbAnnotatedGenes:{[entrezGeneId:number]:boolean}|Error;
    enableOncoKb?:boolean;
    enableCivic?:boolean;
    pubMedCache?:PubMedCache;
    data:DiscreteCopyNumberData[][];
    copyNumberCountCache?:CopyNumberCountCache;
    mrnaExprRankCache?:MrnaExprRankCache;
    gisticData:IGisticData;
    userEmailAddress?:string;
    mrnaExprRankMolecularProfileId?:string;
    columnVisibility?: {[columnId: string]: boolean};
    columnVisibilityProps?: IColumnVisibilityControlsProps;
    status:"loading"|"available"|"unavailable";
};


@observer
export default class CopyNumberTableWrapper extends React.Component<ICopyNumberTableWrapperProps, {}> {

    public static defaultProps = {
        enableOncoKb: true,
        enableCivic: false
    };

    render() {
        const columns: CNATableColumn[] = [];
        const numSamples = this.props.sampleIds.length;

        if (numSamples >= 2) {
            columns.push({
                name: "Tumors",
                render:(d:DiscreteCopyNumberData[])=>TumorColumnFormatter.renderFunction(d, this.props.sampleManager),
                sortBy:(d:DiscreteCopyNumberData[])=>TumorColumnFormatter.getSortValue(d, this.props.sampleManager),
                download: (d:DiscreteCopyNumberData[])=>TumorColumnFormatter.getSample(d),
                order: 20
            });
        }

        columns.push({
            name: "Gene",
            render: (d:DiscreteCopyNumberData[])=><span>{d[0].gene.hugoGeneSymbol}</span>,
            filter: (d:DiscreteCopyNumberData[], filterString:string, filterStringUpper:string)=>{
                return d[0].gene.hugoGeneSymbol.indexOf(filterStringUpper) > -1;
            },
            download: (d:DiscreteCopyNumberData[])=>d[0].gene.hugoGeneSymbol,
            sortBy: (d:DiscreteCopyNumberData[])=>d[0].gene.hugoGeneSymbol,
            visible: true,
            order: 30
        });

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

        const orderedColumns = _.sortBy(columns, (c:CNATableColumn)=>c.order);
        return (
            <div>
            {
                (this.props.status === "unavailable") && (
                    <div className="alert alert-info" role="alert">Copy Number Alterations are not available.</div>
                )
            }

            {
                (this.props.status === "available") && (
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
                )
            }
            </div>
        );
    }
}




