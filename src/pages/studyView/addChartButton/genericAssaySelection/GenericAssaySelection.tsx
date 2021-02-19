import * as React from 'react';
import _ from 'lodash';
import { GenericAssayChart } from 'pages/studyView/StudyViewPageStore';
import { observer } from 'mobx-react';
import { action, computed, observable, makeObservable, toJS } from 'mobx';
import ReactSelect from 'react-select';
import { deriveDisplayTextFromGenericAssayType } from 'pages/resultsView/plots/PlotsTabUtils';
import { MolecularProfileOption } from 'pages/studyView/StudyViewUtils';

export interface IGenericAssaySelectionProps {
    molecularProfileOptions:
        | (MolecularProfileOption & {
              profileName: string;
          })[]
        | ISelectOption[];
    genericAssayEntityOptions: ISelectOption[];
    genericAssayType: string;
    submitButtonText: string;
    containerWidth?: number;
    initialGenericAssayEntityIds?: string[];
    allowEmptySubmission?: boolean;
    onSelectGenericAssayProfile?: (molecularProfileId: string) => void;
    onTrackSubmit?: (data: GenericAssayTrackInfo[]) => void;
    onChartSubmit?: (data: GenericAssayChart[]) => void;
}

export type GenericAssayTrackInfo = {
    profileId: string;
    genericAssayType: string;
    genericAssayEntityId: string;
};

interface ISelectOption {
    value: string;
    label: string;
}

@observer
export default class GenericAssaySelection extends React.Component<
    IGenericAssaySelectionProps,
    {}
