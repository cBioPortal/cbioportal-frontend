import * as React from 'react';
import { observer, Observer } from 'mobx-react';
import { Button, ButtonGroup } from 'react-bootstrap';
import CustomDropdown from './CustomDropdown';
import ReactSelect from 'react-select1';
import { MobxPromise } from 'mobxpromise';
import {
    action,
    computed,
    IObservableObject,
    observable,
    ObservableMap,
    reaction,
    toJS,
} from 'mobx';
import _ from 'lodash';
import { SortMode } from '../ResultsViewOncoprint';
import { Gene, MolecularProfile } from 'shared/api/generated/CBioPortalAPI';
import LoadingIndicator from 'shared/components/loadingIndicator/LoadingIndicator';
import DefaultTooltip from 'public-lib/components/defaultTooltip/DefaultTooltip';
import Slider from 'react-rangeslider';
import 'react-rangeslider/lib/index.css';
import EditableSpan from 'public-lib/components/editableSpan/EditableSpan';
import './styles.scss';
import ErrorIcon from '../../ErrorIcon';
import classNames from 'classnames';
import { SpecialAttribute } from '../../../cache/ClinicalDataCache';
import {
    ResultsViewPageStore,
    AlterationTypeConstants,
} from '../../../../pages/resultsView/ResultsViewPageStore';
import { ExtendedClinicalAttribute } from '../../../../pages/resultsView/ResultsViewPageStoreUtils';
import { getNCBIlink } from 'public-lib/lib/urls';
import { GeneBoxType } from '../../GeneSelectionBox/OQLTextArea';
import OQLTextArea from '../../GeneSelectionBox/OQLTextArea';
import autobind from 'autobind-decorator';
import { SingleGeneQuery } from '../../../lib/oql/oql-parser';
import AddClinicalTracks from '../../../../pages/resultsView/oncoprint/AddClinicalTracks';
import { Treatment } from 'shared/api/generated/CBioPortalAPIInternal';
import TextIconArea, {
    ITextIconAreaItemProps,
} from 'shared/components/textIconArea/TextIconArea';
import { extractTreatmentSelections } from '../OncoprintUtils';
import CheckedSelect from 'public-lib/components/checkedSelect/CheckedSelect';

export interface IOncoprintControlsHandlers {
    onSelectColumnType?: (type: 'sample' | 'patient') => void;
    onSelectShowUnalteredColumns: (unalteredColumnsShown: boolean) => void;
    onSelectShowWhitespaceBetweenColumns: (showWhitespace: boolean) => void;
    onSelectShowClinicalTrackLegends?: (showLegends: boolean) => void;
    onSelectOnlyShowClinicalLegendForAlteredCases?: (
        showLegends: boolean
    ) => void;
    onSelectShowOqlInLabels?: (show: boolean) => void;
    onSelectShowMinimap: (showMinimap: boolean) => void;
    onSelectDistinguishMutationType: (distinguish: boolean) => void;
    onSelectDistinguishDrivers: (distinguish: boolean) => void;
    onSelectDistinguishGermlineMutations?: (distinguish: boolean) => void;

    onSelectAnnotateOncoKb: (annotate: boolean) => void;
    onSelectAnnotateHotspots?: (annotate: boolean) => void;
    onSelectAnnotateCBioPortal: (annotate: boolean) => void;
    onSelectAnnotateCOSMIC?: (annotate: boolean) => void;
    onSelectHidePutativePassengers: (hide: boolean) => void;
    onChangeAnnotateCBioPortalInputValue: (value: string) => void;
    onSelectHideGermlineMutations?: (hide: boolean) => void;
    onChangeAnnotateCOSMICInputValue?: (value: string) => void;
    onSelectCustomDriverAnnotationBinary?: (s: boolean) => void;
    onSelectCustomDriverAnnotationTier?: (value: string, s: boolean) => void;

    onSelectSortByMutationType: (sort: boolean) => void;
    onSelectSortByDrivers: (sort: boolean) => void;
    onClickSortByData?: () => void;
    onClickSortAlphabetical?: () => void;
    onClickSortCaseListOrder?: () => void;
    onClickDownload?: (type: string) => void; // type is "pdf", "png", "svg", "order", or "tabular"
    onChangeSelectedClinicalTracks?: (
        attributeIds: (string | SpecialAttribute)[]
    ) => void;

    onClickAddGenesToHeatmap?: () => void;
    onClickAddTreatmentsToHeatmap?: (treatments: string[]) => void;
    onClickRemoveHeatmap?: () => void;
    onClickClusterHeatmap?: () => void;
    onSelectHeatmapProfile?: (molecularProfileId: string) => void;
    onChangeHeatmapGeneInputValue?: (value: string) => void;
    onChangeHeatmapTreatmentInputValue?: (value: string) => void;

    onSetHorzZoom: (z: number) => void;
    onClickZoomIn: () => void;
    onClickZoomOut: () => void;
}
export interface IOncoprintControlsState {
    selectedColumnType?: 'sample' | 'patient';
    showUnalteredColumns: boolean;
    showWhitespaceBetweenColumns: boolean;
    showClinicalTrackLegends?: boolean;
    onlyShowClinicalLegendForAlteredCases?: boolean;
    showOqlInLabels?: boolean;
    showMinimap: boolean;
    distinguishMutationType: boolean;
    distinguishDrivers: boolean;
    distinguishGermlineMutations?: boolean;
    sortByMutationType: boolean;
    sortByDrivers: boolean;
    sortByCaseListDisabled: boolean;
    annotateDriversOncoKb: boolean;
    annotateDriversOncoKbError: boolean;
    annotateDriversOncoKbDisabled: boolean;
    annotateDriversHotspots?: boolean;
    annotateDriversHotspotsError?: boolean;
    annotateDriversHotspotsDisabled?: boolean;
    annotateDriversCBioPortal: boolean;
    annotateDriversCOSMIC?: boolean;
    hidePutativePassengers: boolean;
    annotateCBioPortalInputValue: string;
    hideGermlineMutations?: boolean;
    annotateCOSMICInputValue?: string;

    sortMode?: SortMode;
    clinicalAttributesPromise?: MobxPromise<ExtendedClinicalAttribute[]>;
    clinicalAttributeSampleCountPromise?: MobxPromise<{
        [clinicalAttributeId: string]: number;
    }>;
    selectedClinicalAttributeIds?: string[];
    heatmapProfilesPromise?: MobxPromise<MolecularProfile[]>;
    treatmentsPromise?: MobxPromise<Treatment[]>;
    selectedHeatmapProfile?: string;
    selectedHeatmapProfileAlterationType?: string;
    heatmapIsDynamicallyQueried?: boolean;
    heatmapGeneInputValue?: string;
    heatmapTreatmentInputValue?: string;
    clusterHeatmapButtonActive?: boolean;
    hideClusterHeatmapButton?: boolean;
    hideHeatmapMenu?: boolean;

