import {default as SimpleCache, ICache} from "shared/lib/SimpleCache";

export default class PmidCache extends SimpleCache<any, number[]>
{
    constructor()
    {
        super();
    }

    protected async fetch(pmids: number[])
    {
        const cache: ICache<any> = {};

        try {
            const pmidData:any = await new Promise((resolve, reject) => {
                // TODO better to separate this call to a configurable client
                $.post(
                    'https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi?db=pubmed&retmode=json',
                    {id: pmids.join(',')}
                ).then((data) => {
                    resolve(data);
                }).fail((err) => {
                    reject(err);
                });
            });

            pmids.forEach((pmid:number) => {
                if (pmidData.result[pmid]) {
                    cache[pmid.toString()] = {
                        status: "complete",
                        data: pmidData.result[pmid]
                    };
                }
                else {
                    cache[pmid.toString()] = {
                        status: "complete"
                    };
                }
            });

            this.putData(cache);
        }
        catch (err) {
            pmids.forEach((pmid:number) => {
                cache[pmid.toString()] = {
                    status: "error"
                };
            });

            this.putData(cache);
        }
    }
}