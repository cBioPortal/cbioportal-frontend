import * as React from 'react';
import LoadingIndicator from "shared/components/loadingIndicator/LoadingIndicator";
import { observer } from "mobx-react";
import GroupComparisonStore from './GroupComparisonStore';
import { observable, computed } from 'mobx';
import Venn from './Venn';
import { COLORS } from 'pages/studyView/StudyViewUtils';
import _ from "lodash";

export interface IOverlapProps {
    store: GroupComparisonStore
}

@observer
export default class Overlap extends React.Component<IOverlapProps, {}> {

    constructor(props: IOverlapProps, context: any) {
        super(props, context);
    }

    @computed get sampleSets() {
        let colorIndex = 0;
        if (this.props.store.sampleGroupsCombinationSets.isComplete) {
            let maxCount = _.max(this.props.store.sampleGroupsCombinationSets.result.map(set => set.cases.length))!;
            return this.props.store.sampleGroupsCombinationSets.result.map(set => {
                return {
                    ...set,
                    count: set.cases.length,
                    //TODO: standardize colors across all tabs
                    color: set.sets.length === 1 ? COLORS[colorIndex++] : undefined,
                    //this is to make sure all the circle groups are of same size
                    size: set.sets.length === 1 ? maxCount : set.cases.length
                }
            }).sort((a, b) => b.count - a.count);
        }
        return [];
    }

    @computed get patientSets() {
        if (this.props.store.patientGroupsCombinationSets.isComplete) {
            let colorIndex = 0;
            let maxCount = _.max(this.props.store.sampleGroupsCombinationSets.result.map(set => set.cases.length))!;
            return this.props.store.patientGroupsCombinationSets.result.map(set => {
                return {
                    ...set,
                    count: set.cases.length,
                    //TODO: standardize colors across all tabs
                    color: set.sets.length === 1 ? COLORS[colorIndex++] : undefined,
                    //this is to make sure all the circle groups are of same size
                    size: set.sets.length === 1 ? maxCount : set.cases.length
                }
            }).sort((a, b) => b.count - a.count);
        }
        return [];
    }

    public render() {
        if (this.props.store.sampleGroupsCombinationSets.isPending ||
            this.props.store.patientGroupsCombinationSets.isPending) {
            return <LoadingIndicator isLoading={true} size={"big"} center={true} />;
        }
        return (<div style={{ display: 'flex' }}>
            <div style={{ alignItems: 'center', display: 'flex', flexDirection: 'column' }}>
                <span>Sample Overlap</span>
                <Venn id="sampleVennDiagram" sets={this.sampleSets}></Venn>
            </div>
            <div style={{ alignItems: 'center', display: 'flex', flexDirection: 'column' }}>
                <span>Patient Overlap</span>
                <Venn id="patientVennDiagram" sets={this.patientSets}></Venn>
            </div>
        </div>)
    }
}
