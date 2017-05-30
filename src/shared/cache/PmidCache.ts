import LazyMobXCache from "../lib/LazyMobXCache";
import {AugmentedData} from "../lib/LazyMobXCache";
import request from "superagent";

async function fetch(pmids: number[])
{
        const pmidData:any = await new Promise((resolve, reject) => {
            // TODO better to separate this call to a configurable client
            request.post('https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi?db=pubmed&retmode=json')
                .type("form")
                .send({id: pmids.join(',')})
                .end((err, res)=>{
                    if (!err && res.ok) {
                        resolve(JSON.parse(res.text));
                    } else {
                        reject(err);
                    }
                });
        });

        const ret:AugmentedData<any, string>[] = [];
        for (const pmidStr of Object.keys(pmidData)) {
            ret.push({
                data: pmidData[pmidStr],
                meta: pmidStr
            });
        }

        return ret;
}

export default class PmidCache extends LazyMobXCache<number, any, string>
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