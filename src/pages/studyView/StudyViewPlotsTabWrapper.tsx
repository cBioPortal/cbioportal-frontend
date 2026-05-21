import * as React from 'react';
import { StudyViewPageStore } from 'pages/studyView/StudyViewPageStore';
import StudyViewURLWrapper from 'pages/studyView/StudyViewURLWrapper';
import { observer } from 'mobx-react';
import PlotsTab from 'shared/components/plots/PlotsTab';

export const PlotsTabWrapper: React.FunctionComponent<{
    store: StudyViewPageStore;
    urlWrapper: StudyViewURLWrapper;
}> = observer(function({ store, urlWrapper }) {
    return (
        <PlotsTab
            filteredSamplesByDetailedCancerType={
                store.filteredSamplesByDetailedCancerType
            }
            mutations={store.plotsTabStore.mutations}
            studies={store.plotsTabStore.studies}
            molecularProfileIdSuffixToMolecularProfiles={
                store.plotsTabStore.molecularProfileIdSuffixToMolecularProfiles
            }
            entrezGeneIdToGene={store.plotsTabStore.entrezGeneIdToGene}
            sampleKeyToSample={store.plotsTabStore.sampleKeyToSample}
            genes={store.plotsTabStore.genes}
            clinicalAttributes={store.plotsTabStore.clinicalAttributes}
            genesets={store.plotsTabStore.genesets}
            genericAssayEntitiesGroupByMolecularProfileId={
                store.plotsTabStore
                    .genericAssayEntitiesGroupByMolecularProfileId
            }
            customAttributes={store.plotsTabStore.customAttributes}
            studyIds={store.plotsTabStore.studyIds}
            molecularProfilesWithData={
                store.plotsTabStore.molecularProfilesWithData
            }
            molecularProfilesInStudies={
                store.plotsTabStore.molecularProfilesInStudies
            }
            annotatedCnaCache={store.plotsTabStore.annotatedCnaCache}
            annotatedMutationCache={store.plotsTabStore.annotatedMutationCache}
            structuralVariantCache={store.plotsTabStore.structuralVariantCache}
            studyToMutationMolecularProfile={
                store.plotsTabStore.studyToMutationMolecularProfile
            }
            studyToMolecularProfileDiscreteCna={
                store.plotsTabStore.studyToMolecularProfileDiscreteCna
            }
            clinicalDataCache={store.plotsTabStore.clinicalDataCache}
            patientKeyToFilteredSamples={
                store.plotsTabStore.patientKeyToFilteredSamples
            }
            numericGeneMolecularDataCache={
                store.plotsTabStore.numericGeneMolecularDataCache
            }
            coverageInformation={store.plotsTabStore.coverageInformation}
            filteredSamples={store.plotsTabStore.filteredSamples}
            genesetMolecularDataCache={
                store.plotsTabStore.genesetMolecularDataCache
            }
            genericAssayMolecularDataCache={
                store.plotsTabStore.genericAssayMolecularDataCache
            }
            studyToStructuralVariantMolecularProfile={
                store.plotsTabStore.studyToStructuralVariantMolecularProfile
            }
            driverAnnotationSettings={
                store.plotsTabStore.driverAnnotationSettings
            }
            studyIdToStudy={store.plotsTabStore.studyIdToStudy}
            structuralVariants={store.plotsTabStore.structuralVariants.result}
            hugoGeneSymbols={store.plotsTabStore.hugoGeneSymbols}
            selectedGenericAssayEntitiesGroupByMolecularProfileId={
                store.plotsTabStore
                    .selectedGenericAssayEntitiesGroupByMolecularProfileId
            }
            molecularProfileIdToMolecularProfile={
                store.plotsTabStore.molecularProfileIdToMolecularProfile
            }
            urlWrapper={urlWrapper}
            hasNoQueriedGenes={store.plotsTabStore.hasNoQueriedGenes}
            genePanelDataForAllProfiles={
                store.plotsTabStore.genePanelDataForAllProfiles.result
            }
            patients={store.plotsTabStore.patients}
        />
    );
});
