import * as React from 'react';
import {observer} from "mobx-react";
import OncoKbEvidenceCache from "shared/cache/OncoKbEvidenceCache";
import OncokbPubMedCache from "shared/cache/PubMedCache";
import {ICacheData, ICache} from "shared/lib/SimpleCache";
import {IndicatorQueryResp, Query} from "shared/api/generated/OncoKbAPI";
import {IEvidence} from "shared/model/OncoKB";
import {
    generateTreatments, generateOncogenicCitations, generateMutationEffectCitations, extractPmids
} from "shared/lib/OncoKbUtils";
import {default as TableCellStatusIndicator, TableCellStatus} from "shared/components/TableCellStatus";
import MolecularMatchCard from "./MolecularMatchCard";

export interface IOncoKbTooltipProps {
    count?: number;
    trials?: any[];
    // handleFeedbackOpen?: () => void;
    onLoadComplete?: () => void;
}


@observer
export default class MolecularMatchTooltip extends React.Component<IOncoKbTooltipProps, {}>
{
    // public get evidenceCacheData():ICacheData<IEvidence>|undefined
    // {
    //     let cacheData:ICacheData<IEvidence>|undefined;
    //
    //     if (this.props.evidenceCache && this.props.evidenceQuery)
    //     {
    //         const cache = this.props.evidenceCache.getData([this.props.evidenceQuery.id], [this.props.evidenceQuery]);
    //
    //         if (cache) {
    //             cacheData = cache[this.props.evidenceQuery.id];
    //         }
    //     }
    //
    //     return cacheData;
    // }

    // public get pmidData():ICache<any>
    // {
    //     if (this.props.pubMedCache && this.evidenceCacheData)
    //     {
    //         const refs = extractPmids(this.evidenceCacheData.data);
    //
    //         for (const ref of refs) {
    //             this.props.pubMedCache.get(ref);
    //         }
    //     }
    //
    //     return (this.props.pubMedCache && this.props.pubMedCache.cache) || {};
    // }

    public render()
    {
        let tooltipContent: JSX.Element = <span />;
        // const cacheData:ICacheData<IEvidence>|undefined = this.evidenceCacheData;

        // if (this.props.count === null || this.props.trials === null)
        // {
        //     console.log("not displaying card" + !this.props.count +" and " +this.props.trials);
        //     return tooltipContent;
        // }

        if (this.props.trials !== null)
        {
            console.log("displaying card");

            tooltipContent = (
                <MolecularMatchCard
                    count={this.props.count}
                    trials={this.props.trials}
                />
            );
        }
        else if (this.props.trials == undefined) {
            tooltipContent = <TableCellStatusIndicator status={TableCellStatus.LOADING} />;
        }
        else if (this.props.trials === null) {
            tooltipContent = <TableCellStatusIndicator status={TableCellStatus.ERROR} />;
        }
        // else if (cacheData.status === 'pending') {
        //     tooltipContent = <TableCellStatusIndicator status={TableCellStatus.LOADING} />;
        // }
        // else if (cacheData.status === 'error') {
        //     tooltipContent = <TableCellStatusIndicator status={TableCellStatus.ERROR} />;
        // }

        return tooltipContent;
    }

    public componentDidUpdate()
    {
        if (this.props.count  &&
            this.props.trials &&
            this.props.onLoadComplete)
        {
            this.props.onLoadComplete();
        }
    }
}
