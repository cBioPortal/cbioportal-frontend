import * as React from 'react';
import {computed} from 'mobx';
import {observer} from "mobx-react";
import styles from "./styles.module.scss";
import addChartStyles from "../styles.module.scss";
import {Button, ButtonGroup, Modal} from 'react-bootstrap';
import {ChartOption} from "../AddChartButton";
import * as _ from 'lodash';
import LabeledCheckbox from "../../../../shared/components/labeledCheckbox/LabeledCheckbox";
import LazyMobXTable, {Column} from "../../../../shared/components/lazyMobXTable/LazyMobXTable";
import {getFrequencyStr} from "../../StudyViewUtils";
import LoadingIndicator from "../../../../shared/components/loadingIndicator/LoadingIndicator";
import MobxPromise from 'mobxpromise';
import {ClinicalDataCountSet} from "../../StudyViewPageStore";

export interface IAddChartByTypeProps {
    title: string;
    options: ChartOption[];
    freqPromise: MobxPromise<ClinicalDataCountSet>;
    onClose: () => void;
    onAddAll: (keys: string[]) => void;
    onClear: () => void;
    onToggleOption: (key: string) => void;
}


export class AddChartTableComponent extends LazyMobXTable<ChartOption> {
}

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
                    selected: next.selected,
                    freq: disabled ? 0 : this.props.freqPromise.result![next.key]
                });
                return acc;
            }, [] as ChartOption[]);
        } else {
            return this.props.options;
        }
    }

    @computed
    get hideFreq() {
        return _.keys(this.props.freqPromise.result!).length === 0;
    }

    @computed
    get columns(): Column<ChartOption>[] {
        const columns = [{
            name: 'Name',
            render: (option: ChartOption) => {
                return (
                    <div className={styles.option}>
                        <LabeledCheckbox
                            checked={option.selected}
                            disabled={option.disabled}
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
            defaultSortDirection: 'asc' as 'asc'
        }, {
            name: 'Freq',
            render: (option: ChartOption) =>
                <span>{getFrequencyStr(option.freq)}</span>,
            sortBy: (d: ChartOption) => d.freq,//sort freq column using count
            defaultSortDirection: 'desc' as 'desc',
            visible: !this.hideFreq
        }];
        return columns;
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
                    <div className={styles.main}>
                        <div className={styles.options}>
                            <AddChartTableComponent
                                columns={this.columns}
                                data={this.options}
                                initialSortColumn={this.hideFreq ? 'Name' : 'Freq'}
                                initialSortDirection={this.hideFreq ? 'asc' : 'desc'}
                                showColumnVisibility={false}
                                showCopyDownload={false}
                                initialItemsPerPage={10}
                            />
                        </div>
                    </div>
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
                        <ButtonGroup>
                            <Button onClick={() => {
                                this.props.onAddAll(
                                    _.uniq(
                                        this.options.concat(
                                            _.filter(this.props.options, option => option.selected)
                                        ).map(option => option.key)));
                            }}>Add All Charts</Button>
                            <Button onClick={this.props.onClear}>Remove All Charts</Button>
                        </ButtonGroup>
                    </div>
                </Modal.Footer>
            </Modal>
        )
    }
}