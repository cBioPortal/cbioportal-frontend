import * as React from "react";
import {observer} from "mobx-react";
import {MakeMobxView} from "shared/components/MobxView";
import LoadingIndicator from "shared/components/loadingIndicator/LoadingIndicator";
import ErrorMessage from "shared/components/ErrorMessage";
import GroupComparisonStore from "../GroupComparisonStore";
import autobind from "autobind-decorator";
import GroupSelectorButton from "./GroupSelectorButton";
import GroupSelectorButtonList from "./GroupSelectorButtonList";
import {action, computed, observable, ObservableMap} from "mobx";
import {Modal} from "react-bootstrap";
import WorkspaceGroupTable from "./WorkspaceGroupTable";
import {MAX_GROUPS_IN_WORKSPACE} from "../GroupComparisonUtils";

export interface IGroupSelectorProps {
    store:GroupComparisonStore;
}

@observer
export default class GroupSelector extends React.Component<IGroupSelectorProps,{}> {

    private dragging = false;
    @observable workspaceSelectorShown = false;
    @observable.ref private workspaceSelectionBuffer:ObservableMap<boolean>|null = null;

    @autobind
    private workspaceSelection_isGroupChecked(uid:string) {
        return !!(this.workspaceSelectionBuffer && this.workspaceSelectionBuffer.get(uid));
    }

    @autobind
    @action
    private workspaceSelection_onClick(uid:string) {
        this.workspaceSelectionBuffer && this.workspaceSelectionBuffer.set(uid, !this.workspaceSelectionBuffer.get(uid));
    }

    @autobind
    private workspaceSelection_deselectAll() {
        this.workspaceSelectionBuffer && this.workspaceSelectionBuffer.clear();
    }

    @computed get workspaceSelection_error() {
        if (!this.workspaceSelectionBuffer) {
            return "";
        } else {
            const numChecked = this.workspaceSelectionBuffer.entries().filter(e=>e[1]).length;
            if (numChecked > MAX_GROUPS_IN_WORKSPACE) {
                return `At most ${MAX_GROUPS_IN_WORKSPACE} groups are allowed in workspace. Please deselect ${numChecked - MAX_GROUPS_IN_WORKSPACE}.`;
            } else if (numChecked < 2) {
                return "Please select at least two groups to compare.";
            }
            return "";
        }
    }

    @autobind
    @action
    private showWorkspaceSelector() {
        this.workspaceSelectionBuffer = observable.shallowMap<boolean>(
            this.props.store.workspaceGroupsPartition.result!.inWorkspace.map(g=>[g.uid, true] as [string, boolean])
        );
        this.workspaceSelectorShown = true;
    }

    @autobind
    @action
    private cancelWorkspaceSelection() {
        this.workspaceSelectionBuffer = null;
        this.workspaceSelectorShown = false;
    }

    @autobind
    @action
    private saveWorkspaceSelection() {
        this.props.store.setWorkspaceGroups(this.workspaceSelectionBuffer!);
        this.workspaceSelectorShown = false;
    }


    @autobind
    private isSelected(groupUid:string) {
        return !!this.props.store.isGroupSelected(groupUid);
    }

    @autobind
    private onClick(groupUid:string) {
        if (!this.dragging) {
            this.props.store.toggleGroupSelected(groupUid);
        }
    }

    @autobind
    private onSortEnd(params:any) {
        if (params.oldIndex !== params.newIndex)
            this.props.store.updateDragOrder(params.oldIndex, params.newIndex);

        this.dragging = false;
    }

    @autobind
    private onSortStart() {
        this.dragging = true;
    }

    readonly tabUI = MakeMobxView({
        await:()=>[
            this.props.store._originalGroups,
            this.props.store.sampleSet,
            this.props.store.workspaceGroupsPartition
        ],
        render:()=>{
            if (this.props.store._originalGroups.result!.length === 0) {
                return null;
            } else {
                const buttons = this.props.store._originalGroups.result!.map((group, index)=>(
                    <GroupSelectorButton
                        isSelected={this.isSelected}
                        onClick={this.onClick}
                        sampleSet={this.props.store.sampleSet.result!}
                        group={group}
                        index={index}
                    />
                ));
                return (
                    <div style={{
                        display:"flex",
                        alignItems:"center",
                        position:"relative"
                    }}>
                        <strong style={{marginRight:5}}>Groups: </strong>
                        <span style={{fontSize:12, marginRight:3}}>(drag to reorder)</span>
                        <GroupSelectorButtonList
                            buttons={buttons}
                            axis="xy"
                            onSortStart={this.onSortStart}
                            onSortEnd={this.onSortEnd}
                            distance={6}
                        />
                        {(this.props.store.workspaceGroupsPartition.result!.notInWorkspace.length > 0) && (
                            <>
                                <div
                                    className="btn btn-link"
                                    style={{display:"inline-block"}}
                                    onClick={this.showWorkspaceSelector}
                                >
                                    {this.props.store.workspaceGroupsPartition.result!.notInWorkspace.length} more groups...
                                </div>

                                <Modal
                                    show={this.workspaceSelectorShown}
                                    onHide={this.cancelWorkspaceSelection}
                                    backdrop="static"
                                >
                                    <Modal.Header>
                                        <Modal.Title>Select Workspace Groups</Modal.Title>
                                    </Modal.Header>
                                    <Modal.Body>
                                        <WorkspaceGroupTable
                                            groups={this.props.store.workspaceGroupsPartition.result!.all}
                                            isChecked={this.workspaceSelection_isGroupChecked}
                                            onClick={this.workspaceSelection_onClick}
                                            sampleSet={this.props.store.sampleSet.result!}
                                            deselectAll={this.workspaceSelection_deselectAll}
                                        />
                                    </Modal.Body>
                                    <Modal.Footer>
                                        {this.workspaceSelection_error && (
                                            <div className="alert alert-danger" style={{textAlign:"center", marginBottom:5}}>
                                                <i
                                                    className="fa fa-md fa-exclamation-triangle"
                                                    style={{
                                                        color: "black",
                                                        marginRight:7
                                                    }}
                                                />
                                                {this.workspaceSelection_error}
                                            </div>
                                        )}
                                        <button className="btn btn-md btn-primary" onClick={this.saveWorkspaceSelection}
                                                disabled={!!this.workspaceSelection_error}
                                        >
                                            Save
                                        </button>
                                        &nbsp;
                                        <button className="btn btn-md btn-default" onClick={this.cancelWorkspaceSelection}>
                                            Cancel
                                        </button>
                                    </Modal.Footer>
                                </Modal>
                            </>
                        )}
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