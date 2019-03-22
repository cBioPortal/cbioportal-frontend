import * as React from "react";
import {SyntheticEvent} from "react";
import {observer} from "mobx-react";
import {StudyViewPageStore, UniqueKey} from "../../studyView/StudyViewPageStore";
import {action, computed, observable} from "mobx";
import autobind from "autobind-decorator";
import {getDefaultGroupName, getSampleIdentifiers, StudyViewComparisonGroup} from "../GroupComparisonUtils";
import {getComparisonLoadingUrl, redirectToComparisonPage} from "../../../shared/api/urls";
import styles from "../styles.module.scss";
import ReactSelect from "react-select";
import {remoteData} from "../../../shared/api/remoteData";
import {addSamplesParameters, getGroupParameters, getSelectedGroups} from "./ComparisonGroupManagerUtils";
import comparisonClient from "../../../shared/api/comparisonGroupClientInstance";
import {MakeMobxView} from "../../../shared/components/MobxView";
import LoadingIndicator from "../../../shared/components/loadingIndicator/LoadingIndicator";
import ErrorMessage from "../../../shared/components/ErrorMessage";
import GroupCheckbox from "./GroupCheckbox";
import {sleepUntil} from "../../../shared/lib/TimeUtils";
import {LoadingPhase} from "../GroupComparisonLoading";

export interface IComparisonGroupManagerProps {
    store:StudyViewPageStore;
}

@observer
export default class ComparisonGroupManager extends React.Component<IComparisonGroupManagerProps, {}> {
    @observable groupNameFilter:string = "";
    @observable addGroupPanelOpen = false;
    @observable _inputGroupName:string = "";
    @computed get inputGroupName() {
        return this._inputGroupName;
    }
    @observable addSamplesTargetGroupId:string = "";

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

    readonly filteredGroups = remoteData({
        await:()=>[this.props.store.comparisonGroups],
        invoke:()=>Promise.resolve(
            // TODO: fuzzy string search?
            this.props.store.comparisonGroups.result!.filter(group=>(new RegExp(this.groupNameFilter, "i")).test(group.name))
        )
    });

