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
import DefaultTooltip from "../../shared/components/defaultTooltip/DefaultTooltip";
import {joinNames} from "./OverlapUtils";
import EllipsisTextTooltip from "../../shared/components/ellipsisTextTooltip/EllipsisTextTooltip";

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
                                        <span style={{display:"flex", alignItems:"center"}}>
                                            {
                                                selected ?  <i className={'fa fa-check'}></i> : <i className={'fa fa-minus'}></i>
                                            }
                                            &nbsp;
                                            <EllipsisTextTooltip style={{display:"inline-block"}} text={group.name} shownWidth={100}/>
                                            &nbsp;
                                            {caseCountsInParens(sampleIdentifiers, patientIdentifiers)}
                                            {group.nonExistentSamples.length > 0 && <ErrorIcon style={{marginLeft:7}} tooltip={<MissingSamplesMessage samples={group.nonExistentSamples}/>}/>}
                                        </span>
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