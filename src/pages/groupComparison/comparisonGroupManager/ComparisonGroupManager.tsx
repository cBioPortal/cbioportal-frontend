import * as React from "react";
import {SyntheticEvent} from "react";
import {observer} from "mobx-react";
import {StudyViewPageStore, UniqueKey} from "../../studyView/StudyViewPageStore";
import {action, computed, observable} from "mobx";
import autobind from "autobind-decorator";
import {
    DUPLICATE_GROUP_NAME_MSG,
    getDefaultGroupName,
    getSampleIdentifiers,
    StudyViewComparisonGroup
} from "../GroupComparisonUtils";
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
import DefaultTooltip from "../../../shared/components/defaultTooltip/DefaultTooltip";

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
        this._inputGroupName = getDefaultGroupName(this.props.store.filters, this.props.store.entrezGeneIdToGene.result!);
    }

    @autobind
    @action
    private cancelAddGroup() {
        this.addGroupPanelOpen = false;
        this._inputGroupName = "";
        this.addSamplesTargetGroupId = "";
    }

    @autobind
    @action
    private deleteGroup(group: StudyViewComparisonGroup) {
        this.props.store.toggleComparisonGroupMarkedForDeletion(group.uid);
    }

    @autobind
    @action
    private async addSamplesToGroup(group: StudyViewComparisonGroup) {
        if (this.props.store.selectedSamples.result) {
            await comparisonClient.updateGroup(
                group.uid,
                addSamplesParameters(group, this.props.store.selectedSamples.result)
            );
            this.props.store.notifyComparisonGroupsChange();
        }
    }

    private get headerWithSearch() {
        return (
            <div style={{display:"flex", flexDirection:"row", justifyContent:"space-between", width:"100%", marginTop:3}}>
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
         null
        );
    }

    @autobind
    private restoreGroup(group:StudyViewComparisonGroup) {
        this.props.store.toggleComparisonGroupMarkedForDeletion(group.uid);
    }

    @autobind
    private async renameGroup(newName:string, group:StudyViewComparisonGroup) {
        const {name, ...rest} = group;
        await comparisonClient.updateGroup(
            group.uid,
            { name: newName, ...rest}
        );
        this.props.store.notifyComparisonGroupsChange();
    }

    private readonly groupsSection = MakeMobxView({
        await:()=>[
            this.props.store.comparisonGroups,
            this.filteredGroups,
            this.props.store.selectedSamples
        ],
        render:()=>{
            if (this.props.store.comparisonGroups.result!.length > 0) {
                // show this component if there are groups, and if filteredGroups is complete
                const allGroupNames = this.props.store.comparisonGroups.result!.map(group=>group.name);
                return (
                    <div className={styles.groupCheckboxes}>
                        {this.filteredGroups.result!.length > 0 ? (
                            this.filteredGroups.result!.map(group=>(
                                <GroupCheckbox
                                    group={group}
                                    store={this.props.store}
                                    markedForDeletion={this.props.store.isComparisonGroupMarkedForDeletion(group.uid)}
                                    restore={this.restoreGroup}
                                    rename={this.renameGroup}
                                    delete={this.deleteGroup}
                                    addSelectedSamples={this.addSamplesToGroup}
                                    allGroupNames={allGroupNames}
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
                        Group comparison allows you to create custom groups and compare their clinical and genomic features. Use the button below to create groups based on selections.
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
                        this.props.store.updateComparisonGroupsFilter();
                    }}
                >Select</button>
            );
        } else {
            return null;
        }
    }

    private get compareButton() {
        if (this.props.store.comparisonGroups.isComplete) {
            // only show if there are enough groups to possibly compare (i.e. 2)
            const tooltipText = this.props.store.comparisonGroups.result.length >=2 ? "Open a comparison session with selected groups" : "Create at least two groups to open a comparison session";
            return (
                <DefaultTooltip overlay={tooltipText}>
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
                </DefaultTooltip>
            );
        } else {
            return null;
        }
    }

    private readonly actionButtons = MakeMobxView({
            await:()=>[
                this.props.store.comparisonGroups
            ],
            render:()=> {
                if (this.props.store.comparisonGroups.result!.length > 0) {
                    return <div
                        style={{
                            marginTop:6
                        }}
                    >
                        {this.compareButton}
                        {this.selectButton}
                    </div>
                } else {
                   return null;
                }
            }
    });

    private get addGroupPanel() {
        let contents:any;
        const inputWidth = 235;
        const createOrAddButtonWidth = 58;
        const selectedSamples = this.props.store.selectedSamples.isComplete ? this.props.store.selectedSamples.result :  undefined;
        const allGroupNames = this.props.store.comparisonGroups.isComplete ? this.props.store.comparisonGroups.result!.map(group=>group.name) : undefined;
        if (this.addGroupPanelOpen) {
            contents = [
                <div style={{display:"none", flexDirection:"row", justifyContent:"space-between", width:"100%", marginTop:3}}>
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
                    <div style={{display:"flex", flexDirection:"row", justifyContent:"space-between", alignItems:"center", width:"100%"}}>
                        <DefaultTooltip
                            visible={allGroupNames && (allGroupNames.indexOf(this.inputGroupName) > -1)}
                            overlay={
                                <div>
                                    <i
                                        className="fa fa-md fa-exclamation-triangle"
                                        style={{
                                            color: "#BB1700",
                                            marginRight: 5
                                        }}
                                    />
                                    <span>
                                        {DUPLICATE_GROUP_NAME_MSG}
                                    </span>
                                </div>
                            }
                        >
                            <input
                                className="form-control"
                                style={{ marginRight:5 }}
                                type="text"
                                placeholder="Enter a name for your new group"
                                value={this.inputGroupName}
                                onChange={this.onChangeInputGroupName}
                            />
                        </DefaultTooltip>
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
                            disabled={!selectedSamples || this.inputGroupName.length === 0 || !allGroupNames || (allGroupNames.indexOf(this.inputGroupName) > -1)}
                        >Create</button>
                    </div>
                </div>
            ];
        } else {
            contents = (
                <button
                    className="btn btn-sm btn-primary"
                    onClick={this.showAddGroupPanel}
                    disabled={!selectedSamples || !this.props.store.entrezGeneIdToGene.isComplete}
                    style={{width:"100%"}}
                >Create new group from selected samples {selectedSamples ? ` (${selectedSamples.length})` : ""}
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
                 style={{position:"relative"}}
            >
                {this.headerWithoutSearch}
                {this.groupsSection.component}
                {this.actionButtons.component}
                <hr />
                {this.addGroupPanel}
            </div>
        );
    }
}