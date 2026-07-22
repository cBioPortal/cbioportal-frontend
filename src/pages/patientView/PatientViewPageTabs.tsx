import { MSKTab, MSKTabs } from 'shared/components/MSKTabs/MSKTabs';
import LoadingIndicator from 'shared/components/loadingIndicator/LoadingIndicator';
import { ClinicalDataBySampleId, ClinicalEvent, Sample } from 'cbioportal-ts-api-client';
import { TimelineWrapperContent } from 'pages/patientView/timeline/TimelineWrapper';
import WindowStore from 'shared/components/window/WindowStore';
import GenomicOverview from 'pages/patientView/genomicOverview/GenomicOverview';
import { defaultAlleleFrequencyHeaderTooltip } from 'pages/patientView/mutation/PatientViewMutationTable';
import { getServerConfig, ServerConfigHelpers } from 'config/config';
import StructuralVariantTableWrapper from 'pages/patientView/structuralVariant/StructuralVariantTableWrapper';
import CopyNumberTableWrapper from 'pages/patientView/copyNumberAlterations/CopyNumberTableWrapper';
import PatientViewMutationsTab from 'pages/patientView/mutation/PatientViewMutationsTab';
import PatientViewPathwayMapper from 'pages/patientView/pathwayMapper/PatientViewPathwayMapper';
import ClinicalInformationPatientTable from 'pages/patientView/clinicalInformation/ClinicalInformationPatientTable';
import ClinicalInformationSamples from 'pages/patientView/clinicalInformation/ClinicalInformationSamplesTable';
import ClinicalEventsTables from 'pages/patientView/timeline/ClinicalEventsTables';
import ResourcesTab, {
    RESOURCES_TAB_NAME,
} from 'pages/patientView/resources/ResourcesTab';
import PathologyReport from 'pages/patientView/pathologyReport/PathologyReport';
import IFrameLoader from 'shared/components/iframeLoader/IFrameLoader';
import { getDigitalSlideArchiveIFrameUrl } from 'shared/api/urls';
import TrialMatchTable from 'pages/patientView/trialMatch/TrialMatchTable';
import MutationalSignaturesContainer from 'pages/patientView/mutationalSignatures/MutationalSignaturesContainer';
import MrnaTabContent from 'pages/patientView/mrna/MrnaTabContent';
import { FeatureFlagEnum } from 'shared/featureFlags';
import { buildCustomTabs } from 'shared/lib/customTabs/customTabHelpers';
import * as React from 'react';
import { observer } from 'mobx-react-lite';
import SampleManager from 'pages/patientView/SampleManager';
import PatientViewUrlWrapper from 'pages/patientView/PatientViewUrlWrapper';
import WSIViewer from 'shared/components/wsiViewer/WSIViewer';
import { readWsiHashState } from 'shared/components/wsiViewer/wsiViewStateUtils';
import {
    buildPathologySlideFilterSignature,
    PathologySlideFilter,
} from 'shared/components/wsiViewer/wsiViewerTypes';
import {
    primeInitialWsiHierarchy,
    warmInitialWsiSlide,
} from 'shared/components/wsiViewer/wsiViewerWarmup';
import { fetchPatientHierarchyReadOnly } from 'shared/components/wsiViewer/wsiHierarchyFetchCache';
import {
    fetchPatientBootstrapReadOnly,
    hydratePatientBootstrapCaches,
    isWsiBootstrapEnabled,
} from 'shared/components/wsiViewer/wsiBootstrapFetch';
import { getServableSlideIdsForPathologyFilterReadOnly } from 'shared/components/wsiViewer/wsiSlideUtils';
import { CompactVAFPlot } from 'pages/patientView/genomicOverview/CompactVAFPlot';
import {
    computeMutationFrequencyBySample,
    doesFrequencyExist,
} from 'pages/patientView/genomicOverview/GenomicOverviewUtils';
import genomicOverviewStyles from 'pages/patientView/genomicOverview/styles.module.scss';
import FeatureInstruction from 'shared/FeatureInstruction/FeatureInstruction';
import { HelpWidget } from 'shared/components/HelpWidget/HelpWidget';
import MutationTableWrapper from './mutation/MutationTableWrapper';
import { PatientViewPageInner } from 'pages/patientView/PatientViewPage';
import { Else, If } from 'react-if';
import { PatientViewPlotsTabWrapper } from './PatientViewPlotsTabWrapper';
import {
    buildPatientHierarchyUrl,
    buildTimelineEventsSignature,
    hasServableDiagnosticSlides,
} from 'pages/patientView/timeline/pathologyTimelineUtils';
import { usePathologyAugmentedClinicalEventsState } from 'pages/patientView/timeline/usePathologyAugmentedClinicalEvents';

export enum PatientViewPageTabs {
    Summary = 'summary',
    genomicEvolution = 'genomicEvolution',
    ClinicalData = 'clinicalData',
    FilesAndLinks = 'filesAndLinks',
    PathologyReport = 'pathologyReport',
    TissueImage = 'tissueImage',
    MSKTissueImage = 'MSKTissueImage',
    WSIHESlides = 'wsiHESlides',
    TrialMatchTab = 'trialMatchTab',
    MutationalSignatures = 'mutationalSignatures',
    PathwayMapper = 'pathways',
    MRNA = 'mrna',
    Plots = 'plots',
}

