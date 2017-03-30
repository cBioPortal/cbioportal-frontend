import * as React from 'react';
import FeatureTitle from "shared/components/featureTitle/FeatureTitle";
import {PatientViewPageStore} from "../clinicalInformation/PatientViewPageStore";
import {observer} from "mobx-react";
import MSKTable from "shared/components/msktable/MSKTable";
import {DiscreteCopyNumberData} from "shared/api/generated/CBioPortalAPI";
import {Column} from "shared/components/msktable/MSKTable";
import * as _ from 'lodash';
import MrnaExprColumnFormatter from "../mutation/column/MrnaExprColumnFormatter";
import CohortColumnFormatter from "./column/CohortColumnFormatter";
import CnaColumnFormatter from "./column/CnaColumnFormatter";
import AnnotationColumnFormatter from "./column/AnnotationColumnFormatter";


class CNATableComponent extends MSKTable<DiscreteCopyNumberData> {

}

type CNATableColumn = Column<DiscreteCopyNumberData>&{order:number};


@observer
export default class CopyNumberTableWrapper extends React.Component<{ store:PatientViewPageStore }, {}> {

    render() {
        const columns: CNATableColumn[] = [];

        columns.push({
            name: "Gene",
            render: (d:DiscreteCopyNumberData)=><span>{d.gene.hugoGeneSymbol}</span>,
            filter: (d:DiscreteCopyNumberData, filterString:string, filterStringUpper:string)=>{
                return d.gene.hugoGeneSymbol.indexOf(filterStringUpper) > -1;
            },
            download: (d:DiscreteCopyNumberData)=>d.gene.hugoGeneSymbol,
            sortBy: (d:DiscreteCopyNumberData)=>d.gene.hugoGeneSymbol,
            visible: true,
            order: 30
        });

        columns.push({
            name: "CNA",
            render: CnaColumnFormatter.renderFunction,
            filter: (d:DiscreteCopyNumberData, filterString:string, filterStringUpper:string)=>{
                return CnaColumnFormatter.displayText(d).toUpperCase().indexOf(filterStringUpper) > -1;
            },
            download: CnaColumnFormatter.download,
            sortBy: CnaColumnFormatter.sortValue,
            visible: true,
            order: 40
        });

        columns.push({
            name: "Annotation",
            render: (d:DiscreteCopyNumberData) => (AnnotationColumnFormatter.renderFunction(d, {
                oncoKbData: this.props.store.cnaOncoKbData.result,
                pmidData: this.props.store.pmidData.result,
                enableOncoKb: true,
                enableMyCancerGenome: false,
                enableHotspot: false
            })),
            sortBy:(d:DiscreteCopyNumberData)=>{
                return AnnotationColumnFormatter.sortValue(d,
                    this.props.store.cnaOncoKbData.result, this.props.store.pmidData.result);
            },
            order: 50
        });

        columns.push({
            name: "Cytoband",
            render: (d:DiscreteCopyNumberData)=><span>{d.gene.cytoband}</span>,
            download: (d:DiscreteCopyNumberData)=>d.gene.cytoband,
            sortBy: (d:DiscreteCopyNumberData)=>d.gene.cytoband,
            visible: true,
            order: 60
        });

        columns.push({
            name:"Cohort",
            render:(d:DiscreteCopyNumberData)=>(this.props.store.copyNumberCountCache
                ? CohortColumnFormatter.renderFunction(d,
                    this.props.store.copyNumberCountCache,
                    this.props.store.gisticData.result)
                : (<span></span>)),
            sortBy:(d:DiscreteCopyNumberData) => {
                if (this.props.store.copyNumberCountCache) {
                    return CohortColumnFormatter.getSortValue(d, this.props.store.copyNumberCountCache);
                } else {
                    return 0;
                }
            },
            tooltip: (<span>Alteration frequency in cohort</span>),
            order: 80
        });

        columns.push({
            name: "mRNA Expr.",
            render: (d:DiscreteCopyNumberData)=>(this.props.store.mrnaExprRankCache
                                ? MrnaExprColumnFormatter.cnaRenderFunction(d, this.props.store.mrnaExprRankCache)
                                : (<span></span>)),
            order: 70
        });

        const orderedColumns = _.sortBy(columns, (c:CNATableColumn)=>c.order);

        return (
            <div>
                <FeatureTitle
                    title="Copy Number Alterations"
                    isLoading={this.props.store.discreteCNAData.isPending}
                />

            {
                (this.props.store.geneticProfileIdDiscrete.isComplete && this.props.store.geneticProfileIdDiscrete.result === undefined) && (
                    <div className="alert alert-info" role="alert">Copy Number Alterations are not available.</div>
                )
            }

            {
                (this.props.store.geneticProfileIdDiscrete.isComplete
                    && this.props.store.geneticProfileIdDiscrete.result
                    && this.props.store.discreteCNAData.isComplete
                ) && (
                    <CNATableComponent
                        columns={orderedColumns}
                        data={this.props.store.discreteCNAData.result}
                        initialItemsPerPage={25}
                    />
                )
            }
            </div>
        );
    }
}




