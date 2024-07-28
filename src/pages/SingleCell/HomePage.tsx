import React, { Component, useRef } from 'react';
import _ from 'lodash';
// import Dropdown from 'react-bootstrap/Dropdown';
// import DropdownButton from 'react-bootstrap/DropdownButton';
import { Dropdown, DropdownButton } from 'react-bootstrap';
import {
    DataBinMethodConstants,
    StudyViewPageStore,
} from 'pages/studyView/StudyViewPageStore';
import autobind from 'autobind-decorator';
import Select from 'react-select';
import ReactSelect from 'react-select1';
import { ToastContainer, toast, Zoom } from 'react-toastify';
import {
    ChartMeta,
    ChartMetaDataTypeEnum,
    convertGenericAssayDataBinsToDataBins,
} from 'pages/studyView/StudyViewUtils';
import internalClient from 'shared/api/cbioportalInternalClientInstance';
import jsondata from './jsonData/sample.json';
import client from 'shared/api/cbioportalClientInstance';
import 'react-toastify/dist/ReactToastify.css';
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
import BoxPlot from './BoxPlot';
import './styles.css';
import LoadingIndicator from 'shared/components/loadingIndicator/LoadingIndicator';

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
    isReverse: any;
    initialWidth: any;
    heading: any;
    isHovered: any;
    hoveredSliceIndex: any;
    stableIdBin: any;
    profileTypeBin: any;
    databinState: any;
    selectedIdBox: any;
    selectedKeyBox: any;
    selectedNestedKeyBox: any;
    optionsIdBox: any;
    optionsKeyBox: any;
    optionsNestedKeyBox: any;
    selectedObjectBox: any;
    selectedGene: any;
    transformedData: any;
    boxPlotData: any;
    scatterColor: string;
    loader: boolean;
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
            selectedIdBox: null,
            selectedKeyBox: null,
            selectedNestedKeyBox: null,
            optionsIdBox: Object.keys(jsondata),
            optionsKeyBox: [],
            optionsNestedKeyBox: [],
            selectedObjectBox: null,
            selectedGene: null,
            transformedData: [],
            boxPlotData: [],
            scatterColor: 'Default',
            loader: false,
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
    @autobind
    handleReverseChange(event: React.ChangeEvent<HTMLInputElement>) {
        this.setState({ isReverse: event.target.checked });
    }
    async fetchDataBins(genericAssayEntityId: string, profileType: string) {
        let temp = this.props.store.genericAssayProfileOptionsByType.result;
        console.log(temp, profileType, 'before id');
        let id = temp[profileType];
        let tempstudyId = id[0].value;
        this.setState({ heading: profileType });
        this.setState({ stableIdBin: genericAssayEntityId });
        this.setState({ profileTypeBin: tempstudyId });
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
        this.setState({ databinState: dataBins });
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
    async handleSelectChange(event: any) {
        console.log('i am claed', event);
        this.setState({ stackEntity: '' });
        console.log(this.state.entityNames, 'entityNames');
        const selectedValue = event.value;
        if (event.value == 'gene_expression') {
            this.setState({ selectedValue: selectedValue });
            this.setState({ selectedOption: selectedValue });

            console.log(
                selectedValue,
                this.state.selectedValue,
                'selectedoptionss'
            );
        } else {
            console.log(event.value, 'this is event.target.value');
            const studyId = 'gbm_cptac_2021';
            const selectedProfile = this.state.molecularProfiles.find(
                profile => profile.value === selectedValue
            );
            this.setState({
                selectedValue,
                chartType: null,
                selectedEntity: null,
            });

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
                        console.log(
                            extractedData,
                            'this is the extracted data'
                        );
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
    }

    @autobind
    handleEntitySelectChangeStack(event: any) {
        this.setState({ stackEntity: event.value });
    }
    @autobind
    async handleEntitySelectChange(event: any) {
        const selectedEntityId = event.value;

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
    handleColorChange(selectedColorOption: any) {
        this.setState({ scatterColor: selectedColorOption.value });
    }
    @autobind
    handleChartTypeChange(event: any) {
        const { selectedOption } = this.state;
        if (event.value !== 'box' && !selectedOption) {
            const toastId = toast.loading('Validating chart type...', {
                theme: 'light',
                position: 'top-center',
                transition: Zoom,
            });

            setTimeout(() => {
                toast.update(toastId, {
                    render: 'Please select a Molecular Profile first',
                    type: 'error',
                    isLoading: false,
                    autoClose: 5000,
                });
            }, 1000);

            return;
        }
        this.setState({
            chartType: event.value,
            selectedEntity: null,
            stackEntity: '',
        });
    }
    handleIdChangeBox = (selectedOption: any) => {
        const selectedIdBox = selectedOption.value;
        const optionsKeyBox = Object.keys(jsondata[selectedIdBox]).map(key => ({
            value: key,
            label: key,
        }));
        this.setState({
            selectedIdBox,
            optionsKeyBox,
            selectedKeyBox: null,
            optionsNestedKeyBox: [],
            selectedNestedKeyBox: null,
            selectedObjectBox: null,
        });
    };
    addJitter = (x: number) => {
        const jitterAmount = 0.4; // Adjust this value as needed
        return x + (Math.random() * jitterAmount - jitterAmount / 2);
    };
    handleKeyChangeBox = (selectedOption: any) => {
        const selectedKeyBox = selectedOption.value;
        const { selectedIdBox } = this.state;
        const optionsNestedKeyBox = Object.keys(
            jsondata[selectedIdBox][selectedKeyBox]
        ).map(key => ({
            value: key,
            label: key,
        }));
        this.setState({
            selectedKeyBox,
            optionsNestedKeyBox,
            selectedNestedKeyBox: null,
            selectedObjectBox: null,
        });
    };
    handleGeneChange = (selectedOption: any) => {
        this.setState({ loader: true });
        const selectedGene = selectedOption.value;

        if (selectedGene && this.state.transformedData[selectedGene]) {
            // Group by cellname for the selected gene
            const groupedByCellname = this.state.transformedData[
                selectedGene
            ].reduce((acc: any, tuple: any) => {
                const { cellname, ...rest } = tuple;
                if (!acc[cellname]) {
                    acc[cellname] = [];
                }
                acc[cellname].push(rest);
                return acc;
            }, {});

            // Add 'x' property to each element based on the cellname index
            let cellIndex = 1;
            for (let cellname in groupedByCellname) {
                groupedByCellname[cellname] = groupedByCellname[cellname].map(
                    (item: any) => ({
                        ...item,
                        x: this.addJitter(cellIndex),
                    })
                );
                cellIndex++;
            }

            console.log(
                `Data for gene '${selectedGene}' grouped by cellname:`,
                groupedByCellname
            );

            // Update selectedGene state
            this.setState({ selectedGene });
            this.setState({ boxPlotData: groupedByCellname });
        } else {
            console.log(`Gene '${selectedGene}' not found in the data.`);
        }
        this.setState({ loader: false });
    };

    handleNestedKeyChangeBox = (selectedOption: any) => {
        const selectedNestedKeyBox = selectedOption.value;
        const { selectedIdBox, selectedKeyBox } = this.state;
        const selectedObjectBox =
            jsondata[selectedIdBox][selectedKeyBox][selectedNestedKeyBox];
        console.log(selectedObjectBox);
        this.setState({ selectedNestedKeyBox, selectedObjectBox });
    };
    async componentDidMount() {
        this.setState({ loader: true });
        const { store } = this.props;
        let studyId = 'gbm_cptac_2021';
        const data = this.props.store.genericAssayProfiles.result;
        console.log(jsondata, 'hereisdataatata');

        let transformedData: any = {};

        let colorPalette: string[] = [
            '#FF5733',
            '#33FFB8',
            '#336BFF',
            '#FF33E8',
            '#33FFA1',
            '#FF3333',
            '#33B8FF',
            '#FFC733',
            '#E833FF',
            '#33FFD7',
            '#A133FF',
            '#FF33A8',
            '#33FF4D',
            '#FF7F33',
            '#5B33FF',
            '#FF33B3',
            '#33FF70',
            '#FFA333',
            '#4D33FF',
            '#FF33FF',
            '#33FF33',
            '#FF5733',
            '#33FFB8',
            '#336BFF',
            '#FF33E8',
            '#33FFA1',
            '#FF3333',
            '#33B8FF',
            '#FFC733',
            '#E833FF',
            '#33FFD7',
            '#A133FF',
            '#FF33A8',
            '#33FF4D',
            '#FF7F33',
            '#5B33FF',
            '#FF33B3',
            '#33FF70',
            '#FFA333',
            '#4D33FF',
            '#FF33FF',
            '#33FF33',
        ];
        let colorPalettebw: string[] = ['#57ABF9'];
        let strokeColorPalette: string[] = [
            '#B33F26',
            '#26B388',
            '#263C99',
            '#B326A3',
            '#26B36D',
            '#B32626',
            '#2699B3',
            '#B38A26',
            '#A326B3',
            '#26B393',
            '#7126B3',
            '#B3266D',
            '#26B33A',
            '#B35A26',
            '#3F26B3',
            '#B32674',
            '#26B348',
            '#B37426',
            '#3A26B3',
            '#B326B3',
            '#26B326',
            '#B33F26',
            '#26B388',
            '#263C99',
            '#B326A3',
            '#26B36D',
            '#B32626',
            '#2699B3',
            '#B38A26',
            '#A326B3',
            '#26B393',
            '#7126B3',
            '#B3266D',
            '#26B33A',
            '#B35A26',
            '#3F26B3',
            '#B32674',
            '#26B348',
            '#B37426',
            '#3A26B3',
            '#B326B3',
            '#26B326',
        ];
        let strokeColorPalettebw: string[] = ['#4B95D7'];
        let tissueColorPalette: string[] = [
            '#FF8A33',
            '#33FFEC',
            '#3380FF',
            '#FF33B0',
            '#33FF80',
            '#FF3344',
            '#33C2FF',
            '#FFD133',
            '#E883FF',
            '#33FFE8',
            '#B833FF',
            '#FF33DC',
            '#33FF72',
            '#FF8C33',
            '#6733FF',
            '#FF33C1',
            '#33FF6A',
            '#FFC233',
            '#6733FF',
            '#FF33FF',
            '#33FF38',
            '#FF8A33',
            '#33FFEC',
            '#3380FF',
            '#FF33B0',
            '#33FF80',
            '#FF3344',
            '#33C2FF',
            '#FFD133',
            '#E883FF',
            '#33FFE8',
            '#B833FF',
            '#FF33DC',
            '#33FF72',
            '#FF8C33',
            '#6733FF',
            '#FF33C1',
            '#33FF6A',
            '#FFC233',
            '#6733FF',
            '#FF33FF',
            '#33FF38',
        ];
        let tissueStrokeColorPalette: string[] = [
            '#B35A33',
            '#26B3A0',
            '#2662B3',
            '#B32686',
            '#26B346',
            '#B3263A',
            '#266CB3',
            '#B39726',
            '#A326B3',
            '#26B3AA',
            '#6E26B3',
            '#B32693',
            '#26B350',
            '#B35F26',
            '#5126B3',
            '#B3268C',
            '#26B360',
            '#B38226',
            '#3926B3',
            '#B326B3',
            '#26B32E',
            '#B35A33',
            '#26B3A0',
            '#2662B3',
            '#B32686',
            '#26B346',
            '#B3263A',
            '#266CB3',
            '#B39726',
            '#A326B3',
            '#26B3AA',
            '#6E26B3',
            '#B32693',
            '#26B350',
            '#B35F26',
            '#5126B3',
            '#B3268C',
            '#26B360',
            '#B38226',
            '#3926B3',
            '#B326B3',
            '#26B32E',
        ];
        let tissueColorMapping: { [key: string]: string } = {};
        let tissueStrokeColorMapping: { [key: string]: string } = {};

        Object.keys(jsondata).forEach(sampleKey => {
            const sample = jsondata[sampleKey];

            Object.keys(sample).forEach(tissueKey => {
                const tissue = sample[tissueKey];

                Object.keys(tissue).forEach(cellTypeKey => {
                    const cellType = tissue[cellTypeKey];

                    Object.keys(cellType).forEach(geneName => {
                        const value = cellType[geneName];

                        const tuple = {
                            value: value,
                            cellname: cellTypeKey,
                            tissuename: tissueKey,
                            parentId: sampleKey,
                            color: '', // Placeholder for color assignment
                            bwColor: '', // Placeholder for bwColor assignment
                            bwStrokeColor: '', // Placeholder for bwStrokeColor assignment
                            strokeColor: '',
                            tissueColor: '', // Placeholder for tissue color assignment
                            tissueStrokeColor: '', // Placeholder for tissue stroke color assignment
                        };

                        if (!transformedData[geneName]) {
                            transformedData[geneName] = [];
                        }

                        // Check if parentId already has a color assigned
                        const existingTuple = transformedData[geneName].find(
                            (t: any) => t.parentId === sampleKey
                        );
                        if (existingTuple) {
                            tuple.color = existingTuple.color;
                            tuple.strokeColor = existingTuple.strokeColor;
                            tuple.bwColor = existingTuple.bwColor;
                            tuple.bwStrokeColor = existingTuple.bwStrokeColor;
                        } else {
                            // Assign a new color from the palette
                            tuple.color =
                                colorPalette[
                                    transformedData[geneName].length %
                                        colorPalette.length
                                ];
                            tuple.strokeColor =
                                strokeColorPalette[
                                    transformedData[geneName].length %
                                        strokeColorPalette.length
                                ];
                            tuple.bwColor =
                                colorPalettebw[
                                    transformedData[geneName].length %
                                        colorPalettebw.length
                                ];
                            tuple.bwStrokeColor =
                                strokeColorPalettebw[
                                    transformedData[geneName].length %
                                        strokeColorPalettebw.length
                                ];
                        }

                        // Assign tissue color
                        if (tissueColorMapping[tissueKey]) {
                            tuple.tissueColor = tissueColorMapping[tissueKey];
                        } else {
                            const tissueColor =
                                tissueColorPalette[
                                    Object.keys(tissueColorMapping).length %
                                        tissueColorPalette.length
                                ];
                            tissueColorMapping[tissueKey] = tissueColor;
                            tuple.tissueColor = tissueColor;
                        }

                        // Assign tissue stroke color
                        if (tissueStrokeColorMapping[tissueKey]) {
                            tuple.tissueStrokeColor =
                                tissueStrokeColorMapping[tissueKey];
                        } else {
                            const tissueStrokeColor =
                                tissueStrokeColorPalette[
                                    Object.keys(tissueStrokeColorMapping)
                                        .length %
                                        tissueStrokeColorPalette.length
                                ];
                            tissueStrokeColorMapping[
                                tissueKey
                            ] = tissueStrokeColor;
                            tuple.tissueStrokeColor = tissueStrokeColor;
                        }

                        transformedData[geneName].push(tuple);
                    });
                });
            });
        });

        this.setState({ transformedData });

        console.log(transformedData, 'genenames', jsondata);
        const geneToSelect = 'CSF3R';

        if (transformedData[geneToSelect]) {
            // Group by cellname
            const groupedByCellname = transformedData[geneToSelect].reduce(
                (acc: any, tuple: any) => {
                    const { cellname, ...rest } = tuple;
                    if (!acc[cellname]) {
                        acc[cellname] = [];
                    }
                    acc[cellname].push(rest);
                    return acc;
                },
                {}
            );

            console.log(
                `Data for gene '${geneToSelect}' grouped by cellname:`,
                groupedByCellname
            );
        } else {
            console.log(`Gene '${geneToSelect}' not found in the data.`);
        }
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

        this.setState({ loader: false });
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
        this.setState((prevState: any) => ({
            dynamicWidth: Math.max(value, prevState.initialWidth),
        }));
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
            optionsIdBox,
            optionsKeyBox,
            optionsNestedKeyBox,
            selectedIdBox,
            selectedKeyBox,
            selectedNestedKeyBox,
            transformedData,
        } = this.state;
        const geneOptions = Object.keys(transformedData).map(gene => ({
            value: gene,
            label: gene,
        }));
        const filteredOptions = molecularProfiles.filter(
            option =>
                option.profileType &&
                option.profileType.startsWith('SINGLE_CELL')
        );

        // Map filtered options to format expected by react-select
        const options = [
            {
                value: 'gene_expression',
                label: 'Gene Expression',
                title: 'Gene Expression',
                isDisabled: false,
                isHidden: false,
            }, // Default option
            ...filteredOptions.map(option => ({
                value: option.value,
                label:
                    option.label.length > 35
                        ? `${option.label.slice(0, 35)}...`
                        : option.label,
                title: option.label.length > 35 ? option.label : '',
                isDisabled: false,
                isHidden: false,
            })),
        ];
        const chartOptions =
            this.state.selectedOption === 'gene_expression'
                ? [{ value: 'box', label: 'Box Plot' }]
                : [
                      { value: 'pie', label: 'Pie Chart' },
                      { value: 'bar', label: 'Histogram' },
                      { value: 'stack', label: 'Stacked Bar Chart' },
                  ];

        return (
            <>
                {this.state.loader == true ? (
                    <>
                        <LoadingIndicator
                            isLoading={true}
                            center={true}
                            size={'big'}
                        />
                    </>
                ) : (
                    <div className="home-page-container">
                        {console.log(this.props.store, 'this is tore')}
                        <div className="chart-configurations">
                            <h2>Chart Configurations</h2>
                            <div>
                                {/* Dropdown for selecting molecular profile */}
                                <div className="dropdown-container">
                                    <ReactSelect
                                        value={selectedOption || ''}
                                        onChange={this.handleSelectChange}
                                        options={options}
                                        placeholder="Select a Molecular Profile..."
                                        clearable={false}
                                        searchable={true}
                                    />
                                </div>

                                {selectedOption && (
                                    <div className="dropdown-container">
                                        <ReactSelect
                                            id="chartTypeSelect"
                                            onChange={
                                                this.handleChartTypeChange
                                            }
                                            value={chartType}
                                            options={chartOptions}
                                            placeholder="Select type of chart..."
                                            // Disable if selectedOption is falsy
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
                                            onChange={
                                                this.handleEntitySelectChange
                                            }
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
                                            options={entityNames.map(
                                                entityName => ({
                                                    value: entityName,
                                                    label: entityName.replace(
                                                        /_/g,
                                                        ' '
                                                    ),
                                                })
                                            )}
                                            placeholder="Select cell type..."
                                            isDisabled={!selectedOption}
                                            clearable={false}
                                            searchable={true}
                                        />

                                        {console.log(
                                            entityNames,
                                            'hereareentitynames'
                                        )}
                                    </div>
                                )}
                                {chartType === 'box' && (
                                    <div>
                                        <div className="dropdown-container">
                                            <ReactSelect
                                                id="geneSelect"
                                                onChange={this.handleGeneChange}
                                                value={
                                                    this.state.selectedGene
                                                        ? {
                                                              value: this.state
                                                                  .selectedGene,
                                                              label: this.state
                                                                  .selectedGene,
                                                          }
                                                        : null
                                                }
                                                options={geneOptions}
                                                placeholder="Select a gene..."
                                                isClearable={true}
                                                isSearchable={true}
                                            />
                                        </div>
                                        {this.state.selectedGene && (
                                            <div className="dropdown-container">
                                                <ReactSelect
                                                    id="colorBySelect"
                                                    onChange={
                                                        this.handleColorChange
                                                    }
                                                    value={
                                                        this.state.scatterColor
                                                            ? {
                                                                  value: this
                                                                      .state
                                                                      .scatterColor,
                                                                  label:
                                                                      this.state
                                                                          .scatterColor ==
                                                                      'Default'
                                                                          ? 'Default color'
                                                                          : `Color by ${this.state.scatterColor}`,
                                                              }
                                                            : null
                                                    }
                                                    options={[
                                                        {
                                                            value: 'sample id',
                                                            label:
                                                                'Color by sample id',
                                                        },
                                                        {
                                                            value:
                                                                'tissue name',
                                                            label:
                                                                'Color by tissue',
                                                        },
                                                        {
                                                            value: 'Default',
                                                            label: 'Default',
                                                        },
                                                    ]}
                                                    placeholder="Color by..."
                                                    clearable={false}
                                                    searchable={true}
                                                />
                                            </div>
                                        )}

                                        {selectedIdBox && (
                                            <div className="dropdown-container">
                                                <ReactSelect
                                                    id="keySelectBox"
                                                    onChange={
                                                        this.handleKeyChangeBox
                                                    }
                                                    value={
                                                        selectedKeyBox
                                                            ? {
                                                                  value: selectedKeyBox,
                                                                  label: selectedKeyBox,
                                                              }
                                                            : ''
                                                    }
                                                    options={optionsKeyBox}
                                                    placeholder="Select Key..."
                                                    isDisabled={!selectedIdBox}
                                                />
                                            </div>
                                        )}

                                        {selectedKeyBox && (
                                            <div className="dropdown-container">
                                                <ReactSelect
                                                    id="nestedKeySelectBox"
                                                    onChange={
                                                        this
                                                            .handleNestedKeyChangeBox
                                                    }
                                                    value={
                                                        selectedNestedKeyBox
                                                            ? {
                                                                  value: selectedNestedKeyBox,
                                                                  label: selectedNestedKeyBox,
                                                              }
                                                            : ''
                                                    }
                                                    options={
                                                        optionsNestedKeyBox
                                                    }
                                                    placeholder="Select Nested Key..."
                                                    isDisabled={!selectedKeyBox}
                                                />
                                            </div>
                                        )}
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
                                                this
                                                    .handleEntitySelectChangeStack
                                            }
                                            value={
                                                this.state.stackEntity
                                                    ? this.state.stackEntity
                                                    : ''
                                            }
                                            options={entityNames.map(
                                                entityName => ({
                                                    value: entityName,
                                                    label: entityName.replace(
                                                        /_/g,
                                                        ' '
                                                    ),
                                                })
                                            )}
                                            placeholder={
                                                selectedOption &&
                                                selectedOption.includes('type')
                                                    ? 'Sort by cell type...'
                                                    : selectedOption &&
                                                      selectedOption.includes(
                                                          'cycle'
                                                      )
                                                    ? 'Sort by cycle phase...'
                                                    : 'Sort by ...'
                                            }
                                            isDisabled={!selectedOption}
                                            clearable={false}
                                            searchable={true}
                                        />
                                        {console.log(
                                            entityNames,
                                            'hereareentitynames'
                                        )}
                                    </div>
                                )}

                                {chartType === 'pie' && (
                                    <div className="checkbox-wrapper-3">
                                        <input
                                            type="checkbox"
                                            id="cbx-3"
                                            checked={tooltipEnabled}
                                            onChange={
                                                this.handleTooltipCheckboxChange
                                            }
                                        />
                                        <label
                                            htmlFor="cbx-3"
                                            className="toggle"
                                        >
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
                                                checked={
                                                    this.state.resizeEnabled
                                                }
                                                onChange={
                                                    this
                                                        .handleResizeCheckboxChange
                                                }
                                            />
                                            <label
                                                htmlFor="cbx-3"
                                                className="toggle"
                                            >
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
                                        <label
                                            htmlFor="cbx-4"
                                            className="toggle"
                                        >
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
                                    this.state.stackEntity != '' && (
                                        <div className="checkbox-wrapper-5">
                                            <input
                                                type="checkbox"
                                                id="cbx-5"
                                                checked={this.state.isReverse}
                                                onChange={
                                                    this.handleReverseChange
                                                }
                                            />
                                            <label
                                                htmlFor="cbx-5"
                                                className="toggle"
                                            >
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
                                {chartType === 'stack' &&
                                    this.state.resizeEnabled && (
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
                                                onChange={
                                                    this.handleWidthChange
                                                }
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
                            className={
                                chartType == 'bar' ? 'chart-display' : ''
                            }
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
                                    : chartType == 'box'
                                    ? {
                                          width: '78%',
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
                                        onChange={
                                            this.handleSampleSelectionChange
                                        }
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
                            {((dataBins && chartType != 'box') ||
                                chartType == 'box') && (
                                <div
                                    className="custom-scrollbar"
                                    style={
                                        chartType == 'stack'
                                            ? {
                                                  width: '100%',
                                                  overflowX: this.state
                                                      .isHorizontal
                                                      ? 'hidden'
                                                      : 'scroll',
                                                  border:
                                                      '1px dashed lightgrey',
                                                  padding: '10px',
                                                  marginTop: '20px',
                                                  borderRadius: '5px',
                                                  height: '700px',
                                                  overflowY: this.state
                                                      .isHorizontal
                                                      ? 'scroll'
                                                      : 'hidden',
                                              }
                                            : chartType == 'pie'
                                            ? {
                                                  width: '100%',
                                                  border:
                                                      '1px dashed lightgrey',
                                                  borderRadius: '5px',
                                                  paddingRight: '5px',
                                                  paddingBottom: '10px',
                                                  marginLeft: '6px',
                                              }
                                            : chartType == 'box'
                                            ? {
                                                  width: '100%',
                                                  border:
                                                      '1px dashed lightgrey',
                                                  padding: '10px',
                                                  marginTop: '20px',
                                                  marginLeft: '10px',
                                                  borderRadius: '5px',
                                                  height: '700px',
                                                  overflow: 'scroll',
                                              }
                                            : {
                                                  margin: '12px auto',
                                                  border:
                                                      '1px dashed lightgrey',
                                                  borderRadius: '5px',
                                                  padding: '10px',
                                                  width: '600px',
                                              }
                                    }
                                >
                                    {/* <PieChart dataBins={dataBins} pieChartData={pieChartData} /> */}

                                    {chartType === 'bar' ? (
                                        <BarChart
                                            dataBins={dataBins ? dataBins : []}
                                            selectedEntity={
                                                this.state.selectedEntity
                                            }
                                            downloadData={BarDownloadData}
                                            heading={this.state.heading}
                                            profileTypeBin={
                                                this.state.profileTypeBin
                                            }
                                            stableIdBin={this.state.stableIdBin}
                                            store={this.props.store}
                                            databinState={
                                                this.state.databinState
                                            }
                                            setDatabinState={(value: any) =>
                                                this.setState({
                                                    databinState: value,
                                                })
                                            }
                                        />
                                    ) : chartType === 'pie' ? (
                                        <PieChart
                                            dataBins={dataBins ? dataBins : []}
                                            pieChartData={pieChartData}
                                            tooltipEnabled={tooltipEnabled}
                                            downloadSvg={downloadSvg}
                                            downloadPdf={downloadPdf}
                                            setDownloadSvg={(value: any) =>
                                                this.setState({
                                                    downloadSvg: value,
                                                })
                                            }
                                            setDownloadPdf={(value: any) =>
                                                this.setState({
                                                    downloadPdf: value,
                                                })
                                            }
                                            isHovered={this.state.isHovered}
                                            setIsHovered={(value: any) =>
                                                this.setState({
                                                    isHovered: value,
                                                })
                                            }
                                            hoveredSliceIndex={
                                                this.state.hoveredSliceIndex
                                            }
                                            setHoveredSliceIndex={(
                                                value: any
                                            ) =>
                                                this.setState({
                                                    hoveredSliceIndex: value,
                                                })
                                            }
                                            heading={this.state.heading}
                                        />
                                    ) : chartType === 'stack' ? (
                                        <>
                                            <StackedBarChart
                                                dataBins={
                                                    dataBins ? dataBins : []
                                                }
                                                pieChartData={pieChartData}
                                                stackEntity={
                                                    this.state.stackEntity
                                                }
                                                studyIdToStudy={
                                                    this.state.studyIdToStudy
                                                }
                                                hoveredSampleId={
                                                    this.state.hoveredSampleId
                                                }
                                                setHoveredSampleId={(
                                                    value: any
                                                ) =>
                                                    this.setState({
                                                        hoveredSampleId: value,
                                                    })
                                                }
                                                currentTooltipData={
                                                    this.state
                                                        .currentTooltipData
                                                }
                                                setCurrentTooltipData={(
                                                    value: any
                                                ) =>
                                                    this.setState({
                                                        currentTooltipData: value,
                                                    })
                                                }
                                                map={this.state.map}
                                                setMap={(value: any) =>
                                                    this.setState({
                                                        map: value,
                                                    })
                                                }
                                                dynamicWidth={
                                                    this.state.dynamicWidth
                                                }
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
                                                isHorizontal={
                                                    this.state.isHorizontal
                                                }
                                                setIsHorizontal={(value: any) =>
                                                    this.setState({
                                                        isHorizontal: value,
                                                    })
                                                }
                                                isVisible={this.state.isVisible}
                                                setIsVisible={(value: any) =>
                                                    this.setState({
                                                        isVisible: value,
                                                    })
                                                }
                                                tooltipHovered={
                                                    this.state.tooltipHovered
                                                }
                                                setTooltipHovered={(
                                                    value: any
                                                ) =>
                                                    this.setState({
                                                        tooltipHovered: value,
                                                    })
                                                }
                                                selectedSamples={
                                                    this.state.selectedSamples
                                                }
                                                setSelectedSamples={(
                                                    value: any
                                                ) => {
                                                    this.setState({
                                                        selectedSamples: value,
                                                    });
                                                }}
                                                dropdownOptions={
                                                    this.state.dropdownOptions
                                                }
                                                setDropdownOptions={(
                                                    value: any
                                                ) => {
                                                    this.setState({
                                                        dropdownOptions: value,
                                                    });
                                                }}
                                                isReverse={this.state.isReverse}
                                            />
                                        </>
                                    ) : chartType === 'box' &&
                                      this.state.selectedGene ? (
                                        <>
                                            <BoxPlot
                                                data={this.state.boxPlotData}
                                                scatterColor={
                                                    this.state.scatterColor
                                                }
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
                                <PieToolTip
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
                                    heading={this.state.heading}
                                    isHovered={this.state.isHovered}
                                    setIsHovered={(value: any) =>
                                        this.setState({ isHovered: value })
                                    }
                                    hoveredSliceIndex={
                                        this.state.hoveredSliceIndex
                                    }
                                    setHoveredSliceIndex={(value: any) =>
                                        this.setState({
                                            hoveredSliceIndex: value,
                                        })
                                    }
                                />
                            </div>
                        )}
                    </div>
                )}
            </>
        );
    }
}

export default HomePage;
