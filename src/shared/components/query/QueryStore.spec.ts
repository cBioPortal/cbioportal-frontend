import {assert, expect} from "chai";
import {QueryStore, CUSTOM_CASE_LIST_ID} from "./QueryStore";
import { VirtualStudy, VirtualStudyData } from "shared/model/VirtualStudy";
import Sinon from 'sinon';
import sessionServiceClient from "shared/api//sessionServiceInstance";
import client from "../../api/cbioportalClientInstance";
import * as _ from 'lodash';

describe("QueryStore", ()=>{

    describe("initialQueryParams on results page", ()=>{
        it("should contain the correct case_ids parameter in single study query", ()=>{
            const store = new QueryStore({
                serverVars: {
                    theQuery:"",
                    genesetIds: "",
                    caseSetProperties:{
                        case_set_id: CUSTOM_CASE_LIST_ID
                    },
                    caseIds: "study1:sample1+study1:sample2+study1:sample3"
                }
            } as any);
            assert.equal(
                store.initialQueryParams.nonMolecularProfileParams.case_ids,
                "study1:sample1+study1:sample2+study1:sample3"
            );
        });
        it("should contain the correct case_ids parameter in multiple study query", ()=>{
            const store = new QueryStore(
                {
                    serverVars: {
                        theQuery:"",
                        genesetIds: "",
                        caseSetProperties:{
                            case_set_id: CUSTOM_CASE_LIST_ID
                        },
                        caseIds:"study1:sample1+study1:sample2+study1:sample3+study2:sample4+study2:sample5+study2:sample6"
                    }
                } as any
            );
            assert.equal(
                store.initialQueryParams.nonMolecularProfileParams.case_ids,
                "study1:sample1+study1:sample2+study1:sample3+study2:sample4+study2:sample5+study2:sample6"
            );
        });
    });
    describe.skip('Virtual Studies section on query page', () => {
        let store_vs:QueryStore;
        const virtualStudies: VirtualStudy[] = [
            {
            "id": "study1",
            "data": {
                "name": "Test Study",
                "description": "Test Study",
                "studies": [
                {
                    "id": "test_study",
                    "samples": [
                    "sample-01",
                    "sample-02",
                    "sample-03"
                    ]
                }
                ],
                "filters": {
                "patients": {},
                "samples": {}
                },
                "origin": [
                "test_study"
                ]
            } as VirtualStudyData
            }
        ];
        let getUserVirtualStudiesStub: sinon.SinonStub
        let deleteVirtualStudyStub: sinon.SinonStub
        let addVirtualStudyStub: sinon.SinonStub

        before(()=>{
            getUserVirtualStudiesStub = Sinon.stub(sessionServiceClient, "getUserVirtualStudies").callsFake(function fakeFn() {
                return new Promise((resolve, reject) => {
                    resolve(virtualStudies);
                });
            });
            deleteVirtualStudyStub = Sinon.stub(sessionServiceClient, "deleteVirtualStudy").callsFake(function fakeFn(id:string) {
                return new Promise((resolve, reject) => {
                    resolve();
                });
            });
            addVirtualStudyStub = Sinon.stub(sessionServiceClient, "addVirtualStudy").callsFake(function fakeFn(id:string) {
                return new Promise((resolve, reject) => {
                    resolve();
                });
            });

            store_vs = new QueryStore({} as Window);

        });

        after(()=>{
            getUserVirtualStudiesStub.restore();
            deleteVirtualStudyStub.restore();
            addVirtualStudyStub.restore();
        });

        it('should show all user virtual studies', ()=>{
            assert.isTrue(getUserVirtualStudiesStub.calledOnce)
        });
        it('should be able to delete a virtual study', ()=>{
            store_vs.deleteVirtualStudy("study1")
            assert.isTrue(deleteVirtualStudyStub.calledOnce)
            // setTimeout(()=>{
            //     assert.equal(JSON.stringify(store_vs.deletedVirtualStudies),'["study1"]')
            //     done()
            // },1000)  
        });
        it('should be able to restore back deleted virtual study', ()=>{
            store_vs.restoreVirtualStudy("study1")
            assert.isTrue(addVirtualStudyStub.calledOnce)
            // setTimeout(()=>{
            //     assert.equal(JSON.stringify(store_vs.deletedVirtualStudies),'[]')
            //     done()
            // },1000)  
        });
    });

    describe("Multiple studies selected", ()=>{
        let selectableStudiesSetStub:any;

        before(() => {
            selectableStudiesSetStub = Sinon.stub(QueryStore.prototype,"selectableStudiesSet").get(()=>{
                return {study1:['study1'],study2:['study2']};
            });
        });

        it("should show an error when both mutation and cna datatype checkboxes are unchecked", ()=>{
            const store = new QueryStore(
                {
                    cohortIdsList:["study1","study2"]
                } as any
            );
            store.dataTypePriority = {mutation:false,cna:false};
            assert.equal(store.submitError,"Please select one or more molecular profiles.");
            store.dataTypePriority = {mutation:true,cna:false};
            assert.notEqual(store.submitError,"Please select one or more molecular profiles.");
        });

        after(()=>{
            selectableStudiesSetStub.restore();
        });
    });
});
