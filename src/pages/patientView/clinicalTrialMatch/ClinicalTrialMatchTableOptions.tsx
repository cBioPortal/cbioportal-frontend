import React from 'react';
import styles from './style/clinicalTrialMatch.module.scss';
import ClinicalTrialMatchMutationSelect, {
    Dict,
    City,
} from './ClinicalTrialMatchSelectUtil';
import ClinicalTrialMatchRecruitingSelect from './ClinicalTrialMatchRecruitingSelect';
import ClinicalTrialMatchCountrySelect from './ClinicalTrialMatchCountrySelect';
import ClinicalTrialMatchAgeSelect from './ClinicalTrialMatchAgeSelect';
import { PatientViewPageStore } from '../clinicalInformation/PatientViewPageStore';
import {
    RecruitingStatus,
    recruitingStatusOptions,
} from 'shared/enums/ClinicalTrialsGovRecruitingStatus';
import Select from 'react-select';
import { components } from 'react-select';
import Async, { useAsync } from 'react-select/async';
import AsyncSelect from 'react-select/async';
import CreatableSelect from 'react-select/creatable';
import oncoTreeTumorTypes from 'cbioportal-utils/src/model/OncoTreeTumorTypes';
import {
    countriesNames,
    countriesGroups,
    genderNames,
} from './utils/SelectValues';
import { Collapse } from 'react-collapse';
import { Modal } from 'react-bootstrap';
import {
    DefaultTooltip,
    placeArrowBottomLeft,
} from 'cbioportal-frontend-commons';
import { Checkbox } from 'pages/resultsView/enrichments/styles.module.scss';
import { input } from 'pages/studyView/addChartButton/addChartByType/styles.module.scss';

const OPTIONAL_MUTATIONS_TOOLTIP: string =
    'Studies must contain at least one of the search terms. This represents a logical OR.';
const NECESSARY_MUTATIONS_TOOLTIP: string =
    'If Checkbox is checked, studies MUST contain ALL search terms. This represents a logical AND.';
const STATUS_TOOLTIP: string =
    'Indicates the current recruitment status. Studies not in one of the selected status are not found.';
const COUNTRIES_TOOLTIP: string =
    'In the search feature, the Countries field is used to find clinical studies with locations in specific countries. Only studies recruiting in at least one selected country are found.';
const AGE_TOOLTIP: string =
    'Enter or edit the age of the patient. Studies with matching age groups are ranked higher.';
const SEX_TOOLTIP: string =
    "Select sex of the patient. Studies with matching sex are ranked higher. This is a type of eligibility criteria that indicates the sex of people who may participate in a clinical study (all, female, male).\n Sex is a person's classification as female or male based on biological distinctions. Sex is distinct from gender-based eligibility.";
const LOCATION_TOOLTIP: string =
    'Select exact location of patient. Studies with closer recruiting sites are ranked higher. This function decreases search speed.';
const MAX_DISTANCE_TOOLTIP: string =
    'Select the maximum distance from patient to closest recruiting site.';
const ENTITY_TOOLTIP: string = 'Select Tumor Enitities';

const customComponents = {
    DropdownIndicator: null,
};

interface IClinicalTrialOptionsMatchProps {
    store: PatientViewPageStore;
    show: boolean;
    onHide: (forceClose: boolean) => void;
}

interface IClinicalTrialOptionsMatchState {
    mutationSymbolItems: Array<string>;
    mutationNecSymbolItems: Array<string>;
    tumorEntityItems: Array<string>;
    countryItems: Array<string>;
    recruitingItems: Array<RecruitingStatus>;
    gender: string;
    patientLocation: City;
    ageState: number;
    maxDistance: string;
    isOpened: boolean;
    isCollapsed: boolean;
    mutationsRequired: boolean;
}

class ClinicalTrialMatchTableOptions extends React.Component<
    IClinicalTrialOptionsMatchProps,
    IClinicalTrialOptionsMatchState
