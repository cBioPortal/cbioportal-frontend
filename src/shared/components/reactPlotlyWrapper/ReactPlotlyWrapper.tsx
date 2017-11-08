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

    private wrapper:HTMLDivElement;
    private tooltipTriggeredRender = false;
    private tooltipEl:HTMLDivElement;
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
                this.tooltipPosition = { top:data.event.layerY +10, left:data.event.layerX + 10  };
                that.showTooltip = true;
            });
        }.bind(this))
            .on('plotly_unhover', function(data: any){
                if (data.event.toElement !== this.tooltipEl) {
                    runInAction(()=> {
                        that.tooltipTriggeredRender = true;
                        that.showTooltip = false;
                    });
                }

            }.bind(this));


        // this.plotlyContainer.on('plotly_hover', (data) => {
        //     const offset = $(this.plotlyContainer).offset();
        //     const cancerTypeData = data.points[0].data.customdata.alterationData[data.points[0].x];
        //     const alterationTypeMap = data.points[0].data.customdata.alterationTypeMap;
        //     $(this.tooltip)
        //         .html(this.makeTooltip(data.points[0].x, cancerTypeData, alterationTypeMap))
        //         .css({
        //             left: data.event.layerX + 10,
        //             top: data.event.layerY + 10
        //         })
        //         .show()
        //         .on('mouseleave',()=>$(this.tooltip).hide())
        // });
        //
        // this.plotlyContainer.on('plotly_unhover', (data) => {
        //     if (data.event.toElement !== this.tooltip) {
        //         $(this.tooltip).hide();
        //     }
        // });


    }

    triggerMouseLeave(){
        Plotly.Fx.unhover(this.wrapper);
    }

    render(){

        console.log('render', this.tooltipModel);

        const tooltipStyle:any = {
            position:'absolute',
            zIndex:100,
            left:this.tooltipPosition.left,
            top:this.tooltipPosition.top,
            padding:10,
            background:'#fff',
            border:'1px solid #eee'
        };

        return (<div style={{position:'relative'}}>
                <div onMouseLeave={this.triggerMouseleave}
                     style={tooltipStyle}
                     ref={(el:HTMLDivElement)=>this.tooltipEl=el}
                     className={ classNames({ 'hidden':!this.showTooltip }) }>
                    {
                        (this.tooltipModel) && (this.props.buildTooltip(this.tooltipModel))
                    }
                </div>
                <div ref={(el:HTMLDivElement)=>this.wrapper=el}></div>
            </div>
        )
    }

}
