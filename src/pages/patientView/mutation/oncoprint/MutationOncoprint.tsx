import * as React from "react";
import {observer} from "mobx-react";
import Oncoprint, {IOncoprintProps} from "../../../../shared/components/oncoprint/Oncoprint";
import {remoteData} from "../../../../public-lib";
import {MakeMobxView} from "../../../../shared/components/MobxView";
import {PatientViewPageStore} from "../../clinicalInformation/PatientViewPageStore";
import $ from "jquery";
import {
    getDownloadData, getMutationLabel,
    IMutationOncoprintTrackDatum, IMutationOncoprintTrackSpec,
    makeMutationHeatmapData
} from "./MutationOncoprintUtils";
import LoadingIndicator from "../../../../shared/components/loadingIndicator/LoadingIndicator";
import ErrorMessage from "../../../../shared/components/ErrorMessage";
import {computed, observable} from "mobx";
import ReactSelect from "react-select";
import OncoprintJS, {InitParams, ColumnLabel, TrackId, ColumnId} from "oncoprintjs";
import autobind from "autobind-decorator";
import DownloadControls, {DownloadControlsButton} from "../../../../public-lib/components/downloadControls/DownloadControls";
import _ from "lodash";
import SampleManager from "../../SampleManager";
import WindowStore from "../../../../shared/components/window/WindowStore";
import {generateMutationIdByGeneAndProteinChangeAndEvent} from "../../../../shared/lib/StoreUtils";
import LabeledCheckbox from "../../../../shared/components/labeledCheckbox/LabeledCheckbox";
import {MutationStatus, mutationTooltip} from "../PatientViewMutationsTabUtils";
import DefaultTooltip from "../../../../public-lib/components/defaultTooltip/DefaultTooltip";
import Slider from "react-rangeslider";
import "react-rangeslider/lib/index.css";
import styles from "./styles.module.scss";
import PatientViewMutationsDataStore from "../PatientViewMutationsDataStore";
import {Mutation} from "../../../../shared/api/generated/CBioPortalAPI";
import ReactDOM from "react-dom";

export interface IMutationOncoprintProps {
    store:PatientViewPageStore;
    dataStore:PatientViewMutationsDataStore;
    sampleManager:SampleManager|null;
}

export enum MutationOncoprintMode {
    MUTATION_TRACKS,
    SAMPLE_TRACKS
}

const TRACK_GROUP_INDEX = 2;
const INIT_PARAMS:InitParams = {
    init_cell_width:20,
    init_cell_padding:1,
    cell_padding_off_cell_width_threshold:10
};

@observer
export default class MutationOncoprint extends React.Component<IMutationOncoprintProps, {}> {

    private oncoprint:OncoprintJS|null = null;
    private oncoprintComponent:Oncoprint|null = null;
    @observable private showMutationLabels = true;
    @observable private horzZoomSliderState = 100;
    @observable clustered = true;
    @observable private mode:MutationOncoprintMode = MutationOncoprintMode.SAMPLE_TRACKS;

    constructor(props:IMutationOncoprintProps) {
        super(props);

        (window as any).mutationOncoprint = this;
    }

    @autobind
    private oncoprintComponentRef(oncoprint:Oncoprint|null) {
        this.oncoprintComponent = oncoprint;
    }

    @autobind
    private oncoprintRef(oncoprint:OncoprintJS) {
        this.oncoprint = oncoprint;
        this.oncoprint.onHorzZoom(z=>(this.horzZoomSliderState = z));
        this.horzZoomSliderState = this.oncoprint.getHorzZoom();
        this.oncoprint.onCellMouseOver((uid:string|null, track_id?:TrackId)=>{
            if (this.mode === MutationOncoprintMode.SAMPLE_TRACKS && uid !== null) {
                const mutation = this.mutationKeyToMutation[uid];
                if (mutation) {
                    this.props.dataStore.setMouseOverMutation(mutation);
                }
            } else if (this.mode === MutationOncoprintMode.MUTATION_TRACKS && track_id !== undefined) {
                // set mouseover mutation based on track
                if (this.oncoprintComponent) {
                    const key = this.oncoprintComponent.getTrackSpecKey(track_id);
                    const mutation = key && this.mutationKeyToMutation[key];
                    if (mutation) {
                        this.props.dataStore.setMouseOverMutation(mutation);
                    }
                }
            } else {
                this.props.dataStore.setMouseOverMutation(null);
            }
        });
        this.oncoprint.onCellClick((uid:ColumnId|null, track_id?:TrackId)=>{
            if (this.mode === MutationOncoprintMode.SAMPLE_TRACKS && uid!== null) {
                const mutation = this.mutationKeyToMutation[uid];
                if (mutation) {
                    this.props.dataStore.toggleHighlightedMutation(mutation);
                }
            } else if (this.mode === MutationOncoprintMode.MUTATION_TRACKS && track_id !== undefined) {
                if (this.oncoprintComponent) {
                    // toggle highlighted mutation based on track
                    const key = this.oncoprintComponent.getTrackSpecKey(track_id);
                    const mutation = key && this.mutationKeyToMutation[key];
                    if (mutation) {
                        this.props.dataStore.toggleHighlightedMutation(mutation);
                    }
                }
            } else {
                this.props.dataStore.setHighlightedMutations([]);
            }
        });
    }

