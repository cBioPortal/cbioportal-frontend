import * as React from "react";
import {SyntheticEvent} from "react";
import {observer} from "mobx-react";
import GroupComparisonStore from "./GroupComparisonStore";
import DefaultTooltip from "../../shared/components/defaultTooltip/DefaultTooltip";
import autobind from "autobind-decorator";
import {action, computed, observable} from "mobx";
import {remoteData} from "../../shared/api/remoteData";
import {ComparisonGroup, DUPLICATE_GROUP_NAME_MSG} from "./GroupComparisonUtils";
import {MakeMobxView} from "../../shared/components/MobxView";
import LoadingIndicator from "../../shared/components/loadingIndicator/LoadingIndicator";
import {SessionGroupData} from "../../shared/api/ComparisonGroupClient";
import _ from "lodash";
import {getStudiesAttrForPatientOverlapGroup, getStudiesAttrForSampleOverlapGroup, joinNames} from "./OverlapUtils";
import {Checkbox} from "react-bootstrap";
import InfoIcon from "../../shared/components/InfoIcon";
import FlexAlignedCheckbox from "../../shared/components/FlexAlignedCheckbox";

export interface ICreateGroupFromOverlapProps {
    store:GroupComparisonStore;
    includedRegions:string[][]; // group.uid[][]
    allGroupsInVenn:string[]; // uid[]
    x:number;
    y:number;
    submitGroup:(group:SessionGroupData, saveToUser:boolean)=>void;
    caseType:"sample"|"patient";
    width:number;
}

function getRegionSummary(
    region:string[],
    allGroupsInVenn:string[],
    uidToGroup:{[uid:string]:ComparisonGroup},
    caseType:"sample"|"patient"
) {
    const includedNames = region.map(uid=>uidToGroup[uid].name);
    const excludedNames = _.difference(allGroupsInVenn, region).map(uid=>uidToGroup[uid].name);

    let ret = <span>{caseType[0].toUpperCase()}{caseType.substring(1)}s in {joinNames(includedNames, "and")}</span>;
    if (excludedNames.length > 0) {
        ret = <span>{ret}, but not in {joinNames(excludedNames, "or")}</span>;
    }
    ret = <span>{ret}.</span>;

    return ret;
}

@observer
export default class CreateGroupFromOverlap extends React.Component<ICreateGroupFromOverlapProps, {}> {
    @observable inputGroupName = "";
    @observable saveGroupToUser = true;

    @autobind
    @action
    private toggleSaveGroupToUser() {
        this.saveGroupToUser = !this.saveGroupToUser;
    }

    @autobind
    @action
    private onChangeInputGroupName(e:SyntheticEvent<HTMLInputElement>) {
        this.inputGroupName = (e.target as HTMLInputElement).value;
    }

    @autobind
    @action
    private submit() {
        let studiesAttr:SessionGroupData["studies"];
        if (this.props.caseType === "sample") {
            studiesAttr = getStudiesAttrForSampleOverlapGroup(
                this.props.store._originalGroups.result!,
                this.props.includedRegions,
                this.props.allGroupsInVenn
            );
        } else {
            studiesAttr = getStudiesAttrForPatientOverlapGroup(
                this.props.store._originalGroups.result!,
                this.props.includedRegions,
                this.props.allGroupsInVenn,
                this.props.store.patientToSamplesSet.result!
            )
        }

        this.props.submitGroup({
            name: this.inputGroupName,
            description: "",
            studies:studiesAttr,
            origin:this.props.store.origin.result!
        }, this.saveGroupToUser);
    }

    @computed get isDuplicateName() {
        const existingGroupNamesObj = this.props.store.existingGroupNames.result!;
        let existingGroupNames = existingGroupNamesObj.session;
        if (this.saveGroupToUser) {
            // if we're going to save the group to the user, we have to compare the group name
            //  with all existing groups on the user for these studies
            existingGroupNames = existingGroupNames.concat(existingGroupNamesObj.user);
        }
        return existingGroupNames.includes(this.inputGroupName.trim());
    }

    private readonly enterNameInterface = MakeMobxView({
        await:()=>[
            this.props.store.origin,
            this.props.store.sampleSet,
            this.props.store.existingGroupNames,
            this.props.store._originalGroups,
            this.props.store.patientToSamplesSet
        ],
        render:()=>(
            <div style={{width:250}}>
                {this.props.store.isLoggedIn && (
                    <FlexAlignedCheckbox
                        checked={this.saveGroupToUser}
                        onClick={this.toggleSaveGroupToUser}
                        label={[
                            <span style={{marginRight:5}}>Save group to user account</span>,
                            <InfoIcon divStyle={{display:"inline"}} tooltip={<span>Selecting this will save the new group with the associated study in your user account.</span>}/>
                        ]}
                    />
                )}
                <div style={{display:"flex", justifyContent:"center", alignItems:"center"}}>
                    <input
                        className="form-control"
                        style={{ marginRight:5 }}
                        type="text"
                        placeholder="Enter a group name.."
                        value={this.inputGroupName}
                        onChange={this.onChangeInputGroupName}
                    />
                    <button
                        className="btn btm-sm btn-primary"
                        disabled={this.inputGroupName.length === 0 || this.isDuplicateName}
                        onClick={this.submit}
                    >
                        Submit
                    </button>
                </div>
                { this.isDuplicateName && (
                    <div style={{marginTop:4}}>
                        {DUPLICATE_GROUP_NAME_MSG}
                    </div>
                )}
            </div>
        ),
        renderPending:()=><LoadingIndicator isLoading={true}/>
    });

    private readonly includedRegionsDescription = MakeMobxView({
        await:()=>[
            this.props.store.uidToGroup
        ],
        render:()=>{
            return (
                <div>
                    {this.props.includedRegions.map(region=>(
                        <div>
                            {getRegionSummary(
                                region,
                                this.props.allGroupsInVenn,
                                this.props.store.uidToGroup.result!,
                                this.props.caseType
                            )}
                        </div>
                    ))}
                </div>
            );
        }
    });

    render() {
        return (
            <div style={{
                position:"absolute",
                left:this.props.x,
                top:this.props.y,
                width:this.props.width,
                display:"flex",
                flexDirection:"column",
                justifyContent:"center",
                alignItems:"center"
            }}>
                <DefaultTooltip
                    trigger={["click"]}
                    overlay={this.enterNameInterface.component}
                    placement="bottom"
                >
                    <button
                        className="btn btn-md btn-default"
                        disabled={this.props.includedRegions.length === 0}
                    >
                        Create Group From Selected Diagram Areas
                    </button>
                </DefaultTooltip>
                <div style={{marginTop:20}}>
                    {this.includedRegionsDescription.component}
                </div>
            </div>
        );
    }
}