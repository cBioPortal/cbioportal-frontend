import * as React from "react";
import {observer} from "mobx-react";
import {ResultsViewPageStore} from "../resultsView/ResultsViewPageStore";
import GroupComparisonStore from "./GroupComparisonStore";
import MutationEnrichments from "./MutationEnrichments";

export interface IGroupComparisonTabProps {
    store:GroupComparisonStore;
}

@observer
export default class GroupComparisonTab extends React.Component<IGroupComparisonTabProps, {}> {
    render() {
        return <MutationEnrichments store={this.props.store}/>;
    }
}