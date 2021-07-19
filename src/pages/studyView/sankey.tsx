import * as React from 'react';

import { Chart } from 'react-google-charts';
import { StudyViewPageStore } from './StudyViewPageStore';
import { TreatmentSankeyGraph } from 'cbioportal-ts-api-client';
import { action, makeObservable, observable, computed } from 'mobx';
import { observer } from 'mobx-react';

export type SankeyProps = {
    store: StudyViewPageStore;
};

@observer
export default class Sankey extends React.Component<SankeyProps, {}> {
    private store: StudyViewPageStore;

    @observable
    private filter = '';

    constructor(props: SankeyProps) {
        super(props);
        makeObservable(this);
        this.store = props.store;
    }

    @computed
    private get sankeyData() {
        if (!this.store.treatmentSequences.isComplete) {
            return [];
        }
        var filter = new RegExp('.*');
        try {
            filter = new RegExp(this.filter);
        } catch (e) {}

        return this.store.treatmentSequences.result.edges
            .map(edge => {
                return [
                    edge.from.treatment + '_' + edge.from.index,
                    edge.to.treatment + '_' + edge.to.index,
                    edge.count as any,
                ];
            })
            .filter(edge =>
                this.filter == ''
                    ? true
                    : edge[0].search(filter) >= 0 || edge[1].search(filter) >= 0
            );
    }

    @action.bound
    onFilterChange(event: React.ChangeEvent<HTMLInputElement>) {
        this.filter = event.target.value;
    }

    render() {
        if (!this.store.treatmentSequences.isComplete) {
            return <div>Chill for a second</div>;
        }

        return (
            <div>
                <div>
                    <input type="text" onChange={this.onFilterChange}></input>
                </div>
                <Chart
                    width={600}
                    height={'300px'}
                    chartType="Sankey"
                    loader={<div>Loading Chart</div>}
                    data={[['From', 'To', 'Weight']].concat(this.sankeyData)}
                    rootProps={{ 'data-testid': '2' }}
                />
            </div>
        );
    }
}
