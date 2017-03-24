import SampleGeneCache from "./SampleGeneCache";
import {CopyNumberCount, CopyNumberCountIdentifier} from "../../../shared/api/generated/CBioPortalAPIInternal";
import {SampleToEntrezList} from "./SampleGeneCache";
import internalClient from "../../../shared/api/cbioportalInternalClientInstance";
import {CacheData} from "./SampleGeneCache";

export type EntrezToAlterationList = SampleToEntrezList;
export default class CopyNumberCountCache extends SampleGeneCache<CopyNumberCount> {

    constructor(sampleIds:string[], geneticProfileIdDiscrete:string|undefined) {
        super(sampleIds, (d:CopyNumberCount)=>[d.entrezGeneId+"", d.alteration], geneticProfileIdDiscrete);
    }

    public async populate(entrezToAlterationList:EntrezToAlterationList) {
        return super.populate(entrezToAlterationList);
    }

    public get(entrezGeneId:number, alteration:number):CacheData<CopyNumberCount> | null {
        return this.getData(entrezGeneId+"", alteration);
    }

    protected async fetch(entrezToAlterationList:EntrezToAlterationList, geneticProfileIdDiscrete:string|undefined):Promise<CopyNumberCount[]> {
        if (!geneticProfileIdDiscrete) {
            throw "No genetic profile id given.";
        } else {
            try {
                const copyNumberCountIdentifiers:CopyNumberCountIdentifier[] = [];
                for (const entrez of Object.keys(entrezToAlterationList)) {
                    const alterations = entrezToAlterationList[entrez];
                    for (const alteration of alterations) {
                        copyNumberCountIdentifiers.push({
                            entrezGeneId: parseInt(entrez, 10),
                            alteration
                        });
                    }
                }
                return await internalClient.fetchCopyNumberCountsUsingPOST({
                    geneticProfileId: geneticProfileIdDiscrete,
                    copyNumberCountIdentifiers
                });
            } catch (err) {
                throw err
            }
        }
    }
}