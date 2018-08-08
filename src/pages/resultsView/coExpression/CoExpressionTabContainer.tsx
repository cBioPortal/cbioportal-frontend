import * as React from "react";
import {ResultsViewPageStore} from "../ResultsViewPageStore";
import CoExpressionTab from "./CoExpressionTab";
import LoadingIndicator from "shared/components/loadingIndicator/LoadingIndicator";
import {observer} from "mobx-react";

@observer
export default class CoexpressionTabContainer extends React.Component<{ store:ResultsViewPageStore }, {}> {
    render() {
        if (this.props.store.molecularProfilesInStudies.isComplete &&
            this.props.store.genes.isComplete &&
            this.props.store.studyToDataQueryFilter.isComplete &&
            this.props.store.geneMolecularDataCache.isComplete
        ) {
            return (
                <CoExpressionTab
                    store={this.props.store}
                    molecularProfiles={this.props.store.molecularProfilesInStudies.result}
                    genes={this.props.store.genes.result}
                    studyToDataQueryFilter={this.props.store.studyToDataQueryFilter.result}
                    numericGeneMolecularDataCache={this.props.store.numericGeneMolecularDataCache}
                    mutationCache={this.props.store.mutationCache}
                    molecularProfileIdToProfiledSampleCount={this.props.store.molecularProfileIdToProfiledSampleCount}
                    coverageInformation={this.props.store.coverageInformation}
                    studyToMutationMolecularProfile={this.props.store.studyToMutationMolecularProfile}
                />
            );
        } else {
            return (
                <LoadingIndicator
                    isLoading={true}
                />
            );
        }
    }
}