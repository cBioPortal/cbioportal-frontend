import * as React from 'react';
import { PatientViewPageStore } from './clinicalInformation/PatientViewPageStore';
import PatientViewUrlWrapper from './PatientViewUrlWrapper';
import { observer } from 'mobx-react';
import PlotsTab from 'shared/components/plots/PlotsTab';

export const PatientViewPlotsTabWrapper: React.FunctionComponent<{
    store: PatientViewPageStore;
    urlWrapper: PatientViewUrlWrapper;
}> = observer(function({ store, urlWrapper }) {
    return (
        <PlotsTab
            filteredSamplesByDetailedCancerType={
                store.filteredSamplesByDetailedCancerType
            }
            mutations={store.mutationData}
            studies={store.studies}
            molecularProfileIdSuffixToMolecularProfiles={
                store.molecularProfileIdSuffixToMolecularProfiles
            }
            entrezGeneIdToGene={store.entrezGeneIdToGeneAll}
            sampleKeyToSample={store.sampleSetByKey}
            genes={store.allGenes}
            clinicalAttributes={store.clinicalAttributes}
            genesets={store.genesets}
            genericAssayEntitiesGroupByMolecularProfileId={
                store.genericAssayEntitiesGroupedByProfileId
            }
            customAttributes={store.customAttributes}
            studyIds={store.queriedPhysicalStudyIds}
            molecularProfilesWithData={store.molecularProfilesInStudy}
            molecularProfilesInStudies={store.molecularProfilesInStudy}
            annotatedCnaCache={store.annotatedCnaCache}
            annotatedMutationCache={store.annotatedMutationCache}
            structuralVariantCache={store.structuralVariantCache}
            studyToMutationMolecularProfile={
                store.studyToMutationMolecularProfile
            }
            studyToMolecularProfileDiscreteCna={
                store.studyToMolecularProfileDiscreteCna
            }
            clinicalDataCache={store.clinicalDataCache}
            patientKeyToFilteredSamples={store.patientKeyToFilteredSamples}
            numericGeneMolecularDataCache={store.numericGeneMolecularDataCache}
            coverageInformation={store.coverageInformationForAllSamples}
            filteredSamples={store.allSamplesInStudy}
            genesetMolecularDataCache={store.genesetMolecularDataCache}
            genericAssayMolecularDataCache={
                store.genericAssayMolecularDataCache
            }
            studyToStructuralVariantMolecularProfile={
                store.studyToStructuralVariantMolecularProfile
            }
            driverAnnotationSettings={store.driverAnnotationSettings}
            studyIdToStudy={store.studyIdToStudy.result}
            structuralVariants={store.structuralVariantData.result}
            hugoGeneSymbols={store.allHugoGeneSymbols.result}
            selectedGenericAssayEntitiesGroupByMolecularProfileId={
                store.selectedGenericAssayEntitiesGroupByMolecularProfileId
            }
            molecularProfileIdToMolecularProfile={
                store.molecularProfileIdToMolecularProfile
            }
            urlWrapper={urlWrapper}
            hasNoQueriedGenes={true}
            genePanelDataForAllProfiles={
                store.genePanelDataForAllProfiles.result
            }
            patients={store.allPatientsInStudy}
            highlightedSamples={store.sampleIds}
        />
    );
});
