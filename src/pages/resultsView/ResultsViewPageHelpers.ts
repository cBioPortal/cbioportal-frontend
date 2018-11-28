import * as _ from "lodash";
import {getMolecularProfiles} from "./ResultsViewPageStoreUtils";
import {runInAction} from "mobx";
import {ResultsViewPageStore, SamplesSpecificationElement} from "./ResultsViewPageStore";
import client from "../../shared/api/cbioportalClientInstance";
import sessionServiceClient from "../../shared/api/sessionServiceInstance";
import {CancerStudy} from "../../shared/api/generated/CBioPortalAPI";
import {VirtualStudy} from "../../shared/model/VirtualStudy";
import hashString from "../../shared/lib/hashString";
import {
    CLINICAL_TRACKS_URL_PARAM, HEATMAP_TRACKS_URL_PARAM,
    SAMPLE_MODE_URL_PARAM
} from "../../shared/components/oncoprint/ResultsViewOncoprint";

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

export function getVirtualStudies(cancerStudyIds:string[]):Promise<VirtualStudy[]>{

    const prom = new Promise<VirtualStudy[]>((resolve, reject)=>{
        Promise.all([
            sessionServiceClient.getUserVirtualStudies(),
            client.getAllStudiesUsingGET({projection:"SUMMARY"})
        ]).then(([userVirtualStudies, allCancerStudies])=>{
            // return virtual studies from given cancer study ids
            const missingFromCancerStudies = _.differenceWith(cancerStudyIds, allCancerStudies,(id:string, study:CancerStudy)=>id==study.studyId);
            const virtualStudies = userVirtualStudies.filter(
                (virtualStudy: VirtualStudy) => (missingFromCancerStudies.includes(virtualStudy.id))
            );
            resolve(virtualStudies);
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