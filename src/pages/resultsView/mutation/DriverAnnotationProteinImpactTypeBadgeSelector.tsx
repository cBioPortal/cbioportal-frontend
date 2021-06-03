import {
    ProteinImpactTypeBadgeSelector,
    ProteinImpactTypeBadgeSelectorProps,
    DEFAULT_PROTEIN_IMPACT_TYPE_COLORS,
    BadgeSelector,
    getProteinImpactTypeOptionLabel,
    getProteinImpactTypeBadgeLabel,
} from 'react-mutation-mapper';
import * as React from 'react';
import {
    getProteinImpactTypeColorMap,
    getProteinImpactTypeOptionDisplayValueMap,
    SELECTOR_VALUE_WITH_VUS,
} from 'shared/lib/MutationUtils';
import {
    DefaultTooltip,
    DriverVsVusType,
    Option,
    ProteinImpactType,
} from 'cbioportal-frontend-commons';
import _ from 'lodash';
import { observer } from 'mobx-react';
import { action, makeObservable, observable } from 'mobx';
import './mutations.scss';
import styles from './badgeSelector.module.scss';

const PUTATIVE_DRIVER_TYPE = [
    ProteinImpactType.MISSENSE_PUTATIVE_DRIVER,
    ProteinImpactType.TRUNCATING_PUTATIVE_DRIVER,
    ProteinImpactType.INFRAME_PUTATIVE_DRIVER,
    ProteinImpactType.SPLICE_PUTATIVE_DRIVER,
    ProteinImpactType.FUSION_PUTATIVE_DRIVER,
];

const UNKNOWN_SIGNIFICANCE_TYPE = [
    ProteinImpactType.MISSENSE_UNKNOWN_SIGNIFICANCE,
    ProteinImpactType.TRUNCATING_UNKNOWN_SIGNIFICANCE,
    ProteinImpactType.INFRAME_UNKNOWN_SIGNIFICANCE,
    ProteinImpactType.SPLICE_UNKNOWN_SIGNIFICANCE,
    ProteinImpactType.FUSION_UNKNOWN_SIGNIFICANCE,
];

export interface IDriverAnnotationProteinImpactTypeBadgeSelectorProps
    extends ProteinImpactTypeBadgeSelectorProps {
    driverVsVusOnSelect?: (
        selectedOptionIds: string[],
        allValuesSelected?: boolean
    ) => void;
    onSelect?: (
        selectedOptionIds: string[],
        allValuesSelected?: boolean
    ) => void;
    onClickSettingMenu?: (visible: boolean) => void;
}

@observer
export default class DriverAnnotationProteinImpactTypeBadgeSelector extends ProteinImpactTypeBadgeSelector<
    IDriverAnnotationProteinImpactTypeBadgeSelectorProps
