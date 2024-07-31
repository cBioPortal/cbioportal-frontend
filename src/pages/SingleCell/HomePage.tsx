import React, { Component, useRef } from 'react';
import _ from 'lodash';
// import Dropdown from 'react-bootstrap/Dropdown';
// import DropdownButton from 'react-bootstrap/DropdownButton';
import { toast, Zoom } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { Dropdown, DropdownButton } from 'react-bootstrap';
import {
    DataBinMethodConstants,
    StudyViewPageStore,
} from 'pages/studyView/StudyViewPageStore';
import autobind from 'autobind-decorator';
import Select from 'react-select';
import ReactSelect from 'react-select1';
import singleCellStore from './SingleCellStore';
import {
    ChartMeta,
    ChartMetaDataTypeEnum,
    convertGenericAssayDataBinsToDataBins,
    DataBin,
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
import PieToolTip from './PieToolTip';
import './styles.css';
import { selectable } from 'shared/components/query/styles/styles.module.scss';

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
    isReverse: any;
    initialWidth: any;
    heading: any;
    isHovered: any;
    hoveredSliceIndex: any;
    stableIdBin: any;
    profileTypeBin: any;
    databinState: any;
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
            isReverse: false,
            initialWidth: 0,
            heading: '',
            isHovered: false,
            hoveredSliceIndex: 0,
            profileTypeBin: '',
            stableIdBin: '',
            databinState: [],
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
        singleCellStore.setTooltipEnabled(event.target.checked);
        this.setState({ tooltipEnabled: event.target.checked });
    }
    @autobind
    handleReverseChange(event: React.ChangeEvent<HTMLInputElement>) {
        singleCellStore.setIsReverse(event.target.checked);
        this.setState({ isReverse: event.target.checked });
    }
    async fetchDataBins(genericAssayEntityId: string, profileType: string) {
        let temp = this.props.store.genericAssayProfileOptionsByType.result;
        let id = temp[profileType];
        let tempstudyId = id[0].value;
        singleCellStore.setHeading(profileType);
        singleCellStore.setStableIdBin(genericAssayEntityId);
        singleCellStore.setProfileTypeBin(tempstudyId);
        this.setState({ heading: profileType });
        this.setState({ stableIdBin: genericAssayEntityId });
        this.setState({ profileTypeBin: tempstudyId });
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
        const dataBins = convertGenericAssayDataBinsToDataBins(gaDataBins);
        this.setState({ databinState: dataBins });
        singleCellStore.setDataBins(dataBins);
        this.setState({ dataBins });
    }
    @autobind
    handleDownloadClick(event: React.ChangeEvent<HTMLSelectElement>) {
        const selectedOption = event.target.value;
        singleCellStore.setDownloadOption(selectedOption);
        this.setState({ downloadOption: selectedOption });
        if (selectedOption === 'svg') {
            singleCellStore.setDownloadSvg(true);
            this.setState({ downloadSvg: true });
        } else if (selectedOption === 'pdf') {
            singleCellStore.setDownloadPdf(true);
            this.setState({ downloadPdf: true });
        } else {
            singleCellStore.setDownloadSvg(false);
            singleCellStore.setDownloadPdf(false);
            this.setState({ downloadSvg: false });
            this.setState({ downloadPdf: false });
        }
    }
    @autobind
    async handleSelectChange(event: any) {
        this.setState({ stackEntity: '' });
        singleCellStore.setStackEntity('');
        const selectedValue = event.value;
        const studyId = 'gbm_cptac_2021';
        // const selectedProfile = this.state.molecularProfiles.find(
        //     profile => profile.value === selectedValue
        // );
        const selectedProfile = singleCellStore.molecularProfiles.find(
            profile => profile.value === selectedValue
        );
        singleCellStore.setChartType(null);
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
            singleCellStore.setEntityNames(names);
            this.setState({ entityNames: names, selectedEntity: null });

            this.retrieveAllProfiledSamples(selectedValue)
                .then(async MolecularProfileData => {
                    const extractedData: string[] = (
                        MolecularProfileData ?? []
                    ).map(({ sampleId }) => sampleId);
                    const pieChartData = await this.fetchGenericAssayData(
                        selectedValue,
                        names,
                        extractedData
                    );
                    singleCellStore.setPieChartData(pieChartData as any[]);
                    this.setState({ pieChartData: pieChartData as any[] });
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
            singleCellStore.setSelectedOption(selectedValue);
            this.setState(
                {
                    selectedOption: selectedValue,
                    chartInfo: newChartInfo,
                },

                async () => {
                    await this.fetchDataBins(
                        newChartInfo.genericAssayEntityId,
                        newChartInfo.profileType
                    );
                }
            );
        } else {
            singleCellStore.setSelectedOption(null);
            singleCellStore.setEntityNames([]);
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
    handleEntitySelectChangeStack(event: any) {
        singleCellStore.setStackEntity(event.value);
        this.setState({ stackEntity: event.value });
    }
    @autobind
    async handleEntitySelectChange(event: any) {
        const selectedEntityId = event.value;

        // const { selectedOption } = this.state;
        const selectedOption = singleCellStore.selectedOption;
        let studyId = '';
        const data = this.props.store.genericAssayProfiles.result;

        for (const item of data) {
            if (
                item.molecularAlterationType === 'GENERIC_ASSAY' &&
                item.genericAssayType.startsWith('SINGLE_CELL')
            ) {
                studyId = item.studyId; // Store the studyId in the variable
                break; // Exit the loop once the desired item is found
            }
        }

        const Molecularprofiles = await this.molecularProfiles([studyId]);
        const selectedMolecularProfile = Molecularprofiles.find(
            (profile: any) => profile.molecularProfileId === selectedOption
        );

        const BarchartDownloadData = await this.getGenericAssayDataAsClinicalData(
            selectedMolecularProfile,
            selectedEntityId
        );
        singleCellStore.setBarDownloadData(BarchartDownloadData);
        this.setState({ BarDownloadData: BarchartDownloadData });
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
    handleChartTypeChange(event: any) {
        singleCellStore.setChartType(event.value);
        singleCellStore.setStackEntity('');
        this.setState({ chartType: event.value, selectedEntity: null });
        this.setState({ stackEntity: '' });
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
                singleCellStore.setStudyIdToStudy(item.studyId);
                this.setState({ studyIdToStudy: item.studyId });
                studyId = item.studyId; // Store the studyId in the variable
                break; // Exit the loop once the desired item is found
            }
        }

        const Molecularprofiles = await this.molecularProfiles([studyId]);

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
        singleCellStore.setMolecularProfiles(molecularProfileOptions);
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

        if (_.isEmpty(molecularProfiles)) {
            return [];
        }
        const molecularProfileMapByStudyId = _.keyBy(
            molecularProfiles,
            molecularProfile => molecularProfile.studyId
        );
        const samples = this.props.store.samples.result;
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
    };

    decreaseWidth = () => {
        this.setState((prevState: any) => {
            const newWidth = Math.max(
                prevState.dynamicWidth - 10,
                prevState.initialWidth
            );

            if (newWidth === prevState.initialWidth) {
                const toastId = toast.loading('Processing...', {
                    theme: 'light',
                    position: 'top-center',
                    transition: Zoom,
                });
                setTimeout(() => {
                    toast.update(toastId, {
                        render: `Minimum ${
                            this.state.isHorizontal ? 'height' : 'width'
                        } limit reached`,
                        type: 'error',
                        theme: 'light',
                        isLoading: false,
                        position: 'top-center',
                        autoClose: 3500,
                        // closeButton: true
                    });
                }, 700);
                return null; // Prevent state update
            }

            return {
                dynamicWidth: newWidth,
                decreaseCount: prevState.decreaseCount + 1,
            };
        });
    };

    handleWidthChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const value = parseInt(event.target.value);
        singleCellStore.handleWidthChange(value);
        this.setState((prevState: any) => ({
            dynamicWidth: Math.max(value, prevState.initialWidth),
        }));
    };

    handleResizeCheckboxChange = (
        event: React.ChangeEvent<HTMLInputElement>
    ) => {
        singleCellStore.setResizeEnabled(event.target.checked);
        this.setState({ resizeEnabled: event.target.checked });
    };
    toggleAxes = (event: React.ChangeEvent<HTMLInputElement>) => {
        singleCellStore.setIsHorizontal(event.target.checked);
        this.setState({ isHorizontal: event.target.checked });
    };
    handleSampleSelectionChange = (selectedOptions: any) => {
        const selectedSampleIds = selectedOptions
            ? selectedOptions.map((option: any) => option.value)
            : [];
        singleCellStore.setSelectedSamples(selectedSampleIds);
        this.setState({ selectedSamples: selectedSampleIds });
    };
    render() {
        const {
            // selectedOption,
            // entityNames,
            // molecularProfiles,
            selectedEntity,
            selectedValue,
            // dataBins,
            // chartType,
            pieChartData,
            // tooltipEnabled,
            // downloadSvg,
            // downloadPdf,
            // BarDownloadData,
        } = this.state;
        const selectedOption = singleCellStore.selectedOption;
        const entityNames = singleCellStore.entityNames;
        const molecularProfiles = singleCellStore.molecularProfiles;
        const dataBins = singleCellStore.dataBins;
        const chartType = singleCellStore.chartType;
        // const pieChartData=singleCellStore.pieChartData
        const tooltipEnabled = singleCellStore.tooltipEnabled;
        const downloadSvg = singleCellStore.downloadSvg;
        const downloadPdf = singleCellStore.downloadPdf;
        const BarDownloadData = singleCellStore.BarDownloadData;

        const filteredOptions = molecularProfiles.filter(
            option =>
                option.profileType &&
                option.profileType.startsWith('SINGLE_CELL')
        );

        // Map filtered options to format expected by react-select

        const options = filteredOptions.map(option => ({
            value: option.value,
            label:
                option.label.length > 35
                    ? `${option.label.slice(0, 35)}...`
                    : option.label,
            title: option.label.length > 35 ? option.label : '',
            isDisabled: false,
            isHidden: false,
        }));

        return (
            <div className="home-page-container">
                <div className="chart-configurations">
                    <h2>Chart Configurations</h2>
                    <div>
                        {/* Dropdown for selecting molecular profile */}
                        <div className="dropdown-container">
                            <ReactSelect
                                value={selectedOption || ''}
                                onChange={this.handleSelectChange}
                                options={options}
                                placeholder="Select a single cell profile..."
                                clearable={false}
                                searchable={true}
                            />
                        </div>

                        {selectedOption && (
                            <div className="dropdown-container">
                                <ReactSelect
                                    id="chartTypeSelect"
                                    onChange={this.handleChartTypeChange}
                                    value={chartType}
                                    options={[
                                        { value: 'pie', label: 'Pie Chart' },
                                        { value: 'bar', label: 'Histogram' },
                                        {
                                            value: 'stack',
                                            label: 'Stacked Bar Chart',
                                        },
                                    ]}
                                    placeholder="Select type of chart..."
                                    isDisabled={!selectedOption} // Disable if selectedOption is falsy
                                    clearable={false}
                                    searchable={true}
                                />
                            </div>
                        )}

                        {/* Dropdown for selecting entity */}
                        {chartType === 'bar' && (
                            <div className="dropdown-container">
                                <ReactSelect
                                    id="entitySelect"
                                    // className="custom-dropdown"
                                    onChange={this.handleEntitySelectChange}
                                    value={
                                        selectedEntity
                                            ? {
                                                  value:
                                                      selectedEntity.stableId,
                                                  label: selectedEntity.stableId.replace(
                                                      /_/g,
                                                      ' '
                                                  ),
                                              }
                                            : ''
                                    }
                                    options={entityNames.map(entityName => ({
                                        value: entityName,
                                        label: entityName.replace(/_/g, ' '),
                                    }))}
                                    placeholder="Select cell type..."
                                    isDisabled={!selectedOption}
                                    clearable={false}
                                    searchable={true}
                                />
                            </div>
                        )}

                        {chartType === 'stack' && (
                            <div className="dropdown-container">
                                {/* <select
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
                                </select> */}
                                <ReactSelect
                                    id="entitySelect"
                                    // className="custom-dropdown"
                                    onChange={
                                        this.handleEntitySelectChangeStack
                                    }
                                    value={
                                        singleCellStore.stackEntity
                                            ? singleCellStore.stackEntity
                                            : ''
                                    }
                                    options={entityNames.map(entityName => ({
                                        value: entityName,
                                        label: entityName.replace(/_/g, ' '),
                                    }))}
                                    placeholder={
                                        selectedOption &&
                                        selectedOption.includes('type')
                                            ? 'Sort by cell type...'
                                            : selectedOption &&
                                              selectedOption.includes('cycle')
                                            ? 'Sort by cycle phase...'
                                            : 'Sort by ...'
                                    }
                                    isDisabled={!selectedOption}
                                    clearable={false}
                                    searchable={true}
                                />
                            </div>
                        )}

                        {chartType === 'pie' && (
                            <div className="checkbox-wrapper-3">
                                <input
                                    type="checkbox"
                                    id="cbx-3"
                                    checked={singleCellStore.tooltipEnabled}
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
                                        fontSize: '14px',
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
                                            fontSize: '14px',
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
                                        fontSize: '14px',
                                        marginLeft: '10px',
                                    }}
                                >
                                    Toggle axes
                                </label>
                            </div>
                        )}
                        {chartType == 'stack' &&
                            singleCellStore.stackEntity != '' && (
                                <div className="checkbox-wrapper-5">
                                    <input
                                        type="checkbox"
                                        id="cbx-5"
                                        checked={this.state.isReverse}
                                        onChange={this.handleReverseChange}
                                    />
                                    <label htmlFor="cbx-5" className="toggle">
                                        <span></span>
                                    </label>
                                    <label
                                        htmlFor="cbx-5"
                                        className="toggle-label"
                                        style={{
                                            fontWeight: 'normal',
                                            fontSize: '14px',
                                            marginLeft: '10px',
                                        }}
                                    >
                                        Reverse sort
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
                    className={chartType == 'bar' ? 'chart-display' : ''}
                    style={
                        chartType == 'stack'
                            ? {
                                  width: '52%',
                                  marginLeft: '5px',
                                  marginTop: '30px',
                              }
                            : chartType == 'pie'
                            ? {
                                  width: '48%',
                              }
                            : {}
                    }
                >
                    {chartType == 'stack' && (
                        <>
                            {/* <h2
                                style={{
                                    textAlign: 'center',
                                }}
                            >
                                {dataBins && dataBins.length > 0
                                    ? dataBins[0].id.replace(/_/g, ' ')
                                    : 'No Data'}
                            </h2> */}

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
                                          overflowX: this.state.isHorizontal
                                              ? 'hidden'
                                              : 'scroll',
                                          border: '1px dashed lightgrey',
                                          padding: '10px',
                                          marginTop: '20px',
                                          borderRadius: '5px',
                                          height: '720px',
                                          overflowY: this.state.isHorizontal
                                              ? 'scroll'
                                              : 'hidden',
                                      }
                                    : chartType == 'pie'
                                    ? {
                                          width: '100%',
                                          border: '1px dashed lightgrey',
                                          borderRadius: '5px',
                                          paddingRight: '5px',
                                          paddingBottom: '10px',
                                          marginLeft: '6px',
                                      }
                                    : {
                                          margin: '12px auto',
                                          border: '1px dashed lightgrey',
                                          borderRadius: '5px',
                                          padding: '10px',
                                          width: '600px',
                                      }
                            }
                        >
                            {/* <PieChart dataBins={dataBins} pieChartData={pieChartData} /> */}

                            {chartType === 'bar' ? (
                                <BarChart
                                    singleCellStore={singleCellStore}
                                    selectedEntity={this.state.selectedEntity}
                                    store={this.props.store}
                                    databinState={this.state.databinState}
                                    setDatabinState={(value: any) =>
                                        this.setState({ databinState: value })
                                    }
                                />
                            ) : chartType === 'pie' ? (
                                <PieChart singleCellStore={singleCellStore} />
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
                                        setInitialWidth={(value: any) =>
                                            this.setState({
                                                initialWidth: value,
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
                                        isReverse={this.state.isReverse}
                                    />
                                </>
                            ) : null}
                        </div>
                    )}
                </div>
                {chartType == 'stack' && (
                    <div
                        style={{
                            width: '25%',
                            marginTop: '85px',
                            marginLeft: '10px',
                            textAlign: 'center',
                        }}
                    >
                        <StackToolTip
                            studyIdToStudy={this.state.studyIdToStudy}
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
                {chartType == 'pie' && (
                    <div
                        style={{
                            width: '22%',
                            marginTop: '60px',
                            marginLeft: '20px',
                            textAlign: 'center',
                        }}
                    >
                        <PieToolTip singleCellStore={singleCellStore} />
                    </div>
                )}
            </div>
        );
    }
}

export default HomePage;
