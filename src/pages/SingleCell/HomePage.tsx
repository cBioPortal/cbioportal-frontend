import React, { Component } from 'react';
import {
    DataBinMethodConstants,
    StudyViewPageStore,
} from 'pages/studyView/StudyViewPageStore';
import autobind from 'autobind-decorator';
import {
    ChartMeta,
    ChartMetaDataTypeEnum,
    convertGenericAssayDataBinsToDataBins,
} from 'pages/studyView/StudyViewUtils';
import internalClient from 'shared/api/cbioportalInternalClientInstance';
import client from 'shared/api/cbioportalClientInstance';
import {
    GenePanelDataMultipleStudyFilter,
    MolecularProfileFilter,
    GenericAssayMetaFilter,
    GenericAssayMeta,
    GenericAssayDataMultipleStudyFilter,
    GenericAssayFilter,
} from 'cbioportal-ts-api-client';
import PieChart from './PieChart';
import BarChart from './BarChart';
import './styles.css';

interface Option {
    value: string;
    label: string;
    description: string;
    profileType: string;
    genericAssayType: string;
    dataType: string;
    genericAssayEntityId: string;
    patientLevel: boolean;
}

interface ProfileOptions {
    [key: string]: Option[];
}

interface Entity {
    stableId: string;
}

interface DataBin {
    id: string;
    count: number;
    end?: number;
    start?: number;
    specialValue?: string;
}

interface HomePageProps {
    store: StudyViewPageStore; // Assuming StudyViewPageStore is the type of your store
}

interface HomePageState {
    selectedOption: string | null;
    entityNames: string[];
    molecularProfiles: Option[];
    chartInfo: {
        name: string;
        description: string;
        profileType: string;
        genericAssayType: string;
        dataType: string;
        genericAssayEntityId: string;
        patientLevel: boolean;
    };
    selectedEntity: Entity | null;
    selectedValue: string | null; // Added selectedValue to store the selected molecular profile
    dataBins: DataBin[] | null; // State variable to hold data bins
    chartType: string | null; // State variable to hold the selected chart type
}

class HomePage extends Component<HomePageProps, HomePageState> {
    constructor(props: HomePageProps) {
        super(props);
        this.state = {
            selectedOption: null,
            entityNames: [],
            molecularProfiles: [],
            chartInfo: {
                name: '',
                description: '',
                profileType: '',
                genericAssayType: '',
                dataType: '',
                genericAssayEntityId: '',
                patientLevel: false,
            },
            selectedEntity: null,
            selectedValue: null, // Initialize selectedValue as null
            dataBins: null, // Initialize dataBins as null
            chartType: null, // Initialize chartType as null
        };
    }
    async fetchGenericAssayData() {
        const { store } = this.props;

        // Hardcoded parameters
        const params = {
            molecularProfileId: 'gbm_cptac_2021_single_cell_type_fractions',
            genericAssayFilter: {
                genericAssayStableIds: ['Macrophage'],
                sampleListId: 'gbm_cptac_2021_cnaseq',
            } as GenericAssayFilter,
        };

        try {
            // Fetching data using the provided API method and hardcoded parameters
            const resp = await client.fetchGenericAssayDataInMolecularProfileUsingPOST(
                params
            );
            console.log(
                resp,
                'response from fetchGenericAssayDataInMolecularProfileUsingPOST'
            );
        } catch (error) {
            console.error('Error fetching generic assay data', error);
        }
    }

    async fetchDataBins(genericAssayEntityId: string, profileType: string) {
        const { store } = this.props;
        const gaDataBins = await internalClient.fetchGenericAssayDataBinCountsUsingPOST(
            {
                dataBinMethod: DataBinMethodConstants.STATIC,
                genericAssayDataBinCountFilter: {
                    genericAssayDataBinFilters: [
                        {
                            stableId: genericAssayEntityId,
                            profileType: profileType,
                        },
                    ] as any,
                    studyViewFilter: store.filters,
                },
            }
        );
        console.log(gaDataBins, 'gaDataBins');
        const dataBins = convertGenericAssayDataBinsToDataBins(gaDataBins);
        console.log(dataBins, 'convertedDataBins');

        // Update the dataBins state with fetched data
        this.setState({ dataBins });
    }

