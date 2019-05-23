import _ from "lodash";
import {generateQueryVariantId} from "cbioportal-frontend-commons";

import {Mutation} from "../model/Mutation";
import {IndicatorQueryResp, IOncoKbData} from "../model/OncoKb";

export function groupOncoKbIndicatorDataByMutations(mutationsByPosition: {[pos: number]: Mutation[]},
                                                    oncoKbData: IOncoKbData,
                                                    getTumorType: (mutation: Mutation) => string,
                                                    getEntrezGeneId: (mutation: Mutation) => number,
                                                    filter?: (indicator: IndicatorQueryResp) => boolean): {[pos: number]: IndicatorQueryResp[]}
{
    const indicatorMap: {[pos: number]: IndicatorQueryResp[]} = {};

    _.keys(mutationsByPosition).forEach(key => {
        const position = Number(key);
        const indicators: IndicatorQueryResp[] = mutationsByPosition[position]
            .map(mutation => getIndicatorData(mutation, oncoKbData, getTumorType, getEntrezGeneId))
            .filter(indicator =>
                indicator !== undefined && (!filter || filter(indicator))) as IndicatorQueryResp[];

        if (position > 0 && indicators.length > 0) {
            indicatorMap[position] = indicators;
        }
    });

    return indicatorMap;
}

export function getIndicatorData(mutation: Mutation,
                                 oncoKbData: IOncoKbData,
                                 getTumorType: (mutation: Mutation) => string,
                                 getEntrezGeneId: (mutation: Mutation) => number): IndicatorQueryResp|undefined
{
    if (oncoKbData.indicatorMap === null) {
        return undefined;
    }

    const id = generateQueryVariantId(getEntrezGeneId(mutation),
        getTumorType(mutation),
        mutation.proteinChange,
        mutation.mutationType);

    return oncoKbData.indicatorMap[id];
}

export function defaultOncoKbIndicatorFilter(indicator: IndicatorQueryResp) {
    return indicator.oncogenic.toLowerCase().trim().includes("oncogenic");
}

export function defaultOncoKbFilter(mutation: Mutation,
                                    oncoKbData?: IOncoKbData,
                                    getTumorType?: (mutation: Mutation) => string,
                                    getEntrezGeneId?: (mutation: Mutation) => number): boolean
{
    let filter = true;

    if (oncoKbData && getTumorType && getEntrezGeneId) {
        const indicatorData = getIndicatorData(mutation, oncoKbData, getTumorType, getEntrezGeneId);
        filter = indicatorData ? defaultOncoKbIndicatorFilter(indicatorData) : false;
    }

    return filter;
}
