import React from 'react';
import ClinicalTrialMatchMutationSelect from './ClinicalTrialMatchSelectUtil';
import { PatientViewPageStore } from '../clinicalInformation/PatientViewPageStore';
import { RecruitingStatus } from 'shared/enums/ClinicalTrialsGovRecruitingStatus';
import Select from 'react-select';
import CreatableSelect from 'react-select/creatable';
import {
    recruitingValueNames,
    countriesNames,
    genderNames,
} from './utils/SelectValues';
import { CITIES_AND_COORDINATES } from './utils/location/CoordinateList';
import { Collapse } from 'react-collapse';
import { DefaultTooltip } from 'cbioportal-frontend-commons';

const OPTIONAL_MUTATIONS_TOOLTIP: string =
    'Search studies for selected keywords. Studies containing at least one keyword are found. You may add custom keywords.';
const NECESSARY_MUTATIONS_TOOLTIP: string =
    'Search studies for selected keywords. Study MUST contain ALL keywords to be found. You may add custom keywords.';
const STATUS_TOOLTIP: string =
    'Search for recruiting status. Studies not in one of the selectet stati are not found.';
const COUNTIRES_TOOLTIP: string =
    'Select recruiting countries for studies. Only studies recruiting in at least one selected country are found.';
const AGE_TOOLTIP: string =
    'Select age of the patient. Studies with matching ages are ranked higher.';
const SEX_TOOLTIP: string =
    'Select gender of the patient. Studies with matching gender are ranked higher.';
const LOCATION_TOOLTIP: string =
    'Select exact location of patient. Studies with closer recruiting sites are ranked higher. This function decreases search speed.';

const MAX_DISTANCE_TOOLTIP: string =
    'Select the maximum distance from patient to closest recruiting site. Other studies are not shown, unless none of the locations were recognized';

const components = {
    DropdownIndicator: null,
};

interface IClinicalTrialOptionsMatchProps {
    store: PatientViewPageStore;
}

interface IClinicalTrialOptionsMatchState {
    mutationSymbolItems: Array<string>;
    mutationNecSymbolItems: Array<string>;
    countryItems: Array<string>;
    recruitingItems: Array<string>;
    gender: string;
    patientLocation: string;
    age: number;
    maxDistance: string;
    isOpened: boolean;
}

class ClinicalTrialMatchTableOptions extends React.Component<
    IClinicalTrialOptionsMatchProps,
    IClinicalTrialOptionsMatchState
