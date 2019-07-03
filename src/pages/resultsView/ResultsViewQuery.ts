import {SamplesSpecificationElement, SampleListCategoryType} from "./ResultsViewPageStore";
import {computed, observable} from "mobx";
import {CancerStudyQueryUrlParams} from "../../shared/components/query/QueryStore";
import {getMolecularProfiles} from "./ResultsViewPageStoreUtils";
import hashString from "../../shared/lib/hashString";
import _ from "lodash";

export class ResultsViewQuery {
    // TODO: make sure i am initializing these the exact same way as they were in resultsviewpagestore to avoid any weird bugs w assuming undefined at start
    @observable.ref public samplesSpecification:SamplesSpecificationElement[] = [];
    @observable public selectedStudyIds:string[] = [];
    @observable public sampleListCategory:SampleListCategoryType | undefined;
    @observable public profileFilter:number = 0; // maps to the old data_priority parameter
    @observable public selectedMolecularProfileIds:string[] = [];
    @observable public _rppaScoreThreshold:number|undefined;
    @observable public _zScoreThreshold:number|undefined;
    @observable public genesetIds:string[] = [];
    @observable public treatmentIds:string[] = [];
    @observable public cohortIdsList:string[] = [];//queried id(any combination of physical and virtual studies)
    @observable public oqlQuery:string = "";

    @computed get hash():number {
        const hashKeys:(keyof ResultsViewQuery)[] = [
            "samplesSpecification", "selectedStudyIds", "sampleListCategory", "profileFilter", "selectedMolecularProfileIds",
            "rppaScoreThreshold", "zScoreThreshold", "genesetIds", "cohortIdsList", "oqlQuery"
        ];
        const stringified = hashKeys.reduce((acc, nextKey)=>`${acc},${nextKey}:${this[nextKey]}`, "");
        return hashString(stringified);
    }
    @computed public get zScoreThreshold() {
        if (this._zScoreThreshold === undefined) {
            return 2;
        } else {
            return this._zScoreThreshold;
        }
    }
    public set zScoreThreshold(val:number) {
        if (!Number.isNaN(val)) {
            this._zScoreThreshold = val;
        }
    }
    @computed public get rppaScoreThreshold() {
        return this._rppaScoreThreshold === undefined ? 2 : this._rppaScoreThreshold;
    }
    public set rppaScoreThreshold(val:number) {
        if (!Number.isNaN(val)) {
            this._rppaScoreThreshold = val;
        }
    }
}
export function updateResultsViewQuery(
    rvQuery:ResultsViewQuery,
    urlQuery:CancerStudyQueryUrlParams,
    samplesSpecification:SamplesSpecificationElement[],
    cancerStudyIds:string[],
    oql:string
) {
    const trackedChanges:{[key in keyof ResultsViewQuery]?:boolean} = {}; // not comprehensive - only maintained as needed

    if (!rvQuery.samplesSpecification || !_.isEqual(rvQuery.samplesSpecification.slice(), samplesSpecification)) {
        rvQuery.samplesSpecification = samplesSpecification;
    }

    // set the study Ids
    if (rvQuery.selectedStudyIds !== cancerStudyIds) {
        rvQuery.selectedStudyIds = cancerStudyIds;
    }

    // sometimes the submitted case_set_id is not actually a case_set_id but
    // a category of case set ids (e.g. selected studies > 1 and case category selected)
    // in that case, note that on the query
    if (urlQuery.case_set_id && [SampleListCategoryType.w_mut,SampleListCategoryType.w_cna,SampleListCategoryType.w_mut_cna].includes(urlQuery.case_set_id as any)) {
        if (rvQuery.sampleListCategory !== urlQuery.case_set_id) {
            rvQuery.sampleListCategory = urlQuery.case_set_id as SampleListCategoryType;
        }
    } else {
        rvQuery.sampleListCategory = undefined;
    }

    if (urlQuery.data_priority !== undefined && parseInt(urlQuery.data_priority,10) !== rvQuery.profileFilter) {
        rvQuery.profileFilter = parseInt(urlQuery.data_priority,10);
    }

    // note that this could be zero length if we have multiple studies
    // in that case we derive default selected profiles
    const profiles = getMolecularProfiles(urlQuery);
    if (!rvQuery.selectedMolecularProfileIds || !_.isEqual(rvQuery.selectedMolecularProfileIds.slice(), profiles)) {
        rvQuery.selectedMolecularProfileIds = profiles;
    }

    if (!_.isEqual(urlQuery.RPPA_SCORE_THRESHOLD, rvQuery.rppaScoreThreshold)) {
        rvQuery.rppaScoreThreshold = parseFloat(urlQuery.RPPA_SCORE_THRESHOLD);
    }

    if (!_.isEqual(urlQuery.Z_SCORE_THRESHOLD, rvQuery.zScoreThreshold)) {
        rvQuery.zScoreThreshold = parseFloat(urlQuery.Z_SCORE_THRESHOLD);
    }

    if (urlQuery.geneset_list) {
        // we have to trim because for some reason we get a single space from submission
        const parsedGeneSetList = urlQuery.geneset_list.trim().length ? (urlQuery.geneset_list.trim().split(/\s+/)) : [];
        if (!_.isEqual(parsedGeneSetList, rvQuery.genesetIds)) {
            rvQuery.genesetIds = parsedGeneSetList;
        }
    }

    if (urlQuery.treatment_list) {
        // we have to trim because for some reason we get a single space from submission
        const parsedTreatmentList = urlQuery.treatment_list.trim().length ? (urlQuery.treatment_list.trim().split(/;/)) : [];
        if (!_.isEqual(parsedTreatmentList, rvQuery.treatmentIds)) {
            rvQuery.treatmentIds = parsedTreatmentList;
        }
    }

    // cohortIdsList will contain virtual study ids (physicalstudies will contain the phsyical studies which comprise the virtual studies)
    // although resultsViewStore does
    if (!rvQuery.cohortIdsList || !_.isEqual(_.sortBy(rvQuery.cohortIdsList), _.sortBy(cancerStudyIds))) {
        rvQuery.cohortIdsList = cancerStudyIds;
        trackedChanges.cohortIdsList = true;
    }

    if (rvQuery.oqlQuery !== oql) {
        rvQuery.oqlQuery = oql;
    }

    return trackedChanges;
}