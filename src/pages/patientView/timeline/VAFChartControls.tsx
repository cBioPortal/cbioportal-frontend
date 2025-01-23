import React, { useEffect, useState } from 'react';
import { observer } from 'mobx-react';
import ReactSelect from 'react-select';
import SampleManager, {
    clinicalAttributeListForSamples,
    sampleIdsForSamples,
} from '../SampleManager';
import LabeledCheckbox from '../../../shared/components/labeledCheckbox/LabeledCheckbox';
import VAFChartWrapperStore from './VAFChartWrapperStore';
import _ from 'lodash';

interface IVAFChartControlsProps {
    wrapperStore: VAFChartWrapperStore;
    sampleManager: SampleManager;
}

export const GROUP_BY_NONE = 'None';
export const SELECT_SAMPLE_ALL = {
    label: 'All',
    value: 'All',
};
export const SELECT_SAMPLE_NONE = {
    label: 'None',
    value: 'None',
};

const VAFChartControls: React.FunctionComponent<IVAFChartControlsProps> = observer(
    function({ wrapperStore, sampleManager }) {
        const [
            isInitialSelectedSamples,
            setisInitialSelectedSamples,
        ] = useState(true);

        const selectedSamplesOptions = [
            SELECT_SAMPLE_ALL,
            SELECT_SAMPLE_NONE,
            ...sampleIdsForSamples(sampleManager.samples).map(item => ({
                label: `${item.value}`,
                value: `${item.id}`,
            })),
        ];

        function selectSamplesByValue() {
            let allSelectedSamples = selectedSamplesOptions;
            allSelectedSamples = allSelectedSamples.filter(sample => {
                return (
                    sample.label != SELECT_SAMPLE_ALL.label &&
                    sample.label != SELECT_SAMPLE_NONE.label
                );
            });
            if (isInitialSelectedSamples) {
                console.log('running initial');
                wrapperStore.setSelectedSamplesOptions(allSelectedSamples);
                setisInitialSelectedSamples(!isInitialSelectedSamples);
            }
            if (wrapperStore.selectedSamplesOptions.length === 0) {
                return {
                    label: 'None',
                    value: 'None',
                };
            }
            if (
                _.isEqual(
                    wrapperStore.selectedSamplesOptions,
                    allSelectedSamples
                )
            ) {
                return {
                    label: 'All',
                    value: 'All',
                };
            }

            return wrapperStore.selectedSamplesOptions;
        }

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

            console.log(`Group By Value : ${value}`);

            return value
                ? {
                      label: value.label,
                      value: wrapperStore.groupByOption,
                  }
                : '';
        }

        const SelectedSampleChecklistComponent: React.FC<any> = props => {
            const { data, isSelected, innerRef, innerProps } = props;
            return (
                <div
                    ref={innerRef}
                    {...innerProps}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        padding: '5px',
                    }}
                >
                    <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => {}}
                        style={{ marginRight: '10px' }}
                    />
                    <label>{data.label}</label>
                </div>
            );
        };

        return (
            <div className={'VAFChartControls'} data-test={'VAFChartControls'}>
                <label>
                    Select Samples:&nbsp;
                    <ReactSelect
                        name={'select-by-sample-select'}
                        value={selectSamplesByValue()}
                        options={selectedSamplesOptions}
                        onChange={(options: Array<any>) => {
                            if (options.indexOf(SELECT_SAMPLE_ALL) !== -1) {
                                wrapperStore.setSelectedSamplesOptions(
                                    sampleIdsForSamples(
                                        sampleManager.samples
                                    ).map(item => ({
                                        label: `${item.value}`,
                                        value: `${item.id}`,
                                    }))
                                );
                            } else if (
                                options.indexOf(SELECT_SAMPLE_NONE) !== -1
                            ) {
                                wrapperStore.setSelectedSamplesOptions([]);
                            } else {
                                console.log(
                                    `options before filter : ${JSON.stringify(
                                        options
                                    )}`
                                );
                                options = options.filter(
                                    sample =>
                                        sample.label !=
                                            SELECT_SAMPLE_NONE.label &&
                                        sample.label != SELECT_SAMPLE_ALL.label
                                );
                                console.log(
                                    `options after filter : ${JSON.stringify(
                                        options
                                    )}`
                                );
                                wrapperStore.setSelectedSamplesOptions(options);
                            }
                        }}
                        styles={{
                            container: (styles: any) => ({
                                ...styles,
                                width: 250,
                            }),
                        }}
                        isMulti
                        components={{
                            Option: SelectedSampleChecklistComponent,
                        }}
                        closeMenuOnSelect={false}
                        hideSelectedOptions={false}
                    />
                </label>

                <label>
                    Group by:&nbsp;
                    <ReactSelect
                        name={'group-by-options-select'}
                        value={groupByValue()}
                        options={groupByOptions}
                        onChange={(option: any) => {
                            wrapperStore.setGroupByOption(
                                option ? option.value : ''
                            );
                        }}
                        styles={{
                            container: (styles: any) => ({
                                ...styles,
                                width: 250,
                            }),
                        }}
                        clearable={false}
                        searchable={true}
                    />
                </label>

                {!wrapperStore.isOnlySequentialModePossible && (
                    <label className="checkbox-inline">
                        <input
                            type="checkbox"
                            data-test={'VAFSequentialMode'}
                            checked={wrapperStore.showSequentialMode}
                            onChange={() =>
                                wrapperStore.setShowSequentialMode(
                                    !wrapperStore.showSequentialMode
                                )
                            }
                        />{' '}
                        Show samples in sequential mode
                    </label>
                )}
                <label className="checkbox-inline">
                    <input
                        type="checkbox"
                        checked={wrapperStore.onlyShowSelectedInVAFChart}
                        data-test={'VAFOnlyHighlighted'}
                        onChange={() =>
                            wrapperStore.setOnlyShowSelectedInVAFChart(
                                !wrapperStore.onlyShowSelectedInVAFChart
                            )
                        }
                    />{' '}
                    Show only selected mutations
                </label>
                <label className="checkbox-inline">
                    <input
                        type="checkbox"
                        data-test="VAFLogScale"
                        checked={wrapperStore.vafChartLogScale}
                        onChange={() => {
                            wrapperStore.setVafChartLogScale(
                                !wrapperStore.vafChartLogScale
                            );
                        }}
                    />{' '}
                    Log scale
                </label>
                <label className="checkbox-inline">
                    <input
                        type="checkbox"
                        data-test="VAFDataRange"
                        checked={wrapperStore.vafChartYAxisToDataRange}
                        onChange={() => {
                            wrapperStore.setVafChartYAxisToDataRange(
                                !wrapperStore.vafChartYAxisToDataRange
                            );
                        }}
                    />{' '}
                    Set y-axis to data range
                </label>
            </div>
        );
    }
);

export { VAFChartControls };
