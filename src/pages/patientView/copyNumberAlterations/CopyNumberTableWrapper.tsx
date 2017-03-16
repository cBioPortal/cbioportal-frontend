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
import {numberSort} from "shared/lib/SortUtils";


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
            download: (d:DiscreteCopyNumberData)=>d.gene.hugoGeneSymbol,
            sort: (d1:DiscreteCopyNumberData, d2:DiscreteCopyNumberData, ascending:boolean)=>0,
            visible: true,
            order: 50
        });

        columns.push({
            name: "Cytoband",
            render: (d:DiscreteCopyNumberData)=><span>{d.gene.cytoband}</span>,
            download: (d:DiscreteCopyNumberData)=>d.gene.cytoband,
            sort: (d1:DiscreteCopyNumberData, d2:DiscreteCopyNumberData, ascending:boolean)=>0,
            visible: true,
            order: 60
        });

        columns.push({
            name:"Cohort",
            render:(d:DiscreteCopyNumberData)=>(this.props.store.copyNumberCountData.result
                ? CohortColumnFormatter.renderFunction(d, this.props.store.copyNumberCountData.result)
                : (<span></span>)),
            sort:(d1:DiscreteCopyNumberData, d2:DiscreteCopyNumberData, ascending:boolean)=>{
                if (this.props.store.copyNumberCountData.result) {
                    const sortValue1 = CohortColumnFormatter.getSortValue(d1, this.props.store.copyNumberCountData.result);
                    const sortValue2 = CohortColumnFormatter.getSortValue(d2, this.props.store.copyNumberCountData.result);
                    return numberSort(sortValue1, sortValue2, ascending);
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
                    isHidden={this.props.store.geneticProfileIdDiscrete.isComplete && this.props.store.geneticProfileIdDiscrete.result === undefined}
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
                    <CNATableComponent columns={orderedColumns} data={this.props.store.discreteCNAData.result} />
                )
            }
            </div>
        );
    }
}




