import {computed, makeObservable, observable} from "mobx";
import {remoteData} from "cbioportal-frontend-commons";
import {Gene} from "cbioportal-ts-api-client";
import {
    AlterationCountByGene,
    MolecularProfileCaseIdentifier
} from "cbioportal-ts-api-client/dist/generated/CBioPortalAPIInternal";

import {fetchGenes} from "shared/lib/StoreUtils";
import internalClient from "shared/api/cbioportalInternalClientInstance";
import {ResultsViewPageStore} from "pages/resultsView/ResultsViewPageStore";
import {ICBioData} from "pathway-mapper";
import {percentAltered} from "shared/components/oncoprint/OncoprintUtils";

function fetchAlterationCounts(
    genes: Gene[],
    selectedMolecularProfileCaseIdentifiers: MolecularProfileCaseIdentifier[]
) {
    if (genes.length === 0) {
        return Promise.resolve([]);
    }

    return internalClient.fetchAlterationCountsUsingPOST({
        entrezGeneIds: genes.map(gene => gene.entrezGeneId),
        alterationCountFilter: {
            molecularProfileCaseIdentifiers: selectedMolecularProfileCaseIdentifiers,
            alterationFilter: {
                copyNumberAlterationEventTypes: {
                    AMP: true,
                    HOMDEL: true
                },
                mutationEventTypes: {
                    any: true
                },
                structuralVariants: null,
                // TODO adjust filter wrt selected driver settings?
                // includeDriver: false,
                // includeGermline: false,
                // includeSomatic: false,
                // includeUnknownOncogenicity: false,
                // includeUnknownStatus: false,
                // includeUnknownTier: false,
                // includeVUS: false,
                // tiersBooleanMap: {},
            } as any
        }
    });
}

function getAlterationInfo(count: AlterationCountByGene) {
    return {
        gene: count.hugoGeneSymbol,
        altered: count.numberOfAlteredCases,
        sequenced: count.numberOfProfiledCases,
        percentAltered: percentAltered(count.numberOfAlteredCases, count.numberOfProfiledCases),
    };
}

export class ResultsViewPathwayMapperStore {
    private accumulatedAlterationFrequencyDataForNonQueryGenes: ICBioData[];
    private readonly accumulatedValidGenes: { [hugoGeneSymbol: string]: boolean };

    @observable
    public newGenesFromPathway: string[];

    constructor(private resultsViewPageStore: ResultsViewPageStore) {
        makeObservable(this);
        this.accumulatedAlterationFrequencyDataForNonQueryGenes = [];
        this.accumulatedValidGenes = {};
    }

    readonly alterationCountsByQueryGenes = remoteData<AlterationCountByGene[]>({
        await: () => [
            this.resultsViewPageStore.genes,
            this.selectedMolecularProfileCaseIdentifiers
        ],
        invoke: () => {
            return fetchAlterationCounts(this.resultsViewPageStore.genes.result || [], this.selectedMolecularProfileCaseIdentifiers.result || []);
        }
    });

    readonly alterationCountsByNonQueryGenes = remoteData<AlterationCountByGene[]>({
        await: () => [
            this.validNonQueryGenes,
            this.selectedMolecularProfileCaseIdentifiers
        ],
        invoke: () => {
            return fetchAlterationCounts(this.validNonQueryGenes.result || [], this.selectedMolecularProfileCaseIdentifiers.result || []);
        }
    });

    readonly selectedMolecularProfileCaseIdentifiers = remoteData<MolecularProfileCaseIdentifier[]>({
        await: () => [
            this.resultsViewPageStore.filteredSamples,
            this.resultsViewPageStore.selectedMolecularProfiles
        ],
        invoke: () => {
            const molecularProfileCaseIdentifiers: MolecularProfileCaseIdentifier[]= [];

            this.resultsViewPageStore.filteredSamples.result?.forEach(sample => {
                this.resultsViewPageStore.selectedMolecularProfiles.result?.forEach(profile => {
                    molecularProfileCaseIdentifiers.push({
                        caseId: sample.sampleId,
                        molecularProfileId: profile.molecularProfileId,
                    });
                });
            });

            return Promise.resolve(molecularProfileCaseIdentifiers);
        }
    });