> {
    countries: Array<String>;
    countriesGroups: Array<String>;
    cancerTypes: Array<String>;
    genders: Array<String>;
    locationsWithCoordinates: Array<any>;
    gender: any;
    age: string;
    ageDefault: any;
    tumorEntityDefault: string[];

    constructor(props: IClinicalTrialOptionsMatchProps) {
        super(props);

        this.gender = null;
        let sex = this.props.store.clinicalDataPatient.result.find(
            (attribute: any) => attribute.clinicalAttributeId === 'SEX'
        )?.value;
        let gender = this.props.store.clinicalDataPatient.result.find(
            (attribute: any) => attribute.clinicalAttributeId === 'GENDER'
        )?.value;
        if (sex !== undefined && sex.length > 0) {
            this.gender = { label: sex, value: sex };
        } else if (gender !== undefined && gender.length > 0) {
            this.gender = { label: gender, value: gender };
        }

        this.age =
            this.props.store.clinicalDataPatient.result.find(
                (attribute: any) => attribute.clinicalAttributeId === 'AGE'
            )?.value || '0';
        this.ageDefault =
            this.age != '0' ? [{ label: this.age, value: this.age }] : null;

        this.tumorEntityDefault = [];
        var samples = this.props.store.patientViewData.result.samples;
        for (var i = 0; i < samples!.length; i++) {
            for (var k = 0; k < samples![i].clinicalData.length; k++) {
                if (
                    samples![i].clinicalData[k].clinicalAttributeId ==
                        'CANCER_TYPE_DETAILED' ||
                    samples![i].clinicalData[k].clinicalAttributeId ==
                        'CANCER_TYPE'
                ) {
                    if (
                        !this.tumorEntityDefault.includes(
                            samples![i].clinicalData[k].value
                        ) &&
                        samples![i].clinicalData[k].value !== ''
                    )
                        this.tumorEntityDefault.push(
                            samples![i].clinicalData[k].value
                        );
                }
            }
        }
        this.tumorEntityDefault.forEach(entity => {
            //Add cancer main types to the entities
            var mainTypes = oncoTreeTumorTypes.map(
                cancerType => cancerType.mainType
            );
            var index = oncoTreeTumorTypes.findIndex(cancerType => {
                return entity === cancerType.name;
            });
            var type = mainTypes[index] || '';
            if (!this.tumorEntityDefault.includes(type) && type !== '')
                this.tumorEntityDefault.push(type);

            //Add parents
            var parents = oncoTreeTumorTypes.map(
                cancerType => cancerType.parent
            );
            var parent =
                oncoTreeTumorTypes.find(cancerType => {
                    return parents[index] === cancerType.code;
                })?.name || '';
            if (!this.tumorEntityDefault.includes(parent) && parent !== '')
                this.tumorEntityDefault.push(parent);
        });

        this.state = {
            mutationSymbolItems: new Array<string>(),
            mutationNecSymbolItems: new Array<string>(),
            tumorEntityItems: this.tumorEntityDefault,
            countryItems: new Array<string>(),
            recruitingItems: [
                RecruitingStatus.Recruiting,
                RecruitingStatus.NotYetRecruiting,
            ],
            patientLocation: {
                city: '',
                lat: 0,
                lng: 0,
                country: '',
                admin_name: '',
            },
            gender: this.gender ? this.gender.value : null,
            ageState: +parseInt(this.age),
            maxDistance: '',
            isOpened: false,
            isCollapsed: false,
            mutationsRequired: false,
        };

        this.genders = genderNames;
        this.countries = countriesNames;
        this.countriesGroups = Object.keys(countriesGroups);

        this.locationsWithCoordinates = require('./utils/location/worldCities.json');

        this.cancerTypes = oncoTreeTumorTypes
            .map(obj => obj['name'] || '')
            .filter((v, i, a) => a.indexOf(v) === i)
            .sort();
    }

    setSearchParams() {
        var symbols: string[] = this.state.mutationSymbolItems;
        var necSymbols: string[] = this.state.mutationNecSymbolItems;
        var tumorEntities: string[] = this.state.tumorEntityItems;
        var recruiting_stati: RecruitingStatus[] = this.state.recruitingItems;
        var countries_to_search: string[] = this.state.countryItems;
        var gender: string = this.state.gender;
        var patientLocation = this.state.patientLocation;
        var patientAge = this.state.ageState;
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
            tumorEntities,
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

    private handleRecruitingStatusChange = (statuses: RecruitingStatus[]) => {
        this.setState({ recruitingItems: statuses });
    };

    render() {
        return (
            <Modal
                show={this.props.show}
                onHide={() => {
                    this.props.onHide(true);
                }}
            >
                <Modal.Header closeButton>
                    <Modal.Title>Set search parameters</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <React.Fragment>
                        <div
                            style={{
                                display: 'block',
                                width: '95%',
                                minWidth: '450px',
                            }}
                        >
                            <tr>
                                <td width={'50%'} colSpan={2}>
                                    <div className={styles.tooltipSpan}>
                                        <div style={{ display: 'inline' }}>
                                            <span className={styles.header5}>
                                                Mutations:
                                            </span>
                                            <DefaultTooltip
                                                overlay={
                                                    OPTIONAL_MUTATIONS_TOOLTIP
                                                }
                                                trigger={['hover', 'focus']}
                                                destroyTooltipOnHide={true}
                                            >
                                                <i
                                                    className={
                                                        'fa fa-info-circle ' +
                                                        styles.icon
                                                    }
                                                ></i>
                                            </DefaultTooltip>
                                        </div>
                                        <div
                                            style={{
                                                paddingLeft: '20px',
                                                textAlign: 'right',
                                                display: 'inline',
                                            }}
                                        >
                                            <span>
                                                <input
                                                    className="input"
                                                    type="checkbox"
                                                    checked={
                                                        this.state
                                                            .mutationsRequired
                                                    }
                                                    onChange={({
                                                        target: { checked },
                                                    }) => {
                                                        var nec = checked
                                                            ? this.state.mutationSymbolItems.concat(
                                                                  this.state
                                                                      .mutationNecSymbolItems
                                                              )
                                                            : [];
                                                        var opt = checked
                                                            ? []
                                                            : this.state.mutationNecSymbolItems.concat(
                                                                  this.state
                                                                      .mutationSymbolItems
                                                              );
                                                        this.setState({
                                                            mutationsRequired: checked,
                                                            mutationNecSymbolItems: nec,
                                                            mutationSymbolItems: opt,
                                                        });
                                                    }}
                                                />{' '}
                                                <b>All Mutations required </b>
                                            </span>
                                            <DefaultTooltip
                                                overlay={
                                                    NECESSARY_MUTATIONS_TOOLTIP
                                                }
                                                trigger={['hover', 'focus']}
                                                destroyTooltipOnHide={true}
                                            >
                                                <i
                                                    className={
                                                        'fa fa-info-circle ' +
                                                        styles.icon
                                                    }
                                                ></i>
                                            </DefaultTooltip>
                                        </div>
                                    </div>
                                    <tr
                                        style={{
                                            display: 'block',
                                            marginLeft: '5px',
                                            marginBottom: '5px',
                                        }}
                                    >
                                        <ClinicalTrialMatchMutationSelect
                                            mutations={
                                                this.props.store.mutationData
                                                    .result
                                            }
                                            cna={
                                                this.props.store.discreteCNAData
                                                    .result
                                            }
                                            isMulti
                                            data={
                                                this.state.mutationsRequired ===
                                                true
                                                    ? this.state
                                                          .mutationNecSymbolItems
                                                    : this.state
                                                          .mutationSymbolItems
                                            }
                                            name="mutationSearch"
                                            className="basic-multi-select"
                                            classNamePrefix="select"
                                            placeholder="Select or create mutations/keywords..."
                                            onChange={(
                                                selectedOption: string[]
                                            ) => {
                                                const newMutations = [];
                                                if (selectedOption !== null) {
                                                    const mutations = selectedOption;
                                                    newMutations.push(
                                                        ...mutations
                                                    );
                                                }
                                                if (
                                                    this.state
                                                        .mutationsRequired ===
                                                    true
                                                ) {
                                                    this.setState({
                                                        mutationNecSymbolItems: newMutations,
                                                        mutationSymbolItems: [],
                                                    });
                                                } else {
                                                    this.setState({
                                                        mutationSymbolItems: newMutations,
                                                        mutationNecSymbolItems: [],
                                                    });
                                                }
                                            }}
                                        />
                                    </tr>
                                </td>
                            </tr>
                            <tr>
                                <td colSpan={2}>
                                    <div className={styles.tooltipSpan}>
                                        <span className={styles.header5}>
                                            Tumor Entities:
                                        </span>
                                        <DefaultTooltip
                                            overlay={ENTITY_TOOLTIP}
                                            trigger={['hover', 'focus']}
                                            destroyTooltipOnHide={true}
                                        >
                                            <i
                                                className={
                                                    'fa fa-info-circle ' +
                                                    styles.icon
                                                }
                                            ></i>
                                        </DefaultTooltip>
                                    </div>
                                    <tr
                                        style={{
                                            display: 'block',
                                            marginLeft: '5px',
                                            marginBottom: '5px',
                                        }}
                                    >
                                        <Select
                                            options={this.cancerTypes.map(
                                                type => {
                                                    return {
                                                        value: type,
                                                        label: type,
                                                    };
                                                }
                                            )}
                                            data={this.state.tumorEntityItems}
                                            isMulti={true}
                                            defaultValue={this.state.tumorEntityItems.reduce(
                                                (list, entity) =>
                                                    list.concat([
                                                        {
                                                            value: entity,
                                                            label: entity,
                                                        },
                                                    ]),
                                                [] as Array<Object>
                                            )}
                                            name="entitySearch"
                                            className="basic-multi-select"
                                            classNamePrefix="select"
                                            placeholder="Select Tumor Entities..."
                                            onChange={(
                                                selectedOption: any[]
                                            ) => {
                                                const newEntities = [];
                                                if (selectedOption !== null) {
                                                    const entities = selectedOption.map(
                                                        option => option.value
                                                    );
                                                    newEntities.push(
                                                        ...entities
                                                    );
                                                }
                                                this.setState({
                                                    tumorEntityItems: newEntities,
                                                });

                                                console.group(
                                                    'TRIALS Entities Changed'
                                                );
                                                console.log(
                                                    this.state.tumorEntityItems
                                                );
                                                console.groupEnd();
                                            }}
                                        ></Select>
                                    </tr>
                                </td>
                            </tr>
                            <td width="50%">
                                <div className={styles.tooltipSpan}>
                                    <span className={styles.header5}>
                                        Recruitment Status:
                                    </span>
                                    <DefaultTooltip
                                        overlay={STATUS_TOOLTIP}
                                        trigger={['hover', 'focus']}
                                        destroyTooltipOnHide={true}
                                    >
                                        <i
                                            className={
                                                'fa fa-info-circle ' +
                                                styles.icon
                                            }
                                        ></i>
                                    </DefaultTooltip>
                                </div>
                                <tr
                                    style={{
                                        display: 'block',
                                        marginLeft: '5px',
                                        marginBottom: '5px',
                                    }}
                                >
                                    <ClinicalTrialMatchRecruitingSelect
                                        selected={this.state.recruitingItems}
                                        options={recruitingStatusOptions}
                                        isMulti
                                        name="recruitingStatusSearch"
                                        className="basic-multi-select"
                                        classNamePrefix="select"
                                        placeholder="Select status..."
                                        onChange={
                                            this.handleRecruitingStatusChange
                                        }
                                    />
                                </tr>
                            </td>
                            <td width="50%">
                                <div className={styles.tooltipSpan}>
                                    <span className={styles.header5}>
                                        Countries:
                                    </span>
                                    <DefaultTooltip
                                        overlay={COUNTRIES_TOOLTIP}
                                        trigger={['hover', 'focus']}
                                        destroyTooltipOnHide={true}
                                    >
                                        <i
                                            className={
                                                'fa fa-info-circle ' +
                                                styles.icon
                                            }
                                        ></i>
                                    </DefaultTooltip>
                                </div>
                                <tr
                                    style={{
                                        display: 'block',
                                        marginLeft: '5px',
                                        marginBottom: '5px',
                                    }}
                                >
                                    <ClinicalTrialMatchCountrySelect
                                        data={this.state.countryItems}
                                        options={[
                                            {
                                                label: 'country groups',
                                                options: this.countriesGroups.map(
                                                    (cnt: string) => ({
                                                        label: cnt,
                                                        value: cnt,
                                                    })
                                                ),
                                            },
                                            {
                                                label: 'countries',
                                                options: this.countries.map(
                                                    (cnt: string) => ({
                                                        label: cnt,
                                                        value: cnt,
                                                    })
                                                ),
                                            },
                                        ]}
                                        countryGroups={
                                            countriesGroups as Dict<string[]>
                                        }
                                        isMulti
                                        name="CountrySearch"
                                        className="basic-multi-select"
                                        classNamePrefix="select"
                                        placeholder="Select countries..."
                                        onChange={(
                                            selectedOption: Array<any>
                                        ) => {
                                            const newStatuses = [];
                                            if (selectedOption !== null) {
                                                const statuses = selectedOption;
                                                newStatuses.push(...statuses);
                                            }
                                            this.setState({
                                                countryItems: newStatuses,
                                            });
                                        }}
                                    />
                                </tr>
                            </td>
                            <tr>
                                <div className={styles.tooltipSpan}>
                                    <span className={styles.header5}>
                                        Patient Age:
                                    </span>
                                    <DefaultTooltip
                                        overlay={AGE_TOOLTIP}
                                        trigger={['hover', 'focus']}
                                        destroyTooltipOnHide={true}
                                    >
                                        <i
                                            className={
                                                'fa fa-info-circle ' +
                                                styles.icon
                                            }
                                        ></i>
                                    </DefaultTooltip>
                                </div>
                                <div
                                    style={{
                                        display: 'block',
                                        marginLeft: '5px',
                                        marginBottom: '5px',
                                    }}
                                >
                                    <ClinicalTrialMatchAgeSelect
                                        isMulti={false}
                                        placeholder="Select age..."
                                        onChange={(newValue: string) => {
                                            console.log(newValue);
                                            console.log(typeof newValue);
                                            if (
                                                newValue !== null &&
                                                this.state.ageState !== null
                                            ) {
                                                this.setState({
                                                    ageState: +parseInt(
                                                        newValue
                                                    ),
                                                });
                                            } else {
                                                this.setState({
                                                    ageState: 0,
                                                });
                                            }
                                        }}
                                        data={this.state.ageState}
                                    />
                                </div>
                                <td>
                                    <div className={styles.tooltipSpan}>
                                        <span className={styles.header5}>
                                            Patient Sex:
                                        </span>
                                        <DefaultTooltip
                                            overlay={SEX_TOOLTIP}
                                            trigger={['hover', 'focus']}
                                            destroyTooltipOnHide={true}
                                        >
                                            <i
                                                className={
                                                    'fa fa-info-circle ' +
                                                    styles.icon
                                                }
                                            ></i>
                                        </DefaultTooltip>
                                    </div>
                                    <tr
                                        style={{
                                            display: 'block',
                                            marginLeft: '5px',
                                            marginBottom: '5px',
                                        }}
                                    >
                                        <Select
                                            options={this.genders.map(
                                                gender => ({
                                                    label: gender,
                                                    value: gender,
                                                })
                                            )}
                                            name="genderSearch"
                                            defaultValue={
                                                this.state.gender
                                                    ? {
                                                          label: this.state
                                                              .gender,
                                                          value: this.state
                                                              .gender,
                                                      }
                                                    : null
                                            }
                                            className="basic-select"
                                            classNamePrefix="select"
                                            placeholder="Select gender..."
                                            onChange={(selectedOption: any) => {
                                                var newStatuses = '';
                                                if (selectedOption !== null) {
                                                    newStatuses =
                                                        selectedOption.value;
                                                }
                                                this.setState({
                                                    gender: newStatuses,
                                                });
                                            }}
                                        />
                                    </tr>
                                </td>
                            </tr>
                            <tr>
                                <td colSpan={2}>
                                    <div className={styles.tooltipSpan}>
                                        <span className={styles.header5}>
                                            Patient Location (city):
                                        </span>
                                        <DefaultTooltip
                                            overlay={LOCATION_TOOLTIP}
                                            trigger={['hover', 'focus']}
                                            destroyTooltipOnHide={true}
                                        >
                                            <i
                                                className={
                                                    'fa fa-info-circle ' +
                                                    styles.icon
                                                }
                                            ></i>
                                        </DefaultTooltip>
                                    </div>
                                    <tr
                                        style={{
                                            display: 'block',
                                            marginLeft: '5px',
                                            marginBottom: '5px',
                                        }}
                                    >
                                        <AsyncSelect
                                            defaultOptions={[
                                                {
                                                    label:
                                                        'Type for suggestions',
                                                    value:
                                                        'Type for suggestions',
                                                    disabled: true,
                                                },
                                            ]}
                                            loadOptions={(inputValue: string) =>
                                                new Promise(resolve =>
                                                    resolve(() => {
                                                        if (
                                                            inputValue &&
                                                            inputValue !== ''
                                                        ) {
                                                            return [
                                                                {
                                                                    label:
                                                                        'CITY, REGION, COUNTRY',
                                                                    options: this.locationsWithCoordinates
                                                                        .filter(
                                                                            value =>
                                                                                value.city_ascii
                                                                                    .toLowerCase()
                                                                                    .includes(
                                                                                        inputValue.toLowerCase()
                                                                                    )
                                                                        )
                                                                        .slice(
                                                                            0,
                                                                            30
                                                                        )
                                                                        .map(
                                                                            (
                                                                                city: any
                                                                            ) => {
                                                                                return {
                                                                                    label: [
                                                                                        city.city,
                                                                                        city.admin_name,
                                                                                        city.country,
                                                                                    ].join(
                                                                                        ', '
                                                                                    ),
                                                                                    value: city,
                                                                                };
                                                                            }
                                                                        ),
                                                                },
                                                            ];
                                                        } else {
                                                            return [
                                                                {
                                                                    label:
                                                                        'Type for suggestions',
                                                                    value:
                                                                        'Type for suggestions',
                                                                },
                                                            ];
                                                        }
                                                    })
                                                )
                                            }
                                            isClearable={true}
                                            isOptionDisabled={(option: {
                                                disabled: boolean;
                                            }) => option.disabled}
                                            name="locationDistance"
                                            className="basic-select"
                                            classNamePrefix="select"
                                            placeholder="Select patient location..."
                                            onChange={(selectedOption: any) => {
                                                if (selectedOption !== null) {
                                                    var city =
                                                        selectedOption.value;
                                                    this.setState({
                                                        patientLocation: city,
                                                    });
                                                }
                                            }}
                                            defaultValue={
                                                this.state.patientLocation !==
                                                    null &&
                                                this.state.patientLocation
                                                    .city !== ''
                                                    ? {
                                                          label: [
                                                              this.state
                                                                  .patientLocation
                                                                  .city,
                                                              this.state
                                                                  .patientLocation
                                                                  .admin_name,
                                                              this.state
                                                                  .patientLocation
                                                                  .country,
                                                          ].join(', '),
                                                          value: this.state
                                                              .patientLocation,
                                                      }
                                                    : []
                                            }
                                        />
                                    </tr>
                                </td>
                            </tr>
                            <td>
                                <tr>
                                    <td>
                                        <div className={styles.tooltipSpan}>
                                            <span className={styles.header5}>
                                                Maximum Distance:
                                            </span>
                                            <DefaultTooltip
                                                overlay={MAX_DISTANCE_TOOLTIP}
                                                trigger={['hover', 'focus']}
                                                destroyTooltipOnHide={true}
                                            >
                                                <i
                                                    className={
                                                        'fa fa-info-circle ' +
                                                        styles.icon
                                                    }
                                                ></i>
                                            </DefaultTooltip>
                                        </div>
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
                                                        checked={
                                                            this.state.isOpened
                                                        }
                                                        onChange={({
                                                            target: { checked },
                                                        }) =>
                                                            this.setState({
                                                                isOpened: checked,
                                                            })
                                                        }
                                                    />{' '}
                                                    Set maximum distance in km
                                                </label>
                                                <Collapse
                                                    isOpened={
                                                        this.state.isOpened
                                                    }
                                                >
                                                    <input
                                                        placeholder="Distance in km"
                                                        value={
                                                            this.state
                                                                .maxDistance
                                                        }
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
                                    </td>
                                </tr>
                            </td>
                        </div>
                    </React.Fragment>
                </Modal.Body>
                <Modal.Footer>
                    <div style={{ width: '20%', float: 'right' }}>
                        <button
                            onClick={() => {
                                this.setSearchParams();
                                this.props.onHide(false);
                            }}
                            className={'btn btn-default'}
                        >
                            Search
                        </button>
                    </div>
                </Modal.Footer>
            </Modal>
        );
    }
}

export default ClinicalTrialMatchTableOptions;
