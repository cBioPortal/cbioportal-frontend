import * as React from "react";
import {observer} from "mobx-react";
import Oncoprint, {IGeneHeatmapTrackSpec} from "../../../../shared/components/oncoprint/Oncoprint";
import {remoteData} from "../../../../public-lib";
import {MakeMobxView} from "../../../../shared/components/MobxView";
import {PatientViewPageStore} from "../../clinicalInformation/PatientViewPageStore";
import $ from "jquery";
import {
    getDownloadData,
    IMutationOncoprintTrackDatum, IMutationOncoprintTrackSpec,
    makeMutationHeatmapData
} from "./MutationOncoprintUtils";
import LoadingIndicator from "../../../../shared/components/loadingIndicator/LoadingIndicator";
import ErrorMessage from "../../../../shared/components/ErrorMessage";
import {computed, observable} from "mobx";
import ReactSelect from "react-select";
import OncoprintJS, {InitParams} from "oncoprintjs";
import autobind from "autobind-decorator";
import DownloadControls, {DownloadControlsButton} from "../../../../public-lib/components/downloadControls/DownloadControls";
import _ from "lodash";
import SampleManager from "../../sampleManager";
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

const TRACK_GROUP_INDEX = 2;
const INIT_PARAMS:InitParams = {
    init_cell_width:20,
    init_cell_padding:1,
    cell_padding_off_cell_width_threshold:10
};

@observer
export default class MutationOncoprint extends React.Component<IMutationOncoprintProps, {}> {

    private oncoprint:OncoprintJS<any>|null = null;
    @observable private showColumnLabels = true;
    @observable private horzZoomSliderState = 100;

    constructor(props:IMutationOncoprintProps) {
        super(props);

        (window as any).mutationOncoprint = this;
    }

    @autobind
    private oncoprintRef(oncoprint:OncoprintJS<any>) {
        this.oncoprint = oncoprint;
        this.oncoprint.onHorzZoom(z=>(this.horzZoomSliderState = z));
        this.horzZoomSliderState = this.oncoprint.getHorzZoom();
        this.oncoprint.onCellMouseOver((uid:string|null)=>{
            if (uid === null) {
                this.props.dataStore.setMouseOverMutation(null);
            } else {
                const mutation = this.mutationKeyToMutation[uid];
                this.props.dataStore.setMouseOverMutation(mutation || null);
            }
        });
        this.oncoprint.onCellClick((uid:string|null)=>{
            if (uid) {
                const mutation = this.mutationKeyToMutation[uid];
                if (mutation) {
                    this.props.dataStore.toggleHighlightedMutation(mutation);
                }
            }
        });
    }

    @observable clustered = true;

    @computed get sortConfig() {
        if (this.clustered) {
            return {
                clusterHeatmapTrackGroupIndex: TRACK_GROUP_INDEX
            };
        } else {
            return {};
        }
    }

    @computed get heatmapTracksOrder() {
        if (this.clustered || !this.props.store.samples.isComplete) {
            return undefined;
        } else {
            return {
                [TRACK_GROUP_INDEX]:this.sampleIdOrder
            };
        }
    }

