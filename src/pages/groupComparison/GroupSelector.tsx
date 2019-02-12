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
import styles from './styles.module.scss';

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
                    <div>
                        <strong>Active Groups: </strong>
                        <div className={styles.groupButtons}>
                            {this.props.store.overlapFilteredAvailableComparisonGroups.result!.map(group=>(
                                <button
                                    className={classNames('btn btn-xs', { "btn-primary":(group.id in selectedGroups), "btn-default":!(group.id in selectedGroups)})}
                                    onClick={()=>this.props.store.toggleComparisonGroupSelected(group.id)}
                                    disabled={!this.props.store.groupSelectionCanBeToggled(group)}
                                >
                                    {
                                        (group.id in selectedGroups) ? <i className={'fa fa-check'}></i> : null
                                    }
                                    &nbsp;
                                    {`${group.name} ${
                                        caseCountsInParens(group.sampleIdentifiers, group.patientIdentifiers, group.hasOverlappingSamples, group.hasOverlappingPatients)
                                    }`}
                                </button>
                            ))}
                        </div>
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