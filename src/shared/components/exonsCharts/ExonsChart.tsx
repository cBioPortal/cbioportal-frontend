/*
 * Copyright (c) 2018. The Hyve and respective contributors
 *
 * This file is part of cBioPortal.
 *
 * cBioPortal is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as
 * published by the Free Software Foundation, either version 3 of the
 * License.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 **/

import * as React from 'react';
import { observer } from 'mobx-react';
import ExonBarPlot from './ExonsBarPlot';
import ExonsBarPlotStore from './ExonsBarPlotStore';
import { ExonsChartStore } from './ExonsChartStore';
import { EnsemblTranscriptExt } from '../../model/Fusion';
import { StructuralVariantExt } from '../../model/Fusion';
import LoadingIndicator from '../loadingIndicator/LoadingIndicator';

export interface IExonsChartProps {
    store: ExonsChartStore;
}

const containerStyle = {
    width: '70vw',
    overflow: 'auto',
    marginRight: '5px',
};

@observer
export default class ExonsChart extends React.Component<IExonsChartProps, {}> {
    renderFusionExons(
        fusions: StructuralVariantExt[] | undefined,
        referenceGeneWidth: number
    ) {
        const sortedFusions = this.sortFusionsBySymbol(fusions);
        let lastLabel = '';
        return (sortedFusions || []).map(fusion => {
            let label = fusion.site1HugoSymbol + '-' + fusion.site2HugoSymbol;
            let isSameGroup = label === lastLabel;
            if (isSameGroup) label = '';
            else lastLabel = label;
            let leftLabel = {
                label: label,
                isReference: false,
            };
            let _barPlotStore = new ExonsBarPlotStore(
                leftLabel,
                fusion,
                referenceGeneWidth
            );
            return (
                <>
                    {isSameGroup ? <></> : <div style={{ height: 10 }}></div>}
                    <ExonBarPlot store={_barPlotStore} />
                </>
            );
        });
    }

    sortFusionsBySymbol(fusions: StructuralVariantExt[] | undefined) {
        return fusions?.sort((a, b) => {
            const aSite1HugoSymbol = a.site1HugoSymbol || 'undefined';
            const bSite1HugoSymbol = b.site1HugoSymbol || 'undefined';
            const aSite2HugoSymbol = a.site2HugoSymbol || 'undefined';
            const bSite2HugoSymbol = b.site2HugoSymbol || 'undefined';
            if (aSite1HugoSymbol > bSite1HugoSymbol) {
                return 1;
            } else if (aSite1HugoSymbol < bSite1HugoSymbol) {
                return -1;
            } else {
                return aSite2HugoSymbol > bSite2HugoSymbol ? 1 : -1;
            }
        });
    }

    render() {
        const { computedTranscripts } = this.props.store;
        if (computedTranscripts.isComplete) {
            const { result } = computedTranscripts;
            return result.map((t: EnsemblTranscriptExt) => {
                const leftLabel = {
                    label: t.hugoSymbols[0],
                    isReference: true,
                };
                const refExonStore = new ExonsBarPlotStore(leftLabel, t);
                const refTotalWidth = t.totalWidth ? t.totalWidth : 0;
                const fusions = this.sortFusionsBySymbol(t.fusions);
                return (
                    <div style={containerStyle} className="borderedChart">
                        {/* Draw reference transcript exons */}
                        <ExonBarPlot store={refExonStore} />
                        {/* Draw fusion exons */}
                        {this.renderFusionExons(fusions, refTotalWidth)}
                        <br />
                    </div>
                );
            });
        } else if (computedTranscripts.isPending) {
            return <LoadingIndicator isLoading={true} />;
        } else if (computedTranscripts.isError) {
            return <b>ERROR</b>;
        }
    }
}
