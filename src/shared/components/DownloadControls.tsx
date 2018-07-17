import * as React from "react";
import SvgSaver from 'svgsaver';
import svgToPdfDownload from "shared/lib/svgToPdfDownload";
import FadeInteraction from "./fadeInteraction/FadeInteraction";
import {observer} from "mobx-react";
import {computed} from "mobx";
import autobind from "autobind-decorator";
import fileDownload from 'react-file-download';

type ButtonSpec = { key:string, content:JSX.Element, onClick:()=>void, disabled?: boolean };

type DownloadControlsButton = "PDF" | "PNG" | "SVG" | "Data";

interface IDownloadControlsProps {
    getSvg?:()=>SVGElement|null;
    getData?:()=>string;
    filename:string;
    buttons?: DownloadControlsButton[],
    additionalLeftButtons?:ButtonSpec[],
    additionalRightButtons?:ButtonSpec[]
    dontFade?:boolean;
    style?:any;
}

function makeButton(spec:ButtonSpec) {
    return (
        <button
            key={spec.key}
            className={`btn btn-default btn-xs`}
            onClick={spec.onClick}
            disabled={spec.disabled}
        >
            {spec.content}
        </button>
    );
}

@observer
export default class DownloadControls extends React.Component<IDownloadControlsProps, {}> {
    private svgsaver = new SvgSaver();

    @autobind
    private downloadSvg() {
        if (this.props.getSvg) {
            const svg = this.props.getSvg();
            if (svg) {
                this.svgsaver.asSvg(svg, `${this.props.filename}.svg`);
            }
        }
    }

    @autobind
    private downloadPng() {
        if (this.props.getSvg) {
            const svg = this.props.getSvg();
            if (svg) {
                this.svgsaver.asPng(svg, `${this.props.filename}.png`);
            }
        }
    }

    @autobind
    private downloadPdf() {
        if (this.props.getSvg) {
            const svg = this.props.getSvg();
            if (svg) {
                svgToPdfDownload(`${this.props.filename}.pdf`, svg);
            }
        }
    }

    @autobind
    private downloadData() {
        if (this.props.getData) {
            const data = this.props.getData();
            fileDownload(data, `${this.props.filename}.txt`);
        }
    }

    @computed get downloadControlsButtons():{[button in DownloadControlsButton]:ButtonSpec} {
        return {
            "SVG":{
                key: "SVG",
                    content: <span>SVG <i className="fa fa-cloud-download" aria-hidden="true"/></span>,
                onClick: this.downloadSvg,
                disabled: !this.props.getSvg
            },
            "PNG":{
                key:"PNG",
                    content: <span>PNG <i className="fa fa-cloud-download" aria-hidden="true"/></span>,
                    onClick: this.downloadPng,
                    disabled: !this.props.getSvg
            },
            "PDF":{
                key:"PDF",
                    content: <span>PDF <i className="fa fa-cloud-download" aria-hidden="true"/></span>,
                    onClick: this.downloadPdf,
                    disabled: !this.props.getSvg
            },
            "Data":{
                key: "Data",
                content: <span>Data <i className="fa fa-cloud-download" aria-hidden="true"/></span>,
                onClick: this.downloadData,
                disabled: !this.props.getData
            }
        };
    }

    @computed get buttons() {
        const btns:DownloadControlsButton[] = this.props.buttons || ["SVG", "PNG", "PDF"];
        return btns.map(btn=>makeButton(this.downloadControlsButtons[btn]));
    }

    render() {
        const buttonGroup = (
            <div role="group" className="btn-group chartDownloadButtons" style={this.props.style||{}}>
                {this.props.additionalLeftButtons && this.props.additionalLeftButtons.map(makeButton)}
                {this.buttons}
                {this.props.additionalRightButtons && this.props.additionalRightButtons.map(makeButton)}
            </div>
        );
        if (this.props.dontFade) {
            return buttonGroup;
        } else {
            return (
                <FadeInteraction>
                    {buttonGroup}
                </FadeInteraction>
            );
        }
    }
}