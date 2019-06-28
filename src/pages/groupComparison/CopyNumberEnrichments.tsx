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
import {MakeEnrichmentsTabUI, getNumSamples} from "./GroupComparisonUtils";
import { remoteData } from "public-lib/api/remoteData";
import _ from "lodash";
import { AlterationContainerType } from "pages/resultsView/enrichments/EnrichmentsUtil";

export interface ICopyNumberEnrichmentsProps {
    store: GroupComparisonStore
}

@observer
export default class CopyNumberEnrichments extends React.Component<ICopyNumberEnrichmentsProps, {}> {
    @autobind
    private onChangeProfile(m:MolecularProfile) {
        this.props.store.setCopyNumberEnrichmentProfile(m);
    }

    readonly tabUI = MakeEnrichmentsTabUI(()=>this.props.store, ()=>this.enrichmentsUI, "copy-number", true);

    private readonly enrichmentAnalysisGroups = remoteData({
        await:()=>[this.props.store._activeGroupsOverlapRemoved],
        invoke:()=>{
            const groups = _.map(this.props.store._activeGroupsOverlapRemoved.result, group => {
                return {
                    name:group.nameWithOrdinal,
                    description:`Number (percentage) of samples in ${group.nameWithOrdinal} that have the listed alteration in the listed gene.`,
                    count: getNumSamples(group),
                    color: group.color
                }
            })
            return Promise.resolve(groups);
        }
    });

    readonly enrichmentsUI = MakeMobxView({
        await:()=>[
            this.props.store.copyNumberData,
            this.props.store.copyNumberEnrichmentProfile,
            this.enrichmentAnalysisGroups
        ],
        render:()=>{
            return (
                <div data-test="GroupComparisonCopyNumberEnrichments">
                    <EnrichmentsDataSetDropdown dataSets={this.props.store.copyNumberEnrichmentProfiles} onChange={this.onChangeProfile}
                                                selectedValue={this.props.store.copyNumberEnrichmentProfile.result!.molecularProfileId}/>
                    <AlterationEnrichmentContainer data={this.props.store.copyNumberData.result!}
                        groups={this.enrichmentAnalysisGroups.result}
                        alteredVsUnalteredMode={false}
                        headerName={this.props.store.copyNumberEnrichmentProfile.result!.name}
                        showCNAInTable={true}
                        containerType={AlterationContainerType.COPY_NUMBER}
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