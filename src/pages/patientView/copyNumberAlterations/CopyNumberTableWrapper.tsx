import * as React from 'react';
import FeatureTitle from "../../../shared/components/featureTitle/FeatureTitle";
import {PatientViewPageStore} from "../clinicalInformation/PatientViewPageStore";
import CopyNumberAlterationsTable from "./CopyNumberAlterationsTable";
import {observer} from "mobx-react";
import MSKTable from "../../../shared/components/msktable/MSKTable";
import {DiscreteCopyNumberData} from "../../../shared/api/generated/CBioPortalAPI";
import {Column} from "../../../shared/components/msktable/MSKTable";
import * as _ from 'lodash';


class CNATableComponent extends MSKTable<DiscreteCopyNumberData> {

}

type CNATableColumn = Column<DiscreteCopyNumberData>&{order:number};


@observer
export default class CopyNumberTableWrapper extends React.Component<{ store:PatientViewPageStore }, {}> {

    render(){

        let columns: CNATableColumn[] = [];

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

        let orderedColumns = _.sortBy(columns, (c:CNATableColumn)=>c.order);


        return (
            <div>

                <FeatureTitle title="Copy Number Alterations"
                              isHidden={ this.props.store.geneticProfileIdDiscrete.isComplete && this.props.store.geneticProfileIdDiscrete.result === undefined }
                              isLoading={ this.props.store.discreteCNAData.isPending } />


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

                    <CNATableComponent columns={columns} data={this.props.store.discreteCNAData.result} />

                )
            }
            </div>
        )

    }

}




