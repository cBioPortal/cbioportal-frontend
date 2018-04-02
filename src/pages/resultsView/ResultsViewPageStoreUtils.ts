
import {
    Gene, NumericGeneMolecularData, GenePanel, GenePanelData, MolecularProfile,
    Mutation, Patient, Sample, CancerStudy
} from "../../shared/api/generated/CBioPortalAPI";
import {action} from "mobx";
import {getSimplifiedMutationType} from "../../shared/lib/oql/accessors";
import {AnnotatedNumericGeneMolecularData, AnnotatedMutation, GenePanelInformation} from "./ResultsViewPageStore";
import {IndicatorQueryResp} from "../../shared/api/generated/OncoKbAPI";
import _ from "lodash";
import sessionServiceClient from "shared/api//sessionServiceInstance";
import { VirtualStudy } from "shared/model/VirtualStudy";

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

export function computeGenePanelInformation(
    genePanelData:GenePanelData[],
    genePanels:GenePanel[],
    samples: Sample[],
    patients: Patient[],
    genes:Gene[]
):GenePanelInformation {
    const entrezToGene = _.keyBy(genes, gene=>gene.entrezGeneId);
    const genePanelToGenes = _.mapValues(_.keyBy(genePanels, panel=>panel.genePanelId), (panel:GenePanel)=>{
        return panel.genes.filter(gene=>!!entrezToGene[gene.entrezGeneId]); // only list genes that we're curious in
    });
    const sampleInfo:GenePanelInformation["samples"] = _.reduce(samples, (map:GenePanelInformation["samples"], sample)=>{
        map[sample.uniqueSampleKey] = {
            sequencedGenes: {},
            wholeExomeSequenced: false
        };
        return map;
    }, {});

    const patientInfo:GenePanelInformation["patients"] = _.reduce(patients, (map:GenePanelInformation["patients"], patient)=>{
        map[patient.uniquePatientKey] = {
            sequencedGenes: {},
            wholeExomeSequenced: false
        };
        return map;
    }, {});
    for (const gpData of genePanelData) {
        const sampleSequencingInfo = sampleInfo[gpData.uniqueSampleKey];
        const patientSequencingInfo = patientInfo[gpData.uniquePatientKey];
        const genePanelId = gpData.genePanelId;

        if (genePanelId) {
            // add gene panel data to record particular genes sequenced iff theres a gene panel id
            if (genePanelToGenes[genePanelId]) {
                for (const gene of genePanelToGenes[genePanelId]) {
                    sampleSequencingInfo.sequencedGenes[gene.hugoGeneSymbol] = sampleSequencingInfo.sequencedGenes[gene.hugoGeneSymbol] || [];
                    sampleSequencingInfo.sequencedGenes[gene.hugoGeneSymbol].push(gpData);

                    patientSequencingInfo.sequencedGenes[gene.hugoGeneSymbol] = patientSequencingInfo.sequencedGenes[gene.hugoGeneSymbol] || [];
                    patientSequencingInfo.sequencedGenes[gene.hugoGeneSymbol].push(gpData);
                }
            }
        }

        sampleSequencingInfo.wholeExomeSequenced = gpData.wholeExomeSequenced || sampleSequencingInfo.wholeExomeSequenced;
        patientSequencingInfo.wholeExomeSequenced = gpData.wholeExomeSequenced || patientSequencingInfo.wholeExomeSequenced;
    }
    return {
        samples: sampleInfo,
        patients: patientInfo
    };
}

export function annotateMolecularDatum(
    molecularDatum:NumericGeneMolecularData,
    getOncoKbCnaAnnotationForOncoprint:(datum:NumericGeneMolecularData)=>IndicatorQueryResp,
    molecularProfileIdToMolecularProfile:{[molecularProfileId:string]:MolecularProfile}
):AnnotatedNumericGeneMolecularData {
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

export async function getQueriedStudies(
    physicalStudies:{[id:string]:CancerStudy},
    virtualStudies:{[id:string]:CancerStudy},
    queriedIds:string[]
):Promise<CancerStudy[]>{
    const queriedStudies:CancerStudy[] = [];
    const cohorts: {[id:string]:CancerStudy} = Object.assign({}, physicalStudies, virtualStudies);
    //this would mostly contain unauthorized and shared virtual study ids
    const unknownIds:string[] = []
    for(const id of queriedIds){
        if(cohorts[id]){
            queriedStudies.push(cohorts[id])
        } else {
            unknownIds.push(id)
        }
    }

    let promises = unknownIds.map(id =>sessionServiceClient.getVirtualStudy(id))
			
    let otherVirtualStudies = await Promise.all(promises).then((allData: VirtualStudy[]) => {
        return allData.map(virtualStudy => {
            let study = {
                allSampleCount:_.sumBy(virtualStudy.data.studies, study=>study.samples.length),
                studyId: virtualStudy.id,
                name: virtualStudy.data.name,
                description: virtualStudy.data.description,
                cancerTypeId: "My Virtual Studies"
            } as CancerStudy;
            return study;
        })
    });
    return queriedStudies.concat(otherVirtualStudies);
}
