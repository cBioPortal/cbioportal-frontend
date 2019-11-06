import * as React from 'react';
import * as _ from 'lodash';
import { observer} from "mobx-react";
import {
    VictoryChart, VictoryAxis, VictoryLabel, VictoryBrushContainer
} from 'victory';
import CBIOPORTAL_VICTORY_THEME, {baseLabelStyles} from "../../../shared/theme/cBioPoralTheme";
import { observable } from 'mobx';
import autobind from 'autobind-decorator';

interface IRangeSelectorProps
{
    initialRange: {min: number, max: number}
    maxAxisValue: number;
    styleOpts: any; // see victory styles, or styleOptsDefaultProps in SurvivalChart for examples
    xAxisTickCount: number
    selectedDomain: any;
    minAxisValue?: number;
    updateDomain?: (domain: any)=>void;
}

@observer
export default class RangeSelector extends React.Component<IRangeSelectorProps> {
    constructor(props:IRangeSelectorProps) {
        super(props);
    }

    public static defaultProps = {
        minAxisValue: 0
    };

    @autobind
    private onSelection(domain: any, props: any) {
        if (this.props.updateDomain) {
            this.props.updateDomain(domain);
        }
    }

    render() {
        return (
            <div style={{marginBottom:-50}}>
                <VictoryChart containerComponent={<VictoryBrushContainer responsive={false} brushDimension="x" brushDomain={this.props.selectedDomain} onBrushDomainChange={this.onSelection}/>}
                            height={100} width={this.props.styleOpts.width}
                            padding={this.props.styleOpts.padding}
                            theme={CBIOPORTAL_VICTORY_THEME}
                            domain={{x: [this.props.minAxisValue, this.props.maxAxisValue]}}
                            domainPadding={{x: [10, 50], y: [20, 20]}}>
                    <VictoryAxis style={this.props.styleOpts.axis.x} crossAxis={false} tickCount={this.props.xAxisTickCount}
                                orientation={"top"} offsetY={50}/>
                    <VictoryLabel x={50} y={60} text={Math.round(this.props.selectedDomain.x[0])}/>
                    <VictoryLabel x={this.props.styleOpts.legend.x - 10} y={60} text={Math.round(this.props.selectedDomain.x[1])}/>
                </VictoryChart>
            </div>
        );
    }

}
