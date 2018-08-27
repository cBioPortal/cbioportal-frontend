import * as React from 'react';
import {SequenceSpec} from "./LollipopPlotNoTooltip";
import {observer} from "mobx-react";
import {observable} from "mobx";

interface ISequenceProps {
    x:number;
    y:number;
    width:number;
    height:number;
    color?:string;
    hitzoneClassName?:string;
    spec:SequenceSpec;
}

@observer
export default class Sequence extends React.Component<ISequenceProps, {}> {
    @observable private isMounted:boolean = false;

    constructor(props: ISequenceProps) {
        super(props);
    }

    public get hitRect() {
        return {
            x: this.props.x,
            y: this.props.y,
            width: this.props.width,
            height: this.props.height
        };
    }

    componentDidMount() {
        this.isMounted = true;
    }

    render() {
        return (
            <g>
                <rect
                    x={this.props.x}
                    y={this.props.y}
                    width={this.props.width}
                    height={this.props.height}
                    fill={this.props.color}
                />
                <rect
                    className={this.props.hitzoneClassName}
                    x={this.props.x}
                    y={this.props.y}
                    width={this.props.width}
                    height={this.props.height}
                    style={{opacity:0}}
                />
            </g>
        );
    }
}