import * as React from "react";
import {observer} from "mobx-react";
import { ComparisonSampleGroup, caseCountsInParens, ComparisonGroup } from "./GroupComparisonUtils";
import MobxPromise from "mobxpromise";
import { ButtonGroup, Button } from "react-bootstrap";
import { MakeMobxView } from "shared/components/MobxView";
import LoadingIndicator from "shared/components/loadingIndicator/LoadingIndicator";
import ErrorMessage from "shared/components/ErrorMessage";
import _ from "lodash";
import GroupComparisonStore from "./GroupComparisonStore";
import classNames from "classnames";
import ListIndexedMap from "shared/lib/ListIndexedMap";
import { SampleIdentifier, PatientIdentifier } from "shared/api/generated/CBioPortalAPI";

export interface IGroupSelectorProps {
    store:GroupComparisonStore;
}

@observer
export default class GroupSelector extends React.Component<IGroupSelectorProps,{}> {
    readonly tabUI = MakeMobxView({
        await:()=>[
            this.props.store.overlapFilteredAvailableComparisonGroups, 
            this.props.store.activeComparisonGroups, 
        ],
        render:()=>{
            if (this.props.store.availableComparisonGroups.result!.length === 0) {
                return null;
            } else {
                const selectedGroups = _.keyBy(this.props.store.activeComparisonGroups.result!, g=>g.id);
                return (
                    <div className="btn-group" style={{
                        maxWidth:400
                    }}>
                        {this.props.store.overlapFilteredAvailableComparisonGroups.result!.map(group=>(
                            <button
                                className={classNames("btn", "noBorderRadius", "noMarginLeft", { "btn-primary":(group.id in selectedGroups), "btn-default":!(group.id in selectedGroups)})}
                                onClick={()=>this.props.store.toggleComparisonGroupSelected(group.id)}
                                disabled={!this.props.store.groupSelectionCanBeToggled(group)}
                            >
                                {`${group.name} ${
                                    caseCountsInParens(group.sampleIdentifiers, group.patientIdentifiers, group.hasOverlappingSamples, group.hasOverlappingPatients)
                                }`}
                            </button> 
                        ))}
                    </div>
                )
            }
        },
        renderPending:()=><LoadingIndicator isLoading={true} size="small"/>,
        renderError:()=><ErrorMessage/>
    });
    render() {
        return this.tabUI.component;
    }
}