import {
    Gene, NumericGeneMolecularData, GenePanel, GenePanelData, MolecularProfile,
    Mutation, Patient, Sample, CancerStudy
} from "../../shared/api/generated/CBioPortalAPI";
import {action} from "mobx";
import accessors, {getSimplifiedMutationType} from "../../shared/lib/oql/accessors";
import {
    OQLLineFilterOutput,
    UnflattenedOQLLineFilterOutput,
    filterCBioPortalWebServiceDataByUnflattenedOQLLine,
    isMergedTrackFilter
} from "../../shared/lib/oql/oqlfilter";
import {groupBy} from "../../shared/lib/StoreUtils";
import {
    AnnotatedExtendedAlteration,
    AnnotatedNumericGeneMolecularData,
    AnnotatedMutation,
    CaseAggregatedData,
    IQueriedCaseData
} from "./ResultsViewPageStore";
import {IndicatorQueryResp} from "../../shared/api/generated/OncoKbAPI";
import _ from "lodash";
import sessionServiceClient from "shared/api//sessionServiceInstance";
import { VirtualStudy } from "shared/model/VirtualStudy";
import client from "shared/api/cbioportalClientInstance";

type CustomDriverAnnotationReport = {
    hasBinary: boolean,
    tiers: string[];
};

export type CoverageInformation = {
    samples:
        {[uniqueSampleKey:string]:{
            byGene:{[hugoGeneSymbol:string]:GenePanelData[]},
            allGenes:GenePanelData[],
            notProfiledByGene:{[hugoGeneSymbol:string]:GenePanelData[]}
            notProfiledAllGenes:GenePanelData[];
        }};
    patients:
        {[uniquePatientKey:string]:{
            byGene:{[hugoGeneSymbol:string]:GenePanelData[]},
            allGenes:GenePanelData[],
            notProfiledByGene:{[hugoGeneSymbol:string]:GenePanelData[]}
            notProfiledAllGenes:GenePanelData[];
        }};
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
    entrezGeneIdToGene:{[entrezGeneId:number]:Gene},
    ignoreUnknown:boolean
):AnnotatedMutation[] {
    return mutations.reduce((annotated:AnnotatedMutation[], mutation:Mutation)=>{
        const annotatedMutation = annotateMutationPutativeDriver(mutation, getPutativeDriverInfo(mutation)); // annotate
        annotatedMutation.hugoGeneSymbol = entrezGeneIdToGene[mutation.entrezGeneId].hugoGeneSymbol;
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
):CoverageInformation {
    const entrezToGene = _.keyBy(genes, gene=>gene.entrezGeneId);
    const genePanelToGenes = _.mapValues(_.keyBy(genePanels, panel=>panel.genePanelId), (panel:GenePanel)=>{
        return panel.genes.filter(gene=>!!entrezToGene[gene.entrezGeneId]); // only list genes that we're curious in
    });
    const sampleInfo:CoverageInformation["samples"] = _.reduce(samples, (map:CoverageInformation["samples"], sample)=>{
        map[sample.uniqueSampleKey] = {
            byGene: {},
            allGenes:[],
            notProfiledByGene: {},
            notProfiledAllGenes:[]
        };
        return map;
    }, {});

    const patientInfo:CoverageInformation["patients"] = _.reduce(patients, (map:CoverageInformation["patients"], patient)=>{
        map[patient.uniquePatientKey] = {
            byGene: {},
            allGenes:[],
            notProfiledByGene: {},
            notProfiledAllGenes:[]
        };
        return map;
    }, {});

    const genePanelDataWithGenePanelId:GenePanelData[] = [];
    for (const gpData of genePanelData) {
        const sampleSequencingInfo = sampleInfo[gpData.uniqueSampleKey];
        const patientSequencingInfo = patientInfo[gpData.uniquePatientKey];
        const genePanelId = gpData.genePanelId;

        if (gpData.profiled) {
            if (genePanelId) {
                if (genePanelToGenes[genePanelId]) {
                    // add gene panel data to record particular genes sequenced
                    for (const gene of genePanelToGenes[genePanelId]) {
                        sampleSequencingInfo.byGene[gene.hugoGeneSymbol] = sampleSequencingInfo.byGene[gene.hugoGeneSymbol] || [];
                        sampleSequencingInfo.byGene[gene.hugoGeneSymbol].push(gpData);

                        patientSequencingInfo.byGene[gene.hugoGeneSymbol] = patientSequencingInfo.byGene[gene.hugoGeneSymbol] || [];
                        patientSequencingInfo.byGene[gene.hugoGeneSymbol].push(gpData);
                    }
                    // Add to list for more processing later
                    genePanelDataWithGenePanelId.push(gpData);
                }
            } else {
                // otherwise, all genes are profiled
                sampleSequencingInfo.allGenes.push(gpData);
                patientSequencingInfo.allGenes.push(gpData);
            }
        } else {
            sampleSequencingInfo.notProfiledAllGenes.push(gpData);
            patientSequencingInfo.notProfiledAllGenes.push(gpData);
        }
    }
    // Record which of the queried genes are not profiled by gene panels
    for (const gpData of genePanelDataWithGenePanelId) {
        const sampleSequencingInfo = sampleInfo[gpData.uniqueSampleKey];
        const patientSequencingInfo = patientInfo[gpData.uniquePatientKey];

        for (const queryGene of genes) {
            if (!sampleSequencingInfo.byGene[queryGene.hugoGeneSymbol]) {
                sampleSequencingInfo.notProfiledByGene[queryGene.hugoGeneSymbol] = sampleSequencingInfo.notProfiledByGene[queryGene.hugoGeneSymbol] || [];
                sampleSequencingInfo.notProfiledByGene[queryGene.hugoGeneSymbol].push(gpData);
            }
            if (!patientSequencingInfo.byGene[queryGene.hugoGeneSymbol]) {
                patientSequencingInfo.notProfiledByGene[queryGene.hugoGeneSymbol] = patientSequencingInfo.notProfiledByGene[queryGene.hugoGeneSymbol] || [];
                patientSequencingInfo.notProfiledByGene[queryGene.hugoGeneSymbol].push(gpData);
            }
        }
    }
    return {
        samples: sampleInfo,
        patients: patientInfo
    };
}

export function annotateMolecularDatum(
    molecularDatum:NumericGeneMolecularData,
    getOncoKbCnaAnnotationForOncoprint:(datum:NumericGeneMolecularData)=>IndicatorQueryResp|undefined,
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

export async function fetchQueriedStudies(filteredPhysicalStudies:{[id:string]:CancerStudy},queriedIds:string[]):Promise<CancerStudy[]>{
    const queriedStudies:CancerStudy[] = [];
    let unknownIds:{[id:string]:boolean} = {};
    for(const id of queriedIds){
        if(filteredPhysicalStudies[id]){
            queriedStudies.push(filteredPhysicalStudies[id])
        } else {
            unknownIds[id]=true;
        }
    }

    if(!_.isEmpty(unknownIds)){
        await client.fetchStudiesUsingPOST({
            studyIds:Object.keys(unknownIds),
            projection:'DETAILED'
        }).then(studies=>{
            studies.forEach(study=>{
                queriedStudies.push(study);
                delete unknownIds[study.studyId];
            })
    
        }).catch(() => {}) //this is for private instances. it throws error when the study is not found
    }

    let virtualStudypromises = Object.keys(unknownIds).map(id =>sessionServiceClient.getVirtualStudy(id))

    await Promise.all(virtualStudypromises).then((allData: VirtualStudy[]) => {
        allData.forEach(virtualStudy=>{
            let study = {
                allSampleCount:_.sumBy(virtualStudy.data.studies, study=>study.samples.length),
                studyId: virtualStudy.id,
                name: virtualStudy.data.name,
                description: virtualStudy.data.description,
                cancerTypeId: "My Virtual Studies"
            } as CancerStudy;
            queriedStudies.push(study)
        })
    });

    return queriedStudies;
}

export function groupDataByCase(
    oqlFilter: UnflattenedOQLLineFilterOutput<AnnotatedExtendedAlteration>,
    samples: {uniqueSampleKey: string}[],
    patients: {uniquePatientKey: string}[]
): CaseAggregatedData<AnnotatedExtendedAlteration> {
    const data: AnnotatedExtendedAlteration[] = (
        isMergedTrackFilter(oqlFilter)
        ? _.flatMap(oqlFilter.list, (geneLine) => geneLine.data)
        : oqlFilter.data
    );
    return {
        samples: groupBy(data, datum=>datum.uniqueSampleKey, samples.map(sample=>sample.uniqueSampleKey)),
        patients: groupBy(data, datum=>datum.uniquePatientKey, patients.map(sample=>sample.uniquePatientKey))
    };
}

export function filterSubQueryData(
    queryStructure: UnflattenedOQLLineFilterOutput<object>,
    defaultOQLQuery: string,
    data: (AnnotatedMutation | NumericGeneMolecularData)[],
    accessorsInstance: accessors,
    samples: {uniqueSampleKey: string}[],
    patients: {uniquePatientKey: string}[]
): IQueriedCaseData<object>[] | undefined {
    function filterDataForLine(oqlLine: string) {
        // assuming that merged track syntax will never allow
        // nesting, each inner OQL line will be one single-gene
        // query
        const alterationsForLine = (
            filterCBioPortalWebServiceDataByUnflattenedOQLLine(
                oqlLine,
                data,
                accessorsInstance,
                defaultOQLQuery
            )[0]
        ) as OQLLineFilterOutput<AnnotatedExtendedAlteration>;
        return {
            cases: groupDataByCase(alterationsForLine, samples, patients),
            oql: alterationsForLine
        };
    }

    if (!isMergedTrackFilter(queryStructure)) {
        return undefined;
    } else {
        return queryStructure.list.map(
            innerLine => filterDataForLine(innerLine.oql_line)
        );
    }
}


export function isRNASeqProfile(profileId:string, version:number): boolean {
    const ver = (version === 2) ? 'v2_' : '';
    // note that pan can only has v2 expression data, so don't worry about v1
    return RegExp(`rna_seq_${ver}mrna$|pan_can_atlas_2018_rna_seq_${ver}mrna_median$`).test(profileId);
}

export function isTCGAPubStudy(studyId:string){
    return /tcga_pub$/.test(studyId);
}

export function isTCGAProvStudy(studyId:string){
    return /tcga$/.test(studyId);
}

export function isPanCanStudy(studyId:string){
    return /tcga_pan_can_atlas/.test(studyId);
}