    readonly sortConfig = remoteData<IOncoprintProps["sortConfig"]>({
        await:()=>[this.sampleIdOrder],
        invoke:()=>{
            if (this.clustered) {
                return Promise.resolve({
                    clusterHeatmapTrackGroupIndex: TRACK_GROUP_INDEX
                });
            } else if (this.mode === MutationOncoprintMode.MUTATION_TRACKS) {
                return Promise.resolve({
                    order: this.sampleIdOrder.result!
                });
            } else {
                return Promise.resolve({});
            }
        }
    });

    // TODO: be able to highlight a track in mutation track mode
    @computed get highlightedMutationIds() {
        const mutation = this.props.dataStore.getMouseOverMutation();
        const highlighted = this.props.dataStore.highlightedMutations.slice();
        if (mutation) {
            highlighted.push(mutation);
        }
        return highlighted.map(generateMutationIdByGeneAndProteinChangeAndEvent);
    }

    @computed get highlightedIds() {
        if (this.mode === MutationOncoprintMode.SAMPLE_TRACKS) {
            return this.highlightedMutationIds;
        } else {
            return undefined;
        }
    }

    @computed get highlightedTracks() {
        if (this.mode === MutationOncoprintMode.MUTATION_TRACKS) {
            return this.highlightedMutationIds;
        } else {
            return undefined;
        }
    }

    readonly sampleIdOrder = remoteData({
        await:()=>[this.props.store.samples],
        invoke:()=>{
            if (this.props.sampleManager) {
                return Promise.resolve(this.props.sampleManager.getSampleIdsInOrder());
            } else {
                return Promise.resolve(this.props.store.samples.result!.map(s=>s.sampleId));
            }
        }
    });

    readonly mutationWithIdOrder = remoteData({
        await:()=>[this.props.store.mutationData, this.props.store.uncalledMutationData],
        invoke:()=>{
            // TODO: any specific order?
            const mutations = [];
            for (const d of this.props.store.mutationData.result!) {
                mutations.push({
                    mutation: d,
                    id: generateMutationIdByGeneAndProteinChangeAndEvent(d)
                });
            }
            for (const d of this.props.store.uncalledMutationData.result!) {
                mutations.push({
                    mutation: d,
                    id: generateMutationIdByGeneAndProteinChangeAndEvent(d)
                });
            }
            return Promise.resolve(
                _.chain(mutations)
                    .uniqBy((m:any)=>m.id)
                    .sortBy((m:any)=>getMutationLabel(m.mutation)).value()
            );
        }
    });

    @autobind
    private updateOncoprintHorzZoom() {
        this.oncoprint && this.oncoprint.setHorzZoom(this.horzZoomSliderState);
    }

    @autobind
    private onClickZoomIn() {
        this.oncoprint && this.oncoprint.setHorzZoom(this.oncoprint.getHorzZoom()/0.7);
    }

    @autobind
    private onClickZoomOut() {
        this.oncoprint && this.oncoprint.setHorzZoom(this.oncoprint.getHorzZoom()*0.7);
    }

    @computed get mutationKeyToMutation() {
        if (this.props.store.mutationData.isComplete && this.props.store.uncalledMutationData.isComplete) {
            return _.keyBy(
                this.props.store.mutationData.result!.concat(this.props.store.uncalledMutationData.result!),
                generateMutationIdByGeneAndProteinChangeAndEvent
            );
        } else {
            return {};
        }
    }

