import { action, makeObservable, observable } from 'mobx';
import { remoteData } from 'cbioportal-frontend-commons';
import {
    Gene,
    MolecularDataFilter,
    MolecularProfile,
    NumericGeneMolecularData,
    Sample,
} from 'cbioportal-ts-api-client';
import { getClient } from '../../../shared/api/cbioportalClientInstance';
import { AlterationTypeConstants } from 'shared/constants';
// Imported for its type only (used as a constructor-param annotation, which is
// erased at runtime) so this does not create a runtime import cycle.
import { PatientViewPageStore } from './PatientViewPageStore';

export const MRNA_TAB_GENES = ['TP53', 'EGFR', 'KRAS'];

// Holds state/data for the patient view plots (currently the mRNA tab).
// Kept out of PatientViewPageStore; references the parent store for shared
// context (studyId, molecular profiles).
export class PatientViewPlotsStore {
    constructor(private parentStore: PatientViewPageStore) {
        makeObservable(this);
    }

    // Genes selected in the mRNA tab gene chooser (drives the chart).
    @observable.ref mrnaTabGeneSymbols: string[] = MRNA_TAB_GENES;

    @action.bound
    setMrnaTabGeneSymbols(symbols: string[]) {
        this.mrnaTabGeneSymbols = symbols;
    }

    // All samples in the study the current patient belongs to.
    readonly allSamplesInStudy = remoteData<Sample[]>(
        {
            invoke: () =>
                getClient().getAllSamplesInStudyUsingGET({
                    studyId: this.parentStore.studyId,
                }),
        },
        []
    );

    // First mRNA expression molecular profile in the study.
    readonly mrnaExpressionMolecularProfile = remoteData<
        MolecularProfile | undefined
    >({
        await: () => [this.parentStore.molecularProfilesInStudy],
        invoke: async () =>
            this.parentStore.molecularProfilesInStudy.result!.find(
                p =>
                    p.molecularAlterationType ===
                    AlterationTypeConstants.MRNA_EXPRESSION
            ),
    });

    // Full gene list for the mRNA tab gene chooser options.
    readonly mrnaTabAllGenes = remoteData<Gene[]>(
        {
            invoke: () =>
                getClient().getAllGenesUsingGET({ projection: 'SUMMARY' }),
        },
        []
    );

    // Resolve the selected gene symbols to Gene objects (for entrez ids).
    readonly mrnaTabGenes = remoteData<Gene[]>(
        {
            invoke: () => {
                const symbols = this.mrnaTabGeneSymbols;
                if (symbols.length === 0) {
                    return Promise.resolve([]);
                }
                return getClient().fetchGenesUsingPOST({
                    geneIdType: 'HUGO_GENE_SYMBOL',
                    geneIds: symbols.map(g => g.toUpperCase()),
                });
            },
        },
        []
    );

    // mRNA expression data for the selected genes across all samples in study.
    readonly mrnaExpressionDataForGenes = remoteData<
        NumericGeneMolecularData[]
    >(
        {
            await: () => [
                this.mrnaExpressionMolecularProfile,
                this.allSamplesInStudy,
                this.mrnaTabGenes,
            ],
            invoke: async () => {
                const profile = this.mrnaExpressionMolecularProfile.result;
                if (!profile) {
                    return [];
                }
                return getClient().fetchAllMolecularDataInMolecularProfileUsingPOST(
                    {
                        molecularProfileId: profile.molecularProfileId,
                        molecularDataFilter: {
                            entrezGeneIds: this.mrnaTabGenes.result!.map(
                                g => g.entrezGeneId
                            ),
                            sampleIds: this.allSamplesInStudy.result!.map(
                                s => s.sampleId
                            ),
                        } as MolecularDataFilter,
                    }
                );
            },
        },
        []
    );
}
