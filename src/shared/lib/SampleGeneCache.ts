import LazyMobXCache from "./LazyMobXCache";
export type Query = {studyId:string, sampleId:string, entrezGeneId:number};

export default class SampleGeneCache<T extends {sampleId:string, entrezGeneId:number}> extends LazyMobXCache<T,Query> {
    constructor(fetch:(queries:Query[], ...staticDependencies:any[])=>Promise<T[]>,
                ...staticDependencies:any[]) {
        super(q=>q.sampleId+","+q.entrezGeneId,
            d=>d.sampleId+","+d.entrezGeneId,
            fetch,
            ...staticDependencies);
    }
}