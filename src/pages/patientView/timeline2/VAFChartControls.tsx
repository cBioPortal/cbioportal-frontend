import React from 'react';
import { observer } from 'mobx-react';
import ReactSelect from 'react-select';
import SampleManager from '../SampleManager';
import { clinicalAttributeListForSamples } from '../SampleManager';
import LabeledCheckbox from '../../../shared/components/labeledCheckbox/LabeledCheckbox';
import TimelineWrapperStore from './TimelineWrapperStore';

interface IVAFChartControlsProps {
    wrapperStore: TimelineWrapperStore;
    sampleManager: SampleManager;
}

interface IVAFChartHeaderProps {
    wrapperStore: TimelineWrapperStore;
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

const VAFChartHeader: React.FunctionComponent<IVAFChartHeaderProps> = observer(
    function({ wrapperStore }) {
        const getYAxisValues = () => {
            let yValues = wrapperStore.vafChartLogScale
                ? [1, 0.1, 0.01, 0]
                : [1, 0.8, 0.6, 0.4, 0.2, 0];

            // if "set y axis to data range" is selected,
            // the y axis values must be recalculated based on
            // what is the max y value (wrapperStore.maxYAxisToDataRange)
            // and min y value (wrapperStore.minYAxisToDataRange)

            /*if (wrapperStore.vafChartYAxisToDataRange) {
                yValues.forEach((value, i) => {
                    if (value > wrapperStore.maxYAxisToDataRange) {

                    }
                });
            }*/
            return yValues;
        };

        const yValues = getYAxisValues();
        const yPadding = 10;
        return (
            <div
                style={{
                    height: wrapperStore.vafChartHeight,
                    width: 140,
                }}
            >
                <svg height={wrapperStore.vafChartHeight} width="140">
                    <text y={10} style={{ textAlign: 'left' }}>
                        VAF
                    </text>
                    <text
                        y={wrapperStore.vafChartHeight / 2}
                        style={{ textAlign: 'left' }}
                    >
                        Allele Freq
                    </text>

                    <g transform={`translate(0,0)`}>
                        {yValues.map((yValue, index) => {
                            return (
                                <g transform={`translate(120,0)`}>
                                    <text
                                        y={
                                            (index *
                                                (wrapperStore.dataHeight -
                                                    yPadding * 2)) /
                                                (yValues.length - 1) +
                                            yPadding
                                        }
                                        font-size="10px"
                                        style={{ textAlign: 'right' }}
                                    >
                                        {yValue}
                                    </text>
                                </g>
                            );
                        })}
                    </g>
                </svg>
            </div>
        );
    }
);

export { VAFChartHeader, VAFChartControls };
