import * as React from "react";
import {observer} from "mobx-react";
import {getNumSamples} from "../GroupComparisonUtils";
import {Group} from "../../../shared/api/ComparisonGroupClient";
import {StudyViewPageStore} from "../../studyView/StudyViewPageStore";
import autobind from "autobind-decorator";
import {computed, observable} from "mobx";

export interface IGroupCheckboxProps {
    group:Group;
    store:StudyViewPageStore;
    markedForDeletion:boolean;
    restore:(group:Group)=>void;
}

@observer
export default class GroupCheckbox extends React.Component<IGroupCheckboxProps, {}> {
    @autobind
    private onCheckboxClick() {
        this.props.store.toggleComparisonGroupSelected(this.props.group.id)
    }

    @autobind
    private onRestoreClick() {
        this.props.restore(this.props.group);
    }

    @computed get label() {
        return `${this.props.group.data.name} (${getNumSamples(this.props.group.data)})`;
    }

    render() {
        const group = this.props.group;
        if (!this.props.markedForDeletion) {
            return (
                <div key={group.id} className="checkbox groupItem"><label>
                    <input
                        type="checkbox"
                        value={group.id}
                        checked={this.props.store.isComparisonGroupSelected(group.id)}
                        onClick={this.onCheckboxClick}
                    />{this.label}
                </label></div>
            );
        } else {
            return (
                <div className="groupItem"
                     style={{
                        display:"flex",
                        flexDirection:"row",
                        justifyContent:"space-between",
                        alignItems:"center"
                     }}
                >
                    <span className="markedForDeletion">{this.label}</span>
                    <button className="btn btn-xs btn-default" onClick={this.onRestoreClick}>Restore</button>
                </div>
            );
        }
    }
}