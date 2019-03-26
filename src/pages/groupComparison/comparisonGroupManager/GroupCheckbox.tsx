import * as React from "react";
import {observer} from "mobx-react";
import {
    caseCounts,
    getNumPatients,
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
import {SyntheticEvent} from "react";

export interface IGroupCheckboxProps {
    group:StudyViewComparisonGroup;
    store:StudyViewPageStore;
    markedForDeletion:boolean;
    restore:(group:StudyViewComparisonGroup)=>void;
    rename:(newName:string, currentGroup:StudyViewComparisonGroup)=>void;
}

@observer
export default class GroupCheckbox extends React.Component<IGroupCheckboxProps, {}> {

    @observable _editingName = false;
    @observable nameInput = "";

    @computed get editingName() {
        return this._editingName && !this.props.markedForDeletion;
    }

    @autobind
    private onCheckboxClick() {
        this.props.store.toggleComparisonGroupSelected(this.props.group.uid)
    }

    @autobind
    private onRestoreClick() {
        this.props.restore(this.props.group);
    }

    @autobind
    private onEditClick() {
        this._editingName = true;
        this.nameInput = this.props.group.name;
    }

    @autobind
    private onEditSubmit() {
        if (
            this.nameInput.length > 0 &&
            this.nameInput !== this.props.group.name
        ) {
            this.props.rename(this.nameInput, this.props.group);
        }
        this._editingName = false;
    }

    @autobind
    private onEditCancel() {
        this._editingName = false;
    }

    @autobind
    private handleNameInputChange(evt:SyntheticEvent<HTMLInputElement>) {
        this.nameInput = (evt.target as HTMLInputElement).value;
    }

    @computed get label() {
        return `${this.props.group.name} (${caseCounts(getNumSamples(this.props.group), getNumPatients(this.props.group))})`;
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
                    />
                    { this.editingName ?
                        <input
                            type="text"
                            value={this.nameInput}
                            onChange={this.handleNameInputChange}
                            style={{width:174}}
                        /> :
                        this.label
                    }
                </label></div>
            );
        }

        let editingRelatedIcons;
        if (this.editingName) {
            editingRelatedIcons = [
                <button
                    className="btn btn-xs btn-primary"
                    onClick={this.onEditSubmit}
                    disabled={this.nameInput.length === 0}
                    style={{marginRight:3}}
                >
                    Save
                </button>,
                <button
                    className="btn btn-xs btn-default"
                    onClick={this.onEditCancel}
                >
                    Cancel
                </button>
            ];
        } else if (!this.props.markedForDeletion) {
            editingRelatedIcons = [
                <span
                    onClick={this.onEditClick}
                >
                    <i
                        className="fa fa-md fa-pencil"
                        style={{
                            cursor:"pointer"
                        }}
                    />
                </span>
            ];
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
                    {editingRelatedIcons}
                    {this.props.group.nonExistentSamples.length > 0 && <ErrorIcon tooltip={<MissingSamplesMessage samples={this.props.group.nonExistentSamples}/>} />}
                    {this.props.markedForDeletion && (<button style={{marginLeft:10}} className="btn btn-xs btn-default" onClick={this.onRestoreClick}>Restore</button>)}
                </span>
            </div>
        );
    }
}