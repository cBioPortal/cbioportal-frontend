import {assert} from "chai";
import ResultsViewURLWrapper from "pages/resultsView/ResultsViewURLWrapper";
import {autorun, observable, reaction} from "mobx";
import ExtendedRouterStore from "shared/lib/ExtendedRouterStore";
import sinon from "sinon";
import {createMemoryHistory} from "react-router";
import {syncHistoryWithStore} from "mobx-react-router";
import memoize from "memoize-weak-decorator";

describe("URLWrapper", () => {

    let routingStore: ExtendedRouterStore;

    let wrapper: ResultsViewURLWrapper;

    beforeEach(() => {
        routingStore = new ExtendedRouterStore();
        const memoryHistory = createMemoryHistory();
        const history = syncHistoryWithStore(memoryHistory, routingStore);
        wrapper = new ResultsViewURLWrapper(routingStore);
        routingStore.updateRoute({}, "/results");
    });

    it("reacts to change in underling router store", () => {

        routingStore.updateRoute({clinicallist: "monkeys"}, "/results");

        const wrapper = new ResultsViewURLWrapper(routingStore);

        assert.equal(wrapper.query.clinicallist, "monkeys", "handles undefined properties");
        routingStore.updateRoute({clinicallist: "donkeys"});
        assert.equal(wrapper.query.clinicallist, "donkeys", "handles undefined properties");


    });


    it("resolves properties aliases correctly", () => {

        routingStore.updateRoute({cancer_study_id: "some_study_id", non_property: "foo"});

        assert.equal(wrapper.query.cancer_study_list, "some_study_id", "alias resolves to correct param");

        assert.notProperty(wrapper.query, "cancer_study_id");

    });

    it("resolves properties correctly", () => {
        routingStore.updateRoute({case_ids: "bar", non_property: "foo"});
        assert.notProperty(wrapper.query, "non_property");
        assert.equal(wrapper.query.case_ids, "bar");
    });

    it("reacts to underlying routing store according to rules", () => {
        routingStore.updateRoute({case_ids: "bar", non_property: "foo"});

        const stub = sinon.stub();

        const disposer = reaction(() => wrapper.query.case_ids, stub);

        assert.equal(stub.args.length, 0, "stub hasn't been called");

        routingStore.updateRoute({case_ids: "bar2", non_property: "foo"});

        assert.equal(stub.args.length, 1, "stub has been called due to update to property");

        routingStore.updateRoute({case_ids: "bar2", non_property: "foo"});

        assert.equal(stub.args.length, 1, "setting property to existing value does not cause reaction");

        routingStore.updateRoute({cancer_study_list: "study1"});

        assert.equal(
            stub.args.length,
            1,
            "setting query property which is not referenced in reaction does not cause reaction"
        );

        routingStore.updateRoute({case_ids: "bar3", non_property: "foo"});

        assert.equal(stub.args.length, 2, "setting property to knew value DOES cause reaction");

        routingStore.updateRoute({case_ids: "bar4", non_property: "foo"}, "/patient");

        assert.equal(stub.args.length, 2, "does not react when pathname doesn't match");

        disposer();
    });

    it('hash composed only of session props', () => {

        routingStore.updateRoute({case_ids: "bar", non_property: "foo"});
        const beforeChange = wrapper.hash;

        routingStore.updateRoute({clinicallist: "1,2,3"});
        assert.equal(wrapper.hash, beforeChange, "hash doesn't change if we mutate non session prop");

        routingStore.updateRoute({case_ids: "blah", non_property: "foo"});
        assert.notEqual(wrapper.hash, beforeChange, "hash changes if we mutate session prop");

    });

    it("sets and reads from internal session appropriately", (done) => {

        const stub = sinon.stub(wrapper, "saveRemoteSession");

        stub.callsFake(function (sessionData) {
            return new Promise((resolve) => {
                setTimeout(() => {
                    return resolve({id: "someSessionId"});
                }, 5);
            });
        });

        wrapper.sessionEnabled = true;

        wrapper.urlCharThresholdForSession = 0;

        wrapper.updateURL({clinicallist: "one,two,three", case_ids: "1231"});

        assert(stub.calledOnce, "save session method is called");

        assert.equal(wrapper.sessionId, "pending", "pending session state");

        assert.equal(wrapper.query.clinicallist, "one,two,three", "non session is present in query");

        assert.equal(routingStore.location.query.clinicallist, "one,two,three", "non session params present in url");

        assert.isNotTrue("clinicallist" in wrapper._sessionData!.query, "non session params NOT present in internal session store");

        assert.isUndefined(routingStore.location.query.case_ids, "session params NOT in url");

        assert.equal(wrapper.query.case_ids, "1231", "we have access to session prop on query");

        setTimeout(() => {
            assert.equal(wrapper._sessionId, "someSessionId");
            done();
        }, 10);

    });


    it("respects sessionEnabled flag and thresholds", () => {

        const stub = sinon.stub(wrapper, "saveRemoteSession");

        wrapper.sessionEnabled = false;

        wrapper.urlCharThresholdForSession = 0;

        wrapper.updateURL({clinicallist: "one,two,three", case_ids: "1231"});

        assert.isFalse(stub.called, "does not call create session");

        assert.isFalse(wrapper.hasSessionId, "does not have session id");

        assert.equal(routingStore.location.query.case_ids, "1231", "puts session prop in url");

        assert.equal(wrapper.query.case_ids, "1231", "obtains session prop from url");

    });


    it("fetches remote session as necessary", (done) => {

        const stub = sinon.stub(wrapper, "getRemoteSession");

        stub.callsFake(function (sessionData) {
            return new Promise((resolve) => {
                setTimeout(() => {
                    return resolve({
                                       "id": "5dcae586e4b04a9c23e27e5f",
                                       "data": {
                                           "genetic_profile_ids_PROFILE_COPY_NUMBER_ALTERATION": "msk_impact_2017_cna",
                                           "Z_SCORE_THRESHOLD": "2.0",
                                           "gene_list": "CDKN2A%20MDM2%20MDM4%20TP53",
                                           "case_set_id": "msk_impact_2017_cnaseq",
                                           "RPPA_SCORE_THRESHOLD": "2.0",
                                           "cancer_study_list": "msk_impact_2017",
                                           "geneset_list": " ",
                                           "genetic_profile_ids_PROFILE_MUTATION_EXTENDED": "msk_impact_2017_mutations"
                                       },
                                       "source": "public_portal",
                                       "type": "main_session"
                                   });
                }, 5);
            });
        });

        wrapper.sessionEnabled = true;

        // // must establish an observer in order for remoteData to invoke
        const disposer = autorun(() => {
            wrapper.isLoadingSession;
        });

        routingStore.updateRoute({session_id: "5dcae586e4b04a9c23e27e5f"});

        assert.isTrue(wrapper.isLoadingSession, "it is loading session");
        assert.isFalse(wrapper.isPendingSession, "it is NOT pending session");

        setTimeout(() => {
            assert.isTrue(stub.calledOnce);

            assert.isTrue(stub.calledOnce);

            assert.equal(wrapper.query.gene_list, "CDKN2A MDM2 MDM4 TP53", "sets session props on query after session load");

            done();

        }, 1000);

    });



    it("creates new session when session param is changed", (done) => {

        const stub = sinon.stub(wrapper, "getRemoteSession");

        stub.callsFake(function (sessionData) {
            return new Promise((resolve) => {
                setTimeout(() => {
                    return resolve({
                                       "id": "5dcae586e4b04a9c23e27e5f",
                                       "data": {
                                           "genetic_profile_ids_PROFILE_COPY_NUMBER_ALTERATION": "msk_impact_2017_cna",
                                           "Z_SCORE_THRESHOLD": "2.0",
                                           "gene_list": "CDKN2A%20MDM2%20MDM4%20TP53",
                                           "case_set_id": "msk_impact_2017_cnaseq",
                                           "RPPA_SCORE_THRESHOLD": "2.0",
                                           "cancer_study_list": "msk_impact_2017",
                                           "geneset_list": " ",
                                           "genetic_profile_ids_PROFILE_MUTATION_EXTENDED": "msk_impact_2017_mutations"
                                       },
                                       "source": "public_portal",
                                       "type": "main_session"
                                   });
                }, 5);
            });
        });

        wrapper.sessionEnabled = true;

        // // must establish an observer in order for remoteData to invoke
        const disposer = autorun(() => {
            wrapper.isLoadingSession;
        });

        // set first session for loading
        routingStore.updateRoute({session_id: "5dcae586e4b04a9c23e27e5f"});

        setTimeout(() => {
            assert.isTrue(stub.calledOnce);

            wrapper.updateURL({ gene_list:"EGFR TP53" });

            assert.isTrue(wrapper.isPendingSession);
            assert.isTrue(wrapper.isLoadingSession);

            assert.equal(wrapper.query.gene_list,"EGFR TP53", "sets query params for new session immediately");

            assert.isTrue(stub.calledTwice);

            setTimeout(()=>{
                assert.isTrue(wrapper.sessionId)
            },50)

        }, 50);

        done();

    });

    it('does what it should',()=>{

        wrapper.updateURL({
           case_ids:"12345",
           "clinicallist": "6789"
        });
        assert.equal(wrapper.query.case_ids,"12345");
        assert.equal(routingStore.location.query.case_ids,"12345");

        wrapper.updateURL({}, undefined, true);

        assert.isUndefined(routingStore.location.query.case_ids);

        assert.isFalse("case_ids" in routingStore.location.query);

        assert.isUndefined(wrapper.query.case_ids, "removes existing params on clear");


    });


    it('Populates wrapper query according to alias rules ON instantiation (fire immediately on reaction)', ()=>{

        routingStore = new ExtendedRouterStore();

        const memoryHistory = createMemoryHistory();
        const history = syncHistoryWithStore(memoryHistory, routingStore);

        routingStore.updateRoute({ gene_list:"12345", cancer_study_id:"789" });

        wrapper = new ResultsViewURLWrapper(routingStore);

        assert.equal(wrapper.query.gene_list, "12345");
        assert.equal(wrapper.query.cancer_study_list, "789");

    });

});