    @autobind
    async handleSelectChange(event: React.ChangeEvent<HTMLSelectElement>) {
        const selectedValue = event.target.value;
        const selectedProfile = this.state.molecularProfiles.find(
            profile => profile.value === selectedValue
        );

        // Store the selectedValue in the state
        this.setState({ selectedValue, chartType: null, selectedEntity: null });

        if (selectedProfile) {
            const { store } = this.props;
            const entities =
                store.genericAssayEntitiesGroupedByProfileId.result;
            let entityName = '';
            let entityId = '';

            const entityArray = entities
                ? entities[selectedProfile.genericAssayEntityId]
                : [];
            const names = entityArray.map((entity: any) => entity.stableId);
            this.setState({ entityNames: names, selectedEntity: null });

            const newChartInfo = {
                name: '',
                description: selectedProfile.description,
                profileType: selectedProfile.profileType.toLowerCase(),
                genericAssayType: selectedProfile.genericAssayType,
                dataType: selectedProfile.dataType,
                genericAssayEntityId: selectedProfile.genericAssayEntityId,
                patientLevel: selectedProfile.patientLevel,
            };

            this.setState(
                {
                    selectedOption: selectedValue,
                    chartInfo: newChartInfo,
                },
                async () => {
                    console.log(this.state.chartInfo);
                    await this.fetchDataBins(
                        newChartInfo.genericAssayEntityId,
                        newChartInfo.profileType
                    );
                }
            );
        } else {
            this.setState({
                selectedOption: null,
                entityNames: [],
                chartInfo: {
                    ...this.state.chartInfo,
                    name: '',
                    description: '',
                    profileType: '',
                    genericAssayType: '',
                    dataType: '',
                    genericAssayEntityId: '',
                    patientLevel: false,
                },
            });
        }
    }

    @autobind
    async handleEntitySelectChange(
        event: React.ChangeEvent<HTMLSelectElement>
    ) {
        const selectedEntityId = event.target.value;
        const { selectedOption } = this.state;
        const { store } = this.props;

        if (
            selectedOption &&
            store.genericAssayEntitiesGroupedByProfileId &&
            store.genericAssayEntitiesGroupedByProfileId.result
        ) {
            const newSelectedEntity = store.genericAssayEntitiesGroupedByProfileId.result[
                selectedOption
            ].find((entity: any) => entity.stableId === selectedEntityId);

            if (newSelectedEntity) {
                this.setState(
                    { selectedEntity: newSelectedEntity },
                    async () => {
                        // Log the selected entity's stableId
                        console.log(
                            'Selected entity stableId:',
                            newSelectedEntity.stableId
                        );

                        // Update chartInfo with the new entity
                        this.setState(
                            prevState => ({
                                chartInfo: {
                                    ...prevState.chartInfo,
                                    name: newSelectedEntity.stableId,
                                    genericAssayEntityId:
                                        newSelectedEntity.stableId,
                                },
                            }),
                            async () => {
                                await this.fetchDataBins(
                                    newSelectedEntity.stableId,
                                    this.state.chartInfo.profileType
                                );
                            }
                        );
                    }
                );
            } else {
                // Handle the case when newSelectedEntity is undefined or null
                console.error('Selected entity is invalid.');
            }
        }
    }

    @autobind
    handleChartTypeChange(event: React.ChangeEvent<HTMLSelectElement>) {
        this.setState({ chartType: event.target.value, selectedEntity: null });
    }

    async componentDidMount() {
        const { store } = this.props;
        const studyId = 'gbm_cptac_2021';
        const Molecularprofiles = await this.molecularProfiles([studyId]);
        console.log(Molecularprofiles, 'this is molecularprofiles');
        this.fetchGenericAssayData();
        this.retrieveAllProfiledSamples();
        const molecularProfileOptions = Molecularprofiles.map(
            (profile: any) => ({
                value: profile.molecularProfileId,
                label: profile.name,
                description: profile.description,
                profileType: profile.genericAssayType,
                genericAssayType: profile.genericAssayType,
                dataType: profile.datatype,
                genericAssayEntityId: profile.molecularProfileId,
                patientLevel: profile.patientLevel,
            })
        );

        console.log(molecularProfileOptions, 'hereistheanswer');
        this.setState({ molecularProfiles: molecularProfileOptions });
    }

    async molecularProfiles(studyIds: string[]) {
        let profiles = await client.fetchMolecularProfilesUsingPOST({
            molecularProfileFilter: {
                studyIds: studyIds,
            } as MolecularProfileFilter,
        });

        return profiles;
    }

