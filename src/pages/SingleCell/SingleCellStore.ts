import { makeAutoObservable } from 'mobx';
import { DataBin } from 'pages/studyView/StudyViewUtils';
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
    pieChartData: any[] = [];
    tooltipEnabled: boolean = false;
    downloadSvg: boolean = false;
    downloadPdf: boolean = false;
    downloadOption: string = '';
    BarDownloadData: gaData[] = [];
    stackEntity: string = '';
    studyIdToStudy: string = '';
    hoveredSampleId: any = [];
    currentTooltipData: any = [];
    map: { [key: string]: string } = {};
    dynamicWidth: any = 0;
    increaseCount: any = 0;
    decreaseCount: any = 0;
    resizeEnabled: boolean = false;
    isHorizontal: boolean = false;
    isVisible: boolean = false;
    tooltipHovered: boolean = false;
    selectedSamples: any[] = [];
    dropdownOptions: any[] = [];
    isReverse: any = false;
    initialWidth: any = 0;
    heading: any = '';
    isHovered: boolean = false; // Changed to boolean and initialized to false
    hoveredSliceIndex: number = -1; // Changed to number and initialized to -1
    stableIdBin: any = '';
    profileTypeBin: any = '';
    databinState: any[] = [];

    constructor() {
        makeAutoObservable(this);
    }

    setSelectedOption(option: any) {
        this.selectedOption = option;
    }
    setEntityNames(names: any) {
        this.entityNames = names;
    }
    setMolecularProfiles(value: any) {
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
    setPieChartData(value: any) {
        this.pieChartData = value;
    }
    setTooltipEnabled(value: any) {
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
    setHoveredSampleId(value: any) {
        this.hoveredSampleId = value;
    }
    setCurrentTooltipData(value: any) {
        this.currentTooltipData = value;
    }
    setMap(value: { [key: string]: string }) {
        this.map = value;
    }
    setDynamicWidth(value: any) {
        this.dynamicWidth = value;
    }
    setIncreaseCount(value: any) {
        this.increaseCount = value;
    }
    setDecreaseCount(value: any) {
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
    setSelectedSamples(value: any[]) {
        this.selectedSamples = value;
    }
    setDropdownOptions(value: any[]) {
        this.dropdownOptions = value;
    }
    setIsReverse(value: any) {
        this.isReverse = value;
    }
    setInitialWidth(value: any) {
        this.initialWidth = value;
    }
    setHeading(value: any) {
        this.heading = value;
    }
    setIsHovered(value: boolean) {
        this.isHovered = value;
    }
    setHoveredSliceIndex(value: any) {
        this.hoveredSliceIndex = parseInt(value);
    }
    setStableIdBin(value: any) {
        this.stableIdBin = value;
    }
    setProfileTypeBin(value: any) {
        this.profileTypeBin = value;
    }
    setDatabinState(value: any[]) {
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
export { singleCellStore, colors };
export default singleCellStore;
