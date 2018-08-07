import * as React from 'react';
import SvgSaver from 'svgsaver';
import autobind from "autobind-decorator";
import DownloadControls from "../downloadControls/DownloadControls";

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
            <div className="borderedChart inlineBlock">
                <DownloadControls
                    filename={this.props.exportFileName || "chart-download"}
                    dontFade={true}
                    getSvg={this.props.getSVGElement!}
                    collapse={true}
                    style={{position:"absolute", top:10, right:10, zIndex:10}}
                />
                <div style={{ overflowX:'auto', overflowY:'hidden'}}>
                    {this.props.children}
                </div>
         </div>
        )

    }


}