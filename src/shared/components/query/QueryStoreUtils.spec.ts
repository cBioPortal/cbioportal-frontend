import { assert } from 'chai';
import {QueryStore, normalizeQuery} from "./QueryStore";
import {nonMolecularProfileParams, profileAvailability} from "./QueryStoreUtils";
import {AlterationTypeConstants} from "../../../pages/resultsView/ResultsViewPageStore";
import {MolecularProfile} from "../../api/generated/CBioPortalAPI";
import Sinon from 'sinon';

describe('QueryStoreUtils', ()=>{
    describe('nonMolecularProfileParams', ()=>{

        let addParamStub: any;
        let selectableStudiesSetStub:any;

        before(()=>{
            addParamStub = Sinon.stub(QueryStore.prototype, "addParamsFromWindow");
        });

        after(()=>{
            addParamStub.restore();
            if (selectableStudiesSetStub) {
                selectableStudiesSetStub.restore();
            }
        });

        it("returns url-encoded, normalized query for gene_list parameter", ()=>{


            let store = new QueryStore({} as Window);

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
                assert.equal(nonMolecularProfileParams(store).gene_list, encodeURIComponent(normalizeQuery(query)), `got encoded, normalized query for query ${query}`);
            }
        });

        it("correctly sets study parameters in case of single study", ()=>{
            let store = new QueryStore({} as Window);
            selectableStudiesSetStub = Sinon.stub(store, "selectableStudiesSet").get(() => {
                return {"a":["a"], "b":["b"]};
            });
            store.selectableSelectedStudyIds = ["a"];
            assert.equal(nonMolecularProfileParams(store).cancer_study_id, "a");
            assert.equal(nonMolecularProfileParams(store).cancer_study_list, undefined);
        });
    });
    describe("profileAvailability", ()=>{
        it("returns correct profile availability result in case of zero profiles", ()=>{
            assert.deepEqual(profileAvailability([]), {mutation:false, cna:false});
        });
        it("returns correct profile availability result in case of one profile", ()=>{
            let profiles = [{
                molecularAlterationType: AlterationTypeConstants.MUTATION_EXTENDED,
                showProfileInAnalysisTab: true
            }] as MolecularProfile[];
            assert.deepEqual(profileAvailability(profiles), {mutation:true, cna:false});

            profiles = [{
                molecularAlterationType: AlterationTypeConstants.MUTATION_EXTENDED,
                showProfileInAnalysisTab: false
            }] as MolecularProfile[];
            assert.deepEqual(profileAvailability(profiles), {mutation:false, cna:false});

            profiles = [{
                molecularAlterationType: AlterationTypeConstants.COPY_NUMBER_ALTERATION,
                showProfileInAnalysisTab: true
            }] as MolecularProfile[];
            assert.deepEqual(profileAvailability(profiles), {mutation:false, cna:true});

            profiles = [{
                molecularAlterationType: AlterationTypeConstants.COPY_NUMBER_ALTERATION,
                showProfileInAnalysisTab: false
            }] as MolecularProfile[];
            assert.deepEqual(profileAvailability(profiles), {mutation:false, cna:false});
        });
        it("returns correct profile availability result in case of two profiles", ()=>{
            let profiles = [{
                molecularAlterationType: AlterationTypeConstants.MUTATION_EXTENDED,
                showProfileInAnalysisTab: true
            },{
                molecularAlterationType: AlterationTypeConstants.COPY_NUMBER_ALTERATION,
                showProfileInAnalysisTab: true
            }] as MolecularProfile[];
            assert.deepEqual(profileAvailability(profiles), {mutation:true, cna:true});

            profiles = [{
                molecularAlterationType: AlterationTypeConstants.MUTATION_EXTENDED,
                showProfileInAnalysisTab: false
            },{
                molecularAlterationType: AlterationTypeConstants.COPY_NUMBER_ALTERATION,
                showProfileInAnalysisTab: true
            }] as MolecularProfile[];
            assert.deepEqual(profileAvailability(profiles), {mutation:false, cna:true});

            profiles = [{
                molecularAlterationType: AlterationTypeConstants.MUTATION_EXTENDED,
                showProfileInAnalysisTab: true
            },{
                molecularAlterationType: AlterationTypeConstants.COPY_NUMBER_ALTERATION,
                showProfileInAnalysisTab: false
            }] as MolecularProfile[];
            assert.deepEqual(profileAvailability(profiles), {mutation:true, cna:false});

            profiles = [{
                molecularAlterationType: AlterationTypeConstants.MUTATION_EXTENDED,
                showProfileInAnalysisTab: false
            },{
                molecularAlterationType: AlterationTypeConstants.COPY_NUMBER_ALTERATION,
                showProfileInAnalysisTab: false
            }] as MolecularProfile[];
            assert.deepEqual(profileAvailability(profiles), {mutation:false, cna:false});
        });
        it("returns correct profile availability result in case of several profiles", ()=>{
            let profiles = [{
                molecularAlterationType: AlterationTypeConstants.MUTATION_EXTENDED,
                showProfileInAnalysisTab: true
            },{
                molecularAlterationType: AlterationTypeConstants.MUTATION_EXTENDED,
                showProfileInAnalysisTab: false
            },{
                molecularAlterationType: AlterationTypeConstants.COPY_NUMBER_ALTERATION,
                showProfileInAnalysisTab: false
            }] as MolecularProfile[];
            assert.deepEqual(profileAvailability(profiles), {mutation:true, cna:false});
        });
    });
});
