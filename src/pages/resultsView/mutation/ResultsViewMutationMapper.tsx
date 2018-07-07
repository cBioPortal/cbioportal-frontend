import * as React from 'react';
import {observer} from "mobx-react";
import {computed} from "mobx";

import LoadingIndicator from "shared/components/loadingIndicator/LoadingIndicator";
import DiscreteCNACache from "shared/cache/DiscreteCNACache";
import CancerTypeCache from "shared/cache/CancerTypeCache";
import MutationCountCache from "shared/cache/MutationCountCache";

import {
    IMutationMapperProps, default as MutationMapper
} from "shared/components/mutationMapper/MutationMapper";

import MutationRateSummary from "pages/resultsView/mutation/MutationRateSummary";
import ResultsViewMutationMapperStore from "pages/resultsView/mutation/ResultsViewMutationMapperStore";
import ResultsViewMutationTable from "pages/resultsView/mutation/ResultsViewMutationTable";

export interface IResultsViewMutationMapperProps extends IMutationMapperProps
{
    store:ResultsViewMutationMapperStore;
    discreteCNACache?:DiscreteCNACache;
    cancerTypeCache?:CancerTypeCache;
    mutationCountCache?:MutationCountCache;
}

@observer
export default class ResultsViewMutationMapper extends MutationMapper<IResultsViewMutationMapperProps>
{
    constructor(props: IResultsViewMutationMapperProps) {
        super(props);
    }

    @computed get mutationRateSummary():JSX.Element|null {
        // TODO we should not be even calculating mskImpactGermlineConsentedPatientIds for studies other than msk impact
        if (this.props.store.germlineConsentedSamples &&
            this.props.store.germlineConsentedSamples.result &&
            this.props.store.mutationData.isComplete &&
            this.props.store.mutationData.result.length > 0) {
            return (
                <MutationRateSummary
                    hugoGeneSymbol={this.props.store.gene.hugoGeneSymbol}
                    molecularProfileIdToMolecularProfile={this.props.store.molecularProfileIdToMolecularProfile}
                    mutations={this.props.store.mutationData.result}
                    samples={this.props.store.samples.result!}
                    germlineConsentedSamples={this.props.store.germlineConsentedSamples}
                />
            );
        } else {
            return null;
        }
    }

    protected mutationTableComponent(): JSX.Element|null
    {
        return (
            <ResultsViewMutationTable
                uniqueSampleKeyToTumorType={this.props.store.uniqueSampleKeyToTumorType}
                oncoKbAnnotatedGenes={this.props.store.oncoKbAnnotatedGenes}
                discreteCNACache={this.props.discreteCNACache}
                studyIdToStudy={this.props.store.studyIdToStudy.result}
                genomeNexusEnrichmentCache={this.props.genomeNexusEnrichmentCache}
                molecularProfileIdToMolecularProfile={this.props.store.molecularProfileIdToMolecularProfile.result}
                oncoKbEvidenceCache={this.props.oncoKbEvidenceCache}
                pubMedCache={this.props.pubMedCache}
                mutationCountCache={this.props.mutationCountCache}
                dataStore={this.props.store.dataStore}
                itemsLabelPlural={this.itemsLabelPlural}
                downloadDataFetcher={this.props.store.downloadDataFetcher}
                myCancerGenomeData={this.props.myCancerGenomeData}
                hotspotData={this.props.store.indexedHotspotData}
                cosmicData={this.props.store.cosmicData.result}
                oncoKbData={this.props.store.oncoKbData}
                civicGenes={this.props.store.civicGenes}
                civicVariants={this.props.store.civicVariants}
                userEmailAddress={this.props.config.userEmailAddress}
                enableOncoKb={this.props.config.showOncoKB}
                enableFunctionalImpact={this.props.config.showGenomeNexus}
                enableHotspot={this.props.config.showHotspot}
                enableMyCancerGenome={this.props.config.showMyCancerGenome}
                enableCivic={this.props.config.showCivic}
            />
        );
    }

    protected mutationTable(): JSX.Element|null
    {
        return (
            <span>
                <LoadingIndicator
                    isLoading={
                        (this.props.store.clinicalDataForSamples &&
                            this.props.store.clinicalDataForSamples.isPending) ||
                        (this.props.store.studiesForSamplesWithoutCancerTypeClinicalData &&
                            this.props.store.studiesForSamplesWithoutCancerTypeClinicalData.isPending)
                    }
                />
                {(!this.props.store.clinicalDataForSamples ||
                    !this.props.store.clinicalDataForSamples.isPending) &&
                (!this.props.store.studiesForSamplesWithoutCancerTypeClinicalData ||
                    !this.props.store.studiesForSamplesWithoutCancerTypeClinicalData.isPending) && (
                    this.mutationTableComponent()
                )}
            </span>
        );
    }
}
