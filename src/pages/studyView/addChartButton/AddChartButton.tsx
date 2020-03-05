import * as React from 'react';
import { action, computed, observable } from 'mobx';
import { observer } from 'mobx-react';
import { ChildButton, MainButton, Menu } from 'react-mfb';
import 'react-mfb/mfb.css';
import {
    CustomChart,
    StudyViewPageStore,
    StudyViewPageTabKey,
} from '../StudyViewPageStore';
import { StudyViewPageTabKeyEnum } from 'pages/studyView/StudyViewPageTabs';
import autobind from 'autobind-decorator';
import * as _ from 'lodash';
import AddChartByType from './addChartByType/AddChartByType';
import { DefaultTooltip, remoteData } from 'cbioportal-frontend-commons';
import CustomCaseSelection from './customCaseSelection/CustomCaseSelection';
import {
    calculateClinicalDataCountFrequency,
    ChartMetaDataTypeEnum,
    ChartType,
    ClinicalDataCountSet,
    getOptionsByChartMetaDataType,
} from '../StudyViewUtils';
import { MSKTab, MSKTabs } from '../../../shared/components/MSKTabs/MSKTabs';
import { ChartTypeEnum, ChartTypeNameEnum } from '../StudyViewConfig';
import SuccessBanner from '../infoBanner/SuccessBanner';
import {
    GAEvent,
    serializeEvent,
    trackEvent,
} from '../../../shared/lib/tracking';
import classNames from 'classnames';

export interface IAddChartTabsProps {
    store: StudyViewPageStore;
    currentTab: StudyViewPageTabKey;
    initialActiveTab?: TabKeys;
    disableGenomicTab?: boolean;
    disableClinicalTab?: boolean;
    disableCustomTab?: boolean;
    onInfoMessageChange?: (newMessage: string) => void;
    showResetPopup: () => void;
}

export interface IAddChartButtonProps extends IAddChartTabsProps {
    buttonText: string;
    addChartOverlayClassName?: string;
}

export enum TabKeysEnum {
    CUSTOM_DATA = 'Custom_Data',
    CLINICAL = 'Clinical',
    GENOMIC = 'Genomic',
}

export enum TabNamesEnum {
    CUSTOM_DATA = 'Custom Data',
    CLINICAL = 'Clinical',
    GENOMIC = 'Genomic',
}

export type TabKeys =
    | TabKeysEnum.CUSTOM_DATA
    | TabKeysEnum.GENOMIC
    | TabKeysEnum.CLINICAL
    | '';

export type ChartOption = {
    label: string;
    key: string;
    chartType: ChartType;
    disabled?: boolean;
    selected?: boolean;
    freq: number;
};

export const INFO_TIMEOUT = 5000;

@observer
class AddChartTabs extends React.Component<IAddChartTabsProps, {}> {
    @observable activeId: TabKeys;
    @observable infoMessage: string = '';
    public static defaultProps = {
        disableGenomicTab: false,
        disableClinicalTab: false,
        disableCustomTab: false,
    };

    constructor(props: IAddChartTabsProps, context: any) {
        super(props, context);

        this.activeId =
            props.initialActiveTab ||
            (props.disableClinicalTab ? '' : TabKeysEnum.CLINICAL) ||
            (props.disableGenomicTab ? '' : TabKeysEnum.GENOMIC) ||
            (props.disableCustomTab ? '' : TabKeysEnum.CUSTOM_DATA);
    }

    readonly getClinicalDataCount = remoteData<ClinicalDataCountSet>({
        await: () => [
            this.props.store.clinicalDataWithCount,
            this.props.store.selectedSamples,
        ],
        invoke: async () => {
            return calculateClinicalDataCountFrequency(
                this.props.store.clinicalDataWithCount.result,
                this.props.store.selectedSamples.result.length
            );
        },
        default: {},
    });

    readonly getGenomicDataCount = remoteData<ClinicalDataCountSet>({
        await: () => [
            this.props.store.genomicDataWithCount,
            this.props.store.selectedSamples,
        ],
        invoke: async () => {
            return calculateClinicalDataCountFrequency(
                this.props.store.genomicDataWithCount.result,
                this.props.store.selectedSamples.result.length
            );
        },
        default: {},
    });

    @autobind
    @action
    updateActiveId(newId: string) {
        this.activeId = newId as TabKeys;
        this.resetInfoMessage();
    }

