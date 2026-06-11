import * as React from 'react';
import { observer } from 'mobx-react';
import { StructuralVariant } from 'cbioportal-ts-api-client';
import { FusionCohortStore } from './FusionCohortStore';
import { FusionCohortFilterBar } from './FusionCohortFilterBar';
import { FusionRecurrenceTable } from './FusionRecurrenceTable';
import { FusionCohortMatrix } from './FusionCohortMatrix';

interface IFusionCohortTabProps {
    structuralVariants: StructuralVariant[];
    studyId?: string;
}

const emptyStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    color: '#999',
    fontSize: 14,
    padding: 40,
};

@observer
export class FusionCohortTab extends React.Component<IFusionCohortTabProps> {
    private store: FusionCohortStore;

    constructor(props: IFusionCohortTabProps) {
        super(props);
        this.store = new FusionCohortStore();
        this.store.setStructuralVariants(props.structuralVariants);
    }

    componentDidUpdate(prev: IFusionCohortTabProps) {
        if (prev.structuralVariants !== this.props.structuralVariants) {
            this.store.setStructuralVariants(this.props.structuralVariants);
        }
    }

    render() {
        if (this.store.allEvents.length === 0) {
            return (
                <div style={emptyStyle}>
                    No structural variant / fusion data available.
                </div>
            );
        }

        return (
            <div style={{ padding: 12 }}>
                <FusionCohortFilterBar store={this.store} />
                <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
                    <div style={{ flex: '1 1 420px', minWidth: 360 }}>
                        <h5 style={{ margin: '4px 0' }}>Recurrence</h5>
                        <FusionRecurrenceTable store={this.store} />
                    </div>
                    <div style={{ flex: '1 1 420px', minWidth: 360 }}>
                        <h5 style={{ margin: '4px 0' }}>
                            Samples × fusion pairs
                        </h5>
                        <FusionCohortMatrix
                            store={this.store}
                            studyId={this.props.studyId}
                        />
                    </div>
                </div>
            </div>
        );
    }
}

export default FusionCohortTab;