export const PatientViewResourceTabPrefix = 'openResource_';

export function getPatientViewResourceTabId(resourceId: string) {
    return `${PatientViewResourceTabPrefix}${resourceId}`;
}

function PatientViewWsiPreloader({
    tileServerUrl,
    patientId,
    studyId,
    activeTabId,
    initialStainFilter,
    pathologyFilter,
}: {
    tileServerUrl?: string | null;
    patientId?: string;
    studyId?: string;
    activeTabId?: string;
    initialStainFilter: 'all' | 'hne' | 'ihc';
    pathologyFilter?: PathologySlideFilter;
}) {
    const pathologyFilterSignature = React.useMemo(
        () => buildPathologySlideFilterSignature(pathologyFilter),
        [
            pathologyFilter?.matchLevel,
            pathologyFilter?.sampleId,
            pathologyFilter?.specimenKey,
        ]
    );

    React.useEffect(() => {
        if (
            !tileServerUrl ||
            !patientId ||
            !studyId ||
            activeTabId === PatientViewPageTabs.WSIHESlides
        ) {
            return;
        }

        let idleHandle: number | null = null;
        let timer: ReturnType<typeof setTimeout> | null = null;
        let cancelled = false;
        const hierarchyUrl = buildPatientHierarchyUrl(
            tileServerUrl,
            patientId,
            studyId
        );

        void primeInitialWsiHierarchy({
            tileServerUrl,
            hierarchyUrl,
        }).catch(() => {
            // Ignore preload failures; the gate/viewer handles real load errors.
        });

        const warmViewer = () => {
            idleHandle = null;
            timer = null;
            if (cancelled) {
                return;
            }

            const hashState = readWsiHashState();
            void warmInitialWsiSlide({
                tileServerUrl,
                hierarchyUrl,
                studyId,
                preferredSlideId: hashState?.slideId,
                stainFilter: initialStainFilter,
                pathologyFilter,
            }).catch(() => {
                // Ignore warmup failures; the viewer handles real load errors.
            });
        };

        if (
            typeof window !== 'undefined' &&
            typeof window.requestIdleCallback === 'function'
        ) {
            idleHandle = window.requestIdleCallback(warmViewer, {
                timeout: 1500,
            });
        } else {
            timer = setTimeout(warmViewer, 500);
        }

        return () => {
            cancelled = true;
            if (
                idleHandle !== null &&
                typeof window !== 'undefined' &&
                typeof window.cancelIdleCallback === 'function'
            ) {
                window.cancelIdleCallback(idleHandle);
            }
            if (timer !== null) {
                clearTimeout(timer);
            }
        };
    }, [
        activeTabId,
        initialStainFilter,
        patientId,
        studyId,
        tileServerUrl,
        pathologyFilterSignature,
    ]);

    return null;
}

export const PatientViewPathologySlidesTabGate = observer(
    function PatientViewPathologySlidesTabGate({
        tileServerUrl,
        patientId,
        studyId,
        activeTabId,
        hasLoadedSampleIds,
        pathologyFilter,
        children,
    }: {
        tileServerUrl?: string | null;
        patientId?: string;
        studyId?: string;
        activeTabId?: string;
        hasLoadedSampleIds?: boolean;
        pathologyFilter?: PathologySlideFilter;
        children: (hasServableSlides: boolean | undefined) => React.ReactNode;
    }) {
        const [hasServableSlides, setHasServableSlides] = React.useState<
            boolean | undefined
        >(undefined);
        const isActiveWsiRoute =
            activeTabId === PatientViewPageTabs.WSIHESlides;
        const pathologyFilterSignature = React.useMemo(
            () => buildPathologySlideFilterSignature(pathologyFilter),
            [
                pathologyFilter?.matchLevel,
                pathologyFilter?.sampleId,
                pathologyFilter?.specimenKey,
            ]
        );

        React.useEffect(() => {
            if (isActiveWsiRoute && tileServerUrl && patientId && studyId) {
                // A deep-linked WSI route should render immediately and let the
                // viewer own slide availability, rather than paying an extra
                // hierarchy fetch just to re-confirm the active tab.
                setHasServableSlides(true);
                return;
            }
            if (
                !tileServerUrl ||
                !patientId ||
                !studyId ||
                (!hasLoadedSampleIds && !pathologyFilter)
            ) {
                setHasServableSlides(undefined);
                return;
            }

            let cancelled = false;
            const controller = new AbortController();
            const hierarchyUrl = buildPatientHierarchyUrl(
                tileServerUrl,
                patientId,
                studyId
            );
            const hierarchyPromise =
                isWsiBootstrapEnabled()
                    ? fetchPatientBootstrapReadOnly(
                          {
                              hierarchyUrl,
                          },
                          controller.signal
                      )
                          .then(payload => {
                              hydratePatientBootstrapCaches(
                                  hierarchyUrl,
                                  tileServerUrl,
                                  payload
                              );
                              return payload.hierarchy;
                          })
                          .catch(() =>
                              fetchPatientHierarchyReadOnly(
                                  hierarchyUrl,
                                  controller.signal
                              )
                          )
                    : fetchPatientHierarchyReadOnly(
                          hierarchyUrl,
                          controller.signal
                      );

            void hierarchyPromise
                .then(hierarchy => {
                    if (!cancelled) {
                        setHasServableSlides(
                            pathologyFilter
                                ? !!getServableSlideIdsForPathologyFilterReadOnly(
                                      hierarchy,
                                      pathologyFilter
                                  )?.size
                                : hasServableDiagnosticSlides(hierarchy)
                        );
                    }
                })
                .catch(() => {
                    if (!cancelled && !controller.signal.aborted) {
                        setHasServableSlides(false);
                    }
                });

            return () => {
                cancelled = true;
                controller.abort();
            };
        }, [
            activeTabId,
            hasLoadedSampleIds,
            isActiveWsiRoute,
            patientId,
            pathologyFilterSignature,
            studyId,
            tileServerUrl,
        ]);

        return (
            <>
                {children(
                    !tileServerUrl ||
                        !patientId ||
                        !studyId ||
                        (!isActiveWsiRoute &&
                            !hasLoadedSampleIds &&
                            !pathologyFilter)
                        ? undefined
                        : hasServableSlides
                )}
            </>
        );
    }
);