    // Members that change based on the mode

    //      Column labels
    private readonly mutationModeColumnLabels = remoteData({
        await:()=>[this.sampleIdOrder],
        invoke:()=>{
            return Promise.resolve(this.sampleIdOrder.result!.reduce((labels, sampleId, index)=>{
                const labelNumber = index+1;
                labels[sampleId] = {
                    text: labelNumber.toString(),
                    angle_in_degrees: 0,
                    text_color: "#ffffff",
                    circle_color: this.props.sampleManager!.getColorForSample(sampleId),
                    left_padding_percent: (labelNumber < 10 ? -10 : -30), // label padding depending on how many digits in number
                };
                return labels;
            }, {} as {[sampleId:string]:ColumnLabel}));
        }
    });

    private readonly sampleModeColumnLabels = remoteData({
        await:()=>[this.props.store.mutationData, this.props.store.uncalledMutationData],
        invoke:()=>{
            const ret:{[uid:string]:ColumnLabel} = {};
            if (this.showMutationLabels) {
                for (const mutation of this.props.store.mutationData.result!.concat(this.props.store.uncalledMutationData.result!)) {
                    ret[generateMutationIdByGeneAndProteinChangeAndEvent(mutation)] = {
                        text: getMutationLabel(mutation)
                    };
                }
            }
            return Promise.resolve(ret);
        }
    });

    @computed get columnLabels() {
        switch (this.mode) {
            case MutationOncoprintMode.MUTATION_TRACKS:
                return this.mutationModeColumnLabels;
            case MutationOncoprintMode.SAMPLE_TRACKS:
            default:
                return this.sampleModeColumnLabels;
        }
    }

    //      Heatmap tracks order
    readonly sampleModeHeatmapTracksOrder = remoteData({
        await:()=>[this.sampleIdOrder],
        invoke:()=>{
            if (this.clustered) {
                return Promise.resolve(undefined);
            } else {
                return Promise.resolve({[TRACK_GROUP_INDEX]:this.sampleIdOrder.result!});
            }
        }
    });

    readonly mutationModeHeatmapTracksOrder = remoteData({
        await:()=>[this.mutationWithIdOrder],
        invoke:()=>{
            if (this.clustered) {
                return Promise.resolve(undefined);
            } else {
                return Promise.resolve({[TRACK_GROUP_INDEX]:this.mutationWithIdOrder.result!.map(m=>m.id)});
            }
        }
    });

    @computed get heatmapTracksOrder() {
        switch (this.mode) {
            case MutationOncoprintMode.MUTATION_TRACKS:
                return this.mutationModeHeatmapTracksOrder;
            case MutationOncoprintMode.SAMPLE_TRACKS:
            default:
                return this.sampleModeHeatmapTracksOrder;
        }
    }

    //      Heatmap tracks
    private readonly sampleModeHeatmapTracks = remoteData<IMutationOncoprintTrackSpec[]>({
        await:()=>[
            this.props.store.samples,
            this.sampleIdOrder,
            this.props.store.mutationData,
            this.props.store.uncalledMutationData,
            this.props.store.mutationMolecularProfile,
            this.props.store.coverageInformation,
        ],
        invoke:()=>{
            if (this.props.store.mutationData.result!.length === 0) {
                return Promise.resolve([]);
            }
            const profile = this.props.store.mutationMolecularProfile.result!;
            const trackData = makeMutationHeatmapData(
                this.props.store.samples.result!,
                this.props.store.mutationData.result!.concat(this.props.store.uncalledMutationData.result!),
                this.props.store.coverageInformation.result!,
                MutationOncoprintMode.SAMPLE_TRACKS
            );
            const tracks:IMutationOncoprintTrackSpec[] = [];
            this.sampleIdOrder.result!.forEach((sampleId, index)=>{
                const data = trackData[sampleId];
                if (!data || !data.length) {
                    return;
                }
                const circleColor = this.props.sampleManager ? this.props.sampleManager.getColorForSample(sampleId) : undefined;
                const labelNumber = index + 1;
                tracks.push({
                    key: sampleId,
                    label: `${labelNumber}`,
                    description: `${sampleId} data from ${profile.molecularProfileId}`,
                    molecularProfileId: profile.molecularProfileId,
                    molecularAlterationType: profile.molecularAlterationType,
                    datatype: profile.datatype,
                    data,
                    trackGroupIndex:TRACK_GROUP_INDEX,
                    naLegendLabel:"Not sequenced",
                    labelColor: circleColor ? "white" : "black",
                    labelCircleColor: circleColor,
                    labelFontWeight: "normal",
                    labelLeftPadding:(labelNumber < 10 ? 20 : 17), // label padding depending on how many digits in number
                    hasColumnSpacing:true,
                    tooltip:(data:IMutationOncoprintTrackDatum[])=>{
                        const d = data[0];
                        const tooltipJSX = mutationTooltip(
                            d.mutation,
                            {
                                sampleId:d.sample!,
                                mutationStatus:d.mutationStatus,
                                vaf:d.profile_data
                            }
                        );
                        // convert JSX into HTML string by rendering to dummy element then using innerHTML
                        const dummyElt = document.createElement("div");
                        ReactDOM.render(tooltipJSX, dummyElt);
                        const html = dummyElt.innerHTML;
                        return $(html);
                    },
                    sortDirectionChangeable: false,
                    initSortDirection:-1 as -1,
                    movable: false
                });
            });
            return Promise.resolve(tracks);
        }
    });

