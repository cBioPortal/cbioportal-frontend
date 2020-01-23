/*
 * Copyright (c) 2018. The Hyve and respective contributors
 *
 * Licensed under the Apache License, Version 2.0 (the 'License');
 * you may not use this file except in compliance with the License.
 *
 * See the file LICENSE in the root of this repository.
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

import React from 'react';
import ExonsBarPlotStore from './ExonsBarPlotStore';
import { DefaultTooltip } from 'cbioportal-frontend-commons';
import { PfamDomainRangeExt } from '../../model/Fusion';
import { ExonRangeExt } from '../../model/Fusion';
import  "./ExonBarPlot.scss";

export interface IExonBarPlotProps {
    store: ExonsBarPlotStore;
}

export default class ExonBarPlot extends React.Component<IExonBarPlotProps, {}> {

    renderExonToolTipContent = (exonRange: ExonRangeExt) => {
        return (
            <ul style={{listStyleType: 'none', padding: 0}}>
                <li style={{color: exonRange!.fillColor}}><strong>{exonRange!.exonId}</strong></li>
                <li>exon: <strong>{exonRange!.rank}</strong></li>
                <li>{`${exonRange!.exonStart} - ${exonRange!.exonEnd}`}</li>
            </ul>

        );
    };

    renderPfamTooltipContent = (pfam: PfamDomainRangeExt) => {
        return (
            <ul style={{listStyleType: 'none', padding: 0}}>
                <li style={{color: pfam.fillColor}}><strong>{pfam.pfamDomainId}</strong></li>
                <li>{`${pfam.name}: ${pfam.description} (${pfam.pfamDomainStart} - ${pfam.pfamDomainEnd})`}</li>
            </ul>);
    };

    renderExonCells = () => {
        return this.props.store.computedExons.map((e: ExonRangeExt) => {
            e.width = e.width ? e.width : 0;
            return (
                <DefaultTooltip
                    placement="top"
                    overlay={this.renderExonToolTipContent(e)}>
                    <rect
                        x={e.x}
                        y={0}
                        width={e.width * this.props.store.divider}
                        height={20}
                        style={{fill: e.fillColor}}
                    />
                </DefaultTooltip>

            );
        });
    };

    renderPFams = (totalWidth: number) => {
        return (
            <svg width={totalWidth} height={10} style={{backgroundColor: 'white'}}>
                <g stroke='#222' strokeWidth='.5'>
                    {this.props.store.computedPfams.map(
                        (pfam: PfamDomainRangeExt) => {
                            pfam.width = pfam.width ? pfam.width : 0;
                            return (
                                <DefaultTooltip
                                    placement="top"
                                    overlay={this.renderPfamTooltipContent(pfam)}>
                                    <rect
                                        x={pfam.x} y={0}
                                        width={pfam.width * this.props.store.divider * 3} height={10}
                                        style={{fill: pfam.fillColor}}/>
                                </DefaultTooltip>
                            );
                        }
                    )}
                </g>
            </svg>
        );
    };

    render() {
        const totalWidth = this.props.store.computedTotalWidth + this.props.store.deltaXPos + 10;
        const isRefGene = this.props.store.leftLabel.isReference;
        const pFamX = this.props.store.deltaXPos > 0 ? this.props.store.deltaXPos : '';
        return (
            <div style={{display: 'flex', width: '100%'}} className='fade-in'>
                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'flex-end',
                        textAlign: 'right',
                        minWidth: '90px',
                        fontSize: '.7em',
                        paddingRight: '.7em',
                        fontWeight: isRefGene ? 'bold' : 'normal'
                    }}>
                    {this.props.store.leftLabel.label}
                </div>
                <div style={isRefGene ? {marginBottom: '1em'} : {}}>
                    {!isRefGene ? '' : (
                        <div style={{width: totalWidth, fontSize: '.7em'}}>
                            {this.renderPFams(totalWidth)}
                            <div style={{float: 'left', width: pFamX, textAlign: 'right'}}>5'</div>
                            <div style={{float: 'right'}}>3'</div>
                        </div>
                    )}
                    <div style={{border: 1}}>
                        <svg width={totalWidth} height={20} style={{backgroundColor: 'white'}}>
                            <g stroke='#222' strokeWidth='.5'>{this.renderExonCells()}</g>
                        </svg>
                    </div>
                    {
                        isRefGene ?
                            <div style={{width: totalWidth, fontSize: '.8em'}}>
                                <div style={{float: 'left', width: pFamX, textAlign: 'right'}}>0 bp</div>
                                <div style={{float: 'right'}}>{this.props.store.transcript.totalWidth} bp</div>
                            </div> : ''
                    }
                </div>
            </div>
        );
    }
}
