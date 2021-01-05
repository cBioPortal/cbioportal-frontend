import { PfamDomain, PfamDomainRange } from 'genome-nexus-ts-api-client';
import { computed, makeObservable } from 'mobx';
import { observer } from 'mobx-react';
import * as React from 'react';

import { MobxCache } from 'cbioportal-utils';

export interface IDomainTooltipProps {
    mutationAlignerCache?: MobxCache<string>;
    range: PfamDomainRange;
    domain: PfamDomain | undefined;
    pfamDomainId: string;
}

@observer
export default class DomainTooltip extends React.Component<
    IDomainTooltipProps,
    {}
> {
    constructor(props: any) {
        super(props);
        makeObservable(this);
    }
    @computed
    get mutationAlignerCacheData() {
        return this.props.mutationAlignerCache &&
            this.props.mutationAlignerCache.cache
            ? this.props.mutationAlignerCache.cache[this.props.pfamDomainId]
            : null;
    }

    public render(): JSX.Element {
        const { range, domain, pfamDomainId } = this.props;

        const pfamAccession = domain ? domain.pfamAccession : pfamDomainId;

        // if no domain info, then just display the accession
        const domainInfo = domain
            ? `${domain.name}: ${domain.description}`
            : pfamAccession;

        return (
            <div style={{ maxWidth: 200 }}>
                <div>
                    {domainInfo} ({range.pfamDomainStart} -{' '}
                    {range.pfamDomainEnd})
                </div>
                <div>
                    <a
                        style={{ marginRight: '5px' }}
                        href={`http://pfam.xfam.org/family/${pfamAccession}`}
                        target="_blank"
                    >
                        PFAM
                    </a>
                    {this.mutationAlignerLink(pfamAccession)}
                </div>
            </div>
        );
    }

    private mutationAlignerLink(pfamAccession: string): JSX.Element | null {
        if (this.props.mutationAlignerCache) {
            this.props.mutationAlignerCache.get(pfamAccession);
        }

        return this.mutationAlignerCacheData &&
            this.mutationAlignerCacheData.status === 'complete' &&
            this.mutationAlignerCacheData.data ? (
            <a href={this.mutationAlignerCacheData.data} target="_blank">
                Mutation Aligner
            </a>
        ) : null;
    }
}
