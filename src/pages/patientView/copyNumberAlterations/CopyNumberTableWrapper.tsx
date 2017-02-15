import * as React from 'react';
import FeatureTitle from "../../../shared/components/featureTitle/FeatureTitle";
import {PatientViewPageStore} from "../clinicalInformation/PatientViewPageStore";
import CopyNumberAlterationsTable from "./CopyNumberAlterationsTable";
import {observer} from "mobx-react";

@observer
export default class CopyNumberTableWrapper extends React.Component<{ store:PatientViewPageStore }, {}> {

    render(){

        return (
            <div>


            {
                (this.props.store.geneticProfileIdDiscrete.isComplete && this.props.store.geneticProfileIdDiscrete.result === undefined) && (
                    <div className="alert alert-info" role="alert">Copy Number Alterations are not available.</div>
                )
            }

            {/*{*/}
                {/*(this.props.store.geneticProfileIdDiscrete.isComplete*/}
                    {/*&& this.props.store.geneticProfileIdDiscrete.result*/}
                    {/*&& this.props.store.discreteCNAData.isComplete*/}
                {/*) && (*/}
                    {/*<CopyNumberAlterationsTable rawData={this.props.store.discreteCNAData.result} />*/}
                {/*)*/}
            {/*}*/}
            </div>
        )

    }

}




