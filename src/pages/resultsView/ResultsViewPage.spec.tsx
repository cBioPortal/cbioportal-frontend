// import {assert} from "chai";
// import ResultsViewPage from "./ResultsViewPage";
//
// const componentUnderTest = (ResultsViewPage as any).wrappedComponent;

// describe("ResultsViewPage", () => {
//     const methodUnderTest = (componentUnderTest.prototype as ResultsViewPage).currentTab;
//
//     let mockInstance: any;
//
//     beforeEach(()=>{
//         mockInstance = {
//             resultsViewPageStore:{
//                 studies: {
//                     result: ["1","2","3","4"]
//                 },
//                 hugoGeneSymbols:["1","2","3","4"]
//             },
//
//         };
//     });
//
//     it("returns passed tabId", ()=>{
//         assert.equal(methodUnderTest.call({},"blah"), "blah");
//     });
//
//     it("returns correct default according to study/gene counts", ()=>{
//         assert.equal(methodUnderTest.call(mockInstance,undefined), "oncoprint", "multiple studies, multiple genes");
//
//         mockInstance.resultsViewPageStore.hugoGeneSymbols = ["1"];
//         assert.equal(methodUnderTest.call(mockInstance,undefined), "cancerTypesSummary", "multiple stupdies, single gene");
//
//         mockInstance.resultsViewPageStore.studies.result = ["1"];
//         assert.equal(methodUnderTest.call(mockInstance,undefined), "oncoprint", "single study, single gene");
//
//     });
// });