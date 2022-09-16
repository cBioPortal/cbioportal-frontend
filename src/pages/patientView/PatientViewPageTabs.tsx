import { MSKTab, MSKTabs } from 'shared/components/MSKTabs/MSKTabs';
import LoadingIndicator from 'shared/components/loadingIndicator/LoadingIndicator';
import TimelineWrapper from 'pages/patientView/timeline/TimelineWrapper';
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
import _ from 'lodash';
import MutationalSignaturesContainer from 'pages/patientView/mutationalSignatures/MutationalSignaturesContainer';
import { buildCustomTabs } from 'shared/lib/customTabs/customTabHelpers';
import * as React from 'react';
import SampleManager from 'pages/patientView/SampleManager';
import PatientViewPage from 'pages/patientView/PatientViewPage';
import PatientViewUrlWrapper from 'pages/patientView/PatientViewUrlWrapper';
import { CompactVAFPlot } from 'pages/patientView/genomicOverview/CompactVAFPlot';
import {
    computeMutationFrequencyBySample,
    doesFrequencyExist,
} from 'pages/patientView/genomicOverview/GenomicOverviewUtils';
import genomicOverviewStyles from 'pages/patientView/genomicOverview/styles.module.scss';
import FeatureInstruction from 'shared/FeatureInstruction/FeatureInstruction';
import { HelpWidget } from 'shared/components/HelpWidget/HelpWidget';
import MutationTableWrapper from './mutation/MutationTableWrapper';

export enum PatientViewPageTabs {
    Summary = 'summary',
    genomicEvolution = 'genomicEvolution',
    ClinicalData = 'clinicalData',
    FilesAndLinks = 'filesAndLinks',
    PathologyReport = 'pathologyReport',
    TissueImage = 'tissueImage',
    MSKTissueImage = 'MSKTissueImage',
    TrialMatchTab = 'trialMatchTab',
    MutationalSignatures = 'mutationalSignatures',
    PathwayMapper = 'pathways',
}

export const PatientViewResourceTabPrefix = 'openResource_';
export const TABLE_FEATURE_INSTRUCTION =
    'Click on an alteration to zoom in on the gene in the IGV browser above';

export function getPatientViewResourceTabId(resourceId: string) {
    return `${PatientViewResourceTabPrefix}${resourceId}`;
}

export function extractResourceIdFromTabId(tabId: string) {
    const match = new RegExp(`${PatientViewResourceTabPrefix}(.*)`).exec(tabId);
    if (match) {
        return match[1];
    } else {
        return undefined;
    }
}

export function patientViewTabs(
    pageInstance: PatientViewPage,
    urlWrapper: PatientViewUrlWrapper,
    sampleManager: SampleManager | null
) {
    return (
        <MSKTabs
            id="patientViewPageTabs"
            key={urlWrapper.hash}
            activeTabId={urlWrapper.activeTabId}
            onTabClick={(id: string) => urlWrapper.setActiveTab(id)}
            className="mainTabs"
            getPaginationWidth={WindowStore.getWindowWidth}
            onMount={() => console.log('TABS MOUNT')}
            contentWindowExtra={
                <HelpWidget path={urlWrapper.routing.location.pathname} />
            }
        >
            {tabs(pageInstance, sampleManager)}
        </MSKTabs>
    );
}

