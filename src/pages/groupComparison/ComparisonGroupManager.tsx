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

    @computed get relevantGroups() {
        const allGroups = getLocalStorageGroups();
        // filter out groups that arent from these studies
        const relevantStudyIds = _.keyBy(this.props.store.studyIds);
        return allGroups.filter(group=>{
            const studyIdsInGroup = _.uniq(group.sampleIdentifiers.map(id=>id.studyId));
            return _.every(studyIdsInGroup, studyId=>(studyId in relevantStudyIds));
        });
    }

    @computed get filteredGroups() {
        // TODO: fuzzy string search?
        return this.relevantGroups.filter(group=>group.name.toLowerCase().indexOf(this.groupNameFilter.toLowerCase()) > -1);
    }

    @computed get selectedComparisonGroups() {
        return this.relevantGroups.filter(group=>this.props.store.isComparisonGroupSelected(group.id));
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

    render() {
        return (
            <div style={{width: 300, display:"flex", flexDirection:"column"}}
            >
                <div style={{display:"flex", flexDirection:"row"}}>
                    <h5>Groups</h5>
                    <input type="text" placeholder="Search.." value={this.groupNameFilter} onChange={this.onChangeGroupNameFilter}/>
                </div>
                <div style={{maxHeight:100, overflow:"auto"}}>
                    {this.filteredGroups.length > 0 && (
                        this.filteredGroups.map(group=>(
                            <div>
                                <input
                                    type="checkbox"
                                    value={group.id}
                                    checked={this.props.store.isComparisonGroupSelected(group.id)}
                                    onClick={()=>{
                                        this.recentlyDeleted = false;
                                        this.props.store.toggleComparisonGroupSelected(group.id);
                                    }}
                                />{group.name} ({group.sampleIdentifiers.length})
                            </div>
                        ))
                    )}
                </div>
                <div style={{display:"flex", flexDirection:"row"}}>
                    <button onClick={()=>{
                        this.props.store.clearAllFilters();
                        const ids:SampleIdentifier[] =
                            _.uniqWith(
                                _.flattenDeep<SampleIdentifier>(this.selectedComparisonGroups.map(group=>group.sampleIdentifiers)),
                                (id1, id2)=>((id1.sampleId === id2.sampleId) && (id1.studyId === id2.studyId))
                            );
                        this.props.store.updateChartSampleIdentifierFilter(UniqueKey.SELECTED_COMPARISON_GROUPS, ids);
                    }}>Select</button>
                    <button disabled={this.selectedComparisonGroups.length < 2}
                            onClick={()=>{
                                window.open(getComparisonUrl({localGroups:this.selectedComparisonGroups.map(group=>group.id).join(",")}), "_blank");
                            }}
                    >Compare</button>
                    { !this.recentlyDeleted && (
                        <button
                            onClick={()=>{
                                const groupIds = this.selectedComparisonGroups.map(group=>group.id);
                                for (const groupId of groupIds) {
                                    this.props.store.removeComparisonGroupSelectionEntry(groupId);
                                }
                                deleteGroups(groupIds);
                                this.recentlyDeleted = true;
                            }}
                            disabled={this.selectedComparisonGroups.length === 0}
                        >Delete</button>
                    )}
                    { this.recentlyDeleted && (
                        <button
                            onClick={()=>{
                                restoreRecentlyDeletedGroups();
                                this.recentlyDeleted = false;
                            }}
                        >Restore</button>
                    )}
                </div>
                <div>--------------</div>
                {!this.addGroupPanelOpen && (<button
                    onClick={this.showAddGroupPanel}
                    disabled={!this.props.store.selectedSamples.isComplete}
                >+ Add current selection to group {this.props.store.selectedSamples.isComplete && `(${this.props.store.selectedSamples.result.length})`}
                </button>)}
                {this.addGroupPanelOpen && (
                    <button
                        onClick={this.cancelAddGroup}
                    >Cancel add current selection to group.</button>
                )}
                <div style={{display:this.addGroupPanelOpen ? "block" : "none"}}>
                    <input type="text" placeholder="Group name.." value={this.inputGroupName} onChange={this.onChangeInputGroupName}/>
                    <button
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
            </div>
        );
    }
}