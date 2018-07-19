import React from "react";
import * as _ from "lodash";
import { IndicatorQueryResp, Query, IndicatorQueryTreatment } from "shared/api/generated/OncoKbAPI";
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
                <tr>
                    <td>
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
                    </td>
                    <td><b>{this.props.indicator.query.hugoSymbol}</b></td>
                    <td>{this.props.indicator.query.alteration}</td>
                    <td>{_.uniq(_.flatMap(this.props.indicator.treatments, (x) => x.drugs).map((x) => x.drugName)).join(", ")}</td>
                </tr>
            );
        } else {
            return null;
        }
    }
}