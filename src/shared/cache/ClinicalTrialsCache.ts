import request from 'superagent';
import { ITrial } from '../model/ClinicalTrial';
import { AugmentedData, default as LazyMobXCache } from '../lib/LazyMobXCache';

export type TrialsRecords = {
    [cancerType: string]: ITrial[];
};

function key(query: string) {
    return query;
}

async function fetch(
    queries: string[]
): Promise<AugmentedData<ITrial[], string>[]> {
    const trialsRecords = await new Promise<TrialsRecords>(
        (resolve, reject) => {
            const url = 'https://test.oncokb.org/trials/cancerTypes';
            request
                .post(url)
                .set('Content-Type', 'application/json')
                .send({ cancerTypes: queries })
                .end((err, res) => {
                    if (!err && res.ok) {
                        const response = JSON.parse(res.text);
                        const ret: TrialsRecords = response;
                        resolve(ret);
                    } else {
                        reject(err);
                    }
                });
        }
    );

    const ret: AugmentedData<ITrial[], string>[] = [];
    for (const cancerType of Object.keys(trialsRecords)) {
        ret.push({
            data: [trialsRecords[cancerType]],
            meta: cancerType,
        });
    }

    return ret;
}

export default class ClinicalTrialsCache extends LazyMobXCache<
    ITrial[],
    string,
    string
> {
    constructor() {
        super(key, (d: ITrial[], query: string) => query, fetch);
    }
}