    async retrieveAllProfiledSamples() {
        let data = await client.fetchGenePanelDataInMultipleMolecularProfilesUsingPOST(
            {
                genePanelDataMultipleStudyFilter: {
                    molecularProfileIds: [
                        'gbm_cptac_2021_single_cell_cycle_phases',
                    ],
                } as GenePanelDataMultipleStudyFilter,
            }
        );
        console.log('all the profiles are here', data);
        return data;
    }

    truncateOptionLabel(label: string) {
        const words = label.split(' ');
        if (words.length > 3) {
            return `${words.slice(0, 3).join(' ')}...`;
        } else {
            return label;
        }
    }

    render() {
        const {
            selectedOption,
            entityNames,
            molecularProfiles,
            selectedEntity,
            selectedValue,
            dataBins,
            chartType,
        } = this.state;

        return (
            <div className="home-page-container">
                {console.log(this.props.store, 'this is tore')}
                <div className="chart-configurations">
                    <h2>Chart Configurations</h2>
                    <div>
                        {/* Dropdown for selecting molecular profile */}
                        <div className="dropdown-container">
                            <select
                                id="molecularProfileSelect"
                                className="custom-dropdown"
                                onChange={this.handleSelectChange}
                                value={selectedOption || ''}
                            >
                                <option value="" disabled hidden>
                                    Select a Molecular Profile...
                                </option>
                                {console.log(molecularProfiles, 'sdas')}
                                {console.log(selectedOption, 'sdas2')}

                                {molecularProfiles
                                    .filter(
                                        option =>
                                            option.label ===
                                                'Single cell - cell type assignment fractions' ||
                                            option.label ===
                                                'Single cell - cell cycle phase values'
                                    )
                                    .map(option => {
                                        const updatedLabel =
                                            option.label ===
                                            'Single cell - cell type assignment fractions'
                                                ? 'Single Cell Type Fractions'
                                                : 'Single Cell Cycle Phases';

                                        return (
                                            <option
                                                key={option.value}
                                                value={option.value}
                                                className="custom-option"
                                                style={{
                                                    padding: '10px',
                                                    fontSize: '16px',
                                                    cursor: 'pointer',
                                                    transition:
                                                        'background-color 0.3s',
                                                    color: 'black', // Text color
                                                    backgroundColor: 'inherit', // Background color
                                                }}
                                                title={
                                                    updatedLabel.length > 50
                                                        ? updatedLabel
                                                        : ''
                                                }
                                            >
                                                {updatedLabel.length > 50
                                                    ? updatedLabel.slice(
                                                          0,
                                                          50
                                                      ) + '...'
                                                    : updatedLabel}
                                            </option>
                                        );
                                    })}
                            </select>
                        </div>

                        {/* Dropdown for selecting chart type */}
                        <div className="dropdown-container">
                            <select
                                id="chartTypeSelect"
                                className="custom-dropdown"
                                onChange={this.handleChartTypeChange}
                                value={chartType || ''}
                                disabled={!selectedOption}
                            >
                                <option value="" disabled hidden>
                                    Select type of chart...
                                </option>
                                <option value="pie">Pie Chart</option>
                                <option value="bar">Bar Chart</option>
                                <option value="stack">Stacked Bar Chart</option>
                            </select>
                        </div>

                        {/* Dropdown for selecting entity */}
                        <div className="dropdown-container">
                            <select
                                id="entitySelect"
                                className="custom-dropdown"
                                onChange={this.handleEntitySelectChange}
                                value={
                                    selectedEntity
                                        ? selectedEntity.stableId
                                        : ''
                                }
                                disabled={
                                    !selectedOption || chartType !== 'bar'
                                }
                            >
                                <option value="" disabled hidden>
                                    Select cell type...
                                </option>
                                {entityNames.map(entityName => (
                                    <option key={entityName} value={entityName}>
                                        {entityName.replace(/_/g, ' ')}
                                    </option>
                                ))}
                            </select>
                            {console.log(entityNames, 'hereareentitynames')}
                        </div>
                    </div>
                </div>

                <div className="chart-display">
                    {/* Display fetched data bins */}
                    {dataBins && (
                        <div style={{ width: '600px', margin: '12px auto' }}>
                            {chartType === 'bar' ? (
                                <BarChart dataBins={dataBins} />
                            ) : chartType === 'piet' ? (
                                <PieChart dataBins={dataBins} />
                            ) : null}
                        </div>
                    )}
                </div>
            </div>
        );
    }
}

export default HomePage;
