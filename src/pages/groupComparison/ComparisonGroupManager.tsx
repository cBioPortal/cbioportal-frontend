import * as React from "react";
import {observer} from "mobx-react";
import {StudyViewPageStore, UniqueKey} from "../studyView/StudyViewPageStore";
import {
    addGroupToLocalStorage, addSamplesToGroup,
    deleteGroups,
    getLocalStorageGroups,
    restoreRecentlyDeletedGroups
} from "./GroupPersistenceUtils";
import {action, computed, observable} from "mobx";
import autobind from "autobind-decorator";
import {SyntheticEvent} from "react";
import {ComparisonGroup, getDefaultGroupName, ComparisonSampleGroup} from "./GroupComparisonUtils";
import _ from "lodash";
import {SampleIdentifier} from "../../shared/api/generated/CBioPortalAPI";
import {getComparisonUrl} from "../../shared/api/urls";
import styles from "./styles.module.scss";
import ReactSelect from "react-select";
import LazyMemo from "../../shared/lib/LazyMemo";

export interface IComparisonGroupManagerProps {
    store:StudyViewPageStore;
}

@observer
export default class ComparisonGroupManager extends React.Component<IComparisonGroupManagerProps, {}> {
    @observable groupNameFilter:string = "";
    @observable recentlyDeleted = false;
    @observable addGroupPanelOpen = false;
    @observable _inputGroupName:string = "";
    @computed get inputGroupName() {
        return this._inputGroupName;
    }
    @observable addSamplesTargetGroupId:string = "";

    private groupCheckboxOnClick = new LazyMemo(
        (group:ComparisonSampleGroup)=>group.id,
        (group:ComparisonSampleGroup)=>{
            return ()=>{
                this.recentlyDeleted = false;
                this.props.store.toggleComparisonGroupSelected(group.id);
            };
        }
    );

    @autobind
    @action
    private onChangeGroupNameFilter(e:SyntheticEvent<HTMLInputElement>) {
        this.groupNameFilter = (e.target as HTMLInputElement).value;
    }

    @autobind
    @action
    private onChangeInputGroupName(e:SyntheticEvent<HTMLInputElement>) {
        this._inputGroupName = (e.target as HTMLInputElement).value;
    }

    @computed get filteredGroups() {
        // TODO: fuzzy string search?
        return this.props.store.comparisonGroups.filter(group=>group.name.toLowerCase().indexOf(this.groupNameFilter.toLowerCase()) > -1);
    }

    @autobind
    @action
    private showAddGroupPanel() {
        this.addGroupPanelOpen = true;
    }

    @autobind
    @action
    private cancelAddGroup() {
        this.addGroupPanelOpen = false;
        this._inputGroupName = "";
        this.addSamplesTargetGroupId = "";
    }

    private get headerWithSearch() {
        return (
            <div style={{display:"flex", flexDirection:"row", justifyContent:"space-between", width:"100%", marginTop:3}}>
                <h5>Groups</h5>
                <input
                    className="form-control"
                    style={{
                        right:0, width:140, marginTop:-4
                    }}
                    type="text"
                    placeholder="Search.."
                    value={this.groupNameFilter}
                    onChange={this.onChangeGroupNameFilter}
                />
            </div>
        );
    }

    private get headerWithoutSearch() {
        return (
            <h5>Groups</h5>
        );
    }

    private get noGroupsMessage() {
        if (this.props.store.comparisonGroups.length === 0) {
            return (
                <div className={styles.noGroupsMessage}>
                    Click the button below to create a group, which can be used to save your current selection, and to perform comparison analyses with other groups.
                </div>
            );
        } else {
            return null;
        }
    }

