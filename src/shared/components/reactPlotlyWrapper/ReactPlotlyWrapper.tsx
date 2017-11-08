import React, {ReactElement} from 'react';
import {observer} from "mobx-react";
import {observable, runInAction} from "mobx";
import Plotly from 'plotly.js';
import classNames from 'classnames';

export interface IReactPlotlyWrapperProps {
    layout:any;
    data:any; buildTooltip:(tooltipModel:any)=>JSX.Element
}

@observer
export default class ReactPlotlyWrapper extends React.Component<IReactPlotlyWrapperProps, {}>
{

    private wrapper:any;
    private tooltipTriggeredRender = false;
    @observable.ref private tooltipModel:any = null;
    @observable private showTooltip = false;
    @observable private tooltipPosition:any = { top:0, left:0 };

    constructor(){
        super();
    }

    componentDidMount(){
        this.renderPlotly();
    }

    componentDidUpdate(){
        if (!this.tooltipTriggeredRender) {
            this.renderPlotly();
        } else {
            this.tooltipTriggeredRender = false;
        }
    }

    renderPlotly(){

        Plotly.newPlot(this.wrapper, this.props.data, this.props.layout);

        const that = this;

        this.wrapper.on('plotly_hover', function(data: any){
            console.log(data);
            runInAction(()=>{
                that.tooltipTriggeredRender = true;
                this.tooltipModel = data;
                this.tooltipPosition = { top:data.event.y, left:data.event.x  };
                that.showTooltip = true;
            });
        }.bind(this))
            .on('plotly_unhover', function(data: any){
                runInAction(()=> {
                    that.tooltipTriggeredRender = true;
                    that.showTooltip = false;
                });
            }.bind(this));

    }

    render(){

        console.log('render', this.tooltipModel);

        const tooltipStyle:any = {
            position:'absolute',
            zIndex:100,
            left:this.tooltipPosition.left,
            top:this.tooltipPosition.top
        };

        return (<div style={{position:'relative'}}>
                <div style={tooltipStyle} className={ classNames({ 'hidden':!this.showTooltip }) }>
                    {
                        (this.tooltipModel) && (this.props.buildTooltip(this.tooltipModel))
                    }
                </div>
                <div ref={(el:HTMLDivElement)=>this.wrapper=el}></div>
            </div>
        )
    }

}
