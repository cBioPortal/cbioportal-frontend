import * as React from 'react';
import { action, computed } from 'mobx';
import { Observer, observer } from 'mobx-react';
import styles from './styles.module.scss';
import { ChartOption } from '../AddChartButton';
import * as _ from 'lodash';
import LabeledCheckbox from '../../../../shared/components/labeledCheckbox/LabeledCheckbox';
import { Column } from '../../../../shared/components/lazyMobXTable/LazyMobXTable';
import { getFrequencyStr } from '../../StudyViewUtils';
import LoadingIndicator from '../../../../shared/components/loadingIndicator/LoadingIndicator';
import MobxPromise from 'mobxpromise';
import { ChartDataCountSet } from '../../StudyViewUtils';
import FixedHeaderTable from '../../table/FixedHeaderTable';
import autobind from 'autobind-decorator';
import classnames from 'classnames';
import { EllipsisTextTooltip } from 'cbioportal-frontend-commons';
import { Omit } from '../../../../shared/lib/TypeScriptUtils';
import ifNotDefined from '../../../../shared/lib/ifNotDefined';

export type AddChartOption = Omit<ChartOption, 'chartType'>;
export interface IAddChartByTypeProps {
    options: Omit<AddChartOption, 'freq'>[];
    freqPromise: MobxPromise<ChartDataCountSet>;
    onAddAll: (keys: string[]) => void;
    onClearAll: (keys: string[]) => void;
    onToggleOption: (key: string) => void;
    optionsGivenInSortedOrder?: boolean;
    frequencyHeaderTooltip?: string;
    firstColumnHeaderName?: string;
    hideControls?: boolean;
}

class AddChartTableComponent extends FixedHeaderTable<AddChartOption> {}

const NUM_ROWS_SHOWN = 15;

@observer
export default class AddChartByType extends React.Component<
    IAddChartByTypeProps,
    {}
> {
    public static defaultProps = {
        firstColumnHeaderName: 'Name',
        hideControls: false,
    };

    @computed
    get options() {
        if (this.props.freqPromise.isComplete) {
            const options = _.reduce(
                this.props.options,
                (acc, next) => {
                    const disabled =
                        this.props.freqPromise.result![next.key] === 0;
                    acc.push({
                        label: next.label,
                        key: next.key,
                        disabled: disabled,
                        selected: next.selected,
                        freq: disabled
                            ? 0
                            : this.props.freqPromise.result![next.key],
                    });
                    return acc;
                },
                [] as AddChartOption[]
            );
            if (this.props.optionsGivenInSortedOrder) {
                return options;
            } else {
                return options.sort((a: AddChartOption, b: AddChartOption) => {
                    return b.freq - a.freq || a.label.localeCompare(b.label);
                });
            }
        } else {
            const options = this.props.options.map(o =>
                Object.assign({ freq: 100 }, o)
            );
            if (this.props.optionsGivenInSortedOrder) {
                return options;
            } else {
                return options.sort((a, b) => a.label.localeCompare(b.label));
            }
        }
    }

    private _columns: Column<AddChartOption>[] = [
        {
            name: this.props.firstColumnHeaderName!,
            render: (option: AddChartOption) => {
                return (
                    <Observer>
                        {() => (
                            <div
                                className={classnames(
                                    styles.option,
                                    'add-chart-option'
                                )}
                                data-test={`add-chart-option-${option.label
                                    .toLowerCase()
                                    .replace(/\s/g, '-')}`}
                            >
                                <LabeledCheckbox
                                    checked={option.selected}
                                    disabled={option.disabled}
                                    labelProps={{
                                        className: classnames(
                                            styles.label,
                                            option.disabled
                                                ? styles.labelDisabled
                                                : ''
                                        ),
                                    }}
                                    inputProps={{
                                        className: styles.input,
                                    }}
                                    onChange={() => this.onOptionChange(option)}
                                >
                                    <EllipsisTextTooltip text={option.label} />
                                </LabeledCheckbox>
                            </div>
                        )}
                    </Observer>
                );
            },
            filter: (d: AddChartOption, f: string, filterStringUpper: string) =>
                d.label.toUpperCase().includes(filterStringUpper),
            sortBy: (d: AddChartOption) => d.label,
            width: 320,
            defaultSortDirection: 'asc' as 'asc',
        },
        {
            name: 'Freq',
            tooltip: (
                <span>
                    {ifNotDefined(
                        this.props.frequencyHeaderTooltip,
                        '% samples with data'
                    )}
                </span>
            ),
            render: (option: AddChartOption) => (
                <span
                    style={{ display: 'flex', flexDirection: 'row-reverse' }}
                    className={classnames(
                        option.disabled ? styles.labelDisabled : ''
                    )}
                >
                    {this.props.freqPromise.isComplete
                        ? getFrequencyStr(option.freq)
                        : ''}
                </span>
            ),
            sortBy: (d: AddChartOption) => d.freq,
            headerRender: () => {
                return (
                    <span
                        style={{
                            display: 'flex',
                            flexDirection: 'row-reverse',
                            flexGrow: 1,
                        }}
                    >
                        Freq
                    </span>
                );
            },
            defaultSortDirection: 'desc' as 'desc',
            width: 60,
        },
    ];

    @computed
    get tableHeight() {
        return this.options.length > NUM_ROWS_SHOWN
            ? NUM_ROWS_SHOWN * 25
            : (this.options.length + 1) * 25;
    }

    @autobind
    getCurrentSelectedRows(): AddChartOption[] {
        return this.options.filter(option => option.selected);
    }

    @autobind
    getCurrentSelectedRowKeys() {
        return this.getCurrentSelectedRows().map(option => option.key);
    }

    @autobind
    @action
    addAll(selectedOptions: AddChartOption[]) {
        this.props.onAddAll(
            _.filter(selectedOptions, option => !option.disabled).map(
                option => option.key
            )
        );
    }

    @autobind
    @action
    removeAll(selectedOptions: AddChartOption[]) {
        this.props.onClearAll(selectedOptions.map(option => option.key));
    }

    @autobind
    @action
    onOptionChange(option: AddChartOption) {
        this.props.onToggleOption(option.key);
    }

    render() {
        return (
            <div
                style={{ display: 'flex', flexDirection: 'column' }}
                data-test="add-by-type"
            >
                {this.props.freqPromise.isComplete && (
                    <AddChartTableComponent
                        width={380}
                        height={this.tableHeight}
                        columns={this._columns}
                        data={this.options}
                        showControlsAtTop={true}
                        addAll={this.addAll}
                        removeAll={this.removeAll}
                        showSelectableNumber={true}
                        showAddRemoveAllButton={true}
                        autoFocusSearchAfterRendering={true}
                        numberOfSelectedRows={
                            this.getCurrentSelectedRows().length
                        }
                        hideControls={this.props.hideControls}
                    />
                )}
                {this.props.freqPromise.isPending && (
                    <div
                        style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            height: 100,
                        }}
                    >
                        <LoadingIndicator isLoading={true} />
                        <br />
                        Calculating data availability...
                    </div>
                )}
            </div>
        );
    }
}
