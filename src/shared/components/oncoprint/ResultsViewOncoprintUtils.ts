import {CoverageInformation} from "../../../pages/resultsView/ResultsViewPageStoreUtils";
import {ClinicalAttribute, MolecularProfile, Sample} from "../../api/generated/CBioPortalAPI";
import {OncoprintClinicalAttribute} from "./ResultsViewOncoprint";
import {SpecialAttribute} from "../../cache/OncoprintClinicalDataCache";
import _ from "lodash";
import naturalSort from "javascript-natural-sort";
import {AlterationTypeConstants} from "../../../pages/resultsView/ResultsViewPageStore";

export const alterationTypeToProfiledForText:{[alterationType:string]:string} = {
    "MUTATION_EXTENDED": "mutations",
    "COPY_NUMBER_ALTERATION": "copy number alterations",
    "MRNA_EXPRESSION": "mRNA expression",
    "PROTEIN_LEVEL": "protein expression"
};

export function getAnnotatingProgressMessage(usingOncokb:boolean, usingHotspot:boolean) {
    if (usingOncokb && usingHotspot) {
        return "Annotating with OncoKB and Cancer Hotspots";
    } else if (usingOncokb) {
        return "Annotating with OncoKB";
    } else if (usingHotspot) {
        return "Annotating with Cancer Hotspots";
    } else {
        return "Processing data";
    }
}

export function makeProfiledInClinicalAttributes(
    coverageInformation: CoverageInformation["samples"],
    molecularProfileIdToMolecularProfile: {[molecularProfileId:string]:MolecularProfile},
    selectedMolecularProfiles: MolecularProfile[],
    isSingleStudyQuery: boolean
):(ClinicalAttribute & {molecularProfileIds:string[]})[] {
    // determine which Profiled In clinical attributes will exist in this query.
    // A Profiled In <alteration type> attribute only exists if theres a sample in the query
    //  which is not profiled in any selected profiles for that type.

    // If its a single study query (isSingleStudyQuery), and there is only one profile of a particular alteration type
    //  in the study, then an attribute will be generated specifically for that profile. Otherwise, the attribute
    //  will represent an entire alteration type.

    const groupedSelectedMolecularProfiles:{[alterationType:string]:MolecularProfile[]} =
        _.groupBy(selectedMolecularProfiles, "molecularAlterationType");
    const selectedMolecularProfilesMap = _.keyBy(selectedMolecularProfiles, p=>p.molecularProfileId);

    const existsUnprofiledCount:{[alterationType:string]:number} = _.reduce(coverageInformation, (map, sampleCoverage)=>{
        const isUnprofiled:{[alterationType:string]:boolean} = {};

        // if a sample is not profiled in all genes, its certainly unprofiled for this profile
        for (const gpData of sampleCoverage.notProfiledAllGenes) {
            if (gpData.molecularProfileId in selectedMolecularProfilesMap) {
                // mark isUnprofiled for this type because this is a selected profile
                isUnprofiled[
                    molecularProfileIdToMolecularProfile[gpData.molecularProfileId].molecularAlterationType
                ] = true;
            }
        }

        // if a sample is not profiled in some gene, then it is maybe unprofiled
        _.forEach(sampleCoverage.notProfiledByGene, (geneInfo)=>{
            for (const gpData of geneInfo) {
                if (gpData.molecularProfileId in selectedMolecularProfilesMap) {
                    // mark isUnprofiled for this type because this is a selected profile
                    isUnprofiled[
                        molecularProfileIdToMolecularProfile[gpData.molecularProfileId].molecularAlterationType
                    ] = true;
                }
            }
        });

        // if a sample is profiled in some gene, then it is not unprofiled
        _.forEach(sampleCoverage.byGene, geneInfo=>{
            for (const gpData of geneInfo) {
                if (gpData.molecularProfileId in selectedMolecularProfilesMap) {
                    // unmark isUnprofiled
                    isUnprofiled[
                        molecularProfileIdToMolecularProfile[gpData.molecularProfileId].molecularAlterationType
                    ] = false;
                }
            }
        });

        // increment counts
        _.forEach(isUnprofiled, (_isUnprofiled, alterationType)=>{
            if (_isUnprofiled) {
                map[alterationType] = map[alterationType] || 0;
                map[alterationType] += 1;
            }
        });
        return map;
    }, {} as {[alterationType:string]:number});

    // make a clinical attribute for each profile type which not every sample is profiled in
    const existsUnprofiled = Object.keys(existsUnprofiledCount).filter(alterationType=>{
        return existsUnprofiledCount[alterationType] > 0;
    });
    const attributes:(ClinicalAttribute & {molecularProfileIds:string[]})[] = (existsUnprofiled.map(alterationType=>{
        const group = groupedSelectedMolecularProfiles[alterationType];
        if (!group) {
            // No selected profiles of that type, skip it
            return null;
        } else if (group.length === 1 && isSingleStudyQuery) {
            // If only one profile of type, and its a single study query, then it gets its own attribute
            const profile = group[0];
            return {
                clinicalAttributeId: `${SpecialAttribute.ProfiledInPrefix}_${profile.molecularProfileId}`,
                datatype: "STRING",
                description: `Profiled in ${profile.name}: ${profile.description}`,
                displayName: `Profiled in ${profile.name}`,
                molecularProfileIds: [profile.molecularProfileId],
                patientAttribute: false
            } as (ClinicalAttribute & {molecularProfileIds:string[]});
        } else {
            // If more than one, or its multiple study query, make one attribute for the entire alteration type
            return {
                clinicalAttributeId: `${SpecialAttribute.ProfiledInPrefix}_${alterationType}`,
                datatype: "STRING",
                description: "",
                displayName: `Profiled for ${alterationTypeToProfiledForText[alterationType]}`,
                molecularProfileIds: group.map(p=>p.molecularProfileId),
                patientAttribute: false
            } as (ClinicalAttribute & {molecularProfileIds:string[]});
        }
    })).filter(x=>!!x) as (ClinicalAttribute & {molecularProfileIds:string[]})[];// filter out null
    
    attributes.sort((a,b)=>naturalSort(a.displayName, b.displayName));
    return attributes;
}