import * as React from 'react';
import {action, computed, observable} from "mobx";
import {observer} from "mobx-react";
import styles from "./styles.module.scss";
import {ChildButton, MainButton, Menu} from 'react-mfb';
import 'react-mfb/mfb.css';
import {
    ChartMetaDataTypeEnum,
    ClinicalDataCountSet,
    NewChart,
    StudyViewPageStore,
    StudyViewPageTabDescriptions, StudyViewPageTabKeys
} from "../StudyViewPageStore";
import autobind from 'autobind-decorator';
import classnames from "classnames";
import * as _ from 'lodash';
import AddChartByType from "./addChartByType/AddChartByType";
import {remoteData} from "../../../shared/api/remoteData";
import CustomCaseSelection from "./customCaseSelection/CustomCaseSelection";
import {calculateClinicalDataCountFrequency, getOptionsByChartMetaDataType} from "../StudyViewUtils";
import $ from 'jquery';
import {MSKTab, MSKTabs} from "../../../shared/components/MSKTabs/MSKTabs";
import {StudySummaryTab} from "../tabs/SummaryTab";
import {ClinicalDataTab} from "../tabs/ClinicalDataTab";
import IFrameLoader from "../../../shared/components/iframeLoader/IFrameLoader";
import shareUIstyles from "../../resultsView/querySummary/shareUI.module.scss";
import DefaultTooltip from "../../../shared/components/defaultTooltip/DefaultTooltip";

export interface IAddChartButtonProps {
    store: StudyViewPageStore,
    disableAddGenomicButton?: boolean
}

enum CurrentOpenedDialogEnum {
    CUSTOM_GROUPS = 'CUSTOM_GROUPS',
    ADD_CLINICAL = 'ADD_CLINICAL',
    ADD_GENOMIC = 'ADD_GENOMIC',
    CLOSED = 'CLOSED'
}

type CurrentOpenedDialog =
    CurrentOpenedDialogEnum.CUSTOM_GROUPS
    | CurrentOpenedDialogEnum.CLOSED
    | CurrentOpenedDialogEnum.ADD_GENOMIC
    | CurrentOpenedDialogEnum.ADD_CLINICAL;

export type ChartOption = {
    label: string,
    key: string,
    disabled?: boolean,
    selected?: boolean,
    freq: number
}

@observer
export default class AddChartButton extends React.Component<IAddChartButtonProps, {}> {
    private addCustomGroupsChartTitle = 'Add custom groups as Pie Chart';

    public static defaultProps = {
        disableAddGenomicButton: false
    };

    @computed
    get addGenomicDataChartTitle() {
        return `Select genomic data (${_.filter(this.genomicDataOptions, chartOption => !chartOption.selected).length} more to add)`
    }

    @computed
    get addClinicalDataChartTitle() {
        return `Select clinical data (${_.filter(this.clinicalDataOptions, chartOption => !chartOption.selected).length} more to add)`
    }

    @observable currentOpenedDialog: CurrentOpenedDialog = CurrentOpenedDialogEnum.CLOSED;

    readonly getClinicalDataCount = remoteData<ClinicalDataCountSet>({
        await: () => [this.props.store.clinicalDataWithCount, this.props.store.selectedSamples],
        invoke: async () => {
            return calculateClinicalDataCountFrequency(this.props.store.clinicalDataWithCount.result, this.props.store.selectedSamples.result.length);
        },
        default: {}
    });


    readonly getGenomicDataCount = remoteData<ClinicalDataCountSet>({
        await: () => [this.props.store.genomicDataWithCount, this.props.store.selectedSamples],
        invoke: async () => {
            return calculateClinicalDataCountFrequency(this.props.store.genomicDataWithCount.result, this.props.store.selectedSamples.result.length);
        },
        default: {}
    });

    @autobind
    @action
    updateCurrentOpenedDialog(dialog: CurrentOpenedDialog) {
        this.currentOpenedDialog = dialog;
    }

    @computed
    get genomicDataOptions(): ChartOption[] {
        return getOptionsByChartMetaDataType(ChartMetaDataTypeEnum.GENOMIC, this.props.store.chartMetaSet, this.selectedAttrs);
    }

    @computed
    get clinicalDataOptions(): ChartOption[] {
        return getOptionsByChartMetaDataType(ChartMetaDataTypeEnum.CLINICAL, this.props.store.chartMetaSet, this.selectedAttrs);
    }

    @computed
    get selectedAttrs(): string[] {
        return this.props.store.visibleAttributes.map(attr => attr.uniqueKey);
    }

