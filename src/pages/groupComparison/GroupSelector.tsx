import * as React from "react";
import {observer} from "mobx-react";
import {
    caseCountsInParens,
    ComparisonGroup,
    getSampleIdentifiers,
    getPatientIdentifiers
} from "./GroupComparisonUtils";
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
            this.props.store.filteredGroups,
            this.props.store.sampleSet
        ],
        render:()=>{
            if (this.props.store.filteredGroups.result!.length === 0) {
                return null;
            } else {
                return (
                    <div>
                        <strong>Active Groups: </strong>
                        <div className={styles.groupButtons}>
                            {this.props.store.filteredGroups.result!.map(group=>{
                                const active = this.props.store.isGroupActive(group);
                                const sampleIdentifiers = getSampleIdentifiers([group]);
                                const patientIdentifiers = getPatientIdentifiers(sampleIdentifiers, this.props.store.sampleSet.result!);
                                return (
                                    <button
                                        className={classNames('btn btn-xs', { "btn-primary":active, "btn-default":!active})}
                                        onClick={()=>this.props.store.toggleGroupSelected(group.uid)}
                                        disabled={!this.props.store.groupSelectionCanBeToggled(group)}
                                    >
                                        {
                                            active ? <i className={'fa fa-check'}></i> : null
                                        }
                                        &nbsp;
                                        {`${group.name} ${
                                            caseCountsInParens(sampleIdentifiers, patientIdentifiers, group.hasOverlappingSamples, group.hasOverlappingPatients)
                                        }`}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                )
            }
        },
        renderPending:()=><LoadingIndicator isLoading={true} size="small"/>,
        renderError:()=><ErrorMessage/>,
        showLastRenderWhenPending:true
    });
    render() {
        return this.tabUI.component;
    }
}