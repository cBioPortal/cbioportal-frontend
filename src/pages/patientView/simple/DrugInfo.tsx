import React from "react";
import { IndicatorQueryResp } from "shared/api/generated/OncoKbAPI";

export type IDrugInfoProps = {
    indicator?: IndicatorQueryResp;
};

export default class DrugInfo extends React.Component<IDrugInfoProps, {}> {
    render() {
        if (this.props.indicator) {
            return (
                <div style={{paddingLeft:10}}>
                    <b>{this.props.indicator.query.hugoSymbol} - {this.props.indicator.query.alteration}</b>
                </div>
            );
        } else {
            return null;
        }
    }
}