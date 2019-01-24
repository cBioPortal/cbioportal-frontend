import * as React from "react";
import {observer} from "mobx-react";
import { SampleGroup, caseCountsInParens } from "./GroupComparisonUtils";
import MobxPromise from "mobxpromise";
import { ButtonGroup, Button } from "react-bootstrap";
import { MakeMobxView } from "shared/components/MobxView";
import LoadingIndicator from "shared/components/loadingIndicator/LoadingIndicator";
import ErrorMessage from "shared/components/ErrorMessage";
import _ from "lodash";
import GroupComparisonStore from "./GroupComparisonStore";
import classNames from "classnames";
import ListIndexedMap from "shared/lib/ListIndexedMap";
import { SampleIdentifier, PatientIdentifier } from "shared/api/generated/CBioPortalAPI";

export interface IGroupSelectorProps {
    store:GroupComparisonStore;
}

@observer
export default class GroupSelector extends React.Component<IGroupSelectorProps,{}> {
    readonly tabUI = MakeMobxView({
        await:()=>[
            this.props.store.sampleGroups, 
            this.props.store.selectedSampleGroups, 
            this.props.store.sampleGroupToPatients,
            this.props.store.overlappingSelectedSamples,
            this.props.store.overlappingSelectedPatients
        ],
        render:()=>{
            if (this.props.store.sampleGroups.result!.length === 0) {
                return null;
            } else {
                const selectedGroups = _.keyBy(this.props.store.selectedSampleGroups.result!, g=>g.id);
                const sampleGroupToPatients = this.props.store.sampleGroupToPatients.result!;
                let excludeSamplesMap = new ListIndexedMap<SampleIdentifier>();
                let excludePatientsMap = new ListIndexedMap<PatientIdentifier>();
                if (this.props.store.excludeOverlapping) {
                    excludeSamplesMap = ListIndexedMap.from(
                        this.props.store.overlappingSelectedSamples.result!, s=>[s.studyId, s.sampleId]
                    );
                    excludePatientsMap = ListIndexedMap.from(
                        this.props.store.overlappingSelectedPatients.result!, s=>[s.studyId, s.patientId]
                    );
                }
                return (
                    <div className="btn-group" style={{
                        maxWidth:400
                    }}>
                        {this.props.store.sampleGroups.result!.map(group=>{
                            let existOverlappingSamples = false;
                            let existOverlappingPatients = false;
                            const unfilteredSamples = group.sampleIdentifiers;
                            const unfilteredPatients = sampleGroupToPatients[group.id];
                            // filter out overlapping samples
                            const filteredSamples = unfilteredSamples.filter(s=>!excludeSamplesMap.has(s.studyId, s.sampleId));
                            const filteredPatients = unfilteredPatients.filter(p=>!excludePatientsMap.has(p.studyId, p.patientId));
                            if (filteredSamples.length !== unfilteredSamples.length) {
                                existOverlappingSamples = true;
                            }
                            if (filteredPatients.length !== unfilteredPatients.length) {
                                existOverlappingPatients = true;
                            }
                            return (
                                <button
                                    className={classNames("btn", "noBorderRadius", { "btn-primary":(group.id in selectedGroups), "btn-default":!(group.id in selectedGroups)})}
                                    onClick={()=>this.props.store.toggleSampleGroupSelected(group.id)}
                                    disabled={filteredSamples.length === 0 && filteredPatients.length === 0}
                                >
                                {`${group.name} ${
                                    caseCountsInParens(filteredSamples, filteredPatients, existOverlappingSamples, existOverlappingPatients)
                                    }`}
                                </button> 
                            );
                        })}
                    </div>
                )
            }
        },
        renderPending:()=><LoadingIndicator isLoading={true} size="small"/>,
        renderError:()=><ErrorMessage/>
    });
    render() {
        return this.tabUI.component;
    }
}