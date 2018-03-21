import * as React from 'react';
import SvgSaver from 'svgsaver';
import autobind from "autobind-decorator";
import DownloadControls from "../DownloadControls";

interface IChartContainer {
    getSVGElement?:()=>SVGElement;
    exportFileName?:string;
}

export default class ChartContainer extends React.Component<IChartContainer, {}> {

    @autobind
    private downloadSvg() {
        this.svgsaver.asSvg(this.props.getSVGElement!(), this.props.exportFileName + '.svg');
    }

    @autobind
    private downloadPng() {
        this.svgsaver.asPng(this.props.getSVGElement!(), this.props.exportFileName + '.png');
    }

    private svgsaver = new SvgSaver();

    render(){

        return  (
            <div className="borderedChart">


                <DownloadControls
                    filename={this.props.exportFileName || "chart-download"}
                    style={{position:'absolute', zIndex:10, right:10,top:10}}
                    dontFade={true}
                    getSvg={this.props.getSVGElement!}
                />

                <div style={{fontFamily:"Arial, Helvetica", overflowX:'auto', overflowY:'hidden'}}>
                    {this.props.children}
                </div>
         </div>
        )

    }


}