    @autobind
    @action
    private onChangeSelectedCharts(options: ChartOption[]) {
        this.props.store.addCharts(options.map(option => option.key));
    }

    @autobind
    private onAddAll(keys: string[]) {
        this.props.store.addCharts(this.selectedAttrs.concat(keys));
    }

    @autobind
    private onClearAll(keys: string[]) {
        this.props.store.updateChartsVisibility(_.reduce(this.selectedAttrs, (acc, attr) => {
            if (!keys.includes(attr)) {
                acc.push(attr);
            }
            return acc;
        }, [] as string[]));
    }

    @autobind
    private onToggleOption(key: string) {
        if (this.selectedAttrs.includes(key)) {
            this.props.store.addCharts(_.reduce(this.selectedAttrs, (acc, next) => {
                if (next !== key) {
                    acc.push(next);
                }
                return acc;
            }, [] as string[]));
        } else {
            this.props.store.addCharts(this.selectedAttrs.concat([key]));
        }
    }


    componentDidMount() {

        // Register main button onClick event
        // The implementation of the library forbids the onClick event binding.
        $('.mfb-component__button--main').click((event: any) => {
            event.preventDefault();
            this.updateCurrentOpenedDialog(CurrentOpenedDialogEnum.ADD_CLINICAL);
        })
    }

    getChildButtons() {
        let buttons = [];
        if (!this.props.disableAddGenomicButton)
            buttons.push(<ChildButton
                className={styles.child}
                icon={classnames("fa fa-lg", styles.faCharG)}
                label={this.addGenomicDataChartTitle}
                onClick={() => this.updateCurrentOpenedDialog(CurrentOpenedDialogEnum.ADD_GENOMIC)}
            >
            </ChildButton>);
        buttons.push(
            <ChildButton
                className={styles.child}
                icon="fa fa-pie-chart fa-lg"
                label={this.addCustomGroupsChartTitle}
                onClick={() => this.updateCurrentOpenedDialog(CurrentOpenedDialogEnum.CUSTOM_GROUPS)}
            >
            </ChildButton>);
        return buttons;
    }

    @autobind
    private overlay() {
        return <div style={{marginTop: '10px'}}>
            <MSKTabs id="addchart" activeTabId={'clinical'}
                     className="mainTabs">

                <MSKTab key={0} id={'clinical'} linkText={this.addClinicalDataChartTitle}>
                    <AddChartByType title={this.addClinicalDataChartTitle}
                                    options={this.clinicalDataOptions}
                                    freqPromise={this.getClinicalDataCount}
                                    onClose={() => this.updateCurrentOpenedDialog(CurrentOpenedDialogEnum.CLOSED)}
                                    onAddAll={this.onAddAll}
                                    onClearAll={this.onClearAll}
                                    onToggleOption={this.onToggleOption}
                    />
                </MSKTab>
                <MSKTab key={1} id={'genomic'} linkText={this.addGenomicDataChartTitle}>
                    <AddChartByType title={this.addGenomicDataChartTitle}
                                    options={this.genomicDataOptions}
                                    freqPromise={this.getGenomicDataCount}
                                    onClose={() => this.updateCurrentOpenedDialog(CurrentOpenedDialogEnum.CLOSED)}
                                    onAddAll={this.onAddAll}
                                    onClearAll={this.onClearAll}
                                    onToggleOption={this.onToggleOption}/>
                </MSKTab>
                <MSKTab key={2} id={'custom'} linkText={this.addCustomGroupsChartTitle}>
                    <CustomCaseSelection
                        title={this.addCustomGroupsChartTitle}
                        show={true}
                        selectedSamples={this.props.store.selectedSamples.result}
                        queriedStudies={this.props.store.queriedPhysicalStudyIds.result}
                        onClose={() => this.updateCurrentOpenedDialog(CurrentOpenedDialogEnum.CLOSED)}
                        onSubmit={(chart: NewChart) => {
                            this.props.store.addCustomChart(chart);
                            this.updateCurrentOpenedDialog(CurrentOpenedDialogEnum.CLOSED)
                        }}
                    />
                </MSKTab>
            </MSKTabs>
        </div>
    }

    render() {
        return (<DefaultTooltip
                trigger={["click"]}
                placement={"bottom"}
                overlay={this.overlay}
            >
                <div className={shareUIstyles.shareModule}>

                    <a>
                                <span className="fa-stack fa-4x">
                                    <i className="fa fa-circle fa-stack-2x"></i>
                                    <i className="fa fa-plus fa-stack-1x"></i>
                                </span>
                    </a>
                </div>
            </DefaultTooltip>
        )
    }
}