> {
    recruiting_values: RecruitingStatus[] = [];
    countries: Array<String>;
    genders: Array<String>;
    locationsWithCoordinates: Array<String>;
    gender: any;
    age: string;
    ageDefault: any;

    constructor(props: IClinicalTrialOptionsMatchProps) {
        super(props);

        this.gender = { label: 'All', value: 'All' };
        let sex = this.props.store.clinicalDataPatient.result.find(
            attribute => attribute.clinicalAttributeId === 'SEX'
        )?.value;
        if (sex !== undefined && sex.length > 0) {
            this.gender = { label: sex, value: sex };
        }

        this.age =
            this.props.store.clinicalDataPatient.result.find(
                attribute => attribute.clinicalAttributeId === 'AGE'
            )?.value || '0';
        this.ageDefault =
            this.age != '0' ? [{ label: this.age, value: this.age }] : null;

        this.state = {
            mutationSymbolItems: new Array<string>(),
            mutationNecSymbolItems: new Array<string>(),
            countryItems: new Array<string>(),
            recruitingItems: new Array<string>(),
            patientLocation: '',
            gender: sex || 'All',
            age: +this.age,
            maxDistance: '',
            isOpened: false,
        };

        this.recruiting_values = recruitingValueNames;

        this.genders = genderNames;
        this.countries = countriesNames;
        this.locationsWithCoordinates = Object.keys(CITIES_AND_COORDINATES);
    }

    getRecruitingKeyFromValueString(value: string): RecruitingStatus {
        for (let status of this.recruiting_values) {
            if (status.toString() == value) {
                return status;
            }
        }

        return RecruitingStatus.Invalid;
    }

    setSearchParams() {
        var symbols: string[] = this.state.mutationSymbolItems;
        var necSymbols: string[] = this.state.mutationNecSymbolItems;
        var recruiting_stati: RecruitingStatus[] = this.state.recruitingItems.map(
            item => this.getRecruitingKeyFromValueString(item)
        );
        var countries_to_search: string[] = this.state.countryItems;
        var gender: string = this.state.gender;
        var patientLocation = this.state.patientLocation;
        var patientAge = this.state.age;
        var filterDistance = this.state.isOpened;
        var maximumDistance = +this.state.maxDistance;

        console.group('TRIALS start search');
        console.log(this.state);
        console.groupEnd();

        this.props.store.setClinicalTrialSearchParams(
            countries_to_search,
            recruiting_stati,
            symbols,
            necSymbols,
            gender,
            patientLocation,
            patientAge,
            filterDistance,
            maximumDistance
        );

        console.log('smybols');
        console.log(symbols);
        console.log(recruiting_stati);
        console.log('necSymbols');
        console.log(necSymbols);
        console.log('dist');
    }

    render() {
        return (
            <React.Fragment>
                <div
                    style={{
                        display: 'block',
                        maxWidth: '40%',
                    }}
                >
                    <DefaultTooltip
                        overlay={OPTIONAL_MUTATIONS_TOOLTIP}
                        placement="topRight"
                        trigger={['hover', 'focus']}
                        destroyTooltipOnHide={true}
                    >
                        <div
                            style={{
                                display: 'block',
                                marginLeft: '5px',
                                marginBottom: '5px',
                            }}
                        >
                            <ClinicalTrialMatchMutationSelect
                                options={this.props.store.mutationHugoGeneSymbols.map(
                                    geneSymbol => ({
                                        label: geneSymbol,
                                        value: geneSymbol,
                                    })
                                )}
                                isMulti
                                data={this.state.mutationSymbolItems}
                                name="mutationSearch"
                                className="basic-multi-select"
                                classNamePrefix="select"
                                placeholder="Select OPTIONAL mutations and additional search keywords..."
                                onChange={(selectedOption: Array<any>) => {
                                    const newMutations = [];
                                    if (selectedOption !== null) {
                                        const mutations = selectedOption.map(
                                            item => item.value
                                        );
                                        newMutations.push(...mutations);
                                    }
                                    this.setState({
                                        mutationSymbolItems: newMutations,
                                    });

                                    console.group('TRIALS Mutation Changed');
                                    console.log(this.state.mutationSymbolItems);
                                    console.groupEnd();
                                }}
                            />
                        </div>
                    </DefaultTooltip>
                    <DefaultTooltip
                        overlay={NECESSARY_MUTATIONS_TOOLTIP}
                        placement="topRight"
                        trigger={['hover', 'focus']}
                        destroyTooltipOnHide={true}
                    >
                        <div
                            style={{
                                display: 'block',
                                marginLeft: '5px',
                                marginBottom: '5px',
                            }}
                        >
                            <ClinicalTrialMatchMutationSelect
                                options={this.props.store.mutationHugoGeneSymbols.map(
                                    geneSymbol => ({
                                        label: geneSymbol,
                                        value: geneSymbol,
                                    })
                                )}
                                isMulti
                                data={this.state.mutationNecSymbolItems}
                                name="mutationSearch"
                                className="basic-multi-select"
                                classNamePrefix="select"
                                placeholder="Select NECESSARY mutations and additional search keywords..."
                                onChange={(selectedOption: Array<any>) => {
                                    const newMutations = [];
                                    if (selectedOption !== null) {
                                        const mutations = selectedOption.map(
                                            item => item.value
                                        );
                                        newMutations.push(...mutations);
                                    }
                                    this.setState({
                                        mutationNecSymbolItems: newMutations,
                                    });
                                }}
                            />
                        </div>
                    </DefaultTooltip>
                    <DefaultTooltip
                        overlay={STATUS_TOOLTIP}
                        placement="topRight"
                        trigger={['hover', 'focus']}
                        destroyTooltipOnHide={true}
                    >
                        <div
                            style={{
                                display: 'block',
                                marginLeft: '5px',
                                marginBottom: '5px',
                            }}
                        >
                            <Select
                                options={this.recruiting_values.map(
                                    recStatus => ({
                                        label: recStatus,
                                        value: recStatus,
                                    })
                                )}
                                isMulti
                                name="recruitingStatusSearch"
                                className="basic-multi-select"
                                classNamePrefix="select"
                                placeholder="Select status..."
                                onChange={(selectedOption: Array<any>) => {
                                    const newStatuses = [];
                                    if (selectedOption !== null) {
                                        const statuses = selectedOption.map(
                                            item => item.value
                                        );
                                        newStatuses.push(...statuses);
                                    }
                                    this.setState({
                                        recruitingItems: newStatuses,
                                    });
                                }}
                            />
                        </div>
                    </DefaultTooltip>
                    <DefaultTooltip
                        overlay={COUNTIRES_TOOLTIP}
                        placement="topRight"
                        trigger={['hover', 'focus']}
                        destroyTooltipOnHide={true}
                    >
                        <div
                            style={{
                                display: 'block',
                                marginLeft: '5px',
                                marginBottom: '5px',
                            }}
                        >
                            <Select
                                options={this.countries.map(cnt => ({
                                    label: cnt,
                                    value: cnt,
                                }))}
                                isMulti
                                name="CountrySearch"
                                className="basic-multi-select"
                                classNamePrefix="select"
                                placeholder="Select countries..."
                                onChange={(selectedOption: Array<any>) => {
                                    const newStatuses = [];
                                    if (selectedOption !== null) {
                                        const statuses = selectedOption.map(
                                            item => item.value
                                        );
                                        newStatuses.push(...statuses);
                                    }
                                    this.setState({
                                        countryItems: newStatuses,
                                    });
                                }}
                            />
                        </div>
                    </DefaultTooltip>

                    <DefaultTooltip
                        overlay={AGE_TOOLTIP}
                        placement="topRight"
                        trigger={['hover', 'focus']}
                        destroyTooltipOnHide={true}
                    >
                        <div
                            style={{
                                display: 'block',
                                marginLeft: '5px',
                                marginBottom: '5px',
                            }}
                        >
                            <CreatableSelect
                                isClearable
                                isMulti={false}
                                components={components}
                                placeholder="Select age..."
                                onChange={(newValue: any) => {
                                    if (newValue !== null) {
                                        this.setState({
                                            age: +newValue.value,
                                        });
                                    } else {
                                        this.setState({
                                            age: 0,
                                        });
                                    }
                                }}
                                defaultValue={this.ageDefault}
                                options={this.ageDefault}
                            />
                        </div>
                    </DefaultTooltip>

                    <DefaultTooltip
                        overlay={SEX_TOOLTIP}
                        placement="topRight"
                        trigger={['hover', 'focus']}
                        destroyTooltipOnHide={true}
                    >
                        <div
                            style={{
                                display: 'block',
                                marginLeft: '5px',
                                marginBottom: '5px',
                            }}
                        >
                            <Select
                                options={this.genders.map(gender => ({
                                    label: gender,
                                    value: gender,
                                }))}
                                name="genderSearch"
                                defaultValue={this.gender}
                                className="basic-select"
                                classNamePrefix="select"
                                placeholder="Select gender..."
                                onChange={(selectedOption: any) => {
                                    var newStatuses = '';
                                    if (selectedOption !== null) {
                                        newStatuses = selectedOption.value;
                                    }
                                    this.setState({
                                        gender: newStatuses,
                                    });
                                }}
                            />
                        </div>
                    </DefaultTooltip>

                    <DefaultTooltip
                        overlay={LOCATION_TOOLTIP}
                        placement="topRight"
                        trigger={['hover', 'focus']}
                        destroyTooltipOnHide={true}
                    >
                        <div
                            style={{
                                display: 'block',
                                marginLeft: '5px',
                                marginBottom: '5px',
                            }}
                        >
                            <Select
                                options={this.locationsWithCoordinates.map(
                                    city => ({
                                        label: city,
                                        value: city,
                                    })
                                )}
                                name="locationDistance"
                                className="basic-select"
                                classNamePrefix="select"
                                placeholder="Select patient location..."
                                onChange={(selectedOption: any) => {
                                    var newStatuses = '';
                                    if (selectedOption !== null) {
                                        newStatuses = selectedOption.value;
                                    }
                                    this.setState({
                                        patientLocation: newStatuses,
                                    });
                                }}
                            />
                        </div>
                    </DefaultTooltip>

                    <DefaultTooltip
                        overlay={MAX_DISTANCE_TOOLTIP}
                        placement="topRight"
                        trigger={['hover', 'focus']}
                        destroyTooltipOnHide={true}
                    >
                        <div
                            style={{
                                display: 'block',
                                marginLeft: '5px',
                                marginBottom: '5px',
                            }}
                        >
                            <div className="config">
                                <label>
                                    <input
                                        className="input"
                                        type="checkbox"
                                        checked={this.state.isOpened}
                                        onChange={({ target: { checked } }) =>
                                            this.setState({ isOpened: checked })
                                        }
                                    />{' '}
                                    Set maximum distance in km
                                </label>
                                <Collapse isOpened={this.state.isOpened}>
                                    <input
                                        placeholder="Distance in km"
                                        value={this.state.maxDistance}
                                        onChange={event =>
                                            this.setState({
                                                maxDistance: event.target.value.replace(
                                                    /\D/,
                                                    ''
                                                ),
                                            })
                                        }
                                    />
                                </Collapse>
                            </div>
                        </div>
                    </DefaultTooltip>
                </div>
                <div>
                    <button
                        onClick={this.setSearchParams.bind(this)}
                        className={'btn btn-default'}
                        style={{
                            display: 'block',
                            marginLeft: '5px',
                        }}
                    >
                        Search
                    </button>
                </div>
            </React.Fragment>
        );
    }
}

export default ClinicalTrialMatchTableOptions;