    @autobind
    @action
    private showAddGroupPanel() {
        this.addGroupPanelOpen = true;
        this._inputGroupName = getDefaultGroupName(this.props.store.filters);
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

    @autobind
    private restoreGroup(group:StudyViewComparisonGroup) {
        this.props.store.toggleComparisonGroupMarkedForDeletion(group.uid);
    }

    private readonly groupsSection = MakeMobxView({
        await:()=>[
            this.props.store.comparisonGroups,
            this.filteredGroups
        ],
        render:()=>{
            if (this.props.store.comparisonGroups.result!.length > 0) {
                // show this component if there are groups, and if filteredGroups is complete
                return (
                    <div className={styles.groupCheckboxes}>
                        {this.filteredGroups.result!.length > 0 ? (
                            this.filteredGroups.result!.map(group=>(
                                <GroupCheckbox
                                    group={group}
                                    store={this.props.store}
                                    markedForDeletion={this.props.store.isComparisonGroupMarkedForDeletion(group.uid)}
                                    restore={this.restoreGroup}
                                />
                            ))
                        ) : (
                            <div className={styles.noGroupsMessage}>
                                No results for your current search.
                            </div>
                        )}
                    </div>
                );
            } else {
                return (
                    <div className={styles.noGroupsMessage}>
                        <span>
                            { this.addGroupPanelOpen ?
                                <span>Use the <h6 style={{display:"inline-block", marginBottom:0}}>Add samples</h6> panel</span> :
                                <span>Click the <span className="btn btn-xs btn-primary" style={{marginLeft:3, marginRight:3, paddingTop:0.5, paddingBottom:0.5}}onClick={this.showAddGroupPanel}>+ Add</span> button</span>
                            }
                            <span>&nbsp;below to create a group, which can be used to save your current selection, and to perform comparison analyses with other groups.</span>
                        </span>
                    </div>
                );
            }
        },
        renderPending:()=><LoadingIndicator isLoading={true}/>,
        renderError:()=>(
            <div className={styles.noGroupsMessage}>
                <ErrorMessage message={"There was an error loading saved groups. Please try again."}/>
            </div>
        )
    });

    private get selectButton() {
        if (this.props.store.comparisonGroups.isComplete &&
            this.props.store.comparisonGroups.result.length > 0) {
            // only show select button if there are any groups
            return (
                <button
                    className="btn btn-sm btn-default"
                    disabled={getSelectedGroups(this.props.store.comparisonGroups.result, this.props.store).length === 0}
                    style={{marginLeft:7}}
                    onClick={()=>{
                        this.props.store.clearAllFilters();
                        this.props.store.updateChartSampleIdentifierFilter(
                            UniqueKey.SELECTED_COMPARISON_GROUPS,
                            getSampleIdentifiers(
                                getSelectedGroups(this.props.store.comparisonGroups.result!, this.props.store)
                            )
                        );
                    }}
                >Select</button>
            );
        } else {
            return null;
        }
    }

    private get compareButton() {
        if (this.props.store.comparisonGroups.isComplete &&
            this.props.store.comparisonGroups.result.length >=2) {
            // only show if there are enough groups to possibly compare (i.e. 2)
            return (
                <button className="btn btn-sm btn-primary"
                        disabled={getSelectedGroups(this.props.store.comparisonGroups.result, this.props.store).length < 2}
                        onClick={async()=>{
                            // open window before the first `await` call - this makes it a synchronous window.open,
                            //  which doesnt trigger pop-up blockers. We'll send it to the correct url once we get the result
                            const comparisonWindow = window.open(getComparisonLoadingUrl({
                                phase: LoadingPhase.CREATING_SESSION,
                            }), "_blank");

                            // wait until the new window has routingStore available
                            await sleepUntil(()=>!!(comparisonWindow as any).routingStore);

                            // save comparison session, and get id
                            const groups = getSelectedGroups(this.props.store.comparisonGroups.result!, this.props.store);
                            const {id} = await comparisonClient.addComparisonSession({groups});

                            // redirect window to correct URL
                            redirectToComparisonPage(comparisonWindow!, { sessionId: id });
                        }}
                >Compare</button>
            );
        } else {
            return null;
        }
    }

    private get deleteButton() {
        if (this.props.store.comparisonGroups.isComplete &&
            this.props.store.comparisonGroups.result.length > 0) {
            return (
                <button
                    className="btn btn-sm btn-default"
                    style={{marginLeft:7}}
                    onClick={()=>{
                        this.props.store.markSelectedGroupsForDeletion();
                    }}
                    disabled={getSelectedGroups(this.props.store.comparisonGroups.result!, this.props.store).length === 0}
                >Delete</button>
            );
        } else {
            return null;
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
                {this.deleteButton}
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
                            onClick={async()=>{
                                if (selectedSamples) {
                                    await comparisonClient.addGroup(getGroupParameters(
                                        this.inputGroupName,
                                        selectedSamples,
                                        this.props.store
                                    ));
                                    this.props.store.notifyComparisonGroupsChange();
                                    this.cancelAddGroup();
                                }
                            }}
                            disabled={!selectedSamples || this.inputGroupName.length === 0}
                        >Create</button>
                    </div>
                </div>
            ];
            if (this.props.store.comparisonGroups.isComplete && this.props.store.comparisonGroups.result.length > 0) {
                contents.push(
                    <div style={{width:"100%", marginTop:7}}>
                        <h6>Or add to an existing group:</h6>
                        <div style={{display:"flex", flexDirection:"row", justifyContent:"space-between", alignItems:"center", width:"100%"}}>
                            <div style={{width:inputWidth}}>
                                <ReactSelect
                                    name="select existing group"
                                    placeholder="Select or search.."
                                    onChange={(option:any|null)=>{ if (option) { this.addSamplesTargetGroupId = option.value; }}}
                                    options={this.props.store.comparisonGroups.result!.map(group=>({
                                        label: group.name,
                                        value: group.uid
                                    }))}
                                    clearable={false}
                                    searchable={true}
                                    value={this.addSamplesTargetGroupId}
                                />
                            </div>
                            <button
                                className="btn btn-sm btn-primary"
                                style={{width:createOrAddButtonWidth}}
                                onClick={async()=>{
                                    if (selectedSamples) {
                                        const group = this.props.store.comparisonGroups.result!.find(x=>x.uid === this.addSamplesTargetGroupId)!;
                                        await comparisonClient.updateGroup(
                                            this.addSamplesTargetGroupId,
                                            addSamplesParameters(group, selectedSamples)
                                        );
                                        this.props.store.notifyComparisonGroupsChange();
                                        this.cancelAddGroup();
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

    componentWillUnmount() {
        this.props.store.deleteMarkedComparisonGroups();
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
                {this.groupsSection.component}
                {this.actionButtons}
                <hr style={{width:"100%", borderTopColor:"#cccccc", marginTop:20, marginBottom:20}}/>
                {this.addGroupPanel}
            </div>
        );
    }
}