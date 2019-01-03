import * as React from "react";
import {observer, Observer} from "mobx-react";
import {action, computed, IObservableObject, observable} from "mobx";
import Oncoprint from "../../../../shared/components/oncoprint/Oncoprint";
import OncoprintControls, {
    IOncoprintControlsHandlers,
    IOncoprintControlsState
} from "shared/components/oncoprint/controls/OncoprintControls";
import {Sample} from "../../../../shared/api/generated/CBioPortalAPI";
import {percentAltered} from "../../../../shared/components/oncoprint/OncoprintUtils";
import AppConfig from "appConfig";
import OncoprintJS from "oncoprintjs";
import fileDownload from "react-file-download";
import svgToPdfDownload from "shared/lib/svgToPdfDownload";
import classNames from "classnames";
import FadeInteraction from "shared/components/fadeInteraction/FadeInteraction";
import OncoprinterStore from "./OncoprinterStore";
import autobind from "autobind-decorator";
import onMobxPromise from "../../../../shared/lib/onMobxPromise";

interface IOncoprinterProps {
    divId: string;
    store: OncoprinterStore;
}

@observer
export default class Oncoprinter extends React.Component<IOncoprinterProps, {}> {

    @observable distinguishMutationType:boolean = true;
    @observable sortByMutationType:boolean = true;
    @observable sortByDrivers:boolean = true;

    @observable showWhitespaceBetweenColumns:boolean = true;

    @observable showMinimap:boolean = false;

    @observable horzZoom:number = 0.5;

    @observable mouseInsideBounds:boolean = false;

    @observable renderingComplete = true;

    private controlsHandlers:IOncoprintControlsHandlers;
    private controlsState:IOncoprintControlsState & IObservableObject;

    @observable.ref public oncoprint:OncoprintJS<any>;

    constructor(props:IOncoprinterProps) {
        super(props);

        (window as any).oncoprinter = this;

        const self = this;

        this.controlsHandlers = this.buildControlsHandlers();

        this.controlsState = observable({
            get showUnalteredColumns() {
                return self.props.store.showUnalteredColumns;
            },
            get showWhitespaceBetweenColumns() {
                return self.showWhitespaceBetweenColumns;
            },
            get showMinimap() {
                return self.showMinimap;
            },
            get sortByMutationType() {
                return self.sortByMutationType;
            },
            get sortByCaseListDisabled() {
                return !self.props.store.inputSampleIdOrder;
            },
            get distinguishMutationType() {
                return self.distinguishMutationType;
            },
            get distinguishDrivers() {
                return self.distinguishDrivers;
            },
            get annotateDriversOncoKb() {
                return self.props.store.driverAnnotationSettings.oncoKb;
            },
            get annotateDriversOncoKbDisabled() {
                return !AppConfig.serverConfig.show_oncokb;
            },
            get annotateDriversOncoKbError() {
                return self.props.store.didOncoKbFail;
            },
            get annotateDriversCBioPortal() {
                return self.props.store.driverAnnotationSettings.cbioportalCount;
            },
            get hidePutativePassengers() {
                return self.props.store.driverAnnotationSettings.ignoreUnknown;
            },
            get annotateCBioPortalInputValue() {
                return self.props.store.driverAnnotationSettings.cbioportalCountThreshold + "";
            },
            get sortByDrivers() {
                return self.sortByDrivers;
            },
            get horzZoom() {
                if (isNaN(self.horzZoom)) {
                    return 1;
                } else {
                    return self.horzZoom;
                }
            },
            get annotateDriversHotspots() {
                return self.props.store.driverAnnotationSettings.hotspots;
            },
            get annotateDriversHotspotsDisabled() {
                return !AppConfig.serverConfig.show_hotspot;
            },
        });
    }

    @computed get distinguishDrivers() {
        return this.props.store.driverAnnotationSettings.driversAnnotated;
    }

    @autobind
    onMouseEnter(){
        this.mouseInsideBounds = true;
    }