export function extractResourceIdFromTabId(tabId: string) {
    const match = new RegExp(`${PatientViewResourceTabPrefix}(.*)`).exec(tabId);
    if (match) {
        return match[1];
    } else {
        return undefined;
    }
}

export function SummaryTimelineSection({
    dataStore,
    caseMetaData,
    clinicalEvents,
    patientId,
    studyId,
    sampleManager,
    width,
    samples,
    clinicalSamples,
    mutationProfileId,
}: {
    dataStore: any;
    caseMetaData: {
        color: { [sampleId: string]: string };
        index: { [sampleId: string]: number };
        label: { [sampleId: string]: string };
    };
    clinicalEvents: ClinicalEvent[];
    patientId: string;
    studyId: string;
    sampleManager: SampleManager;
    width: number;
    samples: Sample[];
    clinicalSamples: ClinicalDataBySampleId[];
    mutationProfileId: string;
}) {
    const clinicalEventsSignature = React.useMemo(
        () => buildTimelineEventsSignature(clinicalEvents),
        [clinicalEvents]
    );
    const augmentedEventsState = usePathologyAugmentedClinicalEventsState({
        clinicalEvents,
        clinicalEventsSignature,
        errorMessage: 'Failed to load pathology timeline data',
        patientId,
        samples: clinicalSamples,
        studyId,
    });
    const augmentedEvents = augmentedEventsState.events;
    const augmentedEventsSignature = augmentedEventsState.eventsSignature;

    return (
        <>
            <div>
                <div
                    style={{
                        marginTop: 20,
                        marginBottom: 20,
                    }}
                >
                    <TimelineWrapperContent
                        dataStore={dataStore}
                        caseMetaData={caseMetaData}
                        data={clinicalEvents}
                        timelineData={augmentedEvents}
                        timelineDataSignature={augmentedEventsSignature}
                        sampleManager={sampleManager}
                        width={width}
                        samples={samples}
                        clinicalSamples={clinicalSamples}
                        mutationProfileId={mutationProfileId}
                    />
                </div>
                <hr />
            </div>
        </>
    );
}

export function patientViewTabs(
    pageInstance: PatientViewPageInner,
    urlWrapper: PatientViewUrlWrapper,
    sampleManager: SampleManager | null
) {
    const tileServerUrl = getServerConfig().msk_wsi_tile_server_url;
    const activeTabId = urlWrapper.activeTabId;
    const helpWidgetPath = urlWrapper.routing.location.pathname;
    const clinicalDataGroupedBySample =
        pageInstance.patientViewPageStore.clinicalDataGroupedBySample;
    const initialStainFilter =
        urlWrapper.query.stainFilter === 'hne' ||
        urlWrapper.query.stainFilter === 'ihc'
            ? urlWrapper.query.stainFilter
            : 'all';
    const pathologyFilter =
        urlWrapper.query.matchLevel || urlWrapper.query.specimenKey
            ? {
                  sampleId: urlWrapper.query.sampleId,
                  matchLevel: urlWrapper.query.matchLevel,
                  specimenKey: urlWrapper.query.specimenKey,
              }
            : undefined;
    return (
        <>
            {tileServerUrl && (
                <PatientViewWsiPreloader
                    tileServerUrl={tileServerUrl}
                    patientId={pageInstance.patientViewPageStore.patientId}
                    studyId={pageInstance.patientViewPageStore.studyId}
                    activeTabId={activeTabId}
                    initialStainFilter={initialStainFilter}
                    pathologyFilter={pathologyFilter}
                />
            )}
            <PatientViewPathologySlidesTabGate
                tileServerUrl={tileServerUrl}
                patientId={pageInstance.patientViewPageStore.patientId}
                studyId={pageInstance.patientViewPageStore.studyId}
                activeTabId={activeTabId}
                hasLoadedSampleIds={clinicalDataGroupedBySample.isComplete}
                pathologyFilter={pathologyFilter}
            >
                {hasServableSlides => (
                    <MSKTabs
                        id="patientViewPageTabs"
                        key={urlWrapper.hash}
                        activeTabId={activeTabId}
                        onTabClick={(id: string) => urlWrapper.setActiveTab(id)}
                        className="mainTabs"
                        getPaginationWidth={WindowStore.getWindowWidth}
                        contentWindowExtra={
                            <HelpWidget path={helpWidgetPath} />
                        }
                    >
                        {tabs(
                            pageInstance,
                            sampleManager,
                            urlWrapper,
                            hasServableSlides
                        )}
                    </MSKTabs>
                )}
            </PatientViewPathologySlidesTabGate>
        </>
    );
}

