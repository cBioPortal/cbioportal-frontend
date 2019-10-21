import SampleManager from "./SampleManager";
import { PatientViewPageStore } from "./clinicalInformation/PatientViewPageStore";
import TumorColumnFormatter from "./mutation/column/TumorColumnFormatter";
import { ClinicalDataBySampleId } from "shared/api/api-types-extended";
import _ from "lodash";

export function checkNonProfiledGenesExist( sampleIds:string[],
                                            entrezGeneIds:number[],
                                            sampleToGenePanelId:{[sampleId:string]:string},
                                            genePanelIdToEntrezGeneIds:{[genePanelId:string]:number[]}
):boolean {
    return !! _.find(entrezGeneIds, entrezGeneId => {
        const profiledSamples = TumorColumnFormatter.getProfiledSamplesForGene( entrezGeneId, 
                                                                                sampleIds,
                                                                                sampleToGenePanelId,
                                                                                genePanelIdToEntrezGeneIds);
        return _.values(profiledSamples).includes(false);
    });
}
