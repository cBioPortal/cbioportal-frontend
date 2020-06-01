import { action, observable } from 'mobx';
import request from 'superagent';

import { CacheData, MobxCache } from '../model/MobxCache';

export class DefaultPubMedCache implements MobxCache<any, string> {
    protected _cache = observable.shallowMap<CacheData>();

    public async fetch(query: string) {
        const pubMedRecords = await new Promise<any>((resolve, reject) => {
            // TODO duplicate code from cbioportal-frontend
            request
                .post(
                    'https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi?db=pubmed&retmode=json'
                )
                .type('form')
                .send({ id: query })
                .end((err, res) => {
                    if (!err && res.ok) {
                        const response = JSON.parse(res.text);
                        const result = response.result;
                        const uids = result.uids;
                        const ret: any = {};
                        for (let uid of uids) {
                            ret[uid] = result[uid];
                        }
                        resolve(ret);
                    } else {
                        reject(err);
                    }
                });
        });

        return pubMedRecords[query];
    }

    @action
    public get(query: string) {
        if (!this._cache.get(query)) {
            this._cache.set(query, { status: 'pending' });

            this.fetch(query)
                .then(d =>
                    this._cache.set(query, { status: 'complete', data: d })
                )
                .catch(() => this._cache.set(query, { status: 'error' }));
        }

        const data = this._cache.get(query);

        return data ? data : null;
    }

    public get cache() {
        // TODO "as any" is not ideal
        return this._cache as any;
    }
}
