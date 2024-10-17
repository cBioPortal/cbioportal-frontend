import { makeAutoObservable } from 'mobx';
import { DataBin } from 'pages/studyView/StudyViewUtils';
import {
    GenericAssayDataBin,
    GenericAssayData,
} from 'cbioportal-ts-api-client';
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
interface PatientData {
    [key: string]: { stableId: string; value: number }[];
}
interface ChartInfo {
    name: string;
    description: string;
    profileType: string;
    genericAssayType: string;
    dataType: string;
    genericAssayEntityId: string;
    patientLevel: boolean;
}
interface Entity {
    stableId: string;
}
interface SampleOption {
    value: string;
    label: string;
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

const colors = [
    '#00BCD4', // Cyan (High contrast, good accessibility)
    '#FF9800', // Orange (Warm, contrasting)
    '#A52A2A', // Maroon (Deep, high contrast)
    '#795548', // Brown (Earth tone, contrasts well with previous)
    '#27AE60', // Pink (Light, good contrast)
    '#E53935', // Green (Vibrant, contrasts with Pink)
    '#9C27B0', // Violet (Rich, unique hue)
    '#2986E2', // Blue (Calming, high contrast)
    '#FFEB3B', // Light Yellow (Light, good contrast with Blue)
    '#051288', // Red (Bold, contrasts well)
    '#008080', // Teal
    '#7a8376', // Greyish Green
];
class SingleCellStore {
    selectedOption: string = '';
    entityNames: string[] = [];
    molecularProfiles: Option[] = [];
    chartInfo: ChartInfo = {
        name: '',
        description: '',
        profileType: '',
        genericAssayType: '',
        dataType: '',
        genericAssayEntityId: '',
        patientLevel: false,
    };
    selectedEntity: Entity | null = null;
    dataBins: DataBin[] | null = null;
    chartType: string | null = null;
    pieChartData: GenericAssayData[] = [];
    tooltipEnabled: boolean = false;
    downloadSvg: boolean = false;
    downloadPdf: boolean = false;
    downloadOption: string = '';
    BarDownloadData: gaData[] = [];
    stackEntity: string = '';
    studyIdToStudy: string = '';
    hoveredSampleId: string = '';
    currentTooltipData: {
        [key: string]: { [key: string]: React.ReactNode };
    } = {};
    map: { [key: string]: string } = {};
    dynamicWidth: number = 0;
    increaseCount: number = 0;
    decreaseCount: number = 0;
    resizeEnabled: boolean = false;
    isHorizontal: boolean = false;
    isVisible: boolean = false;
    tooltipHovered: boolean = false;
    selectedSamples: SampleOption[] = [];
    dropdownOptions: SampleOption[] = [];
    isReverse: boolean = false;
    initialWidth: number = 0;
    heading: string = '';
    isHovered: boolean = false;
    hoveredSliceIndex: number = -1;
    stableIdBin: string = '';
    profileTypeBin: string = '';
    databinState: GenericAssayDataBin[] = [];

    constructor() {
        makeAutoObservable(this);
    }

    setSelectedOption(option: string) {
        this.selectedOption = option;
    }
    setEntityNames(names: string[]) {
        this.entityNames = names;
    }
    setMolecularProfiles(value: Option[]) {
        this.molecularProfiles = value;
    }
    setChartInfo(value: ChartInfo) {
        this.chartInfo = value;
    }
    setSelectedEntity(value: Entity | null) {
        this.selectedEntity = value;
    }
    setDataBins(value: DataBin[] | null) {
        this.dataBins = value;
    }
    setChartType(value: string | null) {
        this.chartType = value;
    }
    setPieChartData(value: GenericAssayData[]) {
        this.pieChartData = value;
    }
    setTooltipEnabled(value: boolean) {
        this.tooltipEnabled = value;
    }
    setDownloadSvg(value: boolean) {
        this.downloadSvg = value;
    }
    setDownloadPdf(value: boolean) {
        this.downloadPdf = value;
    }
    setDownloadOption(value: string) {
        this.downloadOption = value;
    }
    setBarDownloadData(value: gaData[]) {
        this.BarDownloadData = value;
    }
    setStackEntity(value: string) {
        this.stackEntity = value;
    }
    setStudyIdToStudy(value: string) {
        this.studyIdToStudy = value;
    }
    setHoveredSampleId(value: string) {
        this.hoveredSampleId = value;
    }
    setCurrentTooltipData(value: {
        [key: string]: { [key: string]: React.ReactNode };
    }) {
        this.currentTooltipData = value;
    }
    setMap(value: { [key: string]: string }) {
        this.map = value;
    }
    setDynamicWidth(value: number) {
        this.dynamicWidth = value;
    }
    setIncreaseCount(value: number) {
        this.increaseCount = value;
    }
    setDecreaseCount(value: number) {
        this.decreaseCount = value;
    }
    setResizeEnabled(value: boolean) {
        this.resizeEnabled = value;
    }
    setIsHorizontal(value: boolean) {
        this.isHorizontal = value;
    }
    setIsVisible(value: boolean) {
        this.isVisible = value;
    }
    setTooltipHovered(value: boolean) {
        this.tooltipHovered = value;
    }
    setSelectedSamples(value: SampleOption[]) {
        this.selectedSamples = value;
    }
    setDropdownOptions(value: SampleOption[]) {
        this.dropdownOptions = value;
    }
    setIsReverse(value: boolean) {
        this.isReverse = value;
    }
    setInitialWidth(value: number) {
        this.initialWidth = value;
    }
    setHeading(value: string) {
        this.heading = value;
    }
    setIsHovered(value: boolean) {
        this.isHovered = value;
    }
    setHoveredSliceIndex(value: number) {
        this.hoveredSliceIndex = value;
    }
    setStableIdBin(value: string) {
        this.stableIdBin = value;
    }
    setProfileTypeBin(value: string) {
        this.profileTypeBin = value;
    }
    setDatabinState(value: GenericAssayDataBin[]) {
        this.databinState = value;
    }
    increaseWidth() {
        this.dynamicWidth += 10;
        this.increaseCount += 1;
    }
    decreaseWidth() {
        this.dynamicWidth = Math.max(this.dynamicWidth - 10, this.initialWidth);
        this.decreaseCount += 1;
    }
    handleWidthChange(value: number) {
        this.dynamicWidth = Math.max(value, this.initialWidth);
    }
}

const singleCellStore = new SingleCellStore();
export { singleCellStore, colors, SampleOption, PatientData };
export default singleCellStore;