> {
    constructor(props: any) {
        super(props);
        makeObservable(this);
        if (this.props.initialGenericAssayEntityIds) {
            this._selectedGenericAssayEntityIds = this.props.initialGenericAssayEntityIds;
        }
    }

    public static defaultProps: Partial<IGenericAssaySelectionProps> = {
        allowEmptySubmission: false,
    };

    @observable private _selectedProfileOption:
        | (MolecularProfileOption & {
              profileName: string;
          })
        | ISelectOption
        | undefined = undefined;

    @observable.ref private _selectedGenericAssayEntityIds: string[] = [];
    @observable private _genericAssaySearchText: string = '';

    @action.bound
    private onSubmit() {
        if (this.selectedProfileOption !== undefined) {
            // Generic Assay chart submit (StudyView)
            if (this.props.onChartSubmit) {
                const option = this
                    .selectedProfileOption as MolecularProfileOption & {
                    profileName: string;
                };
                const charts = this._selectedGenericAssayEntityIds.map(
                    entityId => {
                        return {
                            name: entityId + ': ' + option.profileName,
                            description: option.description,
                            profileType: option.value,
                            genericAssayType: this.props.genericAssayType,
                            dataType: option.dataType,
                            genericAssayEntityId: entityId,
                        };
                    }
                );
                this.props.onChartSubmit(charts);
                // clear selected entities after submit new charts
                this.clearSelectedEntities();
            }
            // Generic Assay track submit (OncoPrint)
            if (this.props.onTrackSubmit) {
                const option = this.selectedProfileOption as ISelectOption;
                // select profile if onSelectGenericAssayProfile exists
                this.props.onSelectGenericAssayProfile &&
                    this.props.onSelectGenericAssayProfile(option.value);
                const info = this._selectedGenericAssayEntityIds.map(
                    entityId => {
                        return {
                            profileId: option.value,
                            genericAssayType: this.props.genericAssayType,
                            genericAssayEntityId: entityId,
                        };
                    }
                );
                this.props.onTrackSubmit(info);
            }
        }
        // fail silently
    }

    @action.bound
    private clearSelectedEntities() {
        this._selectedGenericAssayEntityIds = [];
    }

    @action.bound
    private handleProfileSelect(option: any) {
        if (option && option.value) {
            this._selectedProfileOption = option;
        }
    }

    @computed
    private get selectedProfileOption() {
        if (this._selectedProfileOption !== undefined) {
            return this._selectedProfileOption;
        } else if (this.props.molecularProfileOptions) {
            return this.props.molecularProfileOptions[0];
        } else {
            return undefined;
        }
    }

    @computed
    private get buttonDisabled() {
        // disable button only when we don't allow empty submissions and has zero selected entities
        if (this.props.allowEmptySubmission) {
            return false;
        } else {
            return _.isEmpty(this._selectedGenericAssayEntityIds);
        }
    }

    @computed get genericAssayEntitiesOptionsByValueMap(): {
        [value: string]: ISelectOption;
    } {
        return _.keyBy(
            this.props.genericAssayEntityOptions,
            (option: ISelectOption) => option.value
        );
    }

    @action.bound
    private onSelectGenericAssayEntities(
        selectedOptions: ISelectOption[],
        selectInfo: any
    ) {
        // selectedOptions can be null if delete the last selected option
        let candidateOptions = selectedOptions ? selectedOptions : [];
        // if choose select all option, add all filtered options
        if (
            selectInfo.action === 'select-option' &&
            selectInfo.option.value === 'select_all_filtered_options'
        ) {
            // use union to keep previous selected options and new added options
            candidateOptions = _.union(
                this.filteredGenericAssayOptions,
                candidateOptions
            );
        }
        // map to id
        let candidateIds = candidateOptions.map(o => o.value);
        // filter out select all option from the candidate id list
        candidateIds = candidateIds.filter(
            id => id !== 'select_all_filtered_options'
        );
        this._selectedGenericAssayEntityIds = candidateIds;
        this._genericAssaySearchText = '';
    }

    @computed get selectedGenericAssayEntities(): ISelectOption[] {
        const filteredSelectedGenericAssayEntityIds = _.intersection(
            this._selectedGenericAssayEntityIds,
            _.keys(this.genericAssayEntitiesOptionsByValueMap)
        );
        return filteredSelectedGenericAssayEntityIds.map(
            o => this.genericAssayEntitiesOptionsByValueMap[o]
        );
    }

    @computed get selectedGenericAssaysJS() {
        return toJS(this.selectedGenericAssayEntities);
    }

    private doesOptionMatchSearchText(text: string, option: ISelectOption) {
        let result = false;
        if (
            !text ||
            new RegExp(text, 'i').test(option.label) ||
            new RegExp(text, 'i').test(option.value)
        ) {
            result = true;
        }
        return result;
    }

    @computed get genericAssayOptions() {
        // add select all option only when options have been filtered and has at least one filtered option
        // one generic assay profile usually contains hundreds of options, we don't want user try to add all options without filtering the option
        let allOptionsInSelectedProfile = this.props.genericAssayEntityOptions;
        const filteredOptionsLength = this.props.genericAssayEntityOptions.filter(
            option =>
                this.doesOptionMatchSearchText(
                    this._genericAssaySearchText,
                    option
                ) && !this._selectedGenericAssayEntityIds.includes(option.value)
        ).length;
        if (
            this._genericAssaySearchText.length > 0 &&
            filteredOptionsLength > 0
        ) {
            allOptionsInSelectedProfile = _.concat(
                {
                    id: 'select_all_filtered_options',
                    value: 'select_all_filtered_options',
                    label: `Select all filtered options (${filteredOptionsLength})`,
                } as ISelectOption,
                allOptionsInSelectedProfile
            );
        }
        return allOptionsInSelectedProfile;
    }

    @computed get filteredGenericAssayOptions() {
        return _.filter(this.genericAssayOptions, option => {
            // do not filter out select all option
            if (option.value === 'select_all_filtered_options') {
                return false;
            }
            return this.doesOptionMatchSearchText(
                this._genericAssaySearchText,
                option
            );
        });
    }

    @action.bound
    filterGenericAssayOption(option: ISelectOption, filterString: string) {
        if (option.value === 'select_all_filtered_options') {
            return true;
        }
        return (
            this.doesOptionMatchSearchText(filterString, option) &&
            !this._selectedGenericAssayEntityIds.includes(option.value)
        );
    }

    @action.bound
    onGenericAssayInputChange(input: string, inputInfo: any) {
        if (inputInfo.action === 'input-change') {
            this._genericAssaySearchText = input;
        } else if (inputInfo.action !== 'set-value') {
            this._genericAssaySearchText = '';
        }
    }

    // TODO: decide whether we need this or not
    // disabled currently
    @computed get isSelectedGenericAssayOptionsOverLimit() {
        return this._selectedGenericAssayEntityIds.length > 100;
    }

    render() {
        return (
            <div
                data-test="GenericAssaySelection"
                style={{
                    width: this.props.containerWidth
                        ? this.props.containerWidth - 20
                        : 'auto',
                }}
            >
                <div data-test="GenericAssayEntitySelection">
                    {/* {this.isSelectedGenericAssayOptionsOverLimit && (
                        <div className="alert alert-warning">
                            <i
                                className="fa fa-warning"
                                style={{ marginRight: 3 }}
                            />
                            Warning: we don't support adding more than 100
                            options, please make sure your selection has less
                            than 100 options.
                        </div>
                    )} */}
                    <ReactSelect
                        name="generic-assay-select"
                        placeholder={`Search for ${deriveDisplayTextFromGenericAssayType(
                            this.props.genericAssayType,
                            true
                        )}...`}
                        closeMenuOnSelect={false}
                        value={this.selectedGenericAssaysJS}
                        isMulti
                        isClearable={false}
                        options={this.genericAssayOptions}
                        filterOption={this.filterGenericAssayOption}
                        onInputChange={this.onGenericAssayInputChange}
                        onChange={this.onSelectGenericAssayEntities}
                        styles={{
                            multiValueLabel: (base: any) => ({
                                ...base,
                                whiteSpace: 'normal',
                            }),
                        }}
                    />
                </div>
                <div style={{ display: 'flex', marginTop: 10 }}>
                    <div
                        data-test="GenericAssayProfileSelection"
                        style={{
                            flex: 1,
                            marginRight: 15,
                        }}
                    >
                        <ReactSelect
                            value={this.selectedProfileOption}
                            onChange={this.handleProfileSelect}
                            options={this.props.molecularProfileOptions}
                            isClearable={false}
                            isSearchable={false}
                        />
                    </div>
                    <button
                        disabled={this.buttonDisabled}
                        className="btn btn-primary btn-sm"
                        data-test="GenericAssaySelectionSubmitButton"
                        onClick={this.onSubmit}
                    >
                        {this.props.submitButtonText}
                    </button>
                </div>
            </div>
        );
    }
}
