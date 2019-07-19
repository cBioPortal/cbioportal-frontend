import * as React from "react";
import {observer} from "mobx-react";
import Oncoprint, {IGeneHeatmapTrackDatum, IGeneHeatmapTrackSpec} from "../../../shared/components/oncoprint/Oncoprint";
import {remoteData} from "../../../public-lib";
import {MakeMobxView} from "../../../shared/components/MobxView";
import _ from "lodash";
import {PatientViewPageStore} from "../clinicalInformation/PatientViewPageStore";
import $ from "jquery";
import {IMutationOncoprintTrackDatum, makeMutationHeatmapData} from "./MutationOncoprintUtils";
import {Mutation} from "../../../shared/api/generated/CBioPortalAPI";
import LoadingIndicator from "../../../shared/components/loadingIndicator/LoadingIndicator";
import ErrorMessage from "../../../shared/components/ErrorMessage";

export interface IMutationOncoprintProps {
    store:PatientViewPageStore;
}

const TRACK_GROUP_INDEX = 2;

@observer
export default class MutationOncoprint extends React.Component<IMutationOncoprintProps, {}> {
    private readonly heatmapTracks = remoteData<IGeneHeatmapTrackSpec[]>({
        await:()=>[
            this.props.store.samples,
            this.props.store.mutationData,
            this.props.store.mutationMolecularProfile
        ],
        invoke:()=>{
            if (this.props.store.mutationData.result!.length === 0) {
                return Promise.resolve([]);
            }
            const profile = this.props.store.mutationMolecularProfile.result!;
            const data = makeMutationHeatmapData(this.props.store.samples.result!, this.props.store.mutationData.result!);
            return Promise.resolve(this.props.store.samples.result!.map(sample=>{
                return {
                    key: sample.uniqueSampleKey,
                    label: sample.sampleId,
                    molecularProfileId: this.props.store.mutationMolecularProfileId.result!,
                    molecularAlterationType: profile.molecularAlterationType,
                    datatype: profile.datatype,
                    data: data[sample.uniqueSampleKey],
                    trackGroupIndex:TRACK_GROUP_INDEX,
                    tooltip:(data:IMutationOncoprintTrackDatum[])=>{
                        const d = data[0];
                        const html = "<div>"+
                                        "<span>"+d.sample!+"</span><br/>"+
                                        "<span>"+d.mutation.proteinChange+"</span><br/>"+
                                        "<span>VAF:"+d.profile_data+"</span>"+
                                    "</div>";
                        return $(html)
                    },
                    sortDirectionChangeable: false
                    //init_sort_direction:-1 as -1
                };
            }));
        }
    });

    private readonly oncoprint = MakeMobxView({
        await:()=>[this.heatmapTracks],
        render:()=>{
            if (this.heatmapTracks.result!.length === 0) {
                return null;
            } else {
                return (
                    <Oncoprint
                        clinicalTracks={[]}
                        geneticTracks={[]}
                        genesetHeatmapTracks={[]}
                        heatmapTracks={this.heatmapTracks.result!}
                        divId="MutationHeatmap"
                        width={900}
                        caseLinkOutInTooltips={false}
                        sortConfig={{
                            clusterHeatmapTrackGroupIndex: TRACK_GROUP_INDEX
                        }}
                    />
                );
            }
        },
        renderPending:()=><LoadingIndicator isLoading={true}/>,
        renderError:()=><ErrorMessage/>
    });

    render() {
        return this.oncoprint.component;
    }
}