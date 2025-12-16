import * as React from 'react';
import { PatientViewPageStore } from './clinicalInformation/PatientViewPageStore';
import PatientViewUrlWrapper from './PatientViewUrlWrapper';
import { observer } from 'mobx-react';
import PlotsTab from 'shared/components/plots/PlotsTab';
import CohortSelector from 'shared/components/plots/CohortSelector';
import { SamplePointLabel } from 'shared/components/sampleLabel/SampleLabel';

export enum CohortOptions {
    WholeStudy = 'WholeStudy',
    CancerType = 'CancerType',
    CancerTypeDetailed = 'CancerTypeDetailed',
}

export const PatientViewPlotsTabWrapper: React.FunctionComponent<{
    store: PatientViewPageStore;
    urlWrapper: PatientViewUrlWrapper;
}> = observer(function({ store, urlWrapper }) {
    const cohortSelector = () => (
        <CohortSelector
            includeNavCohortOption={store.patientIdsInCohort.length > 0}
            samplesInCohort={store.patientViewPlotsStore.samplesInCohort.result}
            study={store.studies.result![0].name}
            cancerTypes={
                store.patientViewPlotsStore.highlightedCancerTypes.result
            }
            cancerTypesDetailed={
                store.patientViewPlotsStore.highlightedDetailedCancerTypes
                    .result
            }
            cohortSelection={store.patientViewPlotsStore.cohortSelection}
            handleCohortChange={store.patientViewPlotsStore.handleCohortChange}
        />
    );

    const customSamplePointComponent = (sampleId: string, mouseEvents: any) => (
        <SamplePointLabel
            label={(
                store.sampleManager.result!.sampleIndex[sampleId] + 1
            ).toString()}
            events={mouseEvents}
        />
    );

    return (
        <PlotsTab
            filteredSamplesByDetailedCancerType={
                store.patientViewPlotsStore.filteredSamplesByDetailedCancerType
            }
            mutations={store.patientViewPlotsStore.mutations}
            studies={store.patientViewPlotsStore.cohortStudies}
            molecularProfileIdSuffixToMolecularProfiles={
                store.patientViewPlotsStore
                    .molecularProfileIdSuffixToMolecularProfiles
            }
            entrezGeneIdToGene={
                store.patientViewPlotsStore.entrezGeneIdToGeneAll
            }
            sampleKeyToSample={
                store.patientViewPlotsStore.selectedReferenceCohortSampleMap
            }
            genes={store.patientViewPlotsStore.allGenes}
            clinicalAttributes={store.patientViewPlotsStore.clinicalAttributes}
            genesets={store.patientViewPlotsStore.genesets}
            genericAssayEntitiesGroupByMolecularProfileId={
                store.patientViewPlotsStore
                    .genericAssayEntitiesGroupedByProfileId
            }
            customAttributes={store.patientViewPlotsStore.customAttributes}
            studyIds={store.patientViewPlotsStore.cohortStudyIds}
            molecularProfilesWithData={
                store.patientViewPlotsStore.molecularProfilesInCohortStudies
            }
            molecularProfilesInStudies={
                store.patientViewPlotsStore.molecularProfilesInCohortStudies
            }
            annotatedCnaCache={store.patientViewPlotsStore.annotatedCnaCache}
            annotatedMutationCache={
                store.patientViewPlotsStore.annotatedMutationCache
            }
            structuralVariantCache={
                store.patientViewPlotsStore.structuralVariantCache
            }
            studyToMutationMolecularProfile={
                store.patientViewPlotsStore.studyToMutationMolecularProfile
            }
            studyToMolecularProfileDiscreteCna={
                store.patientViewPlotsStore.studyToMolecularProfileDiscreteCna
            }
            clinicalDataCache={store.patientViewPlotsStore.clinicalDataCache}
            patientKeyToFilteredSamples={
                store.patientViewPlotsStore.patientKeyToFilteredSamples
            }
            numericGeneMolecularDataCache={
                store.patientViewPlotsStore.numericGeneMolecularDataCache
            }
            coverageInformation={
                store.patientViewPlotsStore.coverageInformation
            }
            filteredSamples={
                store.patientViewPlotsStore.selectedReferenceCohortSamples
            }
            genesetMolecularDataCache={
                store.patientViewPlotsStore.genesetMolecularDataCache
            }
            genericAssayMolecularDataCache={
                store.patientViewPlotsStore.genericAssayMolecularDataCache
            }
            studyToStructuralVariantMolecularProfile={
                store.patientViewPlotsStore
                    .studyToStructuralVariantMolecularProfile
            }
            driverAnnotationSettings={
                store.patientViewPlotsStore.driverAnnotationSettings
            }
            studyIdToStudy={
                store.patientViewPlotsStore.cohortStudyIdsToStudy.result
            }
            structuralVariants={
                store.patientViewPlotsStore.structuralVariants.result
            }
            hugoGeneSymbols={
                store.patientViewPlotsStore.allHugoGeneSymbols.result
            }
            selectedGenericAssayEntitiesGroupByMolecularProfileId={
                store.patientViewPlotsStore
                    .selectedGenericAssayEntitiesGroupByMolecularProfileId
            }
            molecularProfileIdToMolecularProfile={
                store.patientViewPlotsStore.molecularProfileIdToMolecularProfile
            }
            urlWrapper={urlWrapper}
            hasNoQueriedGenes={true}
            genePanelDataForAllProfiles={
                store.patientViewPlotsStore.genePanelDataForAllProfiles.result
            }
            patients={store.patientViewPlotsStore.patientsInCohort}
            highlightedSamples={store.sampleIds}
            additionalControls={cohortSelector}
            customSamplePointComponent={customSamplePointComponent}
        />
    );
});