    private get groupCheckboxes() {
        if (this.props.store.comparisonGroups.length > 0) {
            return (
                <div className={styles.groupCheckboxes}>
                    {this.filteredGroups.length > 0 && (
                        this.filteredGroups.map(group=>(
                            <div key={group.id} className="checkbox"><label>
                                <input
                                    type="checkbox"
                                    value={group.id}
                                    checked={this.props.store.isComparisonGroupSelected(group.id)}
                                    onClick={this.groupCheckboxOnClick.get(group)}
                                />{group.name} ({group.sampleIdentifiers.length})
                            </label></div>
                        ))
                    )}
                </div>
            );
        } else {
            return null;
        }
    }
    private get selectButton() {
        if (this.props.store.comparisonGroups.length > 0) {
            return (
                <button
                    className="btn btn-sm btn-default"
                    disabled={this.props.store.selectedComparisonGroups.length === 0}
                    style={{marginLeft:7}}
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
        } else {
            return null;
        }
    }
    private get compareButton() {
        if (this.props.store.comparisonGroups.length >= 2) {
            return (
                <button className="btn btn-sm btn-primary"
                        disabled={this.props.store.selectedComparisonGroups.length < 2}
                        onClick={()=>{
                            window.open(getComparisonUrl({localGroups:this.props.store.selectedComparisonGroups.map(group=>group.id).join(",")}), "_blank");
                        }}
                >Compare</button>
            );
        } else {
            return null;
        }
    }
    private get restoreOrDeleteButton() {
        if (this.recentlyDeleted) {
            return (
                <button
                    className="btn btn-sm btn-default"
                    style={{marginLeft:7}}
                    onClick={()=>{
                        restoreRecentlyDeletedGroups();
                        this.recentlyDeleted = false;
                    }}
                >Restore</button>
            );
        } else {
            if (this.props.store.comparisonGroups.length > 0) {
                return (
                    <button
                        className="btn btn-sm btn-default"
                        style={{marginLeft:7}}
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
            } else {
                return null;
            }
        }
    }

    private get actionButtons() {
        return (
            <div
                style={{
                    marginTop:6,
                    display:"flex",
                    flexDirection:"row",
                }}
            >
                {this.compareButton}
                {this.selectButton}
                {this.restoreOrDeleteButton}
            </div>
        );
    }

    private get addGroupPanel() {
        let contents:any;
        const inputWidth = 235;
        const createOrAddButtonWidth = 58;
        const selectedSamples = this.props.store.selectedSamples.isComplete ? this.props.store.selectedSamples.result :  undefined;
        if (this.addGroupPanelOpen) {
            contents = [
                <div style={{display:"flex", flexDirection:"row", justifyContent:"space-between", width:"100%", marginTop:3}}>
                    <h5>Add{selectedSamples ? ` ${selectedSamples.length}` : ""} selected samples</h5>
                    <button
                        className="btn btn-xs btn-default"
                        style={{
                            right:0, marginTop:-4
                        }}
                        onClick={this.cancelAddGroup}
                    >Cancel</button>
                </div>,
                <div style={{width:"100%", marginTop:7}}>
                    <h6 style={{marginTop:5}}>Create new group:</h6>
                    <div style={{display:"flex", flexDirection:"row", justifyContent:"space-between", alignItems:"center", width:"100%"}}>
                        <input
                            className="form-control"
                            style={{width:inputWidth}}
                            type="text"
                            placeholder="Enter a name for your new group.."
                            value={this.inputGroupName}
                            onChange={this.onChangeInputGroupName}
                        />
                        <button
                            className="btn btn-sm btn-primary"
                            style={{width:createOrAddButtonWidth}}
                            onClick={()=>{
                                if (selectedSamples) {
                                    addGroupToLocalStorage({
                                        sampleIdentifiers:selectedSamples.map(s=>({ sampleId: s.sampleId, studyId: s.studyId})), // samples in the group
                                        name:this.inputGroupName
                                    });
                                    this.cancelAddGroup();
                                }
                            }}
                            disabled={!selectedSamples || this.inputGroupName.length === 0}
                        >Create</button>
                    </div>
                </div>
            ];
            if (this.props.store.comparisonGroups.length > 0) {
                contents.push(
                    <div style={{width:"100%", marginTop:7}}>
                        <h6>Or add to an existing group:</h6>
                        <div style={{display:"flex", flexDirection:"row", justifyContent:"space-between", alignItems:"center", width:"100%"}}>
                            <div style={{width:inputWidth}}>
                                <ReactSelect
                                    name="select existing group"
                                    placeholder="Select or search.."
                                    onChange={(option:any|null)=>{ if (option) { this.addSamplesTargetGroupId = option.value; }}}
                                    options={this.props.store.comparisonGroups.map(group=>({
                                        label: group.name,
                                        value: group.id
                                    }))}
                                    clearable={false}
                                    searchable={true}
                                    value={this.addSamplesTargetGroupId}
                                />
                            </div>
                            <button
                                className="btn btn-sm btn-primary"
                                style={{width:createOrAddButtonWidth}}
                                onClick={()=>{
                                    if (selectedSamples) {
                                        addSamplesToGroup(
                                            this.addSamplesTargetGroupId,
                                            selectedSamples.map(s=>({ sampleId: s.sampleId, studyId: s.studyId}))
                                        ); // samples in the group
                                    }
                                }}
                                disabled={!selectedSamples || !this.addSamplesTargetGroupId}
                            >Add</button>
                        </div>
                    </div>
                );
            }
        } else {
            contents = (
                <button
                    className="btn btn-sm btn-primary"
                    onClick={this.showAddGroupPanel}
                    disabled={!selectedSamples}
                    style={{width:"100%"}}
                >+ Add{selectedSamples ? ` ${selectedSamples.length}` : ""} selected samples to a group
                </button>
            );
        }
        return (
            <div
                style={{
                    width:"100%"
                }}
            >
                {contents}
            </div>
        );
    }

    render() {
        return (
            <div className={styles.comparisonGroupManager}
                 style={{
                     display:"flex", flexDirection:"column", position:"relative",
                     width: 300
                 }}
            >
                {this.headerWithoutSearch}
                {this.noGroupsMessage}
                {this.groupCheckboxes}
                {this.actionButtons}
                <hr style={{width:"100%", borderTopColor:"#cccccc", marginTop:20, marginBottom:20}}/>
                {this.addGroupPanel}
            </div>
        );
    }
}