    @autobind
    onMouseLeave(){
        this.mouseInsideBounds = false;
    }

    @action
    public setAnnotateCBioPortalInputValue(value:string) {
        this.controlsHandlers.onChangeAnnotateCBioPortalInputValue && this.controlsHandlers.onChangeAnnotateCBioPortalInputValue(value);
    }

    private buildControlsHandlers() {
        return {
            onSelectShowUnalteredColumns:(show:boolean)=>{this.props.store.showUnalteredColumns = show;},
            onSelectShowWhitespaceBetweenColumns:(show:boolean)=>{this.showWhitespaceBetweenColumns = show;},
            onSelectShowMinimap:(show:boolean)=>{this.showMinimap = show;},
            onSelectDistinguishMutationType:(s:boolean)=>{this.distinguishMutationType = s;},
            onSelectDistinguishDrivers:action((s:boolean)=>{
                if (!s) {
                    this.props.store.driverAnnotationSettings.oncoKb = false;
                    this.props.store.driverAnnotationSettings.cbioportalCount = false;
                    this.props.store.driverAnnotationSettings.ignoreUnknown = false;
                } else {
                    if (!this.controlsState.annotateDriversOncoKbDisabled && !this.controlsState.annotateDriversOncoKbError)
                        this.props.store.driverAnnotationSettings.oncoKb = true;

                    this.props.store.driverAnnotationSettings.cbioportalCount = true;
                }
            }),
            onSelectAnnotateOncoKb:action((s:boolean)=>{
                this.props.store.driverAnnotationSettings.oncoKb = s;
            }),
            onSelectAnnotateCBioPortal:action((s:boolean)=>{
                this.props.store.driverAnnotationSettings.cbioportalCount = s;
            }),
            /*onSelectAnnotateHotspots:action((s:boolean)=>{
                this.props.store.driverAnnotationSettings.hotspots = s;
            }),*/
            onChangeAnnotateCBioPortalInputValue:action((s:string)=>{
                this.props.store.driverAnnotationSettings.cbioportalCountThreshold = parseInt(s, 10);
                this.controlsHandlers.onSelectAnnotateCBioPortal && this.controlsHandlers.onSelectAnnotateCBioPortal(true);
            }),
            onSelectHidePutativePassengers:(s:boolean)=>{
                this.props.store.driverAnnotationSettings.ignoreUnknown = s;
            },
            onSelectSortByMutationType:(s:boolean)=>{this.sortByMutationType = s;},
            onSelectSortByDrivers:(sort:boolean)=>{this.sortByDrivers=sort;},
            onClickDownload:(type:string)=>{
                switch(type) {
                    case "pdf":
                        if (!svgToPdfDownload("oncoprint.pdf", this.oncoprint.toSVG(true))) {
                            alert("Oncoprint too big to download as PDF - please download as SVG.");
                        }
                        break;
                    case "png":
                        const img = this.oncoprint.toCanvas((canvas, truncated)=>{
                            canvas.toBlob(blob=>{
                                if (truncated) {
                                    alert(
                                        `Oncoprint too large - PNG truncated to ${canvas.getAttribute("width")}x${canvas.getAttribute("height")}`
                                    );
                                }
                                fileDownload(
                                    blob,
                                    "oncoprint.png"
                                );
                            });
                        }, 2);
                        break;
                    case "svg":
                        fileDownload(
                            (new XMLSerializer).serializeToString(this.oncoprint.toSVG(false)),
                            "oncoprint.svg"
                        );
                        break;
                    case "order":
                        const capitalizedColumnMode = "Sample";
                        let file = `${capitalizedColumnMode} order in the Oncoprint is:\n`;
                        const caseIds = this.oncoprint.getIdOrder();
                        for (const caseId of caseIds) {
                            file += `${caseId}\n`;
                        }
                        fileDownload(
                            file,
                            `OncoPrintSamples.txt`
                        );
                        break;
                }
            },
            onSetHorzZoom:(z:number)=>{
                this.oncoprint.setHorzZoom(z);
            },
            onClickZoomIn:()=>{
                this.oncoprint.setHorzZoom(this.oncoprint.getHorzZoom()/0.7);
            },
            onClickZoomOut:()=>{
                this.oncoprint.setHorzZoom(this.oncoprint.getHorzZoom()*0.7);
            }
        };
    }