    customDriverAnnotationBinaryMenuLabel?: string;
    customDriverAnnotationTiersMenuLabel?: string;
    customDriverAnnotationTiers?: string[];
    selectedCustomDriverAnnotationTiers?: ObservableMap<boolean>;
    annotateCustomDriverBinary?: boolean;

    columnMode?: 'sample' | 'patient';

    horzZoom: number;
}

export interface IOncoprintControlsProps {
    store?: ResultsViewPageStore;
    handlers: IOncoprintControlsHandlers;
    state: IOncoprintControlsState & IObservableObject;
    oncoprinterMode?: boolean;
    treatmentSelectOptions?: ISelectOption[];
    selectedTreatmentIds?: string[];
}

export interface ISelectOption {
    id: string;
    value: string;
    label: string;
}

const EVENT_KEY = {
    columnTypeSample: '0',
    columnTypePatient: '1',
    showUnalteredColumns: '2',
    showWhitespaceBetweenColumns: '3',
    showClinicalTrackLegends: '4',
    onlyShowClinicalLegendForAlteredCases: '4.1',
    showOqlInLabels: '4.2',
    distinguishMutationType: '5',
    distinguishGermlineMutations: '5.1',
    sortByMutationType: '6',
    sortAlphabetical: '7',
    sortCaseListOrder: '8',
    sortByData: '9',
    sortByDrivers: '10',
    sortByHeatmapClustering: '11',
    addGenesToHeatmap: '13',
    removeHeatmap: '14',
    distinguishDrivers: '15',
    annotateOncoKb: '16',
    annotateHotspots: '17',
    annotateCBioPortal: '18',
    annotateCOSMIC: '19',
    annotateCBioPortalInput: '20',
    annotateCOSMICInput: '21',
    hidePutativePassengers: '22',
    hideGermlineMutations: '22.1',
    customDriverBinaryAnnotation: '23',
    customDriverTierAnnotation: '24',
    downloadPDF: '25',
    downloadPNG: '26',
    downloadSVG: '27',
    downloadOrder: '28',
    downloadTabular: '29',
    horzZoomSlider: '30',
    addTreatmentsToHeatmap: '32',
};

@observer
export default class OncoprintControls extends React.Component<
    IOncoprintControlsProps,
    {}
