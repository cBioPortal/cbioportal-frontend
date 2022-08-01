import _ from 'lodash';
import { computed, makeObservable, observable } from 'mobx';
import { remoteData } from 'cbioportal-frontend-commons';
import {
    Gene,
    MolecularProfile,
    Patient,
    Sample,
} from 'cbioportal-ts-api-client';
import {
    AlterationCountByGene,
    AlterationCountDetailed,
    GenePanelToGene,
    MolecularProfileCaseIdentifier,
} from 'cbioportal-ts-api-client/dist/generated/CBioPortalAPIInternal';

import { fetchGenes } from 'shared/lib/StoreUtils';
import internalClient from 'shared/api/cbioportalInternalClientInstance';
import { ResultsViewPageStore } from 'pages/resultsView/ResultsViewPageStore';
import { ICBioData } from 'pathway-mapper';
import { percentAltered } from 'shared/components/oncoprint/OncoprintUtils';

function fetchAlterationCounts(
    selectedMolecularProfileCaseIdentifiers: MolecularProfileCaseIdentifier[],
    alterationCountType: 'SAMPLE' | 'PATIENT' = 'PATIENT',
    genes?: Gene[]
): Promise<AlterationCountDetailed> {
    return internalClient.fetchAlterationCountsUsingPOST({
        entrezGeneIds: _.isEmpty(genes)
            ? (undefined as any)
            : genes!.map(gene => gene.entrezGeneId),
        alterationCountType,
        alterationCountFilter: {
            molecularProfileCaseIdentifiers: selectedMolecularProfileCaseIdentifiers,
            alterationFilter: {
                copyNumberAlterationEventTypes: {
                    AMP: true,
                    HOMDEL: true,
                },
                mutationEventTypes: {
                    any: true,
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
            } as any,
        },
    });
}

function emptyAlterationCount(): AlterationCountDetailed {
    return {
        alterationCountsByGene: [],
        allGenesProfiled: false,
        profiledGenes: [],
        profiledCasesCount: 0,
    };
}

function getAlterationInfo(count: AlterationCountByGene) {
    return {
        gene: count.hugoGeneSymbol,
        altered: count.numberOfAlteredCases,
        sequenced: count.numberOfProfiledCases,
        percentAltered: percentAltered(
            count.numberOfAlteredCases,
            count.numberOfProfiledCases
        ),
    };
}

function getNotProfiledAlterationCount(gene: Gene): AlterationCountByGene {
    return getNotAlteredAlterationCount(gene, 0);
}

function getNotAlteredAlterationCount(
    gene: Gene,
    numberOfProfiledCases: number
): AlterationCountByGene {
    return {
        hugoGeneSymbol: gene.hugoGeneSymbol,
        entrezGeneId: gene.entrezGeneId,
        numberOfAlteredCases: 0,
        numberOfProfiledCases,
        totalCount: 0,
        matchingGenePanelIds: [],
        qValue: 0,
    };
}

function getAlterationCountsForProfiledGenes(
    alterationCountDetailed: AlterationCountDetailed
) {
    let alterationCountsByGene: AlterationCountByGene[] =
        alterationCountDetailed.alterationCountsByGene;

    if (!alterationCountDetailed.allGenesProfiled) {
        const map = _.keyBy(
            alterationCountDetailed.profiledGenes,
            gene => gene.hugoGeneSymbol
        );

        // there may actually be alteration counts for N/P genes,
        // but we just ignore them
        alterationCountsByGene = alterationCountDetailed.alterationCountsByGene?.filter(
            count => map[count.hugoGeneSymbol] !== undefined
        );
    }

    return alterationCountsByGene;
}

function getMolecularProfileCaseIdentifiers(
    filteredCases?: {
        sampleId?: string;
        patientId?: string;
        studyId?: string;
    }[],
    selectedMolecularProfiles?: MolecularProfile[],
    getCaseId: (sampleOrPatient: {
        sampleId?: string;
        patientId?: string;
    }) => string = () => ''
) {
    // use a map to avoid duplicate case id and molecular profile id pairs
    const molecularProfileCaseIdentifierMap: {
        [key: string]: MolecularProfileCaseIdentifier;
    } = {};

    filteredCases?.forEach(sampleOrPatient => {
        selectedMolecularProfiles?.forEach(profile => {
            if (profile.studyId === sampleOrPatient.studyId) {
                const caseId = getCaseId(sampleOrPatient);
                const molecularProfileId = profile.molecularProfileId;
                const key = `${caseId}_${molecularProfileId}`;

                molecularProfileCaseIdentifierMap[key] = {
                    caseId,
                    molecularProfileId,
                };
            }
        });
    });

    return Promise.resolve(_.values(molecularProfileCaseIdentifierMap));
}

function getNotProfiledValidGenes(
    validGenes: Gene[],
    profiledGenes: GenePanelToGene[],
    allGenesProfiled?: boolean
): Gene[] {
    if (allGenesProfiled) {
        return [];
    } else {
        const profiled = _.keyBy(profiledGenes, gene => gene.entrezGeneId);
        return validGenes.filter(gene => !profiled[gene.entrezGeneId]);
    }
}

function getNotAlteredValidGenes(
    validGenes: Gene[],
    notProfiledGenes: Gene[],
    alterationCountsByGene: { [entrezGeneId: number]: AlterationCountByGene }
): Gene[] {
    const notProfiled = _.keyBy(notProfiledGenes, gene => gene.entrezGeneId);
    return validGenes.filter(
        gene =>
            !notProfiled[gene.entrezGeneId] &&
            !alterationCountsByGene[gene.entrezGeneId]
    );
}

export class ResultsViewPathwayMapperStore {
    private readonly accumulatedValidGenes: {
        [hugoGeneSymbol: string]: Gene;
    };

    @observable
    public newGenesFromPathway: string[];

    @observable
    public alterationCountType: 'SAMPLE' | 'PATIENT' = 'PATIENT';

    constructor(private resultsViewPageStore: ResultsViewPageStore) {
        makeObservable(this);
        this.accumulatedValidGenes = {};
    }

    private getSelectedMolecularProfileCaseIdentifiers() {
        return this.alterationCountType === 'PATIENT'
            ? this.selectedMolecularProfileCaseIdentifiersForPatients
            : this.selectedMolecularProfileCaseIdentifiersForSamples;
    }

    readonly alterationCountsByAllGenes = remoteData<AlterationCountDetailed>({
        await: () => [this.getSelectedMolecularProfileCaseIdentifiers()],
        invoke: () => {
            const caseIdentifiers = this.getSelectedMolecularProfileCaseIdentifiers()
                .result;

            return _.isEmpty(caseIdentifiers)
                ? Promise.resolve(emptyAlterationCount())
                : fetchAlterationCounts(
                      caseIdentifiers!,
                      this.alterationCountType
                  );
        },
    });

    readonly selectedMolecularProfileCaseIdentifiersForSamples = remoteData<
        MolecularProfileCaseIdentifier[]
    >({
        await: () => [
            this.resultsViewPageStore.filteredSamples,
            this.resultsViewPageStore.selectedMolecularProfiles,
        ],
        invoke: () =>
            getMolecularProfileCaseIdentifiers(
                this.resultsViewPageStore.filteredSamples.result,
                this.resultsViewPageStore.selectedMolecularProfiles.result,
                (sample: Sample) => sample.sampleId
            ),
    });

    readonly selectedMolecularProfileCaseIdentifiersForPatients = remoteData<
        MolecularProfileCaseIdentifier[]
    >({
        await: () => [
            this.resultsViewPageStore.filteredPatients,
            this.resultsViewPageStore.selectedMolecularProfiles,
        ],
        invoke: () =>
            getMolecularProfileCaseIdentifiers(
                this.resultsViewPageStore.filteredPatients.result,
                this.resultsViewPageStore.selectedMolecularProfiles.result,
                (patient: Patient) => patient.patientId
            ),
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
    readonly validGenes = remoteData<{ [hugoGeneSymbol: string]: Gene }>({
        await: () => [this.validNonQueryGenes],
        invoke: () => {
            // Valid genes are accumulated.
            this.validNonQueryGenes.result?.forEach(gene => {
                this.accumulatedValidGenes[gene.hugoGeneSymbol] = gene;
            });

            return Promise.resolve(this.accumulatedValidGenes);
        },
    });

    readonly notProfiledValidGenes = remoteData<Gene[]>({
        await: () => [this.validGenes, this.alterationCountsByAllGenes],
        invoke: () =>
            Promise.resolve(
                getNotProfiledValidGenes(
                    _.values(this.validGenes.result),
                    this.alterationCountsByAllGenes.result?.profiledGenes || [],
                    this.alterationCountsByAllGenes.result?.allGenesProfiled
                )
            ),
    });

    readonly notAlteredValidGenes = remoteData<Gene[]>({
        await: () => [
            this.validGenes,
            this.notProfiledValidGenes,
            this.alterationCountsByAllGenes,
        ],
        invoke: () =>
            Promise.resolve(
                getNotAlteredValidGenes(
                    _.values(this.validGenes.result),
                    this.notProfiledValidGenes.result || [],
                    this.alterationCountsByEntrezGeneId
                )
            ),
    });

    readonly alterationFrequencyData = remoteData<ICBioData[]>({
        await: () => [
            this.alterationCountsByAllGenes,
            this.notProfiledValidGenes,
            this.notAlteredValidGenes,
        ],
        invoke: () => {
            const alterationCountsByGenes: AlterationCountByGene[] = [];

            if (this.alterationCountsByAllGenes.result) {
                const dataProfiled = getAlterationCountsForProfiledGenes(
                    this.alterationCountsByAllGenes.result
                );
                const dataNotProfiled =
                    (this.notProfiledValidGenes.result || []).map(
                        getNotProfiledAlterationCount
                    ) || [];
                const dataNotAltered =
                    (this.notAlteredValidGenes.result || []).map(gene =>
                        getNotAlteredAlterationCount(
                            gene,
                            this.alterationCountsByAllGenes.result!
                                .profiledCasesCount
                        )
                    ) || [];

                alterationCountsByGenes.push(
                    ...dataProfiled,
                    ...dataNotProfiled,
                    ...dataNotAltered
                );
            }

            return Promise.resolve(
                alterationCountsByGenes.map(getAlterationInfo)
            );
        },
    });

    @computed get validGeneSymbols() {
        return _.keys(this.validGenes.result || {});
    }

    @computed get alterationCountsByEntrezGeneId(): {
        [entrezGeneId: number]: AlterationCountByGene;
    } {
        return _.keyBy(
            this.alterationCountsByAllGenes.result?.alterationCountsByGene,
            c => c.entrezGeneId
        );
    }
}
