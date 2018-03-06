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
import {
    VictoryChart,
    VictoryStack,
    VictoryBar,
    VictoryPie,
    VictoryTheme,
    VictoryLegend,
    VictoryTooltip
} from 'victory';
import { observer } from 'mobx-react';
import { action } from 'mobx';
import FusionMapperDataStore from '../../../pages/resultsView/fusion/ResultViewFusionMapperDataStore';
import { FUS_GENE_COLORSCALE} from '../../../pages/resultsView/fusion/ResultViewFusionMapperStore';
import { StructuralVariantExt } from '../../model/Fusion';

export interface IFusionPieChartProps {
    dataStore: FusionMapperDataStore;
    fusionCounts: { [fusedGene: string]: number };
}

@observer
export default class FusionPieChart extends React.Component<IFusionPieChartProps, {}> {

    geneFilters: string[];

    constructor(props: IFusionPieChartProps) {
        super(props);
        this.geneFilters = []; // initialise
    }

    @action
    toggleSelection(str: string) {
        const arrIdx = this.geneFilters.indexOf(str);
        if (arrIdx < 0) {
            this.geneFilters.push(str);
        } else {
            this.geneFilters.splice(arrIdx, 1);
        }

        if (this.geneFilters.length) {
            // apply filters
            this.props.dataStore.setFilter((d: StructuralVariantExt[]) => {
                // return accumulation result of selected gene in pie vs site-2 gene in all data
                return this.geneFilters.reduce((accumulator, currentValue) => {
                    return accumulator || (d[0].label === currentValue);
                }, false);
            });
        } else {
            // empty filter when there're no selected genes
            this.props.dataStore.setFilter((d => true));
        }
    }

    @action
    onClickHandler() {
        return [
            {
                target: 'data',
                mutation: (props: any) => {
                    this.toggleSelection(props.slice.data.x);
                    const fill = props.style && props.style.fill;
                    return fill === 'red' ? null : {style: {fill: 'red'}};
                }
            }
        ];
    }

    getFusionCounts() {
        return this.props.fusionCounts ? Object.keys(this.props.fusionCounts).map((d: string) => {
            return {x: d, y: this.props.fusionCounts[d]};
        }) : [];
    }

    public render() {
        return (
            <VictoryPie
                labelRadius={70}
                colorScale={FUS_GENE_COLORSCALE}
                style={{
                    parent: {width: '15%', stroke: 'red'}, labels: {
                        fontSize: 25,
                        fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif;',
                        fill: '#FFF'
                    }
                }}
                data={this.getFusionCounts()}
                labels={(d: any) => `${d.y/this.props.dataStore.tableData.length > 0.1 ? d.y : ''}`}
                events={[{
                    target: 'data',
                    eventHandlers: {
                        onClick: () => this.onClickHandler()
                    }
                }]}
            />
        )
    }

}
