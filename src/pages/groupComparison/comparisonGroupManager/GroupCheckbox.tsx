import * as React from "react";
import {observer} from "mobx-react";
import {
    getNumSamples,
    MissingSamplesMessage,
    StudyViewComparisonGroup
} from "../GroupComparisonUtils";
import {Group} from "../../../shared/api/ComparisonGroupClient";
import {StudyViewPageStore} from "../../studyView/StudyViewPageStore";
import autobind from "autobind-decorator";
import {computed, observable} from "mobx";
import ErrorIcon from "../../../shared/components/ErrorIcon";
import styles from "../styles.module.scss"

export interface IGroupCheckboxProps {
    group:StudyViewComparisonGroup;
    store:StudyViewPageStore;
    markedForDeletion:boolean;
    restore:(group:StudyViewComparisonGroup)=>void;
}

@observer
export default class GroupCheckbox extends React.Component<IGroupCheckboxProps, {}> {
    @autobind
    private onCheckboxClick() {
        this.props.store.toggleComparisonGroupSelected(this.props.group.uid)
    }

    @autobind
    private onRestoreClick() {
        this.props.restore(this.props.group);
    }

    @computed get label() {
        return `${this.props.group.name} (${getNumSamples(this.props.group)})`;
    }

    render() {
        const group = this.props.group;
        let checkboxAndLabel;
        if (this.props.markedForDeletion) {
            checkboxAndLabel = <span className={styles.markedForDeletion}>{this.label}</span>;
        } else {
            checkboxAndLabel = (
                <div className="groupItem checkbox"><label>
                    <input
                        type="checkbox"
                        value={group.uid}
                        checked={this.props.store.isComparisonGroupSelected(group.uid)}
                        onClick={this.onCheckboxClick}
                    />{this.label}
                </label></div>
            );
        }
        
        return (
            <div key={group.uid}
                style={{
                    display:"flex",
                    flexDirection:"row",
                    justifyContent:"space-between",
                    alignItems:"center"
                }}
            >
                {checkboxAndLabel}
                <span>
                    {this.props.group.nonExistentSamples.length > 0 && <ErrorIcon tooltip={<MissingSamplesMessage samples={this.props.group.nonExistentSamples}/>} />}
                    {this.props.markedForDeletion && (<button style={{marginLeft:10}} className="btn btn-xs btn-default" onClick={this.onRestoreClick}>Restore</button>)}
                </span>
            </div>
        );
    }
}