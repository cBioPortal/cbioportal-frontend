import {GenesetCorrelation} from "../api/generated/CBioPortalAPIInternal";
import client from "shared/api/cbioportalInternalClientInstance";
import _ from "lodash";
import {IDataQueryFilter} from "../lib/StoreUtils";

interface IQuery {
    genesetId: string;
    molecularProfileId: string;
}

type SampleFilterByProfile = {
    [molecularProfileId: string]: IDataQueryFilter
};

async function fetch(
    {genesetId, molecularProfileId}: IQuery,
    sampleFilterByProfile: SampleFilterByProfile
): Promise<GenesetCorrelation[]> {
    const param = {
        genesetId,
        geneticProfileId: molecularProfileId,
        ...sampleFilterByProfile[molecularProfileId]
    };
    return client.fetchCorrelatedGenesUsingPOST(param);
}

class GenesetCorrelatedGeneIteration {
    private query: IQuery;
    private sampleFilterByProfile: SampleFilterByProfile;
    private nextGeneIndex = 0;
    private data: undefined | GenesetCorrelation[] = undefined;

    constructor(query: IQuery, sampleFilterByProfile: SampleFilterByProfile) {
        this.query = query;
        this.sampleFilterByProfile = sampleFilterByProfile;
    }

    async next(maxNumber: number) {
        if (this.data === undefined) {
            this.data = await fetch(this.query, this.sampleFilterByProfile);
        }
        // select the first 5 genes starting from the index,
        // up to the end of the array
        const nextGenes = this.data.slice(
            this.nextGeneIndex,
            this.nextGeneIndex + maxNumber
        );
        this.nextGeneIndex += nextGenes.length;
        return nextGenes;
    }

    /**
     * Resets the iteration so that next() will start from the beginning.
     */
    reset(): void {
        this.nextGeneIndex = 0;
    }
}

export default class GenesetCorrelatedGeneCache  {

    private sampleFilterByProfile: SampleFilterByProfile;
    private iterations: {
        [iterationKey: string]: GenesetCorrelatedGeneIteration
    } = {};

    constructor(sampleFilterByProfile: SampleFilterByProfile) {
        this.sampleFilterByProfile = sampleFilterByProfile;
    }

    initIteration(iterationKey: string, query: IQuery) {
        if (!Object.prototype.hasOwnProperty.call(this.iterations, iterationKey)) {
            this.iterations[iterationKey] = new GenesetCorrelatedGeneIteration(
                query, this.sampleFilterByProfile
            );
        }
    }

    async next(
        iterationKey: string,
        maxNumber: number
    ): Promise<GenesetCorrelation[]> {
        return this.iterations[iterationKey].next(maxNumber);
    }

    reset(iterationKey: string): void {
        this.iterations[iterationKey].reset();
    }

}
