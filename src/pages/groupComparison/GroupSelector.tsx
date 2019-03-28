import * as React from "react";
import {observer} from "mobx-react";
import {
    caseCountsInParens,
    getPatientIdentifiers,
    getSampleIdentifiers,
    MissingSamplesMessage
} from "./GroupComparisonUtils";
import {MakeMobxView} from "shared/components/MobxView";
import LoadingIndicator from "shared/components/loadingIndicator/LoadingIndicator";
import ErrorMessage from "shared/components/ErrorMessage";
import GroupComparisonStore from "./GroupComparisonStore";
import classNames from "classnames";
import styles from './styles.module.scss';
import ErrorIcon from "../../shared/components/ErrorIcon";

export interface IGroupSelectorProps {
    store:GroupComparisonStore;
}

@observer
export default class GroupSelector extends React.Component<IGroupSelectorProps,{}> {
    readonly tabUI = MakeMobxView({
        await:()=>[
            this.props.store.availableGroups,
            this.props.store.sampleSet
        ],
        render:()=>{
            if (this.props.store.availableGroups.result!.length === 0) {
                return null;
            } else {
                return (
                    <div style={{
                        display:"flex",
                        flexDirection:"row",
                        alignItems:"center"
                    }}>
                        <strong style={{marginRight:5}}>Groups: </strong>
                        <div className={styles.groupButtons}>
                            {this.props.store.availableGroups.result!.map(group=>{
                                const active = this.props.store.isGroupActive(group);
                                const sampleIdentifiers = getSampleIdentifiers([group]);
                                const patientIdentifiers = getPatientIdentifiers(sampleIdentifiers, this.props.store.sampleSet.result!);
                                return (
                                    <button
                                        className={classNames('btn btn-xs', 'btn-primary', { [styles.buttonUnselected]:!active})}
                                        onClick={()=>this.props.store.toggleGroupSelected(group.uid)}
                                        disabled={!this.props.store.groupSelectionCanBeToggled(group)}
                                    >
                                        {
                                            active ?  <i className={'fa fa-check'}></i> : <i className={'fa fa-minus'}></i>
                                        }
                                        &nbsp;
                                        {`${group.name} ${
                                            caseCountsInParens(sampleIdentifiers, patientIdentifiers, group.hasOverlappingSamples, group.hasOverlappingPatients)
                                        }`}
                                        {group.nonExistentSamples.length > 0 && <ErrorIcon style={{marginLeft:7}} tooltip={<MissingSamplesMessage samples={group.nonExistentSamples}/>}/>}
                                    </button>
                                );
                            })}
                        </div>
                        <div className="btn-group" style={{marginLeft:15}}>
                            <a onClick={this.props.store.selectAllGroups}
                            >Select all
                            </a>
                            &nbsp;|&nbsp;
                            <a onClick={this.props.store.deselectAllGroups}
                            >Deselect all
                            </a>
                        </div>
                    </div>
                )
            }
        },
        renderPending:()=><LoadingIndicator isLoading={true} size="big" center={true} />,
        renderError:()=><ErrorMessage/>,
        showLastRenderWhenPending:true
    });
    render() {
        return this.tabUI.component;
    }
}