import * as React from "react";
import SvgSaver from 'svgsaver';
import svgToPdfDownload from "shared/lib/svgToPdfDownload";
import FadeInteraction from "../fadeInteraction/FadeInteraction";
import {observer} from "mobx-react";
import {action, computed, observable} from "mobx";
import autobind from "autobind-decorator";
import fileDownload from 'react-file-download';
import DefaultTooltip from "../defaultTooltip/DefaultTooltip";
import classnames from "classnames";
import styles from "./DownloadControls.module.scss";

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
    collapse?:boolean;
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

function makeMenuItem(spec:ButtonSpec) {
    return (
        <div
            key={spec.key}
            onClick={spec.disabled ? ()=>{} : spec.onClick}
            className={classnames({[styles.menuItemEnabled]:!spec.disabled, [styles.menuItemDisabled]:!!spec.disabled}, styles.menuItem)}
        >
            {spec.key}
        </div>
    );
}

@observer
export default class DownloadControls extends React.Component<IDownloadControlsProps, {}> {
    private svgsaver = new SvgSaver({},{});
    @observable private collapsed = true;

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

    @computed get buttonSpecs() {
        const middleButtons = (this.props.buttons || ["SVG", "PNG"]).map(x=>this.downloadControlsButtons[x]);
        return (this.props.additionalLeftButtons || []).concat(middleButtons).concat(this.props.additionalRightButtons || []);
    }

    @autobind @action
    private onTooltipVisibleChange(visible:boolean) {
        this.collapsed = !visible;
    }

    render() {
        let element:any = null
        if (this.props.collapse) {
            element = (
                <div style={Object.assign({ zIndex:10 },this.props.style)}>
                    <DefaultTooltip
                        mouseEnterDelay={0}
                        onVisibleChange={this.onTooltipVisibleChange as any}
                        overlay={<div className={classnames("cbioportal-frontend", styles.downloadControls)} style={{display:"flex", flexDirection:"column"}}>{this.buttonSpecs.map(makeMenuItem)}</div>}
                        placement="bottom"
                    >
                        <div style={{cursor:"pointer"}}>
                            <div
                                key="collapsedIcon"
                                className={classnames("btn", "btn-default", "btn-xs", {"active":!this.collapsed} )}
                                style={{pointerEvents:"none"}}
                            >
                                <span><i className="fa fa-cloud-download" aria-hidden="true"/></span>
                            </div>
                        </div>
                    </DefaultTooltip>
                </div>
            );
        } else {
            element = (
                <div role="group" className="btn-group chartDownloadButtons" style={this.props.style||{}}>
                    {this.buttonSpecs.map(makeButton)}
                </div>
            );
        }
        if (this.props.dontFade) {
            return element;
        } else {
            return (
                <FadeInteraction>
                    {element}
                </FadeInteraction>
            );
        }
    }
}