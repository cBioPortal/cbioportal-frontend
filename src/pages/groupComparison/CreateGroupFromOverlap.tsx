import * as React from "react";
import {observer} from "mobx-react";
import GroupComparisonStore from "./GroupComparisonStore";
import DefaultTooltip from "../../shared/components/defaultTooltip/DefaultTooltip";
import autobind from "autobind-decorator";
import {action, computed, observable} from "mobx";
import {SyntheticEvent} from "react";
import {remoteData} from "../../shared/api/remoteData";
import {
    ComparisonGroup,
    DUPLICATE_GROUP_NAME_MSG,
    excludeSamples,
    intersectSamples,
    unionSamples
} from "./GroupComparisonUtils";
import {StudyViewFilter} from "../../shared/api/generated/CBioPortalAPIInternal";
import {MakeMobxView} from "../../shared/components/MobxView";
import LoadingIndicator from "../../shared/components/loadingIndicator/LoadingIndicator";
import {SessionGroupData} from "../../shared/api/ComparisonGroupClient";
import _ from "lodash";
import {getStudiesAttrForPatientOverlapGroup, getStudiesAttrForSampleOverlapGroup, joinNames} from "./OverlapUtils";

export interface ICreateGroupFromOverlapProps {
    store:GroupComparisonStore;
    includedRegions:string[][]; // group.uid[][]
    allGroupsInVenn:string[]; // uid[]
    x:number;
    y:number;
    submitGroup:(group:SessionGroupData)=>void;
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
        });
    }

    readonly existingGroupNames = remoteData({
        await:()=>[this.props.store._originalGroups],
        invoke:()=>Promise.resolve(
            this.props.store._originalGroups.result!.map(g=>g.name)
        )
    });

    private isDuplicateName(existingGroupNames:string[]) {
        return existingGroupNames.includes(this.inputGroupName.trim());
    }

    private readonly enterNameInterface = MakeMobxView({
        await:()=>[
            this.props.store.origin,
            this.props.store.sampleSet,
            this.existingGroupNames,
            this.props.store._originalGroups,
            this.props.store.patientToSamplesSet
        ],
        render:()=>(
            <div style={{width:250}}>
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
                        disabled={this.inputGroupName.length === 0 || this.isDuplicateName(this.existingGroupNames.result!)}
                        onClick={this.submit}
                    >
                        Submit
                    </button>
                </div>
                { this.isDuplicateName(this.existingGroupNames.result!) && (
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