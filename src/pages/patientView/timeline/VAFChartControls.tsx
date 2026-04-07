import React from 'react';
import { observer } from 'mobx-react';
import ReactSelect from 'react-select';
import SampleManager, {
    clinicalAttributeListForSamples,
} from '../SampleManager';
import LabeledCheckbox from '../../../shared/components/labeledCheckbox/LabeledCheckbox';
import VAFChartWrapperStore from './VAFChartWrapperStore';
import { CheckedSelect, Option } from 'cbioportal-frontend-commons';

interface IVAFChartControlsProps {
    wrapperStore: VAFChartWrapperStore;
    sampleManager: SampleManager;
}

export const GROUP_BY_NONE = 'None';

const VAFChartControls: React.FunctionComponent<IVAFChartControlsProps> = observer(
    function({ wrapperStore, sampleManager }) {
        const sampleOptions: Option[] = sampleManager.samples.map(sample => ({
            value: sample.id,
            label: sample.id,
        }));

        const selectedSampleValues: { value: string }[] =
            wrapperStore.selectedSampleIds === null
                ? sampleOptions
                : sampleOptions.filter(o =>
                      wrapperStore.selectedSampleIds!.includes(o.value)
                  );

        const numSelected = selectedSampleValues.length;
        const numTotal = sampleOptions.length;
        const samplePlaceholder =
            numSelected === numTotal
                ? 'Select Samples: All'
                : `Select Samples: ${numSelected}/${numTotal}`;

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
            <div className={'VAFChartControls'} data-test={'VAFChartControls'}>
                <label>
                    Select Samples:&nbsp;
                    <span style={{ display: 'inline-block', width: 250 }}>
                        <CheckedSelect
                            name={'select-samples'}
                            placeholder={samplePlaceholder}
                            value={selectedSampleValues}
                            options={sampleOptions}
                            onChange={(options: { value: string }[]) => {
                                if (options.length === sampleOptions.length) {
                                    wrapperStore.setSelectedSampleIds(null);
                                } else {
                                    wrapperStore.setSelectedSampleIds(
                                        options.map(o => o.value)
                                    );
                                }
                            }}
                        />
                    </span>
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
