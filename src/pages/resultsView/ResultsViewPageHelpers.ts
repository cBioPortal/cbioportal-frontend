import * as _ from "lodash";
import {getMolecularProfiles} from "./ResultsViewPageStoreUtils";
import {runInAction} from "mobx";
import {ResultsViewPageStore, SamplesSpecificationElement} from "./ResultsViewPageStore";
import client from "../../shared/api/cbioportalClientInstance";
import sessionServiceClient from "../../shared/api/sessionServiceInstance";
import {CancerStudy} from "../../shared/api/generated/CBioPortalAPI";
import {VirtualStudy} from "../../shared/model/VirtualStudy";
import hashString from "../../shared/lib/hashString";

export enum ResultsViewTab {
    ONCOPRINT="oncoprint",
    CANCER_TYPES_SUMMARY="cancerTypesSummary",
    MUTUAL_EXCLUSIVITY="mutualExclusivity",
    PLOTS="plots",
    MUTATIONS="mutations",
    COEXPRESSION="coexpression",
    ENRICHMENTS="enrichments",
    SURVIVAL="survival",
    CN_SEGMENTS="cnSegments",
    NETWORK="network",
    EXPRESSION="expression",
    DOWNLOAD="download"
}

export function getTabId(pathname:string) {
    const match = pathname.match(/results\/([^\/]+)/);
    if (match) {
        return match[1] as ResultsViewTab;
    } else {
        return undefined;
    }
}

export function parseConfigDisabledTabs(configDisabledTabsParam:string){
    const oldTabToNewTabRoute:{[legacyTabId:string]:ResultsViewTab} = {
        "oncoprint":ResultsViewTab.ONCOPRINT,
        "cancer_types_summary":ResultsViewTab.CANCER_TYPES_SUMMARY,
        "mutual_exclusivity":ResultsViewTab.MUTUAL_EXCLUSIVITY,
        "plots":ResultsViewTab.PLOTS,
        "mutations":ResultsViewTab.MUTATIONS,
        "co_expression":ResultsViewTab.COEXPRESSION,
        "enrichments":ResultsViewTab.ENRICHMENTS,
        "survival":ResultsViewTab.SURVIVAL,
        "IGV":ResultsViewTab.CN_SEGMENTS,
        "network":ResultsViewTab.NETWORK,
        "expression":ResultsViewTab.EXPRESSION,
        "download":ResultsViewTab.DOWNLOAD
    };
    return configDisabledTabsParam.split(",").map((s)=>s.trim()).map(str=>{
        if (str in oldTabToNewTabRoute) {
            return oldTabToNewTabRoute[str];
        } else {
            return str;
        }
    });
}

export function updateStoreFromQuery(resultsViewPageStore:ResultsViewPageStore, query:any,
                                     samplesSpecification:SamplesSpecificationElement[], cancerStudyIds:string[], oql:string, cohortIdsList:string[]){

        if (!resultsViewPageStore._samplesSpecification || !_.isEqual(resultsViewPageStore._samplesSpecification.slice(), samplesSpecification)) {
            resultsViewPageStore._samplesSpecification = samplesSpecification;
        }

        // set the study Ids
        if (resultsViewPageStore._selectedStudyIds !== cancerStudyIds) {
            resultsViewPageStore._selectedStudyIds = cancerStudyIds;
        }

        // sometimes the submitted case_set_id is not actually a case_set_id but
        // a category of case set ids (e.g. selected studies > 1 and case category selected)
        // in that case, note that on the query
        if (query.case_set_id && ["w_mut","w_cna","w_mut_cna"].includes(query.case_set_id)) {
            if (resultsViewPageStore.sampleListCategory !== query.case_set_id) {
                resultsViewPageStore.sampleListCategory = query.case_set_id;
            }
        } else {
            resultsViewPageStore.sampleListCategory = undefined;
        }

        if (query.data_priority !== undefined && parseInt(query.data_priority,10) !== resultsViewPageStore._profileFilter) {
            resultsViewPageStore._profileFilter = parseInt(query.data_priority,10);
        }

        // note that this could be zero length if we have multiple studies
        // in that case we derive default selected profiles
        const profiles = getMolecularProfiles(query);
        if (!resultsViewPageStore.selectedMolecularProfileIds || !_.isEqual(resultsViewPageStore.selectedMolecularProfileIds.slice(), profiles)) {
            resultsViewPageStore.selectedMolecularProfileIds = profiles;
        }

        if (!_.isEqual(query.RPPA_SCORE_THRESHOLD, resultsViewPageStore.rppaScoreThreshold)) {
            resultsViewPageStore.rppaScoreThreshold = parseFloat(query.RPPA_SCORE_THRESHOLD);
        }

        if (!_.isEqual(query.Z_SCORE_THRESHOLD, resultsViewPageStore.zScoreThreshold)) {
            resultsViewPageStore.zScoreThreshold = parseFloat(query.Z_SCORE_THRESHOLD);
        }

        if (query.geneset_list) {
            // we have to trim because for some reason we get a single space from submission
            const parsedGeneSetList = query.geneset_list.trim().length ? (query.geneset_list.trim().split(/\s+/)) : [];
            if (!_.isEqual(parsedGeneSetList, resultsViewPageStore.genesetIds)) {
                resultsViewPageStore.genesetIds = parsedGeneSetList;
            }
        }

        // cohortIdsList will contain virtual study ids (physicalstudies will contain the phsyical studies which comprise the virtual studies)
        // although resultsViewStore does
        if (!resultsViewPageStore.cohortIdsList || !_.isEqual(_.sortBy(resultsViewPageStore.cohortIdsList), _.sortBy(cancerStudyIds))) {
            resultsViewPageStore.cohortIdsList = cancerStudyIds;
            resultsViewPageStore.initMutationAnnotationSettings();
        }

        if (resultsViewPageStore.oqlQuery !== oql) {
            resultsViewPageStore.oqlQuery = oql;
        }

        const queryHash = hashString(JSON.stringify(query)).toString();
        if (resultsViewPageStore.queryHash !== queryHash ) {
            resultsViewPageStore.queryHash = queryHash;
        }
}