> {
    constructor(props: IDriverAnnotationProteinImpactTypeBadgeSelectorProps) {
        super(props);
        makeObservable(this);
    }

    @observable selectedDriverVsVusValues: string[] = [
        DriverVsVusType.DRIVER,
        DriverVsVusType.VUS,
    ];
    @observable settingMenuVisible = false;

    public static defaultProps: Partial<
        IDriverAnnotationProteinImpactTypeBadgeSelectorProps
    > = {
        colors: DEFAULT_PROTEIN_IMPACT_TYPE_COLORS,
        alignColumns: true,
        unselectOthersWhenAllSelected: true,
        numberOfColumnsPerRow: 2,
    };

    @action.bound
    private getDriverVsVusOptionLabel(option: Option): JSX.Element {
        const driverAnnotationSettingIcon = (
            <button
                style={{
                    marginLeft: 5,
                    marginRight: 5,
                    padding: '0px 4px 0px 4px',
                    height: 18,
                }}
                className="btn btn-primary"
                onClick={this.onSettingMenuClick}
            >
                <i
                    className="fa fa-sliders"
                    style={{
                        fontSize: 12,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                    }}
                />
            </button>
        );

        if (option.value === DriverVsVusType.DRIVER) {
            return (
                <span>
                    {option.label || option.value}
                    <span className={styles['driver-annotation-setting']}>
                        <DefaultTooltip
                            placement="top"
                            overlay={
                                <span>
                                    Change driver filtering in{' '}
                                    {driverAnnotationSettingIcon}
                                </span>
                            }
                        >
                            {driverAnnotationSettingIcon}
                        </DefaultTooltip>
                    </span>
                </span>
            );
        } else {
            return <span>{option.label || option.value}</span>;
        }
    }

    protected get optionDisplayValueMap() {
        return getProteinImpactTypeOptionDisplayValueMap(
            this.proteinImpactTypeColors
        );
    }

    protected get proteinImpactTypeColors() {
        return getProteinImpactTypeColorMap(this.props.colors);
    }

    protected get options() {
        // get options, hide "Other" if it's 0
        return SELECTOR_VALUE_WITH_VUS.map(value => ({
            value,
            label: this.optionDisplayValueMap[value],
            badgeContent: this.props.counts
                ? this.props.counts[value]
                : undefined,
            badgeStyleOverride: {
                backgroundColor: this.proteinImpactTypeColors[value],
            },
        })).filter(
            type =>
                !(
                    type.value === ProteinImpactType.OTHER &&
                    type.badgeContent === 0
                )
        );
    }

    protected get driverVsVusOptions() {
        return [
            {
                value: DriverVsVusType.DRIVER,
                label: this.optionDisplayValueMap[DriverVsVusType.DRIVER],
                badgeContent: this.props.counts
                    ? _.reduce(
                          PUTATIVE_DRIVER_TYPE,
                          (count, type) => (count += this.props.counts![type]),
                          0
                      )
                    : undefined,
                badgeStyleOverride: {
                    backgroundColor: this.proteinImpactTypeColors[
                        DriverVsVusType.DRIVER
                    ],
                },
            },
            {
                value: DriverVsVusType.VUS,
                label: this.optionDisplayValueMap[DriverVsVusType.VUS],
                badgeContent: this.props.counts
                    ? _.reduce(
                          UNKNOWN_SIGNIFICANCE_TYPE,
                          (count, type) => (count += this.props.counts![type]),
                          0
                      )
                    : undefined,
                badgeStyleOverride: {
                    backgroundColor: this.proteinImpactTypeColors[
                        DriverVsVusType.VUS
                    ],
                },
            },
        ];
    }

    @action.bound
    protected onDriverVsVusSelect(
        selectedOption: string[],
        allValuesSelected: boolean
    ) {
        let selected: string[] = [];
        // If select "Driver" or "VUS", then also select corresponding mutation types
        _.forEach(selectedOption, option => {
            if (option === DriverVsVusType.DRIVER) {
                selected = _.union(selected, PUTATIVE_DRIVER_TYPE);
            }
            if (option === DriverVsVusType.VUS) {
                selected = _.union(selected, UNKNOWN_SIGNIFICANCE_TYPE);
            }
        });
        this.props.onSelect && this.props.onSelect(selected, allValuesSelected);
        this.selectedDriverVsVusValues = selectedOption;
    }

    @action.bound
    protected onMutationTypeSelect(
        selectedOption: string[],
        allValuesSelected: boolean
    ) {
        // If all driver(vus) mutation types are selected, select "Driver"("VUS") button
        let updatedDriverVsVusValues = [];
        if (
            _.intersection(selectedOption, PUTATIVE_DRIVER_TYPE).length ===
            PUTATIVE_DRIVER_TYPE.length
        ) {
            updatedDriverVsVusValues.push(DriverVsVusType.DRIVER);
        }
        if (
            _.intersection(selectedOption, UNKNOWN_SIGNIFICANCE_TYPE).length ===
            UNKNOWN_SIGNIFICANCE_TYPE.length
        ) {
            updatedDriverVsVusValues.push(DriverVsVusType.VUS);
        }
        this.selectedDriverVsVusValues = updatedDriverVsVusValues;
        this.props.onSelect &&
            this.props.onSelect(selectedOption, allValuesSelected);
    }

    @action.bound
    protected onSettingMenuClick(e: React.MouseEvent<any>) {
        e.stopPropagation(); // Prevent click being applied to parent element
        this.settingMenuVisible = !this.settingMenuVisible;
        this.props.onClickSettingMenu &&
            this.props.onClickSettingMenu(this.settingMenuVisible);
    }

    public render() {
        return (
            <div className={styles['legend-panel']}>
                <BadgeSelector
                    options={this.driverVsVusOptions}
                    getOptionLabel={this.getDriverVsVusOptionLabel}
                    getBadgeLabel={getProteinImpactTypeBadgeLabel}
                    selectedValues={this.selectedDriverVsVusValues.map(v => {
                        return { value: v };
                    })}
                    {...this.props}
                    onSelect={this.onDriverVsVusSelect}
                />
                <hr style={{ marginBottom: 5 }}></hr>
                <BadgeSelector
                    options={this.options}
                    getOptionLabel={getProteinImpactTypeOptionLabel}
                    getBadgeLabel={getProteinImpactTypeBadgeLabel}
                    {...this.props}
                    onSelect={this.onMutationTypeSelect}
                />
            </div>
        );
    }
}
