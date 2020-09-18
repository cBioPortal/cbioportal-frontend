import * as React from 'react';
import { Observer, observer } from 'mobx-react';
import {
    action,
    computed,
    IObservableObject,
    IReactionDisposer,
    observable,
} from 'mobx';
import {
    capitalize,
    FadeInteraction,
    remoteData,
    svgToPdfDownload,
} from 'cbioportal-frontend-commons';
import { getRemoteDataGroupStatus } from 'cbioportal-utils';
import Oncoprint, {
    ClinicalTrackSpec,
    GENETIC_TRACK_GROUP_INDEX,
    GeneticTrackDatum_Data,
    GeneticTrackSpec,
    IGenesetHeatmapTrackSpec,
    IHeatmapTrackSpec,
} from './Oncoprint';
import OncoprintControls, {
    IOncoprintControlsHandlers,
    IOncoprintControlsState,
    ISelectOption,
} from 'shared/components/oncoprint/controls/OncoprintControls';
import {
    ClinicalAttribute,
    Gene,
    MolecularProfile,
    Patient,
    Sample,
} from 'cbioportal-ts-api-client';
import {
    AlterationTypeConstants,
    ResultsViewPageStore,
} from '../../../pages/resultsView/ResultsViewPageStore';
import {
    getAlteredUids,
    getUnalteredUids,
    makeClinicalTracksMobxPromise,
    makeGenericAssayProfileHeatmapTracksMobxPromise,
    makeGenesetHeatmapExpansionsMobxPromise,
    makeGenesetHeatmapTracksMobxPromise,
    makeGeneticTracksMobxPromise,
    makeHeatmapTracksMobxPromise,
} from './OncoprintUtils';
import _ from 'lodash';
import onMobxPromise from 'shared/lib/onMobxPromise';
import AppConfig from 'appConfig';
import LoadingIndicator from 'shared/components/loadingIndicator/LoadingIndicator';
import OncoprintJS, {
    TrackGroupHeader,
    TrackGroupIndex,
    TrackId,
} from 'oncoprintjs';
import fileDownload from 'react-file-download';
import tabularDownload from './tabularDownload';
import classNames from 'classnames';
import {
    clinicalAttributeIsLocallyComputed,
    SpecialAttribute,
} from '../../cache/ClinicalDataCache';
import OqlStatusBanner from '../banners/OqlStatusBanner';
import {
    genericAssayEntitiesToSelectOptionsGroupByGenericAssayType,
    getAnnotatingProgressMessage,
    makeTrackGroupHeaders,
} from './ResultsViewOncoprintUtils';
import ProgressIndicator, {
    IProgressIndicatorItem,
} from '../progressIndicator/ProgressIndicator';
import autobind from 'autobind-decorator';
import { parseOQLQuery } from '../../lib/oql/oqlfilter';
import AlterationFilterWarning from '../banners/AlterationFilterWarning';
import WindowStore from '../window/WindowStore';
import { OncoprintAnalysisCaseType } from '../../../pages/resultsView/ResultsViewPageStoreUtils';
import ResultsViewURLWrapper from 'pages/resultsView/ResultsViewURLWrapper';
import CaseFilterWarning from '../banners/CaseFilterWarning';
import {
    getOncoprinterClinicalInput,
    getOncoprinterGeneticInput,
    getOncoprinterHeatmapInput,
} from '../../../pages/staticPages/tools/oncoprinter/OncoprinterImportUtils';
import { buildCBioPortalPageUrl } from '../../api/urls';

interface IResultsViewOncoprintProps {
    divId: string;
    store: ResultsViewPageStore;
    urlWrapper: ResultsViewURLWrapper;
    addOnBecomeVisibleListener?: (callback: () => void) => void;
}

export enum SortByUrlParamValue {
    CASE_ID = 'case_id',
    CASE_LIST = 'case_list',
    NONE = '',
}

export type SortMode =
    | {
          type: 'data' | 'alphabetical' | 'caseList';
          clusteredHeatmapProfile?: undefined;
      }
    | { type: 'heatmap'; clusteredHeatmapProfile: string };

export interface IGenesetExpansionRecord {
    entrezGeneId: number;
    hugoGeneSymbol: string;
    molecularProfileId: string;
    correlationValue: number;
}

const CLINICAL_TRACK_KEY_PREFIX = 'CLINICALTRACK_';

/*  Each heatmap track group can hold tracks of a single entity type.
    Implemented entity types are genes and generic assay entites. In the
    HeatmapTrackGroupRecord type the `entities` member refers to
    hugo_gene_symbols (for genes) or to entity_id's (for generic assay entities). */
export type HeatmapTrackGroupRecord = {
    trackGroupIndex: number;
    molecularAlterationType: string;
    entities: { [entity: string]: boolean }; // map of hugo_gene_symbols or entity_id's
    molecularProfileId: string;
};

/* fields and methods in the class below are ordered based on roughly
/* chronological setup concerns, rather than on encapsulation and public API */
/* tslint:disable: member-ordering */
@observer
export default class ResultsViewOncoprint extends React.Component<
    IResultsViewOncoprintProps,
    {}