    private readonly mutationModeHeatmapTracks = remoteData<IMutationOncoprintTrackSpec[]>({
        await:()=>[
            this.props.store.samples,
            this.mutationWithIdOrder,
            this.props.store.mutationData,
            this.props.store.uncalledMutationData,
            this.props.store.mutationMolecularProfile,
            this.props.store.coverageInformation,
        ],
        invoke:()=>{
            if (this.props.store.mutationData.result!.length === 0) {
                return Promise.resolve([]);
            }
            const profile = this.props.store.mutationMolecularProfile.result!;
            const trackData = makeMutationHeatmapData(
                this.props.store.samples.result!,
                this.props.store.mutationData.result!.concat(this.props.store.uncalledMutationData.result!),
                this.props.store.coverageInformation.result!,
                MutationOncoprintMode.MUTATION_TRACKS
            );
            const tracks:IMutationOncoprintTrackSpec[] = [];
            this.mutationWithIdOrder.result!.forEach((mutationWithId)=>{
                const data = trackData[mutationWithId.id];
                if (!data || !data.length) {
                    return;
                }
                tracks.push({
                    key: mutationWithId.id,
                    label: getMutationLabel(mutationWithId.mutation),
                    description: `${getMutationLabel(mutationWithId.mutation)} data from ${profile.molecularProfileId}`,
                    molecularProfileId: profile.molecularProfileId,
                    molecularAlterationType: profile.molecularAlterationType,
                    datatype: profile.datatype,
                    data,
                    trackGroupIndex:TRACK_GROUP_INDEX,
                    naLegendLabel:"Not sequenced",
                    labelFontWeight: "normal",
                    hasColumnSpacing:true,
                    tooltip:(data:IMutationOncoprintTrackDatum[])=>{
                        const d = data[0];
                        const tooltipJSX = mutationTooltip(
                            d.mutation,
                            {
                                sampleId:d.sample!,
                                mutationStatus:d.mutationStatus,
                                vaf:d.profile_data
                            }
                        );
                        // convert JSX into HTML string by rendering to dummy element then using innerHTML
                        const dummyElt = document.createElement("div");
                        ReactDOM.render(tooltipJSX, dummyElt);
                        const html = dummyElt.innerHTML;
                        return $(html);
                    },
                    sortDirectionChangeable: false,
                    initSortDirection:-1 as -1,
                    movable: false
                });
            });
            return Promise.resolve(tracks);
        }
    });

    @computed get heatmapTracks() {
        switch (this.mode) {
            case MutationOncoprintMode.MUTATION_TRACKS:
                return this.mutationModeHeatmapTracks; // TODO
            case MutationOncoprintMode.SAMPLE_TRACKS:
            default:
                return this.sampleModeHeatmapTracks;
        }
    }

    // View elements

