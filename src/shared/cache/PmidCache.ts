import LazyMobXCache from "../lib/LazyMobXCache";
import {AugmentedData} from "../lib/LazyMobXCache";
import request from "superagent";

export type PmidData = {
        [pmid:string]:PmidDatum;
};

export type PmidDatum = {
    uid: string,
    pubdate: string,
    epubdate: string,
    source: string,
    authors: { name: string, authtype: string, clusterid: string}[],
    lastauthor: string,
    title: string,
    sorttitle: string,
    volume: string,
    issue: string,
    pages: string,
    lang: string[],
    nlmuniqueid: string,
    issn: string,
    essn: string,
    pubtype: string,
    recordstatus: string,
    pubstatus:string,
    articleids: { idtype: string, idtypen: number, value: string}[],
    history: { pubstatus:string, date:string }[],
    references: { refsource: string, reftype: string, pmid: number, note: string }[],
    attributes: string[],
    pmcrefcount: number,
    fulljournalname: string,
    elocationid: string,
    doctype: string,
    srccontriblist:any[],
    booktitle: string,
    medium: string,
    edition: string,
    publisherlocation: string,
    publishername: string,
    srcdate: string,
    reportnumber: string,
    availablefromurl:string,
    locationlabel: string,
    doccontriblist:any[],
    docdate: string,
    bookname: string,
    chapter: string,
    sortpubdate: string,
    sortfirstauthor: string,
    vernaculartitle:string
};

async function fetch(pmids: number[]):Promise<AugmentedData<PmidDatum, string>[]>
{
        const pmidData:PmidData = await new Promise<PmidData>((resolve, reject) => {
            // TODO better to separate this call to a configurable client
            request.post('https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi?db=pubmed&retmode=json')
                .type("form")
                .send({id: pmids.join(',')})
                .end((err, res)=>{
                    if (!err && res.ok) {
                        const response = JSON.parse(res.text);
                        const result = response.result;
                        const uids = result.uids;
                        const ret:PmidData = {};
                        for (let uid of uids) {
                            ret[uid] = result[uid];
                        }
                        resolve(ret);
                    } else {
                        reject(err);
                    }
                });
        });

        const ret:AugmentedData<PmidDatum, string>[] = [];
        for (const pmidStr of Object.keys(pmidData)) {
            ret.push({
                data: [pmidData[pmidStr]],
                meta: pmidStr
            });
        }

        return ret;
}

export default class PmidCache extends LazyMobXCache<PmidDatum, number, string>
{
    constructor()
    {
        super(
            q=>q+"",
            (d:any, pmidStr:string)=>pmidStr,
            fetch
        );
    }
}