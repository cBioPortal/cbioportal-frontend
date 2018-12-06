import * as React from 'react';
import {action, computed} from 'mobx';
import {observer} from "mobx-react";
import styles from "./styles.module.scss";
import addChartStyles from "../styles.module.scss";
import {Modal} from 'react-bootstrap';
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

export interface IAddChartByTypeProps {
    title: string;
    options: ChartOption[];
    freqPromise: MobxPromise<ClinicalDataCountSet>;
    onClose: () => void;
    onAddAll: (keys: string[]) => void;
    onClearAll: (keys: string[]) => void;
    onToggleOption: (key: string) => void;
}


class AddChartTableComponent extends FixedHeaderTable<ChartOption> {
}

const NUM_ROWS_SHOWN = 20;

@observer
export default class AddChartByType extends React.Component<IAddChartByTypeProps, {}> {
    @computed
    get options() {
        if (this.props.freqPromise.isComplete) {
            return _.reduce(this.props.options, (acc, next) => {
                const disabled = this.props.freqPromise.result![next.key] === 0;
                acc.push({
                    label: next.label,
                    key: next.key,
                    disabled: disabled,
                    selected: !disabled && next.selected,
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
                <div className={styles.option}>
                    <LabeledCheckbox
                        checked={option.selected}
                        disabled={option.disabled}
                        labelProps={{
                            className: classnames(styles.label, option.disabled ? styles.labelDisabled: '')
                        }}
                        inputProps={{
                            className: styles.input
                        }}
                        onChange={() => {
                            this.props.onToggleOption(option.key)
                        }}
                    >
                        {option.label}
                    </LabeledCheckbox>
                </div>
            )
        },
        filter: (d: ChartOption, f: string, filterStringUpper: string) => (d.label.toUpperCase().indexOf(filterStringUpper) > -1),
        sortBy: (d: ChartOption) => d.label,
        width: 400,
        defaultSortDirection: 'asc' as 'asc'
    }, {
        name: '% samples with data',
        render: (option: ChartOption) =>
            <span
                className={classnames(option.disabled ? styles.labelDisabled : '')}>{this.props.freqPromise.isComplete ? getFrequencyStr(option.freq) : ''}</span>,
        sortBy: (d: ChartOption) => d.freq,
        defaultSortDirection: 'desc' as 'desc',
        width: 160
    }];

    @computed
    get tableHeight() {
        return this.options.length > NUM_ROWS_SHOWN ? NUM_ROWS_SHOWN * 25 : this.options.length * 25;
    }

    @autobind
    @action
    addAll(selectedOptions: ChartOption[]) {
        this.props.onAddAll(_.uniq(_.filter(this.options, option=>option.selected).concat(_.filter(selectedOptions, option=>!option.disabled))).map(option => option.key));
    }

    @autobind
    @action
    removeAll(selectedOptions: ChartOption[]) {
        this.props.onClearAll(selectedOptions.map(option => option.key));
    }

    render() {
        return (
            <Modal
                onHide={this.props.onClose}
                show={true}
            >
                <Modal.Header closeButton>
                    <span className={addChartStyles.modalHeader}>{this.props.title}</span>
                </Modal.Header>
                <Modal.Body>
                    <AddChartTableComponent
                        width={560}
                        height={this.tableHeight}
                        columns={this._columns}
                        data={this.options}
                        addAll={this.addAll}
                        removeAll={this.removeAll}
                        sortBy={'% samples with data'}
                    />
                </Modal.Body>
                <Modal.Footer>
                    <div className={styles.footer}>
                        <div>
                            {
                                this.props.freqPromise.isPending && (
                                    <span>
                                        <LoadingIndicator isLoading={true}/>
                                        Calculating data availability...
                                    </span>
                                )
                            }
                        </div>
                    </div>
                </Modal.Footer>
            </Modal>
        )
    }
}