    @autobind
    @action
    onInfoMessageChange(newMessage: string) {
        this.infoMessage = newMessage;
        if (this.props.onInfoMessageChange) {
            this.props.onInfoMessageChange(newMessage);
        }
        setTimeout(this.resetInfoMessage, INFO_TIMEOUT);
    }

    @autobind
    @action
    resetInfoMessage() {
        this.infoMessage = '';
    }

    @computed
    get genomicDataOptions(): ChartOption[] {
        const genomicDataOptions = getOptionsByChartMetaDataType(
            ChartMetaDataTypeEnum.GENOMIC,
            this.props.store.chartMetaSet,
            this.selectedAttrs,
            this.props.store.chartsType.toJS()
        );
        if (this.props.currentTab === StudyViewPageTabKeyEnum.CLINICAL_DATA) {
            return genomicDataOptions.filter(
                option =>
                    option.chartType === ChartTypeEnum.BAR_CHART ||
                    option.chartType === ChartTypeEnum.PIE_CHART
            );
        } else {
            return genomicDataOptions;
        }
    }

    @computed
    get clinicalDataOptions(): ChartOption[] {
        return getOptionsByChartMetaDataType(
            ChartMetaDataTypeEnum.CLINICAL,
            this.props.store.chartMetaSet,
            this.selectedAttrs,
            this.props.store.chartsType.toJS()
        );
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
    @action
    private onAddAll(keys: string[]) {
        this.props.store.addCharts(this.selectedAttrs.concat(keys));

        const addInSummaryInfoMessage = `${keys.length} chart${
            keys.length > 1 ? 's' : ''
        } added`;
        if (this.props.currentTab === StudyViewPageTabKeyEnum.CLINICAL_DATA) {
            this.infoMessage = `${keys.length} column${
                keys.length > 1 ? 's' : ''
            } added to table and ${addInSummaryInfoMessage} in Summary tab`;
        } else if (this.props.currentTab === StudyViewPageTabKeyEnum.SUMMARY) {
            this.infoMessage = addInSummaryInfoMessage;
        } else {
            this.infoMessage = `Added`;
        }
    }

    @autobind
    private onClearAll(keys: string[]) {
        this.props.store.updateChartsVisibility(
            _.reduce(
                this.selectedAttrs,
                (acc, attr) => {
                    if (!keys.includes(attr)) {
                        acc.push(attr);
                    }
                    return acc;
                },
                [] as string[]
            )
        );

        const removeInSummaryInfoMessage = `${keys.length} chart${
            keys.length > 1 ? 's' : ''
        } removed`;

        if (this.props.currentTab === StudyViewPageTabKeyEnum.CLINICAL_DATA) {
            this.infoMessage = `${keys.length} column${
                keys.length > 1 ? 's' : ''
            } removed from table and ${removeInSummaryInfoMessage} from Summary tab`;
        } else if (this.props.currentTab === StudyViewPageTabKeyEnum.SUMMARY) {
            this.infoMessage = removeInSummaryInfoMessage;
        } else {
            this.infoMessage = `Removed`;
        }
    }

    @autobind
    @action
    private onToggleOption(key: string) {
        const option = _.find(
            this.clinicalDataOptions.concat(this.genomicDataOptions),
            option => option.key === key
        );
        if (option !== undefined) {
            if (this.selectedAttrs.includes(key)) {
                this.props.store.resetFilterAndChangeChartVisibility(
                    key,
                    false
                );
                let additionType = '';
                if (this.props.currentTab === StudyViewPageTabKeyEnum.SUMMARY) {
                    additionType = ` ${ChartTypeNameEnum[option.chartType]}`;
                } else if (
                    this.props.currentTab ===
                    StudyViewPageTabKeyEnum.CLINICAL_DATA
                ) {
                    additionType = ' column';
                }

                trackEvent({
                    category: 'studyPage',
                    action: 'removeChart',
                    label: key,
                });

                this.infoMessage = `${option.label}${additionType} was removed`;
            } else {
                this.props.store.addCharts(this.selectedAttrs.concat([key]));

                let additionType = '';
                if (this.props.currentTab === StudyViewPageTabKeyEnum.SUMMARY) {
                    additionType = ` as a ${
                        ChartTypeNameEnum[option.chartType]
                    }`;
                } else if (
                    this.props.currentTab ===
                    StudyViewPageTabKeyEnum.CLINICAL_DATA
                ) {
                    additionType = ` to table and as ${
                        ChartTypeNameEnum[option.chartType]
                    } in Summary tab`;
                }
                this.infoMessage = `${option.label} added${additionType}`;

                trackEvent({
                    category: 'studyPage',
                    action: 'addChart',
                    label: key,
                });
            }
        }
    }

    render() {
        return (
            <div
                style={{
                    width: '400px',
                    display: 'flex',
                    flexDirection: 'column',
                }}
            >
                <MSKTabs
                    activeTabId={this.activeId}
                    onTabClick={this.updateActiveId}
                    className="addChartTabs mainTabs"
                >
                    <MSKTab
                        key={0}
                        id={TabKeysEnum.CLINICAL}
                        linkText={TabNamesEnum.CLINICAL}
                        hide={this.props.disableClinicalTab}
                    >
                        <AddChartByType
                            options={this.clinicalDataOptions}
                            freqPromise={this.getClinicalDataCount}
                            onAddAll={this.onAddAll}
                            onClearAll={this.onClearAll}
                            onToggleOption={this.onToggleOption}
                        />
                    </MSKTab>
                    <MSKTab
                        key={1}
                        id={TabKeysEnum.GENOMIC}
                        linkText={TabNamesEnum.GENOMIC}
                        hide={this.props.disableGenomicTab}
                    >
                        <AddChartByType
                            options={this.genomicDataOptions}
                            freqPromise={this.getGenomicDataCount}
                            onAddAll={this.onAddAll}
                            onClearAll={this.onClearAll}
                            onToggleOption={this.onToggleOption}
                        />
                    </MSKTab>
                    <MSKTab
                        key={2}
                        id={TabKeysEnum.CUSTOM_DATA}
                        linkText={TabNamesEnum.CUSTOM_DATA}
                        hide={this.props.disableCustomTab}
                    >
                        <CustomCaseSelection
                            allSamples={this.props.store.samples.result}
                            selectedSamples={
                                this.props.store.selectedSamples.result
                            }
                            submitButtonText={'Add Chart'}
                            queriedStudies={
                                this.props.store.queriedPhysicalStudyIds.result
                            }
                            isChartNameValid={this.props.store.isChartNameValid}
                            getDefaultChartName={
                                this.props.store.getDefaultCustomChartName
                            }
                            onSubmit={(chart: CustomChart) => {
                                this.infoMessage = `${chart.name} has been added.`;
                                this.props.store.addCustomChart(chart);
                            }}
                        />
                    </MSKTab>
                </MSKTabs>
                {this.props.store.isLoggedIn &&
                    this.props.currentTab === StudyViewPageTabKeyEnum.SUMMARY &&
                    this.props.store.showResetToDefaultButton && (
                        <button
                            style={{
                                position: 'absolute',
                                top: '14px',
                                right: '18px',
                                zIndex: 2,
                            }}
                            className="btn btn-primary btn-xs"
                            onClick={this.props.showResetPopup}
                        >
                            Reset charts
                        </button>
                    )}
                {this.infoMessage && (
                    <SuccessBanner message={this.infoMessage} />
                )}
            </div>
        );
    }
}

@observer
export default class AddChartButton extends React.Component<
    IAddChartButtonProps,
    {}
> {
    @observable showTooltip = false;
    render() {
        return (
            <DefaultTooltip
                visible={this.showTooltip}
                onVisibleChange={visible => (this.showTooltip = !!visible)}
                trigger={['click']}
                placement={'bottomRight'}
                destroyTooltipOnHide={true}
                overlay={() => (
                    <AddChartTabs
                        store={this.props.store}
                        initialActiveTab={this.props.initialActiveTab}
                        currentTab={this.props.currentTab}
                        disableClinicalTab={this.props.disableClinicalTab}
                        disableGenomicTab={this.props.disableGenomicTab}
                        disableCustomTab={this.props.disableCustomTab}
                        showResetPopup={this.props.showResetPopup}
                    />
                )}
                overlayClassName={this.props.addChartOverlayClassName}
            >
                <button
                    className={classNames('btn btn-primary btn-sm', {
                        active: this.showTooltip,
                    })}
                    style={{ marginLeft: '10px' }}
                    aria-pressed={this.showTooltip}
                    data-event={serializeEvent({
                        category: 'studyPage',
                        action: 'addChartMenuOpen',
                        label: this.props.store.studyIds.join(','),
                    })}
                    data-test="add-charts-button"
                >
                    {this.props.buttonText}
                </button>
            </DefaultTooltip>
        );
    }
}
