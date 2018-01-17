import {GeneMolecularData, MolecularProfile, Mutation} from "../../shared/api/generated/CBioPortalAPI";
import {action} from "mobx";
import {getSimplifiedMutationType} from "../../shared/lib/oql/accessors";
import {AnnotatedGeneMolecularData, AnnotatedMutation} from "./ResultsViewPageStore";
import {IndicatorQueryResp} from "../../shared/api/generated/OncoKbAPI";

type CustomDriverAnnotationReport = {
    hasBinary: boolean,
    tiers: string[];
};

export function computeCustomDriverAnnotationReport(mutations:Mutation[]):CustomDriverAnnotationReport {
    let hasBinary = false;
    let tiersMap:{[tier:string]:boolean} = {};
    for (const mutation of mutations) {
        hasBinary = hasBinary || !!mutation.driverFilter;
        if (mutation.driverTiersFilter) {
            tiersMap[mutation.driverTiersFilter] = true;
        }
    }
    return {
        hasBinary,
        tiers: Object.keys(tiersMap)
    };
}

export const initializeCustomDriverAnnotationSettings = action((
    report:CustomDriverAnnotationReport,
    mutationAnnotationSettings:any,
    enableCustomTiers:boolean,
    enableOncoKbAndHotspotsIfNoCustomAnnotations:boolean
)=>{
    // initialize keys with all available tiers
    for (const tier of report.tiers) {
        mutationAnnotationSettings.driverTiers.set(tier, enableCustomTiers);
    }

    if (enableOncoKbAndHotspotsIfNoCustomAnnotations && !report.hasBinary && !report.tiers.length) {
        // enable hotspots and oncokb if there are no custom annotations
        mutationAnnotationSettings.hotspots = true;
        mutationAnnotationSettings.oncoKb = true;
    }
});

export function annotateMutationPutativeDriver(
    mutation: Mutation,
    putativeDriverInfo:{oncoKb:string, hotspots:boolean, cbioportalCount:boolean, cosmicCount:boolean, customDriverBinary:boolean, customDriverTier?:string},
):AnnotatedMutation {
    const putativeDriver =
        !!(putativeDriverInfo.oncoKb ||
        putativeDriverInfo.hotspots ||
        putativeDriverInfo.cbioportalCount ||
        putativeDriverInfo.cosmicCount ||
        putativeDriverInfo.customDriverBinary ||
        putativeDriverInfo.customDriverTier);
    return Object.assign({
        putativeDriver,
        isHotspot: putativeDriverInfo.hotspots,
        oncoKbOncogenic: putativeDriverInfo.oncoKb,
        simplifiedMutationType: getSimplifiedMutationType(mutation.mutationType)
    }, mutation) as AnnotatedMutation;
}

export function computePutativeDriverAnnotatedMutations(
    mutations: Mutation[],
    getPutativeDriverInfo:(mutation:Mutation)=>{oncoKb:string, hotspots:boolean, cbioportalCount:boolean, cosmicCount:boolean, customDriverBinary:boolean, customDriverTier?:string},
    ignoreUnknown:boolean
):AnnotatedMutation[] {
    return mutations.reduce((annotated:AnnotatedMutation[], mutation:Mutation)=>{
        const annotatedMutation = annotateMutationPutativeDriver(mutation, getPutativeDriverInfo(mutation)); // annotate
        if (annotatedMutation.putativeDriver || !ignoreUnknown) {
            annotated.push(annotatedMutation);
        }
        return annotated;
    }, []);
}

export const ONCOKB_ONCOGENIC_LOWERCASE = ["likely oncogenic", "predicted oncogenic", "oncogenic"];

export function getOncoKbOncogenic(response:IndicatorQueryResp):string {
    if (ONCOKB_ONCOGENIC_LOWERCASE.indexOf((response.oncogenic || "").toLowerCase()) > -1) {
        return response.oncogenic;
    } else {
        return "";
    }
}

export function annotateMolecularDatum(
    molecularDatum:GeneMolecularData,
    getOncoKbCnaAnnotationForOncoprint:(datum:GeneMolecularData)=>IndicatorQueryResp,
    molecularProfileIdToMolecularProfile:{[molecularProfileId:string]:MolecularProfile}
):AnnotatedGeneMolecularData {
    let oncogenic = "";
    if (molecularProfileIdToMolecularProfile[molecularDatum.molecularProfileId].molecularAlterationType
        === "COPY_NUMBER_ALTERATION") {
        const oncoKbDatum = getOncoKbCnaAnnotationForOncoprint(molecularDatum);
        if (oncoKbDatum) {
            oncogenic = getOncoKbOncogenic(oncoKbDatum);
        }
    }
    return Object.assign({oncoKbOncogenic: oncogenic}, molecularDatum);
}