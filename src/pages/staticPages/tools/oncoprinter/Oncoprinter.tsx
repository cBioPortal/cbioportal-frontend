import * as React from 'react';
import { observer, Observer } from 'mobx-react';
import { action, computed, observable, makeObservable, autorun } from 'mobx';
import Oncoprint from '../../../../shared/components/oncoprint/Oncoprint';
import OncoprintControls, {
    IOncoprintControlsHandlers,
    IOncoprintControlsState,
} from 'shared/components/oncoprint/controls/OncoprintControls';
import { Sample } from 'cbioportal-ts-api-client';
import { percentAltered } from '../../../../shared/components/oncoprint/OncoprintUtils';
import AppConfig from 'appConfig';
import OncoprintJS from 'oncoprintjs';
import fileDownload from 'react-file-download';
import {
    isWebdriver,
    FadeInteraction,
    svgToPdfDownload,
} from 'cbioportal-frontend-commons';
import classNames from 'classnames';
import OncoprinterStore from './OncoprinterStore';
import autobind from 'autobind-decorator';
import onMobxPromise from '../../../../shared/lib/onMobxPromise';
import WindowStore from '../../../../shared/components/window/WindowStore';
import { getGeneticTrackKey } from './OncoprinterGeneticUtils';
import SuccessBanner from '../../../studyView/infoBanner/SuccessBanner';
import InfoBanner from '../../../../shared/components/banners/InfoBanner';
import '../../../../globalStyles/oncoprintStyles.scss';

interface IOncoprinterProps {
    divId: string;
    store: OncoprinterStore;
}

@observer
export default class Oncoprinter extends React.Component<
    IOncoprinterProps,
    {}
