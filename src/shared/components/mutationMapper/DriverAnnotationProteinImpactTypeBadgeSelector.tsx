import {
    ProteinImpactTypeBadgeSelector,
    ProteinImpactTypeBadgeSelectorProps,
    DEFAULT_PROTEIN_IMPACT_TYPE_COLORS,
    getAllOptionValues,
    getSelectedOptionValues,
    getProteinImpactTypeOptionLabel,
    getProteinImpactTypeBadgeLabel,
    DataFilter,
    BadgeSelector,
} from 'react-mutation-mapper';
import * as React from 'react';
import {
    getProteinImpactTypeColorMap,
    getProteinImpactTypeOptionDisplayValueMap,
    SELECTOR_VALUE_WITH_VUS,
} from 'shared/lib/MutationUtils';
import {
    CanonicalMutationType,
    DefaultTooltip,
    DriverVsVusType,
    Option,
    ProteinImpactType,
    ProteinImpactWithoutVusMutationType,
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
    disableAnnotationSettings?: boolean;
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

function isDriverVusBadge(value: string) {
    return (
        !!value &&
        Object.values(DriverVsVusType).includes(value as DriverVsVusType)
    );
}

function isNotDriverVusProteinBadge(value: string) {
    return (
        !!value &&
        Object.values(CanonicalMutationType).includes(
            value as CanonicalMutationType
        )
    );
}

function badgeLabelFormat(
    label: JSX.Element | string,
    badgeFirst?: boolean,
    value?: string,
    badge?: JSX.Element | null
) {
    if (isDriverVusBadge(value!)) {
        return badgeFirst ? (
            <div style={{ float: 'right', textAlign: 'end' }}>
                <div style={{ textAlign: 'center' }}>{label}</div>
                {badge}
            </div>
        ) : (
            <div style={{ float: 'right', textAlign: 'center' }}>
                {this.badge}
                <div>{this.props.label}</div>
            </div>
        );
    } else if (value) {
        return (
            <div style={{ float: 'right', textAlign: 'center' }}>
                {isNotDriverVusProteinBadge(value) ? label : badge}
            </div>
        );
    } else {
        return <></>;
    }
}

@observer
export default class DriverAnnotationProteinImpactTypeBadgeSelector extends ProteinImpactTypeBadgeSelector<
    IDriverAnnotationProteinImpactTypeBadgeSelectorProps
> {
    private putativeDriverTypes: ProteinImpactType[];
    private unknownSignificanceTypes: ProteinImpactType[];

    constructor(props: IDriverAnnotationProteinImpactTypeBadgeSelectorProps) {
        super(props);
        makeObservable(this);

        this.putativeDriverTypes = PUTATIVE_DRIVER_TYPE.filter(
            t => !this.props.excludedProteinTypes?.includes(t)
        );
        this.unknownSignificanceTypes = UNKNOWN_SIGNIFICANCE_TYPE.filter(
            t => !this.props.excludedProteinTypes?.includes(t)
        );
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
            (this.putativeDriverTypes as string[]).includes(v.value)
        );
    }

    @computed get selectedVUSMutationTypeValues() {
        return this.selectedMutationTypeValues.filter(v =>
            (this.unknownSignificanceTypes as string[]).includes(v.value)
        );
    }

    @computed get selectedDriverVsVusValues() {
        if (this.props.annotatedProteinImpactTypeFilter) {
            // If all driver(vus) mutation types are selected, select "Driver"("VUS") button
            let driverVsVusValues = [];
            if (
                _.intersection(
                    this.props.annotatedProteinImpactTypeFilter.values,
                    this.putativeDriverTypes
                ).length === this.putativeDriverTypes.length
            ) {
                driverVsVusValues.push(DriverVsVusType.DRIVER);
            }
            if (
                _.intersection(
                    this.props.annotatedProteinImpactTypeFilter.values,
                    this.unknownSignificanceTypes
                ).length === this.unknownSignificanceTypes.length
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
        numberOfColumnsPerRow: 3,
    };

    @action.bound
    private getDriverVsVusOptionLabel(option: Option): JSX.Element {
        if (option.value === DriverVsVusType.DRIVER) {
            return (
                <span data-test={'badge-driver'}>
                    {option.label || option.value}
                </span>
            );
        } else {
            return <div>{option.label || option.value}</div>;
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
                    this.props.excludedProteinTypes?.includes(type.value) ||
                    (type.value === ProteinImpactType.OTHER &&
                        type.badgeContent === 0)
                )
        );
    }

    protected get driverAnnotationIcon(): JSX.Element | undefined {
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
        if (!this.props.disableAnnotationSettings) {
            return (
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
            );
        }
    }

    protected get driverVsVusOptions() {
        return [
            // for empty table cell
            {
                value: '',
                label: undefined,
                badgeContent: undefined,
            },
            {
                value: DriverVsVusType.DRIVER,
                label: this.optionDisplayValueMap[DriverVsVusType.DRIVER],
                badgeContent: this.props.counts
                    ? _.reduce(
                          this.putativeDriverTypes,
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
                          this.unknownSignificanceTypes,
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
        let selectedDriver = findSelectedDriverVsVus(
            DriverVsVusType.DRIVER,
            selectedOption,
            this.selectedDriverMutationTypeValues,
            this.putativeDriverTypes
        );

        let selectedVus = findSelectedDriverVsVus(
            DriverVsVusType.VUS,
            selectedOption,
            this.selectedVUSMutationTypeValues,
            this.unknownSignificanceTypes
        );

        // if protein type driver/vus badges are both selected, add the corresponding protein type to selected
        Object.values(ProteinImpactWithoutVusMutationType).forEach(t => {
            let prefix =
                t.indexOf('_') === -1
                    ? t
                    : (t.substring(
                          0,
                          t.indexOf('_')
                      ) as ProteinImpactWithoutVusMutationType);
            if (
                !this.props.excludedProteinTypes?.includes(prefix) &&
                selectedDriver.includes(prefix + '_putative_driver') &&
                selectedVus.includes(prefix + '_unknown_significance')
            ) {
                selectedDriver = selectedDriver.concat(t);
            }
        });

        this.props.onSelect &&
            this.props.onSelect(
                selectedDriver.concat(selectedVus),
                allValuesSelected
            );
    }

    @action.bound
    protected onOnlyDriverVsVusSelect(
        selectedOption: string[],
        allValuesSelected: boolean
    ) {
        let selected: string[];
        let type = selectedOption[0];
        switch (type) {
            case DriverVsVusType.DRIVER:
                selected = findSelectedDriverVsVus(
                    DriverVsVusType.DRIVER,
                    selectedOption,
                    this.selectedDriverMutationTypeValues,
                    this.putativeDriverTypes
                );
                break;
            case DriverVsVusType.VUS:
                selected = findSelectedDriverVsVus(
                    DriverVsVusType.VUS,
                    selectedOption,
                    this.selectedVUSMutationTypeValues,
                    this.unknownSignificanceTypes
                );
                break;
        }
        this.props.onSelect &&
            this.props.onSelect(selected!, allValuesSelected);
    }

    @action.bound
    protected onSettingMenuClick(e: React.MouseEvent<any>) {
        e.stopPropagation(); // Prevent click being applied to parent element
        this.settingMenuVisible = !this.settingMenuVisible;
        this.props.onClickSettingMenu &&
            this.props.onClickSettingMenu(this.settingMenuVisible);
    }

    @action.bound
    private onProteinBadgeSelect(
        value: string,
        selectedValues: { value: string }[],
        onChange: (values: { value: string }[]) => void
    ) {
        // determine protein type
        let prefix =
            value.indexOf('_') === -1
                ? value
                : value.substring(0, value.indexOf('_'));
        if (
            Object.values(ProteinImpactWithoutVusMutationType).includes(
                value as ProteinImpactWithoutVusMutationType
            )
        ) {
            // unselect if selected
            if (selectedValues.some(v => v.value === value)) {
                onChange(
                    selectedValues.filter(
                        v =>
                            v.value !== prefix + '_putative_driver' &&
                            v.value !== prefix + '_unknown_significance' &&
                            v.value !== value
                    )
                );
            }
            // select if not selected
            else {
                onChange(
                    [
                        { value: prefix + '_putative_driver' },
                        { value: prefix + '_unknown_significance' },
                        { value },
                    ].concat(selectedValues)
                );
            }
        }
        // non-protein type badge selected (driver/vus badge or protein type driver/vus badge)
        else {
            // unselect if selected
            if (selectedValues.some(v => v.value === value)) {
                // if badge is selected, unselect badge as well as its corresponding protein type if not driver/vus badge
                prefix = prefix === 'splice' ? prefix + '_site' : prefix;
                onChange(
                    selectedValues.filter(
                        v => v.value !== value && v.value !== prefix
                    )
                );
            }
            // select if not selected
            else {
                // if badge is unselected, select badge
                // also select its corresponding protein type if both protein type driver/vus badges will be selected
                if (
                    !selectedValues.some(
                        v => v.value === prefix + '_putative_driver'
                    ) &&
                    !selectedValues.some(
                        v => v.value === prefix + '_unknown_significance'
                    )
                ) {
                    onChange([{ value }].concat(selectedValues));
                } else {
                    prefix = prefix === 'splice' ? prefix + '_site' : prefix;
                    onChange(
                        [{ value }, { value: prefix }].concat(selectedValues)
                    );
                }
            }
        }
    }

    @action.bound
    private onProteinOnlySelect(
        value: string,
        onChange: (values: { value: string }[]) => void,
        onOnlyDriverVsVusChange: (values: { value: string }[]) => void
    ) {
        // if driver/vus only is selected, use this method
        if (Object.values(DriverVsVusType).includes(value as DriverVsVusType)) {
            onOnlyDriverVsVusChange([{ value }]);
        } else {
            // if protein type only is selected, select the protein type and its driver and vus badges as well
            // else just select the one protein type driver/vus badge
            let prefix =
                value.indexOf('_') === -1
                    ? value
                    : value.substring(0, value.indexOf('_'));
            if (
                Object.values(ProteinImpactWithoutVusMutationType).includes(
                    value as ProteinImpactWithoutVusMutationType
                )
            ) {
                onChange([
                    { value: prefix + '_putative_driver' },
                    { value: prefix + '_unknown_significance' },
                    { value },
                ]);
            } else {
                onChange([{ value }]);
            }
        }
    }

    public render() {
        return (
            <div className={styles['legend-panel']}>
                <table>
                    <BadgeSelector
                        options={this.driverVsVusOptions}
                        getOptionLabel={this.getDriverVsVusOptionLabel}
                        getBadgeLabel={getProteinImpactTypeBadgeLabel}
                        selectedValues={this.selectedDriverVsVusValues.map(
                            v => {
                                return { value: v };
                            }
                        )}
                        {...this.props}
                        onSelect={this.onDriverVsVusSelect}
                        onOnlyDriverVsVusSelect={this.onOnlyDriverVsVusSelect}
                        isDriverAnnotated={true}
                        driverAnnotationIcon={this.driverAnnotationIcon}
                        onBadgeSelect={this.onProteinBadgeSelect}
                        onOnlySelect={this.onProteinOnlySelect}
                        badgeLabelFormat={badgeLabelFormat}
                        useOnlyFeature={true}
                    />
                    <BadgeSelector
                        options={this.options}
                        getOptionLabel={getProteinImpactTypeOptionLabel}
                        getBadgeLabel={getProteinImpactTypeBadgeLabel}
                        {...this.props}
                        onSelect={this.props.onSelect}
                        isDriverAnnotated={true}
                        onBadgeSelect={this.onProteinBadgeSelect}
                        onOnlySelect={this.onProteinOnlySelect}
                        badgeLabelFormat={badgeLabelFormat}
                        useOnlyFeature={true}
                    />
                </table>
            </div>
        );
    }
}
