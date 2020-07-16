import * as React from 'react';
import { MSKTab, MSKTabs } from 'shared/components/MSKTabs/MSKTabs';
import { inject, observer } from 'mobx-react';
import {
    ClinicalFormatHelp,
    GenomicFormatHelp,
    HeatmapFormatHelp,
} from 'pages/staticPages/tools/oncoprinter/OncoprinterHelp';
import URLWrapper from 'shared/lib/URLWrapper';
import ExtendedRouterStore from 'shared/lib/ExtendedRouterStore';

export interface IOncoprinterDataFormatProps {
    routing: ExtendedRouterStore;
}
@inject('routing')
@observer
export default class OncoprinterDataFormat extends React.Component<
    IOncoprinterDataFormatProps,
    {}
> {
    private urlWrapper: URLWrapper<{ tab: string }>;
    constructor(props: IOncoprinterDataFormatProps) {
        super(props);
        this.urlWrapper = new URLWrapper<{ tab: string }>(this.props.routing, {
            tab: { isSessionProp: false },
        });
    }

    render() {
        return (
            <div className={'cbioportal-frontend'}>
                <MSKTabs
                    className="mainTabs"
                    activeTabId={this.urlWrapper.query.tab}
                    onTabClick={tab => this.urlWrapper.updateURL({ tab })}
                >
                    <MSKTab id={'genomic'} linkText={'Genomic'}>
                        {GenomicFormatHelp}
                    </MSKTab>
                    <MSKTab id={'clinical'} linkText={'Clinical'}>
                        {ClinicalFormatHelp}
                    </MSKTab>
                    <MSKTab id={'heatmap'} linkText={'Heatmap'}>
                        {HeatmapFormatHelp}
                    </MSKTab>
                </MSKTabs>
            </div>
        );
    }
}