    @autobind
    private oncoprintRef(oncoprint:OncoprintJS<any>) {
        this.oncoprint = oncoprint;

        this.oncoprint.onHorzZoom(z=>(this.horzZoom = z));
        this.horzZoom = this.oncoprint.getHorzZoom();
    }

    @autobind
    @action private onMinimapClose() {
        this.showMinimap = false;
    }

    @autobind
    @action private onSuppressRendering() {
        this.renderingComplete = false;
    }

    @autobind
    @action private onReleaseRendering() {
        this.renderingComplete = true;
    }

    @computed get sortConfig() {
        return {
            sortByMutationType:this.sortByMutationType,
            sortByDrivers:this.sortByDrivers,
            order: this.props.store.inputSampleIdOrder,
        };
    }

    @computed get alterationInfo() {
        if (this.props.store.sampleIds.isComplete && this.props.store.alteredSampleIds.isComplete ) {
            const numSamples = this.props.store.sampleIds.result.length;
            const alteredSamples = this.props.store.alteredSampleIds.result.length;
            return (
                <span style={{marginTop:"15px", marginBottom:"15px", display: "block"}}>
                    {`Altered in ${alteredSamples} (${percentAltered(alteredSamples, numSamples)}) of ${numSamples} samples.`}
                </span>
            )
        } else {
            return null;
        }
    }

    @computed get isLoading() {
        // todo: use mobxview
        return this.props.store.geneticTracks.isPending ||
            this.props.store.alteredSampleIds.isPending ||
                this.props.store.unalteredSampleIds.isPending;
    }

    @computed get isHidden() {
        return this.isLoading || !this.renderingComplete;
    }

    @autobind
    private getControls() {
        if (this.oncoprint && !this.oncoprint.webgl_unavailable) {
            return (<FadeInteraction showByDefault={true} show={true}>
                <OncoprintControls
                    handlers={this.controlsHandlers}
                    state={this.controlsState}
                    oncoprinterMode={true}
                />
            </FadeInteraction>);
        } else {
            return <span/>;
        }
    }

    public render() {
        return (
            <div className="posRelative">
                <div className={classNames('oncoprintContainer', { fadeIn: !this.isHidden })}
                     onMouseEnter={this.onMouseEnter}
                     onMouseLeave={this.onMouseLeave}
                >
                    <Observer>
                        {this.getControls}
                    </Observer>

                    <div style={{position:"relative"}} >
                        <div id="oncoprintDiv">
                            {this.alterationInfo}
                            <Oncoprint
                                oncoprintRef={this.oncoprintRef}
                                clinicalTracks={[]}
                                geneticTracks={this.props.store.geneticTracks.result}
                                geneticTracksOrder={this.props.store.geneOrder}
                                genesetHeatmapTracks={[]}
                                heatmapTracks={[]}
                                divId={this.props.divId}
                                width={1050}
                                suppressRendering={this.isLoading}
                                onSuppressRendering={this.onSuppressRendering}
                                onReleaseRendering={this.onReleaseRendering}
                                hiddenIds={this.props.store.hiddenSampleIds.result}

                                horzZoomToFitIds={this.props.store.alteredSampleIds.result}
                                distinguishMutationType={this.distinguishMutationType}
                                distinguishDrivers={this.distinguishDrivers}
                                sortConfig={this.sortConfig}
                                showWhitespaceBetweenColumns={this.showWhitespaceBetweenColumns}
                                showMinimap={this.showMinimap}
                                onMinimapClose={this.onMinimapClose}
                            />
                        </div>
                    </div>
                </div>
            </div>
        );
    }
}