export function tabs(
    pageComponent: PatientViewPageInner,
    sampleManager: SampleManager | null,
    urlWrapper: PatientViewUrlWrapper,
    hasServablePathologySlides?: boolean
) {
    const tabs: JSX.Element[] = [];
    const serverConfig = getServerConfig();
    const tileServerUrl = serverConfig.msk_wsi_tile_server_url;
    const activeSampleIds = sampleManager
        ? sampleManager.getActiveSampleIdsInOrder()
        : [];
    const customDriverName =
        serverConfig.oncoprint_custom_driver_annotation_binary_menu_label!;
    const customDriverDescription =
        serverConfig.oncoprint_custom_driver_annotation_binary_menu_description!;
    const customDriverTiersName =
        serverConfig.oncoprint_custom_driver_annotation_tiers_menu_label!;
    const customDriverTiersDescription =
        serverConfig.oncoprint_custom_driver_annotation_tiers_menu_description!;
    const clinicalEvents = pageComponent.patientViewPageStore.clinicalEvents
        .result;
    const clinicalEventsSignature = clinicalEvents
        ? buildTimelineEventsSignature(clinicalEvents)
        : undefined;

    tabs.push(
        <MSKTab key={0} id={PatientViewPageTabs.Summary} linkText="Summary">
            <LoadingIndicator
                isLoading={
                    pageComponent.patientViewPageStore.clinicalEvents
                        .isPending ||
                    pageComponent.patientViewPageStore
                        .clinicalDataGroupedBySample.isPending
                }
            />

            {!!sampleManager &&
                pageComponent.patientViewPageStore.clinicalEvents.isComplete &&
                pageComponent.patientViewPageStore.clinicalDataGroupedBySample
                    .isComplete && (
                    <SummaryTimelineSection
                        dataStore={pageComponent.patientViewMutationDataStore}
                        caseMetaData={{
                            color: sampleManager.sampleColors,
                            label: sampleManager.sampleLabels,
                            index: sampleManager.sampleIndex,
                        }}
                        clinicalEvents={
                            pageComponent.patientViewPageStore.clinicalEvents
                                .result
                        }
                        patientId={pageComponent.patientViewPageStore.patientId}
                        studyId={pageComponent.patientViewPageStore.studyId}
                        sampleManager={sampleManager}
                        width={WindowStore.size.width}
                        samples={
                            pageComponent.patientViewPageStore.samples.result
                        }
                        clinicalSamples={
                            pageComponent.patientViewPageStore
                                .clinicalDataGroupedBySample.result
                        }
                        mutationProfileId={
                            pageComponent.patientViewPageStore
                                .mutationMolecularProfileId.result!
                        }
                    />
                )}

            <LoadingIndicator
                isLoading={
                    pageComponent.patientViewPageStore.mutationData.isPending ||
                    pageComponent.patientViewPageStore.cnaSegments.isPending ||
                    pageComponent.patientViewPageStore.sequencedSampleIdsInStudy
                        .isPending ||
                    pageComponent.patientViewPageStore
                        .sampleToMutationGenePanelId.isPending ||
                    pageComponent.patientViewPageStore
                        .sampleToDiscreteGenePanelId.isPending ||
                    pageComponent.patientViewPageStore.studies.isPending
                }
            />

            {pageComponent.patientViewPageStore.mutationData.isComplete &&
                pageComponent.patientViewPageStore.cnaSegments.isComplete &&
                pageComponent.patientViewPageStore.sequencedSampleIdsInStudy
                    .isComplete &&
                pageComponent.patientViewPageStore.sampleToMutationGenePanelId
                    .isComplete &&
                pageComponent.patientViewPageStore.sampleToDiscreteGenePanelId
                    .isComplete &&
                pageComponent.patientViewPageStore.studies.isComplete &&
                (pageComponent.patientViewPageStore
                    .mergedMutationDataFilteredByGene.length > 0 ||
                    pageComponent.patientViewPageStore.cnaSegments.result
                        .length > 0) &&
                sampleManager && (
                    <FeatureInstruction
                        content={
                            'Click alteration for detail. Double-click to zoom.'
                        }
                        style={{ top: -10 }}
                    >
                        <GenomicOverview
                            store={pageComponent.patientViewPageStore}
                            onResetView={pageComponent.onResetViewClick}
                            mergedMutations={
                                pageComponent.patientViewPageStore
                                    .mergedMutationDataFilteredByGene
                            }
                            samples={
                                pageComponent.patientViewPageStore.samples
                                    .result
                            }
                            cnaSegments={
                                pageComponent.patientViewPageStore.cnaSegments
                                    .result
                            }
                            sampleOrder={sampleManager.sampleIndex}
                            sampleLabels={sampleManager.sampleLabels}
                            sampleColors={sampleManager.sampleColors}
                            sampleManager={sampleManager}
                            containerWidth={WindowStore.size.width - 20}
                            sampleIdToMutationGenePanelId={
                                pageComponent.patientViewPageStore
                                    .sampleToMutationGenePanelId.result
                            }
                            sampleIdToCopyNumberGenePanelId={
                                pageComponent.patientViewPageStore
                                    .sampleToDiscreteGenePanelId.result
                            }
                            onSelectGenePanel={
                                pageComponent.toggleGenePanelModal
                            }
                            disableTooltip={pageComponent.genePanelModal.isOpen}
                            // assuming that all studies have the same reference genome
                            genome={
                                pageComponent.patientViewPageStore.studies
                                    .result[0]?.referenceGenome
                            }
                        />
                        <hr />
                    </FeatureInstruction>
                )}

            <LoadingIndicator
                isLoading={
                    pageComponent.patientViewPageStore.mutationData.isPending ||
                    pageComponent.patientViewPageStore.uncalledMutationData
                        .isPending ||
                    pageComponent.patientViewPageStore.oncoKbAnnotatedGenes
                        .isPending ||
                    pageComponent.patientViewPageStore.studyIdToStudy.isPending
                }
            />

            <div data-test="patientview-mutation-table">
                <MutationTableWrapper
                    patientViewPageStore={pageComponent.patientViewPageStore}
                    dataStore={pageComponent.patientViewMutationDataStore}
                    sampleManager={sampleManager}
                    sampleIds={activeSampleIds}
                    mergeOncoKbIcons={
                        pageComponent.mergeMutationTableOncoKbIcons
                    }
                    onOncoKbIconToggle={pageComponent.handleOncoKbIconToggle}
                    columnVisibility={
                        pageComponent.mutationTableColumnVisibility
                    }
                    onFilterGenes={pageComponent.onFilterGenesMutationTable}
                    columnVisibilityProps={{
                        onColumnToggled:
                            pageComponent.onMutationTableColumnVisibilityToggled,
                    }}
                    onSelectGenePanel={pageComponent.toggleGenePanelModal}
                    disableTooltip={pageComponent.genePanelModal.isOpen}
                    onRowClick={pageComponent.onMutationTableRowClick}
                    onRowMouseEnter={pageComponent.onMutationTableRowMouseEnter}
                    onRowMouseLeave={pageComponent.onMutationTableRowMouseLeave}
                    namespaceColumns={
                        pageComponent.patientViewMutationDataStore
                            .namespaceColumnConfig
                    }
                    columns={pageComponent.columns}
                    pageMode={pageComponent.patientViewPageStore.pageMode}
                    alleleFreqHeaderRender={
                        pageComponent.patientViewPageStore
                            .mergedMutationDataFilteredByGene.length > 0 &&
                        doesFrequencyExist(
                            computeMutationFrequencyBySample(
                                pageComponent.patientViewPageStore
                                    .mergedMutationDataFilteredByGene,
                                sampleManager?.sampleIndex || {}
                            )
                        )
                            ? (name: string) => (
                                  <CompactVAFPlot
                                      mergedMutations={
                                          pageComponent.patientViewPageStore
                                              .mergedMutationDataFilteredByGene
                                      }
                                      sampleManager={
                                          pageComponent.patientViewPageStore
                                              .sampleManager.result
                                      }
                                      sampleIdToMutationGenePanelId={
                                          pageComponent.patientViewPageStore
                                              .sampleToMutationGenePanelId
                                              .result
                                      }
                                      sampleIdToCopyNumberGenePanelId={
                                          pageComponent.patientViewPageStore
                                              .sampleToDiscreteGenePanelId
                                              .result
                                      }
                                      tooltip={
                                          <div>
                                              {
                                                  defaultAlleleFrequencyHeaderTooltip
                                              }
                                          </div>
                                      }
                                      thumbnailComponent={
                                          <span
                                              style={{
                                                  display: 'inline-flex',
                                              }}
                                          >
                                              <span>{name}</span>
                                              <span
                                                  className={
                                                      genomicOverviewStyles.compactVafPlot
                                                  }
                                              >
                                                  {
                                                      CompactVAFPlot
                                                          .defaultProps
                                                          .thumbnailComponent
                                                  }
                                              </span>
                                          </span>
                                      }
                                  />
                              )
                            : undefined
                    }
                />
            </div>

            <hr />

            <StructuralVariantTableWrapper
                store={pageComponent.patientViewPageStore}
                onSelectGenePanel={pageComponent.toggleGenePanelModal}
                mergeOncoKbIcons={pageComponent.mergeMutationTableOncoKbIcons}
                onOncoKbIconToggle={pageComponent.handleOncoKbIconToggle}
                enableOncoKb={serverConfig.show_oncokb}
                sampleIds={activeSampleIds}
                namespaceColumns={
                    pageComponent.patientViewPageStore.namespaceColumnConfig
                        .structVar
                }
                customDriverName={customDriverName}
                customDriverDescription={customDriverDescription}
                customDriverTiersName={customDriverTiersName}
                customDriverTiersDescription={customDriverTiersDescription}
            />

            <hr />

            {pageComponent.patientViewPageStore.studyIdToStudy.isComplete &&
                pageComponent.patientViewPageStore.genePanelIdToEntrezGeneIds
                    .isComplete &&
                pageComponent.patientViewPageStore.referenceGenes.isComplete &&
                pageComponent.patientViewPageStore.discreteMolecularProfile
                    .isComplete &&
                pageComponent.patientViewPageStore
                    .genePanelDataByMolecularProfileIdAndSampleId
                    .isComplete && (
                    <div data-test="patientview-copynumber-table">
                        <If
                            condition={Boolean(
                                pageComponent.patientViewPageStore
                                    .discreteMolecularProfile.result
                            )}
                        >
                            <Else>
                                <div className="alert alert-info" role="alert">
                                    Study is not profiled for copy number
                                    alterations.
                                </div>
                            </Else>
                            <CopyNumberTableWrapper
                                pageStore={pageComponent.patientViewPageStore}
                                dataStore={
                                    pageComponent.patientViewCnaDataStore
                                }
                                sampleIds={activeSampleIds}
                                sampleManager={sampleManager}
                                enableOncoKb={serverConfig.show_oncokb}
                                columnVisibility={
                                    pageComponent.cnaTableColumnVisibility
                                }
                                onFilterGenes={
                                    pageComponent.onFilterGenesCopyNumberTable
                                }
                                columnVisibilityProps={{
                                    onColumnToggled:
                                        pageComponent.onCnaTableColumnVisibilityToggled,
                                }}
                                onSelectGenePanel={
                                    pageComponent.toggleGenePanelModal
                                }
                                disableTooltip={
                                    pageComponent.genePanelModal.isOpen
                                }
                                mergeOncoKbIcons={
                                    pageComponent.mergeMutationTableOncoKbIcons
                                }
                                onOncoKbIconToggle={
                                    pageComponent.handleOncoKbIconToggle
                                }
                                onRowClick={pageComponent.onCnaTableRowClick}
                                namespaceColumns={
                                    pageComponent.patientViewPageStore
                                        .namespaceColumnConfig.cna
                                }
                                customDriverName={customDriverName}
                                customDriverDescription={
                                    customDriverDescription
                                }
                                customDriverTiersName={customDriverTiersName}
                                customDriverTiersDescription={
                                    customDriverTiersDescription
                                }
                            />
                        </If>
                    </div>
                )}
        </MSKTab>
    );

    !!sampleManager &&
        pageComponent.patientViewPageStore.sampleIds.length > 1 &&
        pageComponent.patientViewPageStore.existsSomeMutationWithVAFData &&
        tabs.push(
            <MSKTab key={1} id="genomicEvolution" linkText="Genomic Evolution">
                <PatientViewMutationsTab
                    patientViewPageStore={pageComponent.patientViewPageStore}
                    mutationTableColumnVisibility={
                        pageComponent.mutationTableColumnVisibility
                    }
                    sampleIds={pageComponent.patientViewPageStore.sampleIds}
                    onMutationTableColumnVisibilityToggled={
                        pageComponent.onMutationTableColumnVisibilityToggled
                    }
                    sampleManager={sampleManager}
                    urlWrapper={pageComponent.urlWrapper}
                    mergeOncoKbIcons={
                        pageComponent.mergeMutationTableOncoKbIcons
                    }
                    onOncoKbIconToggle={pageComponent.handleOncoKbIconToggle}
                    customDriverName={customDriverName}
                    customDriverDescription={customDriverDescription}
                    customDriverTiersName={customDriverTiersName}
                    customDriverTiersDescription={customDriverTiersDescription}
                />
            </MSKTab>
        );

    // The mRNA and Plots tabs are gated by the MSKCC portal, or the
    // "patientMRNATab" feature flag (?featureFlags=patientMRNATab). When enabled
    // they normally appear only once the study is confirmed to have an mRNA
    // expression profile, so studies without one don't get empty tabs.
    //
    // Exception: when one of these tabs is the active (deep-linked) tab, show it
    // immediately — before the profile resolves — so the deep link doesn't
    // briefly fall back to (and flash) the Summary tab while the async profile
    // lookup is pending. The tab's own content renders a loader until the
    // profile/data loads, then either the plot or a "no mRNA data" message.
    const expressionTabsEnabled =
        serverConfig.app_name === 'mskcc-portal' ||
        pageComponent.props.appStore.featureFlagStore.has(
            FeatureFlagEnum.PATIENT_MRNA_TAB
        );
    const activeTabIsExpressionTab =
        urlWrapper.activeTabId === PatientViewPageTabs.MRNA ||
        urlWrapper.activeTabId === PatientViewPageTabs.Plots;
    const mrnaProfilePromise =
        pageComponent.patientViewPageStore.plotsStore
            .mrnaExpressionMolecularProfile;
    const showExpressionTabs =
        expressionTabsEnabled &&
        (activeTabIsExpressionTab ||
            (mrnaProfilePromise.isComplete && !!mrnaProfilePromise.result));

    tabs.push(
        <MSKTab
            key={8}
            id={PatientViewPageTabs.PathwayMapper}
            linkText={'Pathways'}
        >
            {pageComponent.patientViewPageStore.geneticTrackData.isComplete &&
            pageComponent.patientViewPageStore
                .mergedMutationDataIncludingUncalledFilteredByGene ? (
                <PatientViewPathwayMapper
                    store={pageComponent.patientViewPageStore}
                    sampleManager={sampleManager}
                />
            ) : (
                <LoadingIndicator isLoading={true} size={'big'} center={true} />
            )}
        </MSKTab>
    );

    tabs.push(
        <MSKTab
            key={2}
            id={PatientViewPageTabs.ClinicalData}
            linkText="Clinical Data"
            className={'patient-clinical-data-tab'}
        >
            <div className="clearfix">
                <h3 className={'pull-left'}>Patient</h3>
                {pageComponent.patientViewPageStore.clinicalDataPatient
                    .isComplete && (
                    <ClinicalInformationPatientTable
                        showTitleBar={true}
                        data={
                            pageComponent.patientViewPageStore
                                .clinicalDataPatient.result
                        }
                    />
                )}
            </div>

            <div className="clearfix">
                <h3 className={'pull-left'}>Samples</h3>
                {pageComponent.patientViewPageStore.clinicalDataGroupedBySample
                    .isComplete && (
                    <ClinicalInformationSamples
                        samples={
                            pageComponent.patientViewPageStore
                                .clinicalDataGroupedBySample.result!
                        }
                    />
                )}
            </div>

            {pageComponent.patientViewPageStore.clinicalEvents.isComplete && (
                <ClinicalEventsTables
                    clinicalEvents={clinicalEvents}
                    clinicalEventsSignature={clinicalEventsSignature}
                    patientId={pageComponent.patientViewPageStore.patientId}
                    studyId={pageComponent.patientViewPageStore.studyId}
                    samples={
                        pageComponent.patientViewPageStore
                        .clinicalDataGroupedBySample.result || []
                    }
                />
            )}
        </MSKTab>
    );

    if (pageComponent.shouldShowResources)
        tabs.push(
            <MSKTab
                key={4}
                id={PatientViewPageTabs.FilesAndLinks}
                linkText={RESOURCES_TAB_NAME}
            >
                <div>
                    <ResourcesTab
                        store={pageComponent.patientViewPageStore}
                        sampleManager={
                            pageComponent.patientViewPageStore.sampleManager
                                .result!
                        }
                        openResource={pageComponent.openResource}
                    />
                </div>
            </MSKTab>
        );

    tabs.push(
        <MSKTab
            key={3}
            id={PatientViewPageTabs.PathologyReport}
            linkText="Pathology Report"
            hide={!pageComponent.shouldShowPathologyReport}
        >
            <div>
                {pageComponent.patientViewPageStore.pathologyReport
                    .isComplete && (
                    <PathologyReport
                        iframeHeight={WindowStore.size.height - 220}
                        pdfs={
                            pageComponent.patientViewPageStore.pathologyReport
                                .result
                        }
                    />
                )}
            </div>
        </MSKTab>
    );

    tabs.push(
        <MSKTab
            key={5}
            id={PatientViewPageTabs.TissueImage}
            linkText="Tissue Image"
            hide={pageComponent.hideTissueImageTab}
        >
            <div>
                <IFrameLoader
                    height={WindowStore.size.height - 220}
                    url={getDigitalSlideArchiveIFrameUrl(
                        pageComponent.patientViewPageStore.patientId
                    )}
                />
            </div>
        </MSKTab>
    );

    if (tileServerUrl && hasServablePathologySlides === true) {
        tabs.push(
            <MSKTab
                key={6.5}
                id={PatientViewPageTabs.WSIHESlides}
                linkText="Pathology Slides"
                unmountOnHide={false}
            >
                <WSIViewer
                    url={buildPatientHierarchyUrl(
                        tileServerUrl,
                        pageComponent.patientViewPageStore.patientId,
                        pageComponent.patientViewPageStore.studyId
                    )}
                    height={WindowStore.size.height - 220}
                    studyId={pageComponent.patientViewPageStore.studyId}
                    initialStainFilter={
                        pageComponent.urlWrapper.query.stainFilter === 'hne' ||
                        pageComponent.urlWrapper.query.stainFilter === 'ihc'
                            ? pageComponent.urlWrapper.query.stainFilter
                            : 'all'
                    }
                    preferredSampleId={pageComponent.urlWrapper.query.sampleId}
                    pathologyFilter={
                        pageComponent.urlWrapper.query.matchLevel ||
                        pageComponent.urlWrapper.query.specimenKey
                            ? {
                                  sampleId:
                                      pageComponent.urlWrapper.query.sampleId,
                                  matchLevel:
                                      pageComponent.urlWrapper.query.matchLevel,
                                  specimenKey:
                                      pageComponent.urlWrapper.query
                                          .specimenKey,
                              }
                            : undefined
                    }
                />
            </MSKTab>
        );
    }

    pageComponent.shouldShowTrialMatch &&
        tabs.push(
            <MSKTab
                key={7}
                id={PatientViewPageTabs.TrialMatchTab}
                linkText="Matched Trials"
            >
                <TrialMatchTable
                    sampleManager={sampleManager}
                    detailedTrialMatches={
                        pageComponent.patientViewPageStore.detailedTrialMatches
                            .result
                    }
                    containerWidth={WindowStore.size.width - 20}
                />
            </MSKTab>
        );

    pageComponent.patientViewPageStore.hasMutationalSignatureData.result &&
        pageComponent.patientViewPageStore.initialMutationalSignatureVersion
            .isComplete &&
        tabs.push(
            <MSKTab
                key={8}
                id="mutationalSignatures"
                linkText="Mutational Signatures"
                hide={
                    pageComponent.patientViewPageStore
                        .mutationalSignatureMolecularProfiles.isPending ||
                    pageComponent.patientViewPageStore
                        .initialMutationalSignatureVersion.isPending ||
                    Object.keys(
                        pageComponent.patientViewPageStore
                            .mutationalSignatureDataGroupByVersion.result
                    ).length === 0
                }
            >
                <MutationalSignaturesContainer
                    data={
                        pageComponent.patientViewPageStore
                            .mutationalSignatureDataGroupByVersion.result
                    }
                    profiles={
                        pageComponent.patientViewPageStore
                            .mutationalSignatureMolecularProfiles.result
                    }
                    onVersionChange={
                        pageComponent.onMutationalSignatureVersionChange
                    }
                    version={
                        pageComponent.patientViewPageStore
                            .selectedMutationalSignatureVersion
                    }
                    dataCount={
                        pageComponent.patientViewPageStore
                            .mutationalSignatureCountDataGroupedByVersion.result
                    }
                    sample={
                        pageComponent.patientViewPageStore
                            .selectedSampleMutationalSignatureData
                    }
                    samples={
                        pageComponent.patientViewPageStore
                            .samplesWithDataAvailable
                    }
                    samplesNotProfiled={
                        pageComponent.patientViewPageStore
                            .samplesNotProfiledForMutationalSignatures
                    }
                    onSampleChange={pageComponent.onSampleIdChange}
                />
            </MSKTab>
        );

    // The mRNA and Plots tabs share the same gating (see showExpressionTabs
    // above) and are kept adjacent in the tab bar.
    if (showExpressionTabs) {
        tabs.push(
            <MSKTab
                key={9}
                id={PatientViewPageTabs.MRNA}
                linkText={
                    <span>
                        mRNA <strong className={'beta-text'}>Beta!</strong>
                    </span>
                }
            >
                <MrnaTabContent
                    store={pageComponent.patientViewPageStore}
                    sampleManager={sampleManager}
                />
            </MSKTab>
        );
        tabs.push(
            <MSKTab
                key={10}
                id={PatientViewPageTabs.Plots}
                linkText={
                    <span>
                        Plots <strong className={'beta-text'}>Beta!</strong>
                    </span>
                }
            >
                {pageComponent.patientViewPageStore.samplesInCohort
                    .isComplete &&
                pageComponent.patientViewPageStore.highlightedCancerTypes
                    .isComplete &&
                pageComponent.patientViewPageStore
                    .highlightedDetailedCancerTypes.isComplete ? (
                    <PatientViewPlotsTabWrapper
                        store={pageComponent.patientViewPageStore}
                        urlWrapper={urlWrapper}
                    />
                ) : (
                    <LoadingIndicator
                        isLoading={true}
                        size={'big'}
                        center={true}
                    />
                )}
            </MSKTab>
        );
    }

    pageComponent.resourceTabs.component &&
        /* @ts-ignore */
        tabs.push(...pageComponent.resourceTabs.component);

    tabs.push(...buildCustomTabs(pageComponent.customTabs));

    // {getServerConfig().custom_tabs &&
    //     getServerConfig()
    //         .custom_tabs.filter(
    //             (tab: any) =>
    //                 tab.location === 'PATIENT_PAGE'
    //         )
    //         .map((tab: any, i: number) => {
    //             return (
    //                 <MSKTab
    //                     key={getPatientViewResourceTabId(
    //                         'customTab' + i
    //                     )}
    //                     id={getPatientViewResourceTabId(
    //                         'customTab' + i
    //                     )}
    //                     unmountOnHide={
    //                         tab.unmountOnHide ===
    //                         true
    //                     }
    //                     onTabDidMount={div => {
    //                         this.customTabMountCallback(
    //                             div,
    //                             tab
    //                         );
    //                     }}
    //                     linkText={tab.title}
    //                 ></MSKTab>
    //             );
    //         })}

    return tabs;
}
