import * as React from "react";
import {observer} from "mobx-react";
import { SampleGroup, caseCountsInParens } from "./GroupComparisonUtils";
import MobxPromise from "mobxpromise";
import { ButtonGroup, Button } from "react-bootstrap";
import { MakeMobxView } from "shared/components/MobxView";
import LoadingIndicator from "shared/components/loadingIndicator/LoadingIndicator";
import ErrorMessage from "shared/components/ErrorMessage";
import _ from "lodash";
import GroupComparisonStore from "./GroupComparisonStore";
import classNames from "classnames";

export interface IGroupSelectorProps {
    store:GroupComparisonStore;
}

@observer
export default class GroupSelector extends React.Component<IGroupSelectorProps,{}> {
    readonly tabUI = MakeMobxView({
        await:()=>[this.props.store.sampleGroups, this.props.store.selectedSampleGroups, this.props.store.sampleGroupToPatients],
        render:()=>{
            if (this.props.store.sampleGroups.result!.length === 0) {
                return null;
            } else {
                const selectedGroups = _.keyBy(this.props.store.selectedSampleGroups.result!, g=>g.id);
                const sampleGroupToPatients = this.props.store.sampleGroupToPatients.result!;
                return (
                    <div className="btn-group" style={{
                        maxWidth:400
                    }}>
                        {this.props.store.sampleGroups.result!.map(group=>(
                            <button
                                className={classNames("btn", "noBorderRadius", { "btn-primary":(group.id in selectedGroups), "btn-default":!(group.id in selectedGroups)})}
                                onClick={()=>this.props.store.toggleSampleGroupSelected(group.id)}
                            >
                               {`${group.name} ${caseCountsInParens(group.sampleIdentifiers, sampleGroupToPatients[group.id])}`}
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