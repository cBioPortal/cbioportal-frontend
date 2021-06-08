import {
    ProteinImpactTypeBadgeSelector,
    ProteinImpactTypeBadgeSelectorProps,
    DEFAULT_PROTEIN_IMPACT_TYPE_COLORS,
    BadgeSelector,
    getAllOptionValues,
    getSelectedOptionValues,
    getProteinImpactTypeOptionLabel,
    getProteinImpactTypeBadgeLabel,
    DataFilter,
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
import { action, computed, makeObservable, observable } from 'mobx';
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
    annotatedProteinImpactTypeFilter?: DataFilter<string>;
}

function findSelectedDriverVsVus(
    type: DriverVsVusType,
    selectedOption: string[],
    alreadySelectedValues: { value: string }[],
    allTypes: ProteinImpactType[]
): string[] {
    let toSelect: string[] = [];

    // If "type" is selected then also select all of corresponding mutation types
    if (selectedOption.includes(type)) {
        toSelect = allTypes;
    }
    // If "type" is not selected, decide whether we unselect all mutations corresponding to that type as well
    else {
        // if selected mutation types already includes ALL of the mutations corresponding to the given type
        // then it means "type" is just UNSELECTED,
        // we should not add "type" mutations back in the selected in that case
        if (alreadySelectedValues.length !== allTypes.length) {
            toSelect = alreadySelectedValues.map(v => v.value);
        }
    }

    return toSelect;
}

@observer
export default class DriverAnnotationProteinImpactTypeBadgeSelector extends ProteinImpactTypeBadgeSelector<
    IDriverAnnotationProteinImpactTypeBadgeSelectorProps
> {
    constructor(props: IDriverAnnotationProteinImpactTypeBadgeSelectorProps) {
        super(props);
        makeObservable(this);
    }

    @observable settingMenuVisible = false;

    @computed get selectedMutationTypeValues() {
        return getSelectedOptionValues(
            getAllOptionValues(this.options),
            this.props.filter
        );
    }

    @computed get selectedDriverMutationTypeValues() {
        return this.selectedMutationTypeValues.filter(v =>
            (PUTATIVE_DRIVER_TYPE as string[]).includes(v.value)
        );
    }

    @computed get selectedVUSMutationTypeValues() {
        return this.selectedMutationTypeValues.filter(v =>
            (UNKNOWN_SIGNIFICANCE_TYPE as string[]).includes(v.value)
        );
    }

    @computed get selectedDriverVsVusValues() {
        if (this.props.annotatedProteinImpactTypeFilter) {
            // If all driver(vus) mutation types are selected, select "Driver"("VUS") button
            let driverVsVusValues = [];
            if (
                _.intersection(
                    this.props.annotatedProteinImpactTypeFilter.values,
                    PUTATIVE_DRIVER_TYPE
                ).length === PUTATIVE_DRIVER_TYPE.length
            ) {
                driverVsVusValues.push(DriverVsVusType.DRIVER);
            }
            if (
                _.intersection(
                    this.props.annotatedProteinImpactTypeFilter.values,
                    UNKNOWN_SIGNIFICANCE_TYPE
                ).length === UNKNOWN_SIGNIFICANCE_TYPE.length
            ) {
                driverVsVusValues.push(DriverVsVusType.VUS);
            }
            return driverVsVusValues;
        } else {
            return [DriverVsVusType.DRIVER, DriverVsVusType.VUS];
        }
    }

    public static defaultProps: Partial<
        IDriverAnnotationProteinImpactTypeBadgeSelectorProps
    > = {
        colors: DEFAULT_PROTEIN_IMPACT_TYPE_COLORS,
        alignColumns: true,
        unselectOthersWhenAllSelected: false,
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
        const selectedDriver = findSelectedDriverVsVus(
            DriverVsVusType.DRIVER,
            selectedOption,
            this.selectedDriverMutationTypeValues,
            PUTATIVE_DRIVER_TYPE
        );

        const selectedVus = findSelectedDriverVsVus(
            DriverVsVusType.VUS,
            selectedOption,
            this.selectedVUSMutationTypeValues,
            UNKNOWN_SIGNIFICANCE_TYPE
        );

        this.props.onSelect &&
            this.props.onSelect(
                selectedDriver.concat(selectedVus),
                allValuesSelected
            );
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
                    onSelect={this.props.onSelect}
                />
            </div>
        );
    }
}
