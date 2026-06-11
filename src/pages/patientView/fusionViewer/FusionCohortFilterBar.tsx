import * as React from 'react';
import { observer } from 'mobx-react';
import { FusionCohortStore } from './FusionCohortStore';
import { FusionCohortFilter } from './data/types';

interface IFusionCohortFilterBarProps {
    store: FusionCohortStore;
}

const FRAME_OPTIONS: {
    value: FusionCohortFilter['inFrame'];
    label: string;
}[] = [
    { value: 'any', label: 'Any' },
    { value: 'inFrame', label: 'In-frame' },
    { value: 'outOfFrame', label: 'Out-of-frame' },
    { value: 'unknown', label: 'Unknown' },
];

const facetStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    fontSize: 12,
    marginRight: 16,
};

@observer
export class FusionCohortFilterBar extends React.Component<
    IFusionCohortFilterBarProps
> {
    private toggle(list: string[], value: string): string[] {
        return list.includes(value)
            ? list.filter(v => v !== value)
            : [...list, value];
    }

    render() {
        const { store } = this.props;
        const { filter } = store;

        return (
            <div
                style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    alignItems: 'flex-start',
                    padding: '8px 4px',
                    borderBottom: '1px solid #e9ecef',
                    marginBottom: 8,
                }}
            >
                <label style={facetStyle}>
                    <span>Frame</span>
                    <select
                        data-test="frame-select"
                        value={filter.inFrame}
                        onChange={e =>
                            store.setInFrameFilter(
                                e.target.value as FusionCohortFilter['inFrame']
                            )
                        }
                    >
                        {FRAME_OPTIONS.map(o => (
                            <option key={o.value} value={o.value}>
                                {o.label}
                            </option>
                        ))}
                    </select>
                </label>

                <div style={facetStyle}>
                    <span>Gene partner</span>
                    <div style={{ maxHeight: 90, overflowY: 'auto' }}>
                        {store.genePartnerOptions.map(g => (
                            <label
                                key={g}
                                style={{ display: 'block', fontWeight: 400 }}
                            >
                                <input
                                    type="checkbox"
                                    checked={filter.genePartners.includes(g)}
                                    onChange={() =>
                                        store.setGenePartnerFilter(
                                            this.toggle(filter.genePartners, g)
                                        )
                                    }
                                />{' '}
                                {g}
                            </label>
                        ))}
                    </div>
                </div>

                <div style={facetStyle}>
                    <span>SV type</span>
                    <div>
                        {store.svTypeOptions.map(t => (
                            <label
                                key={t}
                                style={{ display: 'block', fontWeight: 400 }}
                            >
                                <input
                                    type="checkbox"
                                    checked={filter.svTypes.includes(t)}
                                    onChange={() =>
                                        store.setSvTypeFilter(
                                            this.toggle(filter.svTypes, t)
                                        )
                                    }
                                />{' '}
                                {t}
                            </label>
                        ))}
                    </div>
                </div>

                <button
                    data-test="clear-all"
                    style={{ alignSelf: 'center' }}
                    onClick={() => store.clearFilter()}
                >
                    Clear all
                </button>
            </div>
        );
    }
}

export default FusionCohortFilterBar;
