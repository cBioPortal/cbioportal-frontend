import React from "react";
import { IndicatorQueryResp, Query } from "shared/api/generated/OncoKbAPI";
import OncoKB from "shared/components/annotation/OncoKB";
import { IAnnotation } from "shared/components/mutationTable/column/AnnotationColumnFormatter";
import OncoKbEvidenceCache from "shared/cache/OncoKbEvidenceCache";
import OncokbPubMedCache from "shared/cache/PubMedCache";

export type IDrugInfoProps = {
    indicator?: IndicatorQueryResp;
    annotation: IAnnotation;
    evidenceCache?: OncoKbEvidenceCache;
    evidenceQuery?: Query;
    pubMedCache?: OncokbPubMedCache;
    userEmailAddress?:string;
};

export default class DrugInfo extends React.Component<IDrugInfoProps, {}> {

    render() {
        if (this.props.indicator) {
            return (
                <div style={{padding:20,textAlign:"center", fontSize:"large"}}>
                    <div style={{width:300,margin:"0 auto",textAlign:"center"}}>
                        <OncoKB
                            hugoGeneSymbol={this.props.annotation.hugoGeneSymbol}
                            geneNotExist={!this.props.annotation.oncoKbGeneExist}
                            status={this.props.annotation.oncoKbStatus}
                            indicator={this.props.annotation.oncoKbIndicator}
                            evidenceCache={this.props.evidenceCache}
                            evidenceQuery={this.props.evidenceQuery}
                            pubMedCache={this.props.pubMedCache}
                            userEmailAddress={this.props.userEmailAddress}
                        />
                    <b>{this.props.indicator.query.hugoSymbol}</b> {this.props.indicator.query.alteration} {this.props.indicator.treatments[0].drugs[0].drugName}
                    </div>
                </div>
            );
        } else {
            return null;
        }
    }
}