    @computed get zoomControls() {
        return (
            <div className={styles.zoomControls}>
                <DefaultTooltip
                    overlay={<span>Zoom out of heatmap</span>}
                    placement="top"
                >
                    <div
                        onClick={this.onClickZoomOut}
                        className={styles.zoomButton}
                    >
                        <i className="fa fa-search-minus"></i>
                    </div>
                </DefaultTooltip>
                <DefaultTooltip
                    overlay={<span>Zoom in/out of heatmap</span>}
                    placement="top"
                >
                    <div style={{width:"90px"}}>
                        <Slider
                            value={this.horzZoomSliderState}
                            onChange={(z:number)=>(this.horzZoomSliderState = z)}
                            onChangeComplete={this.updateOncoprintHorzZoom}
                            step={0.01}
                            max={1}
                            min={0}
                            tooltip={false}
                        />
                    </div>
                </DefaultTooltip>
                <DefaultTooltip
                    overlay={<span>Zoom in to heatmap</span>}
                    placement="top"
                >
                    <div
                        className={styles.zoomButton}
                        onClick={this.onClickZoomIn}
                    >
                        <i className="fa fa-search-plus"></i>
                    </div>
                </DefaultTooltip>
            </div>
        );
    }

    @computed get header() {
        return (
            <div style={{display:"inline-flex", alignItems:"center", marginBottom:5}}>
                <LabeledCheckbox
                    checked={this.clustered}
                    onChange={()=>{ this.clustered = !this.clustered; }}
                    labelProps={{style:{ marginRight:10}}}
                    inputProps={{"data-test":"HeatmapCluster"}}
                >
                    <span style={{marginTop:-3}}>Cluster</span>
                </LabeledCheckbox>
                <LabeledCheckbox
                    checked={this.mode === MutationOncoprintMode.MUTATION_TRACKS}
                    onChange={()=>{ this.mode = (this.mode === MutationOncoprintMode.MUTATION_TRACKS ? MutationOncoprintMode.SAMPLE_TRACKS : MutationOncoprintMode.MUTATION_TRACKS); }}
                    labelProps={{style:{ marginRight:10}}}
                    inputProps={{"data-test":"HeatmapTranspose"}}
                >
                    <span style={{marginTop:-3}}>Transpose</span>
                </LabeledCheckbox>
                <LabeledCheckbox
                    checked={this.showMutationLabels}
                    onChange={()=>{ this.showMutationLabels = !this.showMutationLabels; }}
                    labelProps={{style:{ marginRight:10}}}
                    inputProps={{"data-test":"HeatmapMutationLabels"}}
                >
                    <span style={{marginTop:-3}}>Show mutation labels</span>
                </LabeledCheckbox>
                {this.zoomControls}
                <DownloadControls
                    filename="vafHeatmap"
                    getSvg={()=>(this.oncoprint ? this.oncoprint.toSVG(true) : null)}
                    getData={()=>{
                        const data = _.flatMap(this.heatmapTracks.result!, track=>track.data);
                        return getDownloadData(data);
                    }}
                    buttons={["SVG", "PNG", "Data"]}
                    type="button"
                    dontFade
                    style={{
                        marginLeft:10
                    }}
                />
            </div>
        );
    }

    private readonly oncoprintUI = MakeMobxView({
        await:()=>[
            this.heatmapTracks,
            this.heatmapTracksOrder,
            this.columnLabels,
            this.sortConfig
        ],
        render:()=>{
            if (this.heatmapTracks.result!.length === 0) {
                return null;
            } else {
                return (
                    <div>
                        {this.header}
                        <Oncoprint
                            key="MutationOncoprint"
                            ref={this.oncoprintComponentRef}
                            oncoprintRef={this.oncoprintRef}
                            highlightedIds={this.highlightedIds}
                            highlightedTracks={this.highlightedTracks}
                            initParams={INIT_PARAMS}
                            showTrackLabels={!(this.mode === MutationOncoprintMode.MUTATION_TRACKS && !this.showMutationLabels)}
                            columnLabels={this.columnLabels.result!}
                            clinicalTracks={[]}
                            geneticTracks={[]}
                            genesetHeatmapTracks={[]}
                            heatmapTracks={this.heatmapTracks.result!}
                            heatmapTracksOrder={this.heatmapTracksOrder.result}
                            divId="MutationHeatmap"
                            width={WindowStore.size.width - 100}
                            caseLinkOutInTooltips={false}
                            sortConfig={this.sortConfig.result!}
                        />
                    </div>
                );
            }
        },
        renderPending:()=><LoadingIndicator isLoading={true}/>,
        renderError:()=><ErrorMessage/>,
        showLastRenderWhenPending: true
    });

    render() {
        return this.oncoprintUI.component;
    }
}