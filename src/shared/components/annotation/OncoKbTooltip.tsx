import * as React from 'react';
import OncoKbCard from "./OncoKbCard";
import {observer} from "mobx-react";
import OncoKbEvidenceCache from "pages/patientView/OncoKbEvidenceCache";
import OncokbPmidCache from "pages/patientView/PmidCache";
import {ICacheData, ICache} from "shared/lib/SimpleCache";
import {IndicatorQueryResp, Query} from "shared/api/generated/OncoKbAPI";
import {IEvidence} from "shared/model/OncoKB";
import {
    generateTreatments, generateOncogenicCitations, generateMutationEffectCitations, extractPmids
} from "shared/lib/OncoKbUtils";
import {default as TableCellStatusIndicator, TableCellStatus} from "shared/components/TableCellStatus";

export interface IOncoKbTooltipProps {
    indicator?: IndicatorQueryResp;
    evidenceCache?: OncoKbEvidenceCache;
    evidenceQuery?: Query;
    pmidCache?: OncokbPmidCache;
    handleFeedbackOpen?: () => void;
    onLoadComplete?: () => void;
}

/**
 * @author Selcuk Onur Sumer
 */
@observer
export default class OncoKbTooltip extends React.Component<IOncoKbTooltipProps, {}>
{
    public get evidenceCacheData():ICacheData<IEvidence>|undefined
    {
        let cacheData:ICacheData<IEvidence>|undefined;

        if (this.props.evidenceCache && this.props.evidenceQuery)
        {
            const cache = this.props.evidenceCache.getData([this.props.evidenceQuery.id], [this.props.evidenceQuery]);

            if (cache) {
                cacheData = cache[this.props.evidenceQuery.id];
            }
        }

        return cacheData;
    }

    public get pmidData():ICache<any>
    {
        let pmidData: ICache<any> = {};

        if (this.props.pmidCache && this.evidenceCacheData)
        {
            const refs = extractPmids(this.evidenceCacheData.data);

            if (refs.length > 0) {
                pmidData = this.props.pmidCache.getData(refs.map((ref:number) => ref.toString()), refs);
            }
        }

        return pmidData;
    }

    public render()
    {
        let tooltipContent: JSX.Element = <span />;
        const cacheData:ICacheData<IEvidence>|undefined = this.evidenceCacheData;

        if (!cacheData || !this.props.indicator)
        {
            return tooltipContent;
        }

        if (cacheData.status === 'complete' && cacheData.data)
        {
            const evidence = cacheData.data;
            const pmidData: ICache<any> = this.pmidData;

            tooltipContent = (
                <OncoKbCard
                    title={`${this.props.indicator.query.hugoSymbol} ${this.props.indicator.query.alteration} in ${this.props.indicator.query.tumorType}`}
                    gene={this.props.indicator.geneExist ? this.props.indicator.query.hugoSymbol : ''}
                    oncogenicity={this.props.indicator.oncogenic}
                    oncogenicityPmids={generateOncogenicCitations(evidence.oncogenicRefs)}
                    mutationEffect={evidence.mutationEffect.knownEffect}
                    mutationEffectPmids={generateMutationEffectCitations(evidence.mutationEffect.refs)}
                    geneSummary={this.props.indicator.geneSummary}
                    variantSummary={this.props.indicator.variantSummary}
                    tumorTypeSummary={this.props.indicator.tumorTypeSummary}
                    biologicalSummary={evidence.mutationEffect.description}
                    treatments={generateTreatments(evidence.treatments)}
                    pmidData={pmidData}
                    handleFeedbackOpen={this.props.handleFeedbackOpen}
                />
            );
        }
        else if (cacheData.status === 'pending') {
            tooltipContent = <TableCellStatusIndicator status={TableCellStatus.LOADING} />;
        }
        else if (cacheData.status === 'error') {
            tooltipContent = <TableCellStatusIndicator status={TableCellStatus.ERROR} />;
        }

        return tooltipContent;
    }

    public componentDidUpdate()
    {
        if (this.evidenceCacheData &&
            this.evidenceCacheData.status === 'complete' &&
            this.evidenceCacheData.data &&
            this.props.onLoadComplete)
        {
            this.props.onLoadComplete();
        }
    }
}
