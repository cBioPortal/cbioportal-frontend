import { remoteData } from 'cbioportal-frontend-commons';
import { VariantAnnotation } from 'genome-nexus-ts-api-client';
import _ from 'lodash';
import { computed, observable } from 'mobx';
import MobxPromise from 'mobxpromise';
import { CuratedGene, IndicatorQueryResp } from 'oncokb-ts-api-client';
import {
    DataFilterType,
    initDefaultMutationMapperStore,
} from 'react-mutation-mapper';
import { getTranscriptConsequenceSummary } from '../util/AnnotationSummaryUtil';
import {
    genomeNexusDomain,
    getGenomeNexusClient,
    getOncokbClient,
} from '../util/ApiClientUtils';
import { ANNOTATION_QUERY_FIELDS } from '../util/Constants';
import { variantToMutation } from '../util/VariantUtil';

export interface IVariantStoreConfig {
    variant: string;
}
export class VariantStore {
    public query: any;
    public genomeNexusClient = getGenomeNexusClient();
    public oncokbClient = getOncokbClient();

    @observable public variant: string = '';
    @observable public selectedTranscript: string = '';

    public readonly annotation = remoteData<VariantAnnotation>({
        invoke: async () => {
            return await this.genomeNexusClient.fetchVariantAnnotationGET({
                variant: this.variant,
                fields: ANNOTATION_QUERY_FIELDS,
            });
        },
        onError: (err: Error) => {},
    });

    public readonly oncokbData: MobxPromise<IndicatorQueryResp> = remoteData({
        invoke: async () => {
            return await this.oncokbClient.annotateMutationsByHGVSgGetUsingGET_1(
                {
                    hgvsg: this.variant,
                }
            );
        },
        onError: () => {},
    });

    public readonly oncokbGenes = remoteData<CuratedGene[]>({
        await: () => [],
        invoke: async () => {
            return this.oncokbClient.utilsAllCuratedGenesGetUsingGET_1({});
        },
        default: [],
    });

    public readonly oncokbGenesMap = remoteData<{
        [hugoSymbol: string]: CuratedGene;
    }>({
        await: () => [this.oncokbGenes],
        invoke: async () => {
            return Promise.resolve(
                _.keyBy(this.oncokbGenes.result, gene => gene.hugoSymbol)
            );
        },
        default: {},
    });

    public readonly isAnnotatedSuccessfully = remoteData<boolean>({
        await: () => [this.annotation],
        invoke: () => {
            // TODO use successfully_annotated instead of checking genomicLocation
            return Promise.resolve(
                this.annotation.result &&
                    this.annotation.result.annotation_summary.genomicLocation
                        .chromosome &&
                    this.annotation.result.annotation_summary.genomicLocation
                        .start &&
                    this.annotation.result.annotation_summary.genomicLocation
                        .end &&
                    this.annotation.result.annotation_summary.genomicLocation
                        .referenceAllele &&
                    this.annotation.result.annotation_summary.genomicLocation
                        .variantAllele
                    ? true
                    : false
            );
        },
    });

    @computed
    get getMutationMapperStore() {
        const mutation = variantToMutation(this.annotationSummary);
        if (
            mutation[0] &&
            mutation[0].gene &&
            mutation[0].gene.hugoGeneSymbol.length !== 0
        ) {
            const store = initDefaultMutationMapperStore({
                genomeNexusUrl: genomeNexusDomain,
                data: mutation,
                hugoSymbol: getTranscriptConsequenceSummary(
                    this.annotationSummary
                ).hugoGeneSymbol,
                oncoKbUrl: 'https://www.cbioportal.org/proxy/oncokb',
                // select the lollipop by default
                selectionFilters: [
                    {
                        type: DataFilterType.POSITION,
                        values: [mutation[0].proteinPosStart],
                    },
                ],
            });
            return store;
        }
        return undefined;
    }

    constructor(public variantId: string, public queryString: string) {
        this.variant = variantId;
    }

    @computed
    get annotationSummary() {
        return this.annotation.result
            ? this.annotation.result.annotation_summary
            : undefined;
    }
}
