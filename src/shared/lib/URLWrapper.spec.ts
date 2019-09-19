import { assert } from "chai";
import ResultsViewURLWrapper from "pages/resultsView/ResultsViewURLWrapper";
import { autorun, observable, reaction } from "mobx";
import ExtendedRouterStore from "shared/lib/ExtendedRouterStore";
import sinon from "sinon";

describe("URLWrapper", () => {
    it("resolves properties aliases correctly", () => {
        const fakeRouter = observable({
            query: { cancer_study_id: "some_study_id", non_property: "foo" },
        }) as any;

        const wrapper = new ResultsViewURLWrapper(fakeRouter);

        assert.equal(wrapper.query.cancer_study_list, "some_study_id", "alias resolves to correct param");
        assert.notProperty(wrapper.query, "cancer_study_id");
    });

    it("resolves properties correctly", () => {
        const fakeRouter = observable({
            query: { case_ids: "bar", non_property: "foo" },
        }) as any;

        const wrapper = new ResultsViewURLWrapper(fakeRouter);

        assert.notProperty(wrapper.query, "non_property");
        assert.equal(wrapper.query.case_ids, "bar");
    });

    it("reacts to underling routing store according to rules", () => {
        const fakeRouter = observable({
            query: { case_ids: "bar", non_property: "foo" },
            location: { pathname: "/results" },
        }) as any;

        const wrapper = new ResultsViewURLWrapper(fakeRouter);

        const stub = sinon.stub();

        const disposer = reaction(() => wrapper.query.case_ids, stub);

        assert.equal(stub.args.length, 0, "stub hasn't been called");

        fakeRouter.query.case_ids = "bar2";

        assert.equal(stub.args.length, 1, "stub has been called due to update to property");

        fakeRouter.query.case_ids = "bar2";

        assert.equal(stub.args.length, 1, "setting property to existing value does not cause reaction");

        fakeRouter.query.cancer_study_list = "study1";

        assert.equal(
            stub.args.length,
            1,
            "setting query property which is not referenced in reaction does not cause reaction"
        );

        fakeRouter.query.case_ids = "bar3";

        assert.equal(stub.args.length, 2, "setting property to knew value DOES cause reaction");

        fakeRouter.location.pathname = "/patient";
        fakeRouter.query.case_ids = "bar4";
        assert.equal(stub.args.length, 2, "does not react when pathname doesn't match");

        disposer();
    });

    // it('hash composed only of session props', ()=>{
    //
    //     const fakeRouter = observable({
    //         query: { case_ids: "bar", non_property: "foo" },
    //         location: { pathname: "/results" },
    //     }) as any;
    //
    //     const wrapper = new ResultsViewURLWrapper(fakeRouter);
    //
    //     const beforeChange = wrapper.hash;
    //
    //     fakeRouter.query.clinicallist = "1,2,3";
    //
    //     assert.equal(wrapper.hash, beforeChange, "hash doesn't change if we mutate non session prop");
    //
    //     fakeRouter.query.case_ids = "blah";
    //
    //     assert.notEqual(wrapper.hash, beforeChange, "hash changes if we mutate session prop");
    //
    //
    // });

});
