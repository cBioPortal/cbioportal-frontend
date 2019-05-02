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
            this.props.store._originalGroups,
            this.props.store.sampleSet
        ],
        render:()=>{
            if (this.props.store._originalGroups.result!.length === 0) {
                return null;
            } else {
                return (
                    <div style={{
                        display:"flex",
                        alignItems:"center"
                    }}>
                        <strong style={{marginRight:5}}>Groups: </strong>
                        <div className={styles.groupButtons}>
                            {this.props.store._originalGroups.result!.map(group=>{
                                const selected = this.props.store.isGroupSelected(group.uid);
                                const sampleIdentifiers = getSampleIdentifiers([group]);
                                const patientIdentifiers = getPatientIdentifiers(sampleIdentifiers, this.props.store.sampleSet.result!);
                                return (
                                    <button
                                        className={classNames('btn btn-xs', 'btn-primary', { [styles.buttonUnselected]:!selected})}
                                        onClick={()=>this.props.store.toggleGroupSelected(group.uid)}
                                    >
                                        {
                                            selected ?  <i className={'fa fa-check'}></i> : <i className={'fa fa-minus'}></i>
                                        }
                                        &nbsp;
                                        {`${group.name} ${
                                            caseCountsInParens(sampleIdentifiers, patientIdentifiers)
                                        }`}
                                        {group.nonExistentSamples.length > 0 && <ErrorIcon style={{marginLeft:7}} tooltip={<MissingSamplesMessage samples={group.nonExistentSamples}/>}/>}
                                        {this.props.store.isGroupUnsaved(group) && (
                                            <span style={{
                                                display:"inline-block",
                                                marginLeft:4,
                                                minWidth:16,
                                                position:"relative"
                                            }}>
                                                <i className={'fa fa-save'}
                                                   style={{
                                                       position:"absolute",
                                                       left:0,
                                                       top:-10
                                                   }}
                                                />
                                                <i className={'fa fa-ban'}
                                                   style={{
                                                       position:"absolute",
                                                       left:4,
                                                       top:-12,
                                                       opacity:0.6,
                                                       color:"red"
                                                   }}
                                                />
                                            </span>
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                        <div style={{marginLeft:15, display:'flex', whiteSpace:'nowrap'}} >
                            <a onClick={this.props.store.selectAllGroups}
                            >Select all
                            </a>
                            &nbsp;|&nbsp;
                            <a onClick={this.props.store.deselectAllGroups}
                            >Deselect all
                            </a>
                            { (this.props.store._originalGroups.result!.findIndex(g=>this.props.store.isGroupUnsaved(g)) > -1) && (
                                <span>
                                    &nbsp;|&nbsp;
                                    <a onClick={this.props.store.saveAndGoToNewSession}
                                    >Save
                                    </a>
                                    &nbsp;|&nbsp;
                                    <a onClick={this.props.store.clearUnsavedGroups}
                                    >Clear unsaved
                                    </a>
                                </span>
                            )}
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