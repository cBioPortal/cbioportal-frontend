import * as React from "react";
import {observer} from "mobx-react";
import {StudyViewPageStore, UniqueKey} from "../studyView/StudyViewPageStore";
import {
    addGroupToLocalStorage,
    deleteGroups,
    getLocalStorageGroups,
    restoreRecentlyDeletedGroups
} from "./GroupPersistenceUtils";
import {computed, observable} from "mobx";
import autobind from "autobind-decorator";
import {SyntheticEvent} from "react";
import {getDefaultGroupName} from "./GroupComparisonUtils";
import _ from "lodash";
import {SampleIdentifier} from "../../shared/api/generated/CBioPortalAPI";
import {getComparisonUrl} from "../../shared/api/urls";
import "./styles.scss";

export interface IComparisonGroupManagerProps {
    store:StudyViewPageStore;
}

@observer
export default class ComparisonGroupManager extends React.Component<IComparisonGroupManagerProps, {}> {
    @observable groupNameFilter:string = "";
    @observable recentlyDeleted = false;
    @observable addGroupPanelOpen = false;
    @observable _inputGroupName:string|undefined = undefined;
    @computed get inputGroupName() {
        if (this._inputGroupName === undefined) {
            return getDefaultGroupName(this.props.store.filters);
        } else {
            return this._inputGroupName;
        }
    }

    @autobind
    private onChangeGroupNameFilter(e:SyntheticEvent<HTMLInputElement>) {
        this.groupNameFilter = (e.target as HTMLInputElement).value;
    }

    @autobind
    private onChangeInputGroupName(e:SyntheticEvent<HTMLInputElement>) {
        this._inputGroupName = (e.target as HTMLInputElement).value;
    }

    @computed get filteredGroups() {
        // TODO: fuzzy string search?
        return this.props.store.comparisonGroups.filter(group=>group.name.toLowerCase().indexOf(this.groupNameFilter.toLowerCase()) > -1);
    }

    @autobind
    private showAddGroupPanel() {
        this.addGroupPanelOpen = true;
    }

    @autobind
    private cancelAddGroup() {
        this.addGroupPanelOpen = false;
        this._inputGroupName = undefined;
    }

    private get header() {
        return (
            <div>
                <h5 style={{position:"absolute", top:7}}>Groups</h5>
                <input
                    className="form-control"
                    style={{
                        position:"absolute", top:2, right:0, width:140
                    }}
                    type="text"
                    placeholder="Search.."
                    value={this.groupNameFilter}
                    onChange={this.onChangeGroupNameFilter}
                />
            </div>
        );
    }
    private get groupCheckboxes() {
        return (
            <div className="group-checkboxes">
                {this.filteredGroups.length > 0 && (
                    this.filteredGroups.map(group=>(
                        <div className="checkbox"><label>
                            <input
                                type="checkbox"
                                value={group.id}
                                checked={this.props.store.isComparisonGroupSelected(group.id)}
                                onClick={()=>{
                                    this.recentlyDeleted = false;
                                    this.props.store.toggleComparisonGroupSelected(group.id);
                                }}
                            />{group.name} ({group.sampleIdentifiers.length})
                        </label></div>
                    ))
                )}
            </div>
        );
    }
    private get selectButton() {
        return (
            <button
                className="btn btn-sm btn-primary"
                onClick={()=>{
                    this.props.store.clearAllFilters();
                    const ids:SampleIdentifier[] =
                        _.uniqWith(
                            _.flattenDeep<SampleIdentifier>(this.props.store.selectedComparisonGroups.map(group=>group.sampleIdentifiers)),
                            (id1, id2)=>((id1.sampleId === id2.sampleId) && (id1.studyId === id2.studyId))
                        );
                    this.props.store.updateChartSampleIdentifierFilter(UniqueKey.SELECTED_COMPARISON_GROUPS, ids);
                }}
            >Select</button>
        );
    }
    private get compareButton() {
        return (
            <button className="btn btn-sm btn-primary"
                    disabled={this.props.store.selectedComparisonGroups.length < 2}
                    onClick={()=>{
                        window.open(getComparisonUrl({localGroups:this.props.store.selectedComparisonGroups.map(group=>group.id).join(",")}), "_blank");
                    }}
            >Compare</button>
        );
    }
    private get restoreOrDeleteButton() {
        if (this.recentlyDeleted) {
            return (
                <button
                    className="btn btn-sm btn-primary"
                    onClick={()=>{
                        restoreRecentlyDeletedGroups();
                        this.recentlyDeleted = false;
                    }}
                >Restore</button>
            );
        } else {
            return (
                <button
                    className="btn btn-sm btn-primary"
                    onClick={()=>{
                        const groupIds = this.props.store.selectedComparisonGroups.map(group=>group.id);
                        for (const groupId of groupIds) {
                            this.props.store.removeComparisonGroupSelectionEntry(groupId);
                        }
                        deleteGroups(groupIds);
                        this.recentlyDeleted = true;
                    }}
                    disabled={this.props.store.selectedComparisonGroups.length === 0}
                >Delete</button>
            );
        }
    }

