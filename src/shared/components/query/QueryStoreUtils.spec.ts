import { assert } from 'chai';
import {QueryStore, normalizeQuery} from "./QueryStore";
import {nonMolecularProfileParams} from "./QueryStoreUtils";
import Sinon from 'sinon';

describe('QueryStoreUtils', ()=>{
    describe('nonMolecularProfileParams', ()=>{

        let addParamStub: any

        before(()=>{
            addParamStub = Sinon.stub(QueryStore.prototype, "addParamsFromWindow");
        });

        after(()=>{
            addParamStub.restore();
        });

        it("returns normalized query for gene_list parameter", ()=>{


            let store = new QueryStore();

            let queries = [
                "TP53:MUT",
                "tp53:mut",
                "TP53:mut",
                "TP53:exp>0",
                "PIM2: exp > 0",
                "TP53: EXP<=0",
                "TP53: MUT; PTEN:amp"
            ];
            for (let query of queries) {
                store.geneQuery = query;
                assert.equal(nonMolecularProfileParams(store).gene_list, normalizeQuery(query), `got normalized query for query ${query}`);
            }
        });
    });
});