export function tabs(
    pageComponent: PatientViewPage,
    sampleManager: SampleManager | null
) {
    const tabs: JSX.Element[] = [];

    tabs.push(
        <MSKTab key={0} id={PatientViewPageTabs.Summary} linkText="Summary">
            <LoadingIndicator
                isLoading={
                    pageComponent.patientViewPageStore.clinicalEvents.isPending
                }
            />

            {!!sampleManager &&
                pageComponent.patientViewPageStore.clinicalEvents.isComplete &&
                pageComponent.patientViewPageStore.clinicalEvents.result
                    .length > 0 && (
                    <div>
                        <div
                            style={{
                                marginTop: 20,
                                marginBottom: 20,
                            }}
                        >
                            {' '}
                            {pageComponent.showNewTimeline && (
                                <TimelineWrapper
                                    dataStore={
                                        pageComponent.patientViewMutationDataStore
                                    }
                                    caseMetaData={{
                                        color: sampleManager.sampleColors,
                                        label: sampleManager.sampleLabels,
                                        index: sampleManager.sampleIndex,
                                    }}
                                    data={
                                        pageComponent.patientViewPageStore
                                            .clinicalEvents.result
                                    }
                                    sampleManager={sampleManager}
                                    width={WindowStore.size.width}
                                    samples={
                                        pageComponent.patientViewPageStore
                                            .samples.result
                                    }
                                    mutationProfileId={
                                        pageComponent.patientViewPageStore
                                            .mutationMolecularProfileId.result!
                                    }
                                    // coverageInformation={
                                    //     this
                                    //         .patientViewPageStore
                                    //         .coverageInformation
                                    //         .result
                                    // }
                                />
                            )}
                        </div>
                        <hr />
                    </div>
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

            {pageComponent.patientViewPageStore.oncoKbAnnotatedGenes
                .isComplete &&
                pageComponent.patientViewPageStore.mutationData.isComplete &&
                pageComponent.patientViewPageStore.uncalledMutationData
                    .isComplete &&
                pageComponent.patientViewPageStore.studyIdToStudy.isComplete &&
                pageComponent.patientViewPageStore.sampleToMutationGenePanelId
                    .isComplete &&
                pageComponent.patientViewPageStore.sampleToDiscreteGenePanelId
                    .isComplete &&
                pageComponent.patientViewPageStore.genePanelIdToEntrezGeneIds
                    .isComplete &&
                pageComponent.patientViewPageStore.mutationMolecularProfile
                    .isComplete &&
                pageComponent.patientViewPageStore
                    .genePanelDataByMolecularProfileIdAndSampleId.isComplete &&
                !!sampleManager && (
                    <div data-test="patientview-mutation-table">
                        <FeatureInstruction content={TABLE_FEATURE_INSTRUCTION}>
                            <MutationTableWrapper
                                profile={
                                    pageComponent.patientViewPageStore
                                        .mutationMolecularProfile.result
                                }
                                genePanelDataByMolecularProfileIdAndSampleId={
                                    pageComponent.patientViewPageStore
                                        .genePanelDataByMolecularProfileIdAndSampleId
                                        .result
                                }
                                dataStore={
                                    pageComponent.patientViewMutationDataStore
                                }
                                studyIdToStudy={
                                    pageComponent.patientViewPageStore
                                        .studyIdToStudy.result
                                }
                                sampleManager={sampleManager}
                                sampleToGenePanelId={
                                    pageComponent.patientViewPageStore
                                        .sampleToMutationGenePanelId.result
                                }
                                genePanelIdToEntrezGeneIds={
                                    pageComponent.patientViewPageStore
                                        .genePanelIdToEntrezGeneIds.result
                                }
                                sampleIds={
                                    pageComponent.patientViewPageStore.sampleIds
                                }
                                uniqueSampleKeyToTumorType={
                                    pageComponent.patientViewPageStore
                                        .uniqueSampleKeyToTumorType
                                }
                                molecularProfileIdToMolecularProfile={
                                    pageComponent.patientViewPageStore
                                        .molecularProfileIdToMolecularProfile
                                        .result
                                }
                                variantCountCache={
                                    pageComponent.patientViewPageStore
                                        .variantCountCache
                                }
                                indexedVariantAnnotations={
                                    pageComponent.patientViewPageStore
                                        .indexedVariantAnnotations
                                }
                                indexedMyVariantInfoAnnotations={
                                    pageComponent.patientViewPageStore
                                        .indexedMyVariantInfoAnnotations
                                }
                                discreteCNACache={
                                    pageComponent.patientViewPageStore
                                        .discreteCNACache
                                }
                                mrnaExprRankCache={
                                    pageComponent.patientViewPageStore
                                        .mrnaExprRankCache
                                }
                                pubMedCache={
                                    pageComponent.patientViewPageStore
                                        .pubMedCache
                                }
                                genomeNexusCache={
                                    pageComponent.patientViewPageStore
                                        .genomeNexusCache
                                }
                                genomeNexusMutationAssessorCache={
                                    pageComponent.patientViewPageStore
                                        .genomeNexusMutationAssessorCache
                                }
                                mrnaExprRankMolecularProfileId={
                                    pageComponent.patientViewPageStore
                                        .mrnaRankMolecularProfileId.result ||
                                    undefined
                                }
                                discreteCNAMolecularProfileId={
                                    pageComponent.patientViewPageStore
                                        .molecularProfileIdDiscrete.result
                                }
                                data={
                                    pageComponent.patientViewPageStore
                                        .mergedMutationDataIncludingUncalledFilteredByGene
                                }
                                downloadDataFetcher={
                                    pageComponent.patientViewPageStore
                                        .downloadDataFetcher
                                }
                                mutSigData={
                                    pageComponent.patientViewPageStore
                                        .mutSigData.result
                                }
                                myCancerGenomeData={
                                    pageComponent.patientViewPageStore
                                        .myCancerGenomeData
                                }
                                hotspotData={
                                    pageComponent.patientViewPageStore
                                        .indexedHotspotData
                                }
                                cosmicData={
                                    pageComponent.patientViewPageStore
                                        .cosmicData.result
                                }
                                oncoKbData={
                                    pageComponent.patientViewPageStore
                                        .oncoKbData
                                }
                                oncoKbCancerGenes={
                                    pageComponent.patientViewPageStore
                                        .oncoKbCancerGenes
                                }
                                usingPublicOncoKbInstance={
                                    pageComponent.patientViewPageStore
                                        .usingPublicOncoKbInstance
                                }
                                mergeOncoKbIcons={
                                    pageComponent.mergeMutationTableOncoKbIcons
                                }
                                onOncoKbIconToggle={
                                    pageComponent.handleOncoKbIconToggle
                                }
                                civicGenes={
                                    pageComponent.patientViewPageStore
                                        .civicGenes
                                }
                                civicVariants={
                                    pageComponent.patientViewPageStore
                                        .civicVariants
                                }
                                userEmailAddress={ServerConfigHelpers.getUserEmailAddress()}
                                enableOncoKb={getServerConfig().show_oncokb}
                                enableFunctionalImpact={
                                    getServerConfig().show_genomenexus
                                }
                                enableHotspot={getServerConfig().show_hotspot}
                                enableMyCancerGenome={
                                    getServerConfig().mycancergenome_show
                                }
                                enableCivic={getServerConfig().show_civic}
                                columnVisibility={
                                    pageComponent.mutationTableColumnVisibility
                                }
                                showGeneFilterMenu={
                                    pageComponent.patientViewPageStore
                                        .mutationTableShowGeneFilterMenu.result
                                }
                                currentGeneFilter={
                                    pageComponent.patientViewPageStore
                                        .mutationTableGeneFilterOption
                                }
                                onFilterGenes={
                                    pageComponent.onFilterGenesMutationTable
                                }
                                columnVisibilityProps={{
                                    onColumnToggled:
                                        pageComponent.onMutationTableColumnVisibilityToggled,
                                }}
                                onSelectGenePanel={
                                    pageComponent.toggleGenePanelModal
                                }
                                disableTooltip={
                                    pageComponent.genePanelModal.isOpen
                                }
                                generateGenomeNexusHgvsgUrl={
                                    pageComponent.patientViewPageStore
                                        .generateGenomeNexusHgvsgUrl
                                }
                                onRowClick={
                                    pageComponent.onMutationTableRowClick
                                }
                                onRowMouseEnter={
                                    pageComponent.onMutationTableRowMouseEnter
                                }
                                onRowMouseLeave={
                                    pageComponent.onMutationTableRowMouseLeave
                                }
                                sampleIdToClinicalDataMap={
                                    pageComponent.patientViewPageStore
                                        .clinicalDataGroupedBySampleMap
                                }
                                existsSomeMutationWithAscnProperty={
                                    pageComponent.patientViewPageStore
                                        .existsSomeMutationWithAscnProperty
                                }
                                namespaceColumns={
                                    pageComponent.patientViewMutationDataStore
                                        .namespaceColumnConfig
                                }
                                columns={pageComponent.columns}
                                pageMode={
                                    pageComponent.patientViewPageStore.pageMode
                                }
                                alleleFreqHeaderRender={
                                    pageComponent.patientViewPageStore
                                        .mergedMutationDataFilteredByGene
                                        .length > 0 &&
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
                                                      pageComponent
                                                          .patientViewPageStore
                                                          .mergedMutationDataFilteredByGene
                                                  }
                                                  sampleManager={sampleManager}
                                                  sampleIdToMutationGenePanelId={
                                                      pageComponent
                                                          .patientViewPageStore
                                                          .sampleToMutationGenePanelId
                                                          .result
                                                  }
                                                  sampleIdToCopyNumberGenePanelId={
                                                      pageComponent
                                                          .patientViewPageStore
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
                                                              display:
                                                                  'inline-flex',
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
                        </FeatureInstruction>
                    </div>
                )}

            <hr />

            <LoadingIndicator
                isLoading={
                    pageComponent.patientViewPageStore.studyIdToStudy.isPending
                }
            />

            <StructuralVariantTableWrapper
                store={pageComponent.patientViewPageStore}
                onSelectGenePanel={pageComponent.toggleGenePanelModal}
                mergeOncoKbIcons={
                    pageComponent.patientViewPageStore.mergeOncoKbIcons
                }
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
                        <FeatureInstruction content={TABLE_FEATURE_INSTRUCTION}>
                            <CopyNumberTableWrapper
                                profile={
                                    pageComponent.patientViewPageStore
                                        .discreteMolecularProfile.result
                                }
                                genePanelDataByMolecularProfileIdAndSampleId={
                                    pageComponent.patientViewPageStore
                                        .genePanelDataByMolecularProfileIdAndSampleId
                                        .result
                                }
                                dataStore={
                                    pageComponent.patientViewCnaDataStore
                                }
                                uniqueSampleKeyToTumorType={
                                    pageComponent.patientViewPageStore
                                        .uniqueSampleKeyToTumorType
                                }
                                studyIdToStudy={
                                    pageComponent.patientViewPageStore
                                        .studyIdToStudy.result
                                }
                                sampleIds={
                                    pageComponent.patientViewPageStore.sampleIds
                                }
                                sampleManager={sampleManager}
                                sampleToGenePanelId={
                                    pageComponent.patientViewPageStore
                                        .sampleToDiscreteGenePanelId.result
                                }
                                genePanelIdToEntrezGeneIds={
                                    pageComponent.patientViewPageStore
                                        .genePanelIdToEntrezGeneIds.result
                                }
                                cnaOncoKbData={
                                    pageComponent.patientViewPageStore
                                        .cnaOncoKbData
                                }
                                cnaCivicGenes={
                                    pageComponent.patientViewPageStore
                                        .cnaCivicGenes
                                }
                                cnaCivicVariants={
                                    pageComponent.patientViewPageStore
                                        .cnaCivicVariants
                                }
                                oncoKbCancerGenes={
                                    pageComponent.patientViewPageStore
                                        .oncoKbCancerGenes
                                }
                                usingPublicOncoKbInstance={
                                    pageComponent.patientViewPageStore
                                        .usingPublicOncoKbInstance
                                }
                                mergeOncoKbIcons={
                                    pageComponent.patientViewPageStore
                                        .mergeOncoKbIcons
                                }
                                enableOncoKb={getServerConfig().show_oncokb}
                                enableCivic={getServerConfig().show_civic}
                                userEmailAddress={
                                    getServerConfig().user_email_address
                                }
                                pubMedCache={
                                    pageComponent.patientViewPageStore
                                        .pubMedCache
                                }
                                referenceGenes={
                                    pageComponent.patientViewPageStore
                                        .referenceGenes.result
                                }
                                data={
                                    pageComponent.patientViewPageStore
                                        .mergedDiscreteCNADataFilteredByGene
                                }
                                copyNumberCountCache={
                                    pageComponent.patientViewPageStore
                                        .copyNumberCountCache
                                }
                                mrnaExprRankCache={
                                    pageComponent.patientViewPageStore
                                        .mrnaExprRankCache
                                }
                                gisticData={
                                    pageComponent.patientViewPageStore
                                        .gisticData.result
                                }
                                mrnaExprRankMolecularProfileId={
                                    pageComponent.patientViewPageStore
                                        .mrnaRankMolecularProfileId.result ||
                                    undefined
                                }
                                columnVisibility={
                                    pageComponent.cnaTableColumnVisibility
                                }
                                showGeneFilterMenu={
                                    pageComponent.patientViewPageStore
                                        .cnaTableShowGeneFilterMenu.result
                                }
                                currentGeneFilter={
                                    pageComponent.patientViewPageStore
                                        .copyNumberTableGeneFilterOption
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
                                onRowClick={pageComponent.onCnaTableRowClick}
                                pageMode={
                                    pageComponent.patientViewPageStore.pageMode
                                }
                            />
                        </FeatureInstruction>
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
                    onMutationTableColumnVisibilityToggled={
                        pageComponent.onMutationTableColumnVisibilityToggled
                    }
                    sampleManager={sampleManager}
                    urlWrapper={pageComponent.urlWrapper}
                    mergeOncoKbIcons={
                        pageComponent.mergeMutationTableOncoKbIcons
                    }
                    onOncoKbIconToggle={pageComponent.handleOncoKbIconToggle}
                />
            </MSKTab>
        );

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

            <h2 className={'divider'}>Timeline Data</h2>

            {pageComponent.patientViewPageStore.clinicalEvents.isComplete && (
                <ClinicalEventsTables
                    clinicalEvents={
                        pageComponent.patientViewPageStore.clinicalEvents.result
                    }
                />
            )}
        </MSKTab>
    );

    tabs.push(
        <MSKTab
            key={4}
            id={PatientViewPageTabs.FilesAndLinks}
            linkText={RESOURCES_TAB_NAME}
            hide={!pageComponent.shouldShowResources}
        >
            <div>
                <ResourcesTab
                    store={pageComponent.patientViewPageStore}
                    sampleManager={
                        pageComponent.patientViewPageStore.sampleManager.result!
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
                <PathologyReport
                    iframeHeight={WindowStore.size.height - 220}
                    pdfs={
                        pageComponent.patientViewPageStore.pathologyReport
                            .result
                    }
                />
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

    pageComponent.showWholeSlideViewerTab &&
        pageComponent.wholeSlideViewerUrl.result &&
        tabs.push(
            <MSKTab
                key={6}
                id={PatientViewPageTabs.MSKTissueImage}
                linkText="Tissue Image"
                unmountOnHide={false}
            >
                <div>
                    <IFrameLoader
                        height={WindowStore.size.height - 220}
                        url={pageComponent.wholeSlideViewerUrl.result!}
                    />
                </div>
            </MSKTab>
        );

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
        tabs.push(
            <MSKTab
                key={8}
                id="mutationalSignatures"
                linkText="Mutational Signature Data"
                hide={
                    pageComponent.patientViewPageStore
                        .mutationalSignatureMolecularProfiles.isPending ||
                    _.isEmpty(
                        pageComponent.patientViewPageStore
                            .mutationalSignatureDataGroupByVersion.result
                    )
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
                />
            </MSKTab>
        );

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
