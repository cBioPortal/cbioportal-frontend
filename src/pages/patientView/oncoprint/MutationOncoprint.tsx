import * as React from "react";
import {observer} from "mobx-react";
import Oncoprint, {IGeneHeatmapTrackSpec} from "../../../shared/components/oncoprint/Oncoprint";
import {remoteData} from "../../../public-lib";
import {MakeMobxView} from "../../../shared/components/MobxView";
import {PatientViewPageStore} from "../clinicalInformation/PatientViewPageStore";
import $ from "jquery";
import {
    getDownloadData,
    IMutationOncoprintTrackDatum, IMutationOncoprintTrackSpec,
    makeMutationHeatmapData,
    MutationStatus
} from "./MutationOncoprintUtils";
import LoadingIndicator from "../../../shared/components/loadingIndicator/LoadingIndicator";
import ErrorMessage from "../../../shared/components/ErrorMessage";
import {computed, observable} from "mobx";
import ReactSelect from "react-select";
import OncoprintJS from "oncoprintjs";
import autobind from "autobind-decorator";
import DownloadControls, {DownloadControlsButton} from "../../../public-lib/components/downloadControls/DownloadControls";
import _ from "lodash";
import SampleManager from "../sampleManager";
import WindowStore from "../../../shared/components/window/WindowStore";

export interface IMutationOncoprintProps {
    store:PatientViewPageStore;
    sampleManager:SampleManager|null;
}

const TRACK_GROUP_INDEX = 2;

@observer
export default class MutationOncoprint extends React.Component<IMutationOncoprintProps, {}> {

    private oncoprint:OncoprintJS<any>|null = null;

    constructor(props:IMutationOncoprintProps) {
        super(props);

        (window as any).mutationOncoprint = this;
    }

    @autobind
    private oncoprintRef(oncoprint:OncoprintJS<any>|null) {
        this.oncoprint = oncoprint;
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

    private readonly heatmapTracks = remoteData<IMutationOncoprintTrackSpec[]>({
        await:()=>[
            this.props.store.samples,
            this.props.store.mutationData,
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
                this.props.store.mutationData.result!,
                this.props.store.coverageInformation.result!
            );
            return Promise.resolve(this.sampleIdOrder.map((sampleId, index)=>{
                const circleColor = this.props.sampleManager ? this.props.sampleManager.getColorForSample(sampleId) : undefined;
                const labelNumber = index + 1;
                return {
                    key: sampleId,
                    label: `${labelNumber}`,
                    description: `${sampleId} data from ${this.props.store.mutationMolecularProfileId.result!}`,
                    molecularProfileId: this.props.store.mutationMolecularProfileId.result!,
                    molecularAlterationType: profile.molecularAlterationType,
                    datatype: profile.datatype,
                    data: data[sampleId],
                    trackGroupIndex:TRACK_GROUP_INDEX,
                    naLegendLabel:"Not sequenced",
                    labelColor: circleColor ? "white" : "black",
                    labelCircleColor: circleColor,
                    labelFontWeight: "normal",
                    labelLeftPadding:(labelNumber < 10 ? 20 : 17), // label padding depending on how many digits in number
                    tooltip:(data:IMutationOncoprintTrackDatum[])=>{
                        const d = data[0];
                        let vafSection:string;
                        switch (d.mutationStatus) {
                            case MutationStatus.MUTATED:
                                vafSection = "<span>VAF:"+d.profile_data!.toFixed(2)+"</span>";
                                break;
                            case MutationStatus.MUTATED_BUT_NO_VAF:
                                vafSection = "<span>Mutated, but no VAF data.</span>";
                                break;
                            case MutationStatus.PROFILED_BUT_NOT_MUTATED:
                                vafSection = "<span>Wild type</span>";
                                break;
                            case MutationStatus.NOT_PROFILED:
                            default:
                                vafSection = "<span>Not sequenced</span>";
                                break;
                        }
                        const html = "<div>"+
                                        "<span>"+d.mutation.gene.hugoGeneSymbol!+"</span><br/>"+
                                        "<span>"+d.mutation.proteinChange+"</span><br/>"+
                                        vafSection +
                                    "</div>"
                        ;
                        return $(html);
                    },
                    sortDirectionChangeable: false,
                    initSortDirection:-1 as -1,
                    movable: false
                };
            }));
        }
    });

    private readonly oncoprintUI = MakeMobxView({
        await:()=>[this.heatmapTracks],
        render:()=>{
            if (this.heatmapTracks.result!.length === 0) {
                return null;
            } else {
                return (
                    <div>
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
                        <Oncoprint
                            oncoprintRef={this.oncoprintRef}
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
        renderError:()=><ErrorMessage/>
    });

    render() {
        return this.oncoprintUI.component;
    }
}