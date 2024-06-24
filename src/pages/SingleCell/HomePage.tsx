import React, { Component, useRef } from 'react';
import _ from 'lodash';

import {
    DataBinMethodConstants,
    StudyViewPageStore,
} from 'pages/studyView/StudyViewPageStore';
import autobind from 'autobind-decorator';
import Select from 'react-select';
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
import StackedBarChart from './StackedBarChart';
import StackToolTip from './StackToolTip';
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

interface gaData {
    uniqueSampleKey: string;
    uniquePatientKey: string;
    molecularProfileId: string;
    sampleId: string;
    patientId: string;
    studyId: string;
    value: string;
    genericAssayStableId: string;
    stableId: string;
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
interface MolecularProfileDataItem {
    sampleId: string;
    // Add other properties if needed
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
    chartType: string | null;
    pieChartData: any[]; // State variable to hold the selected chart type
    tooltipEnabled: boolean;
    downloadSvg: boolean;
    downloadPdf: boolean;
    downloadOption: string;
    BarDownloadData: gaData[];
    stackEntity: any;
    studyIdToStudy: any;
    hoveredSampleId: any;
    currentTooltipData: any;
    map: { [key: string]: string };
    dynamicWidth: any;
    increaseCount: any;
    decreaseCount: any;
    resizeEnabled: boolean;
    isHorizontal: boolean;
    isVisible: boolean;
    tooltipHovered: boolean;
    selectedSamples: any;
    dropdownOptions: any;
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
            pieChartData: [],
            tooltipEnabled: false,
            downloadSvg: false,
            downloadPdf: false,
            downloadOption: '',
            BarDownloadData: [],
            stackEntity: '',
            studyIdToStudy: '',
            hoveredSampleId: [],
            currentTooltipData: [],
            map: {},
            dynamicWidth: 0,
            increaseCount: 0,
            decreaseCount: 0,
            resizeEnabled: false,
            isHorizontal: false,
            isVisible: false,
            tooltipHovered: false,
            selectedSamples: [],
            dropdownOptions: [],
        };
    }

    async fetchGenericAssayData(
        selectedValue: string,
        names: string[],
        sampleId: string[]
    ) {
        const { store } = this.props;
        const params = {
            molecularProfileId: selectedValue,
            genericAssayFilter: {
                genericAssayStableIds: names,
                sampleIds: sampleId,
            } as GenericAssayFilter,
        };

        try {
            const resp = await client.fetchGenericAssayDataInMolecularProfileUsingPOST(
                params
            );
            return resp;
        } catch (error) {
            console.error('Error fetching generic assay data', error);
        }
    }

    @autobind
    handleTooltipCheckboxChange(event: React.ChangeEvent<HTMLInputElement>) {
        this.setState({ tooltipEnabled: event.target.checked });
    }
    async fetchDataBins(genericAssayEntityId: string, profileType: string) {
        let temp = this.props.store.genericAssayProfileOptionsByType.result;
        console.log(temp, profileType, 'before id');
        let id = temp[profileType];
        let tempstudyId = id[0].value;
        console.log(id, tempstudyId, 'this is the id');
        console.log(
            genericAssayEntityId,
            profileType,
            'here are function parameters'
        );
        const { store } = this.props;
        const gaDataBins = await internalClient.fetchGenericAssayDataBinCountsUsingPOST(
            {
                dataBinMethod: DataBinMethodConstants.STATIC,
                genericAssayDataBinCountFilter: {
                    genericAssayDataBinFilters: [
                        {
                            stableId: genericAssayEntityId,
                            profileType: tempstudyId,
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
    handleDownloadClick(event: React.ChangeEvent<HTMLSelectElement>) {
        const selectedOption = event.target.value;
        this.setState({ downloadOption: selectedOption });
        if (selectedOption === 'svg') {
            this.setState({ downloadSvg: true });
        } else if (selectedOption === 'pdf') {
            this.setState({ downloadPdf: true });
        } else {
            this.setState({ downloadSvg: false });
            this.setState({ downloadPdf: false });
        }
    }
    @autobind
    async handleSelectChange(event: React.ChangeEvent<HTMLSelectElement>) {
        this.setState({ stackEntity: '' });
        console.log(this.state.entityNames, 'entityNames');
        const selectedValue = event.target.value;
        const studyId = 'gbm_cptac_2021';
        const selectedProfile = this.state.molecularProfiles.find(
            profile => profile.value === selectedValue
        );
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

            console.log(names, 'here are the names');
            this.retrieveAllProfiledSamples(selectedValue)
                .then(async MolecularProfileData => {
                    console.log(
                        MolecularProfileData,
                        'this is molecularProfileData'
                    );

                    const extractedData: string[] = (
                        MolecularProfileData ?? []
                    ).map(({ sampleId }) => sampleId);
                    const pieChartData = await this.fetchGenericAssayData(
                        selectedValue,
                        names,
                        extractedData
                    );
                    this.setState({ pieChartData: pieChartData as any[] });
                    console.log(extractedData, 'this is the extracted data');
                })
                .catch(error => {
                    console.error('Failed to fetch data:', error);
                });

            const newChartInfo = {
                name: '',
                description: selectedProfile.description,
                profileType: selectedProfile.profileType,
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
        console.log(this.state.entityNames, 'emtit');
    }
    @autobind
    handleEntitySelectChangeStack(event: React.ChangeEvent<HTMLSelectElement>) {
        this.setState({ stackEntity: event.target.value });
    }
    @autobind
    async handleEntitySelectChange(
        event: React.ChangeEvent<HTMLSelectElement>
    ) {
        const selectedEntityId = event.target.value;

        const { selectedOption } = this.state;
        let studyId = '';
        const data = this.props.store.genericAssayProfiles.result;

        for (const item of data) {
            if (
                item.molecularAlterationType === 'GENERIC_ASSAY' &&
                item.genericAssayType.startsWith('SINGLE_CELL')
            ) {
                console.log(item.studyId); // Log the studyId to console
                studyId = item.studyId; // Store the studyId in the variable
                break; // Exit the loop once the desired item is found
            }
        }

        const Molecularprofiles = await this.molecularProfiles([studyId]);
        const selectedMolecularProfile = Molecularprofiles.find(
            (profile: any) => profile.molecularProfileId === selectedOption
        );
        console.log(selectedMolecularProfile, 'here is the selected profile');

        const BarchartDownloadData = await this.getGenericAssayDataAsClinicalData(
            selectedMolecularProfile,
            selectedEntityId
        );
        this.setState({ BarDownloadData: BarchartDownloadData });
        console.log(BarchartDownloadData, 'hereisbarchartdownloaddata');

        console.log(
            selectedEntityId,
            selectedOption,
            'these are from entity change'
        );
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
        let studyId = 'gbm_cptac_2021';
        const data = this.props.store.genericAssayProfiles.result;

        for (const item of data) {
            if (
                item.molecularAlterationType === 'GENERIC_ASSAY' &&
                item.genericAssayType.startsWith('SINGLE_CELL')
            ) {
                console.log(item.studyId); // Log the studyId to console
                this.setState({ studyIdToStudy: item.studyId });
                studyId = item.studyId; // Store the studyId in the variable
                break; // Exit the loop once the desired item is found
            }
        }
        console.log('Found studyId:', studyId);

        const Molecularprofiles = await this.molecularProfiles([studyId]);

        console.log(Molecularprofiles, 'this is molecularprofiles');

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
    async getGenericAssayDataAsClinicalData(
        selectedMolecularProfiles: any,
        genericAssayEntityId: any
    ) {
        const molecularProfiles = { 0: selectedMolecularProfiles };

        console.log(molecularProfiles, 'molecularprof');
        if (_.isEmpty(molecularProfiles)) {
            return [];
        }
        const molecularProfileMapByStudyId = _.keyBy(
            molecularProfiles,
            molecularProfile => molecularProfile.studyId
        );
        const samples = this.props.store.samples.result;
        console.log(samples, 'here are samples');
        const filteredSamples = samples.filter(
            (sample: any) => sample.studyId in molecularProfileMapByStudyId
        );
        const sampleMolecularIdentifiers = filteredSamples.map(
            (sample: any) => ({
                sampleId: sample.sampleId,
                molecularProfileId:
                    molecularProfileMapByStudyId[sample.studyId]
                        .molecularProfileId,
            })
        );
        console.log(
            genericAssayEntityId,
            sampleMolecularIdentifiers,
            'SAMPLEMOL'
        );
        const gaDataList = await client.fetchGenericAssayDataInMultipleMolecularProfilesUsingPOST(
            {
                projection: 'DETAILED',
                genericAssayDataMultipleStudyFilter: {
                    genericAssayStableIds: [genericAssayEntityId],
                    sampleMolecularIdentifiers: sampleMolecularIdentifiers,
                } as GenericAssayDataMultipleStudyFilter,
            }
        );
        return gaDataList;
    }
    async retrieveAllProfiledSamples(
        selectedValue: string
    ): Promise<MolecularProfileDataItem[]> {
        let data = await client.fetchGenePanelDataInMultipleMolecularProfilesUsingPOST(
            {
                genePanelDataMultipleStudyFilter: {
                    molecularProfileIds: [selectedValue],
                } as GenePanelDataMultipleStudyFilter,
            }
        );
        console.log('all the profiles are here', data);

        // Assuming 'data' is the array of 'MolecularProfileDataItem'
        return data as MolecularProfileDataItem[];
    }

    truncateOptionLabel(label: string) {
        const words = label.split(' ');
        if (words.length > 3) {
            return `${words.slice(0, 3).join(' ')}...`;
        } else {
            return label;
        }
    }
    increaseWidth = () => {
        this.setState((prevState: any) => ({
            dynamicWidth: prevState.dynamicWidth + 10,
            increaseCount: prevState.increaseCount + 1,
        }));
        console.log(`Width increased: ${this.state.increaseCount + 1}`);
    };

    decreaseWidth = () => {
        this.setState((prevState: any) => ({
            dynamicWidth: prevState.dynamicWidth - 10,
            decreaseCount: prevState.decreaseCount + 1,
        }));
        console.log(`Width decreased: ${this.state.decreaseCount + 1}`);
    };
    handleWidthChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const value = parseInt(event.target.value);
        this.setState({ dynamicWidth: value });
    };
    handleResizeCheckboxChange = (
        event: React.ChangeEvent<HTMLInputElement>
    ) => {
        this.setState({ resizeEnabled: event.target.checked });
    };
    toggleAxes = (event: React.ChangeEvent<HTMLInputElement>) => {
        this.setState({ isHorizontal: event.target.checked });
    };
    handleSampleSelectionChange = (selectedOptions: any) => {
        const selectedSampleIds = selectedOptions
            ? selectedOptions.map((option: any) => option.value)
            : [];
        this.setState({ selectedSamples: selectedSampleIds });
        console.log(selectedSampleIds);
    };
    render() {
        const {
            selectedOption,
            entityNames,
            molecularProfiles,
            selectedEntity,
            selectedValue,
            dataBins,
            chartType,
            pieChartData,
            tooltipEnabled,
            downloadSvg,
            downloadPdf,
            BarDownloadData,
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

                                {molecularProfiles.map(option => {
                                    // Check if option.profileType exists and starts with "SINGLE_CELL"
                                    if (
                                        option.profileType &&
                                        option.profileType.startsWith(
                                            'SINGLE_CELL'
                                        )
                                    ) {
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
                                                    option.label.length > 35
                                                        ? option.label
                                                        : ''
                                                }
                                            >
                                                {option.label.length > 35
                                                    ? option.label.slice(
                                                          0,
                                                          35
                                                      ) + '...'
                                                    : option.label}
                                            </option>
                                        );
                                    } else {
                                        return null; // If profileType is undefined or does not start with "SINGLE_CELL", don't render anything
                                    }
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
                        {chartType === 'bar' && (
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
                                    disabled={!selectedOption}
                                >
                                    <option value="" disabled hidden>
                                        Select cell type...
                                    </option>
                                    {entityNames.map(entityName => (
                                        <option
                                            key={entityName}
                                            value={entityName}
                                        >
                                            {entityName.replace(/_/g, ' ')}
                                        </option>
                                    ))}
                                </select>
                                {console.log(entityNames, 'hereareentitynames')}
                            </div>
                        )}

                        {chartType === 'stack' && (
                            <div className="dropdown-container">
                                <select
                                    id="entitySelect"
                                    className="custom-dropdown"
                                    onChange={
                                        this.handleEntitySelectChangeStack
                                    }
                                    value={
                                        this.state.stackEntity
                                            ? this.state.stackEntity
                                            : ''
                                    }
                                    disabled={!selectedOption}
                                >
                                    <option value="" disabled hidden>
                                        {selectedOption &&
                                        selectedOption.includes('type')
                                            ? 'Sort by cell type...'
                                            : selectedOption &&
                                              selectedOption.includes('cycle')
                                            ? 'Sort by cycle phase...'
                                            : 'Sort by ...'}
                                    </option>
                                    {entityNames.map(entityName => (
                                        <option
                                            key={entityName}
                                            value={entityName}
                                        >
                                            {entityName.replace(/_/g, ' ')}
                                        </option>
                                    ))}
                                </select>
                                {console.log(entityNames, 'hereareentitynames')}
                            </div>
                        )}

                        {chartType === 'pie' && (
                            <div className="checkbox-wrapper-3">
                                <input
                                    type="checkbox"
                                    id="cbx-3"
                                    checked={tooltipEnabled}
                                    onChange={this.handleTooltipCheckboxChange}
                                />
                                <label htmlFor="cbx-3" className="toggle">
                                    <span></span>
                                </label>
                                <label
                                    htmlFor="cbx-3"
                                    className="toggle-label"
                                    style={{
                                        fontWeight: 'normal',
                                        fontSize: '15px',
                                        marginLeft: '10px',
                                    }}
                                >
                                    Show the data table
                                </label>
                            </div>
                        )}
                        {chartType === 'stack' && (
                            <>
                                <div className="checkbox-wrapper-3">
                                    <input
                                        type="checkbox"
                                        id="cbx-3"
                                        checked={this.state.resizeEnabled}
                                        onChange={
                                            this.handleResizeCheckboxChange
                                        }
                                    />
                                    <label htmlFor="cbx-3" className="toggle">
                                        <span></span>
                                    </label>
                                    <label
                                        htmlFor="cbx-3"
                                        className="toggle-label"
                                        style={{
                                            fontWeight: 'normal',
                                            fontSize: '15px',
                                            marginLeft: '10px',
                                        }}
                                    >
                                        Resize Graph
                                    </label>
                                </div>
                            </>
                        )}
                        {chartType == 'stack' && (
                            <div className="checkbox-wrapper-4">
                                <input
                                    type="checkbox"
                                    id="cbx-4"
                                    checked={this.state.isHorizontal}
                                    onChange={this.toggleAxes}
                                />
                                <label htmlFor="cbx-4" className="toggle">
                                    <span></span>
                                </label>
                                <label
                                    htmlFor="cbx-4"
                                    className="toggle-label"
                                    style={{
                                        fontWeight: 'normal',
                                        fontSize: '15px',
                                        marginLeft: '10px',
                                    }}
                                >
                                    Toggle axes
                                </label>
                            </div>
                        )}
                        {chartType === 'stack' && this.state.resizeEnabled && (
                            <div className="throttle-container">
                                <label className="throttle-label">
                                    {this.state.isHorizontal
                                        ? 'Height:'
                                        : 'Width:'}
                                </label>

                                <button
                                    className="throttle-button"
                                    onClick={this.decreaseWidth}
                                >
                                    -
                                </button>
                                <input
                                    type="number"
                                    className="throttle-input"
                                    value={this.state.dynamicWidth}
                                    onChange={this.handleWidthChange}
                                    min="10"
                                    max="100"
                                />
                                <button
                                    className="throttle-button"
                                    onClick={this.increaseWidth}
                                >
                                    +
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                <div
                    className={chartType != 'stack' ? 'chart-display' : ''}
                    style={
                        chartType == 'stack'
                            ? {
                                  width: '55%',
                                  marginLeft: '5px',
                                  marginTop: '30px',
                              }
                            : {}
                    }
                >
                    {chartType == 'stack' && (
                        <>
                            <h2
                                style={{
                                    textAlign: 'center',
                                }}
                            >
                                {dataBins && dataBins.length > 0
                                    ? dataBins[0].id.replace(/_/g, ' ')
                                    : 'No Data'}
                            </h2>

                            <Select
                                placeholder="Select SampleId.."
                                options={this.state.dropdownOptions}
                                isMulti
                                onChange={this.handleSampleSelectionChange}
                                value={this.state.selectedSamples.map(
                                    (sampleId: any) => ({
                                        value: sampleId,
                                        label: sampleId,
                                    })
                                )}
                                style={{
                                    padding: '10px',
                                    marginTop: '5px',
                                    marginBottom: '5px',
                                    width: '350px',
                                }}
                            />
                        </>
                    )}

                    {/* Display fetched data bins */}
                    {dataBins && (
                        <div
                            className="custom-scrollbar"
                            style={
                                chartType == 'stack'
                                    ? {
                                          width: '100%',
                                          overflowX: 'scroll',
                                          height: '700px',
                                          overflowY: 'scroll',
                                      }
                                    : {
                                          margin: '12px auto',
                                          width: '600px',
                                      }
                            }
                        >
                            {/* <PieChart dataBins={dataBins} pieChartData={pieChartData} /> */}

                            {chartType === 'bar' ? (
                                <BarChart
                                    dataBins={dataBins}
                                    downloadData={BarDownloadData}
                                />
                            ) : chartType === 'pie' ? (
                                <PieChart
                                    dataBins={dataBins}
                                    pieChartData={pieChartData}
                                    tooltipEnabled={tooltipEnabled}
                                    downloadSvg={downloadSvg}
                                    downloadPdf={downloadPdf}
                                    setDownloadSvg={(value: any) =>
                                        this.setState({ downloadSvg: value })
                                    }
                                    setDownloadPdf={(value: any) =>
                                        this.setState({ downloadPdf: value })
                                    }
                                />
                            ) : chartType === 'stack' ? (
                                <>
                                    <StackedBarChart
                                        dataBins={dataBins}
                                        pieChartData={pieChartData}
                                        stackEntity={this.state.stackEntity}
                                        studyIdToStudy={
                                            this.state.studyIdToStudy
                                        }
                                        hoveredSampleId={
                                            this.state.hoveredSampleId
                                        }
                                        setHoveredSampleId={(value: any) =>
                                            this.setState({
                                                hoveredSampleId: value,
                                            })
                                        }
                                        currentTooltipData={
                                            this.state.currentTooltipData
                                        }
                                        setCurrentTooltipData={(value: any) =>
                                            this.setState({
                                                currentTooltipData: value,
                                            })
                                        }
                                        map={this.state.map}
                                        setMap={(value: any) =>
                                            this.setState({ map: value })
                                        }
                                        dynamicWidth={this.state.dynamicWidth}
                                        setDynamicWidth={(value: any) =>
                                            this.setState({
                                                dynamicWidth: value,
                                            })
                                        }
                                        isHorizontal={this.state.isHorizontal}
                                        setIsHorizontal={(value: any) =>
                                            this.setState({
                                                isHorizontal: value,
                                            })
                                        }
                                        isVisible={this.state.isVisible}
                                        setIsVisible={(value: any) =>
                                            this.setState({ isVisible: value })
                                        }
                                        tooltipHovered={
                                            this.state.tooltipHovered
                                        }
                                        setTooltipHovered={(value: any) =>
                                            this.setState({
                                                tooltipHovered: value,
                                            })
                                        }
                                        selectedSamples={
                                            this.state.selectedSamples
                                        }
                                        setSelectedSamples={(value: any) => {
                                            this.setState({
                                                selectedSamples: value,
                                            });
                                        }}
                                        dropdownOptions={
                                            this.state.dropdownOptions
                                        }
                                        setDropdownOptions={(value: any) => {
                                            this.setState({
                                                dropdownOptions: value,
                                            });
                                        }}
                                    />
                                </>
                            ) : null}
                        </div>
                    )}
                </div>
                {chartType == 'stack' && (
                    <div
                        style={{
                            width: '22%',
                            marginTop: '100px',
                            marginLeft: '5px',
                        }}
                    >
                        <StackToolTip
                            hoveredSampleId={this.state.hoveredSampleId}
                            setHoveredSampleId={(value: any) =>
                                this.setState({ hoveredSampleId: value })
                            }
                            currentTooltipData={this.state.currentTooltipData}
                            setCurrentTooltipData={(value: any) =>
                                this.setState({ currentTooltipData: value })
                            }
                            map={this.state.map}
                            setMap={(value: any) =>
                                this.setState({ map: value })
                            }
                            isVisible={this.state.isVisible}
                            setIsVisible={(value: any) =>
                                this.setState({ isVisible: value })
                            }
                            tooltipHovered={this.state.tooltipHovered}
                            setTooltipHovered={(value: any) =>
                                this.setState({ tooltipHovered: value })
                            }
                        />
                    </div>
                )}
            </div>
        );
    }
}

export default HomePage;
