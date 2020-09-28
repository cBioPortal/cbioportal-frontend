import React from 'react';
import { observer } from 'mobx-react';
import ReactSelect from 'react-select';
import SampleManager, {
    clinicalAttributeListForSamples,
} from '../SampleManager';
import LabeledCheckbox from '../../../shared/components/labeledCheckbox/LabeledCheckbox';
import TimelineWrapperStore from './TimelineWrapperStore';

interface IVAFChartControlsProps {
    wrapperStore: TimelineWrapperStore;
    sampleManager: SampleManager;
}

export const GROUP_BY_NONE = 'None';

const VAFChartControls: React.FunctionComponent<IVAFChartControlsProps> = observer(
    function({ wrapperStore, sampleManager }) {
        const groupByOptions = [
            {
                label: GROUP_BY_NONE,
                value: GROUP_BY_NONE,
            },
            ...clinicalAttributeListForSamples(sampleManager.samples).map(
                item => ({
                    label: `${item.value}`,
                    value: `${item.id}`,
                })
            ),
        ];

        function groupByValue() {
            let value = groupByOptions.find(
                opt => opt.value == wrapperStore.groupByOption
            );

            return value
                ? {
                      label: value.label,
                      value: wrapperStore.groupByOption,
                  }
                : '';
        }

        return (
            <div
                style={{
                    marginTop: 5,
                    marginLeft: 130,
                    display: 'flex',
                    alignItems: 'center',
                }}
            >
                <span style={{ marginTop: -3, marginRight: 3 }}>Group by:</span>
                <div
                    style={{
                        minWidth: 200,
                        width: 200,
                        zIndex: 20,
                        marginRight: 15,
                    }}
                >
                    <ReactSelect
                        value={groupByValue()}
                        options={groupByOptions}
                        onChange={(option: any) => {
                            wrapperStore.setGroupByOption(
                                option ? option.value : ''
                            );
                        }}
                        clearable={false}
                        searchable={true}
                    />
                </div>
                <div style={{ float: 'left', marginRight: 15, marginTop: 4 }}>
                    <LabeledCheckbox
                        checked={wrapperStore.showSequentialMode}
                        onChange={() =>
                            wrapperStore.setShowSequentialMode(
                                !wrapperStore.showSequentialMode
                            )
                        }
                        labelProps={{ style: { marginRight: 10 } }}
                        inputProps={{ 'data-test': 'TableShowSequentialMode' }}
                    >
                        <span style={{ marginTop: -3 }}>
                            Show samples in sequential mode
                        </span>
                    </LabeledCheckbox>
                </div>
                <div style={{ float: 'left', marginRight: 15, marginTop: 4 }}>
                    <LabeledCheckbox
                        checked={wrapperStore.onlyShowSelectedInVAFChart}
                        onChange={() =>
                            wrapperStore.setOnlyShowSelectedInVAFChart(
                                !wrapperStore.onlyShowSelectedInVAFChart
                            )
                        }
                        labelProps={{ style: { marginRight: 10 } }}
                        inputProps={{ 'data-test': 'TableShowOnlyHighlighted' }}
                    >
                        <span style={{ marginTop: -3 }}>
                            Show only selected mutations
                        </span>
                    </LabeledCheckbox>
                </div>
                <div style={{ float: 'left', marginRight: 15, marginTop: 4 }}>
                    <LabeledCheckbox
                        checked={wrapperStore.vafChartLogScale}
                        onChange={() => {
                            wrapperStore.setVafChartLogScale(
                                !wrapperStore.vafChartLogScale
                            );
                        }}
                        labelProps={{ style: { marginRight: 10 } }}
                        inputProps={{ 'data-test': 'VAFLogScale' }}
                    >
                        <span style={{ marginTop: -3 }}>Log scale</span>
                    </LabeledCheckbox>
                </div>
                <div style={{ float: 'left', marginRight: 15, marginTop: 4 }}>
                    <LabeledCheckbox
                        checked={wrapperStore.vafChartYAxisToDataRange}
                        onChange={() => {
                            wrapperStore.setVafChartYAxisToDataRange(
                                !wrapperStore.vafChartYAxisToDataRange
                            );
                        }}
                        labelProps={{ style: { marginRight: 10 } }}
                        inputProps={{ 'data-test': 'VAFDataRange' }}
                    >
                        <span style={{ marginTop: -3 }}>
                            Set y-axis to data range
                        </span>
                    </LabeledCheckbox>
                </div>
            </div>
        );
    }
);

export { VAFChartControls };