    private get actionButtons() {
        return (
            <div
                style={{
                    position:"absolute",
                    top:166,
                    display:"flex",
                    flexDirection:"row",
                    justifyContent:"space-between",
                    width:195
                }}
            >
                {this.selectButton}
                {this.compareButton}
                {this.restoreOrDeleteButton}
            </div>
        );
    }

    private get addGroupPanel() {
        let contents:any;
        if (this.addGroupPanelOpen) {
            contents = [
                <button
                    className="btn btn-sm btn-info"
                    style={{position:"absolute", top:0, width:"100%"}}
                    onClick={this.cancelAddGroup}
                >Cancel</button>,
                <div style={{position:"absolute", top:39, width:"100%"}}>
                    <h6>Choose a name:</h6>
                    <input
                        className="form-control"
                        style={{position:"absolute", top:17, width:216}}
                        type="text"
                        placeholder="Group name.."
                        value={this.inputGroupName}
                        onChange={this.onChangeInputGroupName}
                    />
                    <button
                        className="btn btn-xs btn-primary"
                        style={{position:"absolute", top:18, right:0, paddingTop:2, paddingBottom:2}}
                        onClick={()=>{
                            // temp way to get name
                            const defaultGroupName = getDefaultGroupName(this.props.store.filters);
                            addGroupToLocalStorage({
                                sampleIdentifiers:this.props.store.selectedSamples.result.map(s=>({ sampleId: s.sampleId, studyId: s.studyId})), // samples in the group
                                name:this.inputGroupName
                            });
                            this.addGroupPanelOpen = false;
                        }}
                        disabled={this.inputGroupName.length === 0}
                    >Save Group</button>
                </div>
            ];
        } else {
            contents = (
                <button
                    className="btn btn-sm btn-info"
                    onClick={this.showAddGroupPanel}
                    disabled={!this.props.store.selectedSamples.isComplete}
                    style={{position:"absolute", top:0, width:"100%"}}
                >+ Add current selection to group {this.props.store.selectedSamples.isComplete && `(${this.props.store.selectedSamples.result.length})`}
                </button>
            );
        }
        return (
            <div
                style={{
                    position:"absolute",
                    top:207,
                    width:"100%"
                }}
            >
                {contents}
            </div>
        );
    }

    render() {
        return (
            <div className="comparison-group-manager" style={{width: 300, height:this.addGroupPanelOpen ? 291 : 240 , display:"flex", flexDirection:"column", position:"relative"}}
            >
                {this.header}
                {this.groupCheckboxes}
                {this.actionButtons}
                <hr style={{position:"absolute", top:181, width:"100%", borderTopColor:"#eeeeee"}}/>
                {this.addGroupPanel}
            </div>
        );
    }
}