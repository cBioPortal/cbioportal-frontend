import * as React from 'react';
import {action, computed} from 'mobx';
import {observer} from "mobx-react";
import styles from "./styles.module.scss";
import {ChartOption} from "../AddChartButton";
import * as _ from 'lodash';
import LabeledCheckbox from "../../../../shared/components/labeledCheckbox/LabeledCheckbox";
import {Column} from "../../../../shared/components/lazyMobXTable/LazyMobXTable";
import {getFrequencyStr} from "../../StudyViewUtils";
import LoadingIndicator from "../../../../shared/components/loadingIndicator/LoadingIndicator";
import MobxPromise from 'mobxpromise';
import {ClinicalDataCountSet} from "../../StudyViewPageStore";
import FixedHeaderTable from "../../table/FixedHeaderTable";
import autobind from 'autobind-decorator';
import classnames from 'classnames';
import EllipsisTextTooltip from "../../../../shared/components/ellipsisTextTooltip/EllipsisTextTooltip";

export interface IAddChartByTypeProps {
    options: ChartOption[];
    freqPromise: MobxPromise<ClinicalDataCountSet>;
    onAddAll: (keys: string[]) => void;
    onClearAll: (keys: string[]) => void;
    onToggleOption: (key: string) => void;
}


class AddChartTableComponent extends FixedHeaderTable<ChartOption> {
}

const NUM_ROWS_SHOWN = 15;

@observer
export default class AddChartByType extends React.Component<IAddChartByTypeProps, {}> {

    constructor(props: IAddChartByTypeProps) {
        super(props);
    }

    @computed
    get options() {
        if (this.props.freqPromise.isComplete) {
            return _.reduce(this.props.options, (acc, next) => {
                const disabled = this.props.freqPromise.result![next.key] === 0;
                acc.push({
                    label: next.label,
                    key: next.key,
                    chartType: next.chartType,
                    disabled: disabled,
                    selected: next.selected,
                    freq: disabled ? 0 : this.props.freqPromise.result![next.key]
                });
                return acc;
            }, [] as ChartOption[]).sort((a: ChartOption, b: ChartOption) => {
                return b.freq - a.freq || a.label.localeCompare(b.label);
            });
        } else {
            return this.props.options.sort((a, b) => a.label.localeCompare(b.label));
        }
    }

    private _columns: Column<ChartOption>[] = [{
        name: 'Name',
        render: (option: ChartOption) => {
            return (
                <div className={classnames(styles.option, 'add-chart-option')}
                     data-test={`add-chart-option-${option.label.toLowerCase().replace(/\s/g,'-')}`}>
                    <LabeledCheckbox
                        checked={option.selected}
                        disabled={option.disabled}
                        labelProps={{
                            className: classnames(styles.label, option.disabled ? styles.labelDisabled : '')
                        }}
                        inputProps={{
                            className: styles.input
                        }}
                        onChange={() => this.onOptionChange(option)}
                    >
                        <EllipsisTextTooltip text={option.label}/>
                    </LabeledCheckbox>
                </div>
            )
        },
        filter: (d: ChartOption, f: string, filterStringUpper: string) => (d.label.toUpperCase().indexOf(filterStringUpper) > -1),
        sortBy: (d: ChartOption) => d.label,
        width: 320,
        defaultSortDirection: 'asc' as 'asc'
    }, {
        name: 'Freq',
        tooltip: <span>% samples with data</span>,
        render: (option: ChartOption) =>
            <span style={{display: 'flex', flexDirection: 'row-reverse'}}
                  className={classnames(option.disabled ? styles.labelDisabled : '')}>
                {this.props.freqPromise.isComplete ? getFrequencyStr(option.freq) : ''}
            </span>,
        sortBy: (d: ChartOption) => d.freq,
        headerRender: () => {
            return <span style={{display: 'flex', flexDirection: 'row-reverse', flexGrow: 1}}>Freq</span>
        },
        defaultSortDirection: 'desc' as 'desc',
        width: 60
    }];

    @computed
    get tableHeight() {
        return this.options.length > NUM_ROWS_SHOWN ? NUM_ROWS_SHOWN * 25 : (this.options.length + 1) * 25;
    }

    @autobind
    getCurrentSelectedRows() {
        return _.filter(this.options, option => option.selected);
    }

    @autobind
    getCurrentSelectedRowKeys() {
        return this.getCurrentSelectedRows().map(option => option.key);
    }

    @autobind
    @action
    addAll(selectedOptions: ChartOption[]) {
        this.props.onAddAll(_.filter(selectedOptions, option => !option.disabled).map(option => option.key));
    }

    @autobind
    @action
    removeAll(selectedOptions: ChartOption[]) {
        this.props.onClearAll(selectedOptions.map(option => option.key));
    }

    @autobind
    @action
    onOptionChange(option: ChartOption) {
        this.props.onToggleOption(option.key);
    }

    render() {
        return (
            <div style={{display: 'flex', flexDirection: 'column'}} data-test='add-by-type'>
                <AddChartTableComponent
                    width={380}
                    height={this.tableHeight}
                    columns={this._columns}
                    data={this.options}
                    showControlsAtTop={true}
                    addAll={this.addAll}
                    removeAll={this.removeAll}
                    showSelectableNumber={true}
                    showAddRemoveAllButtons={true}
                    autoFocusSearchAfterRendering={true}
                />
                {
                    this.props.freqPromise.isPending && (
                        <span>
                            <LoadingIndicator isLoading={true}/>
                            Calculating data availability...
                        </span>
                    )
                }
            </div>
        )
    }
}