    readonly validNonQueryGenes = remoteData<Gene[]>({
        invoke: () => {
            return fetchGenes(this.newGenesFromPathway);
        },
    });

    /**
     * Valid non-query genes accumulated from currently selected pathway
     * and previously selected pathways in a single query session.
     */
    @computed get validGenes() {
        if (this.validNonQueryGenes.isComplete) {
            // Valid genes are accumulated.
            this.validNonQueryGenes.result.forEach(gene => {
                this.accumulatedValidGenes[gene.hugoGeneSymbol] = true;
            });
        }

        return this.accumulatedValidGenes;
    }

    @computed get alterationFrequencyData(): ICBioData[] {
        return this.alterationFrequencyDataForQueryGenes.concat(
            this.alterationFrequencyDataForNonQueryGenes
        );
    }

    @computed get alterationFrequencyDataForQueryGenes() {
        let alterationFrequencyData: ICBioData[] = [];

        if (this.alterationCountsByQueryGenes.isComplete) {
            // gene: (oql as any).gene,
            //     altered: alterationInfo.altered,
            //     sequenced: alterationInfo.sequenced,
            //     percentAltered: alterationInfo.percent,

            // this.props.store.oqlFilteredCaseAggregatedDataByUnflattenedOQLLine.result!.forEach(
            //     alterationData => {
            //         const data = getAlterationData(
            //             this.props.store.samples.result,
            //             this.props.store.patients.result,
            //             this.props.store.coverageInformation.result!,
            //             this.props.store.filteredSequencedSampleKeysByGene.result!,
            //             this.props.store.filteredSequencedPatientKeysByGene.result!,
            //             this.props.store.selectedMolecularProfiles.result!,
            //             alterationData,
            //             true,
            //             this.props.store.genes.result!
            //         );
            //
            //         if (data) {
            //             alterationFrequencyData.push(data);
            //         }
            //     }
            // );

            alterationFrequencyData = this.alterationCountsByQueryGenes.result?.map(getAlterationInfo) || [];
        }

        return alterationFrequencyData;
    }

    @computed get alterationFrequencyDataForNonQueryGenes() {
        let alterationFrequencyDataForNewGenes: ICBioData[] = [];

        if (this.alterationCountsByNonQueryGenes.isComplete) {
            // this.storeForAllData!.oqlFilteredCaseAggregatedDataByUnflattenedOQLLine.result!.forEach(
            //     alterationData => {
            //         const data = getAlterationData(
            //             this.storeForAllData!.samples.result,
            //             this.storeForAllData!.patients.result,
            //             this.storeForAllData!.coverageInformation.result!,
            //             this.storeForAllData!.filteredSequencedSampleKeysByGene
            //                 .result!,
            //             this.storeForAllData!.filteredSequencedPatientKeysByGene
            //                 .result!,
            //             this.storeForAllData!.selectedMolecularProfiles.result!,
            //             alterationData,
            //             false,
            //             this.props.store.genes.result!
            //         );
            //
            //         if (data) {
            //             alterationFrequencyDataForNewGenes.push(data);
            //         }
            //     }
            // );

            alterationFrequencyDataForNewGenes = this.alterationCountsByNonQueryGenes.result?.map(getAlterationInfo) || [];
        }

        // on pathway change PathwayMapper returns only the genes that are new (i.e genes for which we haven't
        // calculated the alteration data yet), so we need to accumulate the alteration frequency data after each
        // query
        this.accumulatedAlterationFrequencyDataForNonQueryGenes = this.accumulatedAlterationFrequencyDataForNonQueryGenes.concat(
            alterationFrequencyDataForNewGenes
        );

        return this.accumulatedAlterationFrequencyDataForNonQueryGenes;
    }
}
