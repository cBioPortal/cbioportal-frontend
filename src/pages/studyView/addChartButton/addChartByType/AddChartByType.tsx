import * as React from 'react';
import {action, computed, observable, IReactionDisposer, reaction} from 'mobx';
import {observer} from "mobx-react";
import styles from "./styles.module.scss";
import addChartStyles from "../styles.module.scss";
import {Modal} from 'react-bootstrap';
import {ChartOption, INFO_TIMEOUT} from "../AddChartButton";
import * as _ from 'lodash';
import LabeledCheckbox from "../../../../shared/components/labeledCheckbox/LabeledCheckbox";
import {Column} from "../../../../shared/components/lazyMobXTable/LazyMobXTable";
import {getClinicalAttributeOverlay, getFrequencyStr} from "../../StudyViewUtils";
import LoadingIndicator from "../../../../shared/components/loadingIndicator/LoadingIndicator";
import MobxPromise from 'mobxpromise';
import {ClinicalDataCountSet, StudyViewPageTabKeys} from "../../StudyViewPageStore";
import FixedHeaderTable from "../../table/FixedHeaderTable";
import autobind from 'autobind-decorator';
import classnames from 'classnames';
import EllipsisTextTooltip from "../../../../shared/components/ellipsisTextTooltip/EllipsisTextTooltip";
import InfoBanner from "../../infoBanner/InfoBanner";
import {ChartTypeNameEnum} from "../../StudyViewConfig";

export interface IAddChartByTypeProps {
    options: ChartOption[];
    currentTab: string,
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
    @observable infoMessage: string = "";
    private reactions: IReactionDisposer[] = [];
    private infoMessageTimeout: NodeJS.Timer;

    constructor(props: IAddChartByTypeProps) {
        super(props);
        this.reactions.push(reaction(() => this.infoMessage, () => {
            if (this.infoMessage) {
                clearTimeout(this.infoMessageTimeout);
                this.infoMessageTimeout = setTimeout(() => this.infoMessage = "", INFO_TIMEOUT);
            }
        }));
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
                        onChange={()=>this.onOptionChange(option)}
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
    getCurrentSelectedRowKeys(){
        return this.getCurrentSelectedRows().map(option => option.key);
    }

    @autobind
    @action
    addAll(selectedOptions: ChartOption[]) {
        const alreadySelected = this.getCurrentSelectedRows();
        const allSelected = _.filter(selectedOptions, option => !option.disabled);
        const numOfNewCharts = allSelected.length - alreadySelected.length;
        this.props.onAddAll(_.uniq(alreadySelected.concat(allSelected).map(option => option.key)));

        const addInSummaryInfoMessage= `${numOfNewCharts} chart${numOfNewCharts > 1 ? 's' : ''} added`;

        if (this.props.currentTab === StudyViewPageTabKeys.CLINICAL_DATA) {
            this.infoMessage = `${numOfNewCharts} column${numOfNewCharts > 1 ? 's' : ''} added to table and ${addInSummaryInfoMessage} in Summary tab`;
        } else if (this.props.currentTab === ''|| this.props.currentTab === StudyViewPageTabKeys.SUMMARY) {
            this.infoMessage = addInSummaryInfoMessage;
        } else {
            this.infoMessage = `Added`;
        }
    }

    @autobind
    @action
    removeAll(selectedOptions: ChartOption[]) {
        const alreadySelected = this.getCurrentSelectedRowKeys();
        const allSelected = selectedOptions.map(option => option.key);
        const numOfChartsRemoved = _.intersection(alreadySelected, allSelected).length;
        this.props.onClearAll(selectedOptions.map(option => option.key));

        const removeInSummaryInfoMessage= `${numOfChartsRemoved} chart${numOfChartsRemoved > 1 ? 's' : ''} removed`;

        if (this.props.currentTab === StudyViewPageTabKeys.CLINICAL_DATA) {
            this.infoMessage = `${numOfChartsRemoved} column${numOfChartsRemoved > 1 ? 's' : ''} removed from table and ${removeInSummaryInfoMessage} from Summary tab`;
        } else if (this.props.currentTab === ''|| this.props.currentTab === StudyViewPageTabKeys.SUMMARY) {
            this.infoMessage = removeInSummaryInfoMessage;
        } else {
            this.infoMessage = `Removed`;
        }
    }

    @autobind
    @action
    onOptionChange(option: ChartOption) {
        const selectedKeys = this.getCurrentSelectedRowKeys();
        this.props.onToggleOption(option.key)

        if (selectedKeys.includes(option.key)) {
            let additionType = '';
            if (this.props.currentTab === StudyViewPageTabKeys.SUMMARY) {
                additionType = ` ${ChartTypeNameEnum[option.chartType]}`;
            } else if (this.props.currentTab === StudyViewPageTabKeys.CLINICAL_DATA) {
                additionType = ' column';
            }
            this.infoMessage = `${option.label}${additionType} was removed`;
        } else {
            let additionType = '';
            if (this.props.currentTab === StudyViewPageTabKeys.SUMMARY) {
                additionType = ` as a ${ChartTypeNameEnum[option.chartType]}`;
            } else if (this.props.currentTab === StudyViewPageTabKeys.CLINICAL_DATA) {
                additionType = ` to table and as ${ChartTypeNameEnum[option.chartType]} in Summary tab`;
            }
            this.infoMessage = `${option.label} added${additionType}`;
        }
    }

    componentWillUnmount(): void {
        this.reactions.forEach(reaction => reaction());
    }

    render() {
        return (
            <div style={{display: 'flex', flexDirection: 'column'}}>
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
                {this.infoMessage &&
                <InfoBanner message={this.infoMessage} />
                }
            </div>
        )
    }
}