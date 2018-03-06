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

import LoadingIndicator from "shared/components/loadingIndicator/LoadingIndicator";
import * as React from 'react';
import { observer } from 'mobx-react';
import ExonBarPlot from './ExonsBarPlot';
import ExonsBarPlotStore from './ExonsBarPlotStore';
import { ExonsChartStore } from './ExonsChartStore';
import { EnsemblTranscriptExt} from '../../model/Fusion';
import { StructuralVariantExt } from '../../model/Fusion';

export interface IExonsChartProps {
    store: ExonsChartStore;
}

@observer
export default class ExonsChart extends React.Component<IExonsChartProps, {}> {
    renderBarPlots(fusions: StructuralVariantExt[], referenceGeneWidth: number) {
        return fusions.map(fusion => {
            let leftLabel = {
                label: fusion.site1HugoSymbol + '-' + fusion.site2HugoSymbol,
                isReference: false
            };
            let _barPlotStore =  new ExonsBarPlotStore(leftLabel, fusion, referenceGeneWidth);
            return <ExonBarPlot store={_barPlotStore}/>;
        });
    }

    renderReferenceGenes() {
        return this.props.store.fusionsByReferences.map((t:EnsemblTranscriptExt) => {
            const leftLabel = {
                label: t.hugoSymbols[0],
                isReference: true
            };
            const barPlotStore = new ExonsBarPlotStore(leftLabel, t);
            return (
                <div>
                    <ExonBarPlot store={barPlotStore}/>
                    {this.renderBarPlots(t.fusions, t.totalWidth)}
                    <br/>
                </div>
            );
        });
    }

    render() {
        return (
            <div style={{width: '75%', overflow: 'auto', marginRight: '5px'}} className='borderedChart'>
                <LoadingIndicator isLoading={this.props.store.isLoadingEnsemblTranscripts}/>
                {this.renderReferenceGenes()}
            </div>
        );
    }
}