export function getVirtualStudies(cancerStudyIds:string[]):Promise<VirtualStudy[]>{

    const prom = new Promise<VirtualStudy[]>((resolve, reject)=>{
        client.getAllStudiesUsingGET({projection:"SUMMARY"}).then((allStudies)=>{
            //console.log(cancerStudyIds);
            //console.log(allStudies);
            const virtualStudyIds = _.differenceWith(cancerStudyIds, allStudies,(id:string, study:CancerStudy)=>id==study.studyId);

            if (virtualStudyIds.length > 0) {
                Promise.all(virtualStudyIds.map(id =>  sessionServiceClient.getVirtualStudy(id)))
                    .then((virtualStudies)=>{
                         resolve(virtualStudies);
                    })
            } else {
                resolve([]);
            }
        });
    });
    return prom;

}

export function substitutePhysicalStudiesForVirtualStudies(cancerStudyIds:string[], virtualStudies:VirtualStudy[]){

    let physicalStudies:string[] = [];

    //if a study is a virtual study, substitute its physical study ids
    const virtualStudiesKeyedById = _.keyBy(virtualStudies,(virtualStudy)=>virtualStudy.id);
    cancerStudyIds.forEach((studyId)=>{
        if (studyId in virtualStudiesKeyedById) {
            const virtualStudy = virtualStudiesKeyedById[studyId];
            physicalStudies = physicalStudies.concat(virtualStudy.data.studies.map((study)=>study.id));
        } else {
            physicalStudies.push(studyId);
        }
    });

    // it's possible that a virtual study could contain a physical study which is also selected independently
    // or is also contained by another selected virtual study
    // make sure physical study collection is unique
    return _.uniq(physicalStudies);

}

export function populateSampleSpecificationsFromVirtualStudies(samplesSpecification:SamplesSpecificationElement[], virtualStudies:VirtualStudy[]){

    const virtualStudiesKeyedById = _.keyBy(virtualStudies,(virtualStudy)=>virtualStudy.id);

    // remove specs for virtual studies (since they mean nothing to api)
    // and then populate with ids
    samplesSpecification = _.filter(samplesSpecification,(spec)=>!virtualStudiesKeyedById[spec.studyId]);

    const allVirtualStudySampleSpecs = _.flatMapDeep(virtualStudies.map((virtualStudy)=>{
        return virtualStudy.data.studies.map((study)=>{
            return study.samples.map((sampleId)=>{
                return {
                    studyId:study.id,
                    sampleListId:undefined,
                    sampleId:sampleId
                } as SamplesSpecificationElement
            })
        }) as SamplesSpecificationElement[][];
    }));

    // ts not resolving type above and not sure why, so cast it
    samplesSpecification = samplesSpecification.concat(allVirtualStudySampleSpecs as SamplesSpecificationElement[]);

    return samplesSpecification;

}