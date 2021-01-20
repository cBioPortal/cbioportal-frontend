import * as React from "react";
import FadeInteraction from "../fadeInteraction/FadeInteraction";
import {observer} from "mobx-react";
import {action, computed, observable} from "mobx";
import autobind from "autobind-decorator";
import fileDownload from 'react-file-download';
import DefaultTooltip from "../defaultTooltip/DefaultTooltip";
import classnames from "classnames";
import styles from "./DownloadControls.module.scss";
import {saveSvg, saveSvgAsPng} from "save-svg-as-png";
import svgToPdfDownload from "../../lib/svgToPdfDownload";
import {isPromiseLike} from "../../lib/PromiseUtils";
import {CSSProperties} from "react";

type ButtonSpec = { key:string, content:JSX.Element, onClick:()=>void, disabled?: boolean };

export type DownloadControlsButton = "PDF" | "PNG" | "SVG" | "Data" | "Summary Data" | "Full Data";
export type DataType='summary'|'full';
interface IDownloadControlsProps {
    getSvg?:()=>SVGElement|null|PromiseLike<SVGElement|null>;
    getData?:(dataType?:DataType)=>string|null|PromiseLike<string|null>;
    filename:string;
    buttons?: DownloadControlsButton[],
    additionalLeftButtons?:ButtonSpec[],
    additionalRightButtons?:ButtonSpec[]
    dontFade?:boolean;
    type?:'button'|'buttonGroup'|'dropdown';
    style?:CSSProperties;
    className?:any;
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

function makeDropdownItem(spec: ButtonSpec) {
    return (
        <li
            key={spec.key}
        >
            <a className="dropdown-item"
               onClick={spec.disabled ? () => {
               } : spec.onClick}
            >{spec.key}</a>
        </li>
    );
}

@observer
export default class DownloadControls extends React.Component<IDownloadControlsProps, {}> {
    @observable private collapsed = true;


    @autobind
    private download(saveMethod:(svg:SVGElement, fileName:string)=>void, fileExtension:string) {
        if (this.props.getSvg) {
            const result = this.props.getSvg();
            if (result) {
                if (isPromiseLike<SVGElement|null>(result)) {
                    result.then((svg)=>{
                        if (svg) {
                            saveMethod(svg, `${this.props.filename}.${fileExtension}`);
                        }
                    });
                } else {
                    saveMethod(result, `${this.props.filename}.${fileExtension}`);
                }
            }
        }
    }

    @autobind
    private downloadSvg() {
        this.download(saveSvg, "svg");
    }

    @autobind
    private downloadPng() {
        this.download((svg, fileName)=>saveSvgAsPng(svg, fileName, {backgroundColor:"#ffffff"}), "png");
    }

    @autobind
    private downloadPdf() {
        this.download((svg, fileName)=>svgToPdfDownload(fileName, svg), "pdf");
    }

    @autobind
    private downloadData(dataType?: DataType) {
        if (this.props.getData) {
            const result = this.props.getData(dataType);
            if (result !== null) {
                if (isPromiseLike<string|null>(result)) {
                    result.then(data=>{
                        if (data) {
                            fileDownload(data, `${this.props.filename}.txt`);
                        }
                    });
                } else {
                    fileDownload(result, `${this.props.filename}.txt`);
                }
            }
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
            },
            "Summary Data": {
                key: "Summary Data",
                content: <span>Summary Data <i className="fa fa-cloud-download" aria-hidden="true"/></span>,
                onClick: () => this.downloadData('summary'),
                disabled: !this.props.getData
            },
            "Full Data": {
                key: "Full Data",
                content: <span>Full Data <i className="fa fa-cloud-download" aria-hidden="true"/></span>,
                onClick: () => this.downloadData('full'),
                disabled: !this.props.getData
            }
        };
    }

    @computed get buttonSpecs() {
        const middleButtons = (this.props.buttons || ["SVG", "PNG", "PDF"]).map(x=>this.downloadControlsButtons[x]);
        return (this.props.additionalLeftButtons || []).concat(middleButtons).concat(this.props.additionalRightButtons || []);
    }

    @autobind @action
    private onTooltipVisibleChange(visible:boolean) {
        this.collapsed = !visible;
    }

    render() {
        let element:any = null
        if (this.props.type === 'buttonGroup') {
                element = (
                    <DefaultTooltip
                        mouseEnterDelay={0}
                        onVisibleChange={this.onTooltipVisibleChange}
                        overlay={<div className={classnames("cbioportal-frontend", styles.downloadControls)} style={{display:"flex", flexDirection:"column"}}>{this.buttonSpecs.map(makeMenuItem)}</div>}
                        placement="bottom"
                    >
                        <div
                            style={Object.assign({cursor:"pointer"}, this.props.style)}
                            className={classnames("btn btn-group btn-default btn-xs", {"active":!this.collapsed} )}
                        >
                            <i style={{pointerEvents:"none"}} className="fa fa-cloud-download" aria-hidden="true"/>
                        </div>
                    </DefaultTooltip>
                );
        } else if (this.props.type === 'button') {
                element = (
                    <div style={Object.assign({ zIndex:10 },this.props.style)}>
                        <DefaultTooltip
                            mouseEnterDelay={0}
                            onVisibleChange={this.onTooltipVisibleChange}
                            overlay={<div className={classnames("cbioportal-frontend", styles.downloadControls)} style={{display:"flex", flexDirection:"column"}}>{this.buttonSpecs.map(makeMenuItem)}</div>}
                            placement="bottom"
                        >
                            <div style={{cursor:"pointer"}}>
                                <div
                                    key="collapsedIcon"
                                    className={classnames("btn btn-default btn-xs", {"active":!this.collapsed} )}
                                    style={{pointerEvents:"none"}}
                                >
                                    <span><i className="fa fa-cloud-download" aria-hidden="true"/></span>
                                </div>
                            </div>
                        </DefaultTooltip>
                    </div>
                );
        } else if (this.props.type === 'dropdown') {
            element = (
                <ul className={classnames("dropdown-menu", this.props.className || '')}
                    style={this.props.style || {}}>
                    {this.buttonSpecs.map(makeDropdownItem)}
                </ul>
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