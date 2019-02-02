import * as React from "react";
import * as _ from "lodash";

import {Mutation} from "shared/api/generated/CBioPortalAPI";
import {IndicatorQueryResp} from "shared/api/generated/OncoKbAPI";
import {IOncoKbData} from "shared/model/OncoKB";
import OncoKbSummaryTable from "./OncoKbSummaryTable";

type OncoKbTrackTooltipProps = {
    mutations: Mutation[];
    oncoKbData?: IOncoKbData;
    indicatorData?: IndicatorQueryResp[];
    hugoGeneSymbol?: string;
};

export function oncoKbTooltip(mutations: Mutation[], indicatorData: IndicatorQueryResp[])
{
    const sampleCount = indicatorData.length;

    // generate info

    const pluralSuffix = sampleCount > 1 ? "s" : undefined;
    const groupedByImplication = _.groupBy(indicatorData, "oncogenic");
    const oncogenicKeywords = _.keys(groupedByImplication).map(keyword => <b>{keyword}</b>);
    let oncogenicInfo: (JSX.Element|string)[] = [];

    if (oncogenicKeywords.length > 1) {
        // join all except the last one with ','
        const joined = oncogenicKeywords
            .slice(0, oncogenicKeywords.length - 1)
            .reduce((prev: JSX.Element, curr: JSX.Element): any => [prev, ", ", curr]);

        oncogenicInfo.push(joined);

        // add the last one after "and"
        oncogenicInfo.push(" and ");
        oncogenicInfo.push(oncogenicKeywords[oncogenicKeywords.length - 1]);
    }
    else {
        // use oncogenic keywords array as is
        oncogenicInfo = oncogenicKeywords;
    }

    const groupedByProteinChange = _.groupBy(indicatorData, d => d.query.alteration);
    const tableData = _.keys(groupedByProteinChange).map(proteinChange => ({
        count: groupedByProteinChange[proteinChange].length,
        proteinChange: proteinChange,
        clinicalImplication: _.uniq(groupedByProteinChange[proteinChange]
            .map(indicator => indicator.oncogenic ? indicator.oncogenic : "Unknown"))
            .join(", "),
        biologicalEffect: _.uniq(groupedByProteinChange[proteinChange]
            .map(indicator => indicator.mutationEffect && indicator.mutationEffect.knownEffect ?
                indicator.mutationEffect.knownEffect : "Unknown"))
            .join(", ")
    }));

    // generate the tooltip

    return (
        <span>
            <b>{sampleCount}</b> sample{pluralSuffix} with {oncogenicInfo} mutations.
            <OncoKbSummaryTable data={tableData} />
        </span>
    );
}

export default class OncoKbTrackTooltip extends React.Component<OncoKbTrackTooltipProps, {}>
{
    public render() {

        return this.props.indicatorData ?
            oncoKbTooltip(this.props.mutations, this.props.indicatorData) : null;
    }
}