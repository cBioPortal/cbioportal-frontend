/**
 * Copyright (c) 2018 The Hyve B.V.
 * This code is licensed under the GNU Affero General Public License (AGPL),
 * version 3, or (at your option) any later version.
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
import { VictoryChart, VictoryStack, VictoryBar, VictoryPie, VictoryTheme, VictoryLegend } from 'victory';
import { FUS_GENE_COLORSCALE } from '../../../pages/resultsView/fusion/ResultViewFusionMapperStore';

export interface IFusionPieChartLegendProps {
    fusionCounts: {[fusedGene:string]: number}
}

@observer
export default class FusionPieChartLegend extends React.Component<IFusionPieChartLegendProps, {}> {

    constructor(props: IFusionPieChartLegendProps) {
        super(props);
    }

    public render() {
        let fusionGenes = Object.keys(this.props.fusionCounts);
        let data =  fusionGenes.map(d => {
            return {name: d};
        });
        // legend height depends on how many genes are fused to the reference gene
        let legendHeight = fusionGenes.length > 9 ? (fusionGenes.length/9 * 400) : 400;
        return fusionGenes.length > 0 ? (
            <VictoryLegend
                data={data}
                colorScale={FUS_GENE_COLORSCALE}
                y={50}
                gutter={20}
                height={legendHeight}
                style={{parent: {width: '9%'}, labels: {fontSize: 18, fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif;'} }}
                width={200}
            />
        ) : <div>&nbsp;</div>;
    }
}