> {
    @observable horzZoomSliderState: number;
    @observable heatmapGenesReady = false;
    @observable private _selectedTreatmentIds: string[] = [];
    private textareaTreatmentText = '';
    @observable treatmentFilter = '';

    constructor(props: IOncoprintControlsProps) {
        super(props);

        this.getHeatmapMenu = this.getHeatmapMenu.bind(this);
        this.getClinicalTracksMenu = this.getClinicalTracksMenu.bind(this);
        this.getSortMenu = this.getSortMenu.bind(this);
        this.getViewMenu = this.getViewMenu.bind(this);
        this.getDownloadMenu = this.getDownloadMenu.bind(this);
        this.onInputClick = this.onInputClick.bind(this);
        this.getMutationColorMenu = this.getMutationColorMenu.bind(this);
        this.getHorzZoomControls = this.getHorzZoomControls.bind(this);
        this.onSelect = this.onSelect.bind(this);
        this.toggleShowMinimap = this.toggleShowMinimap.bind(this);
        this.onType = this.onType.bind(this);
        this.onHeatmapProfileSelect = this.onHeatmapProfileSelect.bind(this);
        this.onButtonClick = this.onButtonClick.bind(this);
        this.onZoomInClick = this.onZoomInClick.bind(this);
        this.onZoomOutClick = this.onZoomOutClick.bind(this);
        this.onCustomDriverTierCheckboxClick = this.onCustomDriverTierCheckboxClick.bind(
            this
        );
        this.onHorzZoomSliderChange = this.onHorzZoomSliderChange.bind(this);
        this.onHorzZoomSliderSet = this.onHorzZoomSliderSet.bind(this);
        this.onSetHorzZoomTextInput = this.onSetHorzZoomTextInput.bind(this);

        if (props.selectedTreatmentIds) {
            this._selectedTreatmentIds = props.selectedTreatmentIds;
        }

        this.horzZoomSliderState = props.state.horzZoom;
        reaction(
            () => this.props.state.horzZoom,
            z => (this.horzZoomSliderState = z)
        ); // when horz zoom changes, set slider state
    }

    private onZoomInClick() {
        this.props.handlers.onClickZoomIn();
    }

    private onZoomOutClick() {
        this.props.handlers.onClickZoomOut();
    }

    private onSetHorzZoomTextInput(val: string) {
        const percentage = parseFloat(val);
        const zoom = percentage / 100;
        this.props.handlers.onSetHorzZoom(zoom);
    }

    private onSelect(eventKey: any) {
        if (eventKey === EVENT_KEY.distinguishMutationType) {
            this.props.handlers.onSelectDistinguishMutationType &&
                this.props.handlers.onSelectDistinguishMutationType(
                    !this.props.state.distinguishMutationType
                );
        }
    }
    private onHeatmapProfileSelect(option: { label: string; value: string }) {
        this.props.handlers.onSelectHeatmapProfile &&
            this.props.handlers.onSelectHeatmapProfile(option.value);
    }

    private toggleShowMinimap() {
        this.props.handlers.onSelectShowMinimap &&
            this.props.handlers.onSelectShowMinimap(
                !this.props.state.showMinimap
            );
    }

    private onInputClick(event: React.MouseEvent<HTMLInputElement>) {
        switch ((event.target as HTMLInputElement).value) {
            case EVENT_KEY.showUnalteredColumns:
                this.props.handlers.onSelectShowUnalteredColumns &&
                    this.props.handlers.onSelectShowUnalteredColumns(
                        !this.props.state.showUnalteredColumns
                    );
                break;
            case EVENT_KEY.showWhitespaceBetweenColumns:
                this.props.handlers.onSelectShowWhitespaceBetweenColumns &&
                    this.props.handlers.onSelectShowWhitespaceBetweenColumns(
                        !this.props.state.showWhitespaceBetweenColumns
                    );
                break;
            case EVENT_KEY.showClinicalTrackLegends:
                this.props.handlers.onSelectShowClinicalTrackLegends &&
                    this.props.handlers.onSelectShowClinicalTrackLegends(
                        !this.props.state.showClinicalTrackLegends
                    );
                break;
            case EVENT_KEY.onlyShowClinicalLegendForAlteredCases:
                this.props.handlers
                    .onSelectOnlyShowClinicalLegendForAlteredCases &&
                    this.props.handlers.onSelectOnlyShowClinicalLegendForAlteredCases(
                        !this.props.state.onlyShowClinicalLegendForAlteredCases
                    );
                break;
            case EVENT_KEY.showOqlInLabels:
                this.props.handlers.onSelectShowOqlInLabels &&
                    this.props.handlers.onSelectShowOqlInLabels(
                        !this.props.state.showOqlInLabels
                    );
                break;
            case EVENT_KEY.columnTypeSample:
                this.props.handlers.onSelectColumnType &&
                    this.props.handlers.onSelectColumnType('sample');
                break;
            case EVENT_KEY.columnTypePatient:
                this.props.handlers.onSelectColumnType &&
                    this.props.handlers.onSelectColumnType('patient');
                break;
            case EVENT_KEY.sortByData:
                this.props.handlers.onClickSortByData &&
                    this.props.handlers.onClickSortByData();
                break;
            case EVENT_KEY.sortAlphabetical:
                this.props.handlers.onClickSortAlphabetical &&
                    this.props.handlers.onClickSortAlphabetical();
                break;
            case EVENT_KEY.sortCaseListOrder:
                this.props.handlers.onClickSortCaseListOrder &&
                    this.props.handlers.onClickSortCaseListOrder();
                break;
            case EVENT_KEY.sortByMutationType:
                this.props.handlers.onSelectSortByMutationType &&
                    this.props.handlers.onSelectSortByMutationType(
                        !this.props.state.sortByMutationType
                    );
                break;
            case EVENT_KEY.sortByDrivers:
                this.props.handlers.onSelectSortByDrivers &&
                    this.props.handlers.onSelectSortByDrivers(
                        !this.props.state.sortByDrivers
                    );
                break;
            case EVENT_KEY.distinguishDrivers:
                this.props.handlers.onSelectDistinguishDrivers &&
                    this.props.handlers.onSelectDistinguishDrivers(
                        !this.props.state.distinguishDrivers
                    );
                break;
            case EVENT_KEY.distinguishMutationType:
                this.props.handlers.onSelectDistinguishMutationType &&
                    this.props.handlers.onSelectDistinguishMutationType(
                        !this.props.state.distinguishMutationType
                    );
                break;
            case EVENT_KEY.distinguishGermlineMutations:
                this.props.handlers.onSelectDistinguishGermlineMutations &&
                    this.props.handlers.onSelectDistinguishGermlineMutations(
                        !this.props.state.distinguishGermlineMutations
                    );
                break;
            case EVENT_KEY.annotateOncoKb:
                this.props.handlers.onSelectAnnotateOncoKb &&
                    this.props.handlers.onSelectAnnotateOncoKb(
                        !this.props.state.annotateDriversOncoKb
                    );
                break;
            case EVENT_KEY.annotateHotspots:
                this.props.handlers.onSelectAnnotateHotspots &&
                    this.props.handlers.onSelectAnnotateHotspots(
                        !this.props.state.annotateDriversHotspots
                    );
                break;
            case EVENT_KEY.annotateCBioPortal:
                this.props.handlers.onSelectAnnotateCBioPortal &&
                    this.props.handlers.onSelectAnnotateCBioPortal(
                        !this.props.state.annotateDriversCBioPortal
                    );
                break;
            case EVENT_KEY.annotateCOSMIC:
                this.props.handlers.onSelectAnnotateCOSMIC &&
                    this.props.handlers.onSelectAnnotateCOSMIC(
                        !this.props.state.annotateDriversCOSMIC
                    );
                break;
            case EVENT_KEY.hidePutativePassengers:
                this.props.handlers.onSelectHidePutativePassengers &&
                    this.props.handlers.onSelectHidePutativePassengers(
                        !this.props.state.hidePutativePassengers
                    );
                break;
            case EVENT_KEY.hideGermlineMutations:
                this.props.handlers.onSelectHideGermlineMutations &&
                    this.props.handlers.onSelectHideGermlineMutations(
                        !this.props.state.hideGermlineMutations
                    );
                break;
            case EVENT_KEY.customDriverBinaryAnnotation:
                this.props.handlers.onSelectCustomDriverAnnotationBinary &&
                    this.props.handlers.onSelectCustomDriverAnnotationBinary(
                        !this.props.state.annotateCustomDriverBinary
                    );
                break;
        }
    }

    private onHorzZoomSliderChange(z: number) {
        this.horzZoomSliderState = z;
    }

    private onHorzZoomSliderSet() {
        this.props.handlers.onSetHorzZoom(this.horzZoomSliderState);
        this.horzZoomSliderState = this.props.state.horzZoom; // set it back in case it doesnt change
    }

    private onCustomDriverTierCheckboxClick(
        event: React.MouseEvent<HTMLInputElement>
    ) {
        this.props.handlers.onSelectCustomDriverAnnotationTier &&
            this.props.handlers.onSelectCustomDriverAnnotationTier(
                (event.target as HTMLInputElement).value,
                !(
                    this.props.state.selectedCustomDriverAnnotationTiers &&
                    this.props.state.selectedCustomDriverAnnotationTiers.get(
                        (event.target as HTMLInputElement).value
                    )
                )
            );
    }

    private onButtonClick(event: React.MouseEvent<HTMLButtonElement>) {
        switch ((event.target as HTMLButtonElement).name) {
            case EVENT_KEY.addGenesToHeatmap:
                this.props.handlers.onClickAddGenesToHeatmap &&
                    this.props.handlers.onClickAddGenesToHeatmap();
                break;
            case EVENT_KEY.addTreatmentsToHeatmap:
                this.props.handlers.onClickAddTreatmentsToHeatmap &&
                    this.props.handlers.onClickAddTreatmentsToHeatmap(
                        this._selectedTreatmentIds
                    );
                break;
            case EVENT_KEY.removeHeatmap:
                this.props.handlers.onClickRemoveHeatmap &&
                    this.props.handlers.onClickRemoveHeatmap();
                this._selectedTreatmentIds = [];
                break;
            case EVENT_KEY.downloadSVG:
                this.props.handlers.onClickDownload &&
                    this.props.handlers.onClickDownload('svg');
                break;
            case EVENT_KEY.downloadPNG:
                this.props.handlers.onClickDownload &&
                    this.props.handlers.onClickDownload('png');
                break;
            case EVENT_KEY.downloadPDF:
                this.props.handlers.onClickDownload &&
                    this.props.handlers.onClickDownload('pdf');
                break;
            case EVENT_KEY.downloadOrder:
                this.props.handlers.onClickDownload &&
                    this.props.handlers.onClickDownload('order');
                break;
            case EVENT_KEY.downloadTabular:
                this.props.handlers.onClickDownload &&
                    this.props.handlers.onClickDownload('tabular');
                break;
            case EVENT_KEY.sortByHeatmapClustering:
                this.props.handlers.onClickClusterHeatmap &&
                    this.props.handlers.onClickClusterHeatmap();
                break;
        }
    }

    @autobind
    @action
    private onChangeHeatmapGeneInput(oql: any, genes: any, queryStr: string) {
        this.props.handlers.onChangeHeatmapGeneInputValue &&
            this.props.handlers.onChangeHeatmapGeneInputValue(queryStr);

        const foundGenes = _.keyBy(genes.found as Gene[], gene =>
            gene.hugoGeneSymbol.toUpperCase()
        );

        this.heatmapGenesReady = _.every(
            oql.query as SingleGeneQuery[],
            query => query.gene.toUpperCase() in foundGenes
        ); // all genes valid
    }

    private onType(event: React.ChangeEvent<HTMLTextAreaElement>) {
        switch ((event.target as HTMLTextAreaElement).name) {
            case EVENT_KEY.annotateCBioPortalInput:
                this.props.handlers.onChangeAnnotateCBioPortalInputValue &&
                    this.props.handlers.onChangeAnnotateCBioPortalInputValue(
                        event.target.value
                    );
                break;
            case EVENT_KEY.annotateCOSMICInput:
                this.props.handlers.onChangeAnnotateCOSMICInputValue &&
                    this.props.handlers.onChangeAnnotateCOSMICInputValue(
                        event.target.value
                    );
                break;
        }
    }

    @autobind
    private onChangeTreatmentTextArea(text: string): string {
        return extractTreatmentSelections(
            text,
            this._selectedTreatmentIds,
            this.treatmentOptionsByValueMap
        );
    }

    @autobind
    private onTreatmentRemoved(treatmentId: string) {
        _.remove(this._selectedTreatmentIds, v => v === treatmentId);
    }

    @computed get heatmapProfileOptions() {
        if (
            this.props.state.heatmapProfilesPromise &&
            this.props.state.heatmapProfilesPromise.result
        ) {
            return _.map(
                this.props.state.heatmapProfilesPromise.result,
                profile => ({
                    label: profile.name,
                    value: profile.molecularProfileId,
                    type: profile.molecularAlterationType,
                })
            );
        } else {
            return [];
        }
    }

    @computed get treatmentOptionsByValueMap(): {
        [value: string]: ISelectOption;
    } {
        return _.keyBy(this.props.treatmentSelectOptions, 'id');
    }

    @autobind
    @action
    private onSelectTreatments(selectedElements: ISelectOption[]) {
        this._selectedTreatmentIds = selectedElements.map(o => o.id);
    }

    @computed get selectedTreatments(): ISelectOption[] {
        return this._selectedTreatmentIds.map(
            o => this.treatmentOptionsByValueMap[o]
        );
    }

    @computed get selectedTreatmentsJS() {
        return toJS(this.selectedTreatments);
    }

    @computed get textareaTreatmentEntries(): ITextIconAreaItemProps[] {
        return _.map(this.selectedTreatments, (d: ISelectOption) => ({
            value: d.id,
            label: d.id,
        }));
    }
    
    @computed get filteredTreatmentOptions() {
        if (this.treatmentFilter && this.props.treatmentSelectOptions) {
            const regex = new RegExp(this.treatmentFilter, 'i');
            return this.props.treatmentSelectOptions.filter(
                option => regex.test(option.label) || regex.test(option.value)
            );
        }
        return this.props.treatmentSelectOptions;
    }

    @autobind
    @action
    onInputChange(input: string) {
        this.treatmentFilter = input;
    }

    @autobind onAddAllTreatments() {
        if (this.filteredTreatmentOptions) {
            // merge the current selected options with all the filtered ones and remove duplicates
            this.onSelectTreatments(
                _.uniqBy(
                    [
                        ...this.selectedTreatmentsJS,
                        ...this.filteredTreatmentOptions,
                    ],
                    option => option.value
                )
            );
        }
    }

    @computed get addAllLabel() {
        if (this.filteredTreatmentOptions) {
            return `Select all (${this.filteredTreatmentOptions.length})`;
        }
        return 'Select all';
    }

    private getClinicalTracksMenu() {
        // TODO: put onFocus handler on CheckedSelect when possible
        // TODO: pass unmodified string array as value prop when possible
        // TODO: remove labelKey specification, leave to default prop, when possible
        if (
            this.props.store &&
            this.props.state.selectedClinicalAttributeIds &&
            this.props.handlers.onChangeSelectedClinicalTracks
        ) {
            return (
                <AddClinicalTracks
                    store={this.props.store}
                    selectedClinicalAttributeIds={
                        this.props.state.selectedClinicalAttributeIds
                    }
                    onChangeSelectedClinicalTracks={
                        this.props.handlers.onChangeSelectedClinicalTracks
                    }
                />
            );
        } else {
            return <span />;
        }
    }

    private getHeatmapMenu() {
        const showItemSelectionElements = this.props.state
            .heatmapIsDynamicallyQueried;
        const showGenesTextArea =
            showItemSelectionElements &&
            this.props.state.selectedHeatmapProfileAlterationType !==
                AlterationTypeConstants.GENERIC_ASSAY;
        const showTreatmentsTextArea =
            showItemSelectionElements &&
            this.props.state.selectedHeatmapProfileAlterationType ===
                AlterationTypeConstants.GENERIC_ASSAY;

        if (
            this.props.oncoprinterMode ||
            this.props.state.hideHeatmapMenu ||
            !this.props.state.heatmapProfilesPromise
        ) {
            return null;
        }
        let menu = <LoadingIndicator isLoading={true} />;
        if (this.props.state.heatmapProfilesPromise.isComplete) {
            if (!this.props.state.heatmapProfilesPromise.result!.length) {
                return <span />;
            } else {
                menu = (
                    <div className="oncoprint__controls__heatmap_menu">
                        <ReactSelect
                            clearable={false}
                            searchable={false}
                            isLoading={
                                this.props.state.heatmapProfilesPromise
                                    .isPending
                            }
                            onChange={this.onHeatmapProfileSelect}
                            value={this.props.state.selectedHeatmapProfile}
                            options={this.heatmapProfileOptions}
                        />
                        {showGenesTextArea && [
                            <OQLTextArea
                                inputGeneQuery={
                                    this.props.state.heatmapGeneInputValue || ''
                                }
                                callback={this.onChangeHeatmapGeneInput}
                                location={GeneBoxType.ONCOPRINT_HEATMAP}
                            />,
                            <button
                                key="addGenesToHeatmapButton"
                                className="btn btn-sm btn-default"
                                name={EVENT_KEY.addGenesToHeatmap}
                                onClick={this.onButtonClick}
                                disabled={!this.heatmapGenesReady}
                            >
                                Add Genes to Heatmap
                            </button>,
                        ]}
                        {showTreatmentsTextArea &&
                            this.props.state.treatmentsPromise!.isComplete && [
                                <TextIconArea
                                    elements={this.textareaTreatmentEntries}
                                    text={this.textareaTreatmentText}
                                    placeholder="Type space- or comma-separated treatments here, then click 'Add Treatments to Heatmap'"
                                    onChangeTextArea={
                                        this.onChangeTreatmentTextArea
                                    }
                                    onIconClicked={this.onTreatmentRemoved}
                                    classNames={['treatment-textarea']}
                                />,
                                <div
                                    className={classNames('treatment-selector')}
                                >
                                    <CheckedSelect
                                        name="treatment-select"
                                        placeholder="Search for Treatments..."
                                        options={this.filteredTreatmentOptions}
                                        onChange={this.onSelectTreatments}
                                        value={this.selectedTreatmentsJS}
                                        onInputChange={this.onInputChange}
                                        addAllLabel={this.addAllLabel}
                                        onAddAll={this.onAddAllTreatments}
                                        inputValue={this.treatmentFilter}
                                    />
                                </div>,
                                <button
                                    key="addTreatmentsToHeatmapButton"
                                    className="btn btn-sm btn-default"
                                    name={EVENT_KEY.addTreatmentsToHeatmap}
                                    onClick={this.onButtonClick}
                                >
                                    Add Treatment Response to Heatmap
                                </button>,
                            ]}

                        <button
                            key="removeHeatmapButton"
                            className="btn btn-sm btn-default"
                            name={EVENT_KEY.removeHeatmap}
                            onClick={this.onButtonClick}
                        >
                            Remove Heatmap
                        </button>

                        {!this.props.state.hideClusterHeatmapButton && (
                            <button
                                data-test="clusterHeatmapBtn"
                                className={classNames(
                                    'btn',
                                    'btn-sm',
                                    'btn-default',
                                    {
                                        active: this.props.state
                                            .clusterHeatmapButtonActive,
                                    }
                                )}
                                name={EVENT_KEY.sortByHeatmapClustering}
                                onClick={this.onButtonClick}
                            >
                                Cluster Heatmap
                            </button>
                        )}
                    </div>
                );
            }
        } else if (this.props.state.heatmapProfilesPromise.isError) {
            menu = <span>Error loading heatmap profiles.</span>;
        }
        return (
            <CustomDropdown
                bsStyle="default"
                title="Heatmap"
                id="heatmapDropdown"
                className="heatmap"
            >
                {menu}
            </CustomDropdown>
        );
    }

    private getSortMenuOncoprinter() {
        return (
            <CustomDropdown bsStyle="default" title="Sort" id="sortDropdown">
                <div
                    className="oncoprint__controls__sort_menu"
                    data-test="oncoprintSortDropdownMenu"
                >
                    <div className="checkbox">
                        <label>
                            <input
                                type="checkbox"
                                value={EVENT_KEY.sortByMutationType}
                                checked={this.props.state.sortByMutationType}
                                onClick={this.onInputClick}
                                disabled={
                                    !this.props.state.distinguishMutationType
                                }
                            />{' '}
                            Mutation Type
                        </label>
                    </div>
                    <div className="checkbox">
                        <label>
                            <input
                                type="checkbox"
                                value={EVENT_KEY.sortByDrivers}
                                checked={this.props.state.sortByDrivers}
                                onClick={this.onInputClick}
                                disabled={!this.props.state.distinguishDrivers}
                            />{' '}
                            Driver/Passenger
                        </label>
                    </div>
                </div>
            </CustomDropdown>
        );
    }

    private getSortMenuOncoprint() {
        return (
            <CustomDropdown bsStyle="default" title="Sort" id="sortDropdown">
                <div
                    className="oncoprint__controls__sort_menu"
                    data-test="oncoprintSortDropdownMenu"
                >
                    <div className="radio">
                        <label>
                            <input
                                data-test="sortByData"
                                type="radio"
                                name="sortBy"
                                value={EVENT_KEY.sortByData}
                                checked={
                                    this.props.state.sortMode!.type === 'data'
                                }
                                onClick={this.onInputClick}
                            />{' '}
                            Sort by data
                        </label>
                    </div>
                    <div style={{ marginLeft: '10px' }}>
                        <div className="checkbox">
                            <label>
                                <input
                                    type="checkbox"
                                    value={EVENT_KEY.sortByMutationType}
                                    checked={
                                        this.props.state.sortByMutationType
                                    }
                                    onClick={this.onInputClick}
                                    disabled={
                                        this.props.state.sortMode!.type !==
                                            'data' ||
                                        !this.props.state
                                            .distinguishMutationType
                                    }
                                />{' '}
                                Mutation Type
                            </label>
                        </div>
                        <div className="checkbox">
                            <label>
                                <input
                                    type="checkbox"
                                    value={EVENT_KEY.sortByDrivers}
                                    checked={this.props.state.sortByDrivers}
                                    onClick={this.onInputClick}
                                    disabled={
                                        this.props.state.sortMode!.type !==
                                            'data' ||
                                        !this.props.state.distinguishDrivers
                                    }
                                />{' '}
                                Driver/Passenger
                            </label>
                        </div>
                    </div>
                    <div className="radio">
                        <label>
                            <input
                                type="radio"
                                name="sortBy"
                                value={EVENT_KEY.sortAlphabetical}
                                checked={
                                    this.props.state.sortMode!.type ===
                                    'alphabetical'
                                }
                                onClick={this.onInputClick}
                            />{' '}
                            Sort by case id (alphabetical)
                        </label>
                    </div>
                    <div className="radio">
                        <label>
                            <input
                                type="radio"
                                name="sortBy"
                                value={EVENT_KEY.sortCaseListOrder}
                                checked={
                                    this.props.state.sortMode!.type ===
                                    'caseList'
                                }
                                onClick={this.onInputClick}
                                data-test="caseList"
                                disabled={
                                    !!this.props.state.sortByCaseListDisabled
                                }
                            />{' '}
                            Sort by case list order
                        </label>
                    </div>
                    {this.props.state.heatmapProfilesPromise &&
                        !(
                            this.props.state.heatmapProfilesPromise
                                .isComplete &&
                            !this.props.state.heatmapProfilesPromise.result!
                                .length
                        ) && (
                            <div className="radio">
                                <label>
                                    <input
                                        data-test="sortByHeatmapClustering"
                                        type="radio"
                                        name="sortBy"
                                        checked={
                                            this.props.state.sortMode!.type ===
                                            'heatmap'
                                        }
                                        disabled
                                    />{' '}
                                    Sorted by heatmap clustering order
                                </label>
                            </div>
                        )}
                </div>
            </CustomDropdown>
        );
    }

    private getMutationColorMenu() {
        return (
            <CustomDropdown
                bsStyle="default"
                title="Mutations"
                id="mutationColorDropdown"
            >
                <div className="oncoprint__controls__mutation_color_menu">
                    <h5>Color by</h5>
                    <div style={{ marginLeft: '10px' }}>
                        <div className="checkbox">
                            <label>
                                <input
                                    data-test="ColorByType"
                                    type="checkbox"
                                    value={EVENT_KEY.distinguishMutationType}
                                    checked={
                                        this.props.state.distinguishMutationType
                                    }
                                    onClick={this.onInputClick}
                                />{' '}
                                Type
                            </label>
                        </div>
                        <div className="checkbox">
                            <label>
                                <input
                                    data-test="ColorByGermline"
                                    type="checkbox"
                                    value={
                                        EVENT_KEY.distinguishGermlineMutations
                                    }
                                    checked={
                                        this.props.state
                                            .distinguishGermlineMutations
                                    }
                                    onClick={this.onInputClick}
                                />{' '}
                                Somatic vs Germline
                            </label>
                        </div>
                        <div className="checkbox">
                            <label>
                                <input
                                    data-test="ColorByDriver"
                                    type="checkbox"
                                    value={EVENT_KEY.distinguishDrivers}
                                    checked={
                                        this.props.state.distinguishDrivers
                                    }
                                    onClick={this.onInputClick}
                                />{' '}
                                Putative drivers vs VUS:
                            </label>
                        </div>
                        <div style={{ marginLeft: '20px' }}>
                            {!this.props.state
                                .annotateDriversOncoKbDisabled && (
                                <div className="checkbox">
                                    <label>
                                        <input
                                            type="checkbox"
                                            value={EVENT_KEY.annotateOncoKb}
                                            checked={
                                                this.props.state
                                                    .annotateDriversOncoKb
                                            }
                                            onClick={this.onInputClick}
                                            data-test="annotateOncoKb"
                                            disabled={
                                                this.props.state
                                                    .annotateDriversOncoKbError
                                            }
                                        />
                                        {this.props.state
                                            .annotateDriversOncoKbError && (
                                            <ErrorIcon
                                                style={{ marginRight: 4 }}
                                                tooltip={
                                                    <span>
                                                        Error loading OncoKb
                                                        data. Please refresh the
                                                        page or try again later.
                                                    </span>
                                                }
                                            />
                                        )}
                                        <DefaultTooltip
                                            overlay={
                                                <span>
                                                    Oncogenicity from OncoKB
                                                </span>
                                            }
                                            placement="top"
                                        >
                                            <img
                                                src={require('../../../../rootImages/oncokb.png')}
                                                style={{
                                                    maxHeight: '12px',
                                                    cursor: 'pointer',
                                                    marginRight: '5px',
                                                }}
                                            />
                                        </DefaultTooltip>
                                        driver annotation
                                    </label>
                                </div>
                            )}
                            {this.props.handlers.onSelectAnnotateHotspots &&
                                !this.props.state
                                    .annotateDriversHotspotsDisabled && (
                                    <div className="checkbox">
                                        <label>
                                            <input
                                                type="checkbox"
                                                value={
                                                    EVENT_KEY.annotateHotspots
                                                }
                                                checked={
                                                    this.props.state
                                                        .annotateDriversHotspots
                                                }
                                                onClick={this.onInputClick}
                                                data-test="annotateHotspots"
                                                disabled={
                                                    this.props.state
                                                        .annotateDriversHotspotsError
                                                }
                                            />
                                            {this.props.state
                                                .annotateDriversHotspotsError && (
                                                <ErrorIcon
                                                    style={{ marginRight: 4 }}
                                                    tooltip={
                                                        <span>
                                                            Error loading
                                                            Hotspots data.
                                                            Please refresh the
                                                            page or try again
                                                            later.
                                                        </span>
                                                    }
                                                />
                                            )}
                                            Hotspots
                                            <DefaultTooltip
                                                overlay={
                                                    <div
                                                        style={{
                                                            maxWidth: '400px',
                                                        }}
                                                    >
                                                        Identified as a
                                                        recurrent hotspot
                                                        (statistically
                                                        significant) in a
                                                        population-scale cohort
                                                        of tumor samples of
                                                        various cancer types
                                                        using methodology based
                                                        in part on{' '}
                                                        <a
                                                            href={getNCBIlink(
                                                                '/pubmed/26619011'
                                                            )}
                                                            target="_blank"
                                                        >
                                                            Chang et al., Nat
                                                            Biotechnol, 2016.
                                                        </a>
                                                        Explore all mutations at{' '}
                                                        <a
                                                            href="https://www.cancerhotspots.org"
                                                            target="_blank"
                                                        >
                                                            https://cancerhotspots.org
                                                        </a>
                                                    </div>
                                                }
                                                placement="top"
                                            >
                                                <img
                                                    src={require('../../../../rootImages/cancer-hotspots.svg')}
                                                    style={{
                                                        height: '15px',
                                                        width: '15px',
                                                        cursor: 'pointer',
                                                        marginLeft: '5px',
                                                    }}
                                                />
                                            </DefaultTooltip>
                                        </label>
                                    </div>
                                )}
                            {this.props.handlers
                                .onChangeAnnotateCBioPortalInputValue && (
                                <div className="checkbox">
                                    <label>
                                        <input
                                            type="checkbox"
                                            value={EVENT_KEY.annotateCBioPortal}
                                            checked={
                                                this.props.state
                                                    .annotateDriversCBioPortal
                                            }
                                            onClick={this.onInputClick}
                                            data-test="annotateCBioPortalCount"
                                        />
                                        cBioPortal >=
                                    </label>
                                    <EditableSpan
                                        value={
                                            this.props.state
                                                .annotateCBioPortalInputValue ||
                                            ''
                                        }
                                        setValue={
                                            this.props.handlers
                                                .onChangeAnnotateCBioPortalInputValue
                                        }
                                        numericOnly={true}
                                        textFieldAppearance={true}
                                        maxChars={10}
                                    />
                                </div>
                            )}
                            {this.props.handlers
                                .onChangeAnnotateCOSMICInputValue && (
                                <div className="checkbox">
                                    <label>
                                        <input
                                            type="checkbox"
                                            value={EVENT_KEY.annotateCOSMIC}
                                            checked={
                                                this.props.state
                                                    .annotateDriversCOSMIC
                                            }
                                            onClick={this.onInputClick}
                                            data-test="annotateCOSMICCount"
                                        />
                                        COSMIC >=
                                    </label>
                                    <EditableSpan
                                        value={
                                            this.props.state
                                                .annotateCOSMICInputValue || ''
                                        }
                                        setValue={
                                            this.props.handlers
                                                .onChangeAnnotateCOSMICInputValue
                                        }
                                        numericOnly={true}
                                        textFieldAppearance={true}
                                        maxChars={10}
                                    />
                                </div>
                            )}
                            {!!this.props.state
                                .customDriverAnnotationBinaryMenuLabel && (
                                <div className="checkbox">
                                    <label>
                                        <input
                                            type="checkbox"
                                            checked={
                                                this.props.state
                                                    .annotateCustomDriverBinary
                                            }
                                            value={
                                                EVENT_KEY.customDriverBinaryAnnotation
                                            }
                                            onClick={this.onInputClick}
                                        />{' '}
                                        {
                                            this.props.state
                                                .customDriverAnnotationBinaryMenuLabel
                                        }
                                        <img
                                            src={require('../../../../rootImages/driver.png')}
                                            alt="driver filter"
                                            style={{
                                                height: '15px',
                                                width: '15px',
                                                cursor: 'pointer',
                                                marginLeft: '5px',
                                            }}
                                        />
                                    </label>
                                </div>
                            )}
                            {!!this.props.state
                                .customDriverAnnotationTiersMenuLabel && (
                                <span>
                                    <span className="caret" />
                                    &nbsp;&nbsp;
                                    <span>
                                        {
                                            this.props.state
                                                .customDriverAnnotationTiersMenuLabel
                                        }
                                    </span>
                                    &nbsp;
                                    <img
                                        src={require('../../../../rootImages/driver_tiers.png')}
                                        alt="driver tiers filter"
                                        style={{
                                            height: '15px',
                                            width: '15px',
                                            cursor: 'pointer',
                                            marginLeft: '5px',
                                        }}
                                    />
                                    <div style={{ marginLeft: '30px' }}>
                                        {(
                                            this.props.state
                                                .customDriverAnnotationTiers ||
                                            []
                                        ).map(tier => (
                                            <div className="checkbox">
                                                <label>
                                                    <input
                                                        type="checkbox"
                                                        value={tier}
                                                        checked={
                                                            !!(
                                                                this.props.state
                                                                    .selectedCustomDriverAnnotationTiers &&
                                                                this.props.state.selectedCustomDriverAnnotationTiers.get(
                                                                    tier
                                                                )
                                                            )
                                                        }
                                                        onClick={
                                                            this
                                                                .onCustomDriverTierCheckboxClick
                                                        }
                                                    />{' '}
                                                    {tier}
                                                </label>
                                            </div>
                                        ))}
                                    </div>
                                </span>
                            )}
                        </div>
                    </div>
                    <h5>Filter</h5>
                    <div style={{ marginLeft: 10 }}>
                        <div className="checkbox">
                            <label>
                                <input
                                    data-test="HideVUS"
                                    type="checkbox"
                                    value={EVENT_KEY.hidePutativePassengers}
                                    checked={
                                        this.props.state.hidePutativePassengers
                                    }
                                    onClick={this.onInputClick}
                                    disabled={
                                        !this.props.state.distinguishDrivers
                                    }
                                />{' '}
                                Hide mutations and copy number alterations of
                                unknown significance
                            </label>
                        </div>
                        <div className="checkbox">
                            <label>
                                <input
                                    data-test="HideGermline"
                                    type="checkbox"
                                    value={EVENT_KEY.hideGermlineMutations}
                                    checked={
                                        this.props.state.hideGermlineMutations
                                    }
                                    onClick={this.onInputClick}
                                />{' '}
                                Hide germline mutations
                            </label>
                        </div>
                    </div>
                </div>
            </CustomDropdown>
        );
    }

    private getViewMenu() {
        if (this.props.oncoprinterMode) {
            return this.getViewMenuOncoprinter();
        } else {
            return this.getViewMenuOncoprint();
        }
    }

    private getViewMenuOncoprinter() {
        return (
            <CustomDropdown
                bsStyle="default"
                title="View"
                id="viewDropdownButton"
            >
                <div className="checkbox">
                    <label>
                        <input
                            type="checkbox"
                            value={EVENT_KEY.showUnalteredColumns}
                            checked={this.props.state.showUnalteredColumns}
                            onClick={this.onInputClick}
                        />{' '}
                        Show unaltered columns
                    </label>
                </div>
                <div className="checkbox">
                    <label>
                        <input
                            type="checkbox"
                            value={EVENT_KEY.showWhitespaceBetweenColumns}
                            checked={
                                this.props.state.showWhitespaceBetweenColumns
                            }
                            onClick={this.onInputClick}
                        />{' '}
                        Show whitespace between columns
                    </label>
                </div>
            </CustomDropdown>
        );
    }
    private getViewMenuOncoprint() {
        return (
            <CustomDropdown
                bsStyle="default"
                title="View"
                id="viewDropdownButton"
            >
                <strong>Data type:</strong>
                <div className="radio">
                    <label>
                        <input
                            type="radio"
                            name="columnType"
                            value={EVENT_KEY.columnTypeSample}
                            checked={
                                this.props.state.selectedColumnType === 'sample'
                            }
                            onClick={this.onInputClick}
                        />{' '}
                        Events per sample
                    </label>
                </div>
                <div className="radio">
                    <label>
                        <input
                            type="radio"
                            name="columnType"
                            value={EVENT_KEY.columnTypePatient}
                            checked={
                                this.props.state.selectedColumnType ===
                                'patient'
                            }
                            onClick={this.onInputClick}
                        />{' '}
                        Events per patient
                    </label>
                </div>

                <hr />
                <div className="checkbox">
                    <label>
                        <input
                            type="checkbox"
                            value={EVENT_KEY.showUnalteredColumns}
                            checked={this.props.state.showUnalteredColumns}
                            onClick={this.onInputClick}
                        />{' '}
                        Show unaltered columns
                    </label>
                </div>
                <div className="checkbox">
                    <label>
                        <input
                            type="checkbox"
                            value={EVENT_KEY.showWhitespaceBetweenColumns}
                            checked={
                                this.props.state.showWhitespaceBetweenColumns
                            }
                            onClick={this.onInputClick}
                        />{' '}
                        Show whitespace between columns
                    </label>
                </div>
                <div className="checkbox">
                    <label>
                        <input
                            type="checkbox"
                            value={EVENT_KEY.showClinicalTrackLegends}
                            checked={this.props.state.showClinicalTrackLegends}
                            onClick={this.onInputClick}
                        />{' '}
                        Show legends for clinical tracks
                    </label>
                </div>
                <div
                    className="checkbox"
                    style={{ marginLeft: 20, maxWidth: 220 }}
                >
                    <label>
                        <input
                            data-test="onlyShowClinicalLegendsForAltered"
                            type="checkbox"
                            value={
                                EVENT_KEY.onlyShowClinicalLegendForAlteredCases
                            }
                            checked={
                                this.props.state
                                    .onlyShowClinicalLegendForAlteredCases
                            }
                            onClick={this.onInputClick}
                            disabled={
                                !this.props.state.showClinicalTrackLegends
                            }
                        />{' '}
                        Only show clinical track legends for altered{' '}
                        {this.props.state.columnMode === 'patient'
                            ? 'patients'
                            : 'samples'}
                        .
                    </label>
                </div>
                <div className="checkbox">
                    <label>
                        <input
                            type="checkbox"
                            value={EVENT_KEY.showOqlInLabels}
                            checked={this.props.state.showOqlInLabels}
                            onClick={this.onInputClick}
                        />{' '}
                        Show OQL filters
                    </label>
                </div>
            </CustomDropdown>
        );
    }

    private getDownloadMenu() {
        return (
            <CustomDropdown
                bsStyle="default"
                title="Download"
                id="downloadDropdownButton"
            >
                <button
                    className="btn btn-sm btn-default"
                    name={EVENT_KEY.downloadPDF}
                    onClick={this.onButtonClick}
                >
                    PDF
                </button>
                <button
                    className="btn btn-sm btn-default"
                    name={EVENT_KEY.downloadPNG}
                    onClick={this.onButtonClick}
                >
                    PNG
                </button>
                <button
                    className="btn btn-sm btn-default"
                    name={EVENT_KEY.downloadSVG}
                    onClick={this.onButtonClick}
                >
                    SVG
                </button>
                <button
                    className="btn btn-sm btn-default"
                    name={EVENT_KEY.downloadOrder}
                    onClick={this.onButtonClick}
                >
                    {(this.props.state.columnMode &&
                        this.props.state.columnMode[0].toUpperCase() +
                            this.props.state.columnMode.slice(1)) ||
                        'Sample'}{' '}
                    order
                </button>
                {!this.props.oncoprinterMode && (
                    <button
                        className="btn btn-sm btn-default"
                        name={EVENT_KEY.downloadTabular}
                        onClick={this.onButtonClick}
                    >
                        Tabular
                    </button>
                )}
            </CustomDropdown>
        );
    }

    private getHorzZoomControls() {
        return (
            <div className="btn btn-default oncoprint__zoom-controls">
                <DefaultTooltip overlay={<span>Zoom out of oncoprint.</span>}>
                    <div onClick={this.onZoomOutClick}>
                        <i className="fa fa-search-minus"></i>
                    </div>
                </DefaultTooltip>
                <DefaultTooltip
                    overlay={<span>Zoom in/out of oncoprint.</span>}
                >
                    <div style={{ width: '90px' }}>
                        <Slider
                            value={this.horzZoomSliderState}
                            onChange={this.onHorzZoomSliderChange}
                            onChangeComplete={this.onHorzZoomSliderSet}
                            step={0.01}
                            max={1}
                            min={0}
                            tooltip={false}
                        />
                    </div>
                </DefaultTooltip>

                <EditableSpan
                    value={(100 * this.horzZoomSliderState).toFixed()}
                    setValue={this.onSetHorzZoomTextInput}
                    maxChars={3}
                    numericOnly={true}
                    textFieldAppearance={true}
                    style={{
                        background: 'white',
                        minWidth: '30px',
                        fontSize: '14px',
                        fontFamily: 'arial',
                        border: 'none',
                        padding: 0,
                        marginTop: 0,
                        marginBottom: 0,
                        marginRight: 2,
                    }}
                />
                <div>%</div>

                <DefaultTooltip overlay={<span>Zoom in to oncoprint.</span>}>
                    <div onClick={this.onZoomInClick}>
                        <i className="fa fa-search-plus"></i>
                    </div>
                </DefaultTooltip>
            </div>
        );
    }

    @computed get showMinimap() {
        return this.props.state.showMinimap;
    }

    private get minimapButton() {
        return (
            <div className="btn-group">
                <DefaultTooltip overlay={<span>Toggle minimap panel.</span>}>
                    <Button
                        active={this.showMinimap}
                        onClick={this.toggleShowMinimap}
                    >
                        <img
                            src={require('./toggle-minimap.svg')}
                            alt="icon"
                            style={{ width: 15, height: 15 }}
                        />
                    </Button>
                </DefaultTooltip>
            </div>
        );
    }

    private getSortMenu() {
        if (this.props.oncoprinterMode) {
            return this.getSortMenuOncoprinter();
        } else {
            return this.getSortMenuOncoprint();
        }
    }

    render() {
        return (
            <div className="oncoprint__controls">
                <ButtonGroup>
                    <Observer>{this.getClinicalTracksMenu}</Observer>
                    <Observer>{this.getHeatmapMenu}</Observer>
                    <Observer>{this.getSortMenu}</Observer>
                    <Observer>{this.getMutationColorMenu}</Observer>
                    <Observer>{this.getViewMenu}</Observer>
                    <Observer>{this.getDownloadMenu}</Observer>
                    <Observer>{this.getHorzZoomControls}</Observer>
                    {this.minimapButton}
                </ButtonGroup>
            </div>
        );
    }
}
