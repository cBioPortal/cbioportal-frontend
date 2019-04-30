import * as React from "react";
import {observer} from "mobx-react";
import EnrichmentsDataSetDropdown from "../resultsView/enrichments/EnrichmentsDataSetDropdown";
import AlterationEnrichmentContainer from "../resultsView/enrichments/AlterationEnrichmentsContainer";
import GroupComparisonStore from "./GroupComparisonStore";
import autobind from "autobind-decorator";
import {MolecularProfile} from "../../shared/api/generated/CBioPortalAPI";
import {MakeMobxView} from "../../shared/components/MobxView";
import LoadingIndicator from "../../shared/components/loadingIndicator/LoadingIndicator";
import ErrorMessage from "../../shared/components/ErrorMessage";
import {getNumSamples, MakeEnrichmentsTabUI} from "./GroupComparisonUtils";

export interface ICopyNumberEnrichmentsProps {
    store: GroupComparisonStore
}

@observer
export default class CopyNumberEnrichments extends React.Component<ICopyNumberEnrichmentsProps, {}> {
    @autobind
    private onChangeProfile(m:MolecularProfile) {
        this.props.store.setCopyNumberEnrichmentProfile(m);
    }

    readonly tabUI = MakeEnrichmentsTabUI(()=>this.props.store, ()=>this.enrichmentsUI);

    readonly enrichmentsUI = MakeMobxView({
        await:()=>[
            this.props.store.copyNumberData,
            this.props.store.copyNumberEnrichmentProfile,
            this.props.store.enrichmentsGroup1,
            this.props.store.enrichmentsGroup2
        ],
        render:()=>{
            const group1Name = this.props.store.enrichmentsGroup1.result!.name;
            const group2Name = this.props.store.enrichmentsGroup2.result!.name;
            return (
                <div data-test="GroupComparisonCopyNumberEnrichments">
                    <EnrichmentsDataSetDropdown dataSets={this.props.store.copyNumberEnrichmentProfiles} onChange={this.onChangeProfile}
                                                selectedValue={this.props.store.copyNumberEnrichmentProfile.result!.molecularProfileId}/>
                    <AlterationEnrichmentContainer data={this.props.store.copyNumberData.result!}
                                                   totalGroup1Count={getNumSamples(this.props.store.enrichmentsGroup1.result!)}
                                                   totalGroup2Count={getNumSamples(this.props.store.enrichmentsGroup2.result!)}
                                                   group1Name={group1Name}
                                                   group2Name={group2Name}
                                                   group1Description={`in ${group1Name} that have the listed alteration in the listed gene.`}
                                                   group2Description={`in ${group2Name} that have the listed alteration in the listed gene.`}
                                                   alteredVsUnalteredMode={false}
                                                   selectedProfile={this.props.store.copyNumberEnrichmentProfile.result!}
                                                   headerName={this.props.store.copyNumberEnrichmentProfile.result!.name}
                                                   showCNAInTable={true}
                    />
                </div>
            );
        },
        renderPending:()=><LoadingIndicator center={true} isLoading={true} size={"big"}/>,
        renderError:()=><ErrorMessage/>
    });

    render() {
        return this.tabUI.component;
    }
}