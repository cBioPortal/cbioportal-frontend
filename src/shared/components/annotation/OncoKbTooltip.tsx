import * as React from 'react';
import OncoKbCard from "./OncoKbCard";
import {observer} from "mobx-react";
import OncoKbEvidenceCache from "shared/cache/OncoKbEvidenceCache";
import OncokbPubMedCache from "shared/cache/PubMedCache";
import {ICache, ICacheData} from "shared/lib/SimpleCache";
import {IndicatorQueryResp, Query} from "shared/api/generated/OncoKbAPI";
import {IEvidence} from "shared/model/OncoKB";
import {extractPmids, generateOncogenicCitations, generateTreatments} from "shared/lib/OncoKbUtils";
import {default as TableCellStatusIndicator, TableCellStatus} from "shared/components/TableCellStatus";

export interface IOncoKbTooltipProps {
    indicator?: IndicatorQueryResp;
    evidenceCache?: OncoKbEvidenceCache;
    evidenceQuery?: Query;
    pubMedCache?: OncokbPubMedCache;
    handleFeedbackOpen?: () => void;
    onLoadComplete?: () => void;
    geneNotExist:boolean;
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

        if (!this.props.geneNotExist && this.props.evidenceCache && this.props.evidenceQuery)
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
        if (this.props.pubMedCache && this.evidenceCacheData) {
            let mutationEffectPmids = (this.props.indicator && this.props.indicator.mutationEffect) ?
                this.props.indicator.mutationEffect.citations.pmids.map(pmid => Number(pmid)) : [];
            const refs = extractPmids(this.evidenceCacheData.data).concat(mutationEffectPmids);

            for (const ref of refs) {
                this.props.pubMedCache.get(ref);
            }
        }

        return (this.props.pubMedCache && this.props.pubMedCache.cache) || {};
    }

    public render()
    {
        let tooltipContent: JSX.Element = <span />;
        const cacheData:ICacheData<IEvidence>|undefined = this.evidenceCacheData;

        if (this.props.geneNotExist) {
            tooltipContent = (
                <OncoKbCard
                    geneNotExist={true}
                    pmidData={{}}
                    handleFeedbackOpen={this.props.handleFeedbackOpen}
                />
            );
        }

        if (!cacheData || !this.props.indicator)
        {
            return tooltipContent;
        }

        if (cacheData.status === 'complete' && cacheData.data && !this.props.geneNotExist)
        {
            const evidence = cacheData.data;
            const pmidData: ICache<any> = this.pmidData;
            tooltipContent = (
                <OncoKbCard
                    geneNotExist={this.props.geneNotExist}
                    title={`${this.props.indicator.query.hugoSymbol} ${this.props.indicator.query.alteration} in ${this.props.indicator.query.tumorType}`}
                    gene={this.props.indicator.geneExist ? this.props.indicator.query.hugoSymbol : ''}
                    variant={this.props.indicator.query.alteration ? this.props.indicator.query.alteration : ''}
                    oncogenicity={this.props.indicator.oncogenic}
                    oncogenicityPmids={generateOncogenicCitations(evidence.oncogenicRefs)}
                    mutationEffect={this.props.indicator.mutationEffect ? this.props.indicator.mutationEffect.knownEffect : ''}
                    mutationEffectCitations={this.props.indicator.mutationEffect ? this.props.indicator.mutationEffect.citations : {
                        abstracts: [],
                        pmids: []
                    }}
                    geneSummary={this.props.indicator.geneSummary}
                    variantSummary={this.props.indicator.variantSummary}
                    tumorTypeSummary={this.props.indicator.tumorTypeSummary}
                    biologicalSummary={this.props.indicator.mutationEffect ? this.props.indicator.mutationEffect.description : ''}
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