    @computed get sampleIdOrder() {
        if (this.props.sampleManager) {
            return this.props.sampleManager.getSampleIdsInOrder();
        } else {
            return this.props.store.samples.result!.map(s=>s.sampleId);
        }
    }

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
        if (this.props.store.mutationData.isComplete) {
            return _.keyBy(this.props.store.mutationData.result!, generateMutationIdByGeneAndProteinChangeAndEvent);
        } else {
            return {};
        }
    }

    private readonly heatmapTracks = remoteData<IMutationOncoprintTrackSpec[]>({
        await:()=>[
            this.props.store.samples,
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
            const data = makeMutationHeatmapData(
                this.props.store.samples.result!,
                this.props.store.mutationData.result!.concat(this.props.store.uncalledMutationData.result!),
                this.props.store.coverageInformation.result!
            );
            return Promise.resolve(this.sampleIdOrder.map((sampleId, index)=>{
                const circleColor = this.props.sampleManager ? this.props.sampleManager.getColorForSample(sampleId) : undefined;
                const labelNumber = index + 1;
                return {
                    key: sampleId,
                    label: `${labelNumber}`,
                    description: `${sampleId} data from ${profile.molecularProfileId}`,
                    molecularProfileId: profile.molecularProfileId,
                    molecularAlterationType: profile.molecularAlterationType,
                    datatype: profile.datatype,
                    data: data[sampleId],
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
                };
            }));
        }
    });

    private readonly columnLabels = remoteData({
        await:()=>[this.props.store.mutationData],
        invoke:()=>{
            const ret:{[uid:string]:string} = {};
            if (this.showColumnLabels) {
                for (const mutation of this.props.store.mutationData.result!) {
                    ret[generateMutationIdByGeneAndProteinChangeAndEvent(mutation)] = `${mutation.gene.hugoGeneSymbol} ${mutation.proteinChange}`;
                }
            }
            return Promise.resolve(ret);
        }
    });

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
                <div style={{display:"flex", alignItems:"center"}}>
                    <span>Sort configuration:&nbsp;</span>
                    <div style={{ width: 250, marginRight: 7 }} >
                        <ReactSelect
                            name="select sort configuration"
                            onChange={(option:any|null)=>{
                                if (option) {
                                    this.clustered = option.value;
                                }
                            }}
                            options={[
                                { label: "Cluster", value: true},
                                { label: "Sample order", value: false}
                            ]}
                            clearable={false}
                            searchable={false}
                            value={{ label: this.clustered ? "Cluster" : "Sample order", value:this.clustered}}
                            styles={{
                                control: (provided:any)=>({
                                    ...provided,
                                    height:36,
                                    minHeight:36,
                                    border: "1px solid rgb(204,204,204)"
                                }),
                                menu: (provided:any)=>({
                                    ...provided,
                                    maxHeight: 400
                                }),
                                menuList: (provided:any)=>({
                                    ...provided,
                                    maxHeight:400
                                }),
                                placeholder:(provided:any)=>({
                                    ...provided,
                                    color: "#000000"
                                }),
                                dropdownIndicator:(provided:any)=>({
                                    ...provided,
                                    color:"#000000"
                                }),
                                option:(provided:any, state:any)=>{
                                    return {
                                        ...provided,
                                        cursor:"pointer",
                                    };
                                }
                            }}
                            theme={(theme:any)=>({
                                ...theme,
                                colors: {
                                    ...theme.colors,
                                    neutral80:"black",
                                    //primary: theme.colors.primary50
                                },
                            })}
                        />
                    </div>
                </div>
                <LabeledCheckbox
                    checked={this.showColumnLabels}
                    onChange={()=>{ this.showColumnLabels = !this.showColumnLabels; }}
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
                    buttons={["SVG", "PNG", "PDF", "Data"]}
                    type="button"
                    dontFade
                    style={{
                        marginLeft:10
                    }}
                />
            </div>
        );
    }

    @computed get highlightedIds() {
        const mutation = this.props.dataStore.getMouseOverMutation();
        const highlighted = this.props.dataStore.highlightedMutations.slice();
        if (mutation) {
            highlighted.push(mutation);
        }
        return highlighted.map(generateMutationIdByGeneAndProteinChangeAndEvent);
    }

    private readonly oncoprintUI = MakeMobxView({
        await:()=>[this.heatmapTracks, this.columnLabels],
        render:()=>{
            if (this.heatmapTracks.result!.length === 0) {
                return null;
            } else {

                return (
                    <div>
                        {this.header}
                        <Oncoprint
                            oncoprintRef={this.oncoprintRef}
                            highlightedIds={this.highlightedIds}
                            initParams={INIT_PARAMS}
                            columnLabels={this.columnLabels.result!}
                            clinicalTracks={[]}
                            geneticTracks={[]}
                            genesetHeatmapTracks={[]}
                            heatmapTracks={this.heatmapTracks.result!}
                            heatmapTracksOrder={this.heatmapTracksOrder}
                            divId="MutationHeatmap"
                            width={WindowStore.size.width - 100}
                            caseLinkOutInTooltips={false}
                            sortConfig={this.sortConfig}
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