> {
    @computed get columnMode() {
        debugger;
        return this.urlWrapper.query.show_samples === 'true'
            ? 'sample'
            : 'patient';
    }

    @computed get sortMode() {
        let mode: SortMode;
        switch (this.urlWrapper.query.oncoprint_sortby) {
            case 'case_id':
                mode = { type: 'alphabetical' };
                break;
            case 'case_list':
                mode = { type: 'caseList' };
                break;
            case 'cluster':
                mode = {
                    type: 'heatmap',
                    clusteredHeatmapProfile: this.urlWrapper.query
                        .oncoprint_cluster_profile,
                };
                break;
            case '':
            default:
                mode = { type: 'data' };
        }

        return mode;
    }

    @computed get sortByMutationType() {
        return (
            !this.urlWrapper.query.oncoprint_sort_by_mutation_type || // on by default
            this.urlWrapper.query.oncoprint_sort_by_mutation_type === 'true'
        );
    }

    @computed get sortByDrivers() {
        return (
            !this.urlWrapper.query.oncoprint_sort_by_drivers || // on by default
            this.urlWrapper.query.oncoprint_sort_by_drivers === 'true'
        );
    }

    @computed get selectedGenericAssayEntitiesGroupByGenericAssayTypeFromUrl() {
        const result = _.reduce(
            this.props.store
                .selectedGenericAssayEntitiesGroupByMolecularProfileId,
            (acc, entityId, profileId) => {
                if (
                    this.props.store.molecularProfileIdToMolecularProfile
                        .result[profileId]
                ) {
                    const type = this.props.store
                        .molecularProfileIdToMolecularProfile.result[profileId]
                        .genericAssayType;
                    acc[type] = acc[type]
                        ? _.union(entityId, acc[type])
                        : entityId;
                }
                return acc;
            },
            {} as { [genericAssayType: string]: string[] }
        );
        return result;
    }

    @observable distinguishGermlineMutations: boolean = true;
    @observable distinguishMutationType: boolean = true;
    @observable showUnalteredColumns: boolean = true;
    @observable showWhitespaceBetweenColumns: boolean = true;
    @observable showClinicalTrackLegends: boolean = true;
    @observable _onlyShowClinicalLegendForAlteredCases = false;
    @observable showOqlInLabels = false;

    @computed get onlyShowClinicalLegendForAlteredCases() {
        return (
            this.showClinicalTrackLegends &&
            this._onlyShowClinicalLegendForAlteredCases
        );
    }

    @observable showMinimap: boolean = false;

    @observable selectedHeatmapProfileId = '';
    @observable heatmapGeneInputValue = '';

    @observable horzZoom: number = 0.5;

    @observable mouseInsideBounds: boolean = false;

    @observable renderingComplete = false;

    private heatmapGeneInputValueUpdater: IReactionDisposer;

    private molecularProfileIdToHeatmapTrackGroupIndex: {
        [molecularProfileId: string]: number;
    } = {};

    @computed get selectedClinicalAttributeIds() {
        const list = this.urlWrapper.query.clinicallist
            ? this.urlWrapper.query.clinicallist.split(',')
            : [];

        // when there is no user selection in ULR, we want to
        // have some default tracks based on certain conditions
        if (this.urlWrapper.query.clinicallist === undefined) {
            if (
                this.props.store.studyIds.result &&
                this.props.store.studyIds.result.length > 1
            ) {
                list.push(SpecialAttribute.StudyOfOrigin);
            }

            if (
                this.props.store.filteredSamples.result &&
                this.props.store.filteredPatients.result &&
                this.props.store.filteredSamples.result.length >
                    this.props.store.filteredPatients.result.length
            ) {
                list.push(SpecialAttribute.NumSamplesPerPatient);
            }

            _.forEach(
                this.props.store.clinicalAttributes_profiledIn.result,
                attr => {
                    list.push(attr.clinicalAttributeId);
                }
            );
        }

        return list.reduce((acc, key) => {
            acc.set(key, true);
            return acc;
        }, observable.shallowMap<boolean>());
    }

    public expansionsByGeneticTrackKey = observable.map<number[]>();
    public expansionsByGenesetHeatmapTrackKey = observable.map<
        IGenesetExpansionRecord[]
    >();

    @computed get molecularProfileIdToHeatmapTracks() {
        // empty if no heatmap tracks param
        const groups = this.urlWrapper.query.heatmap_track_groups
            ? this.urlWrapper.query.heatmap_track_groups
                  .split(';')
                  .map((x: string) => x.split(','))
            : [];

        const parsedGroups = groups.reduce(
            (acc: { [molecularProfileId: string]: string[] }, group) => {
                acc[group[0] as string] = group.slice(1);
                return acc;
            },
            {}
        );

        const map: {
            [molecularProfileId: string]: HeatmapTrackGroupRecord;
        } = {};

        let nextTrackGroupIndex: number;
        // start next track group index based on existing heatmap track groups
        if (_.isEmpty(this.molecularProfileIdToHeatmapTrackGroupIndex)) {
            nextTrackGroupIndex = 2;
        } else {
            nextTrackGroupIndex =
                Math.max(
                    ..._.values(this.molecularProfileIdToHeatmapTrackGroupIndex)
                ) + 1;
        }
        _.forEach(parsedGroups, (entities: string[], molecularProfileId) => {
            const profile: MolecularProfile = this.props.store
                .molecularProfileIdToMolecularProfile.result[
                molecularProfileId
            ];
            if (profile && entities && entities.length) {
                if (
                    !(
                        profile.molecularProfileId in
                        this.molecularProfileIdToHeatmapTrackGroupIndex
                    )
                ) {
                    // set track group index if doesnt yet exist
                    this.molecularProfileIdToHeatmapTrackGroupIndex[
                        profile.molecularProfileId
                    ] = nextTrackGroupIndex;
                    nextTrackGroupIndex += 1;
                }
                const trackGroup: HeatmapTrackGroupRecord = {
                    trackGroupIndex: this
                        .molecularProfileIdToHeatmapTrackGroupIndex[
                        profile.molecularProfileId
                    ],
                    molecularProfileId: profile.molecularProfileId,
                    molecularAlterationType: profile.molecularAlterationType,
                    entities: {},
                };
                entities.forEach(
                    (entity: string) => (trackGroup.entities[entity] = true)
                );
                map[molecularProfileId] = trackGroup;
            }
        });
        return map;
    }

    public controlsHandlers: IOncoprintControlsHandlers;
    private controlsState: IOncoprintControlsState & IObservableObject;

    @observable.ref private oncoprint: OncoprintJS;

    private urlParamsReaction: IReactionDisposer;

    constructor(props: IResultsViewOncoprintProps) {
        super(props);

        this.showOqlInLabels = props.store.queryContainsOql;
        (window as any).resultsViewOncoprint = this;

        const self = this;

        this.onChangeSelectedClinicalTracks = this.onChangeSelectedClinicalTracks.bind(
            this
        );
        this.onDeleteClinicalTrack = this.onDeleteClinicalTrack.bind(this);
        this.onMinimapClose = this.onMinimapClose.bind(this);
        this.oncoprintRef = this.oncoprintRef.bind(this);
        this.toggleColumnMode = this.toggleColumnMode.bind(this);
        this.onTrackSortDirectionChange = this.onTrackSortDirectionChange.bind(
            this
        );
        this.onSuppressRendering = this.onSuppressRendering.bind(this);
        this.onReleaseRendering = this.onReleaseRendering.bind(this);

        onMobxPromise(
            this.props.store.heatmapMolecularProfiles,
            (profiles: MolecularProfile[]) => {
                // select first initially
                if (profiles.length) {
                    this.selectedHeatmapProfileId =
                        profiles[0].molecularProfileId;
                }
            }
        );

        this.heatmapGeneInputValueUpdater = onMobxPromise(
            this.props.store.genes,
            (genes: Gene[]) => {
                this.heatmapGeneInputValue = genes
                    .map(g => g.hugoGeneSymbol)
                    .join(' ');
            },
            Number.POSITIVE_INFINITY
        );

        this.onMouseEnter = this.onMouseEnter.bind(this);
        this.onMouseLeave = this.onMouseLeave.bind(this);

        this.controlsHandlers = this.buildControlsHandlers();

        this.controlsState = observable({
            get selectedClinicalAttributeIds() {
                return self.selectedClinicalAttributeIds.keys();
            },
            get selectedColumnType() {
                return self.oncoprintAnalysisCaseType;
            },
            get showUnalteredColumns() {
                return self.showUnalteredColumns;
            },
            get showWhitespaceBetweenColumns() {
                return self.showWhitespaceBetweenColumns;
            },
            get showClinicalTrackLegends() {
                return self.showClinicalTrackLegends;
            },
            get onlyShowClinicalLegendForAlteredCases() {
                return self.onlyShowClinicalLegendForAlteredCases;
            },
            get showOqlInLabels() {
                return self.showOqlInLabels;
            },
            get showMinimap() {
                return self.showMinimap;
            },
            get hideHeatmapMenu() {
                return self.props.store.studies.result.length > 1;
            },
            get sortByMutationType() {
                return self.sortByMutationType;
            },
            get sortByCaseListDisabled() {
                return !self.caseListSortPossible;
            },
            get distinguishMutationType() {
                return self.distinguishMutationType;
            },
            get distinguishDrivers() {
                return self.distinguishDrivers;
            },
            get distinguishGermlineMutations() {
                return self.distinguishGermlineMutations;
            },
            get annotateDriversOncoKb() {
                return self.props.store.driverAnnotationSettings.oncoKb;
            },
            get annotateDriversOncoKbDisabled() {
                return !AppConfig.serverConfig.show_oncokb;
            },
            get annotateDriversOncoKbError() {
                return self.props.store.didOncoKbFailInOncoprint;
            },
            get annotateDriversHotspots() {
                return self.props.store.driverAnnotationSettings.hotspots;
            },
            get annotateDriversHotspotsDisabled() {
                return !AppConfig.serverConfig.show_hotspot;
            },
            get annotateDriversHotspotsError() {
                return self.props.store.didHotspotFailInOncoprint;
            },
            get annotateDriversCBioPortal() {
                return self.props.store.driverAnnotationSettings
                    .cbioportalCount;
            },
            get annotateDriversCOSMIC() {
                return self.props.store.driverAnnotationSettings.cosmicCount;
            },
            get hidePutativePassengers() {
                return self.props.store.driverAnnotationSettings.excludeVUS;
            },
            get hideGermlineMutations() {
                return self.props.store.excludeGermlineMutations;
            },
            get annotateCBioPortalInputValue() {
                return (
                    self.props.store.driverAnnotationSettings
                        .cbioportalCountThreshold + ''
                );
            },
            get annotateCOSMICInputValue() {
                return (
                    self.props.store.driverAnnotationSettings
                        .cosmicCountThreshold + ''
                );
            },
            get sortMode() {
                return self.sortMode;
            },
            get sortByDrivers() {
                return self.sortByDrivers;
            },
            get heatmapProfilesPromise() {
                return self.props.store.heatmapMolecularProfiles;
            },
            get genericAssayEntitiesGroupByGenericAssayTypePromise() {
                return self.props.store
                    .genericAssayEntitiesGroupByGenericAssayType;
            },
            get selectedHeatmapProfileId() {
                return self.selectedHeatmapProfileId;
            },
            get selectedHeatmapProfileAlterationType() {
                return self.selectedHeatmapProfileAlterationType;
            },
            get selectedHeatmapProfileGenericAssayType() {
                return self.selectedHeatmapProfileGenericAssayType;
            },
            get heatmapIsDynamicallyQueried() {
                return self.heatmapIsDynamicallyQueried;
            },
            get ngchmButtonActive() {
                return AppConfig.serverConfig.show_mdacc_heatmap &&
                    self.props.store.remoteNgchmUrl.result &&
                    self.props.store.remoteNgchmUrl.result != ''
                    ? true
                    : false;
            },
            get heatmapGeneInputValue() {
                return self.heatmapGeneInputValue;
            },
            get customDriverAnnotationBinaryMenuLabel() {
                const label =
                    AppConfig.serverConfig
                        .oncoprint_custom_driver_annotation_binary_menu_label;
                const customDriverReport =
                    self.props.store.customDriverAnnotationReport.result;
                if (
                    label &&
                    customDriverReport &&
                    customDriverReport.hasBinary
                ) {
                    return label;
                } else {
                    return undefined;
                }
            },
            get customDriverAnnotationTiersMenuLabel() {
                const label =
                    AppConfig.serverConfig
                        .oncoprint_custom_driver_annotation_tiers_menu_label;
                const customDriverReport =
                    self.props.store.customDriverAnnotationReport.result;
                if (
                    label &&
                    customDriverReport &&
                    customDriverReport.tiers.length
                ) {
                    return label;
                } else {
                    return undefined;
                }
            },
            get customDriverAnnotationTiers() {
                const customDriverReport =
                    self.props.store.customDriverAnnotationReport.result;
                if (customDriverReport && customDriverReport.tiers.length) {
                    return customDriverReport.tiers;
                } else {
                    return undefined;
                }
            },
            get annotateCustomDriverBinary() {
                return self.props.store.driverAnnotationSettings.customBinary;
            },
            get selectedCustomDriverAnnotationTiers() {
                return self.props.store.driverAnnotationSettings.driverTiers;
            },
            get columnMode() {
                return self.oncoprintAnalysisCaseType;
            },
            get horzZoom() {
                if (isNaN(self.horzZoom)) {
                    return 1;
                } else {
                    return self.horzZoom;
                }
            },
        });
    }

    get urlWrapper() {
        return this.props.urlWrapper;
    }

    @computed get caseListSortPossible(): boolean {
        return !!(
            this.props.store.givenSampleOrder.isComplete &&
            this.props.store.givenSampleOrder.result.length
        );
    }

    @computed get distinguishDrivers() {
        return this.props.store.driverAnnotationSettings.driversAnnotated;
    }

    onMouseEnter() {
        this.mouseInsideBounds = true;
    }

    onMouseLeave() {
        this.mouseInsideBounds = false;
    }

    @action
    public selectHeatmapProfile(index: number) {
        onMobxPromise(
            this.props.store.heatmapMolecularProfiles,
            (profiles: MolecularProfile[]) => {
                this.selectedHeatmapProfileId = this.props.store.heatmapMolecularProfiles.result![
                    index
                ].molecularProfileId;
            }
        );
    }

    @action
    public setAnnotateCBioPortalInputValue(value: string) {
        this.controlsHandlers.onChangeAnnotateCBioPortalInputValue &&
            this.controlsHandlers.onChangeAnnotateCBioPortalInputValue(value);
    }

    @action
    public setAnnotateCOSMICInputValue(value: string) {
        this.controlsHandlers.onChangeAnnotateCOSMICInputValue &&
            this.controlsHandlers.onChangeAnnotateCOSMICInputValue(value);
    }

    private buildControlsHandlers() {
        return {
            onSelectColumnType: (type: OncoprintAnalysisCaseType) => {
                this.props.store.setOncoprintAnalysisCaseType(type);
            },
            onSelectShowUnalteredColumns: (show: boolean) => {
                this.showUnalteredColumns = show;
            },
            onSelectShowWhitespaceBetweenColumns: (show: boolean) => {
                this.showWhitespaceBetweenColumns = show;
            },
            onSelectShowClinicalTrackLegends: (show: boolean) => {
                this.showClinicalTrackLegends = show;
            },
            onSelectOnlyShowClinicalLegendForAlteredCases: (show: boolean) => {
                this._onlyShowClinicalLegendForAlteredCases = show;
            },
            onSelectShowOqlInLabels: (show: boolean) => {
                this.showOqlInLabels = show;
            },
            onSelectShowMinimap: (show: boolean) => {
                this.showMinimap = show;
            },
            onSelectDistinguishMutationType: (s: boolean) => {
                this.distinguishMutationType = s;
            },
            onSelectDistinguishDrivers: action((s: boolean) => {
                if (!s) {
                    this.props.store.driverAnnotationSettings.oncoKb = false;
                    this.props.store.driverAnnotationSettings.hotspots = false;
                    this.props.store.driverAnnotationSettings.cbioportalCount = false;
                    this.props.store.driverAnnotationSettings.cosmicCount = false;
                    this.props.store.driverAnnotationSettings.customBinary = false;
                    this.props.store.driverAnnotationSettings.driverTiers.forEach(
                        (value, key) => {
                            this.props.store.driverAnnotationSettings.driverTiers.set(
                                key,
                                false
                            );
                        }
                    );
                    this.props.store.driverAnnotationSettings.excludeVUS = false;
                } else {
                    if (
                        !this.controlsState.annotateDriversOncoKbDisabled &&
                        !this.controlsState.annotateDriversOncoKbError
                    )
                        this.props.store.driverAnnotationSettings.oncoKb = true;

                    if (
                        !this.controlsState.annotateDriversHotspotsDisabled &&
                        !this.controlsState.annotateDriversHotspotsError
                    )
                        this.props.store.driverAnnotationSettings.hotspots = true;

                    this.props.store.driverAnnotationSettings.cbioportalCount = true;
                    this.props.store.driverAnnotationSettings.cosmicCount = true;
                    this.props.store.driverAnnotationSettings.customBinary = true;
                    this.props.store.driverAnnotationSettings.driverTiers.forEach(
                        (value, key) => {
                            this.props.store.driverAnnotationSettings.driverTiers.set(
                                key,
                                true
                            );
                        }
                    );
                }
            }),
            onSelectDistinguishGermlineMutations: (s: boolean) => {
                this.distinguishGermlineMutations = s;
            },
            onSelectAnnotateOncoKb: action((s: boolean) => {
                this.props.store.driverAnnotationSettings.oncoKb = s;
            }),
            onSelectAnnotateHotspots: action((s: boolean) => {
                this.props.store.driverAnnotationSettings.hotspots = s;
            }),
            onSelectAnnotateCBioPortal: action((s: boolean) => {
                this.props.store.driverAnnotationSettings.cbioportalCount = s;
            }),
            onSelectAnnotateCOSMIC: action((s: boolean) => {
                this.props.store.driverAnnotationSettings.cosmicCount = s;
            }),
            onChangeAnnotateCBioPortalInputValue: action((s: string) => {
                this.props.store.driverAnnotationSettings.cbioportalCountThreshold = parseInt(
                    s,
                    10
                );
                this.controlsHandlers.onSelectAnnotateCBioPortal &&
                    this.controlsHandlers.onSelectAnnotateCBioPortal(true);
            }),
            onChangeAnnotateCOSMICInputValue: action((s: string) => {
                this.props.store.driverAnnotationSettings.cosmicCountThreshold = parseInt(
                    s,
                    10
                );
                this.controlsHandlers.onSelectAnnotateCOSMIC &&
                    this.controlsHandlers.onSelectAnnotateCOSMIC(true);
            }),
            onSelectCustomDriverAnnotationBinary: action((s: boolean) => {
                this.props.store.driverAnnotationSettings.customBinary = s;
            }),
            onSelectCustomDriverAnnotationTier: action(
                (value: string, checked: boolean) => {
                    this.props.store.driverAnnotationSettings.driverTiers.set(
                        value,
                        checked
                    );
                }
            ),
            onSelectHidePutativePassengers: (s: boolean) => {
                this.props.store.driverAnnotationSettings.excludeVUS = s;
            },
            onSelectHideGermlineMutations: (s: boolean) => {
                this.props.store.setExcludeGermlineMutations(s);
            },
            onSelectSortByMutationType: (s: boolean) => {
                this.urlWrapper.updateURL({
                    oncoprint_sort_by_mutation_type: s.toString(),
                });
            },
            onClickSortAlphabetical: () => {
                this.urlWrapper.updateURL({
                    oncoprint_sortby: 'case_id',
                    oncoprint_cluster_profile: '',
                });
            },
            onClickSortCaseListOrder: () => {
                this.urlWrapper.updateURL({
                    oncoprint_sortby: 'case_list',
                    oncoprint_cluster_profile: '',
                });
            },
            onSelectSortByDrivers: (sort: boolean) => {
                this.urlWrapper.updateURL({
                    oncoprint_sort_by_drivers: sort.toString(),
                });
            },
            onClickSortByData: () => {
                this.urlWrapper.updateURL({
                    oncoprint_sortby: '',
                    oncoprint_cluster_profile: '',
                });
            },
            onChangeSelectedClinicalTracks: this.onChangeSelectedClinicalTracks,
            onChangeHeatmapGeneInputValue: action((s: string) => {
                this.heatmapGeneInputValue = s;
                this.heatmapGeneInputValueUpdater(); // stop updating heatmap input if user has typed
            }),
            onSelectHeatmapProfile: (id: string) => {
                this.selectedHeatmapProfileId = id;
            },
            onClickAddGenesToHeatmap: () => {
                const genes = parseOQLQuery(
                    this.heatmapGeneInputValue.toUpperCase().trim()
                ).map(q => q.gene);
                this.addHeatmapTracks(this.selectedHeatmapProfileId, genes);
            },
            onClickAddGenericAssaysToHeatmap: (entityIds: string[]) => {
                this.addHeatmapTracks(this.selectedHeatmapProfileId, entityIds);
            },
            onClickNGCHM: () => {
                window.open(this.props.store.remoteNgchmUrl.result, '_blank');
            },
            onClickDownload: (type: string) => {
                switch (type) {
                    case 'pdf':
                        svgToPdfDownload(
                            'oncoprint.pdf',
                            this.oncoprint.toSVG(false)
                        );
                        // if (!pdfDownload("oncoprint.pdf", this.oncoprint.toSVG(true))) {
                        //     alert("Oncoprint too big to download as PDF - please download as SVG.");
                        // }
                        break;
                    case 'png':
                        const img = this.oncoprint.toCanvas(
                            (canvas, truncated) => {
                                canvas.toBlob(blob => {
                                    if (truncated) {
                                        alert(
                                            `Oncoprint too large - PNG truncated to ${canvas.getAttribute(
                                                'width'
                                            )}x${canvas.getAttribute('height')}`
                                        );
                                    }
                                    fileDownload(blob, 'oncoprint.png');
                                });
                            },
                            2
                        );
                        break;
                    case 'svg':
                        fileDownload(
                            new XMLSerializer().serializeToString(
                                this.oncoprint.toSVG(false)
                            ),
                            'oncoprint.svg'
                        );
                        break;
                    case 'order':
                        const capitalizedColumnMode = capitalize(
                            this.oncoprintAnalysisCaseType
                        );
                        onMobxPromise(
                            [
                                this.props.store.sampleKeyToSample,
                                this.props.store.patientKeyToPatient,
                            ],
                            (
                                sampleKeyToSample: {
                                    [sampleKey: string]: Sample;
                                },
                                patientKeyToPatient: any
                            ) => {
                                let file = `${capitalizedColumnMode} order in the Oncoprint is:\n`;
                                const keyToCase =
                                    this.oncoprintAnalysisCaseType ===
                                    OncoprintAnalysisCaseType.SAMPLE
                                        ? sampleKeyToSample
                                        : patientKeyToPatient;
                                const caseIds = this.oncoprint
                                    .getIdOrder()
                                    .map(
                                        this.oncoprintAnalysisCaseType ===
                                            OncoprintAnalysisCaseType.SAMPLE
                                            ? (id: string) =>
                                                  sampleKeyToSample[id].sampleId
                                            : (id: string) =>
                                                  patientKeyToPatient[id]
                                                      .patientId
                                    );
                                for (const caseId of caseIds) {
                                    file += `${caseId}\n`;
                                }
                                fileDownload(
                                    file,
                                    `OncoPrint${capitalizedColumnMode}s.txt`
                                );
                            }
                        );
                        break;
                    case 'tabular':
                        onMobxPromise(
                            [
                                this.props.store.sampleKeyToSample,
                                this.props.store.patientKeyToPatient,
                            ],
                            (
                                sampleKeyToSample: {
                                    [sampleKey: string]: Sample;
                                },
                                patientKeyToPatient: any
                            ) => {
                                tabularDownload(
                                    this.geneticTracks.result,
                                    this.clinicalTracks.result,
                                    this.heatmapTracks.result,
                                    this.genericAssayHeatmapTracks.result,
                                    this.genesetHeatmapTracks.result,
                                    this.oncoprint.getIdOrder(),
                                    this.oncoprintAnalysisCaseType ===
                                        OncoprintAnalysisCaseType.SAMPLE
                                        ? (key: string) =>
                                              sampleKeyToSample[key].sampleId
                                        : (key: string) =>
                                              patientKeyToPatient[key]
                                                  .patientId,
                                    this.oncoprintAnalysisCaseType,
                                    this.distinguishDrivers
                                );
                            }
                        );
                        break;
                    case 'oncoprinter':
                        onMobxPromise(
                            [
                                this.props.store.samples,
                                this.props.store.patients,
                                this.geneticTracks,
                                this.clinicalTracks,
                                this.heatmapTracks,
                                this.genesetHeatmapTracks,
                                this.props.store
                                    .clinicalAttributeIdToClinicalAttribute,
                            ],
                            (
                                samples: Sample[],
                                patients: Patient[],
                                geneticTracks: GeneticTrackSpec[],
                                clinicalTracks: ClinicalTrackSpec[],
                                heatmapTracks: IHeatmapTrackSpec[],
                                genesetHeatmapTracks: IGenesetHeatmapTrackSpec[],
                                attributeIdToAttribute: {
                                    [attributeId: string]: ClinicalAttribute;
                                }
                            ) => {
                                const caseIds =
                                    this.oncoprintAnalysisCaseType ===
                                    OncoprintAnalysisCaseType.SAMPLE
                                        ? samples.map(s => s.sampleId)
                                        : patients.map(p => p.patientId);

                                let geneticInput = '';
                                if (geneticTracks.length > 0) {
                                    geneticInput = getOncoprinterGeneticInput(
                                        geneticTracks,
                                        caseIds,
                                        this.oncoprintAnalysisCaseType
                                    );
                                }

                                let clinicalInput = '';
                                if (clinicalTracks.length > 0) {
                                    const oncoprintClinicalData = _.flatMap(
                                        clinicalTracks,
                                        (track: ClinicalTrackSpec) => track.data
                                    );
                                    clinicalInput = getOncoprinterClinicalInput(
                                        oncoprintClinicalData,
                                        caseIds,
                                        clinicalTracks.map(
                                            track => track.attributeId
                                        ),
                                        attributeIdToAttribute,
                                        this.oncoprintAnalysisCaseType
                                    );
                                }

                                let heatmapInput = '';
                                if (heatmapTracks.length > 0) {
                                    heatmapInput = getOncoprinterHeatmapInput(
                                        heatmapTracks,
                                        caseIds,
                                        this.oncoprintAnalysisCaseType
                                    );
                                }

                                if (genesetHeatmapTracks.length > 0) {
                                    alert(
                                        'Oncoprinter does not support geneset heatmaps - all other tracks will still be exported.'
                                    );
                                }

                                const oncoprinterWindow = window.open(
                                    buildCBioPortalPageUrl('/oncoprinter')
                                ) as any;
                                oncoprinterWindow.clientPostedData = {
                                    genetic: geneticInput,
                                    clinical: clinicalInput,
                                    heatmap: heatmapInput,
                                };
                            }
                        );
                        break;
                }
            },
            onSetHorzZoom: (z: number) => {
                this.oncoprint.setHorzZoomCentered(z);
            },
            onClickZoomIn: () => {
                this.oncoprint.setHorzZoomCentered(
                    this.oncoprint.getHorzZoom() / 0.7
                );
            },
            onClickZoomOut: () => {
                this.oncoprint.setHorzZoomCentered(
                    this.oncoprint.getHorzZoom() * 0.7
                );
            },
        };
    }

    /**
     * Indicates whether dynamic heatmap querying controls are relevant.
     *
     * They are if a non-geneset heatmap profile is currently selected; gene set
     * heatmaps are queried from the query page.
     */
    @computed get heatmapIsDynamicallyQueried(): boolean {
        const profileMap = this.props.store.molecularProfileIdToMolecularProfile
            .result;
        return (
            profileMap.hasOwnProperty(this.selectedHeatmapProfileId) &&
            profileMap[this.selectedHeatmapProfileId]
                .molecularAlterationType !==
                AlterationTypeConstants.GENESET_SCORE
        );
    }

    @action public sortByData() {
        this.urlWrapper.updateURL({
            oncoprint_sortby: '',
            oncoprint_cluster_profile: '',
        });
    }

    @computed get clinicalTracksUrlParam() {
        return this.selectedClinicalAttributeIds.keys().join(',');
    }

    private readonly unalteredKeys = remoteData({
        await: () => [this.geneticTracks],
        invoke: async () => getUnalteredUids(this.geneticTracks.result!),
    });

    readonly genericAssayEntitiesSelectOptionsGroupByGenericAssayType = remoteData<{
        [genericAssayType: string]: ISelectOption[];
    }>({
        await: () => [
            this.props.store.genericAssayEntitiesGroupByGenericAssayType,
        ],
        invoke: async () => {
            return Promise.resolve(
                genericAssayEntitiesToSelectOptionsGroupByGenericAssayType(
                    this.props.store.genericAssayEntitiesGroupByGenericAssayType
                        .result!
                )
            );
        },
    });

    readonly genericAssayEntitiesSelectOptionsGroupByMolecularProfileId = remoteData<{
        [genericAssayType: string]: ISelectOption[];
    }>({
        await: () => [
            this.props.store.genericAssayEntitiesGroupByMolecularProfileId,
        ],
        invoke: async () => {
            return Promise.resolve(
                genericAssayEntitiesToSelectOptionsGroupByGenericAssayType(
                    this.props.store
                        .genericAssayEntitiesGroupByMolecularProfileId.result!
                )
            );
        },
    });

    @computed get selectedHeatmapProfileAlterationType(): string | undefined {
        let molecularProfile = this.props.store
            .molecularProfileIdToMolecularProfile.result[
            this.selectedHeatmapProfileId
        ];
        return molecularProfile
            ? molecularProfile.molecularAlterationType
            : undefined;
    }

    @computed get selectedHeatmapProfileGenericAssayType(): string | undefined {
        if (
            this.props.store.molecularProfileIdToMolecularProfile.result &&
            this.selectedHeatmapProfileAlterationType ===
                AlterationTypeConstants.GENERIC_ASSAY
        ) {
            return this.props.store.molecularProfileIdToMolecularProfile.result[
                this.selectedHeatmapProfileId
            ].genericAssayType;
        }
        return undefined;
    }

    public addHeatmapTracks(molecularProfileId: string, entities: string[]) {
        const tracksMap = _.cloneDeep(
            this.molecularProfileIdToHeatmapTracks
        ) as {
            [molecularProfileId: string]: Pick<
                HeatmapTrackGroupRecord,
                'entities' | 'molecularProfileId' | 'molecularAlterationType'
            >;
        };

        const entitiesMap = _.chain(entities)
            .keyBy(entity => entity)
            .mapValues(() => true)
            .value();

        // first delete any existing track for this profileId
        delete tracksMap[molecularProfileId];

        const molecularAlterationType = this.props.store
            .molecularProfileIdToMolecularProfile.result[molecularProfileId]
            .molecularAlterationType!;

        if (entities && entities.length) {
            tracksMap[molecularProfileId] = {
                entities: entitiesMap,
                molecularAlterationType,
                molecularProfileId,
            };
        } else {
            delete tracksMap[molecularProfileId];
        }

        const heatmap_track_groups = _.map(
            tracksMap,
            (track, molecularProfileId) => {
                return `${molecularProfileId},${_.keys(track.entities).join(
                    ','
                )}`;
            }
        ).join(';');

        // derive generic assay from heatmap tracks since the only way to add generic assay entities right now
        // is to use heatmap UI in oncoprint
        const generic_assay_groups = _.filter(
            tracksMap,
            (x: HeatmapTrackGroupRecord) =>
                x.molecularAlterationType ===
                AlterationTypeConstants.GENERIC_ASSAY
        )
            .map(track => {
                return `${track.molecularProfileId},${_.keys(
                    track.entities
                ).join(',')}`;
            })
            .join(';');

        this.urlWrapper.updateURL({
            heatmap_track_groups,
            generic_assay_groups,
        });
    }

    private toggleColumnMode() {
        switch (this.oncoprintAnalysisCaseType) {
            case OncoprintAnalysisCaseType.SAMPLE:
                this.controlsHandlers.onSelectColumnType &&
                    this.controlsHandlers.onSelectColumnType(
                        OncoprintAnalysisCaseType.PATIENT
                    );
                break;
            case OncoprintAnalysisCaseType.PATIENT:
                this.controlsHandlers.onSelectColumnType &&
                    this.controlsHandlers.onSelectColumnType(
                        OncoprintAnalysisCaseType.SAMPLE
                    );
                break;
        }
    }

    private oncoprintRef(oncoprint: OncoprintJS) {
        this.oncoprint = oncoprint;
        if (this.props.addOnBecomeVisibleListener) {
            this.props.addOnBecomeVisibleListener(() =>
                this.oncoprint.triggerPendingResizeAndOrganize(
                    this.onReleaseRendering
                )
            );
        }

        this.oncoprint.onHorzZoom(z => (this.horzZoom = z));
        this.horzZoom = this.oncoprint.getHorzZoom();
        onMobxPromise(this.alteredKeys, (alteredUids: string[]) => {
            this.oncoprint.setHorzZoomToFit(alteredUids);
        });
    }

    private setColumnMode(type: OncoprintAnalysisCaseType) {
        this.urlWrapper.updateURL({
            show_samples:
                type === OncoprintAnalysisCaseType.SAMPLE ? 'true' : 'false',
        });
    }

    readonly alteredKeys = remoteData({
        await: () => [this.geneticTracks],
        invoke: async () => getAlteredUids(this.geneticTracks.result!),
        default: [],
    });

    @action private onMinimapClose() {
        this.showMinimap = false;
    }

    @action private onSuppressRendering() {
        this.renderingComplete = false;
    }

    @action private onReleaseRendering() {
        this.renderingComplete = true;
    }

    public clinicalTrackKeyToAttributeId(clinicalTrackKey: string) {
        return clinicalTrackKey.substr(CLINICAL_TRACK_KEY_PREFIX.length);
    }

    public clinicalAttributeIdToTrackKey(
        clinicalAttributeId: string | SpecialAttribute
    ) {
        return `${CLINICAL_TRACK_KEY_PREFIX}${clinicalAttributeId}`;
    }

    @action private onChangeSelectedClinicalTracks(
        clinicalAttributeIds: (string | SpecialAttribute)[]
    ) {
        this.urlWrapper.updateURL({
            clinicallist: clinicalAttributeIds.join(','),
        });
    }

    private onDeleteClinicalTrack(clinicalTrackKey: string) {
        // ignore tracks being deleted due to rendering process reasons
        if (!this.isHidden) {
            const ids = this.selectedClinicalAttributeIds.keys();
            const withoutDeleted = _.filter(
                ids,
                item =>
                    item !==
                    this.clinicalTrackKeyToAttributeId(clinicalTrackKey)
            );
            this.urlWrapper.updateURL({
                clinicallist: withoutDeleted.join(','),
            });
        }
    }

    private onTrackSortDirectionChange(trackId: TrackId, dir: number) {
        // called when a clinical or heatmap track is sorted a-Z or Z-a, selected from within oncoprintjs UI
        if (dir === 1 || dir === -1) {
            this.sortByData();
        }
    }

    @autobind
    @action
    public clearSortDirectionsAndSortByData() {
        if (this.oncoprint) {
            this.oncoprint.resetSortableTracksSortDirection();
            this.sortByData();
        }
    }

    // @computed
    public get oncoprintAnalysisCaseType() {
        // return (
        //     (this.routing.location.query as CancerStudyQueryUrlParams)
        //         .show_samples === 'true'
        // ) ? OncoprintAnalysisCaseType.SAMPLE : OncoprintAnalysisCaseType.PATIENT;
        return this.urlWrapper.query.show_samples === 'true'
            ? OncoprintAnalysisCaseType.SAMPLE
            : OncoprintAnalysisCaseType.PATIENT;
    }

    @computed get sortOrder() {
        if (this.sortMode.type === 'alphabetical') {
            return this.oncoprintAnalysisCaseType ===
                OncoprintAnalysisCaseType.SAMPLE
                ? this.alphabeticalSampleOrder
                : this.alphabeticalPatientOrder;
        } else if (this.sortMode.type === 'caseList') {
            if (
                this.oncoprintAnalysisCaseType ===
                    OncoprintAnalysisCaseType.SAMPLE &&
                this.props.store.givenSampleOrder.isComplete
            ) {
                return this.props.store.givenSampleOrder.result.map(
                    x => x.uniqueSampleKey
                );
            } else if (
                this.oncoprintAnalysisCaseType ===
                    OncoprintAnalysisCaseType.PATIENT &&
                this.props.store.givenSampleOrder.isComplete
            ) {
                return _.uniq(
                    this.props.store.givenSampleOrder.result.map(
                        x => x.uniquePatientKey
                    )
                );
            } else {
                return undefined;
            }
        } else {
            return undefined;
        }
    }

    @computed get alphabeticalSampleOrder() {
        if (this.props.store.filteredSamples.isComplete) {
            return _.sortBy(
                this.props.store.filteredSamples.result!,
                sample => sample.sampleId
            ).map(sample => sample.uniqueSampleKey);
        } else {
            return undefined;
        }
    }

    @computed get alphabeticalPatientOrder() {
        if (this.props.store.filteredPatients.isComplete) {
            return _.sortBy(
                this.props.store.filteredPatients.result!,
                patient => patient.patientId
            ).map(patient => patient.uniquePatientKey);
        } else {
            return undefined;
        }
    }

    readonly sampleGeneticTracks = makeGeneticTracksMobxPromise(this, true);
    readonly patientGeneticTracks = makeGeneticTracksMobxPromise(this, false);
    @computed get geneticTracks() {
        return this.oncoprintAnalysisCaseType ===
            OncoprintAnalysisCaseType.SAMPLE
            ? this.sampleGeneticTracks
            : this.patientGeneticTracks;
    }

    readonly sampleClinicalTracks = makeClinicalTracksMobxPromise(this, true);
    readonly patientClinicalTracks = makeClinicalTracksMobxPromise(this, false);

    @computed get clinicalTracks() {
        return this.oncoprintAnalysisCaseType ===
            OncoprintAnalysisCaseType.SAMPLE
            ? this.sampleClinicalTracks
            : this.patientClinicalTracks;
    }

    readonly sampleHeatmapTracks = makeHeatmapTracksMobxPromise(this, true);
    readonly patientHeatmapTracks = makeHeatmapTracksMobxPromise(this, false);
    @computed get heatmapTracks() {
        return this.oncoprintAnalysisCaseType ===
            OncoprintAnalysisCaseType.SAMPLE
            ? this.sampleHeatmapTracks
            : this.patientHeatmapTracks;
    }

    readonly samplegGenericAssayHeatmapTracks = makeGenericAssayProfileHeatmapTracksMobxPromise(
        this,
        true
    );
    readonly patientGenericAssayHeatmapTracks = makeGenericAssayProfileHeatmapTracksMobxPromise(
        this,
        false
    );
    @computed get genericAssayHeatmapTracks() {
        return this.oncoprintAnalysisCaseType ===
            OncoprintAnalysisCaseType.SAMPLE
            ? this.samplegGenericAssayHeatmapTracks
            : this.patientGenericAssayHeatmapTracks;
    }

    @computed get genesetHeatmapTrackGroupIndex(): TrackGroupIndex | undefined {
        // check whether oncoprint should show a geneset trackgroup
        if (this.props.store.genesetIds.length > 0) {
            return (
                1 +
                Math.max(
                    GENETIC_TRACK_GROUP_INDEX,
                    // observe the heatmap tracks to render in the very next group
                    ...this.heatmapTracks.result.map(
                        hmTrack => hmTrack.trackGroupIndex
                    ),
                    ...this.genericAssayHeatmapTracks.result.map(
                        hmTrack => hmTrack.trackGroupIndex
                    )
                )
            );
        } else {
            return undefined;
        }
    }

    readonly sampleGenesetHeatmapTracks = makeGenesetHeatmapTracksMobxPromise(
        this,
        true,
        makeGenesetHeatmapExpansionsMobxPromise(this, true)
    );
    readonly patientGenesetHeatmapTracks = makeGenesetHeatmapTracksMobxPromise(
        this,
        false,
        makeGenesetHeatmapExpansionsMobxPromise(this, false)
    );
    @computed get genesetHeatmapTracks() {
        return this.oncoprintAnalysisCaseType ===
            OncoprintAnalysisCaseType.SAMPLE
            ? this.sampleGenesetHeatmapTracks
            : this.patientGenesetHeatmapTracks;
    }

    @computed get clusteredHeatmapTrackGroupIndex() {
        if (this.sortMode.type === 'heatmap') {
            const clusteredHeatmapProfile: string = this.sortMode
                .clusteredHeatmapProfile;

            const genesetHeatmapProfile: string | undefined =
                this.props.store.genesetMolecularProfile.result &&
                this.props.store.genesetMolecularProfile.result.value &&
                this.props.store.genesetMolecularProfile.result.value
                    .molecularProfileId;

            if (clusteredHeatmapProfile === genesetHeatmapProfile) {
                return this.genesetHeatmapTrackGroupIndex;
            } else {
                const heatmapGroup = this.molecularProfileIdToHeatmapTracks[
                    clusteredHeatmapProfile
                ];
                return heatmapGroup && heatmapGroup.trackGroupIndex;
            }
        }
        return undefined;
    }

    @computed get oncoprintLibrarySortConfig() {
        return {
            sortByMutationType: this.sortByMutationType,
            sortByDrivers: this.sortByDrivers,
            order: this.sortOrder,
            clusterHeatmapTrackGroupIndex: this.clusteredHeatmapTrackGroupIndex,
        };
    }

    @autobind
    @action
    private clusterHeatmapByIndex(index: TrackGroupIndex) {
        if (this.oncoprint) {
            this.oncoprint.resetSortableTracksSortDirection();
        }

        let molecularProfileId: string | undefined;
        if (index === this.genesetHeatmapTrackGroupIndex) {
            molecularProfileId =
                this.props.store.genesetMolecularProfile.result &&
                this.props.store.genesetMolecularProfile.result.value &&
                this.props.store.genesetMolecularProfile.result.value
                    .molecularProfileId;
        } else {
            const heatmapTrackGroup = _.values(
                this.molecularProfileIdToHeatmapTracks
            ).find(trackGroup => trackGroup.trackGroupIndex === index);
            molecularProfileId = heatmapTrackGroup
                ? heatmapTrackGroup.molecularProfileId
                : undefined;
        }

        if (molecularProfileId) {
            this.urlWrapper.updateURL({
                oncoprint_sortby: 'cluster',
                oncoprint_cluster_profile: molecularProfileId,
            });
        }
    }

    @autobind
    @action
    private removeHeatmapByIndex(index: TrackGroupIndex) {
        const groupEntry = _.values(
            this.molecularProfileIdToHeatmapTracks
        ).find(group => group.trackGroupIndex === index);
        if (groupEntry) {
            this.removeHeatmapByMolecularProfileId(
                groupEntry.molecularProfileId
            );
        }
    }

    @autobind
    @action
    public removeHeatmapByMolecularProfileId(molecularProfileId: string) {
        delete this.molecularProfileIdToHeatmapTrackGroupIndex[
            molecularProfileId
        ];
        this.addHeatmapTracks(molecularProfileId, []);
    }

    readonly heatmapTrackHeaders = remoteData({
        await: () => [this.props.store.molecularProfileIdToMolecularProfile],
        invoke: () => {
            return Promise.resolve(
                makeTrackGroupHeaders(
                    this.props.store.molecularProfileIdToMolecularProfile
                        .result!,
                    this.molecularProfileIdToHeatmapTracks,
                    this.genesetHeatmapTrackGroupIndex,
                    () => this.clusteredHeatmapTrackGroupIndex,
                    this.clusterHeatmapByIndex,
                    () => this.sortByData(),
                    this.removeHeatmapByIndex
                )
            );
        },
        default: {},
    });

    /* commenting this out because I predict it could make a comeback
    @computed get headerColumnModeButton() {
        if (!this.props.store.samples.isComplete ||
            !this.props.store.patients.isComplete ||
            (this.props.store.samples.result.length === this.props.store.patients.result.length)) {
            return null;
        }
        let text, tooltip;
        if (this.columnMode === "sample") {
            text = "Show only one column per patient.";
            tooltip = "Each sample for each patient is in a separate column. Click to show only one column per patient";
        } else {
            text = "Show all samples";
            tooltip = "All samples from a patient are merged into one column. Click to split samples into multiple columns.";
        }
        return (
            <DefaultTooltip
                overlay={<div style={{maxWidth:"400px"}}>{tooltip}</div>}
                placement="top"
            >
                <Button
                    bsSize="xs"
                    bsStyle="primary"
                    style={{
                        fontSize:"11px",
                        display:"inline-block",
                        color:"white",
                        marginLeft:"5px"
                    }}
                    onClick={this.toggleColumnMode}
                >{text}
                </Button>
            </DefaultTooltip>
        );
    }*/

    @computed get isLoading() {
        return (
            getRemoteDataGroupStatus(
                this.clinicalTracks,
                this.geneticTracks,
                this.genesetHeatmapTracks,
                this.genericAssayHeatmapTracks,
                this.heatmapTracks,
                this.props.store.molecularProfileIdToMolecularProfile,
                this.alterationTypesInQuery,
                this.alteredKeys,
                this.heatmapTrackHeaders
            ) === 'pending'
        );
    }

    @computed get isHidden() {
        return this.isLoading || !this.renderingComplete;
    }

    private get loadingIndicatorHeight() {
        return 300;
    }

    @computed get loadingIndicatorMessage() {
        if (this.isLoading) return 'Downloading Oncoprint data...';
        else if (!this.renderingComplete)
            return 'Data downloaded. Rendering Oncoprint..';
        // Otherwise, isHidden is false, so no message shown at all..
        // Putting this here just for Typescript
        return '';
    }

    readonly alterationTypesInQuery = remoteData({
        await: () => [this.props.store.selectedMolecularProfiles],
        invoke: () =>
            Promise.resolve(
                _.uniq(
                    this.props.store.selectedMolecularProfiles.result!.map(
                        x => x.molecularAlterationType
                    )
                )
            ),
    });

    @autobind
    private getControls() {
        if (
            this.oncoprint &&
            !this.oncoprint.webgl_unavailable &&
            this.props.store.molecularProfileIdToMolecularProfile.result
        ) {
            return (
                <FadeInteraction showByDefault={true} show={true}>
                    <OncoprintControls
                        handlers={this.controlsHandlers}
                        state={this.controlsState}
                        store={this.props.store}
                        molecularProfileIdToMolecularProfile={
                            this.props.store
                                .molecularProfileIdToMolecularProfile.result
                        }
                        genericAssayEntitiesSelectOptionsGroupByGenericAssayTypePromise={
                            this
                                .genericAssayEntitiesSelectOptionsGroupByGenericAssayType
                        }
                        genericAssayEntitiesSelectOptionsGroupByMolecularProfileIdPromise={
                            this
                                .genericAssayEntitiesSelectOptionsGroupByMolecularProfileId
                        }
                        selectedGenericAssayEntitiesGroupByGenericAssayTypeFromUrl={
                            this
                                .selectedGenericAssayEntitiesGroupByGenericAssayTypeFromUrl
                        }
                    />
                </FadeInteraction>
            );
        } else {
            return <span />;
        }
    }

    private loadingGeneticDataDuringCurrentLoad = false;
    private loadingClinicalDataDuringCurrentLoad = false;
    @autobind
    private getProgressItems(elapsedSecs: number): IProgressIndicatorItem[] {
        if (elapsedSecs === 0) {
            this.loadingGeneticDataDuringCurrentLoad = false;
            this.loadingClinicalDataDuringCurrentLoad = false;
        }

        const areNonLocalClinicalAttributesSelected = _.some(
            this.selectedClinicalAttributeIds.keys(),
            clinicalAttributeId =>
                !clinicalAttributeIsLocallyComputed({ clinicalAttributeId })
        );

        if (this.geneticTracks.isPending) {
            this.loadingGeneticDataDuringCurrentLoad = true;
        }
        if (
            areNonLocalClinicalAttributesSelected &&
            this.clinicalTracks.isPending
        ) {
            this.loadingClinicalDataDuringCurrentLoad = true;
        }

        const ret: IProgressIndicatorItem[] = [];

        let queryingLabel: string;
        if (
            this.props.store.genes.isComplete &&
            this.props.store.filteredSamples.isComplete
        ) {
            const numGenes = this.props.store.genes.result!.length;
            const numSamples = this.props.store.filteredSamples.result!.length;
            queryingLabel = `Querying ${numGenes} genes in ${numSamples} samples`;
        } else {
            queryingLabel = 'Querying ... genes in ... samples';
        }

        let waitingLabel: string = '';
        if (elapsedSecs > 2) {
            waitingLabel = ' - this can take several seconds';
        }

        ret.push({
            label: `${queryingLabel}${waitingLabel}`,
            promises: [], // empty promises means insta-complete
            hideIcon: true, // dont show any icon, this is just a message
            style: { fontWeight: 'bold' },
        });

        const dataLoadingNames = [];
        if (this.loadingGeneticDataDuringCurrentLoad) {
            dataLoadingNames.push('genetic');
        }
        if (this.loadingClinicalDataDuringCurrentLoad) {
            dataLoadingNames.push('clinical');
        }

        ret.push({
            label: `Loading ${dataLoadingNames.join(' and ')} data`,
            promises: [
                this.props.store.molecularData,
                this.props.store.mutations,
                ...(areNonLocalClinicalAttributesSelected
                    ? [this.clinicalTracks]
                    : []),
            ],
        });

        const usingOncokb = this.props.store.driverAnnotationSettings.oncoKb;
        const usingHotspot = this.props.store.driverAnnotationSettings.hotspots;
        ret.push({
            label: getAnnotatingProgressMessage(usingOncokb, usingHotspot),
            promises: [
                this.props.store.filteredAndAnnotatedMolecularData,
                this.props.store.filteredAndAnnotatedMutations,
                this.props.store.filteredAndAnnotatedStructuralVariants,
            ],
        });

        ret.push({
            label: 'Rendering',
        });

        return ret as IProgressIndicatorItem[];
    }

    @computed get width() {
        return WindowStore.size.width - 75;
    }

    public render() {
        return (
            <div style={{ position: 'relative' }}>
                <LoadingIndicator
                    isLoading={this.isHidden}
                    size={'big'}
                    centerRelativeToContainer={false}
                    center={true}
                    className="oncoprintLoadingIndicator"
                >
                    <div>
                        <ProgressIndicator
                            getItems={this.getProgressItems}
                            show={this.isHidden}
                            sequential={true}
                        />
                    </div>
                </LoadingIndicator>

                <div className={'tabMessageContainer'}>
                    <OqlStatusBanner
                        className="oncoprint-oql-status-banner"
                        store={this.props.store}
                        tabReflectsOql={true}
                    />
                    <AlterationFilterWarning store={this.props.store} />
                    <CaseFilterWarning
                        store={this.props.store}
                        isPatientMode={
                            this.oncoprintAnalysisCaseType ===
                            OncoprintAnalysisCaseType.PATIENT
                        }
                    />
                </div>

                <div
                    className={classNames('oncoprintContainer', {
                        fadeIn: !this.isHidden,
                    })}
                    onMouseEnter={this.onMouseEnter}
                    onMouseLeave={this.onMouseLeave}
                >
                    <Observer>{this.getControls}</Observer>

                    <div style={{ position: 'relative', marginTop: 15 }}>
                        <div>
                            <Oncoprint
                                oncoprintRef={this.oncoprintRef}
                                clinicalTracks={this.clinicalTracks.result}
                                geneticTracks={this.geneticTracks.result}
                                genesetHeatmapTracks={
                                    this.genesetHeatmapTracks.result
                                }
                                heatmapTracks={([] as IHeatmapTrackSpec[])
                                    .concat(
                                        this.genericAssayHeatmapTracks.result
                                    )
                                    .concat(this.heatmapTracks.result)}
                                divId={this.props.divId}
                                width={this.width}
                                caseLinkOutInTooltips={true}
                                suppressRendering={this.isLoading}
                                onSuppressRendering={this.onSuppressRendering}
                                onReleaseRendering={this.onReleaseRendering}
                                hiddenIds={
                                    !this.showUnalteredColumns
                                        ? this.unalteredKeys.result
                                        : undefined
                                }
                                molecularProfileIdToMolecularProfile={
                                    this.props.store
                                        .molecularProfileIdToMolecularProfile
                                        .result
                                }
                                alterationTypesInQuery={
                                    this.alterationTypesInQuery.result
                                }
                                showSublabels={this.showOqlInLabels}
                                heatmapTrackHeaders={
                                    this.heatmapTrackHeaders.result!
                                }
                                horzZoomToFitIds={this.alteredKeys.result}
                                distinguishMutationType={
                                    this.distinguishMutationType
                                }
                                distinguishDrivers={this.distinguishDrivers}
                                distinguishGermlineMutations={
                                    this.distinguishGermlineMutations
                                }
                                sortConfig={this.oncoprintLibrarySortConfig}
                                showClinicalTrackLegends={
                                    this.showClinicalTrackLegends
                                }
                                showWhitespaceBetweenColumns={
                                    this.showWhitespaceBetweenColumns
                                }
                                showMinimap={this.showMinimap}
                                onMinimapClose={this.onMinimapClose}
                                onDeleteClinicalTrack={
                                    this.onDeleteClinicalTrack
                                }
                                onTrackSortDirectionChange={
                                    this.onTrackSortDirectionChange
                                }
                                initParams={{
                                    max_height: Number.POSITIVE_INFINITY,
                                }}
                            />
                        </div>
                    </div>
                </div>
            </div>
        );
    }
}
