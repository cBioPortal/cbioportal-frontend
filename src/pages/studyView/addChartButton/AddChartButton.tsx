import * as React from 'react';
import {action, computed, observable} from "mobx";
import {observer} from "mobx-react";
import styles from "./styles.module.scss";
import {ChildButton, MainButton, Menu} from 'react-mfb';
import 'react-mfb/mfb.css';
import {
    ChartMetaDataTypeEnum, ChartType,
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
import {ChartTypeEnum} from "../StudyViewConfig";

export interface IAddChartTabsProps {
    store: StudyViewPageStore,
    currentTab: string,
    disableAddGenomicButton?: boolean
}

export interface IAddChartButtonProps extends IAddChartTabsProps {
    addChartOverlayClassName?: string
}


enum TabKeysEnum {
    CUSTOM_GROUPS = 'Custom Groups',
    CLINICAL = 'Clinical',
    GENOMIC = 'Genomic'
}

type TabKeys =
    TabKeysEnum.CUSTOM_GROUPS
    | TabKeysEnum.GENOMIC
    | TabKeysEnum.CLINICAL;

export type ChartOption = {
    label: string,
    key: string,
    chartType: ChartType,
    disabled?: boolean,
    selected?: boolean,
    freq: number
}

export const INFO_TIMEOUT = 5000;
@observer
class AddChartTabs extends React.Component<IAddChartTabsProps, {}> {
    @observable activeId: TabKeys = TabKeysEnum.CLINICAL;

    public static defaultProps = {
        disableAddGenomicButton: false
    };


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
    updateActiveId(newId: string) {
        this.activeId = newId as TabKeys;
    }

    @computed
    get genomicDataOptions(): ChartOption[] {
        const genomicDataOptions = getOptionsByChartMetaDataType(ChartMetaDataTypeEnum.GENOMIC, this.props.store.chartMetaSet, this.selectedAttrs);
        if (this.props.currentTab === StudyViewPageTabKeys.CLINICAL_DATA) {
            return genomicDataOptions.filter(option => option.chartType === ChartTypeEnum.BAR_CHART || option.chartType === ChartTypeEnum.PIE_CHART);
        } else {
            return genomicDataOptions;
        }
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

    render() {
        return <div style={{width: '400px'}}>
            <MSKTabs activeTabId={this.activeId}
                     onTabClick={this.updateActiveId}
                     className="addChartTabs mainTabs">

                <MSKTab key={0} id={TabKeysEnum.CLINICAL} linkText={TabKeysEnum.CLINICAL}>
                    <AddChartByType options={this.clinicalDataOptions}
                                    currentTab={this.props.currentTab}
                                    freqPromise={this.getClinicalDataCount}
                                    onAddAll={this.onAddAll}
                                    onClearAll={this.onClearAll}
                                    onToggleOption={this.onToggleOption}
                    />
                </MSKTab>
                <MSKTab key={1} id={TabKeysEnum.GENOMIC} linkText={TabKeysEnum.GENOMIC}>
                    <AddChartByType options={this.genomicDataOptions}
                                    currentTab={this.props.currentTab}
                                    freqPromise={this.getGenomicDataCount}
                                    onAddAll={this.onAddAll}
                                    onClearAll={this.onClearAll}
                                    onToggleOption={this.onToggleOption}/>
                </MSKTab>
                <MSKTab key={2} id={TabKeysEnum.CUSTOM_GROUPS} linkText={TabKeysEnum.CUSTOM_GROUPS}
                        hide={this.props.currentTab !== '' && this.props.currentTab !== StudyViewPageTabKeys.SUMMARY}>
                    <CustomCaseSelection
                        allSamples={this.props.store.samples.result}
                        queriedStudies={this.props.store.queriedPhysicalStudyIds.result}
                        isChartNameValid={this.props.store.isChartNameValid}
                        getDefaultChartName={this.props.store.getDefaultCustomChartName}
                        onSubmit={(chart: NewChart) => {
                            this.props.store.addCustomChart(chart);
                        }}
                    />
                </MSKTab>
            </MSKTabs>
        </div>
    }
}

@observer
export default class AddChartButton extends React.Component<IAddChartButtonProps, {}> {
    @computed
    get buttonText() {
        if (!this.props.currentTab || this.props.currentTab === StudyViewPageTabKeys.SUMMARY) {
            return '+ Add Chart';
        } else if (this.props.currentTab === StudyViewPageTabKeys.CLINICAL_DATA) {
            return '+ Add Column'
        } else {
            return '';
        }
    }

    render() {
        return (
            <DefaultTooltip
                trigger={["click"]}
                placement={"bottomRight"}
                destroyTooltipOnHide={true}
                overlay={() => <AddChartTabs store={this.props.store}
                                             currentTab={this.props.currentTab}
                                             disableAddGenomicButton={this.props.disableAddGenomicButton}/>}
                overlayClassName={this.props.addChartOverlayClassName}
            >
                <button className='btn btn-primary btn-xs' style={{marginLeft: '10px'}}>{this.buttonText}</button>
            </DefaultTooltip>
        )
    }
}