> {
    @observable distinguishMutationType: boolean = true;
    @observable distinguishGermlineMutations = true;
    @observable sortByMutationType: boolean = true;
    @observable sortByDrivers: boolean = true;

    @observable showWhitespaceBetweenColumns: boolean = true;
    @observable showClinicalTrackLegends: boolean = true;

    @observable showMinimap: boolean = false;

    @observable horzZoom: number = 0.5;

    @observable mouseInsideBounds: boolean = false;

    @observable renderingComplete = true;

    private controlsHandlers: IOncoprintControlsHandlers;
    private controlsState: IOncoprintControlsState;

    @observable.ref public oncoprint: OncoprintJS | undefined = undefined;

    constructor(props: IOncoprinterProps) {
        super(props);

        makeObservable(this);

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
            get showClinicalTrackLegends() {
                return self.showClinicalTrackLegends;
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
            get distinguishGermlineMutations() {
                return self.distinguishGermlineMutations;
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
                return self.props.store.driverAnnotationSettings
                    .cbioportalCount;
            },
            get hidePutativePassengers() {
                return self.props.store.driverAnnotationSettings.excludeVUS;
            },
            get hideGermlineMutations() {
                return self.props.store.hideGermlineMutations;
            },
            get annotateCBioPortalInputValue() {
                return (
                    self.props.store.driverAnnotationSettings
                        .cbioportalCountThreshold + ''
                );
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
            get annotateCustomDriverBinary() {
                return self.props.store.driverAnnotationSettings.customBinary;
            },
            get customDriverAnnotationBinaryMenuLabel() {
                if (self.props.store.existCustomDrivers) {
                    return 'User-specified drivers';
                } else {
                    return undefined;
                }
            },
        });
    }

    @computed get distinguishDrivers() {
        return this.props.store.driverAnnotationSettings.driversAnnotated;
    }

    @autobind
    onMouseEnter() {
        this.mouseInsideBounds = true;
    }

    @autobind
    onMouseLeave() {
        this.mouseInsideBounds = false;
    }

    @action
    public setAnnotateCBioPortalInputValue(value: string) {
        this.controlsHandlers.onChangeAnnotateCBioPortalInputValue &&
            this.controlsHandlers.onChangeAnnotateCBioPortalInputValue(value);
    }

    private buildControlsHandlers() {
        return {
            onSelectShowUnalteredColumns: (show: boolean) => {
                this.props.store.showUnalteredColumns = show;
            },
            onSelectShowWhitespaceBetweenColumns: (show: boolean) => {
                this.showWhitespaceBetweenColumns = show;
            },
            onSelectShowClinicalTrackLegends: (show: boolean) => {
                this.showClinicalTrackLegends = show;
            },
            onSelectShowMinimap: (show: boolean) => {
                this.showMinimap = show;
            },
            onSelectDistinguishMutationType: (s: boolean) => {
                this.distinguishMutationType = s;
            },
            onSelectDistinguishGermlineMutations: (s: boolean) => {
                this.distinguishGermlineMutations = s;
            },
            onSelectDistinguishDrivers: action((s: boolean) => {
                if (!s) {
                    this.props.store.driverAnnotationSettings.oncoKb = false;
                    this.props.store.driverAnnotationSettings.cbioportalCount = false;
                    this.props.store.driverAnnotationSettings.customBinary = false;
                    this.props.store.driverAnnotationSettings.excludeVUS = false;
                } else {
                    if (
                        !this.controlsState.annotateDriversOncoKbDisabled &&
                        !this.controlsState.annotateDriversOncoKbError
                    ) {
                        this.props.store.driverAnnotationSettings.oncoKb = true;
                    }

                    this.props.store.driverAnnotationSettings.cbioportalCount = true;
                    this.props.store.driverAnnotationSettings.customBinary = true;
                }
            }),
            onSelectAnnotateOncoKb: action((s: boolean) => {
                this.props.store.driverAnnotationSettings.oncoKb = s;
            }),
            onSelectAnnotateCBioPortal: action((s: boolean) => {
                this.props.store.driverAnnotationSettings.cbioportalCount = s;
            }),
            /*onSelectAnnotateHotspots:action((s:boolean)=>{
                this.props.store.driverAnnotationSettings.hotspots = s;
            }),*/
            onChangeAnnotateCBioPortalInputValue: action((s: string) => {
                this.props.store.driverAnnotationSettings.cbioportalCountThreshold = parseInt(
                    s,
                    10
                );
                this.controlsHandlers.onSelectAnnotateCBioPortal &&
                    this.controlsHandlers.onSelectAnnotateCBioPortal(true);
            }),
            onSelectCustomDriverAnnotationBinary: action((s: boolean) => {
                this.props.store.driverAnnotationSettings.customBinary = s;
            }),
            onSelectHidePutativePassengers: (s: boolean) => {
                this.props.store.driverAnnotationSettings.excludeVUS = s;
            },
            onSelectHideGermlineMutations: (s: boolean) => {
                this.props.store.hideGermlineMutations = s;
            },
            onSelectSortByMutationType: (s: boolean) => {
                this.sortByMutationType = s;
            },
            onSelectSortByDrivers: (sort: boolean) => {
                this.sortByDrivers = sort;
            },
            onClickDownload: (type: string) => {
                switch (type) {
                    case 'pdf':
                        svgToPdfDownload(
                            'oncoprint.pdf',
                            this.oncoprint!.toSVG(false)
                        );
                        // if (!pdfDownload("oncoprint.pdf", this.oncoprint.toSVG(true))) {
                        //     alert("Oncoprint too big to download as PDF - please download as SVG.");
                        // }
                        break;
                    case 'png':
                        const img = this.oncoprint!.toCanvas(
                            (canvas, truncated) => {
                                canvas.toBlob(blob => {
                                    if (truncated) {
                                        alert(
                                            `Oncoprint too large - PNG truncated to ${canvas.getAttribute(
                                                'width'
                                            )}x${canvas.getAttribute('height')}`
                                        );
                                    }
                                    fileDownload(blob, 'oncoprint.png');
                                });
                            },
                            2
                        );
                        break;
                    case 'svg':
                        fileDownload(
                            new XMLSerializer().serializeToString(
                                this.oncoprint!.toSVG(false)
                            ),
                            'oncoprint.svg'
                        );
                        break;
                    case 'order':
                        const capitalizedColumnMode = 'Sample';
                        let file = `${capitalizedColumnMode} order in the Oncoprint is:\n`;
                        const caseIds = this.oncoprint!.getIdOrder();
                        for (const caseId of caseIds) {
                            file += `${caseId}\n`;
                        }
                        fileDownload(file, `OncoPrintSamples.txt`);
                        break;
                }
            },
            onSetHorzZoom: (z: number) => {
                this.oncoprint!.setHorzZoomCentered(z);
            },
            onClickZoomIn: () => {
                this.oncoprint!.setHorzZoomCentered(
                    this.oncoprint!.getHorzZoom() / 0.7
                );
            },
            onClickZoomOut: () => {
                this.oncoprint!.setHorzZoomCentered(
                    this.oncoprint!.getHorzZoom() * 0.7
                );
            },
            onClickNGCHM: () => {}, // do nothing in oncoprinter mode
        };
    }

    @action
    private initializeOncoprint() {
        onMobxPromise(
            this.props.store.alteredSampleIds,
            (alteredUids: string[]) => {
                this.oncoprint!.setHorzZoomToFit(alteredUids);
            }
        );

        this.oncoprint!.onHorzZoom(z => (this.horzZoom = z));
        this.horzZoom = this.oncoprint!.getHorzZoom();
    }

    @action.bound
    private oncoprintRef(oncoprint: OncoprintJS) {
        this.oncoprint = oncoprint;

        this.initializeOncoprint();
    }

    @action.bound
    private onMinimapClose() {
        this.showMinimap = false;
    }

    @action.bound
    private onSuppressRendering() {
        this.renderingComplete = false;
    }

    @action.bound
    private onReleaseRendering() {
        this.renderingComplete = true;
    }

    @computed get sortConfig() {
        return {
            sortByMutationType: this.sortByMutationType,
            sortByDrivers: this.sortByDrivers,
            order: this.props.store.inputSampleIdOrder,
        };
    }

    @computed get alterationInfo() {
        if (this.props.store.alteredSampleIds.isComplete) {
            const numSamples = this.props.store.sampleIds.length;
            const alteredSamples = this.props.store.alteredSampleIds.result
                .length;
            return (
                <span
                    style={{
                        marginTop: '15px',
                        marginBottom: '15px',
                        display: 'block',
                    }}
                >
                    {`Altered in ${alteredSamples} (${percentAltered(
                        alteredSamples,
                        numSamples
                    )}) of ${numSamples} samples.`}
                </span>
            );
        } else {
            return null;
        }
    }

    @computed get isLoading() {
        // todo: use mobxview
        return (
            this.props.store.geneticTracks.isPending ||
            this.props.store.alteredSampleIds.isPending ||
            this.props.store.unalteredSampleIds.isPending
        );
    }

    @computed get isHidden() {
        return this.isLoading || !this.renderingComplete;
    }

    @autobind
    private getControls() {
        if (this.oncoprint && !this.oncoprint.webgl_unavailable) {
            return (
                <FadeInteraction showByDefault={true} show={true}>
                    <OncoprintControls
                        handlers={this.controlsHandlers}
                        state={this.controlsState}
                        oncoprinterMode={true}
                    />
                </FadeInteraction>
            );
        } else {
            return <span />;
        }
    }

    @computed get width() {
        return WindowStore.size.width - 75;
    }

    public render() {
        return (
            <div className="posRelative">
                <div
                    className={classNames('oncoprintContainer', {
                        fadeIn: !this.isHidden,
                    })}
                    onMouseEnter={this.onMouseEnter}
                    onMouseLeave={this.onMouseLeave}
                >
                    {this.props.store.existCustomDrivers &&
                        !this.props.store.customDriverWarningHidden &&
                        this.props.store.driverAnnotationSettings
                            .customBinary && (
                            <InfoBanner
                                message={`Driver annotations reflect only user-provided data. Use the Mutations menu to modify annotation settings.`}
                                style={{ marginBottom: 10 }}
                                hidden={
                                    this.props.store.customDriverWarningHidden
                                }
                                hide={() => {
                                    this.props.store.customDriverWarningHidden = true;
                                }}
                            />
                        )}
                    <Observer>{this.getControls}</Observer>

                    <div style={{ position: 'relative' }}>
                        <div id="oncoprintDiv">
                            {this.alterationInfo}
                            <Oncoprint
                                key={this.props.store.submitCount}
                                oncoprintRef={this.oncoprintRef}
                                clinicalTracks={this.props.store.clinicalTracks}
                                geneticTracks={
                                    this.props.store.geneticTracks.result
                                }
                                categoricalTracks={[]} // TODO: allow import of generic assay categorical tracks
                                geneticTracksOrder={
                                    this.props.store.geneOrder &&
                                    this.props.store.geneOrder.map(
                                        getGeneticTrackKey
                                    )
                                }
                                genesetHeatmapTracks={[]}
                                heatmapTracks={this.props.store.heatmapTracks}
                                divId={this.props.divId}
                                width={this.width}
                                caseLinkOutInTooltips={false}
                                suppressRendering={this.isLoading}
                                onSuppressRendering={this.onSuppressRendering}
                                onReleaseRendering={this.onReleaseRendering}
                                hiddenIds={
                                    this.props.store.hiddenSampleIds.result
                                }
                                showClinicalTrackLegends={
                                    this.showClinicalTrackLegends
                                }
                                horzZoomToFitIds={
                                    this.props.store.alteredSampleIds.result
                                }
                                distinguishMutationType={
                                    this.distinguishMutationType
                                }
                                distinguishGermlineMutations={
                                    this.distinguishGermlineMutations
                                }
                                distinguishDrivers={this.distinguishDrivers}
                                sortConfig={this.sortConfig}
                                showWhitespaceBetweenColumns={
                                    this.showWhitespaceBetweenColumns
                                }
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
