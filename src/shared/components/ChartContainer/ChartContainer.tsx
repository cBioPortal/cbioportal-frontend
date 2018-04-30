import * as React from 'react';
import SvgSaver from 'svgsaver';
import autobind from "autobind-decorator";

interface IChartContainer {
    getSVGElement?:()=>SVGElement;
    exportFileName?:string;
}

export default class ChartContainer extends React.Component<{}, {}> {

    @autobind
    private downloadSvg() {
        this.svgsaver.asSvg(this.props.getSVGElement(), this.props.exportFileName + '.svg');
    }

    @autobind
    private downloadPng() {
        this.svgsaver.asPng(this.props.getSVGElement(), this.props.exportFileName + '.png');
    }

    private svgsaver = new SvgSaver();

    render(){

        return  (
            <div className="borderedChart">


                <div className="btn-group export-buttons" style={{position:'absolute', zIndex:10, right:10,top:10}} role="group">
                    <button className="btn btn-default btn-xs" onClick={this.downloadPng} type="button">
                        <i className="fa fa-cloud-download" aria-hidden="true"></i> PNG
                    </button>
                    <button className="btn btn-default btn-xs" onClick={this.downloadSvg} type="button">
                        <i className="fa fa-cloud-download" aria-hidden="true"></i> SVG
                    </button>
                </div>


                <div style={{fontFamily:"Arial, Helvetica", overflowX:'auto', overflowY:'hidden'}}>
                    {this.props.children}
                </div>
         </div>
        )

    }


}