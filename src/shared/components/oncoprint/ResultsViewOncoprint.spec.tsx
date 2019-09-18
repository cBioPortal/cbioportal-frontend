import {assert} from "chai";
import ResultsViewOncoprint from "./ResultsViewOncoprint";
import { ResultsViewPageStore } from "pages/resultsView/ResultsViewPageStore";
import { Sample, Patient } from "shared/api/generated/CBioPortalAPI";
import getBrowserWindow from "public-lib/lib/getBrowserWindow";
import ExtendedRouterStore from "shared/lib/ExtendedRouterStore";
import sinon from "sinon";
import { isOccupied } from "pages/studyView/StudyViewUtils";
import { SortByUrlParamValue } from 'shared/components/oncoprint/ResultsViewOncoprint';

describe('Oncoprint sortBy URL parameter', () => {

    const samples = [
        {sampleId: "Sample1", uniqueSampleKey: "Sample1_key"},
        {sampleId: "Sample2", uniqueSampleKey: "Sample2_key"},
        {sampleId: "Sample3", uniqueSampleKey: "Sample3_key"}
    ] as Sample[];

    const patients = [
        {patientId: "Patient1", uniquePatientKey: "Patient1_key"},
        {patientId: "Patient2", uniquePatientKey: "Patient2_key"},
        {patientId: "Patient3", uniquePatientKey: "Patient3_key"}
    ] as Patient[];

    const caseList = [
        {sampleId: "Sample2", uniqueSampleKey: "Sample2_key", uniquePatientKey: "Patient2_key"},
        {sampleId: "Sample3", uniqueSampleKey: "Sample3_key", uniquePatientKey: "Patient3_key"},
        {sampleId: "Sample1", uniqueSampleKey: "Sample1_key", uniquePatientKey: "Patient1_key"}
    ] as Sample[];

    const storeMock = {
        samples: {isComplete: true, result: samples},
        patients: {isComplete: true, result: patients},
        givenSampleOrder: {isComplete: true, result: caseList},
        molecularProfileIdToMolecularProfile: {isComplete: true}
    } as any as ResultsViewPageStore;

    it('`case_id` provides sorted sample config to oncoprint', () => {
        const oncoprintView = initResultsViewWithSortByParam({sortByParam:SortByUrlParamValue.CASE_ID, columnMode: 'sample'});
        assert.deepEqual( oncoprintView.sortConfig.order, ["Sample1_key","Sample2_key","Sample3_key"]);
    });

    it('`case_id` provides sorted patient config to oncoprint', () => {
        const oncoprintView = initResultsViewWithSortByParam({sortByParam:SortByUrlParamValue.CASE_ID, columnMode:'patient'});
        assert.deepEqual( oncoprintView.sortConfig.order, ["Patient1_key","Patient2_key","Patient3_key"]);
    });

    it('`case_list` provides sorted sample config to oncoprint when case list is available', () => {
        const oncoprintView = initResultsViewWithSortByParam({sortByParam:SortByUrlParamValue.CASE_LIST, columnMode: 'sample', caselistEnabled: true});
        assert.deepEqual(oncoprintView.sortConfig.order,  ["Sample2_key","Sample3_key","Sample1_key"]);
    });

    it('`case_list` provides sorted patient config to oncoprint when case list is available', () => {
        const oncoprintView = initResultsViewWithSortByParam({sortByParam:SortByUrlParamValue.CASE_LIST, columnMode: 'patient', caselistEnabled: true});
        assert.deepEqual(oncoprintView.sortConfig.order,  ["Patient2_key","Patient3_key","Patient1_key"]);
    });

    it('`case_list` provides no sort config to oncoprint when case list is unavailable', () => {
        const oncoprintView = initResultsViewWithSortByParam({sortByParam:SortByUrlParamValue.CASE_LIST, columnMode: 'patient', caselistEnabled: false});
        assert.isUndefined(oncoprintView.sortConfig.order);
    });

    interface IHelperFunction {
        sortByParam:SortByUrlParamValue;
        columnMode?:"sample"|"patient" ;
        caselistEnabled?:boolean;
    }

    const initResultsViewWithSortByParam = (params:IHelperFunction) => {
        // mock the url params by mocking the ExtendedRouterStore class
        const routingStub = sinon.createStubInstance(ExtendedRouterStore);
        routingStub.location = { query: {oncoprint_sortby: params.sortByParam}};
        getBrowserWindow().globalStores = {routing: routingStub };
        if (params.caselistEnabled !== undefined) {
            storeMock.givenSampleOrder.isComplete = params.caselistEnabled;
        }
        const oncoprintView = new ResultsViewOncoprint(
            {divId: "", store: storeMock, routing: ""}
        );
        if (params.columnMode !== undefined) {
            oncoprintView.columnMode = params.columnMode;
        }
        return oncoprintView;
    };

});